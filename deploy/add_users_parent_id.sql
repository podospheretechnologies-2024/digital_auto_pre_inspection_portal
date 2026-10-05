-- RO → Surveyor hierarchy link
-- mysql -u adminpanel -p pre_inspection < deploy/add_users_parent_id.sql

USE `pre_inspection`;

ALTER TABLE `users`
  ADD COLUMN `parent_id` int(11) DEFAULT NULL AFTER `city_id`;

ALTER TABLE `users`
  ADD KEY `idx_users_parent_id` (`parent_id`);
