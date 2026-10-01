<div align="center">

<img src="https://iili.io/nc2jxs9.md.png" alt="Overhear icon" width="140">

# Overhear

**Identify the song playing in any browser tab.**

[![Last commit](https://img.shields.io/github/last-commit/ItzMeShadow999/Overhear?style=for-the-badge&color=14b8a6)](https://github.com/ItzMeShadow999/Overhear/commits/main)
[![Issues](https://img.shields.io/github/issues/ItzMeShadow999/Overhear?style=for-the-badge&color=16a34a)](https://github.com/ItzMeShadow999/Overhear/issues)

![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?style=flat-square&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-local%20server-000000?style=flat-square&logo=flask&logoColor=white)
![Userscript](https://img.shields.io/badge/Userscript-Tampermonkey%20%7C%20Violentmonkey%20%7C%20ScriptVault-00485B?style=flat-square&logo=tampermonkey&logoColor=white)
![ffmpeg](https://img.shields.io/badge/ffmpeg-required-007808?style=flat-square&logo=ffmpeg&logoColor=white)
![Platform](https://img.shields.io/badge/Runs-locally-555555?style=flat-square)

</div>

---

Overhear adds a small music button to videos on YouTube, Instagram, X, Reddit and most other sites. Click it and it listens to the video's audio for 12 seconds, matches the song, and gives you a ready-to-run `yt-dlp` command plus quick search links.

It is made up of these files:

- [`Overhear.user.js`](https://github.com/ItzMeShadow999/Overhear/blob/main/Overhear.user.js): a userscript that records audio from the video and shows the result card.
- [`Server/overhear_server.py`](https://github.com/ItzMeShadow999/Overhear/blob/main/Server/overhear_server.py): a small local Flask server that identifies the audio using [shazamio](https://github.com/shazamio/ShazamIO).
- [`Server/requirements.txt`](https://github.com/ItzMeShadow999/Overhear/blob/main/Server/requirements.txt): Python dependencies for the server.

Audio is only sent to the server running on your own machine (`127.0.0.1`).

## Project layout

```
Overhear/
├── Overhear.user.js
├── README.md
└── Server/
    ├── overhear_server.py
    └── requirements.txt
```

## Requirements

- Python 3.9 or newer
- [ffmpeg](https://ffmpeg.org/download.html) on your PATH
- A userscript manager such as Tampermonkey or Violentmonkey
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) (only if you want to use the generated download command)

## Quick install

Open PowerShell and run:

```
irm https://raw.githubusercontent.com/ItzMeShadow999/Overhear/main/install.ps1 | iex
```

This downloads all the project files, installs the Python dependencies, and starts the server. Keep the window open while you use Overhear, closing it stops the server. You still need to load `Overhear.user.js` into your userscript manager, the script tells you where it saved the file.

## Setup

To set it up manually instead:

1. Install the dependencies:

   ```
   pip install -r Server/requirements.txt
   ```

2. Start the server:

   ```
   python Server/overhear_server.py
   ```

   You can check it is running by opening `http://127.0.0.1:5057/health` in a browser. It should return `{"ok": true}`.

3. Install the userscript by opening [`Overhear.user.js`](https://github.com/ItzMeShadow999/Overhear/raw/main/Overhear.user.js) with your userscript manager, or paste its contents into a new script.

4. Allow the script to connect to `127.0.0.1` when your userscript manager asks.

## Usage

1. Open a page with a playing video.
2. Click the music note button near the video.
3. Wait for the 12 second listening countdown and the match.
4. Click **Copy download command** and paste it into a terminal, or open the song on YT Music, Spotify or SoundCloud.

On Instagram the button sits beside the reel. On X it sits just outside the video when there is room. On other sites it floats in the top right corner of the largest visible video.

## Configuration

Edit the constants near the top of `Overhear.user.js`:

| Constant | Default | What it does |
| --- | --- | --- |
| `SERVER` | `http://127.0.0.1:5057/identify` | Address of the local server |
| `RECORD_MS` | `12000` | How long to listen, in milliseconds |
| `MUSIC_DIR` | `~\Music` | Folder the `yt-dlp` command saves to |

To change the server port, edit the last line of `Server/overhear_server.py` and update `SERVER` and the two `@connect` lines if you use a different host.

The generated command looks like this:

```
yt-dlp 'ytsearch:Song Title Artist' -x --audio-format mp3 --embed-metadata --embed-thumbnail -o "~\Music\%(title)s.%(ext)s"
```

It uses PowerShell style quoting, so adjust `buildCommand` if you use another shell.

## Troubleshooting

- **Cannot reach local server**: the server is not running, or something else is using port 5057.
- **No audio track**: unmute the video, make sure it is playing, and try again.
- **This site does not allow capturing audio**: some sites block `captureStream` on protected video. Overhear cannot work there.
- **No match found**: try again at a point where the music is louder than speech or effects.
- **Recognition failed**: check that ffmpeg is installed and on your PATH.

## Notes

Song recognition uses an unofficial Shazam client. It is not affiliated with or endorsed by Shazam or Apple, and it may stop working if the service changes. Only download music you have the right to download.

## License

[MIT](https://github.com/ItzMeShadow999/Overhear/blob/main/LICENSE)
