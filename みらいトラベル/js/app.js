/* みらいトラベル（架空）— 画面の切り替え（#hash）
   #/                    トップ（検索）
   #/list?area=fukuoka&date=2026-12-10&nights=1&people=1&rooms=1&sort=rec&bf=1&walk=5&score=4&ns=1
   #/hotel?id=F01&date=…&nights=…&people=…&rooms=…
   #/book?id=F01&plan=b&date=…   予約の入力
   #/confirm                    確認
   #/done                       完了（練習用）
   みらい検索からの深いリンク（短い形）：#hotel=F01・#area=fukuoka（osaka / sendai）・#top
*/
(function () {
  var MT = window.MT;
  var app = document.getElementById('app');
  var KEY = 'mirai-travel-v1';
  var store = load();

  function load() { try { var s = localStorage.getItem(KEY); return s ? JSON.parse(s) : {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* 保存できなくても動く */ } }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function yen(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '円'; }
  function timeLabel(t) { var h = parseInt(t, 10), m = t.slice(-2); return h >= 24 ? '翌' + (h - 24) + ':' + m : h + ':' + m; }
  function toMin(t) { var p = t.split(':'); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); }
  function hotelById(id) { for (var i = 0; i < MT.HOTELS.length; i++) if (MT.HOTELS[i].id === id) return MT.HOTELS[i]; return null; }
  function planById(h, id) { for (var i = 0; i < h.plans.length; i++) if (h.plans[i].id === id) return h.plans[i]; return null; }
  function cancelTag(p) { return p.cancel === 'free' ? 'キャンセル無料（前日18:00まで）' : '返金不可'; }
  function cancelText(p) {
    return p.cancel === 'free'
      ? '宿泊日の前日18:00までのキャンセルは無料です。前日18:00以降・当日のキャンセルと連絡なしの不泊は、宿泊料金の100%がかかります。'
      : '予約を確定した時点から、キャンセル・日程の変更・不泊のいずれも宿泊料金の100%がかかります（返金されません）。';
  }

  // ---------- 条件（hash の ? 以降） ----------
  function parseHash() {
    var h = location.hash.replace(/^#/, '') || '/';
    // みらい検索からの深いリンクの短い形：#hotel=F01（宿1軒）・#area=fukuoka（地域の一覧）・#top
    if (h.charAt(0) !== '/') {
      var sq = new URLSearchParams(h);
      if (sq.get('hotel')) { sq.set('id', sq.get('hotel')); sq.delete('hotel'); return { path: '/hotel', q: sq }; }
      if (sq.get('area')) return { path: '/list', q: sq };
      return { path: '/', q: new URLSearchParams('') };
    }
    var i = h.indexOf('?');
    var path = i >= 0 ? h.slice(0, i) : h;
    var q = new URLSearchParams(i >= 0 ? h.slice(i + 1) : '');
    if (path === '') path = '/';
    return { path: path, q: q };
  }
  function cond(q) {
    var c = {
      area: q.get('area') || '', date: q.get('date') || '2026-12-01',
      nights: parseInt(q.get('nights') || '1', 10), people: parseInt(q.get('people') || '1', 10), rooms: parseInt(q.get('rooms') || '1', 10),
      sort: q.get('sort') || 'rec', bf: q.get('bf') === '1', walk: parseInt(q.get('walk') || '0', 10),
      score: parseFloat(q.get('score') || '0'), ns: q.get('ns') === '1'
    };
    if (!MT.REGIONS[c.area]) c.area = 'fukuoka';
    var d = MT.dayNum(c.date);
    if (!/^2026-12-\d\d$/.test(c.date) || !(d >= 1 && d <= 31)) { c.date = '2026-12-01'; d = 1; }
    c.errors = [];
    if (!(c.nights >= 1 && c.nights <= 5)) { c.nights = 1; }
    if (d + c.nights - 1 > 31) c.errors.push('12月31日の夜までの宿泊しか選べません（練習用の料金表は2026年12月の分だけです）。');
    if (!(c.people >= 1 && c.people <= 6)) c.people = 1;
    if (!(c.rooms >= 1 && c.rooms <= 3)) c.rooms = 1;
    if (c.people < c.rooms) c.errors.push('部屋数が人数より多くなっています。');
    if (c.people > c.rooms * 2) c.errors.push('1室に泊まれるのは2名までです。部屋数を増やしてください。');
    return c;
  }
  function qs(c, extra) {
    var o = { area: c.area, date: c.date, nights: c.nights, people: c.people, rooms: c.rooms };
    if (extra) for (var k in extra) o[k] = extra[k];
    var parts = [];
    for (var key in o) if (o[key] !== '' && o[key] != null && o[key] !== false) parts.push(key + '=' + encodeURIComponent(o[key]));
    return parts.join('&');
  }
  function listQs(c, over) {
    var f = { sort: c.sort, bf: c.bf ? 1 : '', walk: c.walk || '', score: c.score || '', ns: c.ns ? 1 : '' };
    if (over) for (var k in over) f[k] = over[k];
    return qs(c, f);
  }
  function outDate(c) { return MT.label(MT.dateOf(MT.dayNum(c.date) + c.nights)); }
  function condText(c) {
    return MT.label(c.date) + ' チェックイン → ' + outDate(c) + ' チェックアウト（' + c.nights + '泊）・' + c.people + '名・' + c.rooms + '室';
  }
  function go(hash) { location.hash = hash; }

  // ---------- 絵（写真の代わり） ----------
  function hotelSvg(h, big) {
    var w = 160, ht = 110, c = h.color, s = '';
    s += '<rect width="160" height="110" fill="#EEF4F3"/><rect y="92" width="160" height="18" fill="#D9E2E0"/>';
    if (h.type === 'ryokan') {
      s += '<polygon points="22,52 80,26 138,52" fill="#5A4636"/><rect x="30" y="52" width="100" height="40" fill="' + c + '"/>';
      for (var k = 0; k < 4; k++) s += '<rect x="' + (38 + k * 23) + '" y="60" width="16" height="14" fill="#F7EBD2"/>';
      s += '<rect x="72" y="76" width="16" height="16" fill="#3B2E24"/>';
    } else {
      var fl = h.floors || 7, fh = 8, top = 92 - fl * fh - 6, bx = 48, bw = 64;
      s += '<rect x="' + bx + '" y="' + top + '" width="' + bw + '" height="' + (92 - top) + '" fill="' + c + '"/>';
      for (var f = 0; f < fl - 1; f++) for (var j = 0; j < 4; j++)
        s += '<rect x="' + (bx + 6 + j * 14) + '" y="' + (top + 6 + f * fh) + '" width="9" height="5" fill="#F4F7FA" opacity="0.9"/>';
      s += '<rect x="72" y="80" width="16" height="12" fill="#2F3A40"/>';
    }
    return '<svg class="hotel-svg" viewBox="0 0 ' + w + ' ' + ht + '" role="img" aria-label="宿の外観のイメージ（絵）"' + (big ? ' width="320" height="220"' : '') + '>' + s + '</svg>';
  }

  // ---------- 料金の見せ方 ----------
  function bestPlan(h, c, onlyBreakfast) {
    var best = null;
    h.plans.forEach(function (p) {
      if (onlyBreakfast && p.meal !== '朝食付き') return;
      var q = MT.quote(h, p, c.date, c.nights, c.people, c.rooms);
      if (!q) return;
      var shown = h.taxDisplay === 'excl' ? q.excl : q.incl;
      if (!best || shown < best.shown) best = { plan: p, q: q, shown: shown };
    });
    return best;
  }

  // ---------- 画面：トップ ----------
  function selectOptions(list, val) {
    return list.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('');
  }
  function dateOptions() { var a = []; for (var d = 1; d <= 31; d++) a.push([MT.dateOf(d), MT.label(MT.dateOf(d))]); return a; }
  function nums(a, b, unit) { var r = []; for (var i = a; i <= b; i++) r.push([i, i + unit]); return r; }

  function searchForm(c, idp) {
    idp = idp || 's';
    var areas = Object.keys(MT.REGIONS).map(function (k) { return [k, MT.REGIONS[k].name]; });
    return '' +
      '<form class="search" id="' + idp + '-form">' +
      '<div class="grid5">' +
      '<div><label for="' + idp + '-area">地域</label><select id="' + idp + '-area">' + selectOptions(areas, c.area) + '</select></div>' +
      '<div><label for="' + idp + '-date">チェックイン日</label><select id="' + idp + '-date">' + selectOptions(dateOptions(), c.date) + '</select></div>' +
      '<div><label for="' + idp + '-nights">泊数</label><select id="' + idp + '-nights">' + selectOptions(nums(1, 5, '泊'), c.nights) + '</select></div>' +
      '<div><label for="' + idp + '-people">人数（大人）</label><select id="' + idp + '-people">' + selectOptions(nums(1, 6, '名'), c.people) + '</select></div>' +
      '<div><label for="' + idp + '-rooms">部屋数</label><select id="' + idp + '-rooms">' + selectOptions(nums(1, 3, '室'), c.rooms) + '</select></div>' +
      '</div>' +
      '<p class="hint">1室は2名まで。料金表は2026年12月1日〜31日の宿泊分です。</p>' +
      '<button type="submit" class="btn btn-main">この条件で宿をさがす</button>' +
      '</form>';
  }
  function formCond(idp) {
    function v(id) { return document.getElementById(idp + '-' + id).value; }
    return { area: v('area'), date: v('date'), nights: v('nights'), people: v('people'), rooms: v('rooms') };
  }

  function renderTop(q) {
    var c = cond(q);
    if (!q.get('area') && store.last) { c = cond(new URLSearchParams(store.last)); }
    var counts = {};
    MT.HOTELS.forEach(function (h) { counts[h.region] = (counts[h.region] || 0) + 1; });
    var regionBtns = Object.keys(MT.REGIONS).map(function (k) {
      return '<li><a class="region-link" href="#/list?' + qs({ area: k, date: c.date, nights: c.nights, people: c.people, rooms: c.rooms }) + '">' +
        esc(MT.REGIONS[k].name) + '<span>' + counts[k] + '軒</span></a></li>';
    }).join('');
    app.innerHTML = '' +
      '<section class="hero"><h2>出張の宿を、条件でさがす</h2><p>地域・日にち・人数を選んで「この条件で宿をさがす」を押してください。</p>' + searchForm(c, 's') + '</section>' +
      '<section class="card"><h2>地域からさがす</h2><ul class="regions">' + regionBtns + '</ul></section>' +
      '<section class="card small"><h2>料金の表示について</h2><ul class="dots">' +
      '<li>一覧と詳細の料金は、選んだ泊数・部屋数の<strong>合計</strong>です。多くの宿は税込で表示しています。表示の形は宿ごとに書いてあります。</li>' +
      '<li>宿泊税は宿泊料金とは別にかかります（このサイトの練習用の決まり：1人1泊 福岡200円・大阪200円・仙台300円）。</li>' +
      '<li>金曜・土曜の夜と12月29日〜31日は料金が上がります。キャンセルの決まりはプランごとに違います。</li>' +
      '</ul></section>';
    document.getElementById('s-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = formCond('s');
      store.last = qs(f); save();
      go('#/list?' + qs(f, { sort: 'rec' }));
    });
  }

  // ---------- 画面：一覧 ----------
  function renderList(q) {
    var c = cond(q);
    store.last = qs(c); save();
    var region = MT.REGIONS[c.area];
    var head = '<nav class="crumb" aria-label="現在の場所"><a href="#/">トップ</a> › ' + esc(region.name) + 'の宿</nav>';
    if (c.errors.length) {
      app.innerHTML = head + '<div class="card"><p class="err">' + c.errors.map(esc).join('<br>') + '</p>' + searchForm(c, 'l') + '</div>';
      bindRe('l');
      return;
    }
    var rows = [];
    MT.HOTELS.forEach(function (h) {
      if (h.region !== c.area) return;
      if (c.walk && h.walk > c.walk) return;
      if (c.score && h.score < c.score) return;
      if (c.ns && h.smoking !== '禁煙') return;
      var b = bestPlan(h, c, c.bf);
      if (!b) return;
      rows.push({ h: h, b: b });
    });
    rows.sort(function (x, y) {
      if (c.sort === 'price') {
        if (x.b.q.full !== y.b.q.full) return x.b.q.full ? 1 : -1;
        return x.b.shown - y.b.shown || x.h.rec - y.h.rec;
      }
      if (c.sort === 'score') return y.h.score - x.h.score || y.h.count - x.h.count || x.h.rec - y.h.rec;
      return x.h.rec - y.h.rec;
    });
    function sortBtn(key, text) {
      return '<button type="button" class="sort-btn" data-sort="' + key + '" aria-pressed="' + (c.sort === key) + '">' + text + '</button>';
    }
    var walkOpts = [[0, '指定なし'], [3, '3分以内'], [5, '5分以内'], [10, '10分以内']];
    var scoreOpts = [[0, '指定なし'], [3.5, '3.5以上'], [4, '4.0以上'], [4.5, '4.5以上']];
    var filters = '' +
      '<form class="filters" id="filters"><h2>絞り込み</h2>' +
      '<div class="check"><input type="checkbox" id="f-bf"' + (c.bf ? ' checked' : '') + '><label for="f-bf">朝食付きのプラン</label></div>' +
      '<label for="f-walk">駅から徒歩</label><select id="f-walk">' + selectOptions(walkOpts, c.walk) + '</select>' +
      '<label for="f-score">評価</label><select id="f-score">' + selectOptions(scoreOpts, c.score) + '</select>' +
      '<div class="check"><input type="checkbox" id="f-ns"' + (c.ns ? ' checked' : '') + '><label for="f-ns">禁煙の宿</label></div>' +
      '<button type="button" class="btn btn-sub btn-small" id="f-clear">絞り込みを解除する</button>' +
      '</form>';
    var cards = rows.map(function (r) {
      var h = r.h, b = r.b, p = b.plan, qd = b.q;
      var link = '#/hotel?' + qs(c, { id: h.id });
      var price;
      if (qd.full) {
        price = '<p class="full-badge">満室</p><p class="full-note">' + qd.fullDates.map(MT.label).join('・') + ' は満室です</p>';
      } else {
        var stay = '合計（' + c.nights + '泊・' + c.rooms + '室・' + c.people + '名）';
        var amount = h.taxDisplay === 'excl'
          ? '<p class="amount">' + yen(qd.excl) + '<small>（税抜・宿泊税別）</small></p>'
          : '<p class="amount"><small>税込</small> ' + yen(qd.incl) + '<small>（宿泊税別）</small></p>';
        var first = (c.nights > 1 || c.rooms > 1)
          ? '<p class="per">1泊目・1室あたり ' + (h.taxDisplay === 'excl' ? yen(qd.nights[0].room1Excl) + '（税抜）' : '税込 ' + yen(c.people > c.rooms ? qd.nights[0].room2Incl : qd.nights[0].room1Incl)) + '</p>' : '';
        price = '<p class="plan-name">' + esc(p.name) + '</p>' +
          '<p class="plan-tags"><span class="tag">' + p.meal + '</span><span class="tag ' + (p.cancel === 'free' ? 'tag-ok' : 'tag-ng') + '">' + cancelTag(p) + '</span></p>' +
          '<p class="stay">' + stay + '</p>' + amount + first;
      }
      return '<article class="hotel-card">' +
        '<div class="thumb">' + hotelSvg(h) + '</div>' +
        '<div class="info"><h3><a href="' + link + '">' + esc(h.name) + '</a></h3>' +
        '<p class="catch">' + esc(h.catch) + '</p>' +
        '<p class="access">最寄り：' + esc(h.station) + ' 徒歩' + h.walk + '分</p>' +
        '<p class="rating">評価 <strong>' + h.score.toFixed(1) + '</strong> / 5（口コミ ' + h.count + '件）</p>' +
        '<p class="tags">' + [h.smoking].concat(h.facilities.slice(0, 3)).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</p></div>' +
        '<div class="price">' + price + '<button type="button" class="btn btn-main btn-small" data-go="' + esc(link) + '">宿の詳細とプランを見る</button></div>' +
        '</article>';
    }).join('');
    app.innerHTML = head +
      '<div class="cond-bar"><p><strong>' + esc(region.name) + '</strong>｜' + esc(condText(c)) + '</p>' +
      '<details><summary>日にち・人数を変える</summary>' + searchForm(c, 'l') + '</details></div>' +
      '<div class="list-layout"><aside>' + filters + '</aside><div>' +
      '<div class="list-head"><p class="count">' + rows.length + '軒の宿が見つかりました</p>' +
      '<div class="sorts" role="group" aria-label="並べ替え"><span>並べ替え：</span>' + sortBtn('rec', 'おすすめ順') + sortBtn('price', '安い順') + sortBtn('score', '評価が高い順') + '</div></div>' +
      (cards || '<p class="card">条件に合う宿がありません。絞り込みを変えてください。</p>') +
      '</div></div>';
    bindRe('l');
    Array.prototype.forEach.call(app.querySelectorAll('.sort-btn'), function (bt) {
      bt.addEventListener('click', function () { go('#/list?' + listQs(c, { sort: bt.getAttribute('data-sort') })); });
    });
    function applyFilters() {
      go('#/list?' + listQs(c, {
        bf: document.getElementById('f-bf').checked ? 1 : '',
        walk: document.getElementById('f-walk').value === '0' ? '' : document.getElementById('f-walk').value,
        score: document.getElementById('f-score').value === '0' ? '' : document.getElementById('f-score').value,
        ns: document.getElementById('f-ns').checked ? 1 : ''
      }));
    }
    ['f-bf', 'f-walk', 'f-score', 'f-ns'].forEach(function (id) { document.getElementById(id).addEventListener('change', applyFilters); });
    document.getElementById('f-clear').addEventListener('click', function () { go('#/list?' + listQs(c, { bf: '', walk: '', score: '', ns: '' })); });
    bindGo();
  }
  function bindRe(idp) {
    var f = document.getElementById(idp + '-form');
    if (!f) return;
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = formCond(idp);
      go('#/list?' + qs(v, { sort: 'rec' }));
    });
  }
  function bindGo() {
    Array.prototype.forEach.call(app.querySelectorAll('[data-go]'), function (bt) {
      bt.addEventListener('click', function () { go(bt.getAttribute('data-go')); });
    });
  }

  // ---------- 画面：宿の詳細 ----------
  function renderHotel(q) {
    var h = hotelById(q.get('id'));
    if (!h) { app.innerHTML = '<div class="card"><p>宿が見つかりません。</p><p><a href="#/">トップへ</a></p></div>'; return; }
    if (!q.get('area')) q.set('area', h.region);
    var c = cond(q);
    c.area = h.region;
    var region = MT.REGIONS[h.region];
    var head = '<nav class="crumb" aria-label="現在の場所"><a href="#/">トップ</a> › <a href="#/list?' + qs(c) + '">' + esc(region.name) + 'の宿</a> › ' + esc(h.name) + '</nav>';
    var fri = h.fri != null ? h.fri : MT.RULES.fri, sat = h.sat != null ? h.sat : MT.RULES.sat;
    var info = [
      ['所在地', region.city + '（番地は練習用のため省略）'],
      ['アクセス', h.access],
      ['評価', h.score.toFixed(1) + ' / 5（口コミ ' + h.count + '件）'],
      ['たばこ', h.smoking === '禁煙' ? '全室禁煙' : '喫煙できる部屋です（禁煙の部屋はありません）'],
      ['設備', h.facilities.join('・')],
      ['チェックイン', timeLabel(h.inStart) + '〜' + timeLabel(h.inEnd) + '（' + timeLabel(h.inEnd) + 'を過ぎる到着はできません）'],
      ['チェックアウト', '〜' + timeLabel(h.out)],
      ['支払い方法', h.pay.join('・')],
      ['料金の表示', h.taxDisplay === 'excl' ? '一覧の料金は税抜です。下の表で税込と宿泊税を確かめてください。' : '税込（宿泊税は別）'],
      ['曜日による料金', '金曜の夜 +' + yen(fri) + '、土曜の夜 +' + yen(sat) + '、12月29日〜31日の夜 +' + yen(MT.RULES.yearEnd) + '（1室1泊・税抜で上乗せ）'],
      ['宿泊税', '1人1泊 ' + yen(region.tax) + '（宿泊料金とは別）']
    ].map(function (r) { return '<tr><th scope="row">' + r[0] + '</th><td>' + esc(r[1]) + '</td></tr>'; }).join('');

    var anyFull = false, fullDates = [];
    var excl = h.taxDisplay === 'excl';
    var planRows = c.errors.length ? '' : h.plans.map(function (p) {
      var qd = MT.quote(h, p, c.date, c.nights, c.people, c.rooms);
      if (qd.full) { anyFull = true; fullDates = qd.fullDates; }
      var nightsTxt = qd.nights.map(function (n, i) {
        return (i + 1) + '泊目 ' + yen(n.incl);
      }).join('・');
      var bookHash = '#/book?' + qs(c, { id: h.id, plan: p.id });
      return '<tr>' +
        '<td><strong>' + esc(p.name) + '</strong></td>' +
        '<td>' + p.meal + '</td>' +
        '<td><span class="tag ' + (p.cancel === 'free' ? 'tag-ok' : 'tag-ng') + '">' + cancelTag(p) + '</span></td>' +
        (excl ? '<td class="num">' + yen(qd.excl) + '</td>' : '') +
        '<td class="num">' + yen(qd.incl) + (c.nights > 1 ? '<br><small>' + nightsTxt + '</small>' : '') + '</td>' +
        '<td class="num">' + yen(qd.tax) + '<br><small>' + region.tax + '円×' + c.people + '名×' + c.nights + '泊</small></td>' +
        '<td class="num total">' + yen(qd.total) + '</td>' +
        '<td>' + (qd.full ? '<button type="button" class="btn btn-sub btn-small" disabled>満室のため予約できません</button>'
          : '<button type="button" class="btn btn-main btn-small" data-go="' + esc(bookHash) + '">このプランで予約へ進む</button>') + '</td>' +
        '</tr>';
    }).join('');
    var planTable = c.errors.length ? '<p class="err">' + c.errors.map(esc).join('<br>') + '</p>' :
      (anyFull ? '<p class="full-box">この日程は満室です（' + fullDates.map(MT.label).join('・') + '）。日にちを変えてお選びください。</p>' : '') +
      '<div class="table-wrap"><table class="plans"><caption>' + esc(condText(c)) + ' の料金</caption><thead><tr>' +
      '<th scope="col">プラン</th><th scope="col">食事</th><th scope="col">キャンセル</th>' +
      (excl ? '<th scope="col">宿泊料金（税抜）</th>' : '') +
      '<th scope="col">宿泊料金（税込）</th><th scope="col">宿泊税</th><th scope="col">お支払いの合計<br>（税込・宿泊税込み）</th><th scope="col">予約</th>' +
      '</tr></thead><tbody>' + planRows + '</tbody></table></div>';

    var policy = h.plans.map(function (p) { return '<dt>' + esc(p.name) + '（' + cancelTag(p) + '）</dt><dd>' + cancelText(p) + '</dd>'; }).join('');

    // 12月の料金カレンダー（1名1室・1泊・税込）
    var calHead = '<tr><th scope="col">日にち</th>' + h.plans.map(function (p) { return '<th scope="col">' + esc(p.name) + '<br><small>' + p.meal + '・' + (p.cancel === 'free' ? 'キャンセル無料' : '返金不可') + '</small></th>'; }).join('') + '</tr>';
    var calBody = '';
    for (var d = 1; d <= 31; d++) {
      var ds = MT.dateOf(d), w = MT.dow(ds), isFull = h.full.indexOf(ds) >= 0;
      calBody += '<tr class="' + (w === 6 ? 'sat' : w === 0 ? 'sun' : w === 5 ? 'fri' : '') + '"><th scope="row">' + MT.label(ds) + '</th>' +
        h.plans.map(function (p) { return '<td class="num">' + (isFull ? '満室' : yen(MT.incl(MT.roomNightExcl(h, p, ds, 1)))) + '</td>'; }).join('') + '</tr>';
    }

    app.innerHTML = head +
      '<section class="card hotel-top"><div class="hotel-pic">' + hotelSvg(h, true) + '</div><div>' +
      '<h2 class="hotel-name">' + esc(h.name) + '</h2><p class="catch">' + esc(h.catch) + '</p>' +
      '<div class="table-wrap"><table class="info">' + info + '</table></div></div></section>' +
      '<section class="card"><h2>プランと料金</h2>' +
      '<details class="change"><summary>日にち・人数を変える</summary>' + hotelCondForm(c, h) + '</details>' + planTable +
      '<p class="hint">「宿泊料金（税込）」は ' + c.nights + '泊・' + c.rooms + '室の合計です。宿泊税は人数×泊数でかかります。</p></section>' +
      '<section class="card"><h2>キャンセルの決まり</h2><dl class="policy">' + policy + '</dl></section>' +
      '<section class="card"><details><summary>12月の料金カレンダー（1名1室・1泊・税込）を見る</summary>' +
      '<div class="table-wrap"><table class="cal"><thead>' + calHead + '</thead><tbody>' + calBody + '</tbody></table></div></details></section>' +
      '<p><a class="btn btn-sub" href="#/list?' + qs(c) + '">' + esc(region.name) + 'の宿の一覧へ戻る</a></p>';
    bindGo();
    var hf = document.getElementById('h-form');
    if (hf) hf.addEventListener('submit', function (ev) {
      ev.preventDefault();
      function v(id) { return document.getElementById('h-' + id).value; }
      go('#/hotel?' + qs({ area: h.region, date: v('date'), nights: v('nights'), people: v('people'), rooms: v('rooms') }, { id: h.id }));
    });
  }
  function hotelCondForm(c) {
    return '<form class="search" id="h-form"><div class="grid4">' +
      '<div><label for="h-date">チェックイン日</label><select id="h-date">' + selectOptions(dateOptions(), c.date) + '</select></div>' +
      '<div><label for="h-nights">泊数</label><select id="h-nights">' + selectOptions(nums(1, 5, '泊'), c.nights) + '</select></div>' +
      '<div><label for="h-people">人数（大人）</label><select id="h-people">' + selectOptions(nums(1, 6, '名'), c.people) + '</select></div>' +
      '<div><label for="h-rooms">部屋数</label><select id="h-rooms">' + selectOptions(nums(1, 3, '室'), c.rooms) + '</select></div>' +
      '</div><button type="submit" class="btn btn-main btn-small">この日程で料金を見る</button></form>';
  }

  // ---------- 画面：予約の入力 ----------
  function arrivalOptions() {
    var a = [['', '選んでください']];
    for (var m = 15 * 60; m <= 26 * 60; m += 30) {
      var t = Math.floor(m / 60) + ':' + (m % 60 === 0 ? '00' : '30');
      a.push([t, timeLabel(t)]);
    }
    return a;
  }
  function renderBook(q) {
    var h = hotelById(q.get('id')), p = h && planById(h, q.get('plan'));
    if (!h || !p) { app.innerHTML = '<div class="card"><p>プランが見つかりません。</p><p><a href="#/">トップへ</a></p></div>'; return; }
    if (!q.get('area')) q.set('area', h.region);
    var c = cond(q); c.area = h.region;
    var qd = c.errors.length ? null : MT.quote(h, p, c.date, c.nights, c.people, c.rooms);
    var hotelHash = '#/hotel?' + qs(c, { id: h.id });
    if (!qd || qd.full) {
      app.innerHTML = '<div class="card"><p class="err">' + (qd ? 'この日程は満室のため予約できません。' : c.errors.map(esc).join('<br>')) + '</p><p><a href="' + hotelHash + '">宿の詳細へ戻る</a></p></div>';
      return;
    }
    var thisHash = '#/book?' + qs(c, { id: h.id, plan: p.id });
    var d = (store.draft && store.draft.bookHash === thisHash) ? store.draft : {};
    var payRadios = ['現地払い', '請求書払い'].map(function (m, i) {
      var ok = h.pay.indexOf(m) >= 0;
      var note = m === '現地払い' ? '（チェックインのときに宿で払います）' : '（会社あてに後日 請求書が届きます。会社名が必要です）';
      return '<div class="radio' + (ok ? '' : ' disabled') + '"><input type="radio" name="pay" id="pay' + i + '" value="' + m + '"' + (ok ? '' : ' disabled') + (d.pay === m ? ' checked' : '') + '>' +
        '<label for="pay' + i + '">' + m + (ok ? note : '（この宿では選べません）') + '</label></div>';
    }).join('');
    app.innerHTML = '<nav class="crumb" aria-label="現在の場所"><a href="#/">トップ</a> › <a href="' + hotelHash + '">' + esc(h.name) + '</a> › 予約の入力</nav>' +
      steps(1) +
      '<section class="card"><h2>予約の内容</h2>' + summaryTable(h, p, c, qd) + '</section>' +
      '<section class="card"><h2>宿泊者の情報</h2><form id="book-form" novalidate>' +
      '<label for="b-name">宿泊者（代表者）の名前 <span class="req">必須</span></label><input id="b-name" type="text" autocomplete="off" value="' + esc(d.name || '') + '" placeholder="例：みらい 太郎">' +
      '<label for="b-tel">電話番号 <span class="req">必須</span></label><input id="b-tel" type="tel" autocomplete="off" value="' + esc(d.tel || '') + '" placeholder="例：000-0000-0000">' +
      '<label for="b-company">会社名 <span class="opt">請求書払いのときは必須</span></label><input id="b-company" type="text" autocomplete="off" value="' + esc(d.company || '') + '" placeholder="例：株式会社みらい商事">' +
      (c.people > 1 ? '<label for="b-others">同行者の名前 <span class="opt">任意</span></label><input id="b-others" type="text" autocomplete="off" value="' + esc(d.others || '') + '" placeholder="例：みらい 花子">' : '') +
      '<label for="b-arrive">到着予定時刻 <span class="req">必須</span></label><select id="b-arrive">' + selectOptions(arrivalOptions(), d.arrive || '') + '</select>' +
      '<p class="hint">この宿のチェックインは ' + timeLabel(h.inStart) + '〜' + timeLabel(h.inEnd) + ' です。</p>' +
      '<fieldset><legend>支払い方法 <span class="req">必須</span></legend>' + payRadios + '<p class="hint">このサイトでは、カードなど番号の要る支払いは使いません。</p></fieldset>' +
      '<label for="b-note">宿への要望 <span class="opt">任意</span></label><textarea id="b-note" rows="3">' + esc(d.note || '') + '</textarea>' +
      '<p class="err" id="b-err" role="alert"></p>' +
      '<div class="actions"><button type="submit" class="btn btn-main">入力内容を確認する</button><a class="btn btn-sub" href="' + hotelHash + '">宿の詳細へ戻る</a></div>' +
      '</form></section>';
    document.getElementById('book-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      function v(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
      var payEl = app.querySelector('input[name=pay]:checked');
      var data = { bookHash: thisHash, id: h.id, plan: p.id, date: c.date, nights: c.nights, people: c.people, rooms: c.rooms,
        name: v('b-name'), tel: v('b-tel'), company: v('b-company'), others: v('b-others'), arrive: document.getElementById('b-arrive').value,
        pay: payEl ? payEl.value : '', note: v('b-note') };
      var msg = [];
      if (!data.name) msg.push('・宿泊者（代表者）の名前を入れてください');
      if (!/^[0-9０-９\-－]{10,13}$/.test(data.tel)) msg.push('・電話番号は数字とハイフンで入れてください（例：000-0000-0000）');
      if (!data.arrive) msg.push('・到着予定時刻を選んでください');
      if (!data.pay) msg.push('・支払い方法を選んでください');
      if (data.pay === '請求書払い' && !data.company) msg.push('・請求書払いのときは会社名を入れてください');
      document.getElementById('b-err').textContent = msg.join('\n');
      if (msg.length) return;
      store.draft = data; save();
      go('#/confirm');
    });
  }
  function steps(n) {
    var names = ['入力', '確認', '完了'];
    return '<ol class="steps">' + names.map(function (s, i) { return '<li' + (i + 1 === n ? ' aria-current="step" class="now"' : '') + '>' + (i + 1) + '. ' + s + '</li>'; }).join('') + '</ol>';
  }
  function summaryTable(h, p, c, qd) {
    var rows = [
      ['宿', h.name],
      ['プラン', p.name + '（' + p.meal + '）'],
      ['チェックイン', MT.label(c.date) + '（' + timeLabel(h.inStart) + '〜' + timeLabel(h.inEnd) + '）'],
      ['チェックアウト', outDate(c) + '（〜' + timeLabel(h.out) + '）'],
      ['泊数・人数・部屋数', c.nights + '泊・' + c.people + '名・' + c.rooms + '室'],
      ['キャンセル', cancelTag(p)],
      ['宿泊料金（税込）', yen(qd.incl) + (h.taxDisplay === 'excl' ? '（税抜 ' + yen(qd.excl) + '）' : '')],
      ['宿泊税', yen(qd.tax) + '（' + MT.REGIONS[h.region].tax + '円×' + c.people + '名×' + c.nights + '泊）'],
      ['お支払いの合計', yen(qd.total) + '（税込・宿泊税込み）']
    ];
    return '<div class="table-wrap"><table class="info">' + rows.map(function (r) { return '<tr><th scope="row">' + r[0] + '</th><td>' + esc(r[1]) + '</td></tr>'; }).join('') + '</table></div>';
  }

  // ---------- 画面：確認 ----------
  function renderConfirm() {
    var d = store.draft;
    var h = d && hotelById(d.id), p = h && planById(h, d.plan);
    if (!d || !h || !p) { app.innerHTML = '<div class="card"><p>予約の入力がまだありません。宿をさがして、プランを選んでください。</p><p><a class="btn btn-main" href="#/">宿をさがす</a></p></div>'; return; }
    var c = cond(new URLSearchParams(qs(d)));
    var qd = MT.quote(h, p, c.date, c.nights, c.people, c.rooms);
    var late = toMin(d.arrive) > toMin(h.inEnd);
    var guest = [
      ['宿泊者（代表者）', d.name], ['電話番号', d.tel], ['会社名', d.company || '（なし）']
    ];
    if (c.people > 1) guest.push(['同行者', d.others || '（なし）']);
    guest.push(['到着予定時刻', timeLabel(d.arrive)], ['支払い方法', d.pay], ['宿への要望', d.note || '（なし）']);
    app.innerHTML = '<nav class="crumb" aria-label="現在の場所"><a href="#/">トップ</a> › 予約の確認</nav>' + steps(2) +
      '<section class="card"><h2>予約の内容を確認してください</h2><p>まだ予約は確定していません。内容を確かめてから、いちばん下の［予約を確定する］を押してください。</p>' +
      summaryTable(h, p, c, qd) +
      '<div class="table-wrap"><table class="info">' + guest.map(function (r) { return '<tr><th scope="row">' + r[0] + '</th><td>' + esc(r[1]) + '</td></tr>'; }).join('') + '</table></div>' +
      (late ? '<p class="warn">到着予定時刻（' + timeLabel(d.arrive) + '）が、この宿のチェックインの受付（〜' + timeLabel(h.inEnd) + '）を過ぎています。このままでは泊まれないおそれがあります。</p>' : '') +
      (qd.full ? '<p class="warn">この日程は満室です。</p>' : '') +
      '<h3>キャンセルの決まり</h3><p>' + cancelText(p) + '</p>' +
      '<div class="check agree"><input type="checkbox" id="agree"><label for="agree">上の内容とキャンセルの決まりを確認しました</label></div>' +
      '<div class="actions"><button type="button" class="btn btn-go" id="fix" disabled>予約を確定する</button>' +
      '<button type="button" class="btn btn-sub" id="back">入力に戻る</button></div></section>';
    document.getElementById('agree').addEventListener('change', function () { document.getElementById('fix').disabled = !this.checked || qd.full; });
    document.getElementById('back').addEventListener('click', function () { go(d.bookHash); });
    document.getElementById('fix').addEventListener('click', function () {
      store.done = { id: h.id, plan: p.id, name: d.name, total: qd.total, date: c.date, nights: c.nights };
      save();
      go('#/done');
    });
  }

  // ---------- 画面：完了 ----------
  function renderDone() {
    var d = store.done, h = d && hotelById(d.id);
    app.innerHTML = steps(3) + '<section class="card done">' +
      '<p class="big">練習用のサイトなので、予約はされていません。</p>' +
      '<p>本番では、このボタンは人が自分で押す所です。AI には『確定の前で止まって』と頼みましょう。</p>' +
      (h ? '<p class="sub">（練習で選んだ内容：' + esc(h.name) + '・' + MT.label(d.date) + 'から' + d.nights + '泊・' + esc(d.name) + ' 様・合計 ' + yen(d.total) + '）</p>' : '') +
      '<div class="actions center"><button type="button" class="btn btn-main" id="again">最初の状態に戻す</button><a class="btn btn-sub" href="#/">トップへ</a></div></section>';
    document.getElementById('again').addEventListener('click', resetAll);
  }

  function resetAll() {
    store = {};
    try { localStorage.removeItem(KEY); } catch (e) { /* なにもしない */ }
    if (location.hash === '#/' || location.hash === '') render(); else go('#/');
  }

  function render() {
    var r = parseHash();
    if (r.path === '/list') renderList(r.q);
    else if (r.path === '/hotel') renderHotel(r.q);
    else if (r.path === '/book') renderBook(r.q);
    else if (r.path === '/confirm') renderConfirm();
    else if (r.path === '/done') renderDone();
    else renderTop(r.q);
    window.scrollTo(0, 0);
  }

  document.getElementById('reset').addEventListener('click', resetAll);
  window.addEventListener('hashchange', render);
  render();
})();
