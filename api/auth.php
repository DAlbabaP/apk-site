<?php
// auth.php - система аутентификации
require_once 'db.php';

// Проверка авторизации через Bearer Token
function check_auth() {
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    $token = str_replace('Bearer ', '', $headers['Authorization']);
    
    // Для демо: простые токены. В реальном проекте — JWT
    $validTokens = ['demo_token', 'demo_token_admin', 'demo_token_manager', 'demo_token_user'];
    if (!in_array($token, $validTokens)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
}

// API для авторизации пользователей
if ($_SERVER['REQUEST_METHOD'] === 'POST' && (strpos($_SERVER['REQUEST_URI'], '/auth/login') !== false || strpos($_SERVER['REQUEST_URI'], '/api/auth') !== false)) {
    header('Content-Type: application/json');
    
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
}

// API для регистрации пользователей
if ($_SERVER['REQUEST_METHOD'] === 'POST' && (strpos($_SERVER['REQUEST_URI'], '/auth/register') !== false || strpos($_SERVER['REQUEST_URI'], '/api/auth') !== false)) {
    header('Content-Type: application/json');
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $required = ['username', 'email', 'password', 'first_name', 'last_name'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Field '$field' is required"]);
            exit;
        }
    }
    
    try {
        global $pdo;
        
        // Проверка существующего пользователя
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$data['username'], $data['email']]);
        if ($stmt->fetchColumn() > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'User already exists']);
            exit;
        }
        
        // Создание пользователя
        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['username'],
            $data['email'], 
            $passwordHash,
            $data['first_name'],
            $data['last_name'],
            $data['role'] ?? 'user'
        ]);
        
        $userId = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'message' => 'User registered successfully',
            'user_id' => $userId
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}
?>
