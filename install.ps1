$ErrorActionPreference = "Stop"

$base = "$env:USERPROFILE\Overhear"
New-Item -ItemType Directory -Path $base -Force | Out-Null
New-Item -ItemType Directory -Path "$base\Server" -Force | Out-Null

Write-Host "Downloading Overhear..." -ForegroundColor Cyan
Invoke-WebRequest "https://raw.githubusercontent.com/ItzMeShadow999/Overhear/main/Overhear.user.js" -OutFile "$base\Overhear.user.js"
Invoke-WebRequest "https://raw.githubusercontent.com/ItzMeShadow999/Overhear/main/README.md" -OutFile "$base\README.md"
Invoke-WebRequest "https://raw.githubusercontent.com/ItzMeShadow999/Overhear/main/Server/overhear_server.py" -OutFile "$base\Server\overhear_server.py"
Invoke-WebRequest "https://raw.githubusercontent.com/ItzMeShadow999/Overhear/main/Server/requirements.txt" -OutFile "$base\Server\requirements.txt"

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python was not found on PATH. Install Python 3.9+ from python.org, then run this command again." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Host "ffmpeg was not found on PATH. The server needs it to work. Install it from ffmpeg.org and add it to PATH." -ForegroundColor Yellow
}

Write-Host "Installing server dependencies..." -ForegroundColor Cyan
python -m pip install -r "$base\Server\requirements.txt"

Write-Host ""
Write-Host "Setup complete." -ForegroundColor Green
Write-Host "Files were saved to: $base"
Write-Host ""
Write-Host "Install the userscript now:" -ForegroundColor Yellow
Write-Host "  1. Open your userscript manager (Tampermonkey, Violentmonkey, etc.)"
Write-Host "  2. Create a new script and paste in the contents of:"
Write-Host "     $base\Overhear.user.js"
Write-Host "  3. Save it."
Write-Host ""
Write-Host "Starting the Overhear server now." -ForegroundColor Cyan
Write-Host "Keep this window open while you use Overhear. Closing it stops the server." -ForegroundColor Cyan
Write-Host ""

Set-Location "$base\Server"
python overhear_server.py
