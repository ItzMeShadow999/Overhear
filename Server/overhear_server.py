import asyncio
import json
import os
import sys
import tempfile
from pathlib import Path

from flask import Flask, jsonify, request
from shazamio import Shazam

BASE = Path(__file__).resolve().parent
CONFIG = BASE / "overhear_config.json"
STOP_BAT = BASE / "Stop.bat"
STARTUP_FILE = (
    Path(os.environ.get("APPDATA", ""))
    / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup"
    / "OverhearServer.bat"
)
PORT = 5057

STOP_BAT_TEXT = (
    "@for /f \"tokens=5\" %%a in ('netstat -ano ^| findstr \":5057 \" "
    "^| findstr LISTENING') do taskkill /F /PID %%a\n"
)

app = Flask(__name__)


def ask_mode() -> str:
    try:
        import tkinter as tk
    except ImportError:
        print("Overhear server")
        print("  1) Enable for this time only")
        print("  2) Enable it forever (start with Windows)")
        return "forever" if input("Choose 1 or 2: ").strip() == "2" else "once"

    choice = {"mode": "once"}
    root = tk.Tk()
    root.title("Overhear")
    root.resizable(False, False)
    root.attributes("-topmost", True)

    tk.Label(
        root, text="Start the Overhear server?", font=("Segoe UI", 12, "bold")
    ).pack(padx=24, pady=(18, 4))
    tk.Label(
        root, text="Choose how long it should stay enabled.", font=("Segoe UI", 9)
    ).pack(padx=24, pady=(0, 12))

    def pick(mode):
        choice["mode"] = mode
        root.destroy()

    tk.Button(
        root, text="Enable for this time only", width=30,
        command=lambda: pick("once"),
    ).pack(padx=24, pady=4)
    tk.Button(
        root, text="Enable it forever", width=30,
        command=lambda: pick("forever"),
    ).pack(padx=24, pady=(4, 18))

    root.mainloop()
    return choice["mode"]


def save_forever():
    CONFIG.write_text(json.dumps({"mode": "forever"}), encoding="utf-8")

    if os.name == "nt" and STARTUP_FILE.parent.exists():
        exe = Path(sys.executable)
        pythonw = exe.with_name("pythonw.exe")
        runner = pythonw if pythonw.exists() else exe
        STARTUP_FILE.write_text(
            "@echo off\r\n"
            f'start "" /min "{runner}" "{Path(__file__).resolve()}" --no-prompt\r\n',
            encoding="utf-8",
        )


def reset():
    for f in (CONFIG, STARTUP_FILE):
        try:
            f.unlink()
        except OSError:
            pass
    print("Overhear auto-start removed.")


def setup_on_launch():
    if "--reset" in sys.argv:
        reset()
        sys.exit(0)

    if not STOP_BAT.exists():
        STOP_BAT.write_text(STOP_BAT_TEXT, encoding="utf-8")

    if "--no-prompt" in sys.argv:
        return
    if CONFIG.exists():
        try:
            if json.loads(CONFIG.read_text(encoding="utf-8")).get("mode") == "forever":
                return
        except (OSError, ValueError):
            pass

    if ask_mode() == "forever":
        save_forever()


async def recognize(path: str):
    shazam = Shazam()
    fn = getattr(shazam, "recognize", None) or shazam.recognize_song
    return await fn(path)


@app.post("/identify")
def identify():
    audio = request.get_data()
    if not audio:
        return jsonify(error="No audio received"), 400

    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
        f.write(audio)
        path = f.name

    try:
        result = asyncio.run(recognize(path))
    except Exception as exc:
        return jsonify(error=f"Recognition failed: {exc}"), 500
    finally:
        try:
            os.remove(path)
        except OSError:
            pass

    track = (result or {}).get("track")
    if not track:
        return jsonify(found=False)

    return jsonify(
        found=True,
        title=track.get("title", ""),
        artist=track.get("subtitle", ""),
        url=track.get("url", ""),
    )


@app.get("/health")
def health():
    return jsonify(ok=True)


if __name__ == "__main__":
    setup_on_launch()
    app.run(host="127.0.0.1", port=PORT)
