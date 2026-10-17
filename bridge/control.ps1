# Edge Deck control process. Reads JSON commands (one per line) from stdin.
# Only receives commands from server.js, which whitelists launch targets from config.json.
$ErrorActionPreference = 'SilentlyContinue'

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class EdgeKeys {
  [DllImport("user32.dll")] static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
  public static void Tap(byte vk) {
    keybd_event(vk, 0, 1, UIntPtr.Zero);       // KEYEVENTF_EXTENDEDKEY
    keybd_event(vk, 0, 1 | 2, UIntPtr.Zero);   // + KEYEVENTF_KEYUP
  }
}
"@

$keys = @{
  playpause = 0xB3; next = 0xB0; prev = 0xB1
  volup = 0xAF; voldown = 0xAE; mute = 0xAD
}

while ($null -ne ($line = [Console]::In.ReadLine())) {
  try {
    $cmd = $line | ConvertFrom-Json
    switch ($cmd.type) {
      'media' {
        $vk = $keys[$cmd.cmd]
        if ($vk) {
          $n = if ($cmd.cmd -in 'volup','voldown') { 2 } else { 1 }
          1..$n | ForEach-Object { [EdgeKeys]::Tap([byte]$vk) }
        }
      }
      'launch' {
        if ($cmd.args) { Start-Process -FilePath $cmd.target -ArgumentList $cmd.args }
        else { Start-Process -FilePath $cmd.target }
      }
    }
  } catch { }
}
