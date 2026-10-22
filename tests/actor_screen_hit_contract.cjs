'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const game=fs.readFileSync(path.join(__dirname,'..','game.js'),'utf8').replace(/\r\n/g,'\n');
assert(game.includes('candidates.sort((a,b)=>(a.r.length+2*a.radius)-(b.r.length+2*b.radius)||a.radius-b.radius);'), 'Actor interaction must prefer adjacent tiles over distant shortcuts');
assert(game.includes('function pickActorAtScreen(sx,sy)'), 'Actor screen-space hitbox must exist');
assert(game.includes('const centerX=(a.x+.5)*32-cam.x,feetY=(a.y+1)*32-cam.y;'), 'Hitbox must share the renderer foot anchor');
assert(game.includes('return actorSpriteHit(key,defaultActorFacing(key),centerX,feetY,sx,sy);'), 'Click target must read the displayed frame alpha');
assert(game.includes('if(!dialogue&&!battle){\n  const actor=pickActorAtScreen(p.x,p.y);'), 'Dialogue and combat input must take priority');
assert(game.includes("if(actor){travelTo(actor.x,actor.y,{type:actor.type,id:actor.id});return;}"), 'Clicking a visible actor must use normal pathfinding');
assert(!game.includes('ctx.strokeRect(Math.round(sx)+5'), 'Square debug click marker must remain removed');
// Execute the real mask sampler against a small deterministic RGBA fixture.
const vm=require('node:vm');
const image={complete:true,naturalWidth:4,naturalHeight:4};
let reads=0,lastDraw;
const maskContext={animatedSheets:{},imgs:{innkeeper:image},faceOrder:{down:0,left:1,right:2,up:3},
 spriteDrawSize:()=>({width:4,height:4}),console,
 document:{createElement(){return {getContext(){return {drawImage(...args){lastDraw=args},getImageData(x,y,w,h){
  reads++;const data=new Uint8ClampedArray(w*h*4);
  data[(2*w+2)*4+3]=255;data[(2*w+4)*4+3]=16;data[(2*w+6)*4+3]=17;
  return {data};
 }}}}}}};
vm.createContext(maskContext);
vm.runInContext(game.slice(game.indexOf('const actorHitMasks='),game.indexOf('function posEq(')),maskContext);
const hit=maskContext.actorSpriteHit;
assert.equal(hit('innkeeper','down',100,100,98.25,97.25),false,'Interior transparent PNG pixel must be rejected');
assert.equal(hit('innkeeper','down',100,100,99.25,98.25),true,'Painted body pixel must be clickable');
assert.equal(hit('innkeeper','down',100,100,100.25,98.25),false,'Near-transparent fringe is not a body target');
assert.equal(hit('innkeeper','down',100,100,101.25,98.25),true);
assert.equal(hit('innkeeper','down',100,100,100,102),false,'Floor below feet is outside the PNG');
assert.equal(reads,1,'Alpha must be cached, not read back from canvas on every click');
maskContext.animatedSheets.healer={complete:true,naturalWidth:384,naturalHeight:512};
hit('healer','left',100,100,99,95);
assert.equal(lastDraw[1],0,'Stationary NPC uses the idle column');
assert.equal(lastDraw[2],128,'Healer picking must sample the displayed left-facing row');
assert.equal(lastDraw[7],108);assert.equal(lastDraw[8],144,'Mask must match the 2x gameplay canvas raster');
const pickSource=game.slice(game.indexOf('function pickActorAtScreen('),game.indexOf('const spriteKeys='));
const pick=vm.runInNewContext('('+pickSource.trim()+')',{
 townCamera:()=>({x:0,y:0}),state:{map:'town',banditAlive:true},
 world:{maps:{town:{npcs:[{x:8,y:10,id:'innkeeper',icon:'shop'}]}}},activeNpcs:()=>[{x:8,y:10,id:'innkeeper',icon:'shop'}],
 actorSpriteHit:hit,npcSpriteKey:maskContext.npcSpriteKey,defaultActorFacing:maskContext.defaultActorFacing
});
const x=8,y=10,camX=0,camY=0,cx=(x+.5)*32-camX,feet=(y+1)*32-camY;
assert.equal(pick(cx-.75,feet-1.75)?.id,'innkeeper','Picker uses the same feet anchor as the sprite');
assert.equal(pick(cx-1.75,feet-2.75),null,'Transparent interior is not an actor');
assert.equal(pick(cx+26,feet-65),null,'Transparent corner must not steal ground click');
assert.equal(pick(cx,feet+2),null);
let picked=0,interacted=0,listener;
const input={running:true,dialogue:null,battle:null,canvas:{addEventListener(type,fn){listener=fn}},
 canvasPoint:()=>({x:cx,y:feet-40}),townTileFromScreen:()=>({x:8,y:9}),
 pickActorAtScreen(){picked++;return {x:8,y:10,type:'npc',id:'innkeeper'}},
 travelTo(){interacted++},interactClick(){interacted++}};
vm.runInNewContext(game.slice(game.indexOf("canvas.addEventListener('click'"),game.indexOf("$('nextDialogue').addEventListener")),input);
listener({});assert.equal(picked,1);assert.equal(interacted,1);
input.dialogue={};listener({});assert.equal(picked,1,'Dialogue skips actor picking');
input.dialogue=null;input.battle={};listener({});assert.equal(picked,1,'Combat skips actor picking');
console.log('PASS: screen-space actor body click, unchanged dialogue priority and floor clicks');
