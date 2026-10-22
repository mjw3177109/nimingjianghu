import copy
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import pack_sprite_sheets as packer


class ScopedApprovalTests(unittest.TestCase):
    def test_actual_six_and_player_exclusion(self):
        folder = ROOT / 'assets/characters/scene_sprites'
        for char_id, key in packer.CHARACTERS.items():
            report = json.loads((folder / 'candidates' / (key + '_4dir_hd_qa.json')).read_text(encoding='utf-8'))
            # Candidate generation reports retain the original Windows path;
            # exercise the same bytes on Linux CI without depending on that path.
            report['sheet'] = str(folder / 'candidates' / (key + '_4dir_hd_candidate.png'))
            evidence_path = folder / 'reviews' / (char_id + '_release.json')
            if char_id == 'CHAR001':
                evidence_path = folder / 'reviews/NPC001_release.json'
            evidence = json.loads(evidence_path.read_text(encoding='utf-8'))
            if char_id == 'CHAR001':
                with self.assertRaises(ValueError):
                    packer.validate_overall_approval(evidence, char_id, report)
                continue
            packer.validate_overall_approval(evidence, char_id, report)
            changed = copy.deepcopy(report)
            changed['sources'][0]['sha256'] = 'changed'
            with self.assertRaises(ValueError):
                packer.validate_overall_approval(evidence, char_id, changed)
            with self.assertRaises(ValueError):
                packer.validate_overall_approval({**evidence, 'approval_record': 'missing.json'}, char_id, report)


if __name__ == '__main__':
    unittest.main()

