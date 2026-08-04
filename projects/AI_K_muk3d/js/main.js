// Köşe Mukarnas web uygulaması (global - file:// uyumlu)
(function () {
    'use strict';

    if (typeof THREE === 'undefined') {
        document.body.innerHTML =
            '<div style="padding:24px;color:#fff;font-family:sans-serif">' +
            '<strong>Three.js yüklenemedi.</strong> İnternet bağlantısı gerekli (CDN).' +
            '</div>';
        return;
    }

    const Geom = window.MukarnasGeom;
    const templates = Geom.getPlanTemplates();

    const DEFAULTS = {
        sablon: 'eskenar',
        p1: { x: 0, y: 0 },
        p2: { x: 100, y: 0 },
        p3: { x: 50, y: 86.60254037844386 },
        asabaAdet: 1,
        toplamH: 0,
        asabaH: 0,
        derinlik: 0,
        xManuel: false,
        esitKenar: false,
        asa: 100,
        drawnOnce: false
    };

    const state = Object.assign({}, DEFAULTS, {
        mukarnasResult: null,
        activeView: '2d',
        _syncing: false
    });

    const el = {
        radiosSablon: document.querySelectorAll('input[name="plan-sablon"]'),
        p1x: document.getElementById('p1-x'),
        p1y: document.getElementById('p1-y'),
        p2x: document.getElementById('p2-x'),
        p2y: document.getElementById('p2-y'),
        p3x: document.getElementById('p3-x'),
        p3y: document.getElementById('p3-y'),
        readoutP1p2: document.getElementById('readout-p1p2'),
        readoutP1p3: document.getElementById('readout-p1p3'),
        chkEsitKenar: document.getElementById('chk-esit-kenar'),
        btnEsitle: document.getElementById('btn-esitle'),
        asabaAdet: document.getElementById('param-asaba-adet'),
        toplamH: document.getElementById('param-toplam-h'),
        asabaH: document.getElementById('param-asaba-h'),
        derinlik: document.getElementById('param-derinlik'),
        chkXManuel: document.getElementById('chk-x-manuel'),
        xMesafe: document.getElementById('param-x-mesafe'),
        readoutXAsa: document.getElementById('readout-x-asa'),
        not1: document.getElementById('not1'),
        not2: document.getElementById('not2'),
        not3: document.getElementById('not3'),
        view2d: document.getElementById('view2d'),
        view3d: document.getElementById('view3d'),
        btnReset: document.getElementById('btn-reset'),
        btnFitCam: document.getElementById('btn-fit-camera'),
        btnSTL: document.getElementById('btn-export-stl'),
        btnDXF: document.getElementById('btn-export-dxf'),
        btnPNG: document.getElementById('btn-export-png'),
        btnHelp: document.getElementById('btn-help'),
        btnHelpClose: document.getElementById('btn-help-close'),
        helpOverlay: document.getElementById('help-overlay')
    };

    let refreshHandle = null;
    let refreshFit = false;
    let sonRefreshSuresi = 0;
    let sonRefreshBitisi = 0;

    function showToast(message, isError) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        const t = document.createElement('div');
        t.className = 'toast' + (isError ? ' error' : '');
        t.textContent = message;
        document.body.appendChild(t);
        setTimeout(function () { t.remove(); }, 2200);
    }

    function readPlanFromInputs() {
        return {
            p1: { x: Number(el.p1x.value), y: Number(el.p1y.value) },
            p2: { x: Number(el.p2x.value), y: Number(el.p2y.value) },
            p3: { x: Number(el.p3x.value), y: Number(el.p3y.value) }
        };
    }

    function writePlanToInputs(plan) {
        state._syncing = true;
        el.p1x.value = plan.p1.x.toFixed(2);
        el.p1y.value = plan.p1.y.toFixed(2);
        el.p2x.value = plan.p2.x.toFixed(2);
        el.p2y.value = plan.p2.y.toFixed(2);
        el.p3x.value = plan.p3.x.toFixed(2);
        el.p3y.value = plan.p3.y.toFixed(2);
        state.p1 = plan.p1;
        state.p2 = plan.p2;
        state.p3 = plan.p3;
        state._syncing = false;
    }

    function setSablonRadio(name) {
        state.sablon = name;
        for (let i = 0; i < el.radiosSablon.length; i++) {
            el.radiosSablon[i].checked = (el.radiosSablon[i].value === name);
        }
    }

    function applySablon(name) {
        const t = templates[name];
        if (!t) return;
        writePlanToInputs({ p1: t.p1, p2: t.p2, p3: t.p3 });
        state.sablon = name;
    }

    /**
     * Ekran karesi başına en fazla bir yenileme. Spinbox okuna basılı tutarken
     * Chrome ~50 ms'de bir artırır; sabit gecikmeli bir debounce her artışta
     * sıfırlandığı için çizim ancak bırakınca güncellenirdi. Kare bazlı
     * birleştirme ile çizim basılı tutarken de anlık takip eder.
     * Ağır modellerde ardışık yenileme arasına son yenileme süresi kadar
     * boşluk bırakılarak arayüzün kilitlenmesi önlenir.
     */
    function scheduleRefresh(fitCam) {
        if (fitCam) refreshFit = true;
        if (refreshHandle !== null) return;

        refreshHandle = requestAnimationFrame(function calis() {
            const simdi = performance.now();
            if (sonRefreshSuresi > 24 && simdi - sonRefreshBitisi < sonRefreshSuresi) {
                refreshHandle = requestAnimationFrame(calis);
                return;
            }
            refreshHandle = null;
            const fit = refreshFit;
            refreshFit = false;

            const t0 = performance.now();
            try {
                refresh(fit);
            } catch (err) {
                console.error(err);
                showToast(err.message || String(err), true);
            }
            sonRefreshBitisi = performance.now();
            sonRefreshSuresi = sonRefreshBitisi - t0;
        });
    }

    function refresh(fitCam) {
        const plan = readPlanFromInputs();

        // "Kenarları eşit tut": P3'ü yönünü koruyarak |P1–P2| uzaklığına oturt
        if (state.esitKenar) {
            const yeni = Geom.esitKenarP3(plan);
            if (Math.abs(yeni.x - plan.p3.x) > 1e-6 || Math.abs(yeni.y - plan.p3.y) > 1e-6) {
                plan.p3 = yeni;
                writePlanToInputs(plan);
                if (state.sablon !== 'ozel') setSablonRadio('ozel');
            }
        }

        state.p1 = plan.p1;
        state.p2 = plan.p2;
        state.p3 = plan.p3;

        const p1p2 = Geom.dist2d(plan.p1, plan.p2);
        const p1p3 = Geom.dist2d(plan.p1, plan.p3);
        const kenarEsitDegil = p1p2 > 1e-6 && Geom.kenarFarkOrani(p1p3, p1p2) > Geom.KENAR_TOLERANS;

        el.readoutP1p2.textContent = p1p2.toFixed(2);
        el.readoutP1p3.textContent = p1p3.toFixed(2);
        el.readoutP1p3.style.color = kenarEsitDegil ? '#c05a3a' : '';
        el.btnEsitle.disabled = !kenarEsitDegil;
        el.btnEsitle.classList.toggle('uyari', kenarEsitDegil);

        const useGolden = !state.drawnOnce && state.toplamH <= 0 && state.asabaAdet === 1 && !state.xManuel;

        const result = Geom.generateMukarnas({
            p1: plan.p1,
            p2: plan.p2,
            p3: plan.p3,
            asabaAdet: state.asabaAdet,
            toplamH: state.toplamH,
            asabaH: state.asabaH,
            derinlik: state.derinlik,
            xManuel: state.xManuel,
            asa: state.xManuel ? Number(el.xMesafe.value) : undefined,
            useGoldenRatio: useGolden
        });

        state.mukarnasResult = result;

        if (result.useGoldenRatio || (useGolden && result.asabaH > 0)) {
            state.asabaH = result.asabaH;
            state.toplamH = result.toplamH;
            state._syncing = true;
            el.asabaH.value = result.asabaH.toFixed(2);
            el.toplamH.value = result.toplamH.toFixed(2);
            state._syncing = false;
            state.drawnOnce = true;
            el.not2.textContent = "X ölçüsüne uygun yüksekliği 'Altın Oran' olan çizim yapıldı";
        }

        if (!state.xManuel) {
            el.xMesafe.value = result.asa.toFixed(2);
            state.asa = result.asa;
        }

        el.readoutXAsa.textContent = result.asa.toFixed(2);
        el.not3.textContent = 'x ölçüsü: ' + result.asa.toFixed(2);

        if (result.warnings && result.warnings.length) {
            el.not1.textContent = result.warnings[0];
        } else {
            el.not1.textContent = 'Değerleri düzenleyebilirsiniz';
        }

        viewer2d.update(result);
        viewer3d.update(result);

        if (fitCam && result.meshes.length > 0) {
            viewer3d.fitView(result);
        }
    }

    const viewer2d = new window.Viewer2D(el.view2d, function (plan, meta) {
        if (state._syncing) return;
        if (state.esitKenar) {
            plan.p3 = Geom.esitKenarP3(plan);
        }
        writePlanToInputs(plan);
        if (meta && meta.fromDrag) {
            setSablonRadio('ozel');
        }
        scheduleRefresh(false);
    });

    const viewer3d = new window.Viewer3D(el.view3d);

    function bindNumber(input, key, parser) {
        parser = parser || Number;
        function handler() {
            if (state._syncing) return;
            const v = parser(input.value);
            if (!Number.isFinite(v)) return;
            state[key] = v;
            if (key === 'toplamH' && state.asabaAdet >= 1) {
                state._syncing = true;
                el.asabaH.value = (v / state.asabaAdet).toFixed(2);
                state.asabaH = v / state.asabaAdet;
                state._syncing = false;
                el.not2.textContent = 'Toplam yükseklik (H) belirlendi';
            }
            if (key === 'asabaH' && state.asabaAdet >= 1) {
                state._syncing = true;
                state.toplamH = v * state.asabaAdet;
                el.toplamH.value = state.toplamH.toFixed(2);
                state._syncing = false;
                el.not2.textContent = 'Asaba yüksekliği belirlendi';
            }
            if (key === 'derinlik') {
                el.not2.textContent = 'Yanak derinliği belirlendi';
            }
            scheduleRefresh(false);
        }
        input.addEventListener('input', handler);
        input.addEventListener('change', handler);
    }

    bindNumber(el.asabaAdet, 'asabaAdet', function (v) {
        return Math.max(1, Math.floor(Number(v) || 1));
    });

    el.asabaAdet.addEventListener('change', function () {
        if (state._syncing) return;
        if (state.toplamH > 0 && state.asabaAdet >= 1) {
            state._syncing = true;
            state.asabaH = state.toplamH / state.asabaAdet;
            el.asabaH.value = state.asabaH.toFixed(2);
            state._syncing = false;
        }
        el.not2.textContent = 'Asaba adedi belirlendi';
    });
    bindNumber(el.toplamH, 'toplamH');
    bindNumber(el.asabaH, 'asabaH');
    bindNumber(el.derinlik, 'derinlik');

    function onPlanCoordChange() {
        if (state._syncing) return;
        setSablonRadio('ozel');
        scheduleRefresh(false);
    }

    [el.p1x, el.p1y, el.p2x, el.p2y, el.p3x, el.p3y].forEach(function (inp) {
        inp.addEventListener('input', onPlanCoordChange);
        inp.addEventListener('change', onPlanCoordChange);
    });

    for (let i = 0; i < el.radiosSablon.length; i++) {
        el.radiosSablon[i].addEventListener('change', function (e) {
            if (!e.target.checked) return;
            if (e.target.value === 'ozel') {
                state.sablon = 'ozel';
                return;
            }
            applySablon(e.target.value);
            scheduleRefresh(false);
        });
    }

    el.chkEsitKenar.addEventListener('change', function () {
        state.esitKenar = el.chkEsitKenar.checked;
        el.not2.textContent = state.esitKenar
            ? 'Kenarlar eşit tutuluyor (P3, P1–P2 uzunluğunda)'
            : 'Kenar eşitleme kapatıldı';
        refresh(false);
    });

    el.btnEsitle.addEventListener('click', function () {
        const plan = readPlanFromInputs();
        plan.p3 = Geom.esitKenarP3(plan);
        writePlanToInputs(plan);
        setSablonRadio('ozel');
        el.not2.textContent = 'P3 eşit kenara oturtuldu';
        refresh(false);
        showToast('P3 eşitlendi: ' + Geom.dist2d(plan.p1, plan.p3).toFixed(2), false);
    });

    el.chkXManuel.addEventListener('change', function () {
        state.xManuel = el.chkXManuel.checked;
        el.xMesafe.disabled = !state.xManuel;
        if (state.xManuel) {
            el.xMesafe.value = (state.asa || Geom.dist2d(state.p1, state.p2)).toFixed(2);
            el.not1.textContent = 'X ölçüsünü belirleyebilirsiniz';
            el.not3.style.opacity = '0.5';
        } else {
            el.not1.textContent = '';
            el.not2.textContent = 'X ölçüsü plana bağlandı';
            el.not3.style.opacity = '1';
        }
        scheduleRefresh(false);
    });

    el.xMesafe.addEventListener('input', function () {
        if (!state.xManuel || state._syncing) return;
        state.asa = Number(el.xMesafe.value);
        el.not2.textContent = 'X ölçüsü belirlendi';
        scheduleRefresh(false);
    });

    el.view2d.parentElement.addEventListener('click', function () { setActive('2d'); });
    el.view3d.parentElement.addEventListener('click', function () { setActive('3d'); });

    function setActive(view) {
        state.activeView = view;
        const vps = document.querySelectorAll('.viewport');
        for (let i = 0; i < vps.length; i++) vps[i].classList.remove('active');
        const target = (view === '2d') ? el.view2d.parentElement : el.view3d.parentElement;
        target.classList.add('active');
    }
    setActive('2d');

    el.btnSTL.addEventListener('click', function () {
        try {
            if (!state.mukarnasResult || !state.mukarnasResult.meshes.length) {
                showToast('STL için geçerli mesh yok (H > 0)', true);
                return;
            }
            window.exportSTL(state.mukarnasResult, 'kose-mukarnas.stl');
            showToast('STL indirildi', false);
        } catch (err) {
            console.error(err);
            showToast('STL hata: ' + err.message, true);
        }
    });

    el.btnDXF.addEventListener('click', function () {
        try {
            if (!state.mukarnasResult) {
                showToast('DXF için veri yok', true);
                return;
            }
            const meshSayisi = state.mukarnasResult.meshes.length;
            window.exportDXF(state.mukarnasResult, 'kose-mukarnas.dxf');
            showToast(
                meshSayisi
                    ? 'DXF indirildi (3D gövde + plan)'
                    : 'DXF indirildi — yalnız plan (H = 0 olduğu için 3D yok)',
                !meshSayisi
            );
        } catch (err) {
            console.error(err);
            showToast('DXF hata: ' + err.message, true);
        }
    });

    el.btnPNG.addEventListener('click', function () {
        const p = (state.activeView === '3d')
            ? window.exportPNG.from3D(viewer3d, 'kose-mukarnas-3d.png')
            : window.exportPNG.from2D(viewer2d, 'kose-mukarnas-2d.png');
        p.then(function () {
            showToast('PNG indirildi (' + state.activeView.toUpperCase() + ')', false);
        }).catch(function (err) {
            console.error(err);
            showToast('PNG hata: ' + err.message, true);
        });
    });

    el.btnReset.addEventListener('click', function () {
        Object.assign(state, DEFAULTS, {
            mukarnasResult: null,
            activeView: state.activeView,
            _syncing: false
        });
        el.asabaAdet.value = DEFAULTS.asabaAdet;
        el.toplamH.value = DEFAULTS.toplamH;
        el.asabaH.value = DEFAULTS.asabaH;
        el.derinlik.value = DEFAULTS.derinlik;
        el.chkXManuel.checked = DEFAULTS.xManuel;
        el.chkEsitKenar.checked = DEFAULTS.esitKenar;
        el.xMesafe.disabled = true;
        el.xMesafe.value = DEFAULTS.asa;
        for (let i = 0; i < el.radiosSablon.length; i++) {
            el.radiosSablon[i].checked = (el.radiosSablon[i].value === DEFAULTS.sablon);
        }
        applySablon(DEFAULTS.sablon);
        el.not1.textContent = 'Planı düzenleyin; çizim otomatik güncellenir.';
        el.not2.textContent = '—';
        refresh(true);
        showToast('Parametreler sıfırlandı', false);
    });

    el.btnFitCam.addEventListener('click', function () {
        if (state.mukarnasResult && state.mukarnasResult.meshes.length) {
            viewer3d.fitView(state.mukarnasResult);
        }
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
    window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') showHelp(false);
    });

    window.addEventListener('resize', function () {
        viewer2d.resize();
        viewer3d.resize();
    });

    applySablon(DEFAULTS.sablon);
    state.asabaAdet = DEFAULTS.asabaAdet;
    state.toplamH = DEFAULTS.toplamH;
    state.asabaH = DEFAULTS.asabaH;
    state.derinlik = DEFAULTS.derinlik;

    requestAnimationFrame(function () {
        try {
            refresh(true);
        } catch (e) {
            console.error(e);
            showToast(e.message || String(e), true);
        }
    });
})();
