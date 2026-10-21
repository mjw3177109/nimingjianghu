(()=>{'use strict';
/* Boot diagnostics live outside game.js/app.js and still work when one of those
 * scripts fails to initialize. No telemetry or private save data is sent.
 */
const byId=id=>document.getElementById(id);
const overlay=byId('bootError'),message=byId('bootErrorMessage');
function display(text){
 if(!overlay||!message)return;
 message.textContent=String(text||'无法启动游戏，请刷新重试。').slice(0,450);
 overlay.hidden=false;
}
function hide(){if(overlay)overlay.hidden=true}
const retry=byId('bootRetry'),close=byId('bootClose');
if(retry)retry.addEventListener('click',()=>window.location.reload());
if(close)close.addEventListener('click',hide);
window.addEventListener('nm-game-started',hide);
window.addEventListener('nm-game-start-failed',event=>{
 display(event.detail&&event.detail.message||'游戏初始化失败，请刷新重试。');
});
window.addEventListener('error',event=>{
 const msg=event&&event.message||'某个脚本或资源加载失败';
 if(!window.NMFinal||!window.NMFinal.isRunning||window.NMFinal.isRunning()){
  display('脚本运行异常：'+msg);
 }
});
window.addEventListener('unhandledrejection',event=>{
 display('运行时异常：'+String(event.reason&&event.reason.message||event.reason||'未知错误'));
});
const start=byId('startButton');
if(start)start.addEventListener('click',()=>{
 // Check after other click listeners execute. Do not disrupt an active game.
 window.setTimeout(()=>{
  const screen=byId('gameScreen');
  if(screen&&screen.hidden&&(!window.NMFinal||typeof window.NMFinal.isRunning!=='function')){
   display('游戏脚本未能加载。请刷新页面后重试，或将此提示截图反馈。');
  }
 },150);
});
window.addEventListener('load',()=>{
 if(!window.NMFinal||typeof window.NMFinal.startNew!=='function'){
  display('游戏核心未成功载入，请刷新重试。如果反复出现，请把此提示截图反馈。');
 }
});
})();