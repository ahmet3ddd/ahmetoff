/* ══ Alıştırma tipleri ══
   Her tip { el, check(), ready(), … } döndürür; ders motoru bunu yönetir. */

/* ── küçük DOM yardımcıları ── */
function el (tag, attrs, kids) {
  var n = document.createElement(tag);
  if (attrs) for (var k in attrs) {
    if (k === 'class') n.className = attrs[k];
    else if (k === 'html') n.innerHTML = attrs[k];
    else if (k === 'text') n.textContent = attrs[k];
    else if (k.slice(0,2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] != null && attrs[k] !== false) n.setAttribute(k, attrs[k]);
  }
  if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
    if (c == null || c === false) return;
    n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return n;
}
function ic (name, cls) { return '<svg class="ic ' + (cls||'') + '"><use href="#i-' + name + '"/></svg>'; }

/* Yazı tahtasında geçme eşiği. Ölçüm: harfin hattını takip eden çizim 90–100,
   gelişigüzel karalama 25–37, harfin üstünden geçmeyen düz çizgi 61 alıyor. */
var TRACE_PASS = 65;
function icEl (name, cls) { var s = el('span'); s.innerHTML = ic(name, cls); return s.firstChild; }
function say (text) { Speech.speak(text); }

var Ex = {

  render: function (ex, ctx) {
    var fn = this['t_' + ex.type];
    if (!fn) return { el: el('div', { text:'?' }), check: function () { return { ok:true }; }, ready: function () { return true; } };
    return fn.call(this, ex, ctx || {});
  },

  /* ── ortak parçalar ── */
  stimulus: function (ex) {
    if (!ex.stim) return null;
    var box = el('div', { class:'stimulus' });
    box.appendChild(el('div', { class:'big-ott ' + (ex.stim.size === 'xl' ? '' : ''), text: ex.stim.ott }));
    if (ex.stim.sub && Store.get('showTranslit')) box.appendChild(el('div', { class:'sub translit', text: ex.stim.sub }));
    if (ex.say) {
      var b = el('button', { class:'iconbtn', type:'button', 'aria-label':'Seslendir', title:'Seslendir (Boşluk)',
        onclick: function () { say(ex.say); Sound.tap(); } });
      b.innerHTML = ic('sound');
      box.appendChild(b);
    }
    return box;
  },

  prompt: function (ex) {
    var f = document.createDocumentFragment();
    if (ex.prompt) f.appendChild(el('h2', { class:'q-prompt', text: ex.prompt }));
    if (ex.sub) f.appendChild(el('p', { class:'q-sub', text: ex.sub }));
    return f;
  },

  /* seçenek listesi — mc, listen, tf ortak kullanır */
  options: function (list, ctx, opts) {
    opts = opts || {};
    var wrap = el('div', { class:'opts' + (opts.two ? ' two' : '') });
    var picked = null, btns = [];
    list.forEach(function (c, i) {
      var b = el('button', { class:'opt', type:'button', 'aria-pressed':'false', 'data-id':c.id });
      if (Store.get('keyHints')) b.appendChild(el('span', { class:'kbd', text:String(i+1) }));
      b.appendChild(el('span', { class:'lbl' + (c.ott ? ' ott' : ''), text:c.v }));
      b.addEventListener('click', function () {
        if (b.disabled) return;
        btns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        picked = c.id;
        Sound.tap();
        if (ctx.onChange) ctx.onChange();
      });
      btns.push(b); wrap.appendChild(b);
    });
    return {
      el: wrap,
      get value () { return picked; },
      lock: function (ansId) {
        btns.forEach(function (b) {
          b.disabled = true;
          var id = b.getAttribute('data-id');
          if (id === ansId) b.classList.add('right');
          else if (id === picked) b.classList.add('wrong');
          else b.classList.add('fade');
        });
      },
      key: function (e) {
        var n = parseInt(e.key, 10);
        if (n >= 1 && n <= btns.length && !btns[n-1].disabled) { btns[n-1].click(); return true; }
        return false;
      }
    };
  },

  /* ══ 1. Öğretim kartı ══ */
  t_intro: function (ex, ctx) {
    var box = el('div');
    if (ex.kind === 'letter') {
      var L = ex.L, f = Letters.forms(L.ch);
      box.appendChild(el('p', { class:'eyebrow', text:'Yeni harf' }));
      var head = el('div', { class:'levha', style:'text-align:center;margin:14px 0 18px' });
      head.appendChild(el('div', { class:'ott ott-xl', text:L.ch, style:'color:var(--gold)' }));
      head.appendChild(el('h1', { text:L.name, style:'margin-top:6px' }));
      head.appendChild(el('p', { class:'translit', text:L.tr }));
      var sp = el('button', { class:'btn ghost sm', type:'button', onclick:function(){ say(L.name); Sound.tap(); } });
      sp.innerHTML = ic('sound') + '<span>Dinle</span>';
      head.appendChild(sp);
      box.appendChild(head);
      box.appendChild(el('p', { text:L.sound }));

      var keys = Letters.formList(L.ch);
      box.appendChild(el('p', { class:'eyebrow', text: keys.length === 2 ? 'İki hâli' : 'Dört hâli', style:'margin:18px 0 10px' }));
      var fr = el('div', { class:'forms-row' });
      keys.forEach(function (k) {
        var b = el('div', { class:'form-box' });
        b.appendChild(el('div', { class:'fg ott', text:f[k] }));
        b.appendChild(el('div', { class:'fl', text:Letters.formNames[k] }));
        fr.appendChild(b);
      });
      box.appendChild(fr);
      if (L.nc) box.appendChild(el('div', { class:'note', style:'margin-top:12px',
        html:'<b>Dikkat:</b> Bu harf kendinden sonraki harfe bağlanmaz. Bu yüzden başta ve ortada ayrı bir biçimi yoktur — sadece yalın ve son hâli vardır.' }));
      box.appendChild(el('div', { class:'note', style:'margin-top:12px', text:L.note }));

      if (L.ex) {
        box.appendChild(el('p', { class:'eyebrow', text:'Örnek', style:'margin:18px 0 10px' }));
        var ew = el('div', { class:'card', style:'display:flex;align-items:center;gap:14px' });
        ew.appendChild(el('div', { class:'ott', text:L.ex.o, style:'font-size:calc(38px * var(--ott-scale))' }));
        var em = el('div', { style:'flex:1' });
        em.appendChild(el('div', { class:'translit', text:L.ex.t }));
        em.appendChild(el('div', { class:'muted', text:L.ex.m }));
        ew.appendChild(em);
        var eb = el('button', { class:'iconbtn', type:'button', 'aria-label':'Seslendir', onclick:function(){ say(L.ex.t); } });
        eb.innerHTML = ic('sound'); ew.appendChild(eb);
        box.appendChild(ew);
      }
      if (L.eb) box.appendChild(el('p', { class:'muted', style:'margin-top:12px;font-size:12.5px',
        text:'Ebced değeri: ' + L.eb + '  ·  ' + (L.nc ? 'bağlanmaz' : 'iki taraftan bağlanır') }));
      setTimeout(function () { say(L.name); }, 260);
    }
    else if (ex.kind === 'word') {
      var w = ex.w;
      box.appendChild(el('p', { class:'eyebrow', text:'Yeni kelime' }));
      var lv = el('div', { class:'levha', style:'text-align:center;margin:14px 0 18px' });
      lv.appendChild(el('div', { class:'ott', text:w.o, style:'font-size:calc(54px * var(--ott-scale));color:var(--gold)' }));
      lv.appendChild(el('div', { class:'translit', style:'font-size:19px;margin-top:4px', text:w.t }));
      lv.appendChild(el('div', { style:'font-size:17px;margin-top:2px', text:w.m }));
      var sb = el('button', { class:'btn ghost sm', type:'button', style:'margin-top:12px', onclick:function(){ say(w.t); Sound.tap(); } });
      sb.innerHTML = ic('sound') + '<span>Dinle</span>';
      lv.appendChild(sb);
      box.appendChild(lv);

      var chars = Letters.split(w.o);
      if (chars.length > 1) {
        box.appendChild(el('p', { class:'eyebrow', text:'Harfleri', style:'margin-bottom:10px' }));
        var row = el('div', { style:'display:flex;flex-wrap:wrap;gap:8px;direction:rtl;justify-content:center' });
        chars.forEach(function (c) {
          var L2 = Letters.byCh(c);
          var t = el('div', { class:'tile', style:'text-align:center;min-width:56px' });
          t.appendChild(el('div', { class:'ott', text:c, style:'font-size:calc(28px * var(--ott-scale))' }));
          t.appendChild(el('div', { style:'font-size:10px;color:var(--ink-3);direction:ltr', text:L2 ? L2.name : '' }));
          row.appendChild(t);
        });
        box.appendChild(row);
      }
      if (w.g) box.appendChild(el('p', { class:'muted', style:'margin-top:14px;font-size:12.5px',
        text:'Köken: ' + (ORIGINS[w.g] || w.g) + (w.th && THEMES[w.th] ? '  ·  ' + THEMES[w.th] : '') }));
      if (w.h) box.appendChild(el('div', { class:'note', style:'margin-top:10px', html:'<b>İmlâ notu:</b> ' + w.h }));
      setTimeout(function () { say(w.t); }, 260);
    }
    else if (ex.kind === 'rule') {
      var R = ex.R;
      box.appendChild(el('p', { class:'eyebrow', text:'Kural' }));
      box.appendChild(el('h1', { style:'margin:10px 0 8px', text:R.t }));
      box.appendChild(el('p', { text:R.d }));
      box.appendChild(el('p', { class:'eyebrow', text:'Örnekler', style:'margin:18px 0 10px' }));
      R.ex.forEach(function (e2) {
        var c = el('div', { class:'card', style:'display:flex;align-items:center;gap:14px;padding:12px 16px' });
        c.appendChild(el('div', { class:'ott', text:e2.o, style:'font-size:calc(32px * var(--ott-scale));min-width:96px;text-align:right' }));
        c.appendChild(el('div', { class:'translit', style:'flex:1', text:e2.t }));
        box.appendChild(c);
      });
    }
    else if (ex.kind === 'rakam') {
      box.appendChild(el('p', { class:'eyebrow', text:'Osmanlı rakamları' }));
      box.appendChild(el('h1', { style:'margin:10px 0 8px', text:'Sayılar soldan sağa yazılır' }));
      box.appendChild(el('p', { text:'Yazı sağdan sola akar, fakat rakamlar bugünkü gibi soldan sağa dizilir. ١٢٩٥ sayısı 1295 demektir.' }));
      var g = el('div', { class:'abc-grid', style:'margin-top:14px' });
      RAKAM.forEach(function (r) {
        var c = el('div', { class:'abc-cell' });
        c.appendChild(el('div', { class:'g', text:r.o }));
        c.appendChild(el('div', { class:'n', text:r.d }));
        c.appendChild(el('div', { class:'t', text:r.n }));
        g.appendChild(c);
      });
      box.appendChild(g);
    }
    else if (ex.kind === 'ebced') {
      box.appendChild(el('p', { class:'eyebrow', text:'Ebced' }));
      box.appendChild(el('h1', { style:'margin:10px 0 8px', text:'Harflerin sayı değeri' }));
      box.appendChild(el('p', { text:'Elifbâdaki her harfin bir sayı karşılığı vardır. Şairler bir mısraın harflerini toplayarak olayın hicrî yılını gizler; buna “tarih düşürmek” denir.' }));
      var g2 = el('div', { class:'abc-grid', style:'margin-top:14px' });
      [['ا',1],['ب',2],['ج',3],['د',4],['ه',5],['و',6],['ز',7],['ح',8],['ط',9],['ی',10],['ك',20],['ل',30]].forEach(function (p) {
        var c = el('div', { class:'abc-cell' });
        c.appendChild(el('div', { class:'g', text:p[0] }));
        c.appendChild(el('div', { class:'n', text:p[1] }));
        g2.appendChild(c);
      });
      box.appendChild(g2);
      box.appendChild(el('div', { class:'note', style:'margin-top:14px', html:'Sıralama <b>ebced · hevvez · huttî · kelemen · saʿfes · karaşet · sehaz · dazığ</b> kelimeleriyle ezberlenir.' }));
    }
    else if (ex.kind === 'hareke') {
      box.appendChild(el('p', { class:'eyebrow', text:'Harekeler' }));
      box.appendChild(el('h1', { style:'margin:10px 0 8px', text:'Yazılmayan ünlüyü gösteren işaretler' }));
      box.appendChild(el('p', { text:'Osmanlıcada ünlüler çoğu zaman yazılmaz. Harekeler, kelimenin nasıl okunacağını gösteren küçük işaretlerdir; ders kitaplarında ve Kur’an’da kullanılır.' }));
      HAREKE.forEach(function (h) {
        var c = el('div', { class:'card', style:'display:flex;align-items:center;gap:14px;padding:12px 16px' });
        c.appendChild(el('div', { class:'ott', text:h.on, style:'font-size:calc(38px * var(--ott-scale));min-width:64px;text-align:center' }));
        var m = el('div', { style:'flex:1' });
        m.appendChild(el('b', { text:h.name }));
        m.appendChild(el('div', { class:'muted', style:'font-size:13px', text:h.d }));
        c.appendChild(m);
        box.appendChild(c);
      });
    }
    return { el: box, check: function () { return { ok:true, silent:true }; }, ready: function () { return true; }, cta:'Devam', noGrade:true };
  },

  /* ══ 2. Çoktan seçmeli ══ */
  t_mc: function (ex, ctx) {
    var box = el('div');
    box.appendChild(this.prompt(ex));
    var s = this.stimulus(ex); if (s) box.appendChild(s);
    var opts = this.options(ex.choices, ctx, { two: ex.choices.length === 2 });
    box.appendChild(opts.el);
    if (ex.say) setTimeout(function () { say(ex.say); }, 220);
    return {
      el: box,
      ready: function () { return opts.value != null; },
      key: function (e) { return opts.key(e); },
      check: function () {
        var ok = opts.value === ex.ansId;
        opts.lock(ex.ansId);
        var right = ex.choices.filter(function (c) { return c.id === ex.ansId; })[0];
        return { ok:ok, right: right ? right.v : '', rightOtt: right && right.ott, explain: ex.explain };
      }
    };
  },

  /* ══ 3. Dinleme ══ */
  t_listen: function (ex, ctx) {
    var C = ex.choices, box = el('div');
    box.appendChild(el('h2', { class:'q-prompt', text: ex.prompt || 'Duyduğunuz hangisi?' }));

    var play = el('div', { style:'display:flex;gap:12px;align-items:center;justify-content:center;margin:8px 0 22px' });
    var big = el('button', { class:'btn primary', type:'button', style:'width:96px;height:96px;border-radius:50%;padding:0',
      'aria-label':'Dinle', title:'Dinle (Boşluk)' });
    big.innerHTML = ic('sound') + '';
    big.querySelector('svg').style.width = '38px'; big.querySelector('svg').style.height = '38px';
    big.addEventListener('click', function () { Speech.speak(C.say); });
    var slow = el('button', { class:'iconbtn', type:'button', 'aria-label':'Yavaş dinle', title:'Yavaş',
      onclick: function () { Speech.speak(C.say, { rate:0.55 }); } });
    slow.innerHTML = ic('ear');
    play.appendChild(big); play.appendChild(slow);
    box.appendChild(play);

    if (!Speech.supported || !Speech.hasVoice) {
      box.appendChild(el('div', { class:'note', style:'margin-bottom:14px',
        html:'<b>Ses bulunamadı.</b> Tarayıcınızda Türkçe konuşma sesi yüklü değil. Metin ipucu gösteriliyor: <span class="translit">' + C.say + '</span>' }));
    }

    var opts = this.options(C.list, ctx);
    box.appendChild(opts.el);
    setTimeout(function () { Speech.speak(C.say); }, 320);

    return {
      el: box,
      ready: function () { return opts.value != null; },
      key: function (e) { if (e.key === ' ') { Speech.speak(C.say); return true; } return opts.key(e); },
      replay: function () { Speech.speak(C.say); },
      check: function () {
        var ok = opts.value === C.ansId;
        opts.lock(C.ansId);
        var right = C.list.filter(function (c) { return c.id === C.ansId; })[0];
        return { ok:ok, right: right ? right.v : '', rightOtt: right && right.ott, explain: C.say ? 'Okunuşu: ' + C.say : null };
      }
    };
  },

  /* ══ 4. Doğru / Yanlış ══ */
  t_tf: function (ex, ctx) {
    var box = el('div');
    box.appendChild(el('p', { class:'eyebrow', text:'Doğru mu, yanlış mı?' }));
    box.appendChild(el('h2', { class:'q-prompt', style:'margin-top:12px', text: ex.prompt }));
    var opts = this.options([{ v:'Doğru', id:'t' }, { v:'Yanlış', id:'f' }], ctx, { two:true });
    box.appendChild(opts.el);
    return {
      el: box,
      ready: function () { return opts.value != null; },
      key: function (e) { return opts.key(e); },
      check: function () {
        var want = ex.ans ? 't' : 'f';
        var ok = opts.value === want;
        opts.lock(want);
        return { ok:ok, right: ex.ans ? 'Doğru' : 'Yanlış', explain: ex.explain };
      }
    };
  },

  /* ══ 5. Yazma (Latin harfleriyle okuma) ══ */
  t_type: function (ex, ctx) {
    var box = el('div');
    box.appendChild(this.prompt(ex));
    var s = this.stimulus(ex); if (s) box.appendChild(s);
    var inp = el('input', { class:'txt-input', type:'text', autocomplete:'off', autocapitalize:'off',
      spellcheck:'false', placeholder:'Okunuşunu yazın…', 'aria-label':'Okunuş' });
    inp.addEventListener('input', function () { if (ctx.onChange) ctx.onChange(); });
    box.appendChild(inp);
    box.appendChild(el('p', { class:'muted', style:'margin-top:8px;font-size:12.5px',
      text:'İpucu: şapkalı harfleri (â, î, û) yazmanız gerekmez.' }));
    return {
      el: box,
      focus: function () { setTimeout(function () { inp.focus(); }, 60); },
      ready: function () { return inp.value.trim().length > 0; },
      check: function () {
        var v = Speech.norm(inp.value);
        var ok = ex.ans.some(function (a) { return Speech.norm(a) === v; });
        inp.disabled = true;
        inp.style.borderColor = ok ? 'var(--firuze)' : 'var(--bole)';
        return { ok:ok, right: ex.ans[0], explain: ex.explain };
      }
    };
  },

  /* ══ 6. Eşleştirme ══ */
  t_match: function (ex, ctx) {
    var box = el('div');
    box.appendChild(el('h2', { class:'q-prompt', text: ex.prompt || 'Eşleştirin' }));
    var grid = el('div', { class:'match-grid' });
    var colA = el('div', { class:'match-col' }), colB = el('div', { class:'match-col' });
    grid.appendChild(colA); grid.appendChild(colB);
    box.appendChild(grid);

    var pairs = ex.pairs, left = shuffle(pairs.slice()), right = shuffle(pairs.slice());
    var selA = null, selB = null, done = 0, wrongCount = 0, finished = false;
    var self = this;

    function tile (txt, side, key, ott) {
      var b = el('button', { class:'mtile' + (ott ? ' ott' : ''), type:'button', 'aria-pressed':'false', text:txt });
      b.addEventListener('click', function () {
        if (b.classList.contains('matched')) return;
        if (side === 'a') { if (selA) selA.setAttribute('aria-pressed','false'); selA = b; }
        else { if (selB) selB.setAttribute('aria-pressed','false'); selB = b; }
        b.setAttribute('aria-pressed','true');
        b._key = key;
        Sound.tap();
        if (selA && selB) {
          if (selA._key === selB._key) {
            selA.classList.add('matched'); selB.classList.add('matched');
            selA.setAttribute('aria-pressed','false'); selB.setAttribute('aria-pressed','false');
            selA = selB = null; done++;
            Sound.correct();
            if (done === pairs.length) { finished = true; if (ctx.onChange) ctx.onChange(); }
          } else {
            wrongCount++;
            var a = selA, b2 = selB;
            a.classList.add('miss'); b2.classList.add('miss');
            Sound.wrong();
            setTimeout(function () {
              a.classList.remove('miss'); b2.classList.remove('miss');
              a.setAttribute('aria-pressed','false'); b2.setAttribute('aria-pressed','false');
            }, 340);
            selA = selB = null;
          }
        }
      });
      return b;
    }
    left.forEach(function (p) { colA.appendChild(tile(p.a, 'a', p.a, p.ott)); });
    right.forEach(function (p) { colB.appendChild(tile(p.b, 'b', p.a, false)); });

    return {
      el: box,
      ready: function () { return finished; },
      cta: 'Devam',
      check: function () { return { ok: wrongCount === 0, silent:true, right: wrongCount ? (wrongCount + ' yanlış eşleme yaptınız') : '' }; }
    };
  },

  /* ══ 7. Kelime kurma (harf döşemeleri) ══ */
  t_build: function (ex, ctx) {
    var w = ex.word, chars = Letters.split(w.o);
    var box = el('div');
    box.appendChild(el('h2', { class:'q-prompt', text:'Harfleri sırayla dizerek kelimeyi kurun' }));
    box.appendChild(el('p', { class:'q-sub', text:'“' + w.m + '” — sağdan sola dizilir.' }));

    var line = el('div', { class:'bank-line' });
    var preview = el('div', { class:'ott', style:'text-align:center;font-size:calc(44px * var(--ott-scale));min-height:1.6em;color:var(--gold)' });
    var pool = el('div', { class:'bank-pool' });
    box.appendChild(preview);
    box.appendChild(line);
    box.appendChild(el('p', { class:'eyebrow', text:'Harfler', style:'margin:14px 0 10px' }));
    box.appendChild(pool);

    var seq = [], tiles = [];
    function refresh () {
      preview.textContent = seq.map(function (s) { return s.c; }).join('');
      if (ctx.onChange) ctx.onChange();
    }
    shuffle(chars.map(function (c, i) { return { c:c, i:i }; })).forEach(function (o) {
      var t = el('button', { class:'tile ott', type:'button', text:o.c });
      t.addEventListener('click', function () {
        if (t.classList.contains('used')) return;
        t.classList.add('used');
        var chip = el('button', { class:'tile ott', type:'button', text:o.c });
        chip.addEventListener('click', function () {
          line.removeChild(chip); t.classList.remove('used');
          seq = seq.filter(function (x) { return x.chip !== chip; });
          refresh();
        });
        line.appendChild(chip);
        seq.push({ c:o.c, chip:chip, tile:t });
        Sound.tap(); refresh();
      });
      tiles.push(t); pool.appendChild(t);
    });

    return {
      el: box,
      ready: function () { return seq.length === chars.length; },
      check: function () {
        var got = seq.map(function (s) { return s.c; }).join('');
        var ok = got === chars.join('');
        preview.style.color = ok ? 'var(--firuze-2)' : 'var(--bole-2)';
        return { ok:ok, right: w.o, rightOtt:true, explain: w.t + ' — ' + w.m };
      }
    };
  },

  /* ══ 8. Cümle kurma (kelime bankası) ══ */
  t_bank: function (ex, ctx) {
    var s = ex.s, box = el('div');
    box.appendChild(el('h2', { class:'q-prompt', text:'Bu cümleyi Osmanlıca dizin' }));
    box.appendChild(el('div', { class:'stimulus', style:'padding:18px' }, [
      el('div', { style:'font-family:var(--f-display);font-size:19px;text-align:center', text:s.m })
    ]));
    var line = el('div', { class:'bank-line' }), pool = el('div', { class:'bank-pool' });
    box.appendChild(line); box.appendChild(pool);
    var seq = [];
    shuffle(s.tok.slice()).forEach(function (tk) {
      var t = el('button', { class:'tile ott', type:'button', text:tk });
      t.addEventListener('click', function () {
        if (t.classList.contains('used')) return;
        t.classList.add('used');
        var chip = el('button', { class:'tile ott', type:'button', text:tk });
        chip.addEventListener('click', function () {
          line.removeChild(chip); t.classList.remove('used');
          seq = seq.filter(function (x) { return x.chip !== chip; });
          if (ctx.onChange) ctx.onChange();
        });
        line.appendChild(chip); seq.push({ v:tk, chip:chip });
        Sound.tap(); if (ctx.onChange) ctx.onChange();
      });
      pool.appendChild(t);
    });
    return {
      el: box,
      ready: function () { return seq.length === s.tok.length; },
      check: function () {
        var ok = seq.map(function (x) { return x.v; }).join(' ') === s.tok.join(' ');
        return { ok:ok, right: s.tok.join(' '), rightOtt:true, explain: s.t };
      }
    };
  },

  /* ══ 9. Osmanlı klavyesiyle yazma ══ */
  t_keyboard: function (ex, ctx) {
    var w = ex.word, box = el('div');
    box.appendChild(el('h2', { class:'q-prompt', text:'“' + w.m + '” kelimesini Osmanlıca yazın' }));
    if (Store.get('showTranslit')) box.appendChild(el('p', { class:'q-sub translit', text: w.t }));

    var out = el('div', { class:'otf-input', 'data-ph':'Aşağıdaki klavyeden harfleri seçin' });
    box.appendChild(out);

    var kb = el('div', { class:'kbd-grid' });
    var util = el('div', { style:'display:flex;gap:6px;margin-top:8px' });
    var val = '';
    function setVal (v) { val = v; out.textContent = v; if (ctx.onChange) ctx.onChange(); }
    LETTERS.concat(EXTRAS).forEach(function (L) {
      var k = el('button', { class:'kbd-key', type:'button', text:L.ch, title:L.name,
        onclick: function () { setVal(val + L.ch); Sound.tap(); } });
      kb.appendChild(k);
    });
    var kA = el('button', { class:'kbd-key', type:'button', text:'آ', title:'medli elif', onclick:function(){ setVal(val + 'آ'); Sound.tap(); } });
    kb.appendChild(kA);
    box.appendChild(kb);

    var bs = el('button', { class:'btn ghost sm', type:'button', onclick: function () { setVal(val.slice(0, -1)); } });
    bs.innerHTML = ic('undo') + '<span>Sil</span>';
    var cl = el('button', { class:'btn ghost sm', type:'button', onclick: function () { setVal(''); } });
    cl.innerHTML = ic('trash') + '<span>Temizle</span>';
    var hint = el('button', { class:'btn ghost sm', type:'button', onclick: function () { setVal(Letters.split(w.o)[0]); } });
    hint.innerHTML = ic('sparkle') + '<span>İlk harf</span>';
    util.appendChild(bs); util.appendChild(cl); util.appendChild(hint);
    box.appendChild(util);

    return {
      el: box,
      ready: function () { return val.length > 0; },
      check: function () {
        var got = Letters.split(val).join(''), want = Letters.split(w.o).join('');
        var ok = got === want;
        out.style.borderColor = ok ? 'var(--firuze)' : 'var(--bole)';
        return { ok:ok, right: w.o, rightOtt:true, explain: w.t + ' — ' + w.m };
      }
    };
  },

  /* ══ 10. Telaffuz ══ */
  t_speak: function (ex, ctx) {
    var w = ex.word, box = el('div');
    box.appendChild(el('h2', { class:'q-prompt', text:'Bu kelimeyi söyleyin' }));
    var st = el('div', { class:'stimulus' });
    st.appendChild(el('div', { class:'big-ott', text:w.o }));
    st.appendChild(el('div', { class:'sub translit', style:'font-size:18px', text:w.t }));
    var lb = el('button', { class:'btn ghost sm', type:'button', onclick:function(){ say(w.t); } });
    lb.innerHTML = ic('sound') + '<span>Örneği dinle</span>';
    st.appendChild(lb);
    box.appendChild(st);

    var mic = el('div', { class:'mic-live' }); mic.innerHTML = ic('mic');
    mic.querySelector('svg').style.width = '34px'; mic.querySelector('svg').style.height = '34px';
    var status = el('p', { style:'text-align:center;font-weight:600;min-height:24px', text:'' });
    var heard  = el('p', { class:'muted', style:'text-align:center;min-height:22px;font-size:13.5px' });
    var wave = el('div', { class:'wave', style:'visibility:hidden' });
    for (var i=0;i<7;i++) { var b = el('i'); b.style.animationDelay = (i*0.09)+'s'; wave.appendChild(b); }

    var holder = el('div', { style:'text-align:center;margin-top:18px' });
    holder.appendChild(mic); holder.appendChild(wave); holder.appendChild(status); holder.appendChild(heard);
    box.appendChild(holder);

    var score = null, rec = null, listening = false, manual = false;

    var btn = el('button', { class:'btn primary wide', type:'button', style:'margin-top:14px' });
    btn.innerHTML = ic('mic') + '<span>Konuşmaya başla</span>';

    if (!Speech.canListen) {
      manual = true;
      box.appendChild(el('div', { class:'note', style:'margin-top:16px',
        html:'<b>Mikrofonla değerlendirme kapalı.</b> ' + (Speech.blockedReason || '') +
             ' Örneği dinleyin, yüksek sesle tekrar edin, sonra “Söyledim” düğmesine basın.' }));
      btn.innerHTML = ic('check') + '<span>Söyledim</span>';
      btn.addEventListener('click', function () { score = 1; status.textContent = 'Kaydedildi'; btn.disabled = true; if (ctx.onChange) ctx.onChange(); });
    } else {
      btn.addEventListener('click', function () {
        if (listening) { if (rec) try { rec.stop(); } catch (e) {} return; }
        listening = true; mic.classList.add('rec'); wave.style.visibility = 'visible';
        status.textContent = 'Dinleniyor…'; heard.textContent = '';
        btn.innerHTML = ic('x') + '<span>Durdur</span>';
        rec = Speech.listen(function (r) {
          if (r.error) {
            listening = false; mic.classList.remove('rec'); wave.style.visibility = 'hidden';
            btn.innerHTML = ic('mic') + '<span>Tekrar dene</span>';
            var soft = (r.error === 'no-speech' || r.error === 'aborted' || r.error === 'nomatch');
            status.textContent = ({
              'not-allowed':'Mikrofon izni verilmedi', 'service-not-allowed':'Mikrofon servisi engellendi',
              'audio-capture':'Mikrofon bulunamadı', 'unsupported':'Desteklenmiyor',
              'network':'Bağlantı gerekli', 'no-speech':'Ses alınamadı, tekrar deneyin',
              'nomatch':'Anlaşılamadı, tekrar deneyin', 'aborted':'Yarıda kesildi'
            })[r.error] || 'Bir sorun oldu, tekrar deneyin';
            /* Kalıcı bir engel varsa kullanıcıyı burada bırakmayalım:
               kendi kendine değerlendirme yoluna geçilir. */
            if (!soft) {
              manual = true; score = 1;
              btn.innerHTML = ic('check') + '<span>Söyledim</span>';
              status.textContent += ' — “Söyledim” ile geçebilirsiniz';
              if (ctx.onChange) ctx.onChange();
            }
            return;
          }
          heard.textContent = '“' + r.text + '”';
          if (r.final) {
            listening = false; mic.classList.remove('rec'); wave.style.visibility = 'hidden';
            score = Speech.bestScore(r.alts, Speech.plain(w.t));
            var alt = Speech.bestScore(r.alts, w.m); if (alt > score) score = alt;
            var pct = Math.round(score * 100);
            status.textContent = 'Benzerlik: %' + pct;
            status.style.color = score >= 0.62 ? 'var(--firuze-2)' : 'var(--bole-2)';
            btn.innerHTML = ic('refresh') + '<span>Tekrar dene</span>';
            if (ctx.onChange) ctx.onChange();
          }
        });
      });
    }
    box.appendChild(btn);
    if (Speech.canListen) box.appendChild(el('p', { class:'muted', style:'text-align:center;font-size:12px;margin-top:10px',
      text:'Tarayıcı mikrofon izni isteyecek. İzin vermek istemezseniz “Atla” ile geçebilirsiniz.' }));

    return {
      el: box,
      ready: function () { return score != null; },
      destroy: function () { if (rec) try { rec.abort ? rec.abort() : rec.stop(); } catch (e) {} },
      check: function () {
        var ok = manual ? true : score >= 0.62;
        return { ok:ok, right: w.t, explain: manual ? null : 'Benzerlik: %' + Math.round(score * 100) };
      }
    };
  },

  /* ══ 11. Yazı tahtası ══ */
  t_trace: function (ex, ctx) {
    var box = el('div');
    box.appendChild(el('h2', { class:'q-prompt', text:'“' + ex.name + '” harfini yazın' }));
    box.appendChild(el('p', { class:'q-sub', text:'Soluk harfin üzerinden geçin. Osmanlıcada yazı sağdan sola akar.' }));
    var host = el('div');
    box.appendChild(host);

    var meta = el('div', { class:'pad-meta' });
    var ring = el('div', { class:'score-ring' }); ring.appendChild(el('b', { text:'—' }));
    var hintTxt = el('div', { class:'pad-hint', style:'flex:1', text:'Yazmaya başlayın; kalemi kaldırdığınızda puanlanır.' });
    var bUndo = el('button', { class:'iconbtn', type:'button', 'aria-label':'Geri al' }); bUndo.innerHTML = ic('undo');
    var bClr  = el('button', { class:'iconbtn', type:'button', 'aria-label':'Temizle' }); bClr.innerHTML = ic('trash');
    var bHint = el('button', { class:'iconbtn', type:'button', 'aria-label':'Nasıl yazılır' }); bHint.innerHTML = ic('eye');
    meta.appendChild(ring); meta.appendChild(hintTxt); meta.appendChild(bHint); meta.appendChild(bUndo); meta.appendChild(bClr);
    box.appendChild(meta);

    var score = 0, pad = null;
    /* Tahta, host DOM'a girip ölçüsü belli olur olmaz kurulur */
    requestAnimationFrame(function () {
      pad = Writing.create(host, { ch: ex.ch, onScore: function (s, d) {
        score = s;
        ring.style.setProperty('--p', s);
        ring.querySelector('b').textContent = d.empty ? '—' : s;
        hintTxt.textContent = d.empty ? 'Yazmaya başlayın; kalemi kaldırdığınızda puanlanır.'
          : s >= 85 ? 'Çok iyi — harfin hattını yakaladınız.'
          : s >= TRACE_PASS ? 'Kabul edilir. Kıvrımları biraz daha takip edin.'
          : 'Henüz yetmedi. Soluk harfin tam üzerinden geçin; noktaları da unutmayın.';
        if (ctx.onChange) ctx.onChange();
      } });
      bUndo.addEventListener('click', function () { pad.undo(); });
      bClr .addEventListener('click', function () { pad.clear(); });
      bHint.addEventListener('click', function () { pad.hint(); });
    });

    return {
      el: box,
      ready: function () { return score > 0; },
      destroy: function () { if (pad) pad.destroy(); },
      check: function () {
        var ok = score >= TRACE_PASS;
        var s2 = Store.state;
        if (score > s2.stats.bestWrite) { s2.stats.bestWrite = score; Store.save(); }
        return { ok:ok, right: ex.ch, rightOtt:true,
                 explain:'Puanınız: ' + score + '/100 (geçme ' + TRACE_PASS + ')' };
      }
    };
  },

  /* ══ 12. Okuma parçası ══ */
  t_read: function (ex, ctx) {
    var P = ex.P, box = el('div');
    box.appendChild(el('p', { class:'eyebrow', text: P.kind }));
    box.appendChild(el('h1', { style:'margin:10px 0 6px', text: P.title }));
    box.appendChild(el('p', { class:'muted', style:'font-size:13.5px', text: P.intro }));

    var bar = el('div', { class:'btn-row', style:'margin:16px 0' });
    var showLat = Store.get('showTranslit');
    var bLat = el('button', { class:'btn ghost sm' + (showLat ? ' on' : ''), type:'button' });
    bLat.innerHTML = ic('eye') + '<span>Okunuş</span>';
    var bTr = el('button', { class:'btn ghost sm', type:'button' });
    bTr.innerHTML = ic('book') + '<span>Bugünkü Türkçesi</span>';
    var bAll = el('button', { class:'btn ghost sm', type:'button' });
    bAll.innerHTML = ic('play') + '<span>Baştan sona dinle</span>';
    bar.appendChild(bLat); bar.appendChild(bTr); bar.appendChild(bAll);
    box.appendChild(bar);

    var body = el('div', { class:'levha' });
    var lat = showLat, tr = false;
    var lineEls = [];
    P.lines.forEach(function (L, li) {
      var w = el('div', { class:'reader-line' });
      var r = el('div', { class:'reader' });
      L.tok.forEach(function (t, ti) {
        var sp = el('span', { class:'rw', tabindex:'0', role:'button', 'aria-label': t[0] + ' — ' + t[2], text: t[0] });
        var openGloss = function (e) {
          e.preventDefault();
          sp.classList.add('seen');
          Ex.gloss(sp, t);
          say(t[1]);
        };
        sp.addEventListener('click', openGloss);
        sp.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') openGloss(e); });
        r.appendChild(sp);
        if (ti < L.tok.length - 1) r.appendChild(document.createTextNode(' '));
      });
      var la = el('div', { class:'reader-lat', text: L.tok.map(function (t) { return t[1]; }).join(' ') });
      var tt = el('div', { class:'reader-tr', text: L.tr });
      w.appendChild(r); w.appendChild(la); w.appendChild(tt);
      var pl = el('button', { class:'iconbtn', type:'button', style:'margin-top:6px', 'aria-label':'Bu satırı dinle',
        onclick: function () { say(L.tok.map(function (t) { return t[1]; }).join(' ')); } });
      pl.innerHTML = ic('sound');
      w.appendChild(pl);
      body.appendChild(w);
      lineEls.push({ la:la, tt:tt, L:L });
    });
    box.appendChild(body);

    function sync () {
      lineEls.forEach(function (x) { x.la.style.display = lat ? '' : 'none'; x.tt.style.display = tr ? '' : 'none'; });
      bLat.classList.toggle('on', lat); bTr.classList.toggle('on', tr);
    }
    bLat.addEventListener('click', function () { lat = !lat; sync(); });
    bTr .addEventListener('click', function () { tr = !tr; sync(); });
    bAll.addEventListener('click', function () {
      var i = 0;
      (function next () {
        if (i >= P.lines.length) return;
        var txt = P.lines[i].tok.map(function (t) { return t[1]; }).join(' ');
        i++;
        Speech.speak(txt, { onend: next });
      })();
    });
    sync();

    box.appendChild(el('p', { class:'muted', style:'margin-top:14px;font-size:12.5px',
      text:'Kelimelere dokunarak anlamlarını görebilirsiniz.' }));

    Store.markRead(P.id);
    return { el: box, ready: function () { return true; }, cta:'Sorulara geç',
             check: function () { return { ok:true, silent:true }; }, noGrade:true,
             destroy: function () { Ex.closeGloss(); } };
  },

  /* kelime baloncuğu */
  gloss: function (anchor, t) {
    this.closeGloss();
    var g = el('div', { class:'gloss' });
    g.appendChild(el('span', { class:'go', text:t[0] }));
    g.appendChild(el('div', { class:'gt', text:t[1] }));
    g.appendChild(el('div', { class:'gm', text:t[2] }));
    document.body.appendChild(g);
    var r = anchor.getBoundingClientRect(), gr = g.getBoundingClientRect();
    var left = Math.min(window.innerWidth - gr.width - 10, Math.max(10, r.left + r.width/2 - gr.width/2));
    var top = r.top - gr.height - 10;
    if (top < 10) top = r.bottom + 10;
    g.style.left = left + 'px'; g.style.top = top + 'px';
    this._gloss = g;

    /* Baloncuk kendiliğinden kaybolmaz — okuyucu istediği kadar bakabilir.
       Başka bir yere dokununca, kaydırınca veya Esc ile kapanır. */
    var scroller = anchor.closest('.lesson-body') || document.getElementById('view');
    var close = function (e) {
      if (e && e.type === 'pointerdown' && (g.contains(e.target) || anchor.contains(e.target))) return;
      Ex.closeGloss();
    };
    this._glossOff = function () {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', esc);
      if (scroller) scroller.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
    };
    var esc = function (e) { if (e.key === 'Escape') { Ex.closeGloss(); e.stopPropagation(); } };
    setTimeout(function () {
      document.addEventListener('pointerdown', close);
      document.addEventListener('keydown', esc);
      if (scroller) scroller.addEventListener('scroll', close, { passive:true });
      window.addEventListener('resize', close);
    }, 30);
  },
  closeGloss: function () {
    if (this._glossOff) { this._glossOff(); this._glossOff = null; }
    if (this._gloss && this._gloss.parentNode) this._gloss.parentNode.removeChild(this._gloss);
    this._gloss = null;
  }
};
