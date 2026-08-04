// 2D plan viewer — mukarnas plan kafesi + sürüklenebilir P1–P3 (global, file:// uyumlu)
(function (global) {
    'use strict';

    const Geom = global.MukarnasGeom;
    const SVG_NS = 'http://www.w3.org/2000/svg';

    const COL = {
        gridMinor: '#292c30',
        gridMajor: '#33373c',
        axis: '#454b52',
        cellStroke: '#8fb6cc',
        cellDiag: '#b6cfdf',
        kontur: '#d3e8f7',
        yanak: '#96c864',
        plan: '#64c864',
        bolum: '#d6a04a',
        handleP1: '#e68c50',
        handle: '#b9bec6',
        text: '#c8ccd0',
        textDim: '#8b9099',
        warn: '#c05a3a'
    };

    // Hücre gövdeleri: üst kademe aydınlık, alt kademe koyu (yükseklik okunsun diye)
    function cellFill(level, n) {
        const t = n > 1 ? Math.min(1, level / (n - 1)) : 0;
        const r = Math.round(150 - 82 * t);
        const g = Math.round(186 - 96 * t);
        const b = Math.round(209 - 96 * t);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + (0.55 - 0.16 * t).toFixed(2) + ')';
    }

    function niceStep(span) {
        if (!(span > 0)) return 1;
        const raw = span / 8;
        const mag = Math.pow(10, Math.floor(Math.log10(raw)));
        const norm = raw / mag;
        let s = 10;
        if (norm <= 1) s = 1;
        else if (norm <= 2) s = 2;
        else if (norm <= 2.5) s = 2.5;
        else if (norm <= 5) s = 5;
        return s * mag;
    }

    function fmt(v) {
        const a = Math.abs(v);
        if (a >= 1000) return v.toFixed(0);
        if (a >= 10) return v.toFixed(1);
        return v.toFixed(2);
    }

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    class Viewer2D {
        constructor(container, onPlanChange) {
            this.container = container;
            this.onPlanChange = onPlanChange || function () {};
            this.svg = document.createElementNS(SVG_NS, 'svg');
            this.svg.setAttribute('xmlns', SVG_NS);
            this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            this.container.appendChild(this.svg);

            this.result = null;
            this.dragging = null;
            this.hover = null;
            this._screen = null;

            this._onPointerDown = this._onPointerDown.bind(this);
            this._onPointerMove = this._onPointerMove.bind(this);
            this._onHoverMove = this._onHoverMove.bind(this);
            this._onPointerLeave = this._onPointerLeave.bind(this);
            this._onPointerUp = this._onPointerUp.bind(this);

            this.svg.addEventListener('pointerdown', this._onPointerDown);
            this.svg.addEventListener('pointermove', this._onHoverMove);
            this.svg.addEventListener('pointerleave', this._onPointerLeave);
            window.addEventListener('pointermove', this._onPointerMove);
            window.addEventListener('pointerup', this._onPointerUp);
        }

        resize() {
            this._render();
        }

        update(result) {
            this.result = result;
            this._render();
        }

        getSVGElement() {
            return this.svg;
        }

        _worldToScreen(p) {
            const s = this._screen;
            return {
                x: p.x * s.scale + s.offX,
                y: s.offY - p.y * s.scale
            };
        }

        _screenToWorld(sx, sy) {
            const s = this._screen;
            return {
                x: (sx - s.offX) / s.scale,
                y: (s.offY - sy) / s.scale
            };
        }

        // ---------------------------------------------------------------- render

        _render() {
            const rect = this.container.getBoundingClientRect();
            const W = Math.max(1, rect.width);
            const H = Math.max(1, rect.height);
            this.svg.setAttribute('width', W);
            this.svg.setAttribute('height', H);

            if (!this.result || !this.result.plan) {
                this.svg.innerHTML = '';
                return;
            }

            const bb = Geom.getBoundingBox2d(this.result);
            const pad = Math.max(bb.width, bb.height, 1) * 0.12 + 8;
            const bw = Math.max(bb.width + 2 * pad, 1e-6);
            const bh = Math.max(bb.height + 2 * pad, 1e-6);
            const minX = bb.minX - pad;
            const minY = bb.minY - pad;
            const scale = Math.min(W / bw, H / bh);
            const offX = (W - bw * scale) / 2 - minX * scale;
            const offY = H - ((H - bh * scale) / 2 - minY * scale);

            this._screen = { W, H, scale, offX, offY };

            const out = [];
            const step = this._drawGrid(out);
            this._drawCells(out);
            this._drawEdgeLayer(out, 'YANAK');
            this._drawEdgeLayer(out, 'KONTUR');
            this._drawPlanTriangle(out);
            this._drawAsaOlcusu(out);
            this._drawKeyPoints(out);
            this._drawHandles(out);
            this._drawHud(out, step);

            this.svg.innerHTML = out.join('');
        }

        _path(points, closed) {
            let d = '';
            for (let i = 0; i < points.length; i++) {
                const p = this._worldToScreen(points[i]);
                d += (i === 0 ? 'M' : 'L') + p.x.toFixed(2) + ' ' + p.y.toFixed(2);
            }
            return d + (closed ? 'Z' : '');
        }

        _line(out, a, b, stroke, width, opts) {
            opts = opts || {};
            const p = this._worldToScreen(a);
            const q = this._worldToScreen(b);
            out.push('<line x1="' + p.x.toFixed(2) + '" y1="' + p.y.toFixed(2) +
                '" x2="' + q.x.toFixed(2) + '" y2="' + q.y.toFixed(2) +
                '" stroke="' + stroke + '" stroke-width="' + width + '"' +
                (opts.dash ? ' stroke-dasharray="' + opts.dash + '"' : '') +
                (opts.opacity ? ' opacity="' + opts.opacity + '"' : '') +
                ' stroke-linecap="round" />');
        }

        _text(out, x, y, str, fill, size, opts) {
            opts = opts || {};
            out.push('<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) +
                '" fill="' + fill + '" font-size="' + size + '"' +
                ' font-family="ui-monospace, Consolas, monospace"' +
                (opts.anchor ? ' text-anchor="' + opts.anchor + '"' : '') +
                (opts.weight ? ' font-weight="' + opts.weight + '"' : '') +
                (opts.opacity ? ' opacity="' + opts.opacity + '"' : '') +
                '>' + esc(str) + '</text>');
        }

        _drawGrid(out) {
            const s = this._screen;
            const wMin = this._screenToWorld(0, s.H);
            const wMax = this._screenToWorld(s.W, 0);
            const span = Math.max(wMax.x - wMin.x, wMax.y - wMin.y);
            let step = niceStep(span);
            while (span / step > 200) step *= 2;

            const x0 = Math.floor(wMin.x / step) * step;
            const y0 = Math.floor(wMin.y / step) * step;
            const parts = [];

            for (let x = x0; x <= wMax.x + 1e-9; x += step) {
                const sx = (x * s.scale + s.offX).toFixed(2);
                const major = Math.abs(Math.round(x / step) % 5) === 0;
                const col = Math.abs(x) < step * 0.01 ? COL.axis : (major ? COL.gridMajor : COL.gridMinor);
                parts.push('<line x1="' + sx + '" y1="0" x2="' + sx + '" y2="' + s.H + '" stroke="' + col + '" />');
            }
            for (let y = y0; y <= wMax.y + 1e-9; y += step) {
                const sy = (s.offY - y * s.scale).toFixed(2);
                const major = Math.abs(Math.round(y / step) % 5) === 0;
                const col = Math.abs(y) < step * 0.01 ? COL.axis : (major ? COL.gridMajor : COL.gridMinor);
                parts.push('<line x1="0" y1="' + sy + '" x2="' + s.W + '" y2="' + sy + '" stroke="' + col + '" />');
            }

            out.push('<g stroke-width="1">' + parts.join('') + '</g>');
            return step;
        }

        _drawCells(out) {
            const cells = this.result.planCells;
            if (!cells || !cells.length) return;

            const n = Math.max(1, this.result.asabaAdet || 1);
            const detay = cells.length <= 400;
            const parts = [];

            for (let i = 0; i < cells.length; i++) {
                const c = cells[i];
                parts.push('<path d="' + this._path(c.points, true) + '" fill="' + cellFill(c.level, n) +
                    '" stroke="' + COL.cellStroke + '" stroke-width="' + (detay ? 1 : 0.6) +
                    '" stroke-linejoin="round" opacity="0.95" />');
                if (detay && c.diag) {
                    parts.push('<path d="' + this._path(c.diag, false) + '" fill="none" stroke="' +
                        COL.cellDiag + '" stroke-width="0.9" opacity="0.6" />');
                }
            }
            out.push('<g>' + parts.join('') + '</g>');
        }

        _drawEdgeLayer(out, layer) {
            const edges = this.result.edges2d;
            if (!edges) return;

            let stroke = COL.kontur;
            let width = '2';
            let dash = '';
            let opacity = '1';
            if (layer === 'YANAK') {
                stroke = COL.yanak;
                width = '1';
                opacity = '0.75';
                dash = '5 3';
            }

            const parts = [];
            for (let i = 0; i < edges.length; i++) {
                if (edges[i].layer !== layer) continue;
                parts.push('<path d="' + this._path(edges[i].points, edges[i].closed) + '" />');
            }
            if (!parts.length) return;

            out.push('<g fill="none" stroke="' + stroke + '" stroke-width="' + width +
                '" stroke-linejoin="round" opacity="' + opacity + '"' +
                (dash ? ' stroke-dasharray="' + dash + '"' : '') + '>' + parts.join('') + '</g>');
        }

        _drawPlanTriangle(out) {
            const plan = this.result.plan;
            const d = this._path([plan.p1, plan.p2, plan.p3], true);
            out.push('<path d="' + d + '" fill="none" stroke="' + COL.plan +
                '" stroke-width="2" stroke-linejoin="round" />');
        }

        /** Birinci asabanın x ölçüsü — tablo2'deki "x" kotunun karşılığı. */
        _drawAsaOlcusu(out) {
            const kp = this.result.keyPoints;
            if (!kp) return;

            this._line(out, kp.pp1, kp.pp2, COL.bolum, 2.5);
            this._line(out, kp.pp1, kp.pp3, COL.bolum, 2.5, { opacity: '0.55' });

            if (!this._etiketSigar()) return;

            const mid = { x: (kp.pp1.x + kp.pp2.x) / 2, y: (kp.pp1.y + kp.pp2.y) / 2 };
            const s = this._worldToScreen(mid);
            this._text(out, s.x, s.y - 7, 'x = ' + fmt(this.result.asa), COL.bolum, 11, {
                anchor: 'middle', weight: '700'
            });
        }

        /** Birinci hücre ekranda çok küçükse pp/x etiketlerini bastır. */
        _etiketSigar() {
            const kp = this.result.keyPoints;
            if (!kp) return false;
            const a = this._worldToScreen(kp.pp1);
            const b = this._worldToScreen(kp.pp2);
            return Math.hypot(b.x - a.x, b.y - a.y) >= 28;
        }

        _drawKeyPoints(out) {
            const kp = this.result.keyPoints;
            const plan = this.result.plan;
            if (!kp || !this._etiketSigar()) return;

            const pts = [
                { p: kp.pp2, label: 'pp2', near: plan.p2 },
                { p: kp.pp3, label: 'pp3', near: plan.p3 }
            ];
            // pp1arka yalnız grid düzleminin üstündeyken anlamlı; Z=0'a oturuyorsa
            // o yüzey de nokta da üretilmiyor, planda da gösterilmez.
            if (kp.pp1arka && kp.pp1arka.z > 1e-9) {
                pts.push({ p: kp.pp1arka, label: 'pp1arka', near: null });
            }

            for (let i = 0; i < pts.length; i++) {
                const s = this._worldToScreen(pts[i].p);
                // P2/P3 tutamağıyla çakışıyorsa etiketi tekrarlama
                if (pts[i].near) {
                    const t = this._worldToScreen(pts[i].near);
                    if (Math.hypot(s.x - t.x, s.y - t.y) < 12) continue;
                }
                out.push('<circle cx="' + s.x.toFixed(1) + '" cy="' + s.y.toFixed(1) +
                    '" r="3" fill="' + COL.bolum + '" opacity="0.9" />');
                this._text(out, s.x + 6, s.y - 5, pts[i].label, COL.bolum, 10, { opacity: '0.9' });
            }
        }

        _drawHandles(out) {
            const plan = this.result.plan;
            const labels = ['P1', 'P2', 'P3'];
            const keys = ['p1', 'p2', 'p3'];

            for (let i = 0; i < 3; i++) {
                const s = this._worldToScreen(plan[keys[i]]);
                const col = i === 0 ? COL.handleP1 : COL.handle;
                const r = i === 0 ? 8 : 6;
                const active = this.dragging === keys[i] || this.hover === keys[i];

                if (active) {
                    out.push('<circle cx="' + s.x.toFixed(1) + '" cy="' + s.y.toFixed(1) +
                        '" r="' + (r + 5) + '" fill="' + col + '" opacity="0.18" />');
                }
                out.push('<circle cx="' + s.x.toFixed(1) + '" cy="' + s.y.toFixed(1) +
                    '" r="' + r + '" fill="' + col + '" stroke="#1e1f22" stroke-width="2" />');
                this._text(out, s.x + 11, s.y - 9, labels[i], col, 11, { weight: '600' });
            }
        }

        _drawHud(out, step) {
            const s = this._screen;
            const r = this.result;
            const cellCount = r.planCells ? r.planCells.length : 0;
            const lines = [
                'x (asa) = ' + fmt(r.asa) + '   ·   P1–P2 = ' + fmt(r.p1p2mesafe),
                'asaba = ' + r.asabaAdet + '   ·   hücre = ' + cellCount +
                    (r.derinlik > 0 ? '   ·   yanak = ' + fmt(r.derinlik) : ''),
                'ızgara karesi = ' + fmt(step) + ' birim'
            ];

            const w = Math.min(250, s.W - 20);
            const h = 20 + lines.length * 14 + (r.asabaAdet > 1 ? 20 : 0);
            const x = 10;
            const y = s.H - h - 10;

            out.push('<rect x="' + x + '" y="' + y.toFixed(1) + '" width="' + w + '" height="' + h +
                '" rx="4" fill="rgba(20,21,24,0.72)" stroke="#3f4248" />');

            for (let i = 0; i < lines.length; i++) {
                this._text(out, x + 10, y + 18 + i * 14, lines[i], COL.text, 10.5);
            }

            if (r.asabaAdet > 1) {
                const gy = y + 18 + lines.length * 14;
                const n = r.asabaAdet;
                const bw = Math.min(14, 120 / n);
                this._text(out, x + 10, gy + 4, 'kademe:', COL.textDim, 10);
                for (let i = 0; i < n; i++) {
                    out.push('<rect x="' + (x + 62 + i * (bw + 2)) + '" y="' + (gy - 6) +
                        '" width="' + bw.toFixed(1) + '" height="10" fill="' + cellFill(i, n) +
                        '" stroke="' + COL.cellStroke + '" stroke-width="0.6" />');
                }
                this._text(out, x + 66 + n * (bw + 2), gy + 4, 'üst → alt', COL.textDim, 9);
            }

            const uyarilar = (r.warnings || []).slice(0, 2);
            const maxKarakter = Math.max(24, Math.floor((s.W - 24) / 6.2));
            for (let i = 0; i < uyarilar.length; i++) {
                let t = uyarilar[i];
                if (t.length > maxKarakter) t = t.slice(0, maxKarakter - 1) + '…';
                this._text(out, x, y - 10 - (uyarilar.length - 1 - i) * 14, '! ' + t,
                    COL.warn, 11, { weight: '600' });
            }
        }

        // ------------------------------------------------------------ etkileşim

        _hitHandle(sx, sy) {
            if (!this._screen || !this.result) return null;
            const plan = this.result.plan;
            const keys = ['p1', 'p2', 'p3'];
            let best = null;
            let bestD = Infinity;
            for (let i = 0; i < 3; i++) {
                const s = this._worldToScreen(plan[keys[i]]);
                const d = Math.hypot(sx - s.x, sy - s.y);
                if (d <= (i === 0 ? 13 : 11) && d < bestD) {
                    best = keys[i];
                    bestD = d;
                }
            }
            return best;
        }

        _onPointerDown(e) {
            if (!this.result) return;
            const rect = this.svg.getBoundingClientRect();
            const handle = this._hitHandle(e.clientX - rect.left, e.clientY - rect.top);
            if (!handle) return;

            this.dragging = handle;
            this.svg.setPointerCapture(e.pointerId);
            this._render();
            e.preventDefault();
        }

        _onHoverMove(e) {
            if (this.dragging || !this.result || !this._screen) return;
            const rect = this.svg.getBoundingClientRect();
            const hit = this._hitHandle(e.clientX - rect.left, e.clientY - rect.top);
            this.svg.style.cursor = hit ? 'grab' : 'default';
            if (hit !== this.hover) {
                this.hover = hit;
                this._render();
            }
        }

        _onPointerLeave() {
            if (this.dragging || this.hover === null) return;
            this.hover = null;
            this._render();
        }

        _onPointerMove(e) {
            if (!this.dragging || !this.result || !this._screen) return;
            const rect = this.svg.getBoundingClientRect();
            const sx = e.clientX - rect.left;
            const sy = e.clientY - rect.top;

            this.svg.style.cursor = 'grabbing';
            const w = this._screenToWorld(sx, sy);
            const plan = {
                p1: { x: this.result.plan.p1.x, y: this.result.plan.p1.y },
                p2: { x: this.result.plan.p2.x, y: this.result.plan.p2.y },
                p3: { x: this.result.plan.p3.x, y: this.result.plan.p3.y }
            };
            plan[this.dragging] = { x: w.x, y: w.y };
            this.onPlanChange(plan, { fromDrag: true, handle: this.dragging });
        }

        _onPointerUp(e) {
            if (!this.dragging) return;
            this.dragging = null;
            this.svg.style.cursor = 'default';
            try {
                this.svg.releasePointerCapture(e.pointerId);
            } catch (err) { /* ignore */ }
            this._render();
        }
    }

    global.Viewer2D = Viewer2D;
})(window);
