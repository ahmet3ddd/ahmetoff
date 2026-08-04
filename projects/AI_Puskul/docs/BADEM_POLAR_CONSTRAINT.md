# 🎯 Badem Geometri - Polar Constraint Sistemi

## Genel Bakış

Badem geometrisinde **b1** ve **d1** master noktaları artık **polar koordinat sistemi** ile sınırlandırılmıştır. Bu sistem, noktaların her zaman belirli bir çember üzerinde kalmasını sağlar ve daha kontrollü bir düzenleme imkanı sunar.

## 📐 4 Çember Sistemi

```
┌─────────────────────────────────────┐
│                                     │
│           a1 (innerRadius=0)        │
│              ●                       │
│             ╱ ╲                      │
│            ╱   ╲                     │
│    d1 ●───────────● b1               │
│       (middleRadius çemberi)         │
│            ╲   ╱                     │
│             ╲ ╱                      │
│              ● c1 (outerRadius=M)    │
│                                     │
└─────────────────────────────────────┘
```

### Master Noktalar

| Nokta | Çember | Açıklama |
|-------|--------|----------|
| **a1** | Sabit (0, 0) | İç kenar - ARKA |
| **b1** | `middleRadius` | SAĞ - Polar constraint ile sınırlı |
| **c1** | Sabit (0, -M) | Dış kenar - ÖN |
| **d1** | `middleRadius` | SOL - Polar constraint ile sınırlı |

## 🎛️ Parametreler

### 1. middleRadius
**b1** ve **d1** için ortak çember yarıçapı.

- **Varsayılan:** `M × 0.555` (Grid plan modunda)
- **Varsayılan:** `innerRadius + depth × 0.555` (Radial plan modunda)
- **Aralık:** `0` ile `M` arası
- **Kullanım:** Nokta merkezden ne kadar uzakta olacağını kontrol eder

```javascript
const badem = new BademGeometry(
    50,    // M (depth)
    100,   // H (height)
    0.09,  // slaveRatio
    0.186, // slaveRatio2
    0.09,  // ratioZ5
    null,  // sectorAngle
    null,  // innerRadius
    null,  // outerRadius
    0,     // sectorIndex
    null,  // zLevels
    27.5   // middleRadius (YENİ!)
);
```

### 2. b1Angle
**b1** noktasının açısal pozisyonu (radyan cinsinden).

- **Varsayılan:** `-0.447 radyan` ≈ `-25.6°`
- **Aralık:** `-π` ile `π` arası
- **Kullanım:** b1 noktasının çember üzerindeki açısal konumu

```javascript
const badem = new BademGeometry(
    50,     // M
    100,    // H
    0.09,   // slaveRatio
    0.186,  // slaveRatio2
    0.09,   // ratioZ5
    null,   // sectorAngle
    null,   // innerRadius
    null,   // outerRadius
    0,      // sectorIndex
    null,   // zLevels
    27.5,   // middleRadius
    -0.447  // b1Angle (YENİ!)
);
```

### 3. d1Angle
**d1** noktasının açısal pozisyonu (radyan cinsinden).

- **Varsayılan:** `0.447 radyan` ≈ `+25.6°` (simetrik)
- **Aralık:** `-π` ile `π` arası
- **Kullanım:** d1 noktasının çember üzerindeki açısal konumu

```javascript
const badem = new BademGeometry(
    50,     // M
    100,    // H
    0.09,   // slaveRatio
    0.186,  // slaveRatio2
    0.09,   // ratioZ5
    null,   // sectorAngle
    null,   // innerRadius
    null,   // outerRadius
    0,      // sectorIndex
    null,   // zLevels
    27.5,   // middleRadius
    -0.447, // b1Angle
    0.447   // d1Angle (YENİ!)
);
```

## 🔧 Yeni API Fonksiyonları

### updateMiddleRadius()
```javascript
badem.updateMiddleRadius(30);
// b1 ve d1 noktaları otomatik olarak yeni yarıçapa güncellenir
```

### updateB1Angle()
```javascript
badem.updateB1Angle(-0.5); // -28.6°
// b1 noktası çember üzerinde yeni açıya döner
```

### updateD1Angle()
```javascript
badem.updateD1Angle(0.5); // +28.6°
// d1 noktası çember üzerinde yeni açıya döner
```

### updateMasterPoint() - Geliştirilmiş
```javascript
// b1 veya d1 güncellediğinizde otomatik polar constraint uygulanır
badem.updateMasterPoint('B-b1', 25, -15);
// → Otomatik olarak en yakın polar konuma (radius, angle) çevrilir
// → middleRadius ve b1Angle güncellenir
// → d1 noktası da aynı radius'a güncellenir (simetri korunur)
```

## 📊 Koordinat Hesaplama

### Grid Plan Modu
```javascript
effectiveMiddleRadius = middleRadius || (M × 0.555)

b1.x = effectiveMiddleRadius × cos(b1Angle)
b1.y = effectiveMiddleRadius × sin(b1Angle)

d1.x = effectiveMiddleRadius × cos(d1Angle)
d1.y = effectiveMiddleRadius × sin(d1Angle)
```

### Radial Plan Modu
```javascript
depth = outerRadius - innerRadius
effectiveMiddleRadius = middleRadius || (innerRadius + depth × 0.555)

// Aynı polar formül
b1.x = effectiveMiddleRadius × cos(b1Angle)
b1.y = effectiveMiddleRadius × sin(b1Angle)
...
```

## ✅ Avantajlar

### 1. **Kontrollü Düzenleme**
- b1 ve d1 her zaman aynı çember üzerinde kalır
- Geometrik tutarlılık garanti edilir

### 2. **Öngörülebilir Davranış**
- Açı değişince nokta çember üzerinde döner
- Radius değişince çember büyür/küçülür

### 3. **Kolay Simetri**
- `d1Angle = -b1Angle` yaparak tam simetri
- Varsayılan değerler zaten simetrik

### 4. **UI Dostu**
- Slider'larla kolay kontrol:
  - Radius slider: 0 → M
  - Açı slider: -180° → +180°

## 🎨 Örnek Kullanım Senaryoları

### Senaryo 1: Daha Geniş Açı
```javascript
const badem = new BademGeometry(50, 100);
badem.updateB1Angle(-0.6); // -34.4°
badem.updateD1Angle(0.6);  // +34.4°
// → Badem daha geniş açılmış şekle geçer
```

### Senaryo 2: Daha Derin Nokta
```javascript
const badem = new BademGeometry(50, 100);
badem.updateMiddleRadius(35); // Varsayılan: 27.5
// → b1 ve d1 noktaları daha dışarıya kayar
```

### Senaryo 3: Asimetrik Badem
```javascript
const badem = new BademGeometry(50, 100);
badem.updateB1Angle(-0.3); // -17.2°
badem.updateD1Angle(0.5);  // +28.6°
// → Sol ve sağ farklı açılarda (asimetrik)
```

## 🔍 Debug Bilgileri

Console'da polar constraint bilgileri otomatik yazdırılır:

```
🎯 Polar constraint: middleRadius=27.750, b1Angle=-25.6°, d1Angle=25.6°
✅ Grid plan (polar): b1=(0.250, -0.119), d1=(-0.250, -0.119)
```

## 📈 getStats() Çıktısı

```javascript
const stats = badem.getStats();
console.log(stats);

// Çıktı:
{
    name: 'BADEM',
    module: 50,
    height: 100,
    ...
    middleRadius: 27.75,
    b1Angle: -0.447,
    b1AngleDeg: -25.6,
    d1Angle: 0.447,
    d1AngleDeg: 25.6
}
```

## 🚨 Önemli Notlar

1. **Simetri Korunur:** Bir noktayı (b1 veya d1) değiştirdiğinizde, diğer nokta da aynı `middleRadius`'a güncellenir.

2. **Otomatik Constraint:** `updateMasterPoint()` ile b1/d1'i değiştirdiğinizde, en yakın polar konuma otomatik snap yapılır.

3. **Geriye Uyumlu:** Eski kodlar aynen çalışmaya devam eder (varsayılan değerler mevcut davranışı korur).

4. **a1 ve c1 Sabit:** Sadece b1 ve d1 polar constraint'e tabidir. a1 ve c1 serbestçe düzenlenebilir.

## 📚 İlgili Dosyalar

- `cells/badem-geometry.js` - Ana implementasyon
- `cells/README.md` - Genel hücre dokümantasyonu
- `app.js` - Püskül viewer (polar parametreleri UI'ye eklenebilir)

---

**Versiyon:** 1.0.0  
**Son Güncelleme:** 2025-01-17  
**Yazar:** Püskül 3D Viewer Geliştirme Ekibi


