const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'dist');
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
for(const file of ['index.html','style.css','game.js','app.js','world-data.js','town-tile-data.js','road-tile-data.js','cave-tile-data.js','home-preview.js','structure-data.js']){const src=path.join(ROOT,file);if(!fs.existsSync(src))throw Error('Missing '+file);fs.copyFileSync(src,path.join(OUT,file));}
fs.cpSync(path.join(ROOT,'assets'),path.join(OUT,'assets'),{recursive:true});
console.log('Web build completed: dist with verified game and menu sources.');
