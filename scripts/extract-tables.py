"""One-off helper to extract CREATE TABLE blocks from Laravel SQL dump."""
from pathlib import Path

path = Path(r"d:\sarthak\DigitalAutoWeb\digitalauto_db_digitalauto.sql")
targets = [
    "CREATE TABLE `tbl_jobs`",
    "CREATE TABLE `tbl_jobs_office`",
    "CREATE TABLE `tbl_4wheeler`",
    "CREATE TABLE `tbl_3wheeler`",
    "CREATE TABLE `tbl_office`",
    "CREATE TABLE `tbl_valuation_2wheeler`",
]
out = Path(r"d:\sarthak\digitalauto-next\scripts\extracted-tables.sql")
collecting = None
buf: list[str] = []
found: list[str] = []

with path.open("r", encoding="utf-8", errors="ignore") as f:
    for line in f:
        if collecting is None:
            for t in targets:
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
                if len(found) == len(targets):
                    break

out.write_text("\n\n".join(found), encoding="utf-8")
print(f"Wrote {len(found)} tables to {out}")
