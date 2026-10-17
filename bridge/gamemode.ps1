# Edge Deck game mode.
# Args  : -ModeFile <file holding off | on | auto> -ServerPid <pid>  (auto = only while a full-screen game is in front)
#         Windows PowerShell can't read stdin without blocking, so the server writes the mode to a file.
# stdout: one JSON line on every change - { active, game }
# While active: the mouse can't leave the game's monitor, and the Edge Deck window can be
# touched without taking focus away from the game.
param([string]$ModeFile, [int]$ServerPid)
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -TypeDefinition @"
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public static class EdgeGame {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern bool ClipCursor(ref RECT r);
  [DllImport("user32.dll", EntryPoint = "ClipCursor")] static extern bool ClipCursorNull(IntPtr r);
  [DllImport("user32.dll")] public static extern bool GetClipCursor(out RECT r);
  [DllImport("user32.dll")] static extern IntPtr MonitorFromWindow(IntPtr h, uint flags);
  [StructLayout(LayoutKind.Sequential)] struct MONITORINFO { public int cbSize; public RECT rcMonitor, rcWork; public uint dwFlags; }
  [DllImport("user32.dll")] static extern bool GetMonitorInfo(IntPtr m, ref MONITORINFO mi);
  delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc f, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern int GetWindowLong(IntPtr h, int i);
  [DllImport("user32.dll")] static extern int SetWindowLong(IntPtr h, int i, int v);
  const int GWL_EXSTYLE = -20, WS_EX_NOACTIVATE = 0x08000000;

  public static string ClassOf(IntPtr h) { var s = new StringBuilder(256); GetClassName(h, s, 256); return s.ToString(); }
  public static RECT MonitorOf(IntPtr h) {
    var mi = new MONITORINFO(); mi.cbSize = Marshal.SizeOf(mi);
    GetMonitorInfo(MonitorFromWindow(h, 2), ref mi); return mi.rcMonitor;
  }
  // A window that exactly covers its monitor (exclusive or borderless full screen).
  public static bool IsFullScreen(IntPtr h) {
    RECT w; if (!GetWindowRect(h, out w)) return false;
    var m = MonitorOf(h);
    return w.Left <= m.Left && w.Top <= m.Top && w.Right >= m.Right && w.Bottom >= m.Bottom;
  }
  public static void Clip(RECT r) { ClipCursor(ref r); }
  public static void Unclip() { ClipCursorNull(IntPtr.Zero); }
  public static void SetNoActivate(HashSet<uint> pids, bool on) {
    EnumWindows((h, l) => {
      uint pid; GetWindowThreadProcessId(h, out pid);
      if (pids.Contains(pid) && IsWindowVisible(h)) {
        int ex = GetWindowLong(h, GWL_EXSTYLE);
        SetWindowLong(h, GWL_EXSTYLE, on ? (ex | WS_EX_NOACTIVATE) : (ex & ~WS_EX_NOACTIVATE));
      }
      return true;
    }, IntPtr.Zero);
  }
}
"@

$mode = 'auto'
$active = $false
$lockRect = $null
$gameName = $null
$tick = 0
$kiosk = $null
$ignoreClass = 'Progman|WorkerW|Shell_TrayWnd|Shell_SecondaryTrayWnd|Windows.UI.Core.CoreWindow|XamlExplorerHostIslandWindow'

function Get-KioskPids {
  $ids = New-Object 'System.Collections.Generic.HashSet[uint32]'
  Get-CimInstance Win32_Process -Filter "Name='msedge.exe' OR Name='chrome.exe'" |
    Where-Object { $_.CommandLine -match 'EdgeDeck\\browser-profile' } | ForEach-Object { [void]$ids.Add([uint32]$_.ProcessId) }
  return ,$ids
}
function Report { [Console]::Out.WriteLine((@{ active = $active; game = $gameName; mode = $mode } | ConvertTo-Json -Compress)); [Console]::Out.Flush() }

Report
while ($true) {
  if ($tick % 5 -eq 0 -and -not (Get-Process -Id $ServerPid -ErrorAction SilentlyContinue)) { break }   # server went away
  $m = "$(Get-Content $ModeFile -Raw -ErrorAction SilentlyContinue)".Trim()
  if ($m -in 'off', 'on', 'auto' -and $m -ne $mode) { $mode = $m; Report }

  $fg = [EdgeGame]::GetForegroundWindow()
  $fgPid = 0; [void][EdgeGame]::GetWindowThreadProcessId($fg, [ref]$fgPid)
  if ($tick++ % 12 -eq 0) { $kiosk = Get-KioskPids }   # process scan every ~5s
  $fgIsDeck = $kiosk.Contains([uint32]$fgPid)
  $fgIsShell = ([EdgeGame]::ClassOf($fg)) -match $ignoreClass
  $fullscreen = (-not $fgIsDeck) -and (-not $fgIsShell) -and [EdgeGame]::IsFullScreen($fg)

  $want = ($mode -eq 'on') -or ($mode -eq 'auto' -and $fullscreen)
  if ($want -and -not $fgIsDeck -and -not $fgIsShell) {
    $lockRect = [EdgeGame]::MonitorOf($fg)
    if ($fullscreen) { $gameName = (Get-Process -Id $fgPid).ProcessName }
  } elseif ($want -and -not $lockRect) {
    $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $lockRect = New-Object EdgeGame+RECT -Property @{ Left = $b.Left; Top = $b.Top; Right = $b.Right; Bottom = $b.Bottom }
  }

  if ($want) {
    # Re-apply only when the cursor is free to leave the game's monitor, so a game's own tighter lock wins.
    $c = New-Object EdgeGame+RECT; [void][EdgeGame]::GetClipCursor([ref]$c)
    if ($c.Left -lt $lockRect.Left -or $c.Top -lt $lockRect.Top -or $c.Right -gt $lockRect.Right -or $c.Bottom -gt $lockRect.Bottom) {
      [EdgeGame]::Clip($lockRect)
    }
    if (-not $active) { $active = $true; [EdgeGame]::SetNoActivate($kiosk, $true); Report }
    elseif ($kiosk.Count) { [EdgeGame]::SetNoActivate($kiosk, $true) }   # windows reopened
  } elseif ($active) {
    $active = $false; $gameName = $null; $lockRect = $null
    [EdgeGame]::Unclip(); [EdgeGame]::SetNoActivate($kiosk, $false); Report
  }
  Start-Sleep -Milliseconds 400
}
[EdgeGame]::Unclip()
