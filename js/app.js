// =====================================================================
// GunBase 火械基地 — app.js
// Bilingual catalog + inquiry cart + quote request (no backend).
// =====================================================================
(function () {
  "use strict";

  var CFG = window.GUNBASE_CONFIG;
  var I18N = window.I18N;
  var CATS = window.GUNBASE_CATEGORIES;

  // ---------- state ----------
  var lang = window.GUNBASE_STORE.getItem("gunbase_lang") || "en";
  // No "All Products" view: visitors always browse one category at a time.
  // Start on the first category that actually has products.
  function defaultCat() {
    var counts = {};
    getProducts().forEach(function (p) { counts[p.category] = (counts[p.category] || 0) + 1; });
    var first = CATS.filter(function (c) { return counts[c.id]; })[0];
    return first ? first.id : (CATS[0] ? CATS[0].id : "scopes");
  }
  var activeCat = defaultCat();
  var searchTerm = "";
  var cart = loadCart();            // [{id, qty}]
  var lastInquiry = null;           // for modal email / print

  // ---------- helpers ----------
  function t(key) {
    return (I18N[lang] && I18N[lang][key]) || (I18N.en && I18N.en[key]) || key;
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function getProducts() {
    var p = window.GUNBASE_STORE.getItem("gunbase_preview");
    if (p) { try { return JSON.parse(p); } catch (e) {} }
    var base = window.GUNBASE_PRODUCTS || [];
    var soon = window.GUNBASE_COMING_SOON || [];
    var extra = window.GUNBASE_SCOPE_SWITCH || [];   // standalone docs (e.g. Scope Switch)
    var others = window.GUNBASE_OTHER_PRODUCTS || []; // partner-supplied / other products
    return base.concat(soon).concat(extra).concat(others);
  }
  function catLabel(id) {
    var c = CATS.filter(function (x) { return x.id === id; })[0];
    return c ? t(c.key) : id;
  }
  // Inject machine-readable Product schema for all real (non-placeholder) items.
  // Google's JS renderer picks this up; helps product-level rich results.
  function injectProductSchema() {
    try {
      var base = (window.GUNBASE_PRODUCTS || [])
        .concat(window.GUNBASE_SCOPE_SWITCH || [])
        .concat(window.GUNBASE_OTHER_PRODUCTS || []);
      var nodes = base.map(function (p) {
        var data = {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": p.name.en,
          "alternateName": p.name.zh,
          "category": catLabel(p.category),
          "brand": { "@type": "Brand", "name": "GunBase" },
          "sku": p.sku,
          "description": (p.desc && (p.desc.en || p.desc.zh)) ? (p.desc.en || p.desc.zh) : (p.name.en + " — " + catLabel(p.category))
        };
        if (p.image) {
          var raw = String(p.image).trim();
          data.image = /^https?:/i.test(raw)
            ? raw
            : "https://gunbase-optics.com/" + (raw.indexOf("/") !== -1 ? raw : "images/" + raw);
        }
        return data;
      });
      if (!nodes.length) return;
      var s = document.createElement("script");
      s.type = "application/ld+json";
      s.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": nodes });
      document.head.appendChild(s);
    } catch (e) {}
  }
  function loadCart() {
    try {
      var raw = JSON.parse(window.GUNBASE_STORE.getItem("gunbase_cart")) || [];
      // Drop IDs that are no longer in the catalog (e.g. discontinued SKUs)
      // so an old saved cart can never break the inquiry form.
      return raw.filter(function (it) { return it && it.id && !!findProduct(it.id); });
    } catch (e) { return []; }
  }
  function saveCart() { window.GUNBASE_STORE.setItem("gunbase_cart", JSON.stringify(cart)); }
  function findProduct(id) {
    return getProducts().filter(function (p) { return p.id === id; })[0];
  }
  function cartTotalQty() {
    return cart.reduce(function (s, it) { return s + it.qty; }, 0);
  }

  // Crosshair placeholder SVG (used on cards / detail when no image)
  function crosshairSVG(size) {
    size = size || 72;
    return '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<circle cx="50" cy="50" r="34" stroke="#f5a623" stroke-width="2" opacity=".5"/>' +
      '<line x1="50" y1="6" x2="50" y2="24" stroke="#f5a623" stroke-width="2" opacity=".7"/>' +
      '<line x1="50" y1="76" x2="50" y2="94" stroke="#f5a623" stroke-width="2" opacity=".7"/>' +
      '<line x1="6" y1="50" x2="24" y2="50" stroke="#f5a623" stroke-width="2" opacity=".7"/>' +
      '<line x1="76" y1="50" x2="94" y2="50" stroke="#f5a623" stroke-width="2" opacity=".7"/>' +
      '<circle cx="50" cy="50" r="5" fill="#f5a623" opacity=".9"/>' +
      '</svg>';
  }
  // Resolve image path: bare filename -> images/ folder; URLs / paths kept as-is
  function imgSrc(p) {
    var im = p && p.image ? String(p.image).trim() : "";
    if (!im) return "";
    if (/^(https?:|data:|\/)/i.test(im)) return im;
    if (im.indexOf("/") !== -1) return im;
    return "images/" + im;
  }
  // Brand watermark for product photos. Rendered as an overlay (not burned into
  // the JPEG) so object-fit: cover, hover zoom and the thumbnail strip can never
  // crop or hide it. A dark plate keeps the white wordmark legible on white photos.
  function wmHtml(p) {
    if (!imgSrc(p)) return "";
    return '<span class="gb-wm" aria-hidden="true"><img src="assets/logo-white.png" alt="" /></span>';
  }
  // On image load error, swap for the crosshair placeholder
  window.gbImgErr = function (img) {
    if (!img || !img.parentNode) return;
    var ph = document.createElement("div");
    ph.className = "card__ph";
    ph.innerHTML = crosshairSVG();
    img.parentNode.replaceChild(ph, img);
  };

  // ---------- optional multi-photo gallery ----------
  // A product may declare "images": [file, ...]. First entry is the main photo;
  // the rest become clickable thumbnails on both the card and the detail modal.
  function galleryHtml(p, variant) {
    if (!p || !p.images || p.images.length < 2) return "";
    var thumbs = p.images.map(function (im, i) {
      var src = imgSrc({ image: im });
      return '<button type="button" class="gb-thumb' + (i === 0 ? " is-active" : "") +
        '" data-gallery-src="' + esc(src) + '" aria-label="Photo ' + (i + 1) + '">' +
        '<img src="' + esc(src) + '" alt="" loading="lazy" /></button>';
    }).join("");
    return '<div class="gb-thumbs ' + variant + '">' + thumbs + "</div>";
  }
  function bindGallery(root) {
    $all("[data-gallery-src]", root).forEach(function (b) {
      b.onclick = function () {
        var wrap = b.parentNode;
        var scope = wrap && wrap.parentNode;
        if (!scope) return;
        var main = scope.querySelector(".gb-main");
        if (main) main.src = b.getAttribute("data-gallery-src");
        $all(".gb-thumb", wrap).forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
      };
    });
  }

  // ---------- i18n apply ----------
  function applyI18n() {
    $all("[data-i18n]").forEach(function (el) { el.textContent = t(el.getAttribute("data-i18n")); });
    $all("[data-i18n-ph]").forEach(function (el) { el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph"))); });
    document.documentElement.lang = (lang === "zh") ? "zh-CN" : "en";
  }

  function setLang(l) {
    lang = l;
    window.GUNBASE_STORE.setItem("gunbase_lang", l);
    applyI18n();
    renderTabs();
    renderGrid();
    renderCart();
    renderTrade();
    buildInquiryList();
    renderContact();
  }

  // ---------- category explorer (no "All Products" entry) ----------
  function renderTabs() {
    var tabs = $("#tabs");
    var counts = {};
    getProducts().forEach(function (p) { counts[p.category] = (counts[p.category] || 0) + 1; });
    // Empty categories are hidden; contact-only (Custom / OEM) always stays.
    var visible = CATS.filter(function (c) { return c.contactOnly || counts[c.id]; });
    if (!visible.filter(function (c) { return c.id === activeCat; }).length) activeCat = defaultCat();
    var cc = $("#catCount");
    if (cc) cc.textContent = visible.length;
    tabs.innerHTML = "";
    visible.forEach(function (c, i) {
      var n = counts[c.id] || 0;
      var badge = c.contactOnly ? t("cat_contact") : n + " " + t("cat_unit");
      var b = document.createElement("button");
      b.type = "button";
      b.className = "cat" + (c.id === activeCat ? " is-active" : "");
      b.setAttribute("aria-pressed", c.id === activeCat ? "true" : "false");
      b.innerHTML =
        '<span class="cat__top">' +
          '<span class="cat__idx">' + (i < 9 ? "0" : "") + (i + 1) + "</span>" +
          '<span class="cat__num">' + esc(badge) + "</span>" +
        "</span>" +
        '<span class="cat__name">' + esc(t(c.key)) + "</span>" +
        '<span class="cat__desc">' + esc(t(c.descKey)) + "</span>" +
        '<span class="cat__go">' + esc(t("cat_explore")) + "</span>";
      b.onclick = function () {
        activeCat = c.id;
        renderTabs();
        renderGrid();
        // On small screens the category wall is tall - bring results into view.
        if (window.innerWidth < 760) {
          var bar = $(".toolbar");
          if (bar && bar.scrollIntoView) bar.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      };
      tabs.appendChild(b);
    });
  }

  // ---------- Custom / OEM lead card: direct contact window ----------
  // Shown as the first card when the "custom" tab is active. It is a contact
  // entry point, not a sellable product, so it never enters the inquiry cart.
  function buildCustomCard() {
    var wa = String(CFG.whatsapp || "").replace(/\D/g, "");
    var email = CFG.sellerEmail;
    var el = document.createElement("div");
    el.className = "card custom-card";
    var points = t("custom_card_points").split("|").map(function (s) {
      return "<li>" + esc(s.trim()) + "</li>";
    }).join("");
    var waRow = wa
      ? '<span>WhatsApp&nbsp; <a href="' + waLink(t("custom_prefill")) + '" target="_blank" rel="noopener">+' + esc(wa) + "</a></span>"
      : "";
    var waBtn = wa
      ? '<a class="btn btn--sm btn--accent" href="' + waLink(t("custom_prefill")) + '" target="_blank" rel="noopener">' + esc(t("custom_btn_wa")) + "</a>"
      : "";
    el.innerHTML =
      '<div class="custom-card__head">' +
        '<span class="custom-card__tag">' + esc(t("custom_card_tag")) + "</span>" +
        '<span class="custom-card__cat">' + esc(t("cat_custom")) + "</span>" +
      "</div>" +
      '<div class="custom-card__body">' +
        "<h3>" + esc(t("custom_card_title")) + "</h3>" +
        "<p>" + esc(t("custom_card_text")) + "</p>" +
        "<ul>" + points + "</ul>" +
        '<div class="custom-card__direct">' +
          "<b>" + esc(t("custom_card_direct")) + "</b>" + waRow +
          '<span>Email&nbsp; <a href="mailto:' + esc(email) + '">' + esc(email) + "</a></span>" +
        "</div>" +
        '<div class="custom-card__actions">' + waBtn +
          '<a class="btn btn--sm" href="mailto:' + esc(email) + "?subject=" + encodeURIComponent(CFG.inquirySubjectPrefix + "Custom / OEM Inquiry") + '">' + esc(t("custom_btn_email")) + "</a>" +
          '<button class="btn btn--sm btn--ghost" type="button" data-custom="form">' + esc(t("custom_btn_form")) + "</button>" +
          '<button class="btn btn--sm btn--ghost" type="button" data-custom="contact">' + esc(t("custom_btn_contact")) + "</button>" +
        "</div>" +
      "</div>";

    var formBtn = el.querySelector('[data-custom="form"]');
    if (formBtn) formBtn.onclick = function () {
      var msg = $("#inquiryForm") && $("#inquiryForm").querySelector('[name="message"]');
      if (msg && !msg.value.trim()) msg.value = t("custom_prefill");
      var sec = $("#inquiry");
      if (sec && sec.scrollIntoView) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      onInquiryListShow();
    };
    var contactBtn = el.querySelector('[data-custom="contact"]');
    if (contactBtn) contactBtn.onclick = function () {
      var sec = $("#contact");
      if (sec && sec.scrollIntoView) sec.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    return el;
  }

  // ---------- product grid ----------
  // A photo-less item is pushed to the bottom of its OWN category, not to the
  // bottom of the whole catalog. Grouping is stable: category order and the
  // original order inside each bucket are both preserved. This only affects
  // display order — the data files, JSON-LD and cart IDs stay untouched.
  function hasPhoto(p) {
    if (imgSrc(p)) return true;
    if (p.images && p.images.length && imgSrc({ image: p.images[0] })) return true;
    return false;
  }
  function noPhotoLast(list) {
    var order = [], groups = {};
    list.forEach(function (p) {
      var k = p.category || "other";
      if (!groups[k]) { groups[k] = { photo: [], plain: [] }; order.push(k); }
      groups[k][hasPhoto(p) ? "photo" : "plain"].push(p);
    });
    var out = [];
    order.forEach(function (k) { out = out.concat(groups[k].photo, groups[k].plain); });
    return out;
  }

  function renderGrid() {
    var grid = $("#grid");
    var list = getProducts();
    // Browsing is category-by-category (no "All Products" view). Searching is
    // the one exception: it spans every category so a keyword is never lost.
    var searching = !!searchTerm;
    if (!searching) list = list.filter(function (p) { return p.category === activeCat; });
    if (searching) {
      var q = searchTerm.toLowerCase();
      list = list.filter(function (p) {
        var s = (p.name.en + " " + p.name.zh + " " + p.sku + " " + p.desc.en + " " + p.desc.zh).toLowerCase();
        return s.indexOf(q) !== -1;
      });
    }
    list = noPhotoLast(list);
    grid.innerHTML = "";
    var showCustom = !searching && (activeCat === "custom");
    if (showCustom) grid.appendChild(buildCustomCard());
    var cur = CATS.filter(function (c) { return c.id === activeCat; })[0];
    var catName = searching ? t("cat_search") : (cur ? t(cur.key) : "");
    $("#count").textContent = catName + (catName ? " / " : "") + (showCustom
      ? (list.length ? t("custom_count") + " - " + list.length + " " + t("result_count") : t("custom_count"))
      : list.length + " " + t("result_count"));
    $("#noResult").style.display = (list.length || showCustom) ? "none" : "block";

    list.forEach(function (p) {
      var card = document.createElement("div");
      card.className = "card" + (p.comingSoon ? " card--soon" : "");
      var mediaInner = imgSrc(p)
        ? '<img class="gb-main" src="' + esc(imgSrc(p)) + '" alt="' + esc(catLabel(p.category) + " — " + p.name.en) + '" loading="lazy" onerror="gbImgErr(this)" />'
        : '<div class="card__ph">' + crosshairSVG() + '</div>';
      var media =
        '<div class="card__media">' + mediaInner +
          galleryHtml(p, "gb-thumbs--card") +
          wmHtml(p) +
          '<span class="card__cat">' + esc(catLabel(p.category)) + '</span>' +
          (p.comingSoon ? '<span class="card__soon-badge">' + t("coming_soon") + '</span>' : '') +
        '</div>';
      var priceHtml = "";
      if (!CFG.showPrice) {
        // Prices are intentionally not published. Show a clear "private
        // negotiation" cue instead of an empty slot so buyers know what to do.
        priceHtml = '<span class="card__price card__price--private">' + t("price_private") + "</span>";
      } else if (p.price > 0) {
        priceHtml = '<span class="card__price">' + CFG.currency + " " + p.price + "</span>";
      } else {
        priceHtml = '<span>' + t("quote_on_request") + "</span>";
      }
      card.innerHTML =
        media +
        '<div class="card__body">' +
          '<div class="card__name">' + esc(p.name[lang]) + '<span class="card__name_zh">' + esc(p.name[lang === "zh" ? "en" : "zh"]) + "</span></div>" +
          '<div class="card__sku">' + t("field_sku") + ": " + esc(p.sku) + "</div>" +
          '<div class="card__meta">' +
            "<div><b>" + t("field_moq") + "</b>" + p.moq + "</div>" +
            (priceHtml ? "<div>" + priceHtml + "</div>" : "") +
          "</div>" +
          (p.comingSoon
            ? '<div class="card__soon">' + t("coming_soon") + '</div>'
            : '<div class="card__actions">' +
                '<button class="btn btn--sm" data-add="' + esc(p.id) + '">' + t("add_to_inquiry") + "</button>" +
                '<button class="btn btn--sm btn--ghost" data-detail="' + esc(p.id) + '">' + t("view_details") + "</button>" +
              '</div>') +
        "</div>";
      grid.appendChild(card);
    });

    $all("[data-add]", grid).forEach(function (b) {
      b.onclick = function () { addToCart(b.getAttribute("data-add")); };
    });
    $all("[data-detail]", grid).forEach(function (b) {
      b.onclick = function () { openDetail(findProduct(b.getAttribute("data-detail"))); };
    });
    bindGallery(grid);
  }

  // ---------- private pricing negotiation (no public price) ----------
  // No price figure is ever rendered. These helpers build pre-filled direct
  // contact links so a buyer can start a confidential pricing discussion.
  function pricingMail(p) {
    var subject = t("price_talk_subject") + p.sku + " - " + (lang === "zh" ? p.name.zh : p.name.en);
    var body = t("price_talk_body")
      .replace(/\{sku\}/g, p.sku)
      .replace(/\{name\}/g, p.name.en + " / " + p.name.zh);
    return "mailto:" + CFG.sellerEmail +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  }
  function pricingWa(p) {
    var msg = lang === "zh"
      ? "您好 GunBase，我想私下洽谈 " + p.sku + "（" + p.name.zh + "）的价格，请与我联系并提供报价。"
      : "Hello GunBase, I'd like to discuss pricing privately for " + p.sku + " (" + p.name.en + "). Please contact me with a quotation.";
    return waLink(msg);
  }
  function pricingBlock(p) {
    if (CFG.showPrice) return "";
    return '<div class="detail__pricing">' +
      '<h4>' + t("price_private_title") + '</h4>' +
      '<p>' + t("price_private_hint") + '</p>' +
      '<div class="detail__pricing-actions">' +
        '<a class="btn btn--sm btn--accent" href="' + esc(pricingMail(p)) + '">' + t("price_talk_btn") + '</a>' +
        (CFG.whatsapp
          ? '<a class="btn btn--sm btn--ghost" target="_blank" rel="noopener" href="' + esc(pricingWa(p)) + '">' + t("price_talk_wa") + '</a>'
          : '') +
      '</div></div>';
  }

  // ---------- product detail modal ----------
  function openDetail(p) {
    if (!p || p.comingSoon) return;
    var body = $("#detailBody");
    if (!body) return;
    var media = imgSrc(p)
      ? '<img class="gb-main" src="' + esc(imgSrc(p)) + '" alt="' + esc(catLabel(p.category) + " — " + p.name.en) + '" onerror="gbImgErr(this)" />'
      : '<div class="detail__ph">' + crosshairSVG(120) + '</div>';
    var enSpec = (p.specs && p.specs.en) ? p.specs.en : "";
    var zhSpec = (p.specs && p.specs.zh) ? p.specs.zh : "";
    var specHtml = "";
    if (enSpec) {
      specHtml += '<div class="detail__spec"><h4>' + t("field_specs") + ' / Key Specs</h4><p>' +
        esc(enSpec).replace(/\|/g, " · ") + '</p></div>';
    }
    if (zhSpec) {
      specHtml += '<div class="detail__spec"><h4>' + t("specs_zh_full") + '</h4><p class="detail__spec_zh">' +
        esc(zhSpec).replace(/\n/g, "<br>") + '</p></div>';
    }
    body.innerHTML =
      '<div class="detail__media">' + media + galleryHtml(p, "gb-thumbs--detail") + wmHtml(p) + '<span class="card__cat">' + esc(catLabel(p.category)) + '</span></div>' +
      '<div class="detail__info">' +
        '<h3 class="detail__name">' + esc(p.name[lang]) +
          '<span class="card__name_zh">' + esc(p.name[lang === "zh" ? "en" : "zh"]) + '</span></h3>' +
        '<div class="detail__sku">' + t("field_sku") + ": " + esc(p.sku) + "　·　" + t("field_moq") + ": " + (p.moq || "—") + '</div>' +
        (p.desc && p.desc[lang] ? '<p class="detail__desc">' + esc(p.desc[lang]) + '</p>' : '') +
        pricingBlock(p) +
        specHtml +
        '<button class="btn" data-add="' + esc(p.id) + '" style="margin-top:16px">' + t("add_to_inquiry") + '</button>' +
      '</div>';
    var addBtn = body.querySelector('[data-add]');
    if (addBtn) addBtn.onclick = function () { addToCart(p.id); closeDetail(); };
    bindGallery(body);
    $("#detailModal").classList.add("open");
  }
  function closeDetail() { var m = $("#detailModal"); if (m) m.classList.remove("open"); }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---------- cart ----------
  function addToCart(id) {
    var p = findProduct(id);
    if (!p || p.comingSoon) return;
    var it = cart.filter(function (x) { return x.id === id; })[0];
    if (it) it.qty += 1; else cart.push({ id: id, qty: 1 });
    saveCart();
    renderCart();
    buildInquiryList();
    toast(t("added"));
  }
  function setQty(id, qty) {
    qty = parseInt(qty, 10);
    if (isNaN(qty) || qty < 1) qty = 1;
    var it = cart.filter(function (x) { return x.id === id; })[0];
    if (it) it.qty = qty;
    saveCart(); renderCart(); buildInquiryList();
  }
  function removeFromCart(id) {
    cart = cart.filter(function (x) { return x.id !== id; });
    saveCart(); renderCart(); buildInquiryList();
  }
  function clearCart() {
    cart = []; saveCart(); renderCart(); buildInquiryList();
  }

  function renderCart() {
    var body = $("#drawerBody");
    var total = cartTotalQty();
    var badge = $("#cartBadge");
    if (total > 0) { badge.style.display = "flex"; badge.textContent = total; }
    else badge.style.display = "none";
    $("#cartTotal").textContent = total;

    if (!cart.length) {
      body.innerHTML = '<div class="drawer__empty">' + t("cart_empty") + "</div>";
      return;
    }
    body.innerHTML = "";
    cart.forEach(function (it) {
      var p = findProduct(it.id);
      if (!p) return;
      var row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML =
        '<div><div class="cart-item__name">' + esc(p.name[lang]) + "</div>" +
        '<div class="cart-item__sku">' + esc(p.sku) + "</div></div>" +
        '<div class="cart-item__right">' +
          '<div class="qty">' +
            '<button data-dec="' + esc(p.id) + '">−</button>' +
            '<input type="number" min="1" value="' + it.qty + '" data-qty="' + esc(p.id) + '" />' +
            '<button data-inc="' + esc(p.id) + '">+</button>' +
          "</div>" +
          '<button class="cart-item__remove" data-rm="' + esc(p.id) + '">' + t("cart_remove") + "</button>" +
        "</div>";
      body.appendChild(row);
    });
    $all("[data-dec]", body).forEach(function (b) { b.onclick = function () { var it = cart.filter(function (x){return x.id===b.getAttribute("data-dec");})[0]; setQty(b.getAttribute("data-dec"), (it?it.qty:1)-1); }; });
    $all("[data-inc]", body).forEach(function (b) { b.onclick = function () { var it = cart.filter(function (x){return x.id===b.getAttribute("data-inc");})[0]; setQty(b.getAttribute("data-inc"), (it?it.qty:1)+1); }; });
    $all("[data-qty]", body).forEach(function (inp) { inp.onchange = function () { setQty(inp.getAttribute("data-qty"), inp.value); }; });
    $all("[data-rm]", body).forEach(function (b) { b.onclick = function () { removeFromCart(b.getAttribute("data-rm")); }; });
  }

  // inquiry form product list (mirrors cart)
  function buildInquiryList() {
    var ul = $("#inquiryList");
    if (!ul) return;
    ul.innerHTML = "";
    if (!cart.length) {
      var li = document.createElement("li");
      li.style.color = "var(--muted)";
      li.textContent = t("cart_empty");
      ul.appendChild(li);
      return;
    }
    cart.forEach(function (it) {
      var p = findProduct(it.id);
      if (!p) return;
      var li = document.createElement("li");
      li.innerHTML = "<span>" + esc(p.name[lang]) + " · " + esc(p.sku) + "</span><span>×" + it.qty + "</span>";
      ul.appendChild(li);
    });
  }

  // ---------- trade term radios ----------
  function renderTrade() {
    var row = $("#tradeRow");
    if (!row) return;
    row.innerHTML = "";
    CFG.tradeTerms.methods.forEach(function (m) {
      var key = m === "FOB" ? "trade_fob" : (m === "EXW" ? "trade_exw" : null);
      var label = document.createElement("label");
      label.className = "radio";
      label.innerHTML = '<input type="radio" name="trade" value="' + m + '" /> ' + (key ? t(key) : m);
      row.appendChild(label);
    });
    // hint
    var hint = document.createElement("div");
    hint.style.cssText = "width:100%;font-size:12px;color:var(--muted);font-weight:600";
    hint.textContent = t("trade_hint");
    row.appendChild(hint);
  }

  // ---------- contact section & WhatsApp ----------
  function waLink(text) {
    var msg = text || (lang === "zh"
      ? "您好 GunBase，我想咨询贵司产品。"
      : "Hello GunBase, I'd like to inquire about your products.");
    return "https://wa.me/" + CFG.whatsapp + "?text=" + encodeURIComponent(msg);
  }
  function renderContact() {
    var emailEl = $("#contactEmailText");
    if (!emailEl) return;
    emailEl.textContent = CFG.sellerEmail;
    $("#contactEmailBtn").href = "mailto:" + CFG.sellerEmail + "?subject=" + encodeURIComponent(CFG.inquirySubjectPrefix + "General Inquiry");
    $("#contactCompany").textContent = CFG.companyFull[lang];
    $("#contactAddress").textContent = CFG.address[lang];
    $("#contactHours").textContent = t("contact_hours_val");
    var wa = String(CFG.whatsapp || "").replace(/\D/g, "");
    var waCard = $("#contactWaCard");
    var waFab = $("#waBtn");
    if (wa) {
      waCard.style.display = "";
      $("#contactWaNumber").textContent = "+" + wa;
      $("#contactWaBtn").href = waLink();
      waFab.style.display = "flex";
      waFab.href = waLink();
    } else {
      waCard.style.display = "none";
      waFab.style.display = "none";
    }
  }
  function copyEmail() {
    var email = CFG.sellerEmail;
    var done = function () { toast(t("contact_copied")); };
    var fallback = function () {
      var ta = document.createElement("textarea");
      ta.value = email;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (e) {}
      ta.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(done).catch(fallback);
    } else fallback();
  }
  function openWhatsApp() {
    if (!lastInquiry || !CFG.whatsapp) return;
    window.open(waLink(emailBody(lastInquiry)), "_blank");
  }

  // ---------- form submit ----------
  function validate() {
    var ok = true;
    var form = $("#inquiryForm");
    ["company", "contact", "email", "phone", "country"].forEach(function (n) {
      var input = form.querySelector('[name="' + n + '"]');
      var field = input.closest(".field");
      field.classList.remove("invalid");
      var v = input.value.trim();
      if (!v) { field.classList.add("invalid"); ok = false; }
      if (n === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { field.classList.add("invalid"); ok = false; }
    });
    // cart — allow a general inquiry without products if the client wrote a message
    var msgVal = (form.querySelector('[name="message"]').value || "").trim();
    $("#cartErr").textContent = t("req_cart_or_msg");
    $("#cartErr").style.display = (cart.length || msgVal) ? "none" : "block";
    if (!cart.length && !msgVal) ok = false;
    // trade
    var trade = form.querySelector('input[name="trade"]:checked');
    var tradeField = form.querySelector("#tradeRow").closest(".field");
    tradeField.classList.remove("invalid");
    if (!trade) { tradeField.classList.add("invalid"); ok = false; }
    return ok ? { trade: trade.value } : null;
  }

  function buildInquiry() {
    var form = $("#inquiryForm");
    var fd = new FormData(form);
    var items = cart.map(function (it) {
      var p = findProduct(it.id);
      if (!p) return null;
      return { sku: p.sku, name: p.name, qty: it.qty, price: p.price };
    }).filter(Boolean);
    var tradeEl = form.querySelector('input[name="trade"]:checked');
    return {
      company: (fd.get("company") || "").trim(),
      contact: (fd.get("contact") || "").trim(),
      email: (fd.get("email") || "").trim(),
      phone: (fd.get("phone") || "").trim(),
      country: (fd.get("country") || "").trim(),
      delivery: (fd.get("delivery") || "").trim(),
      trade: tradeEl ? tradeEl.value : "",
      message: (fd.get("message") || "").trim(),
      items: items,
      date: new Date().toISOString()
    };
  }

  function onInquiryListShow() { buildInquiryList(); }

  function handleSubmit(e) {
    e.preventDefault();
    var v = validate();
    if (!v) {
      // scroll to first invalid
    var bad = $(".field.invalid");
    if (bad && bad.scrollIntoView) bad.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    lastInquiry = buildInquiry();
    var n = lastInquiry.items.reduce(function (s, x) { return s + x.qty; }, 0);
    $("#modalSummary").textContent =
      lastInquiry.company + " · " + n + " " + t("result_count") + " · " + lastInquiry.trade;
    openModal();
  }

  // ---------- email / print ----------
  function emailBody(inq) {
    var L = function (k) { return t(k); };
    var lines = [];
    lines.push("=== GUNBASE INQUIRY / 火械基地询盘 ===");
    lines.push("");
    lines.push(L("f_company") + ": " + inq.company);
    lines.push(L("f_contact") + ": " + inq.contact);
    lines.push(L("f_email") + ": " + inq.email);
    lines.push(L("f_phone") + ": " + inq.phone);
    lines.push(L("f_country") + ": " + inq.country);
    lines.push(L("f_trade") + ": " + inq.trade);
    if (inq.delivery) lines.push(L("f_delivery") + ": " + inq.delivery);
    lines.push("");
    lines.push(L("f_products") + ":");
    inq.items.forEach(function (it) {
      var line = "  - " + it.sku + " | " + it.name.en + " / " + it.name.zh + " | Qty: " + it.qty;
      if (CFG.showPrice) line += (it.price > 0 ? " | " + CFG.currency + " " + it.price : " | " + L("quote_on_request"));
      lines.push(line);
    });
    if (inq.message) { lines.push(""); lines.push(L("f_message") + ": " + inq.message); }
    lines.push("");
    if (!CFG.showPrice) {
      lines.push("--- " + L("price_private_title") + " ---");
      lines.push(L("price_mail_note"));
      lines.push("");
    }
    lines.push("--- " + L("terms_title") + " ---");
    lines.push(L("terms_deposit"));
    lines.push(L("terms_balance"));
    lines.push(L("terms_methods"));
    return lines.join("\n");
  }

  function openEmail() {
    if (!lastInquiry) return;
    var subject = CFG.inquirySubjectPrefix + lastInquiry.company;
    var body = emailBody(lastInquiry);
    var href = "mailto:" + CFG.sellerEmail + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    window.location.href = href;
  }

  function printPdf() {
    if (!lastInquiry) return;
    var inq = lastInquiry;
    var priceCol = !!CFG.showPrice;
    var rows = inq.items.map(function (it) {
      var cells = "<td>" + esc(it.sku) + "</td><td>" + esc(it.name.en) + "<br><small>" + esc(it.name.zh) + "</small></td><td style='text-align:center'>" + it.qty + "</td>";
      if (priceCol) cells += "<td>" + (it.price > 0 ? CFG.currency + " " + it.price : t("quote_on_request")) + "</td>";
      return "<tr>" + cells + "</tr>";
    }).join("");
    var html =
      "<!doctype html><html><head><meta charset='utf-8'><title>GunBase Inquiry</title>" +
      "<style>body{font-family:Arial,'PingFang SC',sans-serif;color:#111;max-width:760px;margin:24px auto;padding:0 16px}" +
      "h1{font-size:22px;letter-spacing:.05em;text-transform:uppercase;margin:0}" +
      ".sub{color:#666;font-size:12px;letter-spacing:.2em;text-transform:uppercase}" +
      ".bar{height:4px;background:#0e0e0e;margin:10px 0 20px}" +
      "table{width:100%;border-collapse:collapse;margin-top:14px;font-size:13px}" +
      "th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#0e0e0e;color:#fff;text-transform:uppercase;font-size:11px;letter-spacing:.05em}" +
      ".info{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;font-size:14px;margin-top:10px}" +
      ".info b{display:block;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.04em}" +
      ".terms{margin-top:20px;font-size:13px;background:#f4f3ef;padding:14px;border-left:4px solid #c0392b}" +
      "@media print{body{margin:0}}</style></head><body>" +
      "<div class='sub'>" + esc(CFG.company[lang]) + "</div>" +
      "<h1>GunBase Inquiry / 火械基地询盘</h1><div class='bar'></div>" +
      "<div class='info'>" +
        "<div><b>" + t("f_company") + "</b>" + esc(inq.company) + "</div>" +
        "<div><b>" + t("f_contact") + "</b>" + esc(inq.contact) + "</div>" +
        "<div><b>" + t("f_email") + "</b>" + esc(inq.email) + "</div>" +
        "<div><b>" + t("f_phone") + "</b>" + esc(inq.phone) + "</div>" +
        "<div><b>" + t("f_country") + "</b>" + esc(inq.country) + "</div>" +
        "<div><b>" + t("f_trade") + "</b>" + esc(inq.trade) + "</div>" +
        (inq.delivery ? "<div><b>" + t("f_delivery") + "</b>" + esc(inq.delivery) + "</div>" : "") +
      "</div>" +
      "<table><thead><tr><th>SKU</th><th>" + t("f_products") + "</th><th style='text-align:center'>Qty</th>" +
        (priceCol ? "<th>Price</th>" : "") + "</tr></thead><tbody>" + rows + "</tbody></table>" +
      (inq.message ? "<p style='margin-top:14px'><b>" + t("f_message") + ":</b> " + esc(inq.message) + "</p>" : "") +
      (!priceCol ? "<div class='terms' style='border-left-color:#c9841a'><b>" + t("price_private_title") + "</b><br>" + t("price_mail_note") + "</div>" : "") +
      "<div class='terms'><b>" + t("terms_title") + "</b><br>" + t("terms_deposit") + "<br>" + t("terms_balance") + "<br>" + t("terms_methods") + "</div>" +
      "<p style='margin-top:18px;color:#888;font-size:11px'>" + esc(inq.date) + "</p>" +
      "</body></html>";
    var w = window.open("", "_blank");
    if (!w) { alert("Popup blocked. Please allow popups to save the PDF."); return; }
    w.document.open(); w.document.write(html); w.document.close();
    setTimeout(function () { w.focus(); w.print(); }, 350);
  }

  // ---------- drawer / modal ----------
  function openDrawer() { $("#drawer").classList.add("open"); $("#drawerMask").classList.add("open"); }
  function closeDrawer() { $("#drawer").classList.remove("open"); $("#drawerMask").classList.remove("open"); }
  function openModal() { $("#modal").classList.add("open"); }
  function closeModal() { $("#modal").classList.remove("open"); }

  // ---------- toast ----------
  function toast(msg) {
    var el = document.createElement("div");
    el.textContent = msg;
    el.style.cssText = "position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:var(--panel-3);color:var(--ink);padding:11px 20px;font-weight:700;font-size:13px;letter-spacing:.04em;z-index:95;border:1px solid var(--line);border-radius:8px;box-shadow:var(--shadow)";
    document.body.appendChild(el);
    setTimeout(function () { el.style.transition = "opacity .3s"; el.style.opacity = "0"; }, 900);
    setTimeout(function () { el.remove(); }, 1250);
  }

  // ---------- PWA install ----------
  var deferredPrompt = null;
  function showInstall() {
    if (window.GUNBASE_STORE.getItem("gunbase_installed")) return;
    $("#installBar").classList.add("show");
  }

  // ---------- force update catalog (clear SW cache + reload) ----------
  function forceUpdate() {
    var btn = $("#updateBtn");
    if (btn) btn.classList.add("is-busy");
    toast(t("update_checking"));
    var reload = function () {
      setTimeout(function () { window.location.reload(true); }, 700);
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then(function (reg) {
        var upd = reg ? reg.update() : Promise.resolve();
        Promise.resolve(upd).then(function () {
          if ("caches" in window) {
            caches.keys().then(function (ks) {
              return Promise.all(ks.map(function (k) { return caches.delete(k); }));
            }).then(reload).catch(reload);
          } else { reload(); }
        }).catch(reload);
      }).catch(reload);
    } else { reload(); }
  }

  // ---------- init ----------
  function init() {
    // Deep link: #custom opens the Custom / OEM contact tab directly,
    // so sales can share a direct URL to the contact window.
    var hashCat = (window.location.hash || "").replace(/^#/, "");
    if (CATS.filter(function (c) { return c.id === hashCat; }).length) activeCat = hashCat;
    applyI18n();
    renderTabs();
    renderGrid();
    injectProductSchema();
    renderCart();
    renderTrade();
    buildInquiryList();

    $("#langBtn").onclick = function () { setLang(lang === "en" ? "zh" : "en"); };
    $("#search").oninput = function (e) { searchTerm = e.target.value; renderGrid(); };

    $("#cartToggle").onclick = openDrawer;
    $("#drawerClose").onclick = closeDrawer;
    $("#drawerMask").onclick = closeDrawer;
    $("#cartClear").onclick = clearCart;
    $("#cartCheckout").onclick = function () { closeDrawer(); document.getElementById("inquiry").scrollIntoView({ behavior: "smooth" }); onInquiryListShow(); };

    $("#inquiryForm").addEventListener("submit", handleSubmit);
    $("#modalClose").onclick = closeModal;
    $("#modal").addEventListener("click", function (e) { if (e.target === $("#modal")) closeModal(); });
    $("#detailClose").onclick = closeDetail;
    $("#detailModal").addEventListener("click", function (e) { if (e.target === $("#detailModal")) closeDetail(); });
    $("#sendEmail").onclick = openEmail;
    $("#printPdf").onclick = printPdf;

    // Contact section
    renderContact();
    $("#copyEmailBtn").onclick = copyEmail;
    var sendWa = $("#sendWa");
    if (CFG.whatsapp && sendWa) {
      sendWa.style.display = "";
      sendWa.onclick = openWhatsApp;
    }

    $("#installBtn").onclick = function () {
      if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then(function () { deferredPrompt = null; }); }
      $("#installBar").classList.remove("show");
    };
    $("#installClose").onclick = function () { $("#installBar").classList.remove("show"); window.GUNBASE_STORE.setItem("gunbase_installed", "1"); };

    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault(); deferredPrompt = e; showInstall();
    });
    window.addEventListener("appinstalled", function () { window.GUNBASE_STORE.setItem("gunbase_installed", "1"); $("#installBar").classList.remove("show"); });

    // Floating controls: Home & Update
    $("#homeBtn").onclick = function () {
      try { window.scrollTo({ top: 0, behavior: "smooth" }); }
      catch (e) { window.scrollTo(0, 0); }
    };
    $("#updateBtn").onclick = forceUpdate;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }

    showInstall();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
