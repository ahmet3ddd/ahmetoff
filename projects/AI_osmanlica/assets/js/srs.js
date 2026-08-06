/* ══ Aralıklı tekrar (SM‑2 sadeleştirilmiş) ══
   Anahtar biçimi:  l:ب (harf) · f:ب (harf şekli) · w:كتاب (kelime)
                    k:كتاب (yazım) · s:كتاب (telaffuz) · b:… (cümle)      */

var SRS = {
  day: function () {
    var d = new Date();
    return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
  },

  item: function (state, key) {
    if (!state.srs[key]) state.srs[key] = { e:2.5, i:0, d:this.day(), r:0, l:0 };
    return state.srs[key];
  },

  /* ok = doğru bilindi mi */
  grade: function (state, key, ok) {
    if (!key) return;
    var it = this.item(state, key), d = this.day();
    if (ok) {
      it.r++;
      it.i = it.r === 1 ? 1 : it.r === 2 ? 3 : Math.min(180, Math.round(it.i * it.e));
      it.e = Math.min(2.8, it.e + 0.1);
    } else {
      it.r = 0; it.l++;
      it.i = 0;
      it.e = Math.max(1.3, it.e - 0.22);
    }
    it.d = d + it.i;
    Store.save();
    return it;
  },

  /* Vadesi gelenler — en gecikmişten başlayarak */
  due: function (state, limit) {
    var d = this.day(), keys = [];
    for (var k in state.srs) if (state.srs[k].d <= d) keys.push(k);
    keys.sort(function (a, b) { return state.srs[a].d - state.srs[b].d; });
    return limit ? keys.slice(0, limit) : keys;
  },
  dueCount: function (state) { return this.due(state).length; },

  /* Bir haftadan uzun aralığa ulaşmış maddeler "öğrenilmiş" sayılır */
  knownCount: function (state) {
    var n = 0;
    for (var k in state.srs) if (state.srs[k].i >= 7) n++;
    return n;
  },
  seenCount: function (state) { return Object.keys(state.srs || {}).length; },

  /* Güç dağılımı — istatistik ekranı için */
  strength: function (state) {
    var out = { yeni:0, taze:0, saglam:0, guclu:0 };
    for (var k in state.srs) {
      var i = state.srs[k].i;
      if (i === 0) out.yeni++;
      else if (i < 3) out.taze++;
      else if (i < 21) out.saglam++;
      else out.guclu++;
    }
    return out;
  },

  /* Bir sonraki tekrarın kaç gün sonra olduğunu söyler */
  nextIn: function (state) {
    var d = this.day(), min = null;
    for (var k in state.srs) { var x = state.srs[k].d; if (x > d && (min === null || x < min)) min = x; }
    return min === null ? null : min - d;
  }
};
