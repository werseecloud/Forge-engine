param(
  [Parameter(Mandatory = $true)]
  [string]$FilePath
)

$ErrorActionPreference = "Stop"

function Resolve-SignTool {
  $fromPath = Get-Command "signtool.exe" -ErrorAction SilentlyContinue
  if ($fromPath) {
    return $fromPath.Source
  }

  $kitsRoot = "${env:ProgramFiles(x86)}\Windows Kits\10\bin"
  if (Test-Path -LiteralPath $kitsRoot) {
    $candidate = Get-ChildItem -LiteralPath $kitsRoot -Recurse -Filter "signtool.exe" -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -match "\\x64\\signtool\.exe$" } |
      Sort-Object FullName -Descending |
      Select-Object -First 1
    if ($candidate) {
      return $candidate.FullName
    }
  }

  throw "signtool.exe was not found. Install the Windows SDK or add signtool.exe to PATH."
}

function Assert-Signed {
  param([string]$Path)

  $signature = Get-AuthenticodeSignature -LiteralPath $Path
  if ($signature.Status -ne "Valid") {
    throw "Signing failed for '$Path'. Authenticode status: $($signature.Status) - $($signature.StatusMessage)"
  }

  $subject = $signature.SignerCertificate.Subject
  if ($subject -notlike "*Wersee Developers*") {
    throw "The signing certificate for '$Path' is '$subject'. Use a certificate issued to Wersee Developers."
  }
}

$resolvedPath = (Resolve-Path -LiteralPath $FilePath).Path

if ($env:FORGE_ALLOW_UNSIGNED -eq "1") {
  Write-Warning "FORGE_ALLOW_UNSIGNED=1 is set; skipping Authenticode signing for '$resolvedPath'. This build will still trigger SmartScreen."
  exit 0
}

$timestampUrl = if ($env:FORGE_SIGN_TIMESTAMP_URL) { $env:FORGE_SIGN_TIMESTAMP_URL } else { "http://timestamp.digicert.com" }
$description = if ($env:FORGE_SIGN_DESCRIPTION) { $env:FORGE_SIGN_DESCRIPTION } else { "Forge Engine" }
$descriptionUrl = if ($env:FORGE_SIGN_DESCRIPTION_URL) { $env:FORGE_SIGN_DESCRIPTION_URL } else { "https://github.com/werseecloud/Forge-engine" }
$subjectName = if ($env:FORGE_SIGN_CERT_SUBJECT) { $env:FORGE_SIGN_CERT_SUBJECT } else { "Wersee Developers" }
$signTool = Resolve-SignTool

$args = @(
  "sign",
  "/fd", "SHA256",
  "/td", "SHA256",
  "/tr", $timestampUrl,
  "/d", $description,
  "/du", $descriptionUrl
)

if ($env:FORGE_SIGN_PFX_PATH) {
  $pfxPath = (Resolve-Path -LiteralPath $env:FORGE_SIGN_PFX_PATH).Path
  $args += @("/f", $pfxPath)
  if ($env:FORGE_SIGN_PFX_PASSWORD) {
    $args += @("/p", $env:FORGE_SIGN_PFX_PASSWORD)
  }
} elseif ($env:FORGE_SIGN_CERT_THUMBPRINT) {
  $args += @("/sha1", $env:FORGE_SIGN_CERT_THUMBPRINT)
  if ($env:FORGE_SIGN_CERT_STORE -eq "LocalMachine") {
    $args += "/sm"
  }
} else {
  $matchingCert = Get-ChildItem Cert:\CurrentUser\My, Cert:\LocalMachine\My -ErrorAction SilentlyContinue |
    Where-Object { $_.HasPrivateKey -and $_.Subject -like "*$subjectName*" } |
    Sort-Object NotAfter -Descending |
    Select-Object -First 1

  if (-not $matchingCert) {
    throw "No code-signing certificate was configured. Set FORGE_SIGN_CERT_THUMBPRINT or FORGE_SIGN_PFX_PATH to a valid Authenticode certificate issued to Wersee Developers. Set FORGE_ALLOW_UNSIGNED=1 only for local test builds."
  }

  $args += @("/sha1", $matchingCert.Thumbprint)
  if ($matchingCert.PSPath -like "*LocalMachine*") {
    $args += "/sm"
  }
}

$args += $resolvedPath

Write-Host "Signing $resolvedPath"
& $signTool @args
if ($LASTEXITCODE -ne 0) {
  throw "signtool.exe failed with exit code $LASTEXITCODE."
}

Assert-Signed -Path $resolvedPath
