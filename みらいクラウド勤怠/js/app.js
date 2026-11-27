// みらいクラウド勤怠（架空）の画面の動き。外からは何も読み込まない。乱数・今日の日付は使わない。
(function () {
  var M = window.MIRAI;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  // ---- できること（5つ）
  $("feature-list").innerHTML = M.dokodemo.map(function (f, i) {
    return '<div class="feature"><span class="no">' + (i + 1) + '</span><h3>' + esc(f.t) + '</h3><p>' + esc(f.d) + '</p></div>';
  }).join("");

  // ---- 料金プランのカード
  $("plan-cards").innerHTML = M.plans.map(function (p) {
    return '<div class="plan' + (p.recommend ? ' rec' : '') + '" id="plan-' + p.id + '">' +
      (p.recommend ? '<span class="tag">いちばん選ばれています</span>' : '') +
      '<h3>' + esc(p.name) + '</h3>' +
      '<p class="for">' + esc(p.lead) + '</p>' +
      '<p class="price">1人あたり 月額<b>' + p.price.toLocaleString("ja-JP") + '</b>円<span class="tax">（税抜）</span></p>' +
      '<dl><dt>最低利用人数</dt><dd>' + p.min + '人分から</dd>' +
      '<dt>初期費用</dt><dd>' + M.yen(p.init) + '（税抜）※</dd>' +
      '<dt>無料お試し</dt><dd>' + p.trial + '日間</dd></dl>' +
      '<p class="plan-link"><a href="#plan=' + p.id + '">このプランのくわしい内容（' + esc(p.name) + '）</a></p>' +
      '</div>';
  }).join("");

  // ---- 料金のくらべの表
  var rows = [
    ["1人あたり月額", function (p) { return M.yen(p.price); }],
    ["最低利用人数", function (p) { return p.min + "人分から"; }],
    ["初期費用", function (p) { return M.yen(p.init) + "※"; }],
    ["無料お試し", function (p) { return p.trial + "日間"; }]
  ];
  $("price-table").tBodies[0].innerHTML = rows.map(function (r) {
    return '<tr><th scope="row">' + r[0] + '</th>' + M.plans.map(function (p) { return '<td>' + r[1](p) + '</td>'; }).join("") + '</tr>';
  }).join("");

  // ---- 機能のくらべの表
  $("feature-table").tBodies[0].innerHTML = M.features.map(function (f) {
    return '<tr><th scope="row">' + esc(f[0]) + '</th><td>' + esc(f[1]) + '</td><td>' + esc(f[2]) + '</td><td>' + esc(f[3]) + '</td></tr>';
  }).join("");

  // ---- 注記
  $("price-notes").innerHTML = M.notes.map(function (n) {
    return '<li>※' + esc(n) + '</li>';
  }).join("");

  // ---- 1つのプランのくわしい内容（#plan=light など）
  function renderPlanDetail(p) {
    var i = M.plans.indexOf(p);
    var can = M.features.map(function (f) { return '<tr><th scope="row">' + esc(f[0]) + '</th><td>' + esc(f[i + 1]) + '</td></tr>'; }).join("");
    $("plan-detail").innerHTML =
      '<h3>' + esc(p.name) + 'プランのくわしい内容</h3>' +
      '<p class="for">' + esc(p.lead) + '</p>' +
      '<table class="confirm"><tbody>' +
      '<tr><th scope="row">1人あたり月額</th><td>' + M.yen(p.price) + '（税抜）</td></tr>' +
      '<tr><th scope="row">最低利用人数</th><td>' + p.min + '人分から</td></tr>' +
      '<tr><th scope="row">初期費用</th><td>' + M.yen(p.init) + '（税抜）※</td></tr>' +
      '<tr><th scope="row">無料お試し</th><td>' + p.trial + '日間</td></tr>' +
      can + '</tbody></table>' +
      '<p class="hint">料金の条件は、このページの下の「※」の注記もあわせてご覧ください。</p>' +
      '<div class="actions"><a class="btn btn-main btn-small" href="#form">資料請求（無料）へ進む</a>' +
      '<a class="btn btn-sub btn-small" href="#plans">3つのプランをくらべる</a></div>';
  }

  // ---- 画面の切り替え（#hash）
  var VIEWS = ["top", "plans", "form", "confirm", "done"];
  var IN_TOP = ["faq", "features"];
  var state = { data: null, sent: false };

  function show() {
    var h = decodeURIComponent((location.hash || "#top").slice(1));
    var planId = /^plan=/.test(h) ? h.slice(5) : null;
    var plan = planId && M.plans.filter(function (p) { return p.id === planId; })[0];
    var view = VIEWS.indexOf(h) >= 0 ? h : (plan ? "plans" : "top");
    if ((view === "confirm" || view === "done") && !state.data) { location.replace("#form"); return; }
    if (view === "done" && !state.sent) { location.replace("#confirm"); return; }
    VIEWS.forEach(function (v) { $("view-" + v).classList.toggle("on", v === view); });
    document.querySelectorAll(".gnav a").forEach(function (a) {
      var n = a.getAttribute("data-nav");
      var on = (n === h) || (n === "plans" && view === "plans") || (n === "top" && view === "top" && h !== "faq") || (n === "form" && (view === "confirm" || view === "done"));
      a.classList.toggle("on", on);
    });
    M.plans.forEach(function (p) { $("plan-" + p.id).classList.toggle("focus", !!plan && p.id === plan.id); });
    $("plan-detail").hidden = !plan;
    if (plan) renderPlanDetail(plan);
    if (IN_TOP.indexOf(h) >= 0) { $(h).scrollIntoView(); }
    else if (plan) { $("plan-detail").scrollIntoView(); }
    else { window.scrollTo(0, 0); }
    if (view === "confirm") renderConfirm();
  }
  window.addEventListener("hashchange", show);

  // ---- 入力チェック
  var form = $("req-form");
  function val(id) { return $(id).value.trim(); }
  function setErr(id, msg) {
    var el = $(id), box = el.parentNode.querySelector(".field-err");
    if (el.type === "checkbox") box = el.closest(".field").querySelector(".field-err");
    if (msg) {
      el.setAttribute("aria-invalid", "true");
      if (!box) { box = document.createElement("p"); box.className = "field-err"; el.closest(".field").appendChild(box); }
      box.textContent = msg;
    } else {
      el.removeAttribute("aria-invalid");
      if (box) box.remove();
    }
  }
  function check() {
    var errs = [];
    function need(id, label) {
      var m = val(id) ? "" : label + "を入力してください。";
      setErr(id, m); if (m) errs.push(m);
    }
    need("company", "会社名");
    need("dept", "部署名");
    need("person", "お名前");
    var mail = val("mail"), mm = "";
    if (!mail) mm = "メールアドレスを入力してください。";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) mm = "メールアドレスの形が正しくありません（例：taro@example.com）。";
    setErr("mail", mm); if (mm) errs.push(mm);
    var tel = val("tel"), tm = "";
    if (tel && !/^[0-9-]{10,13}$/.test(tel)) tm = "電話番号は半角の数字とハイフン（-）で、10〜13文字で入力してください（入力しなくてもかまいません）。";
    setErr("tel", tm); if (tm) errs.push(tm);
    var sm = $("size").value ? "" : "従業員数を選んでください。";
    setErr("size", sm); if (sm) errs.push(sm);
    var am = $("agree").checked ? "" : "個人情報の取り扱いへの同意にチェックを入れてください。";
    setErr("agree", am); if (am) errs.push(am);
    var box = $("err-box");
    if (errs.length) {
      box.textContent = "入力にまちがいがあります（" + errs.length + "件）。\n" + errs.map(function (e) { return "・" + e; }).join("\n");
      box.hidden = false;
      box.scrollIntoView({ block: "center" });
    } else { box.hidden = true; box.textContent = ""; }
    return errs.length === 0;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!check()) { state.data = null; return; }
    var wants = Array.prototype.filter.call(form.querySelectorAll('input[name="want"]'), function (c) { return c.checked; })
      .map(function (c) { return c.value; });
    state.data = {
      company: val("company"), dept: val("dept"), person: val("person"), mail: val("mail"),
      tel: val("tel"), size: $("size").value, wants: wants, memo: $("memo").value.trim(),
      magazine: $("magazine").checked
    };
    state.sent = false;
    location.hash = "#confirm";
  });

  function renderConfirm() {
    var d = state.data;
    var list = [
      ["会社名", d.company], ["部署名", d.dept], ["お名前", d.person], ["メールアドレス", d.mail],
      ["電話番号", d.tel || "（入力なし）"], ["従業員数", d.size],
      ["知りたいこと", d.wants.length ? d.wants.join("、") : "（選んでいません）"],
      ["ご相談・ご質問", d.memo || "（入力なし）"],
      ["メールマガジン", d.magazine ? "受け取る" : "受け取らない"],
      ["個人情報の取り扱い", "同意する"]
    ];
    $("confirm-table").tBodies[0].innerHTML = list.map(function (r) {
      return '<tr><th scope="row">' + r[0] + '</th><td>' + esc(r[1]) + '</td></tr>';
    }).join("");
  }

  $("back-edit").addEventListener("click", function () { location.hash = "#form"; });
  $("send").addEventListener("click", function () {
    var d = state.data;
    if (d && window.MIRAI_MAIL) {
      MIRAI_MAIL.send("kintai", d.mail, d.person, [
        ["会社名", d.company], ["部署名", d.dept], ["お名前", d.person], ["メールアドレス", d.mail],
        ["電話番号", d.tel || "（入力なし）"], ["従業員数", d.size],
        ["知りたいこと", d.wants.length ? d.wants.join("、") : "（選んでいません）"],
        ["ご相談・ご質問", d.memo || "（入力なし）"], ["メールマガジン", d.magazine ? "受け取る" : "受け取らない"]
      ]);
      MIRAI_MAIL.note($("mail-note"), d.mail);
    }
    state.sent = true; location.hash = "#done";
  });

  function resetAll() {
    form.reset(); // メールマガジンは最初の状態（チェックあり）に戻る
    ["company", "dept", "person", "mail", "tel", "size", "agree"].forEach(function (id) { setErr(id, ""); });
    $("err-box").hidden = true;
    state.data = null; state.sent = false;
  }
  $("clear-form").addEventListener("click", function () { resetAll(); window.scrollTo(0, 0); });
  $("reset-all").addEventListener("click", function () { resetAll(); location.hash = "#form"; });

  show();
})();
