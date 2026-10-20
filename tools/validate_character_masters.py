#!/usr/bin/env python3
"""Check genuinely high resolution approved character image candidates.
No image generation, upscaling, or manual approval happens in this script.
"""
from __future__ import annotations
import argparse, json,sys,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def check_image(file,minw,minh):
    from PIL import Image
    image=Image.open(file)
    image.load()
    w,h=image.size
    if w<minw or h<minh:raise ValueError(f"{file}: 原生尺寸 {w}x{h} 低于 {minw}x{minh}，禁止低清放大伪装")
    if image.mode!='RGBA':raise ValueError(f"{file}: 必须RGBA透明背景，不接受整张场景截图")
    a=image.getchannel('A')
    lo,hi=a.getextrema()
    if lo>16 or hi<200:raise ValueError(f"{file}: 缺少真实透明背景或主体")
    bbox=a.point(lambda v: 255 if v>32 else 0).getbbox()
    if not bbox:raise ValueError(f"{file}: 透明空图")
    if bbox[0]<=1 or bbox[1]<=1 or bbox[2]>=w-1 or bbox[3]>=h-1:
        raise ValueError(f"{file}: 主体触及图片边缘，疑似裁切人物")
    return {'size':[w,h],'mode':image.mode,'alpha_bbox':bbox,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}
def main():
    ap=argparse.ArgumentParser(description="P3F 角色高清母版验证（不会自动批准）")
    ap.add_argument('--character',help="仅检查一个角色 CHAR001 等")
    ap.add_argument('--strict',action='store_true',help="有缺失或不合格时返回非零退出码")
    args=ap.parse_args()
    conf=json.loads((ROOT/'assets/characters/masters/production_manifest.json').read_text(encoding='utf-8'))
    reports=[];failed=0
    for task in conf['tasks']:
        if args.character and task['id']!=args.character:continue
        details={'character':task['id'],'name':task['name'],'checks':{},'manual_review':task['status']}
        for typ,size in [('master',(1024,1536)),('portrait',(1024,1024))]:
            file=ROOT/task[typ]
            try:details['checks'][typ]=check_image(file,*size)
            except (FileNotFoundError,ValueError,ImportError,OSError) as ex:
                details['checks'][typ]={'status':'PENDING','reason':str(ex)};failed+=1
        reports.append(details)
    print(json.dumps({'checks':reports,'missing_or_invalid':failed,'all_ready_for_human_review':failed==0},ensure_ascii=False,indent=2))
    return 1 if args.strict and failed else 0
if __name__=='__main__':sys.exit(main())
