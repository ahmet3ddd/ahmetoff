// 2D SVG viewer (global - file:// uyumlu)
(function (global) {
    'use strict';

    const Geom = global.KemerGeom;
    const SVG_NS = 'http://www.w3.org/2000/svg';

    class Viewer2D {
        constructor(container) {
            this.container = container;
            this.svg = document.createElementNS(SVG_NS, 'svg');
            this.svg.setAttribute('xmlns', SVG_NS);
            this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            this.container.appendChild(this.svg);
            this.archResult = null;
        }

        resize() { this._render(); }

        update(result) {
            this.archResult = result;
            this._render();
        }

        _render() {
            const rect = this.container.getBoundingClientRect();
            const W = Math.max(1, rect.width);
            const H = Math.max(1, rect.height);
            this.svg.setAttribute('width', W);
            this.svg.setAttribute('height', H);

            while (this.svg.firstChild) this.svg.removeChild(this.svg.firstChild);

            if (!this.archResult) return;

            const bbox = Geom.getBoundingBox(this.archResult);
            const pad = Math.max(bbox.width, bbox.height) * 0.12 + 5;

            const minX = bbox.minX - pad;
            const minY = bbox.minY - pad;
            const bw = bbox.width  + 2 * pad;
            const bh = bbox.height + 2 * pad;

            const scale = Math.min(W / bw, H / bh);
            const offX = (W - bw * scale) / 2 - minX * scale;
            const offY = H - ((H - bh * scale) / 2 - minY * scale);

            const toScreen = (p) => ({
                x: p.x * scale + offX,
                y: offY - p.y * scale
            });
            this._lastScreenBox = { W, H };

            this._drawGrid(bbox, toScreen, W, H);
            this._drawGround(toScreen, bbox);
            this._drawArches(toScreen);
            this._drawAxes(toScreen);
        }

        _drawGrid(bbox, toScreen, W, H) {
            const span = Math.max(bbox.width, bbox.height);
            let step = Math.pow(10, Math.floor(Math.log10(span / 8)));
            if (span / step < 5) step /= 2;

            const x0 = Math.floor((bbox.minX - bbox.width  * 0.5) / step) * step;
            const x1 = Math.ceil ((bbox.maxX + bbox.width  * 0.5) / step) * step;
            const y0 = Math.floor((bbox.minY - bbox.height * 0.5) / step) * step;
            const y1 = Math.ceil ((bbox.maxY + bbox.height * 0.5) / step) * step;

            const g = document.createElementNS(SVG_NS, 'g');
            g.setAttribute('stroke', '#2f3236');
            g.setAttribute('stroke-width', '1');

            for (let x = x0; x <= x1 + 1e-6; x += step) {
                const a = toScreen({ x, y: y0 });
                const ln = document.createElementNS(SVG_NS, 'line');
                ln.setAttribute('x1', a.x); ln.setAttribute('y1', 0);
                ln.setAttribute('x2', a.x); ln.setAttribute('y2', H);
                g.appendChild(ln);
            }
            for (let y = y0; y <= y1 + 1e-6; y += step) {
                const a = toScreen({ x: x0, y });
                const ln = document.createElementNS(SVG_NS, 'line');
                ln.setAttribute('x1', 0); ln.setAttribute('y1', a.y);
                ln.setAttribute('x2', W); ln.setAttribute('y2', a.y);
                g.appendChild(ln);
            }
            this.svg.appendChild(g);
        }

        _drawAxes(toScreen) {
            const o = toScreen({ x: 0, y: 0 });
            const W = this._lastScreenBox.W;
            const H = this._lastScreenBox.H;

            const xAxis = document.createElementNS(SVG_NS, 'line');
            xAxis.setAttribute('x1', 0); xAxis.setAttribute('y1', o.y);
            xAxis.setAttribute('x2', W); xAxis.setAttribute('y2', o.y);
            xAxis.setAttribute('stroke', '#c0533a');
            xAxis.setAttribute('stroke-width', '1');
            xAxis.setAttribute('stroke-opacity', '0.5');
            this.svg.appendChild(xAxis);

            const yAxis = document.createElementNS(SVG_NS, 'line');
            yAxis.setAttribute('x1', o.x); yAxis.setAttribute('y1', 0);
            yAxis.setAttribute('x2', o.x); yAxis.setAttribute('y2', H);
            yAxis.setAttribute('stroke', '#3aa05c');
            yAxis.setAttribute('stroke-width', '1');
            yAxis.setAttribute('stroke-opacity', '0.5');
            this.svg.appendChild(yAxis);
        }

        _drawGround(toScreen, bbox) {
            const margin = Math.max(bbox.width, bbox.height) * 0.15;
            const a = toScreen({ x: bbox.minX - margin, y: 0 });
            const b = toScreen({ x: bbox.maxX + margin, y: 0 });
            const ln = document.createElementNS(SVG_NS, 'line');
            ln.setAttribute('x1', a.x); ln.setAttribute('y1', a.y);
            ln.setAttribute('x2', b.x); ln.setAttribute('y2', b.y);
            ln.setAttribute('stroke', '#5a5d63');
            ln.setAttribute('stroke-width', '1.5');
            ln.setAttribute('stroke-dasharray', '4 4');
            this.svg.appendChild(ln);
        }

        _drawArches(toScreen) {
            const fillColor   = '#d6a04a';
            const strokeColor = '#f1d18a';
            const innerColor  = '#90c8e6';

            for (const unit of this.archResult.archUnits) {
                if (unit.outer) {
                    const ring = Geom.getClosedPolygon(unit);
                    const d = ring.map((p, i) => {
                        const s = toScreen(p);
                        return (i === 0 ? 'M' : 'L') + s.x.toFixed(2) + ',' + s.y.toFixed(2);
                    }).join(' ') + ' Z';
                    const path = document.createElementNS(SVG_NS, 'path');
                    path.setAttribute('d', d);
                    path.setAttribute('fill', fillColor);
                    path.setAttribute('fill-opacity', '0.35');
                    path.setAttribute('stroke', strokeColor);
                    path.setAttribute('stroke-width', '1.5');
                    path.setAttribute('stroke-linejoin', 'round');
                    this.svg.appendChild(path);
                    this._drawPolyline(unit.inner, toScreen, innerColor, 1, '2 2');
                } else {
                    this._drawPolyline(unit.inner, toScreen, strokeColor, 2);
                }
            }
        }

        _drawPolyline(points, toScreen, color, width, dasharray) {
            const d = points.map((p, i) => {
                const s = toScreen(p);
                return (i === 0 ? 'M' : 'L') + s.x.toFixed(2) + ',' + s.y.toFixed(2);
            }).join(' ');
            const path = document.createElementNS(SVG_NS, 'path');
            path.setAttribute('d', d);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', color);
            path.setAttribute('stroke-width', String(width));
            path.setAttribute('stroke-linejoin', 'round');
            path.setAttribute('stroke-linecap', 'round');
            if (dasharray) path.setAttribute('stroke-dasharray', dasharray);
            this.svg.appendChild(path);
        }

        getSVGElement() { return this.svg; }
    }

    global.Viewer2D = Viewer2D;
})(window);
