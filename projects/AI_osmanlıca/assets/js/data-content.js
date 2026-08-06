/* ══ Kalıp ifadeler, cümleler, okuma parçaları, kurallar, rozetler ══ */

/* ── Günlük kalıplar ── */
var PHRASES = [
  {o:'السلام علیكم', t:'es-selâmü ʿaleyküm', m:'Selam sizin üzerinize olsun', th:'selam', lv:1},
  {o:'و علیكم السلام', t:'ve ʿaleykümü’s-selâm', m:'Selam sizin de üzerinize olsun', th:'selam', lv:1},
  {o:'خوش گلدیڭز', t:'hoş geldiñiz', m:'Hoş geldiniz', th:'selam', lv:1},
  {o:'خوش بولدق', t:'hoş bulduk', m:'Hoş bulduk', th:'selam', lv:1},
  {o:'ناصلسڭز', t:'nasılsıñız', m:'Nasılsınız?', th:'selam', lv:2},
  {o:'تشكر ایدرم', t:'teşekkür iderim', m:'Teşekkür ederim', th:'selam', lv:2},
  {o:'بیورڭ', t:'buyuruñ', m:'Buyurun', th:'selam', lv:2},
  {o:'آدڭز نه‌در', t:'adıñız nedir', m:'Adınız nedir?', th:'selam', lv:2},
  {o:'صباح شریفلر خیر اولسون', t:'sabâh-ı şerîfler hayr olsun', m:'Günaydın (klasik selam)', th:'selam', lv:3},
  {o:'الله اسمارلادق', t:'Allâh’a ısmarladık', m:'Allahaısmarladık', th:'selam', lv:3},
  {o:'كوله كوله', t:'güle güle', m:'Güle güle', th:'selam', lv:1},
  {o:'ما شاء الله', t:'mâ-şâʾallâh', m:'Maşallah', th:'selam', lv:2},
  {o:'ان شاء الله', t:'in-şâʾallâh', m:'İnşallah', th:'selam', lv:2},
  {o:'افندم', t:'efendim', m:'Efendim', th:'selam', lv:1},
  {o:'سلامتله', t:'selâmetle', m:'Selametle, esenlikle', th:'selam', lv:3}
];

/* ── Cümle kurma alıştırmaları (kelime bankası) ── */
var SENTENCES = [
  {tok:['بن','كتاب','اوقورم'], t:'Ben kitâb okurum', m:'Ben kitap okurum', lv:1},
  {tok:['او','صو','ایچر'], t:'O su içer', m:'O su içer', lv:1},
  {tok:['بز','اوه','كیدرز'], t:'Biz eve gideriz', m:'Biz eve gideriz', lv:2},
  {tok:['بابام','چارشویه','كتدی'], t:'Babam çarşuya gitdi', m:'Babam çarşıya gitti', lv:2},
  {tok:['كوزل','بر','كون'], t:'Güzel bir gün', m:'Güzel bir gün', lv:1},
  {tok:['بو','كتاب','بنمدر'], t:'Bu kitâb benimdir', m:'Bu kitap benimdir', lv:2},
  {tok:['قوشلر','كوكده','اوچار'], t:'Kuşlar gökde uçar', m:'Kuşlar gökte uçar', lv:2},
  {tok:['آنام','اوده','اوتورور'], t:'Anam evde oturur', m:'Annem evde oturur', lv:2},
  {tok:['طالبه','درسنی','یازدی'], t:'Talebe dersini yazdı', m:'Öğrenci dersini yazdı', lv:3},
  {tok:['دڭز','چوق','درین','در'], t:'Deñiz çok derindir', m:'Deniz çok derindir', lv:3},
  {tok:['كونش','صباحله','طوغار'], t:'Güneş sabâhla doğar', m:'Güneş sabahleyin doğar', lv:3},
  {tok:['وطن','سوگیسی','ایماندندر'], t:'Vatan sevgisi îmândandır', m:'Vatan sevgisi imandandır', lv:4},
  {tok:['كتابی','معلمه','ویردم'], t:'Kitâbı muʿallime virdim', m:'Kitabı öğretmene verdim', lv:4},
  {tok:['بو','یول','شهره','كیدر'], t:'Bu yol şehre gider', m:'Bu yol şehre gider', lv:3}
];

/* ── Okuma parçaları ──
   tok: [Osmanlıca, transkripsiyon, anlam]  ·  tr: bugünkü Türkçesi              */
var PASSAGES = [
  {
    id:'p-selam', title:'İlk Karşılaşma', kind:'Diyalog', lv:1,
    intro:'İki kişinin selamlaşması. Kelimelerin üzerine dokunarak anlamlarını görebilirsiniz.',
    lines:[
      {tok:[['السلام','es-selâmü','selam'],['علیكم','ʿaleyküm','sizin üzerinize']], tr:'Selamünaleyküm.'},
      {tok:[['و','ve','ve'],['علیكم','ʿaleyküm','sizin üzerinize'],['السلام','es-selâm','selam']], tr:'Ve aleykümselam.'},
      {tok:[['ناصلسڭز','nasılsıñız','nasılsınız'],['افندم','efendim','efendim']], tr:'Nasılsınız efendim?'},
      {tok:[['ایویم','eyüyüm','iyiyim'],['شكر','şükr','şükür'],['اولسون','olsun','olsun']], tr:'İyiyim, şükür olsun.'},
      {tok:[['آدڭز','adıñız','adınız'],['نه‌در','nedir','nedir']], tr:'Adınız nedir?'},
      {tok:[['بنم','benim','benim'],['آدم','adım','adım'],['احمد','Ahmed','Ahmet']], tr:'Benim adım Ahmet.'}
    ],
    q:[{q:'“ناصلسڭز” ne demektir?', a:['Nasılsınız?','Nerelisiniz?','Ne zaman?','Kaç yaşındasınız?'], c:0},
       {q:'“شكر اولسون” ifadesinin karşılığı nedir?', a:['Şükür olsun','Selam olsun','Hoş geldiniz','Sağ olun'], c:0}]
  },
  {
    id:'p-ev', title:'Bizim Ev', kind:'Kısa metin', lv:2,
    intro:'Basit isim ve fiillerle kurulmuş bir tasvir metni.',
    lines:[
      {tok:[['بزم','bizim','bizim'],['اومز','evimiz','evimiz'],['كوچك','küçük','küçük'],['اما','ammâ','ama'],['كوزلدر','güzeldir','güzeldir']], tr:'Bizim evimiz küçük ama güzeldir.'},
      {tok:[['باغچه‌ده','bâğçede','bahçede'],['بر','bir','bir'],['آغاج','ağaç','ağaç'],['واردر','vardır','vardır']], tr:'Bahçede bir ağaç vardır.'},
      {tok:[['آغاجڭ','ağacıñ','ağacın'],['آلتنده','altında','altında'],['بر','bir','bir'],['چشمه','çeşme','çeşme'],['آقار','akar','akar']], tr:'Ağacın altında bir çeşme akar.'},
      {tok:[['صباحله‌ین','sabâhleyin','sabahleyin'],['قوشلر','kuşlar','kuşlar'],['اوتر','öter','öter']], tr:'Sabahleyin kuşlar öter.'},
      {tok:[['بابام','babam','babam'],['قهوه‌سنی','kahvesini','kahvesini'],['اوراده','orada','orada'],['ایچر','içer','içer']], tr:'Babam kahvesini orada içer.'}
    ],
    q:[{q:'Bahçede ne vardır?', a:['Bir ağaç','Bir kuş','Bir kapı','Bir kitap'], c:0},
       {q:'“اوتر” fiili ne anlama gelir?', a:['Öter','Oturur','Uyur','Uçar'], c:0}]
  },
  {
    id:'p-atasozu', title:'Atasözleri', kind:'Atasözü', lv:2,
    intro:'Beş yaygın atasözü. Her biri kısa olduğu için okuma alıştırmasına çok uygundur.',
    lines:[
      {tok:[['صبر','sabr','sabır'],['آجیدر','acıdır','acıdır'],['میوه‌سی','meyvesi','meyvesi'],['طاتلیدر','tatlıdır','tatlıdır']], tr:'Sabır acıdır, meyvesi tatlıdır.'},
      {tok:[['طاملایه','damlaya','damlaya'],['طاملایه','damlaya','damlaya'],['كول','göl','göl'],['اولور','olur','olur']], tr:'Damlaya damlaya göl olur.'},
      {tok:[['بر','bir','bir'],['الڭ','eliñ','elin'],['نه‌سی','nesi','nesi'],['وار','var','var'],['ایكی','iki','iki'],['الڭ','eliñ','elin'],['سسی','sesi','sesi'],['وار','var','var']], tr:'Bir elin nesi var, iki elin sesi var.'},
      {tok:[['ایت','it','it, köpek'],['اورور','ürür','ürür'],['كروان','kervân','kervan'],['یورور','yürür','yürür']], tr:'İt ürür, kervan yürür.'},
      {tok:[['عجله','ʿacele','acele'],['ایشه','işe','işe'],['شیطان','şeytân','şeytan'],['قاریشیر','karışır','karışır']], tr:'Acele işe şeytan karışır.'}
    ],
    q:[{q:'“طاملایه طاملایه كول اولور” hangi anlamı taşır?', a:['Az az biriken şey çoğalır','Acele etmek gerekir','Su hayattır','Yalnız çalışmak zordur'], c:0},
       {q:'“ایت اورور، كروان یورور” sözünde “یورور” ne demektir?', a:['Yürür','Uyur','Görür','Yorulur'], c:0}]
  },
  {
    id:'p-yunus', title:'Yunus Emre’den', kind:'Şiir', lv:3,
    intro:'Yunus Emre’ye nispet edilen meşhur dörtlük. Sade Türkçesiyle ilk okuma şiirleri arasında en uygunudur.',
    lines:[
      {tok:[['مال','mâl','mal'],['صاحبی','sâhibi','sahibi'],['ملك','mülk','mülk'],['صاحبی','sâhibi','sahibi']], tr:'Mal sahibi, mülk sahibi.'},
      {tok:[['هانی','hani','hani'],['بونڭ','bunuñ','bunun'],['ایلك','ilk','ilk'],['صاحبی','sâhibi','sahibi']], tr:'Hani bunun ilk sahibi?'},
      {tok:[['مال','mâl','mal'],['ده','da','da'],['یالان','yalan','yalan'],['ملك','mülk','mülk'],['ده','de','de'],['یالان','yalan','yalan']], tr:'Mal da yalan, mülk de yalan.'},
      {tok:[['وار','var','var'],['براز','birâz','biraz'],['ده','da','da'],['سن','sen','sen'],['اویالان','oyalan','oyalan']], tr:'Var biraz da sen oyalan.'}
    ],
    q:[{q:'Şiirde tekrarlanan kelime hangisidir?', a:['صاحبی (sahibi)','كوڭل (gönül)','دنیا (dünya)','یول (yol)'], c:0},
       {q:'“هانی” kelimesi ne anlama gelir?', a:['Hani, nerede','Han sahibi','Hangi gün','Hanım'], c:0}]
  },
  {
    id:'p-fuzuli', title:'Fuzûlî’den Bir Beyit', kind:'Şiir', lv:4,
    intro:'Divan şiirinin en çok bilinen beyitlerinden. Arapça ve Farsça kelimelerin ağırlığına dikkat edin.',
    lines:[
      {tok:[['عشق','ʿaşk','aşk'],['ایمش','imiş','imiş'],['هر','her','her'],['نه','ne','ne'],['وار','var','var'],['عالمده','ʿâlemde','âlemde']], tr:'Aşk imiş her ne var âlemde.'},
      {tok:[['علم','ʿilm','ilim'],['بر','bir','bir'],['قیل','kîl','söz, dedikodu'],['و','ü','ve'],['قال','kāl','laf'],['ایمش','imiş','imiş'],['انجق','ancak','ancak']], tr:'İlim bir kîl ü kâl imiş ancak.'}
    ],
    q:[{q:'Beyitte “عشق” hangi kelimedir?', a:['Aşk','İlim','Âlem','Kâl'], c:0},
       {q:'“عالمده” kelimesindeki ek nedir?', a:['Bulunma hâli -de','Çıkma hâli -den','Yönelme hâli -e','Çokluk eki -ler'], c:0}]
  },
  {
    id:'p-namik', title:'Nâmık Kemal’den', kind:'Şiir', lv:5,
    intro:'Hürriyet Kasidesi’nin en meşhur mısraı. Terkipli (tamlamalı) yapıya örnektir.',
    lines:[
      {tok:[['نه','ne','ne'],['ممكن','mümkin','mümkün'],['ظلم','zulm','zulüm'],['ایله','ile','ile'],['بیداد','bîdâd','zulüm, haksızlık'],['ایله','ile','ile'],['امحای','imhâ-yı','yok edilmesi'],['حریت','hürriyet','hürriyet']], tr:'Ne mümkün zulm ile bîdâd ile imhâ-yı hürriyet.'},
      {tok:[['چالش','çalış','çalış'],['ادراكی','idrâki','idraki'],['قالدر','kaldır','kaldır'],['مقتدرسه‌ڭ','muktedirseñ','muktedirsen'],['آدمیتدن','âdemiyyetden','insanlıktan']], tr:'Çalış idraki kaldır muktedirsen âdemiyyetten.'}
    ],
    q:[{q:'“امحای حریت” nasıl bir yapıdır?', a:['Farsça isim tamlaması (izâfet)','Türkçe çoğul','Arapça çoğul','Fiil çekimi'], c:0},
       {q:'“ممكن” kelimesinin okunuşu hangisidir?', a:['mümkin','mümkün-siz','mekân','müemmen'], c:0}]
  },
  {
    id:'p-hoca', title:'Nasreddin Hoca', kind:'Fıkra', lv:3,
    intro:'Kısa bir fıkra. Geçmiş zaman çekimlerini görmek için iyi bir metindir.',
    lines:[
      {tok:[['بر','bir','bir'],['كون','gün','gün'],['خواجه‌یه','hôcaya','hocaya'],['صورمشلر','sormuşlar','sormuşlar']], tr:'Bir gün hocaya sormuşlar:'},
      {tok:[['خواجه','hôca','hoca'],['دنیانڭ','dünyânıñ','dünyanın'],['مركزی','merkezi','merkezi'],['نره‌دهدر','neredededir','nerededir']], tr:'— Hoca, dünyanın merkezi neresidir?'},
      {tok:[['خواجه','hôca','hoca'],['اشگنڭ','eşegiñ','eşeğin'],['اون','ön','ön'],['آیاغنی','ayağını','ayağını'],['كوسترمش','göstermiş','göstermiş']], tr:'Hoca eşeğin ön ayağını göstermiş:'},
      {tok:[['تام','tam','tam'],['بوراسیدر','burasıdır','burasıdır'],['اینانمازسه‌ڭز','inanmazsañız','inanmazsanız'],['اولچڭ','ölçüñ','ölçün']], tr:'— Tam burasıdır; inanmazsanız ölçün.'}
    ],
    q:[{q:'Hoca neyi göstermiş?', a:['Eşeğin ön ayağını','Kendi evini','Gökyüzünü','Bir kitabı'], c:0},
       {q:'“صورمشلر” fiilinin zamanı nedir?', a:['Öğrenilen geçmiş zaman','Şimdiki zaman','Gelecek zaman','Geniş zaman'], c:0}]
  },
  {
    id:'p-marş', title:'İstiklâl Marşı — İlk Beyit', kind:'Şiir', lv:4,
    intro:'Mehmed Âkif Ersoy, 1921. Marş ilk yazıldığında bu harflerle basılmıştı.',
    lines:[
      {tok:[['قورقما','korkma','korkma'],['سونمز','sönmez','sönmez'],['بو','bu','bu'],['شفقلرده','şafaklarda','şafaklarda'],['یوزن','yüzen','yüzen'],['آل','al','al (kırmızı)'],['صانجاق','sancak','sancak']], tr:'Korkma, sönmez bu şafaklarda yüzen al sancak.'},
      {tok:[['سونمه‌دن','sönmeden','sönmeden'],['یوردمڭ','yurdumuñ','yurdumun'],['اوستنده','üstünde','üstünde'],['توتن','tüten','tüten'],['اڭ','eñ','en'],['صوڭ','soñ','son'],['اوجاق','ocak','ocak']], tr:'Sönmeden yurdumun üstünde tüten en son ocak.'}
    ],
    q:[{q:'“صانجاق” kelimesinin anlamı nedir?', a:['Sancak, bayrak','Şafak','Ocak','Yurt'], c:0},
       {q:'“صوڭ” kelimesindeki ڭ harfi neyi gösterir?', a:['Geniz n sesi','Kalın k sesi','Yumuşak g','Uzun a'], c:0}]
  },
  {
    id:'p-mezar', title:'Bir Mezar Taşı', kind:'Belge', lv:5,
    intro:'Mezar taşı kitâbeleri, Osmanlıca okumaya başlayanların en sık karşılaştığı gerçek metinlerdir. Tarih hicrî yazılır.',
    lines:[
      {tok:[['هو','hû','O (Allah)'],['الباقی','el-bâkī','bâki olan']], tr:'Hüve’l-bâkī (Bâki olan O’dur).'},
      {tok:[['مرحوم','merhûm','rahmete kavuşmuş'],['و','ve','ve'],['مغفور','mağfûr','bağışlanmış'],['له','leh','ona']], tr:'Merhum ve mağfurun leh.'},
      {tok:[['روحنه','rûhuna','ruhuna'],['فاتحه','fâtiha','Fâtiha']], tr:'Ruhuna Fâtiha.'},
      {tok:[['سنه','sene','sene'],['١٢٩٥','1295','1295']], tr:'Sene 1295 (hicrî).'}
    ],
    q:[{q:'“هو الباقی” ifadesi taşın neresinde bulunur?', a:['En üstte, başlık olarak','En altta','Ortada','Arka yüzde'], c:0},
       {q:'Taştaki ١٢٩٥ sayısı hangi rakamlarla yazılmıştır?', a:['Osmanlı (Arap) rakamlarıyla','Roma rakamlarıyla','Latin rakamlarıyla','Ebced harfleriyle'], c:0}]
  }
];

/* ── Dil bilgisi / imlâ kuralları ── */
var RULES = [
  { id:'r-unlu', t:'Ünlüler çoğu zaman yazılmaz', ic:'i-sparkle',
    d:'Osmanlıcada kısa ünlüler (a, e, ı, i) genellikle hiç yazılmaz. Okuyucu kelimeyi tanıyarak tamamlar. Uzun ünlüler ise harfle gösterilir.',
    ex:[{o:'بن', t:'ben'}, {o:'كل', t:'gel'}, {o:'بر', t:'bir'}] },
  { id:'r-kalin', t:'Kalın ve ince ünsüz çiftleri', ic:'i-target',
    d:'Türkçe kelimede kalın ünlü varsa kalın ünsüz harfi yazılır. Bu, ünlüsü yazılmayan kelimenin nasıl okunacağını gösteren en güçlü ipucudur.',
    ex:[{o:'صو', t:'su — sad (kalın s)'}, {o:'سن', t:'sen — sin (ince s)'}, {o:'طاش', t:'taş — tı (kalın t)'}, {o:'تن', t:'ten — te (ince t)'}, {o:'قار', t:'kar — kaf (kalın k)'}, {o:'كل', t:'gel — kef (ince k)'}] },
  { id:'r-vav', t:'Yuvarlak ünlülerin tamamı: و', ic:'i-eye',
    d:'o, ö, u, ü seslerinin dördü de tek bir harfle, vav ile yazılır. Hangi ünlünün okunacağını kelime bilgisi belirler.',
    ex:[{o:'اون', t:'on / un'}, {o:'كوز', t:'göz / güz'}, {o:'قول', t:'kol / kul'}] },
  { id:'r-ye', t:'ı ve i için: ی', ic:'i-eye',
    d:'ı ve i ünlüleri, uzun okunduklarında veya kelime sonunda ی ile gösterilir. Aynı harf y ünsüzünü de karşılar.',
    ex:[{o:'ایكی', t:'iki'}, {o:'یول', t:'yol'}, {o:'اسكی', t:'eski'}] },
  { id:'r-he', t:'Kelime sonundaki ه', ic:'i-quill',
    d:'Kelime sonunda yazılan ه çoğunlukla h değil, a veya e okunur. Bu, Arapça ve Farsça kelimelerde de böyledir.',
    ex:[{o:'قلعه', t:'kalʿa'}, {o:'پرده', t:'perde'}, {o:'مدرسه', t:'medrese'}] },
  { id:'r-mastar', t:'Mastar ekleri: ‑مق / ‑مك', ic:'i-pen',
    d:'Fiil mastarları kalın ünlülü kelimelerde ‑مق, ince ünlülü kelimelerde ‑مك ile yazılır. Ünlü uyumunun yazıya yansıdığı en düzenli kuraldır.',
    ex:[{o:'یازمق', t:'yazmak'}, {o:'كلمك', t:'gelmek'}, {o:'اوقومق', t:'okumak'}, {o:'بیلمك', t:'bilmek'}] },
  { id:'r-nef', t:'Sağır kef: ڭ', ic:'i-ear',
    d:'Eski Türkçenin genizden gelen ñ sesini gösterir. Bugün n olarak okunur. İkinci tekil/çoğul şahıs eklerinde çok sık görülür.',
    ex:[{o:'دڭز', t:'deñiz → deniz'}, {o:'بیڭ', t:'biñ → bin'}, {o:'كلدیڭز', t:'geldiñiz → geldiniz'}] },
  { id:'r-tarif', t:'Arapça harf‑i tarif: ال', ic:'i-book',
    d:'Arapça kelimelerin başındaki ال belirlilik ekidir. Kendisinden sonra “şemsî harf” gelirse okunmaz, sonraki harf şeddelenir.',
    ex:[{o:'الكتاب', t:'el‑kitâb'}, {o:'السلام', t:'es‑selâm (şemsî)'}, {o:'القمر', t:'el‑kamer (kamerî)'}] },
  { id:'r-izafet', t:'Farsça terkip (izâfet)', ic:'i-crown',
    d:'İki kelime arasına konan esre (‑i / ‑ı) tamlama kurar. Tamlanan başta, tamlayan sonda gelir — Türkçenin tam tersi.',
    ex:[{o:'كتاب خانه', t:'kitâb‑hâne → kütüphane'}, {o:'حسن خط', t:'hüsn‑i hat → yazı güzelliği'}, {o:'اهل دل', t:'ehl‑i dil → gönül ehli'}] },
  { id:'r-nispet', t:'Nispet ‑î', ic:'i-star',
    d:'Kelime sonuna gelen ی, “‑e ait, ‑ile ilgili” anlamı katar ve daima uzun î okunur. Türkçe ‑lı/‑li ekiyle karıştırmayın.',
    ex:[{o:'ملی', t:'millî'}, {o:'ادبی', t:'edebî'}, {o:'علمی', t:'ʿilmî'}] },
  { id:'r-cogul', t:'Arapça çoğullar', ic:'i-grid',
    d:'Arapça kelimeler Türkçedeki gibi ‑ler/‑lar almaz; kendi kalıplarıyla çoğul olur. Bunları kalıp hâlinde tanımak gerekir.',
    ex:[{o:'كتب', t:'kütüb ← kitâb'}, {o:'علوم', t:'ʿulûm ← ʿilm'}, {o:'اخبار', t:'ahbâr ← haber'}] },
  { id:'r-ebced', t:'Ebced ve tarih düşürme', ic:'i-abacus',
    d:'Her harfin bir sayı değeri vardır. Şairler bir mısraın harf değerlerini toplayarak olayın hicrî yılını gizlerdi. Buna “tarih düşürmek” denir.',
    ex:[{o:'ا = ١', t:'elif = 1'}, {o:'ب = ٢', t:'be = 2'}, {o:'ج = ٣', t:'cim = 3'}, {o:'د = ٤', t:'dal = 4'}] }
];

/* ── Rozetler ── */
var ACHIEVEMENTS = [
  { id:'ilk-ders',  m:'۞', t:'İlk Adım',        d:'İlk dersini tamamla',                  chk:function(s){ return s.stats.lessons >= 1; } },
  { id:'on-ders',   m:'✦', t:'Yola Girdi',      d:'10 ders tamamla',                      chk:function(s){ return s.stats.lessons >= 10; } },
  { id:'elifba',    m:'ا', t:'Elifbâ Ehli',     d:'Elifbâ ünitelerinin tamamını bitir',   chk:function(s){ return Curriculum.unitsDone(s, ['u1','u2','u3','u4','u5','u6','u7']); } },
  { id:'kusursuz',  m:'★', t:'Kusursuz',        d:'Bir dersi hiç hata yapmadan bitir',    chk:function(s){ return s.stats.perfect >= 1; } },
  { id:'seri-3',    m:'🔥', t:'Üç Gün',          d:'3 günlük seri yap',                    chk:function(s){ return s.streakBest >= 3; } },
  { id:'seri-7',    m:'☾', t:'Bir Hafta',       d:'7 günlük seri yap',                    chk:function(s){ return s.streakBest >= 7; } },
  { id:'seri-30',   m:'⌘', t:'Bir Ay',          d:'30 günlük seri yap',                   chk:function(s){ return s.streakBest >= 30; } },
  { id:'xp-500',    m:'◈', t:'500 Puan',        d:'Toplam 500 XP topla',                  chk:function(s){ return s.xp >= 500; } },
  { id:'xp-2500',   m:'❖', t:'2500 Puan',       d:'Toplam 2500 XP topla',                 chk:function(s){ return s.xp >= 2500; } },
  { id:'kelime-50', m:'✎', t:'Elli Kelime',     d:'50 kelimeyi hâfızana al',              chk:function(s){ return SRS.knownCount(s) >= 50; } },
  { id:'kelime-150',m:'✒', t:'Kelime Hazinesi', d:'150 kelimeyi hâfızana al',             chk:function(s){ return SRS.knownCount(s) >= 150; } },
  { id:'hattat',    m:'✍', t:'Hattat',          d:'Yazı tahtasında %85 üstü puan al',     chk:function(s){ return s.stats.bestWrite >= 85; } },
  { id:'hafiz',     m:'♪', t:'Kulak Dolgunluğu',d:'50 dinleme sorusunu doğru bilmiş ol',  chk:function(s){ return (s.stats.byType.listen||0) >= 50; } },
  { id:'natik',     m:'☊', t:'Nâtık',           d:'25 telaffuz alıştırmasını geç',        chk:function(s){ return (s.stats.byType.speak||0) >= 25; } },
  { id:'karii',     m:'❡', t:'Kāri’',           d:'Bütün okuma parçalarını bitir',        chk:function(s){ return Object.keys(s.readDone||{}).length >= PASSAGES.length; } },
  { id:'muverrih',  m:'٭', t:'Müverrih',        d:'Ebced hesabını 10 kez kullan',         chk:function(s){ return (s.stats.ebced||0) >= 10; } }
];

/* ── Uygulama ipuçları ── */
var TIPS = [
  'Osmanlıcada kısa ünlüler yazılmaz; kelimeyi tanımak okumanın yarısıdır.',
  'Bir kelimeyi kalın mı ince mi okuyacağınızı ص/س, ط/ت, ق/ك çiftleri söyler.',
  'Sonrasına bağlanmayan yedi harf vardır: ا د ذ ر ز ژ و — bunları ezberleyin.',
  'Kelime sonundaki ه çoğunlukla “e” okunur: مدرسه → medrese.',
  'Vav (و) hem v ünsüzü hem o, ö, u, ü ünlüsüdür.',
  'Arapça kelimeler kendi imlâsını korur; Türkçe okunuşa göre değişmez.',
  'Her gün 10 dakika, haftada bir 2 saatten daha çok işe yarar.',
  'Yazarak öğrenmek okumayı hızlandırır: yazı tahtasını atlamayın.',
  'ی harfi kelime sonunda noktasız yazılır — ama yine “i” okunur.',
  'Nispet eki ‑î daima uzun okunur: “millî”, “edebî”.'
];
