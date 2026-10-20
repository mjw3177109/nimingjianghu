'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function verify(rel,type,minSize){
 const file=path.join(root,rel);assert(fs.existsSync(file),'Missing asset: '+rel);
 const stat=fs.statSync(file);assert(stat.size>=minSize,'Asset suspiciously small: '+rel+' ('+stat.size+' B)');
 const head=Buffer.alloc(12);const fd=fs.openSync(file,'r');try{fs.readSync(fd,head,0,12,0)}finally{fs.closeSync(fd)}
 if(type==='webp'){assert.equal(head.toString('ascii',0,4),'RIFF',rel);assert.equal(head.toString('ascii',8,12),'WEBP',rel)}
 if(type==='png')assert.equal(head.subarray(0,8).toString('hex'),'89504e470d0a1a0a',rel);
 console.log('PASS ASSET '+rel+' ('+stat.size+' B)');
}
const pictures=[
['assets/home/menu_panel.webp','webp',5000],
['assets/home/hero_panel.webp','webp',30000],
['assets/home/cards_panel.webp','webp',15000],
['assets/home/preview_town.webp','webp',10000],
['assets/home/preview_battle.webp','webp',10000],
['assets/home/preview_cave.webp','webp',10000],
['assets/home/feature_strip.webp','webp',3000],
['assets/home/characters_gallery_ref.webp','webp',50000],
...['S001_town','S004_road','S005_cave'].map(id=>['assets/maps/'+id+'.webp','webp',25000]),
...['CHAR001','BOSS001','NPC001','NPC002','NPC003','NPC005'].map(id=>['assets/portraits/'+id+'_avatar.webp','webp',5000]),
...['player','innkeeper','healer','oldman','bandit'].map(id=>['assets/sprites/'+id+'.png','png',5000])
];
for(const args of pictures)verify(...args);
const h=fs.readFileSync(path.join(root,'index.html'),'utf8');
const g=fs.readFileSync(path.join(root,'game.js'),'utf8');
const css=fs.readFileSync(path.join(root,'style.css'),'utf8');
for(const [asset] of pictures.filter(([p])=>p.startsWith('assets/home/'))){
 if(![h,css].some(s=>s.includes(asset)))throw Error('Homepage no reference for '+asset);
}
for(const [asset] of pictures.filter(([p])=>p.startsWith('assets/maps/'))){assert(!g.includes(asset),'Gameplay still loads full scene: '+asset);}
assert(h.includes('id="startButton"')&&h.includes('id="continueButton"'),'Home start controls missing');
assert(h.includes('id="codexScreen"')&&h.includes('id="gameScreen"'),'Gallery/game screens missing');
console.log('PASS: 22 illustrated asset files and game/home references verified.');

const tile=fs.readFileSync(path.join(root,'data/maps/town/town_tilemap.json'),'utf8');
assert(tile.includes('town_atlas.svg'),'Modular town atlas missing');
for(const id of ['S001_town.webp','S004_road.webp','S005_cave.webp'])assert(!g.includes(id),'Gameplay still loads baked background: '+id);
console.log('PASS: town modular image dependency is active; old full scene not loaded.');
