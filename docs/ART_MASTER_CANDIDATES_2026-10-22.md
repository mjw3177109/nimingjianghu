# 独立人物母版候选：等待人工审核

本轮使用内置 `image_gen` 服务，按角色分别生成，身份与画风参考 `assets/home/characters_gallery_ref.webp`。没有软件放大、没有把图集切片冒充独立母版。七张最终候选均为 1024×1536 RGBA，P3-G 技术检查通过；不等于人脸、服饰、真实透明边缘与美术风格通过人工验收。

审核入口：游戏首页的「人物美术验收」，选择七名角色，查看新加入的独立母版预览、官方绘卷和源/输出哈希报告。尤其需要检查边缘是否有残留光晕、服饰是否与官方人设一致、鞋和武器是否完整。所有 `master_approved`、`portrait_approved` 保持 false，运行Sprite注册表未改。

第一轮七张源图为1086×1448，低于最低高度，因此全部拒绝。第二轮按2:3画幅重新生成；廖的衣袖碰边，再单独通过图像编辑重生成。被拒绝原图和完整生成日志保存在本地 `qa/art-generation/`，不进入发布资源。

每名角色的交付文件在 `assets/characters/masters/candidates/`：

- `<ID>_fullbody_candidate.png`：完整母版，源像素保留。
- `<ID>_portrait_candidate.png`：同源1024×1024裁切头像，无放大。
- `<ID>_review.jpg`：用于查看的缩小对比图，不作为高清源图。
- `<ID>_master_qa.json`：源分辨率、Alpha包围盒、源文件及三个输出文件的SHA256、未审核状态。

## 最终生成提示词

每个角色使用同一英文模板，插入下表中的ID、姓名和角色描述；廖另有后述修订。参考图只用于身份和风格，背景设置 `transparent_background=true`。

```text
Generate exactly ONE tall portrait PNG image for original game character {id} {name}: {description} Reference is for character identity and Chinese chibi2.5D hand-painted art style only, not a collage to edit. CRITICAL output dimensions must be 1024 x 1536 pixels, aspect ratio 2:3 TALL PORTRAIT, not 3:4, not 1086 x 1448. Truly transparent RGBA background. ONE complete full-body front neutral standing figure, hair top and shoes/soles completely within canvas, with empty transparent margins. Head body ratio1:3.5 matching refined reference, crisp native painted details, subdued natural clothing colors. No letters or Chinese text anywhere including props. No UI, no watermark, no floor or ground shadow, no scene, no second figure, no sprite sheet, no character design sheet, no collage. This is a NEW native higher-resolution drawing, do not upscale the reference. Must have height at least1536 and width at least1024. Preserve official hair/clothing/weapons.
```

韩掌柜首先以同样的1024×1536纵向尺寸要求单独重试，明确中年微胖、棕衣围裙、葫芦、肩巾、笑脸发髻小胡须，不使用武器、文字或多人物。

廖最终修订提示词：

```text
EDIT this Liao character image. Preserve his exact face, black long hair, black and gold robe, fan and accessories. Fix framing: show the entire original figure at SMALLER occupancy centered within a tall 1024x1536 PNG, including all flowing sleeves, hair, shoes and robe edges, with at least60 transparent pixels on EVERY edge. The left sleeve MUST NOT touch the edge. Remove ALL background halo/glow/shadows and surrounding brown or grey pixels: background outside the character is truly alpha=0 transparent. Do not add any setting. Only the isolated full-body game character. Native detailed rendering matching original Chinese chibi2.5D art. No text, no extra figures. Tall2:3 aspect, exactly1024x1536 or larger with height>=1536. Do not crop and do not merely upscale.
```

## 审核后的下一步

请按角色指出「通过」或具体修正点。母版通过后，按现有P3-H流程导出每名角色16份方向/动作任务，生成112张真实独立PNG，再通过P3-G检查、contact sheet和人工动作审核。此阶段尚未制作或批准新的四方向16帧，不得把母版技术检查当作正式Sprite审核。

## 角色描述与候选文件校验


### CHAR001 沈砚

黑色略蓬松短发，大眼少年，灰白内衫、墨蓝短外袍、腰带、黑裤绑腿、布靴、腰佩单剑。对应参考最左第一人。

母版SHA256：7f4e0e10dbf960df888d0b9fd985d8b82c5feee24a4b9437336d7bf4804f5069

源文件SHA256：8f6eb1f7cdc04180e567c02f6dce5c0751fcff3afe322e51d079fae5b7be584a

### BOSS001 廖

清冷成年男性，黑色长发高束金冠，黑金长袍，玉石配饰与黑色折扇，克制的观命者气质。对应参考第二人。

母版SHA256：e91b003590e58011e6467cb65cb87ce4401f46e03c835a1f60de96addfeac90d

源文件SHA256：ecccd4511d6a6d00f663a91cb6f0c6eee9b5f81ac8e0b7f7ed8fb589e5710627

### NPC001 韩掌柜

微胖中年男人，发髻、小胡须和爽朗笑容，棕米色布衣，围裙、肩上白布巾、酒葫芦，无任何文字。对应参考第三人。

母版SHA256：146a81c9e0308e530ecd2533be1b4df58d054c2e17f28bbe4506782a6cdb211e

源文件SHA256：ad607638d5f562a691bc9fc38401510b6dbd581a7c80476f7d3187109ae2a8c5

### NPC002 顾老

白发白须慈祥但目光锐利的老年隐士，青灰苔绿斗篷和内衫，松木拐杖、玉葫芦，完整鞋底。对应参考第四人。

母版SHA256：9c356c72551e9feff7c67f581072c482e93234f154436b3a7fa2fc4ca95de803

源文件SHA256：5249b3db3407184b6a9499aa7a0dde504dec543eaeb02daf14941e2812b0e95f

### NPC003 顾青岚

年轻女性剑客，高束黑长发，青白蓝绿武侠劲装与衣带，精致银玉头饰，握单剑，沉静坚毅。对应参考第五人。

母版SHA256：5b64db7e2ce34293a2b07c16eec7768a1f54b52b3c0e3cbb363814173ee0d95c

源文件SHA256：e94c809b42a19fc54b12599b0e8aca46699d2a2be1c0e7f1a5dcc84a58138fc7

### NPC005 苏晚晴

年轻女医者，黑长发、双发簪与浅绿色白色小花头饰，浅青绿长裙、草药纹、藤编药篮。对应参考最右第六人。

母版SHA256：1f608b44296589dfda4f878e67206445ea85852ddca83dc347495cab38288c83

源文件SHA256：0b414c41cac73d0cad0fc9a5d6f35f0a907d710025303d69eb66376e915d4bb6

### EN001 山贼

男性壮实山贼小兵，灰黑粗布衣，暗红额带，简易单刀，黑裤布鞋。与绘卷角色属于同一游戏画风，但身份独立。

母版SHA256：82f0e0ea159f274a245ba58accdea25fc79c22640a59e4f255a151d3defa890e

源文件SHA256：c267c4b3c844c2fc84ea82e5dbffcb11eb896f651ffecf586548c568fa281bf6
