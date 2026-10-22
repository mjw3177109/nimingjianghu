'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
for(const scene of ['town','road','cave']){
 const map=JSON.parse(fs.readFileSync(path.join(root,'data/maps',scene,scene+'_tilemap.json'),'utf8'));
 const file=path.join(root,'assets/tilesets',scene,scene+'_atlas_hd64.svg');
 assert(fs.existsSync(file),'High definition atlas not generated '+scene);
 const s=fs.readFileSync(file,'utf8');
 const rows=Math.ceil(map.tile_ids.length/map.atlas_columns);
 assert(s.includes('width="'+map.atlas_columns*64+'"'),scene+' bad HD source width');
 assert(s.includes('height="'+rows*64+'"'),scene+' bad HD source height');
 assert(s.includes('native 64px tile atlas'),scene+' suspicious raster upscale');
 assert.equal((s.match(/<g transform="translate\(/g)||[]).length,map.tile_ids.length,scene+' tile source count');
 assert(!/<text\b/i.test(s),'No baked Chinese text allowed in atlas');
 assert(s.length>20000,scene+' atlas lacks authored detail');
 console.log('PASS P3E HD: '+scene+' original 64px tiles × '+map.tile_ids.length+' with vector detail');
}
const g=fs.readFileSync(path.join(root,'game.js'),'utf8'),p=fs.readFileSync(path.join(root,'main.py'),'utf8'),prev=fs.readFileSync(path.join(root,'home-preview.js'),'utf8');
assert(g.includes("image.src=map.atlas.replace(/\\.svg$/, '_hd64.svg')"),'Browser HD source missing');
assert(g.includes('sourceTile=atlas&&atlas.naturalWidth'),'Dynamic source crop missing');
assert(p.includes("source_px=atlas.get_width()//m['atlas_columns']"),'Pygame source dimension missing');
assert(prev.includes("atlas.src=map.atlas.replace(/\\.svg$/, '_hd64.svg')"),'Homepage preview HD source missing');
assert(prev.includes('atlas.onerror=()=>{atlas.onerror=null;atlas.src=map.atlas;}'),'Preview fallback broken');
console.log('PASS P3E HD integration: browser, homepage and Windows source-compatible');
