@echo off
chcp 65001 >nul
title Analizlar - ئانالىزلار
cd /d "%~dp0"

echo ========================================================
echo   Analizlar - خەلقئارا كۈندىلىك ئانالىز سۇپىسى
echo ========================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js تېپىلمىدى!
  echo ئاۋۋال https://nodejs.org دىن Node.js نى قاچىلاڭ، ئاندىن Start.bat نى قايتا بېسىڭ.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo كېرەكلىك بولاقلار تۇنجى قېتىم قاچىلىنىۋاتىدۇ (npm install)...
  echo.
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install مەغلۇپ بولدى. تور ئۇلىنىشىڭىزنى تەكشۈرۈڭ.
    pause
    exit /b 1
  )
)

echo مۇلازىمېتىر قوزغىتىلىۋاتىدۇ: http://localhost:3000
echo توركۆرگۈچ 3 سېكۇنتتىن كېيىن ئاپتوماتىك ئېچىلىدۇ...
echo (توختىتىش ئۈچۈن بۇ كۆزنەكنى تاقاڭ ياكى Ctrl+C نى بېسىڭ)
echo.

start "" /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"
call npm run dev

if errorlevel 1 (
  echo.
  echo [ERROR] پىروگىرامما توختاپ قالدى. يۇقىرىدىكى ئۇچۇرنى تەكشۈرۈڭ.
  pause
)
