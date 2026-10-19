(()=>{'use strict';
const $=id=>document.getElementById(id);
const game=window.NMGame;
if(!game){console.error('Game engine missing');return;}
const hero=$('homeScreen'), panel=$('nmHomePanel'), panelTitle=$('nmPanelTitle'), panelBody=$('nmPanelBody');
const CHARACTERS=[
{id:'CHAR001',name:'沈砚',title:'穿越而来的少年',text:'记得一部分江湖故事，却不知道自己为何成为故事的一部分。',art:'player'},
{id:'BOSS001',name:'廖',title:'幕后观命者',text:'以棋盘观众生，等待沈砚走出命中注定的道路。',art:''},
{id:'NPC001',name:'韩掌柜',title:'青石镇客栈掌柜',text:'笑容亲切，消息灵通；真正的江湖往往从一间客栈开始。',art:'innkeeper'},
{id:'NPC002',name:'顾老',title:'山路老人',text:'寡言却知晓一些令人不安的江湖秘密。',art:'oldman'},
{id:'NPC003',name:'顾青岚',title:'年轻剑客',text:'行事果断，守心如剑。正式立绘将在角色母版锁定后接入。',art:''},
{id:'NPC005',name:'苏晚晴',title:'青石镇药师',text:'温柔却机敏的药师，愿意给陌生旅人一些帮助。',art:'healer'}
];
function esc(v){return String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function refresh(){const available=game.hasSave();$('nmContinue').disabled=!available;const info=game.saveInfo();$('nmSaveHint').textContent=info?'自动存档 · 第'+info.day+'天 · '+(info.map==='town'?'青石镇':info.map==='road'?'城外山路':'废弃山洞'):'暂无存档 · 点击开始游戏进入江湖';}
function closePanel(){panel.hidden=true;hero.querySelector('button.nm-primary')?.focus();}
function showPanel(title,body){panelTitle.textContent=title;panelBody.innerHTML=body;panel.hidden=false;$('nmPanelClose').focus();}
function character(id){const c=CHARACTERS.find(c=>c.id===id);if(!c)return;const pic=c.art?'<img style="height:150px;max-width:150px" src="assets/sprites/'+c.art+'_q.svg" alt="'+esc(c.name)+'">':'<span class="nm-codex-placeholder" aria-label="正式立绘待接入">◇</span>';showPanel(c.name+' · '+c.title,'<div class="nm-codex-item">'+pic+'<div><b>'+esc(c.name)+'</b><p>'+esc(c.text)+'</p></div></div>');}
function openSection(section){
if(section==='codex')return showPanel('群侠图鉴 · 江湖人物','<div class="nm-codex-grid">'+CHARACTERS.map(c=>'<div class="nm-codex-item">'+(c.art?'<img src="assets/sprites/'+c.art+'_q.svg" alt="'+esc(c.name)+'">':'<span class="nm-codex-placeholder">◇</span>')+'<div><b>'+esc(c.name)+'</b><small>'+esc(c.title)+'</small></div></div>').join('')+'</div><p>正式版以官方角色母版为准，这里是图鉴基础内容。</p>');
if(section==='recap'){const lines=game.getRecap();return showPanel('剧情回顾','<p>'+ (lines.length?lines.map(esc).join('<hr style="border-color:#8a7359aa">'):'一阵刺眼的白光之后，沈砚来到似曾相识的青石镇。这里的江湖故事似乎正在悄悄改变。')+'</p>');}
if(section==='about')return showPanel('关于《逆命江湖》','<p>原创国风 Q版武侠 RPG。沈砚从现代世界误入江湖，借助自己不可靠的记忆寻找回家的路，最终必须面对幕后操盘者「廖」。</p><p>这是一章可玩的演示版本，支持青石镇探索、与人物交谈、山路单人战斗、山洞调查和逆命值剧情伏笔。</p><p>美术目标严格依据已确定的三张风格锚点逐步替换。</p>');
if(section==='settings'){let motion=true;try{motion=JSON.parse(localStorage.getItem('nm_settings_v1')||'{}').motion!==false}catch(e){};showPanel('游戏设置','<label class="nm-setting-row">背景动态效果 <input type="checkbox" id="nmMotion" '+(motion?'checked':'')+'></label><p>本期暂未接入背景音乐。画面动态效果偏好将在本浏览器保存。</p>');$('nmMotion').onchange=e=>{try{localStorage.setItem('nm_settings_v1',JSON.stringify({motion:e.target.checked}));document.body.dataset.motion=e.target.checked?'on':'off';}catch(err){}};}}
function begin(continuing){if(game.isRunning())return;if(!continuing&&game.hasSave()&&!confirm('开始新游戏会覆盖当前自动存档，确定要重新开始吗？'))return;const ok=continuing?game.continueGame():game.startNew();if(!ok)showPanel('存档无法读取','<p>未找到可用存档，请选择开始游戏。</p>');}
$('nmStart').addEventListener('click',()=>begin(false));
$('nmContinue').addEventListener('click',()=>begin(true));
hero.querySelectorAll('[data-home-panel]').forEach(b=>b.addEventListener('click',()=>openSection(b.dataset.homePanel)));
hero.querySelectorAll('[data-character]').forEach(b=>b.addEventListener('click',()=>character(b.dataset.character)));
hero.querySelectorAll('[data-preview]').forEach(b=>b.addEventListener('click',()=>{const d={town:['青石镇 · 初入江湖','在青石镇与掌柜、药师和老人交谈，逐步发现世界的异常。'],battle:['山路 · 单人鏖战','山贼挡路，沈砚只能独自战斗。使用剑法、内力、药品和防御取胜。'],cave:['废弃山洞 · 命痕初现','进入洞穴寻找残页秘籍，并触碰与「廖」相关的命痕石台。']}[b.dataset.preview];if(d)showPanel(d[0],'<p>'+d[1]+'</p><p>点击“开始游戏”可以通过实际剧情到达这一场景。</p>');}));
$('nmPanelClose').onclick=closePanel;$('nmPanelBack').onclick=closePanel;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){closePanel();}});
window.addEventListener('nm-returned-home',refresh);window.addEventListener('nm-save-updated',()=>{if(!hero.hidden)refresh()});
refresh();
})();
