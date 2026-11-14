// =====================================================================
// GunBase 火械基地 — admin.js  (Excel -> products.js)
// =====================================================================
(function () {
  "use strict";
  var I18N = window.I18N;
  var LANGS = window.GUNBASE_LANGS;
  var lang = (function () {
    var v = window.GUNBASE_STORE.getItem("gunbase_lang") || "en";
    return LANGS.filter(function (x) { return x.id === v; }).length ? v : "en";
  })();
  function t(k){ return (I18N[lang]&&I18N[lang][k])||(I18N.en&&I18N.en[k])||k; }
  function $(s){ return document.querySelector(s); }
  function langMeta(){ return LANGS.filter(function (x) { return x.id === lang; })[0] || LANGS[0]; }
  function closeLangMenu(){
    var pick = $("#langPick"); if (pick) pick.classList.remove("is-open");
    var btn = $("#langBtn"); if (btn) btn.setAttribute("aria-expanded", "false");
    var menu = $("#langMenu"); if (menu) menu.setAttribute("aria-hidden", "true");
  }
  function renderLangUI(){
    var meta = langMeta(), code = $("#langCode");
    if (code) code.textContent = meta.label;
    var btn = $("#langBtn"); if (btn) btn.setAttribute("aria-label", t("lang_label"));
    var menu = $("#langMenu"); if (!menu) return;
    menu.innerHTML = "";
    LANGS.forEach(function (m) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "langpick__opt" + (m.id === lang ? " is-active" : "");
      b.setAttribute("role", "option");
      b.setAttribute("aria-selected", m.id === lang ? "true" : "false");
      var strong = document.createElement("b"); strong.setAttribute("dir", "auto"); strong.textContent = m.label;
      var span = document.createElement("span"); span.setAttribute("dir", "auto"); span.textContent = m.name;
      var tick = document.createElement("i"); tick.className = "tick"; tick.textContent = "✓";
      b.appendChild(strong); b.appendChild(span); b.appendChild(tick);
      b.onclick = function () { setLang(m.id); };
      menu.appendChild(b);
    });
  }
  function setLang(l){
    if (!LANGS.filter(function (x) { return x.id === l; }).length) return;
    lang = l;
    window.GUNBASE_STORE.setItem("gunbase_lang", l);
    closeLangMenu(); applyI18n(); renderPreview();
  }
  function bindLangPicker(){
    var btn = $("#langBtn"), pick = $("#langPick"), menu = $("#langMenu");
    if (!btn || !pick || !menu) return;
    btn.onclick = function (e) {
      e.stopPropagation();
      var open = !pick.classList.contains("is-open");
      pick.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      menu.setAttribute("aria-hidden", open ? "false" : "true");
    };
    document.addEventListener("click", function (e) { if (!pick.contains(e.target)) closeLangMenu(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLangMenu(); });
  }

  // header keyword matcher
  function matchHeader(h) {
    h = (h || "").toString().toLowerCase().trim();
    if (!h) return null;
    if (h.indexOf("id") !== -1 && h.length <= 4) return "id";
    if (h.indexOf("category") !== -1 || h === "cat") return "category";
    if (h.indexOf("sku") !== -1) return "sku";
    if (h.indexOf("image") !== -1 || h.indexOf("img") !== -1 || h.indexOf("url") !== -1 || h.indexOf("pic") !== -1) return "image";
    if (h.indexOf("spec") !== -1 && h.indexOf("zh") !== -1) return "specs_zh";
    if (h.indexOf("spec") !== -1 && (h.indexOf("en") !== -1 || h.indexOf("cn") === -1)) return "specs_en";
    if (h.indexOf("spec") !== -1) return "specs_en";
    if (h.indexOf("moq") !== -1 || h.indexOf("min") !== -1) return "moq";
    if (h.indexOf("price") !== -1 || h.indexOf("unit") !== -1) return "price";
    if (h.indexOf("desc") !== -1 && h.indexOf("zh") !== -1) return "desc_zh";
    if (h.indexOf("desc") !== -1 && (h.indexOf("en") !== -1)) return "desc_en";
    if (h.indexOf("desc") !== -1) return "desc_en";
    if (h.indexOf("name") !== -1 && h.indexOf("zh") !== -1) return "name_zh";
    if (h.indexOf("name") !== -1 && (h.indexOf("en") !== -1 || h.indexOf("cn") === -1)) return "name_en";
    if (h.indexOf("name") !== -1) return "name_en";
    return null;
  }

  var parsed = [];

  function parseFile(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var wb = XLSX.read(e.target.result, { type: "array" });
        var ws = wb.Sheets[wb.SheetNames[0]];
        var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        if (!rows.length) { setStatus("Empty file."); return; }
        var headers = rows[0].map(matchHeader);
        parsed = [];
        for (var r = 1; r < rows.length; r++) {
          var row = rows[r];
          if (!row || row.every(function (c) { return c === "" || c == null; })) continue;
          var obj = { name: { en: "", zh: "" }, desc: { en: "", zh: "" }, specs: { en: "", zh: "" } };
          headers.forEach(function (key, i) {
            if (!key) return;
            var v = row[i];
            if (v == null) v = "";
            if (key === "name_en" || key === "name_zh" || key === "desc_en" || key === "desc_zh" || key === "specs_en" || key === "specs_zh") {
              obj[key.split("_")[0]][key.split("_")[1]] = String(v);
            } else if (key === "price" || key === "moq") {
              obj[key] = (key === "price") ? parseFloat(v) || 0 : parseInt(v, 10) || 0;
            } else {
              obj[key] = String(v);
            }
          });
          if (!obj.id) obj.id = (obj.sku || ("P" + r));
          if (!obj.category) obj.category = "scopes";
          parsed.push(obj);
        }
        setStatus(t("admin_loaded").replace("N", parsed.length));
        renderPreview();
      } catch (err) {
        setStatus("Parse error: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function setStatus(m) { $("#status").textContent = m; }

  function renderPreview() {
    if (!parsed.length) { $("#previewArea").innerHTML = ""; return; }
    var html = "<table class='prev'><thead><tr><th>#</th><th>ID</th><th>Cat</th><th>Name EN</th><th>Name ZH</th><th>SKU</th><th>Price</th><th>MOQ</th></tr></thead><tbody>";
    parsed.forEach(function (p, i) {
      html += "<tr><td>" + (i + 1) + "</td><td>" + esc(p.id) + "</td><td>" + esc(p.category) +
        "</td><td>" + esc(p.name.en) + "</td><td>" + esc(p.name.zh) + "</td><td>" + esc(p.sku) +
        "</td><td>" + (p.price > 0 ? p.price : "quote") + "</td><td>" + esc(p.moq) + "</td></tr>";
    });
    html += "</tbody></table>";
    $("#previewArea").innerHTML = html;
  }

  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }

  function downloadJs() {
    if (!parsed.length) { setStatus("Nothing to export yet — upload an Excel first."); return; }
    var text = "window.GUNBASE_PRODUCTS = " + JSON.stringify(parsed, null, 2) + ";\n";
    var blob = new Blob([text], { type: "application/javascript" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "products.js";
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
  }

  function savePreview() {
    if (!parsed.length) { setStatus("Nothing to preview — upload an Excel first."); return; }
    window.GUNBASE_STORE.setItem("gunbase_preview", JSON.stringify(parsed));
    setStatus("Preview saved. Open index.html in this browser to see the updated catalog.");
  }

  function clearPreview() {
    window.GUNBASE_STORE.removeItem("gunbase_preview");
    setStatus("Local preview cleared. index.html now uses the deployed /js/products.js.");
  }

  function downloadTemplate() {
    var headers = ["id","category","name_en","name_zh","sku","desc_en","desc_zh","price","moq","specs_en","specs_zh","image"];
    var example = ["GB-SC-001","scopes","1-6x24 LPVO Scope","1-6x24 战术变倍镜","GB-SC-001","FPP illum reticle.","第一焦平面照明分划。",289,20,"30mm tube","30mm 镜管","https://..."];
    var ws = XLSX.utils.aoa_to_sheet([headers, example]);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "products");
    XLSX.writeFile(wb, "gunbase_template.xlsx");
  }

  function applyI18n() {
    document.querySelectorAll("[data-i18n]").forEach(function (el){ el.textContent = t(el.getAttribute("data-i18n")); });
    var meta = langMeta(), root = document.documentElement;
    root.lang = meta.html;
    root.dir = meta.dir || "ltr";
    root.setAttribute("data-gb-lang", lang);
    if (document.body) document.body.classList.toggle("is-rtl", meta.dir === "rtl");
    renderLangUI();
  }

  function init() {
    applyI18n();
    bindLangPicker();
    $("#file").onchange = function (e) { if (e.target.files[0]) parseFile(e.target.files[0]); };
    $("#dlJs").onclick = downloadJs;
    $("#preview").onclick = savePreview;
    $("#dlTpl").onclick = downloadTemplate;
    $("#clearPrev").onclick = clearPreview;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
