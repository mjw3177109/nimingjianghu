'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const structures=JSON.parse(fs.readFileSync(path.join(root,'data/structures.json'),'utf8'));
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
assert(!game.includes('ctx.strokeRect(Math.round(sx)+5'),'Old square debug click marker must be removed');
assert(game.includes('Soft floor-level destination glint'),'Destination marker must be unobtrusive');
assert(game.includes('const targetHeight=72'),'Character height must be standardized');
assert(game.includes('const displayHeight=72'),'NPC labels must follow standardized height');
assert(game.includes('solid_footprint'),'Structure collisions must affect pathfinding');
assert(game.includes('gx===npc.x&&gy>=npc.y-2&&gy<=npc.y'),'NPC hit-testing must not capture diagonal ground clicks');
assert(game.includes('gx===spot.tile[0]&&gy===spot.tile[1]'),'Door hotspots must not capture adjacent walking clicks');
assert(!game.includes('Math.abs(gx-npc.x)<=1'),'Legacy square NPC hitboxes are forbidden');
for(const scene of ['town','road','cave']){
 const map=JSON.parse(fs.readFileSync(path.join(root,'data/maps',scene,scene+'_tilemap.json'),'utf8'));
 const coll=(x,y)=>x<0||y<0||x>=map.width||y>=map.height||map.collision[y*map.width+x]===1||(structures[scene]||[]).some(o=>{const f=o.solid_footprint;return f&&x>=o.x+f.x&&x<o.x+f.x+f.w&&y>=o.y+f.y&&y<o.y+f.y+f.h});
 const starts={town:[14,12],road:[1,9],cave:[2,10]};
 const goals={town:[[7,10],[30,10],[33,15],[39,12]],road:[[17,10],[35,10],[0,10]],cave:[[23,11],[16,10],[0,10]]};
 const start=starts[scene],queue=[start],seen=new Set([start.join(',')]);
 while(queue.length){const [x,y]=queue.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy,k=a+','+b;if(!seen.has(k)&&!coll(a,b)){seen.add(k);queue.push([a,b])}}}
 for(const goal of goals[scene])assert(seen.has(goal.join(',')),scene+' route unreachable: '+goal);
}
assert.deepEqual(structures.cave.find(o=>o.id==='altar').solid_footprint,{x:0,y:1,w:3,h:2});
assert.deepEqual(structures.cave.find(o=>o.id==='chest').solid_footprint,{x:0,y:0,w:3,h:2});
console.log('PASS: unobtrusive destination marker, consistent character scale, structure colliders, three-map reachability');
