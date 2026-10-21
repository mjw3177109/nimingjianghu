'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const raw=fs.readFileSync(path.join(ROOT,'data/structures.json'),'utf8'),m=JSON.parse(raw);
assert.equal(m.coordinate_system,'tile32');
assert.equal(m.renders.includes('base before actors'),true);
assert.equal(m.town.length,5);assert.equal(m.road.length,2);assert.equal(m.cave.length,2);
const all=new Set();let count=0;
for(const scene of ['town','road','cave']){
 const map=JSON.parse(fs.readFileSync(path.join(ROOT,'data/maps',scene,scene+'_tilemap.json'),'utf8'));
 for(const o of m[scene]){
  assert(!all.has(scene+':'+o.id),'Duplicate instance id');all.add(scene+':'+o.id);
  assert(['base','front'].includes(o.layer),'Wrong layer');
  assert(o.w>0&&o.h>0&&o.x>=0&&o.y>=0&&o.x+o.w<=map.width&&o.y+o.h<=map.height,'Instance outside map: '+o.id);
  const svg=fs.readFileSync(path.join(ROOT,o.image),'utf8');
  assert(svg.startsWith('<svg')&&svg.includes('viewBox='),'No independent vector asset: '+o.id);
  assert(!/<text(?:\s|>)/i.test(svg),'Baked text forbidden: '+o.id);
  assert(svg.includes('width="'+o.w*64+'"')&&svg.includes('height="'+o.h*64+'"'),'Not native 2x sprite object: '+o.id);
  count++;
 }
}
assert.equal(count,9);
assert(m.town.find(x=>x.id==='bridge_base').layer==='base'&&m.town.find(x=>x.id==='bridge_front').layer==='front','Bridge occlusion invalid');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8'),
 game=fs.readFileSync(path.join(ROOT,'game.js'),'utf8'),
 preview=fs.readFileSync(path.join(ROOT,'home-preview.js'),'utf8'),
 py=fs.readFileSync(path.join(ROOT,'main.py'),'utf8');
assert(html.includes('structure-data.js'),'Structure data missing on homepage');
assert(game.includes("paintStructureLayer(state.map,'base',cam)")&&game.includes("drawQueue.sort((a,b)=>a.depth-b.depth")&&game.includes("paintStructureObject(obj,cam)"),'Depth-sorted structure occlusion missing');
assert(preview.includes('structureData[key]'),'Preview structure renderer missing');
assert(py.includes("structure_layer('base',scene,ox,oy)")&&py.includes("structure_layer('front',scene,ox,oy)"),'Windows drawing missing');
const code=fs.readFileSync(path.join(ROOT,'structure-data.js'),'utf8').replace(/^window\.NM_STRUCTURE_DATA=/,'').trim().replace(/;$/,'');
assert.deepEqual(JSON.parse(code),m,'Browser registry drift');
const char=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/characters/masters/production_manifest.json'),'utf8'));
assert.equal(char.tasks.length,7);
assert(char.tasks.every(x=>x.status==='awaiting_generation_and_manual_review'&&!x.master_approved&&!x.portrait_approved),'Cannot auto approve unreviewed portrait art');
console.log('PASS P3F: 9 reusable hi-res architectural objects, correct occlusion, 7 explicit character master QA gates');
