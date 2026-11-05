// =====================================================================
// GunBase 火械基地 — "Coming soon!" 占位品类
// 战术装备（gear）下已规划但尚未上架的单兵装具子分类。
// 单独成文件，目的是：日后用后台 Excel 工具重新导出 products.js 时，
// 不会把这批占位清掉。由 app.js 在 getProducts() 中并入目录。
// 字段与 products.js 一致；comingSoon:true 由前台渲染为「Coming soon!」占位卡，
// 不显示价格、不可加入询盘、不可查看详情。
// =====================================================================
window.GUNBASE_COMING_SOON = [
  {
    id: "GB-CS-01",
    category: "gear",
    comingSoon: true,
    name: { en: "Body Armor & Plate Carrier", zh: "防弹衣 / 携板背心" },
    sku: "CS-ARMOR",
    desc: { en: "Coming soon — NIJ-rated plates, carriers and soft armor.", zh: "即将上线 —— NIJ 等级防弹插板、携板背心与软质防弹衣。" },
    price: 0, moq: "", specs: { en: "", zh: "" }, image: ""
  },
  {
    id: "GB-CS-02",
    category: "gear",
    comingSoon: true,
    name: { en: "Tactical Helmet", zh: "战术头盔" },
    sku: "CS-HELMET",
    desc: { en: "Coming soon — bump & ballistic helmets with rail/mount system.", zh: "即将上线 —— 防撞与防弹战术头盔，含导轨与挂载系统。" },
    price: 0, moq: "", specs: { en: "", zh: "" }, image: ""
  },
  {
    id: "GB-CS-03",
    category: "gear",
    comingSoon: true,
    name: { en: "Tactical Belt", zh: "战术腰带" },
    sku: "CS-BELT",
    desc: { en: "Coming soon — inner/outer gun belts and rigger belts.", zh: "即将上线 —— 内衬 / 外腰带与伞兵腰带。" },
    price: 0, moq: "", specs: { en: "", zh: "" }, image: ""
  },
  {
    id: "GB-CS-04",
    category: "gear",
    comingSoon: true,
    name: { en: "Tactical Backpack", zh: "战术背包" },
    sku: "CS-PACK",
    desc: { en: "Coming soon — assault packs, rucksacks and range bags.", zh: "即将上线 —— 突击包、行军背包与靶场包。" },
    price: 0, moq: "", specs: { en: "", zh: "" }, image: ""
  },
  {
    id: "GB-CS-05",
    category: "gear",
    comingSoon: true,
    name: { en: "Tactical Gloves", zh: "战术手套" },
    sku: "CS-GLOVE",
    desc: { en: "Coming soon — cut-resistant & impact gloves.", zh: "即将上线 —— 防割与抗冲击战术手套。" },
    price: 0, moq: "", specs: { en: "", zh: "" }, image: ""
  },
  {
    id: "GB-CS-06",
    category: "gear",
    comingSoon: true,
    name: { en: "Tactical Goggles & Eyewear", zh: "战术护目镜" },
    sku: "CS-GOGGLE",
    desc: { en: "Coming soon — ballistic goggles and protective eyewear.", zh: "即将上线 —— 防弹护目镜与防护眼镜。" },
    price: 0, moq: "", specs: { en: "", zh: "" }, image: ""
  },
  {
    id: "GB-CS-07",
    category: "gear",
    comingSoon: true,
    name: { en: "Tactical Boots", zh: "战术靴" },
    sku: "CS-BOOT",
    desc: { en: "Coming soon — water-resistant side-zip tactical boots.", zh: "即将上线 —— 防水侧拉链战术靴。" },
    price: 0, moq: "", specs: { en: "", zh: "" }, image: ""
  },
  {
    id: "GB-CS-08",
    category: "gear",
    comingSoon: true,
    name: { en: "Tactical Chest Rig & Load-bearing", zh: "战术携行具 / 胸挂" },
    sku: "CS-RIG",
    desc: { en: "Coming soon — chest rigs and modular load-bearing vests.", zh: "即将上线 —— 战术胸挂与模块化携行背心。" },
    price: 0, moq: "", specs: { en: "", zh: "" }, image: ""
  }
];
