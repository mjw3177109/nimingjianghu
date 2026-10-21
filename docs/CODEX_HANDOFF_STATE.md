# Codex 续接状态

更新时间：2026-10-22 04:05（Asia/Shanghai）。

## 最新周期：v1.0.7（优先读取）

- v1.0.6 已提交并推送：`16c7a876bae983bb09fa69744f01cc9de6b9b305`，Vercel READY `dpl_GHp6qGwNskfeEzeeifzUMRpJhxLL`，`https://nimingjianghu-9xbf8gb6q-bobos-projects-e9f8bfba.vercel.app/`。真实线上 Chromium 从首页到结尾、刷新继续、键盘/碰撞/窄屏全部通过，无异常/失败请求，证据在 `qa-online.log`。
- 随后完成 v1.0.7：七名角色均有1024×1536独立RGBA母版候选、同源1024头像、审核JPG和源/输出SHA256，位于 `assets/characters/masters/candidates/`。七个角色仍全部未人工审核，未制作新的112帧，正式registry和production审批字段未修改。
- P3-G真实导入复现并修复 Path.thumbnail 崩溃；新增测试验证完整源像素保留、审核图生成、哈希和不自动审批。
- 美术验收室新增逐角色母版预览、哈希报告链接、官方绘卷对照；`tests/chrome_master_review.cjs` 真实Chromium逐一加载七名候选通过，截图和报告在 `qa/master-review/`。生成说明、提示词、角色描述与哈希见 `docs/ART_MASTER_CANDIDATES_2026-10-22.md`。
- 图像生成第一轮源尺寸不够，全部拒绝；第二轮廖衣袖碰边，也拒绝，最终独立修订后通过技术检查；拒绝源和生成记录保留在 `qa/art-generation/`，未进入发布资源。
- v1.0.6 GitHub Actions run `39664913351` 构建通过，但键盘边界测试用固定2.4秒，在较慢Linux渲染下只走到y=2而失败。v1.0.7改为等待真实抵达y=1再保持按键验证，不放松边界要求；失败新增截图/诊断。须确认v1.0.7新CI结果。
- v1.0.7 `npm test`、`npm run build`：通过；使用带Pillow的bundled Python完整20项全通过，无跳过。真实本地首章E2E重跑通过（`qa-browser-final.log`），七人审核页测试通过（`qa-master-review.log`）。CI新增安装Pillow，保证图像导入测试真实执行。
- 本文件随v1.0.7提交；新SHA、READY deployment与线上复测将在推送后保存 `qa/release.json` 并在聊天报告给出。当前记录的16c7a87是已验证的上一阶段部署，不能冒充v1.0.7。
- 下一步：确认最新SHA部署与CI，再请用户逐角色审核七张母版。批准前只可修订候选和其他玩法问题，不得自动批准或进入声称已审核的方向帧任务。还需修复并回归先石台后秘籍的潜在软锁，继续地图/步态人工验收。Pygame窗口未实测（缺pygame/cairosvg）。

## 仓库与版本

- 本地已切换到 `feat/playable-demo-v0.1`，基线 HEAD `0862afa32bfdeabb9332ce88e31dd05268ab8309`。
- `origin` 保留 Gitee；新增 `github` 指向 `https://github.com/mjw3177109/nimingjianghu.git`。不要推送 master/main。
- package.json：1.0.7。本文件随发布提交保存；最终发布 SHA 和部署验收在 `qa/release.json` 及聊天交付报告中补充，续接时必须重新 `git rev-parse HEAD` 与查询远程。
- 已配置当前聊天每小时 heartbeat：`逆命江湖每小时开发交付`。无实际进展时保持安静；不得空提交。

## 已实现

- game.js：方向键/WASD 连续移动，沿用鼠标碰撞与平滑步态；松键完成当前步后 idle；对话、战斗、面板隔离，失焦/页面隐藏/回首页清除按键。
- main.py：键盘移动、与浏览器一致的建筑/人物脚印碰撞、完整最后一步后再触发交互；test_collision_parity.py 验证真实三地图的边界、脚印及出生点。
- Windows 构建修复：屏幕命中测试兼容 CRLF；Python 检查优先使用 Windows 的 python，避免 Windows Store 的 python3 别名。
- 浏览器验收使用 Node 静态服务，支持 CHROME_PATH；失败启动时也能清理服务器。CI 安装 Chromium，上传 qa 证据。
- 真实点击函数与输入优先级测试；E2E 新增四向键盘、碰撞边界、失焦、战斗隔离、刷新读档、窄屏检查及截图。

## 本轮已执行的验证

- `npm test`：通过，日志 `qa-unit.log`。
- `npm run build`：通过，日志 `qa-build.log`。
- 本地真实 Chromium E2E：通过，`qa-browser.log`、`qa/e2e/report.json`、`qa/e2e/*.png`。首章从开始到结尾，刷新继续后 quest=5、manual=true、trace=true、banditAlive=false，无 JS 错误和失败 HTTP 请求。
- `python -m unittest discover -s tests -p 'test_*.py'`：19项，18通过、1跳过（默认 Python 无 Pillow）；日志 `qa-python.log`。
- `npm run qa:art`：退出1，七名角色缺少正式人工审核和完整PNG绑定；这是正确的美术发布阻断，日志 `qa-art.log`，未修改门禁或审批状态。
- 默认 Node v22.22.2；Playwright 使用系统已有的1.62.1，CHROME_PATH 指向已安装的 Chromium 156.0.8078.4；CI保留原1.64.1要求。Node/Python子进程及浏览器需要沙箱外运行，沙箱内 spawn EPERM 不代表游戏失败。
- Pygame 窗口：未实测，默认Python缺少pygame/cairosvg；共享碰撞逻辑已通过Python测试。

本机重跑浏览器：

```powershell
$env:NODE_PATH='C:\Users\bobo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
$env:CHROME_PATH='C:\Users\bobo\AppData\Local\ms-playwright\chromium-1248\chrome-win64\chrome.exe'
npm run test:e2e
node tests/chrome_visual_capture.cjs
```

本机带Pillow的Python：`C:\Users\bobo\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`。

## 历史部署调查（本轮重新读取）

- Vercel项目 `prj_ipw1JaYsw0w0544ke1GEpiuOg0RK`，team `team_ST1NqwJsPhN0d9FW4igabIbA`，slug `bobos-projects-e9f8bfba`，Node 24.x。
- `b3cf61ce...` 是 HEAD `0862afa...` 的祖先，GitHub compare：ahead_by=3、behind_by=0。因此是旧提交部署记录，不是未知平行分支。旧 ERROR 日志定位 `tests/startup_browser_contract.cjs:5`，缓存版本测试写死，后续提交已修复。
- 时间上最近的 ERROR `dpl_22jZnFQosVz86qTmj5wdi9y9v8Ef` 对应父提交 `4b3aaac...`，失败在 `tests/final_smoke.cjs:42`，后续HEAD已修复。
- 发布前分支别名实际指向 READY `dpl_6tcFUij9d26x7JL4bcyQ5H2h5bC9`、SHA `0862afa...`。它是旧基线，不能称为本轮新版本。
- 本轮新部署尚待推送后查询，不使用旧URL冒充新交付。

## 美术和后续工作

- 已调用内置imagegen，为七名角色分别按官方绘卷生成透明全身母版候选；七张最终候选均已通过P3-G技术检查，未批准、未注册正式资源。详见顶部v1.0.7周期记录。
- 候选必须由用户真实审核。没有批准前不能导出声称已审核的16帧任务或替换运行Sprite；七名角色均需完成，当前美术门禁仍阻断。
- 下一周期先核对本轮发布SHA、Vercel和线上测试，再处理候选母版审核与方向帧生产；继续地图/遮挡/步态人工复查。
- 已注意到非标准探索顺序（先石台后秘籍）的潜在任务推进问题，尚未本轮修复；应先复现并补回归。
- 尚未最终验收通过，不能把构建/E2E成功解释成最终美术或Pygame验收通过。
