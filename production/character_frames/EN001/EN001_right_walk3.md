# EN001_right_walk3｜山贼 单帧生成任务

- 参考母版：`D:\nimingjianghu\assets\characters\masters\EN001_fullbody.png`（1024×1536，由调用者声明已人工审核）
- 方向：右侧面（right）
- 动作：迈步三（walk3）
- 输出文件：`qwen_4dir/EN001/right_walk3.png`
- 状态：待生成与人工审核

## 正向提示词

【只生成一张独立角色帧，不是Sprite表】角色「山贼」，唯一人物身份与服装依据是传入的已人工验收高清母版。不得重设计脸、发型、发饰、服装、腰带、纹样、鞋、武器；不改变主色、身高比例、头身比和配饰位置。视角：右侧面，true right profile, character faces toward screen-right; visible side of face, nose points right。动作：迈步三，walking key pose C: right foot steps forward and left foot trails, natural counter-swing of arms。保持角色全身完整、发顶与鞋底不裁切，居中站在固定脚底锚点，姿势符合自然人体透视。该图必须独立重绘对应角度；禁止镜像正面、拉伸正面、用头发/衣服遮住脸来假冒背面。严格沿用参考母版的精致国风Q版2.5D手绘武侠风格，干净轮廓、精细衣料。真正透明RGBA背景；单张PNG、竖向约3:4、建议1024×1536或更高分辨率。禁止画第二个人物、场景、地面投影、UI、文字、标签、边框、格子、其他方向或其他动作。每次只输出这一张帧，不要把其余15帧放在同一画布。

## 负面提示词

拼贴、角色设定表、三视图、四视图、接触表、九宫格、Sprite Sheet、多个姿势出现在同一张图、多个角色、背景场景、UI、按钮、边框、文字、编号、水印、logo、白色假透明棋盘格、实心背景、裁切头顶、裁切鞋底、手脚畸形、换脸、服装变色、额外武器、水平镜像冒充另一方向、正面伪装背面、拉伸现有小头像、过曝光晕、低清模糊
