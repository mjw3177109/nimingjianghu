// Verify deployed painted-art assets are present and referenced, not placeholder-only.
const fs=require('node:fs'),assert=require('node:assert/strict');
const expected={
 'assets/home/CHAR001_hero_preview.webp':[260,280],
 'assets/home/character_cards_atlas.webp':[120,400],
};
for(const [file,[width,height]] of Object.entries(expected)){
 const d=fs.readFileSync(file);
 assert(d.length>5000,file+' must be a painted image, not an empty placeholder');
 assert.equal(d.toString('ascii',0,4),'RIFF',file+' must be WebP (RIFF)');
 assert.equal(d.toString('ascii',8,12),'WEBP',file+' must be WebP');
 const has=fs.readFileSync('index.html','utf8').includes(file);
 assert(has,file+' is not referenced by homepage HTML');
 console.log('Verified painted WebP asset:',file,'bytes:',d.length);
}
