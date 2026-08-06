# Elifbâ — Osmanlıca Öğrenme Uygulaması

Osmanlı Türkçesini sıfırdan öğreten, Duolingo tarzı bir uygulama.
Elifbânın 33 harfinden başlar, gerçek belge ve şiir okumaya kadar gider.

## Nasıl açılır

`index.html` dosyasına çift tıklayın. Kurulum, internet ve sunucu gerekmez —
yazı tipleri dâhil her şey uygulamanın içindedir.

Uygulama üç biçimde çalışır ve üst şeritten anında geçilir:

| Biçim | Ne olur |
|---|---|
| **Telefon** | Uygulama 392×844 telefon çerçevesine girer, alt sekme çubuğu ve üst durum şeridiyle |
| **Tablet** | 834×1050 çerçeve, ikon menülü yan sütun |
| **Masaüstü** | Tam ekran; solda menü, ortada içerik, sağda günlük özet |

Düzen medya sorgusuyla değil kabuğun kendi genişliğiyle belirlenir; bu yüzden
telefon çerçevesindeki uygulama gerçekten mobil arayüzü kullanır, küçültülmüş
masaüstü arayüzünü değil.

### Dosyadan açmanın tek sınırı

Tarayıcılar `file://` adreslerini “güvenli bağlam” saymaz. Bunun iki sonucu var:

- **Mikrofonla telaffuz değerlendirmesi çalışmaz.** Uygulama bunu baştan algılar
  ve telaffuz alıştırmasını “dinle → tekrar et → kendin onayla” biçimine çevirir.
- **İlerleme kaydedilmeyebilir.** Tarayıcı yerel depolamayı kapatırsa uygulama
  bellekte çalışmayı sürdürür; Ayarlar → Veriler bölümünde bunu size bildirir ve
  çalışmanızı dosyaya aktarmanızı önerir.

Her iki özelliği de istiyorsanız klasörü küçük bir yerel sunucudan yayınlayın:

```
cd C:\AI_osmanlıca
python -m http.server 8000      # ya da:  npx serve .
```
Sonra `http://localhost:8000` adresini açın.

## İçindekiler

**Müfredat** — 17 ünite, 73 ders. Elifbâ (7 ünite) → ünlüler ve harekeler →
kelime hazinesi → dil bilgisi → okuma parçaları → divan şiiri ve belge.

**13 alıştırma tipi**

| Tip | Ne yapar |
|---|---|
| Öğretim kartı | Yeni harf/kelime/kuralı dört hâli, sesi ve örneğiyle tanıtır |
| Çoktan seçmeli | İki yönlü: Osmanlıca→anlam ve anlam→Osmanlıca |
| Harf şekli | Bir harfin başta/ortada/sonda hâlini seçtirir |
| Dinleme | Sesi duyup doğru yazımı seçtirir (yavaş tekrar seçenekli) |
| Okuma yazma | Osmanlıca kelimeyi Latin harfleriyle yazdırır |
| Kelime kurma | Karışık harfleri sağdan sola dizdirir, bitişik hâlini canlı gösterir |
| Cümle kurma | Kelime bankasından Osmanlıca cümle kurdurur |
| Osmanlıca klavye | 36 tuşluk elifbâ klavyesiyle kelime yazdırır |
| Eşleştirme | Beş çifti eşleştirir |
| Doğru/Yanlış | İmlâ kurallarını sınar |
| Telaffuz | Mikrofonla söyleyişi ölçer (benzerlik puanı) |
| Yazı tahtası | Harfin üstünden geçmenizi ister ve **gerçekten puanlar** |
| Okuma parçası | Kelimeye dokununca anlamı çıkar; okunuş ve çeviri açılıp kapanır |

**Yazı tahtası nasıl puanlar.** Hedef harf gizli bir tuvale çizilip piksel
maskesine dönüştürülür. Sizin mürekkebiniz aynı çözünürlükte ikinci bir maske
olur. İki maske genişletilip karşılaştırılır:

- *kapsama* — harfin ne kadarını çizdiniz
- *isabet* — çizginizin ne kadarı harfin üstünde kaldı

Puan ikisinin harmonik ortalamasıdır. Bu yüzden tuvali karalayarak yüksek puan
alınamaz: kapsama yükselse de isabet düşer.

35 harfin tamamı ölçüldü. Harfin hattını takip eden çizim **90–100** alıyor
(ortalama 98, hepsi geçiyor). Buna karşılık gelişigüzel karalama **25–37**,
harfin şeklini izlemeyen düz bir çizgi **61**, birkaç noktalık iz **3** alıyor.
Geçme eşiği **65** — dolayısıyla gerçekten yazmadan geçilemiyor.

**Aralıklı tekrar.** Her harf, kelime, yazım ve telaffuz maddesi SM‑2 türevi bir
çizelgeyle ayrı ayrı izlenir. Yanlış bilinen madde bugüne, doğru bilinen madde
giderek uzayan aralıklara atanır. “Tekrar” sekmesi vadesi gelenleri toplar.

**Diğer bölümler** — elifbâ tablosu (dört hâl, ebced değeri, ses, örnek),
280 kelimelik sözlük (Osmanlıca/okunuş/Türkçe arama, köken ve konu süzgeci),
9 okuma parçası, ebced hesaplayıcı, rakam çevirici, 12 imlâ kuralı kartı,
16 rozet, 13 haftalık çalışma takvimi.

## Ayarlar

- **Tema** — Gece (lâcivert) · Kâğıt (âharlı kâğıt tonu)
- **Yazı tipi** — Nesih · Hat · Modern; boyutu ayrıca ölçeklenir
- **Ses** — efektler, konuşma hızı, sistemdeki Türkçe sesin seçimi
- **Öğrenme** — günlük hedef, kalp sistemi (kapatılabilir), bütün dersleri açma
- **Erişilebilirlik** — yüksek kontrast, hareketi kapatma, klavye ipuçları
- **Veriler** — ilerlemeyi JSON olarak dışa/içe aktarma, sıfırlama

## Klavye kısayolları

`1`–`4` şık seçme · `Enter` kontrol/devam · `Boşluk` sesi tekrarla ·
`Esc` çıkış · `?` kısayol listesi · `G` öğren · `T` tekrar · `E` elifbâ ·
`S` sözlük · `O` okuma · `A` araçlar · `Y` yazı tahtası · `P` profil

## Yazım tercihleri

Metinlerde tek bir imlâ izlenir: ye için `ی` (U+06CC), kef için `ك` (U+0643),
gef `گ`, sağır kef `ڭ`. Türkçe kelimelerde kalın/ince ünsüz ayrımı
(ص/س, ط/ت, ق/ك) korunmuştur: صو (su), طاش (taş), قار (kar).
Arapça ve Farsça kelimeler kendi imlâsını sürdürür.

## Dosya düzeni

```
index.html                 kabuk + ikon kütüphanesi
assets/css/fonts.css       gömülü Arapça yazı tipleri (base64)
assets/css/app.css         tasarım dizgesi ve bütün ekranlar
assets/js/data-letters.js  33 harf, harekeler, rakamlar, ebced
assets/js/data-vocab.js    280 kelime
assets/js/data-content.js  kalıplar, cümleler, 9 okuma parçası, kurallar, rozetler
assets/js/curriculum.js    17 ünite, 73 ders ve alıştırma üreteci
assets/js/store.js         ilerleme, kalp, seri, ayarlar
assets/js/audio.js         ses efektleri, seslendirme, konuşma tanıma
assets/js/srs.js           aralıklı tekrar çizelgesi
assets/js/writing.js       yazı tahtası ve piksel puanlaması
assets/js/exercises.js     13 alıştırma tipi
assets/js/screens.js       ekranlar ve ders motoru
assets/js/app.js           yönlendirme, çerçeve, kısayollar
```

Bütün betikler klasik `<script>` olarak yüklenir (ES modülü yok); `file://`
üzerinde çalışmasının sebebi budur. Dış bağlantı, CDN veya ağ isteği yoktur.

## Yapılan doğrulamalar

Uygulama tarayıcıda otomatik olarak baştan sona oynatılarak sınandı:

- **73 dersin tamamı** + aralıklı tekrar, yanlışlar ve karışık sınav oturumları
  uçtan uca çözüldü — 860'ın üzerinde alıştırma, 12 tip, konsolda tek bir hata yok.
- **Alıştırma üreteci** node üzerinde 6.500 alıştırma üretecek şekilde koşturuldu;
  yinelenen şık, cevapsız soru veya boş ders çıkmadı.
- **35 harfin tamamı** yazı tahtasında ölçüldü; hepsi geçer puan aldı (ort. 98).
  Karalama ve şekli izlemeyen çizimlerin elendiği ayrıca doğrulandı.
- **Üç ekran biçimi** (telefon 374 px · tablet 816 px · masaüstü 1920 px) ve
  dokuz ekranın tamamı; her birinde isimsiz düğme, etiketsiz girdi ve
  klavyeyle erişilemeyen öğe kalmadığı denetlendi.

## Lisanslar

Gömülü yazı tipleri SIL Open Font License 1.1 ile dağıtılır — ayrıntı için
`LISANSLAR.md`.
