/**
 * Scene Setup Utilities
 * Three.js scene, camera, renderer, controls ve lights kurulumu
 */

class SceneSetup {
    
    /**
     * Sahneyi oluştur (grid, axes, background)
     * @param {Object} viewer - PuskulViewer instance
     */
    static setupScene(viewer) {
        viewer.scene = new THREE.Scene();
        viewer.scene.background = new THREE.Color(0x1e1f22);

        // Add grid helper - XY düzleminde (Z-up için)
        viewer.gridHelper = new THREE.GridHelper(1200, 60, 0x5a5d63, 0x2c2e32);
        viewer.gridHelper.rotation.x = Math.PI / 2;
        viewer.gridHelper.visible = viewer.showGrid;
        viewer.scene.add(viewer.gridHelper);
        console.log('🌐 Grid helper added: 1200x1200 (XY plane - Z-up)');

        // Add axes helper (X=Red, Y=Green, Z=Blue YUKARI)
        const axesHelper = new THREE.AxesHelper(300);
        viewer.scene.add(axesHelper);
        console.log('🎯 Axes: X=Kırmızı(sağ), Y=Yeşil(ön), Z=MAVİ(YUKARI) ⬆️, size: 300');
    }

    /**
     * Kamerayı ayarla
     * @param {Object} viewer - PuskulViewer instance
     */
    static setupCamera(viewer) {
        const container = document.getElementById('canvas-container');
        const aspect = container.clientWidth / container.clientHeight;

        viewer.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 5000);
        // Z-up: kamera konumu - Püskül için optimize
        viewer.camera.position.set(120, -120, 80);
        viewer.camera.up.set(0, 0, 1);
        viewer.camera.lookAt(0, 0, -20);

        console.log('📷 Camera setup: Z-up (mavi eksen yukarı), far: 5000');
    }

    /**
     * Renderer'ı ayarla
     * @param {Object} viewer - PuskulViewer instance
     */
    static setupRenderer(viewer) {
        const container = document.getElementById('canvas-container');

        viewer.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        viewer.renderer.setSize(container.clientWidth, container.clientHeight);
        viewer.renderer.setPixelRatio(window.devicePixelRatio);
        viewer.renderer.shadowMap.enabled = true;
        viewer.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        container.appendChild(viewer.renderer.domElement);
    }

    /**
     * OrbitControls'ü ayarla
     * @param {Object} viewer - PuskulViewer instance
     */
    static setupControls(viewer) {
        viewer.controls = new THREE.OrbitControls(viewer.camera, viewer.renderer.domElement);
        viewer.controls.enableDamping = true;
        viewer.controls.dampingFactor = 0.05;
        viewer.controls.minDistance = 50;
        viewer.controls.maxDistance = 4000;
        viewer.controls.target.set(0, 0, -20);
        viewer.controls.update();

        console.log('🎮 OrbitControls: Target (0, 0, -20) - Z-up sistemi, maxDistance: 4000');
    }

    /**
     * Işıkları ayarla
     * @param {Object} viewer - PuskulViewer instance
     */
    static setupLights(viewer) {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
        viewer.scene.add(ambientLight);

        // Directional light (sun) - Z-up: yukarıdan aşağı
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(100, 100, 200);
        dirLight.castShadow = true;
        dirLight.shadow.camera.left = -200;
        dirLight.shadow.camera.right = 200;
        dirLight.shadow.camera.top = 200;
        dirLight.shadow.camera.bottom = -200;
        viewer.scene.add(dirLight);

        // Fill light - önden
        const fillLight = new THREE.DirectionalLight(0xc8d4e0, 0.35);
        fillLight.position.set(-100, -100, 50);
        viewer.scene.add(fillLight);

        // Back light - arkadan
        const backLight = new THREE.DirectionalLight(0x9aa0a8, 0.2);
        backLight.position.set(0, 150, 50);
        viewer.scene.add(backLight);
    }
}


