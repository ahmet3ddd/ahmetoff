// 2D SVG - gorunus (X-Z) ve plan (X-Y) sekmeli
(function (global) {
    'use strict';

    const Geom = global.MukarnasGeom;
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const AXIS_COLORS = { x: '#c0533a', y: '#3aa05c', z: '#3a6ec0' };

    class Viewer2D {
        constructor(container) {
            this.container = container;
            this.mode = 'elev';
            this.svg = document.createElementNS(SVG_NS, 'svg');
            this.svg.setAttribute('xmlns', SVG_NS);
            this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            this.container.appendChild(this.svg);
            this.result = null;

            const tabs = document.createElement('div');
            tabs.className = 'view2d-tabs';
            tabs.innerHTML =
                '<button type="button" data-mode="elev" class="active">Görünüş (X-Z)</button>' +
                '<button type="button" data-mode="plan">Plan (X-Y)</button>';
            this.container.insertBefore(tabs, this.svg);
            const self = this;
            tabs.addEventListener('click', function (e) {
                const btn = e.target.closest('button[data-mode]');
                if (!btn) return;
                self.mode = btn.getAttribute('data-mode');
                tabs.querySelectorAll('button').forEach(function (b) {
                    b.classList.toggle('active', b === btn);
                });
                self._render();
            });
        }

        setMode(mode) {
            this.mode = mode;
            this._render();
        }

        resize() { this._render(); }

        update(result) {
            this.result = result;
            this._render();
        }

        _polylines() {
            if (!this.result) return [];
            return this.mode === 'plan' ? this.result.planPolylines : this.result.elevPolylines;
        }

        _render() {
            const rect = this.container.getBoundingClientRect();
            const W = Math.max(1, rect.width);
            const H = Math.max(1, rect.height);
            this.svg.setAttribute('width', W);
            this.svg.setAttribute('height', H);

            while (this.svg.firstChild) this.svg.removeChild(this.svg.firstChild);
            if (!this.result) return;

            const drawPolys = this._polylines();
            const bbox = Geom.getBoundingBox2D(drawPolys);
            const pad = Math.max(bbox.width, bbox.height) * 0.12 + 5;
            const minX = bbox.minX - pad;
            const minY = bbox.minY - pad;
            const bw = bbox.width + 2 * pad;
            const bh = bbox.height + 2 * pad;
            const scale = Math.min(W / bw, H / bh);
            const offX = (W - bw * scale) / 2 - minX * scale;
            const offY = H - ((H - bh * scale) / 2 - minY * scale);

            const toScreen = function (p) {
                return { x: p.x * scale + offX, y: offY - p.y * scale };
            };
            this._lastScreenBox = { W: W, H: H };

            this._drawGrid(bbox, toScreen, W, H);
            this._drawEdges(drawPolys, toScreen);
            this._drawSymmetryPlane(toScreen);
            this._drawAxes(toScreen);
        }

        _drawSymmetryPlane(toScreen) {
            const r = this.result;
            if (!r || !r.showModuleB || r.symmetryPlaneX == null || !isFinite(r.symmetryPlaneX)) {
                return;
            }
            const px = r.symmetryPlaneX;
            const bb = r.bbox;
            let p1;
            let p2;
            if (this.mode === 'elev') {
                p1 = { x: px, y: bb.minZ };
                p2 = { x: px, y: bb.maxZ };
            } else {
                p1 = { x: px, y: bb.minY };
                p2 = { x: px, y: bb.maxY };
            }
            const a = toScreen(p1);
            const b = toScreen(p2);
            const ln = document.createElementNS(SVG_NS, 'line');
            ln.setAttribute('x1', a.x);
            ln.setAttribute('y1', a.y);
            ln.setAttribute('x2', b.x);
            ln.setAttribute('y2', b.y);
            ln.setAttribute('stroke', '#c878f0');
            ln.setAttribute('stroke-width', '2');
            ln.setAttribute('stroke-dasharray', '6 4');
            ln.setAttribute('stroke-opacity', '0.9');
            this.svg.appendChild(ln);
        }

        _drawGrid(bbox, toScreen, W, H) {
            const span = Math.max(bbox.width, bbox.height);
            let step = Math.pow(10, Math.floor(Math.log10(span / 8)));
            if (span / step < 5) step /= 2;
            const x0 = Math.floor((bbox.minX - bbox.width * 0.5) / step) * step;
            const x1 = Math.ceil((bbox.maxX + bbox.width * 0.5) / step) * step;
            const y0 = Math.floor((bbox.minY - bbox.height * 0.5) / step) * step;
            const y1 = Math.ceil((bbox.maxY + bbox.height * 0.5) / step) * step;
            const g = document.createElementNS(SVG_NS, 'g');
            g.setAttribute('stroke', '#2f3236');
            g.setAttribute('stroke-width', '1');
            for (let x = x0; x <= x1 + 1e-6; x += step) {
                const a = toScreen({ x: x, y: y0 });
                const ln = document.createElementNS(SVG_NS, 'line');
                ln.setAttribute('x1', a.x); ln.setAttribute('y1', 0);
                ln.setAttribute('x2', a.x); ln.setAttribute('y2', H);
                g.appendChild(ln);
            }
            for (let y = y0; y <= y1 + 1e-6; y += step) {
                const a = toScreen({ x: x0, y: y });
                const ln = document.createElementNS(SVG_NS, 'line');
                ln.setAttribute('x1', 0); ln.setAttribute('y1', a.y);
                ln.setAttribute('x2', W); ln.setAttribute('y2', a.y);
                g.appendChild(ln);
            }
            this.svg.appendChild(g);
        }

        /**
         * Eksen renkleri 3D'deki AxesHelper ile ayni: X kirmizi, Y yesil,
         * Z mavi. Ekranin dusey yonu gorunuste (X-Z) Z, planda (X-Y) Y'dir.
         */
        _drawAxes(toScreen) {
            const o = toScreen({ x: 0, y: 0 });
            const W = this._lastScreenBox.W;
            const H = this._lastScreenBox.H;
            const xAxis = document.createElementNS(SVG_NS, 'line');
            xAxis.setAttribute('x1', 0); xAxis.setAttribute('y1', o.y);
            xAxis.setAttribute('x2', W); xAxis.setAttribute('y2', o.y);
            xAxis.setAttribute('stroke', AXIS_COLORS.x);
            xAxis.setAttribute('stroke-width', '1');
            xAxis.setAttribute('stroke-opacity', '0.5');
            this.svg.appendChild(xAxis);
            const yAxis = document.createElementNS(SVG_NS, 'line');
            yAxis.setAttribute('x1', o.x); yAxis.setAttribute('y1', 0);
            yAxis.setAttribute('x2', o.x); yAxis.setAttribute('y2', H);
            yAxis.setAttribute('stroke', this.mode === 'plan' ? AXIS_COLORS.y : AXIS_COLORS.z);
            yAxis.setAttribute('stroke-width', '1');
            yAxis.setAttribute('stroke-opacity', '0.5');
            this.svg.appendChild(yAxis);
        }

        _drawEdges(polys, toScreen) {
            const g = document.createElementNS(SVG_NS, 'g');
            g.setAttribute('stroke', '#64c8a0');
            g.setAttribute('stroke-width', '1.5');
            g.setAttribute('stroke-linecap', 'round');
            for (let i = 0; i < polys.length; i++) {
                const pl = polys[i];
                if (pl.length < 2) continue;
                const a = toScreen(pl[0]);
                const b = toScreen(pl[1]);
                const ln = document.createElementNS(SVG_NS, 'line');
                ln.setAttribute('x1', a.x); ln.setAttribute('y1', a.y);
                ln.setAttribute('x2', b.x); ln.setAttribute('y2', b.y);
                g.appendChild(ln);
            }
            this.svg.appendChild(g);
        }

        getSVGElement() { return this.svg; }
    }

    global.Viewer2D = Viewer2D;
})(window);
