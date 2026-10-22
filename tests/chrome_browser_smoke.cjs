'use strict';
const cp=require('node:child_process'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..'),PORT=4179;
const names=['google-chrome','google-chrome-stable','chromium','chromium-browser'];
function chrome(){
 for(const exe of names){try{cp.execFileSync('which',[exe],{stdio:'ignore'});return exe}catch{}}
 throw Error('Headless Chrome/Chromium is REQUIRED for browser launch test, cannot silently skip');
}
async function main(){
 const server=cp.spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1','--directory',path.join(ROOT,'dist')],{stdio:'ignore'});
 try{
  await new Promise((resolve,reject)=>{
   let n=0;
   function poll(){
    http.get('http://127.0.0.1:'+PORT+'/index.html',res=>{res.resume();resolve()}).on('error',err=>{if(++n>30)reject(err);else setTimeout(poll,150)});
   }poll();
  });
  const url='http://127.0.0.1:'+PORT+'/?smoke_start=1';
  const stdout=cp.execFileSync(chrome(),['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--virtual-time-budget=3500','--dump-dom',url],{encoding:'utf8',timeout:30000,maxBuffer:2000000});
  if(!stdout.includes('data-browser-smoke="PASS"')){
   const match=stdout.match(/data-boot-diagnostic="([^"]*)"/);
   throw Error('Real Chrome clicked Start but did not enter game. First failure: '+(match&&match[1]||'No diagnostic found'));
  }
  console.log('PASS REAL CHROME: loaded deployed dist, clicked 开始游戏, entered active map and gameScreen became visible');
 }finally{server.kill('SIGTERM')}
}
main().catch(err=>{console.error(err);process.exitCode=1});
