/**
 * Render Utilities Module
 * 
 * Handles animation loop and layer rendering
 * Separated from app.js for better modularity
 */

class RenderUtils {

    /**
     * Katman mesh renk paleti (muk3d görsel dili)
     * Altın → mavi → yeşil → kiremit, sonra başa döner.
     */
    static LAYER_COLORS = [0xd6a04a, 0x5b8fd6, 0x3aa05c, 0xc0533a];

    /**
     * Get Z offset for a layer (stack sistemi - recursive)
     * @param {Object} viewer - PuskulViewer instance
     * @param {number} layerNum - Layer number
     * @returns {number} Z offset (top of the layer)
     */
    static getLayerZOffset(viewer, layerNum) {
        // Stack sistemi: Her katmanın üstü parent'ın geçiş yüzeyi altı
        if (layerNum === 1) {
            return 0; // Layer 1 en üstte, Z=0'dan başlar
        }

        // Parent katmanı bul
        const parentLayerNum = viewer.layers[layerNum]?.parentLayer || (layerNum - 1);
        const parentLayer = viewer.layers[parentLayerNum];

        if (!parentLayer) {
            console.warn(`⚠️ Layer ${layerNum} için parent (${parentLayerNum}) bulunamadı, varsayılan offset kullanılıyor`);
            return -(layerNum - 1) * 100; // Fallback
        }

        // Parent'ın üst Z'sini al (recursive)
        const parentTop = RenderUtils.getLayerZOffset(viewer, parentLayerNum);

        // Parent'ın transition height'ını al
        let parentTransitionHeight;
        if (viewer.layerTransition?.lockHeight) {
            // Kilit aktifse global height kullan
            parentTransitionHeight = viewer.layerTransition.globalHeight !== undefined
                ? viewer.layerTransition.globalHeight
                : 20;
        } else {
            // Kilit pasifse parent'ın kendi height'ı
            parentTransitionHeight = parentLayer.transitionHeight !== undefined
                ? parentLayer.transitionHeight
                : 20;
        }

        // Parent'ın gerçek yüksekliğini al (actualHeight varsa kullan, yoksa H kullan)
        const parentActualHeight = parentLayer.actualHeight !== undefined
            ? parentLayer.actualHeight
            : viewer.H;

        console.log(`🔍 getLayerZOffset(${layerNum}): parentTop=${parentTop}, parentActualHeight=${parentActualHeight}, transitionHeight=${parentTransitionHeight}`);

        // Yeni mantık: Her katman transition -> mesh sıralamasında
        // parent transition: parentTop to (parentTop - parentTransitionHeight)
        // parent mesh: (parentTop - parentTransitionHeight) to (parentTop - parentTransitionHeight - parentActualHeight)
        // child transition top = parent mesh bottom
        const thisLayerTop = parentTop - parentTransitionHeight - parentActualHeight;

        console.log(`🔍 getLayerZOffset(${layerNum}): thisLayerTop=${thisLayerTop}`);

        return thisLayerTop;
    }

    /**
     * Render a specific layer
     * @param {Object} viewer - PuskulViewer instance
     * @param {number} layerNum - Layer number
     */
    static renderLayer(viewer, layerNum) {
        const layer = viewer.layers[layerNum];
        
        if (!layer || !layer.geometry) {
            console.warn(`⚠️ Katman ${layerNum} geometrisi yok, render atlanıyor`);
            return;
        }

        console.log(`🎨 Rendering Layer ${layerNum}...`);

        // Z offset hesapla
        const zOffset = RenderUtils.getLayerZOffset(viewer, layerNum);

        // Eğer katmana ait mesh'ler varsa kaldır
        if (layer.mesh) {
            viewer.scene.remove(layer.mesh);
            layer.mesh.geometry.dispose();
        }
        if (layer.wireframeMesh) {
            viewer.scene.remove(layer.wireframeMesh);
            layer.wireframeMesh.geometry.dispose();
        }

        // Yeni mesh oluştur
        const geometry = layer.geometry.createThreeGeometry();
        const vertexCount = geometry?.attributes?.position ? geometry.attributes.position.count : 0;
        const indexCount = geometry?.index ? geometry.index.count : 0;
        console.log(`📐 Katman ${layerNum} geometry: vertices=${vertexCount}, indices=${indexCount}`);

        // Geometry'nin gerçek yüksekliğini bul (min Z ve max Z arası fark)
        const positions = geometry.attributes.position;
        let geometryMinZ = Infinity;
        let geometryMaxZ = -Infinity;
        for (let i = 0; i < positions.count; i++) {
            const z = positions.getZ(i);
            if (z < geometryMinZ) geometryMinZ = z;
            if (z > geometryMaxZ) geometryMaxZ = z;
        }

        const actualHeight = geometryMaxZ - geometryMinZ;
        console.log(`📐 Katman ${layerNum} Z aralığı: ${geometryMinZ.toFixed(2)} to ${geometryMaxZ.toFixed(2)}, yükseklik: ${actualHeight.toFixed(2)} (H=${viewer.H}, fark=${(viewer.H - actualHeight).toFixed(2)})`);

        // actualHeight 0 ise fallback
        if (actualHeight === 0 && viewer.H > 0) {
            console.warn(`⚠️ Katman ${layerNum} yükseklik 0, H=${viewer.H} kullanılıyor`);
            layer.actualHeight = viewer.H;
        } else {
            layer.actualHeight = actualHeight;
        }

        // Mesh position hesabı için geometryMaxZ'yi sakla
        layer.geometryMaxZ = geometryMaxZ;

        // Ana mesh
        const material = new THREE.MeshPhongMaterial({
            color: RenderUtils.LAYER_COLORS[(layerNum - 1) % RenderUtils.LAYER_COLORS.length], // Altın, mavi, yeşil, kiremit
            flatShading: true,
            shininess: 30,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        // Yeni mantık: Her katman transition -> mesh sıralamasında
        // zOffset = transition top
        // mesh top = transition bottom = zOffset - transitionHeight
        // mesh.position.z + geometryMaxZ = zOffset - transitionHeight

        // Kilit aktifse globalHeight, değilse katmanın kendi height'ı
        let transitionHeight;
        if (viewer.layerTransition?.lockHeight) {
            transitionHeight = viewer.layerTransition.globalHeight !== undefined
                ? viewer.layerTransition.globalHeight
                : 20;
        } else {
            transitionHeight = layer.transitionHeight !== undefined ? layer.transitionHeight : 20;
        }

        mesh.position.z = zOffset - transitionHeight - geometryMaxZ;
        console.log(`📐 Katman ${layerNum} mesh.position.z = ${mesh.position.z.toFixed(2)} (zOffset=${zOffset}, transitionHeight=${transitionHeight}, geometryMaxZ=${geometryMaxZ.toFixed(2)}, locked=${viewer.layerTransition?.lockHeight})`);

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.visible = layer.visible;
        viewer.scene.add(mesh);
        layer.mesh = mesh;

        // 🎯 Aktif katmansa puskulMesh'i de güncelle (raycaster için)
        if (layerNum == viewer.currentLayer) {
            viewer.puskulMesh = mesh;
            console.log(`🎯 Aktif katman mesh güncellendi: Katman ${layerNum}`);
        }

        // Wireframe mesh
        const edgesGeometry = new THREE.EdgesGeometry(geometry, 1);
        const edgesMaterial = new THREE.LineBasicMaterial({
            color: 0xf1d18a,
            linewidth: 1,
            transparent: true,
            opacity: 0.55
        });

        const wireframe = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        wireframe.position.z = mesh.position.z; // Mesh ile aynı position
        wireframe.visible = layer.visible && viewer.showWireframe;
        viewer.scene.add(wireframe);
        layer.wireframeMesh = wireframe;

        // 🎯 Aktif katmansa wireframeMesh'i de güncelle
        if (layerNum == viewer.currentLayer) {
            viewer.wireframeMesh = wireframe;
        }

        console.log(`✅ Katman ${layerNum} render edildi (Z: ${zOffset}, visible: ${layer.visible})`);
    }

    /**
     * Render all visible layers
     * @param {Object} viewer - PuskulViewer instance
     */
    static renderAllLayers(viewer) {
        Object.keys(viewer.layers).forEach(layerNum => {
            const layer = viewer.layers[layerNum];
            if (layer.visible && layer.geometry) {
                RenderUtils.renderLayer(viewer, parseInt(layerNum));
            }
        });

        // console.log(`🎨 Tüm katmanlar render edildi`);
    }

    /**
     * Animation loop
     * @param {Object} viewer - PuskulViewer instance
     */
    static animate(viewer) {
        requestAnimationFrame(() => RenderUtils.animate(viewer));

        viewer.controls.update();
        viewer.renderer.render(viewer.scene, viewer.camera);

        // 🖼️ PIP render
        if (viewer.showPip && viewer.pipRenderer) {
            viewer.pipRenderer.render(viewer.scene, viewer.pipCamera);
        }
    }
}

