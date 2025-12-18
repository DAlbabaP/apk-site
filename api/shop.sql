-- SQLite SQL Dump
-- База данных: shop.db

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

-- Дамп данных таблицы products
INSERT INTO products (id, name, category, storage_temp, storage_humidity, shelf_life, seasonality, packaging, special_care, description) VALUES
(1, 'Семена пшеницы', 'seeds', 15, 50, 365, 'spring', 'paper', 'dry', 'Высококачественные семена озимой пшеницы'),
(2, 'Комплексное удобрение', 'fertilizers', 10, 40, 730, 'year-round', 'plastic', '', 'Минеральное удобрение для всех культур'),
(3, 'Гербицид', 'pesticides', 5, 30, 540, 'summer', 'metal', 'dark', 'Средство для борьбы с сорняками'),
(4, 'Корм для КРС', 'feeds', 18, 60, 180, 'autumn', 'paper', '', 'Сбалансированный корм для крупного рогатого скота');

-- Таблица наборов
CREATE TABLE IF NOT EXISTS sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT
);

-- Дамп данных таблицы sets
INSERT INTO sets (id, name, type, description) VALUES
(1, 'Весенний старт', 'seasonal', 'Набор для весеннего посева');

-- Связующая таблица "товары в наборе"
CREATE TABLE IF NOT EXISTS set_products (
    set_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    PRIMARY KEY (set_id, product_id),
    FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Дамп данных таблицы set_products
INSERT INTO set_products (set_id, product_id) VALUES
(1, 1),
(1, 2);
