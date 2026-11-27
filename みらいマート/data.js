/* みらいマート（架空）の商品データ。練習用。乱数は使わない。
   price：税込の本体価格（1個）／ship：送料（0＝無料。商品ごとに1回、数量によらない）
   date：お届け予定日（12月1日（火）に注文した場合）。null＝在庫切れ
   rec：おすすめ順（小さいほど上）／pr：広告枠（いつも一覧の一番上） */
var MIRAI_CATEGORIES = [
  { id: "all", name: "すべて" },
  { id: "office", name: "事務用品" },
  { id: "pc", name: "PC周辺" },
  { id: "daily", name: "日用品" },
  { id: "drink", name: "飲み物" }
];

var MIRAI_PRODUCTS = [
  /* ---------- PC周辺 ---------- */
  { id: "c01", cat: "pc", pr: true, rec: 1, icon: "cable",
    name: "らくらく充電 USB-C ケーブル 急速充電 60W", maker: "くるみ電機",
    price: 780, ship: 0, rating: 4.5, count: 420, date: "2026-12-03", stock: true,
    kw: "usb-c ケーブル 充電",
    specs: [["長さ", "1m"], ["端子", "USB-C ⇔ USB-C"], ["急速充電", "対応（最大60W）"], ["色", "白"]],
    desc: "机の上での充電にちょうどよい短めのケーブル。ノートパソコンの急速充電にも使えます。",
    reviews: [
      { who: "総務・Aさん", star: 5, text: "机の上で使うには十分。安いので予備にも。" },
      { who: "営業・Bさん", star: 4, text: "短いので、会議室のコンセントからは届きませんでした。" },
      { who: "経理・Cさん", star: 5, text: "充電が早いです。" }
    ] },
  { id: "c02", cat: "pc", rec: 3, icon: "cable",
    name: "USB-C ケーブル 2m 急速充電 60W 高耐久", maker: "こはる電子",
    price: 1180, ship: 990, rating: 4.4, count: 156, date: "2026-12-04", stock: true,
    kw: "usb-c ケーブル 充電",
    specs: [["長さ", "2m"], ["端子", "USB-C ⇔ USB-C"], ["急速充電", "対応（最大60W）"], ["色", "黒"]],
    desc: "曲げに強い高耐久タイプ。出荷元が遠方のため、送料がかかります。",
    reviews: [
      { who: "情報システム・Dさん", star: 5, text: "丈夫で長さもちょうどいい。" },
      { who: "総務・Eさん", star: 3, text: "本体は安いけど、送料を足すと思ったより高くなりました。" }
    ] },
  { id: "c03", cat: "pc", rec: 6, icon: "cable",
    name: "USB-C ケーブル 2m 急速充電 100W", maker: "そらまめ電子",
    price: 1090, ship: 0, rating: 5.0, count: 3, date: "2026-12-03", stock: true,
    kw: "usb-c ケーブル 充電",
    specs: [["長さ", "2m"], ["端子", "USB-C ⇔ USB-C"], ["急速充電", "対応（最大100W）"], ["色", "グレー"]],
    desc: "新発売。100W までの急速充電に対応した 2m のケーブルです。",
    reviews: [
      { who: "購入者・Fさん", star: 5, text: "最高です。" },
      { who: "購入者・Gさん", star: 5, text: "よかったです。" },
      { who: "購入者・Hさん", star: 5, text: "また買います。" }
    ] },
  { id: "c04", cat: "pc", rec: 5, icon: "cable",
    name: "USB-C to C ケーブル ロング 急速充電 60W", maker: "ほしぞら工房",
    price: 990, ship: 0, rating: 4.3, count: 88, date: "2026-12-04", stock: true,
    kw: "usb-c ケーブル 充電 ロング",
    specs: [["長さ", "1.8m"], ["端子", "USB-C ⇔ USB-C"], ["急速充電", "対応（最大60W）"], ["色", "白"]],
    desc: "ロングタイプで、ソファやベッドからも届きます。",
    reviews: [
      { who: "総務・Iさん", star: 4, text: "充電は早い。ただ 2m あると思っていたら 1.8m でした。" },
      { who: "営業・Jさん", star: 5, text: "白くて会議室になじみます。" }
    ] },
  { id: "c05", cat: "pc", rec: 7, icon: "cable",
    name: "USB-C ケーブル 2m 急速充電 60W", maker: "なのはな電材",
    price: 1280, ship: 0, rating: 4.2, count: 64, date: "2026-12-07", stock: true,
    kw: "usb-c ケーブル 充電",
    specs: [["長さ", "2m"], ["端子", "USB-C ⇔ USB-C"], ["急速充電", "対応（最大60W）"], ["色", "黒"]],
    desc: "ふつうに使いやすい 2m のケーブル。会議室のコンセントから机まで届きます。",
    reviews: [
      { who: "総務・Kさん", star: 4, text: "会議室用にまとめて買いました。問題なく使えています。" },
      { who: "人事・Lさん", star: 4, text: "長さがちょうどよい。" },
      { who: "営業・Mさん", star: 5, text: "ノートパソコンの充電が早いです。" }
    ] },
  { id: "c06", cat: "pc", rec: 2, icon: "cable",
    name: "USB-C ケーブル 2m 急速充電 100W 編み込み", maker: "あおばテック",
    price: 1380, ship: 0, rating: 4.6, count: 230, date: "2026-12-04", stock: true,
    kw: "usb-c ケーブル 充電",
    specs: [["長さ", "2m"], ["端子", "USB-C ⇔ USB-C"], ["急速充電", "対応（最大100W）"], ["色", "紺"]],
    desc: "ナイロン編み込みで絡みにくい。100W の急速充電に対応。",
    reviews: [
      { who: "情報システム・Nさん", star: 5, text: "絡まらないので会議室向き。" },
      { who: "総務・Oさん", star: 4, text: "少し高いけれど丈夫です。" }
    ] },
  { id: "c07", cat: "pc", rec: 10, icon: "cable",
    name: "USB-C ケーブル 3m 急速充電 60W", maker: "こもれび電機",
    price: 1150, ship: 0, rating: 4.3, count: 45, date: null, stock: false,
    kw: "usb-c ケーブル 充電",
    specs: [["長さ", "3m"], ["端子", "USB-C ⇔ USB-C"], ["急速充電", "対応（最大60W）"], ["色", "黒"]],
    desc: "広い会議室でも届く 3m。ただいま入荷待ちです。",
    reviews: [
      { who: "総務・Pさん", star: 4, text: "長いので大会議室で重宝しています。" },
      { who: "営業・Qさん", star: 5, text: "また入荷したら買いたい。" }
    ] },
  { id: "c08", cat: "pc", rec: 8, icon: "cable",
    name: "USB-C ケーブル 2m（充電・データ転送）", maker: "くるみ電機",
    price: 880, ship: 0, rating: 4.1, count: 52, date: "2026-12-03", stock: true,
    kw: "usb-c ケーブル 充電 データ",
    specs: [["長さ", "2m"], ["端子", "USB-C ⇔ USB-C"], ["急速充電", "非対応（最大15W）"], ["色", "白"]],
    desc: "スマートフォンの充電やデータの移しかえに。ノートパソコンの急速充電には向きません。",
    reviews: [
      { who: "経理・Rさん", star: 4, text: "スマホ用には十分。" },
      { who: "情報システム・Sさん", star: 3, text: "ノートパソコンだと充電がゆっくりです。" }
    ] },
  { id: "c09", cat: "pc", rec: 4, icon: "cable",
    name: "USB-C ケーブル 2m 急速充電対応", maker: "こはる電子",
    price: 1050, ship: 0, rating: 3.8, count: 140, date: "2026-12-05", stock: true,
    kw: "usb-c ケーブル 充電",
    specs: [["長さ", "2m"], ["端子", "USB-C ⇔ USB-C"], ["急速充電", "対応（最大60W）"], ["色", "黒"]],
    desc: "お手ごろな 2m の急速充電ケーブル。",
    reviews: [
      { who: "総務・Tさん", star: 3, text: "半年で端子がゆるくなりました。" },
      { who: "営業・Uさん", star: 4, text: "値段なりに使えます。" }
    ] },
  { id: "c10", cat: "pc", rec: 9, icon: "mouse",
    name: "ワイヤレスマウス 静音 3ボタン", maker: "そらまめ電子",
    price: 1680, ship: 0, rating: 4.2, count: 310, date: "2026-12-04", stock: true,
    kw: "マウス 無線",
    specs: [["つなぎ方", "USB 受信機（USB-A）"], ["電池", "単3形 1本（付属）"], ["ボタン", "3つ"], ["色", "黒"]],
    desc: "クリック音が小さく、静かなオフィスでも気になりません。",
    reviews: [
      { who: "経理・Vさん", star: 4, text: "本当に静か。" },
      { who: "人事・Wさん", star: 4, text: "手の小さい人にも持ちやすいです。" }
    ] },
  { id: "c11", cat: "pc", rec: 11, icon: "usb",
    name: "USB メモリ 64GB USB-A／USB-C 両対応", maker: "あおばテック",
    price: 1480, ship: 0, rating: 4.0, count: 95, date: "2026-12-05", stock: true,
    kw: "usb メモリ 記録",
    specs: [["容量", "64GB"], ["端子", "USB-A と USB-C の両方"], ["色", "銀"]],
    desc: "古いパソコンにも新しいパソコンにも挿せる両対応タイプ。",
    reviews: [
      { who: "総務・Xさん", star: 4, text: "両方挿せるのが便利。" },
      { who: "営業・Yさん", star: 4, text: "小さいのでなくさないように注意。" }
    ] },
  { id: "c12", cat: "pc", rec: 12, icon: "box",
    name: "モニター台 幅60cm 引き出し付き", maker: "ほしぞら工房",
    price: 2980, ship: 800, rating: 4.3, count: 58, date: "2026-12-09", stock: true,
    kw: "モニター 台 机",
    specs: [["大きさ", "幅60cm × 奥行20cm × 高さ10cm"], ["耐荷重", "10kg"], ["色", "木目"]],
    desc: "画面の高さを上げて首の負担を軽く。下に小物をしまえます。",
    reviews: [
      { who: "経理・Zさん", star: 4, text: "引き出しが便利です。" },
      { who: "総務・Aさん", star: 5, text: "机の上がすっきりしました。" }
    ] },

  /* ---------- 事務用品 ---------- */
  { id: "p01", cat: "office", pr: true, rec: 1, icon: "pen",
    name: "さらさら書ける ゲルインクボールペン 黒 10本入り", maker: "ことり文具",
    price: 850, ship: 0, rating: 4.6, count: 510, date: "2026-12-03", stock: true,
    kw: "ボールペン ペン 筆記",
    specs: [["インク", "ゲルインク"], ["太さ", "0.7mm"], ["色", "黒"], ["本数", "10本"]],
    desc: "太めの線でくっきり。宛名書きにも。",
    reviews: [
      { who: "総務・Bさん", star: 5, text: "書き心地がよい。" },
      { who: "経理・Cさん", star: 4, text: "細かい字には少し太いです。" }
    ] },
  { id: "p02", cat: "office", rec: 3, icon: "pen",
    name: "ゲルインクボールペン 0.5mm 黒 10本入り", maker: "なみき文具",
    price: 980, ship: 0, rating: 4.3, count: 240, date: "2026-12-04", stock: true,
    kw: "ボールペン ペン 筆記",
    specs: [["インク", "ゲルインク"], ["太さ", "0.5mm"], ["色", "黒"], ["本数", "10本"]],
    desc: "定番の 0.5mm。帳票の記入にちょうどよい細さです。",
    reviews: [
      { who: "経理・Dさん", star: 4, text: "定番なので安心。" },
      { who: "人事・Eさん", star: 4, text: "インクの減りが少し早い。" }
    ] },
  { id: "p03", cat: "office", rec: 6, icon: "pen",
    name: "ゲルインクボールペン 0.5mm 黒 10本入り なめらか", maker: "そよかぜ文具",
    price: 1100, ship: 0, rating: 4.7, count: 64, date: "2026-12-07", stock: true,
    kw: "ボールペン ペン 筆記",
    specs: [["インク", "ゲルインク"], ["太さ", "0.5mm"], ["色", "黒"], ["本数", "10本"]],
    desc: "インクがなめらかに出て、かすれにくい。にじみにくい速乾インク。",
    reviews: [
      { who: "総務・Fさん", star: 5, text: "かすれない。来客用の受付にも置いています。" },
      { who: "営業・Gさん", star: 5, text: "書き心地がとてもいい。" },
      { who: "経理・Hさん", star: 4, text: "少し高いけれど満足。" }
    ] },
  { id: "p04", cat: "office", rec: 2, icon: "pen",
    name: "ゲルインクボールペン 0.5mm 黒 10本入り", maker: "つばさオフィス",
    price: 890, ship: 0, rating: 4.9, count: 4, date: "2026-12-04", stock: true,
    kw: "ボールペン ペン 筆記",
    specs: [["インク", "ゲルインク"], ["太さ", "0.5mm"], ["色", "黒"], ["本数", "10本"]],
    desc: "新しく取り扱いを始めた 0.5mm のボールペン。",
    reviews: [
      { who: "購入者・Iさん", star: 5, text: "いいです。" },
      { who: "購入者・Jさん", star: 5, text: "満足。" }
    ] },
  { id: "p05", cat: "office", rec: 4, icon: "pen",
    name: "ゲルインクボールペン 0.5mm 黒 10本入り 速乾", maker: "ほしぞら工房",
    price: 1050, ship: 500, rating: 4.8, count: 35, date: "2026-12-05", stock: true,
    kw: "ボールペン ペン 筆記",
    specs: [["インク", "ゲルインク（速乾）"], ["太さ", "0.5mm"], ["色", "黒"], ["本数", "10本"]],
    desc: "書いてすぐ乾くので、左利きの人にも。",
    reviews: [
      { who: "人事・Kさん", star: 5, text: "左利きでも手が汚れません。" },
      { who: "総務・Lさん", star: 4, text: "送料がかかるのが残念。" }
    ] },
  { id: "p06", cat: "office", rec: 5, icon: "pen",
    name: "油性ボールペン 0.5mm 黒 10本入り", maker: "なみき文具",
    price: 760, ship: 0, rating: 4.8, count: 120, date: "2026-12-03", stock: true,
    kw: "ボールペン ペン 筆記",
    specs: [["インク", "油性"], ["太さ", "0.5mm"], ["色", "黒"], ["本数", "10本"]],
    desc: "長持ちする油性インク。複写の伝票にも。",
    reviews: [
      { who: "経理・Mさん", star: 5, text: "伝票に強く書けます。" },
      { who: "営業・Nさん", star: 5, text: "長持ち。" }
    ] },
  { id: "p07", cat: "office", rec: 7, icon: "pen",
    name: "ゲルインクボールペン 0.5mm 青 10本入り なめらか", maker: "そよかぜ文具",
    price: 1100, ship: 0, rating: 4.8, count: 90, date: "2026-12-07", stock: true,
    kw: "ボールペン ペン 筆記",
    specs: [["インク", "ゲルインク"], ["太さ", "0.5mm"], ["色", "青"], ["本数", "10本"]],
    desc: "「なめらか」シリーズの青。書類の書き込みや校正に。",
    reviews: [
      { who: "総務・Oさん", star: 5, text: "青が見やすい。" },
      { who: "人事・Pさん", star: 4, text: "黒と並べて使っています。" }
    ] },
  { id: "p08", cat: "office", rec: 8, icon: "pen",
    name: "ゲルインクボールペン 0.5mm 黒 10本入り ノック式", maker: "くすのき文具",
    price: 1020, ship: 0, rating: 4.8, count: 77, date: null, stock: false,
    kw: "ボールペン ペン 筆記",
    specs: [["インク", "ゲルインク"], ["太さ", "0.5mm"], ["色", "黒"], ["本数", "10本"]],
    desc: "片手で出せるノック式。ただいま入荷待ちです。",
    reviews: [
      { who: "営業・Qさん", star: 5, text: "片手で使えて便利。" },
      { who: "総務・Rさん", star: 4, text: "早く入荷してほしい。" }
    ] },
  { id: "p09", cat: "office", rec: 9, icon: "paper",
    name: "コピー用紙 A4 500枚×5冊", maker: "わたぐも製紙",
    price: 2480, ship: 0, rating: 4.4, count: 620, date: "2026-12-04", stock: true,
    kw: "コピー用紙 紙 a4",
    specs: [["大きさ", "A4"], ["枚数", "500枚 × 5冊（2,500枚）"], ["白さ", "ふつう"]],
    desc: "紙づまりしにくい定番のコピー用紙。",
    reviews: [
      { who: "総務・Sさん", star: 5, text: "毎月これを頼んでいます。" },
      { who: "経理・Tさん", star: 4, text: "重いので届けてもらえて助かる。" }
    ] },
  { id: "p10", cat: "office", rec: 10, icon: "paper",
    name: "コピー用紙 B4 500枚×5冊", maker: "わたぐも製紙",
    price: 3280, ship: 0, rating: 4.3, count: 85, date: "2026-12-04", stock: true,
    kw: "コピー用紙 紙 b4",
    specs: [["大きさ", "B4"], ["枚数", "500枚 × 5冊（2,500枚）"], ["白さ", "ふつう"]],
    desc: "図面や大きな表の印刷に。",
    reviews: [
      { who: "総務・Uさん", star: 4, text: "B4 を使う部署向けに。" },
      { who: "営業・Vさん", star: 4, text: "問題なし。" }
    ] },
  { id: "p11", cat: "office", rec: 11, icon: "file",
    name: "クリアファイル A4 100枚", maker: "つばさオフィス",
    price: 1280, ship: 0, rating: 4.2, count: 140, date: "2026-12-05", stock: true,
    kw: "クリアファイル ファイル a4",
    specs: [["大きさ", "A4"], ["枚数", "100枚"], ["色", "透明"]],
    desc: "書類の受け渡しに使いやすい透明のファイル。",
    reviews: [
      { who: "人事・Wさん", star: 4, text: "たっぷり入っていて安心。" },
      { who: "総務・Xさん", star: 4, text: "ふつうに使えます。" }
    ] },
  { id: "p12", cat: "office", rec: 12, icon: "note",
    name: "付箋 75×75mm 10冊", maker: "ことり文具",
    price: 680, ship: 330, rating: 4.1, count: 76, date: "2026-12-07", stock: true,
    kw: "付箋 ふせん メモ",
    specs: [["大きさ", "75mm × 75mm"], ["枚数", "90枚 × 10冊"], ["色", "うすい青・うすい緑"]],
    desc: "目に優しい色の付箋。はがしても跡が残りにくい。",
    reviews: [
      { who: "経理・Yさん", star: 4, text: "色が落ち着いていて好き。" },
      { who: "営業・Zさん", star: 4, text: "よく貼りつきます。" }
    ] },

  /* ---------- 日用品 ---------- */
  { id: "d01", cat: "daily", rec: 1, icon: "bottle",
    name: "ハンドソープ 詰め替え 2L", maker: "しずく生活",
    price: 1380, ship: 0, rating: 4.3, count: 210, date: "2026-12-04", stock: true,
    kw: "ハンドソープ せっけん 手洗い",
    specs: [["容量", "2L"], ["香り", "せっけん"], ["形", "詰め替え用"]],
    desc: "給湯室やお手洗いの詰め替えに。泡で出るボトル用です。",
    reviews: [
      { who: "総務・Aさん", star: 4, text: "大容量で手間が減りました。" },
      { who: "人事・Bさん", star: 5, text: "香りがきつくない。" }
    ] },
  { id: "d02", cat: "daily", rec: 2, icon: "box",
    name: "ティッシュペーパー 5箱パック", maker: "しずく生活",
    price: 498, ship: 550, rating: 4.0, count: 330, date: "2026-12-03", stock: true,
    kw: "ティッシュ 紙",
    specs: [["枚数", "180組 × 5箱"], ["大きさ", "ふつう"]],
    desc: "やわらかい定番のティッシュ。",
    reviews: [
      { who: "総務・Cさん", star: 4, text: "安いけれど送料がかかります。" },
      { who: "経理・Dさん", star: 4, text: "ふつうです。" }
    ] },
  { id: "d03", cat: "daily", rec: 3, icon: "bag",
    name: "ごみ袋 45L 半透明 50枚×5冊", maker: "ふたば生活",
    price: 1180, ship: 0, rating: 4.2, count: 150, date: "2026-12-05", stock: true,
    kw: "ごみ袋 ゴミ袋 ポリ袋",
    specs: [["容量", "45L"], ["枚数", "50枚 × 5冊"], ["色", "半透明"]],
    desc: "破れにくい厚手のごみ袋。",
    reviews: [
      { who: "総務・Eさん", star: 4, text: "厚みがあって安心。" },
      { who: "人事・Fさん", star: 4, text: "取り出しやすい。" }
    ] },
  { id: "d04", cat: "daily", rec: 4, icon: "box",
    name: "アルコール除菌シート 100枚×3個", maker: "しずく生活",
    price: 980, ship: 0, rating: 4.4, count: 98, date: "2026-12-04", stock: true,
    kw: "除菌 シート アルコール",
    specs: [["枚数", "100枚 × 3個"], ["大きさ", "20cm × 15cm"]],
    desc: "会議室の机やドアノブのふき取りに。",
    reviews: [
      { who: "総務・Gさん", star: 5, text: "会議のあとに机をふいています。" },
      { who: "営業・Hさん", star: 4, text: "乾きにくくて使いやすい。" }
    ] },
  { id: "d05", cat: "daily", rec: 5, icon: "box",
    name: "ペーパータオル 200枚×30個", maker: "ふたば生活",
    price: 3480, ship: 0, rating: 4.1, count: 60, date: "2026-12-09", stock: true,
    kw: "ペーパータオル 紙 手ふき",
    specs: [["枚数", "200枚 × 30個"], ["大きさ", "23cm × 21cm"]],
    desc: "お手洗いの手ふき用。ケースにそのまま入ります。",
    reviews: [
      { who: "総務・Iさん", star: 4, text: "ケースで届くので保管がしやすい。" },
      { who: "経理・Jさん", star: 4, text: "1枚でしっかりふけます。" }
    ] },

  /* ---------- 飲み物 ---------- */
  { id: "k01", cat: "drink", pr: true, rec: 1, icon: "bottle",
    name: "天然水 2L×6本", maker: "やまなみ飲料",
    price: 1080, ship: 0, rating: 4.5, count: 880, date: "2026-12-03", stock: true,
    kw: "水 天然水 ペットボトル",
    specs: [["容量", "2L × 6本"], ["種類", "天然水"]],
    desc: "給湯室やウォーターサーバーの代わりに。",
    reviews: [
      { who: "総務・Kさん", star: 5, text: "重いので届けてもらえて助かります。" },
      { who: "人事・Lさん", star: 4, text: "くせがなく飲みやすい。" }
    ] },
  { id: "k02", cat: "drink", rec: 6, icon: "bottle",
    name: "緑茶 500ml×24本", maker: "こだま園",
    price: 2380, ship: 0, rating: 4.3, count: 215, date: "2026-12-08", stock: true,
    kw: "お茶 緑茶 ペットボトル",
    specs: [["容量", "500ml × 24本"], ["種類", "緑茶"]],
    desc: "来客用にも出しやすい、すっきりした緑茶。",
    reviews: [
      { who: "総務・Mさん", star: 4, text: "来客用に置いています。" },
      { who: "営業・Nさん", star: 5, text: "苦すぎずちょうどいい。" },
      { who: "経理・Oさん", star: 4, text: "届くまで少し日数がかかります。" }
    ] },
  { id: "k03", cat: "drink", rec: 2, icon: "bottle",
    name: "緑茶 500ml×24本 まろやか", maker: "やまびこ茶舗",
    price: 1980, ship: 880, rating: 4.2, count: 130, date: "2026-12-05", stock: true,
    kw: "お茶 緑茶 ペットボトル",
    specs: [["容量", "500ml × 24本"], ["種類", "緑茶"]],
    desc: "まろやかな味わい。産地から直接お送りするため送料がかかります。",
    reviews: [
      { who: "人事・Pさん", star: 4, text: "味はとても好き。送料が高め。" },
      { who: "総務・Qさん", star: 4, text: "早く届きました。" }
    ] },
  { id: "k04", cat: "drink", rec: 3, icon: "bottle",
    name: "緑茶 350ml×24本", maker: "はるかぜ飲料",
    price: 1680, ship: 0, rating: 4.4, count: 96, date: "2026-12-04", stock: true,
    kw: "お茶 緑茶 ペットボトル",
    specs: [["容量", "350ml × 24本"], ["種類", "緑茶"]],
    desc: "飲みきりやすい小さめのボトル。",
    reviews: [
      { who: "営業・Rさん", star: 5, text: "会議で1本飲みきれるサイズ。" },
      { who: "総務・Sさん", star: 4, text: "500ml だと思って頼んだら小さかった。" }
    ] },
  { id: "k05", cat: "drink", rec: 4, icon: "bottle",
    name: "緑茶 500ml×24本 すっきり", maker: "ささのは茶園",
    price: 2180, ship: 0, rating: 4.1, count: 72, date: "2026-12-14", stock: true,
    kw: "お茶 緑茶 ペットボトル",
    specs: [["容量", "500ml × 24本"], ["種類", "緑茶"]],
    desc: "あと味すっきり。ただいま注文が多く、お届けまで日数がかかります。",
    reviews: [
      { who: "経理・Tさん", star: 4, text: "おいしいけれど届くのが遅かった。" },
      { who: "人事・Uさん", star: 4, text: "すっきりして飲みやすい。" }
    ] },
  { id: "k06", cat: "drink", rec: 5, icon: "bottle",
    name: "ほうじ茶 500ml×24本", maker: "こだま園",
    price: 2280, ship: 0, rating: 4.0, count: 40, date: "2026-12-07", stock: true,
    kw: "お茶 ほうじ茶 ペットボトル",
    specs: [["容量", "500ml × 24本"], ["種類", "ほうじ茶"]],
    desc: "香ばしいほうじ茶。",
    reviews: [
      { who: "総務・Vさん", star: 4, text: "冬はこちらが人気。" },
      { who: "営業・Wさん", star: 4, text: "香りがよい。" }
    ] },
  { id: "k07", cat: "drink", rec: 7, icon: "bottle",
    name: "緑茶 500ml×24本 濃いめ", maker: "あおい茶園",
    price: 2050, ship: 0, rating: 4.5, count: 58, date: null, stock: false,
    kw: "お茶 緑茶 ペットボトル",
    specs: [["容量", "500ml × 24本"], ["種類", "緑茶（濃いめ）"]],
    desc: "しっかりした渋みの濃いめの緑茶。ただいま入荷待ちです。",
    reviews: [
      { who: "経理・Xさん", star: 5, text: "濃いめが好きな人に。" },
      { who: "人事・Yさん", star: 4, text: "また入荷したら頼みたい。" }
    ] },
  { id: "k08", cat: "drink", rec: 8, icon: "bottle",
    name: "緑茶 500ml×24本 お徳用", maker: "くもま茶園",
    price: 2280, ship: 0, rating: 3.7, count: 180, date: "2026-12-07", stock: true,
    kw: "お茶 緑茶 ペットボトル",
    specs: [["容量", "500ml × 24本"], ["種類", "緑茶"]],
    desc: "たくさん飲む職場向けのお徳用。",
    reviews: [
      { who: "総務・Zさん", star: 3, text: "味がうすく感じました。" },
      { who: "営業・Aさん", star: 4, text: "量を飲むならこれ。" }
    ] },
  { id: "k09", cat: "drink", rec: 9, icon: "cup",
    name: "ドリップコーヒー 100袋", maker: "ほしぞら珈琲",
    price: 2680, ship: 0, rating: 4.4, count: 260, date: "2026-12-04", stock: true,
    kw: "コーヒー 珈琲",
    specs: [["量", "1袋 8g × 100袋"], ["味", "中くらいの焙煎"]],
    desc: "1杯ずつ淹れられるドリップ式。",
    reviews: [
      { who: "経理・Bさん", star: 5, text: "香りがよく、来客にも出せます。" },
      { who: "総務・Cさん", star: 4, text: "100袋で長持ち。" }
    ] },
  { id: "k10", cat: "drink", rec: 10, icon: "bottle",
    name: "炭酸水 500ml×24本", maker: "やまなみ飲料",
    price: 1580, ship: 0, rating: 4.2, count: 190, date: "2026-12-05", stock: true,
    kw: "炭酸水 炭酸 ペットボトル 水",
    specs: [["容量", "500ml × 24本"], ["種類", "強めの炭酸水"]],
    desc: "午後の眠気ざましに。",
    reviews: [
      { who: "営業・Dさん", star: 4, text: "しっかり強炭酸。" },
      { who: "人事・Eさん", star: 4, text: "冷蔵庫に常備しています。" }
    ] }
];
