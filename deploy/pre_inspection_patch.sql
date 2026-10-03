-- Patch live pre_inspection DB after bootstrap import
-- mysql -u adminpanel -p pre_inspection < deploy/pre_inspection_patch.sql

USE `pre_inspection`;

-- Jobs hold flag used by Next assign flow (ignore error if column already exists)
ALTER TABLE `tbl_jobs`
  ADD COLUMN `on_hold` tinyint(4) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS `user_infos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `language` varchar(50) DEFAULT NULL,
  `timezone` varchar(100) DEFAULT NULL,
  `currency` varchar(20) DEFAULT NULL,
  `marketing` tinyint(4) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_infos_user_id_key` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS `user_api_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `permission` varchar(255) NOT NULL,
  `request_data` varchar(255) DEFAULT NULL,
  `is_success` tinyint(4) NOT NULL DEFAULT 0,
  `message` text DEFAULT NULL,
  `request_date` date DEFAULT NULL,
  `created_ip` varchar(45) DEFAULT NULL,
  `updated_ip` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS `vrn_and_mobile_numbers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vehicle_registration_number` varchar(50) DEFAULT NULL,
  `mobile_number` varchar(50) DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vrn` (`vehicle_registration_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Optional API columns on users (safe if already present — ignore errors)
-- ALTER TABLE `users` ADD COLUMN `access_token` varchar(255) DEFAULT NULL;
-- ALTER TABLE `users` ADD COLUMN `permissions` text DEFAULT NULL;
