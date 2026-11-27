/* みらいトラベル（架空）— 練習用のデータと料金の決まり
   ・宿・料金はすべて架空です。乱数は使いません（いつ開いても同じ値）。
   ・料金は「1室1泊・税抜」で持ち、税込 = 税抜 × 1.1（1円未満切り捨て）。
   ・曜日・年末の上乗せ（1室1泊・税抜）：金曜 +1,500円、土曜 +2,500円、12月29日〜31日 +3,000円。
     宿ごとに金曜・土曜の上乗せが違うときは、その宿の fri / sat を使う。
   ・2名1室は 1名1室の料金 + 3,000円（朝食付きプランは さらに +1,200円）。1室は2名まで。
   ・宿泊税（このサイトの練習用の決まり）：1人1泊 福岡 200円・大阪 200円・仙台 300円。宿泊料金とは別。
*/
(function (root) {
  var RULES = { fri: 1500, sat: 2500, yearEnd: 3000, add2: 3000, add2Breakfast: 1200, taxRate: 10 };

  var REGIONS = {
    fukuoka: { name: '福岡・博多駅周辺', city: '福岡市博多区', main: '博多駅', tax: 200 },
    osaka:   { name: '大阪・新大阪駅周辺', city: '大阪市淀川区', main: '新大阪駅', tax: 200 },
    sendai:  { name: '仙台・仙台駅周辺', city: '仙台市', main: '仙台駅', tax: 300 }
  };

  // プランの型： meal = 素泊まり / 朝食付き、cancel = free（前日18:00まで無料）/ nonref（返金不可）
  function P(id, name, meal, cancel, p1) { return { id: id, name: name, meal: meal, cancel: cancel, p1: p1 }; }
  var SU = '【素泊まり】シンプルステイ';
  var CH = '【朝食付き】朝ごはんで一日のスタート';
  var HAYA_CH = '【早割・おトク】朝食付きプラン';
  var HAYA_SU = '【早割・おトク】素泊まりプラン';

  var HOTELS = [
    // ---------- 福岡・博多駅周辺 ----------
    { id: 'F01', region: 'fukuoka', name: 'ホテル こもれび博多', rec: 3, color: '#5B7A99', floors: 8,
      catch: '筑紫口から歩いてすぐ。広めのデスクで仕事もはかどります。',
      station: 'JR博多駅', walk: 4, mainWalk: 4, access: 'JR博多駅 筑紫口から徒歩4分',
      score: 4.3, count: 286, smoking: '禁煙', facilities: ['Wi-Fi', 'コインランドリー', '電子レンジ', 'デスク広め'],
      inStart: '15:00', inEnd: '25:00', out: '10:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'incl', full: [],
      plans: [P('a', SU, '素泊まり', 'free', 7600), P('b', '【朝食付き】焼きたてパンと九州の朝ごはん', '朝食付き', 'free', 8800), P('c', HAYA_CH, '朝食付き', 'nonref', 7900)] },
    { id: 'F02', region: 'fukuoka', name: 'ステイ・ルミナ博多駅前', rec: 5, color: '#4E5D7A', floors: 10,
      catch: '博多口の目の前。新幹線の時間ぎりぎりまで部屋で過ごせます。',
      station: 'JR博多駅', walk: 2, mainWalk: 2, access: 'JR博多駅 博多口から徒歩2分',
      score: 4.1, count: 154, smoking: '禁煙', facilities: ['Wi-Fi', '加湿空気清浄機', 'コンビニ併設'],
      inStart: '15:00', inEnd: '24:00', out: '11:00', pay: ['現地払い'], taxDisplay: 'incl', full: ['2026-12-31'],
      plans: [P('a', SU, '素泊まり', 'free', 8400), P('b', CH, '朝食付き', 'free', 9600)] },
    { id: 'F03', region: 'fukuoka', name: 'ホテル ささらぎ博多', rec: 7, color: '#6B7F5A', floors: 7,
      catch: '落ち着いた客室と、地元の野菜を使った朝ごはん。',
      station: 'JR博多駅', walk: 5, mainWalk: 5, access: 'JR博多駅 筑紫口から徒歩5分',
      score: 4.0, count: 58, smoking: '禁煙', facilities: ['Wi-Fi', '大浴場', '電子レンジ'],
      inStart: '15:00', inEnd: '24:00', out: '10:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'incl', full: [],
      plans: [P('a', SU, '素泊まり', 'free', 9200), P('b', CH, '朝食付き', 'free', 10700), P('c', HAYA_CH, '朝食付き', 'nonref', 9800)] },
    { id: 'F04', region: 'fukuoka', name: 'ホテル 港風（みなとかぜ）博多', rec: 2, color: '#3F7F7A', floors: 9,
      catch: '口コミで人気。朝食の明太子ごはんが評判です。',
      station: 'JR博多駅', walk: 3, mainWalk: 3, access: 'JR博多駅 筑紫口から徒歩3分',
      score: 4.4, count: 421, smoking: '禁煙', facilities: ['Wi-Fi', '大浴場', 'コインランドリー', 'デスク広め'],
      inStart: '15:00', inEnd: '25:00', out: '10:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'incl', full: ['2026-12-10'],
      plans: [P('a', SU, '素泊まり', 'free', 7000), P('b', '【朝食付き】明太子ごはんの朝ごはん', '朝食付き', 'free', 8200)] },
    { id: 'F05', region: 'fukuoka', name: 'ビジネスホテル しらかべ博多', rec: 1, color: '#7F7A70', floors: 7,
      catch: '出張の方に選ばれています。全室に大きめのデスク。',
      station: 'JR博多駅', walk: 5, mainWalk: 5, access: 'JR博多駅 博多口から徒歩5分',
      score: 4.2, count: 97, smoking: '禁煙', facilities: ['Wi-Fi', 'デスク広め', 'ズボンプレッサー'],
      inStart: '15:00', inEnd: '24:00', out: '10:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'excl', full: [],
      plans: [P('a', SU, '素泊まり', 'free', 9300), P('b', CH, '朝食付き', 'free', 10800)] },
    { id: 'F06', region: 'fukuoka', name: 'ホテル かなで博多祇園', rec: 4, color: '#8C5E58', floors: 8,
      catch: '博多駅エリアの駅チカ！ 駅から徒歩2分。',
      station: '地下鉄 祇園駅', walk: 2, mainWalk: 11, access: '地下鉄 祇園駅 2番出口から徒歩2分（JR博多駅からは徒歩11分）',
      score: 4.3, count: 188, smoking: '禁煙', facilities: ['Wi-Fi', 'コインランドリー', '加湿空気清浄機'],
      inStart: '15:00', inEnd: '25:00', out: '10:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'incl', full: [],
      plans: [P('a', SU, '素泊まり', 'free', 7400), P('b', CH, '朝食付き', 'free', 8500)] },
    { id: 'F07', region: 'fukuoka', name: '博多 よつばステイ', rec: 6, color: '#5F8C6E', floors: 6,
      catch: '2026年11月オープン。新しくてきれいなお部屋です。',
      station: 'JR博多駅', walk: 3, mainWalk: 3, access: 'JR博多駅 筑紫口から徒歩3分',
      score: 4.9, count: 3, smoking: '禁煙', facilities: ['Wi-Fi', '電子レンジ'],
      inStart: '15:00', inEnd: '24:00', out: '10:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'incl', full: [],
      plans: [P('a', SU, '素泊まり', 'free', 6800), P('b', CH, '朝食付き', 'free', 8000)] },
    { id: 'F08', region: 'fukuoka', name: 'ホテル あさなぎ博多口', rec: 8, color: '#7A5C7F', floors: 11,
      catch: '博多口を出てすぐ。早めの予約でおトクに泊まれます。',
      station: 'JR博多駅', walk: 1, mainWalk: 1, access: 'JR博多駅 博多口から徒歩1分',
      score: 4.5, count: 230, smoking: '禁煙', facilities: ['Wi-Fi', '大浴場', 'デスク広め', 'コンビニ併設'],
      inStart: '15:00', inEnd: '25:00', out: '11:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'incl', full: [],
      plans: [P('a', SU, '素泊まり', 'free', 9800), P('b', CH, '朝食付き', 'free', 11000), P('c', HAYA_CH, '朝食付き', 'nonref', 9500)] },
    { id: 'F09', region: 'fukuoka', name: 'ひだまり旅館 博多', rec: 9, color: '#9A7B4F', floors: 2, type: 'ryokan',
      catch: '畳のお部屋でゆっくり。家庭的な和朝食つきのプランも。',
      station: 'JR博多駅', walk: 9, mainWalk: 9, access: 'JR博多駅 筑紫口から徒歩9分',
      score: 4.6, count: 75, smoking: '喫煙可', facilities: ['Wi-Fi', '大浴場', '駐車場（有料）'],
      inStart: '16:00', inEnd: '22:00', out: '10:00', pay: ['現地払い'], taxDisplay: 'incl', full: [],
      plans: [P('a', '【素泊まり】和室でのんびり', '素泊まり', 'free', 7200), P('b', '【朝食付き】家庭的な和朝食', '朝食付き', 'free', 9000)] },

    // ---------- 大阪・新大阪駅周辺 ----------
    { id: 'O01', region: 'osaka', name: 'ホテル ねむの木 新大阪', rec: 4, color: '#5B7A99', floors: 9,
      catch: '静かな客室でぐっすり。出張の連泊にも。',
      station: 'JR新大阪駅', walk: 4, mainWalk: 4, access: 'JR新大阪駅 東口から徒歩4分',
      score: 4.2, count: 205, smoking: '禁煙', facilities: ['Wi-Fi', 'コインランドリー', 'デスク広め'],
      inStart: '15:00', inEnd: '25:00', out: '10:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'incl', full: [],
      plans: [P('a', SU, '素泊まり', 'free', 7000), P('b', HAYA_SU, '素泊まり', 'nonref', 6300), P('c', CH, '朝食付き', 'free', 8300)] },
    { id: 'O02', region: 'osaka', name: 'ホテル 川霧（かわぎり）新大阪', rec: 2, color: '#4E5D7A', floors: 8, fri: 2000, sat: 5000,
      catch: '平日はおトクな料金。新幹線での出張に便利です。',
      station: 'JR新大阪駅', walk: 8, mainWalk: 8, access: 'JR新大阪駅 北口から徒歩8分',
      score: 4.0, count: 88, smoking: '禁煙', facilities: ['Wi-Fi', '電子レンジ'],
      inStart: '15:00', inEnd: '24:00', out: '10:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'incl', full: [],
      plans: [P('a', SU, '素泊まり', 'free', 6200), P('b', CH, '朝食付き', 'free', 7400)] },
    { id: 'O03', region: 'osaka', name: 'ステイ・ミナモ新大阪', rec: 3, color: '#7F7A70', floors: 7,
      catch: '駅から3分。たばこを吸う方も気がねなく。',
      station: 'JR新大阪駅', walk: 3, mainWalk: 3, access: 'JR新大阪駅 東口から徒歩3分',
      score: 4.1, count: 140, smoking: '喫煙可', facilities: ['Wi-Fi', 'コンビニ併設'],
      inStart: '15:00', inEnd: '25:00', out: '10:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'incl', full: [],
      plans: [P('a', SU, '素泊まり', 'free', 6000), P('b', CH, '朝食付き', 'free', 7200)] },
    { id: 'O04', region: 'osaka', name: 'ホテル はなみずき新大阪', rec: 1, color: '#3F7F7A', floors: 10,
      catch: '評価の高い人気の宿。大浴場でゆっくりできます。',
      station: 'JR新大阪駅', walk: 6, mainWalk: 6, access: 'JR新大阪駅 東口から徒歩6分',
      score: 4.3, count: 310, smoking: '禁煙', facilities: ['Wi-Fi', '大浴場', 'コインランドリー'],
      inStart: '15:00', inEnd: '25:00', out: '10:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'incl', full: ['2026-12-19'],
      plans: [P('a', SU, '素泊まり', 'free', 6600), P('b', CH, '朝食付き', 'free', 7800)] },
    { id: 'O05', region: 'osaka', name: 'ホテル ゆうなぎ新大阪北', rec: 5, color: '#8C5E58', floors: 7,
      catch: '新大阪駅から近い！ 駅まで徒歩3分。',
      station: '地下鉄 東三国駅', walk: 3, mainWalk: 13, access: '地下鉄 東三国駅から徒歩3分（JR新大阪駅からは徒歩13分）',
      score: 4.2, count: 132, smoking: '禁煙', facilities: ['Wi-Fi', '電子レンジ', '加湿空気清浄機'],
      inStart: '15:00', inEnd: '25:00', out: '10:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'incl', full: [],
      plans: [P('a', SU, '素泊まり', 'free', 5800), P('b', CH, '朝食付き', 'free', 7000)] },
    { id: 'O06', region: 'osaka', name: '新大阪 ホテル つきあかり', rec: 6, color: '#7A5C7F', floors: 9,
      catch: '早めの予約がおトク。駅から5分の便利な場所。',
      station: 'JR新大阪駅', walk: 5, mainWalk: 5, access: 'JR新大阪駅 東口から徒歩5分',
      score: 4.2, count: 176, smoking: '禁煙', facilities: ['Wi-Fi', 'デスク広め'],
      inStart: '15:00', inEnd: '25:00', out: '10:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'incl', full: [],
      plans: [P('a', HAYA_SU, '素泊まり', 'nonref', 5900), P('b', SU, '素泊まり', 'free', 7400), P('c', CH, '朝食付き', 'free', 8600)] },
    { id: 'O07', region: 'osaka', name: 'ビジネスホテル かえで新大阪', rec: 7, color: '#6B7F5A', floors: 8,
      catch: '出張のお客さまの定番。シンプルで使いやすいお部屋。',
      station: 'JR新大阪駅', walk: 7, mainWalk: 7, access: 'JR新大阪駅 東口から徒歩7分',
      score: 4.0, count: 45, smoking: '禁煙', facilities: ['Wi-Fi', 'ズボンプレッサー'],
      inStart: '15:00', inEnd: '24:00', out: '10:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'excl', full: [],
      plans: [P('a', SU, '素泊まり', 'free', 7200), P('b', CH, '朝食付き', 'free', 8400)] },
    { id: 'O08', region: 'osaka', name: '新大阪 すずらんイン', rec: 8, color: '#5F8C6E', floors: 6,
      catch: 'できたばかりの小さな宿。口コミ満点です。',
      station: 'JR新大阪駅', walk: 2, mainWalk: 2, access: 'JR新大阪駅 東口から徒歩2分',
      score: 5.0, count: 3, smoking: '禁煙', facilities: ['Wi-Fi'],
      inStart: '15:00', inEnd: '24:00', out: '10:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'incl', full: [],
      plans: [P('a', SU, '素泊まり', 'free', 6000)] },

    // ---------- 仙台・仙台駅周辺 ----------
    { id: 'S01', region: 'sendai', name: 'ホテル けやき並木仙台', rec: 3, color: '#6B7F5A', floors: 9,
      catch: '夜遅くの到着も安心。チェックインは翌1:00まで。',
      station: 'JR仙台駅', walk: 6, mainWalk: 6, access: 'JR仙台駅 西口から徒歩6分',
      score: 4.1, count: 120, smoking: '禁煙', facilities: ['Wi-Fi', 'コインランドリー', 'デスク広め'],
      inStart: '15:00', inEnd: '25:00', out: '10:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'incl', full: [],
      plans: [P('a', SU, '素泊まり', 'free', 6400), P('b', CH, '朝食付き', 'free', 7600)] },
    { id: 'S02', region: 'sendai', name: 'ホテル ほしぞら仙台', rec: 1, color: '#4E5D7A', floors: 8,
      catch: '西口から5分。手ごろな料金で人気です。',
      station: 'JR仙台駅', walk: 5, mainWalk: 5, access: 'JR仙台駅 西口から徒歩5分',
      score: 4.2, count: 98, smoking: '禁煙', facilities: ['Wi-Fi', '電子レンジ'],
      inStart: '15:00', inEnd: '23:00', out: '10:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'incl', full: [],
      plans: [P('a', SU, '素泊まり', 'free', 5900), P('b', CH, '朝食付き', 'free', 7100)] },
    { id: 'S03', region: 'sendai', name: 'ステイ・あおい仙台駅東口', rec: 2, color: '#3F7F7A', floors: 7,
      catch: '東口からすぐ。チェックインは翌2:00まで。',
      station: 'JR仙台駅', walk: 3, mainWalk: 3, access: 'JR仙台駅 東口から徒歩3分',
      score: 4.0, count: 66, smoking: '禁煙', facilities: ['Wi-Fi', 'コンビニ併設'],
      inStart: '15:00', inEnd: '26:00', out: '10:00', pay: ['現地払い'], taxDisplay: 'incl', full: [],
      plans: [P('a', SU, '素泊まり', 'free', 6000), P('b', CH, '朝食付き', 'free', 7200)] },
    { id: 'S04', region: 'sendai', name: 'ホテル ささめ仙台', rec: 5, color: '#5B7A99', floors: 10,
      catch: '口コミの評価が高い、落ち着いた宿。',
      station: 'JR仙台駅', walk: 8, mainWalk: 8, access: 'JR仙台駅 西口から徒歩8分',
      score: 4.4, count: 210, smoking: '禁煙', facilities: ['Wi-Fi', '大浴場', 'デスク広め'],
      inStart: '15:00', inEnd: '24:00', out: '11:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'incl', full: [],
      plans: [P('a', SU, '素泊まり', 'free', 6600), P('b', CH, '朝食付き', 'free', 7900)] },
    { id: 'S05', region: 'sendai', name: 'ホテル くるみ仙台', rec: 4, color: '#8C5E58', floors: 9,
      catch: '早割でおトク。駅から4分。',
      station: 'JR仙台駅', walk: 4, mainWalk: 4, access: 'JR仙台駅 西口から徒歩4分',
      score: 4.3, count: 150, smoking: '禁煙', facilities: ['Wi-Fi', 'コインランドリー'],
      inStart: '15:00', inEnd: '25:00', out: '10:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'incl', full: [],
      plans: [P('a', HAYA_SU, '素泊まり', 'nonref', 5500), P('b', SU, '素泊まり', 'free', 7000), P('c', CH, '朝食付き', 'free', 8200)] },
    { id: 'S06', region: 'sendai', name: 'ホテル いちょう五橋', rec: 6, color: '#9A7B4F', floors: 7,
      catch: '仙台駅エリア・駅から徒歩2分。',
      station: '地下鉄 五橋駅', walk: 2, mainWalk: 13, access: '地下鉄 五橋駅から徒歩2分（JR仙台駅からは徒歩13分）',
      score: 4.2, count: 101, smoking: '禁煙', facilities: ['Wi-Fi', '電子レンジ'],
      inStart: '15:00', inEnd: '25:00', out: '10:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'incl', full: [],
      plans: [P('a', SU, '素泊まり', 'free', 5600), P('b', CH, '朝食付き', 'free', 6800)] },
    { id: 'S07', region: 'sendai', name: '仙台 こはくイン', rec: 7, color: '#5F8C6E', floors: 6,
      catch: '新しい小さな宿。口コミの評価がとても高いです。',
      station: 'JR仙台駅', walk: 2, mainWalk: 2, access: 'JR仙台駅 東口から徒歩2分',
      score: 4.8, count: 3, smoking: '禁煙', facilities: ['Wi-Fi'],
      inStart: '15:00', inEnd: '25:00', out: '10:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'incl', full: [],
      plans: [P('a', SU, '素泊まり', 'free', 5700)] },
    { id: 'S08', region: 'sendai', name: 'ホテル しののめ仙台', rec: 8, color: '#7F7A70', floors: 8,
      catch: 'シンプルなお部屋を手ごろな料金で。',
      station: 'JR仙台駅', walk: 7, mainWalk: 7, access: 'JR仙台駅 西口から徒歩7分',
      score: 4.1, count: 77, smoking: '禁煙', facilities: ['Wi-Fi', 'ズボンプレッサー'],
      inStart: '15:00', inEnd: '25:00', out: '10:00', pay: ['現地払い', '請求書払い'], taxDisplay: 'excl', full: [],
      plans: [P('a', SU, '素泊まり', 'free', 6500), P('b', CH, '朝食付き', 'free', 7700)] }
  ];

  var DOW = ['日', '月', '火', '水', '木', '金', '土'];

  function dayNum(dateStr) { return parseInt(String(dateStr).slice(8, 10), 10); }
  function dateOf(d) { return '2026-12-' + (d < 10 ? '0' : '') + d; }
  function dow(dateStr) { return new Date(Date.UTC(2026, 11, dayNum(dateStr))).getUTCDay(); }
  function label(dateStr) {
    var d = dayNum(dateStr);
    if (d === 32) return '2027年1月1日（金）';
    return '12月' + d + '日（' + DOW[dow(dateStr)] + '）';
  }
  function incl(x) { return Math.floor(x * (100 + RULES.taxRate) / 100); }

  // 1室1泊・税抜（ppl = その部屋の人数 1 か 2）
  function roomNightExcl(hotel, plan, dateStr, ppl) {
    var base = plan.p1;
    if (ppl === 2) base += RULES.add2 + (plan.meal === '朝食付き' ? RULES.add2Breakfast : 0);
    var w = dow(dateStr), d = dayNum(dateStr);
    if (w === 5) base += (hotel.fri != null ? hotel.fri : RULES.fri);
    if (w === 6) base += (hotel.sat != null ? hotel.sat : RULES.sat);
    if (d >= 29) base += RULES.yearEnd;
    return base;
  }

  // 人数と部屋数 → 2名の部屋の数・1名の部屋の数
  function split(people, rooms) {
    var two = people - rooms, one = rooms - two;
    if (rooms < 1 || people < rooms || two > rooms) return null;
    return { one: one, two: two };
  }

  function stayDates(start, nights) {
    var d = dayNum(start), out = [];
    for (var i = 0; i < nights; i++) out.push(dateOf(d + i));
    return out;
  }

  function quote(hotel, plan, start, nights, people, rooms) {
    var sp = split(people, rooms);
    if (!sp) return null;
    var dates = stayDates(start, nights);
    var tax = REGIONS[hotel.region].tax;
    var q = { nights: [], excl: 0, incl: 0, tax: 0, total: 0, fullDates: [] };
    dates.forEach(function (ds) {
      var e1 = roomNightExcl(hotel, plan, ds, 1), e2 = roomNightExcl(hotel, plan, ds, 2);
      var ex = sp.one * e1 + sp.two * e2;
      var inc = sp.one * incl(e1) + sp.two * incl(e2);
      var t = people * tax;
      q.nights.push({ date: ds, room1Excl: e1, room1Incl: incl(e1), room2Excl: e2, room2Incl: incl(e2), excl: ex, incl: inc, tax: t });
      q.excl += ex; q.incl += inc; q.tax += t;
      if (hotel.full.indexOf(ds) >= 0) q.fullDates.push(ds);
    });
    q.total = q.incl + q.tax;
    q.full = q.fullDates.length > 0;
    return q;
  }

  root.MT = { RULES: RULES, REGIONS: REGIONS, HOTELS: HOTELS, DOW: DOW, dayNum: dayNum, dateOf: dateOf, dow: dow,
    label: label, incl: incl, roomNightExcl: roomNightExcl, split: split, stayDates: stayDates, quote: quote };
})(typeof window !== 'undefined' ? window : globalThis);
