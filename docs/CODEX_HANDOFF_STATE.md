# Codex 续接状态

更新时间：2026-10-23（Asia/Shanghai）。

## 最新周期：v1.0.12 六人图集接入（优先读取）

- 用户本轮真实批准主角外六人待审图集，并明确“沿用现用主角即可”。已接入六套PNG，主角现用PNG哈希保持 be0f8405b3e9e551a6521f563af75d204b945ffbbbe48b2bcc77828e8d78660c。主角新候选、头像不在批准范围，不能声称全部独立图集通过正式门禁。
- 审批原话、范围、六套实际图集与各16帧哈希保存在 assets/characters/scene_sprites/reviews/2026-10-23_user_six_sheets.json。release 支持可核验的整体批准原话，未伪造六个逐项人工勾选；生成凭据 approved=false 保留。
- 顾青岚加入青石镇可交谈NPC；廖 min_quest=4，取得两线索后现身，结尾后可交谈。JS/Python 绘制、点击、碰撞共用任务阶段过滤，存档恢复考虑新人物脚印。
- npm test/build 已通过；带Pillow Python26项全部通过。本地真实Chromium正向首章、顾青岚/廖可选交谈、透明像素/实体点击、战斗、结尾与刷新读档PASS，无JS异常/失败请求，报告 qa/1.0.12-local/manual-first/report.json。审核页七人112张PNG哈希核验PASS，六套运行PNG哈希与批准记录一致；主角候选仍未批准。独立美术门禁仅报告CHAR001两个阻断（预期，不等同于要求重画主角）。新提交SHA、Vercel Preview与线上核验待本轮完成补记，旧URL不是本轮交付。

## 历史周期：v1.0.11 角色PNG透明像素命中（优先读取）

- 最终发布：`4400e6de362221ef5e8dd255b20100700c14c71a`。GitHub指定分支与本地HEAD已核对一致，树 `8c6bc0b449efdeb8d5f00927b12b530f375bbcab`。Git直连连接重置后经GitHub连接器发布，树与原8557916提交完全一致，旧提交保存在 `codex/local-1.0.11-8557916`；本地导入精确提交对象同步，未重置文件、未改Gitee origin。
- 最终Vercel Preview READY：`dpl_8efLXF3S4ufie9gabjavsZLekpiq`，SHA一致，target=null。URL `https://nimingjianghu-684vp9ebh-bobos-projects-e9f8bfba.vercel.app/`。未发布Production。
- 最终线上两条真实Chromium首章均PASS，包含真实透明内点和实体躯干点击、山贼保留脚印、战斗、结尾与刷新继续，均quest=5、manual/trace=true、banditAlive=false，无JS异常与HTTP失败；报告 `qa/1.0.11-online/manual-first/report.json`、`qa/1.0.11-online/trace-first/report.json`，日志 `qa/1.0.11-online-forward.log`、`qa/1.0.11-online-reverse.log`。
- CI #150（PR）`39827814677` completed/success；#149（push）`39827805180`最新读取仍in_progress，后续核对，不提前称成功。npm test/build、Python24项均通过；独立美术发布门禁退出1（预期），日志 `qa/1.0.11-art.log`。
- 最终SHA/Preview/CI和经实际校验的两份线上报告已保存 `qa/release.json`、`qa/1.0.11-release.json`。此发布后补记保留本地，不为状态文字单独造新版本，工作区仅本文件有补记。
- 后续先核对#149；112帧继续等用户真实方向/步态审核，批准后再接入，暂不改变正式Sprite与美术审批。可继续实查前景遮挡、人物遮挡点击和存档边界；Pygame窗口仍未实际打开验收。

- 已核对基线GitHub HEAD、本地HEAD及Vercel均为 `f6ff627bf854a8bd2c99e359ea7a8a3076cf1c19`，Preview READY `dpl_CgFwoS1YqAJdAZpHG3f4U7KqLk9R`。上一轮PR CI #148 `39824144777`已completed/success。
- 实际复现：韩掌柜原PNG缩放42×72后(5,5)的真实alpha=0，处于旧头部几何轮廓内；点击后主角从(10,11)移动到(8,11)。失败证据 `qa/1.0.11-before.log`、`qa/1.0.11-before/failure.json`/failure.png。
- 浏览器新增按图像/朝向缓存的2倍画布RGBA命中掩码，沿用实际渲染PNG、待机帧行、尺寸及脚底锚点，Alpha>16才命中，与Pygame既有阈值一致。NPC图像键和默认朝向由绘制/拾取共用函数选择；未加载时按实际占位矩形，读像素失败时保留可玩的轮廓回退并记录一次警告。前景结构和其他人物的遮挡优先级仍可后续单独检查。
- 新增单元契约覆盖透明内点、实体像素、微弱Alpha、脚下地面、缓存读回次数、HD图集正确idle/左向行；主流程VM图像夹具补齐高度和透明顶缘，真实像素另由Chromium原PNG验证，不把模拟图当美术证据。
- 真实Chromium扩展原轮廓内透明点回归；山贼测试改为实际透明的保留脚印地面与真实实体躯干分别点击，避免把可见刀身误当不可交互的地面。真实本地正反两条首章均PASS，包含旧透明角、内透明像素、正常躯干、最后一步交互、碰撞、战斗、结尾和读档；报告 `qa/1.0.11-local/manual-first/report.json`、`qa/1.0.11-local/trace-first/report.json`，无JS异常/失败请求。
- npm test/build通过；Python24项全通过无跳过。日志 `qa/1.0.11-unit.log`、`qa/1.0.11-build.log`、`qa/1.0.11-python.log`。package=1.0.11，index缓存标记统一更新。
- 本轮只改game.js、回归测试、版本/缓存、README和本状态，正式美术审批、112帧候选、游戏Sprite绑定均未改。仍等待用户对方向/步态的真实审核，不发布Production。
- 下一步：提交真实修复到指定GitHub分支，核实新SHA Preview，执行线上正反首章；完成后补记最终SHA与报告，不用基线部署冒充新版本。

## 最新交付：112张独立动作帧候选完成，待人工审核（优先读取）

- 最终发布SHA：`f6ff627bf854a8bd2c99e359ea7a8a3076cf1c19`。本地HEAD、GitHub指定分支均一致，代码树 `1b01e44bf7dde706fd92ca89fb91c4c4b2de9357`。保留Gitee origin。方向帧主提交是e3da8d0；测试修复两次Git直连失败后，经GitHub接口发布，完整代码树与本地9000db完全一致，原9000db保留在 `codex/local-1.0.10-9000db`，本地同步没有重置文件。
- 最终Preview：READY `dpl_CgFwoS1YqAJdAZpHG3f4U7KqLk9R`，SHA与上项一致，target=null（Preview）。URL：`https://nimingjianghu-9vegm54ah-bobos-projects-e9f8bfba.vercel.app/`，审核页同站 `/art-review.html`。未发布Production。
- 最终线上真实Chromium：七人112张原生PNG均经页面同源fetch下载、PNG头/尺寸与SHA256逐张核对PASS；正反两条首章均PASS，到quest=5并刷新继续，全部无JS异常/失败请求。报告 `qa/1.0.10-final/art-review/report.json`、`qa/1.0.10-final/manual-first/report.json`、`qa/1.0.10-final/trace-first/report.json`；日志 `qa/1.0.10-final-*.log`。
- npm test/build均通过；带Pillow的Python24项通过无跳过。最终push CI #147 `39824136480` completed/success，`https://github.com/mjw3177109/nimingjianghu/actions/runs/39824136480`；PR CI #148 `39824144777`最近读取仍in_progress，不能提前称成功。
- `qa/release.json`、`qa/1.0.10-release.json`已保存最终SHA/部署/测试证据，并实际校验报告URL和SHA。此顶部发布完成后的事实为本地续接补记，尚未为状态文字单独造提交；工作区仅本状态文件有补记。
- 用户已批准七张全身母版，不要重复催审母版。本轮112张方向动作帧、七套图集和头像仍未获人工批准，运行Sprite绑定未改，发布门禁正确阻断。用户下一次应审核本轮方向/步态；只有收到对应真实审批后，才按P3-G release要求记录新证据并接入运行版，不虚构六项人工审核字段。
- 源PNG：`qwen_4dir/<ID>/`（全部已在GitHub与Preview保留）；实际生成提示词/母版SHA/输出SHA：`production/character_frames/<ID>/receipts/`；审核说明 `docs/ART_FRAME_CANDIDATES_2026-10-23.md`。本轮使用内置imagegen逐张生成，未用镜像/变形代替独立转向图。
- 后续：先复核#148结果；等待动作帧人工审核期间可按原始优先级继续真实玩法、遮挡、屏幕命中轮廓/存档边界问题。Pygame窗口仍未实际打开验收，不把Python24项通过称为全平台最终验收。

- e3da8d0已推送并核对GitHub HEAD；Vercel同SHA Preview READY `dpl_5nSEXVnJdM4g9PceKoFnAGwYDku1`，`https://nimingjianghu-ojkybqys1-bobos-projects-e9f8bfba.vercel.app/`。CI pull_request #146 `39822395041`已success，push #145仍需最终核对。
- 线上审核页可打开，但Playwright的Node APIRequest下载元数据发生ETIMEDOUT；已改为Chromium页面内同源fetch，并直接在浏览器读取PNG头/尺寸、计算SHA256。新核验在本地112张全通过，日志 `qa/1.0.10-local-master-review-browserfetch.log`。线上新路径核验仍在运行，不能在结束前标为成功。测试新增独立ART_REVIEW_OUTPUT目录以隔离证据。

- 本轮实际提交：`e3da8d0f17bd2b8a9aaf308090855bc70a9d143a`（v1.0.10，396个文件）；本地提交完成，GitHub push正在传输完整源图，须以最终命令结果/远程HEAD核对成功。push日志 `qa/1.0.10-push.log`，不可重复制造同样提交。此行是提交后的本地续接事实。

- 生产已完成：112/112独立PNG，全部原生1024×1536、112个唯一SHA256；每人16帧已通过P3-G整组检查并生成候选图集、审核图和QA报告，7组技术警告均为空。共275350059字节源PNG全部保留，不用低清表替代独立帧。
- 沈砚right_walk3首轮碰边被拒收，独立重生成后通过；完整实际提示词和接收帧SHA在production各角色receipts。候选图集没有自动获得人工批准。
- 最终代码 `npm test` / `npm run build`通过；Python24项通过。真实本地Chromium两种首章顺序均PASS，无JS异常/失败请求；新的审核页测试已实际下载112张构建后PNG并逐一核对哈希、方向动作源链接，全部PASS。`qa/1.0.10-local/`、`qa/1.0.10-master-review.log`和`qa/master-review/report.json`保存证据。
- 独立美术发布门禁仍退出1（ART_RELEASE_BLOCKED 20项），因为运行版方向图集没有获本轮人工批准；这是预期阻断，未放松门禁。准备将v1.0.10真实候选改动推送指定GitHub分支，再检查同SHA Preview和线上112源图，不把基线URL冒充新版本。

- 用户原话：“独立全身母版通过了开始下一步把”。这是七张独立全身母版的真实批准，不包括头像、方向帧、图集或运行效果。
- 七张候选哈希已逐一与原技术报告核对，原字节复制到正式全身母版路径。审批证据 `assets/characters/masters/reviews/2026-10-23_user_fullbody.json`；production_manifest中仅master_approved=true，portrait_approved仍false，游戏Sprite审批和绑定未改。
- 112个独立任务已导出到 `production/character_frames/`。内置imagegen逐张参考对应批准母版生成原生RGBA PNG；实际保存源图在 `qwen_4dir/<ID>/`，逐帧提示词、源路径、母版SHA、输出SHA和技术检查在各角色receipts目录。没有receipt不得称为完成。
- 当前正持续生成，尚未宣称112张全部完成。每角色16张齐全后运行P3-G frames打包候选，并核查真实四向、服装道具和步态。候选交用户新一轮人工审核之前，不调用Sprite release审批、不更新运行绑定、不发布Production。
- 审核页已区分全身母版与头像/动作帧审批；回归检查批准原话、审批范围及正式母版哈希。npm test/build和带Pillow的Python22项均通过；真实Chromium七张母版审核页通过，日志 `qa/1.0.10-*.log`。
- 本轮基线已重新核对：GitHub目标分支=本地HEAD `1d7675db9dd36881f9480bddee57555abc161110`；Vercel对应Preview READY `dpl_EWhfRj47vCR2sLUHvv1FuuFvpEzD`，`https://nimingjianghu-gglsz3u47-bobos-projects-e9f8bfba.vercel.app/`。这是v1.0.9基线，不是本轮美术新版本。
- 补记v1.0.9验收：本地和线上两种首章顺序均通过，无JS异常和失败HTTP请求，线上报告 `qa/1.0.9-online/manual-first/report.json`、`qa/1.0.9-online/trace-first/report.json`；CI #144 `39682850707` success。旧段落“七张母版待审/方向帧未生产”已被本段真实用户批准取代。

## 最新周期：v1.0.9（优先读取）

- 基线：本地HEAD与GitHub连接器重新读取的远程HEAD均为 `ae885fdea4f37a26bf3b1fdcfdb1c1a9aefbe81a`，Vercel基线READY `dpl_GnsNUaN8TFqhVcc8RGwifoW4E6Bo`。直接git fetch多次网络连接失败，已通过GitHub API核对，未覆盖远程或Gitee配置。
- 真实复现：Chromium读取韩掌柜原PNG的实际透明像素（alpha=0），点击头顶旁透明角落，旧版本却从(10,11)走到(8,11)。失败日志 `qa/1.0.9-browser-before.log`，截图 `qa/1.0.9-before/failure.png`，报告 `qa/1.0.9-before/failure.json`。
- 根因：pickActorAtScreen拒绝该点后，interactClick仍用旧的NPC/山贼纵向三格命中把它重新识别为角色。已删除这两个旧回退；保留建筑热点、物品、出口和正常地面寻路。屏幕头部/躯干命中与最后一步交互沿用原逻辑。
- Pygame同步取消NPC/敌人的九宫格命中，改用与实际绘制相同的RGBA Surface、朝向和脚底锚点读取透明Alpha；新增test_actor_pixels.py使用真实原版韩掌柜PNG验证透明角落、实体躯干、脚下地面和镜头偏移。窗口仍未实测，缺pygame/cairosvg。
- 已执行 `npm test` / `npm run build`：通过；带Pillow的Python完整22项全通过，无跳过。日志 `qa/1.0.9-unit.log`、`qa/1.0.9-build.log`、`qa/1.0.9-python.log`；美术门禁仍退出1（预期），`qa/1.0.9-art.log`。
- 真实Chromium两种首章顺序将独立保存 `qa/1.0.9-local/` 与 `qa/1.0.9-online/`；新SHA部署和CI结果须完成后再作为发布事实记录。
- 本地两条真实Chromium首章现均通过：实际alpha=0像素点击不移动/不误触交互，随后正常躯干点击、连续点击最后一步、战斗、正反探索顺序、结尾、刷新继续均通过；无JS异常和失败请求。报告 `qa/1.0.9-local/manual-first/report.json`、`qa/1.0.9-local/trace-first/report.json`，日志 `qa/1.0.9-browser-forward.log`、`qa/1.0.9-browser-reverse.log`。
- 本轮修改：game.js、main.py、tests/test_actor_pixels.py、tests/actor_collision_click_contract.cjs、tests/final_smoke.cjs、tests/chrome_browser_e2e.cjs、package.json=1.0.9、index.html统一缓存标记、README.md和本状态文件。正式人物资源/审批字段未改。
- 仍需人工审核七张母版；未进入声称已审核的112帧生产。浏览器屏幕命中轮廓仍为几何近似，本轮只修复已被屏幕轮廓拒绝的像素被旧网格重新命中；后续可继续审查轮廓内部透明区域和遮挡关系，不宣称所有透明像素已逐像素验收。
- 下一轮：先核对发布SHA/CI；有用户母版审批才推进方向帧，否则继续地图碰撞、前景遮挡、点击轮廓和存档边界的真实回归，避免重复催审。

## 上一周期：v1.0.8

- 基线本地/远程目标分支HEAD `1f41b39847cfc6cd6aaf7bd6fbe2f376e8f33ba1`，重新fetch已核对；Vercel基线READY `dpl_C7UaS5DgYe7augPAz6qH7Hw9sRrF`。保留原Gitee origin与上一周期本地状态补记。
- 已实际复现山洞软锁：先调查石台、后拿秘籍，旧代码停在quest=3。修复前真实行为契约失败日志 `qa/reverse-clues-before.log`（actual=3、expected=4）。
- game.js统一在拿到任一线索后检查两条线索，只有齐全才推进quest=4与剧情；单独调查石台立即保存；继续游戏自动修复旧版“两线索齐全但quest=3”的存档，不重发奖励、不清空道具。
- main.py同步要求两条线索齐全才推进结尾，防止Pygame过早进入quest=4。新增test_cave_progress.py执行真实嵌套pickup处理器，覆盖两种顺序、单线索不完成及重复点击不重复奖励。
- final_smoke.cjs覆盖反向顺序、奖励幂等和旧存档恢复。Chromium测试保留正向首章，增加E2E_CAVE_ORDER=trace-first路线：先石台、中途刷新继续、后秘籍、回镇结尾；CI运行两条路线，独立保存报告/截图。
- `npm test`、`npm run build`通过；带Pillow的Python完整21项通过。日志 `qa/1.0.8-unit.log`、`qa/1.0.8-build.log`、`qa/1.0.8-python.log`。美术门禁仍退出1（预期）：`qa/1.0.8-art.log`。
- package.json=1.0.8，缓存标记统一更新；变更文件：game.js、main.py、tests/final_smoke.cjs、tests/test_cave_progress.py、tests/chrome_browser_e2e.cjs、.github/workflows/web-smoke.yml、README.md、index.html、package.json及本状态文件。
- 最终提交：`ae885fdea4f37a26bf3b1fdcfdb1c1a9aefbe81a`，已推送 `github/feat/playable-demo-v0.1`。Vercel READY `dpl_GnsNUaN8TFqhVcc8RGwifoW4E6Bo`，部署SHA一致，URL `https://nimingjianghu-g7sym1vxt-bobos-projects-e9f8bfba.vercel.app/`。
- 最终线上两条真实Chromium首章路线全部通过：先秘籍和先石台均到quest=5，中途刷新、最后刷新继续、键盘/战斗/窄屏检查通过；无JS异常、无失败HTTP请求。报告 `qa/1.0.8-online/manual-first/report.json`、`qa/1.0.8-online/trace-first/report.json`；日志 `qa/1.0.8-online-forward.log`、`qa/1.0.8-online-reverse.log`。
- GitHub CI #142 `39673953958` completed/success，包含两种探索顺序、Python、构建、地图截图和七人审核页；`https://github.com/mjw3177109/nimingjianghu/actions/runs/39673953958`。
- 最终发布和测试元数据已保存 `qa/release.json`、`qa/1.0.8-release.json`。本文件部署完成后的事实补记保留本地，尚未单独提交；无运行时代码未提交，下一次实际修复时随同纳入。
- 本地两条真实Chromium路线现已全部通过，均到达quest=5并刷新继续保留两条线索，无JS异常和失败请求；证据 `qa/1.0.8-local/manual-first/report.json`、`qa/1.0.8-local/trace-first/report.json`，日志 `qa/1.0.8-browser-forward.log`、`qa/1.0.8-browser-reverse.log`。
- 七张母版仍待用户真实人工审核，正式审批字段和运行资源未改；不能自行推进声称已审核的112帧生产。Pygame窗口仍未实测（缺pygame/cairosvg），仅真实处理器逻辑与Python数据测试通过。
- 下一轮：先核对最终SHA/部署/CI；若用户已审批母版则按P3-H逐人生成方向帧，否则继续地图碰撞/遮挡和存档边界检查，避免重复催审。

## 上一周期：v1.0.7

- v1.0.6 已提交并推送：`16c7a876bae983bb09fa69744f01cc9de6b9b305`，Vercel READY `dpl_GHp6qGwNskfeEzeeifzUMRpJhxLL`，`https://nimingjianghu-9xbf8gb6q-bobos-projects-e9f8bfba.vercel.app/`。真实线上 Chromium 从首页到结尾、刷新继续、键盘/碰撞/窄屏全部通过，无异常/失败请求，证据在 `qa-online.log`。
- 随后完成 v1.0.7：七名角色均有1024×1536独立RGBA母版候选、同源1024头像、审核JPG和源/输出SHA256，位于 `assets/characters/masters/candidates/`。七个角色仍全部未人工审核，未制作新的112帧，正式registry和production审批字段未修改。
- P3-G真实导入复现并修复 Path.thumbnail 崩溃；新增测试验证完整源像素保留、审核图生成、哈希和不自动审批。
- 美术验收室新增逐角色母版预览、哈希报告链接、官方绘卷对照；`tests/chrome_master_review.cjs` 真实Chromium逐一加载七名候选通过，截图和报告在 `qa/master-review/`。生成说明、提示词、角色描述与哈希见 `docs/ART_MASTER_CANDIDATES_2026-10-22.md`。
- 图像生成第一轮源尺寸不够，全部拒绝；第二轮廖衣袖碰边，也拒绝，最终独立修订后通过技术检查；拒绝源和生成记录保留在 `qa/art-generation/`，未进入发布资源。
- v1.0.6 GitHub Actions run `39664913351` 构建通过，但键盘边界测试用固定2.4秒，在较慢Linux渲染下只走到y=2而失败。v1.0.7改为等待真实抵达y=1再保持按键验证，不放松边界要求；失败新增截图/诊断。须确认v1.0.7新CI结果。
- v1.0.7 `npm test`、`npm run build`：通过；使用带Pillow的bundled Python完整20项全通过，无跳过。真实本地首章E2E重跑通过（`qa-browser-final.log`），七人审核页测试通过（`qa-master-review.log`）。CI新增安装Pillow，保证图像导入测试真实执行。
- 最终v1.0.7发布SHA：`1f41b39847cfc6cd6aaf7bd6fbe2f376e8f33ba1`，已推送指定GitHub分支。
- 最终Vercel：`dpl_C7UaS5DgYe7augPAz6qH7Hw9sRrF`，READY，SHA与上述一致，URL `https://nimingjianghu-5rn8vnmxc-bobos-projects-e9f8bfba.vercel.app/`。线上真实Chromium首章全流程通过，七名母版审核页也通过，报告 `qa/e2e/report.json` 和 `qa/master-review/report.json`；无JS异常，首章无HTTP失败请求。
- GitHub CI run `39666898301`（#140）completed/success，包含构建、Python、首章、地图截图、七人审核页。链接 `https://github.com/mjw3177109/nimingjianghu/actions/runs/39666898301`。
- `qa/release.json`保存最终发布与测试证据。本文件这几条部署完成后的事实是本地续接补记，尚未单独提交；无运行时代码未提交。下一次实际修复提交可同时纳入补记，避免为状态文件制造无代码版本。
- 下一步：确认最新SHA部署与CI，再请用户逐角色审核七张母版。批准前只可修订候选和其他玩法问题，不得自动批准或进入声称已审核的方向帧任务。还需修复并回归先石台后秘籍的潜在软锁，继续地图/步态人工验收。Pygame窗口未实测（缺pygame/cairosvg）。

## 仓库与版本

- 本地已切换到 `feat/playable-demo-v0.1`，基线 HEAD `0862afa32bfdeabb9332ce88e31dd05268ab8309`。
- `origin` 保留 Gitee；新增 `github` 指向 `https://github.com/mjw3177109/nimingjianghu.git`。不要推送 master/main。
- package.json：1.0.9。本文件随发布提交保存；最终发布 SHA 和部署验收在 `qa/release.json` 及聊天交付报告中补充，续接时必须重新 `git rev-parse HEAD` 与查询远程。
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
