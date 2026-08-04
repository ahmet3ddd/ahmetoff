// 2D SVG viewer - plan (90 derece CW, suruklenebilir P1-P2-P3-P4)
(function (global) {
    'use strict';

    const Geom = global.MukarnasGeom;
    const SVG_NS = 'http://www.w3.org/2000/svg';

    /** Plan XY -> gorunum: p1-p2 hatti dikey (90 derece saat yonu) */
    function planToView(p) {
        return { x: p.y, y: -p.x };
    }

    function viewToPlan(p) {
        return { x: -p.y, y: p.x };
    }

    function planPointsOf(result) {
        if (result.planPoints && result.planPoints.length >= 3) {
            return result.planPoints;
        }
        if (result.planTriangle) {
            return result.planTriangle.slice(0, 3);
        }
        return [];
    }

    function lockMode(shiftKey, ctrlKey) {
        if (shiftKey) return 'v';
        if (ctrlKey) return 'h';
        return null;
    }

    function cursorForLockMode(mode, fallback) {
        if (mode === 'h') return 'ns-resize';
        if (mode === 'v') return 'ew-resize';
        return fallback || 'default';
    }

    function applyAxisLock(plan, startPlan, shiftKey, ctrlKey) {
        const mode = lockMode(shiftKey, ctrlKey);
        if (mode === 'v') {
            return { x: startPlan.x, y: plan.y, mode: mode };
        }
        if (mode === 'h') {
            return { x: plan.x, y: startPlan.y, mode: mode };
        }
        startPlan.x = plan.x;
        startPlan.y = plan.y;
        return { x: plan.x, y: plan.y, mode: null };
    }

    const EDGE_ANGLE_THRESHOLD = 4;

    function faceNormal(v0, v1, v2) {
        const ax = v1.x - v0.x;
        const ay = v1.y - v0.y;
        const az = v1.z - v0.z;
        const bx = v2.x - v0.x;
        const by = v2.y - v0.y;
        const bz = v2.z - v0.z;
        const nx = ay * bz - az * by;
        const ny = az * bx - ax * bz;
        const nz = ax * by - ay * bx;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        return { x: nx / len, y: ny / len, z: nz / len };
    }

    function normalAngleDeg(n1, n2) {
        const dot = Math.max(-1, Math.min(1, n1.x * n2.x + n1.y * n2.y + n1.z * n2.z));
        return Math.acos(dot) * 180 / Math.PI;
    }

    /** 3D EdgesGeometry ile ayni mantik: koplanar ucgen diyagonallerini atla */
    function collectSharpEdges(mesh, thresholdDeg) {
        const edgeFaces = Object.create(null);
        const faceNormals = [];

        for (let fi = 0; fi < mesh.faces.length; fi++) {
            const f = mesh.faces[fi];
            const v0 = mesh.vertices[f[0]];
            const v1 = mesh.vertices[f[1]];
            const v2 = mesh.vertices[f[2]];
            faceNormals.push(faceNormal(v0, v1, v2));

            for (let e = 0; e < 3; e++) {
                const a = f[e];
                const b = f[(e + 1) % 3];
                const key = a < b ? a + '-' + b : b + '-' + a;
                if (!edgeFaces[key]) edgeFaces[key] = [];
                edgeFaces[key].push(fi);
            }
        }

        const edges = [];
        for (const key in edgeFaces) {
            const faces = edgeFaces[key];
            const parts = key.split('-');
            const a = parseInt(parts[0], 10);
            const b = parseInt(parts[1], 10);

            if (faces.length === 1) {
                edges.push([a, b]);
                continue;
            }
            if (faces.length >= 2) {
                const ang = normalAngleDeg(faceNormals[faces[0]], faceNormals[faces[1]]);
                if (ang > thresholdDeg) {
                    edges.push([a, b]);
                }
            }
        }
        return edges;
    }

    class Viewer2D {
        constructor(container) {
            this.container = container;
            this.svg = document.createElementNS(SVG_NS, 'svg');
            this.svg.setAttribute('xmlns', SVG_NS);
            this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            this.container.appendChild(this.svg);
            this.result = null;
            this.onPointDrag = null;
            this.onPointDragStart = null;
            this.onPointDragEnd = null;
            this._viewTransform = null;
            this._shift = false;
            this._ctrl = false;
            this._hoverIndex = -1;
            this._hoverHit = null;
            this._activeDrag = null;

            this._onKeyDown = this._onKeyDown.bind(this);
            this._onKeyUp = this._onKeyUp.bind(this);
            window.addEventListener('keydown', this._onKeyDown);
            window.addEventListener('keyup', this._onKeyUp);
            window.addEventListener('blur', this._onKeyUp);
        }

        _onKeyDown(ev) {
            if (ev.key !== 'Shift' && ev.key !== 'Control') return;
            this._shift = ev.shiftKey;
            this._ctrl = ev.ctrlKey;
            this._syncPlanCursor();
            this._applyDragAtLastPointer();
        }

        _onKeyUp(ev) {
            if (ev.type === 'blur' || ev.key === 'Shift' || ev.key === 'Control') {
                this._shift = ev.shiftKey;
                this._ctrl = ev.ctrlKey;
                this._syncPlanCursor();
                this._applyDragAtLastPointer();
            }
        }

        _modifierState(ev) {
            return {
                shift: ev ? ev.shiftKey : this._shift,
                ctrl: ev ? ev.ctrlKey : this._ctrl
            };
        }

        _syncPlanCursor() {
            if (this._activeDrag) return;
            const mode = lockMode(this._shift, this._ctrl);
            let cur = '';
            if (this._hoverIndex >= 0 && this.onPointDrag) {
                cur = mode ? cursorForLockMode(mode, 'grab') : 'grab';
            }
            this.container.style.cursor = cur;
            if (this._hoverHit) {
                this._hoverHit.style.cursor = cur || 'grab';
            }
        }

        _setDragCursor(mode) {
            const cur = this._activeDrag
                ? cursorForLockMode(mode, 'grabbing')
                : cursorForLockMode(mode, 'grab');
            this.container.style.cursor = cur;
            document.body.style.cursor = cur;
            if (this._activeDrag && this._activeDrag.hit) {
                this._activeDrag.hit.style.cursor = cur;
            }
        }

        _applyDragAtLastPointer() {
            const drag = this._activeDrag;
            if (!drag || !this.onPointDrag) return;
            const mods = this._modifierState();
            let plan = this.screenToPlan(drag.lastSx, drag.lastSy);
            const locked = applyAxisLock(plan, drag.startPlan, mods.shift, mods.ctrl);
            this._setDragCursor(locked.mode);
            this.onPointDrag(drag.index, locked.x, locked.y);
        }

        _endDrag() {
            const wasDrag = !!this._activeDrag;
            this._activeDrag = null;
            document.body.style.cursor = '';
            this._syncPlanCursor();
            if (wasDrag && this.onPointDragEnd) {
                this.onPointDragEnd();
            }
        }

        resize() { this._render(); }

        update(result) {
            this.result = result;
            this._render();
        }

        /** Ekran pikseli -> plan (p1,p2,p3) koordinati */
        screenToPlan(sx, sy) {
            const t = this._viewTransform;
            if (!t) return { x: 0, y: 0 };
            const vx = (sx - t.offX) / t.scale;
            const vy = (t.offY - sy) / t.scale;
            return viewToPlan({ x: vx, y: vy });
        }

        _collectViewPoints(result) {
            const pts = [];
            const planPts = planPointsOf(result);
            for (let i = 0; i < planPts.length; i++) {
                const p = planPts[i];
                pts.push(planToView({ x: p.x, y: p.y }));
            }
            if (result.mesh) {
                for (const v of result.mesh.vertices) {
                    pts.push(planToView({ x: v.x, y: v.y }));
                }
            }
            return pts;
        }

        _render() {
            const rect = this.container.getBoundingClientRect();
            const W = Math.max(1, rect.width);
            const H = Math.max(1, rect.height);
            this.svg.setAttribute('width', W);
            this.svg.setAttribute('height', H);

            while (this.svg.firstChild) this.svg.removeChild(this.svg.firstChild);
            if (!this.result || !this.result.mesh) return;

            const viewPts = this._collectViewPoints(this.result);
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const p of viewPts) {
                if (p.x < minX) minX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.x > maxX) maxX = p.x;
                if (p.y > maxY) maxY = p.y;
            }
            const bw = maxX - minX || 1;
            const bh = maxY - minY || 1;
            const pad = Math.max(bw, bh) * 0.18 + 24;

            minX -= pad;
            minY -= pad;
            const bwPad = bw + 2 * pad;
            const bhPad = bh + 2 * pad;
            const scale = Math.min(W / bwPad, H / bhPad);
            const offX = (W - bwPad * scale) / 2 - minX * scale;
            const offY = H - ((H - bhPad * scale) / 2 - minY * scale);

            this._viewTransform = { scale: scale, offX: offX, offY: offY, W: W, H: H };

            const toScreen = function (planPt) {
                const v = planToView(planPt);
                return { x: v.x * scale + offX, y: offY - v.y * scale };
            };

            const viewBbox = {
                minX: minX, minY: minY,
                maxX: minX + bwPad - 2 * pad + pad,
                width: bw, height: bh
            };
            viewBbox.maxX = maxX + pad;
            viewBbox.maxY = maxY + pad;

            this._drawGrid(viewBbox, scale, offX, offY, W, H);
            this._drawMeshWire(toScreen);
            this._drawPlan(toScreen);
            this._drawAxes(toScreen);
            this._drawHandles(toScreen);
        }

        _drawGrid(bbox, scale, offX, offY, W, H) {
            const span = Math.max(bbox.width, bbox.height);
            let step = Math.pow(10, Math.floor(Math.log10(span / 8)));
            if (span / step < 5) step /= 2;

            const x0 = Math.floor((bbox.minX - bbox.width * 0.3) / step) * step;
            const x1 = Math.ceil((bbox.maxX + bbox.width * 0.3) / step) * step;
            const y0 = Math.floor((bbox.minY - bbox.height * 0.3) / step) * step;
            const y1 = Math.ceil((bbox.maxY + bbox.height * 0.3) / step) * step;

            const g = document.createElementNS(SVG_NS, 'g');
            g.setAttribute('stroke', '#2f3236');
            g.setAttribute('stroke-width', '1');

            for (let x = x0; x <= x1 + 1e-6; x += step) {
                const sx = x * scale + offX;
                const ln = document.createElementNS(SVG_NS, 'line');
                ln.setAttribute('x1', sx); ln.setAttribute('y1', 0);
                ln.setAttribute('x2', sx); ln.setAttribute('y2', H);
                g.appendChild(ln);
            }
            for (let y = y0; y <= y1 + 1e-6; y += step) {
                const sy = offY - y * scale;
                const ln = document.createElementNS(SVG_NS, 'line');
                ln.setAttribute('x1', 0); ln.setAttribute('y1', sy);
                ln.setAttribute('x2', W); ln.setAttribute('y2', sy);
                g.appendChild(ln);
            }
            this.svg.appendChild(g);
        }

        _drawAxes(toScreen) {
            const W = this._viewTransform.W;
            const H = this._viewTransform.H;
            const o = toScreen({ x: 0, y: 0 });

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

        _drawPlan(toScreen) {
            const pts = planPointsOf(this.result);
            if (pts.length < 3) return;

            let d;
            if (pts.length >= 4) {
                d = pts.map(function (p, i) {
                    const s = toScreen(p);
                    return (i === 0 ? 'M' : 'L') + s.x.toFixed(2) + ',' + s.y.toFixed(2);
                }).join(' ') + ' Z';
            } else {
                d = pts.slice(0, 3).map(function (p, i) {
                    const s = toScreen(p);
                    return (i === 0 ? 'M' : 'L') + s.x.toFixed(2) + ',' + s.y.toFixed(2);
                }).join(' ') + ' Z';
            }

            const path = document.createElementNS(SVG_NS, 'path');
            path.setAttribute('d', d);
            path.setAttribute('fill', '#d6a04a');
            path.setAttribute('fill-opacity', '0.12');
            path.setAttribute('stroke', '#90c8e6');
            path.setAttribute('stroke-width', '1.5');
            path.setAttribute('stroke-dasharray', '4 3');
            this.svg.appendChild(path);

            if (pts.length >= 4) {
                const mid = function (a, b) {
                    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
                };
                const s0 = toScreen(pts[0]);
                const s1 = toScreen(pts[1]);
                const ln = document.createElementNS(SVG_NS, 'line');
                ln.setAttribute('x1', s0.x); ln.setAttribute('y1', s0.y);
                ln.setAttribute('x2', s1.x); ln.setAttribute('y2', s1.y);
                ln.setAttribute('stroke', '#666a72');
                ln.setAttribute('stroke-width', '1');
                ln.setAttribute('stroke-dasharray', '3 3');
                this.svg.appendChild(ln);
            }
        }

        _drawHandles(toScreen) {
            const pts = planPointsOf(this.result);
            if (pts.length < 3 || !this.onPointDrag) return;

            const self = this;
            const labels = ['P1', 'P2', 'P3', 'P4'];
            const colors = ['#c0533a', '#3aa05c', '#5b8fd6', '#d6a04a'];

            for (let i = 0; i < pts.length; i++) {
                const planPt = pts[i];
                const s = toScreen(planPt);
                const g = document.createElementNS(SVG_NS, 'g');
                g.setAttribute('class', 'plan-handle');

                const hit = document.createElementNS(SVG_NS, 'circle');
                hit.setAttribute('cx', s.x);
                hit.setAttribute('cy', s.y);
                hit.setAttribute('r', 12);
                hit.setAttribute('fill', 'transparent');
                hit.setAttribute('stroke', 'none');
                hit.style.cursor = 'grab';

                const dot = document.createElementNS(SVG_NS, 'circle');
                dot.setAttribute('cx', s.x);
                dot.setAttribute('cy', s.y);
                dot.setAttribute('r', 6);
                dot.setAttribute('fill', colors[i]);
                dot.setAttribute('stroke', '#f1d18a');
                dot.setAttribute('stroke-width', '2');
                dot.style.pointerEvents = 'none';

                const t = document.createElementNS(SVG_NS, 'text');
                t.setAttribute('x', s.x + 10);
                t.setAttribute('y', s.y - 8);
                t.setAttribute('fill', '#e6e7e9');
                t.setAttribute('font-size', '11');
                t.setAttribute('font-weight', '600');
                t.style.pointerEvents = 'none';
                t.textContent = labels[i];

                g.appendChild(hit);
                g.appendChild(dot);
                g.appendChild(t);

                hit.addEventListener('mouseenter', function () {
                    self._hoverIndex = i;
                    self._hoverHit = hit;
                    self._syncPlanCursor();
                });
                hit.addEventListener('mouseleave', function () {
                    if (self._hoverIndex === i) {
                        self._hoverIndex = -1;
                        self._hoverHit = null;
                    }
                    self._syncPlanCursor();
                });

                hit.addEventListener('mousedown', function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    const startPlan = { x: planPt.x, y: planPt.y };
                    const r0 = self.container.getBoundingClientRect();

                    if (self.onPointDragStart) {
                        self.onPointDragStart();
                    }

                    self._activeDrag = {
                        index: i,
                        startPlan: startPlan,
                        hit: hit,
                        lastSx: e.clientX - r0.left,
                        lastSy: e.clientY - r0.top
                    };
                    const mods0 = self._modifierState(e);
                    const mode0 = lockMode(mods0.shift, mods0.ctrl);
                    self._setDragCursor(mode0);

                    function onMove(ev) {
                        const r = self.container.getBoundingClientRect();
                        const sx = ev.clientX - r.left;
                        const sy = ev.clientY - r.top;
                        if (self._activeDrag) {
                            self._activeDrag.lastSx = sx;
                            self._activeDrag.lastSy = sy;
                        }
                        const mods = self._modifierState(ev);
                        let plan = self.screenToPlan(sx, sy);
                        const locked = applyAxisLock(plan, startPlan, mods.shift, mods.ctrl);
                        self._setDragCursor(locked.mode);
                        self.onPointDrag(i, locked.x, locked.y);
                    }

                    function onUp() {
                        document.removeEventListener('mousemove', onMove);
                        document.removeEventListener('mouseup', onUp);
                        self._endDrag();
                    }

                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                });

                this.svg.appendChild(g);
            }
        }

        _drawMeshWire(toScreen) {
            const mesh = this.result.mesh;
            const g = document.createElementNS(SVG_NS, 'g');
            g.setAttribute('stroke', '#f1d18a');
            g.setAttribute('stroke-width', '1');
            g.setAttribute('fill', 'none');
            g.setAttribute('stroke-linejoin', 'round');

            const edges = collectSharpEdges(mesh, EDGE_ANGLE_THRESHOLD);
            for (let i = 0; i < edges.length; i++) {
                const a = edges[i][0];
                const b = edges[i][1];
                const va = mesh.vertices[a];
                const vb = mesh.vertices[b];
                const sa = toScreen({ x: va.x, y: va.y });
                const sb = toScreen({ x: vb.x, y: vb.y });
                const ln = document.createElementNS(SVG_NS, 'line');
                ln.setAttribute('x1', sa.x); ln.setAttribute('y1', sa.y);
                ln.setAttribute('x2', sb.x); ln.setAttribute('y2', sb.y);
                g.appendChild(ln);
            }
            this.svg.appendChild(g);
        }

        getSVGElement() { return this.svg; }
    }

    global.Viewer2D = Viewer2D;
})(window);
