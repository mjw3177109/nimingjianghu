import json
import unittest
from collections import deque
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

class P3BAllTileMaps(unittest.TestCase):
    def test_all_maps_share_modular_contract(self):
        world=json.loads((ROOT/'data/world.json').read_text(encoding='utf-8'))
        for name,expected in [('town',(40,24,36)),('road',(36,20,30)),('cave',(30,20,30))]:
            with self.subTest(map=name):
                m=json.loads((ROOT/'data/maps'/name/(name+'_tilemap.json')).read_text(encoding='utf-8'))
                width,height,count=expected
                self.assertEqual((m['width'],m['height'],len(m['tile_ids'])),expected)
                self.assertEqual(m['tile_size'],32)
                self.assertEqual(len(m['collision']),width*height)
                self.assertTrue(all(len(layer)==width*height for layer in m['layers'].values()))
                self.assertTrue((ROOT/m['atlas']).is_file())
                self.assertEqual(m['art_policy'],'NO_FULL_SCENE_IMAGE')
                self.assertEqual(world['maps'][name]['tilemap'],'data/maps/'+name+'/'+name+'_tilemap.json')
                src=(ROOT/(name+'-tile-data.js')).read_text(encoding='utf-8')
                self.assertIn('window.NM_'+name.upper()+'_TILEMAP',src)

    def test_road_battle_and_cave_interactions_reachable(self):
        for name,goals in [('road',[(0,10),(35,10),(18,10)]),('cave',[(0,10),(22,10),(16,9)])]:
            m=json.loads((ROOT/'data/maps'/name/(name+'_tilemap.json')).read_text(encoding='utf-8'))
            q=deque([tuple(m['spawn'])]);seen={tuple(m['spawn'])}
            while q:
                x,y=q.popleft()
                for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    nx,ny=x+dx,y+dy
                    if 0<=nx<m['width'] and 0<=ny<m['height'] and not m['collision'][ny*m['width']+nx] and (nx,ny) not in seen:
                        seen.add((nx,ny));q.append((nx,ny))
            for dest in goals:self.assertIn(dest,seen,name+str(dest))

    def test_both_runtimes_render_atlas_instead_of_full_scene(self):
        py=(ROOT/'main.py').read_text(encoding='utf-8')
        js=(ROOT/'game.js').read_text(encoding='utf-8')
        for forbidden in ('S001_town.webp','S004_road.webp','S005_cave.webp'):
            self.assertNotIn(forbidden,js)
            self.assertNotIn(forbidden,py)
        self.assertIn('def paint_tile_world',py)
        self.assertIn("layer('terrain')",py)
        self.assertIn('tileAtlases',js)
        compile(py,str(ROOT/'main.py'),'exec')

if __name__=='__main__':
    unittest.main()
