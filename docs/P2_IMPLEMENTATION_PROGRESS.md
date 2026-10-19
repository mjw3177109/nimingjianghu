# P2 首页实际开发进度

## 已提交实现
- 首页左侧菜单 / 中央主视觉结构 / 右侧四角色卡 / 下三宫格玩法预览 / 底部功能栏
- 主菜单6个按钮均有基础响应；角色卡点击弹简介；预览卡点击解释玩法
- 首页首次进入不启动游戏，不写入无效存档
- 点击开始游戏才进入地图并播放开场对白
- 继续游戏读取当前 v3 + 旧版 v02 localStorage 存档（兼容旧键）
- 游戏内按钮由“重新开始”改为“返回首页”
- 绑定页面生命周期，停止/恢复 RAF，避免重复游戏循环
- Node 模拟冒烟测试并接入 Vercel build gating

## 未通过正式视觉验收
当前中间主角立绘、角色卡和下方地图仍使用暂存美术路径（旧版 SVG）。
三张风格锚点已锁定，但真正要达到锚点 C 的手绘 Q 版美术需要生成/切出以下正式资源并替换：
`assets/home/home_moonlit_town.webp`
`assets/home/CHAR001_hero.png`
`assets/home/cards/{CHAR001,NPC005,NPC001,BOSS001}.png`
`assets/home/previews/{town,battle,cave}.png`
资源细则以 `docs/P2_HOME_ASSET_MANIFEST.json` 为准。
**本次实装不宣称已完成最终风格验收。**

## 后续
正式资源完成后运行真实浏览器 UI 截图对比，确认主角同脸、无 AI 错字、UI 可点击，然后进入 P3 图鉴和 P4 实机场景重做。
