SELECT id, first_name, last_name, type, city_id FROM users WHERE is_deleted = 0 AND type IN ('RO','Surveyor') ORDER BY type, city_id, first_name LIMIT 80;
