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
$previousOptLevel = $env:CARGO_PROFILE_RELEASE_OPT_LEVEL
$previousCodegenUnits = $env:CARGO_PROFILE_RELEASE_CODEGEN_UNITS
$previousCargoJobs = $env:CARGO_BUILD_JOBS

Push-Location $root
try {
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $artifactExe) | Out-Null

  # Build the editor with the Tauri production config so the WebView loads ../dist
  # from the executable instead of the dev server at 127.0.0.1:1420.
  $env:FORGE_ALLOW_UNSIGNED = "1"
  # The editor executable embeds worker binaries, so opt-level 3 can exhaust memory
  # on developer machines. Keep the artifact deterministic while reducing LLVM RAM.
  $env:CARGO_PROFILE_RELEASE_OPT_LEVEL = "0"
  $env:CARGO_PROFILE_RELEASE_CODEGEN_UNITS = "256"
  $env:CARGO_BUILD_JOBS = "1"
  npx tauri build --config src-tauri/tauri.editor.conf.json --no-bundle
  if ($LASTEXITCODE -ne 0) {
    throw "Tauri editor build failed with exit code $LASTEXITCODE."
  }

  if (!(Test-Path -LiteralPath $targetExe)) {
    throw "Expected Tauri binary was not produced: $targetExe"
  }

  Copy-Item -LiteralPath $targetExe -Destination $artifactExe -Force
  & $embedScript -ExePath $artifactExe

  $worldAssetsSource = Join-Path $root "engine\WorldAssets"
  $worldAssetsDest = Join-Path $root "artifacts\windows\WorldAssets"
  if (Test-Path -LiteralPath $worldAssetsSource) {
    New-Item -ItemType Directory -Force -Path $worldAssetsDest | Out-Null
    Copy-Item -Path (Join-Path $worldAssetsSource "*") -Destination $worldAssetsDest -Recurse -Force
  }

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
  if ([string]::IsNullOrEmpty($previousOptLevel)) {
    Remove-Item Env:\CARGO_PROFILE_RELEASE_OPT_LEVEL -ErrorAction SilentlyContinue
  } else {
    $env:CARGO_PROFILE_RELEASE_OPT_LEVEL = $previousOptLevel
  }
  if ([string]::IsNullOrEmpty($previousCodegenUnits)) {
    Remove-Item Env:\CARGO_PROFILE_RELEASE_CODEGEN_UNITS -ErrorAction SilentlyContinue
  } else {
    $env:CARGO_PROFILE_RELEASE_CODEGEN_UNITS = $previousCodegenUnits
  }
  if ([string]::IsNullOrEmpty($previousCargoJobs)) {
    Remove-Item Env:\CARGO_BUILD_JOBS -ErrorAction SilentlyContinue
  } else {
    $env:CARGO_BUILD_JOBS = $previousCargoJobs
  }
  Pop-Location
}
