// 2D SVG viewer (global - file:// uyumlu)
(function (global) {
    'use strict';

    const Geom = global.RevzenGeom;
    const SVG_NS = 'http://www.w3.org/2000/svg';

    const COL = {
        grid:    '#2f3236',
        gridHi:  '#3a3e44',
        axisX:   '#c0533a',
        axisY:   '#3aa05c',
        ground:  '#5a5d63',
        frame:   '#c8b08a',
        frameLn: '#e8cfa0',
        panel:   '#8f959c',
        panelLn: '#9aa0a8',
        gozDark: '#101215',
        gozLn:   'rgba(0,0,0,0.45)'
    };

    function el(name, attrs) {
        const n = document.createElementNS(SVG_NS, name);
        for (const k in attrs) n.setAttribute(k, attrs[k]);
        return n;
    }

    function ringToPath(ring, toScreen, close) {
        let d = '';
        for (let i = 0; i < ring.length; i++) {
            const s = toScreen(ring[i]);
            d += (i === 0 ? 'M' : 'L') + s.x.toFixed(2) + ',' + s.y.toFixed(2);
            if (i < ring.length - 1) d += ' ';
        }
        if (close) d += ' Z';
        return d;
    }

    class Viewer2D {
        constructor(container) {
            this.container = container;
            this.svg = el('svg', {
                xmlns: SVG_NS,
                preserveAspectRatio: 'xMidYMid meet'
            });
            this.container.appendChild(this.svg);
            this.result = null;
            this.opts = { renkliCam: true, izgara: true };
        }

        resize() { this._render(); }

        update(result, opts) {
            this.result = result;
            if (opts) this.opts = Object.assign({}, this.opts, opts);
            this._render();
        }

        _render() {
            const rect = this.container.getBoundingClientRect();
            const W = Math.max(1, rect.width);
            const H = Math.max(1, rect.height);
            this.svg.setAttribute('width', W);
            this.svg.setAttribute('height', H);
            this.svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

            while (this.svg.firstChild) this.svg.removeChild(this.svg.firstChild);
            this._box = { W: W, H: H };

            if (!this.result || !this.result.inner) return;

            const bbox = Geom.getBoundingBox(this.result);
            const pad = Math.max(bbox.width, bbox.height) * 0.12 + 5;
            const minX = bbox.minX - pad;
            const minY = bbox.minY - pad;
            const bw = bbox.width  + 2 * pad;
            const bh = bbox.height + 2 * pad;

            const scale = Math.min(W / bw, H / bh);
            const offX = (W - bw * scale) / 2 - minX * scale;
            const offY = H - ((H - bh * scale) / 2 - minY * scale);

            const toScreen = function (p) {
                return { x: p.x * scale + offX, y: offY - p.y * scale };
            };
            this._scale = scale;

            if (this.opts.izgara !== false) this._drawGrid(bbox, toScreen, W, H);
            this._drawGround(bbox, toScreen);
            this._drawPanel(toScreen);
            this._drawFrame(toScreen);
            this._drawGoz(toScreen, scale);
            this._drawAxes(toScreen, W, H);
        }

        _drawGrid(bbox, toScreen, W, H) {
            const span = Math.max(bbox.width, bbox.height);
            let step = Math.pow(10, Math.floor(Math.log10(span / 8)));
            if (span / step < 5) step /= 2;

            const x0 = Math.floor((bbox.minX - bbox.width  * 0.6) / step) * step;
            const x1 = Math.ceil ((bbox.maxX + bbox.width  * 0.6) / step) * step;
            const y0 = Math.floor((bbox.minY - bbox.height * 0.6) / step) * step;
            const y1 = Math.ceil ((bbox.maxY + bbox.height * 0.6) / step) * step;

            const g = el('g', { stroke: COL.grid, 'stroke-width': '1' });
            for (let x = x0; x <= x1 + 1e-6; x += step) {
                const a = toScreen({ x: x, y: 0 });
                g.appendChild(el('line', { x1: a.x, y1: 0, x2: a.x, y2: H }));
            }
            for (let y = y0; y <= y1 + 1e-6; y += step) {
                const a = toScreen({ x: 0, y: y });
                g.appendChild(el('line', { x1: 0, y1: a.y, x2: W, y2: a.y }));
            }
            this.svg.appendChild(g);
        }

        _drawAxes(toScreen, W, H) {
            const o = toScreen({ x: 0, y: 0 });
            this.svg.appendChild(el('line', {
                x1: 0, y1: o.y, x2: W, y2: o.y,
                stroke: COL.axisX, 'stroke-width': '1', 'stroke-opacity': '0.45'
            }));
            this.svg.appendChild(el('line', {
                x1: o.x, y1: 0, x2: o.x, y2: H,
                stroke: COL.axisY, 'stroke-width': '1', 'stroke-opacity': '0.45'
            }));
        }

        _drawGround(bbox, toScreen) {
            const m = Math.max(bbox.width, bbox.height) * 0.18;
            const a = toScreen({ x: bbox.minX - m, y: 0 });
            const b = toScreen({ x: bbox.maxX + m, y: 0 });
            this.svg.appendChild(el('line', {
                x1: a.x, y1: a.y, x2: b.x, y2: b.y,
                stroke: COL.ground, 'stroke-width': '1.5', 'stroke-dasharray': '4 4'
            }));
        }

        _drawPanel(toScreen) {
            const r = this.result;
            if (!r.inner) return;
            this.svg.appendChild(el('path', {
                d: ringToPath(r.inner, toScreen, true),
                fill: COL.panel,
                'fill-opacity': '0.18',
                stroke: COL.panelLn,
                'stroke-width': '1',
                'stroke-opacity': '0.7',
                'stroke-dasharray': '3 3'
            }));
        }

        _drawFrame(toScreen) {
            const r = this.result;
            if (!r.outer) {
                this.svg.appendChild(el('path', {
                    d: ringToPath(r.inner, toScreen, true),
                    fill: 'none', stroke: COL.frameLn, 'stroke-width': '2',
                    'stroke-linejoin': 'round'
                }));
                return;
            }
            const d = ringToPath(r.outer, toScreen, true) + ' ' +
                      ringToPath(r.inner, toScreen, true);
            this.svg.appendChild(el('path', {
                d: d,
                'fill-rule': 'evenodd',
                fill: COL.frame,
                'fill-opacity': '0.38',
                stroke: COL.frameLn,
                'stroke-width': '1.5',
                'stroke-linejoin': 'round'
            }));
        }

        _drawGoz(toScreen, scale) {
            const r = this.result;
            if (!r.goz || r.goz.length === 0) return;

            const renkli = this.opts.renkliCam !== false;
            const pal = r.palette || Geom.CAM_PALET;
            const daire = r.gozForm !== 'filgozu';
            const g = el('g', {
                stroke: COL.gozLn,
                'stroke-width': Math.max(0.4, Math.min(1.2, 0.6 * scale))
            });

            for (const h of r.goz) {
                const fill = renkli ? pal[h.ci] : COL.gozDark;
                const op = renkli ? '0.88' : '1';

                // Kesilmemis daireler gercek daire olarak cizilir; kesikler ve
                // filgozu poligon olarak.
                if (daire && h.tam) {
                    const c = toScreen({ x: h.x, y: h.y });
                    const rr = h.r * scale;
                    if (rr < 0.4) continue;
                    g.appendChild(el('circle', {
                        cx: c.x.toFixed(2), cy: c.y.toFixed(2), r: rr.toFixed(2),
                        fill: fill, 'fill-opacity': op
                    }));
                } else {
                    if (!h.poly || h.poly.length < 3) continue;
                    g.appendChild(el('path', {
                        d: ringToPath(h.poly, toScreen, true),
                        fill: fill, 'fill-opacity': op, 'stroke-linejoin': 'round'
                    }));
                }
            }
            this.svg.appendChild(g);
        }

        getSVGElement() { return this.svg; }
    }

    global.Viewer2D = Viewer2D;
})(window);
