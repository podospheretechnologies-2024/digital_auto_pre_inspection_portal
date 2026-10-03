const fs = require("fs");

const schema = fs.readFileSync("deploy/pre_inspection_schema.sql", "utf8");
const jobs = fs.readFileSync("scripts/extracted-tables.sql", "utf8");

const wideTables = new Set([
  "tbl_2wheeler",
  "tbl_3wheeler",
  "tbl_4wheeler",
  "tbl_valuation_2wheeler",
  "tbl_valuation_3wheeler",
  "tbl_valuation_4wheeler",
  "tbl_office",
]);

let jobsFixed = jobs.replace(
  /CREATE TABLE `([^`]+)` \(([\s\S]*?)\) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;/g,
  (_match, table, body) => {
    let b = body.replace(
      /^\s*`id` int\(11\) NOT NULL,/m,
      "  `id` int(11) NOT NULL AUTO_INCREMENT,",
    );
    // Avoid MySQL #1118 row size too large on wide inspection tables.
    // TEXT cannot keep non-NULL string defaults (error #1101).
    if (wideTables.has(table)) {
      b = b.replace(/varchar\(\d+\)/gi, "TEXT");
      b = b.replace(/TEXT DEFAULT '[^']*'/gi, "TEXT");
    }
    if (!/PRIMARY KEY/i.test(b)) {
      b = `${b.trimEnd()},\n  PRIMARY KEY (\`id\`)`;
    }
    return `CREATE TABLE IF NOT EXISTS \`${table}\` (\n${b}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;`;
  },
);

const images = `
-- PI gallery + permissions tables
CREATE TABLE IF NOT EXISTS \`tbl_2wheeler_images\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`parent_id\` int(11) DEFAULT NULL,
  \`image\` mediumtext DEFAULT NULL,
  \`created_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_2w_parent\` (\`parent_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS \`tbl_3wheeler_images\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`parent_id\` int(11) DEFAULT NULL,
  \`image\` mediumtext DEFAULT NULL,
  \`s3_url\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NULL DEFAULT NULL,
  \`updated_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_3w_parent\` (\`parent_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS \`tbl_4wheeler_images\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`parent_id\` int(11) DEFAULT NULL,
  \`image\` mediumtext DEFAULT NULL,
  \`s3_url\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NULL DEFAULT NULL,
  \`updated_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_4w_parent\` (\`parent_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS \`user_permissions\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) NOT NULL,
  \`permission\` varchar(255) NOT NULL,
  \`is_deleted\` tinyint(4) NOT NULL DEFAULT 0,
  \`created_at\` timestamp NULL DEFAULT NULL,
  \`updated_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_user_permissions_user\` (\`user_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
`;

const seed = `
-- Demo admin: demo@demo.com / demo
INSERT IGNORE INTO \`users\` (
  \`first_name\`, \`last_name\`, \`email\`, \`password\`,
  \`type\`, \`is_admin\`, \`status\`, \`is_deleted\`, \`verified_at\`, \`created_at\`, \`updated_at\`
) VALUES (
  'Demo', 'Admin', 'demo@demo.com',
  '$2b$10$.5Xb.vSCP9qlkKJ9sMEFquUsudS6SUcCGzzKcjsO7706dJP2sA79i',
  '', 1, 'Active', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT IGNORE INTO \`m_city\` (\`id\`, \`name\`, \`created_at\`, \`updated_at\`)
VALUES (1, 'Mumbai', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT IGNORE INTO \`m_bank\` (\`id\`, \`name\`, \`contact_person\`, \`phone\`, \`emailid\`, \`pincode\`, \`ifsc\`, \`created_at\`, \`updated_at\`)
VALUES (1, 'Demo Bank', 'Contact', '9999999999', 'bank@demo.com', '400001', 'DEMO0000001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT IGNORE INTO \`m_company\` (\`id\`, \`name\`, \`created_at\`, \`updated_at\`)
VALUES (1, 'Demo Company', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT IGNORE INTO \`m_model\` (\`id\`, \`company_id\`, \`name\`, \`created_at\`, \`updated_at\`)
VALUES (1, 1, 'Demo Model', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT IGNORE INTO \`m_variant\` (\`id\`, \`company_id\`, \`model_id\`, \`name\`, \`vehicle_type\`, \`created_at\`, \`updated_at\`)
VALUES (1, 1, 1, 'Demo Variant', '2wheeler', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT IGNORE INTO \`fin_year\` (\`id\`, \`fsession\`, \`ffrom\`, \`fto\`)
VALUES (1, '2025-26', '2025-04-01', '2026-03-31');
`;

let schemaFixed = schema
  .replace(/CREATE TABLE `/g, "CREATE TABLE IF NOT EXISTS `")
  .replace(
    /\) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;/g,
    ") DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;",
  );

for (const t of [
  "m_bank",
  "m_broker",
  "m_city",
  "m_company",
  "m_model",
  "m_variant",
  "fin_year",
  "menus",
]) {
  const re = new RegExp(
    `CREATE TABLE IF NOT EXISTS \`${t}\` \\(([\\s\\S]*?)\\) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
  );
  schemaFixed = schemaFixed.replace(re, (m, body) => {
    if (/PRIMARY KEY/.test(body)) return m;
    return `CREATE TABLE IF NOT EXISTS \`${t}\` (${body.trimEnd()},\n    PRIMARY KEY (\`id\`)\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;
  });
}

const header = `-- pre_inspection bootstrap for digital_auto_pre_inspection_portal
-- Import into empty database: pre_inspection
-- phpMyAdmin: select DB pre_inspection -> Import -> choose this file
-- CLI: mysql -u root -p pre_inspection < deploy/pre_inspection_import.sql
--
-- Demo login after import: demo@demo.com / demo
-- For full production data, copy from digitalauto_db_digitalauto instead.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SESSION innodb_strict_mode = 0;
USE \`pre_inspection\`;

`;

const out =
  header +
  "\n-- ===== CORE SCHEMA (from Prisma) =====\n" +
  schemaFixed +
  "\n-- ===== PI JOB / WHEELER TABLES =====\n" +
  jobsFixed +
  "\n" +
  images +
  "\n-- ===== SEED =====\n" +
  seed +
  "\nSET FOREIGN_KEY_CHECKS = 1;\n";

fs.writeFileSync("deploy/pre_inspection_import.sql", out);
console.log(
  "Wrote deploy/pre_inspection_import.sql",
  "bytes=",
  out.length,
  "lines=",
  out.split("\n").length,
);
