
-- ---------------------------------------------------------
-- S.I.E PRO - MASTER DATABASE SCHEMA V252.0
-- PROTOCOLO SRE: SOBERANIA DE DADOS & RESILIÊNCIA
-- ---------------------------------------------------------

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. NÚCLEO DE CONFIGURAÇÃO (CORE)
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT PRIMARY KEY,
  `name` VARCHAR(255) DEFAULT 'S.I.E PRO - SISTEMA INTELIGENTE ATIVO',
  `shortName` VARCHAR(50) DEFAULT 'S.I.E PRO',
  `cnpj` VARCHAR(50),
  `logoUrl` LONGTEXT,
  `primaryColor` VARCHAR(20) DEFAULT '#4f46e5',
  `email` VARCHAR(255),
  `phone` VARCHAR(20),
  `website` VARCHAR(255),
  `cep` VARCHAR(10),
  `street` VARCHAR(255),
  `number` VARCHAR(20),
  `complement` VARCHAR(255),
  `neighborhood` VARCHAR(255),
  `city` VARCHAR(255),
  `state` VARCHAR(2),
  `coordinates` JSON,
  `president_name` VARCHAR(255),
  `president_cpf` VARCHAR(20),
  `management_start` DATE,
  `management_end` DATE,
  `president_signature` LONGTEXT,
  `whatsapp_config` JSON,
  `module_metadata` JSON,
  `dictionary` JSON,
  `context_rules` TEXT,
  `license_status` ENUM('ACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. IDENTIDADE E SEGURANÇA (RBAC)
CREATE TABLE IF NOT EXISTS `roles` (
  `id` VARCHAR(50) PRIMARY KEY,
  `label` VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role` VARCHAR(50),
  `permission_id` VARCHAR(100),
  PRIMARY KEY (`role`, `permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `username` VARCHAR(100) UNIQUE,
  `cpf_cnpj` VARCHAR(20) UNIQUE,
  `email` VARCHAR(255),
  `password_hash` VARCHAR(255),
  `role` VARCHAR(50) DEFAULT 'RESIDENT',
  `status` VARCHAR(20) DEFAULT 'PENDING',
  `active` TINYINT(1) DEFAULT 1,
  `unit` VARCHAR(50),
  `age` INT,
  `birth_date` DATE,
  `rg` VARCHAR(20),
  `issuing_authority` VARCHAR(50),
  `gender` VARCHAR(20),
  `nationality` VARCHAR(50) DEFAULT 'Brasileira',
  `phone` VARCHAR(20),
  `whatsapp` VARCHAR(20),
  `preferred_channel` VARCHAR(20) DEFAULT 'WHATSAPP',
  `avatar_url` LONGTEXT,
  `profession` VARCHAR(100),
  `voting_rights` TINYINT(1) DEFAULT 1,
  `resident_type` VARCHAR(50) DEFAULT 'TITULAR',
  `socialData` JSON,
  `coordinates` JSON,
  `cep` VARCHAR(10),
  `street` VARCHAR(255),
  `number` VARCHAR(20),
  `complement` VARCHAR(255),
  `neighborhood` VARCHAR(255),
  `city` VARCHAR(255),
  `state` VARCHAR(2),
  `parent_id` INT,
  `created_by` INT,
  `last_login` DATETIME,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_cpf` (`cpf_cnpj`),
  INDEX `idx_users_unit` (`unit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.1 TEMPLATES DE IDENTIDADE (NOVO)
CREATE TABLE IF NOT EXISTS `id_card_templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `layout_front` JSON,
  `layout_back` JSON,
  `is_active` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. INTELIGÊNCIA ARTIFICIAL (NEURAL CORE)
CREATE TABLE IF NOT EXISTS `ai_keys` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `label` VARCHAR(100),
  `key_value` VARCHAR(255),
  `provider` VARCHAR(50) DEFAULT 'GOOGLE',
  `model` VARCHAR(100) DEFAULT 'gemini-3-flash-preview',
  `tier` VARCHAR(20) DEFAULT 'FREE',
  `status` VARCHAR(20) DEFAULT 'active',
  `priority` INT DEFAULT 1,
  `error_count` INT DEFAULT 0,
  `last_checked` DATETIME,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_prompts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255),
  `content` LONGTEXT,
  `category` VARCHAR(50) DEFAULT 'GERAL',
  `role_restriction` VARCHAR(50) DEFAULT 'ALL',
  `is_favorite` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. FINANCEIRO E PLANOS (LEDGER)
CREATE TABLE IF NOT EXISTS `plans` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10, 2) NOT NULL,
  `billing_cycle` ENUM('monthly', 'quarterly', 'yearly') DEFAULT 'monthly',
  `active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `plan_id` INT NOT NULL,
  `status` ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  `start_date` DATE NOT NULL,
  `last_billing_date` DATE,
  `next_billing_date` DATE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sub_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. OPERAÇÕES E SEGURANÇA (WATCHDOG)
CREATE TABLE IF NOT EXISTS `incidents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `title` VARCHAR(255),
  `location` VARCHAR(255),
  `priority` VARCHAR(50),
  `status` VARCHAR(20) DEFAULT 'OPEN',
  `description` TEXT,
  `coordinates` JSON,
  `radius` DECIMAL(5,2) DEFAULT 0,
  `reporter_name` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cameras` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100),
  `url` TEXT,
  `location` VARCHAR(255),
  `status` VARCHAR(20) DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. COMUNICAÇÃO E MENSAGERIA
CREATE TABLE IF NOT EXISTS `message_templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_trigger` VARCHAR(50),
  `name` VARCHAR(100),
  `content` TEXT,
  `is_active` TINYINT(1) DEFAULT 1,
  `media_url` TEXT,
  `media_type` VARCHAR(20) DEFAULT 'image',
  `buttons` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `scheduled_broadcasts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `target_type` VARCHAR(20),
  `target_value` VARCHAR(255),
  `message_body` TEXT,
  `template_id` INT,
  `scheduled_at` DATETIME,
  `status` VARCHAR(20) DEFAULT 'PENDING',
  `error_log` TEXT,
  `sent_at` DATETIME,
  `campaign_id` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. AUDITORIA
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `action` VARCHAR(50),
  `table_name` VARCHAR(50),
  `record_id` INT,
  `details` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
