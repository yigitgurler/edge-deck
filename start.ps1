# Starts the Edge Deck server (hidden) and opens the dashboard full-screen on the XENEON EDGE.
#   start.ps1            -> server + kiosk window on the Edge
#   start.ps1 -NoKiosk   -> server only (for the iCUE "Web URL" widget)
#   start.ps1 -Quiet     -> no pop-up if the Edge screen isn't found (used at Windows login)
param([switch]$NoKiosk, [switch]$Quiet)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = (Get-Content (Join-Path $root 'config.json') -Raw | ConvertFrom-Json).port
$url = "http://localhost:$port"
Add-Type -AssemblyName System.Windows.Forms

function Show-Msg($text, $icon = 'Information') {
  if (-not $Quiet) { [void][System.Windows.Forms.MessageBox]::Show($text, 'Edge Deck', 'OK', $icon) }
}

# Prefer the Node.js bundled by the installer (..\node\node-*\node.exe), then a system install.
$node = Get-ChildItem (Join-Path (Split-Path $root -Parent) 'node') -Filter node.exe -Recurse -ErrorAction SilentlyContinue |
  Select-Object -First 1 -ExpandProperty FullName
if (-not $node) { $node = (Get-Command node -ErrorAction SilentlyContinue).Source }
if (-not $node) { Show-Msg "Node.js bulunamadı. Lütfen 'Edge Deck Kur.bat' dosyasını tekrar çalıştırın." 'Error'; exit 1 }

function Test-Up { try { (Invoke-WebRequest "http://127.0.0.1:$port/api/config" -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200 } catch { $false } }

if (-not (Test-Up)) {
  Start-Process -FilePath $node -ArgumentList "`"$root\server.js`"" -WorkingDirectory $root -WindowStyle Hidden
  for ($i = 0; $i -lt 40 -and -not (Test-Up); $i++) { Start-Sleep -Milliseconds 300 }
}
if (-not (Test-Up)) { Show-Msg 'Edge Deck sunucusu başlatılamadı. Bilgisayarı yeniden başlatıp tekrar deneyin.' 'Error'; exit 1 }
Write-Host "Edge Deck server running at $url"

if ($NoKiosk) { return }

# Find the XENEON EDGE: a 32:9 strip (2560x720), landscape or portrait.
$edge = [System.Windows.Forms.Screen]::AllScreens | Where-Object {
  $r = [double]$_.Bounds.Width / $_.Bounds.Height
  ($r -gt 3.2 -and $r -lt 3.9) -or ($r -gt 0.25 -and $r -lt 0.31)
} | Select-Object -First 1

if (-not $edge) {
  Show-Msg ("XENEON EDGE ekranı Windows'ta görünmüyor.`n`n" +
    "Seçenek 1 (önerilen): iCUE'yu açın, XENEON EDGE'e girin ve ekranın iCUE tarafından kontrol edilmesini kapatın. " +
    "Sonra masaüstündeki 'Edge Deck' simgesine çift tıklayın.`n`n" +
    "Seçenek 2: iCUE'da Edge'e bir 'Web URL' widget'ı ekleyin ve adres olarak şunu yazın:`n$url")
  return
}
$b = $edge.Bounds

$browser = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { Start-Process $url; return }

# Close a previous kiosk window, then open a fresh one on the Edge screen.
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and $_.CommandLine -match 'EdgeDeck\\browser-profile' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

# A separate browser profile keeps the window position and doesn't touch the normal browser.
$profileDir = Join-Path $env:LOCALAPPDATA 'EdgeDeck\browser-profile'
Start-Process -FilePath $browser -ArgumentList @(
  "--user-data-dir=`"$profileDir`"", "--app=$url",
  "--window-position=$($b.X),$($b.Y)", "--window-size=$($b.Width),$($b.Height)",
  '--start-fullscreen', '--no-first-run', '--no-default-browser-check',
  '--overscroll-history-navigation=0', '--disable-pinch', '--disable-features=Translate,TouchpadOverscrollHistoryNavigation',
  '--autoplay-policy=no-user-gesture-required'
)
Write-Host "Dashboard opened on $($edge.DeviceName) ($($b.Width)x$($b.Height))"
