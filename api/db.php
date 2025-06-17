<?php
// db.php — подключение к MySQL
$config = require_once __DIR__ . '/config.php';

$host = $config['database']['host'];
$db   = $config['database']['dbname'];
$user = $config['database']['username'];
$pass = $config['database']['password'];
$charset = $config['database']['charset'];

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];
try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB connection failed']);
    exit;
}
?>
