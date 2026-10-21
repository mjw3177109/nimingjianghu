'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
// Serve the actual build on both Windows and Linux without a Python launcher.
async function serveBuild(root,port){
 const base=path.resolve(root,'dist');
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
 const server=http.createServer((req,res)=>{
  let file;
  try{file=path.resolve(base,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch{res.writeHead(400).end();return;}
  if(file!==base&&!file.startsWith(base+path.sep)){res.writeHead(403).end();return;}
  if(file===base)file=path.join(base,'index.html');
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);});
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 return {close:()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);})};
}
function launchOptions(){
 const executablePath=process.env.CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>fs.existsSync(p));
 return {headless:true,...(executablePath?{executablePath}:{}),args:['--no-sandbox','--disable-dev-shm-usage']};
}
module.exports={serveBuild,launchOptions};
