'use strict';
// A moving step must alternate the painted lead-foot frames; no frame-clock aliasing.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const game=fs.readFileSync(path.join(__dirname,'..','game.js'),'utf8');
assert(game.includes('let motion=null,walkStepIndex=0;'));
assert(/walkStepIndex\+\+;\s*motion=\{from,to,progress:0\};/.test(game),'A new step increments parity before creating the next motion');
assert(game.includes('walkStepIndex=0;state='));
assert(game.includes('const beat=moving?stride[((walkStepIndex-1)*2+halfStep)%stride.length]:0;'));
assert(!game.includes('Math.floor(frame/5)%stride.length'),'Global animation clock can freeze/repeat a leg at every short tile');
const stride=[1,2,3,2];
const frames=Array.from({length:6},(_,i)=>[stride[(i*2)%4],stride[(i*2+1)%4]]);
assert.deepEqual(frames,[[1,2],[3,2],[1,2],[3,2],[1,2],[3,2]]);
console.log('PASS: left/right step parity alternates for each tile, with neutral in between; painted art still requires visual QA');
