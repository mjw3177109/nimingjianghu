'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const maps=Object.fromEntries(['town','road','cave'].map(name=>[name,JSON.parse(fs.readFileSync(path.join(root,'data/maps',name,name+'_tilemap.json'),'utf8'))]));
const structures=JSON.parse(fs.readFileSync(path.join(root,'data/structures.json'),'utf8'));
const world=JSON.parse(fs.readFileSync(path.join(root,'data/world.json'),'utf8'));
const collisionFunction=game.match(/function occupiedTile\(mapName,x,y,banditAlive=true\)\{[\s\S]*?\n\}/);
assert(collisionFunction,'Shared collision predicate must exist');
const occupied=vm.runInNewContext('(()=>{const tileMaps='+JSON.stringify(maps)+';const structData='+JSON.stringify(structures)+';const world='+JSON.stringify(world)+';'+collisionFunction[0]+';return occupiedTile})()');
for(const name of ['town','road','cave']){
 const m=maps[name];assert.equal(occupied(name,...m.spawn),false,'Scene spawn must be safe: '+name);
 assert.equal(occupied(name,-1,0),true,'Out-of-bounds must be solid');
 assert.equal(occupied(name,NaN,0),true,'Corrupt saved position must be solid');
}
assert(occupied('town',29,21),'Willow trunk must block restored save');
assert(occupied('town',8,10),'Innkeeper tile must block restored save');
assert(occupied('road',18,10,true),'Live bandit tile must block restored save');
assert.equal(occupied('road',18,10,false),false,'Defeated bandit tile must be passable');
assert(occupied('cave',15,8),'Altar must block restored save');
assert(occupied('cave',22,10),'Chest must block restored save');
assert(game.includes('if(!st.pos||occupiedTile(st.map,st.pos.x,st.pos.y,st.banditAlive!==false))'),'Saved games must reject occupied positions');
assert(game.includes('state.pos=occupiedTile(to,wanted.x,wanted.y,state.banditAlive)'),'Map transitions must reject occupied spawns');
const sizeFunction=game.match(/function spriteDrawSize\(key,image\)\{[\s\S]*?\n\}/);
assert(sizeFunction,'Shared sprite scale function missing');
const drawSize=vm.runInNewContext('(()=>{'+sizeFunction[0]+';return spriteDrawSize})()');
for(const [name,iw,ih] of [['player',59,115],['innkeeper',67,115],['healer',72,115],['oldman',66,115],['bandit',86,84]]){
 const got=drawSize(name,{naturalWidth:iw,naturalHeight:ih});
 assert.equal(got.height,72,name+' should be exactly 72 world pixels tall');
 assert(Math.abs(got.width/got.height-iw/ih)<0.03,name+' aspect ratio distorted');
 assert(got.width<=76,name+' too wide');
}
assert(game.includes('const scale=Math.min(124/old.naturalHeight,104/old.naturalWidth)'),'Battle fallback must preserve original aspect ratio');
console.log('PASS: 5 actor proportions, save/spawn collisions, town willow, cave altar/chest and bandit occupancy');
