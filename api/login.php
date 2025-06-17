<?php
// login.php - обработка авторизации
header('Content-Type: application/json');

// Подавляем вывод ошибок PHP в HTML
error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    require_once 'db.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database configuration error: ' . $e->getMessage()]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = $_POST;
if (empty($data)) {
    $data = json_decode(file_get_contents('php://input'), true);
}

if (empty($data['login']) || empty($data['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Login and password required']);
    exit;
}

try {
    global $pdo;    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$data['login'], $data['login']]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($data['password'], $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        exit;
    }

    // Генерируем простой токен (для демо - можно использовать более сложную логику)
    $token = base64_encode($user['id'] . ':' . time() . ':' . md5($user['username']));

    echo json_encode([
        'success' => true,
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role']
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка базы данных']);
}
?>
