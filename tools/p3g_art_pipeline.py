#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""P3-G loss-aware, review-first high resolution character production.

No automatic approval and no image generation. Both operations only create
candidate files under candidate directories, never alter live sprite registry.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/"assets/characters"
FRAMES=("idle","walk1","walk2","walk3")
DIRECTIONS=("down","left","right","up")
SPRITE_PIXEL=(96,128)
MIN_FRAME=(256,384)


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def manifest_entry(char_id):
    data=json.loads((BASE/"masters/production_manifest.json").read_text(encoding="utf-8"))
    for task in data["tasks"]:
        if task["id"]==char_id:return task
    raise ValueError(f"未知角色 ID：{char_id}")


def inspect_rgba(file,min_width,min_height):
    from PIL import Image
    file=Path(file)
    if not file.is_file():raise FileNotFoundError(str(file))
    with Image.open(file) as image:
        image.load()
        if image.mode!="RGBA":raise ValueError(f"{file} 必须是RGBA透明PNG而非RGB或带背景的图")
        w,h=image.size
        if w<min_width or h<min_height:
            raise ValueError(f"{file} {w}x{h}，低于真实源图要求 {min_width}x{min_height}，禁止软件放大冒充高分辨率")
        a=image.getchannel("A")
        if a.getextrema()[0]>16 or a.getextrema()[1]<180:
            raise ValueError(f"{file} 缺乏真实透明区域或有效主体")
        box=a.point(lambda value:255 if value>32 else 0).getbbox()
        if not box:raise ValueError(f"{file} 全透明或人物不存在")
        margin=max(3,int(min(w,h)*.003))
        if box[0]<margin or box[1]<margin or box[2]>w-margin or box[3]>h-margin:
            raise ValueError(f"{file} 人物碰到画面边缘：请重生图避免裁掉头、鞋或配饰")
        return {"w":w,"h":h,"bbox":box,"sha256":sha256(file)}


def candidate_master(char_id,fullbody,outdir=None):
    from PIL import Image,ImageDraw
    record=manifest_entry(char_id)
    item=inspect_rgba(fullbody,1024,1536)
    out=(Path(outdir) if outdir else BASE/"masters/candidates").resolve()
    out.mkdir(parents=True,exist_ok=True)
    master=out/f"{char_id}_fullbody_candidate.png"
    with Image.open(fullbody) as im:
        image=im.copy()
        image.save(master,optimize=True)
        # Crop upper-body directly at source resolution; NO new pixels are hallucinated.
        bbox=item["bbox"]
        crop_size=min(image.width,image.height)
        if crop_size<1024:raise ValueError("图源不足，无法生成1024×1024真实裁切头像")
        cx=(bbox[0]+bbox[2])//2
        x=max(0,min(image.width-crop_size,cx-crop_size//2))
        y=max(0,min(image.height-crop_size,max(0,bbox[1]-int(crop_size*.08))))
        portrait=image.crop((x,y,x+crop_size,y+crop_size))
        portrait_path=out/f"{char_id}_portrait_candidate.png"
        portrait.save(portrait_path,optimize=True)
        review=Image.new("RGB",(1152,760),(21,31,43))
        preview=image.copy()
        preview.thumbnail((530,710),Image.Resampling.LANCZOS)
        portrait.thumbnail((530,530),Image.Resampling.LANCZOS)
        review.paste(preview,((540-preview.width)//2,(760-preview.height)//2),preview)
        review.paste(portrait,(550+(550-portrait.width)//2,75),portrait)
        pen=ImageDraw.Draw(review)
        pen.text((40,18),char_id+" master (candidate)",fill=(233,205,152))
        pen.text((615,630),"portrait cropped from same master",fill=(233,205,152))
        review_file=out/f"{char_id}_review.jpg"
        review.save(review_file,quality=92)
    result={"status":"CANDIDATE_NOT_APPROVED","character":char_id,"name":record["name"],
            "fullbody_file":str(master),"portrait_file":str(portrait_path),
            "review_file":str(review_file),"source":item,
            "output_sha256":{"fullbody":sha256(master),"portrait":sha256(portrait_path),"review":sha256(review_file)},
            "note":"高清尺寸、透明度等仅为技术检查；角色脸/衣服/透视一致性需要人工审核"}
    report=out/f"{char_id}_master_qa.json"
    report.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    return result


def crop_frame(im,box):
    from PIL import Image
    content=im.crop(box)
    scale=min(88/content.width,120/content.height)
    resized=content.resize((max(1,round(content.width*scale)),max(1,round(content.height*scale))),Image.Resampling.LANCZOS)
    output=Image.new("RGBA",SPRITE_PIXEL,(0,0,0,0))
    output.alpha_composite(resized,((96-resized.width)//2,126-resized.height))
    return output


def visual_diff(left,right):
    from PIL import Image,ImageChops
    a=left.resize((48,64),Image.Resampling.BILINEAR)
    b=right.resize((48,64),Image.Resampling.BILINEAR)
    diff=ImageChops.difference(a,b).convert("RGBA")
    pixels=list(diff.getdata())
    return sum(1 for px in pixels if max(px)>25)/len(pixels)


def pack_frames(char_id,input_dir,outdir=None):
    from PIL import Image,ImageOps,ImageDraw
    record=manifest_entry(char_id)
    root=Path(input_dir).resolve()
    output=(Path(outdir) if outdir else BASE/"scene_sprites/candidates").resolve()
    output.mkdir(parents=True,exist_ok=True)
    sheet=Image.new("RGBA",(SPRITE_PIXEL[0]*4,SPRITE_PIXEL[1]*4),(0,0,0,0))
    frames={};all_hashes=set();sources=[]
    for row,direction in enumerate(DIRECTIONS):
        for col,pose in enumerate(FRAMES):
            f=root/f"{direction}_{pose}.png"
            meta=inspect_rgba(f,*MIN_FRAME)
            if meta["sha256"] in all_hashes:raise ValueError(f"{f}: 内容与其他帧完全相同，拒绝重复图片")
            all_hashes.add(meta["sha256"])
            with Image.open(f) as im:cell=crop_frame(im,meta["bbox"])
            sheet.alpha_composite(cell,(col*96,row*128))
            frames[(direction,pose)]=cell
            sources.append({"frame":f.name,"source_resolution":[meta["w"],meta["h"]],"sha256":meta["sha256"]})
    for direction in DIRECTIONS:
        for pose in FRAMES[1:]:
            score=visual_diff(frames[(direction,"idle")],frames[(direction,pose)])
            if score<.015:raise ValueError(f"{direction}_{pose} 与idle帧过于相似：仅微移素材无法当作走路")
    warnings=[]
    for d in ("left","right","up"):
        diff=visual_diff(frames[("down","idle")],frames[(d,"idle")])
        if diff<.06:warnings.append(f"{d}: 与正面形象过于相似，必须人工复检是否真实转身")
    reflected=ImageOps.mirror(frames[("left","idle")])
    if visual_diff(reflected,frames[("right","idle")])<.045:
        warnings.append("右侧与左侧近似镜像；需人工检查不对称发饰/腰带/武器位置")
    name={"CHAR001":"player","NPC001":"innkeeper","NPC005":"healer","NPC002":"oldman","NPC003":"swordswoman","BOSS001":"liao","EN001":"bandit"}.get(char_id,char_id.lower())
    dest=output/f"{name}_4dir_hd_candidate.png"
    sheet.save(dest,optimize=True)
    review=Image.new("RGB",(768,1024),(42,53,63))
    pen=ImageDraw.Draw(review)
    for y in range(0,1024,32):
        for x in range(0,768,32):
            if (x//32+y//32)%2:pen.rectangle((x,y,x+31,y+31),fill=(61,74,82))
    review.paste(sheet.resize(review.size,Image.Resampling.NEAREST),(0,0),sheet.resize(review.size,Image.Resampling.NEAREST))
    review_file=output/f"{name}_4dir_hd_review.png"
    review.save(review_file)
    report={"status":"CANDIDATE_NOT_APPROVED","character":char_id,"name":record["name"],
            "sheet":str(dest),"review":str(review_file),"sheet_size":list(sheet.size),
            "frame_size":list(SPRITE_PIXEL),"sources":sources,"warnings":warnings,
            "explicit_manual_approval_required":True}
    (output/f"{name}_4dir_hd_qa.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    return report


def main():
    parser=argparse.ArgumentParser(description="P3-G 高清人物图像检查和候选资源打包（不会自动更新正式资源）")
    sub=parser.add_subparsers(dest="mode",required=True)
    a=sub.add_parser("master",help="检查高清全身母版并生成真实裁切头像候选")
    a.add_argument("--character",required=True);a.add_argument("--input",required=True);a.add_argument("--out")
    b=sub.add_parser("frames",help="校验16张独立方向图并形成96×128逐帧候选")
    b.add_argument("--character",required=True);b.add_argument("--input",required=True);b.add_argument("--out")
    args=parser.parse_args()
    try:
        if args.mode=="master":result=candidate_master(args.character,args.input,args.out)
        else:result=pack_frames(args.character,args.input,args.out)
        print(json.dumps(result,ensure_ascii=False,indent=2))
        return 0
    except (ValueError,FileNotFoundError,ImportError,OSError) as exc:
        print("P3-G 检查失败："+str(exc),file=sys.stderr)
        return 1


if __name__=="__main__":raise SystemExit(main())
