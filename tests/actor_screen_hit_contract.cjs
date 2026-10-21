'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const game=fs.readFileSync(path.join(__dirname,'..','game.js'),'utf8').replace(/\r\n/g,'\n');
assert(game.includes('candidates.sort((a,b)=>(a.r.length+2*a.radius)-(b.r.length+2*b.radius)||a.radius-b.radius);'), 'Actor interaction must prefer adjacent tiles over distant shortcuts');
assert(game.includes('function pickActorAtScreen(sx,sy)'), 'Actor screen-space hitbox must exist');
assert(game.includes('const centerX=(a.x+.5)*32-cam.x,feetY=(a.y+1)*32-cam.y;'), 'Hitbox must share the renderer foot anchor');
assert(game.includes('rise>=5&&rise<=69&&Math.abs(sx-centerX)<=(rise>46?17:22)'), 'Click target must be constrained to visible body');
assert(game.includes('if(!dialogue&&!battle){\n  const actor=pickActorAtScreen(p.x,p.y);'), 'Dialogue and combat input must take priority');
assert(game.includes("if(actor){travelTo(actor.x,actor.y,{type:actor.type,id:actor.id});return;}"), 'Clicking a visible actor must use normal pathfinding');
assert(!game.includes('ctx.strokeRect(Math.round(sx)+5'), 'Square debug click marker must remain removed');
// Numeric geometry contract: actor foot at (x+0.5,y+1)*32, 72px tall.
// At x + 19px and 36px above feet, the actor must be clickable even though
// that pixel belongs to the neighboring grid column.
const vm=require('node:vm');
const pickSource=game.slice(game.indexOf('function pickActorAtScreen('),game.indexOf('const spriteKeys='));
const pick=vm.runInNewContext('('+pickSource.trim()+')',{
 townCamera:()=>({x:0,y:0}),state:{map:'town',banditAlive:true},
 world:{maps:{town:{npcs:[{x:8,y:10,id:'innkeeper'}]}}}
});
const x=8,y=10,camX=0,camY=0,cx=(x+.5)*32-camX,feet=(y+1)*32-camY;
const sx=cx+19,sy=feet-36,rise=feet-sy;
assert.equal(Math.floor(sx/32),x+1);
assert(rise>=5&&rise<=69&&Math.abs(sx-cx)<=(rise>46?17:22));
assert.equal(pick(sx,sy)?.id,'innkeeper','Actual hit test must accept visible torso');
assert.equal(pick(cx,feet-60)?.id,'innkeeper','Actual hit test must accept head');
assert.equal(pick(cx+26,feet-65),null,'Transparent corner must not steal ground click');
const groundY=feet+2,groundRise=feet-groundY;
assert(!(groundRise>=5&&groundRise<=69),'Ground below actor must remain walkable by click');
assert.equal(pick(cx,groundY),null);
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
