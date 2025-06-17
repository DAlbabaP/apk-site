@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
echo ========================================
echo     АгроЗаявки - Остановка серверов
echo ========================================
echo.

echo Поиск и остановка PHP серверов на порту 8080...

:: Находим процессы PHP на порту 8080
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    echo Найден процесс с PID: %%a
    taskkill /PID %%a /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo Процесс %%a успешно остановлен
    ) else (
        echo Не удалось остановить процесс %%a
    )
)

:: Проверяем все PHP процессы
echo.
echo Остановка всех PHP процессов сервера...
taskkill /IM php.exe /F >nul 2>&1
if %errorlevel% equ 0 (
    echo PHP процессы остановлены
) else (
    echo PHP процессы не найдены или уже остановлены
)

echo.
echo Проверка портов...
netstat -an | findstr :8080
if %errorlevel% neq 0 (
    echo Порт 8080 свободен
) else (
    echo ВНИМАНИЕ: Порт 8080 все еще занят
)

echo.
echo ========================================
echo   Все серверы остановлены
echo ========================================
echo.
pause
