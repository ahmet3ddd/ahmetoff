/* ══ Ekranlar ve ders motoru ══ */

function pad2 (n) { return n < 10 ? '0' + n : '' + n; }

var Screens = {

  /* ═══════════ ÖĞREN — elifbâ yolu ═══════════ */
  home: function () {
    var s = Store.state, box = el('div', { class:'wrap' });
    var nx = Curriculum.nextLesson(s);
    var done = Curriculum.doneLessons(s), total = Curriculum.totalLessons();

    /* — takdim — */
    var hero = el('div', { class:'hero' });
    hero.appendChild(el('div', { class:'hero-ott', text:'الفبا' }));
    hero.appendChild(el('h1', { text: done === 0 ? 'Osmanlıcaya hoş geldiniz' : 'Kaldığınız yerden' }));
    hero.appendChild(el('p', { class:'muted', style:'max-width:46ch',
      text: done === 0 ? 'Otuz üç harfle başlayıp gerçek belgeleri okumaya kadar gideceğiz. İlk ders beş dakika sürer.'
                       : 'Sıradaki ders: ' + nx.u.title + ' · ' + nx.l.t }));
    var go = el('button', { class:'btn gold', style:'margin-top:18px', type:'button',
      onclick: function () { Lesson.start(nx.l.id); } });
    go.innerHTML = (done === 0 ? ic('play') : ic('right')) + '<span>' + (done === 0 ? 'Başla' : 'Devam et') + '</span>';
    hero.appendChild(go);
    var hs = el('div', { class:'hero-stats' });
    [[done + '/' + total, 'Ders'], ['%' + Store.goalPct(), 'Günlük hedef'], [SRS.knownCount(s), 'Bilinen kelime'], [s.streak, 'Günlük seri']]
      .forEach(function (p) {
        var c = el('div', { class:'hero-stat' });
        c.appendChild(el('b', { text:String(p[0]) })); c.appendChild(el('span', { text:p[1] }));
        hs.appendChild(c);
      });
    hero.appendChild(hs);
    box.appendChild(hero);

    /* — yol — */
    var offs = [0, 1, 2, 1, 0, -1, -2, -1], gi = 0;
    Curriculum.units.forEach(function (u, ui) {
      var up = Curriculum.unitProgress(s, u);
      var uh = el('div', { class:'unit-head' });
      var ut = el('div', { style:'flex:1;min-width:0' });
      ut.appendChild(el('div', { class:'uh-no', text:'Ünite ' + (ui+1) }));
      ut.appendChild(el('h2', { text:u.title }));
      ut.appendChild(el('p', { text:u.sub }));
      uh.appendChild(ut);
      var ring = el('div', { class:'score-ring uh-ring', style:'--p:' + up.pct + ';width:52px;height:52px' });
      ring.appendChild(el('b', { text: up.done + '/' + up.total, style:'font-size:11px' }));
      uh.appendChild(ring);
      box.appendChild(uh);

      var path = el('div', { class:'path' });
      u.lessons.forEach(function (l) {
        var p = s.progress[l.id], open = Curriculum.isOpen(s, l.id);
        var isNext = (nx.l.id === l.id);
        var cls = 'node ' + (p && p.done ? (p.stars >= 3 ? 'done gold' : 'done') : open ? 'open' : 'locked') + (isNext ? ' current' : '');
        var row = el('div', { class:'node-row', 'data-off': offs[gi % offs.length] });
        gi++;
        var node = el('div', { class:cls });
        if (isNext && open) node.appendChild(el('div', { class:'node-tip', text: p && p.done ? 'Tekrar et' : 'Başla' }));
        var btn = el('button', { class:'nodebtn', type:'button', 'aria-label': u.title + ' — ' + l.t + (open ? '' : ' (kilitli)') });
        btn.disabled = !open;
        var star = el('div', { class:'node-star' });
        if (!open) star.innerHTML = ic('lock');
        else if (l.glyph) star.appendChild(el('span', { class:'n-ott ott', text:l.glyph }));
        else star.innerHTML = ic((l.ic || 'i-star').slice(2));
        btn.appendChild(star);
        btn.appendChild(el('div', { class:'node-label', text:l.t }));
        var st = el('div', { class:'stars' });
        for (var i = 0; i < 3; i++) {
          var sv = document.createElement('span');
          sv.innerHTML = ic('star', (p && p.stars > i) ? 'on' : '');
          st.appendChild(sv.firstChild);
        }
        btn.appendChild(st);
        btn.addEventListener('click', function () {
          if (!open) return;
          Lesson.start(l.id);
        });
        node.appendChild(btn);
        row.appendChild(node);
        path.appendChild(row);
      });
      box.appendChild(path);
    });

    box.appendChild(el('div', { class:'hr-rosette' }, [el('span', { text:'۞' })]));
    box.appendChild(el('p', { class:'muted', style:'text-align:center;font-size:12.5px',
      text:'Bütün üniteler tamamlandığında bitirme sınavı açılır.' }));
    return box;
  },

  /* ═══════════ TEKRAR ═══════════ */
  practice: function () {
    var s = Store.state, box = el('div', { class:'wrap' });
    box.appendChild(el('p', { class:'eyebrow', text:'Pekiştirme' }));
    box.appendChild(el('h1', { style:'margin:10px 0 18px', text:'Tekrar ve atölyeler' }));

    var due = SRS.dueCount(s), mis = (s.mistakes || []).length;

    function card (opts) {
      var c = el('div', { class:'card', style:'display:flex;align-items:center;gap:16px' });
      var i = el('div', { style:'width:48px;height:48px;border-radius:14px;display:grid;place-items:center;flex:none;background:' + opts.bg + ';color:' + opts.fg });
      i.innerHTML = ic(opts.ic); i.querySelector('svg').style.width = '24px'; i.querySelector('svg').style.height = '24px';
      c.appendChild(i);
      var m = el('div', { style:'flex:1;min-width:0' });
      m.appendChild(el('h3', { text:opts.t }));
      m.appendChild(el('p', { class:'muted', style:'margin:2px 0 0;font-size:13px', text:opts.d }));
      c.appendChild(m);
      if (opts.n != null) c.appendChild(el('span', { class:'badge' + (opts.n ? '' : ' gold'), text:String(opts.n) }));
      var b = el('button', { class:'btn ' + (opts.primary ? 'primary' : 'ghost') + ' sm', type:'button', onclick:opts.go });
      b.innerHTML = '<span>' + (opts.cta || 'Başla') + '</span>';
      if (opts.dis) { b.disabled = true; }
      c.appendChild(b);
      return c;
    }

    box.appendChild(card({ ic:'review', bg:'rgba(47,191,168,.14)', fg:'var(--firuze-2)', primary:true,
      t:'Aralıklı tekrar', d: due ? due + ' madde tekrar vaktinde' : 'Şu an vadesi gelen madde yok', n:due, dis: due === 0 && SRS.seenCount(s) === 0,
      go: function () { Lesson.custom(Curriculum.reviewSession(s, 14), { title:'Aralıklı tekrar', xp:15 }); } }));

    box.appendChild(card({ ic:'x', bg:'rgba(208,80,58,.14)', fg:'var(--bole-2)',
      t:'Yanlışlarım', d: mis ? 'Hata yaptığınız ' + mis + ' madde' : 'Henüz biriken hata yok', n:mis, dis: mis === 0,
      go: function () { Lesson.custom(Curriculum.mistakeSession(s), { title:'Yanlışlarım', xp:12 }); } }));

    box.appendChild(card({ ic:'ear', bg:'rgba(61,111,209,.16)', fg:'#86AAF0',
      t:'Dinleme atölyesi', d:'Yalnız kulakla tanıma alıştırması',
      go: function () {
        var ws = sample(Vocab.byLevel(4), 12);
        Lesson.custom(Curriculum.sanitize(ws.map(function (w) {
          return { type:'listen', prompt:'Duyduğunuz kelime hangisi?', srs:'w:'+w.o, choices:{
            list: shuffle([{v:w.o, id:'ok', ott:true}].concat(distract(VOCAB, w, 3, function(x){return x.o;}).map(function(x){ return {v:x.o, id:x.o, ott:true}; }))),
            ansId:'ok', say:w.t } };
        })), { title:'Dinleme atölyesi', xp:12 });
      } }));

    box.appendChild(card({ ic:'mic', bg:'rgba(217,164,65,.14)', fg:'var(--gold-2)',
      t:'Telaffuz atölyesi', d: Speech.canListen ? 'Mikrofonla söyleyiş değerlendirmesi' : 'Mikrofonsuz: dinle, tekrar et, kendin onayla',
      go: function () {
        var ws = sample(Vocab.byLevel(3), 8);
        Lesson.custom(ws.map(function (w) { return { type:'speak', word:w, srs:'s:'+w.o }; }), { title:'Telaffuz atölyesi', xp:12 });
      } }));

    box.appendChild(card({ ic:'pen', bg:'rgba(110,158,118,.16)', fg:'var(--sage)',
      t:'Yazı tahtası', d:'Serbest hat çalışması — harf seçip yazın', cta:'Aç',
      go: function () { App.go('write'); } }));

    box.appendChild(card({ ic:'trophy', bg:'rgba(217,164,65,.14)', fg:'var(--gold-2)',
      t:'Karışık sınav', d:'Bütün konulardan 18 soruluk deneme',
      go: function () { Lesson.custom(Curriculum.genFinal(s), { title:'Karışık sınav', xp:25 }); } }));

    var st = SRS.strength(s);
    var c2 = el('div', { class:'card', style:'margin-top:22px' });
    c2.appendChild(el('div', { class:'card-h' }, [icEl('chart'), el('h3', { text:'Hâfıza gücü' })]));
    [['Yeni', st.yeni, 'var(--ink-3)'], ['Taze', st.taze, 'var(--bole)'], ['Sağlam', st.saglam, 'var(--gold)'], ['Güçlü', st.guclu, 'var(--firuze)']]
      .forEach(function (p) {
        var tot = Math.max(1, st.yeni + st.taze + st.saglam + st.guclu);
        var r = el('div', { style:'display:flex;align-items:center;gap:12px;margin-bottom:9px' });
        r.appendChild(el('span', { style:'width:60px;font-size:12.5px;color:var(--ink-3)', text:p[0] }));
        var bar = el('div', { class:'bar', style:'flex:1' });
        bar.appendChild(el('i', { style:'width:' + Math.round(p[1]/tot*100) + '%;background:' + p[2] }));
        r.appendChild(bar);
        r.appendChild(el('span', { style:'width:34px;text-align:right;font-family:var(--f-mono);font-size:13px', text:String(p[1]) }));
        c2.appendChild(r);
      });
    var nin = SRS.nextIn(s);
    if (nin != null) c2.appendChild(el('p', { class:'muted', style:'margin:6px 0 0;font-size:12.5px',
      text: nin === 0 ? 'Bugün tekrar edilecek maddeler var.' : 'Sıradaki tekrar ' + nin + ' gün sonra.' }));
    box.appendChild(c2);
    return box;
  },

  /* ═══════════ ELİFBÂ ═══════════ */
  alphabet: function () {
    var box = el('div', { class:'wrap wide' });
    box.appendChild(el('p', { class:'eyebrow', text:'Elifbâ' }));
    box.appendChild(el('h1', { style:'margin:10px 0 6px', text:'Otuz üç harf' }));
    box.appendChild(el('p', { class:'muted', text:'Arap alfabesinin 28 harfine Farsçadan پ چ ژ گ, Türkçeden ڭ eklenmiştir. Harfe dokunun.' }));
    box.appendChild(el('p', { class:'muted', style:'font-size:12px;display:flex;gap:16px;flex-wrap:wrap;margin-top:8px' }, [
      el('span', { html:'<i style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--bole);vertical-align:middle;margin-inline-end:5px"></i>Kendinden sonrakine bağlanmaz' }),
      el('span', { html:'<b style="font-family:var(--f-mono);color:var(--ink-3)">12</b> &nbsp;ebced değeri' })
    ]));

    var filt = el('div', { class:'btn-row', style:'margin:16px 0' });
    var mode = 'all';
    var grid = el('div', { class:'abc-grid' });
    function draw () {
      grid.innerHTML = '';
      var list = Letters.withExtras;
      if (mode === 'nc') list = list.filter(function (L) { return L.nc; });
      if (mode === 'fa') list = list.filter(function (L) { return ['pe','cim2','je','gef','nef'].indexOf(L.id) > -1; });
      list.forEach(function (L, i) {
        var c = el('button', { class:'abc-cell', type:'button', 'data-nc': L.nc ? '1' : '0', 'aria-label': L.name });
        if (L.eb) c.appendChild(el('span', { class:'ebced', text:L.eb }));
        c.appendChild(el('span', { class:'g', text:L.ch }));
        c.appendChild(el('span', { class:'n', text:L.name }));
        c.appendChild(el('span', { class:'t', text:L.tr }));
        c.addEventListener('click', function () { Screens.letterModal(L); });
        grid.appendChild(c);
      });
    }
    [['all','Hepsi'],['nc','Bağlanmayanlar'],['fa','Fars harfleri']].forEach(function (p) {
      var b = el('button', { class:'btn ghost sm' + (p[0]==='all'?' on':''), type:'button', text:p[1] });
      b.addEventListener('click', function () {
        mode = p[0]; draw();
        Array.prototype.forEach.call(filt.children, function (x) { x.classList.remove('on'); });
        b.classList.add('on');
      });
      filt.appendChild(b);
    });
    box.appendChild(filt);
    box.appendChild(grid);
    draw();

    box.appendChild(el('div', { class:'hr-rosette' }, [el('span', { text:'۞' })]));
    box.appendChild(el('h2', { style:'margin-bottom:12px', text:'Harekeler' }));
    var hg = el('div', { class:'abc-grid' });
    HAREKE.forEach(function (h) {
      var c = el('div', { class:'abc-cell', title:h.d });
      c.appendChild(el('span', { class:'g', text:h.on }));
      c.appendChild(el('span', { class:'n', text:h.name }));
      hg.appendChild(c);
    });
    box.appendChild(hg);

    box.appendChild(el('h2', { style:'margin:26px 0 12px', text:'Rakamlar' }));
    var rg = el('div', { class:'abc-grid' });
    RAKAM.forEach(function (r) {
      var c = el('div', { class:'abc-cell' });
      c.appendChild(el('span', { class:'g', text:r.o }));
      c.appendChild(el('span', { class:'n', text:r.d }));
      c.appendChild(el('span', { class:'t', text:r.n }));
      rg.appendChild(c);
    });
    box.appendChild(rg);
    return box;
  },

  letterModal: function (L) {
    var f = Letters.forms(L.ch);
    var m = el('div');
    m.appendChild(el('div', { style:'text-align:center' }, [
      el('div', { class:'ott', text:L.ch, style:'font-size:calc(72px * var(--ott-scale));color:var(--gold);line-height:1.1' }),
      el('h2', { text:L.name, style:'margin-top:4px' }),
      el('p', { class:'translit', text:L.tr })
    ]));
    var row = el('div', { class:'btn-row', style:'justify-content:center;margin:12px 0 18px' });
    var b1 = el('button', { class:'btn ghost sm', type:'button', onclick:function(){ say(L.name); } });
    b1.innerHTML = ic('sound') + '<span>Adını dinle</span>';
    row.appendChild(b1);
    if (L.ex) {
      var b2 = el('button', { class:'btn ghost sm', type:'button', onclick:function(){ say(L.ex.t); } });
      b2.innerHTML = ic('play') + '<span>Örneği dinle</span>';
      row.appendChild(b2);
    }
    m.appendChild(row);

    var keys = Letters.formList(L.ch);
    m.appendChild(el('p', { class:'eyebrow', text: keys.length === 2 ? 'İki hâli' : 'Dört hâli', style:'margin-bottom:10px' }));
    var fr = el('div', { class:'forms-row' });
    keys.forEach(function (k) {
      var b = el('div', { class:'form-box' });
      b.appendChild(el('div', { class:'fg ott', text:f[k] }));
      b.appendChild(el('div', { class:'fl', text:Letters.formNames[k] }));
      fr.appendChild(b);
    });
    m.appendChild(fr);
    m.appendChild(el('p', { style:'margin-top:14px', text:L.sound }));
    m.appendChild(el('div', { class:'note', text:L.note }));
    var dl = el('dl', { class:'kv', style:'margin-top:14px' });
    [['Ebced değeri', L.eb ? String(L.eb) : 'yok (Fars harfi)'],
     ['Bağlanma', L.nc ? 'Sonrasına bağlanmaz' : 'İki taraftan bağlanır'],
     ['Nokta', L.dots ? L.dots + ' nokta' : 'noktasız']].forEach(function (p) {
      dl.appendChild(el('dt', { text:p[0] })); dl.appendChild(el('dd', { text:p[1] }));
    });
    m.appendChild(dl);
    if (L.ex) {
      m.appendChild(el('p', { class:'eyebrow', text:'Örnek kelime', style:'margin:16px 0 8px' }));
      var ex = el('div', { style:'display:flex;align-items:center;gap:14px' });
      ex.appendChild(el('div', { class:'ott', text:L.ex.o, style:'font-size:calc(34px * var(--ott-scale))' }));
      var mm = el('div');
      mm.appendChild(el('div', { class:'translit', text:L.ex.t }));
      mm.appendChild(el('div', { class:'muted', text:L.ex.m }));
      ex.appendChild(mm);
      m.appendChild(ex);
    }
    var wb = el('button', { class:'btn primary wide', style:'margin-top:18px', type:'button',
      onclick: function () { App.closeModal(); App.go('write', { ch:L.ch }); } });
    wb.innerHTML = ic('pen') + '<span>Bu harfi yaz</span>';
    m.appendChild(wb);
    App.modal(m, { title:null });
  },

  /* ═══════════ YAZI TAHTASI ═══════════ */
  write: function (params) {
    var box = el('div', { class:'wrap' });
    box.appendChild(el('p', { class:'eyebrow', text:'Atölye' }));
    box.appendChild(el('h1', { style:'margin:10px 0 6px', text:'Yazı tahtası' }));
    box.appendChild(el('p', { class:'muted', text:'Bir harf ya da kelime seçin, soluk hattın üzerinden geçin. Puan, çizginizin harfi ne kadar örttüğünü ölçer.' }));

    var cur = (params && params.ch) || 'ب';
    var sel = el('div', { style:'display:flex;flex-wrap:wrap;gap:6px;direction:rtl;margin:16px 0' });
    var host = el('div', { style:'margin-top:8px' });
    var meta = el('div', { class:'pad-meta' });
    var ring = el('div', { class:'score-ring' }); ring.appendChild(el('b', { text:'—' }));
    var hint = el('div', { class:'pad-hint', style:'flex:1', text:'Bir harf seçip yazmaya başlayın.' });
    var bH = el('button', { class:'iconbtn', type:'button', 'aria-label':'Nasıl yazılır' }); bH.innerHTML = ic('eye');
    var bU = el('button', { class:'iconbtn', type:'button', 'aria-label':'Geri al' });      bU.innerHTML = ic('undo');
    var bC = el('button', { class:'iconbtn', type:'button', 'aria-label':'Temizle' });      bC.innerHTML = ic('trash');
    meta.appendChild(ring); meta.appendChild(hint); meta.appendChild(bH); meta.appendChild(bU); meta.appendChild(bC);

    var pad = null;
    function mount (ch) {
      cur = ch;
      if (pad) pad.destroy();
      pad = Writing.create(host, { ch:ch, onScore: function (sc, d) {
        ring.style.setProperty('--p', sc);
        ring.querySelector('b').textContent = d.empty ? '—' : sc;
        hint.textContent = d.empty ? 'Yazmaya başlayın.' :
          'Kapsama %' + d.coverage + ' · isabet %' + d.precision + (sc >= 80 ? ' — hattı yakaladınız.' : '');
        var st = Store.state;
        if (sc > st.stats.bestWrite) { st.stats.bestWrite = sc; Store.save(); App.checkAch(); }
      } });
      Array.prototype.forEach.call(sel.children, function (b) { b.classList.toggle('on', b.textContent === ch); });
    }
    Letters.withExtras.forEach(function (L) {
      var b = el('button', { class:'kbd-key', style:'width:44px;aspect-ratio:1', type:'button', text:L.ch, title:L.name });
      b.addEventListener('click', function () { mount(L.ch); });
      sel.appendChild(b);
    });
    box.appendChild(sel);
    box.appendChild(host);
    box.appendChild(meta);

    var wr = el('div', { class:'btn-row', style:'margin-top:16px' });
    var wsel = el('select', { class:'txt-input', 'aria-label':'Yazılacak kelimeyi seçin',
      style:'flex:1;min-height:44px;font-size:15px;font-family:var(--f-ui)' });
    wsel.appendChild(el('option', { value:'', text:'…veya bir kelime seçin' }));
    Vocab.byLevel(3).slice(0, 60).forEach(function (w) {
      wsel.appendChild(el('option', { value:w.o, text:w.m + ' — ' + w.t }));
    });
    wsel.addEventListener('change', function () { if (wsel.value) mount(wsel.value); });
    wr.appendChild(wsel);
    box.appendChild(wr);

    box.appendChild(el('div', { class:'note', style:'margin-top:16px',
      html:'<b>Nasıl yazılır?</b> Osmanlıcada yazı sağdan sola akar. Göz simgesine basarsanız harf, kalemin gittiği yönde açılarak gösterilir.' }));

    requestAnimationFrame(function () {
      mount(cur);
      bU.addEventListener('click', function () { pad.undo(); });
      bC.addEventListener('click', function () { pad.clear(); });
      bH.addEventListener('click', function () { pad.hint(); });
    });
    box._cleanup = function () { if (pad) pad.destroy(); };
    return box;
  },

  /* ═══════════ SÖZLÜK ═══════════ */
  dict: function () {
    var box = el('div', { class:'wrap wide' });
    box.appendChild(el('p', { class:'eyebrow', text:'Sözlük' }));
    box.appendChild(el('h1', { style:'margin:10px 0 14px', text:VOCAB.length + ' kelime' }));

    var bar = el('div', { class:'dict-search' });
    var inp = el('input', { class:'txt-input', type:'search', placeholder:'Osmanlıca, okunuş veya Türkçe ara…', 'aria-label':'Sözlükte ara' });
    bar.appendChild(inp);
    box.appendChild(bar);

    var chips = el('div', { style:'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px' });
    var theme = '', origin = '';
    function chip (label, on, cb) {
      var c = el('button', { class:'chip' + (on ? ' gold' : ''), type:'button', text:label });
      c.addEventListener('click', cb); return c;
    }
    var list = el('div');

    function draw () {
      var r = Vocab.search(inp.value);
      if (theme) r = r.filter(function (v) { return v.th === theme; });
      if (origin) r = r.filter(function (v) { return v.g === origin; });
      list.innerHTML = '';
      if (!r.length) {
        var e = el('div', { class:'empty' }); e.innerHTML = ic('search');
        e.appendChild(el('p', { text:'Eşleşen kelime yok. Başka bir yazım deneyin.' }));
        list.appendChild(e); return;
      }
      list.appendChild(el('p', { class:'muted', style:'font-size:12.5px;margin-bottom:10px', text:r.length + ' sonuç' }));
      r.slice(0, 300).forEach(function (v) {
        var it = el('div', { class:'dict-item', tabindex:'0', role:'button',
          'aria-label': v.t + ' — ' + v.m + '. Ayrıntı için seçin.' });
        it.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); Screens.wordModal(v); }
        });
        it.appendChild(el('div', { class:'dw', text:v.o }));
        var m = el('div', { class:'dm' });
        m.appendChild(el('b', { text:v.t }));
        m.appendChild(el('span', { text:v.m }));
        it.appendChild(m);
        it.appendChild(el('span', { class:'dth', text: THEMES[v.th] || '' }));
        it.appendChild(el('span', { class:'org ' + v.g, title:ORIGINS[v.g] || v.g,
          text: ({ tr:'TR', ar:'AR', fa:'FA', yu:'YU' })[v.g] || v.g }));
        var b = el('button', { class:'iconbtn', type:'button', 'aria-label':'Seslendir', onclick:function(e){ e.stopPropagation(); say(v.t); } });
        b.innerHTML = ic('sound');
        it.appendChild(b);
        it.addEventListener('click', function () { Screens.wordModal(v); });
        it.style.cursor = 'pointer';
        list.appendChild(it);
      });
    }
    var themes = Object.keys(THEMES);
    chips.appendChild(chip('Tümü', true, function () { theme=''; origin=''; redrawChips(); draw(); }));
    themes.forEach(function (t) { chips.appendChild(chip(THEMES[t], false, function () { theme = (theme===t?'':t); redrawChips(); draw(); })); });
    ['ar','fa','tr'].forEach(function (g) { chips.appendChild(chip(ORIGINS[g], false, function () { origin = (origin===g?'':g); redrawChips(); draw(); })); });
    function redrawChips () {
      Array.prototype.forEach.call(chips.children, function (c, i) {
        var on = i === 0 ? (!theme && !origin)
               : i <= themes.length ? theme === themes[i-1]
               : origin === ['ar','fa','tr'][i - themes.length - 1];
        c.className = 'chip' + (on ? ' gold' : '');
      });
    }
    box.appendChild(chips);
    box.appendChild(list);
    inp.addEventListener('input', draw);
    draw();
    return box;
  },

  wordModal: function (v) {
    var m = el('div');
    m.appendChild(el('div', { style:'text-align:center' }, [
      el('div', { class:'ott', text:v.o, style:'font-size:calc(56px * var(--ott-scale));color:var(--gold);line-height:1.4' }),
      el('div', { class:'translit', style:'font-size:20px', text:v.t }),
      el('div', { style:'font-size:16px;margin-top:2px', text:v.m })
    ]));
    var row = el('div', { class:'btn-row', style:'justify-content:center;margin:14px 0' });
    var b = el('button', { class:'btn ghost sm', type:'button', onclick:function(){ say(v.t); } });
    b.innerHTML = ic('sound') + '<span>Dinle</span>';
    var b2 = el('button', { class:'btn ghost sm', type:'button', onclick:function(){ App.closeModal(); App.go('write', { ch:v.o }); } });
    b2.innerHTML = ic('pen') + '<span>Yaz</span>';
    row.appendChild(b); row.appendChild(b2);
    m.appendChild(row);

    m.appendChild(el('p', { class:'eyebrow', text:'Harfleri', style:'margin-bottom:10px' }));
    var chars = Letters.split(v.o);
    var row2 = el('div', { style:'display:flex;flex-wrap:wrap;gap:6px;direction:rtl' });
    chars.forEach(function (c) {
      var L = Letters.byCh(c);
      var t = el('div', { class:'tile', style:'text-align:center;min-width:52px;padding:6px 8px' });
      t.appendChild(el('div', { class:'ott', text:c, style:'font-size:calc(24px * var(--ott-scale))' }));
      t.appendChild(el('div', { style:'font-size:9.5px;color:var(--ink-3);direction:ltr', text:L ? L.name : '' }));
      row2.appendChild(t);
    });
    m.appendChild(row2);

    var eb = Letters.ebced(v.o);
    var dl = el('dl', { class:'kv', style:'margin-top:16px' });
    [['Köken', ORIGINS[v.g] || v.g], ['Konu', THEMES[v.th] || '—'], ['Seviye', String(v.lv)],
     ['Ebced', String(eb.total)], ['Harf sayısı', String(chars.length)]].forEach(function (p) {
      dl.appendChild(el('dt', { text:p[0] })); dl.appendChild(el('dd', { text:p[1] }));
    });
    m.appendChild(dl);
    if (v.h) m.appendChild(el('div', { class:'note', style:'margin-top:12px', html:'<b>İmlâ notu:</b> ' + v.h }));

    var st = Store.state.srs['w:' + v.o];
    if (st) m.appendChild(el('p', { class:'muted', style:'margin-top:12px;font-size:12.5px',
      text:'Tekrar aralığı: ' + st.i + ' gün · doğru seri: ' + st.r }));
    App.modal(m);
  },

  /* ═══════════ OKUMA ═══════════ */
  library: function () {
    var s = Store.state, box = el('div', { class:'wrap' });
    box.appendChild(el('p', { class:'eyebrow', text:'Kütüphane' }));
    box.appendChild(el('h1', { style:'margin:10px 0 6px', text:'Okuma parçaları' }));
    box.appendChild(el('p', { class:'muted', text:'Kelimelere dokunarak anlam ve okunuşlarını görebilirsiniz. Parçalar kolaydan zora sıralıdır.' }));
    var g = el('div', { style:'margin-top:18px' });
    PASSAGES.forEach(function (P) {
      var c = el('button', { class:'card', type:'button', style:'display:flex;gap:16px;align-items:center;cursor:pointer;width:100%;text-align:start',
        'aria-label': P.title + ' — ' + P.kind + ', seviye ' + P.lv });
      var lv = el('div', { style:'width:52px;height:52px;border-radius:14px;display:grid;place-items:center;flex:none;background:var(--panel-2);border:1px solid var(--gold-dim);font-family:var(--f-mono);color:var(--gold-2);font-size:17px', text:'L' + P.lv });
      c.appendChild(lv);
      var m = el('div', { style:'flex:1;min-width:0' });
      m.appendChild(el('div', { style:'display:flex;align-items:center;gap:8px;flex-wrap:wrap' }, [
        el('h3', { text:P.title }), el('span', { class:'chip', text:P.kind }),
        s.readDone[P.id] ? el('span', { class:'chip fir', text:'okundu' }) : null
      ]));
      m.appendChild(el('p', { class:'muted', style:'margin:4px 0 0;font-size:13px', text:P.intro }));
      m.appendChild(el('div', { class:'ott', style:'font-size:calc(24px * var(--ott-scale));margin-top:8px;color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis',
        text: P.lines[0].tok.map(function (t) { return t[0]; }).join(' ') }));
      c.appendChild(m);
      c.appendChild(icEl('right'));
      c.addEventListener('click', function () { Lesson.custom(Curriculum.genReading(P.id), { title:P.title, xp:15 }); });
      g.appendChild(c);
    });
    box.appendChild(g);
    return box;
  },

  /* ═══════════ ARAÇLAR ═══════════ */
  tools: function () {
    var box = el('div', { class:'wrap' });
    box.appendChild(el('p', { class:'eyebrow', text:'Araçlar' }));
    box.appendChild(el('h1', { style:'margin:10px 0 18px', text:'Kurallar ve hesaplayıcılar' }));

    /* — ebced — */
    var c1 = el('div', { class:'card' });
    c1.appendChild(el('div', { class:'card-h' }, [icEl('abacus'), el('h2', { text:'Ebced hesabı' })]));
    c1.appendChild(el('p', { class:'muted', style:'font-size:13.5px', text:'Osmanlıca bir ibare yazın; harflerin sayı değerleri toplanır. Tarih düşürme bu hesaba dayanır.' }));
    var out = el('div', { class:'otf-input', 'data-ph':'Aşağıdaki klavyeden harfleri seçin', style:'margin-top:12px' });
    var res = el('div', { style:'text-align:center;margin:12px 0' });
    var total = el('div', { style:'font-family:var(--f-mono);font-size:38px;color:var(--gold-2);line-height:1.1', text:'0' });
    var det = el('div', { class:'muted', style:'font-size:12.5px;margin-top:6px' });
    var rk = el('div', { class:'ott', style:'font-size:calc(26px * var(--ott-scale));color:var(--gold)' });
    res.appendChild(total); res.appendChild(rk); res.appendChild(det);
    var val = '';
    function calc () {
      out.textContent = val;
      var e = Letters.ebced(val);
      total.textContent = e.total;
      rk.textContent = e.total ? Letters.toRakam(e.total) : '';
      det.textContent = e.detail.length ? e.detail.map(function (d) { return d.ch + '=' + d.v; }).join('  +  ') : '';
      if (e.detail.some(function (d) { return /\*$/.test(d.name); }))
        det.textContent += '   (* Fars harfleri kök harfin değerini alır)';
    }
    var kb = el('div', { class:'kbd-grid', style:'margin-top:10px' });
    LETTERS.forEach(function (L) {
      kb.appendChild(el('button', { class:'kbd-key', type:'button', text:L.ch, title:L.name + ' = ' + (L.eb||'—'),
        onclick: function () { val += L.ch; calc(); Sound.tap(); } }));
    });
    kb.appendChild(el('button', { class:'kbd-key', type:'button', text:'آ', onclick:function(){ val += 'آ'; calc(); } }));
    var util = el('div', { class:'btn-row', style:'margin-top:10px' });
    var u1 = el('button', { class:'btn ghost sm', type:'button', onclick:function(){ val = val.slice(0,-1); calc(); } });
    u1.innerHTML = ic('undo') + '<span>Sil</span>';
    var u2 = el('button', { class:'btn ghost sm', type:'button', onclick:function(){ val=''; calc(); } });
    u2.innerHTML = ic('trash') + '<span>Temizle</span>';
    var u3 = el('button', { class:'btn ghost sm', type:'button', onclick:function(){
      val = 'عشق'; calc();
      var st = Store.state; st.stats.ebced = (st.stats.ebced||0) + 1; Store.save(); App.checkAch();
    } });
    u3.innerHTML = ic('sparkle') + '<span>Örnek: عشق</span>';
    util.appendChild(u1); util.appendChild(u2); util.appendChild(u3);
    c1.appendChild(out); c1.appendChild(res); c1.appendChild(kb); c1.appendChild(util);
    box.appendChild(c1);

    /* — rakam çevirici — */
    var c2 = el('div', { class:'card' });
    c2.appendChild(el('div', { class:'card-h' }, [icEl('target'), el('h2', { text:'Rakam çevirici' })]));
    var ri = el('input', { class:'txt-input', type:'text', inputmode:'numeric', placeholder:'1453', 'aria-label':'Sayı' });
    var ro = el('div', { class:'ott', style:'text-align:center;font-size:calc(46px * var(--ott-scale));color:var(--gold);min-height:1.6em;margin-top:10px' });
    var rh = el('p', { class:'muted', style:'text-align:center;font-size:12.5px' });
    ri.addEventListener('input', function () {
      var v = ri.value.replace(/[^0-9٠-٩]/g, '');
      if (/[٠-٩]/.test(v)) { ro.textContent = Letters.fromRakam(v); rh.textContent = 'Osmanlı → Latin'; }
      else { ro.textContent = Letters.toRakam(v); rh.textContent = 'Latin → Osmanlı'; }
    });
    c2.appendChild(ri); c2.appendChild(ro); c2.appendChild(rh);
    c2.appendChild(el('div', { class:'note', style:'margin-top:10px',
      html:'Hicrî yılı milâdîye çevirmek için: <b>M = H + 622 − (H ÷ 33)</b>. Örnek: 1295 H ≈ 1878 M.' }));
    box.appendChild(c2);

    /* — kurallar — */
    box.appendChild(el('div', { class:'hr-rosette' }, [el('span', { text:'۞' })]));
    box.appendChild(el('h2', { style:'margin-bottom:14px', text:'İmlâ ve dil bilgisi kuralları' }));
    RULES.forEach(function (R) {
      var c = el('div', { class:'card' });
      var head = el('button', { class:'card-h', type:'button', style:'width:100%;text-align:start;margin:0' });
      head.appendChild(icEl(R.ic.slice(2)));
      head.appendChild(el('h3', { text:R.t, style:'flex:1' }));
      var ch = icEl('right'); ch.style.transition = '.2s';
      head.appendChild(ch);
      var body = el('div', { style:'display:none;padding-top:12px' });
      body.appendChild(el('p', { text:R.d }));
      var g = el('div', { style:'display:flex;flex-wrap:wrap;gap:8px;margin-top:10px' });
      R.ex.forEach(function (e2) {
        var t = el('div', { class:'tile', style:'display:flex;flex-direction:column;align-items:center;gap:2px' });
        t.appendChild(el('div', { class:'ott', text:e2.o, style:'font-size:calc(24px * var(--ott-scale))' }));
        t.appendChild(el('div', { style:'font-size:11px;color:var(--gold-2);font-style:italic', text:e2.t }));
        g.appendChild(t);
      });
      body.appendChild(g);
      head.addEventListener('click', function () {
        var open = body.style.display === 'none';
        body.style.display = open ? 'block' : 'none';
        ch.style.transform = open ? 'rotate(90deg)' : '';
      });
      c.appendChild(head); c.appendChild(body);
      box.appendChild(c);
    });
    return box;
  },

  /* ═══════════ PROFİL ═══════════ */
  profile: function () {
    var s = Store.state, box = el('div', { class:'wrap' });
    box.appendChild(el('p', { class:'eyebrow', text:'Profil' }));
    box.appendChild(el('h1', { style:'margin:10px 0 18px', text:'İlerlemeniz' }));

    var g = el('div', { class:'stat-grid' });
    [[s.xp, 'Toplam XP'], [s.streak, 'Günlük seri'], [s.streakBest, 'En uzun seri'],
     ['%' + Store.accuracy(), 'İsabet'], [Curriculum.doneLessons(s), 'Biten ders'],
     [SRS.knownCount(s), 'Bilinen kelime'], [Math.round(s.stats.seconds/60), 'Dakika'],
     [Object.keys(s.ach).length + '/' + ACHIEVEMENTS.length, 'Rozet']].forEach(function (p) {
      var c = el('div', { class:'stat-box' });
      c.appendChild(el('b', { text:String(p[0]) })); c.appendChild(el('span', { text:p[1] }));
      g.appendChild(c);
    });
    box.appendChild(g);

    /* — takvim — */
    var c1 = el('div', { class:'card', style:'margin-top:18px' });
    c1.appendChild(el('div', { class:'card-h' }, [icEl('calendar'), el('h3', { text:'Son 13 hafta' })]));
    var heatWrap = el('div', { style:'display:flex;gap:6px;align-items:flex-start' });
    var wd = el('div', { class:'heat-days' });
    ['Pt','','Ça','','Cu','','Pa'].forEach(function (n) { wd.appendChild(el('span', { text:n })); });
    var heat = el('div', { class:'heat' });
    var d = new Date(), today = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 90);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));  /* haftanın pazartesisine çek */
    var activeDays = 0;
    for (var t = new Date(start); t <= today; t.setDate(t.getDate() + 1)) {
      var key = t.getFullYear() + '-' + pad2(t.getMonth()+1) + '-' + pad2(t.getDate());
      var xp = s.days[key] || 0;
      if (xp) activeDays++;
      var lvl = xp === 0 ? 0 : xp < 15 ? 1 : xp < s.dailyGoal ? 2 : xp < s.dailyGoal * 2 ? 3 : 4;
      heat.appendChild(el('i', { 'data-l':lvl, title: key + ' — ' + xp + ' XP' }));
    }
    heatWrap.appendChild(wd); heatWrap.appendChild(heat);
    c1.appendChild(heatWrap);
    c1.appendChild(el('p', { class:'muted', style:'margin:12px 0 0;font-size:12.5px',
      text: activeDays ? activeDays + ' günde çalıştınız.' : 'Henüz çalışılan gün yok.' }));
    box.appendChild(c1);

    /* — soru tipi dağılımı — */
    var types = { mc:'Çoktan seçmeli', listen:'Dinleme', type:'Yazma', build:'Kelime kurma',
                  bank:'Cümle kurma', keyboard:'Osmanlıca yazma', speak:'Telaffuz', trace:'Hat', match:'Eşleştirme', tf:'Doğru/Yanlış' };
    var maxv = 1; for (var k in s.stats.byType) maxv = Math.max(maxv, s.stats.byType[k]);
    var c2 = el('div', { class:'card' });
    c2.appendChild(el('div', { class:'card-h' }, [icEl('chart'), el('h3', { text:'Doğru cevap dağılımı' })]));
    var any = false;
    Object.keys(types).forEach(function (t) {
      var v = s.stats.byType[t] || 0; if (!v) return; any = true;
      var r = el('div', { style:'display:flex;align-items:center;gap:12px;margin-bottom:8px' });
      r.appendChild(el('span', { style:'width:118px;font-size:12.5px;color:var(--ink-3)', text:types[t] }));
      var bar = el('div', { class:'bar gold', style:'flex:1' });
      bar.appendChild(el('i', { style:'width:' + Math.round(v/maxv*100) + '%' }));
      r.appendChild(bar);
      r.appendChild(el('span', { style:'width:32px;text-align:right;font-family:var(--f-mono);font-size:13px', text:String(v) }));
      c2.appendChild(r);
    });
    if (!any) c2.appendChild(el('p', { class:'muted', text:'Henüz veri yok. Bir ders tamamlayın.' }));
    box.appendChild(c2);

    /* — rozetler — */
    box.appendChild(el('h2', { style:'margin:26px 0 14px', text:'Rozetler' }));
    var ag = el('div', { class:'ach-grid' });
    ACHIEVEMENTS.forEach(function (a) {
      var got = !!s.ach[a.id];
      var c = el('div', { class:'ach' + (got ? ' got' : '') });
      c.appendChild(el('div', { class:'am', text:a.m }));
      c.appendChild(el('b', { text:a.t }));
      c.appendChild(el('span', { text:got ? 'Kazanıldı · ' + s.ach[a.id] : a.d }));
      ag.appendChild(c);
    });
    box.appendChild(ag);
    return box;
  },

  /* ═══════════ AYARLAR ═══════════ */
  settings: function () {
    var s = Store.state, box = el('div', { class:'wrap' });
    box.appendChild(el('p', { class:'eyebrow', text:'Ayarlar' }));
    box.appendChild(el('h1', { style:'margin:10px 0 18px', text:'Uygulamayı ayarlayın' }));

    /* Her denetim satır başlığından erişilebilir adını alır */
    function row (title, desc, control) {
      var r = el('div', { class:'row' });
      var l = el('div', { class:'rl' });
      l.appendChild(el('b', { text:title }));
      if (desc) l.appendChild(el('span', { text:desc }));
      r.appendChild(l); r.appendChild(control);
      var named = control.matches('[role="switch"], input, select') ? [control]
                : Array.prototype.slice.call(control.querySelectorAll('button, input, select'));
      named.forEach(function (n) {
        if (n.getAttribute('aria-label')) return;
        n.setAttribute('aria-label', n.textContent ? title + ': ' + n.textContent : title);
      });
      if (control.getAttribute('role') === 'group' || control.classList.contains('seg'))
        control.setAttribute('aria-label', title);
      return r;
    }
    function toggle (key, cb) {
      var t = el('button', { class:'switch', type:'button', role:'switch', 'aria-checked': String(!!Store.get(key)) });
      t.addEventListener('click', function () {
        var v = !Store.get(key);
        Store.set(key, v);
        t.setAttribute('aria-checked', String(v));
        Sound.tap();
        if (cb) cb(v);
      });
      return t;
    }
    function seg (key, opts, cb) {
      var g = el('div', { class:'seg', 'data-seg':key });
      opts.forEach(function (o) {
        var b = el('button', { type:'button', text:o[1], 'data-val':o[0], 'aria-pressed': String(Store.get(key) === o[0]) });
        b.addEventListener('click', function () {
          Store.set(key, o[0]);
          Array.prototype.forEach.call(g.children, function (x) { x.setAttribute('aria-pressed','false'); });
          b.setAttribute('aria-pressed','true');
          Sound.tap();
          if (cb) cb(o[0]);
        });
        g.appendChild(b);
      });
      return g;
    }

    /* görünüm */
    var c1 = el('div', { class:'card' });
    c1.appendChild(el('div', { class:'card-h' }, [icEl('eye'), el('h3', { text:'Görünüm' })]));
    c1.appendChild(row('Tema', 'Gece: lâcivert · Kâğıt: âharlı kâğıt tonu',
      seg('theme', [['night','Gece'],['paper','Kâğıt']], function () { App.applyTheme(); })));
    c1.appendChild(row('Ekran biçimi', 'Uygulamayı telefon çerçevesinde önizleyin',
      seg('mode', [['phone','Telefon'],['tablet','Tablet'],['full','Masaüstü']], function (v) { App.setMode(v); })));
    c1.appendChild(row('Yüksek kontrast', 'Metinleri belirginleştirir',
      seg('contrast', [['normal','Normal'],['high','Yüksek']], function () { App.applyTheme(); })));
    c1.appendChild(row('Hareket', 'Animasyonları kapatır',
      toggle('motion', function () { App.applyTheme(); })));
    box.appendChild(c1);

    /* yazı */
    var c2 = el('div', { class:'card' });
    c2.appendChild(el('div', { class:'card-h' }, [icEl('quill'), el('h3', { text:'Osmanlıca yazı' })]));
    var fontDesc = el('span', { text: (FONTS[Store.get('font')] || FONTS.nesih).d });
    c2.appendChild(row('Yazı tipi', null,
      seg('font', [['nesih','Nesih'],['hat','Hat'],['modern','Modern']], function (v) {
        App.applyTheme(); fontDesc.textContent = (FONTS[v] || FONTS.nesih).d;
      })));
    c2.lastChild.querySelector('.rl').appendChild(fontDesc);
    var rng = el('input', { type:'range', min:'0.8', max:'1.6', step:'0.05', value:String(Store.get('ottScale')) });
    rng.addEventListener('input', function () { Store.set('ottScale', parseFloat(rng.value)); App.applyTheme(); });
    c2.appendChild(row('Yazı boyu', 'Osmanlıca metinlerin büyüklüğü', rng));
    c2.appendChild(row('Okunuşu göster', 'Latin transkripsiyonu alıştırmalarda görünsün', toggle('showTranslit')));
    var prev = el('div', { class:'levha', style:'text-align:center;margin-top:14px' });
    prev.appendChild(el('div', { class:'ott', style:'font-size:calc(40px * var(--ott-scale))', text:'بسم الله الرحمن الرحیم' }));
    c2.appendChild(prev);
    box.appendChild(c2);

    /* ses */
    var c3 = el('div', { class:'card' });
    c3.appendChild(el('div', { class:'card-h' }, [icEl('sound'), el('h3', { text:'Ses' })]));
    c3.appendChild(row('Efekt sesleri', 'Doğru/yanlış tonları', toggle('sound')));
    var rate = el('input', { type:'range', min:'0.5', max:'1.2', step:'0.05', value:String(Store.get('ttsRate')) });
    rate.addEventListener('change', function () { Store.set('ttsRate', parseFloat(rate.value)); say('Osmanlıca'); });
    c3.appendChild(row('Konuşma hızı', 'Seslendirme temposu', rate));
    var vs = el('select', { class:'txt-input', style:'min-height:40px;font-size:14px;font-family:var(--f-ui);width:190px' });
    if (Speech.voices.length) {
      Speech.voices.forEach(function (v) { vs.appendChild(el('option', { value:v.voiceURI, text:v.name })); });
      if (Store.get('ttsVoice')) vs.value = Store.get('ttsVoice');
      vs.addEventListener('change', function () { Store.set('ttsVoice', vs.value); Speech.setVoice(vs.value); say('Merhaba'); });
    } else {
      vs.appendChild(el('option', { text:'Türkçe ses bulunamadı' })); vs.disabled = true;
    }
    c3.appendChild(row('Ses', Speech.voices.length ? 'Sisteminizdeki Türkçe sesler' : 'İşletim sisteminden Türkçe ses paketi yükleyin', vs));
    if (!Speech.canListen) c3.appendChild(el('div', { class:'note', style:'margin-top:12px',
      html:'<b>Mikrofon kapalı.</b> ' + (Speech.blockedReason || '') +
           ' Telaffuz alıştırmaları kendi kendine değerlendirme biçiminde çalışır — örneği dinler, tekrar eder, kendiniz onaylarsınız.' }));
    box.appendChild(c3);

    /* öğrenme */
    var c4 = el('div', { class:'card' });
    c4.appendChild(el('div', { class:'card-h' }, [icEl('target'), el('h3', { text:'Öğrenme' })]));
    var goal = el('div', { class:'seg' });
    [[10,'Rahat'],[30,'Normal'],[50,'Ciddi'],[100,'Yoğun']].forEach(function (p) {
      var b = el('button', { type:'button', text:p[1] + ' · ' + p[0], 'aria-pressed': String(s.dailyGoal === p[0]) });
      b.addEventListener('click', function () {
        s.dailyGoal = p[0]; Store.save();
        Array.prototype.forEach.call(goal.children, function (x) { x.setAttribute('aria-pressed','false'); });
        b.setAttribute('aria-pressed','true'); App.renderChrome();
      });
      goal.appendChild(b);
    });
    c4.appendChild(row('Günlük hedef', 'Günde kazanmak istediğiniz XP', goal));
    c4.appendChild(row('Kalp sistemi', 'Kapatırsanız hata sınırı olmaz',
      toggle('useHearts', function () { Store.syncHearts(); App.renderChrome(); })));
    c4.appendChild(row('Bütün dersleri aç', 'Sırayı beklemeden istediğiniz derse girin',
      toggle('freeRoam', function () { if (App.route === 'home') App.render(); })));
    c4.appendChild(row('Klavye ipuçları', 'Şıkların üzerinde 1‑4 rakamlarını göster', toggle('keyHints')));
    box.appendChild(c4);

    /* veri */
    var c5 = el('div', { class:'card' });
    c5.appendChild(el('div', { class:'card-h' }, [icEl('doc'), el('h3', { text:'Veriler' })]));
    if (Store.persistent) {
      c5.appendChild(el('p', { class:'muted', style:'font-size:13px', text:'İlerlemeniz yalnızca bu tarayıcıda saklanır. Yedeklemek için dışa aktarın.' }));
    } else {
      c5.appendChild(el('div', { class:'note', style:'border-inline-start-color:var(--bole)',
        html:'<b>İlerleme kaydedilemiyor.</b> Tarayıcınız bu sayfa için yerel depolamayı kapatmış (dosyadan açılan sayfalarda olur). Uygulama çalışır ama sekmeyi kapatınca ilerleme kaybolur. Kalıcı kayıt için sayfayı bir yerel sunucudan açın ya da çalışmanızı “Dışa aktar” ile yedekleyin.' }));
    }
    var br = el('div', { class:'btn-row', style:'margin-top:12px' });
    var e1 = el('button', { class:'btn ghost sm', type:'button', onclick: function () {
      var blob = new Blob([Store.exportJSON()], { type:'application/json' });
      var a = el('a', { href:URL.createObjectURL(blob), download:'elifba-ilerleme.json' });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      App.toast('Yedek indirildi', 'check');
    } });
    e1.innerHTML = ic('doc') + '<span>Dışa aktar</span>';
    var fi = el('input', { type:'file', accept:'.json', style:'display:none' });
    fi.addEventListener('change', function () {
      var f = fi.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        if (Store.importJSON(r.result)) { App.toast('Yedek yüklendi', 'check'); App.applyTheme(); App.render(); }
        else App.toast('Dosya okunamadı', 'x');
      };
      r.readAsText(f);
    });
    var e2 = el('button', { class:'btn ghost sm', type:'button', onclick:function(){ fi.click(); } });
    e2.innerHTML = ic('undo') + '<span>İçe aktar</span>';
    var e3 = el('button', { class:'btn danger sm', type:'button', onclick: function () {
      App.confirm('Bütün ilerleme silinsin mi?', 'XP, seri, rozetler ve ders geçmişi sıfırlanır. Bu işlem geri alınamaz.', function () {
        Store.reset(); App.applyTheme(); App.go('home'); App.toast('Sıfırlandı', 'refresh');
      });
    } });
    e3.innerHTML = ic('trash') + '<span>Sıfırla</span>';
    br.appendChild(e1); br.appendChild(e2); br.appendChild(e3); br.appendChild(fi);
    c5.appendChild(br);
    box.appendChild(c5);

    box.appendChild(el('div', { class:'hr-rosette' }, [el('span', { text:'۞' })]));
    box.appendChild(el('p', { class:'muted', style:'text-align:center;font-size:12.5px',
      html:'Elifbâ — Osmanlı Türkçesi öğrenme uygulaması<br>Kısayollar için <b>?</b> tuşuna basın.' }));
    return box;
  }
};


/* ═══════════════════════════════════════════
   DERS MOTORU
   ═══════════════════════════════════════════ */
var Lesson = {
  active: null,

  start: function (lessonId) {
    var s = Store.state;
    Store.syncHearts();
    if (s.settings.useHearts && s.hearts <= 0) { this.noHearts(); return; }
    var L = Curriculum.lessonById(lessonId);
    if (!L) return;
    var queue = Curriculum.build(L.l, s);
    if (!queue.length) { App.toast('Bu ders için içerik bulunamadı', 'info'); return; }
    this.run(queue, { id:lessonId, title:L.u.title + ' · ' + L.l.t, xp:20 });
  },

  custom: function (queue, opts) {
    Store.syncHearts();
    if (!queue || !queue.length) { App.toast('Şu an tekrar edilecek madde yok', 'info'); return; }
    this.run(queue, { id:null, title:opts.title || 'Alıştırma', xp:opts.xp || 15 });
  },

  run: function (queue, meta) {
    queue.forEach(function (e) { delete e._retry; });
    this.active = {
      queue: queue.slice(), meta: meta, i: 0, total: queue.length,
      correct: 0, wrong: 0, t0: Date.now(), xp: 0, cur: null
    };
    document.getElementById('shell').classList.add('in-lesson');
    App.route = 'lesson';
    this.render();
  },

  /* ders ekranını söker; yönlendirme yapmaz */
  teardown: function () {
    if (this.active && this.active.cur && this.active.cur.destroy) this.active.cur.destroy();
    Ex.closeGloss(); Speech.stop();
    this.active = null; this._cont = null;
    document.getElementById('shell').classList.remove('in-lesson');
  },

  quit: function (ask) {
    var self = this;
    if (ask && this.active && this.active.i > 0) {
      App.confirm('Dersten çıkılsın mı?', 'Bu turdaki ilerleme kaydedilmez.', function () { self.quit(false); });
      return;
    }
    this.teardown();
    App.go('home');
  },

  render: function () {
    var A = this.active, s = Store.state;
    if (!A) return;
    if (A.i >= A.queue.length) { this.finish(); return; }
    if (A.cur && A.cur.destroy) A.cur.destroy();
    Ex.closeGloss();

    var view = document.getElementById('view');
    view.innerHTML = '';
    var wrap = el('div', { class:'lesson' });

    /* üst şerit */
    var top = el('div', { class:'lesson-top' });
    var close = el('button', { class:'iconbtn', type:'button', 'aria-label':'Dersten çık (Esc)',
      onclick: function () { Lesson.quit(true); } });
    close.innerHTML = ic('x');
    top.appendChild(close);
    var bar = el('div', { class:'bar gold' });
    bar.appendChild(el('i', { style:'width:' + Math.round(A.i / A.queue.length * 100) + '%' }));
    top.appendChild(bar);
    if (s.settings.useHearts) {
      var h = el('div', { class:'lesson-hearts' });
      h.innerHTML = ic('heart') + '<span>' + s.hearts + '</span>';
      top.appendChild(h);
    } else {
      top.appendChild(el('span', { class:'chip fir', text:'sınırsız' }));
    }
    wrap.appendChild(top);

    /* gövde */
    var body = el('div', { class:'lesson-body' });
    var inner = el('div', { class:'lesson-body-in' });
    var ex = A.queue[A.i];
    var mod = Ex.render(ex, { onChange: function () { Lesson.syncCta(); } });
    A.cur = mod;
    inner.appendChild(mod.el);
    body.appendChild(inner);
    wrap.appendChild(body);

    /* alt şerit */
    var foot = el('div', { class:'lesson-foot' });
    var fin = el('div', { class:'lesson-foot-in' });
    var skip = el('button', { class:'btn ghost', type:'button', text:'Atla', title:'Cevabı göster ve geç',
      onclick: function () {
        var r;
        try { r = A.cur.check() || {}; } catch (e) { r = {}; }
        r.ok = false; r.skipped = true; r.silent = false;
        Lesson.answer(r);
      } });
    var cta = el('button', { class:'btn primary', id:'cta', type:'button', text: (mod.cta || 'Kontrol et').toLocaleUpperCase('tr'),
      onclick: function () { Lesson.submit(); } });
    if (!mod.noGrade) fin.appendChild(skip);
    fin.appendChild(cta);
    foot.appendChild(fin);
    wrap.appendChild(foot);

    view.appendChild(wrap);
    this.syncCta();
    if (mod.focus) mod.focus();
    body.scrollTop = 0;
  },

  syncCta: function () {
    var A = this.active; if (!A || !A.cur) return;
    var b = document.getElementById('cta');
    if (b) b.disabled = !A.cur.ready();
  },

  submit: function () {
    var A = this.active; if (!A || !A.cur) return;
    if (!A.cur.ready()) return;
    var r = A.cur.check();
    this.answer(r);
  },

  answer: function (r) {
    var A = this.active, s = Store.state;
    var ex = A.queue[A.i];
    var noGrade = A.cur && A.cur.noGrade;

    if (!noGrade) {
      var ok = !!r.ok && !r.skipped;
      Store.logAnswer(ex.type, ok, ex.srs);
      if (ex.srs) SRS.grade(s, ex.srs, ok);
      if (ok) { A.correct++; A.xp += 10; Sound.correct(); }
      else if (r.skipped) {
        /* atlanan soru tekrar sorulmaz; yalnızca hâfıza kaydına yanlış işlenir */
        A.wrong++;
      }
      else {
        A.wrong++;
        Sound.wrong();
        if (s.settings.useHearts) { Store.loseHeart(); Sound.heart(); }
        /* Yanlış madde dersin sonunda BİR KEZ daha sorulur.
           İşaret alıştırma nesnesinin üzerinde tutulur; yoksa kuyruğa her
           eklenişinde yeni bir sıra numarası alıp sonsuz döngüye girer. */
        if (!ex._retry && A.queue.length < A.total + 8) { ex._retry = 1; A.queue.push(ex); }
      }
      if (s.settings.useHearts && s.hearts <= 0) { this.showFeedback(r, true); return; }
    }
    this.showFeedback(r, false);
  },

  showFeedback: function (r, dead) {
    var A = this.active;
    var noGrade = A.cur && A.cur.noGrade;
    if (noGrade || r.silent && r.ok) { this.next(); return; }

    var foot = document.querySelector('.lesson-foot');
    if (!foot) { this.next(); return; }
    var ok = !!r.ok && !r.skipped;
    var fb = el('div', { class:'fb ' + (ok ? 'ok' : 'no') });
    var fin = el('div', { class:'fb-in' });
    var icn = el('div', { class:'fb-icon' }); icn.innerHTML = ic(ok ? 'check' : 'x');
    fin.appendChild(icn);
    var txt = el('div', { class:'fb-txt' });
    txt.appendChild(el('b', { text: ok ? pick(['Âferin!','Doğru!','Çok iyi!','Mükemmel!','Tam isabet!'])
                                       : (r.skipped ? (r.right ? 'Atlandı — doğrusu:' : 'Atlandı') : 'Doğrusu:') }));
    if (!ok && r.right) {
      var sm = el('small');
      if (r.rightOtt) { var so = el('span', { class:'ott', text:r.right }); sm.appendChild(so); }
      else sm.appendChild(document.createTextNode(r.right));
      txt.appendChild(sm);
    }
    if (r.explain) txt.appendChild(el('small', { text:r.explain, style:'opacity:.85' }));
    fin.appendChild(txt);

    if (r.right && !ok) {
      var sp = el('button', { class:'iconbtn', type:'button', 'aria-label':'Seslendir',
        onclick: function () { say(r.explain && !r.rightOtt ? r.right : (r.explain || r.right)); } });
      sp.innerHTML = ic('sound'); fin.appendChild(sp);
    }
    var btn = el('button', { class:'btn ' + (ok ? 'primary' : 'danger'), type:'button',
      text: dead ? 'DEVAM' : 'DEVAM', onclick: function () { dead ? Lesson.noHearts() : Lesson.next(); } });
    fin.appendChild(btn);
    fb.appendChild(fin);
    foot.parentNode.replaceChild(fb, foot);

    if (!ok) { var lb = document.querySelector('.lesson-body-in'); if (lb) { lb.classList.add('shakeit'); setTimeout(function(){ lb.classList.remove('shakeit'); }, 360); } }
    App.announce(ok ? 'Doğru' : 'Yanlış. ' + (r.right || ''));
    this._cont = function () { dead ? Lesson.noHearts() : Lesson.next(); };
    setTimeout(function () { btn.focus(); }, 20);
  },

  next: function () {
    var A = this.active; if (!A) return;
    this._cont = null;
    A.i++;
    this.render();
  },

  noHearts: function () {
    var s = Store.state, self = this;
    var m = el('div', { style:'text-align:center' });
    m.appendChild(el('div', { style:'font-size:54px;color:var(--bole)' , html:ic('heart') }));
    m.querySelector('svg').style.width = '54px'; m.querySelector('svg').style.height = '54px';
    m.querySelector('svg').style.fill = 'currentColor';
    m.appendChild(el('h2', { text:'Kalpleriniz bitti', style:'margin-top:8px' }));
    var wait = Store.heartIn();
    m.appendChild(el('p', { class:'muted', text:'Yeni bir kalp ' + Math.ceil(wait/60000) + ' dakika sonra gelecek.' }));
    var br = el('div', { class:'btn-row', style:'flex-direction:column' });
    var b1 = el('button', { class:'btn gold wide', type:'button' });
    b1.innerHTML = ic('gem') + '<span>15 elmasla doldur</span>';
    b1.disabled = s.gems < 15;
    b1.addEventListener('click', function () {
      if (Store.refillHearts(15)) { App.closeModal(); App.renderChrome(); Sound.levelUp(); if (self.active) self.next(); }
    });
    var b2 = el('button', { class:'btn ghost wide', type:'button', text:'Kalpsiz devam et' });
    b2.addEventListener('click', function () {
      Store.set('useHearts', false); Store.syncHearts();
      App.closeModal(); App.renderChrome(); if (self.active) self.next();
    });
    var b3 = el('button', { class:'btn ghost wide', type:'button', text:'Derse son ver' });
    b3.addEventListener('click', function () { App.closeModal(); self.quit(false); });
    br.appendChild(b1); br.appendChild(b2); br.appendChild(b3);
    m.appendChild(br);
    App.modal(m, { noClose:true });
  },

  finish: function () {
    var A = this.active, s = Store.state;
    var secs = Math.round((Date.now() - A.t0) / 1000);
    var answered = A.correct + A.wrong;
    var pct = answered ? Math.round(A.correct / answered * 100) : 100;
    var bonus = (A.wrong === 0 && answered > 2) ? 10 : 0;
    var xp = A.meta.xp + A.xp + bonus;

    Store.addXp(xp);
    Store.addGems(A.wrong === 0 ? 3 : 1);
    if (A.meta.id) Store.finishLesson(A.meta.id, { pct:pct, wrong:A.wrong, seconds:secs });
    else { s.stats.seconds += secs; Store.save(); }
    var newAch = Store.checkAchievements();
    Sound.finish();
    if (A.wrong === 0) App.confetti();

    var stars = pct >= 100 ? 3 : pct >= 80 ? 2 : 1;
    var view = document.getElementById('view');
    view.innerHTML = '';
    var w = el('div', { class:'done-wrap' });
    var inner = el('div', { style:'max-width:460px;width:100%' });
    inner.appendChild(el('div', { class:'done-medal', text: stars === 3 ? '۞' : stars === 2 ? '✦' : '✧' }));
    inner.appendChild(el('h1', { style:'margin-top:10px',
      text: pct === 100 ? 'Kusursuz!' : pct >= 80 ? 'Güzel iş!' : 'Ders tamam' }));
    inner.appendChild(el('p', { class:'muted', text:A.meta.title }));

    var g = el('div', { class:'done-grid' });
    [[xp + ' XP', 'Kazanılan', 'g'], ['%' + pct, 'İsabet', 'f'],
     [(secs < 60 ? secs + 'sn' : Math.floor(secs/60) + 'dk ' + (secs%60) + 'sn'), 'Süre', 'l']].forEach(function (p) {
      var c = el('div', { class:'done-cell ' + p[2] });
      c.appendChild(el('b', { text:p[0] })); c.appendChild(el('span', { text:p[1] }));
      g.appendChild(c);
    });
    inner.appendChild(g);
    if (bonus) inner.appendChild(el('p', { class:'chip gold', text:'+' + bonus + ' XP hatasız bonusu' }));

    if (newAch.length) {
      inner.appendChild(el('div', { class:'hr-rosette' }, [el('span', { text:'۞' })]));
      inner.appendChild(el('p', { class:'eyebrow', style:'justify-content:center', text:'Yeni rozet' }));
      var ag = el('div', { class:'ach-grid', style:'margin-top:10px' });
      newAch.forEach(function (a) {
        var c = el('div', { class:'ach got' });
        c.appendChild(el('div', { class:'am', text:a.m }));
        c.appendChild(el('b', { text:a.t }));
        c.appendChild(el('span', { text:a.d }));
        ag.appendChild(c);
      });
      inner.appendChild(ag);
      Sound.levelUp();
    }

    var todayXp = Store.todayXp(), goal = s.dailyGoal;
    var gw = el('div', { style:'margin-top:22px;text-align:start' });
    gw.appendChild(el('div', { style:'display:flex;justify-content:space-between;font-size:12.5px;color:var(--ink-3);margin-bottom:6px' }, [
      el('span', { text:'Günlük hedef' }), el('span', { text: Math.min(todayXp, goal) + ' / ' + goal + ' XP' })
    ]));
    var gb = el('div', { class:'bar' }); gb.appendChild(el('i', { style:'width:' + Math.min(100, Math.round(todayXp/goal*100)) + '%' }));
    gw.appendChild(gb);
    if (todayXp >= goal) gw.appendChild(el('p', { class:'chip fir', style:'margin-top:10px', text:'Bugünkü hedef tamam · seri ' + s.streak + ' gün' }));
    inner.appendChild(gw);

    var br = el('div', { class:'btn-row', style:'margin-top:24px;flex-direction:column' });
    var next = Curriculum.nextLesson(s);
    var b1 = el('button', { class:'btn primary wide', type:'button' });
    b1.innerHTML = ic('right') + '<span>Sıradaki ders</span>';
    b1.addEventListener('click', function () {
      document.getElementById('shell').classList.remove('in-lesson');
      Lesson.active = null; Lesson.start(next.l.id);
    });
    var b2 = el('button', { class:'btn ghost wide', type:'button', text:'Yola dön' });
    b2.addEventListener('click', function () { Lesson.quit(false); });
    br.appendChild(b1); br.appendChild(b2);
    inner.appendChild(br);
    w.appendChild(inner);
    view.appendChild(w);

    this.active = null;
    App.renderChrome();
  },

  key: function (e) {
    var A = this.active;
    if (e.key === 'Escape') { if (this._cont) return; this.quit(true); return true; }
    if (this._cont && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); this._cont(); return true; }
    if (!A || !A.cur) return false;
    if (e.key === 'Enter') { e.preventDefault(); this.submit(); return true; }
    if (A.cur.key && A.cur.key(e)) { e.preventDefault(); return true; }
    return false;
  }
};
