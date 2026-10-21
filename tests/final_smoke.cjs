const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');let raf=null,timers=[],rafId=0;const elements={},handlers={};const memory=new Map();
function el(id){if(elements[id])return elements[id];const obj={id,hidden:id!=='homeScreen',textContent:'',innerHTML:'',src:'',disabled:false,dataset:{},style:{},
classList:{data:new Set(['dialogue','battle','panel','menuPanel'].includes(id)?['hidden']:[]),add(x){this.data.add(x)},remove(x){this.data.delete(x)},contains(x){return this.data.has(x)}},
addEventListener(type,cb){handlers[id+':'+type]??=[];handlers[id+':'+type].push(cb)},click(){(handlers[id+':click']||[]).forEach(f=>f({}));if(typeof this.onclick==='function')this.onclick()},getBoundingClientRect(){return {left:0,top:0,width:640,height:360}},
getContext(){return {imageSmoothingEnabled:false,fillStyle:'#000',strokeStyle:'#fff',lineWidth:1,shadowColor:'',shadowBlur:0,font:'',fillRect(){},clearRect(){},setTransform(...matrix){assert.equal(matrix.length,6,'Canvas2D setTransform requires exactly six numeric arguments');assert.equal(matrix[0],2);assert.equal(matrix[3],2);assert.equal(matrix[4],0);assert.equal(matrix[5],0)},strokeRect(x,y,w,h){assert(x>=0&&y>=0&&x+w<=640&&y+h<=360,'yellow route marker must stay inside viewport')},drawImage(){},fillText(){},measureText(t){return {width:String(t).length*7}},beginPath(){},ellipse(){},fill(){},save(){},restore(){}}}
};elements[id]=obj;return obj;}
const allBtns=[{dataset:{page:'settings'}},{dataset:{page:'codex'}},{dataset:{page:'recap'}},{dataset:{page:'about'}},{dataset:{character:'CHAR001'}},{dataset:{character:'NPC005'}},{dataset:{preview:'town'}}];
for(let i=0;i<allBtns.length;i++){allBtns[i].addEventListener=(type,cb)=>{allBtns[i].cb=cb}};
const battleBtns=['attack','skill','heal','defend'].map(action=>({dataset:{action},addEventListener(type,cb){this.cb=cb}}));
const document={getElementById:el,querySelectorAll(sel){if(sel==='.battle-buttons button')return battleBtns;if(sel==='[data-page]')return allBtns.filter(x=>x.dataset.page);if(sel==='[data-character]')return allBtns.filter(x=>x.dataset.character);if(sel==='[data-preview]')return allBtns.filter(x=>x.dataset.preview);return []},addEventListener(type,cb){handlers['document:'+type]??=[];handlers['document:'+type].push(cb)}};
const window={GAME_WORLD:null,dispatchEvent(x){(handlers['window:'+x.type]||[]).forEach(f=>f(x))},addEventListener(type,cb){handlers['window:'+type]??=[];handlers['window:'+type].push(cb)}};
const storage={getItem(k){return memory.get(k)||null},setItem(k,v){memory.set(k,v)},removeItem(k){memory.delete(k)}};
const context={window,document,localStorage:storage,Image:class{constructor(){this.complete=true;this.naturalWidth=600}set src(v){this._src=v}},Event:class{constructor(type){this.type=type}},console,setTimeout(f){timers.push(f);return timers.length},clearTimeout(){},requestAnimationFrame(f){raf=f;return ++rafId},cancelAnimationFrame(){raf=null},Math,JSON,performance:{now(){return 0}},confirm(){return true}};
vm.createContext(context);
for(let f of ['world-data.js','town-tile-data.js','road-tile-data.js','cave-tile-data.js','structure-data.js','game.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context);
assert.equal(raf,null,'Home must not start the game');
assert.equal(typeof context.window.NMFinal.debugAnimation,'function','P3-C animation debug API exists');assert.equal(memory.size,0,'Home must not write save');assert.equal(el('continueButton').disabled,true);
el('startButton').click();assert.equal(el('gameScreen').hidden,false);assert.equal(el('homeScreen').hidden,true);assert.equal(typeof raf,'function');assert(memory.has('nimingjianghu_tile_v2'));
timers.shift()();for(let i=0;i<4;i++)el('nextDialogue').click();assert.match(el('quest').textContent,/青石镇/);
el('restart').click();assert.equal(el('gameScreen').hidden,true);assert.equal(el('homeScreen').hidden,false);assert.equal(raf,null);assert.equal(el('continueButton').disabled,false);
el('continueButton').click();assert.equal(typeof raf,'function');assert.equal(el('gameScreen').hidden,false);
for(const b of allBtns.filter(b=>b.dataset.character||b.dataset.page||b.dataset.preview))assert.equal(typeof b.cb,'function');
console.log('PASS: home, fresh save, start, opening dialogue, return, continue, menu/gallery buttons');

// Advance through the interactive first-chapter loop without bypassing quest actions.
function frame(n=1){for(let i=0;i<n;i++){const f=raf;if(f)f((++context._time)*160)}}
context._time=10;
function clickTile(x,y){let cx=x*20+10,cy=y*20+10;{const cam=context.window.NMFinal.debugCamera();cx=(x+.5)*32-cam.x;cy=(y+.5)*32-cam.y;}(handlers['game:click']||[]).forEach(f=>f({clientX:cx,clientY:cy}));}
const st=context.window.NMFinal.debugState();
st.map='town';st.pos={x:8,y:9};clickTile(8,10);frame(15);
assert.equal(el('dialogue').classList.contains('hidden'),false,'Innkeeper interaction must show dialogue');
for(let i=0;i<3;i++)el('nextDialogue').click();assert.equal(st.quest,1,'Innkeeper unlocks road quest');
st.map='road';st.pos={x:17,y:10};clickTile(18,10);frame(12);
assert.equal(el('battle').classList.contains('hidden'),false,'Road bandit starts battle');
for(let i=0;i<5;i++)battleBtns[0].cb();
assert.equal(st.banditAlive,false,'Bandit defeated');assert(st.quest>=2,'Quest advanced after bandit');
console.log('PASS: complete innkeeper quest, road encounter, battle and combat rewards');
// Simulate cave inspection; object interaction must award the manual and affect destiny.
for(const fn of timers.splice(0))fn();for(let i=0;i<3;i++)el('nextDialogue').click();
st.map='cave';st.pos={x:22,y:10};clickTile(23,10);frame(12);assert.equal(st.manual,true);assert(st.skills.includes('破风一剑'));
st.pos={x:16,y:9};clickTile(16,8);frame(15);assert.equal(st.trace,true);assert.equal(st.destiny,25);assert.equal(st.quest,4);
for(let i=0;i<4;i++)el('nextDialogue').click();
st.map='town';st.pos={x:14,y:12};clickTile(15,12);frame(15);
for(let i=0;i<5;i++)el('nextDialogue').click();
assert.equal(st.quest,5,'Final first-chapter Liao foreshadowing must complete');
console.log('PASS: cave manual, trace +25, return to town and finish chapter');

// Exercise real key handlers and animation ticks, including overlay isolation.
st.pos={x:14,y:12};st.route=[];st.pending=null;
function key(type,value){for(const fn of handlers['document:'+type]||[])fn({key:value,preventDefault(){}})}
for(const [value,dx,dy] of [['ArrowLeft',-1,0],['d',1,0],['w',0,-1],['ArrowDown',0,1]]){
 const before={...st.pos};key('keydown',value);frame(2);key('keyup',value);frame(5);
 assert.deepEqual(JSON.parse(JSON.stringify(st.pos)),{x:before.x+dx,y:before.y+dy});
 assert.equal(window.NMFinal.debugAnimation().walkFrame,0,'Released movement settles to idle');
}
st.pos={x:14,y:1};key('keydown','ArrowUp');frame(8);key('keyup','ArrowUp');
assert.equal(st.pos.y,1,'Keyboard cannot leave the map');
key('keydown','ArrowDown');frame(2);for(const fn of handlers['window:blur']||[])fn({});frame(8);
const blurred={...st.pos};frame(8);assert.deepEqual(JSON.parse(JSON.stringify(st.pos)),blurred,'Blur clears held input');
el('quests').onclick();key('keydown','ArrowDown');frame(8);key('keyup','ArrowDown');
assert.deepEqual(JSON.parse(JSON.stringify(st.pos)),blurred,'Task overlay captures movement');
el('closePanel').onclick();
console.log('PASS: keyboard four directions, collision, key release, focus loss and panel isolation');

st.pos={x:10,y:11};
const transparentCam=window.NMFinal.debugCamera();
for(const handler of handlers['game:click']||[])handler({clientX:8.5*32+14-transparentCam.x,clientY:11*32-70-transparentCam.y});
frame(8);
assert.deepEqual(JSON.parse(JSON.stringify(st.pos)),{x:10,y:11},'Rejected transparent actor pixel must not regain a tile-column hit');
assert.equal(st.pending,null);assert.equal(st.route.length,0);
assert(el('dialogue').classList.contains('hidden'));
console.log('PASS: transparent actor corner does not move the player or trigger dialogue');

// Exploration order must not strand a save after the altar has already been read.
st.map='cave';st.pos={x:16,y:10};st.quest=2;st.manual=false;st.trace=false;st.destiny=0;st.skills=['基础剑法'];st.flags={};
clickTile(16,8);frame(30);assert.equal(st.trace,true);assert.equal(st.quest,2,'Altar alone cannot finish the investigation');
st.pos={x:21,y:11};clickTile(23,10);frame(30);
assert.equal(st.manual,true);assert.equal(st.quest,4,'Altar first, manual second must unlock return to town');
for(let i=0;i<4;i++)el('nextDialogue').click();
const clueCoins=st.coins;clickTile(23,10);frame(30);
assert.equal(st.coins,clueCoins,'Repeated inspection must not duplicate rewards');
assert.equal(st.skills.filter(s=>s==='破风一剑').length,1);
// Recover the exact quest=3 / both clues save produced by the old bug.
st.quest=3;el('restart').click();el('continueButton').click();
assert.equal(window.NMFinal.debugState().quest,4,'Continue must repair already stranded saves without losing clues');
assert(window.NMFinal.debugState().manual&&window.NMFinal.debugState().trace);
console.log('PASS: reverse clue order, idempotent rewards and stranded-save recovery');
