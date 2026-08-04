// Mukarnas web uygulamasi (global - file:// uyumlu)
(function () {
    'use strict';

    if (typeof THREE === 'undefined') {
        document.body.innerHTML =
            '<div style="padding:24px;color:#fff;font-family:sans-serif">' +
            '<strong>Three.js yuklenemedi.</strong> Internet baglantisi gerekli (CDN).' +
            '</div>';
        return;
    }

    const Geom = window.MukarnasGeom;
    const Modify = window.MukarnasModify;
    const Viewer2D = window.Viewer2D;
    const Viewer3D = window.Viewer3D;

    const DEFAULTS = {
        type: 'badem',
        variant: 'tam',
        asaba: 0,
        autoAsaba: true,
        autoAraMesafe: true,
        araMesafe: 0,
        autoAraMesafe78: true,
        araMesafe78: 0,
        p1x: 0, p1y: 0,
        p2x: 100, p2y: 0,
        p3x: 50, p3y: 80,
        p4x: 50, p4y: -80
    };

    const state = {
        mode: 'draw',
        type: DEFAULTS.type,
        variant: DEFAULTS.variant,
        asaba: DEFAULTS.asaba,
        autoAsaba: DEFAULTS.autoAsaba,
        autoAraMesafe: DEFAULTS.autoAraMesafe,
        araMesafe: DEFAULTS.araMesafe,
        autoAraMesafe78: DEFAULTS.autoAraMesafe78,
        araMesafe78: DEFAULTS.araMesafe78,
        p1x: DEFAULTS.p1x, p1y: DEFAULTS.p1y,
        p2x: DEFAULTS.p2x, p2y: DEFAULTS.p2y,
        p3x: DEFAULTS.p3x, p3y: DEFAULTS.p3y,
        p4x: DEFAULTS.p4x, p4y: DEFAULTS.p4y,
        result: null,
        modifyState: null,
        activeView: '2d',
        syncingModifyUI: false,
        showVertexNumbers3d: true,
        showSegmentLabels3d: true
    };

    const el = {
        radiosType: document.querySelectorAll('input[name="muk-tipi"]'),
        radiosVar:  document.querySelectorAll('input[name="muk-variant"]'),
        asaba:      document.getElementById('param-asaba'),
        autoAsaba:  document.getElementById('param-auto-asaba'),
        araMesafe:  document.getElementById('param-ara-mesafe'),
        autoAraMesafe: document.getElementById('param-auto-ara-mesafe'),
        araMesafe78: document.getElementById('param-ara-mesafe78'),
        autoAraMesafe78: document.getElementById('param-auto-ara-mesafe78'),
        panelAra78: document.getElementById('panel-ara-78'),
        readoutBbx: document.getElementById('readout-bbx'),
        p1x: document.getElementById('param-p1x'),
        p1y: document.getElementById('param-p1y'),
        p2x: document.getElementById('param-p2x'),
        p2y: document.getElementById('param-p2y'),
        p3x: document.getElementById('param-p3x'),
        p3y: document.getElementById('param-p3y'),
        p4x: document.getElementById('param-p4x'),
        p4y: document.getElementById('param-p4y'),
        panelP4Fields: document.getElementById('panel-p4-fields'),
        planPanelTitle: document.getElementById('plan-panel-title'),
        view2dTitle: document.getElementById('view2d-title'),
        readoutAsaba: document.getElementById('readout-asaba'),
        readoutVerts: document.getElementById('readout-verts'),
        readoutMboy: document.getElementById('readout-mboy'),
        readoutMoveMap: document.getElementById('readout-move-map'),
        view2d: document.getElementById('view2d'),
        view3d: document.getElementById('view3d'),
        view3dVertexNumbers: document.getElementById('view3d-vertex-numbers'),
        view3dSegmentLabels: document.getElementById('view3d-segment-labels'),
        btnReset:   document.getElementById('btn-reset'),
        btnUndo:    document.getElementById('btn-undo'),
        btnRedo:    document.getElementById('btn-redo'),
        btnFitCam:  document.getElementById('btn-fit-camera'),
        btnSTL:     document.getElementById('btn-export-stl'),
        btnDXF:     document.getElementById('btn-export-dxf'),
        btnPNG:     document.getElementById('btn-export-png'),
        btnHelp:    document.getElementById('btn-help'),
        btnHelpClose: document.getElementById('btn-help-close'),
        helpOverlay:  document.getElementById('help-overlay'),
        btnModeDraw: document.getElementById('btn-mode-draw'),
        btnModeModify: document.getElementById('btn-mode-modify'),
        panelModify: document.querySelector('.panel-modify'),
        panelsDraw: document.querySelectorAll('.panel-draw'),
        panelPlan: document.querySelector('.panel-plan'),
        btnModReset: document.getElementById('btn-mod-reset'),
        modBoy: document.getElementById('mod-boy'),
        modBoyLabel: document.getElementById('mod-boy-label'),
        modBoyHeight: document.getElementById('mod-boy-height'),
        modInputs: {
            mA: document.getElementById('mod-mA'),
            mB: document.getElementById('mod-mB'),
            mC: document.getElementById('mod-mC'),
            mD: document.getElementById('mod-mD'),
            mE: document.getElementById('mod-mE'),
            mF: document.getElementById('mod-mF')
        }
    };

    const viewer2d = new Viewer2D(el.view2d);
    const viewer3d = new Viewer3D(el.view3d);

    const HISTORY_MAX = 50;
    const undoStack = [];
    const redoStack = [];
    let historyPaused = false;
    let dragHistoryPushed = false;

    function cloneModifyState(ms) {
        if (!ms) return null;
        return {
            profile: ms.profile,
            snapshot: Modify.cloneMesh(ms.snapshot),
            segments: Object.assign({}, ms.segments),
            boyMode: ms.boyMode,
            boyValue: ms.boyValue,
            baseMboy: ms.baseMboy,
            boyBaseSnapshot: ms.boyBaseSnapshot ? Modify.cloneMesh(ms.boyBaseSnapshot) : null
        };
    }

    function snapshotState() {
        return {
            mode: state.mode,
            type: state.type,
            variant: state.variant,
            asaba: state.asaba,
            autoAsaba: state.autoAsaba,
            autoAraMesafe: state.autoAraMesafe,
            araMesafe: state.araMesafe,
            autoAraMesafe78: state.autoAraMesafe78,
            araMesafe78: state.araMesafe78,
            p1x: state.p1x, p1y: state.p1y,
            p2x: state.p2x, p2y: state.p2y,
            p3x: state.p3x, p3y: state.p3y,
            p4x: state.p4x, p4y: state.p4y,
            modifyState: cloneModifyState(state.modifyState)
        };
    }

    function syncUIFromState() {
        el.p1x.value = state.p1x; el.p1y.value = state.p1y;
        el.p2x.value = state.p2x; el.p2y.value = state.p2y;
        el.p3x.value = state.p3x; el.p3y.value = state.p3y;
        el.p4x.value = state.p4x; el.p4y.value = state.p4y;
        el.autoAsaba.checked = state.autoAsaba;
        el.asaba.value = state.asaba;
        el.autoAraMesafe.checked = state.autoAraMesafe;
        el.araMesafe.value = state.araMesafe;
        el.araMesafe.disabled = state.autoAraMesafe;
        el.autoAraMesafe78.checked = state.autoAraMesafe78;
        el.araMesafe78.value = state.araMesafe78;
        el.araMesafe78.disabled = state.autoAraMesafe78;
        syncAra78PanelVisibility();

        for (let i = 0; i < el.radiosType.length; i++) {
            el.radiosType[i].checked = (el.radiosType[i].value === state.type);
        }
        for (let i = 0; i < el.radiosVar.length; i++) {
            el.radiosVar[i].checked = (el.radiosVar[i].value === state.variant);
        }

        syncVariantUI();
        applyModeUI(state.mode);
    }

    function applyModeUI(mode) {
        const isModify = (mode === 'modify');
        el.btnModeDraw.classList.toggle('active', !isModify);
        el.btnModeModify.classList.toggle('active', isModify);
        el.panelModify.hidden = !isModify;
        for (let i = 0; i < el.panelsDraw.length; i++) {
            const panel = el.panelsDraw[i];
            panel.hidden = isModify && panel !== el.panelPlan;
        }
    }

    function applySnapshot(snap) {
        historyPaused = true;
        state.mode = snap.mode;
        state.type = snap.type;
        state.variant = snap.variant;
        state.asaba = snap.asaba;
        state.autoAsaba = snap.autoAsaba;
        state.autoAraMesafe = snap.autoAraMesafe != null ? snap.autoAraMesafe : true;
        state.araMesafe = snap.araMesafe != null ? snap.araMesafe : 0;
        state.autoAraMesafe78 = snap.autoAraMesafe78 != null ? snap.autoAraMesafe78 : true;
        state.araMesafe78 = snap.araMesafe78 != null ? snap.araMesafe78 : 0;
        state.p1x = snap.p1x; state.p1y = snap.p1y;
        state.p2x = snap.p2x; state.p2y = snap.p2y;
        state.p3x = snap.p3x; state.p3y = snap.p3y;
        state.p4x = snap.p4x; state.p4y = snap.p4y;
        state.modifyState = cloneModifyState(snap.modifyState);
        syncUIFromState();
        refresh(false);
        historyPaused = false;
        updateHistoryButtons();
    }

    function updateHistoryButtons() {
        el.btnUndo.disabled = undoStack.length === 0;
        el.btnRedo.disabled = redoStack.length === 0;
    }

    function pushHistory() {
        if (historyPaused) return;
        undoStack.push(snapshotState());
        if (undoStack.length > HISTORY_MAX) {
            undoStack.shift();
        }
        redoStack.length = 0;
        updateHistoryButtons();
    }

    function undo() {
        if (undoStack.length === 0) return;
        redoStack.push(snapshotState());
        applySnapshot(undoStack.pop());
    }

    function redo() {
        if (redoStack.length === 0) return;
        undoStack.push(snapshotState());
        applySnapshot(redoStack.pop());
    }

    const POINT_KEYS = [
        ['p1x', 'p1y'],
        ['p2x', 'p2y'],
        ['p3x', 'p3y'],
        ['p4x', 'p4y']
    ];

    function syncVariantUI() {
        const isAsym = (state.variant === 'tam-asym');
        el.panelP4Fields.hidden = !isAsym;
        syncAra78PanelVisibility();
        el.planPanelTitle.textContent = isAsym
            ? 'Plan Dortgeni (P1-P2-P3-P4)'
            : 'Plan Ucgeni (P1-P2-P3)';
        el.view2dTitle.textContent = isAsym
            ? '2D Plan (Shift: dikey, Ctrl: yatay kilidi)'
            : '2D Plan (Shift: dikey, Ctrl: yatay kilidi)';
    }

    viewer2d.onPointDragStart = function () {
        if (dragHistoryPushed) return;
        pushHistory();
        dragHistoryPushed = true;
        if (state.mode === 'modify') {
            state.modifyState = null;
        }
    };

    viewer2d.onPointDragEnd = function () {
        dragHistoryPushed = false;
    };

    viewer2d.onPointDrag = function (index, x, y) {
        if (index >= POINT_KEYS.length) return;
        const keys = POINT_KEYS[index];
        let rx = Math.round(x * 10) / 10;
        let ry = Math.round(y * 10) / 10;
        if (index === 2 && state.variant === 'sag') {
            const p1 = Geom.v3(state.p1x, state.p1y, 0);
            const p2 = Geom.v3(state.p2x, state.p2y, 0);
            const unref = Geom.reflectPointAcrossP1P2(Geom.v3(rx, ry, 0), p1, p2);
            rx = Math.round(unref.x * 10) / 10;
            ry = Math.round(unref.y * 10) / 10;
        }
        state[keys[0]] = rx;
        state[keys[1]] = ry;
        el[keys[0]].value = rx;
        el[keys[1]].value = ry;
        if (state.mode === 'modify') {
            state.modifyState = null;
        }
        refresh(false);
    };

    function showToast(message, isError) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        const t = document.createElement('div');
        t.className = 'toast' + (isError ? ' error' : '');
        t.textContent = message;
        document.body.appendChild(t);
        setTimeout(function () { t.remove(); }, 2200);
    }

    function syncAsabaInput() {
        el.asaba.disabled = state.autoAsaba;
        if (state.autoAsaba) {
            const auto = Geom.calcAutoAsaba(
                Geom.v3(state.p1x, state.p1y, 0),
                Geom.v3(state.p2x, state.p2y, 0),
                Geom.v3(state.p3x, state.p3y, 0)
            );
            el.asaba.value = auto;
            state.asaba = auto;
        }
    }

    function syncAraMesafeInput() {
        el.araMesafe.disabled = state.autoAraMesafe;
        const p1 = Geom.v3(state.p1x, state.p1y, 0);
        const p2 = Geom.v3(state.p2x, state.p2y, 0);
        const p3 = Geom.v3(state.p3x, state.p3y, 0);
        if (state.autoAraMesafe) {
            const cut = Geom.resolveBbx(state.type, p1, p2, p3, state.asaba, { autoAraMesafe: true });
            state.araMesafe = Math.round(cut.araMesafe * 100) / 100;
            el.araMesafe.value = state.araMesafe;
        }
    }

    function syncAra78PanelVisibility() {
        if (el.panelAra78) {
            el.panelAra78.hidden = (state.type !== 'badem');
        }
    }

    function syncAraMesafe78Input() {
        if (state.type !== 'badem') return;
        el.araMesafe78.disabled = state.autoAraMesafe78;
        const p1 = Geom.v3(state.p1x, state.p1y, 0);
        const p2 = Geom.v3(state.p2x, state.p2y, 0);
        const p3 = Geom.v3(state.p3x, state.p3y, 0);
        const cut = Geom.resolveBbx(state.type, p1, p2, p3, state.asaba, {
            autoAraMesafe: state.autoAraMesafe,
            araMesafe: state.araMesafe,
            autoAraMesafe78: true
        });
        if (state.autoAraMesafe78) {
            const d = Geom.calcAraMesafe78(p1, p2, p3, state.asaba, cut);
            state.araMesafe78 = Math.round(d * 100) / 100;
            el.araMesafe78.value = state.araMesafe78;
        }
    }

    function generateBaseResult() {
        syncAsabaInput();
        syncAraMesafeInput();
        syncAraMesafe78Input();
        const params = {
            type: state.type,
            variant: state.variant,
            asaba: state.asaba,
            autoAsaba: state.autoAsaba,
            autoAraMesafe: state.autoAraMesafe,
            araMesafe: state.araMesafe,
            autoAraMesafe78: state.autoAraMesafe78,
            araMesafe78: state.araMesafe78,
            p1: Geom.v3(state.p1x, state.p1y, 0),
            p2: Geom.v3(state.p2x, state.p2y, 0),
            p3: Geom.v3(state.p3x, state.p3y, 0)
        };
        if (state.variant === 'tam-asym') {
            params.p4 = Geom.v3(state.p4x, state.p4y, 0);
        }
        return Geom.generateMukarnas(params);
    }

    function initModifyFromBase(baseResult) {
        if (!Modify.getProfile(state.type, state.variant)) {
            showToast('Bu tip icin duzenleme profili yok', true);
            return false;
        }
        state.modifyState = Modify.initModifyState(baseResult, state.type, state.variant);
        if (!state.modifyState) {
            showToast('Duzenleme baslatilamadi', true);
            return false;
        }
        syncModifyUI();
        return true;
    }

    function syncModifyUI() {
        if (!state.modifyState) return;
        state.syncingModifyUI = true;
        const seg = state.modifyState.segments;
        const active = document.activeElement;
        Modify.SEG_KEYS.forEach(function (k) {
            const inp = el.modInputs[k];
            if (inp && inp !== active) {
                inp.value = seg[k].toFixed(2);
            }
        });
        if (el.modBoy !== active) {
            el.modBoy.value = state.modifyState.boyValue.toFixed(2);
        }
        el.readoutMboy.textContent = seg.mboy.toFixed(2) + ' birim';
        el.modBoyLabel.textContent = state.modifyState.boyMode === 'height' ? 'BOY' : 'BOY %';
        el.modBoyHeight.checked = (state.modifyState.boyMode === 'height');
        el.readoutMoveMap.textContent = Modify.formatMoveMap(state.modifyState.profile);
        state.syncingModifyUI = false;
    }

    function refreshModifyView() {
        const display = Modify.applyToResult(generateBaseResult(), state.modifyState);
        state.result = display;
        el.readoutVerts.textContent = display.mesh
            ? display.mesh.vertices.length + ' / ' + display.mesh.faces.length
            : '\u2014';
        updateViewers(display, false);
    }

    function parseModifyInput(input) {
        const raw = String(input.value).trim().replace(',', '.');
        if (raw === '' || raw === '-' || raw === '.') return null;
        const val = Number(raw);
        return Number.isFinite(val) ? val : null;
    }

    function commitModifySegment(key) {
        if (state.mode !== 'modify' || !state.modifyState) return;
        const input = el.modInputs[key];
        if (!input) return;
        const val = parseModifyInput(input);
        if (val === null) {
            syncModifyUI();
            return;
        }
        if (val < 0) {
            showToast('Segment yuksekligi sifirdan kucuk olamaz', true);
            syncModifyUI();
            return;
        }
        if (Math.abs(state.modifyState.segments[key] - val) < 1e-6) return;
        pushHistory();
        Modify.applySegmentEdit(state.modifyState, key, val);
        syncModifyUI();
        refreshModifyView();
    }

    function nudgeModifyInput(input, delta) {
        const step = Number(input.step) || 0.1;
        const cur = parseModifyInput(input);
        const base = cur !== null ? cur : 0;
        input.value = Math.max(0, base + delta * step).toFixed(2);
    }

    function commitModifyBoy() {
        if (state.mode !== 'modify' || !state.modifyState) return;
        const val = parseModifyInput(el.modBoy);
        if (val === null) {
            syncModifyUI();
            return;
        }
        if (val < 0) {
            showToast('BOY sifirdan kucuk olamaz', true);
            syncModifyUI();
            return;
        }
        if (Math.abs(state.modifyState.boyValue - val) < 1e-6) return;
        pushHistory();
        Modify.applyBoyScale(state.modifyState, val, state.modifyState.boyMode);
        syncModifyUI();
        refreshModifyView();
    }

    function bindModifyNumberInput(input, onCommit, onNudge) {
        input.addEventListener('focus', function () {
            input.select();
        });

        input.addEventListener('change', function () {
            if (state.syncingModifyUI) return;
            onCommit();
        });

        input.addEventListener('input', function (e) {
            if (state.syncingModifyUI) return;
            const t = e.inputType || '';
            if (t === 'insertText' || t === 'deleteContentBackward' || t === 'deleteContentForward') {
                return;
            }
            onCommit();
        });

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                onCommit();
                input.blur();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                onNudge(1);
                onCommit();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                onNudge(-1);
                onCommit();
            }
        });
    }

    function getViewer3DOptions(result) {
        if (!result || !result.mesh) return {};

        const p3 = result.planPoints
            ? result.planPoints[2]
            : (result.planTriangle ? result.planTriangle[2] : null);
        const opts = {};

        if (state.showVertexNumbers3d) {
            opts.showVertexNumbers = true;
            opts.p3 = p3;
        }

        if (state.showSegmentLabels3d) {
            const profile = (state.mode === 'modify' && state.modifyState)
                ? state.modifyState.profile
                : Modify.resolveProfile(state.type, state.variant, result.vertexRemap);
            if (profile) {
                opts.showSegmentLabels = true;
                opts.p3 = p3;
                opts.segmentMarkers = Modify.getSegmentMarkers(profile, result.mesh.vertices, {
                    variant: state.variant,
                    p3: p3
                });
            }
        }

        return opts;
    }

    function refresh3DOverlay() {
        if (state.result && state.result.mesh) {
            viewer3d.update(state.result, getViewer3DOptions(state.result));
        }
    }

    function updateViewers(result, fitCam) {
        viewer2d.update(result);
        viewer3d.update(result, getViewer3DOptions(result));
        if (fitCam && result.mesh) {
            viewer3d.fitView(result);
        }
    }

    function setMode(mode, skipHistory) {
        if (!skipHistory && mode !== state.mode) {
            pushHistory();
        }
        state.mode = mode;
        const isModify = (mode === 'modify');

        applyModeUI(mode);

        if (isModify) {
            if (!state.modifyState) {
                const base = generateBaseResult();
                if (!initModifyFromBase(base)) {
                    setMode('draw', true);
                    return;
                }
            }
        }

        refresh(false);
    }

    function refresh(fitCam) {
        let result = generateBaseResult();

        if (result.error) {
            showToast(result.error, true);
        }

        if (state.mode === 'modify') {
            if (!state.modifyState) {
                initModifyFromBase(result);
            }
            if (state.modifyState) {
                result = Modify.applyToResult(result, state.modifyState);
            }
        } else {
            state.modifyState = null;
        }

        state.result = result;
        el.readoutAsaba.textContent = result.asaba + ' birim';
        if (result.bbx != null) {
            el.readoutBbx.textContent = result.bbx.toFixed(3) + ' birim';
        }
        el.readoutVerts.textContent = result.mesh
            ? result.mesh.vertices.length + ' / ' + result.mesh.faces.length
            : '\u2014';

        if (state.mode === 'modify' && state.modifyState) {
            syncModifyUI();
        }

        updateViewers(result, fitCam);
    }

    function bindParam(input, key, parser) {
        parser = parser || Number;
        let editBaseline = null;

        function applyValue() {
            const v = parser(input.value);
            if (Number.isFinite(v)) {
                state[key] = v;
                if (state.mode === 'modify') {
                    state.modifyState = null;
                }
                refresh(false);
            }
        }

        input.addEventListener('focus', function () {
            if (historyPaused) return;
            editBaseline = snapshotState();
        });

        input.addEventListener('input', applyValue);

        input.addEventListener('change', function () {
            if (historyPaused || !editBaseline) return;
            const cur = snapshotState();
            if (JSON.stringify(editBaseline) !== JSON.stringify(cur)) {
                undoStack.push(editBaseline);
                if (undoStack.length > HISTORY_MAX) undoStack.shift();
                redoStack.length = 0;
                updateHistoryButtons();
            }
            editBaseline = null;
        });
    }

    bindParam(el.p1x, 'p1x');
    bindParam(el.p1y, 'p1y');
    bindParam(el.p2x, 'p2x');
    bindParam(el.p2y, 'p2y');
    bindParam(el.p3x, 'p3x');
    bindParam(el.p3y, 'p3y');
    bindParam(el.p4x, 'p4x');
    bindParam(el.p4y, 'p4y');
    bindParam(el.asaba, 'asaba');
    bindParam(el.araMesafe, 'araMesafe');
    bindParam(el.araMesafe78, 'araMesafe78');

    el.autoAraMesafe.addEventListener('change', function () {
        pushHistory();
        state.autoAraMesafe = el.autoAraMesafe.checked;
        if (state.mode === 'modify') state.modifyState = null;
        refresh(false);
    });

    function onVariantChange(variant) {
        if (variant === 'tam-asym') {
            const p1 = Geom.v3(state.p1x, state.p1y, 0);
            const p2 = Geom.v3(state.p2x, state.p2y, 0);
            const p3 = Geom.v3(state.p3x, state.p3y, 0);
            const defP4 = Geom.reflectPointAcrossP1P2(p3, p1, p2);
            if (state.p4x === DEFAULTS.p4x && state.p4y === DEFAULTS.p4y && state.p3y >= 0) {
                state.p4x = Math.round(defP4.x * 10) / 10;
                state.p4y = Math.round(defP4.y * 10) / 10;
            }
            el.p4x.value = state.p4x;
            el.p4y.value = state.p4y;
        }
        syncVariantUI();
    }

    el.autoAsaba.addEventListener('change', function () {
        pushHistory();
        state.autoAsaba = el.autoAsaba.checked;
        if (state.mode === 'modify') state.modifyState = null;
        refresh(false);
    });

    el.autoAraMesafe78.addEventListener('change', function () {
        pushHistory();
        state.autoAraMesafe78 = el.autoAraMesafe78.checked;
        if (state.mode === 'modify') state.modifyState = null;
        refresh(false);
    });

    for (let i = 0; i < el.radiosType.length; i++) {
        el.radiosType[i].addEventListener('change', function (e) {
            if (!e.target.checked) return;
            pushHistory();
            state.type = e.target.value;
            state.modifyState = null;
            syncAra78PanelVisibility();
            refresh(false);
        });
    }

    for (let i = 0; i < el.radiosVar.length; i++) {
        el.radiosVar[i].addEventListener('change', function (e) {
            if (!e.target.checked) return;
            pushHistory();
            state.variant = e.target.value;
            state.modifyState = null;
            onVariantChange(state.variant);
            refresh(false);
        });
    }

    Modify.SEG_KEYS.forEach(function (key) {
        const input = el.modInputs[key];
        if (!input) return;
        bindModifyNumberInput(
            input,
            function () { commitModifySegment(key); },
            function (delta) { nudgeModifyInput(input, delta); }
        );
    });

    bindModifyNumberInput(
        el.modBoy,
        commitModifyBoy,
        function (delta) { nudgeModifyInput(el.modBoy, delta); }
    );

    el.modBoyHeight.addEventListener('change', function () {
        if (!state.modifyState) return;
        pushHistory();
        state.modifyState.boyMode = el.modBoyHeight.checked ? 'height' : 'percent';
        state.modifyState.boyBaseSnapshot = null;
        if (state.modifyState.boyMode === 'percent') {
            state.modifyState.boyValue = 100;
        } else {
            state.modifyState.boyValue = state.modifyState.segments.mboy;
        }
        syncModifyUI();
    });

    el.btnModeDraw.addEventListener('click', function () { setMode('draw'); });
    el.btnModeModify.addEventListener('click', function () { setMode('modify'); });

    el.btnModReset.addEventListener('click', function () {
        if (state.mode !== 'modify') return;
        pushHistory();
        const base = generateBaseResult();
        initModifyFromBase(base);
        refresh(false);
        showToast('Duzenleme sifirlandi', false);
    });

    el.btnUndo.addEventListener('click', undo);
    el.btnRedo.addEventListener('click', redo);

    el.view2d.parentElement.addEventListener('click', function () { setActive('2d'); });
    el.view3d.parentElement.addEventListener('click', function () { setActive('3d'); });

    el.view3dVertexNumbers.addEventListener('change', function () {
        state.showVertexNumbers3d = el.view3dVertexNumbers.checked;
        refresh3DOverlay();
    });

    el.view3dSegmentLabels.addEventListener('change', function () {
        state.showSegmentLabels3d = el.view3dSegmentLabels.checked;
        refresh3DOverlay();
    });

    function setActive(view) {
        state.activeView = view;
        const vps = document.querySelectorAll('.viewport');
        for (let i = 0; i < vps.length; i++) vps[i].classList.remove('active');
        const target = (view === '2d') ? el.view2d.parentElement : el.view3d.parentElement;
        target.classList.add('active');
    }
    setActive('2d');

    function fileBase() {
        const suffix = state.mode === 'modify' ? '-mod' : '';
        return 'mukarnas-' + state.type + '-' + state.variant + suffix;
    }

    el.btnSTL.addEventListener('click', function () {
        try {
            if (!state.result || !state.result.mesh) {
                showToast('STL icin gecerli geometri yok', true);
                return;
            }
            window.exportSTL(state.result, fileBase() + '.stl');
            showToast('STL indirildi', false);
        } catch (err) {
            console.error(err);
            showToast('STL hata: ' + err.message, true);
        }
    });

    el.btnDXF.addEventListener('click', function () {
        try {
            if (!state.result || !state.result.mesh) {
                showToast('DXF icin gecerli geometri yok', true);
                return;
            }
            window.exportDXF(state.result, fileBase() + '.dxf');
            showToast('DXF indirildi', false);
        } catch (err) {
            console.error(err);
            showToast('DXF hata: ' + err.message, true);
        }
    });

    el.btnPNG.addEventListener('click', function () {
        const p = (state.activeView === '3d')
            ? window.exportPNG.from3D(viewer3d, fileBase() + '-3d.png')
            : window.exportPNG.from2D(viewer2d, fileBase() + '-2d.png');
        p.then(function () {
            showToast('PNG indirildi (' + state.activeView.toUpperCase() + ')', false);
        }).catch(function (err) {
            console.error(err);
            showToast('PNG hata: ' + err.message, true);
        });
    });

    el.btnReset.addEventListener('click', function () {
        pushHistory();
        state.type = DEFAULTS.type;
        state.variant = DEFAULTS.variant;
        state.asaba = DEFAULTS.asaba;
        state.autoAsaba = DEFAULTS.autoAsaba;
        state.autoAraMesafe = DEFAULTS.autoAraMesafe;
        state.araMesafe = DEFAULTS.araMesafe;
        state.autoAraMesafe78 = DEFAULTS.autoAraMesafe78;
        state.araMesafe78 = DEFAULTS.araMesafe78;
        state.p1x = DEFAULTS.p1x; state.p1y = DEFAULTS.p1y;
        state.p2x = DEFAULTS.p2x; state.p2y = DEFAULTS.p2y;
        state.p3x = DEFAULTS.p3x; state.p3y = DEFAULTS.p3y;
        state.p4x = DEFAULTS.p4x; state.p4y = DEFAULTS.p4y;
        state.modifyState = null;

        el.p1x.value = DEFAULTS.p1x; el.p1y.value = DEFAULTS.p1y;
        el.p2x.value = DEFAULTS.p2x; el.p2y.value = DEFAULTS.p2y;
        el.p3x.value = DEFAULTS.p3x; el.p3y.value = DEFAULTS.p3y;
        el.p4x.value = DEFAULTS.p4x; el.p4y.value = DEFAULTS.p4y;
        el.autoAsaba.checked = DEFAULTS.autoAsaba;
        el.autoAraMesafe.checked = DEFAULTS.autoAraMesafe;
        el.autoAraMesafe78.checked = DEFAULTS.autoAraMesafe78;

        for (let i = 0; i < el.radiosType.length; i++) {
            el.radiosType[i].checked = (el.radiosType[i].value === DEFAULTS.type);
        }
        for (let i = 0; i < el.radiosVar.length; i++) {
            el.radiosVar[i].checked = (el.radiosVar[i].value === DEFAULTS.variant);
        }

        setMode('draw', true);
        syncVariantUI();
        refresh(true);
        showToast('Parametreler sifirlandi', false);
    });

    el.btnFitCam.addEventListener('click', function () {
        if (state.result && state.result.mesh) {
            viewer3d.fitView(state.result);
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
        if (e.ctrlKey && !e.altKey && !e.metaKey) {
            const key = e.key.toLowerCase();
            if (key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
                e.preventDefault();
                redo();
            }
        }
    });

    window.addEventListener('resize', function () {
        viewer2d.resize();
        viewer3d.resize();
    });

    requestAnimationFrame(function () {
        try {
            syncVariantUI();
            refresh(true);
            updateHistoryButtons();
        } catch (e) {
            console.error(e);
            showToast(e.message || String(e), true);
        }
    });
})();
