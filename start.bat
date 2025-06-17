@echo off
chcp 65001 >nul
echo ========================================
echo        АгроЗаявки - Запуск сервера
echo ========================================
echo.

:: Проверяем наличие PHP
php --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ОШИБКА: PHP не найден в системе!
    echo Убедитесь, что PHP установлен и добавлен в PATH
    echo.
    pause
    exit /b 1
)

:: Получаем версию PHP
echo Проверка PHP...
php --version | findstr /r "^PHP"

:: Проверяем наличие базы данных MySQL/MariaDB
echo.
echo Проверка базы данных...
php -r "try { new PDO('mysql:host=localhost', 'root', ''); echo 'MySQL/MariaDB доступен'; } catch(Exception $e) { echo 'ВНИМАНИЕ: MySQL/MariaDB недоступен - '. $e->getMessage(); }"
echo.

:: Устанавливаем текущую директорию как корневую
set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

echo.
echo Запуск PHP встроенного сервера...
echo Корневая директория: %PROJECT_DIR%
echo.
echo ========================================
echo   Сервер будет доступен по адресу:
echo   http://localhost:8080
echo ========================================
echo.
echo Для остановки сервера нажмите Ctrl+C
echo или закройте это окно
echo.

:: Запускаем PHP встроенный сервер с роутером
echo Проверяем наличие роутера...
if not exist "router.php" (
    echo ОШИБКА: Файл router.php не найден!
    echo Убедитесь, что файл router.php находится в корневой папке проекта
    echo.
    pause
    exit /b 1
)

echo ✓ Роутер найден
echo.
php -S localhost:8080 router.php

echo.
echo Сервер остановлен.
pause
