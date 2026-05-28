Add-Type @"
using System;
using System.Runtime.InteropServices;
public class CursorTest {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr CreateCursor(IntPtr hInst, int xHot, int yHot, int nW, int nH, byte[] andM, byte[] xorM);
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetSystemCursor(IntPtr hcur, uint id);
    [DllImport("user32.dll")]
    public static extern bool SystemParametersInfo(uint a, uint b, IntPtr c, uint d);
}
"@

# Create 32x32 transparent cursor (128 bytes per mask, WORD-aligned)
[byte[]]$andMask = ,0xFF * 128
[byte[]]$xorMask = ,0x00 * 128

$cursor = [CursorTest]::CreateCursor([IntPtr]::Zero, 0, 0, 32, 32, $andMask, $xorMask)
Write-Host "CreateCursor result: $cursor"

if ($cursor -ne [IntPtr]::Zero) {
    $result = [CursorTest]::SetSystemCursor($cursor, 32512)
    Write-Host "SetSystemCursor(NORMAL=32512): $result"
} else {
    $err = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
    Write-Host "CreateCursor FAILED! LastError=$err"
}

Write-Host "Cursor should be hidden for 2 seconds..."
Start-Sleep -Seconds 2

# Restore all cursors
[CursorTest]::SystemParametersInfo(0x0057, 0, [IntPtr]::Zero, 0x02) | Out-Null
Write-Host "Cursor restored."
