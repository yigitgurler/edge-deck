# Creates the HTTPS certificate iCUE needs (its Web URL widget only opens https:// pages).
# The certificate:
#  - is only valid for this PC's own addresses (localhost, 127.0.0.1, ::1)
#  - is not a certificate authority (CA:false), so it can't be used to vouch for any other website
#  - is trusted only for the current Windows user (Windows shows a confirmation dialog)
# Output: <app>\cache\https.pfx + https.pass, which server.js uses to also serve https://localhost:<port+1>
param([string]$App, [switch]$Remove)
$ErrorActionPreference = 'Stop'
$dir = Join-Path $App 'cache'
$thumbFile = Join-Path $dir 'https.thumb'

if ($Remove) {
  if (Test-Path $thumbFile) {
    $t = (Get-Content $thumbFile -Raw).Trim()
    Get-ChildItem Cert:\CurrentUser\Root | Where-Object Thumbprint -eq $t | Remove-Item -ErrorAction SilentlyContinue
  }
  return
}

$pfx = Join-Path $dir 'https.pfx'
if ((Test-Path $pfx) -and (Test-Path $thumbFile)) {
  $t = (Get-Content $thumbFile -Raw).Trim()
  if (Get-ChildItem Cert:\CurrentUser\Root | Where-Object Thumbprint -eq $t) { Write-Host '        Sertifika zaten var.'; return }
}

New-Item -ItemType Directory -Force $dir | Out-Null
$cert = New-SelfSignedCertificate -Subject 'CN=Edge Deck (localhost)' -FriendlyName 'Edge Deck (localhost only)' `
  -TextExtension @('2.5.29.17={text}DNS=localhost&IPAddress=127.0.0.1&IPAddress=::1', '2.5.29.19={text}false', '2.5.29.37={text}1.3.6.1.5.5.7.3.1') `
  -KeyAlgorithm RSA -KeyLength 2048 -KeyExportPolicy Exportable -NotAfter (Get-Date).AddYears(5) `
  -CertStoreLocation Cert:\CurrentUser\My
$pass = [guid]::NewGuid().ToString('N')
Export-PfxCertificate -Cert $cert -FilePath $pfx -Password (ConvertTo-SecureString $pass -AsPlainText -Force) | Out-Null
Set-Content (Join-Path $dir 'https.pass') $pass -NoNewline
$cer = Join-Path $dir 'https.cer'
Export-Certificate -Cert $cert -FilePath $cer | Out-Null
Remove-Item "Cert:\CurrentUser\My\$($cert.Thumbprint)"   # the server reads the .pfx; no need to keep it in the store
Set-Content $thumbFile $cert.Thumbprint -NoNewline

Write-Host '        Windows bir güvenlik uyarısı gösterecek: "Evet" deyin (sadece bu bilgisayar için).' -ForegroundColor Yellow
Import-Certificate -FilePath $cer -CertStoreLocation Cert:\CurrentUser\Root | Out-Null
