<?php
// auth.php - система аутентификации
require_once 'db.php';

// Проверка авторизации через Bearer Token
function checkAuth() {
    global $pdo;
    
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        return ['success' => false, 'error' => 'Authorization header missing'];
    }
    
    $token = str_replace('Bearer ', '', $headers['Authorization']);
    
    // Проверяем демо-токены
    $tokenToRole = [
        'demo_token_admin' => 'admin',
        'demo_token_manager' => 'manager', 
        'demo_token_user' => 'user',
        'demo_token' => 'user'
    ];
    
    if (isset($tokenToRole[$token])) {
        $role = $tokenToRole[$token];
        return [
            'success' => true,
            'user' => [
                'id' => 1, // Для демо
                'username' => $role === 'admin' ? 'admin' : ($role === 'manager' ? 'manager' : 'user'),
                'role' => $role
            ]
        ];
    }
    
    // Проверяем реальные токены (base64)
    try {
        $decoded = base64_decode($token);
        if ($decoded === false) {
            return ['success' => false, 'error' => 'Invalid token format'];
        }
        
        $parts = explode(':', $decoded);
        if (count($parts) !== 3) {
            return ['success' => false, 'error' => 'Invalid token structure'];
        }
        
        $user_id = $parts[0];
        $timestamp = $parts[1];
        $hash = $parts[2];
        
        // Проверяем, не истек ли токен (24 часа)
        if (time() - $timestamp > 86400) {
            return ['success' => false, 'error' => 'Token expired'];
        }
        
        // Получаем пользователя из базы
        $stmt = $pdo->prepare("SELECT id, username, role FROM users WHERE id = ? AND is_active = 1");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch();
        
        if (!$user) {
            return ['success' => false, 'error' => 'User not found'];
        }
        
        // Проверяем хеш
        $expected_hash = md5($user['username']);
        if ($hash !== $expected_hash) {
            return ['success' => false, 'error' => 'Invalid token hash'];
        }
        
        return [
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'role' => $user['role']
            ]
        ];
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => 'Token validation error'];
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
