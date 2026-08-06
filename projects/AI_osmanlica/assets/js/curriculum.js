/* ══ Müfredat: üniteler, dersler ve alıştırma üreteci ══ */

var UNITS = [
  { id:'u1', title:'Elifbâya Giriş', sub:'Elif · Be · Pe · Te · Se', lessons:[
    {id:'u1l1', t:'Elif ve Be',        kind:'letters', l:['ا','ب'],                 glyph:'ب'},
    {id:'u1l2', t:'Pe, Te, Se',        kind:'letters', l:['پ','ت','ث'],             glyph:'ت'},
    {id:'u1l3', t:'Noktanın Farkı',    kind:'drill',   l:['ا','ب','پ','ت','ث'],     glyph:'ث'},
    {id:'u1l4', t:'Ünite Tekrarı',     kind:'review',  l:['ا','ب','پ','ت','ث'],     ic:'i-review'}
  ]},
  { id:'u2', title:'Cim Ailesi', sub:'Cim · Çim · Ha · Hı', lessons:[
    {id:'u2l1', t:'Cim ve Çim',        kind:'letters', l:['ج','چ'],                 glyph:'ج'},
    {id:'u2l2', t:'Ha ve Hı',          kind:'letters', l:['ح','خ'],                 glyph:'خ'},
    {id:'u2l3', t:'Aile İçi Ayrım',    kind:'drill',   l:['ج','چ','ح','خ'],         glyph:'ح'},
    {id:'u2l4', t:'Ünite Tekrarı',     kind:'review',  l:['ج','چ','ح','خ','ب','ت'], ic:'i-review'}
  ]},
  { id:'u3', title:'Bağlanmayanlar', sub:'Dal · Zel · Rı · Ze · Je', lessons:[
    {id:'u3l1', t:'Dal ve Zel',        kind:'letters', l:['د','ذ'],                 glyph:'د'},
    {id:'u3l2', t:'Rı, Ze, Je',        kind:'letters', l:['ر','ز','ژ'],             glyph:'ر'},
    {id:'u3l3', t:'Bağlanma Kuralı',   kind:'grammar', rule:'r-unlu', l:['د','ذ','ر','ز','ژ','ا','و'], glyph:'ز'},
    {id:'u3l4', t:'Ünite Tekrarı',     kind:'review',  l:['د','ذ','ر','ز','ژ'],     ic:'i-review'}
  ]},
  { id:'u4', title:'Sin ve Sad', sub:'Sin · Şın · Sad · Dad', lessons:[
    {id:'u4l1', t:'Sin ve Şın',        kind:'letters', l:['س','ش'],                 glyph:'س'},
    {id:'u4l2', t:'Sad ve Dad',        kind:'letters', l:['ص','ض'],                 glyph:'ص'},
    {id:'u4l3', t:'İnce mi Kalın mı?', kind:'grammar', rule:'r-kalin', l:['س','ص'], glyph:'ش'},
    {id:'u4l4', t:'Ünite Tekrarı',     kind:'review',  l:['س','ش','ص','ض'],         ic:'i-review'}
  ]},
  { id:'u5', title:'Kalın Harfler', sub:'Tı · Zı · Ayın · Gayın', lessons:[
    {id:'u5l1', t:'Tı ve Zı',          kind:'letters', l:['ط','ظ'],                 glyph:'ط'},
    {id:'u5l2', t:'Ayın ve Gayın',     kind:'letters', l:['ع','غ'],                 glyph:'ع'},
    {id:'u5l3', t:'Kalın Ses Avı',     kind:'drill',   l:['ط','ظ','ع','غ','ص','ق'], glyph:'غ'},
    {id:'u5l4', t:'Ünite Tekrarı',     kind:'review',  l:['ط','ظ','ع','غ'],         ic:'i-review'}
  ]},
  { id:'u6', title:'Fe’den Kef’e', sub:'Fe · Kaf · Kef · Gef · Nef', lessons:[
    {id:'u6l1', t:'Fe ve Kaf',         kind:'letters', l:['ف','ق'],                 glyph:'ف'},
    {id:'u6l2', t:'Kef',               kind:'letters', l:['ك'],                     glyph:'ك'},
    {id:'u6l3', t:'Gef ve Sağır Kef',  kind:'letters', l:['گ','ڭ'],                 glyph:'ڭ'},
    {id:'u6l4', t:'Kef’in Dört Sesi',  kind:'grammar', rule:'r-nef', l:['ك','گ','ڭ','ق'], glyph:'گ'},
    {id:'u6l5', t:'Ünite Tekrarı',     kind:'review',  l:['ف','ق','ك','گ','ڭ'],     ic:'i-review'}
  ]},
  { id:'u7', title:'Son Harfler', sub:'Lâm · Mim · Nun · Vav · He · Ye', lessons:[
    {id:'u7l1', t:'Lâm ve Mim',        kind:'letters', l:['ل','م'],                 glyph:'ل'},
    {id:'u7l2', t:'Nun ve Vav',        kind:'letters', l:['ن','و'],                 glyph:'و'},
    {id:'u7l3', t:'He ve Ye',          kind:'letters', l:['ه','ی'],                 glyph:'ه'},
    {id:'u7l4', t:'Lâmelif ve Hemze',  kind:'extras',  l:['لا','ء'],                glyph:'لا'},
    {id:'u7l5', t:'Elifbâ Sınavı',     kind:'exam',    l:'all',                     ic:'i-trophy'}
  ]},
  { id:'u8', title:'Ünlüler ve Harekeler', sub:'Yazılmayan sesleri okumak', lessons:[
    {id:'u8l1', t:'Harekeler',         kind:'hareke',                               glyph:'َ'},
    {id:'u8l2', t:'Yuvarlak Ünlüler',  kind:'grammar', rule:'r-vav', l:['و'],       glyph:'و'},
    {id:'u8l3', t:'ı ve i Sesi',       kind:'grammar', rule:'r-ye', l:['ی'],        glyph:'ی'},
    {id:'u8l4', t:'Sondaki He',        kind:'grammar', rule:'r-he', l:['ه'],        glyph:'ه'}
  ]},
  { id:'u9', title:'İlk Kelimeler', sub:'Günlük hayattan sözler', lessons:[
    {id:'u9l1', t:'Selamlaşma',        kind:'phrases', ph:'selam',                  ic:'i-user'},
    {id:'u9l2', t:'Kişiler',           kind:'words',   th:'insan',                  ic:'i-user'},
    {id:'u9l3', t:'İlk Cümleler',      kind:'bank',    lv:1,                        ic:'i-doc'},
    {id:'u9l4', t:'Ünite Tekrarı',     kind:'review',  th:['insan'],                ic:'i-review'}
  ]},
  { id:'u10', title:'Ev ve Beden', sub:'Yakın çevrenin kelimeleri', lessons:[
    {id:'u10l1', t:'Ev ve Eşya',       kind:'words',   th:'ev',                     ic:'i-home'},
    {id:'u10l2', t:'Beden',            kind:'words',   th:'beden',                  ic:'i-user'},
    {id:'u10l3', t:'Yiyecekler',       kind:'words',   th:'yemek',                  ic:'i-gem'},
    {id:'u10l4', t:'Ünite Tekrarı',    kind:'review',  th:['ev','beden','yemek'],   ic:'i-review'}
  ]},
  { id:'u11', title:'Sayılar ve Rakamlar', sub:'٠ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩', lessons:[
    {id:'u11l1', t:'Osmanlı Rakamları', kind:'rakam',                               glyph:'٥'},
    {id:'u11l2', t:'Sayı Adları',       kind:'words',  th:'sayi',                   glyph:'٣'},
    {id:'u11l3', t:'Ebced Hesabı',      kind:'ebced',                               ic:'i-abacus'}
  ]},
  { id:'u12', title:'Tabiat ve Zaman', sub:'Gök, yer, mevsim, saat', lessons:[
    {id:'u12l1', t:'Tabiat',           kind:'words',   th:'doga',                   ic:'i-sparkle'},
    {id:'u12l2', t:'Hayvanlar',        kind:'words',   th:'hayvan',                 ic:'i-sparkle'},
    {id:'u12l3', t:'Zaman',            kind:'words',   th:'zaman',                  ic:'i-calendar'},
    {id:'u12l4', t:'Renkler',          kind:'words',   th:'renk',                   ic:'i-gem'},
    {id:'u12l5', t:'Ünite Tekrarı',    kind:'review',  th:['doga','hayvan','zaman','renk'], ic:'i-review'}
  ]},
  { id:'u13', title:'Fiiller ve Ekler', sub:'‑مق / ‑مك ve çekimler', lessons:[
    {id:'u13l1', t:'Mastar Ekleri',    kind:'grammar', rule:'r-mastar',             ic:'i-pen'},
    {id:'u13l2', t:'Sık Fiiller',      kind:'words',   th:'fiil',                   ic:'i-pen'},
    {id:'u13l3', t:'Sıfatlar',         kind:'words',   th:'sifat',                  ic:'i-star'},
    {id:'u13l4', t:'Cümle Kurma',      kind:'bank',    lv:3,                        ic:'i-doc'},
    {id:'u13l5', t:'Ünite Tekrarı',    kind:'review',  th:['fiil','sifat'],         ic:'i-review'}
  ]},
  { id:'u14', title:'Arapça Kelimeler', sub:'İlim, din ve devlet dili', lessons:[
    {id:'u14l1', t:'İlim ve Yazı',     kind:'words',   th:'ilim',                   ic:'i-book'},
    {id:'u14l2', t:'Din Kelimeleri',   kind:'words',   th:'din',                    ic:'i-book'},
    {id:'u14l3', t:'Harf‑i Tarif',     kind:'grammar', rule:'r-tarif',              ic:'i-book'},
    {id:'u14l4', t:'Arapça Çoğullar',  kind:'grammar', rule:'r-cogul',              ic:'i-grid'}
  ]},
  { id:'u15', title:'Farsça ve Terkip', sub:'İzâfet ve nispet', lessons:[
    {id:'u15l1', t:'Devlet Kelimeleri',kind:'words',   th:'devlet',                 ic:'i-crown'},
    {id:'u15l2', t:'Gönül Dünyası',    kind:'words',   th:'edeb',                   ic:'i-quill'},
    {id:'u15l3', t:'Farsça Terkip',    kind:'grammar', rule:'r-izafet',             ic:'i-crown'},
    {id:'u15l4', t:'Nispet ‑î',        kind:'grammar', rule:'r-nispet',             ic:'i-star'}
  ]},
  { id:'u16', title:'Okuma Meydanı', sub:'Gerçek metinlerle karşılaşma', lessons:[
    {id:'u16l1', t:'İlk Karşılaşma',   kind:'reading', p:'p-selam',                 ic:'i-book'},
    {id:'u16l2', t:'Bizim Ev',         kind:'reading', p:'p-ev',                    ic:'i-book'},
    {id:'u16l3', t:'Atasözleri',       kind:'reading', p:'p-atasozu',               ic:'i-book'},
    {id:'u16l4', t:'Nasreddin Hoca',   kind:'reading', p:'p-hoca',                  ic:'i-book'},
    {id:'u16l5', t:'Yunus Emre',       kind:'reading', p:'p-yunus',                 ic:'i-quill'}
  ]},
  { id:'u17', title:'Divan ve Belge', sub:'İleri seviye metinler', lessons:[
    {id:'u17l1', t:'Fuzûlî',           kind:'reading', p:'p-fuzuli',                ic:'i-quill'},
    {id:'u17l2', t:'İstiklâl Marşı',   kind:'reading', p:'p-marş',                  ic:'i-quill'},
    {id:'u17l3', t:'Nâmık Kemal',      kind:'reading', p:'p-namik',                 ic:'i-quill'},
    {id:'u17l4', t:'Mezar Taşı',       kind:'reading', p:'p-mezar',                 ic:'i-doc'},
    {id:'u17l5', t:'Bitirme Sınavı',   kind:'final',                                ic:'i-trophy'}
  ]}
];

/* ── yardımcılar ── */
function shuffle (a) { a = a.slice(); for (var i=a.length-1;i>0;i--) { var j = Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function sample (a, n) { return shuffle(a).slice(0, n); }
function pick (a) { return a[Math.floor(Math.random()*a.length)]; }
function uniq (a) { var s={}, o=[]; a.forEach(function(x){ if(!s[x]){s[x]=1;o.push(x);} }); return o; }

/* Yanlış şıklar üretir: doğru cevaptan farklı n adet */
function distract (pool, right, n, key) {
  var out = [], seen = {}; seen[key ? key(right) : right] = 1;
  var p = shuffle(pool);
  for (var i=0;i<p.length && out.length<n;i++) {
    var k = key ? key(p[i]) : p[i];
    if (!seen[k]) { seen[k]=1; out.push(p[i]); }
  }
  return out;
}

var Curriculum = {
  units: UNITS,

  allLessons: function () {
    var out = [];
    UNITS.forEach(function (u) { u.lessons.forEach(function (l) { out.push({ u:u, l:l }); }); });
    return out;
  },
  lessonById: function (id) {
    var a = this.allLessons();
    for (var i=0;i<a.length;i++) if (a[i].l.id === id) return a[i];
    return null;
  },
  index: function (id) {
    var a = this.allLessons();
    for (var i=0;i<a.length;i++) if (a[i].l.id === id) return i;
    return -1;
  },
  /* Ders açık mı? Önceki ders tamamlanmışsa açıktır. */
  isOpen: function (state, id) {
    if (state.settings.freeRoam) return true;
    var i = this.index(id);
    if (i <= 0) return true;
    var prev = this.allLessons()[i-1].l.id;
    return !!(state.progress[prev] && state.progress[prev].done);
  },
  nextLesson: function (state) {
    var a = this.allLessons();
    for (var i=0;i<a.length;i++) { var p = state.progress[a[i].l.id]; if (!p || !p.done) return a[i]; }
    return a[a.length-1];
  },
  unitProgress: function (state, u) {
    var d = 0; u.lessons.forEach(function (l) { if (state.progress[l.id] && state.progress[l.id].done) d++; });
    return { done:d, total:u.lessons.length, pct: Math.round(d / u.lessons.length * 100) };
  },
  unitsDone: function (state, ids) {
    var self = this, ok = true;
    ids.forEach(function (id) {
      var u = UNITS.filter(function (x) { return x.id === id; })[0];
      if (!u) { ok = false; return; }
      if (self.unitProgress(state, u).done < u.lessons.length) ok = false;
    });
    return ok;
  },
  totalLessons: function () { return this.allLessons().length; },
  doneLessons: function (state) {
    var n = 0; this.allLessons().forEach(function (x) { if (state.progress[x.l.id] && state.progress[x.l.id].done) n++; });
    return n;
  },

  /* ════ ALIŞTIRMA ÜRETECİ ════ */
  build: function (lesson, state) {
    var k = lesson.kind, ex = [];
    if (k === 'letters')      ex = this.genLetters(lesson.l, true);
    else if (k === 'drill')   ex = this.genLetters(lesson.l, false);
    else if (k === 'review')  ex = this.genReview(lesson, state);
    else if (k === 'extras')  ex = this.genExtras();
    else if (k === 'exam')    ex = this.genExam();
    else if (k === 'hareke')  ex = this.genHareke();
    else if (k === 'grammar') ex = this.genGrammar(lesson.rule, lesson.l);
    else if (k === 'words')   ex = this.genWords(Vocab.byTheme(lesson.th));
    else if (k === 'phrases') ex = this.genPhrases();
    else if (k === 'bank')    ex = this.genBank(lesson.lv);
    else if (k === 'rakam')   ex = this.genRakam();
    else if (k === 'ebced')   ex = this.genEbced();
    else if (k === 'reading') ex = this.genReading(lesson.p);
    else if (k === 'final')   ex = this.genFinal(state);
    return sanitize(ex.filter(Boolean));
  },

  /* — harf dersleri — */
  genLetters: function (chars, teach) {
    var ex = [], self = this;
    var Ls = chars.map(function (c) { return Letters.byCh(c); }).filter(Boolean);
    var pool = Letters.all;

    if (teach) Ls.forEach(function (L) {
      ex.push({ type:'intro', kind:'letter', L:L });
    });

    Ls.forEach(function (L) {
      ex.push({ type:'mc', prompt:'Bu harfin adı nedir?', stim:{ott:L.ch, size:'xl'},
        choices: shuffle([L].concat(distract(pool, L, 3, function(x){return x.name;}))).map(function(x){ return {v:x.name, ott:false, id:x.id}; }),
        ansId:L.id, srs:'l:'+L.ch, say:L.name });

      ex.push({ type:'mc', prompt:'«'+L.name+'» harfi hangisidir?', sub:L.sound,
        choices: shuffle([L].concat(distract(pool, L, 3, function(x){return x.ch;}))).map(function(x){ return {v:x.ch, ott:true, id:x.id}; }),
        ansId:L.id, srs:'l:'+L.ch, say:L.name });

      var fk = pick(L.nc ? ['son','yalin'] : ['bas','orta','son']);
      var f = Letters.forms(L.ch);
      var others = distract(pool.filter(function(x){return x.nc===L.nc;}), L, 3, function(x){return x.ch;});
      ex.push({ type:'mc', prompt:'«'+L.name+'» harfinin '+Letters.formNames[fk].toLocaleLowerCase('tr')+' hâli hangisidir?',
        sub:'Harflerin yerine göre biçimi değişir.',
        choices: shuffle([{v:f[fk], id:L.id}].concat(others.map(function(x){ return {v:Letters.forms(x.ch)[fk], id:x.id}; }))).map(function(x){ x.ott=true; return x; }),
        ansId:L.id, srs:'f:'+L.ch });

      ex.push({ type:'trace', ch:L.ch, name:L.name, srs:'w:'+L.ch });

      if (L.ex) ex.push({ type:'mc', prompt:'Bu kelime ne demektir?', stim:{ott:L.ex.o, size:'lg', sub:L.ex.t},
        choices: shuffle([{v:L.ex.m, id:'ok'}].concat(sample(VOCAB.filter(function(v){return v.m!==L.ex.m;}), 3).map(function(v){ return {v:v.m, id:v.o}; }))),
        ansId:'ok', say:L.ex.t, srs:'w:'+L.ex.o });
    });

    if (Ls.length >= 3) ex.push({ type:'match', prompt:'Harfleri adlarıyla eşleştirin.',
      pairs: sample(Ls, Math.min(5, Ls.length)).map(function (L) { return { a:L.ch, b:L.name, ott:true }; }) });

    ex.push({ type:'listen', prompt:'Duyduğunuz harf hangisi?',
      choices: (function () {
        var L = pick(Ls), o = distract(pool, L, 3, function(x){return x.ch;});
        return { list: shuffle([L].concat(o)).map(function(x){ return {v:x.ch, ott:true, id:x.id}; }), ansId:L.id, say:L.name, srs:'l:'+L.ch };
      })() });

    var ncQ = pick(Ls);
    ex.push({ type:'tf', prompt:'«'+ncQ.name+'» harfi kendinden sonraki harfe bağlanır.',
      ans: !ncQ.nc, explain: ncQ.nc ? ncQ.name+' bağlanmayan yedi harften biridir: ا د ذ ر ز ژ و' : ncQ.name+' iki taraftan da bağlanır.' });

    var words = Vocab.spellableWith(uniq(chars.concat(['ا','آ','و','ی','ه','ل','م','ن','ب','ت','ر','د','س','ك'])));
    if (words.length) {
      var w = pick(words.filter(function (v) { return Letters.split(v.o).length <= 5; }) .length
        ? words.filter(function (v) { return Letters.split(v.o).length <= 5; }) : words);
      ex.push({ type:'build', word:w, srs:'w:'+w.o });
    }
    return shuffleKeepIntro(ex).slice(0, teach ? 14 : 12);
  },

  /* — lâmelif, hemze — */
  genExtras: function () {
    var ex = [];
    EXTRAS.forEach(function (L) { ex.push({ type:'intro', kind:'letter', L:L }); });
    ex.push({ type:'mc', prompt:'“لا” kalıbı hangi iki harften oluşur?',
      choices:[{v:'lâm + elif', id:'a'},{v:'lâm + he', id:'b'},{v:'nun + elif', id:'c'},{v:'kef + elif', id:'d'}], ansId:'a',
      explain:'Lâm ile elif yan yana geldiğinde zorunlu olarak لا biçimini alır.' });
    ex.push({ type:'tf', prompt:'Lâmelif kendinden sonraki harfe bağlanır.', ans:false,
      explain:'İçinde elif bulunduğu için lâmelif de bağlanmaz.' });
    ex.push({ type:'mc', prompt:'Hemze hangi işarettir?',
      choices: shuffle([{v:'ء', id:'a'},{v:'ع', id:'b'},{v:'ه', id:'c'},{v:'ح', id:'d'}]).map(function(x){x.ott=true;return x;}), ansId:'a' });
    ['لازم','لاله','مسأله'].forEach(function (o) {
      var v = { o:o, t:({'لازم':'lâzım','لاله':'lâle','مسأله':'mesʾele'})[o], m:({'لازم':'gerekli','لاله':'lale','مسأله':'mesele'})[o] };
      ex.push({ type:'mc', prompt:'Bu kelime ne demektir?', stim:{ott:v.o, size:'lg', sub:v.t},
        choices: shuffle([{v:v.m, id:'ok'}].concat(sample(VOCAB, 3).map(function(x){ return {v:x.m, id:x.o}; }))), ansId:'ok', say:v.t });
    });
    ex.push({ type:'trace', ch:'لا', name:'lâmelif', srs:'w:لا' });
    return ex;
  },

  /* — harekeler — */
  genHareke: function () {
    var ex = [{ type:'intro', kind:'hareke' }];
    HAREKE.slice(0,5).forEach(function (h) {
      ex.push({ type:'mc', prompt:'Bu işaretin adı nedir?', stim:{ott:h.on, size:'xl'},
        choices: shuffle([{v:h.name, id:h.name}].concat(distract(HAREKE, h, 3, function(x){return x.name;}).map(function(x){ return {v:x.name, id:x.name}; }))),
        ansId:h.name, explain:h.d });
    });
    ex.push({ type:'mc', prompt:'Hangi hareke “ı / i” sesi verir?',
      choices:[{v:'esre',id:'a'},{v:'üstün',id:'b'},{v:'ötre',id:'c'},{v:'cezm',id:'d'}], ansId:'a',
      explain:'Esre harfin altına konur ve ı/i sesi verir.' });
    ex.push({ type:'mc', prompt:'“بُ” nasıl okunur?',
      choices:[{v:'bu / bü',id:'a'},{v:'ba / be',id:'b'},{v:'bı / bi',id:'c'},{v:'b (ünlüsüz)',id:'d'}], ansId:'a',
      explain:'Üstteki küçük vav ötredir; o/ö/u/ü sesi verir.' });
    ex.push({ type:'tf', prompt:'Osmanlıca metinlerde harekeler her zaman yazılır.', ans:false,
      explain:'Harekeler yalnızca Kur’an, sözlük ve ders kitaplarında kullanılır. Normal metinler harekesizdir.' });
    return ex;
  },

  /* — kural dersleri — */
  genGrammar: function (ruleId, letters) {
    var R = RULES.filter(function (r) { return r.id === ruleId; })[0];
    var ex = [{ type:'intro', kind:'rule', R:R }];

    if (ruleId === 'r-kalin') {
      [['صو','سو','su','Kalın ünlü sebebiyle sad yazılır.'],
       ['طاش','تاش','taş','Kalın t için tı kullanılır.'],
       ['قار','كار','kar','Kalın k için kaf kullanılır.'],
       ['سن','صن','sen','İnce ünlü sebebiyle sin yazılır.'],
       ['كل','قل','gel','İnce k/g için kef kullanılır.']].forEach(function (p) {
        ex.push({ type:'mc', prompt:'“'+p[2]+'” kelimesi hangisiyle yazılır?',
          choices: shuffle([{v:p[0], id:'ok', ott:true},{v:p[1], id:'no', ott:true}]), ansId:'ok', explain:p[3] });
      });
      ex.push({ type:'tf', prompt:'Kalın ünlülü Türkçe kelimelerde “س” yerine “ص” yazılır.', ans:true,
        explain:'صاچ (saç), صو (su), صاری (sarı) — hepsinde sad vardır.' });
    }
    else if (ruleId === 'r-mastar') {
      [['یازمق','yazmak',1],['كلمك','gelmek',0],['اوقومق','okumak',1],['بیلمك','bilmek',0],['باقمق','bakmak',1],['كورمك','görmek',0]].forEach(function (p) {
        ex.push({ type:'mc', prompt:'“'+p[1]+'” fiilinin mastar eki hangisidir?',
          choices: shuffle([{v:'‑مق', id:'k', ott:true},{v:'‑مك', id:'i', ott:true}]),
          ansId: p[2] ? 'k' : 'i', explain: p[2] ? 'Kalın ünlülü fiil → ‑مق: '+p[0] : 'İnce ünlülü fiil → ‑مك: '+p[0] });
      });
      ex.push({ type:'type', prompt:'Bu fiili okuyup Latin harfleriyle yazın.', stim:{ott:'یازمق', size:'lg'}, ans:['yazmak'], srs:'w:یازمق' });
    }
    else if (ruleId === 'r-vav') {
      [['اون','on','un'],['كوز','göz','güz'],['قول','kol','kul'],['بولوت','bulut','bulut']].forEach(function (p) {
        ex.push({ type:'mc', prompt:'“'+p[0]+'” hangi seslerle okunabilir?',
          choices: shuffle([{v:p[1]+' / '+p[2], id:'ok'},{v:p[1]+' / '+p[1]+'a', id:'x1'},{v:'yalnız '+p[1], id:'x2'},{v:p[1]+'i / '+p[1]+'e', id:'x3'}]),
          ansId:'ok', explain:'Vav dört yuvarlak ünlüyü birden karşılar; doğru okuyuş kelime bilgisiyle belirlenir.' });
      });
      ex.push({ type:'tf', prompt:'Vav harfi hem ünsüz hem ünlü olarak kullanılır.', ans:true, explain:'وطن (vatan) → ünsüz; اون (on) → ünlü.' });
    }
    else if (ruleId === 'r-he') {
      [['قلعه','kalʿa'],['پرده','perde'],['مدرسه','medrese'],['كیجه','gice']].forEach(function (p) {
        ex.push({ type:'mc', prompt:'“'+p[0]+'” kelimesinin sonu nasıl okunur?',
          choices: shuffle([{v:'‑e / ‑a sesiyle', id:'ok'},{v:'‑h sesiyle', id:'x1'},{v:'‑i sesiyle', id:'x2'},{v:'okunmaz', id:'x3'}]),
          ansId:'ok', explain:p[0]+' → '+p[1] });
      });
    }
    else if (ruleId === 'r-nef') {
      [['دڭز','deñiz','deniz'],['بیڭ','biñ','bin'],['كوڭل','göñül','gönül']].forEach(function (p) {
        ex.push({ type:'mc', prompt:'“'+p[0]+'” kelimesi bugün nasıl okunur?',
          choices: shuffle([{v:p[2], id:'ok'}].concat(sample(VOCAB, 3).map(function(v){ return {v:v.m, id:v.o}; }))), ansId:'ok', say:p[1], srs:'w:'+p[0] });
      });
      ex.push({ type:'mc', prompt:'Sağır kef (ڭ) hangi sesi gösterir?',
        choices: shuffle([{v:'Genizden gelen n sesi', id:'ok'},{v:'Kalın k sesi', id:'a'},{v:'Yumuşak g sesi', id:'b'},{v:'Uzun a sesi', id:'c'}]), ansId:'ok' });
      ex.push({ type:'tf', prompt:'Sağır kef bugünkü Türkçede “n” olarak okunur.', ans:true, explain:'Nazal ñ sesi Türkiye Türkçesinde kaybolmuş, yerini n almıştır.' });
    }
    else if (ruleId === 'r-tarif') {
      ex.push({ type:'mc', prompt:'“السلام” nasıl okunur?',
        choices: shuffle([{v:'es‑selâm', id:'ok'},{v:'el‑selâm', id:'a'},{v:'al‑salâm', id:'b'},{v:'el‑islâm', id:'c'}]), ansId:'ok',
        explain:'س şemsî harftir; lâm okunmaz, sonraki harf şeddelenir.' });
      ex.push({ type:'mc', prompt:'“القمر” nasıl okunur?',
        choices: shuffle([{v:'el‑kamer', id:'ok'},{v:'ek‑kamer', id:'a'},{v:'al‑kamar', id:'b'},{v:'el‑amer', id:'c'}]), ansId:'ok',
        explain:'ق kamerî harftir; lâm açıkça okunur.' });
      ex.push({ type:'tf', prompt:'“ال” Arapça kelimelerin başında belirlilik bildirir.', ans:true });
      ex.push({ type:'mc', prompt:'Aşağıdakilerden hangisi şemsî harftir?',
        choices: shuffle([{v:'س', id:'ok', ott:true},{v:'ق', id:'a', ott:true},{v:'م', id:'b', ott:true},{v:'ع', id:'c', ott:true}]), ansId:'ok' });
    }
    else if (ruleId === 'r-cogul') {
      [['كتب','kütüb','kitâb'],['علوم','ʿulûm','ʿilm'],['اخبار','ahbâr','haber']].forEach(function (p) {
        ex.push({ type:'mc', prompt:'“'+p[0]+'” ('+p[1]+') hangi kelimenin çoğuludur?',
          choices: shuffle([{v:p[2], id:'ok'},{v:'kalem', id:'a'},{v:'medrese', id:'b'},{v:'devlet', id:'c'}]), ansId:'ok' });
      });
      ex.push({ type:'tf', prompt:'Arapça kelimeler Osmanlıcada ‑ler/‑lar ekiyle çoğul yapılamaz.', ans:false,
        explain:'Yapılabilir (kitaplar, âlimler) ama klasik metinlerde çoğu zaman Arapça kalıp çoğul tercih edilir.' });
    }
    else if (ruleId === 'r-izafet') {
      [['كتابخانه','kitâb‑hâne','kitap evi → kütüphane'],['حسن خط','hüsn‑i hat','yazı güzelliği'],['اهل دل','ehl‑i dil','gönül ehli']].forEach(function (p) {
        ex.push({ type:'mc', prompt:'“'+p[1]+'” ne anlama gelir?',
          choices: shuffle([{v:p[2], id:'ok'},{v:'yazı yazmak', id:'a'},{v:'kitap okumak', id:'b'},{v:'gönül almak', id:'c'}]), ansId:'ok' });
      });
      ex.push({ type:'mc', prompt:'Farsça terkipte hangi kelime başta gelir?',
        choices: shuffle([{v:'Tamlanan (asıl kelime)', id:'ok'},{v:'Tamlayan', id:'a'},{v:'Sıfat', id:'b'},{v:'Fiil', id:'c'}]), ansId:'ok',
        explain:'Türkçenin tam tersi: “kitap evi” yerine “hâne‑i kitâb” dizilişi kullanılır.' });
    }
    else if (ruleId === 'r-nispet') {
      [['ملی','millî',['milli','mîlli','mellî']],
       ['ادبی','edebî',['edebi','edîbi','edbî']],
       ['علمی','ʿilmî',['ʿilmi','ʿilîmî','ʿâlemî']]].forEach(function (p) {
        ex.push({ type:'mc', prompt:'“'+p[0]+'” nasıl okunur?', sub:'Şapkanın (uzatmanın) yerine dikkat edin.',
          choices: shuffle([{v:p[1], id:'ok'}].concat(p[2].map(function (w, i) { return {v:w, id:'x'+i}; }))), ansId:'ok',
          explain:'Nispet eki daima uzun î okunur: '+p[1] });
      });
      ex.push({ type:'tf', prompt:'Nispet eki “‑î” kısa okunur.', ans:false, explain:'Daima uzun okunur: millî, edebî, ilmî.' });
    }
    else if (ruleId === 'r-unlu' || ruleId === 'r-ye') {
      var nc = ['ا','د','ذ','ر','ز','ژ','و'];
      ex.push({ type:'mc', prompt:'Aşağıdaki harflerden hangisi kendinden sonrakine BAĞLANMAZ?',
        choices: shuffle([{v:pick(nc), id:'ok', ott:true}].concat(sample(['ب','ت','س','م','ن','ك','ف','ع'], 3).map(function(c){ return {v:c, id:c, ott:true}; }))), ansId:'ok',
        explain:'Bağlanmayan yedi harf: ا د ذ ر ز ژ و' });
      ex.push({ type:'mc', prompt:'Bağlanmayan harflerin sayısı kaçtır?',
        choices: shuffle([{v:'7', id:'ok'},{v:'5', id:'a'},{v:'9', id:'b'},{v:'11', id:'c'}]), ansId:'ok' });
      ['بر','كل','سن','یول'].forEach(function (o) {
        var v = Vocab.find(o); if (!v) return;
        ex.push({ type:'type', prompt:'Okuyup Latin harfleriyle yazın.', stim:{ott:v.o, size:'lg'}, ans:[v.t, v.m], srs:'w:'+v.o });
      });
      ex.push({ type:'tf', prompt:'Osmanlıcada kısa ünlüler çoğu zaman yazılmaz.', ans:true,
        explain:'“بن” yazılır, “ben” okunur. Ünlüyü okuyucu tamamlar.' });
    }

    if (letters && letters.length) {
      var L = Letters.byCh(pick(letters));
      if (L) ex.push({ type:'trace', ch:L.ch, name:L.name, srs:'w:'+L.ch });
    }
    return ex;
  },

  /* — kelime dersleri — */
  genWords: function (list) {
    if (!list || !list.length) return [];
    var words = sample(list, Math.min(8, list.length)), ex = [];
    words.slice(0, 4).forEach(function (w) { ex.push({ type:'intro', kind:'word', w:w }); });

    words.forEach(function (w, i) {
      var mode = i % 5;
      if (mode === 0) ex.push({ type:'mc', prompt:'Bu kelime ne demektir?', stim:{ott:w.o, size:'lg', sub:w.t},
        choices: shuffle([{v:w.m, id:'ok'}].concat(distract(VOCAB, w, 3, function(x){return x.m;}).map(function(x){ return {v:x.m, id:x.o}; }))),
        ansId:'ok', say:w.t, srs:'w:'+w.o });
      else if (mode === 1) ex.push({ type:'mc', prompt:'“'+w.m+'” nasıl yazılır?',
        choices: shuffle([{v:w.o, id:'ok', ott:true}].concat(distract(VOCAB, w, 3, function(x){return x.o;}).map(function(x){ return {v:x.o, id:x.o, ott:true}; }))),
        ansId:'ok', say:w.t, srs:'w:'+w.o });
      else if (mode === 2) ex.push({ type:'listen', prompt:'Duyduğunuz kelime hangisi?',
        choices:{ list: shuffle([{v:w.o, id:'ok', ott:true}].concat(distract(VOCAB, w, 3, function(x){return x.o;}).map(function(x){ return {v:x.o, id:x.o, ott:true}; }))),
                  ansId:'ok', say:w.t, srs:'w:'+w.o } });
      else if (mode === 3) ex.push({ type:'type', prompt:'Okuyup Latin harfleriyle yazın.', stim:{ott:w.o, size:'lg'},
        ans:[w.t, w.m], srs:'w:'+w.o, explain:w.h });
      else ex.push({ type:'build', word:w, srs:'w:'+w.o });
    });

    ex.push({ type:'match', prompt:'Kelimeleri anlamlarıyla eşleştirin.',
      pairs: sample(words, Math.min(5, words.length)).map(function (w) { return { a:w.o, b:w.m, ott:true }; }) });

    var sp = pick(words);
    ex.push({ type:'speak', word:sp, srs:'s:'+sp.o });
    var kw = pick(words.filter(function (w) { return Letters.split(w.o).length <= 6; }) .length
      ? words.filter(function (w) { return Letters.split(w.o).length <= 6; }) : words);
    ex.push({ type:'keyboard', word:kw, srs:'k:'+kw.o });
    return shuffleKeepIntro(ex).slice(0, 15);
  },

  /* — kalıp ifadeler — */
  genPhrases: function () {
    var ex = [], ph = PHRASES.slice(0, 10);
    ph.slice(0,4).forEach(function (p) { ex.push({ type:'intro', kind:'word', w:p }); });
    ph.forEach(function (p, i) {
      if (i % 2 === 0) ex.push({ type:'mc', prompt:'Bu ifade ne demektir?', stim:{ott:p.o, size:'lg', sub:p.t},
        choices: shuffle([{v:p.m, id:'ok'}].concat(distract(PHRASES, p, 3, function(x){return x.m;}).map(function(x){ return {v:x.m, id:x.o}; }))),
        ansId:'ok', say:p.t, srs:'w:'+p.o });
      else ex.push({ type:'listen', prompt:'Duyduğunuz ifade hangisi?',
        choices:{ list: shuffle([{v:p.o, id:'ok', ott:true}].concat(distract(PHRASES, p, 3, function(x){return x.o;}).map(function(x){ return {v:x.o, id:x.o, ott:true}; }))),
                  ansId:'ok', say:p.t, srs:'w:'+p.o } });
    });
    ex.push({ type:'speak', word:pick(ph), srs:'s:selam' });
    ex.push({ type:'match', prompt:'İfadeleri karşılıklarıyla eşleştirin.',
      pairs: sample(ph, 4).map(function (p) { return { a:p.o, b:p.m, ott:true }; }) });
    return shuffleKeepIntro(ex).slice(0, 13);
  },

  /* — cümle kurma — */
  genBank: function (maxLv) {
    var list = SENTENCES.filter(function (s) { return s.lv <= (maxLv || 3); });
    if (!list.length) list = SENTENCES;
    var sel = sample(list, Math.min(7, list.length));
    var ex = sel.map(function (s) { return { type:'bank', s:s, srs:'b:'+s.t }; });
    ex.push({ type:'mc', prompt:'“'+sel[0].t+'” cümlesinin bugünkü karşılığı nedir?',
      choices: shuffle([{v:sel[0].m, id:'ok'}].concat(sample(SENTENCES.filter(function(x){return x.m!==sel[0].m;}), 3).map(function(x){ return {v:x.m, id:x.t}; }))), ansId:'ok' });
    return ex;
  },

  /* — rakamlar — */
  genRakam: function () {
    var ex = [{ type:'intro', kind:'rakam' }];
    sample(RAKAM, 6).forEach(function (r) {
      ex.push({ type:'mc', prompt:'Bu rakam kaçtır?', stim:{ott:r.o, size:'xl'},
        choices: shuffle([{v:r.d, id:'ok'}].concat(distract(RAKAM, r, 3, function(x){return x.d;}).map(function(x){ return {v:x.d, id:x.d}; }))),
        ansId:'ok', say:r.n });
    });
    [[1453,'İstanbul’un fethi'],[1299,'Osmanlı Devleti’nin kuruluşu'],[1876,'I. Meşrutiyet'],[1839,'Tanzimat Fermanı']].forEach(function (p) {
      ex.push({ type:'mc', prompt:p[0]+' sayısı Osmanlı rakamlarıyla nasıl yazılır?',
        choices: shuffle([{v:Letters.toRakam(p[0]), id:'ok', ott:true}]
          .concat([p[0]+111, p[0]-101, p[0]+230].map(function (n) { return {v:Letters.toRakam(n), id:''+n, ott:true}; }))),
        ansId:'ok', explain:p[1] });
    });
    ex.push({ type:'match', prompt:'Rakamları eşleştirin.',
      pairs: sample(RAKAM, 5).map(function (r) { return { a:r.o, b:r.d, ott:true }; }) });
    ex.push({ type:'tf', prompt:'Osmanlı rakamları da soldan sağa yazılır.', ans:true,
      explain:'Yazı sağdan sola akar ama sayılar soldan sağa dizilir: ١٢٩٥ = 1295.' });
    return ex;
  },

  /* — ebced — */
  genEbced: function () {
    var ex = [{ type:'intro', kind:'ebced' }];
    [['ا',1],['ب',2],['ج',3],['د',4],['ه',5],['و',6],['ز',7],['ح',8],['ط',9],['ی',10]].forEach(function (p, i) {
      if (i > 5) return;
      ex.push({ type:'mc', prompt:'“'+p[0]+'” harfinin ebced değeri kaçtır?', stim:{ott:p[0], size:'xl'},
        choices: shuffle([{v:''+p[1], id:'ok'},{v:''+(p[1]+2), id:'a'},{v:''+(p[1]*10), id:'b'},{v:''+(p[1]+5), id:'c'}]), ansId:'ok' });
    });
    ['آب','بد','جد','دم'].forEach(function (w) {
      var e = Letters.ebced(w), wr = [], seen = {};
      seen[e.total] = 1;
      [e.total+7, e.total+13, e.total*2, e.total+40, Math.max(1, e.total-3), e.total+101].forEach(function (n) {
        if (!seen[n] && wr.length < 3) { seen[n] = 1; wr.push(n); }
      });
      ex.push({ type:'mc', prompt:'“'+w+'” kelimesinin ebced toplamı kaçtır?', stim:{ott:w, size:'lg'},
        choices: shuffle([{v:''+e.total, id:'ok'}].concat(wr.map(function (n, i) { return {v:''+n, id:'x'+i}; }))), ansId:'ok',
        explain:e.detail.map(function (d) { return d.ch+'='+d.v; }).join(' + ')+' = '+e.total });
    });
    ex.push({ type:'mc', prompt:'“Tarih düşürmek” ne demektir?',
      choices: shuffle([{v:'Mısraın harf değerleriyle bir yılı gizlemek', id:'ok'},
        {v:'Takvimi geri almak', id:'a'},{v:'Belgeye tarih atmak', id:'b'},{v:'Eski tarihi silmek', id:'c'}]), ansId:'ok' });
    return ex;
  },

  /* — okuma — */
  genReading: function (pid) {
    var P = PASSAGES.filter(function (p) { return p.id === pid; })[0];
    if (!P) return [];
    var ex = [{ type:'read', P:P }];
    (P.q || []).forEach(function (q) {
      ex.push({ type:'mc', prompt:q.q,
        choices: (function () {
          var arr = q.a.map(function (a, i) { return { v:a, id:'c'+i }; });
          return shuffle(arr);
        })(), ansId:'c'+q.c });
    });
    var line = pick(P.lines);
    if (line.tok.length >= 3 && line.tok.length <= 8) {
      ex.push({ type:'bank', s:{ tok: line.tok.map(function (t) { return t[0]; }),
        t: line.tok.map(function (t) { return t[1]; }).join(' '), m: line.tr }, srs:'b:'+P.id });
    }
    var tk = pick(P.lines[0].tok);
    ex.push({ type:'mc', prompt:'“'+tk[0]+'” kelimesinin anlamı nedir?', stim:{ott:tk[0], size:'lg', sub:tk[1]},
      choices: shuffle([{v:tk[2], id:'ok'}].concat(sample(VOCAB, 3).map(function (v) { return {v:v.m, id:v.o}; }))), ansId:'ok', say:tk[1] });
    ex.push({ type:'speak', word:{ o:P.lines[0].tok.map(function(t){return t[0];}).join(' '),
      t:P.lines[0].tok.map(function(t){return t[1];}).join(' '), m:P.lines[0].tr }, srs:'s:'+P.id });
    return ex;
  },

  /* — ünite tekrarı — */
  genReview: function (lesson, state) {
    var ex = [];
    if (lesson.l) ex = ex.concat(this.genLetters(lesson.l, false));
    if (lesson.th) {
      var list = [];
      lesson.th.forEach(function (t) { list = list.concat(Vocab.byTheme(t)); });
      ex = ex.concat(this.genWords(list));
    }
    var due = SRS.due(state, 6);
    due.forEach(function (k) { var e = Curriculum.fromKey(k); if (e) ex.push(e); });
    return shuffle(ex.filter(function (e) { return e.type !== 'intro'; })).slice(0, 14);
  },

  /* — elifbâ sınavı — */
  genExam: function () {
    var ex = [], pool = Letters.all;
    sample(pool, 8).forEach(function (L) {
      ex.push({ type:'mc', prompt:'Bu harfin adı nedir?', stim:{ott:L.ch, size:'xl'},
        choices: shuffle([{v:L.name, id:L.id}].concat(distract(pool, L, 3, function(x){return x.name;}).map(function(x){ return {v:x.name, id:x.id}; }))),
        ansId:L.id, srs:'l:'+L.ch });
    });
    sample(pool, 3).forEach(function (L) {
      var f = Letters.forms(L.ch), fk = pick(L.nc ? ['son'] : ['bas','orta','son']);
      ex.push({ type:'mc', prompt:'«'+L.name+'» harfinin '+Letters.formNames[fk].toLocaleLowerCase('tr')+' hâli hangisidir?',
        choices: shuffle([{v:f[fk], id:L.id, ott:true}].concat(distract(pool.filter(function(x){return x.nc===L.nc;}), L, 3, function(x){return x.ch;})
          .map(function(x){ return {v:Letters.forms(x.ch)[fk], id:x.id, ott:true}; }))), ansId:L.id });
    });
    ex.push({ type:'match', prompt:'Harfleri adlarıyla eşleştirin.',
      pairs: sample(pool, 5).map(function (L) { return { a:L.ch, b:L.name, ott:true }; }) });
    ex.push({ type:'tf', prompt:'Osmanlı elifbâsında 33 harf vardır.', ans:true,
      explain:'Arap alfabesinin 28 harfine Farsçadan پ چ ژ گ ve Türkçeden ڭ eklenmiştir.' });
    return ex;
  },

  /* — bitirme sınavı — */
  genFinal: function (state) {
    var ex = [];
    ex = ex.concat(this.genExam().slice(0, 5));
    ex = ex.concat(this.genWords(sample(VOCAB, 10)).filter(function (e) { return e.type !== 'intro'; }).slice(0, 6));
    ex = ex.concat(this.genBank(5).slice(0, 3));
    var P = pick(PASSAGES);
    (P.q || []).forEach(function (q) {
      ex.push({ type:'mc', prompt:q.q, choices: shuffle(q.a.map(function (a, i) { return { v:a, id:'c'+i }; })), ansId:'c'+q.c });
    });
    return shuffle(ex).slice(0, 18);
  },

  /* SRS anahtarından alıştırma üretir */
  fromKey: function (key) {
    var kind = key.slice(0, 1), val = key.slice(2);
    if (kind === 'l' || kind === 'f') {
      var L = Letters.byCh(val); if (!L) return null;
      return { type:'mc', prompt:'Bu harfin adı nedir?', stim:{ott:L.ch, size:'xl'},
        choices: shuffle([{v:L.name, id:L.id}].concat(distract(Letters.all, L, 3, function(x){return x.name;}).map(function(x){ return {v:x.name, id:x.id}; }))),
        ansId:L.id, srs:key };
    }
    var w = Vocab.find(val) || PHRASES.filter(function (p) { return p.o === val; })[0];
    if (!w) return null;
    if (kind === 'k') return { type:'keyboard', word:w, srs:key };
    if (kind === 's') return { type:'speak', word:w, srs:key };
    var r = Math.random();
    if (r < .34) return { type:'mc', prompt:'Bu kelime ne demektir?', stim:{ott:w.o, size:'lg'},
      choices: shuffle([{v:w.m, id:'ok'}].concat(distract(VOCAB, w, 3, function(x){return x.m;}).map(function(x){ return {v:x.m, id:x.o}; }))),
      ansId:'ok', say:w.t, srs:key };
    if (r < .67) return { type:'listen', prompt:'Duyduğunuz kelime hangisi?',
      choices:{ list: shuffle([{v:w.o, id:'ok', ott:true}].concat(distract(VOCAB, w, 3, function(x){return x.o;}).map(function(x){ return {v:x.o, id:x.o, ott:true}; }))),
                ansId:'ok', say:w.t, srs:key } };
    return { type:'type', prompt:'Okuyup Latin harfleriyle yazın.', stim:{ott:w.o, size:'lg'}, ans:[w.t, w.m], srs:key };
  },

  /* Serbest tekrar oturumu */
  reviewSession: function (state, n) {
    var keys = SRS.due(state, n || 12), ex = [];
    keys.forEach(function (k) { var e = Curriculum.fromKey(k); if (e) ex.push(e); });
    if (ex.length < 6) {
      var extra = sample(Vocab.byLevel(3), 8 - ex.length);
      extra.forEach(function (w) { var e = Curriculum.fromKey('w:' + w.o); if (e) ex.push(e); });
    }
    return sanitize(shuffle(ex));
  },

  /* Yanlışlar oturumu */
  mistakeSession: function (state) {
    var ex = [];
    (state.mistakes || []).slice(0, 15).forEach(function (k) { var e = Curriculum.fromKey(k); if (e) ex.push(e); });
    return sanitize(shuffle(ex));
  },

  sanitize: function (list) { return sanitize(list); }
};

/* intro kartlarını başta tutarak geri kalanı karıştırır */
function shuffleKeepIntro (ex) {
  var intro = ex.filter(function (e) { return e.type === 'intro'; });
  var rest  = shuffle(ex.filter(function (e) { return e.type !== 'intro'; }));
  return intro.concat(rest);
}

/* Son denetim: aynı metni taşıyan şıklar elenir, doğru cevap daima korunur.
   Üreteçlerden biri farkında olmadan yinelenen şık üretirse burada yakalanır. */
function sanitize (list) {
  list.forEach(function (x) {
    var isL = x.type === 'listen', isM = x.type === 'mc';
    if (!isL && !isM) return;
    /* dinleme sorularında srs anahtarı choices içinde kalmış olabilir — yukarı taşı */
    if (isL && x.choices && x.choices.srs && !x.srs) x.srs = x.choices.srs;
    var C = isL ? (x.choices && x.choices.list) : x.choices;
    var ansId = isL ? (x.choices && x.choices.ansId) : x.ansId;
    if (!C || !C.length) return;
    var seen = {}, out = [];
    C.forEach(function (c) { if (c.id === ansId && !seen[c.v]) { seen[c.v] = 1; out.push(c); } });
    C.forEach(function (c) { if (c.id !== ansId && !seen[c.v] && c.v != null && c.v !== '') { seen[c.v] = 1; out.push(c); } });
    out = shuffle(out);
    if (isL) x.choices.list = out; else x.choices = out;
  });
  return list;
}
