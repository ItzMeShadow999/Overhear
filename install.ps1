$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Show-Banner {
    $banner = @"
  ░██████                                  ░██                                       
 ░██   ░██                                 ░██                                       
░██     ░██ ░██    ░██  ░███████  ░██░████ ░████████   ░███████   ░██████   ░██░████ 
░██     ░██ ░██    ░██ ░██    ░██ ░███     ░██    ░██ ░██    ░██       ░██  ░███     
░██     ░██  ░██  ░██  ░█████████ ░██      ░██    ░██ ░█████████  ░███████  ░██      
 ░██   ░██    ░██░██   ░██        ░██      ░██    ░██ ░██        ░██   ░██  ░██      
  ░██████      ░███     ░███████  ░██      ░██    ░██  ░███████   ░█████░██ ░██      
"@
    Write-Host $banner -ForegroundColor Cyan
    Write-Host ""
}

function Invoke-WithSpinner {
    param(
        [string]$Message,
        [scriptblock]$Action,
        [object[]]$ArgumentList = @()
    )
    $frames = @('⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏')
    [Console]::CursorVisible = $false
    $job = Start-Job -ScriptBlock $Action -ArgumentList $ArgumentList
    $i = 0
    while ($job.State -eq 'Running') {
        $frame = $frames[$i % $frames.Length]
        Write-Host -NoNewline "`r$frame $Message"
        Start-Sleep -Milliseconds 80
        $i++
    }
    Wait-Job $job | Out-Null
    $success = $job.State -eq 'Completed'
    Remove-Job $job -Force | Out-Null
    $clear = ' ' * ($Message.Length + 4)
    Write-Host -NoNewline "`r$clear`r"
    if ($success) {
        Write-Host "✔ $Message" -ForegroundColor Green
    } else {
        Write-Host "✘ $Message" -ForegroundColor Red
    }
    [Console]::CursorVisible = $true
    return $success
}

function Show-DownloadBar {
    param(
        [string]$Name,
        [int]$Current,
        [int]$Total
    )
    $percent = [int](($Current / $Total) * 100)
    $barWidth = 28
    $filled = [int](($percent / 100) * $barWidth)
    $bar = ('█' * $filled) + ('░' * ($barWidth - $filled))
    $line = "  [$bar] $percent%  $Name"
    Write-Host -NoNewline "`r$line$(' ' * 10)"
}

Show-Banner

$base = "$env:USERPROFILE\Overhear"
New-Item -ItemType Directory -Path $base -Force | Out-Null
New-Item -ItemType Directory -Path "$base\Server" -Force | Out-Null

$files = @(
    @{ Url = "https://raw.githubusercontent.com/ItzMeShadow999/Overhear/main/Overhear.user.js"; Path = "$base\Overhear.user.js" },
    @{ Url = "https://raw.githubusercontent.com/ItzMeShadow999/Overhear/main/README.md"; Path = "$base\README.md" },
    @{ Url = "https://raw.githubusercontent.com/ItzMeShadow999/Overhear/main/Server/overhear_server.py"; Path = "$base\Server\overhear_server.py" },
    @{ Url = "https://raw.githubusercontent.com/ItzMeShadow999/Overhear/main/Server/requirements.txt"; Path = "$base\Server\requirements.txt" },
    @{ Url = "https://raw.githubusercontent.com/ItzMeShadow999/Overhear/main/Server/Stop.bat"; Path = "$base\Server\Stop.bat" }
)

[Console]::CursorVisible = $false
for ($n = 0; $n -lt $files.Count; $n++) {
    $f = $files[$n]
    $name = Split-Path $f.Path -Leaf
    Show-DownloadBar -Name $name -Current $n -Total $files.Count
    Invoke-WebRequest $f.Url -OutFile $f.Path
    Show-DownloadBar -Name $name -Current ($n + 1) -Total $files.Count
}
Write-Host ""
[Console]::CursorVisible = $true
Write-Host "✔ Downloaded project files" -ForegroundColor Green

$pythonOk = Invoke-WithSpinner -Message "Checking for Python" -Action {
    if (-not (Get-Command python -ErrorAction SilentlyContinue)) { exit 1 }
}
if (-not $pythonOk) {
    Write-Host "Python was not found on PATH. Install Python 3.9+ from python.org, then run this command again." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

$ffmpegOk = Invoke-WithSpinner -Message "Checking for ffmpeg" -Action {
    if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) { exit 1 }
}
if (-not $ffmpegOk) {
    Write-Host "ffmpeg was not found on PATH. The server needs it to work, install it from ffmpeg.org." -ForegroundColor Yellow
}

$reqPath = "$base\Server\requirements.txt"
$pipOk = Invoke-WithSpinner -Message "Installing server dependencies" -ArgumentList @($reqPath) -Action {
    param($reqPath)
    python -m pip install -r $reqPath *> $null
    if ($LASTEXITCODE -ne 0) { exit 1 }
}
if (-not $pipOk) {
    Write-Host "Dependency install failed. Run 'python -m pip install -r $reqPath' manually to see the error." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Setup complete." -ForegroundColor Green
Write-Host "Files saved to: $base"
Write-Host ""
Write-Host "Install the userscript now:" -ForegroundColor Yellow
Write-Host "  1. Open your userscript manager (Tampermonkey, Violentmonkey, etc.)"
Write-Host "  2. Create a new script and paste in the contents of:"
Write-Host "     $base\Overhear.user.js"
Write-Host "  3. Save it."
Write-Host ""
Write-Host "Starting the Overhear server now." -ForegroundColor Cyan
Write-Host "Keep this window open while you use Overhear. Closing it stops the server." -ForegroundColor Cyan
Write-Host "You will be asked to enable it for this time only or forever." -ForegroundColor Cyan
Write-Host "To stop it, run: $base\Server\Stop.bat" -ForegroundColor Cyan
Write-Host ""

Set-Location "$base\Server"
python overhear_server.py
