# 🎀 PÜSKÜL TASARIM KURALLARI

**Tarih:** Kasım 2025 (Güncel)
**Proje:** MukarnasPro - Püskül 3D Viewer
**Versiyon:** 4.0.0

---

## 🎯 KRİTİK KURALLAR

### ⚠️ KURAL 1: Hücre Hizalama (a1-c1 Hatları)

**Kural:** Püskül tasarımında kullanılan **tüm hücrelerin a1 ve c1 hatları** yardımcı çizgiler üzerinde olmak zorundadır.

**Detay:**
- **a1 hattı:** Hücrenin ARKA noktası (merkeze bakar)
- **c1 hattı:** Hücrenin ÖN noktası (dışa bakar)
- **Yeşil çizgiler:** Köşelere - köşe yerleşiminde a1-c1 hattı yeşil çizgi üzerinde
- **Mavi çizgiler:** Kenar ortalarına - kenar yerleşiminde a1-c1 hattı mavi çizgi üzerinde

**Uygulama:**
```javascript
// Köşe yerleşimi (corner)
cell.rotation = cornerAngle; // a1-c1 hattı yeşil çizgiye hizalı

// Kenar yerleşimi (edge)
cell.rotation = edgeAngle; // a1-c1 hattı mavi çizgiye hizalı
```

---

### ⚠️ KURAL 2: Yukarıdan Aşağıya Tasarım (Z Yönü)

**Kural:** Püskül **yukarıdan aşağı doğru** tasarlanır (ters piramit mantığı).

**Detay:**
- İlk hücrenin **c6 noktası** (tepe) **z=0** seviyesinde başlar
- Hücre **aşağı doğru** (-Z yönünde) konumlandırılır
- Alt seviyedeki hücreler **daha düşük Z değerlerinde** (negatif Z)

**Koordinat Sistemi:**
```
Z = 0  → İlk hücre tepesi (c6)
       ↓
Z = -H → İlk hücre tabanı (a1, b1, d1)
       ↓
Z = -2H → İkinci katman (varsa)
```

**Uygulama:**
```javascript
// İlk hücre (en üst)
cell1.position.z = 0;  // c6 noktası z=0'da

// Hücre yüksekliği H ise, taban z=-H'de olur
// a1, b1, d1 noktaları z=-H seviyesinde
```

---

### ⚠️ KURAL 3: İki Ngon Sistemi (Dış/İç)

**Tarih:** 16 Ekim 2025 - YENİ SİSTEM

**Kural:** Püskül tasarımı **iki ngon** (çokgen) ile kontrol edilir:

1. **Dış Ngon (outerRadius):**
   - TÜM hücrelerin **c1 noktaları** bu ngon üzerinde
   - Varsayılan: 300 birim
   - Ayarlanabilir: 100-500 birim

2. **İç Ngon (innerRadius):**
   - TÜM hücrelerin **a1 noktaları** bu ngon üzerinde
   - Varsayılan: outerRadius × (2/3) = 200 birim
   - Ayarlanabilir: 50-400 birim

3. **Hücre Derinliği (Depth):**
   ```javascript
   depth = outerRadius - innerRadius
   ```
   - Ana hücre depth: `depth_main = outerRadius - innerRadius`
   - Ara hücre depth: `depth_inter = depth_main` (aynı!)
   - Her hücre geometrisi depth parametresiyle oluşturulur

**Görselleştirme:**
- 🟡 Sarı çokgen: Dış ngon (outerRadius) - c1 noktaları
- 🔵 İç ngon: innerRadius - a1 noktaları (görünmez ama var)
- 💚 Yeşil çizgiler: Merkezden köşelere
- 💙 Mavi çizgiler: Merkezden kenar ortalarına

---

### ⚠️ KURAL 4: Ana/Ara Hücre Sistemi

**Tarih:** 16 Ekim 2025 - YENİ SİSTEM

**Kural:** Püskül **Ana** ve **Ara** hücrelerden oluşur:

1. **Hücre Sayısı:**
   ```
   totalCells = sides × cellMultiplier
   
   cellMultiplier:
   - 1: Sadece ana hücreler (sides adet)
   - 2: Ana + 1 ara (sides × 2)
   - 3: Ana + 2 ara (sides × 3) - gelecek
   ```

2. **Corner Placement:**
   - Ana hücreler: Köşelerde (outerRadius köşe)
   - Ara hücreler: Kenar ortalarında (outerRadius kenar ortası)

3. **Edge Placement:**
   - Ana hücreler: Kenar ortalarında (outerRadius kenar ortası)
   - Ara hücreler: Köşelerde (outerRadius köşe)

**Hücre Tipleri:**
- Ana: BADEM veya YAPRAK
- Ara: FITIL, KAZAYAGI veya YOK

**Örnek (4 gen, Corner, multiplier=2):**
```
cell1: Badem (köşe, 0°)
cell2: Fitil (kenar, 45°)
cell3: Badem (köşe, 90°)
cell4: Fitil (kenar, 135°)
cell5: Badem (köşe, 180°)
cell6: Fitil (kenar, 225°)
cell7: Badem (köşe, 270°)
cell8: Fitil (kenar, 315°)
→ Toplam: 8 hücre
```

---

## 📐 Hücre Pozisyonlama Formülleri

### Köşe Yerleşimi (Corner)
```javascript
for (let i = 0; i < sides; i++) {
    const angle = (2π × i) / sides - π/2;  // -90° offset (üstten başla)
    const x = radius × cos(angle);
    const y = radius × sin(angle);
    const z = 0;  // c6 noktası z=0'da
    const rotation = angle + π/2;  // a1-c1 hattı merkeze baksın
}
```

### Kenar Yerleşimi (Edge)
```javascript
for (let i = 0; i < sides; i++) {
    const angle = (2π × i) / sides - π/2;
    const angleOffset = π / sides;  // Yarım segment ileri
    const edgeAngle = angle + angleOffset;
    
    const x = radius × cos(edgeAngle);
    const y = radius × sin(edgeAngle);
    const z = 0;  // c6 noktası z=0'da
    const rotation = edgeAngle + π/2;  // a1-c1 hattı merkeze baksın
}
```

---

## 🎯 Bağlantı Kuralları (Snap Sistemi)

**Tarih:** 16 Ekim 2025 - YENİ KURALLAR

### 🔗 Fitil-Badem Bağlantı Kuralları

**Kural:** Fitil hücresi komşu hücrelere **özel bağlanma** kurallarıyla bağlanır:

1. **Fitil.b1 → Komşu.c1 (SABİT)**
   - Fitil'in sağ noktası komşu hücrenin ön noktasına
   - Komşu.c1 **SABİT** kalır (hareket etmez)
   - Fitil.b1 komşuya doğru hareket eder

2. **Fitil.d1 → Komşu.c1 (SABİT)**
   - Fitil'in sol noktası komşu hücrenin ön noktasına
   - Komşu.c1 **SABİT** kalır (hareket etmez)
   - Fitil.d1 komşuya doğru hareket eder

3. **Fitil.a1 ← Üçlü Snap**
   ```
   Badem1.b1 ← Fitil.a1 → Badem2.d1
   ```
   - İki Badem'in yan noktaları ve Fitil'in arka noktası
   - Üçü de ortak noktaya doğru hareket eder
   - Hedef: 3 noktanın ortalaması

**Örnek:**
```
Badem (cell1) - Fitil (cell2) - Badem (cell3)

Bağlantılar:
- Badem1.c1 🔒 ← Fitil.d1
- Badem1.b1 ← Fitil.a1 → Badem3.d1 (üçlü)
- Fitil.b1 → Badem3.c1 🔒
```

### 🔗 Badem-Badem Bağlantı Kuralları

**Kural:** İki Badem yan yana olduğunda normal bağlantı:

```
Badem1.b1 ↔ Badem2.d1
```
- Her iki nokta da ortaya doğru hareket eder
- Hedef: Orta nokta

### 🎚️ Snap Davranışı

**Otomatik Tam Snap:**
- Ara hücre VARSA (FITIL, KAZAYAGI): `snapStrength = 1.0` (TAM otomatik snap)
- Kullanıcı snap ayarı devre dışı

**Ayarlanabilir Snap:**
- Ara hücre YOKSA: `snapStrength = threshold / 20` (0-20 arası slider)
- Kullanıcı snap gücünü ayarlayabilir

### Vertical (Alt-Üst Katman)
```
Üst_Hücre.a1 (z=0) === Alt_Hücre.c6 (z=-H)
Üst_Hücre.b1 === Alt_Hücre.b6
Üst_Hücre.d1 === Alt_Hücre.d6
```
Üst katman master noktaları, alt katman slave noktalarına bağlanır.

---

## 🔷 Hücre Gereksinimleri

Püskül'de kullanılacak her hücre:
- ✅ **a1 noktası** tanımlı olmalı (arka, merkeze bakar)
- ✅ **c1 noktası** tanımlı olmalı (ön, dışa bakar)
- ✅ **c6 noktası** tanımlı olmalı (tepe, z=max)
- ✅ **b1, d1 noktaları** tanımlı olmalı (yan noktalar)

Desteklenen hücre tipleri:
- ✅ **Badem (B):** Tam geometri, 16 nokta (4M+12S), basit interpolasyon
- ✅ **Yaprak (Y):** Tam geometri, 16 nokta (4M+12S), Badem benzeri
- ✅ **Fitil (F):** Karmaşık geometri, 20 nokta, yeşil-mavi çizgi kesişimleri
- ✅ **Kazayağı (K):** Placement'a göre değişken geometri, 16+ nokta

---

## 📊 Badem ve Fitil Karşılaştırması

**Tarih:** 16 Ekim 2025

### Ortak Özellikler

| Özellik | Açıklama |
|---------|----------|
| **Master Noktalar** | Her ikisinde de 4: a1, b1, c1, d1 |
| **a1 (ARKA)** | Merkeze bakar (Y=0) |
| **c1 (ÖN)** | Dışa bakar (Y=-M) |
| **b1, d1 (YAN)** | Sağ ve sol yan noktalar |
| **c6 (TEPE)** | Tepe noktası (Z=85/91×H) |
| **Z Yapısı** | 6 seviyeli (Level 1-6) |

### Kritik Farklar

| Özellik | **BADEM** | **FİTİL** |
|---------|-----------|-----------|
| **Toplam Nokta** | 14 | 20 |
| **Seviye 3** | b3, d3 (a3 YOK ❌) | a3, b3, d3 (a3 VAR ✅) |
| **Seviye 5** | b5, d5, w5, z5 | a5, b5, d5 (w5/z5 YOK) |
| **Seviye 6** | c6 | c6, b6, d6 |
| **Özel Noktalar** | w5, z5 (d4→a2, b4→a2 yolu) | x4, x5, y4, y5 (yeşil-mavi kesişim) |
| **slaveRatio** | 0.09 (9% interpolasyon) | 2.5 (mesafe, piksel) |
| **slaveRatio2** | 0.186 (18.6% interpolasyon) | 2.5 (mesafe, piksel) |
| **Geometri Türü** | Basit slave interpolasyon | Karmaşık çizgi kesişimleri |
| **Bağlanma** | Normal (b1↔d1) | Özel (b1/d1→c1, a1 üçlü) |

---

## 📝 Implementasyon Notları

### ✅ Mevcut Durum (16 Ekim 2025)

**Tamamlanan Özellikler:**
- ✅ Gen planı görselleştirme (sarı çokgen)
- ✅ Yardımcı çizgiler (yeşil köşe, mavi kenar)
- ✅ Badem geometrisi entegrasyonu
- ✅ Fitil geometrisi entegrasyonu
- ✅ 4-8 gen dinamik sistem
- ✅ Köşe/kenar yerleşim seçimi
- ✅ İki ngon sistemi (outerRadius, innerRadius)
- ✅ Ana/Ara hücre sistemi (sides × cellMultiplier)
- ✅ Otomatik hücre tipi atama
- ✅ Fitil-Badem özel bağlanma kuralları
- ✅ Üçlü snap sistemi (Fitil.a1)
- ✅ Otomatik tam snap (ara hücre varsa)
- ✅ M ile ölçekli geometri (normalized sistem kaldırıldı)
- ✅ Gerçek depth ile geometri oluşturma (scale yok)
- ✅ Z-up koordinat sistemi (c6 z=0'da)

**Parametre Sistemi:**
```javascript
outerRadius: 100-500 (varsayılan: 300)
innerRadius: 50-400 (varsayılan: outerRadius × 2/3)
sides: 4-8 (varsayılan: 4)
placement: 'corner' veya 'edge'
mainCellType: 'BADEM' veya 'YAPRAK'
interCellType: 'FITIL', 'KAZAYAGI' veya 'YOK'
cellMultiplier: 1-3 (varsayılan: 2)
H: 50-200 (yükseklik)
```

### 🔜 Gelecek Geliştirmeler

- [ ] **cellMultiplier = 3:** Ana + 2 ara hücre desteği
- [ ] **Manuel hücre tipi seçimi:** Her hücre için ayrı dropdown (opsiyonel)
- [ ] **Undo/Redo sistemi:** İşlem geçmişi
- [ ] **Animation timeline:** Katman animasyonları
- [ ] **Preset sistem:** Hazır tasarım şablonları
- [ ] **3D Export:** STL/OBJ formatında dışa aktarma
- [ ] **Texture mapping:** Malzeme ve doku desteği

### ✅ Tamamlanan Özellikler (v4.0.0)

- ✅ **Yaprak geometrisi:** Tam entegre
- ✅ **Kazayağı geometrisi:** Tam entegre
- ✅ **Fitil geometrisi:** Tam entegre
- ✅ **Çok katman sistemi:** Parent-child ilişkisi
- ✅ **Layer Transition:** Geçiş yüzeyleri
- ✅ **Cell Editor:** Hücre düzenleme paneli
- ✅ **Export/Import:** JSON formatında kaydetme
- ✅ **Custom Z Levels:** Kullanıcı kontrollü Z seviyeleri
- ✅ **Custom Boundary:** Multi-layer alignment

---

**Not:** Bu kurallar püskül geometrisinin doğru oluşturulması için kritiktir. Değişiklik yaparken bu dosyayı referans alın.

**Son Güncelleme:** Kasım 2025 - Tüm hücre tipleri entegre, katman sistemi ve cell editor tamamlandı

