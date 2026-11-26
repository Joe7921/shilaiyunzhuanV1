# 四季食养馆内容与图片来源

食谱文字与用量为本项目编写的双人家庭版本。六组共 27 道，各道有独立做法、食用提醒、季节、食材与筛选标签。食养说明记录传统餐桌习惯。热量取投料的常见可食部估值，近似到 5 千卡，默认整份 2 人。骨重、脂肪、滤渣、品牌和蒸发会影响实际每碗结果。无糖椰奶的脂肪含量尤其容易因品牌而异。

## 食品安全依据

- 禽肉中心温度至少 74℃。美国农业部食品安全检验局，[What is a safe internal temperature for cooking meat and poultry?](https://ask.fsis.usda.gov/article/What-is-a-safe-internal-temperature-for-cooking-meat-and-poultry)
- 银耳用洁净水短时浸泡，及时煮食，发现异味或异常黏滑弃用。市场监管总局，[关于酵米面等食物中毒的风险解析](https://www.samr.gov.cn/xw/zj/art/2023/art_7587ef80ec2f4e8bab850b7e3d69ec30.html)
- 蜂蜜饮品不供未满一周岁婴儿食用。美国疾病控制与预防中心，[Foods and Drinks to Avoid or Limit](https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/foods-and-drinks-to-avoid-or-limit.html)
- 孕期选择无酒精饮品。美国疾病控制与预防中心，[About Alcohol Use During Pregnancy](https://www.cdc.gov/alcohol-pregnancy/about/)
- 以 100 克可食部为基础换算营养值的方法可见美国农业部，[Foundation Foods Documentation](https://fdc.nal.usda.gov/Foundation_Foods_Documentation/)。本站热量属于烹饪估算，未做实验室测定。

## 图片来源与处理

本项目通过 OpenAI ImageGen 为 27 道食谱分别生成写实食物示意图，无外部图库照片。模型按三张九宫格摄影联系表构图，每格对应一个食谱，逐格检查食材外观，对格边内缩 3 像素，导出独立 412 × 412 WebP（质量 85）。每条配方使用自己的 image 字段和 imageCredit。以下为原始位置与最终文件对应。

| 源图 | 行列 | 成品 | 文件 |
| --- | --- | --- | --- |
| 1 | 1行 1列 | 山药排骨汤 | `yam-ribs.webp` |
| 1 | 1行 2列 | 胡椒猪肚鸡 | `pepper-tripe-chicken.webp` |
| 1 | 1行 3列 | 萝卜羊肉汤 | `radish-lamb.webp` |
| 1 | 2行 1列 | 番茄牛腩汤 | `tomato-brisket.webp` |
| 1 | 2行 2列 | 南瓜浓汤 | `pumpkin-puree.webp` |
| 1 | 2行 3列 | 菌菇鸡汤 | `mushroom-chicken.webp` |
| 1 | 3行 1列 | 冰糖雪梨 | `rock-sugar-pear.webp` |
| 1 | 3行 2列 | 银耳雪梨羹 | `tremella-pear.webp` |
| 1 | 3行 3列 | 百合莲子糖水 | `lily-lotus.webp` |
| 2 | 1行 1列 | 雪梨百合汤 | `pear-lily.webp` |
| 2 | 1行 2列 | 红枣银耳羹 | `red-date-tremella.webp` |
| 2 | 1行 3列 | 桂圆红枣茶 | `longan-date-tea.webp` |
| 2 | 2行 1列 | 姜枣茶 | `ginger-date-tea.webp` |
| 2 | 2行 2列 | 苹果肉桂茶 | `apple-cinnamon-tea.webp` |
| 2 | 2行 3列 | 蜂蜜柠檬温饮 | `honey-lemon.webp` |
| 2 | 3行 1列 | 绿豆沙 | `mung-soup.webp` |
| 2 | 3行 2列 | 冬瓜汤 | `winter-melon.webp` |
| 2 | 3行 3列 | 酸梅汤 | `plum-drink.webp` |
| 3 | 1行 1列 | 清补凉 | `hainan-dessert.webp` |
| 3 | 1行 2列 | 椰奶西米露 | `coconut-sago.webp` |
| 3 | 1行 3列 | 银耳莲子羹 | `tremella-lotus.webp` |
| 3 | 2行 1列 | 百合南瓜汤 | `lily-pumpkin.webp` |
| 3 | 2行 2列 | 莲藕排骨汤 | `lotus-ribs.webp` |
| 3 | 2行 3列 | 肉桂热红酒 | `cinnamon-wine.webp` |
| 3 | 3行 1列 | 香橙热红酒 | `orange-wine.webp` |
| 3 | 3行 2列 | 苹果香料热红酒 | `apple-wine.webp` |
| 3 | 3行 3列 | 无酒精香料热饮 | `spiced-juice.webp` |
