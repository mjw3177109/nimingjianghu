'use strict';
// Verifies the review UI only; this does not approve the generated artwork.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {serveBuild,launchOptions}=require('../tools/browser-test-runtime.cjs');
const root=path.resolve(__dirname,'..'),output=path.join(root,'qa/master-review');
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
  for(const id of ['CHAR001','NPC005','NPC001','NPC002','NPC003','BOSS001','EN001']){
   await page.locator('[data-char="'+id+'"]').click();
   await page.waitForFunction(id=>{const im=document.getElementById('masterCandidate');return !im.hidden&&im.complete&&im.naturalHeight>=1536&&im.src.includes(id+'_fullbody_candidate')},id);
   const record=await page.evaluate(()=>{const im=document.getElementById('masterCandidate');return {width:im.naturalWidth,height:im.naturalHeight,caption:document.getElementById('masterCandidateCaption').textContent,status:document.getElementById('masterStatus').textContent}});
   assert(record.width>=1024&&record.height>=1536);assert(record.caption.includes('未人工审核'));assert.notEqual(record.status,'人工已审核');
   records.push({id,...record});
   await page.locator('.master-candidate').screenshot({path:path.join(output,id+'.png')});
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({url:base,records,errors,humanApproved:false},null,2));
  console.log('PASS MASTER REVIEW: seven native-size candidates load; no automatic approval; browser evidence saved');
 }finally{if(browser)await browser.close();if(server)await server.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
