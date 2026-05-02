@echo off
echo ============================================
echo   BoxCerto — Instalacao de dependencias
echo ============================================
echo.

cd /d "%~dp0"

echo Instalando pacotes npm...
call npm install

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo ERRO: npm install falhou. Verifique se o Node.js esta instalado.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   Instalacao concluida com sucesso!
echo ============================================
echo.
echo Para iniciar o app em modo desenvolvimento:
echo   npm run dev
echo.
pause
