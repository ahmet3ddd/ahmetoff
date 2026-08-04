// Main app (global - file:// uyumlu)
(function () {
    'use strict';

    if (typeof THREE === 'undefined') {
        document.body.innerHTML =
            '<div style="padding:24px;color:#fff;font-family:sans-serif">' +
            '<strong>Three.js yuklenemedi.</strong> Internet baglantisi gerekli (CDN).' +
            '</div>';
        return;
    }

    const Geom = window.KemerGeom;
    const Viewer2D = window.Viewer2D;
    const Viewer3D = window.Viewer3D;

    const DEFAULTS = {
        type: 'teget',
        mesafe: 200,
        bol: 1,
        baslik: 0,
        kalinlik: 5,
        extrude: 20
    };

    const state = {
        type: DEFAULTS.type,
        mesafe: DEFAULTS.mesafe,
        bol: DEFAULTS.bol,
        baslik: DEFAULTS.baslik,
        kalinlik: DEFAULTS.kalinlik,
        extrude: DEFAULTS.extrude,
        archResult: null,
        activeView: '2d'
    };

    const el = {
        radios:     document.querySelectorAll('input[name="kemer-tipi"]'),
        preview:    document.getElementById('tip-preview'),
        mesafe:     document.getElementById('param-mesafe'),
        bol:        document.getElementById('param-bol'),
        baslik:     document.getElementById('param-baslik'),
        kalinlik:   document.getElementById('param-kalinlik'),
        extrude:    document.getElementById('param-extrude'),
        readoutAra: document.getElementById('readout-ara'),
        view2d:     document.getElementById('view2d'),
        view3d:     document.getElementById('view3d'),
        btnReset:   document.getElementById('btn-reset'),
        btnFitCam:  document.getElementById('btn-fit-camera'),
        btnSTL:     document.getElementById('btn-export-stl'),
        btnDXF:     document.getElementById('btn-export-dxf'),
        btnPNG:     document.getElementById('btn-export-png'),
        btnHelp:    document.getElementById('btn-help'),
        btnHelpClose: document.getElementById('btn-help-close'),
        helpOverlay:  document.getElementById('help-overlay')
    };

    const viewer2d = new Viewer2D(el.view2d);
    const viewer3d = new Viewer3D(el.view3d);

    function showToast(message, isError) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        const t = document.createElement('div');
        t.className = 'toast' + (isError ? ' error' : '');
        t.textContent = message;
        document.body.appendChild(t);
        setTimeout(function () { t.remove(); }, 2200);
    }

    function refresh(fitCam) {
        const result = Geom.generateArch({
            type: state.type,
            mesafe: state.mesafe,
            bol: state.bol,
            baslik: state.baslik,
            kalinlik: state.kalinlik
        });

        state.archResult = result;
        el.readoutAra.textContent = result.ara.toFixed(2);

        if (result.error) {
            showToast(result.error, true);
        }

        viewer2d.update(result);
        viewer3d.update(result, state.extrude);

        if (fitCam) {
            viewer3d.fitView(result);
        }
    }

    function bindParam(input, key, parser) {
        parser = parser || Number;
        function handler() {
            const v = parser(input.value);
            if (Number.isFinite(v)) {
                state[key] = v;
                refresh(false);
            }
        }
        input.addEventListener('input', handler);
        input.addEventListener('change', handler);
    }

    bindParam(el.mesafe,   'mesafe');
    bindParam(el.bol,      'bol', function (v) { return Math.max(1, Math.floor(Number(v) || 1)); });
    bindParam(el.baslik,   'baslik');
    bindParam(el.kalinlik, 'kalinlik');
    bindParam(el.extrude,  'extrude');

    for (let i = 0; i < el.radios.length; i++) {
        el.radios[i].addEventListener('change', function (e) {
            if (!e.target.checked) return;
            state.type = e.target.value;
            el.preview.src = (state.type === 'penci')
                ? 'assets/Penci.jpg'
                : 'assets/Tekmerkezteget.jpg';
            refresh(false);
        });
    }

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
            if (!state.archResult || state.archResult.archUnits.length === 0) {
                showToast('STL icin gecerli geometri yok', true);
                return;
            }
            if (state.kalinlik <= 0) {
                showToast('STL icin Kalinlik > 0 gerekli', true);
                return;
            }
            if (state.extrude <= 0) {
                showToast('STL icin Extrude Derinlik > 0 gerekli', true);
                return;
            }
            window.exportSTL(state.archResult, state.extrude, 'kemer-' + state.type + '.stl');
            showToast('STL indirildi', false);
        } catch (err) {
            console.error(err);
            showToast('STL hata: ' + err.message, true);
        }
    });

    el.btnDXF.addEventListener('click', function () {
        try {
            if (!state.archResult || state.archResult.archUnits.length === 0) {
                showToast('DXF icin gecerli geometri yok', true);
                return;
            }
            window.exportDXF(state.archResult, 'kemer-' + state.type + '.dxf');
            showToast('DXF indirildi', false);
        } catch (err) {
            console.error(err);
            showToast('DXF hata: ' + err.message, true);
        }
    });

    el.btnPNG.addEventListener('click', function () {
        const p = (state.activeView === '3d')
            ? window.exportPNG.from3D(viewer3d, 'kemer-' + state.type + '-3d.png')
            : window.exportPNG.from2D(viewer2d, 'kemer-' + state.type + '-2d.png');
        p.then(function () {
            showToast('PNG indirildi (' + state.activeView.toUpperCase() + ')', false);
        }).catch(function (err) {
            console.error(err);
            showToast('PNG hata: ' + err.message, true);
        });
    });

    el.btnReset.addEventListener('click', function () {
        state.type = DEFAULTS.type;
        state.mesafe = DEFAULTS.mesafe;
        state.bol = DEFAULTS.bol;
        state.baslik = DEFAULTS.baslik;
        state.kalinlik = DEFAULTS.kalinlik;
        state.extrude = DEFAULTS.extrude;
        el.mesafe.value   = DEFAULTS.mesafe;
        el.bol.value      = DEFAULTS.bol;
        el.baslik.value   = DEFAULTS.baslik;
        el.kalinlik.value = DEFAULTS.kalinlik;
        el.extrude.value  = DEFAULTS.extrude;
        for (let i = 0; i < el.radios.length; i++) {
            el.radios[i].checked = (el.radios[i].value === DEFAULTS.type);
        }
        el.preview.src = 'assets/Tekmerkezteget.jpg';
        refresh(true);
        showToast('Parametreler sifirlandi', false);
    });

    el.btnFitCam.addEventListener('click', function () {
        if (state.archResult) {
            viewer3d.fitView(state.archResult);
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

    requestAnimationFrame(function () {
        try {
            refresh(true);
        } catch (e) {
            console.error(e);
            showToast(e.message || String(e), true);
        }
    });
})();
