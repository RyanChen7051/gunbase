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
  sellerEmail: "3531885069@qq.com",

  // WhatsApp 商务号（仅数字，含国家码，例如中国大陆手机号 "8613812345678"）。
  // 留空 "" 则页面上的 WhatsApp 按钮自动隐藏，不会出现死链。
  whatsapp: "886982310045",

  // 公司联系信息（Contact 区块展示 + 询盘邮件抬头）
  companyFull: {
    en: "Gun Base INC. (GunBase 火械基地)",
    zh: "火械基地股份有限公司 (Gun Base INC.)"
  },
  address: {
    en: "8F., No. 367, Fuxing N. Rd., Songshan Dist., Taipei City, Taiwan",
    zh: "台北市松山区复兴北路367号8楼"
  },
  // 客服响应时间承诺（Contact 区块展示）
  replyTime: {
    en: "We reply within 2 business days.",
    zh: "我们将在 2 个工作日内回复。"
  },

  // 公司抬头（用于询盘邮件 / PDF 抬头）
  company: {
    en: "GUNBASE TACTICAL SUPPLY",
    zh: "火械基地战术供应"
  },

  // 询盘邮件主题前缀
  inquirySubjectPrefix: "[GunBase Inquiry] ",

  // 货币（用于单价显示）
  currency: "USD",

  // 是否在前台展示价格。客户要求“价格不要呈现”，故默认 false：
  // 即使产品数据里带 price，也不会在卡片 / 详情 / 询盘邮件 / PDF 中显示。
  showPrice: false,

  // 贸易条款（也会出现在 i18n，这里留作扩展）
  tradeTerms: {
    depositRate: 0.5,          // 订金比例 50%
    methods: ["FOB", "EXW"]    // 可选贸易方式
  }
};
