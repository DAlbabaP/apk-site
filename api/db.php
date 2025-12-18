<?php
// db.php — подключение к SQLite
$dbPath = __DIR__ . '/shop.db';

$dsn = "sqlite:$dbPath";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, null, null, $options);
    // Включаем поддержку внешних ключей в SQLite
    $pdo->exec('PRAGMA foreign_keys = ON');
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB connection failed: ' . $e->getMessage()]);
    exit;
}

// Функция для инициализации базы данных (создание таблиц, если их нет)
function initDatabase($pdo) {
    // Таблица товаров
    $pdo->exec('
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            storage_temp INTEGER,
            storage_humidity INTEGER,
            shelf_life INTEGER,
            seasonality TEXT,
            packaging TEXT,
            special_care TEXT,
            description TEXT
        )
    ');

    // Таблица наборов
    $pdo->exec('
        CREATE TABLE IF NOT EXISTS sets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            description TEXT
        )
    ');

    // Связующая таблица "товары в наборе"
    $pdo->exec('
        CREATE TABLE IF NOT EXISTS set_products (
            set_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            PRIMARY KEY (set_id, product_id),
            FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    ');

    // Таблица пользователей
    $pdo->exec('
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            login TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            role TEXT NOT NULL DEFAULT "user",
            status TEXT NOT NULL DEFAULT "active",
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ');

    // Таблица токенов авторизации
    $pdo->exec('
        CREATE TABLE IF NOT EXISTS tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL UNIQUE,
            expires_at TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ');

    // Таблица заявок
    $pdo->exec('
        CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            manager_id INTEGER,
            title TEXT NOT NULL,
            category TEXT,
            priority TEXT DEFAULT "medium",
            status TEXT DEFAULT "new",
            description TEXT,
            files TEXT,
            comments TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
        )
    ');

    // Тестовая заявка (добавляем только если таблица пуста и есть пользователи)
    $count = (int)$pdo->query('SELECT COUNT(*) FROM requests')->fetchColumn();
    if ($count === 0) {
        // Берем первые доступные user/manager
        $userId = (int)$pdo->query('SELECT id FROM users WHERE role IN ("user","manager","admin") ORDER BY id LIMIT 1')->fetchColumn();
        $managerId = (int)$pdo->query('SELECT id FROM users WHERE role = "manager" ORDER BY id LIMIT 1')->fetchColumn();
        if ($userId) {
            $stmt = $pdo->prepare('
                INSERT INTO requests (user_id, manager_id, title, category, priority, status, description, files, comments, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, "new", ?, "[]", "[]", datetime("now"), datetime("now"))
            ');
            $stmt->execute([
                $userId,
                $managerId ?: null,
                'Проверочная заявка',
                'maintenance',
                'medium',
                'Это тестовая заявка, созданная при инициализации базы.'
            ]);
        }
    }
}

// Инициализируем базу данных при первом подключении
initDatabase($pdo);
?>
