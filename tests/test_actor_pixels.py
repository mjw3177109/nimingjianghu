import importlib.util
from pathlib import Path
import unittest
from main import actor_pixel_hit


@unittest.skipUnless(importlib.util.find_spec('PIL'), 'Pillow required for real sprite pixel tests')
class ActorPixels(unittest.TestCase):
    def test_actual_npc_transparency_and_render_anchor(self):
        from PIL import Image
        source=Path(__file__).resolve().parents[1]/'assets/sprites/innkeeper.png'
        image=Image.open(source).convert('RGBA').resize((56,96))
        class Surface:
            def get_width(self): return image.width
            def get_height(self): return image.height
            def get_at(self,xy): return image.getpixel(xy)
        surface=Surface()
        for feet_x,feet_y in [(272,352),(159,125)]:
            # Real transparent upper corner, opaque torso, and ground below feet.
            self.assertEqual(image.getpixel((54,1))[3],0)
            self.assertFalse(actor_pixel_hit(surface,feet_x,feet_y,feet_x+26,feet_y-94))
            self.assertTrue(actor_pixel_hit(surface,feet_x,feet_y,feet_x,feet_y-48))
            self.assertFalse(actor_pixel_hit(surface,feet_x,feet_y,feet_x,feet_y+2))
            self.assertFalse(actor_pixel_hit(surface,feet_x,feet_y,feet_x-29,feet_y-48))
