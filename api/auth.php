<?php
// auth.php — Bearer Token аутентификация
function check_auth() {
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    $token = str_replace('Bearer ', '', $headers['Authorization']);
    // Для демо: токен "demo_token". В реальном проекте — проверка по БД.
    if ($token !== 'demo_token') {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
}
?>
