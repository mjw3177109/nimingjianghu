import json
import unittest
from pathlib import Path
from main import blocked_tile

ROOT = Path(__file__).resolve().parents[1]


class CollisionParity(unittest.TestCase):
    def test_real_structure_and_actor_footprints(self):
        world = json.loads((ROOT / 'data/world.json').read_text(encoding='utf-8'))
        structures = json.loads((ROOT / 'data/structures.json').read_text(encoding='utf-8'))
        for scene in ('town', 'road', 'cave'):
            tilemap = json.loads((ROOT / f'data/maps/{scene}/{scene}_tilemap.json').read_text(encoding='utf-8'))
            actors = world['maps'][scene].get('npcs', []) + world['maps'][scene].get('enemies', [])
            for x, y in [(-1, 10), (tilemap['width'], 10), (10, -1), (10, tilemap['height'])]:
                self.assertTrue(blocked_tile(tilemap, structures[scene], actors, x, y))
            for actor in actors:
                for dx in (-1, 0, 1):
                    self.assertTrue(blocked_tile(tilemap, structures[scene], actors, actor['x'] + dx, actor['y']))
            for obj in structures[scene]:
                f = obj.get('solid_footprint')
                if not f:
                    continue
                for dy in range(f['h']):
                    for dx in range(f['w']):
                        self.assertTrue(blocked_tile(tilemap, structures[scene], actors, obj['x'] + f['x'] + dx, obj['y'] + f['y'] + dy))
            x, y = tilemap['spawn']
            self.assertFalse(blocked_tile(tilemap, structures[scene], actors, x, y))

    def test_defeated_bandit_frees_road(self):
        m = json.loads((ROOT / 'data/maps/road/road_tilemap.json').read_text(encoding='utf-8'))
        self.assertFalse(blocked_tile(m, [], [], 18, 10))
