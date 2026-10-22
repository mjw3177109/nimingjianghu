# P3-F｜国风建筑组合模块与正式高清人物母版

## 实际代码交付
- 8个原生2倍分辨率的独立高细节 SVG 构件文件，共9处场景实例：客栈、药铺、石桥底座+前景护栏、柳枝、山路两处岩壁、山洞石台+宝箱
- **多格组件仍按Tile世界坐标定位，不是把整个青石镇、山路、山洞变成完整插画背景。**
- 组件显示层：`base`在人物下面，`front`在人物和基础前景上面，实现桥前护栏与树叶遮挡
- 统一配置：`data/structures.json`与浏览器`structure-data.js`保持同步，Pygame也读取同一份JSON；尺寸使用Tile单位，无位置漂移
- 本轮没有修改碰撞数据、出口、物品脚本、任务、道具、存档；因此第一章可玩流程应与P3-E一致
- 无文字的SVG图形，牌匾和地图文字必须由HTML/Canvas字库真实渲染

## 高清人物的严格验收
- `assets/characters/masters/production_manifest.json`：7角色正式母版任务，参考三张锁定美术锚点；每人1536×2048全身、1024×1024头像
- `tools/validate_character_masters.py`：可自动检查文件存在、尺寸、透明背景、主体未裁切、SHA256
- 生成母版后运行 `python tools/validate_character_masters.py --character CHAR001 --strict`；必须经用户视觉确认人物脸、服装、身高、头饰、五官一致，才允许设置Approved并部署
- **现在人物母版状态仍为 PENDING**，本轮不能把小头像软件拉大冒充官方高清人物，也不能把用于概念展示的带文字场景拼图作为正式可玩资产
- 进一步的正式量产应由4090/Qwen2.1提供角色正背侧独立美术，按现有`pack_sprite_sheets.py`输出Sprite Sheet，并在人物图鉴与游戏场景同步替换

## 自动测试
`npm run build`验证所有组件SVG、锚点边界、分层顺序、注册表同步、人物任务审核状态，并继续第一章回归。
