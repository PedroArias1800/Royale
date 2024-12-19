-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 19-12-2024 a las 05:47:33
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `royale`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `body`
--

CREATE TABLE `body` (
  `body_id` int(8) NOT NULL,
  `title` varchar(75) NOT NULL,
  `align` varchar(4) NOT NULL,
  `img` varchar(50) NOT NULL,
  `url` varchar(50) NOT NULL,
  `color` varchar(10) NOT NULL,
  `color2` varchar(10) NOT NULL,
  `status` int(1) NOT NULL,
  `parfum_id_fk` int(8) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `body`
--

INSERT INTO `body` (`body_id`, `title`, `align`, `img`, `url`, `color`, `color2`, `status`, `parfum_id_fk`, `created_at`, `updated_at`) VALUES
(5, 'Messi Fragrances<br/><b>Official Lionel Messi</b>', 'auto', 'MessiParfum.jpg', '/parfum?id=6', '#477d93', '#1c5770', 1, 6, '2024-12-17 20:53:25', '2024-12-18 19:51:01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `brand`
--

CREATE TABLE `brand` (
  `brand_id` int(11) NOT NULL,
  `brand_name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `brand`
--

INSERT INTO `brand` (`brand_id`, `brand_name`, `created_at`, `updated_at`) VALUES
(1, 'Dior', '2024-12-17 20:07:14', '2024-12-17 20:07:14'),
(2, 'Cartier', '2024-12-17 20:07:14', '2024-12-17 20:07:14'),
(3, 'Paco Rabanne', '2024-12-17 20:07:14', '2024-12-17 20:07:14'),
(4, 'Givenchy', '2024-12-17 20:07:14', '2024-12-17 20:07:14'),
(5, 'Versage', '2024-12-17 20:07:14', '2024-12-17 20:07:14'),
(6, 'Messi', '2024-12-17 20:16:49', '2024-12-17 20:16:49');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `parfum`
--

CREATE TABLE `parfum` (
  `parfum_id` int(8) NOT NULL,
  `brand_id_fk` int(8) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` varchar(500) NOT NULL,
  `gender` int(1) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `parfum`
--

INSERT INTO `parfum` (`parfum_id`, `brand_id_fk`, `title`, `description`, `gender`, `created_at`, `updated_at`) VALUES
(1, 1, 'Sauvage', 'Concebido como una oda a la naturaleza, Sauvage es un acto de creación inspirado en espacios abiertos. Composiciones marcadas por una frescura bruta, que combinan poder y nobleza.', 2, '2024-12-17 19:29:59', '2024-12-17 20:07:25'),
(2, 2, 'La Panthere', 'El Panthère Parfum de Cartier es una fragancia de la familia olfativa Chipre Floral para mujeres. Esta fragancia es nueva. Panthère Parfum se lanzó en 2020. La nariz detrás de esta fragancia es Mathilde Laurent.', 1, '2024-12-17 20:01:57', '2024-12-17 20:07:30'),
(3, 3, 'Phantom', 'La luz del día se atenúa. El cielo se vuelve azul. Déjate seducir por la irresistible llamada de crepúsculo con el nuevo PHANTOM Intense de Rabanne. Más Intenso, más audaz, impulsado por tu lado más atrevido.', 2, '2024-12-17 20:01:57', '2024-12-17 20:07:35'),
(4, 4, 'Irresistible', 'Irresistible Eau de Parfum de Givenchy es una fragancia femenina que definitivamente te invita a dejarte llevar. Una fragancia floral amaderada afrutada, que juega con el contraste entre dos acordes opuestos, la exquisita rosa y la radiante madera blanca.', 1, '2024-12-17 20:02:34', '2024-12-17 20:07:39'),
(5, 5, 'Eros', 'El nuevo eau de parfum Eros, masculino y atrevido, es una fragancia sensual que fusiona notas amaderadas, orientales y frescas para crear un potente perfume que evoca a Eros, el dios del amor. «Imaginé un hombre heroico y apasionado, casi un dios griego.', 2, '2024-12-17 20:02:34', '2024-12-17 20:07:43'),
(6, 6, 'Fragrance', 'Inspired by the man who is more than just a football icon, this scent captures the essence of Messi\'s humble yet powerful persona. It is an olfactory journey that reflects the multifaceted dimensions of a legend, designed to evoke the hidden strengths and quiet confidence that resides within us all.', 2, '2024-12-17 20:19:04', '2024-12-17 20:19:04');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `types`
--

CREATE TABLE `types` (
  `types_id` int(8) NOT NULL,
  `ml` varchar(10) NOT NULL,
  `img` varchar(200) NOT NULL,
  `price` double(10,2) NOT NULL,
  `old_price` double(10,2) NOT NULL,
  `status` int(1) NOT NULL,
  `parfum_id_fk` int(8) NOT NULL,
  `version_id_fk` int(8) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `types`
--

INSERT INTO `types` (`types_id`, `ml`, `img`, `price`, `old_price`, `status`, `parfum_id_fk`, `version_id_fk`, `created_at`, `updated_at`) VALUES
(1, '50', 'Sauvage Dior.webp', 100.00, 179.99, 0, 1, 2, '2024-12-17 21:20:32', '2024-12-18 15:47:24'),
(2, '50', 'Cartier La Panthere Parfum.webp', 100.00, 159.00, 0, 2, 3, '2024-12-17 21:21:58', '2024-12-17 21:21:58'),
(3, '100', 'Cartier La Panthere Parfum.webp', 170.00, 210.00, 0, 2, 3, '2024-12-17 21:21:58', '2024-12-17 21:21:58');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `version`
--

CREATE TABLE `version` (
  `version_id` int(8) NOT NULL,
  `version_name` varchar(20) NOT NULL,
  `description` varchar(300) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `version`
--

INSERT INTO `version` (`version_id`, `version_name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Toillet', NULL, '2024-12-17 19:49:24', '2024-12-17 19:49:24'),
(2, 'Eau De Parfum', NULL, '2024-12-17 19:49:24', '2024-12-17 19:49:24'),
(3, 'Parfum', '', '2024-12-17 19:49:24', '2024-12-17 19:49:24'),
(4, 'Elixir', NULL, '2024-12-17 20:15:36', '2024-12-17 20:15:36');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `body`
--
ALTER TABLE `body`
  ADD PRIMARY KEY (`body_id`),
  ADD KEY `parfum_id_fk` (`parfum_id_fk`);

--
-- Indices de la tabla `brand`
--
ALTER TABLE `brand`
  ADD PRIMARY KEY (`brand_id`);

--
-- Indices de la tabla `parfum`
--
ALTER TABLE `parfum`
  ADD PRIMARY KEY (`parfum_id`),
  ADD KEY `brand` (`brand_id_fk`);

--
-- Indices de la tabla `types`
--
ALTER TABLE `types`
  ADD PRIMARY KEY (`types_id`),
  ADD KEY `version` (`version_id_fk`),
  ADD KEY `parfum_id_fk` (`parfum_id_fk`);

--
-- Indices de la tabla `version`
--
ALTER TABLE `version`
  ADD PRIMARY KEY (`version_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `body`
--
ALTER TABLE `body`
  MODIFY `body_id` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `brand`
--
ALTER TABLE `brand`
  MODIFY `brand_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `parfum`
--
ALTER TABLE `parfum`
  MODIFY `parfum_id` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `types`
--
ALTER TABLE `types`
  MODIFY `types_id` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `version`
--
ALTER TABLE `version`
  MODIFY `version_id` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `body`
--
ALTER TABLE `body`
  ADD CONSTRAINT `body_ibfk_1` FOREIGN KEY (`parfum_id_fk`) REFERENCES `parfum` (`parfum_id`);

--
-- Filtros para la tabla `parfum`
--
ALTER TABLE `parfum`
  ADD CONSTRAINT `parfum_ibfk_1` FOREIGN KEY (`brand_id_fk`) REFERENCES `brand` (`brand_id`);

--
-- Filtros para la tabla `types`
--
ALTER TABLE `types`
  ADD CONSTRAINT `types_ibfk_1` FOREIGN KEY (`version_id_fk`) REFERENCES `version` (`version_id`),
  ADD CONSTRAINT `types_ibfk_2` FOREIGN KEY (`parfum_id_fk`) REFERENCES `parfum` (`parfum_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
