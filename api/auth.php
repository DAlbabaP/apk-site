<?php
// auth.php — Bearer Token аутентификация через БД
require_once 'db.php';

function check_auth() {
    global $pdo;
    
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    
    $token = str_replace('Bearer ', '', $headers['Authorization']);
    
    // Проверяем токен в базе данных
    $stmt = $pdo->prepare('
        SELECT u.* FROM users u
        JOIN tokens t ON u.id = t.user_id
        WHERE t.token = ? AND t.expires_at > datetime("now")
    ');
    $stmt->execute([$token]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden - Invalid or expired token']);
        exit;
    }
    
    if ($user['status'] !== 'active') {
        http_response_code(403);
        echo json_encode(['error' => 'Account is blocked']);
        exit;
    }
    
    // Возвращаем пользователя для использования в других файлах
    return $user;
}

// Получение текущего пользователя (опционально, без выхода при ошибке)
function get_authenticated_user() {
    global $pdo;
    
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        return null;
    }
    
    $token = str_replace('Bearer ', '', $headers['Authorization']);
    
    $stmt = $pdo->prepare('
        SELECT u.* FROM users u
        JOIN tokens t ON u.id = t.user_id
        WHERE t.token = ? AND t.expires_at > datetime("now")
    ');
    $stmt->execute([$token]);
    return $stmt->fetch() ?: null;
}
?>
