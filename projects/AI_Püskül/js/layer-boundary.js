/**
 * Layer Boundary Management
 * Koordinat bazlı katman sistemi için boundary noktalarını yöneten modül
 *
 * Bu modül, üst katmanların hücrelerinden boundary noktalarını (a1, b1, d1) çıkarır
 * ve alt katmanlar için custom outer boundary oluşturur.
 */

class LayerBoundary {
    /**
     * Bir katmanın tüm hücrelerinden boundary noktalarını (sadece a1) çıkar
     * Bu noktalar alt katmanın outer boundary'sini oluşturur
     * @param {object} layer - Katman objesi (geometry, visible, etc.)
     * @param {number} zOffset - Katmanın Z offset'i
     * @param {boolean} onlyA1 - Sadece a1 noktalarını mı al? (varsayılan: true)
     * @returns {Array} - [{x, y, z, pointName, cellName, cellIndex}, ...] world-space koordinatları
     */
    static extractBoundaryPoints(layer, zOffset = 0, onlyA1 = true) {
        if (!layer || !layer.geometry) {
            console.error(`❌ Katman geometrisi bulunamadı!`);
            return null;
        }

        const boundaryPoints = [];
        const geometry = layer.geometry;

        // Her hücre için a1 (ve isteğe bağlı b1, d1) noktalarını topla
        for (let i = 0; i < geometry.totalCells; i++) {
            const cellName = `cell${i + 1}`;
            const cell = geometry.cells[cellName];
            const pos = geometry.cellPositions[cellName];

            if (!cell || !pos || !cell.geometry || !cell.geometry.points) {
                console.warn(`⚠️ ${cellName} geometrisi eksik, atlanıyor`);
                continue;
            }

            const cellGeo = cell.geometry;
            const prefix = LayerBoundary.getCellPrefix(cell.type);

            // Sadece a1 noktalarını al (outer boundary için)
            const pointNames = onlyA1 ? [`${prefix}-a1`] : [`${prefix}-a1`, `${prefix}-b1`, `${prefix}-d1`];

            pointNames.forEach(pointName => {
                const pt = cellGeo.points[pointName];
                if (!pt) {
                    console.warn(`⚠️ ${cellName}.${pointName} bulunamadı`);
                    return;
                }

                // World koordinatlarına dönüştür (rotation + translation)
                const worldCoords = LayerBoundary.transformToWorld(pt, pos, zOffset);

                boundaryPoints.push({
                    x: worldCoords.x,
                    y: worldCoords.y,
                    z: worldCoords.z,
                    pointName: pointName,
                    cellName: cellName,
                    cellIndex: i
                });
            });
        }

        const pointsPerCell = onlyA1 ? 1 : 3;
        console.log(`📍 ${boundaryPoints.length} boundary noktası çıkarıldı (${geometry.totalCells} hücre × ${pointsPerCell} nokta)`);
        console.log(`ℹ️ Boundary noktaları cell index sırasına göre (sıralama YOK)`);

        return boundaryPoints;
    }

    /**
     * Local koordinatı world koordinatına dönüştür
     * @param {object} point - {x, y, z} local koordinat
     * @param {object} position - {x, y, z, rotation} hücre pozisyonu
     * @param {number} zOffset - Katman Z offset'i
     * @returns {object} - {x, y, z} world koordinat
     */
    static transformToWorld(point, position, zOffset = 0) {
        const cos = Math.cos(position.rotation);
        const sin = Math.sin(position.rotation);

        return {
            x: position.x + (point.x * cos - point.y * sin),
            y: position.y + (point.x * sin + point.y * cos),
            z: point.z + position.z + zOffset
        };
    }

    /**
     * Hücre tipine göre prefix belirle
     * @param {string} cellType - Hücre tipi (BADEM, FITIL, KAZAYAGI, YAPRAK)
     * @returns {string} - Prefix (B, F, K, Y)
     */
    static getCellPrefix(cellType) {
        if (cellType === 'FITIL') return 'F';
        if (cellType === 'KAZAYAGI') return 'K';
        if (cellType === 'YAPRAK') return 'Y';
        return 'B'; // BADEM default
    }

    /**
     * Boundary noktalarını hücre indeksine göre grupla
     * Her hücrenin 3 noktası (a1, b1, d1) bir grup oluşturur
     * @param {Array} boundaryPoints - [{x, y, z, cellIndex, ...}, ...]
     * @returns {Map} - cellIndex -> [point1, point2, point3]
     */
    static groupByCell(boundaryPoints) {
        const grouped = new Map();

        boundaryPoints.forEach(pt => {
            if (!grouped.has(pt.cellIndex)) {
                grouped.set(pt.cellIndex, []);
            }
            grouped.get(pt.cellIndex).push(pt);
        });

        return grouped;
    }

    /**
     * Boundary noktalarını görselleştir (debug için)
     * @param {Array} boundaryPoints - [{x, y, z, ...}, ...]
     * @param {THREE.Scene} scene - Three.js sahne
     * @param {number} color - Renk (hex)
     * @returns {THREE.Group} - Nokta meshlerini içeren grup
     */
    static visualizeBoundary(boundaryPoints, scene, color = 0xff00ff) {
        if (typeof THREE === 'undefined') {
            console.error('❌ THREE.js yüklü değil!');
            return null;
        }

        const group = new THREE.Group();
        const geometry = new THREE.SphereGeometry(2, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: color });

        boundaryPoints.forEach(pt => {
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(pt.x, pt.y, pt.z);
            group.add(sphere);
        });

        scene.add(group);
        console.log(`🔮 ${boundaryPoints.length} boundary noktası görselleştirildi`);

        return group;
    }

    /**
     * Boundary noktalarını kalın çizgi ile görselleştir (outer boundary çizgisi)
     * @param {Array} boundaryPoints - [{x, y, z, ...}, ...]
     * @param {THREE.Scene} scene - Three.js sahne
     * @param {number} targetZ - Hedef Z seviyesi (hangi katman seviyesinde çizilecek)
     * @param {number} color - Renk (hex)
     * @param {number} lineWidth - Çizgi kalınlığı
     * @returns {THREE.Line} - Boundary çizgisi
     */
    static visualizeBoundaryLine(boundaryPoints, scene, targetZ = 0, color = 0x00ff00, lineWidth = 5) {
        if (typeof THREE === 'undefined') {
            console.error('❌ THREE.js yüklü değil!');
            return null;
        }

        if (!boundaryPoints || boundaryPoints.length === 0) {
            console.warn('⚠️ Boundary noktaları boş!');
            return null;
        }

        // boundaryPoints zaten sadece a1 noktaları (extractBoundaryPoints onlyA1=true ile çağrılıyor)
        // Çizgi geometrisi oluştur (tüm noktaları birleştir)
        // Z koordinatını targetZ olarak ayarla
        const points = boundaryPoints.map(pt => new THREE.Vector3(pt.x, pt.y, targetZ));

        // Döngüyü kapat (ilk noktaya geri dön)
        if (points.length > 0) {
            points.push(points[0].clone());
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: color,
            linewidth: lineWidth,  // Not: Bu sadece WebGL renderer'da çalışır
            depthTest: false  // Her zaman üstte görünsün
        });

        const line = new THREE.Line(geometry, material);
        line.renderOrder = 1000;  // En üstte render et

        scene.add(line);
        console.log(`📏 Boundary çizgisi oluşturuldu: ${boundaryPoints.length} nokta, Z=${targetZ}, renk: #${color.toString(16)}`);

        return line;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LayerBoundary;
} else {
    window.LayerBoundary = LayerBoundary;
}
