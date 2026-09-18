-- Database Schema for Lunchbox Delivery & Rider Route Optimization Project
-- Location: Mahasarakham University (MSU Khamriang)

CREATE DATABASE IF NOT EXISTS `lunchbox_delivery` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `lunchbox_delivery`;

-- 1. ตารางลูกค้า (Customers Table)
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `firstName` VARCHAR(100) NOT NULL,
  `lastName` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL UNIQUE,
  `address` TEXT NOT NULL,
  `latitude` DECIMAL(10, 7) NOT NULL,
  `longitude` DECIMAL(10, 7) NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_phone` (`phone`),
  INDEX `idx_name` (`firstName`, `lastName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. ตารางไรเดอร์ (Riders Table)
DROP TABLE IF EXISTS `riders`;
CREATE TABLE `riders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `maxCapacity` INT DEFAULT 10, -- ข้อจำกัดเหล็ก: ไม่เกิน 10 กล่องต่อคัน
  `color` VARCHAR(20) DEFAULT '#EF4444',
  `status` ENUM('available', 'delivering', 'off_duty') DEFAULT 'available',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. ตารางรายการสั่งซื้อ (Orders Table)
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customerId` INT NOT NULL,
  `boxCount` INT NOT NULL CHECK (`boxCount` > 0 AND `boxCount` <= 3), -- ออเดอร์ละไม่เกิน 3 กล่อง
  `orderTime` TIME NOT NULL DEFAULT '10:30:00',
  `deliveryDeadline` TIME NOT NULL DEFAULT '12:30:00',
  `status` ENUM('pending', 'assigned', 'in_transit', 'delivered', 'cancelled') DEFAULT 'pending',
  `note` TEXT NULL,
  `assignedRiderId` INT NULL,
  `deliveredAt` TIMESTAMP NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_orders_rider` FOREIGN KEY (`assignedRiderId`) REFERENCES `riders` (`id`) ON DELETE SET NULL,
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. ตารางแผนการจัดเส้นทาง (Dispatch Routes)
DROP TABLE IF EXISTS `dispatch_routes`;
CREATE TABLE `dispatch_routes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `riderId` INT NOT NULL,
  `dispatchDate` DATE NOT NULL,
  `totalBoxes` INT NOT NULL,
  `totalDistanceKm` DECIMAL(6, 2) NOT NULL,
  `estimatedDurationMinutes` INT NOT NULL,
  `status` ENUM('planned', 'in_progress', 'completed') DEFAULT 'planned',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_route_rider` FOREIGN KEY (`riderId`) REFERENCES `riders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. ตารางลำดับจุดจอดส่งของ (Route Stops)
DROP TABLE IF EXISTS `route_stops`;
CREATE TABLE `route_stops` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `routeId` INT NOT NULL,
  `orderId` INT NULL,
  `stopOrder` INT NOT NULL,
  `stopType` ENUM('pickup', 'delivery', 'return') NOT NULL,
  `estimatedArrival` TIME NULL,
  `distanceFromPrevKm` DECIMAL(6, 2) DEFAULT 0,
  `status` ENUM('pending', 'delivered') DEFAULT 'pending',
  CONSTRAINT `fk_stop_route` FOREIGN KEY (`routeId`) REFERENCES `dispatch_routes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_stop_order` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
