@echo off
chcp 65001 >nul
echo ========================================
echo   АгроЗаявки - Режим разработки
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

:: Устанавливаем текущую директорию как корневую
set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

echo Запуск в режиме разработки...
echo Корневая директория: %PROJECT_DIR%
echo.
echo ========================================
echo   Сервер доступен по адресу:
echo   http://localhost:8080
echo ========================================
echo.
echo РЕЖИМ РАЗРАБОТКИ:
echo - Подробные логи ошибок
echo - Автоматическая перезагрузка
echo - Отображение всех PHP ошибок
echo.
echo Для остановки нажмите Ctrl+C
echo.

:: Запускаем PHP с настройками для разработки
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
php -S localhost:8080 router.php -d display_errors=1 -d error_reporting=E_ALL -d log_errors=1

echo.
echo Сервер остановлен.
pause
