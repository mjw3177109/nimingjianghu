'use strict';
// Screenshot capture is for VISUAL REVIEW ONLY. It is not gameplay E2E
// and does not mark any unapproved character artwork as production-ready.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..'),port=4191;
const url=process.env.E2E_URL||'http://127.0.0.1:'+port+'/';
const output=path.join(root,'qa/screenshots');
const CHROME=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>fs.existsSync(p));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitServer(){for(let i=0;i<50;i++){try{await new Promise((resolve,reject)=>http.get(url,r=>{r.resume();resolve()}).on('error',reject));return}catch{await sleep(200)}}throw Error('Screenshot server did not start')}
async function main(){
 fs.mkdirSync(output,{recursive:true});
 const server=process.env.E2E_URL?null:spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',path.join(root,'dist')],{stdio:'ignore'});
 let browser;
 try{
  if(server)await waitServer();
  browser=await chromium.launch({headless:true,...(CHROME?{executablePath:CHROME}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#startButton').click();
  await page.waitForFunction(()=>window.NMFinal?.isRunning()&&!document.getElementById('gameScreen').hidden);
  await sleep(650);
  if(await page.locator('#skipIntro').isVisible())await page.locator('#skipIntro').click();
  // Deliberate snapshot positioning only. Full click-through is independently
  // tested by chrome_browser_e2e.cjs without mutating debugState.
  const cases=[
   ['town-spawn','town',14,12],['town-innkeeper','town',8,11],
   ['town-bridge','town',20,12],['town-willow-front','town',28,22],
   ['road-bandit','road',17,10],['cave-altar','cave',16,11],
   ['cave-chest','cave',22,12]
  ];
  const captures=[];
  for(const [name,map,x,y] of cases){
   const status=await page.evaluate(({map,x,y})=>{
    const s=window.NMFinal.debugState(),m=window.NMFinal.debugMaps()[map];
    if(!m||m.collision[y*m.width+x]!==0)throw Error('Snapshot anchor blocked: '+map+' '+x+','+y);
    s.map=map;s.pos={x,y};s.route=[];s.pending=null;s.banditAlive=true;
    const atlas=window.NMFinal.debugTilemap();
    return {map,x,y,collision:atlas.collision[y*atlas.width+x]};
   },{map,x,y});
   await sleep(300);
   const file=name+'.png';
   await page.locator('#game').screenshot({path:path.join(output,file)});
   captures.push({file,...status});
   console.log('CAPTURE',file,JSON.stringify(status));
  }
  const asset=await page.evaluate(async()=>{
   const response=await fetch('assets/characters/scene_sprites/sprite_manifest.json');
   const m=await response.json();
   return {status:m.status,entries:m.entries.map(e=>({id:e.id,direction_status:e.direction_status,animation_status:e.animation_status})),pending:m.pending};
  });
  assert.equal(errors.length,0,'Browser exceptions: '+errors.join(' | '));
  fs.writeFileSync(path.join(output,'visual-review-required.json'),JSON.stringify({type:'unapproved_visual_evidence',browser:'Chromium',captures,asset,artApproved:false},null,2));
  console.log('VISUAL_CAPTURE_COMPLETE: '+captures.length+' screenshots. NOT ART APPROVAL.');
 }finally{if(browser)await browser.close();if(server)server.kill('SIGTERM')}
}
main().catch(e=>{console.error('VISUAL_CAPTURE_FAILED',e.stack);process.exitCode=1});
