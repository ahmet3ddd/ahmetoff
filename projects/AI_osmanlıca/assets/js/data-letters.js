/* ══ Osmanlı elifbâsı — 33 harf + hemze & lâmelif ══
   nc  : "non-connecting" — kendinden sonraki harfe bağlanmaz
   eb  : ebced değeri (0 = klasik ebcedde yok, Fars harfleri)
   fam : şekil ailesi (aynı gövdeyi paylaşan harfler)                     */

var LETTERS = [
  { id:'elif', ch:'ا', name:'elif',  tr:'a / e / â', nc:1, eb:1,    fam:'elif', dots:0,
    sound:'Kelime başında a-e sesi verir; ortada ve sonda uzun â olur.',
    note:'Başta hareke ile a/e; medli hâli آ (elif-i memdûde) uzun â okunur.',
    ex:{o:'آنا', t:'ana', m:'anne'} },
  { id:'be', ch:'ب', name:'be', tr:'b', nc:0, eb:2, fam:'be', dots:1,
    sound:'b sesi.', note:'Altında tek nokta. Te, se, pe ile aynı gövdeyi paylaşır.',
    ex:{o:'بابا', t:'baba', m:'baba'} },
  { id:'pe', ch:'پ', name:'pe', tr:'p', nc:0, eb:0, fam:'be', dots:3,
    sound:'p sesi.', note:'Farsçadan alınmıştır; altında üç nokta. Arapça kelimelerde bulunmaz.',
    ex:{o:'پنجره', t:'pencere', m:'pencere'} },
  { id:'te', ch:'ت', name:'te', tr:'t', nc:0, eb:400, fam:'be', dots:2,
    sound:'İnce t sesi.', note:'Üstünde iki nokta. Kalın t için ط (tı) kullanılır.',
    ex:{o:'تاج', t:'tâc', m:'taç'} },
  { id:'se', ch:'ث', name:'se (peltek)', tr:'s', nc:0, eb:500, fam:'be', dots:3,
    sound:'Arapçada peltek s; Osmanlıcada düz s okunur.', note:'Yalnız Arapça kelimelerde görülür.',
    ex:{o:'ثواب', t:'sevâb', m:'sevap'} },
  { id:'cim', ch:'ج', name:'cim', tr:'c', nc:0, eb:3, fam:'cim', dots:1,
    sound:'c sesi.', note:'Ha, hı, çim ile aynı gövde; ayırt edici işaret noktadır.',
    ex:{o:'جان', t:'cân', m:'can'} },
  { id:'cim2', ch:'چ', name:'çim', tr:'ç', nc:0, eb:0, fam:'cim', dots:3,
    sound:'ç sesi.', note:'Farsçadan alınmıştır; içinde üç nokta.',
    ex:{o:'چیچك', t:'çiçek', m:'çiçek'} },
  { id:'ha', ch:'ح', name:'ha (hâ-i hutti)', tr:'h', nc:0, eb:8, fam:'cim', dots:0,
    sound:'Boğazdan gelen h sesi.', note:'Noktasızdır. Arapça kelimelerde geçer.',
    ex:{o:'حیات', t:'hayât', m:'hayat'} },
  { id:'hi', ch:'خ', name:'hı', tr:'h (hırıltılı)', nc:0, eb:600, fam:'cim', dots:1,
    sound:'Gırtlaktan hırıltılı h.', note:'Üstünde tek nokta. Arapça ve Farsça kelimelerde bulunur.',
    ex:{o:'خبر', t:'haber', m:'haber'} },
  { id:'dal', ch:'د', name:'dal', tr:'d', nc:1, eb:4, fam:'dal', dots:0,
    sound:'İnce d sesi.', note:'Sonrasına BAĞLANMAZ. Kalın d için genelde ط yazılır.',
    ex:{o:'دوست', t:'dost', m:'dost'} },
  { id:'zel', ch:'ذ', name:'zel', tr:'z', nc:1, eb:700, fam:'dal', dots:1,
    sound:'Arapçada peltek z; Osmanlıcada düz z.', note:'Sonrasına bağlanmaz. Yalnız Arapça kelimelerde.',
    ex:{o:'ذوق', t:'zevk', m:'zevk'} },
  { id:'re', ch:'ر', name:'rı', tr:'r', nc:1, eb:200, fam:'re', dots:0,
    sound:'r sesi.', note:'Sonrasına bağlanmaz. Satır çizgisinin altına iner.',
    ex:{o:'رنك', t:'renk', m:'renk'} },
  { id:'ze', ch:'ز', name:'ze', tr:'z', nc:1, eb:7, fam:'re', dots:1,
    sound:'z sesi.', note:'Sonrasına bağlanmaz. Üstünde tek nokta.',
    ex:{o:'زمان', t:'zamân', m:'zaman'} },
  { id:'je', ch:'ژ', name:'je', tr:'j', nc:1, eb:0, fam:'re', dots:3,
    sound:'j sesi.', note:'Farsçadan alınmıştır. Sonrasına bağlanmaz.',
    ex:{o:'ژاله', t:'jâle', m:'çiy tanesi'} },
  { id:'sin', ch:'س', name:'sin', tr:'s', nc:0, eb:60, fam:'sin', dots:0,
    sound:'İnce s sesi.', note:'Üç dişlidir. Kalın s için ص (sad) yazılır.',
    ex:{o:'سلام', t:'selâm', m:'selam'} },
  { id:'sin2', ch:'ش', name:'şın', tr:'ş', nc:0, eb:300, fam:'sin', dots:3,
    sound:'ş sesi.', note:'Sin gövdesi üzerine üç nokta.',
    ex:{o:'شهر', t:'şehir', m:'şehir'} },
  { id:'sad', ch:'ص', name:'sad', tr:'s (kalın)', nc:0, eb:90, fam:'sad', dots:0,
    sound:'Kalın s sesi.', note:'Türkçe kelimelerde kalın ünlü varsa س yerine ص yazılır: صو (su), صاچ (saç).',
    ex:{o:'صو', t:'su', m:'su'} },
  { id:'dad', ch:'ض', name:'dad', tr:'d / z (kalın)', nc:0, eb:800, fam:'sad', dots:1,
    sound:'Kalın d veya z.', note:'Yalnız Arapça kelimelerde. Arapçaya "dad dili" denmesinin sebebi bu harftir.',
    ex:{o:'ضیا', t:'ziyâ', m:'ışık'} },
  { id:'ti', ch:'ط', name:'tı', tr:'t (kalın)', nc:0, eb:9, fam:'ti', dots:0,
    sound:'Kalın t sesi.', note:'Türkçe kelimelerde kalın ünlüyle: طاش (taş), طوز (tuz). Kalın d sesi de ط ile yazılır: طاغ (dağ).',
    ex:{o:'طاغ', t:'dağ', m:'dağ'} },
  { id:'zi', ch:'ظ', name:'zı', tr:'z (kalın)', nc:0, eb:900, fam:'ti', dots:1,
    sound:'Kalın z sesi.', note:'Yalnız Arapça kelimelerde görülür.',
    ex:{o:'ظلم', t:'zulm', m:'zulüm'} },
  { id:'ayn', ch:'ع', name:'ayın', tr:'ʿ (a/e/ı/i/u/ü)', nc:0, eb:70, fam:'ayn', dots:0,
    sound:'Boğazdan çıkan hafif duraklama; Osmanlıcada çoğu zaman ünlü gibi okunur.',
    note:'Arapça kelimelerin başında ünlü taşıyıcısıdır: علم (ilim), عسكر (asker).',
    ex:{o:'علم', t:'ʿilm', m:'ilim'} },
  { id:'gayn', ch:'غ', name:'gayın', tr:'g / ğ', nc:0, eb:1000, fam:'ayn', dots:1,
    sound:'Gırtlaktan g veya yumuşak ğ.', note:'Türkçe kelimelerde kalın ğ sesi: طاغ (dağ), یاغمور (yağmur).',
    ex:{o:'غم', t:'gam', m:'keder'} },
  { id:'fe', ch:'ف', name:'fe', tr:'f', nc:0, eb:80, fam:'fe', dots:1,
    sound:'f sesi.', note:'Üstünde tek nokta; kaf ile karıştırmayın (kafta iki nokta var).',
    ex:{o:'فكر', t:'fikr', m:'fikir'} },
  { id:'kaf', ch:'ق', name:'kaf', tr:'k (kalın)', nc:0, eb:100, fam:'fe', dots:2,
    sound:'Kalın k sesi.', note:'Kalın ünlülü Türkçe kelimelerde: قوش (kuş), قار (kar). İnce k için ك kullanılır.',
    ex:{o:'قلم', t:'kalem', m:'kalem'} },
  { id:'kef', ch:'ك', name:'kef', tr:'k / g / ñ / y', nc:0, eb:20, fam:'kef', dots:0,
    sound:'İnce k; Türkçe kelimelerde g, ñ ve bazen y sesini de karşılar.',
    note:'Osmanlıcanın en çok iş yapan harfidir. Ayırt etmek için g sesine گ, geniz n sesine ڭ yazılabilir.',
    ex:{o:'كتاب', t:'kitâb', m:'kitap'} },
  { id:'gef', ch:'گ', name:'gef (kâf-ı Fârisî)', tr:'g', nc:0, eb:0, fam:'kef', dots:0,
    sound:'g sesi.', note:'Kefin üstüne ikinci bir çizgi eklenir. Matbu metinlerde çoğu zaman yine ك yazılır.',
    ex:{o:'گمی', t:'gemi', m:'gemi'} },
  { id:'nef', ch:'ڭ', name:'nef / sağır kef', tr:'ñ (n)', nc:0, eb:0, fam:'kef', dots:3,
    sound:'Genizden gelen n sesi (nazal ñ).', note:'Eski Türkçenin ñ sesi: دڭز (deñiz), بیڭ (biñ). Bugün n okunur.',
    ex:{o:'دڭز', t:'deñiz', m:'deniz'} },
  { id:'lam', ch:'ل', name:'lâm', tr:'l', nc:0, eb:30, fam:'lam', dots:0,
    sound:'l sesi.', note:'Elif ile birleşince لا (lâmelif) kalıbını yapar.',
    ex:{o:'لاله', t:'lâle', m:'lale'} },
  { id:'mim', ch:'م', name:'mim', tr:'m', nc:0, eb:40, fam:'mim', dots:0,
    sound:'m sesi.', note:'Yuvarlak başlı; kuyruğu satırın altına iner.',
    ex:{o:'مكتب', t:'mekteb', m:'okul'} },
  { id:'nun', ch:'ن', name:'nun', tr:'n', nc:0, eb:50, fam:'be', dots:1,
    sound:'n sesi.', note:'Yalın ve son hâlinde çanak biçimlidir; başta ve ortada be gövdesini alır.',
    ex:{o:'نور', t:'nûr', m:'ışık'} },
  { id:'vav', ch:'و', name:'vav', tr:'v / o / ö / u / ü', nc:1, eb:6, fam:'vav', dots:0,
    sound:'v ünsüzü ya da o-ö-u-ü ünlüsü.', note:'Sonrasına BAĞLANMAZ. Türkçede yuvarlak ünlülerin tamamını karşılar.',
    ex:{o:'وطن', t:'vatan', m:'vatan'} },
  { id:'he', ch:'ه', name:'he', tr:'h / a / e', nc:0, eb:5, fam:'he', dots:0,
    sound:'h ünsüzü; kelime sonunda a/e ünlüsü.', note:'Sonda yazılan ه çoğunlukla e/a okunur: قلعه (kalʿa), جمعه (cumʿa).',
    ex:{o:'هوا', t:'havâ', m:'hava'} },
  { id:'ye', ch:'ی', name:'ye', tr:'y / ı / i / î', nc:0, eb:10, fam:'be', dots:2,
    sound:'y ünsüzü ya da ı-i ünlüsü.', note:'Sonda noktasız yazılır (ی). Nispet eki -î de bu harfle gösterilir.',
    ex:{o:'یول', t:'yol', m:'yol'} }
];

/* — Harf dışı işaretler ve kalıplar — */
var EXTRAS = [
  { id:'lamelif', ch:'لا', name:'lâmelif', tr:'lâ', nc:1, eb:31, fam:'lam', dots:0,
    sound:'Lâm + elif birleşiminden doğan kalıp.', note:'Ayrı bir harf değil, zorunlu bir bitişme kalıbıdır. Sonrasına bağlanmaz.',
    ex:{o:'لازم', t:'lâzım', m:'gerekli'} },
  { id:'hemze', ch:'ء', name:'hemze', tr:'ʾ', nc:1, eb:1, fam:'hemze', dots:0,
    sound:'Kısa bir gırtlak durağı.', note:'Tek başına ya da bir taşıyıcı üstünde yazılır: أ إ ؤ ئ. Osmanlıcada çoğu zaman okunmaz.',
    ex:{o:'مسأله', t:'mesʾele', m:'mesele'} }
];

/* — Harekeler ve yardımcı işaretler — */
var HAREKE = [
  { ch:'َ', on:'بَ', name:'üstün (fetha)', d:'Harfin üstündeki eğik çizgi; a / e sesi verir.' },
  { ch:'ِ', on:'بِ', name:'esre (kesre)',  d:'Harfin altındaki eğik çizgi; ı / i sesi verir.' },
  { ch:'ُ', on:'بُ', name:'ötre (damme)',  d:'Küçük vav biçimindedir; o / ö / u / ü sesi verir.' },
  { ch:'ْ', on:'بْ', name:'cezm (sükûn)',  d:'Harfin ünlüsüz olduğunu, hecenin kapandığını gösterir.' },
  { ch:'ّ', on:'بّ', name:'şedde',         d:'Harfin iki kez okunacağını bildirir: مدّت → müddet.' },
  { ch:'ٓ', on:'آ',  name:'medd',          d:'Elif üzerinde uzatma işareti; آ uzun â okunur.' },
  { ch:'ً', on:'بً', name:'tenvin (fethateyn)', d:'Arapça zarflarda -en sesi: مثلاً (meselen), عادتاً (âdeten).' }
];

/* — Osmanlı rakamları — */
var RAKAM = [
  { d:'0', o:'٠', n:'sıfır' }, { d:'1', o:'١', n:'bir' },  { d:'2', o:'٢', n:'iki' },
  { d:'3', o:'٣', n:'üç' },    { d:'4', o:'٤', n:'dört' }, { d:'5', o:'٥', n:'beş' },
  { d:'6', o:'٦', n:'altı' },  { d:'7', o:'٧', n:'yedi' }, { d:'8', o:'٨', n:'sekiz' },
  { d:'9', o:'٩', n:'dokuz' }
];

/* — Yardımcılar — */
var ZWJ = '‍', ZWNJ = '‌';

var Letters = {
  all: LETTERS,
  withExtras: LETTERS.concat(EXTRAS),
  byCh: function (ch) { for (var i=0;i<LETTERS.length;i++) if (LETTERS[i].ch===ch) return LETTERS[i];
                        for (var j=0;j<EXTRAS.length;j++) if (EXTRAS[j].ch===ch) return EXTRAS[j]; return null; },
  byId: function (id) { var a=this.withExtras; for (var i=0;i<a.length;i++) if (a[i].id===id) return a[i]; return null; },

  /* Harfin dört hâli — ZWJ ile tarayıcının şekillendiricisine yaptırılır */
  forms: function (ch) {
    var L = this.byCh(ch), nc = L ? L.nc : 0;
    return {
      yalin:  ch,
      bas:    nc ? ch : ch + ZWJ,
      orta:   nc ? ZWJ + ch : ZWJ + ch + ZWJ,
      son:    ZWJ + ch
    };
  },
  formNames: { yalin:'Yalın', bas:'Başta', orta:'Ortada', son:'Sonda' },

  /* Bağlanmayan harflerin başta ve ortada ayrı bir biçimi yoktur;
     onlar için yalnızca gerçekten var olan iki hâl gösterilir. */
  formList: function (ch) {
    var L = this.byCh(ch);
    return (L && L.nc) ? ['yalin', 'son'] : ['yalin', 'bas', 'orta', 'son'];
  },

  /* Kelimeyi harflerine ayırır (hareke ve birleştiricileri atar) */
  split: function (word) {
    var out = [], marks = /[ً-ٰٟ‌‍]/;
    for (var i=0;i<word.length;i++) { var c = word[i]; if (marks.test(c) || c===' ') continue; out.push(c); }
    return out;
  },

  /* Harfleri bitişmemiş göstermek için aralarına ZWNJ koyar */
  disjoin: function (word) { return this.split(word).join(ZWNJ); },

  /* Ebced toplamı (tarih düşürme hesabı) */
  ebced: function (word) {
    var sum = 0, det = [], chars = this.split(word);
    for (var i=0;i<chars.length;i++) {
      var c = chars[i], v = 0, nm = '';
      if (c === 'آ') { v = 1; nm = 'elif (medli)'; }
      else { var L = this.byCh(c); if (L) { v = L.eb; nm = L.name; if (!v) { v = this.fallbackEb(L); nm = L.name + ' *'; } } }
      if (nm) det.push({ ch:c, v:v, name:nm });
      sum += v;
    }
    return { total:sum, detail:det };
  },
  /* Fars harflerinin klasik ebcedde karşılığı yoktur; kök harfin değeri kullanılır */
  fallbackEb: function (L) { return ({ pe:2, cim2:3, je:7, gef:20, nef:20 })[L.id] || 0; },

  /* Latin sayıyı Osmanlı rakamlarıyla yazar */
  toRakam: function (n) {
    return String(n).replace(/[0-9]/g, function (d) { return RAKAM[+d].o; });
  },
  fromRakam: function (s) {
    return s.replace(/[٠-٩]/g, function (d) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)); });
  }
};

/* Ekranda gösterilecek klavye düzeni (elifbâ sırası) */
var KEYBOARD_ROWS = LETTERS.map(function (l) { return l.ch; }).concat(['لا','ء','آ']);
