@echo off
title MecanicaCerto
color 0A

echo.
echo  ============================================
echo       MecanicaCerto - Instalando...
echo  ============================================
echo.
echo  Node.js encontrado. Instalando dependencias...
echo  (pode demorar 1 a 2 minutos)
echo.

call npm install

echo.
echo  ============================================
echo   Iniciando servidor...
echo   Acesse: http://localhost:5173
echo   Para fechar: pressione CTRL + C
echo  ============================================
echo.

start "" "http://localhost:5173"

call npm run dev

pause
