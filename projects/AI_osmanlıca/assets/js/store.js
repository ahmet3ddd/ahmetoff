/* ══ Kalıcı durum: ilerleme, kalpler, seri, ayarlar ══ */

var Store = (function () {
  var KEY = 'elifba.v1';
  var HEART_MS = 25 * 60 * 1000;   // bir kalp 25 dakikada dolar
  var HEART_MAX = 5;
  var mem = null;                  // localStorage yoksa bellekte tut

  function today () {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
  }
  function pad (n) { return n < 10 ? '0'+n : ''+n; }
  function dayDiff (a, b) {
    if (!a || !b) return 999;
    return Math.round((new Date(b) - new Date(a)) / 86400000);
  }

  function fresh () {
    return {
      v: 1, created: today(),
      xp: 0, gems: 15, hearts: HEART_MAX, heartAt: Date.now(),
      streak: 0, streakBest: 0, lastDay: null, days: {},
      dailyGoal: 30,
      progress: {}, srs: {}, mistakes: [], ach: {}, readDone: {},
      stats: { lessons:0, perfect:0, answers:0, correct:0, byType:{}, bestWrite:0, ebced:0, seconds:0 },
      settings: {
        theme:'night', contrast:'normal', sound:true, motion:true,
        ttsRate:0.9, ttsVoice:'', font:'nesih', ottScale:1,
        useHearts:true, freeRoam:false, showTranslit:true, mode:'full', keyHints:true
      }
    };
  }

  function read () {
    if (mem) return mem;
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { /* file:// kısıtı */ }
    var s;
    if (raw) { try { s = JSON.parse(raw); } catch (e) { s = null; } }
    if (!s || s.v !== 1) s = fresh();
    var f = fresh();
    for (var k in f) if (!(k in s)) s[k] = f[k];
    for (var k2 in f.settings) if (!(k2 in s.settings)) s.settings[k2] = f.settings[k2];
    for (var k3 in f.stats) if (!(k3 in s.stats)) s.stats[k3] = f.stats[k3];
    mem = s;
    return s;
  }

  /* Bazı tarayıcılar dosyadan (file://) açılan sayfalarda depolamayı kapatır.
     O durumda uygulama bellekte çalışmaya devam eder, ilerleme sekme
     kapanınca kaybolur — kullanıcıya Ayarlar'da bildirilir.               */
  var persistent = null;
  function canPersist () {
    if (persistent !== null) return persistent;
    try {
      localStorage.setItem(KEY + '.t', '1');
      localStorage.removeItem(KEY + '.t');
      persistent = true;
    } catch (e) { persistent = false; }
    return persistent;
  }

  function write () {
    if (!canPersist()) return;
    try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { persistent = false; }
  }

  var api = {
    HEART_MAX: HEART_MAX,
    HEART_MS: HEART_MS,
    today: today,
    dayDiff: dayDiff,

    get persistent () { return canPersist(); },
    get state () { return read(); },
    save: function () { write(); return mem; },
    reset: function () { mem = fresh(); write(); return mem; },

    /* ── kalpler ── */
    syncHearts: function () {
      var s = read();
      if (!s.settings.useHearts) { s.hearts = HEART_MAX; return s.hearts; }
      if (s.hearts >= HEART_MAX) { s.heartAt = Date.now(); return s.hearts; }
      var gained = Math.floor((Date.now() - s.heartAt) / HEART_MS);
      if (gained > 0) {
        s.hearts = Math.min(HEART_MAX, s.hearts + gained);
        s.heartAt = s.hearts >= HEART_MAX ? Date.now() : s.heartAt + gained * HEART_MS;
        write();
      }
      return s.hearts;
    },
    heartIn: function () {
      var s = read();
      if (s.hearts >= HEART_MAX) return 0;
      return Math.max(0, HEART_MS - (Date.now() - s.heartAt));
    },
    loseHeart: function () {
      var s = read();
      if (!s.settings.useHearts) return s.hearts;
      if (s.hearts === HEART_MAX) s.heartAt = Date.now();
      s.hearts = Math.max(0, s.hearts - 1);
      write();
      return s.hearts;
    },
    refillHearts: function (cost) {
      var s = read();
      if (s.gems < cost) return false;
      s.gems -= cost; s.hearts = HEART_MAX; s.heartAt = Date.now();
      write(); return true;
    },

    /* ── XP, seri, gün ── */
    addXp: function (n) {
      var s = read(), d = today();
      s.xp += n;
      s.days[d] = (s.days[d] || 0) + n;
      if (s.lastDay !== d) {
        var diff = dayDiff(s.lastDay, d);
        s.streak = (diff === 1) ? s.streak + 1 : 1;
        s.lastDay = d;
        if (s.streak > s.streakBest) s.streakBest = s.streak;
      }
      write();
      return s.xp;
    },
    addGems: function (n) { var s = read(); s.gems += n; write(); return s.gems; },
    /* Seri kopmuşsa sıfırla — uygulama açılışında çağrılır */
    checkStreak: function () {
      var s = read();
      if (!s.lastDay) return;
      var diff = dayDiff(s.lastDay, today());
      if (diff > 1) { s.streak = 0; write(); }
    },
    todayXp: function () { return read().days[today()] || 0; },
    goalPct: function () { var s = read(); return Math.min(100, Math.round(this.todayXp() / s.dailyGoal * 100)); },

    /* ── ders ilerlemesi ── */
    finishLesson: function (id, res) {
      var s = read(), p = s.progress[id] || { done:false, stars:0, times:0, best:0 };
      p.times++;
      p.done = true;
      p.best = Math.max(p.best, res.pct);
      p.stars = Math.max(p.stars, res.pct >= 100 ? 3 : res.pct >= 80 ? 2 : 1);
      s.progress[id] = p;
      s.stats.lessons++;
      if (res.wrong === 0) s.stats.perfect++;
      s.stats.seconds += res.seconds || 0;
      write();
      return p;
    },
    markRead: function (pid) { var s = read(); s.readDone[pid] = today(); write(); },

    /* ── cevap kaydı ── */
    logAnswer: function (type, ok, key) {
      var s = read();
      s.stats.answers++;
      if (ok) {
        s.stats.correct++;
        s.stats.byType[type] = (s.stats.byType[type] || 0) + 1;
        if (key) { var i = s.mistakes.indexOf(key); if (i > -1) s.mistakes.splice(i, 1); }
      } else if (key && s.mistakes.indexOf(key) === -1) {
        s.mistakes.unshift(key);
        if (s.mistakes.length > 60) s.mistakes.pop();
      }
      write();
    },
    accuracy: function () { var s = read(); return s.stats.answers ? Math.round(s.stats.correct / s.stats.answers * 100) : 0; },

    /* ── rozetler ── */
    checkAchievements: function () {
      var s = read(), fresh = [];
      ACHIEVEMENTS.forEach(function (a) {
        if (s.ach[a.id]) return;
        var ok = false;
        try { ok = a.chk(s); } catch (e) { ok = false; }
        if (ok) { s.ach[a.id] = today(); fresh.push(a); }
      });
      if (fresh.length) write();
      return fresh;
    },

    /* ── ayarlar ── */
    set: function (k, v) { var s = read(); s.settings[k] = v; write(); return v; },
    get: function (k) { return read().settings[k]; },

    /* ── dışa / içe aktarma ── */
    exportJSON: function () { return JSON.stringify(read(), null, 2); },
    importJSON: function (txt) {
      try {
        var o = JSON.parse(txt);
        if (!o || typeof o !== 'object' || o.v !== 1) return false;
        mem = o; write(); return true;
      } catch (e) { return false; }
    }
  };
  return api;
})();
