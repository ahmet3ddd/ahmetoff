/**
 * Fitil 3D Geometry
 * Fitil hücresi için geometri sınıfı
 * 
 * Coordinate System:
 * - Plan (p) view: X, Y coordinates
 * - Front (f) view: X, Z coordinates
 * - Combined: Full 3D (X, Y, Z)
 */

class FitilGeometry {
    constructor(M = 1, H = 1, slaveRatio = 0.09, slaveRatio2 = 0.096, sectorAngle = null, innerRadius = null, outerRadius = null, sectorIndex = 0, zLevels = null, c6Override = null) {
        this.M = M; // Module size
        this.H = H; // Total height
        this.slaveRatio = slaveRatio;   // 🎯 Seviye 2-3: a1'den c1 yönünde oran (varsayılan 0.09, depth × ratio)
        this.slaveRatio2 = slaveRatio2; // 🎯 c1 yönünde offset oranı (varsayılan 0.096, depth × ratio)
        // FİTİL: ratioZ5 KALDIRILDI (w5 ve z5 yok)
        this.sectorAngle = sectorAngle; // 🎯 Radial planda sektör açısı (radyan)
        this.innerRadius = innerRadius; // 🎯 Radial planda iç yarıçap
        this.outerRadius = outerRadius; // 🎯 Radial planda dış yarıçap
        this.sectorIndex = sectorIndex; // 🎯 Radial planda sektör indexi (rotation için)
        this.zLevels = zLevels || { z2: 5, z3: 30, z4: 35, z5: 65, z6: 85 }; // 🎯 Z seviyeleri (H oranları)
        this.c6Override = c6Override; // 🔷 c6 noktası için opsiyonel override (layer boundary alignment)
        this.name = 'FİTİL';

        // 🎯 4 ANA KONTROL NOKTASI (Master Points) - M ile ölçekli
        // M parametresi = Hücre derinliği (outerRadius - innerRadius)
        
        // GRID PLAN değerleri (M ile ölçeklendirilmiş)
        let a1_y = 0.0;              // ARKA (Y=0)
        let b1_x = M * 0.5;          // SAĞ X (M'nin yarısı)
        let b1_y = -M * 0.24;        // SAĞ Y (M'nin %24'ü)
        let c1_y = -M;               // ÖN (Y=-M) - Derinlik
        let d1_x = -M * 0.5;         // SOL X (M'nin yarısı)
        let d1_y = -M * 0.24;        // SOL Y (M'nin %24'ü)

        console.log(`🔍 FitilGeometry params: sectorAngle=${sectorAngle}, innerRadius=${innerRadius}, outerRadius=${outerRadius}`);

        if (sectorAngle !== null && innerRadius !== null && outerRadius !== null) {
            // RADIAL PLAN: Derinlik katman kalınlığına göre ayarlanır
            const depth = outerRadius - innerRadius;  // Real piksel

            // a1 İÇ KENARDA, c1 DIŞ KENARDA (M ile ölçekli)
            a1_y = 0;           // a1 (ARKA) = 0
            c1_y = -M;          // c1 (ÖN) = -M (derinlik)

            // ✨ POLAR KOORDINAT SİSTEMİ: b1/d1 arc sınırlarında
            // b1 (SAĞ) → Sektörün +sectorAngle/2 sınırında
            // d1 (SOL) → Sektörün -sectorAngle/2 sınırında

            // Fitil geometrisinde b1-d1 arasındaki mesafe:
            // Orijinal PNG'de b1.x = 0.64 (normalized, M=1 için)
            // Bu, innerRadius'tan itibaren hesaplanan bir arc mesafesi

            const halfAngle = sectorAngle / 2;

            // ✨ KRİTİK: Radial planda Y = radyal derinlik (innerRadius'tan dışa)
            // Orijinal PNG'de (grid plan):
            //   a1: x=0.0,  y=0.62  (ARKA - merkeze yakın)
            //   b1: x=0.64, y=0.12  (SAĞ - ortada)
            //   c1: x=0.0,  y=-0.62 (ÖN - merkeze uzak)
            //   d1: x=-0.64, y=0.12 (SOL - ortada)

            // Radial planda bunlar radyal mesafe olarak yorumlanıyor:
            // Y=0 → innerRadius (en yakın)
            // Y=-1.0 → outerRadius (en uzak)

            // a1: Y=0.62 → ama radial'de Y=0 olmalı (innerRadius'ta)
            // b1,d1: Y=0.12 → radial'de daha dışarıda olmalı
            // c1: Y=-0.62 → radial'de en dışta

            // PNG'deki 0.62 offset'i kaldırıp normalize edelim:
            const png_a1_y = 0.62;
            const png_b1_y = 0.12;
            const png_c1_y = -0.62;

            // Radial depth oranları (a1=0, c1=-1.0 olacak şekilde normalize)
            const total_depth = png_a1_y - png_c1_y;  // 0.62 - (-0.62) = 1.24

            // b1'in radyal derinliği
            const b1_depth_ratio = (png_a1_y - png_b1_y) / total_depth;  // (0.62-0.12)/1.24 = 0.403

            // b1, innerRadius'tan depth*0.403 mesafede
            const b1_radial_distance = innerRadius + (depth * b1_depth_ratio);

            // ✨ YENİ YAKLAŞIM: b1/d1 mesh local frame'de tangent mesafe
            // Mesh innerRadius'ta, rotation SONRA uygulanacak
            // b1 sektör sınırında, halfAngle kadar açıda olmalı
            // Local X = radyal mesafedeki tangent offset
            const b1_x_real = b1_radial_distance * Math.tan(halfAngle);
            const d1_x_real = -b1_x_real;  // Simetrik

            // Y koordinatı M ile ölçekli
            b1_y = -b1_depth_ratio * M;  // M ile ölçeklendir
            d1_y = b1_y;

            // X koordinatı M ile ölçekli (artık normalize etmiyoruz)
            const scaleX = M / depth; // M'ye ölçekle
            b1_x = b1_x_real * scaleX;
            d1_x = d1_x_real * scaleX;

            // Debug log (devre dışı)
            // console.log(`   → Sector ${this.sectorIndex}: b1_radial_dist=${b1_radial_distance.toFixed(1)}px, b1_x_real=${b1_x_real.toFixed(1)}px`);
        } else {
            console.log(`✅ Grid plan kullanılıyor (M=${M} ile ölçekli)`);
        }

        this.masterPoints = {
            'F-a1': { x: 0.0,   y: a1_y,  z: 0.0 },     // ARKA (iç kenar)
            'F-b1': { x: b1_x,  y: b1_y,  z: 0.0 },     // SAĞ
            'F-c1': { x: 0.0,   y: c1_y,  z: 0.0 },     // ÖN (dış kenar)
            'F-d1': { x: d1_x,  y: d1_y,  z: 0.0 }      // SOL
        };

        this.points = this.generatePoints();
        this.faces = this.generateFaces();
    }
    
    /**
     * 🎚️ Slave ratio'yu güncelle (master'dan c1'e kayma oranı - Seviye 2-3)
     */
    updateSlaveRatio(newRatio) {
        this.slaveRatio = newRatio;
        this.points = this.generatePoints();
        console.log(`🎚️ Slave ratio (Level 1) güncellendi: ${(newRatio * 100).toFixed(1)}%`);
    }
    
    /**
     * 🎚️ Slave ratio 2'yi güncelle (master'dan c1'e kayma oranı - Seviye 4-5)
     */
    updateSlaveRatio2(newRatio) {
        this.slaveRatio2 = newRatio;
        this.points = this.generatePoints();
        console.log(`🎚️ Slave ratio 2 (Level 2) güncellendi: ${(newRatio * 100).toFixed(1)}%`);
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

            console.log(`🎯 ${pointName} güncellendi:`, this.masterPoints[pointName]);
        }
    }

    /**
     * c6 noktası için opsiyonel local override uygula
     * @param {number} x - Local X koordinatı
     * @param {number} y - Local Y koordinatı
     */
    setC6Override(x, y) {
        this.c6Override = { x, y };
        // c6, c1 ile aynı x,y'de, bu yüzden c1'i de güncelle
        this.masterPoints['F-c1'].x = x;
        this.masterPoints['F-c1'].y = y;
        this.points = this.generatePoints();
        console.log(`✅ Fitil c6 (ve c1) override: (${x.toFixed(2)}, ${y.toFixed(2)})`);
    }

    /**
     * c6 override'ı temizle
     */
    clearC6Override() {
        if (this.c6Override) {
            this.c6Override = null;
            this.points = this.generatePoints();
            console.log('✅ Fitil c6 override temizlendi');
        }
    }

    /**
     * b1 ve d1 noktalarını komşu hücrelerin c6 noktalarına göre ayarla (multi-layer alignment için)
     * @param {object} leftC6Local - Sol komşunun c6 noktası (lokal koordinat)
     * @param {object} rightC6Local - Sağ komşunun c6 noktası (lokal koordinat)
     */
    setB1D1FromNeighbors(leftC6Local, rightC6Local) {
        // Sol komşunun c6'sı → Fitil'in d1'i (sol)
        // Sağ komşunun c6'sı → Fitil'in b1'i (sağ)
        this.masterPoints['F-d1'].x = leftC6Local.x;
        this.masterPoints['F-d1'].y = leftC6Local.y;
        this.masterPoints['F-b1'].x = rightC6Local.x;
        this.masterPoints['F-b1'].y = rightC6Local.y;

        this.points = this.generatePoints();
        console.log(`✅ Fitil b1/d1 komşulardan güncellendi: d1=(${leftC6Local.x.toFixed(2)}, ${leftC6Local.y.toFixed(2)}), b1=(${rightC6Local.x.toFixed(2)}, ${rightC6Local.y.toFixed(2)})`);
    }

    /**
     * Generate all 3D points based on PNG analysis
     * 🎯 PARAMETRIK SISTEM: 4 ana kontrol noktası + bağımlı noktalar
     * Ana noktalar: B-a1, B-b1, B-c1, B-d1 (taban seviye, user editable)
     * Bağımlı noktalar: Otomatik hesaplanır
     */
    generatePoints() {
        const M = this.M;
        const H = this.H;

        // Generating points
        
        // 4 ANA KONTROL NOKTASI (Master) - Kullanıcı tarafından düzenlenebilir
        const a1 = this.masterPoints['F-a1'];
        const b1 = this.masterPoints['F-b1'];
        const c1 = this.masterPoints['F-c1'];
        const d1 = this.masterPoints['F-d1'];
        
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
        
        // 🎯 Z Level oranlarını al (kullanıcı tarafından ayarlanabilir)
        const z2_ratio = this.zLevels.z2 / 91.0;
        const z3_ratio = this.zLevels.z3 / 91.0;
        const z4_ratio = this.zLevels.z4 / 91.0;
        const z5_ratio = this.zLevels.z5 / 91.0;
        const z6_ratio = this.zLevels.z6 / 91.0;
        
        // Seviye 2 noktaları - Kullanıcı tarafından ayarlanabilir oran (0-1)
        const ratio = this.slaveRatio;  // 🎚️ Normalize oran (varsayılan 0.09, depth × ratio)

        // 🎯 YENİ: ratio zaten 0-1 arası normalize değer
        // depth × ratio = fiziksel mesafe
        const normalizedRatio = ratio; // Direkt kullan (artık normalize)

        const a2 = {
            x: a1.x + (c1.x - a1.x) * normalizedRatio,
            y: a1.y + (c1.y - a1.y) * normalizedRatio,
            z: z2_ratio * H  // 🎯 Kullanıcı kontrollü
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
        
        // b2 ve b3 noktaları - d1'den başlayan yeşil çizginin kesişim noktasından x,y alıyor
        const b2_raw = {
            x: ext_d1_a1b1 ? ext_d1_a1b1.x : (b1.x + (c1.x - b1.x) * ratio),
            y: ext_d1_a1b1 ? ext_d1_a1b1.y : (b1.y + (c1.y - b1.y) * ratio)
        };
        // 🔒 Sınır kontrolü uygula
        const b2_constrained = this.constrainPointToBoundary(b2_raw, a1, b1, c1, d1);
        const b2 = {
            x: b2_constrained.x,
            y: b2_constrained.y,
            z: z2_ratio * H
        };
        
        // d2 ve d3 noktaları - b1'den başlayan yeşil çizginin kesişim noktasından x,y alıyor
        const d2_raw = {
            x: ext_b1_a1d1 ? ext_b1_a1d1.x : (d1.x + (c1.x - d1.x) * ratio),
            y: ext_b1_a1d1 ? ext_b1_a1d1.y : (d1.y + (c1.y - d1.y) * ratio)
        };
        // 🔒 Sınır kontrolü uygula
        const d2_constrained = this.constrainPointToBoundary(d2_raw, a1, b1, c1, d1);
        const d2 = {
            x: d2_constrained.x,
            y: d2_constrained.y,
            z: z2_ratio * H
        };
        
        // Seviye 3 noktaları - a3, b3, d3 (z=30) - FİTİL: a3 VAR!
        const a3 = {
            x: a2.x,  // a2 ile aynı X
            y: a2.y,  // a2 ile aynı Y
            z: z3_ratio * H  // b3 ile aynı Z seviyesinde
        };
        
        const b3_raw = {
            x: ext_d1_a1b1 ? ext_d1_a1b1.x : (b1.x + (c1.x - b1.x) * ratio),
            y: ext_d1_a1b1 ? ext_d1_a1b1.y : (b1.y + (c1.y - b1.y) * ratio)
        };
        // 🔒 Sınır kontrolü uygula
        const b3_constrained = this.constrainPointToBoundary(b3_raw, a1, b1, c1, d1);
        const b3 = {
            x: b3_constrained.x,
            y: b3_constrained.y,
            z: z3_ratio * H  // 30/91 oranında yükseklik
        };
        
        const d3_raw = {
            x: ext_b1_a1d1 ? ext_b1_a1d1.x : (d1.x + (c1.x - d1.x) * ratio),
            y: ext_b1_a1d1 ? ext_b1_a1d1.y : (d1.y + (c1.y - d1.y) * ratio)
        };
        // 🔒 Sınır kontrolü uygula
        const d3_constrained = this.constrainPointToBoundary(d3_raw, a1, b1, c1, d1);
        const d3 = {
            x: d3_constrained.x,
            y: d3_constrained.y,
            z: z3_ratio * H
        };
        
        // Seviye 4 ve 5 - Offset oranı c1 istikametinde
        const ratio2 = this.slaveRatio2;  // 🎚️ Normalize oran (varsayılan 0.096, depth × ratio)

        // 🎯 YENİ: ratio2 zaten 0-1 arası normalize değer
        // depth × ratio2 = fiziksel mesafe
        const normalizedRatio2 = ratio2; // Direkt kullan (artık normalize)
        const offsetDistance = ratio2 * c1_length;  // Debug için fiziksel mesafe

        console.log('🔵 Offset oranı:', ratio2.toFixed(3), '(fiziksel:', offsetDistance.toFixed(2), 'birim | ratio1:', ratio.toFixed(3), ')');

        // 🔵 MAVİ ÇİZGİ (SAĞ): b1'den başlayan yeşil çizginin c1 yönünde offset'i
        // Yeşil çizgi yönü: b1 → a2
        const green_b1_direction = {
            x: a2.x - b1.x,
            y: a2.y - b1.y
        };

        // Offset başlangıç noktası (c1 yönünde, normalizedRatio2 kadar interpolasyon)
        const blue_b1_start = {
            x: b1.x + (c1.x - b1.x) * normalizedRatio2,
            y: b1.y + (c1.y - b1.y) * normalizedRatio2
        };
        
        // Offset çizgi a1-d1 ile kesişimi
        const ext_b1_ratio2_a1d1 = this.lineIntersection(
            blue_b1_start,
            {x: blue_b1_start.x + green_b1_direction.x * 100, y: blue_b1_start.y + green_b1_direction.y * 100},
            {x: a1.x, y: a1.y},
            {x: d1.x, y: d1.y}
        );
        
        // 🔵 MAVİ ÇİZGİ (SOL): d1'den başlayan yeşil çizginin c1 yönünde offset'i
        // Yeşil çizgi yönü: d1 → a2
        const green_d1_direction = {
            x: a2.x - d1.x,
            y: a2.y - d1.y
        };

        // Offset başlangıç noktası (c1 yönünde, normalizedRatio2 kadar interpolasyon)
        const blue_d1_start = {
            x: d1.x + (c1.x - d1.x) * normalizedRatio2,
            y: d1.y + (c1.y - d1.y) * normalizedRatio2
        };
        
        // Offset çizgi a1-b1 ile kesişimi
        const ext_d1_ratio2_a1b1 = this.lineIntersection(
            blue_d1_start,
            {x: blue_d1_start.x + green_d1_direction.x * 100, y: blue_d1_start.y + green_d1_direction.y * 100},
            {x: a1.x, y: a1.y},
            {x: b1.x, y: b1.y}
        );
        
        // b4, b5: d1'den başlayan mavi çizginin a1-b1 ile kesişim noktasından x,y alıyor
        const b4_raw = {
            x: ext_d1_ratio2_a1b1 ? ext_d1_ratio2_a1b1.x : (b1.x + (c1.x - b1.x) * ratio2),
            y: ext_d1_ratio2_a1b1 ? ext_d1_ratio2_a1b1.y : (b1.y + (c1.y - b1.y) * ratio2)
        };
        // 🔒 Sınır kontrolü uygula
        const b4_constrained = this.constrainPointToBoundary(b4_raw, a1, b1, c1, d1);
        const b4 = {
            x: b4_constrained.x,
            y: b4_constrained.y,
            z: z4_ratio * H  // 35/91 oranında yükseklik
        };
        
        const b5_raw = {
            x: ext_d1_ratio2_a1b1 ? ext_d1_ratio2_a1b1.x : (b1.x + (c1.x - b1.x) * ratio2),
            y: ext_d1_ratio2_a1b1 ? ext_d1_ratio2_a1b1.y : (b1.y + (c1.y - b1.y) * ratio2)
        };
        // 🔒 Sınır kontrolü uygula
        const b5_constrained = this.constrainPointToBoundary(b5_raw, a1, b1, c1, d1);
        const b5 = {
            x: b5_constrained.x,
            y: b5_constrained.y,
            z: z5_ratio * H  // 65/91 oranında yükseklik
        };
        
        // d4, d5: mavi çizginin a1-d1 hattı ile kesişim noktasından x,y alıyor
        const d4_raw = {
            x: ext_b1_ratio2_a1d1 ? ext_b1_ratio2_a1d1.x : (d1.x + (c1.x - d1.x) * ratio2),
            y: ext_b1_ratio2_a1d1 ? ext_b1_ratio2_a1d1.y : (d1.y + (c1.y - d1.y) * ratio2)
        };
        // 🔒 Sınır kontrolü uygula
        const d4_constrained = this.constrainPointToBoundary(d4_raw, a1, b1, c1, d1);
        const d4 = {
            x: d4_constrained.x,
            y: d4_constrained.y,
            z: z4_ratio * H
        };
        
        const d5_raw = {
            x: ext_b1_ratio2_a1d1 ? ext_b1_ratio2_a1d1.x : (d1.x + (c1.x - d1.x) * ratio2),
            y: ext_b1_ratio2_a1d1 ? ext_b1_ratio2_a1d1.y : (d1.y + (c1.y - d1.y) * ratio2)
        };
        // 🔒 Sınır kontrolü uygula
        const d5_constrained = this.constrainPointToBoundary(d5_raw, a1, b1, c1, d1);
        const d5 = {
            x: d5_constrained.x,
            y: d5_constrained.y,
            z: z5_ratio * H
        };
        
        // FİTİL: w5 ve z5 noktaları KALDIRILDI

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
            console.log(`🔷 FİTİL c6 override uygulandı: (${c6.x.toFixed(2)}, ${c6.y.toFixed(2)})`);
        }

        // 🎯 F-d6 NOKTASI: d1'in x,y koordinatlarında, c6'nın z'sinde
        const d6 = {
            x: d1.x,
            y: d1.y,
            z: c6.z  // c6 ile aynı Z (85/91 * H)
        };

        // 🎯 F-b6 NOKTASI: b1'in x,y koordinatlarında, c6'nın z'sinde
        const b6 = {
            x: b1.x,
            y: b1.y,
            z: c6.z  // c6 ile aynı Z (85/91 * H)
        };

        // 🎯 F-a5 NOKTASI: a3'ün x,y koordinatlarında, b5'in z'sinde
        const a5 = {
            x: a3.x,
            y: a3.y,
            z: b5.z  // Z değeri b5 ile aynı (65/91 * H)
        };

        // 🟢🔵 YEŞİL-MAVİ KESİŞİM NOKTASI (SOL): d1'den başlayan yeşil çizgi ile b1'den başlayan mavi çizginin kesişimi
        // Yeşil çizgi: d1 -> ext_d1_a1b1 (d1'den a2 yönünde a1-b1'e)
        // Mavi çizgi: b1 -> ext_b1_ratio2_a1d1 (b1'den ratio2 yönünde a1-d1'e)
        const greenBlueIntersection = (ext_d1_a1b1 && ext_b1_ratio2_a1d1) ? this.lineIntersection(
            {x: d1.x, y: d1.y},
            {x: ext_d1_a1b1.x, y: ext_d1_a1b1.y},
            {x: b1.x, y: b1.y},
            {x: ext_b1_ratio2_a1d1.x, y: ext_b1_ratio2_a1d1.y}
        ) : null;

        // F-x4: Yeşil-mavi kesişim noktası (SOL), d4 ile aynı Z
        const x4_raw = greenBlueIntersection ? {
            x: greenBlueIntersection.x,
            y: greenBlueIntersection.y
        } : {
            x: 0,
            y: 0
        };
        // 🔒 Sınır kontrolü uygula
        const x4_constrained = this.constrainPointToBoundary(x4_raw, a1, b1, c1, d1);
        const x4 = {
            x: x4_constrained.x,
            y: x4_constrained.y,
            z: d4.z  // d4 ile aynı Z (35/91 * H)
        };

        // F-x5: Yeşil-mavi kesişim noktası (SOL), d5 ile aynı Z
        const x5_raw = greenBlueIntersection ? {
            x: greenBlueIntersection.x,
            y: greenBlueIntersection.y
        } : {
            x: 0,
            y: 0
        };
        // 🔒 Sınır kontrolü uygula
        const x5_constrained = this.constrainPointToBoundary(x5_raw, a1, b1, c1, d1);
        const x5 = {
            x: x5_constrained.x,
            y: x5_constrained.y,
            z: d5.z  // d5 ile aynı Z (65/91 * H)
        };

        // 🟢🔵 YEŞİL-MAVİ KESİŞİM NOKTASI (SAĞ): b1'den başlayan yeşil çizgi ile d1'den başlayan mavi çizginin kesişimi
        // Yeşil çizgi: b1 -> ext_b1_a1d1 (b1'den a2 yönünde a1-d1'e)
        // Mavi çizgi: d1 -> ext_d1_ratio2_a1b1 (d1'den ratio2 yönünde a1-b1'e)
        const greenBlueIntersectionRight = (ext_b1_a1d1 && ext_d1_ratio2_a1b1) ? this.lineIntersection(
            {x: b1.x, y: b1.y},
            {x: ext_b1_a1d1.x, y: ext_b1_a1d1.y},
            {x: d1.x, y: d1.y},
            {x: ext_d1_ratio2_a1b1.x, y: ext_d1_ratio2_a1b1.y}
        ) : null;

        // F-y4: Yeşil-mavi kesişim noktası (SAĞ), b4 ile aynı Z
        const y4_raw = greenBlueIntersectionRight ? {
            x: greenBlueIntersectionRight.x,
            y: greenBlueIntersectionRight.y
        } : {
            x: 0,
            y: 0
        };
        // 🔒 Sınır kontrolü uygula
        const y4_constrained = this.constrainPointToBoundary(y4_raw, a1, b1, c1, d1);
        const y4 = {
            x: y4_constrained.x,
            y: y4_constrained.y,
            z: b4.z  // b4 ile aynı Z (35/91 * H)
        };

        // F-y5: Yeşil-mavi kesişim noktası (SAĞ), b5 ile aynı Z
        const y5_raw = greenBlueIntersectionRight ? {
            x: greenBlueIntersectionRight.x,
            y: greenBlueIntersectionRight.y
        } : {
            x: 0,
            y: 0
        };
        // 🔒 Sınır kontrolü uygula
        const y5_constrained = this.constrainPointToBoundary(y5_raw, a1, b1, c1, d1);
        const y5 = {
            x: y5_constrained.x,
            y: y5_constrained.y,
            z: b5.z  // b5 ile aynı Z (65/91 * H)
        };

        // Nokta objelerini oluştur
        const points = {
            // 🎯 4 ANA KONTROL NOKTASI (Master Points)
            'F-a1': { ...a1, level: 1, type: 'master', display: 'F-a1', editable: true },
            'F-b1': { ...b1, level: 1, type: 'master', display: 'F-b1', editable: true },
            'F-c1': { ...c1, level: 1, type: 'master', display: 'F-c1', editable: true },
            'F-d1': { ...d1, level: 1, type: 'master', display: 'F-d1', editable: true },
            
            // 🔗 BAĞIMLI NOKTALAR (Slave Points) - Seviye 2
            'F-a2': { ...a2, level: 2, type: 'slave', display: 'F-a2', editable: false },
            'F-b2': { ...b2, level: 2, type: 'slave', display: 'F-b2', editable: false },
            'F-d2': { ...d2, level: 2, type: 'slave', display: 'F-d2', editable: false },
            
            // 🔗 BAĞIMLI NOKTALAR (Slave Points) - Seviye 3 (FİTİL: a3 dahil!)
            'F-a3': { ...a3, level: 3, type: 'slave', display: 'F-a3', editable: false },
            'F-b3': { ...b3, level: 3, type: 'slave', display: 'F-b3', editable: false },
            'F-d3': { ...d3, level: 3, type: 'slave', display: 'F-d3', editable: false },
            
            // 🔗 BAĞIMLI NOKTALAR (Slave Points) - Seviye 4 (ratio=18.6%, sadece b ve d)
            'F-b4': { ...b4, level: 4, type: 'slave', display: 'F-b4', editable: false },
            'F-d4': { ...d4, level: 4, type: 'slave', display: 'F-d4', editable: false },

            // 🔗 BAĞIMLI NOKTALAR (Slave Points) - Seviye 5 (a5, b5, d5)
            'F-a5': { ...a5, level: 5, type: 'slave', display: 'F-a5', editable: false },
            'F-b5': { ...b5, level: 5, type: 'slave', display: 'F-b5', editable: false },
            'F-d5': { ...d5, level: 5, type: 'slave', display: 'F-d5', editable: false },
            
            // FİTİL: w5 ve z5 noktaları KALDIRILDI
            
            // 🟢 YEŞİL-MAVİ KESİŞİM NOKTALARI (SOL: x4, x5 - SAĞ: y4, y5)
            'F-x4': { ...x4, level: 4, type: 'slave', display: 'F-x4', editable: false },
            'F-x5': { ...x5, level: 5, type: 'slave', display: 'F-x5', editable: false },
            'F-y4': { ...y4, level: 4, type: 'slave', display: 'F-y4', editable: false },
            'F-y5': { ...y5, level: 5, type: 'slave', display: 'F-y5', editable: false },
            
            // 🔗 BAĞIMLI NOKTALAR (Slave Points) - Seviye 6
            'F-c6': { ...c6, level: 6, type: 'slave', display: 'F-c6', editable: false },
            'F-d6': { ...d6, level: 6, type: 'slave', display: 'F-d6', editable: false },
            'F-b6': { ...b6, level: 6, type: 'slave', display: 'F-b6', editable: false }
        };
        
        // Z ALIGNMENT: Keep top ridge (c6) at Z=0, grow downward as H increases
        const topZ = c6.z;
        Object.keys(points).forEach((key) => {
            const zVal = (points[key].z !== undefined) ? points[key].z : 0.0;
            points[key].z = zVal - topZ; // shift all points so c6 becomes 0 and others negative
        });
        
        console.log('✅ Master Points:', Object.keys(this.masterPoints).length);
        console.log('✅ Slave Points:', Object.keys(points).filter(k => points[k].type === 'slave').length);
        console.log('✅ FİTİL: a3 ve a5 (a3 x,y + b5 z) eklendi, a4-w5-z5 silindi');
        console.log('✅ YEŞİL-MAVİ KESİŞİM (SOL): F-x4 (Z=d4) ve F-x5 (Z=d5) eklendi');
        console.log('✅ YEŞİL-MAVİ KESİŞİM (SAĞ): F-y4 (Z=b4) ve F-y5 (Z=b5) eklendi');
        console.log('✅ YENİ NOKTALAR: F-d6 (d1 x,y + c6 z) ve F-b6 (b1 x,y + c6 z) eklendi');
        console.log('🔒 SINIR KONTROLÜ AKTİF: TÜM slave noktalar (b2,b3,b4,b5,d2,d3,d4,d5,x4,x5,y4,y5) a1-b1-c1-d1 içinde!');
        console.log(`📏 Z ALIGNMENT: c6 Z=0 yapıldı, geometri ${topZ.toFixed(2)} birim aşağı kaydırıldı (BADEM ile uyumlu)`);
        
        return points;
    }

    /**
     * Generate faces (quad surfaces) connecting the points
     * Based on the surface structure visible in PNG
     * Quad format: [point1, point2, point3, point4] - clockwise or counter-clockwise order
     */
    generateFaces() {
        // Define quad faces for 3D fitil geometry
        const faces = [];

        // 🎯 İLK YÜZEY: F-a1, F-a2, F-d2 (üçgen yüzey) - YENİ
        // Bu yüzey sol taban a1-a2-d2 üçgeni
        faces.push(['F-a1', 'F-a2', 'F-d2']);

        // 🎯 İLK B YÜZEY: F-a1, F-b2, F-a2 (üçgen yüzey) - YENİ (simetrik) - FIXED
        // Bu yüzey sağ taban a1-a2-b2 üçgeni
        faces.push(['F-a1', 'F-b2', 'F-a2']);

        // 🎯 İKİNCİ YÜZEY: F-a1, F-b1, F-b2, F-a2 (seviye 1-2 arası) - SİLİNDİ!
        // Bu yüzey taban seviyesinden ikinci seviyeye geçişi temsil eder
        // faces.push(['F-a1', 'F-b1', 'F-b2', 'F-a2']);  // ❌ SİLİNDİ

        // 🎯 ÜÇÜNCÜ QUAD YÜZEY: F-a1, F-a2, F-d2, F-d1 (sol-alt panel) - SİLİNDİ!
        // Bu yüzey sol taraftaki dikey paneli temsil eder
        // faces.push(['F-a1', 'F-a2', 'F-d2', 'F-d1']);  // ❌ SİLİNDİ

        // 🎯 DÖRDÜNCÜ YÜZEY: F-a2, F-b2, F-b3, F-a3 (quad yüzey) - FİTİL: a3 eklendi
        // Bu yüzey ön kısımda seviye 2-3 arası geçişi temsil eder (a2-a3 dikey bağlantı)
        faces.push(['F-a2', 'F-b2', 'F-b3', 'F-a3']);

        // 🎯 BEŞİNCİ YÜZEY: F-a3, F-b3, F-b4, F-y4 (quad yüzey) - YENİ (simetrik) - FIXED
        // Bu yüzey sağ tarafta a3-b3 arasında y4-b4 ile bağlantı
        faces.push(['F-a3', 'F-b3', 'F-b4', 'F-y4']);
        
        // 🎯 BEŞİNCİ YÜZEY: SİLİNDİ - a3-b4 çizgisi kaldırıldı

        // 🎯 ALTINCI YÜZEY: SİLİNDİ - a5-b4 çizgisi kaldırıldı

        // 🎯 YEDİNCİ YÜZEY: SİLİNDİ - a5-b5 çizgisi kaldırıldı

        // 🎯 SEKİZİNCİ YÜZEY: F-a2, F-a3, F-d3, F-d2 (quad yüzey) - FİTİL: a3 eklendi - FIXED
        // Bu yüzey sol tarafta seviye 2-3 geçişi temsil eder (a2-a3 dikey bağlantı)
        faces.push(['F-a2', 'F-a3', 'F-d3', 'F-d2']);

        // 🎯 DOKUZUNCU YÜZEY: F-a3, F-x4, F-d4, F-d3 (quad yüzey) - YENİ
        // Bu yüzey sol tarafta a3-d3 arasında x4-d4 ile bağlantı
        faces.push(['F-a3', 'F-x4', 'F-d4', 'F-d3']);
        
        // 🎯 ONUNCU YÜZEY: F-a3, F-a5, F-x5, F-x4 (quad yüzey) - YENİ
        // Bu yüzey ortada a3-a5 arasında x4-x5 ile bağlantı (sol)
        faces.push(['F-a3', 'F-a5', 'F-x5', 'F-x4']);

        // 🎯 ONUNCU B YÜZEY: F-a3, F-y4, F-y5, F-a5 (quad yüzey) - YENİ (simetrik) - FIXED
        // Bu yüzey ortada a3-a5 arasında y4-y5 ile bağlantı (sağ)
        faces.push(['F-a3', 'F-y4', 'F-y5', 'F-a5']);

        // 🎯 ON BİRİNCİ YÜZEY: F-x4, F-x5, F-d5, F-d4 (quad yüzey) - YENİ
        // Bu yüzey sol üst x4-d4 arasında x5-d5 ile bağlantı
        faces.push(['F-x4', 'F-x5', 'F-d5', 'F-d4']);

        // 🎯 ON BİRİNCİ B YÜZEY: F-y4, F-b4, F-b5, F-y5 (quad yüzey) - YENİ (simetrik) - FIXED
        // Bu yüzey sağ üst y4-b4 arasında y5-b5 ile bağlantı
        faces.push(['F-y4', 'F-b4', 'F-b5', 'F-y5']);

        // 🎯 ON İKİNCİ YÜZEY: F-d5, F-x5, F-d6 (üçgen yüzey) - YENİ
        // Bu yüzey sol üst d5-x5-d6 üçgeni
        faces.push(['F-d5', 'F-x5', 'F-d6']);

        // 🎯 ON İKİNCİ B YÜZEY: F-b5, F-b6, F-y5 (üçgen yüzey) - YENİ (simetrik) - FIXED
        // Bu yüzey sağ üst b5-y5-b6 üçgeni
        faces.push(['F-b5', 'F-b6', 'F-y5']);

        // 🎯 ON ÜÇÜNCÜ YÜZEY: F-x5, F-a5, F-d6 (üçgen yüzey) - YENİ
        // Bu yüzey orta x5-a5-d6 üçgeni
        faces.push(['F-x5', 'F-a5', 'F-d6']);

        // 🎯 ON ÜÇÜNCÜ B YÜZEY: F-y5, F-b6, F-a5 (üçgen yüzey) - YENİ (simetrik) - FIXED
        // Bu yüzey orta y5-a5-b6 üçgeni
        faces.push(['F-y5', 'F-b6', 'F-a5']);

        // 🎯 ON DÖRDÜNCÜ YÜZEY: F-a5, F-c6, F-d6 (üçgen yüzey) - YENİ
        // Bu yüzey üst a5-c6-d6 üçgeni
        faces.push(['F-a5', 'F-c6', 'F-d6']);

        // 🎯 ON DÖRDÜNCÜ B YÜZEY: F-a5, F-b6, F-c6 (üçgen yüzey) - YENİ (simetrik) - FIXED
        // Bu yüzey üst a5-c6-b6 üçgeni
        faces.push(['F-a5', 'F-b6', 'F-c6']);

        console.log('📊 ========== YÜZEY LİSTESİ ==========');
        console.log('🔺 1. F-a1 → F-a2 → F-d2 (sol taban)');
        console.log('🔺 2. F-a1 → F-a2 → F-b2 (sağ taban)');
        console.log('🔷 3. F-a2 → F-b2 → F-b3 → F-a3 (sağ alt)');
        console.log('🔷 4. F-a2 → F-d2 → F-d3 → F-a3 (sol alt)');
        console.log('🔷 5. F-a3 → F-y4 → F-b4 → F-b3 (sağ orta)');
        console.log('🔷 6. F-a3 → F-x4 → F-d4 → F-d3 (sol orta)');
        console.log('🔷 7. F-a3 → F-a5 → F-x5 → F-x4 (orta sol)');
        console.log('🔷 8. F-a3 → F-a5 → F-y5 → F-y4 (orta sağ)');
        console.log('🔷 9. F-y4 → F-y5 → F-b5 → F-b4 (sağ üst)');
        console.log('🔷 10. F-x4 → F-x5 → F-d5 → F-d4 (sol üst)');
        console.log('🔺 11. F-d5 → F-x5 → F-d6 (sol en üst)');
        console.log('🔺 12. F-b5 → F-y5 → F-b6 (sağ en üst)');
        console.log('🔺 13. F-x5 → F-a5 → F-d6 (orta üst sol)');
        console.log('🔺 14. F-y5 → F-a5 → F-b6 (orta üst sağ)');
        console.log('🔺 15. F-a5 → F-c6 → F-d6 (tepe sol)');
        console.log('🔺 16. F-a5 → F-c6 → F-b6 (tepe sağ)');
        console.log('📊 Toplam yüzey sayısı:', faces.length);
        console.log('✅ 8 quad + 8 üçgen = 16 yüzey (tam simetrik)');

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

        console.log('📐 Geometry created:', {
            vertices: vertices.length / 3,
            triangles: indices.length / 3,
            quads: this.faces.filter(f => f.length === 4).length,
            totalFaces: this.faces.length,
            points: pointKeys.length
        });

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
        
        console.log('📍 Nokta İsimleri:', pointsArray.map(p => p.display || p.name).join(', '));
        
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
        // FİTİL: ratioZ5 KALDIRILDI
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
     * ─░ki ├ğizginin kesi┼şim noktas─▒n─▒ hesapla
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
            return null; // Paralel ├ğizgiler
        }
        
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        
        return {
            x: x1 + t * (x2 - x1),
            y: y1 + t * (y2 - y1)
        };
    }

    /**
     * 🔒 Bir noktanın dörtgen sınırlar içinde olup olmadığını kontrol et
     * ve sınır dışındaysa en yakın sınır noktasına taşı
     * @param {object} point - Kontrol edilecek nokta {x, y}
     * @param {object} a1 - Dörtgen köşe 1
     * @param {object} b1 - Dörtgen köşe 2
     * @param {object} c1 - Dörtgen köşe 3
     * @param {object} d1 - Dörtgen köşe 4
     * @returns {object} - Sınırlar içinde kalan nokta {x, y}
     */
    constrainPointToBoundary(point, a1, b1, c1, d1) {
        if (!point) return point;

        // 🎯 RADIAL PLAN BYPASS: Radial planda sınır kontrolü YOK
        // Çünkü radial planda geometri zaten doğru, boundary constraint bozar
        if (this.sectorAngle !== null && this.innerRadius !== null && this.outerRadius !== null) {
            return point;  // Radial planda bypass, olduğu gibi döndür
        }

        // Dörtgenin kenarları: a1-b1, b1-c1, c1-d1, d1-a1
        const edges = [
            {p1: a1, p2: b1, name: 'a1-b1'},
            {p1: b1, p2: c1, name: 'b1-c1'},
            {p1: c1, p2: d1, name: 'c1-d1'},
            {p1: d1, p2: a1, name: 'd1-a1'}
        ];

        // Noktanın dörtgen içinde olup olmadığını kontrol et (cross product yöntemi)
        let isInside = true;
        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            const cross = (edge.p2.x - edge.p1.x) * (point.y - edge.p1.y) - 
                         (edge.p2.y - edge.p1.y) * (point.x - edge.p1.x);
            
            // İlk kenarın yönünü referans al
            if (i === 0) {
                var firstSign = Math.sign(cross);
            } else {
                // Tüm kenarlar aynı yönde olmalı (içerideyse)
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

        // Her kenar için en yakın noktayı hesapla
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

        console.log(`🔒 Nokta sınır dışında! Sınıra taşındı. Mesafe: ${minDistance.toFixed(3)}`);
        return closestPoint;
    }

    /**
     * 🎯 Bir noktayı çizgi parçası üzerine projeksiyon et
     * @param {object} point - Projeksiyon yapılacak nokta
     * @param {object} lineStart - Çizgi başlangıcı
     * @param {object} lineEnd - Çizgi bitişi
     * @returns {object} - Çizgi üzerindeki en yakın nokta {x, y}
     */
    projectPointOnLineSegment(point, lineStart, lineEnd) {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        
        if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) {
            // Çizgi parçası bir nokta
            return {x: lineStart.x, y: lineStart.y};
        }
        
        // Parametrik t değeri (0-1 arası olmalı)
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
    module.exports = FitilGeometry;
} else {
    window.FitilGeometry = FitilGeometry;
}

