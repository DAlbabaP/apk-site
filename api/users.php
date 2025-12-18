<?php
// users.php — API для работы с пользователями (регистрация, вход, выход)
require_once 'db.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Получаем действие из URL
$uri = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
$action = end($uri);

switch ($action) {
    case 'register':
        handleRegister($pdo);
        break;
    case 'login':
        handleLogin($pdo);
        break;
    case 'logout':
        handleLogout($pdo);
        break;
    case 'me':
        handleMe($pdo);
        break;
    case 'list':
        handleListUsers($pdo);
        break;
    case 'update':
        handleUpdateUser($pdo);
        break;
    case 'delete':
        handleDeleteUser($pdo);
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
}

// Регистрация нового пользователя
function handleRegister($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    // Валидация
    if (empty($data['login']) || empty($data['password']) || empty($data['full_name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Заполните обязательные поля: логин, пароль, ФИО']);
        return;
    }

    $login = trim($data['login']);
    $password = $data['password'];
    $fullName = trim($data['full_name']);
    $email = trim($data['email'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $role = $data['role'] ?? 'user';

    // Проверяем допустимые роли
    if (!in_array($role, ['user', 'manager', 'admin'])) {
        $role = 'user';
    }

    // Проверяем, существует ли пользователь
    $stmt = $pdo->prepare('SELECT id FROM users WHERE login = ?');
    $stmt->execute([$login]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Пользователь с таким логином уже существует']);
        return;
    }

    // Хешируем пароль с bcrypt
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    // Создаём пользователя
    $stmt = $pdo->prepare('INSERT INTO users (login, password, full_name, email, phone, role) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([$login, $hashedPassword, $fullName, $email, $phone, $role]);

    $userId = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Регистрация успешна',
        'user' => [
            'id' => $userId,
            'login' => $login,
            'full_name' => $fullName,
            'role' => $role
        ]
    ]);
}

// Вход пользователя
function handleLogin($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['login']) || empty($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Введите логин и пароль']);
        return;
    }

    $login = trim($data['login']);
    $password = $data['password'];

    // Ищем пользователя
    $stmt = $pdo->prepare('SELECT * FROM users WHERE login = ?');
    $stmt->execute([$login]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Неверный логин или пароль']);
        return;
    }

    // Проверяем пароль
    if (!password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Неверный логин или пароль']);
        return;
    }

    // Проверяем статус
    if ($user['status'] !== 'active') {
        http_response_code(403);
        echo json_encode(['error' => 'Аккаунт заблокирован']);
        return;
    }

    // Генерируем токен
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));

    // Удаляем старые токены пользователя
    $stmt = $pdo->prepare('DELETE FROM tokens WHERE user_id = ?');
    $stmt->execute([$user['id']]);

    // Сохраняем новый токен
    $stmt = $pdo->prepare('INSERT INTO tokens (user_id, token, expires_at) VALUES (?, ?, ?)');
    $stmt->execute([$user['id'], $token, $expiresAt]);

    echo json_encode([
        'success' => true,
        'message' => 'Вход выполнен успешно',
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'login' => $user['login'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'role' => $user['role']
        ]
    ]);
}

// Выход (удаление токена)
function handleLogout($pdo) {
    $token = getBearerToken();
    
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'Токен не предоставлен']);
        return;
    }

    $stmt = $pdo->prepare('DELETE FROM tokens WHERE token = ?');
    $stmt->execute([$token]);

    echo json_encode(['success' => true, 'message' => 'Выход выполнен']);
}

// Получение данных текущего пользователя
function handleMe($pdo) {
    $token = getBearerToken();
    
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'Требуется авторизация']);
        return;
    }

    $user = getUserByToken($pdo, $token);
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Недействительный токен']);
        return;
    }

    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'login' => $user['login'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'role' => $user['role'],
            'status' => $user['status'],
            'created_at' => $user['created_at']
        ]
    ]);
}

// Получение списка всех пользователей (только для админа)
function handleListUsers($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    $token = getBearerToken();
    
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'Требуется авторизация']);
        return;
    }

    $currentUser = getUserByToken($pdo, $token);
    
    if (!$currentUser || $currentUser['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Доступ запрещён']);
        return;
    }

    $stmt = $pdo->query('SELECT id, login, full_name, email, phone, role, status, created_at FROM users ORDER BY id DESC');
    $users = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'users' => $users
    ]);
}

// Обновление пользователя (только для админа)
function handleUpdateUser($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    $token = getBearerToken();
    
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'Требуется авторизация']);
        return;
    }

    $currentUser = getUserByToken($pdo, $token);
    
    if (!$currentUser || $currentUser['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Доступ запрещён']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID пользователя обязателен']);
        return;
    }

    $userId = $data['id'];
    $updates = [];
    $params = [];

    if (isset($data['full_name'])) {
        $updates[] = 'full_name = ?';
        $params[] = trim($data['full_name']);
    }
    if (isset($data['email'])) {
        $updates[] = 'email = ?';
        $params[] = trim($data['email']);
    }
    if (isset($data['phone'])) {
        $updates[] = 'phone = ?';
        $params[] = trim($data['phone']);
    }
    if (isset($data['role']) && in_array($data['role'], ['user', 'manager', 'admin'])) {
        $updates[] = 'role = ?';
        $params[] = $data['role'];
    }
    if (isset($data['status']) && in_array($data['status'], ['active', 'blocked'])) {
        $updates[] = 'status = ?';
        $params[] = $data['status'];
    }

    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'Нет данных для обновления']);
        return;
    }

    $params[] = $userId;
    $sql = 'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode([
        'success' => true,
        'message' => 'Пользователь обновлён'
    ]);
}

// Удаление пользователя (только для админа)
function handleDeleteUser($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    $token = getBearerToken();
    
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'Требуется авторизация']);
        return;
    }

    $currentUser = getUserByToken($pdo, $token);
    
    if (!$currentUser || $currentUser['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Доступ запрещён']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID пользователя обязателен']);
        return;
    }

    // Нельзя удалить самого себя
    if ($data['id'] == $currentUser['id']) {
        http_response_code(400);
        echo json_encode(['error' => 'Нельзя удалить свой аккаунт']);
        return;
    }

    $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$data['id']]);

    echo json_encode([
        'success' => true,
        'message' => 'Пользователь удалён'
    ]);
}

// Получение токена из заголовка
function getBearerToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    return null;
}

// Получение пользователя по токену
function getUserByToken($pdo, $token) {
    $stmt = $pdo->prepare('
        SELECT u.* FROM users u
        JOIN tokens t ON u.id = t.user_id
        WHERE t.token = ? AND t.expires_at > datetime("now")
    ');
    $stmt->execute([$token]);
    return $stmt->fetch();
}
?>
