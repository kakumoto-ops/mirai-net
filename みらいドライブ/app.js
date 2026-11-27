/* みらいドライブ（練習用）の動き。外から何も読み込まない。乱数を使わない。
   画面の切り替えは #hash：
     #folder=<フォルダのID>   フォルダの一覧（例 #folder=f-miseiri）
     #file=<ファイルのID>     ファイルの中身（例 #file=u02）
     #trash                   ゴミ箱
     #search=<ことば>         ファイル名で探す
     #done=share / #done=empty  完了の画面（練習用） */
(function () {
  'use strict';
  var D = window.MIRAI_DRIVE_DATA;
  var KEY = 'miraiDrive.v' + D.version;
  var NOW = '2026/12/01 10:00';            // 操作した日時はいつもこの固定の日時
  var ROOT = 'f-soumu';
  var ME = 'みらい 太郎';
  var KIND_LABEL = { folder: 'フォルダ', pdf: 'PDF', txt: 'テキスト', csv: 'CSV', xlsx: 'Excel', docx: 'Word', jpg: '画像（JPEG）', png: '画像（PNG）', other: 'ファイル' };
  var KIND_SHORT = { folder: 'フォルダ', pdf: 'PDF', txt: 'TXT', csv: 'CSV', xlsx: 'XLSX', docx: 'DOCX', jpg: 'JPG', png: 'PNG', other: 'FILE' };
  var ROLE_LABEL = { viewer: '閲覧者', commenter: 'コメント可', editor: '編集者' };

  var state;
  var selected = {};            // いま選んでいるもの（保存しない）

  /* ───── 保存 ───── */
  function initialState() {
    var items = {}, order = [];
    D.items.forEach(function (it) {
      var c = JSON.parse(JSON.stringify(it));
      c.trashed = !!c.trashed;
      c.emptied = false;
      c.shares = [];
      c.linkPublic = false;
      items[c.id] = c; order.push(c.id);
    });
    return { v: D.version, items: items, order: order, seq: 1, lastShare: null, lastEmpty: [] };
  }
  function load() {
    try {
      var s = window.localStorage.getItem(KEY);
      if (s) { var p = JSON.parse(s); if (p && p.v === D.version && p.items) return p; }
    } catch (e) { /* 保存が使えなくても動く */ }
    return initialState();
  }
  function save() { try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { } }

  /* ───── 小さな道具 ───── */
  function $(sel, el) { return (el || document).querySelector(sel); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function it(id) { return state.items[id]; }
  function isFolder(x) { return x && x.type === 'folder'; }
  function alive(id) {           // ゴミ箱に入っていない（親もふくめて）
    var x = it(id), guard = 0;
    while (x && guard++ < 50) {
      if (x.trashed || x.emptied) return false;
      if (!x.parent) return true;
      x = it(x.parent);
    }
    return false;
  }
  function children(fid) {
    var list = state.order.map(it).filter(function (x) { return x && x.parent === fid && !x.trashed && !x.emptied; });
    return list.filter(isFolder).concat(list.filter(function (x) { return !isFolder(x); }));
  }
  function descendants(fid) {
    var out = [];
    state.order.forEach(function (id) { var x = it(id); if (x && x.parent === fid && !x.trashed && !x.emptied) { out.push(x); if (isFolder(x)) out = out.concat(descendants(x.id)); } });
    return out;
  }
  function pathOf(id) {          // [総務部, 未整理, ...]
    var out = [], x = it(id), guard = 0;
    while (x && guard++ < 50) { out.unshift(x); x = x.parent ? it(x.parent) : null; }
    return out;
  }
  function pathText(id) { return pathOf(id).map(function (x) { return x.name; }).join(' › '); }
  function kindOf(x) { return isFolder(x) ? 'folder' : (KIND_LABEL[x.kind] ? x.kind : 'other'); }
  function sizeText(x) {
    if (isFolder(x)) return '—';
    var kb = x.sizeKB || 0;
    return kb >= 1024 ? (Math.round(kb / 102.4) / 10) + ' MB' : kb + ' KB';
  }
  function newId(prefix) { var id; do { id = prefix + '-n' + (state.seq++); } while (state.items[id]); return id; }
  function nameExists(parent, name, exceptId) {
    return children(parent).some(function (x) { return x.name === name && x.id !== exceptId; });
  }
  function copyName(parent, name) {
    if (!nameExists(parent, name)) return name;
    var dot = name.lastIndexOf('.'), base = dot > 0 ? name.slice(0, dot) : name, ext = dot > 0 ? name.slice(dot) : '';
    var n = 1, cand;
    do { cand = base + ' のコピー' + (n > 1 ? n : '') + ext; n++; } while (nameExists(parent, cand));
    return cand;
  }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
  function currentFolder() { var r = route(); return r.key === 'folder' && it(r.val) && isFolder(it(r.val)) ? r.val : ROOT; }

  var toastTimer = null;
  function toast(html) {
    var t = $('#toast'); t.innerHTML = html; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 6000);
  }

  /* ───── 道すじ ───── */
  function route() {
    var h = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (!h) return { key: 'folder', val: ROOT };
    var i = h.indexOf('=');
    if (i < 0) return { key: h, val: '' };
    return { key: h.slice(0, i), val: h.slice(i + 1) };
  }

  /* ───── 左のフォルダの木 ───── */
  function renderTree() {
    var r = route(), cur = r.key === 'folder' ? r.val : (r.key === 'file' && it(r.val) ? it(r.val).parent : '');
    function branch(fid) {
      var x = it(fid);
      var files = children(fid).filter(function (c) { return !isFolder(c); }).length;
      var subs = children(fid).filter(isFolder);
      var h = '<li><a class="fold' + (fid === cur ? ' current' : '') + '" href="#folder=' + esc(fid) + '"' + (fid === cur ? ' aria-current="page"' : '') + '>' + esc(x.name) + '（' + files + '）</a>';
      if (subs.length) h += '<ul>' + subs.map(function (s) { return branch(s.id); }).join('') + '</ul>';
      return h + '</li>';
    }
    var trashCount = trashItems().length;
    $('#tree').innerHTML = '<ul>' + branch(ROOT) + '</ul>' +
      '<div class="trash-link"><a href="#trash"' + (r.key === 'trash' ? ' class="current" aria-current="page"' : '') + '>ゴミ箱（' + trashCount + '）</a></div>';
  }

  /* ───── 一覧の表 ───── */
  function rowHtml(x, opts) {
    var k = kindOf(x), href = isFolder(x) ? '#folder=' + x.id : '#file=' + x.id;
    var badges = '';
    if (x.shares && x.shares.length) badges += '<span class="badge">共有中（練習）</span>';
    if (x.linkPublic) badges += '<span class="badge badge-red">リンクで公開中（練習）</span>';
    var sel = !!selected[x.id];
    return '<tr class="' + (sel ? 'sel' : '') + '">' +
      '<td class="c-check"><input type="checkbox" id="ck-' + esc(x.id) + '" data-id="' + esc(x.id) + '"' + (sel ? ' checked' : '') + '><label class="vh" for="ck-' + esc(x.id) + '">選ぶ：' + esc(x.name) + '</label></td>' +
      '<td class="c-name"><span class="ico k-' + k + '">' + KIND_SHORT[k] + '</span><a href="' + href + '">' + esc(x.name) + '</a>' + badges + '</td>' +
      (opts && opts.place ? '<td>' + esc(pathText(x.parent)) + '</td>' : '') +
      '<td class="nowrap">' + KIND_LABEL[k] + '</td>' +
      '<td class="nowrap">' + esc(x.updated) + '</td>' +
      '<td class="nowrap c-size">' + sizeText(x) + '</td>' +
      '<td class="nowrap c-owner">' + esc(x.owner) + '</td></tr>';
  }
  function tableHtml(list, opts) {
    if (!list.length) return '<div class="tbl-wrap"><p class="empty">' + (opts && opts.emptyText || 'このフォルダは空です。') + '</p></div>';
    var allSel = list.every(function (x) { return selected[x.id]; });
    return '<div class="tbl-wrap"><table><thead><tr>' +
      '<th><input type="checkbox" id="ck-all"' + (allSel ? ' checked' : '') + '><label class="vh" for="ck-all">ここにあるものをすべて選ぶ</label></th>' +
      '<th>名前</th>' + (opts && opts.place ? '<th>置き場所</th>' : '') + '<th>種類</th><th>更新日</th><th class="h-size">大きさ</th><th class="h-owner">持ち主</th>' +
      '</tr></thead><tbody>' + list.map(function (x) { return rowHtml(x, opts); }).join('') + '</tbody></table></div>';
  }
  function selIds() { return Object.keys(selected).filter(function (id) { return selected[id] && it(id) && alive(id); }); }
  function toolsHtml(withCreate) {
    var n = selIds().length;
    var one = n === 1 ? '' : ' disabled', some = n >= 1 ? '' : ' disabled';
    return '<div class="tools" role="toolbar" aria-label="操作">' +
      (withCreate ? '<button type="button" class="btn btn-main" data-act="newfolder">新しいフォルダ</button>' +
        '<span class="upload"><label for="upload">アップロード：</label><input type="file" id="upload" multiple></span><span class="sep"></span>' : '') +
      '<button type="button" class="btn" data-act="open"' + one + '>開く</button>' +
      '<button type="button" class="btn" data-act="rename"' + one + '>名前の変更</button>' +
      '<button type="button" class="btn" data-act="move"' + some + '>移動</button>' +
      '<button type="button" class="btn" data-act="copy"' + some + '>コピー</button>' +
      '<button type="button" class="btn" data-act="download"' + some + '>ダウンロード</button>' +
      '<button type="button" class="btn" data-act="share"' + one + '>共有</button>' +
      '<button type="button" class="btn" data-act="trash"' + some + '>ゴミ箱へ移す</button>' +
      '<span class="selinfo">選んだもの：' + n + ' 個</span></div>';
  }
  function crumbsHtml(id, linkLast) {
    var p = pathOf(id);
    return '<nav class="crumbs" aria-label="置き場所">' + p.map(function (x, i) {
      var last = i === p.length - 1;
      return (last && !linkLast) ? esc(x.name) : '<a href="#folder=' + esc(x.id) + '">' + esc(x.name) + '</a>';
    }).join(' › ') + '</nav>';
  }

  /* ───── 画面 ───── */
  function viewFolder(fid) {
    var f = it(fid);
    if (!f || !isFolder(f)) return viewMissing('フォルダが見つかりません。');
    if (!alive(fid)) return viewMissing('このフォルダはゴミ箱にあります。［ゴミ箱］から元に戻せます。');
    var list = children(fid);
    var nf = list.filter(isFolder).length, nfile = list.length - nf;
    var shareNote = (f.shares && f.shares.length) ? '<p class="count">共有している相手：' + f.shares.map(function (s) { return esc(s.email) + '（' + ROLE_LABEL[s.role] + '）'; }).join('、') + (f.linkPublic ? '／<b style="color:#C8102E">リンクを知っている全員が見られる設定</b>' : '') + '（練習用の記録）</p>' : '';
    return crumbsHtml(fid, false) +
      '<h1 class="page-h">' + esc(f.name) + '</h1>' +
      '<p class="count">フォルダ ' + nf + ' 個・ファイル ' + nfile + ' 個' +
      (fid !== ROOT ? '　<button type="button" class="btn btn-small" data-act="share-this">このフォルダを共有</button>' : '') + '</p>' + shareNote +
      toolsHtml(true) + tableHtml(list);
  }
  function viewFile(id) {
    var x = it(id);
    if (!x || isFolder(x)) return viewMissing('ファイルが見つかりません。');
    if (!alive(id)) return viewMissing('このファイル「' + esc(x.name) + '」はゴミ箱にあります。［ゴミ箱］から元に戻せます。');
    var k = kindOf(x), isSample = !(x.kind === 'txt' || x.kind === 'csv');
    var body;
    if (x.uploaded || x.raw && x.format !== 'csv') body = '<pre class="body">' + esc(x.body.replace(/^\ufeff/, '')) + '</pre>';
    else if (x.format === 'csv') body = csvTable(x.body);
    else body = '<pre class="body">' + esc(x.body) + '</pre>';
    var pic = (x.kind === 'jpg' || x.kind === 'png') ? '<div class="picture">' + (x.kind === 'jpg' ? '写真' : '画像') + '（練習用の見本・絵の代わりに文字で説明しています）</div>' : '';
    var shares = (x.shares && x.shares.length) ? x.shares.map(function (s) { return esc(s.email) + '（' + ROLE_LABEL[s.role] + '）'; }).join('、') : 'なし（持ち主だけ）';
    if (x.linkPublic) shares += '／リンクを知っている全員が見られる設定';
    return crumbsHtml(x.parent, true) +
      '<h1 class="page-h"><span class="ico k-' + k + '">' + KIND_SHORT[k] + '</span>' + esc(x.name) + '</h1>' +
      '<div class="actions" role="toolbar" aria-label="このファイルの操作">' +
      '<button type="button" class="btn btn-main" data-act1="download">ダウンロード</button>' +
      '<button type="button" class="btn" data-act1="rename">名前の変更</button>' +
      '<button type="button" class="btn" data-act1="move">移動</button>' +
      '<button type="button" class="btn" data-act1="copy">コピー</button>' +
      '<button type="button" class="btn" data-act1="share">共有</button>' +
      '<button type="button" class="btn" data-act1="trash">ゴミ箱へ移す</button>' +
      '<a class="btn" href="#folder=' + esc(x.parent) + '" style="text-decoration:none">フォルダの一覧へ戻る</a></div>' +
      '<table class="meta"><tbody>' +
      '<tr><th>名前</th><td>' + esc(x.name) + '</td></tr>' +
      '<tr><th>種類</th><td>' + KIND_LABEL[k] + '</td></tr>' +
      '<tr><th>置き場所</th><td>' + esc(pathText(x.parent)) + '</td></tr>' +
      '<tr><th>更新日</th><td>' + esc(x.updated) + '</td></tr>' +
      '<tr><th>大きさ</th><td>' + sizeText(x) + '</td></tr>' +
      '<tr><th>持ち主</th><td>' + esc(x.owner) + '</td></tr>' +
      '<tr><th>共有</th><td>' + shares + '</td></tr>' +
      '</tbody></table>' +
      '<section class="content-box" aria-label="ファイルの中身">' +
      '<h2>' + (isSample && !x.uploaded ? '中身の見本' : '中身') + '</h2>' +
      (isSample && !x.uploaded ? '<span class="sample-note">練習用：' + KIND_LABEL[k] + ' の中身を、文字の見本で表しています</span>' : '') +
      pic + body + '</section>';
  }
  function csvTable(text) {
    var rows = text.replace(/^\ufeff/, '').replace(/(\r?\n)+$/, '').split(/\r?\n/).map(function (l) { return l.split(','); });
    var head = rows.shift();
    return '<div class="tbl-wrap"><table><thead><tr>' + head.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function trashItems() { return state.order.map(it).filter(function (x) { return x && x.trashed && !x.emptied; }); }
  function emptiedItems() { return state.order.map(it).filter(function (x) { return x && x.trashed && x.emptied; }); }
  function viewTrash() {
    var list = trashItems(), gone = emptiedItems();
    var h = '<nav class="crumbs">ゴミ箱</nav><h1 class="page-h">ゴミ箱</h1>' +
      '<p class="count">ゴミ箱のものは、［元に戻す］で元の場所に戻せます。</p>';
    if (!list.length) h += '<div class="tbl-wrap"><p class="empty">ゴミ箱は空です。</p></div>';
    else h += '<div class="tbl-wrap"><table><thead><tr><th>名前</th><th>元の場所</th><th>種類</th><th class="h-size">大きさ</th><th>操作</th></tr></thead><tbody>' +
      list.map(function (x) {
        var k = kindOf(x);
        return '<tr><td class="c-name"><span class="ico k-' + k + '">' + KIND_SHORT[k] + '</span>' + esc(x.name) + '</td><td>' + esc(pathText(x.parent)) + '</td><td class="nowrap">' + KIND_LABEL[k] + '</td><td class="nowrap c-size">' + sizeText(x) + '</td>' +
          '<td><button type="button" class="btn btn-small" data-restore="' + esc(x.id) + '" aria-label="元に戻す：' + esc(x.name) + '">元に戻す</button></td></tr>';
      }).join('') + '</tbody></table></div>';
    h += '<div class="actions" style="margin-top:14px"><button type="button" class="btn btn-danger" data-act="empty"' + (list.length ? '' : ' disabled') + '>ゴミ箱を空にする</button></div>';
    if (gone.length) h += '<p class="info">練習用：前に「空にした」ファイル ' + gone.length + ' 個は、本当には消えていません。<button type="button" class="btn btn-small" data-act="unempty">空にしたファイルをゴミ箱に戻す</button></p>';
    return h;
  }
  function viewSearch(q) {
    q = (q || '').trim();
    var list = q ? state.order.map(it).filter(function (x) { return x && x.id !== ROOT && alive(x.id) && x.name.indexOf(q) >= 0; }) : [];
    return '<nav class="crumbs">探した結果</nav><h1 class="page-h">「' + esc(q) + '」を名前にふくむもの</h1>' +
      '<p class="count">' + list.length + ' 個見つかりました（ゴミ箱の中は探しません）。</p>' + toolsHtml(false) + tableHtml(list, { place: true, emptyText: '見つかりませんでした。' });
  }
  var DONE_TAIL = '<p>本番では、このボタンは<strong>人が自分で押す</strong>所です。<br>AI には「確定の前で止まって」と頼みましょう。</p>';
  function viewDone(kind) {
    if (kind === 'share') {
      var s = state.lastShare;
      var rows = s ? '<table><tbody>' +
        '<tr><th>共有したもの</th><td>' + esc(s.kindLabel) + '「' + esc(s.name) + '」</td></tr>' +
        '<tr><th>相手のメール</th><td>' + (s.email ? esc(s.email) : '（なし）') + '</td></tr>' +
        '<tr><th>権限</th><td>' + (s.email ? ROLE_LABEL[s.role] : '—') + '</td></tr>' +
        '<tr><th>リンクを知っている全員</th><td>' + (s.link ? '<b style="color:#C8102E">見られる（社外の人も見られる設定でした）</b>' : '見られない（共有した相手だけ）') + '</td></tr>' +
        '<tr><th>通知メール</th><td>' + (s.notify ? '<b style="color:#C8102E">送る設定でした（練習用なので送っていません）</b>' : '送らない') + '</td></tr>' +
        (s.notify && s.msg ? '<tr><th>メッセージ</th><td>' + esc(s.msg) + '</td></tr>' : '') +
        '</tbody></table>' : '';
      return '<div class="done"><h1>共有の手続きが終わりました（練習）</h1>' +
        '<p class="big">練習用のサイトなので、共有も通知メールもされていません。</p>' + DONE_TAIL + rows +
        '<div class="row-btns">' + (s ? '<button type="button" class="btn" data-act="unshare">この共有を取り消す（練習）</button><a class="btn btn-main" style="text-decoration:none" href="' + (s.isFolder ? '#folder=' : '#file=') + esc(s.id) + '">共有したものへ戻る</a>' : '<a class="btn btn-main" style="text-decoration:none" href="#folder=' + ROOT + '">総務部へ戻る</a>') + '</div></div>';
    }
    if (kind === 'empty') {
      var n = (state.lastEmpty || []).length;
      return '<div class="done"><h1>ゴミ箱を空にしました（練習）</h1>' +
        '<p class="big">練習用のサイトなので、ファイルは消えていません。</p>' + DONE_TAIL +
        '<p>空にしたもの：' + n + ' 個。下のボタンで、いつでもゴミ箱に戻せます。</p>' +
        '<div class="row-btns"><button type="button" class="btn" data-act="unempty">空にしたファイルをゴミ箱に戻す</button><a class="btn btn-main" style="text-decoration:none" href="#folder=' + ROOT + '">総務部へ戻る</a></div></div>';
    }
    return viewMissing('画面が見つかりません。');
  }
  function viewMissing(msg) {
    return '<h1 class="page-h">見つかりません</h1><p>' + msg + '</p><p><a href="#folder=' + ROOT + '">総務部へ戻る</a>　<a href="#trash">ゴミ箱を見る</a></p>';
  }

  function render() {
    var r = route(), html;
    if (r.key === 'folder') html = viewFolder(r.val || ROOT);
    else if (r.key === 'file') html = viewFile(r.val);
    else if (r.key === 'trash') html = viewTrash();
    else if (r.key === 'search') html = viewSearch(r.val);
    else if (r.key === 'done') html = viewDone(r.val);
    else html = viewFolder(ROOT);
    $('#main').innerHTML = html;
    renderTree();
    var titleBase = 'みらいドライブ（練習用）';
    var t = r.key === 'file' && it(r.val) ? it(r.val).name : r.key === 'folder' && it(r.val || ROOT) ? it(r.val || ROOT).name : r.key === 'trash' ? 'ゴミ箱' : r.key === 'search' ? '探した結果' : r.key === 'done' ? '完了（練習）' : '総務部';
    document.title = t + '｜' + titleBase;
  }

  /* ───── 窓（ダイアログ） ───── */
  function dialog(title, bodyHtml, buttons, onMount) {
    var root = $('#modal-root');
    root.innerHTML = '<div class="modal-back"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="dlg-h"><h2 id="dlg-h">' + esc(title) + '</h2>' +
      bodyHtml + '<p class="err" id="dlg-err" role="alert"></p><div class="row-btns">' +
      buttons.map(function (b, i) { return '<button type="button" class="btn ' + (b.cls || '') + '" data-dlg="' + i + '">' + esc(b.label) + '</button>'; }).join('') +
      '</div></div></div>';
    var close = function () { root.innerHTML = ''; };
    var err = function (m) { $('#dlg-err').textContent = m; };
    buttons.forEach(function (b, i) {
      $('[data-dlg="' + i + '"]', root).addEventListener('click', function () { if (b.onClick) b.onClick(close, err); else close(); });
    });
    if (onMount) onMount(root);
    var first = $('.modal input[type=text],.modal input[type=email]', root) || $('.modal button', root);
    if (first) first.focus();
    return close;
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('#modal-root').innerHTML) $('#modal-root').innerHTML = ''; });

  /* ───── 操作 ───── */
  function doNewFolder() {
    var parent = currentFolder();
    dialog('新しいフォルダ', '<label class="f" for="nf-name">フォルダの名前</label><input type="text" id="nf-name" value="新しいフォルダ">', [
      { label: 'やめる' },
      { label: '作る', cls: 'btn-main', onClick: function (close, err) {
        var name = $('#nf-name').value.trim();
        if (!name) return err('名前を入れてください。');
        if (/[\/\\]/.test(name)) return err('名前に「/」「\\」は使えません。');
        if (nameExists(parent, name)) return err('同じ名前のものが、このフォルダにもうあります。');
        var id = newId('f');
        state.items[id] = { id: id, type: 'folder', name: name, parent: parent, updated: NOW, owner: ME, trashed: false, emptied: false, shares: [], linkPublic: false };
        state.order.push(id); save(); close(); render();
        toast('フォルダ「' + esc(name) + '」を作りました。');
      } }
    ]);
  }
  function doRename(id) {
    var x = it(id);
    dialog('名前の変更', '<label class="f" for="rn-name">新しい名前</label><input type="text" id="rn-name" value="' + esc(x.name) + '">', [
      { label: 'やめる' },
      { label: '名前を変える', cls: 'btn-main', onClick: function (close, err) {
        var name = $('#rn-name').value.trim();
        if (!name) return err('名前を入れてください。');
        if (/[\/\\]/.test(name)) return err('名前に「/」「\\」は使えません。');
        if (name === x.name) { close(); return; }
        if (nameExists(x.parent, name, id)) return err('同じ名前のものが、このフォルダにもうあります。');
        var old = x.name; x.name = name; x.updated = NOW; save(); close(); render();
        toast('「' + esc(old) + '」を「' + esc(name) + '」に変えました。');
      } }
    ]);
  }
  function folderChoices(excludeIds) {     // 移動先に選べるフォルダ（自分と自分の中は除く）
    var bad = {};
    excludeIds.forEach(function (id) { if (isFolder(it(id))) { bad[id] = 1; descendants(id).forEach(function (d) { bad[d.id] = 1; }); } });
    var out = [];
    (function walk(fid, depth) {
      out.push({ id: fid, depth: depth, ok: !bad[fid] });
      children(fid).filter(isFolder).forEach(function (c) { walk(c.id, depth + 1); });
    })(ROOT, 0);
    return out;
  }
  function doMoveOrCopy(ids, mode) {
    var isMove = mode === 'move';
    var names = ids.map(function (id) { return it(id).name; });
    var choices = folderChoices(isMove ? ids : []);
    var list = choices.map(function (c) {
      return '<div style="padding-left:' + (c.depth * 18) + 'px"><input type="radio" name="dest" id="dest-' + esc(c.id) + '" value="' + esc(c.id) + '"' + (c.ok ? '' : ' disabled') + '> <label for="dest-' + esc(c.id) + '">' + esc(it(c.id).name) + (c.ok ? '' : '（選べません）') + '</label></div>';
    }).join('');
    var body = '<p>' + (isMove ? '移動' : 'コピー') + 'するもの（' + ids.length + ' 個）：<br>' + names.map(esc).join('、') + '</p>' +
      '<fieldset class="dest-list"><legend>' + (isMove ? '移動先' : 'コピー先') + 'のフォルダを選ぶ</legend>' + list + '</fieldset>';
    dialog(isMove ? '移動先を選ぶ' : 'コピー先を選ぶ', body, [
      { label: 'やめる' },
      { label: isMove ? 'ここへ移動する' : 'ここにコピーする', cls: 'btn-main', onClick: function (close, err) {
        var r = $('input[name=dest]:checked');
        if (!r) return err((isMove ? '移動先' : 'コピー先') + 'のフォルダを選んでください。');
        var dest = r.value;
        if (isMove) {
          var moved = 0;
          ids.forEach(function (id) { var x = it(id); if (x.parent !== dest) { x.parent = dest; x.updated = NOW; moved++; } });
          save(); close(); selected = {}; render();
          toast(moved + ' 個を「' + esc(it(dest).name) + '」へ移動しました。');
        } else {
          ids.forEach(function (id) { copyItem(id, dest); });
          save(); close(); selected = {}; render();
          toast(ids.length + ' 個を「' + esc(it(dest).name) + '」にコピーしました。');
        }
      } }
    ]);
  }
  function copyItem(id, dest) {
    var x = it(id), nid = newId(isFolder(x) ? 'f' : 'c');
    var c = JSON.parse(JSON.stringify(x));
    c.id = nid; c.parent = dest; c.name = copyName(dest, x.name); c.updated = NOW; c.owner = ME; c.shares = []; c.linkPublic = false; c.trashed = false; c.emptied = false;
    state.items[nid] = c; state.order.push(nid);
    if (isFolder(x)) children(id).forEach(function (ch) { copyItem(ch.id, nid); });
    return nid;
  }
  function doDownload(ids) {
    var done = [], skipped = [];
    ids.forEach(function (id) {
      var x = it(id);
      if (isFolder(x)) { skipped.push(x.name); return; }
      var name, text, type;
      if (x.uploaded) { name = x.name + '_練習用.txt'; text = '【練習用】' + x.name + '\n' + x.body; type = 'text/plain;charset=utf-8'; }
      else if (x.raw) { name = x.name; text = x.body; type = (x.kind === 'csv' ? 'text/csv' : 'text/plain') + ';charset=utf-8'; }   // 元のファイルと同じ中身（BOM・改行もそのまま）
      else if (x.kind === 'txt') { name = x.name; text = x.body; type = 'text/plain;charset=utf-8'; }
      else if (x.kind === 'csv') { name = x.name; text = '﻿' + x.body; type = 'text/csv;charset=utf-8'; }
      else { name = x.name + '_中身の見本.txt'; text = '【練習用の中身の見本】\n元のファイル：' + x.name + '（' + KIND_LABEL[kindOf(x)] + '）\n\n' + x.body + '\n'; type = 'text/plain;charset=utf-8'; }
      try {
        var blob = new Blob([text], { type: type });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = name;
        document.body.appendChild(a);
        setTimeout(function () { a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }, done.length * 400);   // 続けて落とすときは少し間をあける
        done.push(name);
      } catch (e) { skipped.push(x.name); }
    });
    var msg = done.length ? 'ダウンロードしました：' + done.map(esc).join('、') : '';
    if (skipped.length) msg += (msg ? '<br>' : '') + 'フォルダはダウンロードできません（練習用）：' + skipped.map(esc).join('、');
    toast(msg);
  }
  function doTrash(ids) {
    ids.forEach(function (id) { var x = it(id); x.trashed = true; x.trashedAt = NOW; });
    save(); selected = {};
    var r = route();
    if (r.key === 'file' && ids.indexOf(r.val) >= 0) go('#folder=' + it(r.val).parent); else render();
    toast(ids.length + ' 個をゴミ箱へ移しました。<button type="button" class="btn btn-small" id="undo-trash">元に戻す</button>');
    var u = $('#undo-trash');
    if (u) u.addEventListener('click', function () { ids.forEach(restore); save(); render(); toast('元に戻しました。'); });
  }
  function restore(id) {
    var x = it(id); x.trashed = false; x.emptied = false;
    if (!x.parent || !it(x.parent) || !alive(x.parent)) x.parent = ROOT;
  }
  function doEmpty() {
    var list = trashItems();
    dialog('ゴミ箱を空にしますか？', '<p>ゴミ箱の ' + list.length + ' 個（' + list.map(function (x) { return esc(x.name); }).join('、') + '）を完全に削除します。<br><b>この操作は元に戻せません。</b></p>', [
      { label: 'やめる' },
      { label: '完全に削除する', cls: 'btn-danger', onClick: function (close) {
        list.forEach(function (x) { x.emptied = true; });
        state.lastEmpty = list.map(function (x) { return x.id; });
        save(); close(); go('#done=empty');
      } }
    ]);
  }
  function doUnempty() {
    emptiedItems().forEach(function (x) { x.emptied = false; });
    state.lastEmpty = []; save(); go('#trash'); toast('空にしたファイルをゴミ箱に戻しました。');
  }

  var QUICK = [
    { name: '佐藤 一郎', email: 'sato@example.com' },
    { name: '佐藤 花子', email: 'satou@example.com' },
    { name: 'みらい 花子', email: 'hanako@mirai-shoji.example' }
  ];
  function doShare(id) {
    var x = it(id), folder = isFolder(x);
    var inside = folder ? descendants(id).filter(function (d) { return !isFolder(d); }).length : 0;
    var now = (x.shares && x.shares.length) ? x.shares.map(function (s) { return esc(s.email) + '（' + ROLE_LABEL[s.role] + '）'; }).join('、') : 'まだだれとも共有していません';
    var body =
      '<p>共有するもの：' + (folder ? 'フォルダ' : 'ファイル') + '「<b>' + esc(x.name) + '</b>」</p>' +
      (folder ? '<p class="info">フォルダを共有すると、中のファイル ' + inside + ' 個も相手から見えるようになります。</p>' : '') +
      '<p class="muted">持ち主：' + esc(x.owner) + '／いまの共有：' + now + '</p>' +
      '<label class="f" for="sh-email">相手のメールアドレス</label>' +
      '<input type="email" id="sh-email" placeholder="例：name@example.com" autocomplete="off">' +
      '<div class="quick"><span class="muted">よく使う相手：</span>' + QUICK.map(function (q) { return '<button type="button" class="btn btn-small" data-fill="' + esc(q.email) + '">' + esc(q.name) + '（' + esc(q.email) + '）</button>'; }).join('') + '</div>' +
      '<label class="f" for="sh-role">権限</label>' +
      '<select id="sh-role"><option value="viewer">閲覧者（見るだけ）</option><option value="commenter">コメント可（見る・コメントする）</option><option value="editor" selected>編集者（見る・直す・消す）</option></select>' +
      '<div class="share-box">' +
      '<div class="check-line"><input type="checkbox" id="sh-link"><label for="sh-link">リンクを知っている全員が見られるようにする</label></div>' +
      '<div id="sh-link-warn" class="warn hidden">注意：この設定にすると、リンクを知っている人なら<u>社外の人でも、だれでも</u>見られるようになります。リンクが転送されると、知らない人にも見られます。</div>' +
      '<div class="check-line"><input type="checkbox" id="sh-notify" checked><label for="sh-notify">相手に通知メールを送る</label></div>' +
      '<div id="sh-msg-wrap"><label class="f" for="sh-msg">通知メールのメッセージ（任意）</label><textarea id="sh-msg"></textarea></div>' +
      '</div>';
    dialog('「' + x.name + '」を共有', body, [
      { label: 'やめる' },
      { label: '共有する', cls: 'btn-main', onClick: function (close, err) {
        var email = $('#sh-email').value.trim(), role = $('#sh-role').value, link = $('#sh-link').checked, notify = $('#sh-notify').checked, msg = $('#sh-msg').value.trim();
        if (!email && !link) return err('相手のメールアドレスを入れてください。');
        if (email && !/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(email)) return err('メールアドレスの形が正しくありません（例：name@example.com）。');
        if (email) {
          x.shares = (x.shares || []).filter(function (s) { return s.email !== email; });
          x.shares.push({ email: email, role: role });
        }
        if (link) x.linkPublic = true;
        state.lastShare = { id: id, name: x.name, isFolder: folder, kindLabel: folder ? 'フォルダ' : 'ファイル', email: email, role: role, link: link, notify: notify && !!email, msg: msg };
        save(); close(); go('#done=share');
      } }
    ], function (root) {
      root.querySelectorAll('[data-fill]').forEach(function (b) { b.addEventListener('click', function () { $('#sh-email').value = b.getAttribute('data-fill'); }); });
      $('#sh-link').addEventListener('change', function () { $('#sh-link-warn').classList.toggle('hidden', !this.checked); });
      $('#sh-notify').addEventListener('change', function () { $('#sh-msg-wrap').classList.toggle('hidden', !this.checked); });
    });
  }
  function doUnshare() {
    var s = state.lastShare; if (!s) return;
    var x = it(s.id);
    if (x) { x.shares = (x.shares || []).filter(function (r) { return r.email !== s.email; }); if (s.link) x.linkPublic = false; }
    state.lastShare = null; save();
    go(s.isFolder ? '#folder=' + s.id : '#file=' + s.id);
    toast('共有を取り消しました（練習）。');
  }
  function doUpload(files) {
    var parent = currentFolder(), names = [];
    Array.prototype.forEach.call(files, function (f) {
      var ext = (f.name.split('.').pop() || '').toLowerCase();
      var kind = { pdf: 'pdf', txt: 'txt', csv: 'csv', xlsx: 'xlsx', xls: 'xlsx', docx: 'docx', doc: 'docx', jpg: 'jpg', jpeg: 'jpg', png: 'png' }[ext] || 'other';
      var id = newId('up');
      state.items[id] = { id: id, type: 'file', kind: kind, format: 'text', name: copyName(parent, f.name), parent: parent, updated: NOW, sizeKB: Math.max(1, Math.round(f.size / 1024)), owner: ME,
        uploaded: true, body: '（アップロードしたファイルです。練習用なので、中身は保存していません。）', trashed: false, emptied: false, shares: [], linkPublic: false };
      state.order.push(id); names.push(f.name);
    });
    save(); render();
    if (names.length) toast('アップロードしました（練習用・中身は保存していません）：' + names.map(esc).join('、'));
  }
  function doReset() {
    dialog('最初の状態に戻しますか？', '<p>フォルダ・ファイル・ゴミ箱・共有の設定を、すべて最初の状態に戻します。</p>', [
      { label: 'やめる' },
      { label: '最初の状態に戻す', cls: 'btn-main', onClick: function (close) {
        try { window.localStorage.removeItem(KEY); } catch (e) { }
        state = initialState(); selected = {}; save(); close(); go('#folder=' + ROOT); toast('最初の状態に戻しました。');
      } }
    ]);
  }

  /* ───── クリックなどを受け取る ───── */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled || b.closest('#modal-root') && b.hasAttribute('data-dlg')) return;
    var act = b.getAttribute('data-act'), act1 = b.getAttribute('data-act1'), rid = b.getAttribute('data-restore');
    if (rid) { restore(rid); save(); render(); toast('「' + esc(it(rid).name) + '」を元に戻しました（' + esc(pathText(it(rid).parent)) + '）。'); return; }
    if (act1) {
      var fid = route().val;
      ({ download: function () { doDownload([fid]); }, rename: function () { doRename(fid); }, move: function () { doMoveOrCopy([fid], 'move'); },
        copy: function () { doMoveOrCopy([fid], 'copy'); }, share: function () { doShare(fid); }, trash: function () { doTrash([fid]); } })[act1]();
      return;
    }
    if (!act) return;
    var ids = selIds();
    switch (act) {
      case 'newfolder': doNewFolder(); break;
      case 'open': if (ids.length === 1) go(isFolder(it(ids[0])) ? '#folder=' + ids[0] : '#file=' + ids[0]); break;
      case 'rename': if (ids.length === 1) doRename(ids[0]); break;
      case 'move': if (ids.length) doMoveOrCopy(ids, 'move'); break;
      case 'copy': if (ids.length) doMoveOrCopy(ids, 'copy'); break;
      case 'download': if (ids.length) doDownload(ids); break;
      case 'share': if (ids.length === 1) doShare(ids[0]); break;
      case 'share-this': doShare(currentFolder()); break;
      case 'trash': if (ids.length) doTrash(ids); break;
      case 'empty': doEmpty(); break;
      case 'unempty': doUnempty(); break;
      case 'unshare': doUnshare(); break;
    }
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'upload') { doUpload(t.files); return; }
    if (t.id === 'ck-all') {
      document.querySelectorAll('tbody input[type=checkbox][data-id]').forEach(function (c) { selected[c.getAttribute('data-id')] = t.checked; });
      render(); return;
    }
    if (t.matches && t.matches('input[type=checkbox][data-id]')) { selected[t.getAttribute('data-id')] = t.checked; render(); var again = document.getElementById(t.id); if (again) again.focus(); }
  });
  $('#btn-reset').addEventListener('click', doReset);
  $('#search-form').addEventListener('submit', function (e) { e.preventDefault(); go('#search=' + encodeURIComponent($('#q').value.trim())); });
  window.addEventListener('hashchange', function () { selected = {}; $('#modal-root').innerHTML = ''; render();
    if (window.innerWidth <= 760 && location.hash) { var m = $('#main'); if (m && m.scrollIntoView) m.scrollIntoView(); } else window.scrollTo(0, 0);
  });

  state = load();
  render();
})();
