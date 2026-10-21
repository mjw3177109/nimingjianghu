'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),src=p=>fs.readFileSync(path.join(root,p),'utf8');
const app=src('app.js'),guard=src('boot-guard.js'),html=src('index.html'),gameSrc=src('game.js');
for(const id of ['bootError','bootErrorMessage','bootRetry','bootClose','skipIntro']){
 assert(html.includes('id="'+id+'"'),'Missing recovery control: '+id);
}
assert(html.indexOf('boot-guard.js')<html.indexOf('game.js'),'Error boundary must initialize before gameplay');
assert(guard.includes('nm-game-start-failed')&&guard.includes('unhandledrejection'));
assert(!app.includes('!confirm('),'New game must not be blocked by the native confirm popup');
assert(gameSrc.includes("function skipIntro()")&&gameSrc.includes("addEventListener('click',skipIntro)"),'Intro skip must be wired');
assert(gameSrc.includes("地图渲染失败："),'Runtime draw error should surface to the user');
assert(src('tools/build-web.cjs').includes('boot-guard.js'),'Release must ship guard');

function scenario(shouldFail){
 const elements={},listeners={};
 const events=[];
 function node(id){
  if(!elements[id]){
   const handlers={};
   elements[id]={id,hidden:id!=='homeScreen',disabled:false,textContent:'',innerHTML:'',dataset:{},
    classList:{add(){},remove(){},contains(){return true}},
    addEventListener(type,cb){(handlers[type]??=[]).push(cb)},
    click(){for(const cb of handlers.click||[])cb({type:'click'})},
    handlers};
  }
  return elements[id];
 }
 const store=new Map([['nimingjianghu_tile_v2','{"version":3,"state":{"quest":1}}']]);
 const storage={getItem(k){return store.get(k)||null},setItem(k,v){store.set(k,String(v))}};
 const game={hasSave(){return true},saveInfo(){return {day:1,map:'town',quest:1}},getJournal(){return []},
  startNew(){if(shouldFail)throw Error('模拟启动失败');return true;},continueGame(){return true}};
 const win={NMFinal:game,
  addEventListener(name,fn){(listeners[name]??=[]).push(fn)},
  dispatchEvent(e){events.push(e);for(const fn of listeners[e.type]||[])fn(e)},
  scrollTo(){}};
 const ctx={window:win,document:{getElementById:node,querySelectorAll(){return []},
  addEventListener(){}},localStorage:storage,console,confirm(){throw Error('Unexpected confirm')},
  Event:class{constructor(type){this.type=type}},
  CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail}}};
 vm.createContext(ctx);vm.runInContext(app,ctx);
 node('startButton').click();
 assert.equal(store.get('nimingjianghu_save_before_new_demo'),store.get('nimingjianghu_tile_v2'),'Previous save must be backed up before new game');
 if(shouldFail){
  assert.equal(node('gameScreen').hidden,true,'Failure should restore hidden game');
  assert.equal(node('homeScreen').hidden,false,'Failure should restore clickable homepage');
  assert(events.some(e=>e.type==='nm-game-start-failed'),'Error event must explain the failure');
 }else{
  assert.equal(node('gameScreen').hidden,false,'New game should become visible');
  assert.equal(node('homeScreen').hidden,true,'Home should hide on game start');
  assert(events.some(e=>e.type==='nm-game-started'),'Successful start should broadcast result');
 }
}
scenario(false);scenario(true);
console.log('PASS STARTUP: new-game click, nonblocking save backup, visible screen, clear error recovery and intro skip');
