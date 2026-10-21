'use strict';
// Guard against NPC, battle and exit interactions freezing the last stride.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const src=fs.readFileSync(path.join(__dirname,'..','game.js'),'utf8');
const tick=src.slice(src.indexOf('function tick(ts){'),src.indexOf("canvas.addEventListener('click'"));
assert(tick.includes('if(motion.progress>=1){'),'Motion must settle before interactions');
assert(tick.includes('if(!state.route.length){finishPending();maybeEnding();}'),'Pending action must wait for completed motion');
assert(tick.indexOf('motion=null;')<tick.indexOf('finishPending();maybeEnding();'),'Do not freeze half-stride');
assert(tick.includes('if(!motion&&moveAcc>=WALK_TIME&&state.route.length)'),'Next tile cannot overwrite unfinished movement');
assert(!tick.includes('motion={from,to,progress:0};if(!state.route.length){finishPending();maybeEnding()}'));
assert(src.includes('if(!n.r.length&&state.pending&&!motion)finishPending()'),'Re-click during a moving tile must defer pending action');
console.log('PASS: dialogue, battle and exits start after feet settle');
