# Hücre Bağlantıları ve Köprü Yüzeyler Raporu

**Tarih:** Aralık 2025  
**Proje:** Püskül 3D Viewer  
**Konu:** Yan yana gelen hücrelerin birbirlerine bağlanması ve köprü yüzeylerin çizilmesi

---

## 1. YAN YANA GELEN HÜCRELERİN BİRBİRİNE BAĞLANMASI

### 1.1. Hücre Pozisyonlama Sistemi

Hücreler, **PuskulGeometry** sınıfının `calculateCellPositions()` metodu ile konumlandırılır. Sistem şu mantıkla çalışır:

#### 1.1.1. İki Ngon Sistemi

- **Dış Ngon (outerRadius):** Tüm hücrelerin **c1 noktaları** bu çokgen üzerinde konumlanır
- **İç Ngon (innerRadius):** Tüm hücrelerin **a1 noktaları** bu çokgen üzerinde konumlanır
- **Hücre Derinliği (depth):** `depth = outerRadius - innerRadius` formülü ile hesaplanır

#### 1.1.2. Hücre Yerleşimi

Her hücre için:
- **a1 noktası:** İç ngon üzerinde sabitlenir
- **c1 noktası:** Dış ngon üzerinde hedeflenir
- **Rotation:** a1-c1 hattı merkeze bakacak şekilde hesaplanır
- **Pozisyon:** a1 noktasının dünya koordinatları (x, y) olarak belirlenir

**Kod Referansı:**
```96:280:puskul-geometry.js
calculateCellPositions() {
    // Her segment için hücre pozisyonları hesaplanır
    // a1 innerRadius'ta, c1 outerRadius'ta
    // Her hücre için rotation ve depth hesaplanır
}
```

### 1.2. Hücre Bağlantı Sistemi (Snap)

Hücreler arası bağlantılar, **PuskulGeometry** sınıfının `applySnap()` metodu ile gerçekleştirilir. Bu sistem iki aşamada çalışır:

#### 1.2.1. Aşama 1: Normal Yan Bağlantılar

**Bağlantı Kuralları:**

1. **Fitil/Kazayağı → Badem/Yaprak:**
   - Fitil'in **b1** noktası → Badem'in **c1** noktasına (Badem.c1 SABİT)
   - Fitil'in **d1** noktası → Badem'in **c1** noktasına (Badem.c1 SABİT)
   - Fitil/Kazayağı noktaları Badem'e doğru hareket eder

2. **Badem/Yaprak → Fitil/Kazayağı:**
   - Badem'in **c1** noktası SABİT kalır
   - Fitil'in **d1** noktası Badem.c1'e doğru hareket eder

3. **Badem-Badem / Yaprak-Yaprak:**
   - **b1 ↔ d1** bağlantısı (her iki nokta da ortaya doğru hareket eder)
   - Hedef: İki noktanın orta noktası

**Kod Referansı:**
```345:501:puskul-geometry.js
applySnap(threshold) {
    // AŞAMA 1: Normal yan bağlantılar
    // Hücre tiplerine göre bağlantı noktaları belirlenir
    // Gap hesaplanır ve snap gücüne göre interpolasyon yapılır
}
```

#### 1.2.2. Aşama 2: Fitil.a1 Üçlü Snap

**Özel Durum:** Fitil hücresi iki Badem arasında olduğunda:

```
Badem1.b1 ← Fitil.a1 → Badem2.d1
```

- Üç nokta (Badem1.b1, Fitil.a1, Badem2.d1) ortak bir hedefe doğru hareket eder
- Hedef: Üç noktanın ortalaması
- Bu sayede Fitil'in arka noktası iki komşu Badem'in yan noktalarıyla hizalanır

**Kod Referansı:**
```503:600:puskul-geometry.js
// AŞAMA 2: Fitil.a1 üçlü snap
// Badem1.b1 ← Fitil.a1 → Badem2.d1
// Üç noktanın ortalaması hedef olarak kullanılır
```

#### 1.2.3. Snap Gücü (Snap Strength)

- **Ara hücre VARSA (FITIL, KAZAYAGI):** Otomatik tam snap (`snapStrength = 1.0`)
- **Ara hücre YOKSA:** Ayarlanabilir snap (`snapStrength = threshold / 20`)

**Kod Referansı:**
```345:357:puskul-geometry.js
const hasInterCells = (this.interCellType !== 'YOK' && this.interCellType !== 'NONE');
let snapStrength;
if (hasInterCells) {
    snapStrength = 1.0; // Tam snap (ara hücre varsa)
} else {
    snapStrength = threshold / maxThreshold; // Kademeli snap
}
```

### 1.3. Hücre Komşuluk Sistemi

Hücreler **dairesel (circular) komşuluk** sistemi ile bağlanır:

- Her hücre, `cellIndex` sırasına göre bir önceki ve bir sonraki hücreye komşudur
- Son hücre, ilk hücreye bağlanır (döngüsel sistem)

**Kod Referansı:**
```844:857:puskul-geometry.js
getNeighbors(cellIndex) {
    const totalCells = this.totalCells;
    const prevIndex = (cellIndex - 1 + totalCells) % totalCells;
    const nextIndex = (cellIndex + 1) % totalCells;
    return {
        prev: `cell${prevIndex + 1}`,
        next: `cell${nextIndex + 1}`
    };
}
```

---

## 2. KÖPRÜ YÜZEYLERİN ÇİZİLMESİ

### 2.1. Genel Mantık

Köprü yüzeyleri, yan yana gelen hücreler arasındaki boşlukları dolduran 3D yüzeylerdir. Bu yüzeyler, her iki hücrenin kenar noktalarını birleştirerek oluşturulur.

### 2.2. Köprü Yüzeyi Oluşturma Süreci

#### 2.2.1. Adım 1: Kenar Noktalarının Çıkarılması

**Fonksiyon:** `extractEdgePoints(geometry, prefix, side, bothMainCells)`

Bu fonksiyon, bir hücrenin sağ veya sol kenarındaki tüm noktaları çıkarır:

**Sağ Kenar (right):**
- **Ana hücre (B/Y):** b1, b2, b3, b4, b5, b6, c6 noktaları
- **Ara hücre (F/K):** b2, b3, b4, b5, b6 noktaları (b1 hariç)

**Sol Kenar (left):**
- **Ana hücre (B/Y):** d1, d2, d3, d4, d5, d6, c6 noktaları
- **Ara hücre (F/K):** d2, d3, d4, d5, d6 noktaları (d1 hariç)

**Özel Durum:** Ana hücrelerde (Badem/Yaprak) **c6 noktası** da kenar noktası olarak eklenir (üst seviye için).

**Kod Referansı:**
```1047:1112:puskul-geometry.js
extractEdgePoints(geometry, prefix, side, bothMainCells = false) {
    // Kenar harfi belirlenir (b veya d)
    // Her nokta için kontrol yapılır
    // Z seviyesine göre sıralanır (alt'tan üst'e)
}
```

#### 2.2.2. Adım 2: Bağlantı Noktalarının Bulunması

**Fonksiyon:** `findBridgePoints(geo1, geo2, prefix1, prefix2, points1, points2)`

Bu fonksiyon, iki hücre arasındaki köprü için hangi noktaların kullanılacağını belirler:

- **cell1'in SAĞ kenarı:** `extractEdgePoints(geo1, prefix1, 'right')`
- **cell2'nin SOL kenarı:** `extractEdgePoints(geo2, prefix2, 'left')`

**Kod Referansı:**
```1021:1037:puskul-geometry.js
findBridgePoints(geo1, geo2, prefix1, prefix2, points1, points2) {
    // cell1'in SAĞ kenarı (b noktaları)
    const rightPoints1 = this.extractEdgePoints(geo1, prefix1, 'right', bothMainCells);
    // cell2'nin SOL kenarı (d noktaları)
    const leftPoints2 = this.extractEdgePoints(geo2, prefix2, 'left', bothMainCells);
    points1.push(...rightPoints1);
    points2.push(...leftPoints2);
}
```

#### 2.2.3. Adım 3: Köprü Yüzeyinin Oluşturulması

**Fonksiyon:** `createBridgeSurface(cellName1, cellName2)`

Bu fonksiyon, iki hücre arasında köprü yüzeyi oluşturur:

1. **Noktaların Dünya Koordinatlarına Dönüştürülmesi:**
   - Her hücrenin lokal koordinatları, rotation ve translation ile dünya koordinatlarına çevrilir

2. **Quad/Triangle Oluşturma:**
   - Her Z seviyesi için, cell1 ve cell2'nin karşılık gelen noktaları birleştirilir
   - Quad'lar iki üçgene bölünür

3. **Özel Pattern'ler:**
   - **Sol taraf (Ana→Ara):** Eski pattern (bottom-left → top-left → bottom-right)
   - **Sağ taraf (Ara→Ana):** Yeni pattern (i, n1+i, n1+i+1)

**Kod Referansı:**
```866:1014:puskul-geometry.js
createBridgeSurface(cellName1, cellName2) {
    // Bağlantı noktaları bulunur
    // World koordinatlarına dönüştürülür
    // Quad'lar oluşturulur (farklı nokta sayıları desteklenir)
}
```

#### 2.2.4. Quad Oluşturma Mantığı

**Temel Mantık:**
- Her Z seviyesi için, cell1 ve cell2'nin karşılık gelen noktaları arasında quad oluşturulur
- Quad'lar iki üçgene bölünür

**Örnek (Ana→Ara):**
```
Triangle 1: bottom-left → top-left → bottom-right
Triangle 2: top-left → top-right → bottom-right
```

**Örnek (Ara→Ana):**
```
Triangle 1: i, n1+i, n1+i+1
Triangle 2: i, n1+i+1, i+1
```

**Farklı Nokta Sayıları:**
- Eğer cell1 ve cell2'nin nokta sayıları farklıysa, fazla noktalar son noktaya bağlanır

**Kod Referansı:**
```956:1006:puskul-geometry.js
// Quad mesh (Z seviyelerine göre bağla)
for (let i = 0; i < minPoints - 1; i++) {
    if (cell1IsIntermediate) {
        // Sağ taraf (Ara→Ana): Yeni pattern
        indices.push(i1_bottom, i2_bottom, i2_top);
        indices.push(i1_bottom, i2_top, i1_top);
    } else {
        // Sol taraf (Ana→Ara): Eski pattern
        indices.push(i1_bottom, i1_top, i2_bottom);
        indices.push(i1_top, i2_top, i2_bottom);
    }
}
```

### 2.3. Tüm Köprü Yüzeylerinin Oluşturulması

**Fonksiyon:** `createAllBridgeSurfaces()`

Bu fonksiyon, tüm komşu hücre çiftleri için köprü yüzeylerini oluşturur:

1. Her hücre için komşu hücre bulunur (`getNeighbors()`)
2. Her komşu çifti için `createBridgeSurface()` çağrılır
3. Her köprü için ayrı bir Three.js BufferGeometry oluşturulur
4. Her köprü farklı renkte gösterilir (debug için)

**Kod Referansı:**
```1118:1169:puskul-geometry.js
createAllBridgeSurfaces() {
    // Her hücre için komşu bulunur
    // Her komşu çifti için köprü oluşturulur
    // Her köprü için BufferGeometry oluşturulur
}
```

### 2.4. Köprü Yüzeylerinin Render Edilmesi

**Fonksiyon:** `createBridgeSurfacesForLayer(layerNum)` (app.js içinde)

Bu fonksiyon, bir katman için köprü yüzeylerini sahneye ekler:

1. Eski köprü mesh'leri temizlenir
2. `createAllBridgeSurfaces()` ile köprü geometrileri oluşturulur
3. Her köprü için ayrı bir Three.js Mesh oluşturulur
4. Hücre tipine göre renk atanır:
   - **BADEM:** Koyu kırmızı (0x8B0000)
   - **FITIL:** Koyu mavi (0x00008B)
   - **YAPRAK:** Koyu yeşil (0x006400)
   - **KAZAYAGI:** Koyu sarı (0x8B8B00)
5. Mesh'ler sahneye eklenir

**Kod Referansı:**
```2098:2254:app.js
createBridgeSurfacesForLayer(layerNum) {
    // Eski mesh'ler temizlenir
    // Köprü geometrileri oluşturulur
    // Her köprü için Mesh oluşturulur ve sahneye eklenir
}
```

---

## 3. ÖZET

### 3.1. Hücre Bağlantıları

- Hücreler **dairesel komşuluk** sistemi ile bağlanır
- **Snap sistemi** ile hücreler arası boşluklar kapatılır
- **Fitil/Kazayağı** hücreleri özel bağlantı kurallarına sahiptir
- **Badem/Yaprak** hücreleri normal bağlantı kurallarına sahiptir

### 3.2. Köprü Yüzeyleri

- Köprü yüzeyleri, **kenar noktalarının çıkarılması** ile başlar
- **Z seviyesine göre sıralı noktalar** kullanılır
- **Quad'lar iki üçgene bölünür** ve mesh oluşturulur
- Her köprü **hücre tipine göre renklendirilir**

### 3.3. Kritik Noktalar

1. **Ana hücrelerde c6 noktası** da kenar noktası olarak kullanılır
2. **Ara hücrelerde b1/d1 noktaları** kenar noktalarına dahil edilmez
3. **Farklı nokta sayıları** desteklenir (fazla noktalar son noktaya bağlanır)
4. **Sol ve sağ taraf** için farklı triangle pattern'leri kullanılır

---

## 4. İLGİLİ DOSYALAR

- `puskul-geometry.js`: Hücre bağlantıları ve köprü yüzey mantığı
- `app.js`: Köprü yüzeylerinin render edilmesi
- `layer-transition.js`: Katman geçiş yüzeyleri (farklı bir sistem)
- `PUSKUL_KURALLARI.md`: Tasarım kuralları ve bağlantı kuralları

---

**Son Güncelleme:** Aralık 2025

