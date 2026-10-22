import json
from pathlib import Path
r=Path(__file__).resolve().parents[1]
world=json.loads((r/'data/world.json').read_text(encoding='utf-8'))
(r/'world-data.js').write_text('window.GAME_WORLD = '+json.dumps(world,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
