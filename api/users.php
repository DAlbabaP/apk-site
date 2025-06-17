<?php
// users.php — API для управления пользователями
require_once 'db.php';
require_once 'auth.php';

// CORS заголовки
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Обработка preflight запросов
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];
$path_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));

// Проверяем авторизацию для всех запросов кроме POST (регистрация)
if ($method !== 'POST') {
    $auth_result = checkAuth();
    if (!$auth_result['success']) {
        http_response_code(401);
        echo json_encode(['error' => $auth_result['error']]);
        exit;
    }
    $current_user = $auth_result['user'];
}

try {
    switch ($method) {
        case 'GET':
            handleGet($current_user);
            break;
        case 'POST':
            handlePost();
            break;
        case 'PUT':
            handlePut($current_user);
            break;
        case 'DELETE':
            handleDelete($current_user);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

// Получение пользователей
function handleGet($current_user) {
    global $pdo;
    
    // Проверяем, запрашивается ли профиль текущего пользователя
    $action = $_GET['action'] ?? '';
    
    if ($action === 'profile') {
        // Возвращаем профиль текущего пользователя
        return handleGetProfile($current_user);
    }
    
    // Проверяем права - только админы могут получать список всех пользователей
    if ($current_user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        exit;
    }
    
    $stmt = $pdo->prepare("
        SELECT id, username, email, role, first_name, last_name, phone, 
               created_at, is_active 
        FROM users 
        ORDER BY created_at DESC
    ");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Форматируем данные для фронтенда
    $formatted_users = array_map(function($user) {
        return [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'first_name' => $user['first_name'],
            'last_name' => $user['last_name'],
            'full_name' => trim($user['first_name'] . ' ' . $user['last_name']),
            'phone' => $user['phone'],
            'created_at' => $user['created_at'],
            'is_active' => (bool)$user['is_active'],
            'status' => $user['is_active'] ? 'active' : 'inactive'
        ];
    }, $users);
    
    echo json_encode(['success' => true, 'users' => $formatted_users]);
}

// Создание пользователя (регистрация)
function handlePost() {
    global $pdo;
    
    // Получаем данные из формы (multipart/form-data или JSON)
    $data = $_POST;
    if (empty($data)) {
        $data = json_decode(file_get_contents('php://input'), true);
    }

    $required = ['fullName', 'login', 'phone', 'email', 'password', 'role'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Field $field is required"]);
            exit;
        }
    }

    // Проверка уникальности логина и email
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$data['login'], $data['email']]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Пользователь с таким логином или email уже существует']);
        exit;
    }

    // Разделяем ФИО
    $fio = explode(' ', trim($data['fullName']), 2);
    $first_name = $fio[0];
    $last_name = isset($fio[1]) ? $fio[1] : '';

    // Хешируем пароль
    $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);

    // Вставка пользователя
    $stmt = $pdo->prepare("
        INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $data['login'],
        $data['email'],
        $password_hash,
        $data['role'],
        $first_name,
        $last_name,
        $data['phone'] ?? ''
    ]);

    echo json_encode(['success' => true, 'message' => 'Регистрация прошла успешно!']);
}

// Обновление пользователя
function handlePut($current_user) {
    global $pdo;
    
    // Проверяем, обновляется ли профиль текущего пользователя
    $action = $_GET['action'] ?? '';
    
    if ($action === 'profile') {
        // Обновление собственного профиля - доступно всем авторизованным пользователям
        return handleProfileUpdate($current_user);
    }
    
    // Обновление других пользователей - только для админов
    if ($current_user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        exit;
    }
    
    $user_id = $_GET['id'] ?? null;
    if (!$user_id) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is required']);
        exit;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Формируем SQL для обновления
    $fields = [];
    $values = [];
    
    if (!empty($data['fullName'])) {
        $fio = explode(' ', trim($data['fullName']), 2);
        $fields[] = "first_name = ?";
        $values[] = $fio[0];
        $fields[] = "last_name = ?";
        $values[] = isset($fio[1]) ? $fio[1] : '';
    }
    
    if (!empty($data['email'])) {
        $fields[] = "email = ?";
        $values[] = $data['email'];
    }
    
    if (!empty($data['phone'])) {
        $fields[] = "phone = ?";
        $values[] = $data['phone'];
    }
    
    if (!empty($data['role'])) {
        $fields[] = "role = ?";
        $values[] = $data['role'];
    }
    
    if (isset($data['is_active'])) {
        $fields[] = "is_active = ?";
        $values[] = $data['is_active'] ? 1 : 0;
    }
    
    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        exit;
    }
    
    $values[] = $user_id;
    
    $stmt = $pdo->prepare("UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?");
    $stmt->execute($values);
    
    echo json_encode(['success' => true, 'message' => 'User updated successfully']);
}

// Удаление пользователя
function handleDelete($current_user) {
    global $pdo;
    
    // Только админы могут удалять пользователей
    if ($current_user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        exit;
    }
    
    $user_id = $_GET['id'] ?? null;
    if (!$user_id) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is required']);
        exit;
    }
    
    // Нельзя удалять самого себя
    if ($user_id == $current_user['id']) {
        http_response_code(400);
        echo json_encode(['error' => 'Cannot delete yourself']);
        exit;
    }
    
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
      echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
}

function handleGetProfile($current_user) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("SELECT id, username, email, role, first_name, last_name, full_name, phone, department, position, position_code, is_active, created_at, updated_at FROM users WHERE id = ?");
        $stmt->execute([$current_user['id']]);
        $user = $stmt->fetch();
        
        if ($user) {
            // Формируем полное имя если оно не заполнено
            if (empty($user['full_name']) && !empty($user['first_name'])) {
                $user['full_name'] = trim($user['first_name'] . ' ' . $user['last_name']);
            }
            
            echo json_encode([
                'success' => true,
                'user' => $user
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
        }
    } catch (PDOException $e) {
        error_log("Database error in handleGetProfile: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function handleProfileUpdate($current_user) {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON data']);
        exit;
    }
    
    // Формируем SQL для обновления профиля
    $fields = [];
    $values = [];
    
    if (!empty($data['full_name'])) {
        $fields[] = "full_name = ?";
        $values[] = $data['full_name'];
        
        // Также обновляем first_name и last_name
        $fio = explode(' ', trim($data['full_name']), 2);
        $fields[] = "first_name = ?";
        $values[] = $fio[0];
        $fields[] = "last_name = ?";
        $values[] = isset($fio[1]) ? $fio[1] : '';
    }
    
    if (!empty($data['email'])) {
        $fields[] = "email = ?";
        $values[] = $data['email'];
    }
    
    if (!empty($data['phone'])) {
        $fields[] = "phone = ?";
        $values[] = $data['phone'];
    }
    
    if (!empty($data['department'])) {
        $fields[] = "department = ?";
        $values[] = $data['department'];
    }
    
    if (!empty($data['position'])) {
        $fields[] = "position = ?";
        $values[] = $data['position'];
    }
    
    if (!empty($data['position_code'])) {
        $fields[] = "position_code = ?";
        $values[] = $data['position_code'];
    }
    
    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        exit;
    }
    
    $fields[] = "updated_at = NOW()";
    $values[] = $current_user['id'];
    
    $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        // Получаем обновленные данные пользователя
        $stmt = $pdo->prepare("SELECT id, username, email, role, first_name, last_name, full_name, phone, department, position, position_code, is_active, created_at, updated_at FROM users WHERE id = ?");
        $stmt->execute([$current_user['id']]);
        $updated_user = $stmt->fetch();
        
        if ($updated_user) {
            echo json_encode([
                'success' => true, 
                'message' => 'Profile updated successfully',
                'user' => $updated_user
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'message' => 'Profile updated successfully'
            ]);
        }
    } catch (PDOException $e) {
        error_log("Database error in handleProfileUpdate: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}
?>
