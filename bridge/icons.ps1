# Extracts large app icons (with transparency) for the launcher picker.
# Arg: path to a JSON list of { path, out } items. Writes one PNG per item.
param([string]$List)
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class EdgeIcons {
  [StructLayout(LayoutKind.Sequential)] struct SIZE { public int cx, cy; }
  [ComImport, Guid("bcc18b79-ba16-442f-80c4-8a59c30c463b"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IShellItemImageFactory { [PreserveSig] int GetImage(SIZE size, int flags, out IntPtr phbm); }
  [DllImport("shell32.dll", CharSet = CharSet.Unicode, PreserveSig = false)]
  static extern void SHCreateItemFromParsingName(string path, IntPtr pbc, [MarshalAs(UnmanagedType.LPStruct)] Guid riid,
    [MarshalAs(UnmanagedType.Interface)] out IShellItemImageFactory ppv);
  [DllImport("gdi32.dll")] static extern bool DeleteObject(IntPtr h);

  public static bool Save(string path, string outFile, int px) {
    IShellItemImageFactory f;
    SHCreateItemFromParsingName(path, IntPtr.Zero, typeof(IShellItemImageFactory).GUID, out f);
    IntPtr h;
    // SIIGBF_BIGGERSIZEOK | SIIGBF_ICONONLY: the app icon, never a file thumbnail
    if (f.GetImage(new SIZE { cx = px, cy = px }, 0x1 | 0x4, out h) != 0) return false;
    try {
      using (var src = Image.FromHbitmap(h)) {
        var rect = new Rectangle(0, 0, src.Width, src.Height);
        var bd = src.LockBits(rect, ImageLockMode.ReadOnly, src.PixelFormat);
        try {
          // FromHbitmap drops alpha; re-wrap the same pixels as ARGB to keep transparency.
          using (var argb = new Bitmap(bd.Width, bd.Height, bd.Stride, PixelFormat.Format32bppArgb, bd.Scan0))
          using (var copy = new Bitmap(argb)) copy.Save(outFile, ImageFormat.Png);
        } finally { src.UnlockBits(bd); }
      }
      return true;
    } finally { DeleteObject(h); }
  }
}
"@

foreach ($item in (Get-Content $List -Raw | ConvertFrom-Json)) {
  try { [void][EdgeIcons]::Save($item.path, $item.out, 128) } catch { }
}
