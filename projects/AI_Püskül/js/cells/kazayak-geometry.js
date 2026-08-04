/**
 * Kazayak 3D Geometry
 * Kazayak hücresi için geometri sınıfı
 * 
 * Coordinate System:
 * - Plan (p) view: X, Y coordinates
 * - Front (f) view: X, Z coordinates
 * - Combined: Full 3D (X, Y, Z)
 */

class KazayakGeometry {
    constructor(M = 1, H = 1, slaveRatio = 0.09, slaveRatio2 = 0.186, sectorAngle = null, innerRadius = null, outerRadius = null, sectorIndex = 0, zLevels = null, placement = 'corner', c6Override = null) {
        this.M = M; // Module size
        this.H = H; // Total height
        this.slaveRatio = slaveRatio;   // 🎯 Seviye 2-3: a1'den c1 yönünde oran (varsayılan 0.09, depth × ratio)
        this.slaveRatio2 = slaveRatio2; // 🎯 c1 yönünde offset oranı (varsayılan 0.186, depth × ratio)
        // KAZAYAK: ratioZ5 KALDIRILDI (w5 ve z5 yok)
        this.sectorAngle = sectorAngle; // 🎯 Radial planda sektör açısı (radyan)
        this.innerRadius = innerRadius; // 🎯 Radial planda iç yarıçap
        this.outerRadius = outerRadius; // 🎯 Radial planda dış yarıçap
        this.sectorIndex = sectorIndex; // 🎯 Radial planda sektör indexi (rotation için)
        this.zLevels = zLevels || { z2: 5, z3: 30, z4: 35, z5: 65, z6: 85 }; // 🎯 Z seviyeleri (H oranları, FİTİL ile AYNI)
        this.placement = placement; // 🎯 Hücre yerleşim tipi ('corner' veya 'edge')
        this.c6Override = c6Override; // 🔷 c6 noktası için opsiyonel override (layer boundary alignment)
        this.name = 'KAZAYAK';

        // 🎯 4 ANA KONTROL NOKTASI (Master Points) - M ile ölçekli
        // GRID PLAN değerleri (M ile ölçeklendirilmiş)
        let a1_y = 0.0;              // ARKA (Y=0)
        let b1_x = M * 0.5;          // SAĞ X (M'nin yarısı)
        let b1_y = -M * 0.24;        // SAĞ Y (M'nin %24'ü)
        let c1_y = -M;               // ÖN (Y=-M) - Derinlik
        let d1_x = -M * 0.5;         // SOL X (M'nin yarısı)
        let d1_y = -M * 0.24;        // SOL Y (M'nin %24'ü)

        // ⚠️ NOT: Radial parametreler artık kullanılmıyor (Fitil gibi)
        // Rotasyon ve pozisyonlama combineGeometries'de yapılıyor

        // 🎯 PLACEMENT'A GÖRE b1-d1 KOORDİNATLARI DEĞİŞİR
        if (this.placement === 'corner') {
            // KÖŞE: a1 ve c1 aynı kalır, b1 ve d1'in X koordinatları değişir
            // ÖNEMLİ: a1-d1 ve a1-b1 çizgileri a1 noktasında kesişmemeli!
            this.masterPoints = {
                'K-a1': { x: 0.0,   y: a1_y,  z: 0.0 },     // ARKA (iç kenar) - AYNI
                'K-b1': { x: -b1_x, y: b1_y,  z: 0.0 },     // SOL ← SAĞ (mirror X)
                'K-c1': { x: 0.0,   y: c1_y,  z: 0.0 },     // ÖN (dış kenar) - AYNI
                'K-d1': { x: -d1_x, y: d1_y,  z: 0.0 }      // SOL ← SAĞ (mirror X) - DÜZELTME!
            };
        } else {
            // KENAR: Normal (a1 iç, c1 dış)
            this.masterPoints = {
                'K-a1': { x: 0.0,   y: a1_y,  z: 0.0 },     // ARKA (iç kenar)
                'K-b1': { x: b1_x,  y: b1_y,  z: 0.0 },     // SAĞ
                'K-c1': { x: 0.0,   y: c1_y,  z: 0.0 },     // ÖN (dış kenar)
                'K-d1': { x: d1_x,  y: d1_y,  z: 0.0 }      // SOL
            };
        }

        this.points = this.generatePoints();
        this.faces = this.generateFaces();
    }
    
    /**
     * 🎚️ Slave ratio'yu güncelle (master'dan c1'e kayma oranı - Seviye 2-3)
     */
    updateSlaveRatio(newRatio) {
        this.slaveRatio = newRatio;
        this.points = this.generatePoints();
    }
    
    /**
     * 🎚️ Slave ratio 2'yi güncelle (master'dan c1'e kayma oranı - Seviye 4-5)
     */
    updateSlaveRatio2(newRatio) {
        this.slaveRatio2 = newRatio;
        this.points = this.generatePoints();
    }
    
    /**
     * 4 ana kontrol noktasını güncelle
     */
    updateMasterPoint(pointName, x, y) {
        if (this.masterPoints[pointName]) {
            this.masterPoints[pointName].x = x;
            this.masterPoints[pointName].y = y;
            // Z koordinatı hep 0 (taban seviye)
            this.masterPoints[pointName].z = 0.0;

            // Bütün noktaları yeniden hesapla
            this.points = this.generatePoints();
        }
    }

    /**
     * c6 noktası için opsiyonel local override uygula
     * c6, c1 ile aynı x,y'de olduğundan c1'i de günceller
     * @param {number} x - Local X koordinatı
     * @param {number} y - Local Y koordinatı
     */
    setC6Override(x, y) {
        this.c6Override = { x, y };
        // c6, c1 ile aynı x,y'de, bu yüzden c1'i de güncelle
        this.masterPoints['K-c1'].x = x;
        this.masterPoints['K-c1'].y = y;
        this.points = this.generatePoints();
        console.log(`✅ Kazayak c6 (ve c1) override: (${x.toFixed(2)}, ${y.toFixed(2)})`);
    }

    /**
     * c6 override'ı temizle
     */
    clearC6Override() {
        if (this.c6Override) {
            this.c6Override = null;
            this.points = this.generatePoints();
            console.log('✅ Kazayak c6 override temizlendi');
        }
    }

    /**
     * b1 ve d1 noktalarını komşu hücrelerin c6 noktalarına göre ayarla
     * @param {object} leftC6Local - Sol komşunun c6 noktası (lokal koordinat)
     * @param {object} rightC6Local - Sağ komşunun c6 noktası (lokal koordinat)
     */
    setB1D1FromNeighbors(leftC6Local, rightC6Local) {
        // Sol komşunun c6'sı → Kazayağının d1'i (sol)
        // Sağ komşunun c6'sı → Kazayağının b1'i (sağ)
        this.masterPoints['K-d1'].x = leftC6Local.x;
        this.masterPoints['K-d1'].y = leftC6Local.y;
        this.masterPoints['K-b1'].x = rightC6Local.x;
        this.masterPoints['K-b1'].y = rightC6Local.y;

        this.points = this.generatePoints();
        console.log(`✅ Kazayak b1/d1 komşulardan güncellendi: d1=(${leftC6Local.x.toFixed(2)}, ${leftC6Local.y.toFixed(2)}), b1=(${rightC6Local.x.toFixed(2)}, ${rightC6Local.y.toFixed(2)})`);
    }

    /**
     * Generate all 3D points based on PNG analysis
     * 🎯 PARAMETRIK SISTEM: 4 ana kontrol noktası + bağımlı noktalar
     * Ana noktalar: K-a1, K-b1, K-c1, K-d1 (taban seviye, user editable)
     * Bağımlı noktalar: Otomatik hesaplanır
     */
    generatePoints() {
        const M = this.M;
        const H = this.H;

        // Generating points
        
        // 4 ANA KONTROL NOKTASI (Master) - Kullanıcı tarafından düzenlenebilir
        const a1 = this.masterPoints['K-a1'];
        const b1 = this.masterPoints['K-b1'];
        const c1 = this.masterPoints['K-c1'];
        const d1 = this.masterPoints['K-d1'];
        
        // 🧮 BAĞIMLI NOKTALARI HESAPLA (Slave Points)
        // Formül: Ana noktalardan belli mesafelerde c1 yönünde
        
        // c1 yönü (a1'den c1'e)
        const c1_direction = {
            x: c1.x - a1.x,
            y: c1.y - a1.y
        };
        const c1_length = Math.sqrt(c1_direction.x ** 2 + c1_direction.y ** 2);
        const c1_normalized = {
            x: c1_direction.x / c1_length,
            y: c1_direction.y / c1_length
        };
        
        // Seviye 2 noktaları - Kullanıcı tarafından ayarlanabilir oran (0-1)
        const ratioNormalized = this.slaveRatio;  // 🎚️ Normalize oran (varsayılan 0.09)
        const ratio = ratioNormalized * c1_length; // 🎯 Fiziksel mesafe (depth × ratio)
        
        // 🔵 CYAN NOKTA HESAPLAMA: Mor çizginin a1-d1 ile kesişimi
        // 1. d1-c1'e dik yön hesapla
        const d1c1_vector = {
            x: c1.x - d1.x,
            y: c1.y - d1.y
        };
        
        const perpendicular = {
            x: d1c1_vector.y,
            y: -d1c1_vector.x
        };
        
        const perpLength = Math.sqrt(perpendicular.x ** 2 + perpendicular.y ** 2);
        const perpNorm = {
            x: perpendicular.x / perpLength,
            y: perpendicular.y / perpLength
        };
        
        // 2. a1'den dik yönde ratio kadar git
        const a1_offset = {
            x: a1.x + perpNorm.x * ratio,
            y: a1.y + perpNorm.y * ratio
        };
        
        // 3. d1-c1 yönü (normalize)
        const d1c1_length = Math.sqrt(d1c1_vector.x ** 2 + d1c1_vector.y ** 2);
        const d1c1_norm = {
            x: d1c1_vector.x / d1c1_length,
            y: d1c1_vector.y / d1c1_length
        };
        
        // 4. Mor çizginin a1-d1 ile kesişimi = CYAN NOKTA
        const cyanPoint = this.lineIntersection(
            a1_offset,
            {x: a1_offset.x + d1c1_norm.x * 1000, y: a1_offset.y + d1c1_norm.y * 1000},
            {x: a1.x, y: a1.y},
            {x: d1.x, y: d1.y}
        );
        
        // 🔴 KIRMIZI NOKTA HESAPLAMA: Mor çizginin a1-b1 ile kesişimi (KARŞI TARAF)
        // b1-c1'e dik yön hesapla
        const b1c1_vector = {
            x: c1.x - b1.x,
            y: c1.y - b1.y
        };
        
        const perpendicular2 = {
            x: -b1c1_vector.y,
            y: b1c1_vector.x
        };
        
        const perpLength2 = Math.sqrt(perpendicular2.x ** 2 + perpendicular2.y ** 2);
        const perpNorm2 = {
            x: perpendicular2.x / perpLength2,
            y: perpendicular2.y / perpLength2
        };
        
        const a1_offset2 = {
            x: a1.x + perpNorm2.x * ratio,
            y: a1.y + perpNorm2.y * ratio
        };
        
        const b1c1_length = Math.sqrt(b1c1_vector.x ** 2 + b1c1_vector.y ** 2);
        const b1c1_norm = {
            x: b1c1_vector.x / b1c1_length,
            y: b1c1_vector.y / b1c1_length
        };
        
        const redPoint = this.lineIntersection(
            a1_offset2,
            {x: a1_offset2.x + b1c1_norm.x * 1000, y: a1_offset2.y + b1c1_norm.y * 1000},
            {x: a1.x, y: a1.y},
            {x: b1.x, y: b1.y}
        );
        
        // 🟡 İKİ MOR ÇİZGİNİN KESİŞİMİ (a2, a3 için)
        // Sol mor: a1_offset + d1c1_norm yönünde
        // Sağ mor: a1_offset2 + b1c1_norm yönünde
        const purplePurpleIntersection = this.lineIntersection(
            a1_offset,
            {x: a1_offset.x + d1c1_norm.x * 1000, y: a1_offset.y + d1c1_norm.y * 1000},
            a1_offset2,
            {x: a1_offset2.x + b1c1_norm.x * 1000, y: a1_offset2.y + b1c1_norm.y * 1000}
        );
        
        // 🎯 Z Level oranlarını al (FİTİL ile AYNI format - kullanıcı tarafından ayarlanabilir)
        const z2_ratio = this.zLevels.z2 / 91.0;
        const z3_ratio = this.zLevels.z3 / 91.0;
        const z4_ratio = this.zLevels.z4 / 91.0;
        const z5_ratio = this.zLevels.z5 / 91.0;
        const z6_ratio = this.zLevels.z6 / 91.0;
        
        // 🟡 a2 ve a3 noktaları - İKİ MOR ÇİZGİNİN KESİŞİMİNE BAĞLI
        const a2 = purplePurpleIntersection ? {
            x: purplePurpleIntersection.x,
            y: purplePurpleIntersection.y,
            z: z2_ratio * H
        } : {
            x: a1.x + c1_normalized.x * ratio,
            y: a1.y + c1_normalized.y * ratio,
            z: z2_ratio * H
        };
        
        // 🟢 YEŞİL ÇİZGİ 1 (SAĞ): b1'den başlayıp a2 yönünde a1-d1 hattına kadar
        const b1a2_vector = {
            x: a2.x - b1.x,
            y: a2.y - b1.y
        };
        
        const ext_b1_a1d1 = this.lineIntersection(
            {x: b1.x, y: b1.y},
            {x: b1.x + b1a2_vector.x * 100, y: b1.y + b1a2_vector.y * 100},
            {x: a1.x, y: a1.y},
            {x: d1.x, y: d1.y}
        );
        
        // 🟢 YEŞİL ÇİZGİ 2 (SOL): d1'den başlayıp a2 yönünde a1-b1 hattına kadar
        const d1a2_vector = {
            x: a2.x - d1.x,
            y: a2.y - d1.y
        };
        
        const ext_d1_a1b1 = this.lineIntersection(
            {x: d1.x, y: d1.y},
            {x: d1.x + d1a2_vector.x * 100, y: d1.y + d1a2_vector.y * 100},
            {x: a1.x, y: a1.y},
            {x: b1.x, y: b1.y}
        );
        
        // 🔴 b2 ve b3 noktaları - KIRMIZI noktanın x,y'sine BAĞLI
        const b2 = redPoint ? {
            x: redPoint.x,
            y: redPoint.y,
            z: z2_ratio * H
        } : {
            x: b1.x + (c1.x - b1.x) * ratio,
            y: b1.y + (c1.y - b1.y) * ratio,
            z: z2_ratio * H
        };
        
        // 🔵 d2 ve d3 noktaları - CYAN noktanın x,y'sine BAĞLI
        const d2 = cyanPoint ? {
            x: cyanPoint.x,
            y: cyanPoint.y,
            z: z2_ratio * H
        } : {
            x: d1.x + (c1.x - d1.x) * ratio,
            y: d1.y + (c1.y - d1.y) * ratio,
            z: z2_ratio * H
        };
        
        // Seviye 3 noktaları - a3, b3, d3 (z=30) - KAZAYAK: a3 VAR!
        const a3 = purplePurpleIntersection ? {
            x: purplePurpleIntersection.x,  // 🟡 İki mor çizgi kesişimi
            y: purplePurpleIntersection.y,
            z: z3_ratio * H  // b3 ile aynı Z seviyesinde
        } : {
            x: a2.x,
            y: a2.y,
            z: z3_ratio * H
        };
        
        const b3 = redPoint ? {
            x: redPoint.x,
            y: redPoint.y,
            z: z3_ratio * H  // 30/91 oranında yükseklik
        } : {
            x: b1.x + (c1.x - b1.x) * ratio,
            y: b1.y + (c1.y - b1.y) * ratio,
            z: z3_ratio * H
        };
        
        const d3 = cyanPoint ? {
            x: cyanPoint.x,
            y: cyanPoint.y,
            z: z3_ratio * H
        } : {
            x: d1.x + (c1.x - d1.x) * ratio,
            y: d1.y + (c1.y - d1.y) * ratio,
            z: z3_ratio * H
        };
        
        // Seviye 4 ve 5 - MAVİ ÇİZGİLER MOR ÇİZGİLERİN OFFSET'İ
        const ratio2Normalized = this.slaveRatio2;  // 🎚️ Normalize oran (varsayılan 0.186)
        const ratio2 = ratio2Normalized * c1_length; // 🎯 Fiziksel mesafe (depth × ratio)
        
        // 🔵 SOL MAVİ ÇİZGİ: Sol mor çizginin ratio2 offset'i → a1-d1'e extend
        const a1_blue_offset_left = {
            x: a1.x + perpNorm.x * (ratio + ratio2),
            y: a1.y + perpNorm.y * (ratio + ratio2)
        };
        
        const blueIntersection_left = this.lineIntersection(
            a1_blue_offset_left,
            {x: a1_blue_offset_left.x + d1c1_norm.x * 1000, y: a1_blue_offset_left.y + d1c1_norm.y * 1000},
            {x: a1.x, y: a1.y},
            {x: d1.x, y: d1.y}
        );
        
        // 🔵 SAĞ MAVİ ÇİZGİ: Sağ mor çizginin ratio2 offset'i → a1-b1'e extend
        const a1_blue_offset_right = {
            x: a1.x + perpNorm2.x * (ratio + ratio2),
            y: a1.y + perpNorm2.y * (ratio + ratio2)
        };
        
        const blueIntersection_right = this.lineIntersection(
            a1_blue_offset_right,
            {x: a1_blue_offset_right.x + b1c1_norm.x * 1000, y: a1_blue_offset_right.y + b1c1_norm.y * 1000},
            {x: a1.x, y: a1.y},
            {x: b1.x, y: b1.y}
        );
        
        // 🔵 d4, d5: SOL mavi çizginin a1-d1 ile kesişiminden x,y alıyor
        const d4 = blueIntersection_left ? {
            x: blueIntersection_left.x,
            y: blueIntersection_left.y,
            z: z4_ratio * H
        } : {
            x: d1.x,
            y: d1.y,
            z: z4_ratio * H
        };
        
        const d5 = blueIntersection_left ? {
            x: blueIntersection_left.x,
            y: blueIntersection_left.y,
            z: z5_ratio * H
        } : {
            x: d1.x,
            y: d1.y,
            z: z5_ratio * H
        };
        
        // 🔵 b4, b5: SAĞ mavi çizginin a1-b1 ile kesişiminden x,y alıyor
        const b4 = blueIntersection_right ? {
            x: blueIntersection_right.x,
            y: blueIntersection_right.y,
            z: z4_ratio * H
        } : {
            x: b1.x,
            y: b1.y,
            z: z4_ratio * H
        };
        
        const b5 = blueIntersection_right ? {
            x: blueIntersection_right.x,
            y: blueIntersection_right.y,
            z: z5_ratio * H
        } : {
            x: b1.x,
            y: b1.y,
            z: z5_ratio * H
        };
        
        // 🎯 ÖNEMLİ: MAVİ ÇİZGİLERİN a1-c1 HATTI İLE KESİŞİMİ (a4, a5 için doğru x,y)
        // Sol mavi çizginin a1-c1 ile kesişimi
        const blueLeftA1C1Intersection = this.lineIntersection(
            a1_blue_offset_left,
            {x: a1_blue_offset_left.x + d1c1_norm.x * 1000, y: a1_blue_offset_left.y + d1c1_norm.y * 1000},
            {x: a1.x, y: a1.y},
            {x: c1.x, y: c1.y}
        );
        
        // Sağ mavi çizginin a1-c1 ile kesişimi
        const blueRightA1C1Intersection = this.lineIntersection(
            a1_blue_offset_right,
            {x: a1_blue_offset_right.x + b1c1_norm.x * 1000, y: a1_blue_offset_right.y + b1c1_norm.y * 1000},
            {x: a1.x, y: a1.y},
            {x: c1.x, y: c1.y}
        );
        
        // İki mavi çizginin kendi aralarındaki kesişim (KULLANILMIYOR - sadece debug için)
        const blueBlueIntersection = this.lineIntersection(
            a1_blue_offset_left,
            {x: a1_blue_offset_left.x + d1c1_norm.x * 1000, y: a1_blue_offset_left.y + d1c1_norm.y * 1000},
            a1_blue_offset_right,
            {x: a1_blue_offset_right.x + b1c1_norm.x * 1000, y: a1_blue_offset_right.y + b1c1_norm.y * 1000}
        );
        
        // KAZAYAK: w5 ve z5 noktaları KALDIRILDI

        // Seviye 6 - c1'den yukarı
        const c6 = {
            x: c1.x,
            y: c1.y,
            z: z6_ratio * H  // 85/91 oranında yükseklik
        };

        // 🔷 c6Override varsa uygula (layer boundary alignment)
        if (this.c6Override) {
            c6.x = this.c6Override.x;
            c6.y = this.c6Override.y;
            console.log(`🔷 KAZAYAK c6 override uygulandı: (${c6.x.toFixed(2)}, ${c6.y.toFixed(2)})`);
        }

        // 🎯 K-d6 NOKTASI: d1'in x,y koordinatlarında, c6'nın z'sinde
        const d6 = {
            x: d1.x,
            y: d1.y,
            z: c6.z  // c6 ile aynı Z (85/91 * H)
        };

        // 🎯 K-b6 NOKTASI: b1'in x,y koordinatlarında, c6'nın z'sinde
        const b6 = {
            x: b1.x,
            y: b1.y,
            z: c6.z  // c6 ile aynı Z (85/91 * H)
        };

        // 🎯 K-a4 NOKTASI: Mavi çizgilerin a1-c1 ile kesişiminden ortalama x,y
        const a4_raw = (blueLeftA1C1Intersection && blueRightA1C1Intersection) ? {
            x: (blueLeftA1C1Intersection.x + blueRightA1C1Intersection.x) / 2,
            y: (blueLeftA1C1Intersection.y + blueRightA1C1Intersection.y) / 2
        } : blueLeftA1C1Intersection || blueRightA1C1Intersection || {
            x: 0,
            y: 0
        };
        
        // 🎯 a4'ü a1-c1 üzerine projekte et (tam merkez hattında olsun)
        const a4_projected = this.projectPointOnLineSegment(a4_raw, a1, c1);
        const a4 = {
            x: a4_projected.x,
            y: a4_projected.y,
            z: z4_ratio * H  // Seviye 4
        };

        // 🎯 K-a5 NOKTASI: Aynı x,y koordinatları (a4 ile aynı)
        const a5 = {
            x: a4.x,
            y: a4.y,
            z: z5_ratio * H  // Seviye 5
        };

        // x4, y4, x5, y5 kaldırıldı - artık sadece a4 ve a5 var (aynı x,y koordinatları)

        // Nokta objelerini oluştur
        const points = {
            // 🎯 4 ANA KONTROL NOKTASI (Master Points)
            'K-a1': { ...a1, level: 1, type: 'master', display: 'K-a1', editable: true },
            'K-b1': { ...b1, level: 1, type: 'master', display: 'K-b1', editable: true },
            'K-c1': { ...c1, level: 1, type: 'master', display: 'K-c1', editable: true },
            'K-d1': { ...d1, level: 1, type: 'master', display: 'K-d1', editable: true },
            
            // 🔗 BAĞIMLI NOKTALAR (Slave Points) - Seviye 2
            'K-a2': { ...a2, level: 2, type: 'slave', display: 'K-a2', editable: false },
            'K-b2': { ...b2, level: 2, type: 'slave', display: 'K-b2', editable: false },
            'K-d2': { ...d2, level: 2, type: 'slave', display: 'K-d2', editable: false },
            
            // 🔗 BAĞIMLI NOKTALAR (Slave Points) - Seviye 3 (KAZAYAK: a3 dahil!)
            'K-a3': { ...a3, level: 3, type: 'slave', display: 'K-a3', editable: false },
            'K-b3': { ...b3, level: 3, type: 'slave', display: 'K-b3', editable: false },
            'K-d3': { ...d3, level: 3, type: 'slave', display: 'K-d3', editable: false },
            
            // 🔗 BAĞIMLI NOKTALAR (Slave Points) - Seviye 4 (a4, b4, d4)
            'K-a4': { ...a4, level: 4, type: 'slave', display: 'K-a4', editable: false },  // 🔴 Mavi-Mavi Kesişim
            'K-b4': { ...b4, level: 4, type: 'slave', display: 'K-b4', editable: false },
            'K-d4': { ...d4, level: 4, type: 'slave', display: 'K-d4', editable: false },

            // 🔗 BAĞIMLI NOKTALAR (Slave Points) - Seviye 5 (a5, b5, d5)
            'K-a5': { ...a5, level: 5, type: 'slave', display: 'K-a5', editable: false },  // 🔴 Mavi-Mavi Kesişim
            'K-b5': { ...b5, level: 5, type: 'slave', display: 'K-b5', editable: false },
            'K-d5': { ...d5, level: 5, type: 'slave', display: 'K-d5', editable: false },
            
            // KAZAYAK: w5, z5, x4, y4, x5, y5 noktaları KALDIRILDI (a4 ve a5 ile birleştirildi)
            
            // 🔗 BAĞIMLI NOKTALAR (Slave Points) - Seviye 6
            'K-c6': { ...c6, level: 6, type: 'slave', display: 'K-c6', editable: false },
            'K-d6': { ...d6, level: 6, type: 'slave', display: 'K-d6', editable: false },
            'K-b6': { ...b6, level: 6, type: 'slave', display: 'K-b6', editable: false }
        };
        
        // Z ALIGNMENT: Keep top ridge (c6) at Z=0, grow downward as H increases (BADEM & FİTİL İLE AYNI)
        const topZ = c6.z;
        Object.keys(points).forEach((key) => {
            const zVal = (points[key].z !== undefined) ? points[key].z : 0.0;
            points[key].z = zVal - topZ; // shift all points so c6 becomes 0 and others negative
        });
        
        return points;
    }

    /**
     * Generate faces (quad surfaces) connecting the points
     * Based on the surface structure visible in PNG
     * Quad format: [point1, point2, point3, point4] - clockwise or counter-clockwise order
     */
    generateFaces() {
        // Define quad faces for 3D kazayak geometry
        const faces = [];

        // 🎯 FACE 1: K-a1, K-a2, K-d2 (üçgen) - Sol taban
        faces.push(['K-a1', 'K-a2', 'K-d2']);

        // 🎯 FACE 2: K-a1, K-b2, K-a2 (üçgen) - Sağ taban - WINDING FIXED!
        faces.push(['K-a1', 'K-b2', 'K-a2']);

        // 🎯 FACE 3: K-a2, K-b2, K-b3, K-a3 (quad) - Sağ panel 2-3
        faces.push(['K-a2', 'K-b2', 'K-b3', 'K-a3']);

        // 🎯 FACE 4: K-a2, K-a3, K-d3, K-d2 (quad) - Sol panel 2-3 - WINDING FIXED!
        faces.push(['K-a2', 'K-a3', 'K-d3', 'K-d2']);

        // 🎯 FACE 5: K-a3, K-b3, K-b4, K-a4 (quad) - Sağ panel 3-4 - WINDING REVERSED!
        faces.push(['K-a3', 'K-b3', 'K-b4', 'K-a4']);

        // 🎯 FACE 6: K-a3, K-a4, K-d4, K-d3 (quad) - Sol panel 3-4
        faces.push(['K-a3', 'K-a4', 'K-d4', 'K-d3']);

        // 🎯 FACE 7: K-a4, K-d4, K-d5, K-a5 (quad) - Sol panel 4-5 - WINDING REVERSED!
        faces.push(['K-a4', 'K-d4', 'K-d5', 'K-a5']);

        // 🎯 FACE 8: K-a4, K-a5, K-b5, K-b4 (quad) - Sağ panel 4-5
        faces.push(['K-a4', 'K-a5', 'K-b5', 'K-b4']);

        // 🎯 FACE 9: K-a5, K-d5, K-d6, K-c6 (quad) - Sol tepe - WINDING REVERSED!
        faces.push(['K-a5', 'K-d5', 'K-d6', 'K-c6']);

        // 🎯 FACE 10: K-a5, K-c6, K-b6, K-b5 (quad) - Sağ tepe
        faces.push(['K-a5', 'K-c6', 'K-b6', 'K-b5']);

        // Debug logları temizlendi

        return faces;
    }

    /**
     * Create Three.js BufferGeometry
     * Supports both triangular and quad faces
     */
    createThreeGeometry() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        
        // Create vertex array
        const pointKeys = Object.keys(this.points);
        const pointIndexMap = {};
        
        pointKeys.forEach((key, idx) => {
            const pt = this.points[key];
            vertices.push(pt.x, pt.y, pt.z);
            pointIndexMap[key] = idx;
        });

        // Create index array from faces (supporting quads)
        this.faces.forEach(face => {
            if (face.length === 4) {
                // 🔷 QUAD FACE: Split into two triangles
                const [p1, p2, p3, p4] = face;
                if (pointIndexMap[p1] !== undefined && 
                    pointIndexMap[p2] !== undefined && 
                    pointIndexMap[p3] !== undefined &&
                    pointIndexMap[p4] !== undefined) {
                    
                    // Triangle 1: p1, p2, p3
                    indices.push(
                        pointIndexMap[p1],
                        pointIndexMap[p2],
                        pointIndexMap[p3]
                    );
                    
                    // Triangle 2: p1, p3, p4
                    indices.push(
                        pointIndexMap[p1],
                        pointIndexMap[p3],
                        pointIndexMap[p4]
                    );
                }
            } else if (face.length === 3) {
                // 🔺 TRIANGULAR FACE: Direct triangle
            const [p1, p2, p3] = face;
            if (pointIndexMap[p1] !== undefined && 
                pointIndexMap[p2] !== undefined && 
                pointIndexMap[p3] !== undefined) {
                indices.push(
                    pointIndexMap[p1],
                    pointIndexMap[p2],
                    pointIndexMap[p3]
                );
                }
            }
        });

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        return geometry;
    }

    /**
     * Get all point coordinates for visualization
     */
    getPointsArray() {
        const pointsArray = Object.entries(this.points).map(([name, coords]) => ({
            name,
            ...coords
        }));
        
        return pointsArray;
    }

    /**
     * Update geometry with new M, H, and optional ratio values
     */
    updateDimensions(M, H, slaveRatio = null, slaveRatio2 = null, zLevels = null) {
        this.M = M;
        this.H = H;
        if (slaveRatio !== null) {
            this.slaveRatio = slaveRatio;
        }
        if (slaveRatio2 !== null) {
            this.slaveRatio2 = slaveRatio2;
        }
        if (zLevels !== null) {
            this.zLevels = zLevels;
        }
        // KAZAYAK: ratioZ5 KALDIRILDI
        this.points = this.generatePoints();
        return this.createThreeGeometry();
    }

    /**
     * Get geometry statistics
     */
    getStats() {
        return {
            name: this.name,
            module: this.M,
            height: this.H,
            slaveRatio: this.slaveRatio,
            totalPoints: Object.keys(this.points).length,
            totalFaces: this.faces.length,
            levels: 7,
            longAxis: this.M * 1.414, // M * sqrt(2)
            shortAxis: this.M * 0.707  // M / sqrt(2)
        };
    }

    /**
     * İki çizginin kesişim noktasını hesapla
     * Line 1: p1 -> p2
     * Line 2: p3 -> p4
     */
    lineIntersection(p1, p2, p3, p4) {
        const x1 = p1.x, y1 = p1.y;
        const x2 = p2.x, y2 = p2.y;
        const x3 = p3.x, y3 = p3.y;
        const x4 = p4.x, y4 = p4.y;
        
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        
        if (Math.abs(denom) < 0.0001) {
            return null; // Paralel çizgiler
        }
        
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        
        return {
            x: x1 + t * (x2 - x1),
            y: y1 + t * (y2 - y1)
        };
    }
    
    /**
     * 🔒 Slave noktaları a1-b1-c1-d1 sınırları içinde tut
     * @param {object} point - Kontrol edilecek nokta {x, y}
     * @param {object} a1, b1, c1, d1 - Master noktalar
     * @returns {object} - Sınırlandırılmış nokta {x, y}
     */
    constrainPointToBoundary(point, a1, b1, c1, d1) {
        if (!point) return point;

        // 🎯 RADIAL PLAN BYPASS: Radial planda sınır kontrolü YOK
        if (this.sectorAngle !== null && this.innerRadius !== null && this.outerRadius !== null) {
            return point;  // Radial planda bypass
        }

        // Dörtgenin kenarları: a1-b1, b1-c1, c1-d1, d1-a1
        const edges = [
            {p1: a1, p2: b1, name: 'a1-b1'},
            {p1: b1, p2: c1, name: 'b1-c1'},
            {p1: c1, p2: d1, name: 'c1-d1'},
            {p1: d1, p2: a1, name: 'd1-a1'}
        ];

        // Noktanın dörtgen içinde olup olmadığını kontrol et
        let isInside = true;
        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            const cross = (edge.p2.x - edge.p1.x) * (point.y - edge.p1.y) - 
                         (edge.p2.y - edge.p1.y) * (point.x - edge.p1.x);
            
            if (i === 0) {
                var firstSign = Math.sign(cross);
            } else {
                if (Math.sign(cross) !== firstSign && Math.abs(cross) > 0.0001) {
                    isInside = false;
                    break;
                }
            }
        }

        // Nokta içerideyse olduğu gibi döndür
        if (isInside) {
            return point;
        }

        // Nokta dışarıdaysa, en yakın sınır noktasını bul
        let closestPoint = point;
        let minDistance = Infinity;

        for (let edge of edges) {
            const projected = this.projectPointOnLineSegment(point, edge.p1, edge.p2);
            const dist = Math.sqrt(
                Math.pow(projected.x - point.x, 2) + 
                Math.pow(projected.y - point.y, 2)
            );
            
            if (dist < minDistance) {
                minDistance = dist;
                closestPoint = projected;
            }
        }

        return closestPoint;
    }
    
    /**
     * 🎯 Bir noktayı çizgi parçası üzerine projeksiyon et
     */
    projectPointOnLineSegment(point, lineStart, lineEnd) {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        
        if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) {
            return {x: lineStart.x, y: lineStart.y};
        }
        
        const t = Math.max(0, Math.min(1, 
            ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy)
        ));
        
        return {
            x: lineStart.x + t * dx,
            y: lineStart.y + t * dy
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KazayakGeometry;
} else {
    window.KazayakGeometry = KazayakGeometry;
}
