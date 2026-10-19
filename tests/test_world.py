import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'data/world.json').read_text(encoding='utf-8'))

class WorldContractTests(unittest.TestCase):
    def test_three_maps(self):
        self.assertEqual(set(DATA['maps']), {'town','road','cave'})

    def test_all_entrances_and_art_exist(self):
        for name, m in DATA['maps'].items():
            self.assertTrue((ROOT / m['art']).is_file(), name)
            self.assertEqual(2, len(m['spawn']))
            for ex in m['exits']:
                self.assertIn(ex['to'], DATA['maps'])
                self.assertEqual(2, len(ex['spawn']))

    def test_story_has_all_key_nodes(self):
        self.assertTrue({'innkeeper','oldman','healer','intro','ending'}.issubset(DATA['dialogue']))
        self.assertIn('bandit', [e['id'] for e in DATA['maps']['road']['enemies']])
        self.assertEqual({'manual','trace'}, {o['id'] for o in DATA['maps']['cave']['objects']})

    def test_sprite_image_files(self):
        for n in ('player','innkeeper','healer','oldman','bandit'):
            self.assertTrue((ROOT/'assets'/'sprites'/f'{n}.png').is_file())

    def test_browser_world_stays_in_sync(self):
        import re
        source=(ROOT/'world-data.js').read_text(encoding='utf-8').strip()
        self.assertTrue(source.startswith('window.GAME_WORLD = '))
        obj=json.loads(source.removeprefix('window.GAME_WORLD = ').removesuffix(';'))
        self.assertEqual(obj,DATA)

if __name__=='__main__':unittest.main()
