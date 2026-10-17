# Edge Deck window helper.
# Keeps the Edge Deck window non-activating, so touching it never takes focus away from the game or app
# you're using (this is also what lets the virtual keyboard / touchpad type into that app) - except while
# one of Edge Deck's own text fields is being typed in.
# Args: -TypingFile <file holding 1 | 0>  -ServerPid <pid>
#       (Windows PowerShell can't read stdin without blocking, so the server writes state to a file.)
param([string]$TypingFile, [int]$ServerPid)
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -TypeDefinition @"
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public static class EdgeWindow {
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc f, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern int GetWindowLong(IntPtr h, int i);
  [DllImport("user32.dll")] static extern int SetWindowLong(IntPtr h, int i, int v);
  [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
  const int GWL_EXSTYLE = -20, WS_EX_NOACTIVATE = 0x08000000;

  static string ClassOf(IntPtr h) { var s = new StringBuilder(256); GetClassName(h, s, 256); return s.ToString(); }
  public static void SetNoActivate(HashSet<uint> pids, bool on) {
    EnumWindows((h, l) => {
      uint pid; GetWindowThreadProcessId(h, out pid);
      if (pids.Contains(pid) && IsWindowVisible(h)) {
        int ex = GetWindowLong(h, GWL_EXSTYLE);
        int want = on ? (ex | WS_EX_NOACTIVATE) : (ex & ~WS_EX_NOACTIVATE);
        if (want != ex) SetWindowLong(h, GWL_EXSTYLE, want);
      }
      return true;
    }, IntPtr.Zero);
  }
  // Give the Edge Deck window keyboard focus (a tapped Alt key lets a background process do this).
  public static void Focus(HashSet<uint> pids) {
    IntPtr target = IntPtr.Zero;
    EnumWindows((h, l) => {
      uint pid; GetWindowThreadProcessId(h, out pid);
      if (pids.Contains(pid) && IsWindowVisible(h) && ClassOf(h).StartsWith("Chrome_WidgetWin")) { target = h; return false; }
      return true;
    }, IntPtr.Zero);
    if (target == IntPtr.Zero) return;
    keybd_event(0x12, 0, 0, UIntPtr.Zero); keybd_event(0x12, 0, 2, UIntPtr.Zero);
    SetForegroundWindow(target);
  }
}
"@

function Get-KioskPids {
  $ids = New-Object 'System.Collections.Generic.HashSet[uint32]'
  Get-CimInstance Win32_Process -Filter "Name='msedge.exe' OR Name='chrome.exe'" |
    Where-Object { $_.CommandLine -match 'EdgeDeck\\browser-profile' } | ForEach-Object { [void]$ids.Add([uint32]$_.ProcessId) }
  return ,$ids
}

$tick = 0
$kiosk = New-Object 'System.Collections.Generic.HashSet[uint32]'
$typing = $false
while ($true) {
  if ($tick % 5 -eq 0 -and -not (Get-Process -Id $ServerPid -ErrorAction SilentlyContinue)) { break }   # server went away
  if ($tick++ % 15 -eq 0) { $kiosk = Get-KioskPids }   # process scan every ~5s
  $t = "$(Get-Content $TypingFile -Raw -ErrorAction SilentlyContinue)".Trim() -eq '1'
  if ($kiosk.Count) {
    [EdgeWindow]::SetNoActivate($kiosk, -not $t)
    if ($t -and -not $typing) { [EdgeWindow]::Focus($kiosk) }
  }
  $typing = $t
  Start-Sleep -Milliseconds 300
}
