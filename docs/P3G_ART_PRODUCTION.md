# 《逆命江湖》P3-G｜高清人物独立母版与美术验收

## 为什么不把最新 AI 海报直接放进游戏
最新的两次图像生成结果均属于**整套游戏宣传设计板**，上面有角色头像、UI、剧情截图和文字，并不符合正式人物母版的要求。这些图不能冒充独立全身透明PNG，更不能当作真实四方向人物母版。
游戏主页与可玩地图仍然使用上一版经过技术测试的资源，保证不会退化成贴大图。

## 已交付且可运行
- 在首页新增 `人物美术验收` → `/art-review.html`，对七名角色进行检查。
- 同一方向、同一动作帧展示 **稳定版/候选版**，可正、左、右、背方向切换、单帧或行走动画播放。显示实际 sheet 宽高与每帧像素尺寸。
- 显示双份完整4×4帧表、游戏稳定资源、是否找到候选资源、清单中的审核状态。
- 先尝试加载 `assets/characters/scene_sprites/candidates/<key>_4dir_hd_candidate.png`。只有沈砚缺高清候选时回退旧 `player_4dir_preview.png`，清楚标注其仅24×32px每帧。
- 所有角色的正式高清母版仍保持 **未生成、未审核**，不能借由网页操作直接“批准”。
- `tools/p3g_art_pipeline.py` 实际自动检查有透明通道、真实像素最低尺寸、人物不裁切、文件散列及帧完整性；能导出可在网页预览的 HD 候选 sprite 和 QA 报告，但不会修改任何已部署的注册表、存档、任务代码。

## 对于4090 Qwen 2.1 的输入输出
先按 `assets/characters/masters/production_manifest.json` 的人物ID和中文提示词，分别生成完全独立、无文字、透明背景的正式高清图片，而不是整张人物宣传板。
角色全身母版最低 1024×1536，推荐 1536×2048。确认母版与最初三张唯一风格参考一致后，再生成方向素材。

### A. 全身高清母版候选
```powershell
python tools/p3g_art_pipeline.py master --character CHAR001 --input "D:\qwen\CHAR001_fullbody.png"
```
这会写入：
- `assets/characters/masters/candidates/CHAR001_fullbody_candidate.png`
- `assets/characters/masters/candidates/CHAR001_portrait_candidate.png`
- `assets/characters/masters/candidates/CHAR001_review.jpg`
- `assets/characters/masters/candidates/CHAR001_master_qa.json`

**注意**：头像是从高清原始母版无放大裁切，避免新造一张脸造成风格漂移。它是候选，不是自动批准的正式头像。

### B. 四方向16帧真实绘制
在 `D:\qwen\CHAR001_frames\` 中分别提供：
`down_idle.png`、`down_walk1.png`、`down_walk2.png`、`down_walk3.png`；
另外分别准备`left/right/up`的4张图，一共16张，每帧原图至少 256×384 RGBA，建议1024×1536。

```powershell
python tools/p3g_art_pipeline.py frames --character CHAR001 --input "D:\qwen\CHAR001_frames"
```
输出到 `assets/characters/scene_sprites/candidates/`：
- `player_4dir_hd_candidate.png` （384×512，每帧96×128）
- `player_4dir_hd_review.png`（768×1024 审核放大图）
- `player_4dir_hd_qa.json`（哈希、每张源图尺寸、方向相似警告）

完成后将这些 **candidate** 文件提交到现有GitHub分支，网页版验收室就会显示高清候选。推荐先做完沈砚一个角色，再扩展其他人物。

## 不能靠程序代替的人工验收
- 与用户最初三张参考图一致：发饰、脸型、黑白墨蓝服饰、剑鞘、胸腰比例、姿态。
- 左右侧必须是独立透视，不能直接镜像；背面不可偷偷保留面部。
- 人物头身比例必须自然，不要出现不同方向身高忽高忽低。
- 无文字、边缘自然、透明 Alpha 严谨；16帧脚底统一锚点。
- 正式上线批准必须由人工审核做出。脚本只能排除尺寸过小、重复帧及一部分视角差异，**无法鉴别软件放大造成的伪高清，也无法自动判定面孔与人设完全一致**。

## 发布门禁与后续
CI 执行 `tests/p3g_art.cjs` 与之前三地图、人物、战斗测试。审核之前不能自动替换 `sprite_registry.js` 的正式路径，不能把 `master_approved` 等状态改成 true。
下一步在审核首位主角通过后，使用已存在的正式 Sprite Sheet 替换流程，把批准的96×128逐帧高清PNG接入游戏引擎，并开始其余六人量产。
