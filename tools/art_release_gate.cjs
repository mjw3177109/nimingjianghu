#!/usr/bin/env node
'use strict';
// Independent release gate: do NOT wire into npm build until art is delivered.
// Exit 1 is intentional while characters remain unreviewed.
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const dir=path.join(root,'assets/characters/scene_sprites');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'sprite_manifest.json'),'utf8'));
const registry=JSON.parse(fs.readFileSync(path.join(dir,'sprite_registry.js'),'utf8').replace(/^window\.NM_SPRITE_REGISTRY = /,'').trim().replace(/;$/,''));
const expected={CHAR001:'player',NPC001:'innkeeper',NPC005:'healer',NPC002:'oldman',NPC003:'swordswoman',BOSS001:'liao',EN001:'bandit'};
const errors=[];
for(const [id,key] of Object.entries(expected)){
 const e=manifest.entries.find(x=>x.id===id);
 if(!e){errors.push(id+': no manifest entry');continue}
 if(e.direction_status!=='user_approved_independently_painted'||e.animation_status!=='verified_16_frames')errors.push(id+': awaiting manual 4-direction art approval');
 if(e.frame_width!==96||e.frame_height!==128)errors.push(id+': not 96x128 per frame');
 if(!e.reviewer||!e.review_evidence_sha256)errors.push(id+': missing human review evidence');
 const expectedPath='assets/characters/scene_sprites/'+key+'_4dir.png';
 if(e.sheet!==expectedPath||registry[key]!==expectedPath){errors.push(id+': registry/manifest not bound to final PNG');continue}
 const f=path.join(root,expectedPath);
 if(!fs.existsSync(f)){errors.push(id+': final PNG missing');continue}
 const b=fs.readFileSync(f);
 if(b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||b.readUInt32BE(16)!==384||b.readUInt32BE(20)!==512)errors.push(id+': invalid 384x512 PNG');
 const sha=crypto.createHash('sha256').update(b).digest('hex');
 if(e.asset_sha256!==sha)errors.push(id+': image SHA256 differs from reviewed manifest');
}
if(errors.length){console.error('ART_RELEASE_BLOCKED ('+errors.length+'):');for(const error of errors)console.error(' - '+error);process.exitCode=1}
else console.log('ART_RELEASE_MANIFEST_PASS: 7 independently reviewed 384x512 sprites; browser visual QA still required');
