// 3D Three.js viewer - Z yukari (global - file:// uyumlu)
(function (global) {
    'use strict';

    const Geom = global.MukarnasGeom;
    const THREE = global.THREE;

    function disposeObject(obj) {
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
    }

    function makeLabelSprite(text, color, opts) {
        opts = opts || {};
        const size = opts.size || 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = opts.bg || 'rgba(20, 21, 24, 0.82)';
        if (opts.shape === 'rect') {
            ctx.fillRect(4, 4, size - 8, size - 8);
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            ctx.strokeRect(4, 4, size - 8, size - 8);
        } else {
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 5;
            ctx.stroke();
        }

        ctx.fillStyle = color;
        ctx.font = (opts.font || 'bold 72px sans-serif');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, size / 2, size / 2 + 2);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({
            map: tex,
            depthTest: false,
            transparent: true
        });
        const sprite = new THREE.Sprite(mat);
        sprite.renderOrder = 1000;
        return sprite;
    }

    class Viewer3D {
        constructor(container) {
            this.container = container;

            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x1e1f22);

            this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
            this.camera.up.set(0, 0, 1);
            this.camera.position.set(120, -160, 100);

            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                preserveDrawingBuffer: true
            });
            this.renderer.setPixelRatio(window.devicePixelRatio || 1);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.container.appendChild(this.renderer.domElement);

            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.08;
            this.controls.target.set(50, 40, 50);

            const ambient = new THREE.AmbientLight(0xffffff, 0.55);
            this.scene.add(ambient);

            const dir = new THREE.DirectionalLight(0xffffff, 0.75);
            dir.position.set(200, -250, 400);
            dir.castShadow = true;
            this.scene.add(dir);

            const fill = new THREE.DirectionalLight(0xc8d4e0, 0.35);
            fill.position.set(-200, 150, 100);
            this.scene.add(fill);

            const grid = new THREE.GridHelper(400, 40, 0x444444, 0x2c2e32);
            grid.rotation.x = Math.PI / 2;
            grid.position.z = -0.05;
            this.scene.add(grid);

            const axes = new THREE.AxesHelper(40);
            axes.material.depthTest = false;
            axes.renderOrder = 999;
            this.scene.add(axes);

            this.meshGroup = new THREE.Group();
            this.scene.add(this.meshGroup);

            this.wireMat = new THREE.LineBasicMaterial({ color: 0xf1d18a, transparent: true, opacity: 0.35 });
            this.faceMat = new THREE.MeshStandardMaterial({
                color: 0xd6a04a,
                roughness: 0.65,
                metalness: 0.1,
                side: THREE.DoubleSide,
                flatShading: true
            });

            this._labelScale = 10;

            this._onResize = () => this.resize();
            window.addEventListener('resize', this._onResize);
            this.resize();

            this._animate = this._animate.bind(this);
            this._animate();
        }

        resize() {
            const rect = this.container.getBoundingClientRect();
            const w = Math.max(1, rect.width);
            const h = Math.max(1, rect.height);
            this.renderer.setSize(w, h, false);
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();

            const span = Math.max(w, h);
            this._labelScale = Math.max(8, Math.min(16, span * 0.028));
        }

        _animate() {
            this._frame = requestAnimationFrame(this._animate);
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        }

        _clearMeshGroup() {
            while (this.meshGroup.children.length) {
                const c = this.meshGroup.children.pop();
                disposeObject(c);
            }
        }

        _drawVertexNumbers(vertices, p3) {
            if (!vertices || vertices.length === 0) return;

            let maxSpan = 1;
            for (let i = 0; i < vertices.length; i++) {
                const v = vertices[i];
                maxSpan = Math.max(maxSpan, Math.abs(v.x), Math.abs(v.y), Math.abs(v.z));
            }
            const yOff = Math.max(2.5, maxSpan * 0.018);
            const scale = this._labelScale * 0.62;

            for (let i = 0; i < vertices.length; i++) {
                const v = vertices[i];
                const num = String(i + 1);
                const sprite = makeLabelSprite(num, '#f1d18a', {
                    size: 96,
                    shape: 'rect',
                    font: 'bold 52px sans-serif',
                    bg: 'rgba(16, 17, 20, 0.9)'
                });
                sprite.position.set(v.x, v.y + yOff, v.z);
                sprite.scale.set(scale, scale, 1);
                this.meshGroup.add(sprite);
            }

            if (p3) {
                const p3Dot = new THREE.Mesh(
                    new THREE.SphereGeometry(this._labelScale * 0.13, 10, 10),
                    new THREE.MeshBasicMaterial({ color: 0x90c8e6, depthTest: false, transparent: true, opacity: 0.95 })
                );
                p3Dot.position.set(p3.x, p3.y, p3.z);
                p3Dot.renderOrder = 999;
                this.meshGroup.add(p3Dot);
            }
        }

        _drawSegmentMarkers(markers) {
            if (!markers || markers.length === 0) return;

            const guideMat = new THREE.LineBasicMaterial({
                color: 0x666a72,
                transparent: true,
                opacity: 0.55,
                depthTest: false
            });
            guideMat.depthWrite = false;

            for (let i = 0; i < markers.length; i++) {
                const m = markers[i];
                const color = new THREE.Color(m.color);

                const segMat = new THREE.LineBasicMaterial({
                    color: color,
                    linewidth: 2,
                    depthTest: false,
                    transparent: true,
                    opacity: 0.95
                });
                segMat.depthWrite = false;

                const lp = m.labelPos;
                const segGeom = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(lp.x, lp.y, m.bottom.z),
                    new THREE.Vector3(lp.x, lp.y, m.top.z)
                ]);
                const segLine = new THREE.Line(segGeom, segMat);
                segLine.renderOrder = 998;
                this.meshGroup.add(segLine);

                const tickW = this._labelScale * 0.22;
                [[m.bottom.z, 1], [m.top.z, 1]].forEach(function (pair) {
                    const z = pair[0];
                    const tickGeom = new THREE.BufferGeometry().setFromPoints([
                        new THREE.Vector3(lp.x, lp.y, z),
                        new THREE.Vector3(lp.x, lp.y - tickW, z)
                    ]);
                    const tick = new THREE.Line(tickGeom, segMat);
                    tick.renderOrder = 998;
                    this.meshGroup.add(tick);
                }, this);

                const topDot = new THREE.Mesh(
                    new THREE.SphereGeometry(this._labelScale * 0.11, 10, 10),
                    new THREE.MeshBasicMaterial({ color: color, depthTest: false, transparent: true, opacity: 0.9 })
                );
                topDot.position.set(m.top.x, m.top.y, m.top.z);
                topDot.renderOrder = 999;
                this.meshGroup.add(topDot);

                const botDot = new THREE.Mesh(
                    new THREE.SphereGeometry(this._labelScale * 0.11, 10, 10),
                    new THREE.MeshBasicMaterial({ color: color, depthTest: false, transparent: true, opacity: 0.9 })
                );
                botDot.position.set(m.bottom.x, m.bottom.y, m.bottom.z);
                botDot.renderOrder = 999;
                this.meshGroup.add(botDot);

                const sprite = makeLabelSprite(m.label, m.color);
                sprite.position.set(lp.x, lp.y, m.mid.z);
                sprite.scale.set(this._labelScale, this._labelScale, 1);
                this.meshGroup.add(sprite);

                const connGeom = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(m.mid.x, m.mid.y, m.mid.z),
                    new THREE.Vector3(lp.x, lp.y, m.mid.z)
                ]);
                const conn = new THREE.Line(connGeom, guideMat);
                conn.renderOrder = 997;
                this.meshGroup.add(conn);
            }
        }

        update(result, viewOptions) {
            viewOptions = viewOptions || {};
            this._clearMeshGroup();

            if (!result || !result.mesh) return;

            const data = Geom.meshToThreeGeometry(result.mesh);
            const geom = new THREE.BufferGeometry();
            geom.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
            geom.setIndex(data.indices);
            geom.computeVertexNormals();

            const mesh = new THREE.Mesh(geom, this.faceMat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.meshGroup.add(mesh);

            const edges = new THREE.EdgesGeometry(geom, 4);
            const lines = new THREE.LineSegments(edges, this.wireMat);
            this.meshGroup.add(lines);

            const planPts = result.planPoints || (result.planTriangle ? result.planTriangle.slice(0, 3) : null);
            if (planPts && planPts.length >= 3) {
                const planVerts = [];
                for (let i = 0; i < planPts.length; i++) {
                    planVerts.push(planPts[i].x, planPts[i].y, 0);
                }
                planVerts.push(planPts[0].x, planPts[0].y, 0);
                const planGeom = new THREE.BufferGeometry();
                planGeom.setAttribute('position', new THREE.Float32BufferAttribute(planVerts, 3));
                const planLine = new THREE.Line(
                    planGeom,
                    new THREE.LineBasicMaterial({ color: 0x90c8e6 })
                );
                this.meshGroup.add(planLine);
            }

            if (viewOptions.showSegmentLabels && viewOptions.segmentMarkers) {
                this._drawSegmentMarkers(viewOptions.segmentMarkers);
            }

            if (viewOptions.showVertexNumbers && result.mesh.vertices) {
                this._drawVertexNumbers(result.mesh.vertices, viewOptions.p3);
            }
        }

        fitView(result) {
            const bb = Geom.getBoundingBox(result);
            const cx = (bb.minX + bb.maxX) / 2;
            const cy = (bb.minY + bb.maxY) / 2;
            const cz = (bb.minZ + bb.maxZ) / 2;
            const size = Math.max(bb.width, bb.height, bb.depth, 30);

            this.controls.target.set(cx, cy, cz);
            const d = size * 2.2;
            this.camera.position.set(cx + d * 0.65, cy - d * 0.75, cz + d * 0.55);
            this.camera.up.set(0, 0, 1);
            this.camera.lookAt(cx, cy, cz);
            this.controls.update();
        }

        getRendererCanvas() {
            return this.renderer.domElement;
        }
    }

    global.Viewer3D = Viewer3D;
})(window);
