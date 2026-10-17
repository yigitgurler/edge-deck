# Edge Deck control process. Reads JSON commands (one per line) from stdin.
# Only receives commands from server.js, which validates them first.
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -Path (Join-Path $PSScriptRoot 'native.cs') -ReferencedAssemblies System.Core

$media = @{ playpause = 0xB3; next = 0xB0; prev = 0xB1; volup = 0xAF; voldown = 0xAE; mute = 0xAD }

while ($null -ne ($line = [Console]::In.ReadLine())) {
  try {
    $cmd = $line | ConvertFrom-Json
    switch ($cmd.type) {
      'media' {
        $vk = $media[$cmd.cmd]
        if ($vk) {
          $n = if ($cmd.cmd -in 'volup', 'voldown') { 2 } else { 1 }
          1..$n | ForEach-Object { [EdgeInput]::Combo([uint16[]]@($vk)) }
        }
      }
      'launch' {
        if ($cmd.args) { Start-Process -FilePath $cmd.target -ArgumentList $cmd.args }
        else { Start-Process -FilePath $cmd.target }
      }
      'volume' { [EdgeAudio]::Set([float]$cmd.level); if ([EdgeAudio]::Muted()) { [EdgeAudio]::Mute($false) } }
      'mute'   { [EdgeAudio]::Mute(-not [EdgeAudio]::Muted()) }
      'keys'   { [EdgeInput]::Combo([uint16[]]@($cmd.vks)) }
      'text'   { [EdgeInput]::Text([string]$cmd.text) }
      'mouse' {
        $right = $cmd.button -eq 'right'
        switch ($cmd.op) {
          'move'   { [EdgeInput]::Move([int]$cmd.dx, [int]$cmd.dy) }
          'click'  { [EdgeInput]::Click($right) }
          'dbl'    { [EdgeInput]::Click($false); [EdgeInput]::Click($false) }
          'down'   { [EdgeInput]::Down($right) }
          'up'     { [EdgeInput]::Up($right) }
          'scroll' { [EdgeInput]::Scroll([int]$cmd.dy, [int]$cmd.dx) }
        }
      }
    }
  } catch { }
}
