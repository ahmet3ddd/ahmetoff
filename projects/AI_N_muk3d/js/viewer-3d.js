// 3D Three.js viewer - Z yukari, kose numaralari (Modul A / B)
(function (global) {
    'use strict';

    const Geom = global.MukarnasGeom;
    const THREE = global.THREE;

    /** Kose etiketi konumu (pp1..pp7), 3 ile 6 ayirmak icin */
    const VERTEX_NUDGE = [
        [0, 0, 0],
        [0, 0, 1],
        [1, 0, 0.6],
        [0.6, 0.6, 1],
        [0.6, 0.6, 0],
        [1, 0, -0.7],
        [0, 1, 0]
    ];

    function toThree(v) {
        return new THREE.Vector3(v.x, v.y, v.z);
    }

    function makeLabelSprite(text, color, scale) {
        const canvas = document.createElement('canvas');
        const size = 128;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = 'rgba(20, 22, 26, 0.85)';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = 'bold 52px Segoe UI, sans-serif';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, size / 2, size / 2);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        const mat = new THREE.SpriteMaterial({
            map: tex,
            depthTest: false,
            depthWrite: false,
            transparent: true
        });
        const spr = new THREE.Sprite(mat);
        spr.scale.set(scale, scale, 1);
        spr.userData._labelTex = tex;
        return spr;
    }

    function disposeObject(obj) {
        if (!obj) return;
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(function (m) {
                    if (m.map) m.map.dispose();
                    m.dispose();
                });
            } else {
                if (obj.material.map) obj.material.map.dispose();
                obj.material.dispose();
            }
        }
        if (obj.userData && obj.userData._labelTex) {
            obj.userData._labelTex.dispose();
        }
    }

    class Viewer3D {
        constructor(container) {
            this.container = container;
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x1e1f22);

            this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
            this.camera.up.set(0, 0, 1);
            this.camera.position.set(100, -120, 90);

            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                preserveDrawingBuffer: true
            });
            this.renderer.setPixelRatio(window.devicePixelRatio || 1);
            this.renderer.shadowMap.enabled = true;
            this.container.appendChild(this.renderer.domElement);

            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.08;
            this.controls.target.set(0, 0, 40);

            this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));
            const dir = new THREE.DirectionalLight(0xffffff, 0.75);
            dir.position.set(150, 120, 220);
            this.scene.add(dir);
            const fill = new THREE.DirectionalLight(0xc8d4e0, 0.35);
            fill.position.set(-120, -80, 100);
            this.scene.add(fill);

            this.grid = null;
            this._gridSize = 0;
            this._gridDiv = 0;

            this.axes = new THREE.AxesHelper(50);
            this.axes.material.depthTest = false;
            this.scene.add(this.axes);

            this.meshGroup = new THREE.Group();
            this.scene.add(this.meshGroup);

            this.wireGroup = new THREE.Group();
            this.scene.add(this.wireGroup);

            this.labelGroup = new THREE.Group();
            this.scene.add(this.labelGroup);

            this.symmetryGroup = new THREE.Group();
            this.scene.add(this.symmetryGroup);

            this.showLabels = false;

            this.matA = new THREE.MeshStandardMaterial({
                color: 0x64c896,
                roughness: 0.6,
                metalness: 0.08,
                side: THREE.DoubleSide,
                flatShading: true
            });
            this.matB = new THREE.MeshStandardMaterial({
                color: 0xe0a050,
                roughness: 0.6,
                metalness: 0.08,
                side: THREE.DoubleSide,
                flatShading: true
            });

            this._animate = this._animate.bind(this);
            this._animate();
            this.resize();
        }

        setShowLabels(v) {
            this.showLabels = !!v;
        }

        resize() {
            const rect = this.container.getBoundingClientRect();
            const w = Math.max(1, rect.width);
            const h = Math.max(1, rect.height);
            this.renderer.setSize(w, h, false);
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
        }

        _animate() {
            requestAnimationFrame(this._animate);
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        }

        _clearGroup(group) {
            while (group.children.length) {
                const c = group.children.pop();
                disposeObject(c);
            }
        }

        _buildCornerLabels(result) {
            const bb = result.bbox;
            const labelScale = Math.max(bb.width, bb.height, bb.depth, 10) * 0.09;
            const nudge = Math.max(result.asa, result.asabaH) * 0.14;
            const sidePush = nudge * 0.85;

            const isHucre = function (c) { return !c.kind; };
            const totalA = result.cells.filter(function (c) { return c.module === 'A' && isHucre(c); }).length;
            const totalB = result.cells.filter(function (c) { return c.module === 'B' && isHucre(c); }).length;

            const showCorners = result.cells.length <= Viewer3D.MAX_LABEL_CELLS;
            for (let c = 0; showCorners && c < result.cells.length; c++) {
                const cell = result.cells[c];
                if (!isHucre(cell)) continue;
                const mod = cell.module === 'B' ? 'B' : 'A';
                const color = mod === 'B' ? '#f0b45a' : '#9ed4ff';
                const verts = cell.vertices;
                const multi = mod === 'B' ? totalB > 1 : totalA > 1;
                const hucreNo = (cell.cellId != null ? cell.cellId : c) + 1;

                for (let vi = 0; vi < verts.length; vi++) {
                    const v = verts[vi];
                    const num = Geom.VERTEX_LABELS[vi] || (vi + 1);
                    const text = multi ? (mod + hucreNo + '.' + num) : (mod + num);
                    const spr = makeLabelSprite(text, color, labelScale);
                    const n = VERTEX_NUDGE[vi] || [0, 0, 0];
                    const xPush = mod === 'B' ? -sidePush : sidePush;
                    spr.position.set(
                        v.x + n[0] * nudge + xPush,
                        v.y + n[1] * nudge,
                        v.z + n[2] * nudge
                    );
                    spr.renderOrder = mod === 'B' ? 998 : 999;
                    this.labelGroup.add(spr);
                }
            }

            const legendScale = labelScale * 2.2;
            const legA = makeLabelSprite('A (+X)', '#9ed4ff', legendScale);
            legA.position.set(bb.maxX, bb.minY, bb.maxZ + labelScale * 2);
            legA.renderOrder = 1000;
            this.labelGroup.add(legA);

            if (result.showModuleB && totalB > 0) {
                const legB = makeLabelSprite('B (-X)', '#f0b45a', legendScale);
                legB.position.set(bb.minX, bb.minY, bb.maxZ + labelScale * 2);
                legB.renderOrder = 1000;
                this.labelGroup.add(legB);
            }
        }

        _buildSymmetryPlane(result) {
            if (!result.showModuleB || result.symmetryPlaneX == null || !isFinite(result.symmetryPlaneX)) {
                return;
            }
            const bb = result.bbox;
            const planeX = result.symmetryPlaneX;
            const padY = Math.max(bb.depth, result.asa) * 0.15;
            const padZ = Math.max(bb.height, result.asabaH) * 0.15;
            const wY = bb.depth + padY * 2;
            const wZ = bb.height + padZ * 2;
            const cy = (bb.minY + bb.maxY) / 2;
            const cz = (bb.minZ + bb.maxZ) / 2;

            const geom = new THREE.PlaneGeometry(wZ, wY);
            const mat = new THREE.MeshBasicMaterial({
                color: 0xc878f0,
                transparent: true,
                opacity: 0.22,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(planeX, cy, cz);
            mesh.rotation.y = Math.PI / 2;
            mesh.renderOrder = 5;
            this.symmetryGroup.add(mesh);

            const edgeGeom = new THREE.EdgesGeometry(geom);
            const edgeMat = new THREE.LineBasicMaterial({
                color: 0xe8a8ff,
                transparent: true,
                opacity: 0.85
            });
            const edges = new THREE.LineSegments(edgeGeom, edgeMat);
            edges.position.copy(mesh.position);
            edges.rotation.copy(mesh.rotation);
            edges.renderOrder = 6;
            this.symmetryGroup.add(edges);
        }

        /**
         * Izgara, eksenler ve kesme duzlemleri model olcegini izler; aciklik
         * degisip model buyudugunde/kuculdugunde sahne okunur kalir.
         */
        _updateScene(result) {
            const bb = result.bbox;
            const span = Math.max(bb.width, bb.depth, 1);
            const step = Math.pow(10, Math.round(Math.log10(span / 10)));
            const size = Math.ceil((span * 1.2) / step) * step * 2;
            const divisions = Math.max(4, Math.min(200, Math.round(size / step)));

            if (!this.grid || this._gridSize !== size || this._gridDiv !== divisions) {
                if (this.grid) {
                    this.scene.remove(this.grid);
                    disposeObject(this.grid);
                }
                this.grid = new THREE.GridHelper(size, divisions, 0x444444, 0x2c2e32);
                this.grid.rotation.x = Math.PI / 2;
                this.scene.add(this.grid);
                this._gridSize = size;
                this._gridDiv = divisions;
            }
            this.grid.position.z = bb.minZ - span * 0.0005;

            const axesLen = span * 0.5;
            this.axes.scale.setScalar(axesLen / 50);

            const boyut = Math.max(bb.width, bb.height, bb.depth, 1);
            const near = Math.max(0.01, boyut * 0.001);
            const far = Math.max(1000, boyut * 100);
            if (this.camera.near !== near || this.camera.far !== far) {
                this.camera.near = near;
                this.camera.far = far;
                this.camera.updateProjectionMatrix();
            }
        }

        /**
         * Model orijine gore olcekli uretildigi icin (X simetrik, Y ve Z
         * sifirdan baslar) aciklik k katina cikinca kamera da k katina
         * olceklenir: bakis acisi ve cerceve aynen korunur.
         */
        scaleView(k) {
            if (!isFinite(k) || k <= 0 || Math.abs(k - 1) < 1e-12) return;
            this.controls.target.multiplyScalar(k);
            this.camera.position.multiplyScalar(k);
            this.controls.update();
        }

        _addSolidMesh(cells, material) {
            if (!cells.length) return;
            const buf = Geom.mergeMeshBuffers(cells);
            const geom = new THREE.BufferGeometry();
            geom.setAttribute(
                'position',
                new THREE.Float32BufferAttribute(buf.positions, 3)
            );
            geom.setIndex(buf.indices);
            geom.computeVertexNormals();
            const mesh = new THREE.Mesh(geom, material);
            mesh.castShadow = true;
            this.meshGroup.add(mesh);
        }

        update(result) {
            this._clearGroup(this.meshGroup);
            this._clearGroup(this.wireGroup);
            this._clearGroup(this.labelGroup);
            this._clearGroup(this.symmetryGroup);
            if (!result || !result.cells.length) return;

            const cellsA = [];
            const cellsB = [];
            for (let i = 0; i < result.cells.length; i++) {
                const cell = result.cells[i];
                if (cell.module === 'B') cellsB.push(cell);
                else cellsA.push(cell);
            }
            this._addSolidMesh(cellsA, this.matA);
            if (cellsB.length) this._addSolidMesh(cellsB, this.matB);

            const lineMat = new THREE.LineBasicMaterial({ color: 0xf1d18a });
            const linePts = new Float32Array(result.edges.length * 6);
            for (let i = 0; i < result.edges.length; i++) {
                const e = result.edges[i];
                const o = i * 6;
                linePts[o] = e.a.x; linePts[o + 1] = e.a.y; linePts[o + 2] = e.a.z;
                linePts[o + 3] = e.b.x; linePts[o + 4] = e.b.y; linePts[o + 5] = e.b.z;
            }
            const lg = new THREE.BufferGeometry();
            lg.setAttribute('position', new THREE.BufferAttribute(linePts, 3));
            this.wireGroup.add(new THREE.LineSegments(lg, lineMat));

            if (this.showLabels) this._buildCornerLabels(result);
            this._buildSymmetryPlane(result);
            this._updateScene(result);
        }

        fitView(result) {
            const bb = result.bbox;
            const cx = (bb.minX + bb.maxX) / 2;
            const cy = (bb.minY + bb.maxY) / 2;
            const cz = (bb.minZ + bb.maxZ) / 2;
            const size = Math.max(bb.width, bb.height, bb.depth, 20);
            const d = size * 2.2;

            this.controls.target.set(cx, cy, cz);
            this.camera.up.set(0, 0, 1);
            this.camera.position.set(
                cx + d * 0.55,
                cy - d * 0.75,
                cz + d * 0.55
            );
            this.controls.update();
        }

        getRendererCanvas() {
            return this.renderer.domElement;
        }
    }

    /** Bu hucre sayisinin ustunde kose etiketleri gizlenir (performans) */
    Viewer3D.MAX_LABEL_CELLS = 60;

    global.Viewer3D = Viewer3D;
})(window);
