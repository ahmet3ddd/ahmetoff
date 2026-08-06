/* ══ Uygulama kabuğu: yönlendirme, çerçeve, kısayollar ══ */

var NAV = [
  { id:'home',     t:'Öğren',   ic:'route',  tab:1 },
  { id:'practice', t:'Tekrar',  ic:'review', tab:1, badge:'due' },
  { id:'alphabet', t:'Elifbâ',  ic:'grid',   tab:1 },
  { id:'dict',     t:'Sözlük',  ic:'search', tab:1 },
  { id:'library',  t:'Okuma',   ic:'book' },
  { id:'tools',    t:'Araçlar', ic:'abacus' },
  { id:'write',    t:'Yazı tahtası', ic:'pen' },
  { id:'profile',  t:'Profil',  ic:'user' }
];

/* Osmanlıca yüzler — hepsi uygulamayla birlikte gömülü gelir (assets/css/fonts.css).
   k: her yüzün göz boyutunu eşitleyen çarpan.                                        */
var FONTS = {
  nesih:  { f:'"Elifba Nesih","Noto Naskh Arabic","Traditional Arabic","Segoe UI",serif', k:1,
            t:'Nesih', d:'Kitap ve belge yazısı — en okunaklısı' },
  hat:    { f:'"Elifba Hat",Amiri,"Arabic Typesetting","Elifba Nesih",serif', k:1.3,
            t:'Hat', d:'Osmanlı matbaa nesihi — klasik görünüm' },
  modern: { f:'"Elifba Modern","Noto Sans Arabic","Segoe UI",sans-serif', k:0.93,
            t:'Modern', d:'Düz ve keskin — küçük boyda net' }
};

var App = {
  route: 'home',
  params: null,
  _cleanup: null,

  /* ───────── başlangıç ───────── */
  init: function () {
    var s = Store.state;
    Store.checkStreak();
    Store.syncHearts();
    if (s.settings.ttsVoice) setTimeout(function () { Speech.setVoice(s.settings.ttsVoice); }, 400);

    this.applyTheme();
    this.setMode(s.settings.mode || 'full', true);
    this.bindStage();
    this.observeLayout();
    this.bindKeys();

    this.renderChrome();
    this.go('home');

    /* kalp sayacı */
    var self = this;
    setInterval(function () {
      var before = Store.state.hearts;
      Store.syncHearts();
      if (Store.state.hearts !== before) self.renderChrome();
    }, 20000);

    /* ilk açılış tanıtımı */
    if (!s.lastDay && !Object.keys(s.progress).length) setTimeout(function () { self.welcome(); }, 500);

    document.addEventListener('pointerdown', function once () {
      Sound.unlock(); document.removeEventListener('pointerdown', once);
    });
  },

  /* ───────── tema & yazı ───────── */
  applyTheme: function () {
    var s = Store.state, r = document.documentElement;
    r.setAttribute('data-theme', s.settings.theme === 'paper' ? 'paper' : 'night');
    r.setAttribute('data-contrast', s.settings.contrast === 'high' ? 'high' : 'normal');
    r.setAttribute('data-motion', s.settings.motion === false ? 'off' : 'on');
    var F = FONTS[s.settings.font] || FONTS.nesih;
    r.style.setProperty('--f-ott', F.f);
    r.style.setProperty('--ott-scale', (s.settings.ottScale || 1) * F.k);
    var meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.setAttribute('content', s.settings.theme === 'paper' ? '#E9DEC6' : '#0E1526');
  },

  /* ───────── cihaz çerçevesi ───────── */
  setMode: function (mode, silent) {
    var stage = document.getElementById('stage');
    stage.setAttribute('data-mode', mode);
    Store.set('mode', mode);
    Array.prototype.forEach.call(document.querySelectorAll('[data-mode-btn]'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-mode-btn') === mode));
    });
    /* Ayarlar ekranı açıksa oradaki seçim de aynı kalsın */
    Array.prototype.forEach.call(document.querySelectorAll('[data-seg="mode"] button'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-val') === mode));
    });
    this.fitDevice();
    if (!silent) Sound.swipe();
  },
  fitDevice: function () {
    var stage = document.getElementById('stage'), mode = stage.getAttribute('data-mode');
    var frame = document.getElementById('device-frame'), dev = document.getElementById('device');
    if (mode === 'full') {
      frame.style.transform = ''; dev.style.width = ''; dev.style.height = '';
      this.applyLayout(); return;
    }
    var W = mode === 'phone' ? 392 : 834, H = mode === 'phone' ? 844 : 1050;
    var barH = document.getElementById('stage-bar').offsetHeight || 56;
    var availH = window.innerHeight - barH - 28;
    var availW = window.innerWidth - 36;
    var sc = Math.min(1, availW / W, availH / H);
    frame.style.transform = 'scale(' + sc + ')';
    dev.style.width = Math.round(W * sc) + 'px';
    dev.style.height = Math.round(H * sc) + 'px';
    this.applyLayout();
  },
  bindStage: function () {
    var self = this;
    Array.prototype.forEach.call(document.querySelectorAll('[data-mode-btn]'), function (b) {
      b.addEventListener('click', function () { self.setMode(b.getAttribute('data-mode-btn')); });
    });
    window.addEventListener('resize', function () { self.fitDevice(); });
  },

  /* ───────── düzen ─────────
     Düzen medya sorgusuyla değil, kabuğun kendi genişliğiyle belirlenir;
     böylece telefon çerçevesi içindeki uygulama da gerçek mobil düzeni alır. */
  applyLayout: function () {
    var shell = document.getElementById('shell');
    var w = shell.clientWidth;
    var mode = w < 720 ? 'mobile' : w < 1080 ? 'tablet' : 'desktop';
    if (shell.getAttribute('data-layout') !== mode) {
      shell.setAttribute('data-layout', mode);
      this.renderChrome();
    }
  },
  observeLayout: function () {
    var shell = document.getElementById('shell');
    var apply = function () { App.applyLayout(); };
    if (window.ResizeObserver) new ResizeObserver(apply).observe(shell);
    window.addEventListener('resize', apply);
    apply();
  },

  /* ───────── yönlendirme ───────── */
  go: function (route, params) {
    if (Lesson.active) Lesson.teardown();
    document.getElementById('shell').classList.remove('in-lesson');
    this.route = route; this.params = params || null;
    this.render();
    this.renderChrome();
    var v = document.getElementById('view');
    v.scrollTop = 0;
    v.focus({ preventScroll:true });
    Sound.swipe();
  },

  render: function () {
    if (this._cleanup) { try { this._cleanup(); } catch (e) {} this._cleanup = null; }
    var view = document.getElementById('view');
    var fn = Screens[this.route];
    view.innerHTML = '';
    if (!fn) { view.appendChild(el('div', { class:'empty', text:'Sayfa bulunamadı' })); return; }
    var node = fn.call(Screens, this.params);
    if (node._cleanup) this._cleanup = node._cleanup;
    view.appendChild(node);
  },

  /* ───────── kabuk (menü, üst şerit, sağ sütun) ───────── */
  renderChrome: function () {
    var s = Store.state, layout = document.getElementById('shell').getAttribute('data-layout');
    var due = SRS.dueCount(s);

    /* sol menü */
    var nav = document.getElementById('side-nav');
    nav.innerHTML = '';
    NAV.forEach(function (n) {
      var b = el('button', { class:'side-link', type:'button', title:n.t,
        'aria-current': App.route === n.id ? 'page' : null });
      b.innerHTML = ic(n.ic);
      b.appendChild(el('span', { text:n.t }));
      if (n.badge === 'due' && due) b.appendChild(el('span', { class:'badge', text:String(due) }));
      b.addEventListener('click', function () { App.go(n.id); });
      nav.appendChild(b);
    });
    var setBtn = document.querySelector('[data-nav="settings"]');
    if (setBtn) {
      setBtn.setAttribute('aria-current', App.route === 'settings' ? 'page' : '');
      if (!setBtn._b) { setBtn._b = 1; setBtn.addEventListener('click', function () { App.go('settings'); }); }
    }

    /* mobil üst şerit */
    var hud = document.getElementById('hud');
    hud.innerHTML = '';
    var mk = function (cls, icon, val) {
      var d = el('div', { class:'hud-stat ' + cls });
      d.innerHTML = ic(icon) + '<span>' + val + '</span>';
      return d;
    };
    hud.appendChild(mk('streak', 'flame', s.streak));
    hud.appendChild(mk('gem', 'gem', s.gems));
    if (s.settings.useHearts) hud.appendChild(mk('heart', 'heart', s.hearts));
    else hud.appendChild(el('span', { class:'chip fir', text:'∞' }));
    hud.appendChild(el('div', { class:'hud-spacer' }));
    var ring = el('div', { class:'score-ring', style:'--p:' + Store.goalPct() + ';width:34px;height:34px' });
    ring.appendChild(el('b', { text:Store.todayXp(), style:'font-size:11px' }));
    ring.title = 'Bugün ' + Store.todayXp() + ' / ' + s.dailyGoal + ' XP';
    hud.appendChild(ring);

    /* mobil alt menü */
    var tabs = document.getElementById('tabbar');
    tabs.innerHTML = '';
    NAV.filter(function (n) { return n.tab; }).forEach(function (n) {
      var b = el('button', { class:'tab', type:'button', 'aria-current': App.route === n.id ? 'page' : null });
      b.innerHTML = ic(n.ic);
      b.appendChild(el('span', { text:n.t }));
      if (n.badge === 'due' && due) b.appendChild(el('span', { class:'badge', text:String(due) }));
      b.addEventListener('click', function () { App.go(n.id); });
      tabs.appendChild(b);
    });
    var more = el('button', { class:'tab', type:'button',
      'aria-current': ['library','tools','write','profile','settings'].indexOf(App.route) > -1 ? 'page' : null });
    more.innerHTML = ic('grid');
    more.querySelector('svg').style.transform = 'rotate(45deg)';
    more.appendChild(el('span', { text:'Daha' }));
    more.addEventListener('click', function () { App.moreMenu(); });
    tabs.appendChild(more);

    /* sağ sütun */
    if (layout === 'desktop') this.renderRail();
  },

  renderRail: function () {
    var s = Store.state, rail = document.getElementById('rail');
    rail.innerHTML = '';

    var c1 = el('div', { class:'card' });
    c1.appendChild(el('div', { class:'card-h' }, [icEl('target'), el('h3', { text:'Günlük hedef' })]));
    var ring = el('div', { style:'display:flex;align-items:center;gap:14px' });
    var r = el('div', { class:'score-ring', style:'--p:' + Store.goalPct() + ';width:64px;height:64px' });
    r.appendChild(el('b', { text:'%' + Store.goalPct() }));
    ring.appendChild(r);
    var rt = el('div');
    rt.appendChild(el('b', { style:'font-family:var(--f-mono);font-size:19px;color:var(--gold-2)', text:Store.todayXp() + ' XP' }));
    rt.appendChild(el('div', { class:'muted', style:'font-size:12.5px', text:'Hedef: ' + s.dailyGoal + ' XP' }));
    ring.appendChild(rt);
    c1.appendChild(ring);
    rail.appendChild(c1);

    var c2 = el('div', { class:'card' });
    var row = el('div', { style:'display:flex;gap:10px' });
    [['flame', s.streak, 'Gün seri', 'var(--gold-2)'], ['gem', s.gems, 'Elmas', 'var(--firuze-2)'],
     ['heart', s.settings.useHearts ? s.hearts : '∞', 'Kalp', 'var(--bole-2)']].forEach(function (p) {
      var b = el('div', { style:'flex:1;text-align:center' });
      var i = el('div', { style:'color:' + p[3] }); i.innerHTML = ic(p[0]);
      i.querySelector('svg').style.width = '20px'; i.querySelector('svg').style.height = '20px';
      b.appendChild(i);
      b.appendChild(el('div', { style:'font-family:var(--f-mono);font-size:18px;color:' + p[3], text:String(p[1]) }));
      b.appendChild(el('div', { style:'font-size:10.5px;color:var(--ink-3)', text:p[2] }));
      row.appendChild(b);
    });
    c2.appendChild(row);
    if (s.settings.useHearts && s.hearts < Store.HEART_MAX) {
      var ms = Store.heartIn();
      c2.appendChild(el('p', { class:'muted', style:'text-align:center;font-size:11.5px;margin:10px 0 0',
        text:'Yeni kalp ' + Math.ceil(ms/60000) + ' dk sonra' }));
    }
    rail.appendChild(c2);

    var due = SRS.dueCount(s);
    var c3 = el('div', { class:'card' });
    c3.appendChild(el('div', { class:'card-h' }, [icEl('review'), el('h3', { text:'Tekrar' })]));
    c3.appendChild(el('p', { class:'muted', style:'font-size:13px',
      text: due ? due + ' madde tekrar vaktinde. Beş dakikanızı alır.' : 'Vadesi gelen madde yok. Yeni ders açabilirsiniz.' }));
    var b3 = el('button', { class:'btn ' + (due ? 'primary' : 'ghost') + ' sm wide', type:'button', style:'margin-top:10px',
      onclick: function () { due ? Lesson.custom(Curriculum.reviewSession(s, 14), { title:'Aralıklı tekrar', xp:15 }) : App.go('practice'); } });
    b3.innerHTML = '<span>' + (due ? 'Tekrara başla' : 'Atölyeler') + '</span>';
    c3.appendChild(b3);
    rail.appendChild(c3);

    var tip = TIPS[(new Date().getDate() + new Date().getMonth()) % TIPS.length];
    var c4 = el('div', { class:'card' });
    c4.appendChild(el('div', { class:'card-h' }, [icEl('sparkle'), el('h3', { text:'Günün notu' })]));
    c4.appendChild(el('p', { style:'font-size:13.5px;margin:0', text:tip }));
    rail.appendChild(c4);
  },

  /* ───────── "daha" menüsü ───────── */
  moreMenu: function () {
    var m = el('div');
    m.appendChild(el('h2', { text:'Diğer bölümler', style:'margin-bottom:14px' }));
    NAV.filter(function (n) { return !n.tab; }).concat([{ id:'settings', t:'Ayarlar', ic:'gear' }]).forEach(function (n) {
      var b = el('button', { class:'side-link', type:'button', style:'background:var(--panel-2);margin-bottom:8px' });
      b.innerHTML = ic(n.ic);
      b.appendChild(el('span', { text:n.t }));
      b.appendChild(el('span', { style:'margin-inline-start:auto', html:'' }));
      b.addEventListener('click', function () { App.closeModal(); App.go(n.id); });
      m.appendChild(b);
    });
    this.modal(m);
  },

  /* ───────── modal / toast ───────── */
  modal: function (content, opts) {
    opts = opts || {};
    this.closeModal();
    var mask = el('div', { class:'mask' });
    var box = el('div', { class:'modal', role:'dialog', 'aria-modal':'true' });
    if (!opts.noClose) {
      var x = el('button', { class:'iconbtn', type:'button', style:'position:absolute;top:14px;inset-inline-end:14px',
        'aria-label':'Kapat', onclick: function () { App.closeModal(); } });
      x.innerHTML = ic('x');
      box.style.position = 'relative';
      box.appendChild(x);
    }
    box.appendChild(content);
    mask.appendChild(box);
    if (!opts.noClose) mask.addEventListener('click', function (e) { if (e.target === mask) App.closeModal(); });
    document.getElementById('modal-root').appendChild(mask);
    this._modal = mask;
    this._modalNoClose = !!opts.noClose;
    setTimeout(function () {
      var f = box.querySelector('button:not([aria-label="Kapat"]), input, select');
      if (f) f.focus();
    }, 60);
  },
  closeModal: function () {
    var r = document.getElementById('modal-root');
    r.innerHTML = '';
    this._modal = null; this._modalNoClose = false;
  },
  confirm: function (title, body, onYes) {
    var m = el('div');
    m.appendChild(el('h2', { text:title }));
    m.appendChild(el('p', { class:'muted', text:body }));
    var br = el('div', { class:'btn-row' });
    var y = el('button', { class:'btn danger', type:'button', text:'Evet', onclick: function () { App.closeModal(); onYes(); } });
    var n = el('button', { class:'btn ghost', type:'button', text:'Vazgeç', onclick: function () { App.closeModal(); } });
    br.appendChild(y); br.appendChild(n);
    m.appendChild(br);
    this.modal(m);
  },
  toast: function (msg, icon) {
    var t = el('div', { class:'toast' });
    if (icon) t.innerHTML = ic(icon);
    t.appendChild(el('span', { text:msg }));
    document.getElementById('toast-root').appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; t.style.transition = '.3s'; }, 2200);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2600);
  },
  announce: function (msg) {
    var n = document.getElementById('sr-live');
    n.textContent = ''; setTimeout(function () { n.textContent = msg; }, 40);
  },
  checkAch: function () {
    var fresh = Store.checkAchievements();
    fresh.forEach(function (a) { App.toast('Yeni rozet: ' + a.t, 'trophy'); });
    return fresh;
  },

  confetti: function () {
    if (Store.get('motion') === false) return;
    var c = el('div', { class:'confetti' });
    var cols = ['#D9A441','#2FBFA8','#D0503A','#3D6FD1','#F0C978'];
    for (var i = 0; i < 60; i++) {
      var p = el('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.top = '-20px';
      p.style.background = cols[i % cols.length];
      p.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
      p.style.animationDelay = (Math.random() * 0.5) + 's';
      p.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
      c.appendChild(p);
    }
    document.body.appendChild(c);
    setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 3600);
  },

  /* ───────── karşılama ───────── */
  welcome: function () {
    var m = el('div', { style:'text-align:center' });
    m.appendChild(el('div', { class:'ott', text:'الفبا', style:'font-size:calc(58px * var(--ott-scale));color:var(--gold);line-height:1.4' }));
    m.appendChild(el('h2', { text:'Osmanlıcaya hoş geldiniz' }));
    m.appendChild(el('p', { class:'muted', style:'text-align:start;margin-top:12px',
      text:'Otuz üç harfle başlayacağız. Her ders beş dakika sürer; okuma, yazma, dinleme ve telaffuz birlikte ilerler.' }));
    m.appendChild(el('p', { class:'eyebrow', style:'margin:18px 0 10px', text:'Günlük hedefiniz' }));
    var seg = el('div', { class:'seg', style:'width:100%' });
    var chosen = 30;
    [[10,'Rahat'],[30,'Normal'],[50,'Ciddi'],[100,'Yoğun']].forEach(function (p) {
      var b = el('button', { type:'button', style:'flex:1', 'aria-pressed':String(p[0] === 30) });
      b.appendChild(el('div', { text:p[1] }));
      b.appendChild(el('div', { style:'font-family:var(--f-mono);font-size:11px;opacity:.7', text:p[0] + ' XP' }));
      b.addEventListener('click', function () {
        chosen = p[0];
        Array.prototype.forEach.call(seg.children, function (x) { x.setAttribute('aria-pressed','false'); });
        b.setAttribute('aria-pressed','true');
      });
      seg.appendChild(b);
    });
    m.appendChild(seg);
    var go = el('button', { class:'btn gold wide', style:'margin-top:20px', type:'button' });
    go.innerHTML = ic('play') + '<span>İlk derse başla</span>';
    go.addEventListener('click', function () {
      var s = Store.state; s.dailyGoal = chosen; Store.save();
      App.closeModal(); App.renderChrome();
      Lesson.start(Curriculum.allLessons()[0].l.id);
    });
    m.appendChild(go);
    var skip = el('button', { class:'btn ghost wide', style:'margin-top:8px', type:'button', text:'Önce keşfedeyim',
      onclick: function () { var s = Store.state; s.dailyGoal = chosen; Store.save(); App.closeModal(); App.renderChrome(); } });
    m.appendChild(skip);
    this.modal(m, { noClose:true });
  },

  /* ───────── kısayollar ───────── */
  shortcuts: function () {
    var m = el('div');
    m.appendChild(el('h2', { text:'Klavye kısayolları' }));
    var dl = el('dl', { class:'kv', style:'margin-top:14px' });
    [['1 – 4', 'Şık seçme'], ['Enter', 'Kontrol et / Devam'], ['Boşluk', 'Sesi tekrar çal'],
     ['Esc', 'Dersten çık / pencereyi kapat'], ['?', 'Bu pencere'],
     ['G', 'Öğren'], ['T', 'Tekrar'], ['E', 'Elifbâ'], ['S', 'Sözlük'], ['P', 'Profil']].forEach(function (p) {
      dl.appendChild(el('dt', { html:'<kbd style="font-family:var(--f-mono);background:var(--panel-2);border:1px solid var(--line);border-radius:5px;padding:1px 6px">' + p[0] + '</kbd>' }));
      dl.appendChild(el('dd', { text:p[1] }));
    });
    m.appendChild(dl);
    this.modal(m);
  },

  bindKeys: function () {
    document.addEventListener('keydown', function (e) {
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      var typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (e.key === 'Escape') {
        if (App._modal) { if (!App._modalNoClose) App.closeModal(); e.preventDefault(); return; }
      }
      if (App._modal) return;

      if (Lesson.active || Lesson._cont) {
        if (typing && e.key !== 'Enter' && e.key !== 'Escape') return;
        if (Lesson.key(e)) return;
        if (e.key === ' ' && !typing) {
          var A = Lesson.active;
          if (A && A.cur && A.cur.replay) { A.cur.replay(); e.preventDefault(); return; }
          var ex = A && A.queue[A.i];
          if (ex && ex.say) { say(ex.say); e.preventDefault(); }
        }
        return;
      }
      if (typing) return;

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) { App.shortcuts(); e.preventDefault(); return; }
      var map = { g:'home', t:'practice', e:'alphabet', s:'dict', o:'library', a:'tools', y:'write', p:'profile' };
      var k = e.key.toLocaleLowerCase('tr');
      if (map[k] && !e.ctrlKey && !e.metaKey && !e.altKey) { App.go(map[k]); e.preventDefault(); }
    });
  }
};

/* başlat */
document.addEventListener('DOMContentLoaded', function () {
  try { App.init(); }
  catch (err) {
    document.getElementById('view').innerHTML =
      '<div class="wrap"><div class="card"><h2>Uygulama başlatılamadı</h2><p class="muted">' +
      (err && err.message ? err.message : err) + '</p></div></div>';
    if (window.console) console.error(err);
  }
});
