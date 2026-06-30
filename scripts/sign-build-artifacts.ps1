param(
  [string]$Root = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Root)) {
  $Root = Split-Path -Parent $PSScriptRoot
}

$rootPath = (Resolve-Path -LiteralPath $Root).Path
$signScript = Join-Path $rootPath "scripts\sign-windows.ps1"

$candidatePaths = @(
  "target\release\ForgeEngine.exe",
  "target\release\forge_installer.exe",
  "src-tauri\target\release\ForgeEngine.exe",
  "src-tauri\target\release\forge_installer.exe",
  "artifacts\windows\ForgeEngine.exe",
  "artifacts\windows\forge_installer.exe",
  "artifacts\windows\Forge Engine Setup_1.0.0_x64-setup.exe",
  "artifacts\windows\Forge Engine_1.0.0_x64-setup.exe"
)

$signedAny = $false
foreach ($relativePath in $candidatePaths) {
  $path = Join-Path $rootPath $relativePath
  if (Test-Path -LiteralPath $path) {
    & $signScript -FilePath $path
    $signedAny = $true
  }
}

if (-not $signedAny) {
  throw "No Forge Engine Windows binaries were found to sign."
}
