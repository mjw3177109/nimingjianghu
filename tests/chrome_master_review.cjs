'use strict';
// Verifies the review UI only; this does not approve the generated artwork.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {serveBuild,launchOptions}=require('../tools/browser-test-runtime.cjs');
const root=path.resolve(__dirname,'..'),output=path.resolve(root,process.env.ART_REVIEW_OUTPUT||'qa/master-review');
async function main(){
 fs.mkdirSync(output,{recursive:true});
 const server=process.env.E2E_URL?null:await serveBuild(root,4193);
 const base=process.env.E2E_URL||'http://127.0.0.1:4193/';let browser;
 try{
  browser=await chromium.launch(launchOptions());
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],records=[];
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(new URL('art-review.html',base).href);
  assert.equal(response.status(),200);
  // Use Chromium's real same-origin network path, including its DNS/proxy setup.
  const status=await page.evaluate(async()=>{
   const response=await fetch('assets/characters/scene_sprites/candidates/production_status.json');
   if(!response.ok)throw Error('Frame status HTTP '+response.status);
   return response.json();
  });
  assert.equal(status.generated,112,'All independent frames must be delivered for review');
  assert.equal(status.human_approved_characters,0,'Frame generation cannot approve the artwork');
  for(const id of ['CHAR001','NPC005','NPC001','NPC002','NPC003','BOSS001','EN001']){
   await page.locator('[data-char="'+id+'"]').click();
   await page.waitForFunction(id=>{const im=document.getElementById('masterCandidate');return !im.hidden&&im.complete&&im.naturalHeight>=1536&&im.src.includes(id+'_fullbody_candidate')},id);
   const record=await page.evaluate(()=>{const im=document.getElementById('masterCandidate');return {width:im.naturalWidth,height:im.naturalHeight,caption:document.getElementById('masterCandidateCaption').textContent,status:document.getElementById('masterStatus').textContent}});
   assert(record.width>=1024&&record.height>=1536);assert(record.caption.includes('全身母版已人工审核'));assert(record.status.includes('动作帧待审核'));assert.notEqual(record.status,'人工已审核');
   records.push({id,...record});
   for(const direction of ['down','left','right','up'])for(let pose=0;pose<4;pose++){
    await page.locator('#direction').selectOption(direction);
    await page.locator('#pose').selectOption(String(pose));
    const source=page.locator('#frameSource');await source.waitFor({state:'visible'});
    const file='qwen_4dir/'+id+'/'+direction+'_'+['idle','walk1','walk2','walk3'][pose]+'.png';
    assert.equal(await source.getAttribute('href'),file);
    const png=await page.evaluate(async file=>{
     const response=await fetch(file),bytes=await response.arrayBuffer(),view=new DataView(bytes);
     const hex=values=>Array.from(values,x=>x.toString(16).padStart(2,'0')).join('');
     return {status:response.status,signature:hex(new Uint8Array(bytes,0,Math.min(8,bytes.byteLength))),
      width:bytes.byteLength>=24?view.getUint32(16):0,height:bytes.byteLength>=24?view.getUint32(20):0,
      sha256:hex(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)))};
    },file);
    assert.equal(png.status,200);assert.equal(png.signature,'89504e470d0a1a0a');
    assert(png.width>=256&&png.height>=384,'Frame must be a native HD source');
    const expected=status.characters.find(x=>x.id===id).frames.find(x=>x.file===file);
    assert.equal(png.sha256,expected.sha256,'Published source differs from generated frame');
   }
   await page.locator('.master-candidate').screenshot({path:path.join(output,id+'.png')});
   console.log('VERIFIED '+id+': 16 independent PNG sources and hashes');
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({url:base,records,errors,masterApprovalScope:'fullbody_masters_only',frameCandidatesHumanApproved:false,sourceFramesVerified:112},null,2));
  console.log('PASS ART REVIEW: 7 approved masters; 112 independent candidate PNGs and source links verified; no frame auto-approval');
 }finally{if(browser)await browser.close();if(server)await server.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
