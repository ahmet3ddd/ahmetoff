/**
 * Polygon Guide Utilities
 * Püskül çokgen rehber çizgilerini oluşturan yardımcı fonksiyonlar
 */

class PolygonGuideUtils {
    
    /**
     * Püskül çokgen rehber çizgilerini oluştur
     * @param {Object} viewer - PuskulViewer instance
     */
    static createPolygonGuide(viewer) {
        // Eski guide varsa kaldır
        if (viewer.polygonGuideMesh) {
            viewer.scene.remove(viewer.polygonGuideMesh);
        }

        if (viewer.innerPolygonGuideMesh) {
            viewer.scene.remove(viewer.innerPolygonGuideMesh);
        }

        // Eski yardımcı çizgileri kaldır
        viewer.edgeGuideLines.forEach(line => viewer.scene.remove(line));
        viewer.edgeGuideLines = [];

        viewer.cornerGuideLines.forEach(line => viewer.scene.remove(line));
        viewer.cornerGuideLines = [];

        const points = [];
        const sides = viewer.puskulSides;
        const radius = viewer.outerRadius; // 🆕 outerRadius kullan (puskulRadius yerine)
        const center = new THREE.Vector3(0, 0, 0);

        // Düzenli çokgen noktalarını oluştur
        for (let i = 0; i <= sides; i++) { // +1 kapalı döngü için
            const angle = (2 * Math.PI * i) / sides - Math.PI / 2; // -90° offset (üstten başla)
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            points.push(new THREE.Vector3(x, y, 0)); // Z=0 düzleminde
        }

        // 🟡 Sarı çokgen outline
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0xd6a04a,  // Altın (dış ngon)
            linewidth: 2,
            transparent: true,
            opacity: 0.6
        });

        viewer.polygonGuideMesh = new THREE.Line(geometry, material);
        viewer.scene.add(viewer.polygonGuideMesh);

        // 🔵 Mavi kesikli çokgen outline (iç ngon - innerRadius - a1'ler)
        const innerPoints = [];

        if (viewer.puskulPlacement === 'corner') {
            // Corner: a1'ler köşelerde (ngon köşeleri)
            for (let i = 0; i <= sides; i++) {
                const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
                const x = viewer.innerRadius * Math.cos(angle);
                const y = viewer.innerRadius * Math.sin(angle);
                innerPoints.push(new THREE.Vector3(x, y, 0));
            }
        } else {
            // Edge: a1'ler kenar ortalarında (chord midpoint)
            for (let i = 0; i <= sides; i++) {
                const angle1 = (2 * Math.PI * i) / sides - Math.PI / 2;
                const angle2 = (2 * Math.PI * (i + 1)) / sides - Math.PI / 2;

                // İki köşenin chord midpoint - puskul-geometry.js ile aynı
                const x1 = viewer.innerRadius * Math.cos(angle1);
                const y1 = viewer.innerRadius * Math.sin(angle1);
                const x2 = viewer.innerRadius * Math.cos(angle2);
                const y2 = viewer.innerRadius * Math.sin(angle2);

                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;

                innerPoints.push(new THREE.Vector3(midX, midY, 0));
            }
        }

        const innerGeometry = new THREE.BufferGeometry().setFromPoints(innerPoints);
        const innerMaterial = new THREE.LineDashedMaterial({
            color: 0x90c8e6,  // Açık mavi (iç ngon)
            linewidth: 2,
            dashSize: 5,      // Kesik uzunluğu
            gapSize: 3,       // Boşluk uzunluğu
            transparent: true,
            opacity: 0.7
        });

        viewer.innerPolygonGuideMesh = new THREE.Line(innerGeometry, innerMaterial);
        viewer.innerPolygonGuideMesh.computeLineDistances(); // Kesikli çizgi için gerekli
        viewer.scene.add(viewer.innerPolygonGuideMesh);

        // 💚 Merkezden köşelere YEŞİL çizgiler
        for (let i = 0; i < sides; i++) {
            const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const cornerPoint = new THREE.Vector3(x, y, 0);

            const linePoints = [center, cornerPoint];
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
            const lineMaterial = new THREE.LineBasicMaterial({ 
                color: 0x3aa05c,  // Yeşil (köşe kılavuzu)
                linewidth: 1,
                transparent: true,
                opacity: 0.3  // Sönük
            });

            const line = new THREE.Line(lineGeometry, lineMaterial);
            viewer.scene.add(line);
            viewer.cornerGuideLines.push(line);
        }

        // 💙 Merkezden kenarlara DİK MAVİ çizgiler (kenar orta noktalarına)
        for (let i = 0; i < sides; i++) {
            const angle1 = (2 * Math.PI * i) / sides - Math.PI / 2;
            const angle2 = (2 * Math.PI * (i + 1)) / sides - Math.PI / 2;

            // İki köşe noktası
            const x1 = radius * Math.cos(angle1);
            const y1 = radius * Math.sin(angle1);
            const x2 = radius * Math.cos(angle2);
            const y2 = radius * Math.sin(angle2);

            // Kenar orta noktası
            const edgeMidX = (x1 + x2) / 2;
            const edgeMidY = (y1 + y2) / 2;
            const edgeMidPoint = new THREE.Vector3(edgeMidX, edgeMidY, 0);

            const linePoints = [center, edgeMidPoint];
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
            const lineMaterial = new THREE.LineBasicMaterial({ 
                color: 0x5b8fd6,  // Mavi (kenar kılavuzu)
                linewidth: 1,
                transparent: true,
                opacity: 0.5  // Daha görünür
            });

            const line = new THREE.Line(lineGeometry, lineMaterial);
            viewer.scene.add(line);
            viewer.edgeGuideLines.push(line);
        }

        // 📏 Kenar uzunluğunu hesapla ve göster
        const edgeLength = PolygonGuideUtils.calculateEdgeLength(radius, sides);
        const edgeLengthSpan = document.getElementById('edge-length');
        if (edgeLengthSpan) {
            edgeLengthSpan.textContent = edgeLength.toFixed(2);
        }

        console.log(`🟡 Outer polygon (c1): ${sides} sides, radius: ${radius}, edge: ${edgeLength.toFixed(2)}`);
        console.log(`🔵 Inner polygon (a1): ${sides} sides, radius: ${viewer.innerRadius} (dashed, ${viewer.puskulPlacement})`);
        console.log(`💚 ${sides} corner guides (green) created`);
        console.log(`💙 ${sides} edge guides (blue) created`);
    }

    /**
     * 📏 Gen kenar uzunluğunu hesapla
     * @param {number} radius - Çokgen yarıçapı
     * @param {number} sides - Kenar sayısı
     * @returns {number} Kenar uzunluğu
     */
    static calculateEdgeLength(radius, sides) {
        return 2 * radius * Math.sin(Math.PI / sides);
    }
}


