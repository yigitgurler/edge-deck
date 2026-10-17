# Renders README screenshots at the Edge's native 2560x720 using headless Microsoft Edge.
# Uses ?demo so no real PC data (host name, open tabs) ends up in the images.
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$out = Join-Path $root 'screenshots'
$browser = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
$server = Start-Process node -ArgumentList "`"$root\server.js`"" -WorkingDirectory $root -WindowStyle Hidden -PassThru
Start-Sleep 3

$shots = [ordered]@{
  'home'            = 'page=home'
  'home-tr'         = 'page=home&lang=tr'
  'system'          = 'page=system'
  'media'           = 'page=media'
  'focus'           = 'page=focus'
  'world'           = 'page=world'
  'settings'        = 'page=settings'
  'settings-tr'     = 'page=settings&lang=tr'
  'theme-aurora'    = 'page=home&theme=aurora'
  'theme-synthwave' = 'page=home&theme=synthwave'
  'theme-ember'     = 'page=home&theme=ember&widgets=clock,weather,calendar,world,focus'
  'theme-terminal'  = 'page=system&theme=terminal'
  'theme-paper'     = 'page=home&theme=paper'
  'layout-alt'      = 'page=home&widgets=clock,calendar,weather,world,media'
  'widgets-new'     = 'page=home&widgets=clock,countdown,web,note,media'
  'edit-mode'       = 'page=home&edit'
  'add-widget'      = 'page=home&edit&sheet=widgets'
}
try {
  foreach ($k in $shots.Keys) {
    & $browser --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=12000 --window-size=2560,720 `
      "--user-data-dir=$env:TEMP\edgedeck-shots" "--screenshot=$out\$k.png" "http://localhost:5280/?demo&$($shots[$k])" 2>$null | Out-Null
    Start-Sleep -Milliseconds 1500
    Write-Host "  $k.png"
  }
} finally { Stop-Process $server.Id -Force }
