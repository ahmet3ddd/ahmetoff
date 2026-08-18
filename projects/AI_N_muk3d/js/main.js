(function () {
    'use strict';

    if (typeof THREE === 'undefined') {
        document.body.innerHTML =
            '<div style="padding:24px;color:#fff;font-family:sans-serif">' +
            '<strong>Three.js yuklenemedi.</strong> vendor/three.min.js dosyasini kontrol edin.' +
            '</div>';
        return;
    }

    const Geom = window.MukarnasGeom;
    const EXPORT_BASE = 'nis-mukarnas';

    const DEFAULTS = {
        aciklik: 100,
        asabaAdet: 1,
        asabaH: 0,
        toplamH: 0,
        asabaDerinlik: 0,
        toplamDerinlik: 0,
        // Hangi derinlik alani elle girildi; digeri ondan turetilir
        dKaynak: null,
        derinlik: 0,
        // Oran kapaliyken hangi alanin elle girildigi; digeri ondan turetilir
        hKaynak: null,
        altinOran: true,
        sira: 1,
        showModuleB: true,
        showLabels: false
    };

    const state = Object.assign({}, DEFAULTS, { result: null, activeView: '2d' });

    function $(id) { return document.getElementById(id); }

    const el = {
        aciklik: $('param-aciklik'),
        asabaAdet: $('param-asaba-adet'),
        asabaH: $('param-asaba-h'),
        toplamH: $('param-toplam-h'),
        asabaDerinlik: $('param-asaba-derinlik'),
        toplamDerinlik: $('param-toplam-derinlik'),
        derinlik: $('param-derinlik'),
        altinOran: $('param-altin-oran'),
        sira: $('param-sira'),
        showB: $('param-show-b'),
        showLabels: $('param-show-labels'),
        readoutX: $('readout-x'),
        readoutH: $('readout-h'),
        readoutSim: $('readout-sim'),
        status: $('status-text'),
        view2d: $('view2d'),
        view3d: $('view3d'),
        btnReset: $('btn-reset'),
        btnFitCam: $('btn-fit-camera'),
        btnSTL: $('btn-export-stl'),
        btnDXF: $('btn-export-dxf'),
        btnPNG: $('btn-export-png'),
        btnProjectSave: $('btn-project-save'),
        btnProjectOpen: $('btn-project-open'),
        btnHelp: $('btn-help'),
        btnHelpClose: $('btn-help-close'),
        helpOverlay: $('help-overlay')
    };

    const viewer2d = el.view2d ? new window.Viewer2D(el.view2d) : null;
    const viewer3d = el.view3d ? new window.Viewer3D(el.view3d) : null;

    function showToast(message, isError) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        const t = document.createElement('div');
        t.className = 'toast' + (isError ? ' error' : '');
        t.textContent = message;
        document.body.appendChild(t);
        setTimeout(function () { t.remove(); }, 2200);
    }

    function syncUI() {
        const altin = state.altinOran;
        if (el.asabaH) el.asabaH.disabled = altin;
        if (el.toplamH) el.toplamH.disabled = altin;
        if (el.sira) {
            const tekAsaba = state.asabaAdet <= 1;
            el.sira.disabled = tekAsaba;
            if (tekAsaba) {
                state.sira = 1;
                el.sira.value = 1;
            } else if (state.sira > state.asabaAdet) {
                state.sira = state.asabaAdet;
                el.sira.value = state.asabaAdet;
            }
        }
    }

    function collectParams() {
        return {
            aciklik: state.aciklik,
            asabaAdet: state.asabaAdet,
            asabaH: state.asabaH,
            toplamH: state.toplamH,
            asabaDerinlik: state.asabaDerinlik,
            toplamDerinlik: state.toplamDerinlik,
            dKaynak: state.dKaynak,
            derinlik: state.derinlik,
            hKaynak: state.hKaynak,
            altinOran: state.altinOran,
            sira: state.sira,
            showModuleB: state.showModuleB
        };
    }

    /** Yazilmakta olan alana dokunmayiz ki imlec kaymasin. */
    function setFieldValue(input, value) {
        if (!input || document.activeElement === input) return;
        const metin = value.toFixed(2);
        if (input.value !== metin) input.value = metin;
    }

    function refresh(fitCam) {
        syncUI();
        const onceki = state.result;
        const result = Geom.generateMukarnas(collectParams());
        state.result = result;

        if (el.readoutX) {
            el.readoutX.textContent = result.asa.toFixed(2) +
                ' (x olcusu: ' + (result.p1p2mesafe / result.asabaAdet).toFixed(2) + ')';
        }
        if (el.readoutH) el.readoutH.textContent = result.asabaH.toFixed(2);
        if (el.readoutSim) {
            el.readoutSim.textContent = result.showModuleB
                ? 'Ayna X = 0 (B acik)'
                : 'B gizli';
        }
        if (el.status) {
            const hucreAdet = result.cells.filter(function (c) {
                return !c.kind;
            }).length;
            const duvarAdet = result.cells.filter(function (c) {
                return c.kind === 'duvar';
            }).length;
            const yanakAdet = result.cells.filter(function (c) {
                return c.kind === 'yanak';
            }).length;
            el.status.textContent =
                'Asaba: ' + result.asabaAdet +
                ' | Sira: ' + result.sira +
                ' | Genislik X: ' + result.bbox.width.toFixed(2) +
                ' | H toplam: ' + result.toplamH.toFixed(2) +
                ' | Derinlik: ' + result.asabaDerinlik.toFixed(2) +
                ' (toplam ' + result.toplamDerinlik.toFixed(2) +
                (result.derinlikOtomatik ? ', otomatik' : '') + ')' +
                ' | Yerlesim kaydirma: ' + result.shiftX.toFixed(2) + ',' +
                result.shiftY.toFixed(2) + ',' + result.shiftZ.toFixed(2) +
                ' | Hucre: ' + hucreAdet +
                (result.showModuleB ? ' (A+B)' : ' (yalniz A)') +
                (duvarAdet ? ' | Arka duvar: ' + duvarAdet : '') +
                (yanakAdet ? ' | Yanak paneli: ' + yanakAdet : '') +
                (state.showLabels && window.Viewer3D &&
                    result.cells.length > window.Viewer3D.MAX_LABEL_CELLS
                    ? ' | Kose etiketleri kapali (hucre > ' + window.Viewer3D.MAX_LABEL_CELLS + ')'
                    : '');
        }

        // Iki alan da her zaman cizimde kullanilan olcuyu gosterir: oran
        // acikken orandan uretileni, kapaliyken manuel deger ve ondan
        // turetilen esini.
        setFieldValue(el.asabaH, result.asabaH);
        setFieldValue(el.toplamH, result.toplamH);
        setFieldValue(el.asabaDerinlik, result.asabaDerinlik);
        setFieldValue(el.toplamDerinlik, result.toplamDerinlik);

        if (viewer2d) viewer2d.update(result);
        if (viewer3d) {
            viewer3d.setShowLabels(state.showLabels);
            viewer3d.update(result);
        }
        if (fitCam && viewer3d) {
            viewer3d.fitView(result);
        } else if (viewer3d && onceki && onceki.aciklik > 0 && result.aciklik > 0) {
            // Aciklik modelin X- / X+ uclari arasindaki toplam genislik. Degisince
            // model orijine gore olceklendigi icin kamerayi ayni oranda olcekleyip
            // kullanicinin bakis acisini bozmadan cerceveyi koruyoruz.
            viewer3d.scaleView(result.aciklik / onceki.aciklik);
        }
    }

    function bindNum(input, key, parser, onSet) {
        if (!input) return;
        parser = parser || Number;
        function handler() {
            const v = parser(input.value);
            if (Number.isFinite(v)) {
                state[key] = v;
                if (onSet) onSet(v);
                refresh(false);
            }
        }
        input.addEventListener('input', handler);
        input.addEventListener('change', handler);
    }

    function bindCheck(input, key, onSet) {
        if (!input) return;
        input.addEventListener('change', function () {
            state[key] = input.checked;
            if (onSet) onSet(input.checked);
            refresh(false);
        });
    }

    bindNum(el.aciklik, 'aciklik');
    bindNum(el.asabaAdet, 'asabaAdet', function (v) {
        return Math.max(1, Math.min(50, Math.floor(Number(v) || 1)));
    });
    bindNum(el.asabaH, 'asabaH', null, function () { state.hKaynak = 'asaba'; });
    bindNum(el.toplamH, 'toplamH', null, function () { state.hKaynak = 'toplam'; });
    bindNum(el.asabaDerinlik, 'asabaDerinlik', function (v) {
        return Math.max(0, Number(v) || 0);
    }, function () { state.dKaynak = 'asaba'; });
    bindNum(el.toplamDerinlik, 'toplamDerinlik', function (v) {
        return Math.max(0, Number(v) || 0);
    }, function () { state.dKaynak = 'toplam'; });
    bindNum(el.derinlik, 'derinlik', function (v) {
        return Math.max(0, Number(v) || 0);
    });
    bindNum(el.sira, 'sira', function (v) {
        return Math.max(1, Math.min(50, Math.floor(Number(v) || 1)));
    });
    bindCheck(el.altinOran, 'altinOran', function (acik) {
        // Oran kapatilirken hic manuel deger girilmemisse, alanlarda gorunen
        // oran degerlerinden devam edilir; girilmisse onlar geri gelir.
        if (!acik && state.asabaH <= 0 && state.toplamH <= 0 && state.result) {
            state.asabaH = state.result.asabaH;
            state.toplamH = state.result.toplamH;
            state.hKaynak = 'toplam';
        }
    });
    bindCheck(el.showB, 'showModuleB');
    bindCheck(el.showLabels, 'showLabels');

    if (el.view2d && el.view3d) {
        el.view2d.parentElement.addEventListener('click', function () { setActive('2d'); });
        el.view3d.parentElement.addEventListener('click', function () { setActive('3d'); });
    }

    function setActive(view) {
        state.activeView = view;
        document.querySelectorAll('.viewport').forEach(function (vp) {
            vp.classList.remove('active');
        });
        const target = view === '2d' ? el.view2d.parentElement : el.view3d.parentElement;
        if (target) target.classList.add('active');
    }
    setActive('2d');

    if (el.btnSTL) {
        el.btnSTL.addEventListener('click', function () {
            try {
                if (!state.result || !state.result.cells.length) {
                    showToast('STL icin geometri yok', true);
                    return;
                }
                window.exportSTL(state.result, EXPORT_BASE + '.stl');
                showToast('STL indirildi', false);
            } catch (err) {
                showToast('STL hata: ' + err.message, true);
            }
        });
    }

    if (el.btnDXF) {
        el.btnDXF.addEventListener('click', function () {
            try {
                if (!state.result || !state.result.cells.length) {
                    showToast('DXF icin geometri yok', true);
                    return;
                }
                window.exportDXF(state.result, EXPORT_BASE + '.dxf');
                showToast('DXF indirildi', false);
            } catch (err) {
                showToast('DXF hata: ' + err.message, true);
            }
        });
    }

    if (el.btnPNG) {
        el.btnPNG.addEventListener('click', function () {
            const name = EXPORT_BASE + '-' + state.activeView + '.png';
            const p = state.activeView === '3d'
                ? window.exportPNG.from3D(viewer3d, name)
                : window.exportPNG.from2D(viewer2d, name);
            p.then(function () {
                showToast('PNG indirildi (' + state.activeView.toUpperCase() + ')', false);
            }).catch(function (err) {
                showToast('PNG hata: ' + err.message, true);
            });
        });
    }

    if (el.btnReset) {
        el.btnReset.addEventListener('click', function () {
            Object.assign(state, DEFAULTS);
            if (el.aciklik) el.aciklik.value = DEFAULTS.aciklik;
            if (el.asabaAdet) el.asabaAdet.value = DEFAULTS.asabaAdet;
            if (el.asabaH) el.asabaH.value = '';
            if (el.toplamH) el.toplamH.value = '';
            if (el.asabaDerinlik) el.asabaDerinlik.value = '';
            if (el.toplamDerinlik) el.toplamDerinlik.value = '';
            if (el.derinlik) el.derinlik.value = DEFAULTS.derinlik;
            if (el.sira) el.sira.value = DEFAULTS.sira;
            if (el.altinOran) el.altinOran.checked = DEFAULTS.altinOran;
            if (el.showB) el.showB.checked = DEFAULTS.showModuleB;
            if (el.showLabels) el.showLabels.checked = DEFAULTS.showLabels;
            refresh(true);
            showToast('Parametreler sifirlandi', false);
        });
    }

    /** Proje dosyasina yazilan/okunan alanlar (viewer durumu haric). */
    const PROJE_ALANLARI = [
        'aciklik', 'asabaAdet', 'sira',
        'asabaH', 'toplamH', 'hKaynak', 'altinOran',
        'asabaDerinlik', 'toplamDerinlik', 'dKaynak',
        'derinlik', 'showModuleB', 'showLabels'
    ];

    function projeParametreleri() {
        const p = {};
        for (let i = 0; i < PROJE_ALANLARI.length; i++) {
            const k = PROJE_ALANLARI[i];
            p[k] = state[k];
        }
        return p;
    }

    /** 0/bos ise alani bos birak: otomatik mod refresh sirasinda doldurur. */
    function alanaYaz(input, deger) {
        if (input) input.value = deger > 0 ? deger : '';
    }

    function projeyiUygula(p) {
        for (let i = 0; i < PROJE_ALANLARI.length; i++) {
            const k = PROJE_ALANLARI[i];
            if (p[k] !== undefined) state[k] = p[k];
        }
        if (el.aciklik) el.aciklik.value = state.aciklik;
        if (el.asabaAdet) el.asabaAdet.value = state.asabaAdet;
        if (el.sira) el.sira.value = state.sira;
        alanaYaz(el.asabaH, state.asabaH);
        alanaYaz(el.toplamH, state.toplamH);
        alanaYaz(el.asabaDerinlik, state.asabaDerinlik);
        alanaYaz(el.toplamDerinlik, state.toplamDerinlik);
        if (el.derinlik) el.derinlik.value = state.derinlik;
        if (el.altinOran) el.altinOran.checked = !!state.altinOran;
        if (el.showB) el.showB.checked = !!state.showModuleB;
        if (el.showLabels) el.showLabels.checked = !!state.showLabels;
        refresh(true);
    }

    if (el.btnProjectSave) {
        el.btnProjectSave.addEventListener('click', function () {
            window.ProjectIO.kaydet(projeParametreleri(), EXPORT_BASE + '.json')
                .then(function (r) {
                    if (r.iptal) return;
                    showToast(
                        r.pencere
                            ? 'Proje kaydedildi: ' + r.ad
                            : 'Proje indirildi: ' + r.ad,
                        false
                    );
                })
                .catch(function (e) {
                    showToast('Kaydetme hatasi: ' + (e.message || e), true);
                });
        });
    }

    if (el.btnProjectOpen) {
        el.btnProjectOpen.addEventListener('click', function () {
            window.ProjectIO.ac()
                .then(function (r) {
                    if (r.iptal) return;
                    projeyiUygula(r.parametreler);
                    showToast('Proje acildi: ' + r.ad, false);
                })
                .catch(function (e) {
                    showToast('Acma hatasi: ' + (e.message || e), true);
                });
        });
    }

    if (el.btnFitCam) {
        el.btnFitCam.addEventListener('click', function () {
            if (state.result && viewer3d) viewer3d.fitView(state.result);
        });
    }

    function showHelp(show) {
        if (!el.helpOverlay) return;
        if (show) el.helpOverlay.removeAttribute('hidden');
        else el.helpOverlay.setAttribute('hidden', '');
    }

    if (el.btnHelp) el.btnHelp.addEventListener('click', function () { showHelp(true); });
    if (el.btnHelpClose) el.btnHelpClose.addEventListener('click', function () { showHelp(false); });
    if (el.helpOverlay) {
        el.helpOverlay.addEventListener('click', function (e) {
            if (e.target === el.helpOverlay) showHelp(false);
        });
    }
    window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') showHelp(false);
    });

    window.addEventListener('resize', function () {
        if (viewer2d) viewer2d.resize();
        if (viewer3d) viewer3d.resize();
    });

    requestAnimationFrame(function () {
        try {
            refresh(true);
        } catch (e) {
            showToast(e.message || String(e), true);
        }
    });
})();
