#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""P3-H: export one-image-at-a-time Qwen prompts with a human-approved master gate.

This tool creates prompt packages only. It never generates, approves, or replaces art.
"""
from __future__ import annotations
import argparse, json, re, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/"assets/characters/masters/production_manifest.json"
STYLE_REF="assets/home/characters_gallery_ref.webp"
DIRECTIONS=("down","left","right","up")
POSES=("idle","walk1","walk2","walk3")
DIRECTION_CN={
 "down":("正面","front view facing the camera, both eyes visible, chest and belt read clearly"),
 "left":("左侧面","true left profile, character faces toward screen-left; visible side of face, nose points left"),
 "right":("右侧面","true right profile, character faces toward screen-right; visible side of face, nose points right"),
 "up":("背面","true rear view from behind, back of head and back of outfit visible, face not visible"),
}
POSE_CN={
 "idle":("自然站立","neutral idle standing pose, both feet planted, arms relaxed naturally, sword stays in its normal sheath"),
 "walk1":("迈步一","walking key pose A: left foot steps forward and right foot trails, natural counter-swing of arms"),
 "walk2":("迈步二","walking passing pose B: weight transitions over the front foot, knees and elbows naturally bent, cloth follows motion"),
 "walk3":("迈步三","walking key pose C: right foot steps forward and left foot trails, natural counter-swing of arms"),
}
NEGATIVE=("拼贴、角色设定表、三视图、四视图、接触表、九宫格、Sprite Sheet、多个姿势出现在同一张图、"
 "多个角色、背景场景、UI、按钮、边框、文字、编号、水印、logo、白色假透明棋盘格、"
 "实心背景、裁切头顶、裁切鞋底、手脚畸形、换脸、服装变色、额外武器、"
 "水平镜像冒充另一方向、正面伪装背面、拉伸现有小头像、过曝光晕、低清模糊")


def read_manifest():
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def get_character(char_id):
    for task in read_manifest()["tasks"]:
        if task["id"]==char_id:return task
    raise ValueError(f"未知角色ID：{char_id}；可选：{', '.join(x['id'] for x in read_manifest()['tasks'])}")


def base_identity(task):
    prompt=task["prompt"]
    prompt=re.sub(r"输出\s*1536×2048母版，另生成1024×1024胸像。?", "", prompt)
    prompt=re.sub(r"输出\s*1536x2048母版，另生成1024x1024胸像。?", "", prompt)
    return prompt.strip()


def master_package(char_id,outdir):
    task=get_character(char_id)
    out=Path(outdir).resolve();out.mkdir(parents=True,exist_ok=True)
    prompt=(
      "【本次只生成一张独立人物全身原画，严禁生成任何拼图或设计板】\n"
      +base_identity(task)+"\n"
      "画幅：竖向约3:4；目标1536×2048，至少1024×1536真实源图。"
      "人物从发顶到鞋底完整入画，单人居中，脚底与四周留透明安全边距。"
      "风格锁定：精致国风Q版2.5D手绘武侠，清晰线稿、柔和体积光、细腻衣料与金属饰件；"
      "不可转成像素方块风、3D渲染、真人写实或另一套动漫风格。"
      "背景必须为真正透明Alpha通道，不是白底或棋盘格。"
      "只画正面自然站立全身，双手自然可辨，武器完整；无文字、无排版、无边框、无头像小窗、无其他角度、无第二个人物。"
      "只输出这一张图；胸像、侧面、背面、表情图将分开单独生成。\n"
      "负面约束："+NEGATIVE
    )
    job={
      "schema_version":1,"phase":"P3-H_MASTER","status":"prompt_ready_not_generated",
      "character_id":task["id"],"character_name":task["name"],
      "output_file":f"assets/characters/masters/candidates/{char_id}_fullbody_candidate.png",
      "target_size":[1536,2048],"minimum_source_size":[1024,1536],
      "format":"RGBA PNG with real alpha transparency",
      "identity_reference":task["portrait"],
      "style_reference":STYLE_REF,
      "workflow":"Qwen2.1 image generation or image-edit workflow; one output image per task",
      "prompt":prompt,"negative_prompt":NEGATIVE,
      "approval_gate":"Human must inspect face, clothing, accessories, anatomy, full-body crop and style before any direction jobs are exported.",
      "never_auto_approve":True
    }
    (out/"master_job.json").write_text(json.dumps(job,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (out/"master_prompt.md").write_text(
      f"# {task['name']} 高清全身母版｜单图任务\n\n"
      f"- 角色ID：{char_id}\n- 输出：{job['output_file']}\n- 目标尺寸：1536×2048；最低真实源图1024×1536\n"
      f"- 身份参考：`{task['portrait']}`（仅核对身份，不得放大冒充高清）\n"
      f"- 风格参考：`{STYLE_REF}`\n- 状态：待生成，尚未审核\n\n"
      f"## 正向提示词\n\n{prompt}\n\n## 负面提示词\n\n{NEGATIVE}\n",encoding="utf-8")
    return {"character_id":char_id,"name":task["name"],"output_dir":str(out),
            "files":[str(out/"master_job.json"),str(out/"master_prompt.md")],
            "status":"prompt_ready_not_generated","frames_unlocked":False}


def validate_reviewed_master(path):
    file=Path(path).expanduser().resolve()
    if not file.is_file():raise FileNotFoundError(f"审核后的母版不存在：{file}")
    try:
        from PIL import Image
    except ImportError as exc:
        raise RuntimeError("检查母版需要 Pillow：python -m pip install Pillow") from exc
    with Image.open(file) as image:
        image.load()
        if image.mode!="RGBA":raise ValueError("审核母版必须是RGBA透明PNG")
        w,h=image.size
        if w<1024 or h<1536:raise ValueError(f"母版真实源图尺寸{w}x{h}不足1024x1536，禁止放大冒充高清")
        alpha=image.getchannel("A")
        if alpha.getextrema()[0]>16 or alpha.getextrema()[1]<180:
            raise ValueError("母版没有有效的真实透明背景或人物Alpha")
        if alpha.getbbox() is None:raise ValueError("母版是空透明图")
    return file,w,h


def frames_package(char_id,reviewed_master,outdir):
    task=get_character(char_id)
    master,w,h=validate_reviewed_master(reviewed_master)
    out=Path(outdir).resolve();out.mkdir(parents=True,exist_ok=True)
    tasks=[]
    for direction in DIRECTIONS:
        dcn,view= DIRECTION_CN[direction]
        for pose in POSES:
            pcn,action=POSE_CN[pose]
            out_file=f"qwen_4dir/{char_id}/{direction}_{pose}.png"
            prompt=(
              f"【只生成一张独立角色帧，不是Sprite表】角色「{task['name']}」，唯一人物身份与服装依据是传入的已人工验收高清母版。"
              "不得重设计脸、发型、发饰、服装、腰带、纹样、鞋、武器；不改变主色、身高比例、头身比和配饰位置。"
              f"视角：{dcn}，{view}。动作：{pcn}，{action}。"
              "保持角色全身完整、发顶与鞋底不裁切，居中站在固定脚底锚点，姿势符合自然人体透视。"
              "该图必须独立重绘对应角度；禁止镜像正面、拉伸正面、用头发/衣服遮住脸来假冒背面。"
              "严格沿用参考母版的精致国风Q版2.5D手绘武侠风格，干净轮廓、精细衣料。"
              "真正透明RGBA背景；单张PNG、竖向约3:4、建议1024×1536或更高分辨率。"
              "禁止画第二个人物、场景、地面投影、UI、文字、标签、边框、格子、其他方向或其他动作。"
              "每次只输出这一张帧，不要把其余15帧放在同一画布。"
            )
            job={
              "id":f"{char_id}_{direction}_{pose}","character_id":char_id,"character_name":task["name"],
              "direction":direction,"direction_cn":dcn,"pose":pose,"pose_cn":pcn,
              "status":"prompt_ready_after_human_master_review","single_image_only":True,
              "reference_image":str(master),"reference_size":[w,h],"style_reference":STYLE_REF,
              "output_file":out_file,"target_size":[1024,1536],"minimum_source_size":[256,384],
              "format":"RGBA PNG with real alpha transparency","prompt":prompt,"negative_prompt":NEGATIVE,
              "approval_gate":"This is still a candidate frame. Check all 16 frames and the four views manually before packing/release."
            }
            tasks.append(job)
            (out/(job["id"]+".md")).write_text(
              f"# {job['id']}｜{task['name']} 单帧生成任务\n\n"
              f"- 参考母版：`{master}`（{w}×{h}，由调用者声明已人工审核）\n"
              f"- 方向：{dcn}（{direction}）\n- 动作：{pcn}（{pose}）\n"
              f"- 输出文件：`{out_file}`\n- 状态：待生成与人工审核\n\n"
              f"## 正向提示词\n\n{prompt}\n\n## 负面提示词\n\n{NEGATIVE}\n",encoding="utf-8")
    manifest={"schema_version":1,"phase":"P3-H_SPRITE_FRAMES","character_id":char_id,
              "character_name":task["name"],"reference_master":str(master),"reference_size":[w,h],
              "status":"prompt_ready_after_human_master_review","single_image_tasks":len(tasks),
              "directions":list(DIRECTIONS),"poses":list(POSES),"tasks":tasks,
              "never_auto_approve":True}
    (out/"frames_jobs.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (out/"README.md").write_text(
      f"# {task['name']} 四方向16帧任务包\n\n共16个独立生成任务，每个任务对应一张PNG，不允许拼成大图。\n"
      f"参考母版：`{master}`\n\n"
      "生成后将每个结果按 `output_file` 放置，接着运行：\n\n"
      f"`python tools/p3g_art_pipeline.py frames --character {char_id} --input <含16张PNG的文件夹>`\n\n"
      "打包工具会输出高清候选图集与审核图；审核前不得替换正式资源。\n",encoding="utf-8")
    return {"character_id":char_id,"name":task["name"],"output_dir":str(out),
            "frames":len(tasks),"reference_master":str(master),
            "files":[str(out/"frames_jobs.json"),str(out/"README.md")],
            "status":"prompt_ready_after_human_master_review","never_auto_approve":True}


def main():
    parser=argparse.ArgumentParser(description="P3-H：单图高清母版与16帧Qwen提示词导出器")
    sub=parser.add_subparsers(dest="mode",required=True)
    a=sub.add_parser("master",help="导出一张全身母版的提示词")
    a.add_argument("--character",required=True);a.add_argument("--out",required=True)
    b=sub.add_parser("frames",help="只有在母版人工验收后才导出16张独立动作帧提示词")
    b.add_argument("--character",required=True);b.add_argument("--reviewed-master",required=True)
    b.add_argument("--out",required=True)
    args=parser.parse_args()
    try:
        result=master_package(args.character,args.out) if args.mode=="master" else frames_package(args.character,args.reviewed_master,args.out)
        print(json.dumps(result,ensure_ascii=False,indent=2));return 0
    except (ValueError,FileNotFoundError,RuntimeError) as exc:
        print("P3-H 导出失败："+str(exc),file=sys.stderr);return 1

if __name__=="__main__":raise SystemExit(main())
