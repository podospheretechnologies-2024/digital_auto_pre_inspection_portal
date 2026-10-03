/**
 * Un-ignore Prisma models used by the Next app, add PKs, merge jobs models.
 */
const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
const jobsPath = path.join(__dirname, "generated-jobs-models.prisma");

const ACTIVATE = new Set([
  "menus",
  "activity_log",
  "password_resets",
  "m_bank",
  "m_broker",
  "m_city",
  "m_company",
  "m_model",
  "m_variant",
  "rc_details",
  "rc_api_users",
  "rc_api_requests",
  "fin_year",
]);

let schema = fs.readFileSync(schemaPath, "utf8");

// users: nullable type + API columns
schema = schema.replace(
  /model users \{[\s\S]*?@@map\("users"\)\n\}/,
  `model users {
  id                Int       @id @default(autoincrement())
  first_name        String    @db.VarChar(255)
  last_name         String    @db.VarChar(255)
  email             String    @unique(map: "users_email_unique") @db.VarChar(255)
  email_verified_at DateTime? @db.Timestamp(0)
  password          String    @db.VarChar(255)
  remember_token    String?   @db.VarChar(100)
  access_token      String?   @db.VarChar(255)
  permissions       String?   @db.Text
  city_id           Int?
  bank_id           Int?
  type              String?   @default("") @db.VarChar(50)
  is_admin          Int       @default(0) @db.TinyInt
  status            String?   @default("Active") @db.VarChar(50)
  is_deleted        Int       @default(0) @db.TinyInt
  verified_at       DateTime? @db.Timestamp(0)
  last_activity     DateTime? @db.Timestamp(0)
  is_online         Int       @default(0) @db.TinyInt
  created_at        DateTime? @default(now()) @db.Timestamp(0)
  updated_at        DateTime? @default(now()) @updatedAt @db.Timestamp(0)

  @@map("users")
}`,
);

// Activate selected models: remove @@ignore, add @id on id
for (const name of ACTIVATE) {
  const re = new RegExp(
    `(model ${name} \\{[\\s\\S]*?)(\\n\\s*@@map\\("${name}"\\)\\n\\s*@@ignore\\n\\})`,
  );
  schema = schema.replace(re, (_m, body, _tail) => {
    let b = body;
    // strip ignore comment lines above model are outside match
    if (name === "password_resets") {
      b = b.replace(
        /email\s+String\s+@db\.VarChar\(255\)/,
        "email      String    @id @db.VarChar(255)",
      );
    } else if (name === "activity_log") {
      b = b.replace(
        /id\s+BigInt\s+@db\.UnsignedBigInt/,
        "id           BigInt    @id @default(autoincrement()) @db.UnsignedBigInt",
      );
    } else if (name === "rc_api_requests") {
      b = b.replace(
        /id\s+BigInt\n/,
        "id             BigInt    @id @default(autoincrement())\n",
      );
    } else if (name === "menus") {
      b = b.replace(
        /id\s+Int\n/,
        "id         Int       @id @default(autoincrement())\n",
      );
      b = b.replace(
        /is_deleted\s+Boolean\s+@default\(false\)/,
        "is_deleted Int       @default(0) @db.TinyInt",
      );
    } else {
      b = b.replace(
        /^(\s*)id(\s+)(\w+)/m,
        (_mm, sp, mid, typ) => `${sp}id${mid}${typ} @id @default(autoincrement())`,
      );
      // avoid double @id if already present
      b = b.replace(
        /@id @default\(autoincrement\(\)\) @id @default\(autoincrement\(\)\)/g,
        "@id @default(autoincrement())",
      );
    }
    return `${b}\n  @@map("${name}")\n}`;
  });
}

// Remove leftover "cannot be handled" comments before activated models (cosmetic)
schema = schema.replace(
  /\/\/\/ The underlying table does not contain a valid unique identifier[\s\S]*?\n(?=model (?:menus|activity_log|password_resets|m_bank|m_broker|m_city|m_company|m_model|m_variant|rc_details|rc_api_users|rc_api_requests|fin_year) )/g,
  "",
);

// Jobs models — only PI tables used by app
let jobs = fs.readFileSync(jobsPath, "utf8");
const keepJobModels = [
  "tbl_2wheeler",
  "tbl_3wheeler",
  "tbl_4wheeler",
  "tbl_jobs",
];
const jobParts = [];
for (const name of keepJobModels) {
  const m = jobs.match(
    new RegExp(`model ${name} \\{[\\s\\S]*?@@map\\("${name}"\\)\\n\\}`),
  );
  if (m) jobParts.push(m[0]);
}

const extras = `
/// Account profile extras (Laravel user_infos)
model user_infos {
  id         Int       @id @default(autoincrement())
  user_id    Int       @unique
  phone      String?   @db.VarChar(50)
  company    String?   @db.VarChar(255)
  website    String?   @db.VarChar(255)
  country    String?   @db.VarChar(100)
  language   String?   @db.VarChar(50)
  timezone   String?   @db.VarChar(100)
  currency   String?   @db.VarChar(20)
  marketing  Int?      @db.TinyInt
  avatar     String?   @db.VarChar(255)
  created_at DateTime? @db.Timestamp(0)
  updated_at DateTime? @db.Timestamp(0)

  @@map("user_infos")
}

/// Staff menu permission grants
model user_permissions {
  id              Int       @id @default(autoincrement())
  user_id         Int
  permission      String    @db.VarChar(255)
  is_deleted      Int       @default(0) @db.TinyInt
  created_user_id Int?
  updated_user_id Int?
  created_at      DateTime? @db.Timestamp(0)
  updated_at      DateTime? @db.Timestamp(0)

  @@index([user_id])
  @@map("user_permissions")
}

/// External API request audit
model user_api_requests {
  id           Int       @id @default(autoincrement())
  user_id      Int
  permission   String    @db.VarChar(255)
  request_data String?   @db.VarChar(255)
  is_success   Int       @default(0) @db.TinyInt
  message      String?   @db.Text
  request_date DateTime? @db.Date
  created_ip   String?   @db.VarChar(45)
  updated_ip   String?   @db.VarChar(45)
  created_at   DateTime? @default(now()) @db.Timestamp(0)
  updated_at   DateTime? @default(now()) @updatedAt @db.Timestamp(0)

  @@map("user_api_requests")
}

model vrn_and_mobile_numbers {
  id                           Int       @id @default(autoincrement())
  vehicle_registration_number  String?   @db.VarChar(50)
  mobile_number                String?   @db.VarChar(50)
  is_deleted                   Int       @default(0) @db.TinyInt
  created_at                   DateTime? @default(now()) @db.Timestamp(0)
  updated_at                   DateTime? @default(now()) @updatedAt @db.Timestamp(0)

  @@index([vehicle_registration_number])
  @@map("vrn_and_mobile_numbers")
}

model tbl_2wheeler_images {
  id         Int       @id @default(autoincrement())
  parent_id  Int?
  image      String?   @db.MediumText
  created_at DateTime? @db.Timestamp(0)

  @@index([parent_id])
  @@map("tbl_2wheeler_images")
}

model tbl_3wheeler_images {
  id         Int       @id @default(autoincrement())
  parent_id  Int?
  image      String?   @db.MediumText
  s3_url     String?   @db.VarChar(255)
  created_at DateTime? @db.Timestamp(0)
  updated_at DateTime? @db.Timestamp(0)

  @@index([parent_id])
  @@map("tbl_3wheeler_images")
}

model tbl_4wheeler_images {
  id         Int       @id @default(autoincrement())
  parent_id  Int?
  image      String?   @db.MediumText
  s3_url     String?   @db.VarChar(255)
  created_at DateTime? @db.Timestamp(0)
  updated_at DateTime? @db.Timestamp(0)

  @@index([parent_id])
  @@map("tbl_4wheeler_images")
}
`;

// Avoid double-append on re-run
if (!schema.includes("model tbl_jobs {")) {
  schema = `${schema.trimEnd()}\n\n// ---- PI jobs / inspections (activated for Next app) ----\n${jobParts.join("\n\n")}\n${extras}\n`;
} else {
  console.log("tbl_jobs already present — skipping jobs append");
}

fs.writeFileSync(schemaPath, schema);
console.log("Updated", schemaPath);

// sanity: activated models should not have @@ignore
for (const name of ACTIVATE) {
  const block = schema.match(
    new RegExp(`model ${name} \\{[\\s\\S]*?\\n\\}`),
  );
  if (!block) {
    console.error("MISSING model", name);
    continue;
  }
  if (block[0].includes("@@ignore")) {
    console.error("STILL IGNORED", name);
  } else {
    console.log("OK", name);
  }
}
console.log("has tbl_jobs", schema.includes("model tbl_jobs {"));
console.log("has user_infos", schema.includes("model user_infos {"));
