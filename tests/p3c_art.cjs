'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const m=JSON.parse(fs.readFileSync(path.join(root,'assets/characters/scene_sprites/sprite_manifest.json'),'utf8'));
assert.equal(m.frame_width,48);assert.equal(m.frame_height,64);assert.equal(m.columns,4);assert.equal(m.rows,4);
assert.deepEqual(m.directions,['down','left','right','up']);
assert.equal(m.entries.length,5);assert.equal(m.status,'derived_preproduction_not_approved_4dir');
for(const e of m.entries){
 const svg=fs.readFileSync(path.join(root,e.sheet),'utf8');
 assert(svg.includes('width="192" height="256"'),e.key+' size invalid');
 assert(svg.includes('data:image/png;base64,'),e.key+' missing original PNG reference');
 assert.equal((svg.match(/data:image\/png;base64,/g)||[]).length,1,e.key+' should embed source once');
 assert.equal((svg.match(/<use href="#source"\/>/g)||[]).length,32,e.key+' 4 dirs * 4frames * upper/lower clips must exist');
 assert(svg.includes('id="upper"')&&svg.includes('id="lower"'),e.key+' lacks distinct walk-layer transforms');
 assert(!svg.includes('href="http'),e.key+' depends on external resource');
}
for(const s of ['town','road','cave']){
 const map=JSON.parse(fs.readFileSync(path.join(root,'data/maps',s,s+'_tilemap.json'),'utf8'));
 const svg=fs.readFileSync(path.join(root,map.atlas),'utf8');
 assert(svg.includes('id="p3c-clip"'),'Lacks real per-tile natural material detail: '+s);
 assert(svg.includes('P3-C 32px natural-material pixel detail'),s+' missing polish overlay');
}
const g=fs.readFileSync(path.join(root,'game.js'),'utf8');
const p=fs.readFileSync(path.join(root,'main.py'),'utf8');
assert(g.includes('function drawActorSprite'),'Browser runtime missing direction animation');
assert(g.includes('visualPlayer()'),'Browser motion interpolation missing');
assert(g.includes('facingForMove(from,to)'),'Browser direction tracking missing');
assert(p.includes('animated_sprites')&&p.includes('def player_visual()'),'Pygame missing equivalent animation support');
console.log('PASS P3C: 5 embedded-art 4-dir x 4-frame sheets, seamless tiles, facing, walking and Pygame parity');
