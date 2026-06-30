param(
  [Parameter(Mandatory = $true)]
  [string]$ExePath,

  [string]$PackPath = "src-tauri\embedded-assets\skyboxes.zip"
)

$ErrorActionPreference = "Stop"

$magic = [System.Text.Encoding]::ASCII.GetBytes("FORGE_SKYBOX_PACK_V1")
$exe = (Resolve-Path -LiteralPath $ExePath).Path
$pack = (Resolve-Path -LiteralPath $PackPath).Path

$bytes = [System.IO.File]::ReadAllBytes($exe)
$footerLength = 8 + $magic.Length
$hasExistingPack = $false

if ($bytes.Length -gt $footerLength) {
  $magicStart = $bytes.Length - $magic.Length
  $existingMagic = $bytes[$magicStart..($bytes.Length - 1)]
  $hasExistingPack = [System.Linq.Enumerable]::SequenceEqual([byte[]]$existingMagic, [byte[]]$magic)
}

if ($hasExistingPack) {
  $lenStart = $bytes.Length - $footerLength
  $lenBytes = New-Object byte[] 8
  [Array]::Copy($bytes, $lenStart, $lenBytes, 0, 8)
  $packLength = [BitConverter]::ToUInt64($lenBytes, 0)
  $baseLength = $bytes.Length - $footerLength - [int64]$packLength
  if ($baseLength -le 0) {
    throw "Existing embedded skybox footer is invalid."
  }
  $trimmed = New-Object byte[] $baseLength
  [Array]::Copy($bytes, 0, $trimmed, 0, $baseLength)
  [System.IO.File]::WriteAllBytes($exe, $trimmed)
}

$packBytes = [System.IO.File]::ReadAllBytes($pack)
$stream = [System.IO.File]::Open($exe, [System.IO.FileMode]::Append, [System.IO.FileAccess]::Write)
try {
  $stream.Write($packBytes, 0, $packBytes.Length)
  $lenBytes = [BitConverter]::GetBytes([UInt64]$packBytes.Length)
  $stream.Write($lenBytes, 0, $lenBytes.Length)
  $stream.Write($magic, 0, $magic.Length)
} finally {
  $stream.Dispose()
}

Write-Host "Embedded skybox pack into $exe ($($packBytes.Length) bytes)."
