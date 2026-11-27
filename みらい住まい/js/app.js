/* みらい住まい（架空・練習用）の画面の動き。外への通信なし・乱数なし。 */
(function () {
  var D = window.MIRAI;
  var LIST = D.LIST;
  var KEY = "mirai-sumai-draft";
  var $ = function (id) { return document.getElementById(id); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function yen(n) { return n.toLocaleString("ja-JP") + "円"; }
  function man(n) { return (n / 10000).toFixed(n % 1000 === 0 ? (n % 10000 === 0 ? 0 : 1) : 2) + "万円"; }
  function months(n, rent) { return n === 0 ? "なし" : n + "か月（" + yen(n * rent) + "）"; }
  function find(id) { for (var i = 0; i < LIST.length; i++) if (LIST[i].id === id) return LIST[i]; return null; }
  function featNames(p) {
    var a = [];
    "BAWDPESC".split("").forEach(function (c) { if (p.feats.indexOf(c) >= 0) a.push(D.FEATURES[c]); });
    if (p.floor >= 2) a.splice(1, 0, "2階以上");
    return a;
  }
  function ageText(p) { return p.age === 0 ? "新築" : "築" + p.age + "年"; }

  /* ---------- 下書き（localStorage は使えなくても動く） ---------- */
  var draft = {};
  try { draft = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { draft = {}; }
  function saveDraft() { try { localStorage.setItem(KEY, JSON.stringify(draft)); } catch (e) {} }

  /* ---------- 検索フォームを作る ---------- */
  $("today").textContent = D.TODAY.label;
  $("total").textContent = LIST.length;

  $("opt-st").innerHTML = D.STATIONS.map(function (s, i) {
    return '<label for="st' + i + '"><input type="checkbox" id="st' + i + '" value="' + s + '"> ' + s + '駅</label>';
  }).join("");
  $("opt-mad").innerHTML = D.MADORI.map(function (m, i) {
    return '<label for="md' + i + '"><input type="checkbox" id="md' + i + '" value="' + m + '"> ' + m + '</label>';
  }).join("");
  var FOPTS = [["B", "バス・トイレ別"], ["2", "2階以上"], ["A", "オートロック"], ["W", "室内洗濯機置き場"], ["D", "宅配ボックス"], ["P", "ペット可"], ["E", "エアコン付き"], ["S", "独立洗面台"], ["C", "駐車場あり"]];
  $("opt-f").innerHTML = FOPTS.map(function (f, i) {
    return '<label for="fe' + i + '"><input type="checkbox" id="fe' + i + '" value="' + f[0] + '"> ' + f[1] + '</label>';
  }).join("");

  var rentOpts = ['<option value="">上限なし</option>'];
  for (var r = 50000; r <= 150000; r += 5000) rentOpts.push('<option value="' + r + '">' + man(r) + '以下</option>');
  $("rent").innerHTML = rentOpts.join("");
  $("area").innerHTML = '<option value="">指定しない</option>' + [15, 20, 25, 30, 40, 50, 60, 70].map(function (a) { return '<option value="' + a + '">' + a + '㎡以上</option>'; }).join("");
  $("walk").innerHTML = '<option value="">指定しない</option>' + [1, 3, 5, 7, 10, 15, 20].map(function (w) { return '<option value="' + w + '">' + w + '分以内</option>'; }).join("");
  $("age").innerHTML = '<option value="">指定しない</option><option value="0">新築</option>' + [5, 10, 15, 20, 30].map(function (a) { return '<option value="' + a + '">' + a + '年以内</option>'; }).join("");
  $("f-visit").innerHTML = '<option value="">内見は希望しない</option>' + D.VISIT_DAYS.map(function (v) { return '<option>2026年' + v + '</option>'; }).join("");

  /* ---------- 条件 ⇔ ハッシュ ---------- */
  function readQuery(qs) {
    var q = {}, parts = (qs || "").split("&");
    parts.forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf("="), k, v;
      try { k = decodeURIComponent(i < 0 ? kv : kv.slice(0, i)); v = i < 0 ? "" : decodeURIComponent(kv.slice(i + 1)); } catch (e) { return; }
      q[k] = v;
    });
    return {
      st: q.st ? q.st.split(",") : [], rent: q.rent ? +q.rent : 0, inc: q.inc === "1",
      mad: q.mad ? q.mad.split(",") : [], area: q.area ? +q.area : 0, walk: q.walk ? +q.walk : 0,
      age: q.age === undefined || q.age === "" ? -1 : +q.age, f: q.f ? q.f.split(",") : [], sort: q.sort || "new"
    };
  }
  function makeQuery(c) {
    var a = [];
    if (c.st.length) a.push("st=" + encodeURIComponent(c.st.join(",")));
    if (c.rent) a.push("rent=" + c.rent);
    if (c.inc) a.push("inc=1");
    if (c.mad.length) a.push("mad=" + encodeURIComponent(c.mad.join(",")));
    if (c.area) a.push("area=" + c.area);
    if (c.walk) a.push("walk=" + c.walk);
    if (c.age >= 0) a.push("age=" + c.age);
    if (c.f.length) a.push("f=" + c.f.join(","));
    if (c.sort && c.sort !== "new") a.push("sort=" + c.sort);
    return a.join("&");
  }
  function checkedValues(boxId) {
    return Array.prototype.slice.call($(boxId).querySelectorAll("input:checked")).map(function (x) { return x.value; });
  }
  function formToCond() {
    return {
      st: checkedValues("opt-st"), rent: +$("rent").value || 0, inc: $("inc").checked,
      mad: checkedValues("opt-mad"), area: +$("area").value || 0, walk: +$("walk").value || 0,
      age: $("age").value === "" ? -1 : +$("age").value, f: checkedValues("opt-f"), sort: $("sort").value
    };
  }
  function condToForm(c) {
    ["opt-st", "opt-mad", "opt-f"].forEach(function (b) {
      var vals = b === "opt-st" ? c.st : b === "opt-mad" ? c.mad : c.f;
      Array.prototype.forEach.call($(b).querySelectorAll("input"), function (x) { x.checked = vals.indexOf(x.value) >= 0; });
    });
    $("rent").value = c.rent ? String(c.rent) : "";
    $("inc").checked = c.inc;
    $("area").value = c.area ? String(c.area) : "";
    $("walk").value = c.walk ? String(c.walk) : "";
    $("age").value = c.age >= 0 ? String(c.age) : "";
    $("sort").value = c.sort;
  }
  var lastListHash = "#/";

  function filter(c) {
    var res = LIST.filter(function (p) {
      if (c.st.length && c.st.indexOf(p.station) < 0) return false;
      if (c.rent && (c.inc ? p.rent + p.kanri : p.rent) > c.rent) return false;
      if (c.mad.length && c.mad.indexOf(p.madori) < 0) return false;
      if (c.area && p.area < c.area) return false;
      if (c.walk && p.walk > c.walk) return false;
      if (c.age >= 0 && p.age > c.age) return false;
      for (var i = 0; i < c.f.length; i++) {
        if (c.f[i] === "2") { if (p.floor < 2) return false; }
        else if (p.feats.indexOf(c.f[i]) < 0) return false;
      }
      return true;
    });
    var by = {
      "new": function (a, b) { return b.posted - a.posted || (a.id < b.id ? 1 : -1); },
      cheap: function (a, b) { return a.rent - b.rent || (a.id < b.id ? -1 : 1); },
      near: function (a, b) { return a.walk - b.walk || (a.id < b.id ? -1 : 1); },
      wide: function (a, b) { return b.area - a.area || (a.id < b.id ? -1 : 1); }
    }[c.sort] || null;
    if (by) res.sort(by);
    return res;
  }
  function condText(c) {
    var t = [];
    if (c.st.length) t.push(c.st.map(function (s) { return s + "駅"; }).join("・"));
    if (c.rent) t.push((c.inc ? "家賃＋管理費 " : "家賃 ") + man(c.rent) + "以下");
    if (c.mad.length) t.push(c.mad.join("・"));
    if (c.area) t.push(c.area + "㎡以上");
    if (c.walk) t.push("徒歩" + c.walk + "分以内");
    if (c.age >= 0) t.push(c.age === 0 ? "新築" : "築" + c.age + "年以内");
    c.f.forEach(function (f) { FOPTS.forEach(function (o) { if (o[0] === f) t.push(o[1]); }); });
    return t.length ? "いまの条件：" + t.join("／") : "いまの条件：指定なし（すべての物件）";
  }

  /* ---------- 絵（インライン SVG） ---------- */
  function thumb(p) {
    var n = Math.min(p.floors, 8), h = 10 + n * 9, x0 = 34, y0 = 92 - h, rows = "";
    for (var i = 0; i < n; i++) rows += '<rect x="' + (x0 + 8) + '" y="' + (y0 + 6 + i * 9) + '" width="36" height="4" fill="#fff" opacity=".8"/>';
    return '<svg width="100" height="90" viewBox="0 0 120 100" aria-hidden="true"><rect x="' + x0 + '" y="' + y0 + '" width="52" height="' + h + '" rx="3" fill="#8A73B8"/>' + rows +
      '<rect x="10" y="92" width="100" height="3" fill="#BFB2D8"/></svg>';
  }
  function plan(p) {
    var ub = p.feats.indexOf("B") < 0, W = p.feats.indexOf("W") >= 0, s = "";
    function box(t, x, y, w, h, fill) {
      s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + (fill || "#fff") + '" stroke="#47307A" stroke-width="2"/>';
      var lines = t.split("|");
      lines.forEach(function (ln, i) {
        s += '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 4 + (i - (lines.length - 1) / 2) * 15) + '" font-size="12" text-anchor="middle" fill="#1F2328">' + ln + '</text>';
      });
    }
    box("玄関", 10, 10, 90, 45, "#F4F4F6");
    if (ub) { box("ユニットバス|（バス・トイレ|同じ部屋）", 10, 55, 90, 105, "#EAF2FB"); }
    else { box("浴室", 10, 55, 90, 60, "#EAF2FB"); box("トイレ", 10, 115, 90, 45, "#EAF2FB"); }
    if (W) box("洗濯機|置き場", 10, 160, 90, 55, "#F4F4F6"); else box("収納", 10, 160, 90, 55, "#F4F4F6");
    var m = p.madori;
    if (m === "ワンルーム") { box("洋室（キッチン付き）", 100, 10, 250, 205, "#F1ECF8"); }
    else if (m === "1K") { box("キッチン", 100, 10, 250, 65); box("洋室", 100, 75, 250, 140, "#F1ECF8"); }
    else if (m === "1DK") { box("DK", 100, 10, 250, 90); box("洋室", 100, 100, 250, 115, "#F1ECF8"); }
    else if (m === "1LDK") { box("LDK", 100, 10, 250, 115); box("洋室", 100, 125, 250, 90, "#F1ECF8"); }
    else if (m === "2DK") { box("DK", 100, 10, 250, 90); box("洋室", 100, 100, 125, 115, "#F1ECF8"); box("和室", 225, 100, 125, 115, "#F1ECF8"); }
    else if (m === "2LDK") { box("LDK", 100, 10, 250, 105); box("洋室", 100, 115, 125, 100, "#F1ECF8"); box("洋室", 225, 115, 125, 100, "#F1ECF8"); }
    else { box("LDK", 100, 10, 160, 105); box("洋室", 260, 10, 90, 105, "#F1ECF8"); box("洋室", 100, 115, 125, 100, "#F1ECF8"); box("洋室", 225, 115, 125, 100, "#F1ECF8"); }
    s += '<rect x="10" y="222" width="340" height="28" fill="#fff" stroke="#8A8F98" stroke-dasharray="5 4" stroke-width="2"/>';
    s += '<text x="180" y="241" font-size="12" text-anchor="middle" fill="#5B6370">バルコニー（' + esc(p.dir) + '向き）</text>';
    return '<svg viewBox="0 0 360 260" role="img" aria-label="' + esc(p.name + " " + p.room + "号室の間取り図（" + p.madori + "）") + '">' + s + '</svg>';
  }

  /* ---------- 一覧 ---------- */
  function renderList(c) {
    condToForm(c);
    var res = filter(c);
    $("count").textContent = res.length;
    $("cond-now").textContent = condText(c);
    if (!res.length) { $("results").innerHTML = '<div class="card empty">条件に合う物件がありません。条件をゆるめてみてください。</div>'; return; }
    $("results").innerHTML = res.map(function (p) {
      var sold = p.status === "成約済み";
      return '<article class="item' + (sold ? " sold" : "") + '">' +
        '<div class="thumb">' + thumb(p) + '</div>' +
        '<div><h3>' + esc(p.name) + ' ' + esc(p.room) + '号室' +
        (sold ? '<span class="badge badge-sold">成約済み</span>' : "") +
        (!sold && p.posted >= 9 ? '<span class="badge badge-new">新着</span>' : "") + '</h3>' +
        '<p class="where">' + D.LINE + ' ' + p.station + '駅 徒歩' + p.walk + '分</p>' +
        '<div class="price"><span class="rent">' + man(p.rent) + '</span>管理費・共益費 ' + yen(p.kanri) +
        '　敷金 ' + (p.shiki ? p.shiki + "か月" : "なし") + '／礼金 ' + (p.rei ? p.rei + "か月" : "なし") + '</div>' +
        '<div class="facts"><span>' + p.madori + '・' + p.area.toFixed(1) + '㎡</span><span>' + ageText(p) + '</span><span>' + p.floor + '階／' + p.floors + '階建て</span><span>入居：' + esc(p.movein) + '</span></div>' +
        '<div class="tags">' + featNames(p).map(function (f) { return '<span class="tag">' + f + '</span>'; }).join("") + '</div>' +
        '<div class="foot"><span>物件番号 ' + p.id + '</span><span>取り扱い：' + esc(p.agent.name) + '</span><span>掲載日：2026年12月' + p.posted + '日</span>' +
        '<a class="btn btn-main btn-small" href="#/room/' + p.id + '">詳細を見る</a></div>' +
        '</div></article>';
    }).join("");
  }

  /* ---------- 詳細 ---------- */
  function renderRoom(p) {
    var sold = p.status === "成約済み";
    var rows = [
      ["物件番号", p.id], ["建物名・部屋", p.name + " " + p.room + "号室"], ["交通", D.LINE + " " + p.station + "駅 徒歩" + p.walk + "分"],
      ["家賃", yen(p.rent)], ["管理費・共益費", yen(p.kanri)], ["毎月の合計", yen(p.rent + p.kanri) + "（家賃＋管理費・共益費）"],
      ["敷金", months(p.shiki, p.rent)], ["礼金", months(p.rei, p.rent)],
      ["間取り", p.madori], ["専有面積", p.area.toFixed(1) + "㎡"], ["築年月", p.builtY + "年" + p.builtM + "月（" + ageText(p) + "）"],
      ["所在階／階建て", p.floor + "階／" + p.floors + "階建て"], ["向き", p.dir], ["設備・条件", featNames(p).join("、") + (p.feats.indexOf("B") < 0 ? "（バス・トイレは同じ部屋）" : "")],
      ["入居できる時期", p.movein], ["状態", p.status], ["備考", p.note || "とくになし"], ["掲載日", "2026年12月" + p.posted + "日"]
    ];
    $("view-room").innerHTML =
      '<div class="card"><h2>' + esc(p.name) + ' ' + esc(p.room) + '号室' + (sold ? '<span class="badge badge-sold">成約済み</span>' : "") + '</h2>' +
      '<p style="margin:0 0 8px;color:#5B6370">' + D.LINE + ' ' + p.station + '駅 徒歩' + p.walk + '分　｜　' + p.madori + '・' + p.area.toFixed(1) + '㎡　｜　' + p.floor + '階／' + p.floors + '階建て</p>' +
      (sold ? '<div class="notice"><b>この物件は成約済みです。</b>すでに入居者が決まっているため、問い合わせはできません（一覧には残しています）。</div>' : "") +
      '<div class="money"><div>家賃<b>' + yen(p.rent) + '</b></div><div>管理費・共益費<b>' + yen(p.kanri) + '</b></div><div>敷金<b>' + (p.shiki ? p.shiki + "か月" : "なし") + '</b></div><div>礼金<b>' + (p.rei ? p.rei + "か月" : "なし") + '</b></div></div>' +
      '<div class="detail-top"><div><h3 style="margin-top:0">物件の情報</h3><table>' +
      rows.map(function (r) { return '<tr><th scope="row">' + r[0] + '</th><td>' + esc(r[1]) + '</td></tr>'; }).join("") +
      '</table></div><div><h3 style="margin-top:0">間取り図</h3><div class="plan">' + plan(p) + '<p class="cap">間取り図は簡単な絵です（練習用）</p></div>' +
      '<h3>取り扱いの不動産会社</h3><div class="agent-box"><b>' + esc(p.agent.name) + '</b><br>電話 ' + p.agent.tel + '（架空）<br>営業時間 ' + esc(p.agent.hours) + '</div>' +
      '<div class="cta"><button type="button" class="btn btn-main" id="to-inq"' + (sold ? " disabled" : "") + '>この物件に問い合わせる</button>' +
      (sold ? '<p style="font-size:13px;color:#5B6370">成約済みのため問い合わせできません。</p>' : "") + '</div></div></div>' +
      '<div class="actions"><button type="button" class="btn btn-sub" id="room-back">検索結果に戻る</button></div></div>';
    if (!sold) $("to-inq").onclick = function () { location.hash = "#/inquiry/" + p.id; };
    $("room-back").onclick = function () { location.hash = lastListHash; };
  }

  function roomMini(p) {
    return '<b>' + esc(p.name) + ' ' + esc(p.room) + '号室</b>（物件番号 ' + p.id + '）<br>' + D.LINE + ' ' + p.station + '駅 徒歩' + p.walk + '分／' + p.madori + '・' + p.area.toFixed(1) + '㎡／家賃 ' + yen(p.rent) + '＋管理費 ' + yen(p.kanri) + '<br>取り扱い：' + esc(p.agent.name);
  }

  /* ---------- 問い合わせ ---------- */
  var FIELDS = [["f-name", "name", "お名前"], ["f-company", "company", "会社名・部署"], ["f-mail", "mail", "メールアドレス"], ["f-tel", "tel", "電話番号"], ["f-movein", "movein", "希望の入居時期"], ["f-visit", "visit", "内見の希望日"], ["f-time", "time", "内見の時間帯"], ["f-q", "q", "質問・ご要望"]];
  function renderInquiry(p) {
    $("inq-room").innerHTML = roomMini(p);
    $("inq-err").textContent = "";
    var d = draft.id === p.id ? draft : {};
    FIELDS.forEach(function (f) { $(f[0]).value = d[f[1]] || ""; });
    $("inq-form").onsubmit = function (e) {
      e.preventDefault();
      var v = { id: p.id };
      FIELDS.forEach(function (f) { v[f[1]] = $(f[0]).value.trim(); });
      var errs = [];
      if (!v.name) errs.push("お名前を入れてください。");
      if (!v.mail) errs.push("メールアドレスを入れてください。");
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.mail)) errs.push("メールアドレスの形が正しくありません。");
      if (v.tel && !/^[0-9\-]{10,13}$/.test(v.tel)) errs.push("電話番号は数字とハイフンで入れてください。");
      if (!v.movein) errs.push("希望の入居時期を選んでください。");
      if (v.visit && !v.time) errs.push("内見の時間帯を選んでください。");
      if (!v.visit && v.time) errs.push("内見の日にちを選んでください。");
      if (errs.length) { $("inq-err").textContent = errs.join("\n"); return; }
      draft = v; saveDraft();
      location.hash = "#/confirm/" + p.id;
    };
    $("inq-back").onclick = function () { location.hash = "#/room/" + p.id; };
  }
  function renderConfirm(p) {
    if (draft.id !== p.id) { location.replace("#/inquiry/" + p.id); return; }
    $("cf-room").innerHTML = roomMini(p);
    $("cf-table").innerHTML = FIELDS.map(function (f) {
      var val = draft[f[1]];
      if (f[1] === "visit" && !val) val = "内見は希望しない";
      return '<tr><th scope="row">' + f[2] + '</th><td style="white-space:pre-line">' + (val ? esc(val) : '<span style="color:#8A8F98">（入力なし）</span>') + '</td></tr>';
    }).join("");
    $("cf-back").onclick = function () { location.hash = "#/inquiry/" + p.id; };
    $("cf-send").onclick = function () {
      draft = {}; saveDraft();
      location.hash = "#/done/" + p.id;
    };
  }

  /* ---------- 画面の切り替え ---------- */
  var VIEWS = ["view-list", "view-room", "view-inquiry", "view-confirm", "view-done"];
  function show(v) { VIEWS.forEach(function (x) { $(x).classList.toggle("hidden", x !== v); }); }
  function crumb(parts) {
    $("crumb").innerHTML = parts.map(function (c, i) {
      return i < parts.length - 1 && c[1] ? '<a href="' + c[1] + '">' + esc(c[0]) + '</a>' : esc(c[0]);
    }).join(" › ");
  }
  function route() {
    var h = location.hash || "#/";
    var m;
    /* みらい検索などからの短い深いリンク：#room=M-1018 ／ #station=さくら */
    var raw = h; try { raw = decodeURIComponent(h); } catch (e) {}
    if ((m = raw.match(/^#room=(M-\d+)/))) { location.replace("#/room/" + m[1]); return; }
    if ((m = raw.match(/^#station=([^&]+)/))) { location.replace("#/list?st=" + encodeURIComponent(m[1].replace(/駅$/, ""))); return; }
    if ((m = h.match(/^#\/room\/(M-\d+)/)) && find(m[1])) {
      var p = find(m[1]); show("view-room"); renderRoom(p);
      crumb([["トップ", "#/"], ["検索結果", lastListHash], [p.name + " " + p.room + "号室"]]);
    } else if ((m = h.match(/^#\/inquiry\/(M-\d+)/)) && find(m[1])) {
      p = find(m[1]);
      if (p.status === "成約済み") { location.replace("#/room/" + p.id); return; }
      show("view-inquiry"); renderInquiry(p);
      crumb([["トップ", "#/"], ["検索結果", lastListHash], [p.name + " " + p.room + "号室", "#/room/" + p.id], ["問い合わせ"]]);
    } else if ((m = h.match(/^#\/confirm\/(M-\d+)/)) && find(m[1])) {
      p = find(m[1]); show("view-confirm"); renderConfirm(p);
      crumb([["トップ", "#/"], [p.name + " " + p.room + "号室", "#/room/" + p.id], ["問い合わせ", "#/inquiry/" + p.id], ["確認"]]);
    } else if ((m = h.match(/^#\/done\/(M-\d+)/)) && find(m[1])) {
      p = find(m[1]); show("view-done");
      $("done-room").textContent = "問い合わせ先（練習）：" + p.name + " " + p.room + "号室／" + p.agent.name;
      crumb([["トップ", "#/"], ["完了（練習）"]]);
    } else {
      var qs = h.indexOf("?") >= 0 ? h.slice(h.indexOf("?") + 1) : "";
      lastListHash = h.indexOf("#/list") === 0 ? h : "#/";
      show("view-list"); renderList(readQuery(qs));
      crumb([["トップ", "#/"], ["物件をさがす"]]);
    }
    window.scrollTo(0, 0);
  }

  $("search").onsubmit = function (e) { e.preventDefault(); location.hash = "#/list?" + makeQuery(formToCond()); };
  $("sort").onchange = function () { location.hash = "#/list?" + makeQuery(formToCond()); };
  $("clear").onclick = function () { location.hash = "#/list?sort=" + $("sort").value; };
  $("reset").onclick = function () {
    draft = {}; try { localStorage.removeItem(KEY); } catch (e) {}
    if (location.hash === "#/" || location.hash === "") route(); else location.hash = "#/";
  };
  window.addEventListener("hashchange", route);
  route();
})();
