"""Extract CREATE TABLE blocks and generate Prisma models for Phase 5."""
from __future__ import annotations

from pathlib import Path
import re

SQL_DUMP = Path(r"d:\sarthak\DigitalAutoWeb\digitalauto_db_digitalauto.sql")
OUT_DDL = Path(r"d:\sarthak\digitalauto-next\scripts\extracted-tables.sql")
OUT_PRISMA = Path(r"d:\sarthak\digitalauto-next\scripts\generated-jobs-models.prisma")

TARGETS = [
    "tbl_2wheeler",
    "tbl_3wheeler",
    "tbl_4wheeler",
    "tbl_jobs",
    "tbl_jobs_office",
    "tbl_office",
    "tbl_valuation_2wheeler",
    "tbl_valuation_3wheeler",
    "tbl_valuation_4wheeler",
]


def extract_tables() -> list[str]:
    wanted = {f"CREATE TABLE `{name}`" for name in TARGETS}
    collecting: str | None = None
    buf: list[str] = []
    found: list[str] = []
    with SQL_DUMP.open("r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            if collecting is None:
                for t in wanted:
                    if line.startswith(t):
                        collecting = t
                        buf = [line]
                        break
            else:
                buf.append(line)
                if line.startswith(") ENGINE"):
                    found.append("".join(buf))
                    collecting = None
                    buf = []
                    if len(found) == len(TARGETS):
                        break
    OUT_DDL.write_text("\n\n".join(found), encoding="utf-8")
    return found


def map_type(sql_type: str, nullable: bool) -> str:
    t = sql_type.lower().strip()
    if t.startswith("int") or t.startswith("tinyint"):
        return "Int?" if nullable else "Int"
    if t.startswith("float") or t.startswith("double"):
        return "Float?" if nullable else "Float"
    m = re.match(r"varchar\((\d+)\)", t)
    if m:
        return f"String? @db.VarChar({m.group(1)})" if nullable else f"String @db.VarChar({m.group(1)})"
    if t.startswith("mediumtext"):
        return "String? @db.MediumText"
    if t.startswith("text"):
        return "String? @db.Text"
    if t == "date":
        return "DateTime? @db.Date" if nullable else "DateTime @db.Date"
    if t.startswith("datetime") or t.startswith("timestamp"):
        return "DateTime?"
    if t.startswith("time"):
        return "DateTime? @db.Time" if nullable else "DateTime @db.Time"
    if t.startswith("enum"):
        return "String? @db.VarChar(20)" if nullable else "String @db.VarChar(20)"
    return "String?" if nullable else "String"


def parse_table(block: str) -> str:
    lines = block.strip().splitlines()
    name = re.match(r"CREATE TABLE `(\w+)`", lines[0]).group(1)
    fields: list[str] = []
    for line in lines[1:]:
        line = line.strip().rstrip(",")
        if not line.startswith("`"):
            continue
        m = re.match(r"`([^`]+)`\s+(\S+)(.*)$", line)
        if not m:
            continue
        col, sql_type, rest = m.group(1), m.group(2), m.group(3)
        nullable = "NOT NULL" not in rest.upper()
        if col == "id":
            fields.append("  id Int @id @default(autoincrement())")
            continue
        if col == "QC":
            fields.append('  qc Int @default(0) @map("QC")')
            continue
        if col == "source":
            fields.append('  source String @default("WEB") @db.VarChar(10)')
            continue
        if col == "is_deleted":
            fields.append("  is_deleted Int @default(0) @db.TinyInt")
            continue
        if col == "is_price_valuation":
            fields.append("  is_price_valuation Int @default(0) @db.TinyInt")
            continue
        prisma_type = map_type(sql_type, nullable)
        # Defaults for required ints that Laravel always sets
        if col in ("ctime",) and not nullable:
            fields.append(f'  {col} String @default("") @db.VarChar(20)')
            continue
        if col in ("inspect_by",) and not nullable:
            fields.append(f"  {col} Int @default(0)")
            continue
        fields.append(f"  {col} {prisma_type}")
    body = "\n".join(fields)
    return f"model {name} {{\n{body}\n\n  @@map(\"{name}\")\n}}"


def main() -> None:
    blocks = extract_tables()
    print("extracted", len(blocks), "tables")
    models = [parse_table(b) for b in blocks]
    OUT_PRISMA.write_text("\n\n".join(models), encoding="utf-8")
    print("wrote", OUT_PRISMA)


if __name__ == "__main__":
    main()
