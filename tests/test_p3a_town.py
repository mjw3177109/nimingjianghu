import json
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

class P3ATownTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.map=json.loads((ROOT/'data/maps/town/town_tilemap.json').read_text(encoding='utf-8'))

    def test_grid_and_atlas(self):
        m=self.map
        self.assertEqual((m['width'],m['height'],m['tile_size']),(40,24,32))
        self.assertEqual(len(m['tile_ids']),36)
        for name,layer in m['layers'].items():
            self.assertEqual(len(layer),960,name)
            self.assertTrue(all(-1<=v<36 for v in layer),name)
        self.assertEqual(len(m['collision']),960)
        self.assertTrue((ROOT/m['atlas']).is_file())

    def test_bridged_river(self):
        m=self.map
        self.assertEqual(m['collision'][12*40+19],0)
        self.assertEqual(m['layers']['building'][12*40+19],15)
        self.assertEqual(m['collision'][10*40+19],1)
        self.assertGreaterEqual(m['layers']['water'][10*40+19],0)

    def test_spawn_and_npc_paths(self):
        from collections import deque
        m=self.map; blocked=m['collision']
        q=deque([tuple(m['spawn'])]);visited={tuple(m['spawn'])}
        while q:
            x,y=q.popleft()
            for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                nx,ny=x+dx,y+dy
                if not (0<=nx<40 and 0<=ny<24) or (nx,ny) in visited or blocked[ny*40+nx]:continue
                visited.add((nx,ny));q.append((nx,ny))
        for dest in [(8,10),(30,10),(33,16),(39,12)]:
            self.assertIn(dest,visited)

    def test_both_clients_refer_to_tile_data(self):
        py=(ROOT/'main.py').read_text(encoding='utf-8')
        js=(ROOT/'game.js').read_text(encoding='utf-8')
        self.assertIn('town_tilemap.json',py)
        self.assertIn('tileAtlases',js)
        self.assertNotIn("('town','S001_town')",py)
        self.assertNotIn('S001_town.webp',js)
        compile(py,str(ROOT/'main.py'),'exec')

if __name__=='__main__':
    unittest.main()
