<?php
// login.php - обработка авторизации
require_once 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['login']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Login and password required']);
    exit;
}

try {
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$data['login'], $data['login']]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($data['password'], $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        exit;
    }
    
    // Генерируем простой токен (в реальном проекте использовать JWT)
    $token = 'demo_token_' . $user['role'];
    
    echo json_encode([
        'success' => true,
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'first_name' => $user['first_name'],
            'last_name' => $user['last_name']
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
?>
