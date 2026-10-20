# 逆命江湖 · P3-C 国风 Tile 细节与四方向动画 Demo

> V0.4 · 青石镇 / 山路 / 废弃山洞均由32×32基础模块实时拼图；不再以整张场景图作为游戏内底图。

本版以三张确定的美术参考为风格目标，正式可复用 Tile 引擎保持一致；已接入青石镇 36 种、山路 30 种、山洞 30 种基础模块。现阶段属于 **程序绘制的 Tile 美术骨架**，不是已经完成全部127+正式精细Q版生图，也不代表完整30章游戏已开发。

## 快速试玩
- 页面入口：从本仓库的 Vercel PR Preview 打开（按最新 READY 部署），点击「开始游戏」
- Windows：`python -m pip install -r requirements.txt` 然后 `python main.py`（SVG加载失败按 README 提示补装 cairosvg）
- 首章：青石镇韩掌柜 → 山路山贼 → 废弃山洞秘籍 → 命痕石台 → 返回青石镇见到廖的伏笔
- 角色、任务、战斗与自动存档延续原本逻辑。老存档的跨图位置会迁到最近的安全出生点，不会清空任务与道具。

## 地图模块
| 场景 | 地图大小 | 图块类型 | 数据文件 |
|---|---|---|---|
| 青石镇 | 40×24 | 36 | `data/maps/town/town_tilemap.json` |
| 山路 | 36×20 | 30 | `data/maps/road/road_tilemap.json` |
| 山洞 | 30×20 | 30 | `data/maps/cave/cave_tilemap.json` |

所有模块通过 `assets/tilesets/<scene>/<scene>_atlas.svg` 保存为真正的单元图块；画面在运行时按 JSON 逐格绘制，并有地面、地形、低层装饰、角色、前景遮挡和独立碰撞。地点与角色名称由游戏 UI 渲染，没有烘焙到 Tile 图片中。

## 发布验收
`npm test` 测试剧本闭环、图块数量/索引/碰撞/寻路和保存数据兼容性。Vercel `npm run build` 在发布前运行全部测试。Pygame 地图数据与浏览器共用同一份 JSON。

未完成：正式精细水墨 Q版资产、人物四向走路 Sprite 动画、Win 4090 实际人工试玩、扩展30章剧情。


## P3-C

地图自然材质经过细节加密，五名游戏角色接入四向四帧行走过渡动画，浏览器与 Pygame 平滑跟随；正式真四视角图稿仍需生图替换。见 [P3C 制作记录](docs/P3C_IMPLEMENTATION.md)。

## 正式四方向 Sprite 自动替换（P3-C 扩展）

已新增`assets/characters/scene_sprites/qwen_4dir_jobs.json`：7名角色共112帧任务，当前5名游戏角色80帧可进入生产；顾青岚、廖共32帧必须先补齐正式全身母版，任务保持 blocked 状态，不会拿正面图冒充。

Qwen 将每个人物的16张透明PNG输出到：
`qwen_4dir/CHAR001/down_idle.png`、`down_walk1.png`、`down_walk2.png`、`down_walk3.png`，再依次为`left/right/up`生成同样4帧。

先以**候选模式**执行（绝不覆盖游戏运行文件）：
```powershell
python tools/pack_sprite_sheets.py --character CHAR001 --input qwen_4dir/CHAR001
```
检查`assets/characters/scene_sprites/player_4dir_review.png`中真实四视角、16帧动画、服装和脚底高度。审核通过才执行：
```powershell
python tools/pack_sprite_sheets.py --character CHAR001 --input qwen_4dir/CHAR001 --approve
```
审核通过后自动写入正式`player_4dir.png`、更新浏览器`sprite_registry.js`与Pygame共用的`sprite_manifest.json`；不需要人工改游戏 JS，不会改变地图数据和第一章任务。
注意：程序自动检验透明背景、16帧存在、动作差异与部分方向重复；**不能自动保证人脸、服装和动作质量符合三张官方参考图，需人工视觉审核。**

## P3-C · 沈砚真实四方向候选预览

- 普通页面：默认使用稳定版角色 Sprite。
- **预览入口**：在当前 Vercel 项目URL后加 `?shenyan=16`，即临时替换成新绘制四视角候选；可通过相同地图与NPC位置直接比较，互不覆盖存档。
- Windows：`$env:NIMING_PREVIEW_SHENYAN16="1"; python main.py`。
- 更高清的16帧48×64透明PNG和192×256图集已作为候选 ZIP 供人工验收；源码信息见 `docs/P3C_SHENYAN_REVIEW.md`。

## P3-D · 高清首页与可用性修复（2026-10-20）

- 首页低分辨率整图已从实际 UI 移除，标题、按钮、角色介绍、三个地图预览标题都由 HTML 字体清晰渲染，可随时修正文字，不再使用 AI 图中的中文。
- 首页月夜江湖背景使用可任意缩放的 1920×1080 矢量 SVG（真实矢量图元，不是把低清图重新编码）。
- 人物头像仍采用游戏角色图鉴的已接入 WebP，保持原有造型，不强行放大低清角色到整屏。
- 三个首页预览直接绘制地图 Tile 数据（不是使用不准的旧场景大图或带乱码的 UI 截图）。
- 浏览器游戏画布改为 1280×720 backing pixels，绘图逻辑坐标继续640×360（2×DPI），点击区域、镜头跟随与存档兼容。
- 黄色寻路框只在目标格完全进入640×360的逻辑可视区域时绘制，绝不画到视口外。
- 提供响应式手机/平板排版；不改第一章任务、战斗、剧情、存档 schema 或碰撞地图。
- 后续仍应使用新生成的独立高清人物/场景正式母图；此次不虚报旧头像已变成真正高清绘画，也不以软件放大冒充原生画质。

## P3-E：原生64px矢量图块精修

加入`tools/p3e-hd-atlas.cjs`，会以36/30/30种图块的语义名为依据，**重新绘制独立64×64矢量材质**，并生成三张图集`assets/tilesets/{town,road,cave}/*_atlas_hd64.svg`。并非把32px PNG拉大。浏览器和首页预览优先用新图集，保留回退到原32px atlas；碰撞、NPC、存档均不变。Windows如未先运行生成脚本会自动使用旧32px图集。

游戏内逻辑地图仍为32px格子，高清资源作为64px源图绘制在32px世界单元中。大屏显示继续使用2x物理画布，但不能等同于全游戏原生4K美术。

在Windows项目目录先运行 `node tools/p3e-hd-atlas.cjs` 再运行 `python main.py`，两端均可显示新图块。

P3-F角色母版生成与验收：`assets/characters/masters/production_manifest.json`（7个角色的高清、无文字任务），`python tools/validate_character_masters.py`（只检查真实文件，不会自动批准或替换小头像）。

## P3-G · 人物美术验收工作台

- 网页主菜单新增「人物美术验收」，打开 `/art-review.html`。
- 7名角色档案、稳定版 vs 候选版同角度同帧对比，4方向×4帧浏览、动画逐帧播放，自动显示来源分辨率，未提交时显示空候选，不会伪造审核成功。
- 读取 `production_manifest.json`、`sprite_manifest.json` 与浏览器 `sprite_registry.js`，严格区分稳定旧素材、低清动作候选、高清候选和用户已审核的正式资源。
- `tools/p3g_art_pipeline.py` 可把真正的 1024×1536+ 透明高清全身 PNG 导入母版候选，裁出不经过放大的高分辨率头像；也能检查 16张独立高分辨率行走帧、合成 384×512 HD Sprite Sheet 与审阅图。命令与边界见 `docs/P3G_ART_PRODUCTION.md`。
- 所有资产导入操作仅创建候选文件和审核报告，绝不自动变更线上角色/Sprite 或批准美术；只有人工确定正确的独立视角与衣服后才能进入推广发布。
