// =====================================================================
// GunBase 火械基地 — Site configuration
// Seller updates these values. No backend required.
// =====================================================================

// Safe storage: use localStorage when available, else an in-memory fallback.
// (Some browsers block localStorage on file:// — this keeps the app working.)
window.GUNBASE_STORE = (function () {
  try {
    var k = "__gb_test__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return window.localStorage;
  } catch (e) {
    var mem = {};
    return {
      getItem: function (k) { return (k in mem) ? mem[k] : null; },
      setItem: function (k, v) { mem[k] = String(v); },
      removeItem: function (k) { delete mem[k]; }
    };
  }
})();

window.GUNBASE_CONFIG = {
  // 收件邮箱：客户提交询盘后，邮件会发到这里。请改成你的真实邮箱。
  sellerEmail: "sales@gunbase-optics.com",

  // WhatsApp 商务号（仅数字，含国家码，例如中国大陆手机号 "8613812345678"）。
  // 留空 "" 则页面上的 WhatsApp 按钮自动隐藏，不会出现死链。
  whatsapp: "886982310045",

  // 公司联系信息（Contact 区块展示 + 询盘邮件抬头）
  companyFull: {
    en: "Gun Base INC. (GunBase 火械基地)",
    zh: "火械基地股份有限公司 (Gun Base INC.)",
    "zh-TW": "火械基地股份有限公司 (Gun Base INC.)",
    es: "Gun Base INC. (GunBase 火械基地)",
    pt: "Gun Base INC. (GunBase 火械基地)",
    fr: "Gun Base INC. (GunBase 火械基地)",
    ar: "Gun Base INC. (GunBase 火械基地)",
    hi: "Gun Base INC. (GunBase 火械基地)"
  },
  address: {
    en: "8F., No. 367, Fuxing N. Rd., Songshan Dist., Taipei City, Taiwan, China",
    zh: "台北市松山区复兴北路367号8楼",
    "zh-TW": "台北市松山區復興北路 367 號 8 樓",
    es: "8F., No. 367, Fuxing N. Rd., Songshan Dist., Taipei City, Taiwan, China",
    pt: "8.º andar, N.º 367, Rua Fuxing Norte, Distrito de Songshan, Cidade de Taipei, Taiwan, China",
    fr: "8e étage, n° 367, rue Fuxing Nord, district de Songshan, ville de Taipei, Taïwan, Chine",
    ar: "الطابق الثامن، رقم ٣٦٧، شارع فوشينغ الشمالي، منطقة سونغشان، مدينة تايبيه، تايوان، الصين",
    hi: "8वीं मंज़िल, नं. 367, फूशिंग नॉर्थ रोड, सोंगशान ज़िला, ताइपे शहर, ताइवान, चीन"
  },
  // 客服响应时间承诺（Contact 区块展示）
  replyTime: {
    en: "We reply within 2 business days.",
    zh: "我们将在 2 个工作日内回复。",
    "zh-TW": "我們將在 2 個工作天內回覆。",
    es: "Respondemos en un plazo de 2 días laborables.",
    pt: "Respondemos em 2 dias úteis.",
    fr: "Nous répondons sous 2 jours ouvrés.",
    ar: "نرد خلال يومي عمل.",
    hi: "हम 2 कार्यदिवसों में उत्तर देते हैं।"
  },

  // 公司抬头（用于询盘邮件 / PDF 抬头）
  company: {
    en: "GUNBASE TACTICAL SUPPLY",
    zh: "火械基地战术供应",
    "zh-TW": "火械基地戰術供應",
    es: "GUNBASE TACTICAL SUPPLY",
    pt: "GUNBASE TACTICAL SUPPLY",
    fr: "GUNBASE TACTICAL SUPPLY",
    ar: "GUNBASE TACTICAL SUPPLY",
    hi: "GUNBASE TACTICAL SUPPLY"
  },

  // 询盘邮件主题前缀
  inquirySubjectPrefix: "[GunBase Inquiry] ",

  // 货币（用于单价显示）
  currency: "USD",

  // 是否在前台展示价格。客户要求「价格暂时不显示、私下洽谈」，故默认 false。
  // false 时：卡片 / 详情 / 询盘邮件 / PDF 一律不出现任何价格数字，
  // 改为显示「价格 · 私下洽谈」提示与直接联系窗口（mailto + WhatsApp）。
  // 将来要开放价格时只需改成 true，原有价格显示逻辑仍可用（可逆开关）。
  // 注：目前各产品数据里的 price 全为 0，线上源码中不含真实价格。
  showPrice: false,

  // 贸易条款（也会出现在 i18n，这里留作扩展）
  tradeTerms: {
    depositRate: 0.5,          // 订金比例 50%
    methods: ["FOB", "EXW"]    // 可选贸易方式
  }
};
