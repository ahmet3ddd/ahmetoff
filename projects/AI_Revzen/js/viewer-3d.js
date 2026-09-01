// 3D Three.js viewer (global - file:// uyumlu)
(function (global) {
    'use strict';

    const Geom = global.RevzenGeom;
    const Mesh = global.RevzenMesh;
    const THREE = global.THREE;

    class Viewer3D {
        constructor(container) {
            this.container = container;

            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x1e1f22);

            this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20000);
            this.camera.position.set(180, 160, 320);

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
            this.controls.target.set(0, 80, 0);

            this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

            const dir = new THREE.DirectionalLight(0xfff2df, 0.85);
            dir.position.set(220, 420, 300);
            dir.castShadow = true;
            dir.shadow.mapSize.width = 2048;
            dir.shadow.mapSize.height = 2048;
            dir.shadow.camera.left = -400;
            dir.shadow.camera.right = 400;
            dir.shadow.camera.top = 500;
            dir.shadow.camera.bottom = -100;
            dir.shadow.bias = -0.0006;
            dir.shadow.normalBias = 2;      // fitView icinde olcege gore guncellenir
            this.scene.add(dir);
            this.sun = dir;

            // arkadan gelen isik: renkli camlar icin gerekli
            const back = new THREE.DirectionalLight(0xdfe8f5, 0.6);
            back.position.set(-120, 200, -350);
            this.scene.add(back);

            const fill = new THREE.DirectionalLight(0xc8d4e0, 0.25);
            fill.position.set(-250, 80, 180);
            this.scene.add(fill);

            this.grid = new THREE.GridHelper(800, 40, 0x444444, 0x2c2e32);
            this.grid.position.y = -0.05;
            this.scene.add(this.grid);

            const axes = new THREE.AxesHelper(50);
            axes.material.depthTest = false;
            axes.renderOrder = 999;
            this.scene.add(axes);

            const ground = new THREE.Mesh(
                new THREE.PlaneGeometry(4000, 4000),
                new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.95, metalness: 0 })
            );
            ground.rotation.x = -Math.PI / 2;
            ground.position.y = -0.12;
            ground.receiveShadow = true;
            this.scene.add(ground);
            this.ground = ground;
            this.izgaraAcik = true;

            this.group = new THREE.Group();
            this.scene.add(this.group);

            this.matFrame = new THREE.MeshStandardMaterial({
                color: 0xcbb894, roughness: 0.82, metalness: 0.02, side: THREE.DoubleSide
            });
            this.matPanel = new THREE.MeshStandardMaterial({
                color: 0xe6e0d2, roughness: 0.92, metalness: 0.0, side: THREE.DoubleSide
            });
            this.glassMats = {};

            this._onResize = () => this.resize();
            window.addEventListener('resize', this._onResize);
            this.resize();

            this._animate = this._animate.bind(this);
            this._animate();
        }

        // Zemin izgarasi + taban duzlemi. Kapaliyken temiz bir urun gorunumu
        // kalir (PNG cikisi icin faydali).
        setIzgara(acik) {
            this.izgaraAcik = !!acik;
            if (this.grid) this.grid.visible = this.izgaraAcik;
            if (this.ground) this.ground.visible = this.izgaraAcik;
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
            this._frame = requestAnimationFrame(this._animate);
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        }

        _clear() {
            while (this.group.children.length) {
                const c = this.group.children.pop();
                if (c.geometry) c.geometry.dispose();
            }
        }

        _glassMaterial(hex) {
            if (!this.glassMats[hex]) {
                this.glassMats[hex] = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(hex),
                    roughness: 0.12,
                    metalness: 0.0,
                    transparent: true,
                    opacity: 0.62,
                    side: THREE.DoubleSide,
                    emissive: new THREE.Color(hex),
                    emissiveIntensity: 0.28
                });
            }
            return this.glassMats[hex];
        }

        update(result, opts) {
            this._clear();
            if (!result || !result.inner) return;

            const o = opts || {};
            const derinlik = Math.max(0.001, Number(o.derinlik) || 1);
            const panelD   = Math.max(0.001, Number(o.panelDerinlik) || 1);

            const frameGeom = Mesh.buildFrameGeometry(result, derinlik);
            if (frameGeom) {
                const m = new THREE.Mesh(frameGeom, this.matFrame);
                m.castShadow = true;
                m.receiveShadow = true;
                this.group.add(m);
            }

            const panelGeom = Mesh.buildPanelGeometry(result, panelD);
            if (panelGeom) {
                const m = new THREE.Mesh(panelGeom, this.matPanel);
                m.castShadow = true;
                m.receiveShadow = true;
                this.group.add(m);
            }

            if (o.renkliCam !== false) {
                const glass = Mesh.buildGlassGeometries(result);
                for (const gset of glass) {
                    const m = new THREE.Mesh(gset.geometry, this._glassMaterial(gset.color));
                    m.renderOrder = 2;
                    this.group.add(m);
                }
            }
        }

        fitView(result) {
            const bb = Geom.getBoundingBox(result);
            const cx = (bb.minX + bb.maxX) / 2;
            const cy = (bb.minY + bb.maxY) / 2;
            const size = Math.max(bb.width, bb.height, 20);

            this.controls.target.set(cx, cy, 0);
            const d = size * 1.5;
            this.camera.position.set(cx + d * 0.45, cy + d * 0.35, d);
            this.camera.lookAt(cx, cy, 0);
            this.controls.update();

            const gs = Math.ceil(size * 4 / 100) * 100;
            this.scene.remove(this.grid);
            this.grid.geometry.dispose();
            this.grid = new THREE.GridHelper(gs, Math.max(10, Math.round(gs / 10)), 0x444444, 0x2c2e32);
            this.grid.position.y = -0.05;
            this.grid.visible = this.izgaraAcik;
            this.scene.add(this.grid);

            this.sun.shadow.camera.left   = cx - size * 1.5;
            this.sun.shadow.camera.right  = cx + size * 1.5;
            this.sun.shadow.camera.top    = cy + size * 1.5;
            this.sun.shadow.camera.bottom = cy - size * 1.5;
            this.sun.shadow.normalBias    = Math.max(0.5, size * 0.012);
            this.sun.shadow.camera.updateProjectionMatrix();
            this.sun.position.set(cx + size * 0.9, cy + size * 1.8, size * 1.4);
            this.sun.target.position.set(cx, cy, 0);
            this.sun.target.updateMatrixWorld();
        }

        getRendererCanvas() { return this.renderer.domElement; }
    }

    global.Viewer3D = Viewer3D;
})(window);
