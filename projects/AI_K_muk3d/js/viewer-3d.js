// 3D Three.js viewer — mukarnas mesh (global, file:// uyumlu)
(function (global) {
    'use strict';

    const Geom = global.MukarnasGeom;
    const THREE = global.THREE;

    class Viewer3D {
        constructor(container) {
            this.container = container;

            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x1e1f22);

            this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100000);
            this.camera.position.set(-220, 100, -160);

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

            const ambient = new THREE.AmbientLight(0xffffff, 0.55);
            this.scene.add(ambient);

            const dir = new THREE.DirectionalLight(0xffffff, 0.75);
            dir.position.set(200, 300, 200);
            dir.castShadow = true;
            this.scene.add(dir);

            const fill = new THREE.DirectionalLight(0xc8d4e0, 0.35);
            fill.position.set(-150, 80, -120);
            this.scene.add(fill);

            const grid = new THREE.GridHelper(400, 40, 0x444444, 0x2c2e32);
            grid.position.y = -0.05;
            this.scene.add(grid);

            const axes = new THREE.AxesHelper(40);
            axes.material.depthTest = false;
            this.scene.add(axes);

            this.meshGroup = new THREE.Group();
            this.scene.add(this.meshGroup);

            this._materials = {};

            this._onResize = () => this.resize();
            window.addEventListener('resize', this._onResize);
            this.resize();

            this._animate = this._animate.bind(this);
            this._animate();
        }

        _getMaterial(color) {
            const key = String(color);
            if (!this._materials[key]) {
                this._materials[key] = new THREE.MeshStandardMaterial({
                    color: color,
                    roughness: 0.65,
                    metalness: 0.08,
                    side: THREE.DoubleSide
                });
            }
            return this._materials[key];
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

        _disposeGroup() {
            while (this.meshGroup.children.length) {
                const c = this.meshGroup.children.pop();
                if (c.geometry) c.geometry.dispose();
            }
        }

        update(result) {
            this._disposeGroup();
            if (!result || !result.meshes || result.meshes.length === 0) {
                return;
            }

            for (let i = 0; i < result.meshes.length; i++) {
                const meshData = result.meshes[i];
                const geom = Geom.meshToBufferGeometry(meshData, THREE);
                const mat = this._getMaterial(meshData.color || Geom.COLOR_MAIN);
                const mesh = new THREE.Mesh(geom, mat);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                this.meshGroup.add(mesh);
            }

            const wire = this._buildWireframe(result);
            if (wire) this.meshGroup.add(wire);
        }

        _buildWireframe(result) {
            const positions = [];
            const seen = {};

            function edgeKey(a, b) {
                const k1 = a.x + ',' + a.y + ',' + a.z;
                const k2 = b.x + ',' + b.y + ',' + b.z;
                return k1 < k2 ? k1 + '|' + k2 : k2 + '|' + k1;
            }

            function addEdge(a, b) {
                const key = edgeKey(a, b);
                if (seen[key]) return;
                seen[key] = true;
                const ta = Geom.maxToThree(a);
                const tb = Geom.maxToThree(b);
                positions.push(ta.x, ta.y, ta.z, tb.x, tb.y, tb.z);
            }

            for (let m = 0; m < result.meshes.length; m++) {
                const md = result.meshes[m];
                const verts = md.vertices;
                for (let f = 0; f < md.faces.length; f++) {
                    const face = md.faces[f];
                    for (let i = 0; i < face.length; i++) {
                        const ia = face[i];
                        const ib = face[(i + 1) % face.length];
                        addEdge(verts[ia], verts[ib]);
                    }
                }
            }

            if (positions.length === 0) return null;

            const geom = new THREE.BufferGeometry();
            geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            const mat = new THREE.LineBasicMaterial({ color: 0x3a4a52, transparent: true, opacity: 0.35 });
            return new THREE.LineSegments(geom, mat);
        }

        /**
         * Ön yön: mukarnasın ucu (P1) hangi taraftaysa kamera oradan bakar.
         * Plan döndürülse de görünüş hep önden gelir.
         */
        _frontDir(result, cx, cz) {
            let dx = -0.775;
            let dz = -0.634;
            if (result && result.plan) {
                // Max (x, y) -> Three (x, z)
                const ax = result.plan.p1.x - cx;
                const az = result.plan.p1.y - cz;
                const len = Math.hypot(ax, az);
                if (len > 1e-6) {
                    dx = ax / len;
                    dz = az / len;
                }
            }
            return { x: dx, z: dz };
        }

        fitView(result) {
            const bb = Geom.getBoundingBoxThree(result.bbox);
            const cx = (bb.minX + bb.maxX) / 2;
            const cy = (bb.minY + bb.maxY) / 2;
            const cz = (bb.minZ + bb.maxZ) / 2;
            const size = Math.max(bb.width, bb.height, bb.depth, 30);

            const on = this._frontDir(result, cx, cz);
            this.controls.target.set(cx, cy, cz);
            const d = size * 2.2;
            // ufuktan ~27° yükseklik: kuşbakışı değil, önden bakış
            this.camera.position.set(
                cx + d * 0.88 * on.x,
                cy + d * 0.45,
                cz + d * 0.88 * on.z
            );
            this.controls.update();
        }

        getRendererCanvas() {
            return this.renderer.domElement;
        }
    }

    global.Viewer3D = Viewer3D;
})(window);
