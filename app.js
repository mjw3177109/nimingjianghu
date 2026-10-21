(()=>{'use strict';
if(window.NM_APP_BOUND)return;
const $=id=>document.getElementById(id), getGame=()=>window.NMFinal;
const PEOPLE={
CHAR001:['沈砚','穿越而来的少年，在熟悉又陌生的江湖寻找自身的命运。'],
BOSS001:['廖','于幕后观命布棋，将沈砚引入江湖的人。'],
NPC001:['韩掌柜','青石镇客栈掌柜，爱酒爱笑，也知道不少江湖秘闻。'],
NPC002:['顾老','山路隐居的老人，指向废弃山洞的秘密。'],
NPC003:['顾青岚','坚持侠义的年轻剑客，青锋出鞘。'],
NPC005:['苏晚晴','温柔敏锐的青衣药师，以医心济世。']};
const pre={town:'青石镇：在水巷与客栈之间寻找线索，拜访韩掌柜与药师。',road:'山路战斗：沈砚独自对抗山贼，使用剑法与疗伤药。',cave:'废弃山洞：探索宝箱与命痕石台，获得《破风一剑》。'};
function refresh(){const game=getGame(),el=$('continueButton');let yes=false,s=null;
 try{yes=!!(game&&typeof game.hasSave==='function'&&game.hasSave());s=yes&&game.saveInfo?game.saveInfo():null}
 catch(error){console.warn('[逆命江湖] 存档状态检查失败',error)}
 el.disabled=!yes;
 $('saveCaption').textContent=s?`江湖有旧梦 · 第${s.day}天 · 已保存进度`:'欢迎来到江湖 · 点击开始游戏';
}
function popup(title,content){$('menuPanelTitle').textContent=title;$('menuPanelContent').innerHTML=content;$('menuPanel').classList.remove('hidden');}
function closePopup(){$('menuPanel').classList.add('hidden');}
function start(continueSave){
 const home=$('homeScreen'),codex=$('codexScreen'),screen=$('gameScreen');
 try{
  const game=getGame();
  if(!game||typeof game.startNew!=='function')throw new Error('游戏核心尚未初始化');
  if(continueSave&&!game.hasSave()){popup('没有可用存档','<p>请点击「开始游戏」进入江湖。</p>');return}
  if(!continueSave&&game.hasSave()){
   try{const previous=localStorage.getItem('nimingjianghu_tile_v2');if(previous)localStorage.setItem('nimingjianghu_save_before_new_demo',previous)}catch(_){}
  }
  home.hidden=true;codex.hidden=true;screen.hidden=false;
  const ok=continueSave?game.continueGame():game.startNew();
  if(!ok)throw new Error(continueSave?'无法恢复存档':'游戏初始化失败');
  if(typeof window.scrollTo==='function')window.scrollTo(0,0);
  window.dispatchEvent(new Event('nm-game-started'));
 }catch(error){
  console.error('[逆命江湖] 游戏启动失败',error);
  screen.hidden=true;codex.hidden=true;home.hidden=false;
  window.dispatchEvent(new CustomEvent('nm-game-start-failed',{detail:{message:String(error&&error.message||error)}}));
 }
}
function info(id){const a=PEOPLE[id];if(!a)return;const title=`${a[0]} · 江湖人物`,body=`<img style="float:left;width:100px;height:130px;object-fit:contain;margin-right:18px;border:1px solid #b39a72" src="assets/portraits/${id}_avatar.webp" alt="${a[0]}"><p>${a[1]}</p>`;popup(title,body);}
function page(p){if(p==='codex'){$('homeScreen').hidden=true;$('codexScreen').hidden=false;return;}
if(p==='settings'){popup('游戏设置','<p>目前支持鼠标点击移动、剧情自动存档、Enter/Space 继续对白，I 打开背包，Q 查看任务。</p><p>音效与复杂图像设置将在正式章节扩展时接入。</p>')}
else if(p==='recap'){const game=getGame(),l=game&&game.getJournal?game.getJournal():[];popup('剧情回顾',l.length?l.map(x=>`<p>✧ ${String(x).replace(/[<&]/g,'')}</p>`).join(''):'<p>沈砚穿越江湖，命痕悄然发光，廖的棋局尚未开启。</p>')}
else if(p==='about'){popup('关于《逆命江湖》','<p>原创国风 Q版单人武侠 RPG。穿越者沈砚意外进入命轨可被操纵的江湖，幕后观命者廖正等待他的每一步选择。</p><p>本 Demo 包含青石镇、山路、山洞、NPC 对话、战斗、秘籍和逆命事件。</p>')}
}
$('startButton').addEventListener('click',()=>start(false));$('continueButton').addEventListener('click',()=>start(true));
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>page(b.dataset.page)));
document.querySelectorAll('[data-character]').forEach(b=>b.addEventListener('click',()=>{if(!$('codexScreen').hidden){const a=PEOPLE[b.dataset.character];$('codexInfo').textContent=a?`${a[0]} · ${a[1]}`:''}else info(b.dataset.character)}));
document.querySelectorAll('[data-preview]').forEach(b=>b.addEventListener('click',()=>popup('江湖玩法预览',`<p>${pre[b.dataset.preview]}</p><p>可以通过开始游戏亲自体验。</p>`)));
$('codexBack').onclick=()=>{$('codexScreen').hidden=true;$('homeScreen').hidden=false;refresh()};$('menuPanelClose').onclick=closePopup;
window.addEventListener('nm-game-ready',refresh);window.addEventListener('nm-save-updated',refresh);window.addEventListener('nm-return-home',refresh);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('menuPanel').classList.contains('hidden'))closePopup()});
window.NM_APP_BOUND=true;
refresh();
})();
