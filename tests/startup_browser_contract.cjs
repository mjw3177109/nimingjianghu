'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const html=read('index.html'),app=read('app.js'),game=read('game.js'),guard=read('boot-guard.js');
assert(html.includes('game.js?v=10102')&&html.includes('app.js?v=10102'),'HTML/JS version must match');
assert(html.includes('boot-guard.js?v=10102'),'Boot guard must use same revision');
assert(app.includes('getGame=()=>window.NMFinal'),'Never capture missing core at script-load time');
assert(app.includes('nm-game-ready'),'A recovered game must re-enable Continue');
assert(game.includes('window.NM_GAME_BOOT_ERROR=detail'),'Core must report actual init failure');
assert(guard.includes('window.NM_BOOT_DIAGNOSTIC=msg'),'Keep original diagnostic');
assert(guard.includes("script.src='game.js?boot-retry='"),'Boot guard must attempt a single cache-busting retry');
const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
for(const [name,src] of [['app.js',app],['game.js',game],['boot-guard.js',guard]]){
 const used=[...new Set([...src.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]))];
 assert.deepEqual(used.filter(id=>!ids.has(id)),[],'Nonexistent DOM elements: '+name);
}
const handlers={},nodes={};
function node(id){
 if(!nodes[id]){
  const h={};
  nodes[id]={id,hidden:id!=='homeScreen',disabled:false,textContent:'',innerHTML:'',style:{},dataset:{},
   classList:{data:new Set(['menuPanel'].includes(id)?['hidden']:[]),
    add(x){this.data.add(x)},remove(x){this.data.delete(x)},contains(x){return this.data.has(x)}},
   addEventListener(t,cb){(h[t]??=[]).push(cb)},handlers:h,click(){for(const cb of h.click||[])cb({type:'click'})}};
 }
 return nodes[id];
}
const win={NMFinal:undefined,NM_APP_BOUND:false,
 dispatchEvent(e){for(const f of handlers['win:'+e.type]||[])f(e)},
 addEventListener(t,fn){(handlers['win:'+t]??=[]).push(fn)},
 location:{reload(){}},setTimeout(fn){fn()}};
const ctx={window:win,document:{getElementById:node,querySelectorAll(){return []},addEventListener(){}},
 localStorage:{getItem(){return null},setItem(){}},Event:class{constructor(type){this.type=type}},
 CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail}},console};
vm.createContext(ctx);
vm.runInContext(app,ctx);
assert(win.NM_APP_BOUND,'Menus must initialize even when game.js crashed');
assert.equal(node('continueButton').disabled,true);
node('startButton').click();
assert.equal(node('homeScreen').hidden,false,'Bad boot must keep homepage available');
assert.equal(node('gameScreen').hidden,true);
const recovered={
 hasSave(){return false},saveInfo(){return null},startNew(){return true},continueGame(){return false},
 isRunning(){return true},getJournal(){return []}
};
win.NMFinal=recovered;win.dispatchEvent(new ctx.Event('nm-game-ready'));
node('startButton').click();
assert.equal(node('gameScreen').hidden,false,'Recovered boot must enter game from button');
assert.equal(node('homeScreen').hidden,true);
console.log('PASS browser bootstrap contract: missing core menu survives; asynchronous recovery enables Start');
