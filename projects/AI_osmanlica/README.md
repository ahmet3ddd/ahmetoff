# Elifbâ — Osmanlıca Öğren

Osmanlı Türkçesini sıfırdan öğreten, tarayıcıda çalışan bir uygulama. Elifbânın 33 harfinden başlar, gerçek belge ve divan şiiri okumaya kadar gider.

**▶ Canlı demo:** https://ahmet3ddd.github.io/ahmetoff/projects/AI_osmanlica/

<img src="../../assets/shot-osmanlica.png" alt="Elifbâ — Osmanlıca Öğren" width="100%" />

## Özet

| | |
|---|---|
| **Müfredat** | 17 ünite, 73 ders — elifbâ → ünlüler ve harekeler → kelime hazinesi → dil bilgisi → okuma parçaları → divan şiiri ve belge |
| **Alıştırma** | 13 tip: öğretim kartı, çoktan seçmeli, harf şekli, dinleme, okuma yazma, kelime kurma, cümle kurma, Osmanlıca klavye, eşleştirme, doğru/yanlış, telaffuz, yazı tahtası, okuma parçası |
| **Tekrar** | SM-2 türevi aralıklı tekrar; her harf, kelime, yazım ve telaffuz maddesi ayrı izlenir |
| **İçerik** | 280 kelimelik sözlük, 9 okuma parçası, elifbâ tablosu (dört hâl, ebced, ses, örnek), 12 imlâ kuralı, 16 rozet |
| **Araçlar** | Yazı tahtası, ebced hesaplayıcı, rakam çevirici, 13 haftalık çalışma takvimi |

## Öne çıkanlar

**Yazı tahtası gerçekten puanlar.** Hedef harf gizli bir tuvale çizilip piksel maskesine dönüştürülür; sizin mürekkebiniz aynı çözünürlükte ikinci bir maske olur. Puan, *kapsama* (harfin ne kadarını çizdiniz) ile *isabet* (çizginizin ne kadarı harfin üstünde kaldı) değerlerinin harmonik ortalamasıdır — bu yüzden tuvali karalayarak geçilemez. 35 harfin tamamı ölçüldü: harfin hattını takip eden çizim ortalama 98 alırken, gelişigüzel karalama 25–37 alıyor. Geçme eşiği 65.

**Tamamen çevrimdışı.** Yazı tipleri dâhil her şey uygulamanın içinde; dış bağlantı, CDN veya ağ isteği yok. `index.html` dosyasına çift tıklamak yeterli.

**Üç düzen, tek kod.** Telefon (392×844), tablet (834×1050) ve masaüstü düzenleri arasında üst şeritten anında geçilir. Düzen medya sorgusuyla değil kabuğun kendi genişliğiyle belirlenir; yani telefon çerçevesindeki uygulama gerçekten mobil arayüzü kullanır, küçültülmüş masaüstünü değil.

## Kullanım

`index.html` dosyasına çift tıklayın. Kurulum, internet ve sunucu gerekmez.

Dosyadan (`file://`) açmanın iki sınırı var: tarayıcılar bu adresleri "güvenli bağlam" saymadığı için **mikrofonla telaffuz değerlendirmesi** çalışmaz (uygulama bunu algılayıp alıştırmayı "dinle → tekrar et → kendin onayla" biçimine çevirir) ve **ilerleme kaydedilmeyebilir**. İkisini de istiyorsanız klasörü küçük bir yerel sunucudan yayınlayın:

```bash
python -m http.server 8000    # ya da:  npx serve .
```

## Klavye kısayolları

`1`–`4` şık seçme · `Enter` kontrol/devam · `Boşluk` sesi tekrarla · `Esc` çıkış · `?` kısayol listesi
`G` öğren · `T` tekrar · `E` elifbâ · `S` sözlük · `O` okuma · `A` araçlar · `Y` yazı tahtası · `P` profil

## Ayarlar

Tema (Gece / Kâğıt), yazı tipi (Nesih / Hat / Modern) ve boyutu, ses ve konuşma hızı, günlük hedef, kalp sistemi, erişilebilirlik (yüksek kontrast, hareketi kapatma) ve ilerlemeyi JSON olarak dışa/içe aktarma.

## Yazım tercihleri

Metinlerde tek bir imlâ izlenir: ye için `ی` (U+06CC), kef için `ك` (U+0643), gef `گ`, sağır kef `ڭ`. Türkçe kelimelerde kalın/ince ünsüz ayrımı (ص/س, ط/ت, ق/ك) korunmuştur: صو (su), طاش (taş), قار (kar). Arapça ve Farsça kelimeler kendi imlâsını sürdürür.

## Teknoloji

Saf HTML/CSS/JavaScript. Dış bağımlılık yok. Bütün betikler klasik `<script>` olarak yüklenir (ES modülü yok) — `file://` üzerinde çalışmasının sebebi budur.

## Ayrıntılı belge

Mimari, dosya düzeni, alıştırma üreteci ve yapılan doğrulamalar için: [`BENİOKU.md`](BENİOKU.md)
Yazı tipi lisansları için: [`LISANSLAR.md`](LISANSLAR.md)

---

← [Tüm projeler](../../)
