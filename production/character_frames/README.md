# 四方向独立动作帧生产

用户于2026-10-23明确批准七张独立全身母版，原话：“独立全身母版通过了开始下一步把”。逐张文件哈希和审批范围见 `assets/characters/masters/reviews/2026-10-23_user_fullbody.json`。

每人4方向（down/left/right/up）×4动作（idle/walk1/walk2/walk3），七人共112个独立PNG任务。各角色目录的 frames_jobs.json 与 Markdown 保存逐帧提示词。使用内置 imagegen，每次只生成一个角度与动作，以对应批准母版为身份参考。

原始PNG保存在项目 `qwen_4dir/<角色ID>/`，逐帧 receipts 记录实际源文件、提示词、批准母版哈希、输出哈希、技术检查结果。没有receipt的任务不能称为已生成。技术检查通过不代表人工审核通过。

全部16帧齐全后，用 `tools/p3g_art_pipeline.py frames` 检查、打包候选图集及审核图。独立帧与图集仍须用户审核；本阶段不修改运行Sprite，不批准头像，不发布Production。
