/* みらいマート（架空）練習用の動き。外から何も読み込まない・乱数を使わない。 */
(function (root) {
  "use strict";
  var P = root.MIRAI_PRODUCTS, CATS = root.MIRAI_CATEGORIES;
  var W = "日月火水木金土";
  var TEIKI_RATE = 0.05; // 定期おトク便の割引（商品の小計の5%・1円未満切り捨て）
  var MAX_QTY = 20;

  /* ---------- 計算（node でも同じものを使って答えを確かめる） ---------- */
  function byId(id) { for (var i = 0; i < P.length; i++) if (P[i].id === id) return P[i]; return null; }
  function norm(s) { return String(s || "").normalize("NFKC").toLowerCase(); }
  function fmtDate(d) {
    if (!d) return "";
    var a = d.split("-"), dt = new Date(Date.UTC(+a[0], +a[1] - 1, +a[2]));
    return (+a[1]) + "月" + (+a[2]) + "日（" + W[dt.getUTCDay()] + "）";
  }
  function yen(n) { return n.toLocaleString("ja-JP") + "円"; }
  function defaultFilter() {
    return { q: "", cat: "all", min: "", max: "", rating: "0", freeShip: false, by: "", inStock: false, sort: "rec" };
  }
  function matches(p, f) {
    if (f.cat && f.cat !== "all" && p.cat !== f.cat) return false;
    var hay = norm(p.name + " " + p.maker + " " + p.kw + " " + catName(p.cat));
    var toks = norm(f.q).split(/\s+/).filter(Boolean);
    for (var i = 0; i < toks.length; i++) if (hay.indexOf(toks[i]) < 0) return false;
    if (f.min !== "" && f.min != null && p.price < +f.min) return false;
    if (f.max !== "" && f.max != null && p.price > +f.max) return false;
    if (+f.rating > 0 && p.rating < +f.rating) return false;
    if (f.freeShip && p.ship > 0) return false;
    if (f.by && (!p.date || p.date > f.by)) return false;
    if (f.inStock && !p.stock) return false;
    return true;
  }
  function list(f) {
    var hit = P.filter(function (p) { return matches(p, f); });
    var cmp = {
      rec: function (a, b) { return a.rec - b.rec || (a.id < b.id ? -1 : 1); },
      price: function (a, b) { return a.price - b.price || a.rec - b.rec; },
      rating: function (a, b) { return b.rating - a.rating || b.count - a.count || a.rec - b.rec; }
    }[f.sort] || null;
    var pr = hit.filter(function (p) { return p.pr; }).sort(function (a, b) { return a.id < b.id ? -1 : 1; });
    var rest = hit.filter(function (p) { return !p.pr; }).sort(cmp || function () { return 0; });
    return pr.concat(rest); // 広告（PR）は並べ替えにかかわらず一番上
  }
  /* 送料は「商品ごとに1回」：同じ商品をいくつ買っても、その商品の送料は1回分 */
  function totals(cart, teiki) {
    var lines = [], sub = 0, ship = 0;
    cart.forEach(function (c) {
      var p = byId(c.id); if (!p) return;
      var amt = p.price * c.qty;
      lines.push({ p: p, qty: c.qty, amount: amt });
      sub += amt; ship += p.ship;
    });
    var disc = teiki ? Math.floor(sub * TEIKI_RATE) : 0;
    return { lines: lines, sub: sub, ship: ship, disc: disc, total: sub - disc + ship };
  }
  function catName(id) { for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].name; return ""; }

  root.MIRAI_LOGIC = { byId: byId, list: list, totals: totals, fmtDate: fmtDate, defaultFilter: defaultFilter, matches: matches };
  if (typeof document === "undefined") return; // node で計算だけ使うとき

  /* ---------- 状態（保存できればブラウザに保存） ---------- */
  var KEY = "miraiMart.v1";
  function defaultForm() {
    return { company: "", dept: "", name: "", zip: "", addr: "", tel: "", when: "指定なし", pay: "", teiki: true };
  }
  var S = { cart: [], form: defaultForm(), f: defaultFilter(), ok: false, last: null, flash: "" };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved) {
      S.cart = (saved.cart || []).filter(function (c) { return byId(c.id); });
      S.form = Object.assign(defaultForm(), saved.form || {});
      S.f = Object.assign(defaultFilter(), saved.f || {});
      S.ok = !!saved.ok; S.last = saved.last || null;
    }
  } catch (e) { /* 保存が使えなくても動く */ }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ cart: S.cart, form: S.form, f: S.f, ok: S.ok, last: S.last })); } catch (e) {}
  }

  var app = document.getElementById("app");
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function stars(r) { var n = Math.round(r); return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); }
  function cartCount() { return S.cart.reduce(function (a, c) { return a + c.qty; }, 0); }

  /* ---------- 商品の絵（インラインの SVG・数字は入れない） ---------- */
  var TINT = { office: "#E8EEF8", pc: "#E6F4F2", daily: "#F1ECF7", drink: "#E9F3E6" };
  var ICON = {
    cable: '<path d="M40 85 C 70 20, 130 110, 160 40" stroke="#334155" stroke-width="6" fill="none"/><rect x="26" y="78" width="22" height="16" rx="3" fill="#475569"/><rect x="152" y="30" width="22" height="16" rx="3" fill="#475569"/>',
    pen: '<g transform="rotate(-30 100 60)"><rect x="40" y="52" width="110" height="16" rx="6" fill="#334155"/><polygon points="150,52 170,60 150,68" fill="#94A3B8"/><rect x="40" y="52" width="22" height="16" rx="4" fill="#0F766E"/></g>',
    paper: '<rect x="62" y="22" width="76" height="80" fill="#fff" stroke="#94A3B8" stroke-width="3"/><rect x="54" y="30" width="76" height="80" fill="#fff" stroke="#64748B" stroke-width="3"/><line x1="66" y1="50" x2="118" y2="50" stroke="#CBD5E1" stroke-width="4"/><line x1="66" y1="64" x2="118" y2="64" stroke="#CBD5E1" stroke-width="4"/>',
    file: '<path d="M60 20 H125 L145 40 V105 H60 Z" fill="#fff" fill-opacity=".7" stroke="#64748B" stroke-width="3"/><path d="M125 20 V40 H145" fill="none" stroke="#64748B" stroke-width="3"/>',
    note: '<rect x="64" y="24" width="72" height="72" fill="#BFE3DD" stroke="#5EA79B" stroke-width="3"/><path d="M118 96 L136 78" stroke="#5EA79B" stroke-width="3"/>',
    bottle: '<rect x="88" y="14" width="24" height="14" rx="3" fill="#0F766E"/><path d="M84 30 H116 L124 48 V104 Q124 110 118 110 H82 Q76 110 76 104 V48 Z" fill="#fff" stroke="#64748B" stroke-width="3"/><rect x="78" y="62" width="44" height="22" fill="#CDE7E3"/>',
    cup: '<path d="M64 40 H128 L120 100 H72 Z" fill="#fff" stroke="#64748B" stroke-width="3"/><path d="M128 52 Q148 56 126 80" fill="none" stroke="#64748B" stroke-width="3"/><path d="M84 30 q6 -10 0 -18 M100 30 q6 -10 0 -18" stroke="#94A3B8" stroke-width="3" fill="none"/>',
    mouse: '<ellipse cx="100" cy="64" rx="30" ry="42" fill="#fff" stroke="#334155" stroke-width="3"/><line x1="100" y1="22" x2="100" y2="54" stroke="#334155" stroke-width="3"/>',
    usb: '<rect x="70" y="40" width="70" height="40" rx="6" fill="#94A3B8"/><rect x="140" y="48" width="22" height="24" fill="#CBD5E1" stroke="#64748B" stroke-width="2"/>',
    box: '<path d="M50 44 L100 24 L150 44 L150 96 L100 116 L50 96 Z" fill="#fff" stroke="#64748B" stroke-width="3"/><path d="M50 44 L100 64 L150 44 M100 64 V116" fill="none" stroke="#64748B" stroke-width="3"/>',
    bag: '<path d="M64 40 H136 L130 108 H70 Z" fill="#fff" fill-opacity=".8" stroke="#64748B" stroke-width="3"/><path d="M84 40 Q100 14 116 40" fill="none" stroke="#64748B" stroke-width="3"/>'
  };
  function pic(p, h) {
    return '<svg class="pic" viewBox="0 0 200 120" width="100%" height="' + (h || 120) + '" role="img" aria-label="商品の絵（イメージ）"><rect width="200" height="120" fill="' + TINT[p.cat] + '"/>' + (ICON[p.icon] || ICON.box) + "</svg>";
  }
  function shipText(p) { return p.ship === 0 ? '<span class="ship free">送料無料</span>' : '<span class="ship cost">送料 ' + yen(p.ship) + "</span>"; }
  function delivText(p) { return p.stock ? "お届け予定：" + fmtDate(p.date) : '<span class="badge badge-out">在庫切れ</span>入荷未定'; }

  /* ---------- カテゴリの帯 ---------- */
  function renderCats() {
    document.getElementById("cats").innerHTML = CATS.map(function (c) {
      return '<button type="button" data-act="cat" data-cat="' + c.id + '" aria-pressed="' + (S.f.cat === c.id) + '">' + c.name + "</button>";
    }).join("");
    document.getElementById("q").value = S.f.q;
    document.getElementById("cartLink").textContent = "カートを見る（" + cartCount() + "点）";
  }

  /* ---------- 一覧 ---------- */
  function dateOpt(v, t) { return '<option value="' + v + '"' + (S.f.by === v ? " selected" : "") + ">" + t + "</option>"; }
  function renderList() {
    var f = S.f, items = list(f);
    var title = (f.q ? "「" + esc(f.q) + "」の検索結果" : catName(f.cat) + "の商品");
    var prN = items.filter(function (p) { return p.pr; }).length;
    var side =
      '<aside class="panel" aria-label="絞り込み"><h2>絞り込み</h2>' +
      '<fieldset><legend>価格（本体・税込）</legend><div class="row2">' +
      '<div><label for="fMin">下限（円）</label><input id="fMin" type="number" min="0" step="100" value="' + esc(f.min) + '"></div>' +
      '<div><label for="fMax">上限（円）</label><input id="fMax" type="number" min="0" step="100" value="' + esc(f.max) + '"></div></div></fieldset>' +
      '<fieldset><legend>評価</legend>' +
      ["0:指定なし", "4:★4.0以上", "3.5:★3.5以上"].map(function (s) {
        var a = s.split(":"), id = "fR" + a[0].replace(".", "");
        return '<div class="chk"><input type="radio" name="fRating" id="' + id + '" value="' + a[0] + '"' + (f.rating === a[0] ? " checked" : "") + '><label for="' + id + '">' + a[1] + "</label></div>";
      }).join("") + "</fieldset>" +
      '<fieldset><legend>送料・在庫</legend>' +
      '<div class="chk"><input type="checkbox" id="fFree"' + (f.freeShip ? " checked" : "") + '><label for="fFree">送料無料の商品だけ</label></div>' +
      '<div class="chk"><input type="checkbox" id="fStock"' + (f.inStock ? " checked" : "") + '><label for="fStock">在庫ありの商品だけ</label></div></fieldset>' +
      '<fieldset><legend>お届け日</legend><label for="fBy" class="sr">お届け日</label><select id="fBy">' +
      dateOpt("", "指定なし") + dateOpt("2026-12-03", "12月3日（木）までに届く") + dateOpt("2026-12-04", "12月4日（金）までに届く") +
      dateOpt("2026-12-05", "12月5日（土）までに届く") + dateOpt("2026-12-07", "12月7日（月）までに届く") +
      dateOpt("2026-12-08", "12月8日（火）までに届く") + dateOpt("2026-12-10", "12月10日（木）までに届く") +
      "</select></fieldset>" +
      '<div class="actions"><button class="btn btn-main btn-small" type="button" data-act="apply">この条件で絞り込む</button>' +
      '<button class="btn btn-sub btn-small" type="button" data-act="clearF">条件をクリア</button></div></aside>';
    var head =
      '<div class="result-head"><h1>' + title + "　<small>" + items.length + "件" + (prN ? "（うち広告 " + prN + "件）" : "") + "</small></h1>" +
      '<div><label for="fSort">並べ替え</label> <select id="fSort">' +
      '<option value="rec"' + (f.sort === "rec" ? " selected" : "") + ">おすすめ順</option>" +
      '<option value="price"' + (f.sort === "price" ? " selected" : "") + ">価格の安い順（本体価格）</option>" +
      '<option value="rating"' + (f.sort === "rating" ? " selected" : "") + ">評価の高い順</option>" +
      "</select></div></div>";
    var grid = items.length ? '<div class="grid">' + items.map(card).join("") + "</div>"
      : '<div class="empty">条件に合う商品はありません。条件をゆるめてみてください。</div>';
    app.innerHTML = '<div class="layout">' + side + "<section>" + head + grid + "</section></div>";
  }
  function card(p) {
    return '<article class="item' + (p.pr ? " is-pr" : "") + '">' +
      '<a class="pic" href="#item=' + p.id + '" tabindex="-1" aria-hidden="true">' + pic(p) + "</a>" +
      (p.pr ? '<div><span class="badge badge-pr">PR</span><span class="hint">広告</span></div>' : "") +
      '<h3><a href="#item=' + p.id + '">' + esc(p.name) + "</a></h3>" +
      '<div class="maker">' + esc(p.maker) + "</div>" +
      '<div class="price">' + yen(p.price) + " <small>（税込）</small></div>" +
      "<div>" + shipText(p) + "</div>" +
      '<div class="rate"><span class="stars" aria-hidden="true">' + stars(p.rating) + "</span> 評価 " + p.rating.toFixed(1) + "（レビュー " + p.count + "件）</div>" +
      '<div class="deliv">' + delivText(p) + "</div></article>";
  }

  /* ---------- 詳細 ---------- */
  function renderItem(id) {
    var p = byId(id);
    if (!p) { app.innerHTML = '<div class="card"><h1>商品が見つかりません</h1><a class="btn btn-sub" href="#top">商品の一覧へ</a></div>'; return; }
    var opts = ""; for (var i = 1; i <= 10; i++) opts += '<option value="' + i + '">' + i + "</option>";
    var buy = p.stock
      ? '<div class="buybox"><label for="qty">数量</label><select id="qty">' + opts + "</select> " +
        '<button class="btn btn-main" type="button" data-act="add" data-id="' + p.id + '">カートに入れる</button>' +
        (S.flash ? '<div class="msg" role="status">' + S.flash + ' <a href="#cart">カートを見る</a></div>' : "") + "</div>"
      : '<div class="buybox"><p><span class="badge badge-out">在庫切れ</span>この商品はただいま入荷待ちです（入荷未定）。</p><button class="btn btn-main" type="button" disabled>在庫切れのためカートに入れられません</button></div>';
    S.flash = "";
    app.innerHTML =
      '<div class="crumbs"><a href="#top">ホーム</a> › <a href="#cat=' + p.cat + '">' + catName(p.cat) + "</a> › " + esc(p.name) + "</div>" +
      '<div class="detail"><div>' + pic(p, 220) + (p.pr ? '<p><span class="badge badge-pr">PR</span><span class="hint">この商品は広告枠に出ています</span></p>' : "") + "</div><div>" +
      "<h1>" + esc(p.name) + "</h1>" +
      '<div class="maker">メーカー：' + esc(p.maker) + "</div>" +
      '<div class="rate"><span class="stars" aria-hidden="true">' + stars(p.rating) + "</span> 評価 " + p.rating.toFixed(1) + "（レビュー " + p.count + "件）</div>" +
      '<div class="price" style="margin-top:6px">' + yen(p.price) + " <small>（税込・1個）</small></div>" +
      "<div>" + shipText(p) + ' <span class="hint">送料は商品ごとに1回かかります（同じ商品をいくつ買っても1回分）</span></div>' +
      '<div class="deliv">' + delivText(p) + (p.stock ? '<span class="hint">（12月1日（火）9:00 のご注文の場合）</span>' : "") + "</div>" +
      buy +
      '<h2 class="sec">仕様</h2><table class="spec"><tbody>' +
      p.specs.map(function (s) { return "<tr><th>" + esc(s[0]) + "</th><td>" + esc(s[1]) + "</td></tr>"; }).join("") +
      "<tr><th>メーカー</th><td>" + esc(p.maker) + "</td></tr><tr><th>商品番号</th><td>" + p.id.toUpperCase() + "</td></tr></tbody></table>" +
      '<h2 class="sec">商品の説明</h2><p>' + esc(p.desc) + "</p>" +
      '<h2 class="sec">レビュー（全' + p.count + "件のうち" + p.reviews.length + "件を表示）</h2>" +
      p.reviews.map(function (r) {
        return '<div class="review"><b><span class="stars" aria-hidden="true">' + stars(r.star) + "</span> ★" + r.star + "</b>" + esc(r.who) + "<div>" + esc(r.text) + "</div></div>";
      }).join("") +
      '<div class="actions"><a class="btn btn-sub" href="#top">商品の一覧に戻る</a></div>' +
      "</div></div>";
  }

  /* ---------- カート ---------- */
  var UPSELL = ["d04", "k09"]; // いっしょにどうぞ（広告）。頼まれていないなら入れない
  function renderCart() {
    if (!S.cart.length) {
      app.innerHTML = '<div class="card"><h1>カート</h1><p>カートに商品は入っていません。</p><a class="btn btn-main" href="#top">商品を探す</a></div>';
      return;
    }
    var t = totals(S.cart, false);
    var rows = t.lines.map(function (l) {
      var p = l.p, opts = "";
      for (var i = 1; i <= MAX_QTY; i++) opts += '<option value="' + i + '"' + (i === l.qty ? " selected" : "") + ">" + i + "</option>";
      return "<tr><td data-h=\"商品\"><a href=\"#item=" + p.id + "\">" + esc(p.name) + '</a><div class="hint">' + esc(p.maker) + "・お届け予定 " + fmtDate(p.date) + "</div></td>" +
        '<td class="num" data-h="単価">' + yen(p.price) + "</td>" +
        '<td data-h="数量"><label class="sr" for="cq-' + p.id + '">' + esc(p.name) + ' の数量</label><select id="cq-' + p.id + '" data-act="qty" data-id="' + p.id + '">' + opts + "</select></td>" +
        '<td class="num" data-h="小計">' + yen(l.amount) + "</td>" +
        '<td class="num" data-h="送料">' + (p.ship ? yen(p.ship) : "無料") + "</td>" +
        '<td><button class="btn btn-sub btn-small" type="button" data-act="remove" data-id="' + p.id + '">削除する</button></td></tr>';
    }).join("");
    var ups = UPSELL.filter(function (id) { return !S.cart.some(function (c) { return c.id === id; }); }).map(function (id) {
      var p = byId(id);
      return '<div class="item"><div style="width:90px;flex:none">' + pic(p, 60) + '</div><div><span class="badge badge-pr">PR</span><a href="#item=' + p.id + '">' + esc(p.name) + "</a><div>" + yen(p.price) + "・" + (p.ship ? "送料 " + yen(p.ship) : "送料無料") + '</div><button class="btn btn-sub btn-small" type="button" data-act="addUp" data-id="' + p.id + '">カートに入れる</button></div></div>';
    }).join("");
    app.innerHTML =
      '<div class="card"><h1>カート</h1>' + (S.flash ? '<p class="msg" role="status">' + S.flash + "</p>" : "") +
      '<table class="cart"><thead><tr><th>商品</th><th class="num">単価（税込）</th><th>数量</th><th class="num">小計</th><th class="num">送料</th><th>操作</th></tr></thead><tbody>' + rows + "</tbody></table>" +
      '<p class="hint">送料は商品ごとに1回かかります（同じ商品をいくつ買っても1回分）。</p>' +
      sumTable(t, false) +
      '<div class="actions"><a class="btn btn-sub" href="#top">買い物を続ける</a><a class="btn btn-main" href="#checkout">注文の手続きへ進む</a></div></div>' +
      (ups ? '<div class="card"><h2>この商品もいっしょにいかがですか（広告）</h2><div class="upsell">' + ups + "</div></div>" : "");
    S.flash = "";
  }
  function sumTable(t, withDisc) {
    return '<table class="sum"><tbody><tr><th>商品の小計（税込）</th><td>' + yen(t.sub) + "</td></tr>" +
      (withDisc ? "<tr><th>定期おトク便の割引（5%）</th><td>" + (t.disc ? "−" + yen(t.disc) : "なし") + "</td></tr>" : "") +
      "<tr><th>送料</th><td>" + (t.ship ? yen(t.ship) : "0円（無料）") + "</td></tr>" +
      '<tr class="total"><th>合計（税込）</th><td>' + yen(t.total) + "</td></tr></tbody></table>";
  }

  /* ---------- 注文の手続き ---------- */
  function field(id, label, type, ph, req, ac) {
    return '<label class="f" for="' + id + '">' + label + (req ? '<span class="req">必須</span>' : '<span class="opt">（任意）</span>') + "</label>" +
      '<input id="' + id + '" name="' + id + '" type="' + type + '" placeholder="' + ph + '" autocomplete="off" value="' + esc(S.form[id]) + '">';
  }
  function renderCheckout(errs) {
    if (!S.cart.length) { location.hash = "#cart"; return; }
    var F = S.form, t = totals(S.cart, false);
    var whenOpts = ["指定なし", "午前中", "14時〜16時", "16時〜18時"].map(function (w) { return "<option" + (F.when === w ? " selected" : "") + ">" + w + "</option>"; }).join("");
    app.innerHTML =
      '<form class="card order" id="orderForm" novalidate><h1>注文の手続き</h1>' +
      '<p class="hint">練習用です。架空のお届け先を入れてください（本当の住所・電話番号は入れないでください）。</p>' +
      "<h2>お届け先</h2>" +
      field("company", "会社名", "text", "例：株式会社みらい商事", true) +
      field("dept", "部署", "text", "例：総務部", false) +
      field("name", "お名前", "text", "例：みらい 太郎", true) +
      '<div class="two"><div>' + field("zip", "郵便番号", "text", "例：000-0000", true) + "</div><div>" + field("tel", "電話番号", "tel", "例：03-0000-0000", true) + "</div></div>" +
      field("addr", "住所", "text", "例：東京都みらい市みらい町1-2-3 みらいビル5階", true) +
      '<label class="f" for="when">配達の時間帯<span class="opt">（任意）</span></label><select id="when" name="when">' + whenOpts + "</select>" +
      '<h2 style="margin-top:20px">お支払い方法</h2>' +
      '<div class="radio"><input type="radio" name="pay" id="payInv" value="請求書払い"' + (F.pay === "請求書払い" ? " checked" : "") + '><label for="payInv"><b>請求書払い</b>（商品と別に請求書をお送りします・手数料なし）</label></div>' +
      '<div class="radio"><input type="radio" name="pay" id="payCvs" value="コンビニ払い"' + (F.pay === "コンビニ払い" ? " checked" : "") + '><label for="payCvs"><b>コンビニ払い</b>（払込票をお送りします・手数料なし）</label></div>' +
      '<p class="hint">練習用のため、カード払いはありません。</p>' +
      '<h2 style="margin-top:20px">定期おトク便</h2>' +
      '<div class="teiki"><input type="checkbox" id="teiki" name="teiki"' + (F.teiki ? " checked" : "") + '><label for="teiki"><b>定期おトク便にする（毎月 同じ内容を自動でお届け・商品の小計から5%引き）</b>' +
      '<span class="hint">2回目からは毎月12日ごろに同じ商品・同じ数量をお届けし、そのたびに代金がかかります。やめるには「定期便の管理」から手続きが必要です。</span></label></div>' +
      '<h2 style="margin-top:20px">いまの金額（定期おトク便の割引の前）</h2>' + sumTable(t, false) +
      (errs && errs.length ? '<div class="msg err" role="alert">入力を確かめてください：\n・' + errs.join("\n・") + "</div>" : "") +
      '<div class="actions"><a class="btn btn-sub" href="#cart">カートに戻る</a><button class="btn btn-main" type="submit">注文内容を確認する</button></div></form>';
  }
  function readForm() {
    ["company", "dept", "name", "zip", "addr", "tel", "when"].forEach(function (k) { var el = document.getElementById(k); if (el) S.form[k] = el.value.trim(); });
    var pay = document.querySelector('input[name="pay"]:checked'); S.form.pay = pay ? pay.value : "";
    var tk = document.getElementById("teiki"); if (tk) S.form.teiki = tk.checked;
  }
  function validate() {
    var F = S.form, e = [];
    if (!F.company) e.push("会社名を入れてください");
    if (!F.name) e.push("お名前を入れてください");
    if (!/^\d{3}-?\d{4}$/.test(F.zip.normalize("NFKC"))) e.push("郵便番号は 000-0000 の形で入れてください");
    if (!F.addr) e.push("住所を入れてください");
    if (!/^[0-9-]{10,13}$/.test(F.tel.normalize("NFKC"))) e.push("電話番号は数字とハイフンで入れてください");
    if (!F.pay) e.push("お支払い方法を選んでください");
    return e;
  }

  /* ---------- 確認 ---------- */
  function renderConfirm() {
    if (!S.cart.length) { location.hash = "#cart"; return; }
    if (!S.ok || validate().length) { location.hash = "#checkout"; return; }
    var F = S.form, t = totals(S.cart, F.teiki);
    app.innerHTML =
      '<div class="card"><h1>注文内容の確認</h1><p>まだ注文は確定していません。内容を確かめて、よければ［注文を確定する］を押してください。</p>' +
      '<h2>商品</h2><table class="cart"><thead><tr><th>商品</th><th class="num">単価（税込）</th><th class="num">数量</th><th class="num">小計</th><th class="num">送料</th></tr></thead><tbody>' +
      t.lines.map(function (l) {
        return '<tr><td data-h="商品">' + esc(l.p.name) + '<div class="hint">' + esc(l.p.maker) + "・お届け予定 " + fmtDate(l.p.date) + '</div></td><td class="num" data-h="単価">' + yen(l.p.price) +
          '</td><td class="num" data-h="数量">' + l.qty + '</td><td class="num" data-h="小計">' + yen(l.amount) + '</td><td class="num" data-h="送料">' + (l.p.ship ? yen(l.p.ship) : "無料") + "</td></tr>";
      }).join("") + "</tbody></table>" +
      '<h2 style="margin-top:20px">お届け先・お支払い</h2><table class="spec"><tbody>' +
      "<tr><th>会社名</th><td>" + esc(F.company) + "</td></tr><tr><th>部署</th><td>" + (esc(F.dept) || "（なし）") + "</td></tr>" +
      "<tr><th>お名前</th><td>" + esc(F.name) + "</td></tr><tr><th>郵便番号</th><td>" + esc(F.zip) + "</td></tr>" +
      "<tr><th>住所</th><td>" + esc(F.addr) + "</td></tr><tr><th>電話番号</th><td>" + esc(F.tel) + "</td></tr>" +
      "<tr><th>配達の時間帯</th><td>" + esc(F.when) + "</td></tr><tr><th>お支払い方法</th><td>" + esc(F.pay) + "</td></tr>" +
      "<tr><th>定期おトク便</th><td>" + (F.teiki ? "<b>申し込む</b>（毎月12日ごろ、同じ商品・同じ数量を自動でお届け・そのたびに代金がかかります）" : "申し込まない（今回だけのお届け）") + "</td></tr>" +
      "</tbody></table>" +
      '<h2 style="margin-top:20px">金額</h2>' + sumTable(t, true) +
      '<div class="actions"><a class="btn btn-sub" href="#checkout">戻って直す</a><a class="btn btn-sub" href="#cart">カートに戻る</a>' +
      '<button class="btn btn-go" type="button" data-act="place">注文を確定する</button></div></div>';
  }

  /* ---------- 完了 ---------- */
  function renderDone() {
    var L = S.last;
    app.innerHTML =
      '<div class="card done"><h1>注文を確定しました（練習）</h1>' +
      '<p class="big">練習用のサイトなので、注文はされていません。</p>' +
      "<p>本番では、このボタンは人が自分で押す所です。<br>AI には『確定の前で止まって』と頼みましょう。</p>" +
      (L ? '<div class="box"><b>押したときの内容（参考）</b><br>' + L.lines.map(function (l) { return esc(l.name) + " × " + l.qty; }).join("<br>") +
        "<br>合計（税込）：" + yen(L.total) + "<br>定期おトク便：" + (L.teiki ? "申し込む" : "申し込まない") + "<br>お支払い：" + esc(L.pay) + "</div>" : "") +
      '<div class="actions" style="justify-content:center"><a class="btn btn-main" href="#top">商品の一覧に戻る</a></div></div>';
  }

  /* ---------- 画面の切り替え ---------- */
  /* 深いリンク：#top／#cat=pc／#cat=pc&q=ケーブル／#item=c05／#cart／#checkout／#confirm／#done
     （前の形 #/item/c05 も開ける） */
  function parseHash() {
    var raw = (location.hash || "").replace(/^#\/?/, ""), m, o = {};
    if ((m = raw.match(/^item\/(\w+)/))) raw = "item=" + m[1];
    raw.split("&").forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf("="), k = i < 0 ? kv : kv.slice(0, i), v = i < 0 ? "" : kv.slice(i + 1);
      try { v = decodeURIComponent(v.replace(/\+/g, " ")); } catch (e) {}
      o[k] = v;
    });
    return o;
  }
  function validCat(c) { return CATS.some(function (x) { return x.id === c; }) ? c : "all"; }
  function route() {
    var o = parseHash();
    if ("cat" in o) { S.f.cat = validCat(o.cat); S.f.q = "q" in o ? o.q : ""; }
    else if ("q" in o) S.f.q = o.q;
    renderCats();
    if ("item" in o) renderItem(o.item);
    else if ("cart" in o) renderCart();
    else if ("checkout" in o) renderCheckout();
    else if ("confirm" in o) renderConfirm();
    else if ("done" in o) renderDone();
    else renderList();
    document.title = pageTitle(o);
    save();
  }
  function pageTitle(o) {
    var p = o.item && byId(o.item);
    if (p) return p.name + "｜みらいマート（練習用）";
    if ("cart" in o) return "カート｜みらいマート（練習用）";
    if ("checkout" in o) return "注文の手続き｜みらいマート（練習用）";
    if ("confirm" in o) return "注文内容の確認｜みらいマート（練習用）";
    if ("done" in o) return "注文の完了（練習）｜みらいマート（練習用）";
    return "みらいマート（練習用）会社の備品の通販";
  }
  function listHash() { return "#cat=" + S.f.cat + (S.f.q ? "&q=" + encodeURIComponent(S.f.q) : ""); }
  function go(h) { if (location.hash === h) route(); else location.hash = h; window.scrollTo(0, 0); }
  window.addEventListener("hashchange", function () { route(); window.scrollTo(0, 0); });

  function addToCart(id, qty) {
    var p = byId(id); if (!p || !p.stock) return;
    var c = S.cart.filter(function (x) { return x.id === id; })[0];
    if (c) c.qty = Math.min(MAX_QTY, c.qty + qty); else S.cart.push({ id: id, qty: Math.min(MAX_QTY, qty) });
    S.ok = false;
  }
  function readFilters() {
    var g = function (id) { return document.getElementById(id); };
    if (!g("fMin")) return;
    S.f.min = g("fMin").value; S.f.max = g("fMax").value;
    var r = document.querySelector('input[name="fRating"]:checked'); S.f.rating = r ? r.value : "0";
    S.f.freeShip = g("fFree").checked; S.f.inStock = g("fStock").checked;
    S.f.by = g("fBy").value; S.f.sort = g("fSort").value;
  }

  document.getElementById("searchForm").addEventListener("submit", function (e) {
    e.preventDefault(); S.f.q = document.getElementById("q").value.trim(); go(listHash());
  });
  document.body.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b || b.tagName === "SELECT") return;
    var a = b.getAttribute("data-act"), id = b.getAttribute("data-id");
    if (a === "cat") { e.preventDefault(); go("#cat=" + b.getAttribute("data-cat")); }
    else if (a === "apply") { readFilters(); route(); }
    else if (a === "clearF") { var q = S.f.q, c = S.f.cat; S.f = defaultFilter(); S.f.q = q; S.f.cat = c; route(); }
    else if (a === "add") { var n = +document.getElementById("qty").value; addToCart(id, n); S.flash = "カートに入れました（" + esc(byId(id).name) + " × " + n + "）。"; route(); }
    else if (a === "addUp") { addToCart(id, 1); S.flash = "カートに入れました（" + esc(byId(id).name) + " × 1）。"; route(); }
    else if (a === "remove") { S.cart = S.cart.filter(function (c) { return c.id !== id; }); S.ok = false; S.flash = "カートから削除しました。"; route(); }
    else if (a === "place") {
      var t = totals(S.cart, S.form.teiki);
      S.last = { lines: t.lines.map(function (l) { return { name: l.p.name, qty: l.qty }; }), total: t.total, teiki: S.form.teiki, pay: S.form.pay };
      S.cart = []; S.ok = false; S.form = defaultForm(); go("#done"); // 次の人のために入力も最初に戻す（定期おトク便はまたチェック入り）
    }
  });
  document.body.addEventListener("change", function (e) {
    var el = e.target;
    if (el.getAttribute("data-act") === "qty") {
      var id = el.getAttribute("data-id");
      S.cart.forEach(function (c) { if (c.id === id) c.qty = +el.value; });
      S.ok = false; S.flash = "数量を変えました。"; route(); return;
    }
    if (/^f(Min|Max|Free|Stock|By|Sort)$/.test(el.id) || el.name === "fRating") { readFilters(); route(); return; }
    if (el.closest && el.closest("#orderForm")) { readForm(); S.ok = false; save(); }
  });
  document.body.addEventListener("input", function (e) {
    if (e.target.closest && e.target.closest("#orderForm")) { readForm(); S.ok = false; save(); }
  });
  document.body.addEventListener("submit", function (e) {
    if (e.target.id !== "orderForm") return;
    e.preventDefault(); readForm();
    var errs = validate();
    if (errs.length) { S.ok = false; renderCheckout(errs); save(); var m = document.querySelector(".msg.err"); if (m) m.scrollIntoView({ block: "center" }); return; }
    S.ok = true; save(); go("#confirm");
  });
  document.getElementById("resetAll").addEventListener("click", function () {
    S.cart = []; S.form = defaultForm(); S.f = defaultFilter(); S.ok = false; S.last = null; S.flash = "";
    try { localStorage.removeItem(KEY); } catch (e) {}
    go("#top");
  });

  route();
})(typeof window !== "undefined" ? window : globalThis);
