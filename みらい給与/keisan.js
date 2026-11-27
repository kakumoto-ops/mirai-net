/* みらい給与（架空）の計算のしくみ。画面（index.html）と、答え合わせの node の両方から使う。
   きまり：働いた時間＝退勤−出勤−休憩（1分単位）／1日8時間を超えた分は25%増し／
   22時〜翌5時の分はさらに25%増し／人ごとの合計を1円未満切り捨て。
   ソフトとしての作り：休憩は深夜の時間帯の外で取ったものとして扱う。
   休憩の不足・同じ行の重複・最低賃金は確かめない（練習のわな）。 */
(function (root) {
  'use strict';

  var EMPLOYEES = [
    { id: 'e1', name: '春山 さくら', rate: 1350, place: '東京都（本社）' },
    { id: 'e2', name: '夏川 けん', rate: 1300, place: '東京都（本社）' },
    { id: 'e3', name: '秋野 みどり', rate: 1250, place: '東京都（本社）' },
    { id: 'e4', name: '冬木 ゆう', rate: 1400, place: '東京都（本社）' },
    { id: 'e5', name: 'みらい 花子', rate: 1320, place: '東京都（本社）' }
  ];

  // "9:00" / "09:00" → 540（分）。読めなければ null
  function toMin(s) {
    var m = /^\s*(\d{1,2})[:：](\d{2})\s*$/.exec(s == null ? '' : String(s));
    if (!m) return null;
    var h = +m[1], mi = +m[2];
    if (mi > 59 || h > 24 || (h === 24 && mi > 0)) return null;
    return h * 60 + mi;
  }

  function overlap(a1, a2, b1, b2) {
    return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
  }

  // 深夜（22:00〜翌5:00）にかかった分
  function nightMinutes(start, end) {
    var n = 0;
    n += overlap(start, end, 0, 5 * 60);             // その日の 0:00〜5:00
    n += overlap(start, end, 22 * 60, 29 * 60);      // その日の 22:00〜翌5:00
    n += overlap(start, end, 46 * 60, 53 * 60);      // 翌日の 22:00 以降（念のため）
    return n;
  }

  // 1行を計算。{ok:true, worked, ot, night} か {ok:false, reason:'noOut'|'bad'}
  function calcRow(r) {
    var outStr = r.out == null ? '' : String(r.out).trim();
    if (outStr === '') return { ok: false, reason: 'noOut' };
    var s = toMin(r.in), e = toMin(outStr);
    var b = String(r.brk == null ? '' : r.brk).trim();
    var brk = b === '' ? 0 : Number(b);
    if (s === null || e === null || !isFinite(brk) || brk < 0 || Math.floor(brk) !== brk) {
      return { ok: false, reason: 'bad' };
    }
    if (e <= s) e += 24 * 60; // 日をまたいだ勤務
    var worked = e - s - brk;
    if (worked <= 0) return { ok: false, reason: 'bad' };
    var ot = Math.max(0, worked - 8 * 60);
    var night = Math.min(nightMinutes(s, e), worked);
    return { ok: true, worked: worked, ot: ot, night: night };
  }

  // rows: [{date, name, in, out, brk}]
  function calcPayroll(rows, employees) {
    employees = employees || EMPLOYEES;
    var byName = {};
    var people = employees.map(function (emp) {
      var p = { name: emp.name, rate: emp.rate, days: 0, worked: 0, ot: 0, night: 0, pay: 0, detail: [] };
      byName[emp.name] = p;
      return p;
    });
    var skippedNoOut = [], skippedBad = [];
    rows.forEach(function (r) {
      var p = byName[String(r.name || '').trim()];
      if (!p) { skippedBad.push(r); return; }
      var c = calcRow(r);
      if (!c.ok) { (c.reason === 'noOut' ? skippedNoOut : skippedBad).push(r); return; }
      p.days += 1;
      p.worked += c.worked;
      p.ot += c.ot;
      p.night += c.night;
      p.detail.push({ date: r.date, in: r.in, out: r.out, brk: r.brk, worked: c.worked, ot: c.ot, night: c.night });
    });
    var total = 0;
    people.forEach(function (p) {
      // 支給額 = 時給×(働いた分 + 残業分×0.25 + 深夜分×0.25)/60 を、人ごとに1円未満切り捨て
      // 小数のずれを避けるため、240 倍した整数で計算する
      var x240 = p.rate * (4 * p.worked + p.ot + p.night);
      p.pay = Math.floor(x240 / 240);
      total += p.pay;
    });
    return { people: people, total: total, skippedNoOut: skippedNoOut, skippedBad: skippedBad };
  }

  // 勤怠 CSV（日付,名前,出勤,退勤,休憩（分））を読む
  function parseCsv(text) {
    var lines = String(text || '').replace(/^﻿/, '').split(/\r\n|\n|\r/);
    var rows = [], bad = 0;
    lines.forEach(function (line, i) {
      if (line.trim() === '') return;
      var c = line.split(',').map(function (v) { return v.replace(/^\s*"?|"?\s*$/g, ''); });
      if (i === 0 && /日付/.test(c[0])) return; // 見出しの行
      if (c.length < 4 || c[0] === '' || c[1] === '') { bad++; return; }
      rows.push({ date: c[0], name: c[1], in: c[2] || '', out: c[3] || '', brk: c[4] == null ? '' : c[4] });
    });
    return { rows: rows, bad: bad };
  }

  function toCsv(rows) {
    var out = ['日付,名前,出勤,退勤,休憩（分）'];
    rows.forEach(function (r) {
      out.push([r.date, r.name, r.in, r.out, r.brk].map(function (v) {
        v = v == null ? '' : String(v);
        return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(','));
    });
    return '﻿' + out.join('\r\n') + '\r\n';
  }

  var api = { EMPLOYEES: EMPLOYEES, toMin: toMin, calcRow: calcRow, calcPayroll: calcPayroll, parseCsv: parseCsv, toCsv: toCsv };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MiraiKeisan = api;
})(this);
