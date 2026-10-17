// Native helpers shared by the PowerShell bridges (Add-Type -Path native.cs).
//  EdgeAudio : read / set the default speaker volume and mute
//  EdgeInput : keyboard shortcuts, typing text, mouse move / click / scroll (virtual keyboard, touchpad, deck keys)
//  EdgeFps   : current game FPS from RivaTuner Statistics Server shared memory (comes with MSI Afterburner)
using System;
using System.IO.MemoryMappedFiles;
using System.Runtime.InteropServices;
using System.Text;

[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
  int f(); int g(); int h(); int i();
  int SetMasterVolumeLevelScalar(float fLevel, Guid pguidEventContext);
  int j();
  int GetMasterVolumeLevelScalar(out float pfLevel);
  int k(); int l(); int m(); int n();
  int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, Guid pguidEventContext);
  int GetMute(out bool pbMute);
}
[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice { int Activate(ref Guid id, int clsCtx, int activationParams, out IAudioEndpointVolume aev); }
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator { int f(); int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice endpoint); }
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumeratorComObject { }

public static class EdgeAudio {
  static IAudioEndpointVolume Endpoint() {
    var e = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
    IMMDevice dev; Marshal.ThrowExceptionForHR(e.GetDefaultAudioEndpoint(0, 1, out dev));
    IAudioEndpointVolume v; var id = typeof(IAudioEndpointVolume).GUID;
    Marshal.ThrowExceptionForHR(dev.Activate(ref id, 23, 0, out v));
    return v;
  }
  public static float Get() { float l; Marshal.ThrowExceptionForHR(Endpoint().GetMasterVolumeLevelScalar(out l)); return l; }
  public static void Set(float l) { Marshal.ThrowExceptionForHR(Endpoint().SetMasterVolumeLevelScalar(Math.Max(0f, Math.Min(1f, l)), Guid.Empty)); }
  public static bool Muted() { bool m; Marshal.ThrowExceptionForHR(Endpoint().GetMute(out m)); return m; }
  public static void Mute(bool m) { Marshal.ThrowExceptionForHR(Endpoint().SetMute(m, Guid.Empty)); }
}

public static class EdgeInput {
  [StructLayout(LayoutKind.Sequential)] struct MOUSEINPUT { public int dx, dy; public uint mouseData, dwFlags, time; public IntPtr extra; }
  [StructLayout(LayoutKind.Sequential)] struct KEYBDINPUT { public ushort wVk, wScan; public uint dwFlags, time; public IntPtr extra; }
  [StructLayout(LayoutKind.Explicit)] struct UNION { [FieldOffset(0)] public MOUSEINPUT mi; [FieldOffset(0)] public KEYBDINPUT ki; }
  [StructLayout(LayoutKind.Sequential)] struct INPUT { public uint type; public UNION u; }
  [DllImport("user32.dll", SetLastError = true)] static extern uint SendInput(uint n, INPUT[] inputs, int size);

  const uint KEYUP = 0x2, UNICODE = 0x4, EXTENDED = 0x1;
  static bool IsExtended(ushort vk) {
    return (vk >= 0x21 && vk <= 0x2E) || vk == 0x5B || vk == 0x5C || vk == 0x6F || (vk >= 0xA6 && vk <= 0xB7);
  }
  static INPUT Key(ushort vk, ushort scan, uint flags) {
    var i = new INPUT { type = 1 };
    i.u.ki = new KEYBDINPUT { wVk = vk, wScan = scan, dwFlags = flags | (vk != 0 && IsExtended(vk) ? EXTENDED : 0) };
    return i;
  }
  static void Send(INPUT[] a) { SendInput((uint)a.Length, a, Marshal.SizeOf(typeof(INPUT))); }

  // Press keys in order, release in reverse: e.g. Ctrl+Shift+Esc
  public static void Combo(ushort[] vks) {
    var a = new INPUT[vks.Length * 2];
    for (int i = 0; i < vks.Length; i++) { a[i] = Key(vks[i], 0, 0); a[a.Length - 1 - i] = Key(vks[i], 0, KEYUP); }
    Send(a);
  }
  public static void Text(string s) {
    foreach (char c in s) {
      if (c == '\n') { Combo(new ushort[] { 0x0D }); continue; }
      Send(new[] { Key(0, c, UNICODE), Key(0, c, UNICODE | KEYUP) });
    }
  }
  static void Mouse(uint flags, int dx, int dy, int data) {
    var i = new INPUT { type = 0 };
    i.u.mi = new MOUSEINPUT { dx = dx, dy = dy, mouseData = (uint)data, dwFlags = flags };
    Send(new[] { i });
  }
  public static void Move(int dx, int dy) { Mouse(0x1, dx, dy, 0); }
  public static void Down(bool right) { Mouse(right ? 0x8u : 0x2u, 0, 0, 0); }
  public static void Up(bool right) { Mouse(right ? 0x10u : 0x4u, 0, 0, 0); }
  public static void Click(bool right) { Down(right); Up(right); }
  public static void Scroll(int dy, int dx) { if (dy != 0) Mouse(0x800, 0, 0, dy); if (dx != 0) Mouse(0x1000, 0, 0, dx); }
}

public static class EdgeFps {
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  // Returns { fps, app } for the game in front, or fps = -2 when RivaTuner isn't running.
  public static string Read() {
    try {
      using (var mmf = MemoryMappedFile.OpenExisting("RTSSSharedMemoryV2", MemoryMappedFileRights.Read))
      using (var v = mmf.CreateViewAccessor(0, 0, MemoryMappedFileAccess.Read)) {
        if (v.ReadUInt32(0) != 0x52545353) return "-2|";
        uint size = v.ReadUInt32(8), off = v.ReadUInt32(12), n = v.ReadUInt32(16);
        uint fg; GetWindowThreadProcessId(GetForegroundWindow(), out fg);
        double best = -1; string bestName = "";
        for (uint i = 0; i < n; i++) {
          long b = off + (long)i * size;
          uint pid = v.ReadUInt32(b);
          if (pid == 0) continue;
          uint t0 = v.ReadUInt32(b + 268), t1 = v.ReadUInt32(b + 272), frames = v.ReadUInt32(b + 276);
          if (t1 <= t0) continue;
          double fps = 1000.0 * frames / (t1 - t0);
          var name = new byte[260]; v.ReadArray(b + 4, name, 0, 260);
          string s = Encoding.Default.GetString(name).Split('\0')[0];
          s = System.IO.Path.GetFileNameWithoutExtension(s);
          if (pid == fg) return Math.Round(fps) + "|" + s;
          if (fps > best) { best = fps; bestName = s; }
        }
        return Math.Round(best) + "|" + bestName;
      }
    } catch { return "-2|"; }
  }
}
