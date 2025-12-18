<?php
// products.php — CRUD для товаров
require_once 'db.php';
require_once 'auth.php';

header('Content-Type: application/json');

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // GET-запросы публичные — товары доступны без авторизации
        $stmt = $pdo->query('SELECT * FROM products');
        echo json_encode($stmt->fetchAll());
        break;
    case 'POST':
        check_auth();
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare('INSERT INTO products (name, category, storage_temp, storage_humidity, shelf_life, seasonality, packaging, special_care, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $data['name'], $data['category'], $data['storage_temp'], $data['storage_humidity'],
            $data['shelf_life'], $data['seasonality'], $data['packaging'], $data['special_care'], $data['description']
        ]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        break;
    case 'PUT':
        check_auth();
        parse_str($_SERVER['QUERY_STRING'], $params);
        $id = $params['id'] ?? null;
        if (!$id) { http_response_code(400); echo json_encode(['error'=>'No id']); exit; }
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare('UPDATE products SET name=?, category=?, storage_temp=?, storage_humidity=?, shelf_life=?, seasonality=?, packaging=?, special_care=?, description=? WHERE id=?');
        $stmt->execute([
            $data['name'], $data['category'], $data['storage_temp'], $data['storage_humidity'],
            $data['shelf_life'], $data['seasonality'], $data['packaging'], $data['special_care'], $data['description'], $id
        ]);
        echo json_encode(['success' => true]);
        break;
    case 'DELETE':
        check_auth();
        parse_str($_SERVER['QUERY_STRING'], $params);
        $id = $params['id'] ?? null;
        if (!$id) { http_response_code(400); echo json_encode(['error'=>'No id']); exit; }
        $stmt = $pdo->prepare('DELETE FROM products WHERE id=?');
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>
