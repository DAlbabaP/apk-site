<?php
// requests.php — API для работы с заявками
require_once 'db.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Определяем действие из URL
$uri = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
$action = end($uri);

switch ($action) {
    case 'create':
        handleCreate($pdo);
        break;
    case 'list':
        handleList($pdo);
        break;
    case 'update':
        handleUpdate($pdo);
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
}

// Создание заявки (пользователь / менеджер / админ)
function handleCreate($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    $user = getUserFromToken($pdo);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Требуется авторизация']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $title = trim($data['title'] ?? '');
    if ($title === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Заголовок обязателен']);
        return;
    }

    $category = trim($data['category'] ?? '');
    $priority = $data['priority'] ?? 'medium';
    $description = trim($data['description'] ?? '');
    $managerId = isset($data['managerId']) ? (int)$data['managerId'] : null;
    $userId = $user['role'] === 'admin' && isset($data['userId']) ? (int)$data['userId'] : (int)$user['id'];

    $stmt = $pdo->prepare('
        INSERT INTO requests (user_id, manager_id, title, category, priority, status, description, files, comments, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, "new", ?, "[]", "[]", datetime("now"), datetime("now"))
    ');
    $stmt->execute([$userId, $managerId, $title, $category, $priority, $description]);

    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
}

// Получение списка заявок
function handleList($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    $user = getUserFromToken($pdo);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Требуется авторизация']);
        return;
    }

    // Админ — все, менеджер — назначенные или новые, пользователь — свои
    if ($user['role'] === 'admin') {
        $stmt = $pdo->query('SELECT * FROM requests ORDER BY id DESC');
        $requests = $stmt->fetchAll();
    } elseif ($user['role'] === 'manager') {
        $stmt = $pdo->prepare('SELECT * FROM requests WHERE manager_id = ? OR status = "new" ORDER BY id DESC');
        $stmt->execute([$user['id']]);
        $requests = $stmt->fetchAll();
    } else {
        $stmt = $pdo->prepare('SELECT * FROM requests WHERE user_id = ? ORDER BY id DESC');
        $stmt->execute([$user['id']]);
        $requests = $stmt->fetchAll();
    }

    echo json_encode([
        'success' => true,
        'requests' => $requests
    ]);
}

// Обновление заявки (статус / назначение)
function handleUpdate($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    $user = getUserFromToken($pdo);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Требуется авторизация']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID заявки обязателен']);
        return;
    }

    // Только менеджер или админ могут обновлять
    if (!in_array($user['role'], ['admin', 'manager'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Доступ запрещен']);
        return;
    }

    $fields = [];
    $params = [];

    if (isset($data['status'])) {
        $fields[] = 'status = ?';
        $params[] = $data['status'];
    }

    if (isset($data['managerId'])) {
        $fields[] = 'manager_id = ?';
        $params[] = $data['managerId'] ?: null;
    }

    if (isset($data['priority'])) {
        $fields[] = 'priority = ?';
        $params[] = $data['priority'];
    }

    if (isset($data['description'])) {
        $fields[] = 'description = ?';
        $params[] = $data['description'];
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'Нет данных для обновления']);
        return;
    }

    $fields[] = 'updated_at = datetime("now")';

    $params[] = (int)$id;
    $sql = 'UPDATE requests SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['success' => true]);
}

// Получаем пользователя по токену
function getUserFromToken($pdo) {
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        return null;
    }
    if (!preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $m)) {
        return null;
    }
    $token = $m[1];

    $stmt = $pdo->prepare('
        SELECT u.* FROM users u
        JOIN tokens t ON u.id = t.user_id
        WHERE t.token = ? AND t.expires_at > datetime("now")
    ');
    $stmt->execute([$token]);
    return $stmt->fetch() ?: null;
}
?>

