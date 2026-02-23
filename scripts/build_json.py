from pathlib import Path
import json
import yaml
from datetime import date, datetime

inp = Path("data/conferences.yml")
out = Path("docs/assets/data/conferences.json")
out.parent.mkdir(parents=True, exist_ok=True)

items = yaml.safe_load(inp.read_text(encoding="utf-8"))

def to_jsonable(x):
  """Convert date/datetime in nested structures into ISO strings."""
  if isinstance(x, (date, datetime)):
    return x.isoformat()
  if isinstance(x, dict):
    return {k: to_jsonable(v) for k, v in x.items()}
  if isinstance(x, list):
    return [to_jsonable(v) for v in x]
  return x

items = to_jsonable(items)

out.write_text(
  json.dumps(items, ensure_ascii=False, indent=2) + "\n",
  encoding="utf-8"
)
print(f"Wrote {out}")