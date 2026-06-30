param(
  [switch]$Unsigned
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$targetExe = Join-Path $root "target\release\forge_installer.exe"
$artifactExe = Join-Path $root "artifacts\windows\ForgeEngine.exe"
$embedScript = Join-Path $root "scripts\embed-skyboxes-into-exe.ps1"
$signScript = Join-Path $root "scripts\sign-windows.ps1"
$previousUnsigned = $env:FORGE_ALLOW_UNSIGNED

Push-Location $root
try {
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $artifactExe) | Out-Null

  # Build the editor with the Tauri production config so the WebView loads ../dist
  # from the executable instead of the dev server at 127.0.0.1:1420.
  $env:FORGE_ALLOW_UNSIGNED = "1"
  npx tauri build --config src-tauri/tauri.editor.conf.json --no-bundle
  if ($LASTEXITCODE -ne 0) {
    throw "Tauri editor build failed with exit code $LASTEXITCODE."
  }

  if (!(Test-Path -LiteralPath $targetExe)) {
    throw "Expected Tauri binary was not produced: $targetExe"
  }

  Copy-Item -LiteralPath $targetExe -Destination $artifactExe -Force
  & $embedScript -ExePath $artifactExe

  if ($Unsigned) {
    Write-Warning "Built unsigned ForgeEngine.exe. SmartScreen will still warn until a Wersee Developers certificate is used."
  } else {
    if ([string]::IsNullOrEmpty($previousUnsigned)) {
      Remove-Item Env:\FORGE_ALLOW_UNSIGNED -ErrorAction SilentlyContinue
    } else {
      $env:FORGE_ALLOW_UNSIGNED = $previousUnsigned
    }
    & $signScript -FilePath $artifactExe
  }

  Get-Item -LiteralPath $artifactExe | Select-Object FullName,Length,LastWriteTime | Format-List
} finally {
  if ([string]::IsNullOrEmpty($previousUnsigned)) {
    Remove-Item Env:\FORGE_ALLOW_UNSIGNED -ErrorAction SilentlyContinue
  } else {
    $env:FORGE_ALLOW_UNSIGNED = $previousUnsigned
  }
  Pop-Location
}
