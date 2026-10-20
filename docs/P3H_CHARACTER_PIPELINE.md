# P3-H｜单图高清人物母版生产与四方向防串脸流程

## 目的
当前游戏可以运行，但正式高清角色母版尚未通过人工审核。P3-H 不把概念海报当人物原画；先解决人物源图，再进入动作帧生产。

## 1. 先只生成沈砚一张全身母版
在仓库根目录执行：

```powershell
python tools/p3h_export_character_jobs.py master --character CHAR001 --out P3H_OUT/CHAR001
```

生成两个文件：
- `P3H_OUT/CHAR001/master_prompt.md`：单图提示词，强调只输出一张正面全身图，禁止拼贴、设定表、多视图、UI或文字。
- `P3H_OUT/CHAR001/master_job.json`：结构化任务，包含身份参考、风格参考、真实尺寸和输出路径。

把提示词放入你的 Qwen2.1 工作流，并把官方沈砚头像作为身份参考、官方六人绘卷作为风格参考。**不要用低清头像做超分，也不要把两张参考图当作要合并的画布。** 生成一张 1536×2048（最低 1024×1536）真正透明 RGBA PNG。

## 2. 导入候选并让我验收
把生成图保存到本地，例如 `D:\qwen\CHAR001_fullbody.png`，执行：

```powershell
python tools/p3g_art_pipeline.py master --character CHAR001 --input "D:\qwen\CHAR001_fullbody.png"
```

脚本只会把图复制到 `assets/characters/masters/candidates/` 并输出头像裁切候选、审核图和 JSON 质量报告；不更改正式母版、不批准角色。把 `CHAR001_review.jpg` 和质量报告给我检查，重点是发型、脸、白灰内衫、墨蓝外袍、腰带、剑和完整脚底。技术尺寸通过并不等于美术通过。

## 3. 人工确认后再导出16个独立动作任务
只有母版经过人工检查之后，才执行下面命令。这里的 `--reviewed-master` 是你明确声明已经人工验收的文件；工具不会替你批准，也不会改正式 manifest。

```powershell
python tools/p3h_export_character_jobs.py frames --character CHAR001 --reviewed-master "D:\qwen\CHAR001_fullbody_approved.png" --out P3H_OUT/CHAR001_FRAMES
```

这会产生 `frames_jobs.json` 和16份独立提示词文件，方向为正面、左侧、右侧、背面，每方向待机与三个步态各一张。每一份任务都只要求生成一张PNG；所有任务均引用人工确认的高清母版，不再使用头像作为动作参考。

把16张独立 RGBA PNG 交给 `tools/p3g_art_pipeline.py frames` 校验和打包，生成 384×512 的高清候选图集（每帧96×128）和审核图。旧游戏 Sprite 仍为48×64帧，因此只有美术验收完成后才能单独决定游戏内显示尺寸和接入方式，不能盲目覆盖旧资源。

## 4. 本阶段的发布门禁
- 绝不把一张四视图图或整套宣传板切片冒充16张原始帧。
- 不允许用镜像正面代替侧面或背面。
- 必须检查透明Alpha、头脚完整、帧重复、脚底锚点、服装与配饰连续性。
- 通过脚本只代表技术格式合格；脸型、衣服、真实转身透视必须由人审核。
- 在用户确认之前，所有输出状态均为候选，正式人物、存档与已部署试玩版不变。
