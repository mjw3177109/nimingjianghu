#!/usr/bin/env python3
"""Persist one native imagegen output and its provenance, without approving art."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path
from p3g_art_pipeline import inspect_rgba

ROOT = Path(__file__).resolve().parents[1]


def import_frame(record):
    job_id = record['job']
    character = job_id.split('_')[0]
    package = ROOT / 'production/character_frames' / character / 'frames_jobs.json'
    jobs = json.loads(package.read_text(encoding='utf-8'))['tasks']
    job = next(j for j in jobs if j['id'] == job_id)
    manifest = json.loads((ROOT / 'assets/characters/masters/production_manifest.json').read_text(encoding='utf-8'))
    master = next(t for t in manifest['tasks'] if t['id'] == character)
    master_sha = hashlib.sha256(Path(job['reference_image']).read_bytes()).hexdigest()
    if not master['master_approved'] or master.get('master_sha256') != master_sha:
        raise ValueError('Generation reference must match the approved master hash')
    source = Path(record['source'])
    # Technical validation only: never turn this into human visual approval.
    inspection = inspect_rgba(source, 256, 384)
    destination = ROOT / job['output_file']
    sha = hashlib.sha256(source.read_bytes()).hexdigest()
    if destination.exists() and hashlib.sha256(destination.read_bytes()).hexdigest() != sha:
        raise ValueError(f'Refusing to overwrite a different frame: {destination}')
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, destination)
    receipt = {
        'schema_version': 1, 'job': job_id, 'provider': 'built_in_imagegen',
        'status': 'generated_candidate_pending_human_review', 'approved': False,
        'source': str(source), 'output_file': job['output_file'], 'sha256': sha,
        'master_sha256': master_sha,
        'prompt': record['prompt'], 'inspection': inspection,
    }
    receipts = ROOT / 'production/character_frames' / character / 'receipts'
    receipts.mkdir(parents=True, exist_ok=True)
    temporary = receipts / (job_id + '.json.tmp')
    temporary.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(receipts / (job_id + '.json'))
    return {'job': job_id, 'sha256': sha, 'output_file': job['output_file']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('records', help='JSON list of individual tool output records')
    args = parser.parse_args()
    results = []
    for record in json.loads(Path(args.records).read_text(encoding='utf-8-sig')):
        try:
            results.append(import_frame(record))
        except (ValueError, OSError, KeyError, StopIteration) as error:
            results.append({'job': record.get('job'), 'error': str(error)})
    print(json.dumps(results, ensure_ascii=False, indent=2))
    raise SystemExit(int(any('error' in r for r in results)))
