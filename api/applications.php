<?php
// applications.php - API для управления заявками
require_once 'db.php';
require_once 'auth.php';

header('Content-Type: application/json');

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        check_auth();
        handleGetApplications();
        break;
    case 'POST':
        check_auth();
        handleCreateApplication();
        break;
    case 'PUT':
        check_auth();
        handleUpdateApplication();
        break;
    case 'DELETE':
        check_auth();
        handleDeleteApplication();
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}

function handleGetApplications() {
    global $pdo;
    
    $user = getCurrentUser();
    $role = $user['role'];
    $userId = $user['id'];
    
    // Базовый запрос с JOIN для получения информации о пользователе и менеджере
    $sql = "SELECT a.*, 
                   u.first_name as user_first_name, u.last_name as user_last_name,
                   m.first_name as manager_first_name, m.last_name as manager_last_name
            FROM applications a 
            LEFT JOIN users u ON a.user_id = u.id 
            LEFT JOIN users m ON a.assigned_manager_id = m.id";
    
    $params = [];
    
    // Фильтрация по роли пользователя
    if ($role === 'user') {
        $sql .= " WHERE a.user_id = ?";
        $params[] = $userId;
    } elseif ($role === 'manager') {
        $sql .= " WHERE a.assigned_manager_id = ? OR a.assigned_manager_id IS NULL";
        $params[] = $userId;
    }
    // Администраторы видят все заявки
    
    // Дополнительные фильтры из URL параметров
    if (isset($_GET['status']) && $_GET['status'] !== '') {
        $sql .= ($params ? " AND" : " WHERE") . " a.status = ?";
        $params[] = $_GET['status'];
    }
    
    if (isset($_GET['category']) && $_GET['category'] !== '') {
        $sql .= ($params ? " AND" : " WHERE") . " a.category = ?";
        $params[] = $_GET['category'];
    }
    
    if (isset($_GET['priority']) && $_GET['priority'] !== '') {
        $sql .= ($params ? " AND" : " WHERE") . " a.priority = ?";
        $params[] = $_GET['priority'];
    }
    
    $sql .= " ORDER BY a.created_at DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $applications = $stmt->fetchAll();
    
    echo json_encode($applications);
}

function handleCreateApplication() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON data']);
        return;
    }
    
    $user = getCurrentUser();
    
    // Валидация обязательных полей
    $required = ['title', 'description', 'category'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Field '$field' is required"]);
            return;
        }
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO applications 
            (user_id, title, description, category, priority, quantity, unit, delivery_address, delivery_date, budget) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        $stmt->execute([
            $user['id'],
            $data['title'],
            $data['description'],
            $data['category'],
            $data['priority'] ?? 'medium',
            $data['quantity'] ?? null,
            $data['unit'] ?? null,
            $data['delivery_address'] ?? null,
            $data['delivery_date'] ?? null,
            $data['budget'] ?? null
        ]);
        
        $applicationId = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true, 
            'id' => $applicationId,
            'message' => 'Заявка успешно создана'
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function handleUpdateApplication() {
    global $pdo;
    
    parse_str($_SERVER['QUERY_STRING'], $params);
    $id = $params['id'] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Application ID is required']);
        return;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    $user = getCurrentUser();
    
    // Проверяем права доступа
    $stmt = $pdo->prepare("SELECT * FROM applications WHERE id = ?");
    $stmt->execute([$id]);
    $application = $stmt->fetch();
    
    if (!$application) {
        http_response_code(404);
        echo json_encode(['error' => 'Application not found']);
        return;
    }
    
    // Пользователи могут редактировать только свои заявки
    if ($user['role'] === 'user' && $application['user_id'] != $user['id']) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        return;
    }
    
    try {
        // Формируем запрос обновления
        $updateFields = [];
        $updateValues = [];
        
        $allowedFields = ['title', 'description', 'category', 'priority', 'quantity', 'unit', 
                         'delivery_address', 'delivery_date', 'budget', 'status'];
        
        // Только менеджеры и админы могут менять статус и назначать менеджера
        if (in_array($user['role'], ['admin', 'manager'])) {
            $allowedFields[] = 'assigned_manager_id';
        }
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = ?";
                $updateValues[] = $data[$field];
            }
        }
        
        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No valid fields to update']);
            return;
        }
        
        $sql = "UPDATE applications SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $updateValues[] = $id;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($updateValues);
        
        echo json_encode(['success' => true, 'message' => 'Заявка успешно обновлена']);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function handleDeleteApplication() {
    global $pdo;
    
    parse_str($_SERVER['QUERY_STRING'], $params);
    $id = $params['id'] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Application ID is required']);
        return;
    }
    
    $user = getCurrentUser();
    
    // Проверяем существование заявки и права доступа
    $stmt = $pdo->prepare("SELECT * FROM applications WHERE id = ?");
    $stmt->execute([$id]);
    $application = $stmt->fetch();
    
    if (!$application) {
        http_response_code(404);
        echo json_encode(['error' => 'Application not found']);
        return;
    }
    
    // Только создатель заявки или админ может удалить заявку
    if ($user['role'] !== 'admin' && $application['user_id'] != $user['id']) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM applications WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true, 'message' => 'Заявка успешно удалена']);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function getCurrentUser() {
    // В реальном проекте здесь должна быть проверка JWT токена
    // Для демо возвращаем тестового пользователя
    global $pdo;
    
    $headers = getallheaders();
    $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
    
    // Простая проверка токена (в реальном проекте использовать JWT)
    if ($token === 'demo_token_admin') {
        return ['id' => 1, 'role' => 'admin'];
    } elseif ($token === 'demo_token_manager') {
        return ['id' => 2, 'role' => 'manager'];
    } elseif ($token === 'demo_token_user') {
        return ['id' => 3, 'role' => 'user'];
    }
    
    // Дефолтный пользователь для совместимости
    return ['id' => 3, 'role' => 'user'];
}
?>
