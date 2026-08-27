# HDFilmCehennemi Stremio Addon (Fork)

> Bu proje **[enXov/hdfilmcehennemi-stremio](https://github.com/enXov/hdfilmcehennemi-stremio)** reposundan fork alınarak geliştirilmiştir.

HDFilmCehennemi içeriklerini Stremio üzerinden izlemenizi sağlayan bir addon.

---

## 🆕 Bu Fork'ta Eklenenler

Orijinal repoya kıyasla aşağıdaki iyileştirmeler yapılmıştır:

- **🗂️ Keşfet Kataloğu:** Stremio'nun Discover (Keşfet) bölümüne "HDFilmCehennemi" seçeneği eklendi. Aksiyon, Korku, Komedi, Bilim Kurgu, Gerilim dahil 20+ kategori ile film/dizi filtreleme desteği.
- **⚡ Direkt Stream (Hızlı):** Stremio Desktop'ta Nuvio benzeri hızda oynatım için `proxyHeaders` ile doğrudan CDN bağlantısı. Proxy üzerinden geçmediği için tam bant genişliği kullanılıyor.
- **📡 Proxy Fallback:** Eski proxy yöntemi TV/uyumluluk seçeneği olarak korundu. Her film için iki stream seçeneği sunuluyor: 🚀 Direkt ve 📡 Proxy.
- **🔧 VM Sandbox Decoder:** HDFilmCehennemi'nin `dc_XXXX([...])` tabanlı yeni şifreleme algoritması `vm.createContext()` sandbox'ı ile çözülüyor. Site şifrelemesini değiştirdiğinde otomatik yeniden analiz yapıyor.
- **🔄 Stremio Uyumluluğu:** `notWebReady` bayrağı kaldırıldı, Stremio'nun kendi oynatıcısında çalışması sağlandı (artık yükleme ekranında takılmıyor).
- **☁️ Koyeb/Railway Deploy:** Ücretsiz cloud platformlara deploy için `Dockerfile`, `railway.json` ve `Procfile` eklendi.

---

## ⚠️ Maintain Notu (orijinal repodan)

HDFilmCehennemi 1 haftalık gözleme göre her gün, bazen günde 2 kez şifreleme algoritmasını değiştiriyor. Kullanmadan önce:

```bash
npm test
```

Eğer test başarılıysa sıkıntı yok. Hata alırsanız issue açabilirsiniz.

---

## Özellikler

- 🎬 Film ve dizi desteği
- 🗂️ Keşfet kataloğu (20+ kategori)
- 🎙️ Çoklu ses seçeneği (Türkçe dublaj, orijinal ses)
- 📝 Altyazı desteği
- ⚡ Çift stream modu (Direkt hızlı + Proxy uyumlu)
- 🔄 Otomatik alternatif kaynak geçişi
- 🔧 Otomatik şifre çözücü (VM sandbox)

---

## Kurulum Seçenekleri

### Seçenek 1: Koyeb (Ücretsiz Cloud — Önerilen)

Koyeb tamamen ücretsiz, uyumaya girmiyor ve HTTPS dahil geliyor.

1. **[app.koyeb.com](https://app.koyeb.com)** adresine gidin → Google ile kayıt olun
2. **"Create App"** → **"GitHub"** → bu repoyu seçin
3. Ayarlar:
   - **Region:** Frankfurt (EU)
   - **Instance:** Nano (ücretsiz)
   - **Port:** `7000`
4. **Environment Variables:**
   - `BASE_URL` → Deploy sonrası Koyeb'in verdiği URL (örn. `https://hdfilmcehennemi-xxx.koyeb.app`)
5. Deploy edin, manifest URL'si: `https://xxx.koyeb.app/manifest.json`

> ⚠️ **Not:** Koyeb dışında Render, Glitch gibi servisler ya uyku moduna giriyor ya da proxy aramak için yeterince hızlı değil. Orijinal repodaki uyarılar burada da geçerli.

---

### Seçenek 2: Kendi Sunucunuzda (VPS)

Orijinal reponun VPS kurulum rehberini takip edin: [enXov/hdfilmcehennemi-stremio](https://github.com/enXov/hdfilmcehennemi-stremio)

**Notlar:**
- Stremio sadece HTTPS kabul ediyor — domain veya reverse proxy şart
- Sunucu Türkiye dışındaysa otomatik free proxy devreye giriyor (HTTP/SOCKS4/SOCKS5)
- Nginx timeout'u artırın: `proxy_read_timeout 120s;`

---

### Seçenek 3: Yerel Çalıştırma

Bilgisayarınızda yerel olarak çalıştırabilirsiniz (sadece aynı ağdaki cihazlarda çalışır).

**Gereksinimler:** Node.js 18+, npm

```bash
# Repoyu klonla
git clone https://github.com/tumni/hdfilmcehennemi-stremio.git
cd hdfilmcehennemi-stremio

# Bağımlılıkları yükle
npm install

# Addon'u başlat
npm start
```

Addon `http://localhost:7000` adresinde çalışır. Stremio'ya eklemek için:
`http://localhost:7000/manifest.json`

> **Not:** Localhost'ta proxy aktif olmayacaktır.

---

## 🔧 Yapılandırma

### Ortam Değişkenleri

| Değişken | Varsayılan | Açıklama |
|----------|------------|----------|
| `PORT` | `7000` | Sunucu portu |
| `BASE_URL` | `http://localhost:7000` | Addon'un public URL'si (TV/proxy stream için şart) |
| `LOG_LEVEL` | `info` | Log seviyesi: `debug`, `info`, `warn`, `error` |
| `PROXY_ENABLED` | `auto` | Proxy modu: `auto`, `always`, `never` |

### Örnek `.env`

```env
PORT=7000
BASE_URL=https://xxx.koyeb.app
LOG_LEVEL=info
PROXY_ENABLED=auto
```

---

## 🧪 Test

```bash
npm test
```

---

## 📁 Proje Yapısı

```
├── addon.js          # Stremio addon sunucusu + proxy endpoint
├── scraper.js        # Video/altyazı çekme + VM sandbox decoder
├── catalog.js        # Keşfet kataloğu (Cinemeta proxy)
├── search.js         # İçerik arama ve eşleştirme
├── decoder/
│   ├── analyzer.js   # Şifreleme analiz motoru (AST)
│   └── engine.js     # Decoder pipeline yönetimi
├── logger.js         # Log sistemi
├── errors.js         # Hata sınıfları
├── proxy.js          # Free proxy yönetimi
├── test.js           # Test scripti
└── package.json
```

---

## 📜 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## ⚠️ Sorumluluk Reddi

Bu addon yalnızca eğitim amaçlıdır. İçeriklerin telif hakları sahiplerine aittir. Addon geliştiricisi içeriklerden sorumlu değildir.
