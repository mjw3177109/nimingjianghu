'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const world=JSON.parse(fs.readFileSync(path.join(root,'data/world.json'),'utf8'));
function reach(m,start,target){
 const q=[start],seen=new Set([start.join(',')]);
 while(q.length){const [x,y]=q.shift();if(x===target[0]&&y===target[1])return true;
 for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
 const nx=x+dx,ny=y+dy,k=nx+','+ny;
 if(nx>=0&&ny>=0&&nx<m.width&&ny<m.height&&!m.collision[ny*m.width+nx]&&!seen.has(k)){seen.add(k);q.push([nx,ny]);}}}
 return false;
}
for(const scene of ['road','cave']){
 const m=JSON.parse(fs.readFileSync(path.join(root,'data/maps',scene,scene+'_tilemap.json'),'utf8'));
 assert.equal(m.tile_size,32);assert.equal(m.art_policy,'NO_FULL_SCENE_IMAGE');assert.equal(m.tile_ids.length,30);
 const svg=fs.readFileSync(path.join(root,m.atlas),'utf8');
 assert(svg.includes('width="192" height="160"'),'Atlas not 6x5: '+scene);
 for(const [layer,cells] of Object.entries(m.layers)){
  assert.equal(cells.length,m.width*m.height,scene+': '+layer+' shape');
  assert(cells.every(v=>v===-1||(v>=0&&v<m.tile_ids.length)),scene+': invalid tile ID');
 }
 assert.equal(m.collision.length,m.width*m.height);
 assert.equal(m.collision[m.spawn[1]*m.width+m.spawn[0]],0,'Blocked '+scene+' spawn');
 for(const obj of m.objects){const [x,y]=obj.tile;assert(x>=0&&x<m.width&&y>=0&&y<m.height,scene+': '+obj.id+' invalid object');}
 for(const ex of world.maps[scene].exits)assert(reach(m,m.spawn,[ex.x,ex.y]),scene+' exit unreachable: '+ex.to);
 const runtime=fs.readFileSync(path.join(root,scene+'-tile-data.js'),'utf8').replace(/^window\.NM_\w+_TILEMAP = /,'').replace(/;\s*$/,'');
 assert.deepEqual(JSON.parse(runtime),m);
 console.log('PASS P3B '+scene+': '+m.width+'x'+m.height+' tiles, 30 tile types, accessible exits, synced JSON');
}
const road=JSON.parse(fs.readFileSync(path.join(root,'data/maps/road/road_tilemap.json'),'utf8'));
assert(reach(road,road.spawn,[18,10]),'Bandit inaccessible');
const cave=JSON.parse(fs.readFileSync(path.join(root,'data/maps/cave/cave_tilemap.json'),'utf8'));
for(const pos of [[22,10],[16,9]])assert(reach(cave,cave.spawn,pos),'Cave object unreachable from adjacent tile');
const g=fs.readFileSync(path.join(root,'game.js'),'utf8'),h=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const forbidden of ['S001_town.webp','S004_road.webp','S005_cave.webp'])assert(!g.includes(forbidden),'Baked background remained '+forbidden);
assert(g.includes('function drawTileTown()')&&g.includes('tileAtlases'),'Missing layered renderer');
assert(h.includes('road-tile-data.js')&&h.includes('cave-tile-data.js'),'Missing runtime map data scripts');
console.log('PASS P3B integration: enemy, chest, altar, 3 modular maps, camera and rendering paths');
