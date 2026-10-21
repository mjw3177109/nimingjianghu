(()=>{'use strict';
try {
const world=window.GAME_WORLD, canvas=document.getElementById('game'), ctx=canvas.getContext('2d'); ctx.imageSmoothingEnabled=false;ctx.setTransform(2,0,0,2,0,0);
const $=id=>document.getElementById(id); const CELL=20, W=32,H=18;
// Shared 32px modular maps. Never draw baked scene images in gameplay.
const tileMaps={town:window.NM_TOWN_TILEMAP,road:window.NM_ROAD_TILEMAP,cave:window.NM_CAVE_TILEMAP};
for(const [id,map] of Object.entries(tileMaps)){if(!map||map.tile_size!==32||!Array.isArray(map.collision)||map.collision.length!==map.width*map.height)throw Error('P3 tilemap missing: '+id);}
const tileAtlases={};
for(const [id,map] of Object.entries(tileMaps)){
  const image=new Image();
  image.onerror=()=>{image.onerror=null;image.src=map.atlas;};
  image.src=map.atlas.replace(/\.svg$/, '_hd64.svg');
  tileAtlases[id]=image;
}
const structData=window.NM_STRUCTURE_DATA;
if(!structData||!structData.town||!structData.road||!structData.cave)throw Error('P3-F modular structures manifest unavailable');
const structureImages={};
for(const list of Object.values({town:structData.town,road:structData.road,cave:structData.cave})){
 for(const part of list){
  if(structureImages[part.image])continue;
  const img=new Image();img.src=part.image;structureImages[part.image]=img;
 }
}
function paintStructureObject(obj,cam){
 const sx=obj.x*32-cam.x,sy=obj.y*32-cam.y,w=obj.w*32,h=obj.h*32;
 if(sx>=640||sy>=360||sx+w<=0||sy+h<=0)return;
 const img=structureImages[obj.image];
 if(img&&img.complete&&img.naturalWidth)ctx.drawImage(img,Math.round(sx),Math.round(sy),w,h);
}
function paintStructureLayer(scene,layer,cam){
 for(const obj of structData[scene]||[])if(obj.layer===layer)paintStructureObject(obj,cam);
}
function currentTilemap(){return tileMaps[state.map]}
function townCamera(){const map=currentTilemap(),player=visualPlayer(),px=(player.x+.5)*32,py=(player.y+.5)*32;return {x:Math.round(Math.max(0,Math.min(px-320,map.width*32-640))),y:Math.round(Math.max(0,Math.min(py-180,map.height*32-360)))}}
function canvasPoint(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*640,y:(e.clientY-r.top)/r.height*360}}
function townTileFromScreen(sx,sy){const c=townCamera();return {x:Math.floor((sx+c.x)/32),y:Math.floor((sy+c.y)/32)}}
// Click the visible body rather than the invisible 32px grid cell.
// All characters share the same 54x72 render anchor; player is excluded.
function pickActorAtScreen(sx,sy){
 const cam=townCamera(),scene=world.maps[state.map];
 const actors=[
  ...(scene.npcs||[]).map(a=>({x:a.x,y:a.y,type:'npc',id:a.id})),
  ...(state.banditAlive?(scene.enemies||[]):[]).map(a=>({x:a.x,y:a.y,type:'enemy'}))
 ];
 return actors.filter(a=>{
  const centerX=(a.x+.5)*32-cam.x,feetY=(a.y+1)*32-cam.y;
  const rise=feetY-sy;
  return rise>=5&&rise<=69&&Math.abs(sx-centerX)<=(rise>46?17:22);
 }).sort((a,b)=>b.y-a.y)[0]||null;
}

const spriteKeys={innkeeper:'innkeeper',healer:'healer',oldman:'oldman',bandit:'bandit'};
let state={map:'town',pos:{x:14,y:12},tileSchema:2,facing:'down',route:[],moving:null,pending:null,quest:0,banditAlive:true,manual:false,trace:false,visitedCave:false,destiny:0,day:1,hp:100,maxHp:100,mp:50,maxMp:50,lv:1,exp:0,coins:10,potions:2,skills:['基础剑法'],flags:{},journal:['一个陌生的江湖。这里的一切似曾相识。']};
const freshState=JSON.parse(JSON.stringify(state));
let dialogue=null,battle=null,frame=0,last=performance.now(),moveAcc=0,focusHover=null,transitionLock=false;
let running=false,raf=0,epoch=0;
const WALK_TIME=.115;
let motion=null,walkStepIndex=0;
const faceOrder={down:0,left:1,right:2,up:3};
function visualPlayer(){if(!motion)return state.pos;const t=Math.max(0,Math.min(1,motion.progress));return {x:motion.from.x+(motion.to.x-motion.from.x)*t,y:motion.from.y+(motion.to.y-motion.from.y)*t}}
function facingForMove(from,to){if(to.x>from.x)return 'right';if(to.x<from.x)return 'left';if(to.y>from.y)return 'down';return 'up';}
const SAVE_KEY='nimingjianghu_tile_v2',OLD_KEYS=['nimingjianghu_tile_v1','nimingjianghu_final_demo_v1','nimingjianghu_save_v3','nimingjianghu_chibi_v02'];
function readSaved(){for(const key of [SAVE_KEY,...OLD_KEYS]){try{const v=JSON.parse(localStorage.getItem(key)||'null');if(v&&v.state&&world.maps[v.state.map]&&typeof v.state.quest==='number'&&typeof v.state.hp==='number'){const st={...v.state,route:[],moving:null,pending:null};if(st.tileSchema!==2){if(st.map==='town'){if(key!=='nimingjianghu_tile_v1')st.pos={x:14,y:12};}
else st.pos={x:tileMaps[st.map].spawn[0],y:tileMaps[st.map].spawn[1]};st.tileSchema=2;}
if(!st.pos||occupiedTile(st.map,st.pos.x,st.pos.y,st.banditAlive!==false))st.pos={x:tileMaps[st.map].spawn[0],y:tileMaps[st.map].spawn[1]};
return st;}}catch(e){console.warn('存档不可读：',key)}}return null}
function saveGame(){if(!running)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:3,state:{...state,tileSchema:2,route:[],moving:null,pending:null}}));window.dispatchEvent(new Event('nm-save-updated'));}catch(e){console.warn('无法存档',e)}}
function stop(){running=false;epoch++;if(raf){cancelAnimationFrame(raf);raf=0}dialogue=null;battle=null;for(const id of ['dialogue','battle','panel'])$(id).classList.add('hidden')}
function launch(saved){stop();motion=null;walkStepIndex=0;state=saved?{...JSON.parse(JSON.stringify(freshState)),...saved,route:[],pending:null}:JSON.parse(JSON.stringify(freshState));running=true;last=performance.now();moveAcc=0;updateUI();raf=requestAnimationFrame(tick);if(!saved){const id=epoch;setTimeout(()=>{if(running&&epoch===id)scripted(world.dialogue.intro,()=>updateUI())},500)}else notice('已恢复江湖存档。');return true;}

// P3-I: seamless full-body renderer. Legacy split-body SVG sheets are kept
// for comparison in the art review studio but are NEVER used in gameplay.
const imgs={},animatedSheets={};
const characters={player:'assets/sprites/player.png',innkeeper:'assets/sprites/innkeeper.png',
 healer:'assets/sprites/healer.png',oldman:'assets/sprites/oldman.png',bandit:'assets/sprites/bandit.png'};
const spritePolicy={minimumFrameWidth:96,minimumFrameHeight:128,previewDisabled:true};
for(const [k,path] of Object.entries(characters)){
 const full=new Image();full.src=path;imgs[k]=full;
 const candidate=(window.NM_SPRITE_REGISTRY||{})[k]||'';
 // A genuine approved HD sheet must be a separate PNG; reject ALL legacy
 // SVG proxy sheets and the old 24x32 screenshot-derived ?shenyan=16 sheet.
 if(/_4dir\.png$/i.test(candidate)){
  const sheet=new Image();sheet.src=candidate;animatedSheets[k]=sheet;
 }
}
function spriteDrawSize(key,image){
 const targetHeight=72; // All actors share a 72px height and tile-bottom feet anchor.
 const iw=image&&image.naturalWidth||60,ih=image&&image.naturalHeight||110;
 // Wide enemies need more horizontal room, not a 25% shorter body.
 const scale=Math.min(targetHeight/ih,76/iw);
 return {width:Math.round(iw*scale),height:Math.round(ih*scale)};
}
function drawActorSprite(key,feetX,feetY,facing,moving=false){
 const sheet=animatedSheets[key],dir=faceOrder[facing]??0;
 const stride=[1,2,3,2]; // alternating left-foot, neutral, right-foot, neutral
 // Use the distance walked, not global render-frame time: every tile alternates the lead foot.
 const halfStep=motion&&motion.progress>=0.5?1:0;
 const beat=moving?stride[((walkStepIndex-1)*2+halfStep)%stride.length]:0;
 ctx.save();
 ctx.imageSmoothingEnabled=true; // Q-painted characters keep antialiased lines; tiles remain crisp.
 if(sheet&&sheet.complete&&sheet.naturalWidth>=384&&sheet.naturalHeight>=512&&sheet.naturalWidth%4===0&&sheet.naturalHeight%4===0){
  const fw=sheet.naturalWidth/4,fh=sheet.naturalHeight/4;
  // The frame is always a single continuous rectangle, never upper/lower clips.
  ctx.drawImage(sheet,beat*fw,dir*fh,fw,fh,Math.round(feetX-27),Math.round(feetY-71),54,72);
 }else{
  const image=imgs[key];
  if(image&&image.complete&&image.naturalWidth){
   const {width,height}=spriteDrawSize(key,image);
   // Translate the ENTIRE sprite a fraction of a pixel: no torso/leg seams.
   const bob=moving&&Math.floor(frame/9)%2?-1:0;
   ctx.drawImage(image,Math.round(feetX-width/2),Math.round(feetY-height+1+bob),width,height);
  }else{ctx.fillStyle='#dfc9ad';ctx.fillRect(feetX-10,feetY-57,20,55)}
 }
 ctx.restore();
}
function posEq(a,b){return a.x===b.x&&a.y===b.y}
function inBounds(x,y){const m=currentTilemap();return x>=0&&y>=0&&x<m.width&&y<m.height}
// One collision rule for pathfinding, saved positions and map-entry spawns.
function occupiedTile(mapName,x,y,banditAlive=true){
 const m=tileMaps[mapName],scene=world.maps[mapName];
 if(!m||!scene||!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=m.width||y>=m.height)return true;
 if(m.collision[y*m.width+x]===1)return true;
 for(const obj of structData[mapName]||[]){
  const f=obj.solid_footprint;
  if(f&&x>=obj.x+f.x&&x<obj.x+f.x+f.w&&y>=obj.y+f.y&&y<obj.y+f.y+f.h)return true;
 }
 // Painted actors wider than one tile reserve neighboring cells horizontally.
 for(const npc of scene.npcs||[])if(Math.abs(npc.x-x)<=1&&npc.y===y)return true;
 if(banditAlive)for(const enemy of scene.enemies||[])if(Math.abs(enemy.x-x)<=1&&enemy.y===y)return true;
 return false;
}
function blocked(x,y){return occupiedTile(state.map,x,y,state.banditAlive)}
function bfs(from,to){if(blocked(to.x,to.y))return null;let q=[from],seen=new Set([from.x+','+from.y]),prev={};while(q.length){let a=q.shift(),key=a.x+','+a.y;if(posEq(a,to)){let r=[],cur=key;while(cur!==from.x+','+from.y){let [xx,yy]=cur.split(',').map(Number);r.push({x:xx,y:yy});cur=prev[cur]}return r.reverse()}for(let [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){let nx=a.x+dx,ny=a.y+dy,k=nx+','+ny;if(blocked(nx,ny)||seen.has(k))continue;seen.add(k);prev[k]=key;q.push({x:nx,y:ny})}}return null}
function nearestReach(target,avoidCenter=false){
 const candidates=[];
 // A large altar occupies multiple tiles: reach its edge, not the solid center.
 const maxRadius=avoidCenter?2:1;
 for(let radius=avoidCenter?1:0;radius<=maxRadius;radius++){
  for(let dx=-radius;dx<=radius;dx++)for(let dy=-radius;dy<=radius;dy++){
   if(Math.abs(dx)+Math.abs(dy)!==radius)continue;
   const t={x:target.x+dx,y:target.y+dy},r=bfs(state.pos,t);
   if(r)candidates.push({r,t,radius});
  }
 }
 candidates.sort((a,b)=>a.radius-b.radius||a.r.length-b.r.length);
 return candidates[0]||null;
}
function travelTo(x,y,act){let n=nearestReach({x,y},act&&['npc','object'].includes(act.type));if(!n){notice('这里暂时无法抵达');return}state.route=n.r;state.pending=act?{...act,t:n.t}:null; if(!n.r.length&&state.pending&&!motion)finishPending()}
function finishPending(){if(!state.pending)return;let p=state.pending;state.pending=null; if(p.type==='npc')talk(p.id);else if(p.type==='enemy')startBattle();else if(p.type==='object')objectClick(p.id);else if(p.type==='exit')changeMap(p.to,p.spawn);else if(p.type==='hotspot')notice(p.id==='inn_door'?'客栈里传来阵阵饭香，韩掌柜正在门口。':'药铺里弥漫着药香，苏晚晴可以为你指路。')}
function changeMap(to,spawn){state.map=to;const wanted=to==='town'?{x:38,y:12}:{x:spawn[0],y:spawn[1]};state.pos=occupiedTile(to,wanted.x,wanted.y,state.banditAlive)?{x:tileMaps[to].spawn[0],y:tileMaps[to].spawn[1]}:wanted;state.route=[];motion=null;state.pending=null;state.day=Math.max(1,state.day);if(to==='cave')state.visitedCave=true;notice('进入 '+world.maps[to].name);updateUI()}
function notice(msg){$('status').textContent=msg; $('hint').textContent=msg;clearTimeout(notice.timer); notice.timer=setTimeout(()=>$('hint').textContent='点击移动 · 点击人物交谈 · 点击出口切换地图',3600)}
function scripted(lines,done){dialogue={lines,idx:0,done};$('dialogue').classList.remove('hidden');showLine()}
function showLine(){if(!dialogue)return;let row=dialogue.lines[dialogue.idx];$('speaker').textContent=row[0];$('dialogueText').textContent=row[1];const names={'沈砚':'CHAR001','廖':'BOSS001','韩掌柜':'NPC001','顾老':'NPC002','苏晚晴':'NPC005','顾青岚':'NPC003','？？？':'BOSS001'};$('dialoguePortrait').src='assets/portraits/'+(names[row[0]]||'CHAR001')+'_avatar.webp'}
function finishDialogue(){if(!dialogue)return;const d=dialogue;dialogue=null;$('dialogue').classList.add('hidden');if(d.done)d.done();updateUI()}
function nextLine(){if(!dialogue)return;dialogue.idx++;if(dialogue.idx<dialogue.lines.length){showLine();return}finishDialogue()}
function skipIntro(){if(!dialogue||dialogue.lines!==world.dialogue.intro)return;finishDialogue();notice('已进入青石镇：点击道路移动，点击韩掌柜接任务。')}
function journal(text){state.journal.unshift(text);state.journal=state.journal.slice(0,10);$('journal').textContent=state.journal[0]}
function advanceQuest(n,info){state.quest=Math.max(state.quest,n);if(info)journal(info);updateUI()}
function talk(id){if(id==='healer'&&state.potions<2){state.potions++;notice('苏晚晴赠送你一瓶疗伤药')}if(id==='innkeeper'&&state.quest===0){scripted(world.dialogue.innkeeper,()=>advanceQuest(1,'韩掌柜托你解决山路上的山贼。'));return}
 if(id==='oldman'&&state.quest<3){scripted(world.dialogue.oldman,()=>{if(state.quest>=2)advanceQuest(3,'顾老说山洞里可能藏着关键线索。')});return}
 scripted(world.dialogue[id]||[['江湖客','江湖路远，后会有期。']],()=>{})}
function objectClick(id){if(id==='manual'){if(!state.manual){state.manual=true;state.skills.push('破风一剑');state.coins+=10;notice('获得武功：破风一剑，银两+10');journal('山洞中找到了旧秘籍。上面提到“命轨”的异常。');if(state.quest>=2)advanceQuest(3);updateUI()}else notice('秘籍已取走');return}
 if(id==='trace'){if(!state.trace){state.trace=true;state.destiny=25;notice('命痕石台发生共鸣：逆命值 +25');journal('原本的剧情，被某人有意改写了。');if(state.manual){advanceQuest(4,'命痕碎片透露：有人故意把你带进这个江湖。');scripted([['沈砚','不对……我记得这里从来没有这块石台。'],['？？？','你终于注意到了。'],['沈砚','谁在说话？']],()=>{})}}else notice('石台已经沉寂');return}}
function drawBattleActor(canvasId,key,row,pose){
 const battleCanvas=$(canvasId),c=battleCanvas.getContext('2d');if(!c)return;
 c.clearRect(0,0,112,140);c.imageSmoothingEnabled=true;
 const sprite=animatedSheets[key];
 if(sprite&&sprite.complete&&sprite.naturalWidth>=384&&sprite.naturalHeight>=512){
  const fw=sprite.naturalWidth/4,fh=sprite.naturalHeight/4;
  const h=124,w=Math.min(104,Math.round(h*fw/fh));
  c.drawImage(sprite,pose*fw,row*fh,fw,fh,Math.round((112-w)/2),140-h-5,w,h);
 }else{
  const old=imgs[key];
  if(old&&old.complete&&old.naturalWidth){
   const scale=Math.min(124/old.naturalHeight,104/old.naturalWidth);
   const w=Math.round(old.naturalWidth*scale),h=Math.round(old.naturalHeight*scale);
   c.drawImage(old,Math.round((112-w)/2),140-h-5,w,h);
  }
 }
}
function drawBattleActors(){
 drawBattleActor('battlePlayerCanvas','player',1,frame%8<4?0:1);
 drawBattleActor('battleEnemyCanvas','bandit',2,frame%12<6?0:1);
}
function startBattle(){if(!state.banditAlive)return;state.route=[];battle={hp:54,enemyMax:54,guard:false,turn:0,won:false};for(const button of document.querySelectorAll('.battle-buttons button'))button.disabled=false;$('battle').classList.remove('hidden');$('battleLog').textContent='山贼：把银子留下，饶你过去！';drawBattleActors();updateUI()}
function strike(action){if(!battle||battle.won)return;let msg='',dmg=0;if(action==='attack'){dmg=12+Math.floor(Math.random()*9);msg='基础剑法命中，造成 '+dmg+' 点伤害。'}else if(action==='skill'){if(state.mp<8){$('battleLog').textContent='内力不足！';return}state.mp-=8;dmg=20+Math.floor(Math.random()*9);msg='破风一剑！剑气凌厉，造成 '+dmg+' 点伤害。'}else if(action==='heal'){if(state.potions<1){$('battleLog').textContent='疗伤药不足';return}state.potions--;let heal=Math.min(36,state.maxHp-state.hp);state.hp+=heal;msg='服下疗伤药，恢复 '+heal+' 点气血。'}else if(action==='defend'){battle.guard=true;msg='凝神格挡，下次受到的伤害减半。'}battle.hp=Math.max(0,battle.hp-dmg);if(battle.hp===0){battle.won=true;for(const button of document.querySelectorAll('.battle-buttons button'))button.disabled=true;$('battleLog').textContent=msg+' 山贼倒下了，你获得20经验和22两。';state.banditAlive=false;state.coins+=22;state.exp+=20;state.lv=2;state.hp=Math.min(state.maxHp,state.hp+10);advanceQuest(2,'山贼已被击败，山洞的道路终于安全。');setTimeout(()=>{$('battle').classList.add('hidden');battle=null;updateUI();scripted([['沈砚','居然真的打赢了……看来得去山洞看看。']],()=>{})},950);return}
 let hit=Math.max(1,8+Math.floor(Math.random()*6)-(battle.guard?7:0));state.hp=Math.max(0,state.hp-hit);msg+=' 山贼反击，造成 '+hit+' 点伤害。';battle.guard=false; if(!state.hp){$('battle').classList.add('hidden');battle=null;state.hp=75;state.pos={x:1,y:9};notice('你负伤退回山路起点，气血恢复至75。');scripted([['沈砚','差点送命。还是先恢复再挑战。']],()=>{});}else $('battleLog').textContent=msg;updateUI()}
function maybeEnding(){if(state.quest>=4&&state.map==='town'&&!state.flags.ended){state.flags.ended=true;scripted(world.dialogue.ending,()=>{state.quest=5;journal('Demo 第一章完成：廖的棋局才刚刚开始。');notice('第一章完成 · 下一阶段敬请期待');updateUI()})}}
function taskText(){return ["初入青石镇：与客栈掌柜交谈","山贼挡路：前往山路击败山贼","山洞疑云：进入废弃山洞","命痕异变：取得秘籍并调查石台","返乡迷局：返回青石镇","Demo 第一章完成！"][Math.min(state.quest,5)]}
function updateUI(){if(running)saveGame();$('location').textContent=world.maps[state.map].name;$('quest').textContent=taskText();$('hpText').textContent=`${state.hp} / ${state.maxHp}`;$('hpBar').style.width=state.hp/state.maxHp*100+'%';$('mpText').textContent=`${state.mp} / ${state.maxMp}`;$('mpBar').style.width=state.mp/state.maxMp*100+'%';$('level').textContent=state.lv;$('day').textContent='第 '+state.day+' 天';$('destiny').textContent=state.destiny;$('potions').textContent=state.potions;if(battle){$('battlePlayerHp').textContent=state.hp;$('battleEnemyHp').textContent=battle.hp}}
function interactClick(gx,gy){if(dialogue){nextLine();return}if(battle)return;let m=world.maps[state.map];if(state.map==='town'){for(const spot of tileMaps.town.objects){if(spot.kind==='hotspot'&&gx===spot.tile[0]&&gy===spot.tile[1]){travelTo(spot.stand_at[0],spot.stand_at[1],{type:'hotspot',id:spot.id});return;}}}for(let npc of m.npcs){if(gx===npc.x&&gy>=npc.y-2&&gy<=npc.y){travelTo(npc.x,npc.y,{type:'npc',id:npc.id});return}}for(let en of m.enemies||[]){if(state.banditAlive&&gx===en.x&&gy>=en.y-2&&gy<=en.y){travelTo(en.x,en.y,{type:'enemy'});return}}for(let ob of m.objects||[]){if(gx===ob.x&&gy>=ob.y-1&&gy<=ob.y){travelTo(ob.x,ob.y,{type:'object',id:ob.id});return}}for(let ex of m.exits){if(gx===ex.x&&gy===ex.y){travelTo(ex.x,ex.y,{type:'exit',to:ex.to,spawn:ex.spawn});return}}
 let path=bfs(state.pos,{x:gx,y:gy});if(path){state.route=path;state.pending=null}else notice('这里有障碍，请点击道路。')}
function drawLabel(text,x,y){ctx.font='9px sans-serif';let ww=ctx.measureText(text).width+10;ctx.fillStyle='#101716c9';ctx.fillRect(x-ww/2,y-22,ww,15);ctx.fillStyle='#f4e2b1';ctx.fillText(text,x-ww/2+5,y-11)}
function glow(x,y,col){ctx.fillStyle=col;ctx.fillRect(x*CELL+7,y*CELL+14,7,3);ctx.fillRect(x*CELL+9,y*CELL+12,3,7)}

function drawTileTown(){
 const map=currentTilemap(),atlas=tileAtlases[state.map],cam=townCamera(),sz=32;ctx.fillStyle=state.map==='cave'?'#252f34':'#546b60';ctx.fillRect(0,0,640,360);
 const x0=Math.max(0,Math.floor(cam.x/sz)),y0=Math.max(0,Math.floor(cam.y/sz));
 const x1=Math.min(map.width-1,Math.ceil((cam.x+640)/sz)),y1=Math.min(map.height-1,Math.ceil((cam.y+360)/sz));
 const sourceTile=atlas&&atlas.naturalWidth?atlas.naturalWidth/map.atlas_columns:32;
 const paint=layer=>{const cells=map.layers[layer];if(!cells||!atlas.complete||!atlas.naturalWidth)return;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=cells[y*map.width+x];if(i<0)continue;ctx.drawImage(atlas,(i%map.atlas_columns)*sourceTile,Math.floor(i/map.atlas_columns)*sourceTile,sourceTile,sourceTile,x*32-cam.x,y*32-cam.y,32,32)}};
 paint('ground');paint('water');paint('terrain');paint('building');paint('deco_low');
 paintStructureLayer(state.map,'base',cam);
 function label(text,x,y){const px=(x+.5)*32-cam.x,py=y*32-cam.y;if(px>-80&&px<720&&py>-80&&py<430)drawLabel(text,px,py)}
 if(state.map==='town'){label('客栈',7,8);label('药铺',30,8)}
 // Painter's algorithm: every actor, railing, canopy and front structure has
 // a world-space foot depth. Do not paint every foreground object over every actor.
 const actors=[];
 for(const npc of world.maps[state.map].npcs||[])actors.push({x:npc.x,y:npc.y,sprite:npc.icon==='shop'?'innkeeper':npc.icon==='heal'?'healer':'oldman',name:npc.name,id:npc.id});
 if(state.map==='road'&&state.banditAlive)for(const enemy of world.maps.road.enemies||[])actors.push({x:enemy.x,y:enemy.y,sprite:'bandit',name:enemy.name+' ⚔'});
 const showPos=visualPlayer();actors.push({x:showPos.x,y:showPos.y,sprite:'player',name:'',facing:state.facing||'down',moving:!!motion&&motion.progress<1});
 const drawQueue=[];
 for(const actor of actors)drawQueue.push({depth:actor.y+.5,priority:1,paint(){
  const px=(actor.x+.5)*32-cam.x,py=(actor.y+1)*32-cam.y;
  if(px<-45||px>685||py<-70||py>430)return;
  ctx.fillStyle='#16272988';ctx.beginPath();ctx.ellipse(px,py-3,13,4,0,0,Math.PI*2);ctx.fill();
  const facing=actor.facing||(actor.sprite==='healer'?'left':actor.sprite==='bandit'?'left':'down');
  drawActorSprite(actor.sprite,px,py,facing,actor.moving||false);
 }});
 // Back bridge rail is behind walkers; front rail is ahead of walkers on
 // northern bridge tiles, but behind a walker already south of that rail.
 if(atlas&&atlas.complete&&atlas.naturalWidth&&map.layers.front){
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   const i=map.layers.front[y*map.width+x];if(i<0)continue;
   const depth=state.map==='town'&&i===16?y-.5:state.map==='town'&&i===17?y:state.map==='town'&&i===22?22:y+.5;
   drawQueue.push({depth,priority:2,paint(){
    ctx.drawImage(atlas,(i%map.atlas_columns)*sourceTile,Math.floor(i/map.atlas_columns)*sourceTile,sourceTile,sourceTile,x*32-cam.x,y*32-cam.y,32,32);
   }});
  }
 }
 for(const obj of structData[state.map]||[])if(obj.layer==='front'){
  drawQueue.push({depth:obj.occlusion_depth??obj.y+obj.h-.5,priority:2,paint(){paintStructureObject(obj,cam)}});
 }
 drawQueue.sort((a,b)=>a.depth-b.depth||a.priority-b.priority);
 for(const item of drawQueue)item.paint();
 // Labels are UI overlays, not world geometry; keep them readable.
 for(const actor of actors){
  if(actor.name)label(actor.name,actor.x,actor.y-(72-24)/32);
  if(actor.id==='innkeeper'&&state.quest===0)label('!',actor.x,actor.y-(72+4)/32);
 }
 if(state.map==='cave'){
  for(const obj of world.maps.cave.objects||[]){
   if(obj.id==='manual'&&state.manual){const image=atlas,x=obj.x*32-cam.x,y=obj.y*32-cam.y;if(image.complete&&image.naturalWidth)ctx.drawImage(image,(13%map.atlas_columns)*sourceTile,Math.floor(13/map.atlas_columns)*sourceTile,sourceTile,sourceTile,x,y,32,32);}
   if(obj.id==='trace'&&state.trace){ctx.fillStyle='#acc4b888';ctx.beginPath();ctx.ellipse((obj.x+.5)*32-cam.x,(obj.y+.5)*32-cam.y,10,5,0,0,Math.PI*2);ctx.fill();}
   label(obj.name,obj.x,obj.y);
  }
 }
 for(const ex of world.maps[state.map].exits){const exx=(ex.x+.5)*32-cam.x;if(exx>-70&&exx<710)label(ex.label,ex.x,ex.y-0.15)}
 // Soft floor-level destination glint; never render a square debug tile.
 if(state.route.length){
  const q=state.route[state.route.length-1];
  if(q.x>=0&&q.y>=0&&q.x<map.width&&q.y<map.height){
   const sx=(q.x+.5)*32-cam.x,sy=(q.y+.85)*32-cam.y;
   if(sx>=0&&sx<640&&sy>=0&&sy<360){
    ctx.save();
    ctx.fillStyle='rgba(255,221,153,.65)';
    ctx.beginPath();ctx.ellipse(sx,sy,9,3,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(36,46,51,.75)';
    ctx.beginPath();ctx.ellipse(sx,sy,5,1.5,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
   }
  }
 }
}
function draw(){drawTileTown()}
function drawSprite(k,x,y){const im=imgs[k];const px=x*20-9,py=y*20-42;ctx.fillStyle='#0a131c66';ctx.beginPath();ctx.ellipse(x*20+10,y*20+17,13,5,0,0,Math.PI*2);ctx.fill();if(im.complete&&im.naturalWidth){ctx.save();ctx.shadowColor='#161b2199';ctx.shadowBlur=2;ctx.drawImage(im,px,py,38,61);ctx.restore()}else{ctx.fillStyle='#dec79e';ctx.fillRect(px+7,py+13,24,47)}}
function tick(ts){if(!running){raf=0;return}frame++;
 let delta=Math.min((ts-last)/1000,.1);last=ts;
 if(!dialogue&&!battle){
  if(motion){
   motion.progress=Math.min(1,motion.progress+delta/WALK_TIME);
   if(motion.progress>=1){
    motion=null;
    // Finish the last step before opening dialogue, battle or an exit.
    if(!state.route.length){finishPending();maybeEnding();}
   }
  }
  moveAcc+=delta;
  if(!motion&&moveAcc>=WALK_TIME&&state.route.length){
   moveAcc=0;
   const from={...state.pos},to=state.route.shift();
   state.facing=facingForMove(from,to);state.pos=to;walkStepIndex++;
   motion={from,to,progress:0};
  }
 }
 try{draw();if(battle)drawBattleActors()}catch(error){
  console.error('[逆命江湖] 渲染异常',error);running=false;raf=0;
  window.dispatchEvent(new CustomEvent('nm-game-start-failed',{detail:{message:'地图渲染失败：'+String(error&&error.message||error)}}));return;
 }
 raf=requestAnimationFrame(tick)}
canvas.addEventListener('click',e=>{
 if(!running)return;
 const p=canvasPoint(e),target=townTileFromScreen(p.x,p.y);
 // Keep dialogue clicks consistent with the existing input contract.
 if(!dialogue&&!battle){
  const actor=pickActorAtScreen(p.x,p.y);
  if(actor){travelTo(actor.x,actor.y,{type:actor.type,id:actor.id});return;}
 }
 interactClick(target.x,target.y);
});
$('nextDialogue').addEventListener('click',nextLine);$('skipIntro').addEventListener('click',skipIntro);for(let b of document.querySelectorAll('.battle-buttons button'))b.addEventListener('click',()=>strike(b.dataset.action));
function openPanel(title,body){$('panelTitle').textContent=title;$('panelContent').innerHTML=body;$('panel').classList.remove('hidden')}
$('inventory').onclick=()=>openPanel('江湖背包',`<p>银两：${state.coins} 两</p><p>疗伤药：${state.potions} 瓶</p><p>武功：${state.skills.join('、')}</p><p>${state.manual?'✓ 已获得《破风一剑》秘籍':'尚未获得秘籍'}</p>`);
$('quests').onclick=()=>openPanel('江湖任务',`<p>当前主线：<b>${taskText()}</b></p><p>已完成阶段：${state.quest} / 5</p><p>江湖天数：第 ${state.day} 天</p><p>逆命值：${state.destiny}</p>`);
$('help').onclick=()=>openPanel('操作说明','<p>鼠标点击地面：角色自动寻路。</p><p>点击 NPC：走近自动触发对话。</p><p>点击山贼：进入单人战斗。</p><p>点击闪光物品：拾取或调查。</p><p>点击场景左右出口：切换地图。</p><p>键盘 I 打开背包，Q 查看任务，Enter/Space 继续对话。</p>');
$('closePanel').onclick=()=>$('panel').classList.add('hidden');$('restart').onclick=()=>window.NMFinal.returnHome();
document.addEventListener('keydown',e=>{if(!running)return;if(dialogue&&(e.key==='Enter'||e.key===' ')){e.preventDefault();nextLine();return}if(!$('panel').classList.contains('hidden')){if(e.key==='Escape')$('panel').classList.add('hidden');return}if(e.key.toLowerCase()==='i')$('inventory').click();if(e.key.toLowerCase()==='q')$('quests').click()});
window.NMFinal={startNew(){if(running)return false;launch(null);return true},continueGame(){if(running)return false;const save=readSaved();if(!save)return false;launch(save);return true},hasSave(){return !!readSaved()},saveInfo(){const s=readSaved();return s?{day:s.day,map:s.map,quest:s.quest}:null},returnHome(){if(running){saveGame();stop()}$('gameScreen').hidden=true;$('homeScreen').hidden=false;window.dispatchEvent(new Event('nm-return-home'));return true},getJournal(){const s=readSaved();return s?s.journal||[]:[]},isRunning(){return running},debugState(){return state},debugCamera(){return townCamera()},debugTilemap(){return currentTilemap()},debugMaps(){return tileMaps},debugStructures(){return structData},debugAnimation(){return {facing:state.facing||'down',motion:motion?{...motion}:null,keys:Object.keys(imgs),renderMode:'seamless_whole_body',walkStepIndex,walkFrame:motion?[1,2,3,2][((walkStepIndex-1)*2+(motion.progress>=0.5?1:0))%4]:0,source96x128:!!animatedSheets.player,legacyPreviewDisabled:true}}};
} catch(error){
 const detail={message:String(error&&error.message||error),stack:String(error&&error.stack||''),stage:'game-core-init'};
 window.NM_GAME_BOOT_ERROR=detail;
 console.error('[逆命江湖] 游戏核心初始化失败',error);
 window.dispatchEvent(new CustomEvent('nm-game-init-failed',{detail}));
}
})();
