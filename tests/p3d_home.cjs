'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const content=file=>fs.readFileSync(path.join(root,file),'utf8');
const h=content('index.html'),css=content('style.css'),g=content('game.js'),sv=content('assets/home/moon_town_vector.svg'),preview=content('home-preview.js');
for(const id of ['startButton','continueButton','saveCaption','codexScreen','gameScreen','codexBack']){
  assert(h.includes('id="'+id+'"'),'Essential home/game element missing: '+id);
}
for(const label of ['开始游戏','继续游戏','游戏设置','角色图鉴','剧情回顾','关于本作','苏晚晴','韩掌柜','廖','青石镇','城外山路','废弃山洞'])
 assert(h.includes(label),'Editable Chinese text missing: '+label);
assert(!/assets\/home\/(menu_panel|cards_panel|hero_panel|preview_town|preview_battle|preview_cave|feature_strip|characters_gallery_ref)\.webp/.test(h+css),'Baked incorrect/low-res labels must not be used');
assert(h.includes('<canvas data-scene-canvas="town"')&&h.includes('home-preview.js'),'Homepage live map previews missing');
for(const scene of ['town','road','cave'])assert(preview.includes(scene),'Missing '+scene+' preview');
assert(preview.includes('ctx.drawImage(atlas'),'Previews must use real tiles, not screenshot');
assert(sv.includes('width="1920" height="1080"'),'High-res scalable vector background missing');
assert(!sv.includes('<text'),'Background must not bake any Chinese text');
assert(h.includes('id="game" width="1280" height="720"'),'Game canvas must use 2x device pixels');
assert(g.includes('ctx.setTransform(2,0,0,2,0,0)'),'2x resolution scaling missing');
assert(g.includes('sx>=0&&sx<640&&sy>=0&&sy<360'),'Target glint viewport clipping missing');
assert(!g.includes('ctx.strokeRect(Math.round(sx)+5'),'Old debug square marker must not render');
for(const bad of ['S001_town.webp','S004_road.webp','S005_cave.webp'])assert(!g.includes(bad),'Baked map returned: '+bad);
console.log('PASS P3D: editable Chinese UI, true scalable background, live tile previews, retina canvas, marker bounds');
