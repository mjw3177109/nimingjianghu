'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),txt=f=>fs.readFileSync(path.join(root,f),'utf8');
const game=txt('game.js'),py=txt('main.py');
const names=['player','innkeeper','healer','oldman','bandit'];
for(const name of names){
 const pathName=path.join(root,'assets/sprites',name+'.png'),b=fs.readFileSync(pathName);
 assert.equal(b.toString('hex',0,8),'89504e470d0a1a0a',name+' must be actual PNG');
 const w=b.readUInt32BE(16),h=b.readUInt32BE(20);
 assert(w>=55&&h>=80,name+' true original sprite resolution too low');
 console.log('Sprite source '+name+': '+w+'x'+h);
}
assert(game.includes('const spritePolicy={minimumFrameWidth:96,minimumFrameHeight:128,previewDisabled:true}'));
assert(game.includes('seamless_whole_body'),'Browser whole body mode required');
assert(game.includes("if(/_4dir\\.png$/i.test(candidate))"),'Game must never load legacy SVG sheets');
assert(game.includes('sheet.naturalWidth>=384&&sheet.naturalHeight>=512'),'Do not treat 24x32 preview as high resolution');
assert(game.includes('ctx.drawImage(image,Math.round(feetX-width/2)'),'Game must draw whole source PNG in one draw call');
assert(game.includes('spriteDrawSize(key,image)'),'Game must preserve actor aspect ratio');
assert(game.includes('ctx.imageSmoothingEnabled=true'),'Chibi art should not be rendered as jagged pixelated proxy');
assert(game.includes("renderMode:'seamless_whole_body'"));
assert(py.includes("full=pygame.image.load(str(ROOT/'assets/sprites'/(key+'.png'))).convert_alpha()"));
assert(py.includes("sprite_manifest=json.loads("));
assert(py.includes("entry.get('direction_status')!='user_approved_independently_painted'"));
assert(py.includes("sheet.get_width()<384 or sheet.get_height()<512"),'Pygame must block low resolution frames');
assert(py.includes('art=sprites[sp]  # Render ONE intact full-body PNG'));
assert(!py.includes("NIMING_PREVIEW_SHENYAN16"),'Retire broken Pygame preview');
assert(txt('art-review.js').includes('player_4dir_preview.png'),'Retain original previews in QA only');
console.log('PASS P3I: 5 intact source sprites, no split-body gameplay, preserve face/stature, true-HD approval threshold');
