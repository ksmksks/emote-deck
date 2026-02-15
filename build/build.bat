@echo off
setlocal

REM Resolve project root from this script location
set ROOT=%~dp0..
set DIST=%ROOT%\dist
set SRC_EXT=%ROOT%\src\extension
set DIST_EXT=%DIST%\extension
set ZIP=%ROOT%\EmoteDeck-extension.zip

echo [EmoteDeck] Build started

REM 1) Remove dist
if exist "%DIST%" rmdir /s /q "%DIST%"

REM 2) Recreate dist/extension
mkdir "%DIST_EXT%"

REM 3) Copy src/extension
xcopy "%SRC_EXT%\*" "%DIST_EXT%\" /E /I /Y >nul

REM 4) Create zip with Windows built-in Compress-Archive
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Test-Path '%ZIP%') { Remove-Item '%ZIP%' -Force }; Compress-Archive -Path '%DIST_EXT%\*' -DestinationPath '%ZIP%' -Force"
if errorlevel 1 (
  echo [EmoteDeck] Build failed
  exit /b 1
)

echo [EmoteDeck] Build completed: %ZIP%
exit /b 0
