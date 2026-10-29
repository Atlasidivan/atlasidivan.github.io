# AI_HANDOFF.md — ortak devir kaydı

**Aktif geliştirici:** Claude (Claude Code)  
**Son güncelleme:** 2026-10-29  
**Aşama:** MVP çalışıyor; harita görselleri eklendi ve konumlar kalibre edildi. Yayında: https://mucahitdural-cyber.github.io/ka-garl-_mahmut/ (GitHub Pages, main / root).

## Tamamlanan
- Statik iskelet: `index.html`, `css/style.css`, `js/app.js`, Leaflet yerel kopya (`vendor/leaflet`).
- Modern harita (OSM): şehir noktaları, boylar için kesikli yaklaşık alan elipsleri, nehir/dağ çizgileri.
- Dairesel harita: görüntü + SVG katmanı, yakınlaştırma/kaydırma (tekerlek, sürükleme, iki parmak), Türkçe etiket aç/kapa, özgün ↔ Türkçe açıklamalı geçişi, yön etiketleri.
- İki yönlü senkronizasyon (ortak `id`): hover vurgu + tooltip, tıklama → bilgi paneli + iki haritada odak, URL `#id`.
- Sol panel: boy arama, şehir/yer arama, katman filtreleri, kanıt filtresi, tanımlanamayanlar kataloğu. Sağ panel: açıklama, Dîvân notu, günümüz karşılığı, kesinlik, kaynaklar.
- `data/features.json`: 61 kayıt (17 şehir, 19 boy, nehir/dağ/göl/deniz/çöl, 12 bölge, 3 tanımlanamayan).
- Kalibrasyon modu `?kalibre`.

## Devam eden görev
Görseller (`img/original.jpg` 1861×1573, `img/turkce.png` 1678×1596) kullanıcının ekran görüntülerinden alındı. 96 kayıt; 75'i dairesel haritada.
- `historicalMapPositionTr`: Türkçe görselde okunarak (calibrated:true).
- `historicalMapPosition`: 16 nokta özgün görselde ölçüldü (calibrated:true), diğerleri Türkçe→özgün afin dönüşümle (~%1 hata, calibrated:false).
- Haritada bulunamayanlar (Çiğil, Yağma, Karluk, Kırgız, Tohsı, Argu, Yabaku, Issık Göl, Rum, Tangut, Hıtay, Tavgaç...) dairesel konumu null, kanıt=2 (metin).

## Sıradaki en önemli görev
1. Kullanıcıdan Chrome'da gerçek test geri bildirimi.
2. İsteğe bağlı: daha yüksek çözünürlüklü Commons görselleri (`tools/gorselleri-indir.ps1`) gelirse koordinatlar normalize olduğundan aynen çalışır (çerçeve aynıysa).
3. Kaynaklara sayfa numarası ekleme.
4. Yayın tamam; yeni değişiklikler `main`'e push edilince Pages otomatik güncellenir.

## Teknik kararlar
- Tek veri dosyası; boy alanları merkez+yarıçap elips (kesin sınır çizilmez, kesikli).
- İşaretçi boyutu yakınlaştırmada ekran pikseli olarak sabit; konum görüntüye göre normalize (0–1), kayma yok (test edildi).
- Görsel: önce `img/` yerel dosya, yoksa Wikimedia `Special:FilePath` yedeği.
- Bulut ortamında git yok; proje klasörü kullanıcının bilgisayarında (Masaüstü/kasgarli-mahmud-atlasi). Git henüz başlatılmadı.

## Kullanılan araçlar
Claude Code: Bash, Playwright/Chromium (headless test), npm (Leaflet paketi), uzak cihaz klasör erişimi.

## Güvenlik
- CSP meta etiketi (yalnız kendi betikleri; görsel yalnız OSM + Wikimedia), referrer politikası.
- Veri HTML'e kaçışlı (esc) girer; bağlantılar yalnız https, renkler yalnız #hex; dış bağlantılar `noopener noreferrer`.
- Harici CDN yok (Leaflet yerel). `window.atlas` yalnız `?kalibre` modunda. Sırlar/token yok.

## Bilinen hatalar / eksikler
- Görseller ekran görüntüsü kalitesinde. Kaynak atıfları madde düzeyinde; sayfa numaraları eklenmedi. 'Seyhun' etiketi haritada Hind yakınında; eşleşme tartışmalı olarak işaretlendi.

## Son testler (Chromium, 1440×900 ve 390×844)
Açılış, hover/tıklama iki yönlü eşleşme, arama, filtre, tam ekran, `#id` derin bağlantı, zoom'da kayma yok: geçti. Kritik JS hatası yok (yalnız test ortamında OSM karoları yüklenmedi).

## Çalıştırma
`python -m http.server 8000` → http://localhost:8000 (kalibrasyon: `/?kalibre`)

## Git commit
Depo: github.com/mucahitdural-cyber/ka-garl-_mahmut, dal `main`. Son commit için `git log -1`.

## Sonraki geliştiriciye not
`features.json` dışında veri tutma. Konum düzeltirken `calibrated:true` yap. `main`'e push = canlı yayın; önce yerelde test et.
