from pathlib import Path
import json
import yaml

inp = Path("data/conferences.yml")
out = Path("docs/assets/data/conferences.json")
out.parent.mkdir(parents=True, exist_ok=True)

items = yaml.safe_load(inp.read_text(encoding="utf-8"))
out.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Wrote {out}")