# Removes Edge Deck: stops it, deletes shortcuts and the %LOCALAPPDATA%\EdgeDeck folder.
Add-Type -AssemblyName System.Windows.Forms
$ok = [System.Windows.Forms.MessageBox]::Show('Edge Deck bilgisayardan kaldırılsın mı?', 'Edge Deck', 'YesNo', 'Question')
if ($ok -ne 'Yes') { return }

$base = Join-Path $env:LOCALAPPDATA 'EdgeDeck'
$stop = Join-Path $base 'app\stop.ps1'
if (Test-Path $stop) { & $stop; Start-Sleep -Seconds 1 }

Remove-Item (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Edge Deck.lnk') -ErrorAction SilentlyContinue
Remove-Item (Join-Path ([Environment]::GetFolderPath('Startup')) 'Edge Deck.lnk') -ErrorAction SilentlyContinue
Remove-Item (Join-Path ([Environment]::GetFolderPath('Programs')) 'Edge Deck') -Recurse -Force -ErrorAction SilentlyContinue

# This script lives inside the folder being deleted, so remove it from a separate process.
Start-Process cmd.exe -ArgumentList "/c timeout /t 2 /nobreak >nul & rmdir /s /q `"$base`"" -WindowStyle Hidden
[void][System.Windows.Forms.MessageBox]::Show('Edge Deck kaldırıldı.', 'Edge Deck', 'OK', 'Information')
