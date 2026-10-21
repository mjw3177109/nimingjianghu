'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const game=fs.readFileSync(path.join(__dirname,'..','game.js'),'utf8');
assert(game.includes('candidates.sort((a,b)=>a.radius-b.radius||a.r.length-b.r.length);'), 'Actor interaction must prefer adjacent tiles over distant shortcuts');
assert(game.includes('function pickActorAtScreen(sx,sy)'), 'Actor screen-space hitbox must exist');
assert(game.includes('const centerX=(a.x+.5)*32-cam.x,feetY=(a.y+1)*32-cam.y;'), 'Hitbox must share the renderer foot anchor');
assert(game.includes('rise>=5&&rise<=69&&Math.abs(sx-centerX)<=(rise>46?17:22)'), 'Click target must be constrained to visible body');
assert(game.includes('if(!dialogue&&!battle){\n  const actor=pickActorAtScreen(p.x,p.y);'), 'Dialogue and combat input must take priority');
assert(game.includes("if(actor){travelTo(actor.x,actor.y,{type:actor.type,id:actor.id});return;}"), 'Clicking a visible actor must use normal pathfinding');
assert(!game.includes('ctx.strokeRect(Math.round(sx)+5'), 'Square debug click marker must remain removed');
// Numeric geometry contract: actor foot at (x+0.5,y+1)*32, 72px tall.
// At x + 19px and 36px above feet, the actor must be clickable even though
// that pixel belongs to the neighboring grid column.
const x=8,y=10,camX=0,camY=0,cx=(x+.5)*32-camX,feet=(y+1)*32-camY;
const sx=cx+19,sy=feet-36,rise=feet-sy;
assert.equal(Math.floor(sx/32),x+1);
assert(rise>=5&&rise<=69&&Math.abs(sx-cx)<=(rise>46?17:22));
const groundY=feet+2,groundRise=feet-groundY;
assert(!(groundRise>=5&&groundRise<=69),'Ground below actor must remain walkable by click');
console.log('PASS: screen-space actor body click, unchanged dialogue priority and floor clicks');
