'use strict';
// Real Chromium browser journey: mouse clicks and rendered UI, no debugState mutation.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),PORT=4189;
const {serveBuild,launchOptions}=require('../tools/browser-test-runtime.cjs');
const URL=process.env.E2E_URL||'http://127.0.0.1:'+PORT+'/';
const OUTPUT=path.join(ROOT,'qa/e2e');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function serverReady(){for(let n=0;n<60;n++){try{await new Promise((resolve,reject)=>http.get(URL,res=>{res.resume();resolve()}).on('error',reject));return}catch{await delay(200)}}throw Error('Demo HTTP server did not start')}
async function main(){
 fs.mkdirSync(OUTPUT,{recursive:true});
 const server=process.env.E2E_URL?null:await serveBuild(ROOT,PORT);
 if(server)await serverReady();
 let browser,page;const errors=[],failed=[];
 try{
  browser=await chromium.launch(launchOptions());
  page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>failed.push(r.url()+': '+r.failure()?.errorText));
  page.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url())});
  const response=await page.goto(URL,{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(response.status(),200);
  await page.locator('#startButton').click();
  await page.waitForFunction(()=>window.NMFinal?.isRunning()&&!document.getElementById('gameScreen').hidden);
  await delay(600);
  if(await page.locator('#skipIntro').isVisible())await page.locator('#skipIntro').click();
  async function dialogue(){
   for(let i=0;i<20;i++){
    if(!(await page.locator('#dialogue').isVisible()))return;
    await page.locator('#nextDialogue').click();await delay(40);
   }
   throw Error('Dialogue did not close');
  }
  async function state(){return page.evaluate(()=>{const s=window.NMFinal.debugState();return {map:s.map,pos:{...s.pos},quest:s.quest,route:s.route.length,motion:!!window.NMFinal.debugAnimation().motion,banditAlive:s.banditAlive,manual:s.manual,trace:s.trace}})}
  async function capture(name){await page.screenshot({path:path.join(OUTPUT,name+'.png')});}
  const initial=await state();
  for(const [key,dx,dy] of [['ArrowLeft',-1,0],['ArrowRight',1,0],['ArrowUp',0,-1],['ArrowDown',0,1]]){
   const before=await state();
   await page.keyboard.down(key);
   await page.waitForFunction(({x,y})=>{const p=window.NMFinal.debugState().pos;return p.x===x&&p.y===y},{x:before.pos.x+dx,y:before.pos.y+dy},{timeout:3000});
   await page.keyboard.up(key);
   await page.waitForFunction(()=>!window.NMFinal.debugAnimation().motion);
   const stopped=await state();await delay(300);
   assert.deepEqual((await state()).pos,stopped.pos,'Released key must stop at settled feet');
   assert.equal(await page.evaluate(()=>window.NMFinal.debugAnimation().walkFrame),0,'Stopped actor must return to idle');
  }
  assert.deepEqual((await state()).pos,initial.pos,'Four directions return to origin');
  // Hold against the north map boundary; keyboard must stop at the last walkable row.
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(()=>window.NMFinal.debugState().pos.y===1,undefined,{timeout:12000});
  await delay(300);await page.keyboard.up('ArrowUp');
  await page.waitForFunction(()=>!window.NMFinal.debugAnimation().motion);
  const bank=await state();assert.equal(bank.pos.y,1,'Keyboard must stop before the solid north boundary');
  await page.keyboard.down('ArrowDown');
  await page.waitForFunction(y=>window.NMFinal.debugState().pos.y>y,bank.pos.y);
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  await page.keyboard.up('ArrowDown');
  await page.waitForFunction(()=>!window.NMFinal.debugAnimation().motion);
  const blurred=await state();await delay(300);assert.deepEqual((await state()).pos,blurred.pos,'Lost focus must not leave movement held');
  await capture('town-keyboard');
  async function clickTile(x,y){
   const p=await page.evaluate(({x,y})=>{const c=window.NMFinal.debugCamera(),r=document.getElementById('game').getBoundingClientRect();return {x:r.left+((x+.5)*32-c.x)/640*r.width,y:r.top+((y+.5)*32-c.y)/360*r.height}},{x,y});
   assert(p.x>=0&&p.x<1440&&p.y>=0&&p.y<900,'Tile outside browser '+JSON.stringify({x,y,p}));
   await page.mouse.click(p.x,p.y);
  }
  async function walkTo(x,y){
   for(let tries=0;tries<45;tries++){
    const s=await state();
    if(s.pos.x===x&&s.pos.y===y&&!s.route&&!s.motion)return;
    const path=await page.evaluate(({x,y})=>{
     const s=window.NMFinal.debugState(),m=window.NMFinal.debugTilemap(),structures=window.NMFinal.debugStructures()[s.map]||[],seen=new Set([s.pos.x+','+s.pos.y]),prev=new Map(),q=[[s.pos.x,s.pos.y]];
     const actors=window.GAME_WORLD.maps[s.map];const solid=(a,b)=>a<0||b<0||a>=m.width||b>=m.height||m.collision[b*m.width+a]===1||(actors.npcs||[]).some(o=>Math.abs(o.x-a)<=1&&o.y===b)||(s.banditAlive&&(actors.enemies||[]).some(o=>Math.abs(o.x-a)<=1&&o.y===b))||structures.some(o=>{const f=o.solid_footprint;return f&&a>=o.x+f.x&&a<o.x+f.x+f.w&&b>=o.y+f.y&&b<o.y+f.y+f.h});
     while(q.length){const [a,b]=q.shift();if(a===x&&b===y){let k=x+','+y,r=[];while(k!==s.pos.x+','+s.pos.y){r.unshift(k.split(',').map(Number));k=prev.get(k)}return r}for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=a+dx,ny=b+dy,k=nx+','+ny;if(!seen.has(k)&&!solid(nx,ny)){seen.add(k);prev.set(k,a+','+b);q.push([nx,ny])}}}
     return null;
    },{x,y});
    assert(path,'No route to '+x+','+y+' on '+s.map);
    if(!path.length){await delay(180);continue}
    let target=path[Math.min(5,path.length)-1];
    await clickTile(target[0],target[1]);
    try{
      await page.waitForFunction(({x,y})=>{const s=window.NMFinal.debugState();return s.pos.x===x&&s.pos.y===y&&s.route.length===0&&!window.NMFinal.debugAnimation().motion},{x:target[0],y:target[1]},{timeout:8000});
    }catch(error){
      const diagnostic=await page.evaluate(()=>({state:{map:window.NMFinal.debugState().map,pos:window.NMFinal.debugState().pos,route:window.NMFinal.debugState().route,pending:window.NMFinal.debugState().pending},animation:window.NMFinal.debugAnimation(),dialogueVisible:!document.getElementById('dialogue').classList.contains('hidden'),battleVisible:!document.getElementById('battle').classList.contains('hidden'),canvasRect:document.getElementById('game').getBoundingClientRect().toJSON(),bootError:window.NM_GAME_BOOT_ERROR||null}));
      console.error('WALK_DIAGNOSTIC',JSON.stringify({goal:{x,y},target,diagnostic,errors,failed}));
      await page.screenshot({path:'/tmp/niming-walk-failure.png'}).catch(()=>{});
      throw error;
    }
   }
   throw Error('Could not reach '+x+','+y);
  }
  await walkTo(10,11);
  // The visible right edge of the innkeeper's torso is in the adjacent
  // tile (x=9). A tile-only hitbox used to mistake this click for walking.
  const actorEdge=await page.evaluate(()=>{
   const cam=window.NMFinal.debugCamera(),r=document.getElementById('game').getBoundingClientRect();
   return {x:r.left+((8.5*32+19-cam.x)/640)*r.width,
           y:r.top+(((10+1)*32-36-cam.y)/360)*r.height};
  });
  await page.mouse.click(actorEdge.x,actorEdge.y);
  await page.waitForFunction(()=>window.NMFinal.debugState().pending?.type==='npc'||!document.getElementById('dialogue').classList.contains('hidden'),undefined,{timeout:2500});
  // Regression: re-click the NPC during the last animated step.
  const midstride=await page.evaluate(()=>new Promise((resolve,reject)=>{
   let attempts=0;
   function probe(){
    const st=window.NMFinal.debugState(),motion=window.NMFinal.debugAnimation().motion;
    if(motion&&st.route.length===0&&motion.progress<0.8){
     const camera=window.NMFinal.debugCamera(),rect=document.getElementById('game').getBoundingClientRect();
     const x=rect.left+((8.5*32-camera.x)/640)*rect.width;
     const y=rect.top+((10.5*32-camera.y)/360)*rect.height;
     document.getElementById('game').dispatchEvent(new MouseEvent('click',{clientX:x,clientY:y,bubbles:true}));
     resolve({moving:!!window.NMFinal.debugAnimation().motion,dialogue:!document.getElementById('dialogue').classList.contains('hidden')});
     return;
    }
    if(++attempts>600)return reject(new Error('Final animated step was not reached'));
    requestAnimationFrame(probe);
   }
   probe();
  }));
  assert(midstride.moving,'Re-click must not cancel movement');
  assert.equal(midstride.dialogue,false,'Re-click must not freeze an incomplete stride');
  await page.locator('#dialogue').waitFor({state:'visible',timeout:10000});
  assert.equal((await state()).motion,false,'NPC dialogue must wait for player feet to settle');
  await dialogue();
  assert.equal((await state()).quest,1,'Innkeeper quest did not start');
  await capture('town-quest');
  await walkTo(36,12);await clickTile(39,12);
  await page.waitForFunction(()=>window.NMFinal.debugState().map==='road',{timeout:12000});
  await walkTo(15,10);
  await clickTile(17,10);await delay(250);
  assert.deepEqual((await state()).pos,{x:15,y:10},'Wide bandit sprite must not overlap player');
  await clickTile(18,10);
  await page.locator('#battle').waitFor({state:'visible',timeout:10000});
  await capture('road-battle');
  const combatPos=(await state()).pos;await page.keyboard.press('ArrowLeft');assert.deepEqual((await state()).pos,combatPos,'Combat must reject movement');
  assert.equal((await state()).motion,false,'Battle must not freeze player mid-stride');
  for(let i=0;i<9;i++){if(Number(await page.locator('#battleEnemyHp').textContent())===0)break;await page.locator('[data-action="attack"]').click();await delay(100)}
  assert.equal(Number(await page.locator('#battleEnemyHp').textContent()),0,'Bandit HP should reach zero exactly once');
  await page.locator('#battle').waitFor({state:'hidden',timeout:6000});await dialogue();
  assert.equal((await state()).quest,2,'Bandit quest did not advance');
  await walkTo(32,10);await clickTile(35,10);
  await page.waitForFunction(()=>window.NMFinal.debugState().map==='cave',{timeout:12000});
  await walkTo(21,11);await clickTile(23,10);
  await page.waitForFunction(()=>window.NMFinal.debugState().manual,{timeout:10000});
  await walkTo(16,10);await clickTile(16,8);
  await page.waitForFunction(()=>window.NMFinal.debugState().trace,{timeout:10000});await dialogue();
  assert.equal((await state()).quest,4,'Cave mystery did not advance');
  await capture('cave-trace');
  await walkTo(2,10);await clickTile(0,10);
  await page.waitForFunction(()=>window.NMFinal.debugState().map==='road',{timeout:10000});
  await walkTo(2,10);await clickTile(0,10);
  await page.waitForFunction(()=>window.NMFinal.debugState().map==='town',{timeout:10000});await dialogue();
  assert.equal((await state()).quest,5,'Ending not reached');
  await capture('ending');
  await page.locator('#restart').click();
  assert(await page.locator('#continueButton').isEnabled(),'Save resume disabled');
  await page.locator('#continueButton').click();
  await page.waitForFunction(()=>window.NMFinal?.isRunning()&&window.NMFinal.debugState().quest===5,{timeout:10000});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#continueButton').click();
  await page.waitForFunction(()=>window.NMFinal?.isRunning()&&window.NMFinal.debugState().quest===5);
  const restored=await state();assert(restored.manual&&restored.trace&&!restored.banditAlive,'Refresh must retain chapter items and defeated enemy');
  await page.locator('#restart').click();
  await page.setViewportSize({width:390,height:844});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Narrow homepage must not overflow');
  await capture('mobile-home');
  assert.equal(errors.length,0,'JavaScript exceptions: '+errors.join(' | '));
  assert.equal(failed.length,0,'Failed requests: '+failed.join(' | '));
  fs.writeFileSync(path.join(OUTPUT,'report.json'),JSON.stringify({url:URL,date:new Date().toISOString(),commit:process.env.E2E_COMMIT||null,browser:browser.version(),passed:true,keyboard:true,refreshSave:restored,errors,failed,artApproved:false},null,2));
  console.log('PASS REAL CHROMIUM E2E: home -> NPC -> road -> bandit battle -> cave manual/trace -> ending -> save/continue; no JS errors');
 }catch(error){
  if(page)await page.screenshot({path:path.join(OUTPUT,'failure.png')}).catch(()=>{});
  fs.writeFileSync(path.join(OUTPUT,'failure.json'),JSON.stringify({url:URL,date:new Date().toISOString(),passed:false,error:error.stack,errors,failed},null,2));
  throw error;
 }finally{if(browser)await browser.close();if(server)await server.close()}
}
main().catch(e=>{console.error('E2E FAIL:',e.stack);process.exitCode=1});
