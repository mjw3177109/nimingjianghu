#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Pack *independently painted* four-view Qwen PNGs into one 192x256 4dir sheet.

Input: <dir>/<direction>_<action>.png, where direction=down,left,right,up
and action=idle,walk1,walk2,walk3. Transparent RGBA is required.
Never generate fake rear/side images by mirroring the frontal image here.
"""
import argparse
import json
import sys
from pathlib import Path

FRAMES=("idle","walk1","walk2","walk3")
DIRECTIONS=("down","left","right","up")
FRAME_SIZE=(48,64)
CHARACTERS={
    "CHAR001":("player","沈砚"),
    "NPC001":("innkeeper","韩掌柜"),
    "NPC005":("healer","苏晚晴"),
    "NPC002":("oldman","顾老"),
    "NPC003":("swordswoman","顾青岚"),
    "BOSS001":("liao","廖"),
    "EN001":("bandit","山贼"),
}
ROOT=Path(__file__).resolve().parents[1]


def normalize(image,path):
    from PIL import Image
    rgba=image.convert("RGBA")
    alpha=rgba.getchannel("A")
    if alpha.getextrema()[0]>24 or alpha.getbbox() is None:
        raise ValueError(f"{path}: 必须是有透明背景、非空白的 RGBA Sprite，禁止整张场景图")
    mask=alpha.point(lambda a: 255 if a>24 else 0)
    box=mask.getbbox()
    if not box:raise ValueError(f"{path}: 未找到有效角色像素")
    # Preserve aspect ratio and feet anchor. Transparent margin remains in each frame.
    cut=rgba.crop(box)
    scale=min(44/cut.width,60/cut.height)
    dims=(max(1,round(cut.width*scale)),max(1,round(cut.height*scale)))
    cut=cut.resize(dims,Image.Resampling.LANCZOS)
    output=Image.new("RGBA",FRAME_SIZE,(0,0,0,0))
    output.alpha_composite(cut,((48-dims[0])//2,62-dims[1]))
    return output


def frame_signature(image):
    from PIL import Image
    return image.convert("RGBA").resize((24,32),Image.Resampling.BILINEAR)


def difference_ratio(a,b):
    from PIL import ImageChops
    # Count substantially changed pixels. Avoid accepting identical or copy/paste frames.
    diff=ImageChops.difference(frame_signature(a),frame_signature(b)).convert("RGBA")
    count=0
    for r,g,b,alpha in diff.getdata():
        if max(r,g,b,alpha)>22:count+=1
    return count/(24*32)


def make_review(sheet,outfile,character):
    from PIL import Image,ImageDraw
    checker=Image.new("RGB",(48*4,64*4),(37,46,52))
    pen=ImageDraw.Draw(checker)
    for y in range(0,256,8):
        for x in range(0,192,8):
            if (x//8+y//8)%2:pen.rectangle((x,y,x+7,y+7),fill=(58,67,72))
    checker.paste(sheet,(0,0),sheet)
    checker.resize((768,1024),Image.Resampling.NEAREST).save(outfile)
    print(f"已创建4向16帧人工审核图: {outfile}")


def run(args):
    from PIL import Image
    if args.character not in CHARACTERS:raise ValueError("未知人物ID")
    key,name=CHARACTERS[args.character]
    folder=Path(args.input).resolve()
    if not folder.is_dir():raise FileNotFoundError(folder)
    sheet=Image.new("RGBA",(192,256),(0,0,0,0))
    cells={}
    for row,dr in enumerate(DIRECTIONS):
        for col,pose in enumerate(FRAMES):
            src=folder/f"{dr}_{pose}.png"
            if not src.is_file():raise FileNotFoundError("缺少独立方向动画帧："+str(src))
            with Image.open(src) as image:frame=normalize(image,src)
            cells[(dr,pose)]=frame
            sheet.alpha_composite(frame,(col*48,row*64))
    for direction in DIRECTIONS:
        reference=cells[(direction,"idle")]
        for pose in FRAMES[1:]:
            ratio=difference_ratio(reference,cells[(direction,pose)])
            if ratio<0.018:
                raise ValueError(f"{direction}_{pose}: 与站姿差异过小 ({ratio:.1%})；疑似重复帧或伪行走")
    for other in ("left","right","up"):
        ratio=difference_ratio(cells[("down","idle")],cells[(other,"idle")])
        if ratio<0.045:
            raise ValueError(f"{other}_idle 与 front 过于相似({ratio:.1%})，不能镜像冒充四视角")
    dest=ROOT/"assets/characters/scene_sprites"
    dest.mkdir(parents=True,exist_ok=True)
    result=dest/f"{key}_4dir{'' if args.approve else '.candidate'}.png"
    sheet.save(result,optimize=True)
    review=dest/f"{key}_4dir_review.png"
    make_review(sheet,review,name)
    if args.approve:
        manifest_file=dest/"sprite_manifest.json"
        manifest=json.loads(manifest_file.read_text(encoding="utf-8"))
        found=False
        for entry in manifest["entries"]:
            if entry["key"]==key:
                entry["sheet"]=f"assets/characters/scene_sprites/{key}_4dir.png"
                entry["direction_status"]="user_approved_independently_painted"
                entry["animation_status"]="verified_16_frames"
                found=True
        if not found:
            manifest["entries"].append({
              "id":args.character,"name":name,"key":key,
              "sheet":f"assets/characters/scene_sprites/{key}_4dir.png",
              "direction_status":"user_approved_independently_painted",
              "animation_status":"verified_16_frames"
            })
        manifest_file.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        registry_file=dest/"sprite_registry.js"
        raw=registry_file.read_text(encoding="utf-8").strip()
        prefix="window.NM_SPRITE_REGISTRY = "
        if not raw.startswith(prefix):raise ValueError("sprite_registry.js 格式不兼容")
        registry=json.loads(raw[len(prefix):].rstrip(";"))
        registry[key]=f"assets/characters/scene_sprites/{key}_4dir.png"
        registry_file.write_text(prefix+json.dumps(registry,ensure_ascii=False,indent=2)+";\n",encoding="utf-8")
        print("审批完成，正式PNG已接入浏览器与Pygame配置:",result)
    else:print("候选 PNG 已生成，未修改运行配置。人工检查 review 图后加 --approve 再运行。")
    return result


def main():
    parser=argparse.ArgumentParser(description="逆命江湖：Qwen独立四方向16帧精细图自动验收与打包器")
    parser.add_argument("--character",choices=sorted(CHARACTERS),required=True)
    parser.add_argument("--input",required=True,help="16 PNG 文件所在目录")
    parser.add_argument("--approve",action="store_true",help="确认人工审核通过后才正式覆盖运行配置")
    args=parser.parse_args()
    try:run(args)
    except (ValueError,FileNotFoundError,ImportError) as exc:
        print("校验失败:",exc,file=sys.stderr);return 1
    return 0


if __name__=="__main__":raise SystemExit(main())
