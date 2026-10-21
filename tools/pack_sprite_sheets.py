#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Safe compatibility entrypoint for independently painted 96x128 4-direction art.

A production sheet is 384x512 (4 columns x 4 rows). The old 48x64
packer created 192x256 files that BOTH web and Pygame silently rejected.
Unreviewed frames only produce candidates. Publishing requires source-master
approval plus a separate, manually written review evidence JSON.
"""
import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path

from p3g_art_pipeline import BASE, ROOT, SPRITE_PIXEL, pack_frames, manifest_entry

CHARACTERS = {
    "CHAR001": "player", "NPC001": "innkeeper", "NPC005": "healer",
    "NPC002": "oldman", "NPC003": "swordswoman",
    "BOSS001": "liao", "EN001": "bandit",
}
REVIEW_FIELDS = ("identity", "true_four_views", "foot_alternation",
                 "transparent_background", "body_proportions", "consistent_clothing")


def sha256(file):
    return hashlib.sha256(Path(file).read_bytes()).hexdigest()


def release(char_id, report, evidence_path):
    if not evidence_path:
        raise ValueError("--approve requires --review-evidence <manually reviewed JSON>")
    master = manifest_entry(char_id)
    master_path = ROOT / master["master"]
    if master.get("master_approved") is not True or not master_path.is_file():
        raise ValueError("正式高清母版尚未人工批准/上传，禁止发布低清替代品")
    from p3g_art_pipeline import inspect_rgba
    inspect_rgba(master_path, 1024, 1536)

    evidence = json.loads(Path(evidence_path).read_text(encoding="utf-8"))
    if evidence.get("character_id") != char_id or evidence.get("approved") is not True:
        raise ValueError("审核记录未明确批准此角色")
    if not isinstance(evidence.get("reviewer"), str) or not evidence["reviewer"].strip():
        raise ValueError("审核人不得为空")
    if not isinstance(evidence.get("notes"), str) or len(evidence["notes"].strip()) < 20:
        raise ValueError("审核备注至少20字符，说明具体视觉核查结果")
    if any(evidence.get("checks", {}).get(k) is not True for k in REVIEW_FIELDS):
        raise ValueError("人物身份/真实四方向/左右脚/透明背景/比例/服饰六项未全部确认")
    hashes = [f["sha256"] for f in report["sources"]]
    if evidence.get("frame_sha256") != hashes:
        raise ValueError("审核的16张源帧哈希与当前输入不一致，禁止偷换图")
    candidate = Path(report["sheet"])
    if evidence.get("sheet_sha256") != sha256(candidate):
        raise ValueError("审核图集哈希与当前候选图集不一致")
    if report.get("warnings") and not evidence.get("warnings_resolved"):
        raise ValueError("候选图集有侧面镜像/方向疑点，需逐项复核后签署 warnings_resolved")

    from PIL import Image
    with Image.open(candidate) as im:
        if im.size != (384, 512) or im.mode != "RGBA":
            raise ValueError("正式图集必须为384x512透明RGBA")
    key = CHARACTERS[char_id]
    dst = BASE / "scene_sprites" / (key + "_4dir.png")
    shutil.copyfile(candidate, dst)
    registry_path = BASE / "scene_sprites" / "sprite_registry.js"
    prefix = "window.NM_SPRITE_REGISTRY = "
    registry_text = registry_path.read_text(encoding="utf-8").strip()
    if not registry_text.startswith(prefix):
        raise ValueError("sprite_registry.js 格式异常")
    registry = json.loads(registry_text[len(prefix):].rstrip(";"))
    registry[key] = "assets/characters/scene_sprites/" + key + "_4dir.png"
    registry_path.write_text(prefix + json.dumps(registry, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")

    manifest_path = BASE / "scene_sprites" / "sprite_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    entry = next((e for e in manifest["entries"] if e["id"] == char_id), None)
    if entry is None:
        entry = {"id": char_id, "name": master["name"], "key": key}
        manifest["entries"].append(entry)
    entry.update({
        "sheet": registry[key], "frame_width": 96, "frame_height": 128,
        "direction_status": "user_approved_independently_painted",
        "animation_status": "verified_16_frames",
        "asset_sha256": sha256(dst),
        "reviewer": evidence["reviewer"],
        "review_evidence_sha256": sha256(evidence_path),
        "source_master": master["master"],
    })
    manifest["pending"] = [e for e in manifest.get("pending", []) if e.get("id") != char_id]
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("RELEASED", dst, "384x512 / 96x128 frames / reviewed", evidence["reviewer"])


def main():
    parser = argparse.ArgumentParser(description="逆命江湖独立四方向高清候选打包/人工审核后发布")
    parser.add_argument("--character", choices=sorted(CHARACTERS), required=True)
    parser.add_argument("--input", required=True, help="16张独立RGBA原图所在目录")
    parser.add_argument("--out", help="候选图集和审核图输出目录")
    parser.add_argument("--approve", action="store_true", help="审核后发布，必须同时提供审核证据")
    parser.add_argument("--review-evidence", help="人工审核JSON；含全部16张源帧及图集SHA256")
    args = parser.parse_args()
    try:
        result = pack_frames(args.character, args.input, args.out)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        if args.approve:
            release(args.character, result, args.review_evidence)
        return 0
    except (ValueError, FileNotFoundError, ImportError, OSError, KeyError, json.JSONDecodeError) as exc:
        print("SPRITE_ART_GATE_BLOCKED:", exc, file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
