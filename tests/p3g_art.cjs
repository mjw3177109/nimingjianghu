'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const html=read('art-review.html'),js=read('art-review.js'),index=read('index.html'),css=read('art-review.css');
assert(index.includes('href="art-review.html"'),'Home must offer art review access');
for(const id of ['characterList','direction','pose','scale','play','currentCanvas','candidateCanvas','stableSheet','candidateSheet','masterStatus','currentResolution','candidateResolution']){
 assert(html.includes('id="'+id+'"'),'Missing visual review control '+id);
}
assert(html.includes('sprite_registry.js'),'Artwork reference registry missing');
assert(js.includes('production_manifest.json')&&js.includes('sprite_manifest.json'),'Review needs true approval state');
assert(js.includes('CANDIDATE_NOT_APPROVED')===false,'Unknown status should not be pretended as approved');
assert(js.includes('loadCandidate(person)'),'Review needs candidate loader');
assert(js.includes('_4dir_hd_candidate.png'),'New HD candidates must take priority');
assert(js.includes('player_4dir_preview.png'),'Legacy low-res Shenyan must be clearly labeled');
assert(js.includes('candidate.naturalWidth<384'),'Low-res art should not be mislabeled as high-res');
assert(js.includes('requestAnimationFrame(tick)'),'Walk frames must animate');
for(const name of ['CHAR001','NPC001','NPC002','NPC003','NPC005','BOSS001','EN001'])assert(js.includes(name),'Missing character '+name);
assert(css.includes('image-rendering:pixelated'),'Sprite zoom must not blur by browser');
const m=JSON.parse(read('assets/characters/masters/production_manifest.json'));
assert.equal(m.tasks.length,7);
assert(m.tasks.every(t=>t.status==='awaiting_generation_and_manual_review'&&t.master_approved===false&&t.portrait_approved===false),'Unreviewed art must stay unapproved');
const sprite=JSON.parse(read('assets/characters/scene_sprites/sprite_manifest.json'));
assert(sprite.entries.every(e=>e.direction_status!=='user_approved_independently_painted'),'Legacy direction copies cannot be approved');
const source=read('tools/p3g_art_pipeline.py');
for(const marker of ['def inspect_rgba(','def candidate_master(','def pack_frames(','DIRECTIONS=("down","left","right","up")','CANDIDATE_NOT_APPROVED','MIN_FRAME=(256,384)','def sha256(']){
 assert(source.includes(marker),'High-resolution image QA contract missing: '+marker);
}
assert(!source.includes('sprite_registry.js'),'Candidate imports cannot change production registry');
assert(!source.includes('master_approved"]=True'),'Candidate import cannot approve master');
const build=read('tools/build-web.cjs');for(const src of ['art-review.html','art-review.css','art-review.js'])assert(build.includes(src),'Release output missing '+src);
console.log('PASS P3G: 7 characters, 4×4 compare, explicit source resolutions, HD candidate importer, no automatic art approval');
