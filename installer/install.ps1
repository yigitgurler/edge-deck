# Edge Deck installer. Run via "Edge Deck Kur.bat". No admin rights needed.
#  - copies the app to %LOCALAPPDATA%\EdgeDeck\app (keeps existing settings on update)
#  - downloads a private copy of Node.js LTS if the PC doesn't have one
#  - adds Desktop, Start Menu and Windows-startup shortcuts, then starts the dashboard
param([switch]$Silent, [switch]$ForceNode)  # -Silent: no pop-ups; -ForceNode: always fetch private Node (tests)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Add-Type -AssemblyName System.Windows.Forms

$src = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$base = Join-Path $env:LOCALAPPDATA 'EdgeDeck'
$app = Join-Path $base 'app'

function Step($n, $text) { Write-Host ''; Write-Host "  [$n/5] $text" -ForegroundColor Cyan }
function Fail($text) {
  Write-Host "  HATA: $text" -ForegroundColor Red
  if (-not $Silent) { [void][System.Windows.Forms.MessageBox]::Show("Kurulum tamamlanamadı:`n`n$text", 'Edge Deck', 'OK', 'Error') }
  exit 1
}

if (-not $Silent) { Clear-Host }
Write-Host ''
Write-Host '  ===============================================' -ForegroundColor DarkYellow
Write-Host '     EDGE DECK  -  CORSAIR XENEON EDGE paneli' -ForegroundColor Yellow
Write-Host '  ===============================================' -ForegroundColor DarkYellow

try {
  # 1. Stop an older running copy
  Step 1 'Eski sürüm kontrol ediliyor...'
  $stop = Join-Path $app 'stop.ps1'
  if (Test-Path $stop) { & $stop; Start-Sleep -Milliseconds 800 }

  # 2. Copy files
  Step 2 'Dosyalar kopyalanıyor...'
  New-Item -ItemType Directory -Force $app | Out-Null
  foreach ($item in 'server.js', 'start.ps1', 'stop.ps1', 'stop.bat', 'start.bat', 'README.md', 'public', 'bridge', 'installer') {
    $p = Join-Path $src $item
    if (Test-Path $p) { Copy-Item $p -Destination $app -Recurse -Force }
  }
  # Keep the user's own launcher list on update.
  if (-not (Test-Path (Join-Path $app 'config.json'))) { Copy-Item (Join-Path $src 'config.json') $app }
  Get-ChildItem $app -Recurse -File | Unblock-File

  # 3. Node.js
  Step 3 'Node.js hazırlanıyor...'
  $nodeDir = Join-Path $base 'node'
  $node = Get-ChildItem $nodeDir -Filter node.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $node -and ($ForceNode -or -not (Get-Command node -ErrorAction SilentlyContinue))) {
    Write-Host '        Node.js indiriliyor (yaklaşık 30 MB, bir dakika sürebilir)...'
    $lts = (Invoke-RestMethod 'https://nodejs.org/dist/index.json') | Where-Object { $_.lts } | Select-Object -First 1
    $arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x64' }
    $name = "node-$($lts.version)-win-$arch"
    $zip = Join-Path $env:TEMP "$name.zip"
    Invoke-WebRequest "https://nodejs.org/dist/$($lts.version)/$name.zip" -OutFile $zip -UseBasicParsing
    New-Item -ItemType Directory -Force $nodeDir | Out-Null
    Expand-Archive $zip -DestinationPath $nodeDir -Force
    Remove-Item $zip -Force
    Write-Host "        Node.js $($lts.version) hazır."
  } else { Write-Host '        Node.js zaten var.' }

  # 4. Shortcuts
  Step 4 'Kısayollar oluşturuluyor...'
  $ps = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
  $icon = Join-Path $app 'public\icon.ico'
  $ws = New-Object -ComObject WScript.Shell
  function New-Shortcut($path, $arguments, $desc) {
    $s = $ws.CreateShortcut($path)
    $s.TargetPath = $ps
    $s.Arguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass $arguments"
    $s.WorkingDirectory = $app
    $s.WindowStyle = 7
    $s.Description = $desc
    if (Test-Path $icon) { $s.IconLocation = $icon }
    $s.Save()
  }
  $startArgs = "-File `"$app\start.ps1`""
  New-Shortcut (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Edge Deck.lnk') $startArgs 'Edge Deck panelini aç'
  New-Shortcut (Join-Path ([Environment]::GetFolderPath('Startup')) 'Edge Deck.lnk') "$startArgs -Quiet" 'Edge Deck otomatik başlatma'
  $menu = Join-Path ([Environment]::GetFolderPath('Programs')) 'Edge Deck'
  New-Item -ItemType Directory -Force $menu | Out-Null
  New-Shortcut (Join-Path $menu 'Edge Deck.lnk') $startArgs 'Edge Deck panelini aç'
  New-Shortcut (Join-Path $menu 'Edge Deck Kaldır.lnk') "-File `"$app\installer\uninstall.ps1`"" 'Edge Deck kaldır'

  # 5. Start
  Step 5 'Edge Deck başlatılıyor...'
  if ($Silent) { & (Join-Path $app 'start.ps1') -Quiet } else { & (Join-Path $app 'start.ps1') }
} catch { Fail $_.Exception.Message }

Write-Host ''
Write-Host '  Kurulum tamamlandı!' -ForegroundColor Green
if ($Silent) { return }
[void][System.Windows.Forms.MessageBox]::Show(
  "Edge Deck kuruldu!`n`n" +
  "- Panel XENEON EDGE ekranında açıldı (ekran bulunduysa).`n" +
  "- Bilgisayar her açıldığında kendiliğinden başlar.`n" +
  "- Kapatırsanız masaüstündeki 'Edge Deck' simgesiyle tekrar açabilirsiniz.`n`n" +
  "Dil: Ayarlar (dişli simgesi) > Language > Türkçe",
  'Edge Deck', 'OK', 'Information')
