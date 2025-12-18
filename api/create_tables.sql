-- SQLite: Создание таблиц для базы данных shop

-- Таблица товаров
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
);

-- Таблица наборов
CREATE TABLE IF NOT EXISTS sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT
);

-- Связующая таблица "товары в наборе"
CREATE TABLE IF NOT EXISTS set_products (
    set_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    PRIMARY KEY (set_id, product_id),
    FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Тестовые данные
INSERT INTO products (name, category, storage_temp, storage_humidity, shelf_life, seasonality, packaging, special_care, description) VALUES
('Семена пшеницы', 'seeds', 15, 50, 365, 'spring', 'paper', 'dry', 'Высококачественные семена озимой пшеницы'),
('Комплексное удобрение', 'fertilizers', 10, 40, 730, 'year-round', 'plastic', '', 'Минеральное удобрение для всех культур'),
('Гербицид', 'pesticides', 5, 30, 540, 'summer', 'metal', 'dark', 'Средство для борьбы с сорняками'),
('Корм для КРС', 'feeds', 18, 60, 180, 'autumn', 'paper', '', 'Сбалансированный корм для крупного рогатого скота');

INSERT INTO sets (name, type, description) VALUES
('Весенний старт', 'seasonal', 'Набор для весеннего посева');

INSERT INTO set_products (set_id, product_id) VALUES
(1, 1),
(1, 2);

-- Таблица заявок
CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    manager_id INTEGER,
    title TEXT NOT NULL,
    category TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'new',
    description TEXT,
    files TEXT,
    comments TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Тестовые пользователи (добавятся, если их нет)
INSERT OR IGNORE INTO users (id, login, password, full_name, email, phone, role, status, created_at) VALUES
    (1, 'admin',   '$2y$10$KkHcB1SVzFiwg17MNd8a9eA6/HW4O.9u2p5X6JdkQF3SvbWbXv9FO', 'Администратор Системы', 'admin@agrozayavki.ru',   '79990000001', 'admin',   'active', datetime('now')),
    (2, 'manager', '$2y$10$KkHcB1SVzFiwg17MNd8a9eA6/HW4O.9u2p5X6JdkQF3SvbWbXv9FO', 'Иванов Иван Иванович',  'manager@agrozayavki.ru', '79990000002', 'manager', 'active', datetime('now')),
    (3, 'user',    '$2y$10$KkHcB1SVzFiwg17MNd8a9eA6/HW4O.9u2p5X6JdkQF3SvbWbXv9FO', 'Петров Пётр Петрович', 'user@agrozayavki.ru',    '79990000003', 'user',    'active', datetime('now'));

-- Тестовая заявка (будет вставлена, если таблица пустая)
INSERT INTO requests (user_id, manager_id, title, category, priority, status, description, files, comments, created_at, updated_at)
SELECT 3, 2, 'Проверочная заявка', 'maintenance', 'medium', 'new', 'Это тестовая заявка, созданная при инициализации базы.', '[]', '[]', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM requests);

-- Таблица заявок
CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    manager_id INTEGER,
    title TEXT NOT NULL,
    category TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'new',
    description TEXT,
    files TEXT,
    comments TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);