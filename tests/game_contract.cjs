const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const byId={},events={},timers=[];let raf=null,rafId=0;
function node(id){const attrs=new Set(['hidden'].filter(()=>id==='nmHomePanel'||id==='gameScreen'));return {
id,textContent:'',innerHTML:'',src:'',alt:'',value:'',disabled:false,hidden:attrs.has('hidden'),style:{},dataset:{},
classList:{s:new Set(['hidden'].filter(()=>['panel','dialogue','battle'].includes(id))),add(k){this.s.add(k)},remove(k){this.s.delete(k)},contains(k){return this.s.has(k)}},
addEventListener(name,fn){(events[id+':'+name]??=[]).push(fn)},focus(){},querySelectorAll(){return []},querySelector(){return node('nmStart')},
getBoundingClientRect(){return {left:0,top:0,width:640,height:360}},
getContext(){return {imageSmoothingEnabled:false,fillRect(){},strokeRect(){},drawImage(){},fillText(){},measureText(t){return {width:t.length*6}},beginPath(){},ellipse(){},fill(){},save(){},restore(){},set fillStyle(v){},set strokeStyle(v){},set lineWidth(v){},set font(v){},set shadowColor(v){},set shadowBlur(v){}}}
}}
const document={getElementById(id){return byId[id]??=node(id)},querySelectorAll(){return []},addEventListener(name,fn){(events['document:'+name]??=[]).push(fn)}};
const db={};
const localStorage={getItem(k){return db[k]??null},setItem(k,v){db[k]=String(v)},removeItem(k){delete db[k]}};
const window={addEventListener(name,fn){(events['window:'+name]??=[]).push(fn)},dispatchEvent(e){(events['window:'+e.type]||[]).forEach(f=>f(e))}};
const sandbox={window,document,localStorage,CustomEvent:class{constructor(type){this.type=type}},Image:class{constructor(){this.complete=true;this.naturalWidth=640}set src(v){this._src=v}},performance:{now(){return 0}},requestAnimationFrame(fn){raf=fn;return ++rafId},cancelAnimationFrame(){raf=null},setTimeout(fn){timers.push(fn);return timers.length},clearTimeout(){},console,Math,confirm(){return true},location:{reload(){throw Error('Unexpected reload')}},JSON};
vm.createContext(sandbox);
for(const f of ['world-data.js','game.js','home.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),sandbox);
assert.equal(raf,null,'Game must not start before user click');
assert.equal(localStorage.getItem('nimingjianghu_save_v3'),null,'Home should not write a blank save');
assert.equal(byId.nmContinue.disabled,true,'Continue disabled without save');
(events['nmStart:click']||[]).forEach(f=>f());
assert.equal(typeof raf,'function','Start launches the game loop');
assert.equal(byId.gameScreen.hidden,false,'Game screen visible');
assert.equal(byId.homeScreen.hidden,true,'Home hidden');
assert(localStorage.getItem('nimingjianghu_save_v3'),'Starting game saves state');
assert(timers.length>0);timers.shift()();
for(let i=0;i<3;i++)(events['nextDialogue:click']||[]).forEach(f=>f());
assert.match(byId.quest.textContent,/青石镇/);
(events['game:click']||[]).forEach(f=>f({clientX:10*20+10,clientY:11*20+10}));
for(let i=1;i<120;i++){const frame=raf;assert(frame);frame(i*150)}
assert.match(byId.speaker.textContent,/韩掌柜/);
for(let i=0;i<3;i++)(events['nextDialogue:click']||[]).forEach(f=>f());
assert.match(byId.quest.textContent,/山贼/);
assert.equal(typeof byId.restart.onclick,'function');
byId.restart.onclick();
assert.equal(byId.homeScreen.hidden,false);assert.equal(raf,null,'Returning home stops animation');
assert.equal(byId.nmContinue.disabled,false,'Continue available after saving');
(events['nmContinue:click']||[]).forEach(f=>f());
assert.equal(typeof raf,'function');assert.match(byId.quest.textContent,/山贼/);
console.log('P2 home smoke: initial home / new game / intro / mouse NPC quest / return / continue PASS');
