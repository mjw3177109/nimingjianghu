(()=>{"use strict";
const PERSONS=[
{id:"CHAR001",name:"沈砚",key:"player",portrait:"CHAR001_avatar.webp",note:"主角 · 穿越者"},
{id:"NPC005",name:"苏晚晴",key:"healer",portrait:"NPC005_avatar.webp",note:"青石镇药师"},
{id:"NPC001",name:"韩掌柜",key:"innkeeper",portrait:"NPC001_avatar.webp",note:"青石镇客栈掌柜"},
{id:"NPC002",name:"顾老",key:"oldman",portrait:"NPC002_avatar.webp",note:"隐世江湖前辈"},
{id:"NPC003",name:"顾青岚",key:"swordswoman",portrait:"NPC003_avatar.webp",note:"年轻剑客"},
{id:"BOSS001",name:"廖",key:"liao",portrait:"BOSS001_avatar.webp",note:"命轨操盘者"},
{id:"EN001",name:"山贼",key:"bandit",portrait:"EN001_avatar.webp",note:"山路敌人"}
];
const $=id=>document.getElementById(id),root='assets/characters/scene_sprites/';
let selected=PERSONS[0],stable=null,candidate=null,frame=0,dir='down',playing=false,lastFrame=0,token=0,masterManifest=null,spriteManifest=null;
const directions={down:0,left:1,right:2,up:3};
const loadImage=(src)=>new Promise(resolve=>{
 if(!src){resolve(null);return;}
 const im=new Image();
 im.onload=()=>resolve(im);
 im.onerror=()=>resolve(null);
 im.src=src;
});
const pick=(name)=>({name});
function checker(ctx,w,h){ctx.clearRect(0,0,w,h);for(let y=0;y<h;y+=24)for(let x=0;x<w;x+=24){ctx.fillStyle=(x/24+y/24)%2===0?'#30414c':'#43515a';ctx.fillRect(x,y,24,24);}}
function drawFrame(id,image,row,col,scale){const canvas=$(id),ctx=canvas.getContext('2d');checker(ctx,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;
 if(!image){ctx.fillStyle='#e1cfaf';ctx.textAlign='center';ctx.font='16px sans-serif';ctx.fillText('暂无可审核图像',canvas.width/2,canvas.height/2);return;}
 const sw=image.naturalWidth/4,sh=image.naturalHeight/4;
 const maxW=canvas.width-25,maxH=canvas.height-18;
 const zoom=Math.min(scale,Math.floor(maxW/sw),Math.floor(maxH/sh));
 const dw=Math.max(sw,sw*Math.max(1,zoom)),dh=Math.max(sh,sh*Math.max(1,zoom));
 ctx.drawImage(image,sw*col,sh*row,sw,sh,(canvas.width-dw)/2,(canvas.height-dh)/2,dw,dh);
}
function drawSheet(id,image){const canvas=$(id),ctx=canvas.getContext('2d');checker(ctx,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;
 if(!image){ctx.textAlign='center';ctx.fillStyle='#dcc7a7';ctx.font='16px sans-serif';ctx.fillText('尚未提交真实16帧',canvas.width/2,canvas.height/2);return;}
 ctx.drawImage(image,0,0,image.naturalWidth,image.naturalHeight,0,0,canvas.width,canvas.height);
}
function render(){const row=directions[dir]??0;const sc=Number($('scale').value);
 drawFrame('currentCanvas',stable,row,frame,sc);
 drawFrame('candidateCanvas',candidate,row,frame,sc);
 drawSheet('stableSheet',stable);drawSheet('candidateSheet',candidate);
 $('currentResolution').textContent=stable?`${stable.naturalWidth}×${stable.naturalHeight} · ${stable.naturalWidth/4}×${stable.naturalHeight/4}/帧`:'无动画母版';
 $('candidateResolution').textContent=candidate?`${candidate.naturalWidth}×${candidate.naturalHeight} · ${candidate.naturalWidth/4}×${candidate.naturalHeight/4}/帧`:'未提交';
}
async function loadCandidate(person){
 // Prefer genuine HD frame source candidates. If absent, fall back ONLY to
 // Shenyan's legacy low-res preview and label it explicitly.
 const hd=await loadImage(root+'candidates/'+person.key+'_4dir_hd_candidate.png');
 if(hd)return hd;
 return person.id==='CHAR001'?loadImage(root+'candidates/player_4dir_preview.png'):null;
}
function portraitPath(person){return 'assets/portraits/'+person.portrait;}
async function showPerson(person){
 selected=person;token++;
 const me=token;stable=null;candidate=null;
 $('characterName').textContent=person.name;
 $('characterId').textContent=person.id+' · '+person.note;
 $('portrait').src=portraitPath(person);$('portrait').onerror=()=>{$('portrait').style.visibility='hidden';};
 $('portrait').style.visibility='visible';
 for(const el of $('characterList').querySelectorAll('[data-char]'))el.setAttribute('aria-current',el.dataset.char===person.id?'true':'false');
 const record=masterManifest?.tasks?.find(x=>x.id===person.id);
 const entry=spriteManifest?.entries?.find(x=>x.id===person.id);
 const officiallyApproved=record?.master_approved===true&&record?.portrait_approved===true&&entry?.direction_status==='user_approved_independently_painted';
 const liveTrial=entry?.direction_status==='gameplay_trial_pending_user_art_review';
 $('masterStatus').textContent=officiallyApproved?'人工已审核':liveTrial?'已接入试玩 · 等你最终评审':'未审核 · 不可发布';
 $('masterStatus').style.borderColor=officiallyApproved?'#76be91':'#aa795f';
 $('stableCaption').textContent=entry?(entry.direction_status==='gameplay_trial_pending_user_art_review'?
 '【本次已经进入游戏试玩】新生成的四方向16帧，每个动作按整身图片绘制；供你实际走动后最终评审。':
 '当前游戏使用的方向图集；'+(entry.direction_status==='user_approved_independently_painted'?'方向素材标为已审核。':'侧面、背面仍为过渡派生稿。')):'尚无可玩 Sprite；显示已有角色头像供核对。';
 $('candidateCaption').textContent='加载候选中；图片不会被自动发布。';
 const version=window.NM_SPRITE_REGISTRY||{};
 $('masterCandidate').hidden=true;$('masterCandidateReport').hidden=true;
 $('masterCandidateCaption').textContent='正在检查独立母版候选……';
 const results=await Promise.all([loadImage(version[person.key]||null),loadCandidate(person),loadImage('assets/characters/masters/candidates/'+person.id+'_fullbody_candidate.png')]);
 if(me!==token)return;
 const masterCandidate=results[2];
 if(masterCandidate){
  $('masterCandidate').src=masterCandidate.src;$('masterCandidate').hidden=false;
  $('masterCandidateCaption').textContent=person.id+' · '+masterCandidate.naturalWidth+'×'+masterCandidate.naturalHeight+' 源像素 · 候选，未人工审核，不是16帧Sprite';
  $('masterCandidateReport').href='assets/characters/masters/candidates/'+person.id+'_master_qa.json';$('masterCandidateReport').hidden=false;
 }else $('masterCandidateCaption').textContent=person.id+'：尚无通过技术检查的独立母版候选。';
 stable=results[0];candidate=results[1];
 if(!candidate){$('candidateCaption').textContent='尚未提交独立四方向16帧候选，不以镜像或缩放图填充。';}
 else if(candidate.naturalWidth<384){
  $('candidateCaption').textContent='旧版24×32/帧低分辨率候选；仅可检查方向和动作，不属于正式高清母版。';
 }else{
  $('candidateCaption').textContent='已找到高清 Sprite 候选；仍需确认真实独立四方向、服饰与母版一致，未经审核不能发布。';
 }
 $('reviewStatus').textContent=person.id+'：'+(officiallyApproved?'已审核':liveTrial?'已进入试玩，待最终评审':'未审核');
 render();
}
function tick(ts){
 if(playing&&ts-lastFrame>170){lastFrame=ts;frame=frame===3?1:frame+1;$('pose').value=String(frame);render();}
 requestAnimationFrame(tick);
}
async function init(){
 const list=$('characterList');
 for(const person of PERSONS){
  const btn=document.createElement('button');btn.className='pick';btn.type='button';btn.dataset.char=person.id;
  const img=document.createElement('img');img.src=portraitPath(person);img.alt='';img.loading='lazy';
  const text=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small');
  strong.textContent=person.name;small.textContent=person.note;text.append(strong,small);btn.append(img,text);
  btn.addEventListener('click',()=>showPerson(person));list.append(btn);
 }
 $('counter').textContent='7 / 7';
 try{
  const [m,s]=await Promise.all([
   fetch('assets/characters/masters/production_manifest.json').then(r=>{if(!r.ok)throw Error('missing masters');return r.json();}),
   fetch('assets/characters/scene_sprites/sprite_manifest.json').then(r=>{if(!r.ok)throw Error('missing sprites');return r.json();})
  ]);
  masterManifest=m;spriteManifest=s;
  $('sourceCount').textContent='高清母版：'+m.tasks.filter(x=>x.master_approved&&x.portrait_approved).length+' / '+m.tasks.length+' 已审核';
 }catch(err){$('sourceCount').textContent='母版清单载入失败：请检查项目部署';}
 $('direction').addEventListener('change',e=>{dir=e.target.value;render()});
 $('pose').addEventListener('change',e=>{frame=Number(e.target.value);render()});
 $('scale').addEventListener('change',render);
 $('play').addEventListener('click',()=>{
  playing=!playing;$('play').setAttribute('aria-pressed',String(playing));
  $('play').textContent=playing?'Ⅱ 暂停动画':'▶ 播放行走';if(playing&&frame===0)frame=1;
  $('pose').value=String(frame);render();
 });
 await showPerson(PERSONS[0]);requestAnimationFrame(tick);
}
init();
})();
