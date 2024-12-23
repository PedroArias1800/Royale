-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 23-12-2024 a las 20:57:12
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
  `parfum_img` varchar(50) NOT NULL,
  `back_img` varchar(50) NOT NULL,
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

INSERT INTO `body` (`body_id`, `title`, `align`, `parfum_img`, `back_img`, `url`, `color`, `color2`, `status`, `parfum_id_fk`, `created_at`, `updated_at`) VALUES
(5, 'Messi Fragrances<br/><b>Official Lionel Messi</b>', 'auto', 'MessiFraganceEauDeParfumBack.png', 'MessiParfum.jpg', '/parfum?id=6', '#477d93', '#1c5770', 1, 6, '2024-12-17 20:53:25', '2024-12-19 15:24:50'),
(6, 'Radiante y alegre<br/>una invitación a <b>dejarse llevar<b/>.', '0', 'GivenchyIrresistible.png', 'GivenchyIrresistibleBack.jpg', '/parfum?id=4', '#f33886', '#d60a5f', 1, 4, '2024-12-23 06:30:13', '2024-12-23 06:30:49'),
(7, 'Fragancia para el hombre fuerte<br/>y dueño de <b>sí mismo<b/>.', 'auto', 'VersageEros.png', 'VersageErosBack.jpg', '/parfum?id=5', '#22a2ab', '#037d86', 1, 5, '2024-12-23 06:30:13', '2024-12-23 06:31:17');

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
(6, 'Messi', '2024-12-17 20:16:49', '2024-12-17 20:16:49'),
(7, 'Carolina Herrera', '2024-12-19 14:53:59', '2024-12-19 14:53:59'),
(8, 'Lancôme', '2024-12-19 14:53:59', '2024-12-19 14:53:59'),
(9, 'Giorgio Armani', '2024-12-19 14:53:59', '2024-12-19 14:53:59'),
(10, 'Yves Saint Laurent', '2024-12-19 14:53:59', '2024-12-19 14:53:59'),
(11, 'Montblanc', '2024-12-19 14:56:31', '2024-12-19 14:56:31'),
(12, 'Bharara', '2024-12-19 14:56:31', '2024-12-19 14:56:31'),
(13, 'Jean Paul Gaultier', '2024-12-19 14:56:31', '2024-12-19 14:56:31');

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
  `status` int(11) NOT NULL,
  `version_id_fk` int(8) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `parfum`
--

INSERT INTO `parfum` (`parfum_id`, `brand_id_fk`, `title`, `description`, `gender`, `status`, `version_id_fk`, `created_at`, `updated_at`) VALUES
(1, 1, 'Sauvage', 'Concebido como una oda a la naturaleza, Sauvage es un acto de creación inspirado en espacios abiertos. Composiciones marcadas por una frescura bruta, que combinan poder y nobleza.', 2, 1, 2, '2024-12-17 19:29:59', '2024-12-23 02:49:38'),
(2, 2, 'La Panthere', 'El Panthère Parfum de Cartier es una fragancia de la familia olfativa Chipre Floral para mujeres. Esta fragancia es nueva. Panthère Parfum se lanzó en 2020. La nariz detrás de esta fragancia es Mathilde Laurent.', 1, 1, 3, '2024-12-17 20:01:57', '2024-12-23 02:50:36'),
(3, 3, 'Phantom', 'La luz del día se atenúa. El cielo se vuelve azul. Déjate seducir por la irresistible llamada de crepúsculo con el nuevo PHANTOM Intense de Rabanne. Más Intenso, más audaz, impulsado por tu lado más atrevido.', 2, 0, 2, '2024-12-17 20:01:57', '2024-12-23 03:03:58'),
(4, 4, 'Irresistible', 'Irresistible Eau de Parfum de Givenchy es una fragancia femenina que definitivamente te invita a dejarte llevar. Una fragancia floral amaderada afrutada, que juega con el contraste entre dos acordes opuestos, la exquisita rosa y la radiante madera blanca.', 1, 0, 2, '2024-12-17 20:02:34', '2024-12-23 03:03:38'),
(5, 5, 'Eros', 'El nuevo eau de parfum Eros, masculino y atrevido, es una fragancia sensual que fusiona notas amaderadas, orientales y frescas para crear un potente perfume que evoca a Eros, el dios del amor. «Imaginé un hombre heroico y apasionado, casi un dios griego.', 2, 0, 2, '2024-12-17 20:02:34', '2024-12-23 03:04:01'),
(6, 6, 'Fragrance', 'Inspired by the man who is more than just a football icon, this scent captures the essence of Messi\'s humble yet powerful persona. It is an olfactory journey that reflects the multifaceted dimensions of a legend, designed to evoke the hidden strengths and quiet confidence that resides within us all.', 2, 1, 2, '2024-12-17 20:19:04', '2024-12-23 02:51:01'),
(7, 7, 'Good Girl', 'Good Girl de Carolina Herrera es una fragancia de la familia olfativa Oriental Floral para Mujeres. Las Notas de Salida son almendra, café, bergamota y limón (lima ácida); las Notas de Corazón son nardos, jazmín sambac (sampaguita), flor de azahar del naranjo, rosa de Bulgaria (rosa Damascena de Bulgaria) y raíz de lirio; las Notas de Fondo son haba tonka, cacao, vainilla, praliné, sándalo, almizcle, ámbar, madera de cachemira, pachulí, canela y cedro.', 1, 1, 2, '2024-12-19 15:33:45', '2024-12-23 02:50:55'),
(8, 1, 'Miss Dior', 'La nueva Eau de toilette Miss Dior es un torbellino floral embriagador y refrescante. Un vals desenfrenado alrededor de la rosa de Grasse y un velo de muguete tan ligero como una falda de tul. Una Miss Dior radiante que se lanza de lleno en un torbellino sin fin de vida y amor.', 1, 1, 5, '2024-12-19 15:51:11', '2024-12-23 02:51:05'),
(9, 5, 'Dylan Purple', 'Dylan Purple es una fragancia brillante y elegante. una bergamota chispeante se mezcla con los tonos alegres de una naranja recién cosechada, mientras que los delicados aromas de la fresia brindan una explosión de color púrpura brillante.', 1, 1, 2, '2024-12-19 15:57:12', '2024-12-23 02:51:07'),
(10, 10, 'Mon Paris', 'Mon Paris Eau de Parfum es una fragancia floral y dulce para mujeres que captura la esencia romántica de París. Las notas de bayas rojas dulces se combinan con la flor de datura, ancladas por la calidez del almizcle blanco y el pachulí.', 1, 1, 2, '2024-12-23 04:43:32', '2024-12-23 04:43:32'),
(11, 10, 'Libre', 'Vive según tus propias reglas con esta audaz fragancia femenina. La esencia de lavanda de Francia se entrelaza con la sensualidad del azahar de Marruecos y un atrevido acorde de almizcle para una experiencia única.', 1, 1, 2, '2024-12-23 04:47:09', '2024-12-23 04:47:09'),
(12, 8, 'La Vie est belle', 'La Vie Est Belle es un eau de parfum que celebra la feminidad y la felicidad con ingredientes naturales preciosos como iris, pachulí, praliné y vainilla, creando una fragancia cálida y especiada con un toque gourmand.', 1, 1, 2, '2024-12-23 04:52:32', '2024-12-23 04:52:32'),
(13, 9, 'My Way', 'My Way Parfum es una fragancia femenina que combina ingredientes de origen consciente de todo el mundo en una mezcla de notas amaderadas y florales. La fragancia se inicia con bergamota y azahar egipcio, seguidos de nardo indio y jazmín.', 1, 1, 2, '2024-12-23 04:59:27', '2024-12-23 04:59:27'),
(14, 8, 'Idôle Nectar', 'Una fragancia vibrante y sofisticada para mujeres. Combina notas de pera, rosa, jazmín, rosa turca, rosa de mayo, almizcle y vainilla para crear un aroma floral y afrutado con un toque de frescura y sensualidad.', 1, 1, 2, '2024-12-23 05:03:40', '2024-12-23 05:03:40'),
(15, 7, 'Very Good Girl Glam', 'Creada por Quentin Bisch, Louise Turner y Shyamala Maisondieu. Las Notas de Salida son cereza ácida (guinda) y almendra amarga; las Notas de Corazón son rosa y azucena; las Notas de Fondo son vainilla Bourbon y vetiver.', 1, 1, 3, '2024-12-23 05:06:22', '2024-12-23 05:25:18'),
(16, 8, 'La Vie est belle Soleil Cristal', 'Creada por Dominique Ropion y Nicolas Beaulieu. Las Notas de Salida son mandarina, pimienta rosa y bergamota; las Notas de Corazón son ylang-ylang, iris, flor de azahar del naranjo y jazmín; las Notas de Fondo son coco, vainilla y pachulí.', 1, 1, 2, '2024-12-23 05:10:27', '2024-12-23 05:10:27'),
(17, 13, 'Le beau le parfum ', 'La Nariz detrás de esta fragrancia es Quentin Bisch. Las Notas de Salida son piña, iris, ciprés y jengibre; las Notas de Corazón son coco y notas amaderadas; las Notas de Fondo son haba tonka, sándalo, ámbar y ámbar gris.', 2, 1, 2, '2024-12-23 05:38:40', '2024-12-23 05:38:40'),
(18, 10, 'Y', 'Y Eau de Parfum es una interpretación seductora de la icónica camiseta blanca y chaqueta negra de Yves Saint Laurent. Pertenece a la familia de fragancias terrosas y amaderadas, con un aroma que combina cítricos y maderas.', 2, 1, 2, '2024-12-23 05:41:52', '2024-12-23 05:41:52'),
(19, 1, 'Homme', 'Esta Eau de Toilette de Dior para hombre, embriaga con su fuerza y cautiva con su frescura. Dior Homme refleja una masculinidad intensamente amaderada que envuelve y viste, dejando una huella duradera, repleta de fuerza y delicadeza.', 2, 1, 3, '2024-12-23 05:47:51', '2024-12-23 05:47:51'),
(20, 11, 'Legend Blue', 'Esta fragancia aromática amaderada fresca se abre con un acorde aromático de menta verde y lavanda, luego revela un corazón amaderado de cedro y sándalo. Con carisma y atractivo atemporales, Zinédine Zidane regresa como el rostro de Legend Blue.', 2, 1, 2, '2024-12-23 05:51:10', '2024-12-23 05:51:10'),
(21, 12, 'King', 'King de Bharara es una fragancia de la familia olfativa Aromática para Hombres. King se lanzó en 2021. Las Notas de Salida son naranja, limón (lima ácida) y bergamota; la Nota de Corazón es notas afrutadas; las Notas de Fondo son vainilla, almizcle blanco y ámbar.', 2, 1, 2, '2024-12-23 05:54:52', '2024-12-23 05:54:52'),
(22, 5, 'Dylan Blue', 'Dylan Blue es una fragancia que cautiva los aromas sensuales del Mediterráneo. Sus notas amaderadas envocan, mientras que exquisitos cítricos, desprenden modernidad. Las notas acuáticas aportan un vigorizante frescor.', 2, 1, 5, '2024-12-23 05:58:21', '2024-12-23 05:58:21'),
(23, 3, 'Phantom', 'Esta alucinante fragancia nació del atrevido encuentro de un energizante destello verde de limón y vetiver con una irresistible lavanda cremosa y vainilla amaderada.', 2, 1, 5, '2024-12-23 06:04:19', '2024-12-23 06:04:19'),
(24, 3, 'One Million', 'Para una nueva generación masculina, aquel hombre que no teme lo extremo, confidente y poderoso, exitoso y excesivo, un hombre poderoso. El hombre que todos los demás hombres sueñan en convertirse, no es un hombre en un millón, es único y también lo es su perfume.', 2, 1, 5, '2024-12-23 06:08:33', '2024-12-23 06:08:33');

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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `types`
--

INSERT INTO `types` (`types_id`, `ml`, `img`, `price`, `old_price`, `status`, `parfum_id_fk`, `created_at`, `updated_at`) VALUES
(1, '60', 'Sauvage Dior.webp', 127.99, 157.99, 0, 1, '2024-12-17 21:20:32', '2024-12-23 05:29:22'),
(2, '50', 'Cartier La Panthere Parfum.webp', 100.00, 159.00, 0, 2, '2024-12-17 21:21:58', '2024-12-17 21:21:58'),
(3, '100', 'Cartier La Panthere Parfum.webp', 170.00, 210.00, 0, 2, '2024-12-17 21:21:58', '2024-12-17 21:21:58'),
(4, '100', 'MessiFraganceEauDeParfum.jpg', 70.00, 100.00, 1, 6, '2024-12-19 15:14:49', '2024-12-19 15:15:25'),
(5, '100', 'Carolina Herrera Good Girl.webp', 55.00, 85.00, 1, 7, '2024-12-19 15:45:58', '2024-12-19 15:45:58'),
(6, '100', 'Dior Miss Dior.webp', 110.99, 147.99, 1, 8, '2024-12-19 15:51:49', '2024-12-19 15:51:49'),
(7, '50', 'Versace Dylan purple.webp', 60.00, 95.00, 1, 9, '2024-12-19 15:58:07', '2024-12-19 15:58:07'),
(8, '90', 'Yves Saint Laurent Mon Paris 90ml.webp', 125.00, 151.00, 1, 10, '2024-12-23 04:45:05', '2024-12-23 04:45:05'),
(9, '90', 'Yves Saint Laurent Libre 90-50ml.webp', 135.00, 151.00, 1, 11, '2024-12-23 04:48:23', '2024-12-23 04:49:16'),
(10, '50', 'Yves Saint Laurent Libre 90-50ml.webp', 95.00, 116.00, 1, 11, '2024-12-23 04:48:23', '2024-12-23 04:49:26'),
(11, '100', 'La Vie Est Belle Lancome 100ml.webp', 120.00, 150.00, 1, 12, '2024-12-23 04:54:43', '2024-12-23 05:26:55'),
(12, '50', 'La Vie Est Belle Lancome 50ml.webp', 85.00, 115.00, 1, 12, '2024-12-23 04:54:43', '2024-12-23 04:54:43'),
(13, '90', 'Giorgio Armani My Way 90-50ml.webp', 125.00, 150.00, 1, 13, '2024-12-23 05:00:47', '2024-12-23 05:00:47'),
(14, '50', 'Giorgio Armani My Way 90-50ml.webp', 90.00, 110.00, 1, 13, '2024-12-23 05:00:47', '2024-12-23 05:00:47'),
(15, '100', 'Lancôme Idôle Nectar.webp', 125.00, 149.99, 1, 14, '2024-12-23 05:04:21', '2024-12-23 05:27:17'),
(16, '100', 'Carolina Herrera Very Good Girl Glam Parfum 100ml.webp', 119.99, 139.99, 1, 15, '2024-12-23 05:08:15', '2024-12-23 05:26:15'),
(17, '100', 'La Vie est belle Soleil Cristal.jpg', 125.00, 150.00, 1, 16, '2024-12-23 05:11:42', '2024-12-23 05:26:26'),
(18, '100', 'Sauvage Dior.webp', 149.99, 189.99, 1, 1, '2024-12-23 05:30:33', '2024-12-23 05:30:33'),
(19, '200', 'Sauvage Dior.webp', 210.99, 262.99, 1, 1, '2024-12-23 05:30:33', '2024-12-23 05:30:33'),
(20, '200', 'Versage Eros Eau de Parfum.webp', 119.99, 135.00, 1, 5, '2024-12-23 05:35:38', '2024-12-23 05:35:38'),
(21, '100', 'Versage Eros Eau de Parfum.webp', 89.99, 102.00, 1, 5, '2024-12-23 05:36:29', '2024-12-23 05:36:29'),
(22, '50', 'Versage Eros Eau de Parfum.webp', 60.00, 80.00, 1, 5, '2024-12-23 05:36:57', '2024-12-23 05:36:57'),
(23, '75', 'Jean Paul Gaultier le beau le parfum.webp', 109.00, 129.00, 1, 17, '2024-12-23 05:39:55', '2024-12-23 05:39:55'),
(24, '100', 'Jean Paul Gaultier le beau le parfum.webp', 116.99, 139.99, 1, 17, '2024-12-23 05:40:21', '2024-12-23 05:40:21'),
(25, '60', 'Yves Saint Laurent Y Eau de Parfum 60ml.webp', 99.99, 120.00, 1, 18, '2024-12-23 05:42:59', '2024-12-23 05:44:20'),
(27, '100', 'Yves Saint Laurent Y Eau de Parfum 100ml.webp', 131.99, 157.99, 1, 18, '2024-12-23 05:45:55', '2024-12-23 05:46:26'),
(28, '50', 'Dior Homme Parfum.webp', 82.99, 100.00, 1, 19, '2024-12-23 05:49:27', '2024-12-23 05:49:27'),
(29, '100', 'Dior Homme Parfum.webp', 109.99, 126.00, 1, 19, '2024-12-23 05:49:27', '2024-12-23 05:49:27'),
(30, '200', 'Dior Homme Parfum.webp', 129.99, 163.00, 1, 19, '2024-12-23 05:49:27', '2024-12-23 05:49:27'),
(31, '60', 'Montblanc Legend Blue.webp', 60.00, 83.00, 1, 20, '2024-12-23 05:52:12', '2024-12-23 05:52:12'),
(32, '100', 'Montblanc Legend Blue.webp', 80.00, 106.00, 1, 20, '2024-12-23 05:52:12', '2024-12-23 05:52:12'),
(33, '100', 'Bharara King.webp', 49.99, 62.00, 1, 21, '2024-12-23 05:55:35', '2024-12-23 05:55:35'),
(34, '50', 'Versace Dylan Blue.webp', 60.00, 72.00, 1, 22, '2024-12-23 06:00:35', '2024-12-23 06:00:35'),
(35, '100', 'Versace Dylan Blue 100-200ml.jpg', 75.00, 92.00, 1, 22, '2024-12-23 06:00:35', '2024-12-23 06:00:35'),
(36, '200', 'Versace Dylan Blue 100-200ml.jpg', 99.99, 122.00, 1, 22, '2024-12-23 06:00:35', '2024-12-23 06:01:03'),
(37, '50', 'Paco Rabanne Phantom.png', 59.99, 83.00, 1, 23, '2024-12-23 06:06:22', '2024-12-23 06:06:22'),
(38, '100', 'Paco Rabanne Phantom.png', 93.99, 108.99, 1, 23, '2024-12-23 06:06:22', '2024-12-23 06:06:22'),
(39, '50', 'Paco Rabanne One Million Eau de Toilette 50ml.webp', 75.00, 89.99, 1, 24, '2024-12-23 06:09:48', '2024-12-23 06:09:48'),
(40, '100', 'Paco Rabanne One Million Parfum 100ml.jpg', 105.99, 117.99, 1, 24, '2024-12-23 06:09:48', '2024-12-23 06:09:48'),
(41, '80', 'Givenchy Irresistible.webp', 129.99, 150.00, 1, 4, '2024-12-23 16:55:48', '2024-12-23 16:55:48'),
(42, '50', 'Givenchy Irresistible.webp', 95.00, 117.00, 1, 4, '2024-12-23 16:55:48', '2024-12-23 16:55:48');

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
(2, 'Eau De Parfum', 'Intensidad y elegancia en cada gota. Una fragancia duradera que envuelve tu piel con notas profundas y sofisticadas, ideal para destacar en ocasiones especiales o noches inolvidables.', '2024-12-17 19:49:24', '2024-12-19 15:02:01'),
(3, 'Parfum', 'La esencia pura del lujo. Con una concentración excepcional, esta fragancia se adhiere a tu piel, ofreciendo una experiencia olfativa intensa y prolongada que te hará inolvidable.', '2024-12-17 19:49:24', '2024-12-19 15:02:15'),
(4, 'Elixir', 'Una joya de alta perfumería. La máxima expresión de intensidad y refinamiento, diseñada para quienes buscan un aroma exclusivo y audaz que deja una huella inconfundible.', '2024-12-17 20:15:36', '2024-12-19 15:02:27'),
(5, 'Eau de Toilette', 'Frescura en su máxima expresión. Una fragancia ligera y vibrante que realza tu personalidad con un toque sutil, perfecta para el día a día y momentos llenos de energía.', '2024-12-19 15:50:35', '2024-12-21 03:01:43');

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
  ADD KEY `brand` (`brand_id_fk`),
  ADD KEY `version_id_fk` (`version_id_fk`);

--
-- Indices de la tabla `types`
--
ALTER TABLE `types`
  ADD PRIMARY KEY (`types_id`),
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
  MODIFY `body_id` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `brand`
--
ALTER TABLE `brand`
  MODIFY `brand_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `parfum`
--
ALTER TABLE `parfum`
  MODIFY `parfum_id` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de la tabla `types`
--
ALTER TABLE `types`
  MODIFY `types_id` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT de la tabla `version`
--
ALTER TABLE `version`
  MODIFY `version_id` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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
  ADD CONSTRAINT `parfum_ibfk_1` FOREIGN KEY (`brand_id_fk`) REFERENCES `brand` (`brand_id`),
  ADD CONSTRAINT `parfum_ibfk_2` FOREIGN KEY (`version_id_fk`) REFERENCES `version` (`version_id`);

--
-- Filtros para la tabla `types`
--
ALTER TABLE `types`
  ADD CONSTRAINT `types_ibfk_2` FOREIGN KEY (`parfum_id_fk`) REFERENCES `parfum` (`parfum_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
