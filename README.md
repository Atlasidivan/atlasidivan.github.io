# Kaşgarlı Mahmud İnteraktif Dünya Atlası

Dîvânu Lugâti't-Türk'teki 11. yüzyıl dairesel dünya haritasını günümüz haritasıyla karşılıklı eşleştiren statik site.
HTML + CSS + Vanilla JS (ES Modules) + Leaflet 1.9.4 (`vendor/` içinde yerel kopya) + OpenStreetMap. Sunucu, veritabanı, derleme yok.

## Dosyalar
- `index.html`, `css/style.css`, `js/app.js` — arayüz ve iki harita arasındaki senkronizasyon
- `data/features.json` — tüm kayıtlar ve kaynak listesi (tek veri kaynağı)
- `img/original.jpg`, `img/turkce.png` — harita görselleri (yoksa Wikimedia'dan doğrudan yüklenir)
- `tools/gorselleri-indir.ps1` — görselleri `img/` klasörüne indirir

## Yerel çalıştırma
ES Modules `file://` üzerinden çalışmaz; küçük bir yerel sunucu gerekir:
```
cd kasgarli-mahmud-atlasi
python -m http.server 8000
```
Chrome'da `http://localhost:8000` açın. Görselleri yerel almak için: `powershell -ExecutionPolicy Bypass -File tools\gorselleri-indir.ps1`

Kalibrasyon modu: `http://localhost:8000/?kalibre` — listeden bir öğe seçip dairesel haritada doğru yere tıklayın; normalize x,y konsola ve alt nota yazılır. Değeri `features.json` içinde ilgili kaydın `historicalMapPosition` alanına yazıp `"calibrated": true` yapın.

## Veri modeli (`features.json`)
`id, historicalName, altNames, modernName, type, description, divanNote, history, settlements, modernLocation (GeoJSON | null), historicalMapPosition ({x,y,calibrated} | null), source[], evidenceType (1 haritada, 2 metinde, 3 akademik yorum), confidence (yuksek | yaklasik | tartismali)`; boylar için `area {rxKm, ryKm}` (yaklaşık dağılım, kesin sınır değil); tanımlanamayanlar için `type: "tanimsiz"` + `unidentifiedReason`.

## GitHub Pages'te yayımlama
1. GitHub'da herkese açık bir depo oluşturun (ör. `kasgarli-mahmud-atlasi`).
2. Bu klasörün içeriğini deponun kök dizinine gönderin:
   ```
   git init && git add . && git commit -m "Atlas" && git branch -M main
   git remote add origin https://github.com/KULLANICI/kasgarli-mahmud-atlasi.git && git push -u origin main
   ```
3. Depo → Settings → Pages → Source: "Deploy from a branch", Branch: `main` / `(root)` → Save.
4. Birkaç dakika sonra `https://KULLANICI.github.io/kasgarli-mahmud-atlasi/` adresinden (HTTPS) açılır. Tüm yollar görelidir, alt dizinde sorunsuz çalışır.

## Lisanslar
Harita görselleri Wikimedia Commons'tandır (kendi sayfalarındaki lisans geçerlidir). Leaflet: BSD-2 (`vendor/leaflet/LICENSE`). Taban harita © OpenStreetMap katkıcıları.
