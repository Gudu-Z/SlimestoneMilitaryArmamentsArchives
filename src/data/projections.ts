// 投影文件清单（数据驱动档案馆列表 + 搜索索引）
// 新增文件：往下面数组里加一条 { title, category } 即可，页面和搜索自动更新
export interface Projection {
  title: string;
  category: string;
}

// 分类展示顺序（与档案馆页面一致）
export const CATEGORIES = [
  "飞船成品",
  "导弹",
  "炮",
  "轰炸机",
  "舰载飞行器",
  "装甲",
  "多向",
  "标准结构",
  "tnt复制结构",
  "其他模块",
  "半成品",
] as const;

export const PROJECTIONS: Projection[] = [
  // 飞船成品
  { title: "BS--1.litematic", category: "飞船成品" },
  { title: "[标准]BZ--1.litematic", category: "飞船成品" },
  { title: "Choe Geon Class 带壳 by粘液块_Sdark.litematic", category: "飞船成品" },
  { title: "[绿萌航械] -飞船成品- 浪花A3.litematic", category: "飞船成品" },
  { title: "Choe Geon Class 带壳.rar", category: "飞船成品" },
  { title: "stark的小绿萌舰队.rar", category: "飞船成品" },

  // 导弹
  { title: "4连导弹 11TNT+40TNT矿车.litematic", category: "导弹" },
  { title: "7连小型导弹 1TNT+50TNT矿车.litematic", category: "导弹" },
  { title: "单发蓝头穿甲导弹 20TNT矿车+160头.litematic", category: "导弹" },
  { title: "[标准]单发蓝头穿甲导弹以及单位蓝头 20TNT矿车+20头.litematic", category: "导弹" },
  { title: "【无实体】8连侧边导弹 6TNT 横向堆叠.litematic", category: "导弹" },
  { title: "【无实体】8连侧边导弹 7TNT 交错堆叠.litematic", category: "导弹" },

  // 炮
  { title: "【无实体】3连模块化侧炮.litematic", category: "炮" },
  { title: "【无实体】4连模块化侧炮.litematic", category: "炮" },

  // 轰炸机
  { title: "[Nazgûl]单向无车小轰炸机.litematic", category: "轰炸机" },
  { title: "[无实体]单向小型无车轰炸机.litematic", category: "轰炸机" },

  // 舰载飞行器
  { title: "装甲拆除飞行器.litematic", category: "舰载飞行器" },

  // 装甲
  { title: "10gt双向推墙机 by MythicalPingu.litematic", category: "装甲" },

  // 多向
  { title: "[标准]BZ--1 950实体 末地石甲.litematic", category: "多向" },
  { title: "[绿萌航械] 双向半动机.litematic", category: "多向" },
  { title: "[绿萌航械] 可拓展小型四向飞行器.litematic", category: "多向" },
  { title: "[绿萌航械] 更紧凑的四向步进飞行器 by Enator18.litematic", category: "多向" },
  { title: "[绿萌航械]上-下-前三向步进飞行器 .litematic", category: "多向" },

  // 标准结构
  { title: "[标准]20tnt矿车堆叠混凝土粉末弹匣.litematic", category: "标准结构" },

  // tnt复制结构
  { title: "10gt 30tnt Observer Duper that moves at 9gt.litematic", category: "tnt复制结构" },
  { title: "10gt 30tnt无车复制整列 以9gt移动 by Shinji 和 MythicalPingu.litematic", category: "tnt复制结构" },
  { title: "4gt_20tnt_Observer_Duper_Alternates_half_the_tnt_at_8gt.litematic", category: "tnt复制结构" },
  { title: "4gt_Observer_Duper_Not_2-Tileable_Version.litematic", category: "tnt复制结构" },
  { title: "8gt 10x5TNT Observer Based Duper.litematic", category: "tnt复制结构" },
  { title: "8gt 10x5TNT 无车复制阵列.litematic", category: "tnt复制结构" },
  { title: "8gt 9xTNT Stackable Observer Based Duper  .litematic", category: "tnt复制结构" },
  { title: "8gt20x Movable Duper.litematic", category: "tnt复制结构" },
  { title: "8gt_20tnt_Observer_Duper.litematic", category: "tnt复制结构" },
  { title: "stark的tnt复制阵列.litematic", category: "tnt复制结构" },
  { title: "[无实体]8gt 9xTNT 可堆叠可移动无车复制阵列 by Gǔdù.litematic", category: "tnt复制结构" },
  { title: "[无实体]8gt x 9tnt无车可两宽堆叠复制阵列.litematic", category: "tnt复制结构" },
  { title: "[无实体]8gt无车可两宽堆叠复制阵列.litematic", category: "tnt复制结构" },
  { title: "[绿萌航械]无车tnt复制模块.litematic", category: "tnt复制结构" },
  { title: "[绿萌航械]无车tnt复制模块合集.litematic", category: "tnt复制结构" },

  // 其他模块
  { title: "tnt传送带(二代横向).litematic", category: "其他模块" },
  { title: "tnt传送带(横向).litematic", category: "其他模块" },
  { title: "tnt传送带(纵向向上).litematic", category: "其他模块" },
  { title: "tnt传送带(纵向向前).litematic", category: "其他模块" },
  { title: "tnt传送带(纵向向后).litematic", category: "其他模块" },
  { title: "[地图内容]1313可向上堆叠空中地雷.litematic", category: "其他模块" },
  { title: "[地图内容]空中地雷.litematic", category: "其他模块" },

  // 半成品
  { title: "[Nazgûl]单向无车小轰炸机.litematic", category: "半成品" },
  { title: "单向无车小轰炸机.litematic", category: "半成品" },
];
