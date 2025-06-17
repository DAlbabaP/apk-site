@echo off
chcp 65001 >nul
echo ========================================
echo    АгроЗаявки - Инициализация проекта
echo ========================================
echo.

echo Текущая директория: %CD%
echo Время запуска: %DATE% %TIME%
echo.

:: Проверяем наличие PHP
echo Проверка PHP...
php --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ОШИБКА: PHP не найден в системе!
    echo Убедитесь, что PHP установлен и добавлен в PATH
    echo.
    echo Нажмите любую клавишу для выхода...
    pause >nul
    exit /b 1
)

:: Показываем версию PHP
echo PHP найден:
php --version | findstr /r "^PHP"
echo.

:: Устанавливаем текущую директорию как корневую
set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

echo Инициализация проекта АгроЗаявки...
echo.

:: Проверяем структуру проекта
echo Проверка структуры проекта...
if not exist "api\" (
    echo ОШИБКА: Папка api не найдена!
    echo Нажмите любую клавишу для выхода...
    pause >nul
    exit /b 1
)

if not exist "database\" (
    echo ОШИБКА: Папка database не найдена!
    echo Нажмите любую клавишу для выхода...
    pause >nul
    exit /b 1
)

echo ✓ Структура проекта в порядке
echo.

:: Проверяем системные файлы
echo Проверка системы...
echo.

if not exist "check_init.php" (
    echo ОШИБКА: Файл check_init.php не найден!
    echo Убедитесь, что все файлы проекта на месте
    echo.
    echo Нажмите любую клавишу для выхода...
    pause >nul
    exit /b 1
)

php check_init.php

echo.
echo ========================================
echo   Инициализация завершена
echo ========================================
echo.
echo Если база данных не найдена, выполните:
echo   create_database.bat
echo.
echo Если есть проблемы с подключением к БД:
echo   diagnose_db.bat
echo.
echo Доступные команды:
echo   start.bat           - Запуск продакшн сервера
echo   start_dev.bat       - Запуск в режиме разработки  
echo   stop_servers.bat    - Остановка всех серверов
echo   create_database.bat - Создание базы данных
echo   diagnose_db.bat     - Диагностика подключения к БД
echo   init.bat           - Повторная инициализация
echo.
echo Для запуска сервера выполните: start.bat
echo.
echo Нажмите любую клавишу для закрытия...
pause >nul
