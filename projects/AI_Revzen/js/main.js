// Revzen 3D - ana uygulama (global - file:// uyumlu)
(function () {
    'use strict';

    if (typeof THREE === 'undefined') {
        document.body.innerHTML =
            '<div style="padding:24px;color:#fff;font-family:sans-serif">' +
            '<strong>Three.js yüklenemedi.</strong> İlk açılışta internet bağlantısı gerekir (CDN).' +
            '</div>';
        return;
    }

    const Geom = window.RevzenGeom;
    const IO   = window.ProjeIO;

    const DEFAULTS = {
        type: 'tmt',
        en: 120,
        boy: 200,
        kalinlik: 10,
        gozForm: 'daire',
        gozCap: 12,
        oran: Geom.FILGOZU_ORAN,
        oranRef: true,
        gozAra: 4,
        kenar: 6,
        kaydirmaX: 0,
        kaydirmaY: 0,
        dizilim: 'stagger',
        kes: true,
        renkliCam: true,
        derinlik: 12,
        panelDerinlik: 4,
        izgara: true
    };

    // Gecmiste ve proje dosyasinda tutulan alanlar
    const PARAMLAR = Object.keys(DEFAULTS);

    const state = Object.assign({}, DEFAULTS, { result: null, activeView: '2d' });

    const el = {
        radios:    document.querySelectorAll('input[name="revzen-tipi"]'),
        formlar:   document.querySelectorAll('input[name="goz-formu"]'),
        en:        document.getElementById('p-en'),
        boy:       document.getElementById('p-boy'),
        kalinlik:  document.getElementById('p-kalinlik'),
        cap:       document.getElementById('p-cap'),
        lblCap:    document.getElementById('lbl-cap'),
        oran:      document.getElementById('p-oran'),
        rowOran:   document.getElementById('row-oran'),
        oranRef:   document.getElementById('p-oran-ref'),
        rowOranRef: document.getElementById('row-oran-ref'),
        ara:       document.getElementById('p-ara'),
        kenar:     document.getElementById('p-kenar'),
        kayX:      document.getElementById('p-kay-x'),
        kayY:      document.getElementById('p-kay-y'),
        dizilim:   document.getElementById('p-dizilim'),
        kes:       document.getElementById('p-kes'),
        cam:       document.getElementById('p-cam'),
        derinlik:  document.getElementById('p-derinlik'),
        panel:     document.getElementById('p-panel'),
        roRise:    document.getElementById('ro-rise'),
        roSpring:  document.getElementById('ro-spring'),
        roGoz:     document.getElementById('ro-goz'),
        roKesik:   document.getElementById('ro-kesik'),
        roPitch:   document.getElementById('ro-pitch'),
        view2d:    document.getElementById('view2d'),
        view3d:    document.getElementById('view3d'),
        btnUndo:   document.getElementById('btn-undo'),
        btnRedo:   document.getElementById('btn-redo'),
        btnOpen:   document.getElementById('btn-open'),
        btnSave:   document.getElementById('btn-save'),
        btnReset:  document.getElementById('btn-reset'),
        btnFitCam: document.getElementById('btn-fit-camera'),
        btnGrid:   document.getElementById('btn-grid'),
        btnSTL:    document.getElementById('btn-export-stl'),
        btnDXF:    document.getElementById('btn-export-dxf'),
        btnPNG:    document.getElementById('btn-export-png'),
        btnHelp:   document.getElementById('btn-help'),
        btnHelpClose: document.getElementById('btn-help-close'),
        helpOverlay:  document.getElementById('help-overlay')
    };

    // sqrt(2) keyfi bir varsayilan degil, olculu referans cizimin tam degeri
    // (teget noktasi 45 derece). Tek tanim geometri motorunda; buradan okunuyor.
    const REF_ORAN     = Geom.FILGOZU_ORAN;
    const REF_ORAN_TXT = REF_ORAN.toFixed(4);   // alanda gosterilen kisaltilmis hali

    const SAYILAR = [
        [el.en,       'en',            0.001],
        [el.boy,      'boy',           0.001],
        [el.kalinlik, 'kalinlik',      0],
        [el.cap,      'gozCap',        0],
        [el.oran,     'oran',          1.02],
        [el.ara,      'gozAra',        0],
        [el.kenar,    'kenar',         0],
        [el.kayX,     'kaydirmaX',     null],   // isaretli: alt sinir yok
        [el.kayY,     'kaydirmaY',     null],
        [el.derinlik, 'derinlik',      0.1],
        [el.panel,    'panelDerinlik', 0.1]
    ];

    const viewer2d = new window.Viewer2D(el.view2d);
    const viewer3d = new window.Viewer3D(el.view3d);

    let lastWarn = null;
    let sessiz = false;   // geri/ileri alma ya da dosya yukleme sirasinda true

    function showToast(message, isError) {
        const old = document.querySelector('.toast');
        if (old) old.remove();
        const t = document.createElement('div');
        t.className = 'toast' + (isError ? ' error' : '');
        t.textContent = message;
        document.body.appendChild(t);
        setTimeout(function () { t.remove(); }, 2600);
    }

    function nf(v) { return (Math.round(v * 100) / 100).toString(); }

    // --- DOM <-> state -----------------------------------------------------

    // Tarayici yeniden yuklemede form degerlerini geri yukleyebilir; bu durumda
    // DOM ile state ayrisir. Bu yuzden state her zaman DOM'dan okunur.
    function syncStateFromDOM() {
        for (const [girdi, anahtar, min] of SAYILAR) {
            let v = Number(girdi.value);
            if (!Number.isFinite(v)) { girdi.value = DEFAULTS[anahtar]; v = DEFAULTS[anahtar]; }
            if (typeof min === 'number' && v < min) v = min;
            state[anahtar] = v;
        }
        state.dizilim = el.dizilim.value || DEFAULTS.dizilim;
        state.oranRef = el.oranRef.checked;
        if (state.oranRef) { state.oran = REF_ORAN; el.oran.value = REF_ORAN_TXT; }
        state.kes = el.kes.checked;
        state.renkliCam = el.cam.checked;
        for (let i = 0; i < el.radios.length; i++) {
            if (el.radios[i].checked) state.type = el.radios[i].value;
        }
        for (let i = 0; i < el.formlar.length; i++) {
            if (el.formlar[i].checked) state.gozForm = el.formlar[i].value;
        }
        applyFormUI();
    }

    function stateToDOM() {
        for (const [girdi, anahtar] of SAYILAR) girdi.value = state[anahtar];
        el.dizilim.value = state.dizilim;
        el.oranRef.checked = state.oranRef;
        if (state.oranRef) { state.oran = REF_ORAN; el.oran.value = REF_ORAN_TXT; }
        el.kes.checked = state.kes;
        el.cam.checked = state.renkliCam;
        for (let i = 0; i < el.radios.length; i++) {
            el.radios[i].checked = (el.radios[i].value === state.type);
        }
        for (let i = 0; i < el.formlar.length; i++) {
            el.formlar[i].checked = (el.formlar[i].value === state.gozForm);
        }
        el.btnGrid.classList.toggle('acik', !!state.izgara);
        applyFormUI();
    }

    // Filgozu secili degilken Boy/En alani anlamsiz -> pasiflestir.
    // Referans oran kutusu isaretliyken de alan kilitli kalir.
    function applyFormUI() {
        const fil = state.gozForm === 'filgozu';
        el.rowOran.classList.toggle('pasif', !fil || state.oranRef);
        el.rowOranRef.classList.toggle('pasif', !fil);
        el.oran.disabled = !fil || state.oranRef;
        el.lblCap.textContent = fil ? 'Göz Eni' : 'Göz Çapı';
    }

    function anlik() {
        const s = {};
        for (const k of PARAMLAR) s[k] = state[k];
        return s;
    }

    function ayni(a, b) {
        for (const k of PARAMLAR) if (a[k] !== b[k]) return false;
        return true;
    }

    // --- geri / ileri al ---------------------------------------------------

    const gecmis = { yigin: [], idx: -1, sinir: 100 };
    let commitZaman = null;

    function gecmisButonlari() {
        el.btnUndo.disabled = gecmis.idx <= 0;
        el.btnRedo.disabled = gecmis.idx >= gecmis.yigin.length - 1;
    }

    function commit() {
        if (sessiz) return;
        if (commitZaman) { clearTimeout(commitZaman); commitZaman = null; }
        const s = anlik();
        if (gecmis.idx >= 0 && ayni(gecmis.yigin[gecmis.idx], s)) return;
        gecmis.yigin.length = gecmis.idx + 1;          // ileri dalini at
        gecmis.yigin.push(s);
        if (gecmis.yigin.length > gecmis.sinir) gecmis.yigin.shift();
        gecmis.idx = gecmis.yigin.length - 1;
        gecmisButonlari();
    }

    // Yazarken her tus vurusu degil, yazma bittikten sonra tek adim kaydedilir.
    function commitGecikmeli() {
        if (sessiz) return;
        if (commitZaman) clearTimeout(commitZaman);
        commitZaman = setTimeout(function () { commitZaman = null; commit(); }, 700);
    }

    function gecmisUygula(s) {
        sessiz = true;
        Object.assign(state, s);
        stateToDOM();
        viewer3d.setIzgara(state.izgara);
        refresh(false);
        sessiz = false;
        gecmisButonlari();
    }

    function geriAl() {
        if (commitZaman) commit();
        if (gecmis.idx <= 0) return;
        gecmis.idx--;
        gecmisUygula(gecmis.yigin[gecmis.idx]);
    }

    function ileriAl() {
        if (gecmis.idx >= gecmis.yigin.length - 1) return;
        gecmis.idx++;
        gecmisUygula(gecmis.yigin[gecmis.idx]);
    }

    // --- yeniden hesapla ---------------------------------------------------

    // Ard arda gelen degisiklikleri tek bir hesaba toplar.
    // requestAnimationFrame arka plan sekmesinde kisitlanabildigi icin
    // zamanlayici yedegiyle yarisir; hangisi once gelirse o calisir.
    let pending = false;
    function scheduleRefresh(fitCam) {
        if (pending) return;
        pending = true;
        let bitti = false;
        const calistir = function () {
            if (bitti) return;
            bitti = true;
            pending = false;
            refresh(fitCam);
        };
        requestAnimationFrame(calistir);
        setTimeout(calistir, 120);
    }

    function refresh(fitCam) {
        const result = Geom.generateRevzen({
            type: state.type,
            en: state.en,
            boy: state.boy,
            kalinlik: state.kalinlik,
            gozForm: state.gozForm,
            gozCap: state.gozCap,
            oran: state.oran,
            gozAra: state.gozAra,
            kenar: state.kenar,
            kaydirmaX: state.kaydirmaX,
            kaydirmaY: state.kaydirmaY,
            dizilim: state.dizilim,
            kes: state.kes
        });

        state.result = result;

        el.roRise.textContent   = nf(result.rise);
        el.roSpring.textContent = result.inner ? nf(result.springY) : '—';
        el.roGoz.textContent    = String(result.goz.length);
        el.roKesik.textContent  = String(result.kesik || 0);
        el.roPitch.textContent  = result.pitch
            ? (nf(result.pitch) + ' × ' + nf(result.rowStep))
            : '—';

        const g2 = { renkliCam: state.renkliCam, izgara: state.izgara };
        const g3 = {
            derinlik: state.derinlik,
            panelDerinlik: state.panelDerinlik,
            renkliCam: state.renkliCam
        };

        if (result.error) {
            if (!sessiz) showToast(result.error, true);
            viewer2d.update(result, g2);
            viewer3d.update(result, g3);
            return;
        }

        if (result.warn && result.warn !== lastWarn && !sessiz) showToast(result.warn, true);
        lastWarn = result.warn || null;

        viewer2d.update(result, g2);
        viewer3d.update(result, g3);

        if (fitCam) viewer3d.fitView(result);
    }

    // --- girdi baglama -----------------------------------------------------

    for (const [girdi, anahtar, min] of SAYILAR) {
        // Yazim ortasindaki gecici hallerde (bos alan, yalniz "-" ya da ".")
        // deger okunmaz. Aksi halde Number('') === 0 oldugu icin desen, kullanici
        // negatif bir sayi yazarken bir an sifira sicrar.
        const oku = function () {
            const ham = girdi.value;
            if (ham === '' || ham === '-' || ham === '.' || ham === '-.') return false;
            let v = Number(ham);
            if (!Number.isFinite(v)) return false;
            if (typeof min === 'number' && v < min) v = min;
            state[anahtar] = v;
            scheduleRefresh(false);
            return true;
        };
        girdi.addEventListener('input', function () { if (oku()) commitGecikmeli(); });
        girdi.addEventListener('change', function () {
            // Alan bos ya da gecersiz birakildiysa son gecerli degere don
            if (!oku()) { girdi.value = state[anahtar]; return; }
            commit();
        });
    }

    el.dizilim.addEventListener('change', function () {
        state.dizilim = el.dizilim.value;
        scheduleRefresh(false);
        commit();
    });

    // Isaretlemek tek yonlu bir sifirlamadir: yazilan deger referansla degisir.
    // Geri almak icin Ctrl+Z var.
    el.oranRef.addEventListener('change', function () {
        state.oranRef = el.oranRef.checked;
        if (state.oranRef) { state.oran = REF_ORAN; el.oran.value = REF_ORAN_TXT; }
        applyFormUI();
        scheduleRefresh(false);
        commit();
    });

    el.kes.addEventListener('change', function () {
        state.kes = el.kes.checked;
        scheduleRefresh(false);
        commit();
    });

    el.cam.addEventListener('change', function () {
        state.renkliCam = el.cam.checked;
        scheduleRefresh(false);
        commit();
    });

    for (let i = 0; i < el.radios.length; i++) {
        el.radios[i].addEventListener('change', function (e) {
            if (!e.target.checked) return;
            state.type = e.target.value;
            scheduleRefresh(true);
            commit();
        });
    }

    for (let i = 0; i < el.formlar.length; i++) {
        el.formlar[i].addEventListener('change', function (e) {
            if (!e.target.checked) return;
            state.gozForm = e.target.value;
            applyFormUI();
            scheduleRefresh(false);
            commit();
        });
    }

    // --- aktif viewport ----------------------------------------------------

    function setActive(view) {
        state.activeView = view;
        const vps = document.querySelectorAll('.viewport');
        for (let i = 0; i < vps.length; i++) vps[i].classList.remove('active');
        const target = (view === '2d') ? el.view2d.parentElement : el.view3d.parentElement;
        target.classList.add('active');
    }

    el.view2d.parentElement.addEventListener('mousedown', function () { setActive('2d'); });
    el.view3d.parentElement.addEventListener('mousedown', function () { setActive('3d'); });
    setActive('2d');

    // --- izgara ------------------------------------------------------------

    function izgaraAyarla(acik, kaydet) {
        state.izgara = !!acik;
        el.btnGrid.classList.toggle('acik', state.izgara);
        viewer3d.setIzgara(state.izgara);
        if (state.result) {
            viewer2d.update(state.result, { renkliCam: state.renkliCam, izgara: state.izgara });
        }
        if (kaydet) commit();
    }

    el.btnGrid.addEventListener('click', function () { izgaraAyarla(!state.izgara, true); });

    // --- proje ac / kaydet -------------------------------------------------

    function dosyaAdi() {
        return 'revzen-' + state.type + '-' + state.gozForm + '.json';
    }

    function projeKaydet() {
        IO.kaydet(anlik(), dosyaAdi()).then(function (s) {
            if (s.yontem === 'iptal') return;
            showToast(s.yontem === 'indirme'
                ? 'Kaydedildi: ' + s.ad + '  (indirme klasörü)'
                : 'Kaydedildi: ' + s.ad, false);
        }).catch(function (err) {
            console.error(err);
            showToast('Kaydetme hatası: ' + err.message, true);
        });
    }

    function projeAc() {
        IO.ac().then(function (s) {
            if (!s || s.yontem === 'iptal' || !s.metin) return;
            const c = IO.coz(s.metin);
            if (c.hata) { showToast(c.hata, true); return; }

            sessiz = true;
            Object.assign(state, c.parametreler);
            stateToDOM();
            viewer3d.setIzgara(state.izgara);
            refresh(true);
            sessiz = false;
            commit();

            const atlanan = (c.atlanan && c.atlanan.length) || 0;
            showToast('Açıldı: ' + (s.ad || 'proje') +
                (atlanan ? '  (' + atlanan + ' alan atlandı)' : ''), atlanan > 0);
        }).catch(function (err) {
            console.error(err);
            showToast('Açma hatası: ' + err.message, true);
        });
    }

    el.btnSave.addEventListener('click', projeKaydet);
    el.btnOpen.addEventListener('click', projeAc);
    el.btnUndo.addEventListener('click', geriAl);
    el.btnRedo.addEventListener('click', ileriAl);

    // --- export ------------------------------------------------------------

    function baseName() { return 'revzen-' + state.type + '-' + state.gozForm; }

    el.btnSTL.addEventListener('click', function () {
        try {
            const r = state.result;
            if (!r || !r.inner) { showToast('STL için geçerli geometri yok', true); return; }
            if (state.kalinlik <= 0 && r.goz.length === 0) {
                showToast('STL için Çerçeve Kalınlığı > 0 veya göz deseni gerekli', true);
                return;
            }
            window.exportSTL(r, {
                derinlik: state.derinlik,
                panelDerinlik: state.panelDerinlik
            }, baseName() + '.stl');
            showToast('STL indirildi', false);
        } catch (err) {
            console.error(err);
            showToast('STL hatası: ' + err.message, true);
        }
    });

    el.btnDXF.addEventListener('click', function () {
        try {
            const r = state.result;
            if (!r || !r.inner) { showToast('DXF için geçerli geometri yok', true); return; }
            window.exportDXF(r, baseName() + '.dxf');
            showToast('DXF indirildi (' + r.goz.length + ' göz)', false);
        } catch (err) {
            console.error(err);
            showToast('DXF hatası: ' + err.message, true);
        }
    });

    el.btnPNG.addEventListener('click', function () {
        const p = (state.activeView === '3d')
            ? window.exportPNG.from3D(viewer3d, baseName() + '-3d.png')
            : window.exportPNG.from2D(viewer2d, baseName() + '-2d.png');
        p.then(function () {
            showToast('PNG indirildi (' + state.activeView.toUpperCase() + ')', false);
        }).catch(function (err) {
            console.error(err);
            showToast('PNG hatası: ' + err.message, true);
        });
    });

    // --- ust bar -----------------------------------------------------------

    el.btnReset.addEventListener('click', function () {
        sessiz = true;
        Object.assign(state, DEFAULTS);
        stateToDOM();
        viewer3d.setIzgara(state.izgara);
        refresh(true);
        sessiz = false;
        commit();
        showToast('Parametreler sıfırlandı', false);
    });

    el.btnFitCam.addEventListener('click', function () {
        if (state.result && state.result.inner) viewer3d.fitView(state.result);
    });

    function showHelp(show) {
        if (show) el.helpOverlay.removeAttribute('hidden');
        else el.helpOverlay.setAttribute('hidden', '');
    }

    el.btnHelp.addEventListener('click', function () { showHelp(true); });
    el.btnHelpClose.addEventListener('click', function () { showHelp(false); });
    el.helpOverlay.addEventListener('click', function (e) {
        if (e.target === el.helpOverlay) showHelp(false);
    });

    // --- klavye ------------------------------------------------------------

    function yaziAlanindaMi(t) {
        if (!t) return false;
        const ad = (t.tagName || '').toUpperCase();
        return ad === 'INPUT' || ad === 'SELECT' || ad === 'TEXTAREA' || t.isContentEditable;
    }

    window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { showHelp(false); return; }

        if (e.ctrlKey || e.metaKey) {
            const k = (e.key || '').toLowerCase();
            if (k === 'z' && !e.shiftKey) { e.preventDefault(); geriAl(); return; }
            if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); ileriAl(); return; }
            if (k === 's') { e.preventDefault(); projeKaydet(); return; }
            if (k === 'o') { e.preventDefault(); projeAc(); return; }
            return;
        }

        // Harf kisayollari yalnizca bir alana yazmiyorken
        if (yaziAlanindaMi(e.target)) return;
        if ((e.key || '').toLowerCase() === 'g') izgaraAyarla(!state.izgara, true);
    });

    window.addEventListener('resize', function () {
        viewer2d.resize();
        viewer3d.resize();
    });

    // --- acilis ------------------------------------------------------------

    // Chrome form-state restore islemi load sonrasina sarkabildigi icin
    // hem ilk karede hem de pageshow'da DOM ile senkronize ol.
    function boot(fitCam) {
        try {
            sessiz = true;
            syncStateFromDOM();
            el.btnGrid.classList.toggle('acik', !!state.izgara);
            viewer3d.setIzgara(state.izgara);
            refresh(fitCam);
            sessiz = false;
            commit();
        } catch (e) {
            sessiz = false;
            console.error(e);
            showToast(e.message || String(e), true);
        }
    }

    window.addEventListener('pageshow', function () { boot(false); });
    requestAnimationFrame(function () { boot(true); });
})();
