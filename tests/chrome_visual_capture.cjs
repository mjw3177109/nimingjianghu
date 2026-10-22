'use strict';
// Screenshot capture is for VISUAL REVIEW ONLY. It is not gameplay E2E
// and does not mark any unapproved character artwork as production-ready.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..'),port=4191;
const {serveBuild,launchOptions}=require('../tools/browser-test-runtime.cjs');
const url=process.env.E2E_URL||'http://127.0.0.1:'+port+'/';
const output=path.join(root,'qa/screenshots');
const CHROME=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>fs.existsSync(p));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitServer(){for(let i=0;i<50;i++){try{await new Promise((resolve,reject)=>http.get(url,r=>{r.resume();resolve()}).on('error',reject));return}catch{await sleep(200)}}throw Error('Screenshot server did not start')}
async function main(){
 fs.mkdirSync(output,{recursive:true});
 const server=process.env.E2E_URL?null:await serveBuild(root,port);
 let browser;
 try{
  if(server)await waitServer();
  browser=await chromium.launch(launchOptions());
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
   ['road-bandit','road',16,10],['cave-altar','cave',16,11],
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
  // Full-body side-walk art review: display every original frame without
  // replacing/warping pixels. This is evidence, not a synthetic foot fix.
  const strideData=await page.evaluate(async()=>{
   const src=window.NM_SPRITE_REGISTRY?.player;
   if(!src)throw Error('Player 4-dir sheet missing from registry');
   const image=new Image();image.src=src;await image.decode();
   if(image.naturalWidth!==384||image.naturalHeight!==512)throw Error('Unexpected player sheet resolution');
   const c=document.createElement('canvas');c.width=800;c.height=550;
   const g=c.getContext('2d');g.fillStyle='#162331';g.fillRect(0,0,c.width,c.height);
   g.font='18px sans-serif';g.fillStyle='#f5d99c';g.fillText('Side-walk art QA - painted original frames, NOT approved',18,30);
   for(const [idx,dir] of ['left','right'].entries()){
    const y=idx*252+58;g.font='16px sans-serif';g.fillStyle='#e9c88f';g.fillText(dir.toUpperCase(),12,y+102);
    for(let col=0;col<4;col++){
     const x=86+col*176;
     g.fillStyle='#364556';g.fillRect(x,y,144,192);
     g.strokeStyle='#d4ae74';g.beginPath();g.moveTo(x,y+188);g.lineTo(x+144,y+188);g.stroke();
     g.imageSmoothingEnabled=true;
     g.drawImage(image,col*96,(idx+1)*128,96,128,x,y,144,192);
     g.fillStyle='#f4e5cb';g.font='13px sans-serif';g.fillText(['idle','lead A','center','lead B'][col],x+40,y+213);
    }
   }
   return c.toDataURL('image/png').split(',')[1];
  });
  const strideFile='player-left-right-stride-review.png';
  fs.writeFileSync(path.join(output,strideFile),Buffer.from(strideData,'base64'));
  console.log('CAPTURE',strideFile,'unapproved side-walk contact sheet');
  const asset=await page.evaluate(async()=>{
   const response=await fetch('assets/characters/scene_sprites/sprite_manifest.json');
   const m=await response.json();
   return {status:m.status,entries:m.entries.map(e=>({id:e.id,direction_status:e.direction_status,animation_status:e.animation_status})),pending:m.pending};
  });
  assert.equal(errors.length,0,'Browser exceptions: '+errors.join(' | '));
  fs.writeFileSync(path.join(output,'visual-review-required.json'),JSON.stringify({type:'unapproved_visual_evidence',browser:'Chromium',captures,asset,artApproved:false},null,2));
  console.log('VISUAL_CAPTURE_COMPLETE: '+captures.length+' screenshots. NOT ART APPROVAL.');
 }finally{if(browser)await browser.close();if(server)await server.close()}
}
main().catch(e=>{console.error('VISUAL_CAPTURE_FAILED',e.stack);process.exitCode=1});
