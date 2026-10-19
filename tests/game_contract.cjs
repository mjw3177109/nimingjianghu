const assert=require('node:assert/strict');
const fs=require('node:fs'); const vm=require('node:vm');const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
let raf=null;let listeners={};let timers=[];
function obj(id){return {
  id,textContent:'',innerHTML:'',style:{},dataset:{},classList:{add(){},remove(){},contains(){return false}},
  addEventListener(type,fn){(listeners[id+':'+type]??=[]).push(fn)},
  getBoundingClientRect(){return {left:0,top:0,width:640,height:360}},
  getContext(){return {imageSmoothingEnabled:false,fillRect(){},strokeRect(){},drawImage(){},fillText(){},measureText(t){return {width:t.length*6}},set fillStyle(v){},set strokeStyle(v){},set lineWidth(v){},set font(v){}}}
}}
const byId={};const document={getElementById(id){return byId[id]??=obj(id)},querySelectorAll(){return []},addEventListener(type,fn){(listeners['document:'+type]??=[]).push(fn)}};
const sandbox={window:{},document,Image:class {constructor(){this.complete=true;this.naturalWidth=640}set src(v){this._src=v}},performance:{now(){return 0}},requestAnimationFrame(cb){raf=cb},setTimeout(fn){timers.push(fn)},clearTimeout(){},console,Math,confirm(){return true},location:{reload(){}}};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT,'world-data.js'),'utf8'),sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT,'game.js'),'utf8'),sandbox);
assert.match(byId.quest.textContent,/青石镇/);assert.equal(typeof raf,'function');
// Intro timer; user reads 3 dialogue screens.
assert(timers.length>0);timers.shift()();
for(let i=0;i<3;i++)(listeners['nextDialogue:click']||[]).forEach(f=>f());
// Click near 韩掌柜 and advance animation.
(listeners['game:click']||[]).forEach(f=>f({clientX:10*20+10,clientY:11*20+10}));
for(let i=1;i<120;i++)raf(i*150);
assert.match(byId.speaker.textContent,/韩掌柜/);
for(let i=0;i<3;i++)(listeners['nextDialogue:click']||[]).forEach(f=>f());
assert.match(byId.quest.textContent,/山贼/);
console.log('browser simulation: intro, mouse pathfinding and quest dialogue PASS');
