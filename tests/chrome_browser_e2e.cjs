'use strict';
// Real Chromium browser journey: mouse clicks and rendered UI, no debugState mutation.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const cp=require('node:child_process'),http=require('node:http'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),PORT=4189;
const URL=process.env.E2E_URL||'http://127.0.0.1:'+PORT+'/';
const CHROME=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>require('node:fs').existsSync(p));
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function serverReady(){for(let n=0;n<60;n++){try{await new Promise((resolve,reject)=>http.get(URL,res=>{res.resume();resolve()}).on('error',reject));return}catch{await delay(200)}}throw Error('Demo HTTP server did not start')}
async function main(){
 const server=process.env.E2E_URL?null:cp.spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1','--directory',path.join(ROOT,'dist')],{stdio:'ignore'});
 if(server)await serverReady();
 const browser=await chromium.launch({headless:true,...(CHROME?{executablePath:CHROME}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>failed.push(r.url()+': '+r.failure()?.errorText));
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
     const solid=(a,b)=>a<0||b<0||a>=m.width||b>=m.height||m.collision[b*m.width+a]===1||structures.some(o=>{const f=o.solid_footprint;return f&&a>=o.x+f.x&&a<o.x+f.x+f.w&&b>=o.y+f.y&&b<o.y+f.y+f.h});
     while(q.length){const [a,b]=q.shift();if(a===x&&b===y){let k=x+','+y,r=[];while(k!==s.pos.x+','+s.pos.y){r.unshift(k.split(',').map(Number));k=prev.get(k)}return r}for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=a+dx,ny=b+dy,k=nx+','+ny;if(!seen.has(k)&&!solid(nx,ny)){seen.add(k);prev.set(k,a+','+b);q.push([nx,ny])}}}
     return null;
    },{x,y});
    assert(path,'No route to '+x+','+y+' on '+s.map);
    if(!path.length){await delay(180);continue}
    let target=path[Math.min(5,path.length)-1];
    await clickTile(target[0],target[1]);
    await page.waitForFunction(({x,y})=>{const s=window.NMFinal.debugState();return s.pos.x===x&&s.pos.y===y&&s.route.length===0&&!window.NMFinal.debugAnimation().motion},{x:target[0],y:target[1]},{timeout:8000});
   }
   throw Error('Could not reach '+x+','+y);
  }
  await walkTo(10,11);
  await clickTile(8,10);
  await page.locator('#dialogue').waitFor({state:'visible',timeout:10000});await dialogue();
  assert.equal((await state()).quest,1,'Innkeeper quest did not start');
  await walkTo(36,12);await clickTile(39,12);
  await page.waitForFunction(()=>window.NMFinal.debugState().map==='road',{timeout:12000});
  await walkTo(15,10);await clickTile(18,10);
  await page.locator('#battle').waitFor({state:'visible',timeout:10000});
  for(let i=0;i<9&&await page.locator('#battle').isVisible();i++){await page.locator('[data-action="attack"]').click();await delay(140)}
  await page.locator('#battle').waitFor({state:'hidden',timeout:6000});await dialogue();
  assert.equal((await state()).quest,2,'Bandit quest did not advance');
  await walkTo(32,10);await clickTile(35,10);
  await page.waitForFunction(()=>window.NMFinal.debugState().map==='cave',{timeout:12000});
  await walkTo(21,11);await clickTile(23,10);
  await page.waitForFunction(()=>window.NMFinal.debugState().manual,{timeout:10000});
  await walkTo(16,10);await clickTile(16,8);
  await page.waitForFunction(()=>window.NMFinal.debugState().trace,{timeout:10000});await dialogue();
  assert.equal((await state()).quest,4,'Cave mystery did not advance');
  await walkTo(2,10);await clickTile(0,10);
  await page.waitForFunction(()=>window.NMFinal.debugState().map==='road',{timeout:10000});
  await walkTo(2,10);await clickTile(0,10);
  await page.waitForFunction(()=>window.NMFinal.debugState().map==='town',{timeout:10000});await dialogue();
  assert.equal((await state()).quest,5,'Ending not reached');
  await page.locator('#restart').click();
  assert(await page.locator('#continueButton').isEnabled(),'Save resume disabled');
  await page.locator('#continueButton').click();
  await page.waitForFunction(()=>window.NMFinal?.isRunning()&&window.NMFinal.debugState().quest===5,{timeout:10000});
  assert.equal(errors.length,0,'JavaScript exceptions: '+errors.join(' | '));
  assert.equal(failed.length,0,'Failed requests: '+failed.join(' | '));
  console.log('PASS REAL CHROMIUM E2E: home -> NPC -> road -> bandit battle -> cave manual/trace -> ending -> save/continue; no JS errors');
 }finally{await browser.close();if(server)server.kill('SIGTERM')}
}
main().catch(e=>{console.error('E2E FAIL:',e.stack);process.exitCode=1});
