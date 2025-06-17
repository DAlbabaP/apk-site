<?php
// config.php - конфигурация проекта

// Определяем константы для совместимости со старым кодом
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'agro_requests');
define('DB_USER', 'root');
define('DB_PASS', '123123');

return [
    'database' => [
        'host' => DB_HOST,
        'dbname' => DB_NAME, 
        'username' => DB_USER,
        'password' => DB_PASS, // установите пароль MySQL если есть
        'charset' => 'utf8mb4'
    ],
    'auth' => [
        'demo_token' => 'demo_token',
        'session_lifetime' => 3600 // 1 час
    ],
    'app' => [
        'name' => 'АгроЗаявки',
        'version' => '1.0.0',
        'debug' => true
    ]
];
?>
