# 韩掌柜 四方向16帧任务包

共16个独立生成任务，每个任务对应一张PNG，不允许拼成大图。
参考母版：`D:\nimingjianghu\assets\characters\masters\NPC001_fullbody.png`

生成后将每个结果按 `output_file` 放置，接着运行：

`python tools/p3g_art_pipeline.py frames --character NPC001 --input <含16张PNG的文件夹>`

打包工具会输出高清候选图集与审核图；审核前不得替换正式资源。
