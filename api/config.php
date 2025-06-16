<?php
// config.php - конфигурация проекта
return [
    'database' => [
        'host' => 'localhost',
        'dbname' => 'shop', 
        'username' => 'root',
        'password' => '', // установите пароль MySQL если есть
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
