/* ══ Yazı tahtası ══
   Hedef harf gizli bir maskeye çizilir; kullanıcının mürekkebi bu maskeyle
   piksel bazında karşılaştırılarak "kapsama" ve "isabet" puanı hesaplanır.  */

var Writing = (function () {
  var CELL = 5;          // ızgara hücresi (px)
  var TOL  = 4;          // hoşgörü yarıçapı (hücre)

  function ottFont () {
    var f = getComputedStyle(document.documentElement).getPropertyValue('--f-ott');
    return (f || '').trim() || 'serif';
  }

  /* boolean ızgara üret */
  function gridFrom (imgData, w, h, alphaMin) {
    var gw = Math.ceil(w / CELL), gh = Math.ceil(h / CELL);
    var g = new Uint8Array(gw * gh), d = imgData.data;
    for (var y = 0; y < h; y++) {
      var gy = (y / CELL) | 0;
      for (var x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > alphaMin) g[gy * gw + ((x / CELL) | 0)] = 1;
      }
    }
    return { g:g, w:gw, h:gh };
  }

  /* kutu genişletme (dilate) */
  function dilate (G, r) {
    var out = new Uint8Array(G.g.length), w = G.w, h = G.h;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      if (!G.g[y * w + x]) continue;
      for (var dy = -r; dy <= r; dy++) {
        var ny = y + dy; if (ny < 0 || ny >= h) continue;
        for (var dx = -r; dx <= r; dx++) {
          var nx = x + dx; if (nx < 0 || nx >= w) continue;
          if (dx*dx + dy*dy <= r*r) out[ny * w + nx] = 1;
        }
      }
    }
    return { g:out, w:w, h:h };
  }

  function Pad (host, opts) {
    this.host = host;
    this.ch = opts.ch || 'ب';
    this.onScore = opts.onScore || function () {};
    this.strokes = [];
    this.cur = null;
    this.scored = false;
    this.build();
  }

  Pad.prototype.build = function () {
    var self = this;
    this.host.innerHTML =
      '<div class="pad-wrap">' +
        '<canvas id="pad-guide"></canvas>' +
        '<canvas id="pad-ink"></canvas>' +
      '</div>';
    this.wrap  = this.host.querySelector('.pad-wrap');
    this.guide = this.host.querySelector('#pad-guide');
    this.ink   = this.host.querySelector('#pad-ink');
    this.gctx  = this.guide.getContext('2d');
    this.ictx  = this.ink.getContext('2d', { willReadFrequently:true });

    this.resize();
    this._ro = new ResizeObserver(function () { self.resize(); });
    this._ro.observe(this.wrap);

    var down = function (e) { e.preventDefault(); self.start(e); };
    var move = function (e) { if (self.cur) { e.preventDefault(); self.move(e); } };
    var up   = function () { self.end(); };
    this.ink.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move, { passive:false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    this._off = function () {
      self.ink.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (self._ro) self._ro.disconnect();
    };
  };

  Pad.prototype.resize = function () {
    var w = Math.max(240, this.wrap.clientWidth || 320);
    var h = Math.round(w * 0.46);
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    [this.guide, this.ink].forEach(function (c) {
      c.style.width = w + 'px'; c.style.height = h + 'px';
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    });
    this.W = w; this.H = h; this.dpr = dpr;
    this.gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ictx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ictx.lineCap = 'round'; this.ictx.lineJoin = 'round';
    this.drawGuide();
    this.redraw();
  };

  /* arka plan: satır çizgileri + soluk hedef harf */
  Pad.prototype.drawGuide = function () {
    var c = this.gctx, W = this.W, H = this.H;
    c.clearRect(0, 0, W, H);

    c.strokeStyle = 'rgba(168,117,21,.22)'; c.lineWidth = 1;
    [H*0.22, H*0.5, H*0.78].forEach(function (y, i) {
      c.setLineDash(i === 1 ? [] : [5, 6]);
      c.beginPath(); c.moveTo(12, y); c.lineTo(W-12, y); c.stroke();
    });
    c.setLineDash([]);

    var size = Math.round(H * 0.62);
    c.font = size + 'px ' + ottFont();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = 'rgba(36,28,18,.13)';
    c.direction = 'rtl';
    c.fillText(this.ch, W/2, H*0.5);
    this.glyphSize = size;
  };

  /* hedef harfin maskesi */
  Pad.prototype.mask = function () {
    if (this._mask && this._maskW === this.W) return this._mask;
    var m = document.createElement('canvas');
    m.width = this.W; m.height = this.H;
    var c = m.getContext('2d', { willReadFrequently:true });
    c.font = this.glyphSize + 'px ' + ottFont();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.direction = 'rtl';
    c.fillStyle = '#000';
    c.fillText(this.ch, this.W/2, this.H*0.5);
    this._mask = gridFrom(c.getImageData(0, 0, this.W, this.H), this.W, this.H, 40);
    this._maskW = this.W;
    return this._mask;
  };

  /* Ekran koordinatını tuvalin kendi koordinatına çevirir.
     Tuval bir CSS dönüşümü altındaysa (telefon/tablet çerçevesi) ya da
     tarayıcı yakınlaştırılmışsa getBoundingClientRect ölçeklenmiş ölçü verir;
     bölmezsek kalem imleçten kayar. */
  Pad.prototype.pos = function (e) {
    var r = this.ink.getBoundingClientRect();
    var sx = r.width  ? this.W / r.width  : 1;
    var sy = r.height ? this.H / r.height : 1;
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  };
  Pad.prototype.start = function (e) {
    try { this.ink.setPointerCapture(e.pointerId); } catch (err) {}
    this.cur = [this.pos(e)];
    this.strokes.push(this.cur);
    this.scored = false;
  };
  Pad.prototype.move = function (e) {
    var p = this.pos(e), last = this.cur[this.cur.length - 1];
    if (Math.abs(p.x - last.x) + Math.abs(p.y - last.y) < 1.2) return;
    this.cur.push(p);
    this.redraw();
  };
  Pad.prototype.end = function () {
    if (!this.cur) return;
    this.cur = null;
    this.redraw();
    this.score();
  };

  Pad.prototype.redraw = function () {
    var c = this.ictx, W = this.W, H = this.H;
    c.clearRect(0, 0, W, H);
    c.strokeStyle = '#1B2A4A';
    c.lineWidth = Math.max(9, Math.round(H * 0.055));
    this.strokes.forEach(function (s) {
      if (s.length < 2) {
        if (s.length === 1) { c.beginPath(); c.arc(s[0].x, s[0].y, c.lineWidth/2, 0, 6.284); c.fillStyle = '#1B2A4A'; c.fill(); }
        return;
      }
      c.beginPath(); c.moveTo(s[0].x, s[0].y);
      for (var i = 1; i < s.length - 1; i++) {
        var mx = (s[i].x + s[i+1].x) / 2, my = (s[i].y + s[i+1].y) / 2;
        c.quadraticCurveTo(s[i].x, s[i].y, mx, my);
      }
      c.lineTo(s[s.length-1].x, s[s.length-1].y);
      c.stroke();
    });
  };

  Pad.prototype.score = function () {
    if (!this.strokes.length) { this.onScore(0, { coverage:0, precision:0, empty:true }); return; }
    var M = this.mask();
    /* mürekkep katmanı dpr ölçekli — maskeyle aynı çözünürlükte küçük kopya alınır */
    var tmp = document.createElement('canvas');
    tmp.width = this.W; tmp.height = this.H;
    var t = tmp.getContext('2d', { willReadFrequently:true });
    t.drawImage(this.ink, 0, 0, this.W, this.H);
    var I = gridFrom(t.getImageData(0, 0, this.W, this.H), this.W, this.H, 40);

    var Md = dilate(M, TOL), Id = dilate(I, TOL);
    var gTot = 0, gHit = 0, iTot = 0, iHit = 0;
    for (var k = 0; k < M.g.length; k++) {
      if (M.g[k]) { gTot++; if (Id.g[k]) gHit++; }
      if (I.g[k]) { iTot++; if (Md.g[k]) iHit++; }
    }
    /* kapsama: harfin ne kadarı çizildi · isabet: çizginin ne kadarı harfin üstünde
       İkisinin harmonik ortalaması alınır; böylece tuvali karalayarak kapsamayı
       yükseltmek işe yaramaz — isabet düşünce puan da düşer. */
    var coverage  = gTot ? gHit / gTot : 0;
    var precision = iTot ? iHit / iTot : 0;
    var f1 = (coverage + precision) ? (2 * coverage * precision) / (coverage + precision) : 0;
    var score = Math.round(100 * f1);
    /* iki üç noktalık mürekkep tesadüfen yüksek isabet verebilir — küçültülür */
    if (iTot < gTot * 0.3) score = Math.round(score * (iTot / (gTot * 0.3 || 1)));
    score = Math.max(0, Math.min(100, score));
    this.scored = true;
    this.onScore(score, { coverage:Math.round(coverage*100), precision:Math.round(precision*100) });
    return score;
  };

  Pad.prototype.undo  = function () { this.strokes.pop(); this.redraw(); if (this.strokes.length) this.score(); else this.onScore(0, { empty:true }); };
  Pad.prototype.clear = function () { this.strokes = []; this.redraw(); this.onScore(0, { empty:true }); };

  /* hattat kalemi gibi sağdan sola açılan ipucu */
  Pad.prototype.hint = function () {
    var self = this, c = this.gctx, W = this.W, H = this.H, t0 = null, DUR = 1500;
    var size = this.glyphSize;
    function frame (ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / DUR);
      self.drawGuide();
      c.save();
      c.beginPath();
      c.rect(W - W * p, 0, W * p, H);
      c.clip();
      c.font = size + 'px ' + ottFont();
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'rtl';
      c.fillStyle = 'rgba(168,117,21,.85)';
      c.fillText(self.ch, W/2, H*0.5);
      c.restore();
      if (p < 1) requestAnimationFrame(frame);
      else setTimeout(function () { self.drawGuide(); }, 700);
    }
    requestAnimationFrame(frame);
  };

  Pad.prototype.destroy = function () { if (this._off) this._off(); };

  return {
    create: function (host, opts) { return new Pad(host, opts); }
  };
})();
