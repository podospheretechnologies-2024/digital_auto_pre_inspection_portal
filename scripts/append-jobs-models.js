const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
const jobsPath = path.join(__dirname, "generated-jobs-models.prisma");

let schema = fs.readFileSync(schemaPath, "utf8");
if (schema.includes("model tbl_jobs {")) {
  console.log("tbl_jobs already present");
  process.exit(0);
}

let jobs = fs.readFileSync(jobsPath, "utf8").replace(/\r\n/g, "\n");
const keep = ["tbl_2wheeler", "tbl_3wheeler", "tbl_4wheeler", "tbl_jobs"];
const parts = [];
for (const name of keep) {
  const re = new RegExp(`model ${name} \\{[\\s\\S]*?@@map\\("${name}"\\)\\n\\}`);
  const m = jobs.match(re);
  if (!m) {
    console.error("failed to extract", name);
    process.exit(1);
  }
  parts.push(m[0]);
  console.log("extracted", name, m[0].length);
}

const block = `\n\n// ---- PI jobs / inspections ----\n${parts.join("\n\n")}\n`;

// Insert before user_infos if present, else append
if (schema.includes("model user_infos {")) {
  schema = schema.replace(
    "\n/// Account profile extras (Laravel user_infos)\nmodel user_infos {",
    `${block}\n/// Account profile extras (Laravel user_infos)\nmodel user_infos {`,
  );
} else {
  schema = schema.trimEnd() + block;
}

fs.writeFileSync(schemaPath, schema);
console.log("appended job models");
