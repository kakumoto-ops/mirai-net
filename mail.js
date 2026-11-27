/* 練習サイト共通：送信ボタンを押したら、入力したメールアドレスに【テスト】の受付メールを送る（2026-11-27）
 * 送るのは Google Apps Script（../メールの仕組み/Code.gs・持ち主 kakumoto@extra-company.jp）。
 * ENDPOINT が空なら何もしない。example.com などの見本のアドレスには届かない（向こうで止める）。
 */
(function () {
  var ENDPOINT = "https://script.google.com/macros/s/AKfycbyECRTb9AL-YQ7zYqbtzVqF_k_aTFaeUK-0LSZsSGbIYBkeylf9VqN1gdGPRACUo7REBg/exec";
  var KEY = "mirai-practice-2026";

  function send(kind, to, name, fields) {
    if (!ENDPOINT || !to) return false;
    try {
      fetch(ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ key: KEY, kind: kind, to: to, name: name || "", fields: fields || [] })
      }).catch(function () {});
      return true;
    } catch (e) { return false; }
  }

  function isSample(to) { return /@(.+\.)?(example\.(com|net|org|jp)|example|test|invalid|localhost)$/i.test(String(to || "").trim()); }

  /* 完了画面に出す一言（el に入れる） */
  function note(el, to) {
    if (!el) return;
    var t = String(to || "").trim();
    if (!ENDPOINT) { el.textContent = ""; el.hidden = true; return; }
    el.hidden = false;
    if (isSample(t)) {
      el.textContent = "見本のアドレス（" + t + "）なので、メールは送っていません。自分のメールアドレスで送ると、【テスト】の受付メールが届きます。";
    } else {
      el.textContent = "入力したメールアドレス（" + t + "）あてに、【テスト】の受付メールを送りました。1〜2分たっても届かないときは、迷惑メールのフォルダも見てください。";
    }
  }

  window.MIRAI_MAIL = { send: send, note: note, isSample: isSample, enabled: function () { return !!ENDPOINT; } };
})();
