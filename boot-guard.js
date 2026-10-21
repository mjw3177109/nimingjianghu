(()=>{'use strict';
/* Bootstrap diagnostics and one safe cache-busting retry. No network telemetry.
 * Preserve the FIRST error instead of replacing it with the old generic alert.
 */
const $=id=>document.getElementById(id);
const overlay=$('bootError'),message=$('bootErrorMessage');
let firstError=null,recovering=false;
function display(value){
 if(!overlay||!message)return;
 message.textContent=String(value||'无法启动游戏，请检查脚本资源。').slice(0,650);
 overlay.hidden=false;
}
function hide(){if(overlay)overlay.hidden=true}
function record(details,priority=false){
 if(firstError&&!priority)return;
 const msg=typeof details==='string'?details:String(details&&details.message||details||'未知错误');
 firstError=msg;
 window.NM_BOOT_DIAGNOSTIC=msg;
 display(msg);
}
function ready(){return !!(window.NMFinal&&typeof window.NMFinal.startNew==='function')}
function markReady(){
 if(!ready())return false;
 firstError=null;hide();
 window.dispatchEvent(new Event('nm-game-ready'));
 return true;
}
const retry=$('bootRetry'),close=$('bootClose');
if(retry)retry.addEventListener('click',()=>window.location.reload());
if(close)close.addEventListener('click',hide);
window.addEventListener('nm-game-started',hide);
window.addEventListener('nm-game-start-failed',e=>record('开始游戏失败：'+(e.detail&&e.detail.message||'未知异常')));
window.addEventListener('nm-game-init-failed',e=>record('游戏核心异常：'+(e.detail&&e.detail.message||'未知异常')+(e.detail&&e.detail.stack?'\n'+e.detail.stack.split('\n').slice(0,2).join('\n'):''),true));
window.addEventListener('error',e=>{
 if(ready())return;
 const resource=e&&e.target&&(e.target.src||e.target.href);
 if(resource&&!/\.js(?:[?#]|$)/i.test(resource))return; // Images are optional; only missing scripts block startup.
 const where=e&&e.filename?e.filename.split('/').pop()+':'+(e.lineno||'?'):'';
 record(resource?'游戏脚本加载失败：'+resource:'脚本异常：'+(e&&e.message||'未知错误')+(where?'（'+where+'）':''));
},true);
window.addEventListener('unhandledrejection',e=>{
 if(!ready())record('运行异常：'+String(e.reason&&e.reason.message||e.reason||'未知错误'));
});
function recover(){
 if(ready()||recovering)return;
 recovering=true;
 const script=document.createElement('script');
 script.src='game.js?boot-retry='+encodeURIComponent('20261021-v10102');
 script.onload=()=>{
  recovering=false;
  if(markReady())return;
  record('重试后游戏核心仍未加载。'+(window.NM_GAME_BOOT_ERROR&&window.NM_GAME_BOOT_ERROR.message||'请查看具体脚本错误。'));
 };
 script.onerror=()=>{
  recovering=false;
  record('无法读取 game.js，网络或发布资源异常。');
 };
 document.body.appendChild(script);
}
const start=$('startButton');
if(start)start.addEventListener('click',()=>{
 if(!ready()){
  recover();
  window.setTimeout(()=>{
   if(!ready())display(firstError||'游戏核心尚未载入，已尝试重新加载，请刷新后重试。');
  },500);
 }
});
window.addEventListener('load',()=>{
 if(markReady())return;
 // Defer retry until all scripts in the page have had a chance to finish.
 window.setTimeout(()=>{if(!markReady())recover();},80);
});
})();
