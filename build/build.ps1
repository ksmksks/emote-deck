$ErrorActionPreference = "Stop"

# Resolve project root from this script location
$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root "dist"
$srcExtension = Join-Path $root "src\extension"
$distExtension = Join-Path $dist "extension"
$zipPath = Join-Path $root "EmoteDeck-extension.zip"

Write-Host "[EmoteDeck] Build started"

# 1) Remove dist
if (Test-Path $dist) {
  Remove-Item $dist -Recurse -Force
}

# 2) Recreate dist/extension
New-Item -ItemType Directory -Path $distExtension -Force | Out-Null

# 3) Copy src/extension
Copy-Item -Path (Join-Path $srcExtension "*") -Destination $distExtension -Recurse -Force

# Exclude local demo assets from submission package
$demoAssets = Join-Path $distExtension "demo-stamps"
if (Test-Path $demoAssets) {
  Remove-Item $demoAssets -Recurse -Force
}

# 4) Create zip
if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}

Compress-Archive -Path (Join-Path $distExtension "*") -DestinationPath $zipPath -Force

Write-Host "[EmoteDeck] Build completed: $zipPath"
