# Edge Deck stats bridge. Prints one JSON line about every 1.5s:
# GPU load / VRAM / temp, network throughput, disks, and the current media session.
# Uses CIM perf classes (not Get-Counter) so it works on any Windows display language.
$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# ---- Media session (Windows Global System Media Transport Controls) ----
$mediaMgr = $null
try {
  Add-Type -AssemblyName System.Runtime.WindowsRuntime
  $script:asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
  function Await($op, [Type]$t) {
    $task = $script:asTask.MakeGenericMethod($t).Invoke($null, @($op))
    if ($task.Wait(1500)) { return $task.Result } else { return $null }
  }
  [void][Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
  $mediaMgr = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) `
    ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
} catch { $mediaMgr = $null }

function Get-Media {
  if (-not $mediaMgr) { return $null }
  try {
    $s = $mediaMgr.GetCurrentSession()
    if (-not $s) { return $null }
    $p = Await ($s.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
    $info = $s.GetPlaybackInfo()
    $tl = $s.GetTimelineProperties()
    $app = $s.SourceAppUserModelId -replace '\.exe$', '' -replace '^.*!', ''
    return @{
      title    = $p.Title
      artist   = $p.Artist
      album    = $p.AlbumTitle
      app      = $app
      status   = "$($info.PlaybackStatus)"
      position = [math]::Round($tl.Position.TotalSeconds)
      duration = [math]::Round($tl.EndTime.TotalSeconds)
      updated  = $tl.LastUpdatedTime.ToUnixTimeMilliseconds()
    }
  } catch { return $null }
}

# ---- GPU ----
$gpuName = (Get-CimInstance Win32_VideoController | Where-Object { $_.Name -notmatch 'Basic|Remote|Virtual|Parsec' } |
  Sort-Object AdapterRAM -Descending | Select-Object -First 1).Name
$nvsmi = (Get-Command nvidia-smi.exe -ErrorAction SilentlyContinue).Source
if (-not $nvsmi -and (Test-Path "$env:SystemRoot\System32\nvidia-smi.exe")) { $nvsmi = "$env:SystemRoot\System32\nvidia-smi.exe" }

function Get-Gpu {
  if ($nvsmi) {
    $r = & $nvsmi --query-gpu=name,utilization.gpu,temperature.gpu,memory.used,memory.total,power.draw --format=csv,noheader,nounits 2>$null | Select-Object -First 1
    if ($r) {
      $f = $r.Split(',') | ForEach-Object { $_.Trim() }
      return @{ name = $f[0]; load = [double]$f[1]; temp = [double]$f[2]
        vramUsed = [double]$f[3] * 1MB; vramTotal = [double]$f[4] * 1MB
        power = if ($f[5] -match '^[\d.]+$') { [double]$f[5] } else { $null } }
    }
  }
  $eng = Get-CimInstance Win32_PerfFormattedData_GPUPerformanceCounters_GPUEngine |
    Where-Object { $_.Name -match 'engtype_3D' }
  $load = ($eng | Measure-Object -Property UtilizationPercentage -Sum).Sum
  $mem = (Get-CimInstance Win32_PerfFormattedData_GPUPerformanceCounters_GPUAdapterMemory |
    Measure-Object -Property DedicatedUsage -Sum).Sum
  return @{ name = $gpuName; load = [math]::Min(100, [double]$load); temp = $null; vramUsed = [double]$mem; vramTotal = $null; power = $null }
}

# ---- Disks (refreshed every ~30s) ----
$disks = @(); $diskTick = 0
function Get-Disks {
  Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | ForEach-Object {
    @{ name = $_.DeviceID; label = $_.VolumeName; size = [double]$_.Size; free = [double]$_.FreeSpace }
  }
}

while ($true) {
  $net = Get-CimInstance Win32_PerfFormattedData_Tcpip_NetworkInterface |
    Where-Object { $_.Name -notmatch 'isatap|Loopback|Teredo|vEthernet|Virtual' }
  $down = ($net | Measure-Object -Property BytesReceivedPersec -Sum).Sum
  $up = ($net | Measure-Object -Property BytesSentPersec -Sum).Sum

  if ($diskTick -le 0) { $disks = @(Get-Disks); $diskTick = 20 }
  $diskTick--

  $out = @{
    gpu   = Get-Gpu
    net   = @{ down = [double]$down; up = [double]$up }
    disks = $disks
    media = Get-Media
  }
  [Console]::Out.WriteLine(($out | ConvertTo-Json -Compress -Depth 4))
  [Console]::Out.Flush()
  Start-Sleep -Milliseconds 1200
}
