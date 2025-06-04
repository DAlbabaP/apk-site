<?php
// sets.php — CRUD для наборов товаров с проверкой совместимости
require_once 'db.php';
require_once 'auth.php';
require_once 'compatibility.php';

header('Content-Type: application/json');

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        check_auth();
        $stmt = $pdo->query('SELECT * FROM sets');
        $sets = $stmt->fetchAll();
        foreach ($sets as &$set) {
            $stmt2 = $pdo->prepare('SELECT product_id FROM set_products WHERE set_id=?');
            $stmt2->execute([$set['id']]);
            $set['products'] = $stmt2->fetchAll(PDO::FETCH_COLUMN);
        }
        echo json_encode($sets);
        break;
    case 'POST':
        check_auth();
        $data = json_decode(file_get_contents('php://input'), true);
        $compat = check_compatibility($data['products'], $pdo);
        if ($compat !== true) {
            http_response_code(400);
            echo json_encode(['error' => 'Несовместимость товаров', 'details' => $compat]);
            exit;
        }
        $stmt = $pdo->prepare('INSERT INTO sets (name, type, description) VALUES (?, ?, ?)');
        $stmt->execute([$data['name'], $data['type'], $data['description']]);
        $set_id = $pdo->lastInsertId();
        $stmt2 = $pdo->prepare('INSERT INTO set_products (set_id, product_id) VALUES (?, ?)');
        foreach ($data['products'] as $pid) {
            $stmt2->execute([$set_id, $pid]);
        }
        echo json_encode(['success' => true, 'id' => $set_id]);
        break;
    case 'PUT':
        check_auth();
        parse_str($_SERVER['QUERY_STRING'], $params);
        $id = $params['id'] ?? null;
        if (!$id) { http_response_code(400); echo json_encode(['error'=>'No id']); exit; }
        $data = json_decode(file_get_contents('php://input'), true);
        $compat = check_compatibility($data['products'], $pdo);
        if ($compat !== true) {
            http_response_code(400);
            echo json_encode(['error' => 'Несовместимость товаров', 'details' => $compat]);
            exit;
        }
        $stmt = $pdo->prepare('UPDATE sets SET name=?, type=?, description=? WHERE id=?');
        $stmt->execute([$data['name'], $data['type'], $data['description'], $id]);
        $pdo->prepare('DELETE FROM set_products WHERE set_id=?')->execute([$id]);
        $stmt2 = $pdo->prepare('INSERT INTO set_products (set_id, product_id) VALUES (?, ?)');
        foreach ($data['products'] as $pid) {
            $stmt2->execute([$id, $pid]);
        }
        echo json_encode(['success' => true]);
        break;
    case 'DELETE':
        check_auth();
        parse_str($_SERVER['QUERY_STRING'], $params);
        $id = $params['id'] ?? null;
        if (!$id) { http_response_code(400); echo json_encode(['error'=>'No id']); exit; }
        $pdo->prepare('DELETE FROM set_products WHERE set_id=?')->execute([$id]);
        $pdo->prepare('DELETE FROM sets WHERE id=?')->execute([$id]);
        echo json_encode(['success' => true]);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>
