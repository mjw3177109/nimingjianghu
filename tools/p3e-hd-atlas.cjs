'use strict';
// P3-E vector-authored 64px source tiles; output source is new vector art, NOT upscaled 32px raster.
// Existing map tile IDs and collision remain unchanged.
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),S=64;
function seeded(seed){let s=(seed^0x9e3779b9)>>>0;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296}}
const PALETTE={
 town:{grass:'#769b83',foliage:'#4f8e77',earth:'#b8a184',stone:'#c6bfab',rock:'#687a77',roof:'#475d72',wood:'#876348',water:'#508b98',light:'#f3dbc0',shadow:'#263b46'},
 road:{grass:'#769475',foliage:'#51876e',earth:'#b09a74',stone:'#aea996',rock:'#6e7a79',roof:'#575b55',wood:'#8a7150',water:'#6f9ca2',light:'#efdfb9',shadow:'#3b4b48'},
 cave:{grass:'#68766d',foliage:'#598f7d',earth:'#77746d',stone:'#898b83',rock:'#586265',roof:'#353f47',wood:'#856549',water:'#618c89',light:'#c7c5ab',shadow:'#303b43'}
};
function classify(id){
 if(/WATER|PUDDLE|WET/.test(id))return 'water';
 if(/GRASS|MEADOW|FERN|BUSH|LEAVES|FLOWER|REEDS|CANOPY|SHRUB|BRAMBLE|MUSHROOM/.test(id))return 'vegetation';
 if(/ROOF|EAVE|AWNING|CEILING/.test(id))return 'roof';
 if(/ROCK|CLIFF|WALL|COLUMN|BOULDER|STONE_EDGE|STALAG|OVERHANG|PILLAR|RUBBLE|SPIKES/.test(id))return 'rock';
 if(/BRIDGE|RAIL|FENCE|DOOR|BEAM|WOOD|CRATE|PLANK|LOG|TRUNK|SIGN|WINDOW/.test(id))return 'wood';
 if(/TORCH|LANTERN|GLOW|ALTAR|RUNE|CRYSTAL|GEM|CHEST/.test(id))return 'special';
 if(/SLATE|COBBLES|FLOOR|STONE|ROAD|DIRT|STEPS|EDGE|BANK|SLABS|FROST|CRACKED/.test(id))return 'ground';
 return 'decor';
}
function cell(scene,id,index,p){
 const rand=seeded(index*20347+scene.length*131+id.length*17);
 const int=(lo,hi)=>Math.floor(lo+rand()*(hi-lo+1));
 const s=[];const rect=(x,y,w,h,fill,op=1,rx=0)=>s.push('<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+rx+'" fill="'+fill+'" opacity="'+op+'"/>');
 const line=(d,color,width=1,op=1)=>s.push('<path d="'+d+'" stroke="'+color+'" stroke-width="'+width+'" opacity="'+op+'" fill="none" stroke-linecap="round" stroke-linejoin="round"/>');
 const path=(d,fill,stroke='none',width=1)=>s.push('<path d="'+d+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+width+'" stroke-linejoin="round"/>');
 const circle=(x,y,r,fill,op=1)=>s.push('<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'" opacity="'+op+'"/>');
 const type=classify(id);
 if(type==='vegetation'){
  rect(0,0,64,64,p.grass);
  for(let i=0;i<92;i++){let x=int(0,63),y=int(0,63);line('M'+x+' '+(y+int(1,4))+'q'+int(-4,1)+' -'+int(4,9)+' '+int(-2,2)+' -'+int(6,13),i%3===0?'#d0d4a2':i%3===1?p.foliage:p.shadow,int(1,2),.35+rand()*.35)}
  if(/FLOWER|MUSHROOM/.test(id))for(let i=0;i<11;i++){let x=int(6,57),y=int(6,57);circle(x,y,3,i%2?'#edd0a7':'#efb9ba');circle(x+1,y-1,1,'#fff4cd')}
  if(/CANOPY|TREE|BUSH|BRAMBLE|SHRUB|LEAVES/.test(id)){path('M2 63Q-1 24 24 13Q51 -2 64 27V64Z','#50785f',p.shadow,1);for(let i=0;i<42;i++)circle(int(3,63),int(5,62),int(2,5),i%3===0?'#bbcd9c':i%3===1?'#659a79':'#396c59',.5+rand()*.45)}
 }else if(type==='ground'){
  rect(0,0,64,64,/SLATE|STONE|COBBLE|BRIDGE|STEPS|FLOOR/.test(id)?p.stone:p.earth);
  for(let i=0;i<70;i++){let x=int(0,63),y=int(0,63);rect(x,y,int(1,6),int(1,3),i%2?p.light:p.shadow,.08+rand()*.32)}
  if(/SLATE|COBBLE|SLABS|STEPS|FLOOR|ROAD/.test(id)){for(let y=4;y<67;y+=17){line('M0 '+y+'H64',p.shadow,1.8,.47);line('M0 '+(y+2)+'H64',p.light,1,.38)}for(let y=4;y<67;y+=34)for(let x=(y%68?20:0);x<70;x+=32)line('M'+x+' '+y+'v17',p.shadow,1.6,.5)}
  else{for(let i=0;i<24;i++){let x=int(0,63),y=int(0,63);rect(x,y,int(2,5),1.2,p.shadow,.22)}}
  if(/CRACKED/.test(id)){line('M3 8L27 29L21 43L48 63',p.shadow,3,.68)}
 }else if(type==='water'){
  rect(0,0,64,64,p.water);rect(0,0,64,64,p.shadow,.1);
  for(let y=2;y<70;y+=9)for(let i=0;i<4;i++){let x=int(1,55);line('M'+x+' '+y+'q7 -4 14 0',i%3===0?'#def3dc':'#a2d3cc',1.4+rand()*1,.36+rand()*.36)}
  if(/EDGE|BANK/.test(id))path('M0 0L19 0Q32 30 18 64H0Z',p.stone,p.shadow,1.2);
 }else if(type==='roof'){
  rect(0,0,64,64,p.roof);
  for(let y=0;y<65;y+=13)for(let x=(y%26?0:7);x<65;x+=17){path('M'+x+' '+y+'q7 9 15 0',p.roof,p.shadow,1.7);line('M'+x+' '+(y+1)+'q7 7 15 0','#adb9bd',1.1,.64)}
  rect(0,60,64,4,p.shadow,.7);line('M0 59H64','#c3c2b0',1.6,.5);
 }else if(type==='rock'){
  rect(0,0,64,64,p.rock);
  for(let i=0;i<12;i++){let x=int(-9,60),y=int(-3,64),w=int(15,34),h=int(11,26);path('M'+x+' '+(y+h)+'L'+(x+int(3,8))+' '+y+'L'+(x+w-5)+' '+(y+int(2,9))+'L'+(x+w)+' '+(y+h)+'Z',i%2?'#738882':'#53646a',p.shadow,1.2);line('M'+(x+4)+' '+(y+h-2)+'L'+(x+8)+' '+(y+2)+'L'+(x+14)+' '+(y+4),p.light,1.5,.33)}
  for(let i=0;i<20;i++)rect(int(0,63),int(0,63),int(1,3),int(1,2),p.light,.25);
 }else if(type==='wood'){
  rect(0,0,64,64,p.wood);
  if(/FENCE|RAIL|BRIDGE/.test(id)){rect(0,10,64,7,'#c39d75');rect(0,44,64,7,'#a17d5e');for(let x=6;x<64;x+=22){rect(x,2,7,61,'#5d4539');rect(x+1,5,3,55,'#d1aa7c',.54)}}
  else if(/DOOR|WINDOW/.test(id)){rect(9,4,46,56,p.shadow,.9,4);rect(14,9,36,51,/WINDOW/.test(id)?'#9bb6ad':'#8a5d42');rect(24,9,3,51,p.light,.33);rect(14,31,36,4,p.shadow,.75);circle(46,37,2,'#e0c48f')}
  else{for(let i=0;i<19;i++){const x=int(0,63);line('M'+x+' 1Q'+(x+int(-5,5))+' 28 '+(x+int(-4,4))+' 63',i%3?p.light:p.shadow,1+rand(),.15+rand()*.23)}}
 }else if(type==='special'){
  rect(0,0,64,64,p.earth);
  for(let i=0;i<30;i++)rect(int(0,63),int(0,63),int(1,4),int(1,3),p.shadow,.25);
  if(/CHEST/.test(id)){rect(8,26,49,30,'#a47a51',1,4);rect(10,23,45,15,'#d0a370',1,5);rect(30,24,6,29,'#e7c787');circle(33,42,2,'#5c4033')}
  else if(/TORCH|LANTERN|GLOW/.test(id)){rect(29,24,5,35,'#76513c');path('M33 4Q4 30 33 34Q59 22 33 4Z','#f7bb65');circle(33,25,15,'#facc8159');path('M31 14Q19 27 35 30Q46 25 31 14Z','#fff2bc')}
  else{path('M32 8L47 31L32 57L16 31Z','#82c5bf','#d1f8e6',2);circle(32,30,6,'#efffed')}
 }else{rect(0,0,64,64,p.earth);for(let i=0;i<50;i++)rect(int(0,63),int(0,63),int(1,6),int(1,5),i%2?p.light:p.shadow,.2)}
 // Independent native 64px detail micro-highlights.
 for(let i=0;i<25;i++){let x=int(0,63),y=int(0,63);rect(x,y,int(1,3),int(1,2),i%3===0?p.light:p.shadow,.10+rand()*.15)}
 return s.join('');
}
function create(scene,map){
 const p=PALETTE[scene];if(!p)throw Error('bad scene');
 const ids=map.tile_ids;const columns=map.atlas_columns;const rows=Math.ceil(ids.length/columns);
 const defs='<defs><clipPath id="tileclip"><rect width="64" height="64"/></clipPath></defs>';
 const groups=ids.map((id,i)=>'<g transform="translate('+((i%columns)*S)+','+(Math.floor(i/columns)*S)+')" clip-path="url(#tileclip)"><title>'+id+'</title>'+cell(scene,id,i,p)+'</g>');
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+(columns*S)+'" height="'+(rows*S)+'" viewBox="0 0 '+(columns*S)+' '+(rows*S)+'" shape-rendering="geometricPrecision"><desc>Independently vector-authored P3-E native 64px tile atlas: '+scene+'. Not a scaled screenshot.</desc>'+defs+groups.join('')+'</svg>';
}
if(require.main===module)for(const name of ['town','road','cave']){
 const f=ROOT+'/data/maps/'+name+'/'+name+'_tilemap.json',map=JSON.parse(fs.readFileSync(f,'utf8'));
 const outfile=ROOT+'/assets/tilesets/'+name+'/'+name+'_hd64.svg';
 fs.writeFileSync(outfile,create(name,map));
 console.log('Created',outfile,map.tile_ids.length+' unique tiles native 64px');
}
module.exports={create};
