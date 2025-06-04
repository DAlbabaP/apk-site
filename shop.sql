-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Хост: 127.0.0.1
-- Время создания: Июн 03 2025 г., 20:16
-- Версия сервера: 10.4.32-MariaDB
-- Версия PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `shop`
--

-- --------------------------------------------------------

--
-- Структура таблицы `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `category` varchar(50) NOT NULL,
  `storage_temp` int(11) DEFAULT NULL,
  `storage_humidity` int(11) DEFAULT NULL,
  `shelf_life` int(11) DEFAULT NULL,
  `seasonality` varchar(20) DEFAULT NULL,
  `packaging` varchar(20) DEFAULT NULL,
  `special_care` varchar(20) DEFAULT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `products`
--

INSERT INTO `products` (`id`, `name`, `category`, `storage_temp`, `storage_humidity`, `shelf_life`, `seasonality`, `packaging`, `special_care`, `description`) VALUES
(1, 'Семена пшеницы', 'seeds', 15, 50, 365, 'spring', 'paper', 'dry', 'Высококачественные семена озимой пшеницы'),
(2, 'Комплексное удобрение', 'fertilizers', 10, 40, 730, 'year-round', 'plastic', '', 'Минеральное удобрение для всех культур'),
(3, 'Гербицид', 'pesticides', 5, 30, 540, 'summer', 'metal', 'dark', 'Средство для борьбы с сорняками'),
(4, 'Корм для КРС', 'feeds', 18, 60, 180, 'autumn', 'paper', '', 'Сбалансированный корм для крупного рогатого скота');

-- --------------------------------------------------------

--
-- Структура таблицы `sets`
--

CREATE TABLE `sets` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `sets`
--

INSERT INTO `sets` (`id`, `name`, `type`, `description`) VALUES
(1, 'Весенний старт', 'seasonal', 'Набор для весеннего посева');

-- --------------------------------------------------------

--
-- Структура таблицы `set_products`
--

CREATE TABLE `set_products` (
  `set_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `set_products`
--

INSERT INTO `set_products` (`set_id`, `product_id`) VALUES
(1, 1),
(1, 2);

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `sets`
--
ALTER TABLE `sets`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `set_products`
--
ALTER TABLE `set_products`
  ADD PRIMARY KEY (`set_id`,`product_id`),
  ADD KEY `product_id` (`product_id`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT для таблицы `sets`
--
ALTER TABLE `sets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `set_products`
--
ALTER TABLE `set_products`
  ADD CONSTRAINT `set_products_ibfk_1` FOREIGN KEY (`set_id`) REFERENCES `sets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `set_products_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
