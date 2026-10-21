import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


@unittest.skipUnless(importlib.util.find_spec('PIL'), 'Pillow required for image import')
class MasterImport(unittest.TestCase):
    def test_import_produces_review_without_resizing_source_or_approving(self):
        from PIL import Image, ImageDraw
        from tools.p3g_art_pipeline import candidate_master
        registry = ROOT / 'assets/characters/scene_sprites/sprite_registry.js'
        production = ROOT / 'assets/characters/masters/production_manifest.json'
        before = registry.read_bytes(), production.read_bytes()
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / 'synthetic-format-fixture.png'
            image = Image.new('RGBA', (1024, 1536))
            ImageDraw.Draw(image).rectangle((200, 100, 824, 1436), fill=(30, 60, 90, 255))
            image.save(source)
            result = candidate_master('NPC001', source, Path(folder) / 'out')
            self.assertEqual(result['status'], 'CANDIDATE_NOT_APPROVED')
            self.assertTrue(Path(result['review_file']).is_file())
            with Image.open(result['fullbody_file']) as fullbody:
                self.assertEqual(fullbody.size, image.size)
                self.assertEqual(fullbody.tobytes(), image.tobytes())
            report = json.loads((Path(folder) / 'out/NPC001_master_qa.json').read_text(encoding='utf-8'))
            self.assertEqual(report['source']['w'], 1024)
            self.assertEqual(report['source']['h'], 1536)
            import hashlib
            self.assertEqual(report['output_sha256']['fullbody'], hashlib.sha256(Path(result['fullbody_file']).read_bytes()).hexdigest())
        self.assertEqual(before, (registry.read_bytes(), production.read_bytes()))
