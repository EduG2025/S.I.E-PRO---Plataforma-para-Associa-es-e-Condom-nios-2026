-- ---------------------------------------------------------
-- S.I.E PRO - MASTER DATABASE SCHEMA V245.0
-- ---------------------------------------------------------

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- [TABELAS EXISTENTES OMITIDAS PARA BREVIDADE NO XML - ASSUMIDAS COMO PRESENTES]

-- 13. CONTROLE DE VEÍCULOS
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `plate` VARCHAR(20) NOT NULL UNIQUE,
  `brand` VARCHAR(50),
  `model` VARCHAR(100),
  `color` VARCHAR(30),
  `unit` VARCHAR(50),
  `type` ENUM('CAR', 'MOTORCYCLE', 'TRUCK', 'OTHER') DEFAULT 'CAR',
  `status` ENUM('AUTHORIZED', 'BLOCKED', 'VISITOR') DEFAULT 'AUTHORIZED',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_vehicle_plate` (`plate`),
  INDEX `idx_vehicle_unit` (`unit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. LOG DE ACESSO (MOVIMENTAÇÃO PERIMETRAL)
CREATE TABLE IF NOT EXISTS `access_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `visitor_id` INT,
  `direction` ENUM('IN', 'OUT') NOT NULL,
  `method` ENUM('FACE_ID', 'TAG', 'APP', 'MANUAL') DEFAULT 'MANUAL',
  `point` VARCHAR(100) DEFAULT 'PORTARIA PRINCIPAL',
  `photo_url` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_access_user` (`user_id`),
  INDEX `idx_access_date` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;