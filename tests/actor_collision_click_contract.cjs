'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const structures=JSON.parse(fs.readFileSync(path.join(root,'data/structures.json'),'utf8'));
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const vm=require('node:vm'),context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'world-data.js'),'utf8'),context);
const world=context.window.GAME_WORLD;
assert(!game.includes('ctx.strokeRect(Math.round(sx)+5'),'Old square debug click marker must be removed');
assert(game.includes('Soft floor-level destination glint'),'Destination marker must be unobtrusive');
assert(game.includes('const targetHeight=72'),'Character height must be standardized');
assert(game.includes('const px=(actor.x+.5)*32-cam.x,py=(actor.y+1)*32-cam.y;'),'All actors must use the same feet anchor at the bottom of their tile');
assert(game.includes('drawActorSprite(actor.sprite,px,py,facing,actor.moving||false);'),'All NPC and player actors must share the renderer');
assert(game.includes('solid_footprint'),'Structure collisions must affect pathfinding');
assert(game.includes('Math.abs(npc.x-x)<=1&&npc.y===y'));
assert(game.includes('Math.abs(enemy.x-x)<=1&&enemy.y===y'));
assert(!game.includes('gx===npc.x&&gy>=npc.y-2&&gy<=npc.y'),'Rejected sprite pixels must not fall back to an NPC grid column');
assert(!game.includes('gx===en.x&&gy>=en.y-2&&gy<=en.y'),'Rejected sprite pixels must not fall back to an enemy grid column');
assert(game.includes('gx===spot.tile[0]&&gy===spot.tile[1]'),'Door hotspots must not capture adjacent walking clicks');
assert(!game.includes('Math.abs(gx-npc.x)<=1'),'Legacy square NPC hitboxes are forbidden');
assert(game.includes('const stride=[1,2,3,2]'),'Walking must alternate left/neutral/right/neutral, not jump directly between legs');
for(const scene of ['town','road','cave']){
 const map=JSON.parse(fs.readFileSync(path.join(root,'data/maps',scene,scene+'_tilemap.json'),'utf8'));
 const coll=(x,y)=>x<0||y<0||x>=map.width||y>=map.height||map.collision[y*map.width+x]===1||(structures[scene]||[]).some(o=>{const f=o.solid_footprint;return f&&x>=o.x+f.x&&x<o.x+f.x+f.w&&y>=o.y+f.y&&y<o.y+f.y+f.h})||[...(world.maps[scene].npcs||[]),...(world.maps[scene].enemies||[])].some(a=>Math.abs(a.x-x)<=1&&a.y===y);
 const starts={town:[14,12],road:[1,9],cave:[2,10]};
 const goals={town:[[8,11],[30,11],[33,15],[39,12]],road:[[16,10],[35,10],[0,10]],cave:[[23,11],[16,10],[0,10]]};
 const start=starts[scene],queue=[start],seen=new Set([start.join(',')]);
 while(queue.length){const [x,y]=queue.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy,k=a+','+b;if(!seen.has(k)&&!coll(a,b)){seen.add(k);queue.push([a,b])}}}
 for(const goal of goals[scene])assert(seen.has(goal.join(',')),scene+' route unreachable: '+goal);
}
for(const [scene,x,y] of [['town',7,10],['town',9,10],['road',17,10],['road',19,10]]){
 const m=JSON.parse(fs.readFileSync(path.join(root,'data/maps',scene,scene+'_tilemap.json'),'utf8'));
 const actor=[...(world.maps[scene].npcs||[]),...(world.maps[scene].enemies||[])].find(a=>Math.abs(a.x-x)<=1&&a.y===y);
 assert(actor&&m.collision[y*m.width+x]===0,'Actor side tile must be visually reserved');
}
assert.deepEqual(structures.cave.find(o=>o.id==='altar').solid_footprint,{x:0,y:1,w:3,h:2});
assert.deepEqual(structures.cave.find(o=>o.id==='chest').solid_footprint,{x:0,y:0,w:3,h:2});
console.log('PASS: unobtrusive destination marker, consistent character scale, structure colliders, three-map reachability');
