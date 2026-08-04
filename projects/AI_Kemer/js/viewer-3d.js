// 3D Three.js viewer (global - file:// uyumlu)
(function (global) {
    'use strict';

    const Geom = global.KemerGeom;
    const THREE = global.THREE;

    class Viewer3D {
        constructor(container) {
            this.container = container;

            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x1e1f22);

            this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
            this.camera.position.set(300, 250, 400);

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
            this.controls.target.set(0, 50, 0);

            const ambient = new THREE.AmbientLight(0xffffff, 0.55);
            this.scene.add(ambient);

            const dir = new THREE.DirectionalLight(0xffffff, 0.75);
            dir.position.set(200, 400, 250);
            dir.castShadow = true;
            dir.shadow.mapSize.width = 1024;
            dir.shadow.mapSize.height = 1024;
            dir.shadow.camera.left = -400;
            dir.shadow.camera.right = 400;
            dir.shadow.camera.top = 400;
            dir.shadow.camera.bottom = -100;
            this.scene.add(dir);

            const fill = new THREE.DirectionalLight(0xc8d4e0, 0.35);
            fill.position.set(-200, 100, -150);
            this.scene.add(fill);

            const grid = new THREE.GridHelper(800, 40, 0x444444, 0x2c2e32);
            grid.position.y = -0.05;
            this.scene.add(grid);

            const axes = new THREE.AxesHelper(60);
            axes.material.depthTest = false;
            axes.renderOrder = 999;
            this.scene.add(axes);

            const groundMat = new THREE.MeshStandardMaterial({
                color: 0x2a2c30,
                roughness: 0.95,
                metalness: 0.0
            });
            const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), groundMat);
            ground.rotation.x = -Math.PI / 2;
            ground.position.y = -0.1;
            ground.receiveShadow = true;
            this.scene.add(ground);

            this.archGroup = new THREE.Group();
            this.scene.add(this.archGroup);

            this.material = new THREE.MeshStandardMaterial({
                color: 0xd6a04a,
                roughness: 0.65,
                metalness: 0.1,
                side: THREE.DoubleSide
            });

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
        }

        _animate() {
            this._frame = requestAnimationFrame(this._animate);
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        }

        update(result, extrudeDepth) {
            while (this.archGroup.children.length) {
                const c = this.archGroup.children.pop();
                if (c.geometry) c.geometry.dispose();
            }

            if (!result || !result.archUnits || result.archUnits.length === 0) {
                return;
            }

            const depth = Math.max(0.001, Number(extrudeDepth) || 0);

            for (const unit of result.archUnits) {
                let ring;
                if (unit.outer) {
                    ring = Geom.getClosedPolygon(unit);
                } else {
                    ring = this._thinBand(unit.inner, 1.0);
                }

                const shape = new THREE.Shape();
                shape.moveTo(ring[0].x, ring[0].y);
                for (let i = 1; i < ring.length; i++) {
                    shape.lineTo(ring[i].x, ring[i].y);
                }
                shape.closePath();

                const geom = new THREE.ExtrudeGeometry(shape, {
                    depth: depth,
                    bevelEnabled: false,
                    curveSegments: 12
                });
                geom.translate(0, 0, -depth / 2);
                geom.computeVertexNormals();

                const mesh = new THREE.Mesh(geom, this.material);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                this.archGroup.add(mesh);
            }
        }

        _thinBand(curve, thickness) {
            const ring = curve.slice();
            for (let i = curve.length - 1; i >= 0; i--) {
                ring.push({ x: curve[i].x, y: curve[i].y + thickness });
            }
            return ring;
        }

        fitView(result) {
            const bb = Geom.getBoundingBox(result);
            const cx = (bb.minX + bb.maxX) / 2;
            const cy = (bb.minY + bb.maxY) / 2;
            const size = Math.max(bb.width, bb.height, 50);

            this.controls.target.set(cx, cy, 0);
            const d = size * 1.6;
            this.camera.position.set(cx + d * 0.6, cy + d * 0.5, d);
            this.camera.lookAt(cx, cy, 0);
            this.controls.update();
        }

        getRendererCanvas() {
            return this.renderer.domElement;
        }
    }

    global.Viewer3D = Viewer3D;
})(window);
