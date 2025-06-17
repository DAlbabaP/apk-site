<?php
// stats.php — API для получения статистики
require_once 'db.php';
require_once 'auth.php';

// CORS заголовки
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Обработка preflight запросов
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Проверяем авторизацию
$auth_result = checkAuth();
if (!$auth_result['success']) {
    http_response_code(401);
    echo json_encode(['error' => $auth_result['error']]);
    exit;
}

$current_user = $auth_result['user'];
$stats_type = $_GET['type'] ?? 'general';

try {
    switch ($stats_type) {
        case 'admin':
            handleAdminStats($current_user);
            break;
        case 'manager':
            handleManagerStats($current_user);
            break;
        case 'user':
            handleUserStats($current_user);
            break;
        default:
            handleGeneralStats($current_user);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

// Общая статистика
function handleGeneralStats($current_user) {
    global $pdo;
    
    $stats = [];
    
    if ($current_user['role'] === 'admin') {
        // Админ видит всё
        $stmt = $pdo->query("SELECT COUNT(*) as total_users FROM users");
        $stats['total_users'] = $stmt->fetch()['total_users'];
        
        $stmt = $pdo->query("SELECT COUNT(*) as total_applications FROM applications");
        $stats['total_applications'] = $stmt->fetch()['total_applications'];
        
        $stmt = $pdo->query("SELECT COUNT(*) as pending_applications FROM applications WHERE status = 'pending'");
        $stats['pending_applications'] = $stmt->fetch()['pending_applications'];
        
        $stmt = $pdo->query("SELECT COUNT(*) as completed_applications FROM applications WHERE status = 'completed'");
        $stats['completed_applications'] = $stmt->fetch()['completed_applications'];
        
        $stmt = $pdo->query("SELECT COUNT(*) as in_progress_applications FROM applications WHERE status = 'in_progress'");
        $stats['in_progress_applications'] = $stmt->fetch()['in_progress_applications'];
        
    } elseif ($current_user['role'] === 'manager') {
        // Менеджер видит свои заявки
        $stmt = $pdo->prepare("SELECT COUNT(*) as assigned_applications FROM applications WHERE assigned_to = ?");
        $stmt->execute([$current_user['id']]);
        $stats['assigned_applications'] = $stmt->fetch()['assigned_applications'];
        
        $stmt = $pdo->prepare("SELECT COUNT(*) as pending_applications FROM applications WHERE assigned_to = ? AND status = 'pending'");
        $stmt->execute([$current_user['id']]);
        $stats['pending_applications'] = $stmt->fetch()['pending_applications'];
        
        $stmt = $pdo->prepare("SELECT COUNT(*) as completed_applications FROM applications WHERE assigned_to = ? AND status = 'completed'");
        $stmt->execute([$current_user['id']]);
        $stats['completed_applications'] = $stmt->fetch()['completed_applications'];
        
    } else {
        // Пользователь видит свои заявки
        $stmt = $pdo->prepare("SELECT COUNT(*) as my_applications FROM applications WHERE user_id = ?");
        $stmt->execute([$current_user['id']]);
        $stats['my_applications'] = $stmt->fetch()['my_applications'];
        
        $stmt = $pdo->prepare("SELECT COUNT(*) as pending_applications FROM applications WHERE user_id = ? AND status = 'pending'");
        $stmt->execute([$current_user['id']]);
        $stats['pending_applications'] = $stmt->fetch()['pending_applications'];
        
        $stmt = $pdo->prepare("SELECT COUNT(*) as completed_applications FROM applications WHERE user_id = ? AND status = 'completed'");
        $stmt->execute([$current_user['id']]);
        $stats['completed_applications'] = $stmt->fetch()['completed_applications'];
    }
    
    echo json_encode(['success' => true, 'stats' => $stats]);
}

// Статистика для админа
function handleAdminStats($current_user) {
    global $pdo;
    
    if ($current_user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        exit;
    }
    
    $stats = [];
    
    // Общие счетчики
    $stmt = $pdo->query("SELECT COUNT(*) as total_users FROM users");
    $stats['total_users'] = $stmt->fetch()['total_users'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as total_applications FROM applications");
    $stats['total_applications'] = $stmt->fetch()['total_applications'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as pending_applications FROM applications WHERE status = 'pending'");
    $stats['pending_applications'] = $stmt->fetch()['pending_applications'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as completed_applications FROM applications WHERE status = 'completed'");
    $stats['completed_applications'] = $stmt->fetch()['completed_applications'];
    
    // Статистика по ролям
    $stmt = $pdo->query("SELECT role, COUNT(*) as count FROM users GROUP BY role");
    $stats['users_by_role'] = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    // Статистика по статусам заявок
    $stmt = $pdo->query("SELECT status, COUNT(*) as count FROM applications GROUP BY status");
    $stats['applications_by_status'] = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    // Последние заявки
    $stmt = $pdo->query("
        SELECT a.*, u.username, u.first_name, u.last_name 
        FROM applications a 
        LEFT JOIN users u ON a.user_id = u.id 
        ORDER BY a.created_at DESC 
        LIMIT 5
    ");
    $stats['recent_applications'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'stats' => $stats]);
}

// Статистика для менеджера
function handleManagerStats($current_user) {
    global $pdo;
    
    if ($current_user['role'] !== 'manager') {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        exit;
    }
    
    $stats = [];
    
    // Заявки менеджера
    $stmt = $pdo->prepare("SELECT COUNT(*) as assigned_applications FROM applications WHERE assigned_to = ?");
    $stmt->execute([$current_user['id']]);
    $stats['assigned_applications'] = $stmt->fetch()['assigned_applications'];
    
    $stmt = $pdo->prepare("SELECT COUNT(*) as pending_applications FROM applications WHERE assigned_to = ? AND status = 'pending'");
    $stmt->execute([$current_user['id']]);
    $stats['pending_applications'] = $stmt->fetch()['pending_applications'];
    
    $stmt = $pdo->prepare("SELECT COUNT(*) as in_progress_applications FROM applications WHERE assigned_to = ? AND status = 'in_progress'");
    $stmt->execute([$current_user['id']]);
    $stats['in_progress_applications'] = $stmt->fetch()['in_progress_applications'];
    
    $stmt = $pdo->prepare("SELECT COUNT(*) as completed_applications FROM applications WHERE assigned_to = ? AND status = 'completed'");
    $stmt->execute([$current_user['id']]);
    $stats['completed_applications'] = $stmt->fetch()['completed_applications'];
    
    // Заявки менеджера по статусам
    $stmt = $pdo->prepare("SELECT status, COUNT(*) as count FROM applications WHERE assigned_to = ? GROUP BY status");
    $stmt->execute([$current_user['id']]);
    $stats['applications_by_status'] = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    // Последние заявки менеджера
    $stmt = $pdo->prepare("
        SELECT a.*, u.username, u.first_name, u.last_name 
        FROM applications a 
        LEFT JOIN users u ON a.user_id = u.id 
        WHERE a.assigned_to = ?
        ORDER BY a.created_at DESC 
        LIMIT 10
    ");
    $stmt->execute([$current_user['id']]);
    $stats['recent_applications'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'stats' => $stats]);
}

// Статистика для пользователя
function handleUserStats($current_user) {
    global $pdo;
    
    $stats = [];
    
    // Заявки пользователя
    $stmt = $pdo->prepare("SELECT COUNT(*) as my_applications FROM applications WHERE user_id = ?");
    $stmt->execute([$current_user['id']]);
    $stats['my_applications'] = $stmt->fetch()['my_applications'];
    
    $stmt = $pdo->prepare("SELECT COUNT(*) as pending_applications FROM applications WHERE user_id = ? AND status = 'pending'");
    $stmt->execute([$current_user['id']]);
    $stats['pending_applications'] = $stmt->fetch()['pending_applications'];
    
    $stmt = $pdo->prepare("SELECT COUNT(*) as in_progress_applications FROM applications WHERE user_id = ? AND status = 'in_progress'");
    $stmt->execute([$current_user['id']]);
    $stats['in_progress_applications'] = $stmt->fetch()['in_progress_applications'];
    
    $stmt = $pdo->prepare("SELECT COUNT(*) as completed_applications FROM applications WHERE user_id = ? AND status = 'completed'");
    $stmt->execute([$current_user['id']]);
    $stats['completed_applications'] = $stmt->fetch()['completed_applications'];
    
    // Заявки пользователя по статусам
    $stmt = $pdo->prepare("SELECT status, COUNT(*) as count FROM applications WHERE user_id = ? GROUP BY status");
    $stmt->execute([$current_user['id']]);
    $stats['applications_by_status'] = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    // Последние заявки пользователя
    $stmt = $pdo->prepare("
        SELECT a.*, m.username as manager_username, m.first_name as manager_first_name, m.last_name as manager_last_name
        FROM applications a 
        LEFT JOIN users m ON a.assigned_to = m.id 
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC 
        LIMIT 10
    ");
    $stmt->execute([$current_user['id']]);
    $stats['recent_applications'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'stats' => $stats]);
}
?>
