import asyncio
import os
import tempfile

from flask import Flask, jsonify, request
from shazamio import Shazam

app = Flask(__name__)


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
    app.run(host="127.0.0.1", port=5057)
