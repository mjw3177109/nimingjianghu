# 逆命江湖 · P3-B 三地图 Tile 拼接可玩 Demo

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
