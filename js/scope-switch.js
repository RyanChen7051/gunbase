// =====================================================================
// GunBase 火械基地 — Scope Switch (standalone product)
// 来源: SCOPE SWITCH (EN).docx (英文) + SCOPE SWITCH.doc (中文版)
// 独立文件挂载，避免后台 admin.html 重导 Excel 时覆盖。
// 字段与 products.js 完全一致: id / category / name{en,zh} / sku /
//   desc{en,zh} / price / moq / specs{en,zh} / image
// =====================================================================
window.GUNBASE_SCOPE_SWITCH = [
  {
    id: "GB-SW-001",
    category: "hardware",
    name: { en: "Scope Switch", zh: "SCOPE SWITCH" },
    sku: "GB-SW-001",
    desc: {
      en: "All-new upgraded structure with a slide-block design for smoother magnification adjustment. Compatible with 30MM / 34MM tubes; fits 44MM–49MM scope magnification rings. Includes a rail adapter for mounting more accessories. Real-steel compatible; excellent shock resistance, stable and reliable under heavy use. Overall length: 37.5 cm; weight approx. 480 g. Main body: 6061 aluminum, hard-anodized, wear-resistant and rugged. Front slider in steel for reliable strength and long-term deformation resistance. Comes with a heat-shrink tube; wraps the cut steel wire to prevent hand injury.",
      zh: "全新升级结构，搭载滑块设计，变倍操作更加顺滑。支持30MM / 34MM 管径通用，适配 44MM–49MM 瞄准镜变倍扭圈。增加导轨转接组件，拓展更多配件安装。真铁可用，抗震性能优异，高强度工况稳定可靠。整体长度：37.5 cm，重量约 480 g。主体材质：6061 铝材，硬质阳极氧化工艺，耐磨抗造。前端滑动件采用钢结构，强度可靠，长久使用不易变形。附赠热缩管配件，钢丝裁切后包覆使用，有效防止扎手。"
    },
    price: 0,
    moq: "",
    specs: {
      en: "Tube compatibility: 30 mm / 34 mm | Magnification ring fit: 44–49 mm | Overall length: 37.5 cm | Weight: approx. 480 g | Body: 6061 aluminum, hard-anodized | Front slider: steel | Includes: rail adapter + heat-shrink tube",
      zh: "管径兼容：30 mm / 34 mm | 适配变倍圈：44–49 mm | 整体长度：37.5 cm | 重量：约 480 g | 主体材质：6061 铝材，硬质阳极氧化 | 前端滑动件：钢制 | 附赠：导轨转接件 + 热缩管"
    },
    image: ""
  }
];
