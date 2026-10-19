'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const path=require('node:path'),root=path.resolve(__dirname,'..');
const m=JSON.parse(fs.readFileSync(path.join(root,'data/maps/town/town_tilemap.json'),'utf8'));
assert.equal(m.tile_size,32);assert.equal(m.width,40);assert.equal(m.height,24);
assert.equal(m.art_policy,'NO_FULL_SCENE_IMAGE');
assert.equal(m.tile_ids.length,36);
const atlas=fs.readFileSync(path.join(root,m.atlas),'utf8');
assert(atlas.includes('width="192" height="192"')&&atlas.includes('tileclip'));
for(const [name,layer] of Object.entries(m.layers)){
 assert.equal(layer.length,960,name+' wrong size');
 for(const idx of layer)assert(idx===-1||(idx>=0&&idx<36),name+' invalid tile '+idx);
}
assert.equal(m.collision.length,960);
assert.equal(m.collision[12*40+14],0,'spawn blocked');
for(const o of m.objects){const [x,y]=o.tile;assert(x>=0&&y>=0&&x<40&&y<24,'bad object '+o.id);}
function route(start,dest){let q=[start],seen=new Set([start.join(',')]);while(q.length){const [x,y]=q.shift();if(x===dest[0]&&y===dest[1])return true;for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(nx<0||ny<0||nx>=40||ny>=24||m.collision[ny*40+nx]||seen.has(key))continue;seen.add(key);q.push([nx,ny]);}}return false}
for(const target of [[8,10],[30,10],[33,16],[39,12]])assert(route(m.spawn,target),'unreachable '+target);
assert.equal(m.layers.water[10*40+19]>=0,true,'river missing');
assert.equal(m.layers.building[12*40+19],15,'bridge lacks floor');
assert.equal(m.collision[12*40+19],0,'bridge blocked');
const runtime=fs.readFileSync(path.join(root,'town-tile-data.js'),'utf8').trim().replace(/^window\.NM_TOWN_TILEMAP = /,'').replace(/;$/,'');
assert.deepEqual(JSON.parse(runtime),m);
const g=fs.readFileSync(path.join(root,'game.js'),'utf8');
assert(!g.includes('S001_town.webp'),'Town loads full image');
assert(g.includes('function drawTileTown()'),'No tile renderer');
assert(g.includes('townTileFromScreen'),'Missing camera hit-testing');
console.log('PASS P3A: 40×24, 36 reusable tiles, layered rendering, bridge, camera, pathfinding, JSON sync');
