#!/usr/bin/env python3
"""Recount saved independent frames from their files and provenance receipts."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def snapshot():
    masters = json.loads((ROOT / 'assets/characters/masters/production_manifest.json').read_text(encoding='utf-8'))
    records = []
    sprite_file = ROOT / 'assets/characters/scene_sprites/sprite_manifest.json'
    sprite_entries = json.loads(sprite_file.read_text(encoding='utf-8'))['entries'] if sprite_file.exists() else []
    for master in masters['tasks']:
        character = master['id']
        package = ROOT / 'production/character_frames' / character
        jobs = json.loads((package / 'frames_jobs.json').read_text(encoding='utf-8'))['tasks']
        verified = []
        for job in jobs:
            receipt_path = package / 'receipts' / (job['id'] + '.json')
            if not receipt_path.exists():
                continue
            receipt = json.loads(receipt_path.read_text(encoding='utf-8'))
            file = ROOT / job['output_file']
            if receipt['approved'] is not False:
                raise ValueError(f'Frame import cannot approve artwork: {job["id"]}')
            if receipt['master_sha256'] != master['master_sha256']:
                raise ValueError(f'Master identity mismatch: {job["id"]}')
            sha = hashlib.sha256(file.read_bytes()).hexdigest()
            if sha != receipt['sha256']:
                raise ValueError(f'Generated frame changed after import: {job["id"]}')
            verified.append({'id': job['id'], 'file': job['output_file'], 'sha256': sha})
        entry = next((e for e in sprite_entries if e['id'] == character), {})
        approved = entry.get('direction_status') == 'user_approved_independently_painted'
        if approved:
            evidence = ROOT / entry['review_evidence']
            if hashlib.sha256(evidence.read_bytes()).hexdigest() != entry['review_evidence_sha256']:
                raise ValueError(f'Human review evidence changed: {character}')
            if hashlib.sha256((ROOT / entry['sheet']).read_bytes()).hexdigest() != entry['asset_sha256']:
                raise ValueError(f'Approved runtime sprite changed: {character}')
        records.append({'id': character, 'name': master['name'], 'expected': 16,
                        'generated': len(verified), 'human_approved': approved, 'frames': verified})
    return {'schema_version': 1, 'phase': 'independent_frame_candidates',
            'expected': 112, 'generated': sum(r['generated'] for r in records),
            'human_approved_characters': sum(r['human_approved'] for r in records), 'characters': records}


if __name__ == '__main__':
    data = snapshot()
    out = ROOT / 'assets/characters/scene_sprites/candidates/production_status.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f"Verified {data['generated']}/{data['expected']} saved independent frame candidates")
