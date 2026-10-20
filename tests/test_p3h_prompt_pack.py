import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"tools"))
import p3h_export_character_jobs as p3h

class P3HPromptPackTests(unittest.TestCase):
    def test_master_is_one_image_not_a_contact_sheet(self):
        with tempfile.TemporaryDirectory() as td:
            result=p3h.master_package("CHAR001",td)
            self.assertFalse(result["frames_unlocked"])
            job=json.loads((Path(td)/"master_job.json").read_text(encoding="utf-8"))
            self.assertEqual(job["target_size"],[1536,2048])
            self.assertIn("只生成一张独立人物全身原画",job["prompt"])
            self.assertIn("严禁生成任何拼图",job["prompt"])
            self.assertIn("CHAR001_avatar.webp",job["identity_reference"])
            self.assertTrue(job["never_auto_approve"])

    def test_all_seven_master_prompts_exist(self):
        ids=[x["id"] for x in p3h.read_manifest()["tasks"]]
        self.assertEqual(len(ids),7)
        self.assertIn("CHAR001",ids)
        self.assertIn("BOSS001",ids)

    def test_frame_generation_is_gated_by_reviewed_master(self):
        with tempfile.TemporaryDirectory() as td:
            with self.assertRaises(FileNotFoundError):
                p3h.frames_package("CHAR001",Path(td)/"not-exist.png",Path(td)/"out")
            self.assertFalse((Path(td)/"out").exists())

    def test_direction_contract(self):
        self.assertEqual(p3h.DIRECTIONS,("down","left","right","up"))
        self.assertEqual(p3h.POSES,("idle","walk1","walk2","walk3"))
        self.assertIn("face not visible",p3h.DIRECTION_CN["up"][1])
        self.assertIn("true right profile",p3h.DIRECTION_CN["right"][1])

if __name__=="__main__":unittest.main()
