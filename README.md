# Edge Deck

**CORSAIR XENEON EDGE** (14.5", 2560×720 dokunmatik) için özel olarak tasarlanmış bir kontrol paneli.
Saat, hava durumu (Charlotte ve İstanbul), bilgisayarın canlı CPU / GPU / RAM değerleri, çalan müzik ve kontrolleri, uygulama kısayolları, odak sayacı, yapılacaklar listesi ve dünya saatleri tek ekranda.

![Ana ekran](screenshots/home.png)

---

## Kurulum (2 dakika, teknik bilgi gerekmez)

1. **Zip dosyasını açın.** `EdgeDeck-Kurulum.zip` dosyasına sağ tıklayın, **Tümünü ayıkla…** deyin ve **Ayıkla**'ya basın.
2. **Açılan klasördeki `Edge Deck Kur.bat` dosyasına çift tıklayın.**
   - Windows mavi bir "Windows bilgisayarınızı korudu" ekranı gösterirse **Ek bilgi**'ye, sonra **Yine de çalıştır**'a tıklayın.
   - Siyah bir pencere açılır ve her şeyi kendisi yapar. Gerekirse Node.js'i de indirir, bu bir dakika sürebilir.
3. **"Edge Deck kuruldu!" mesajı gelince bitti.** Panel XENEON EDGE ekranında açılır.

Bundan sonra bilgisayar her açıldığında panel kendiliğinden başlar. Kapatırsanız masaüstündeki **Edge Deck** simgesiyle tekrar açabilirsiniz.

### Panel Edge ekranında açılmadıysa

iCUE, Edge ekranını kendi widget'ları için kullanıyor olabilir. Şu iki yoldan birini seçin:

- **Yol 1 (önerilen):** iCUE'yu açın, **XENEON EDGE** cihazına girin ve ekranın iCUE tarafından kontrol edilmesini kapatın. Sonra masaüstündeki **Edge Deck** simgesine çift tıklayın.
- **Yol 2 (iCUE içinde):** iCUE'da Edge'e bir **Web URL** widget'ı ekleyin, tam genişliğe getirin ve adres olarak şunu yazın:
  ```
  http://localhost:5280
  ```

---

## Kullanım

- Sayfalar arasında **sağa/sola kaydırarak** ya da soldaki simgelere dokunarak geçin.
- Sol alttaki **yeşil nokta**, panelin bilgisayara bağlı olduğunu gösterir.

| Sayfa | Ne var |
|---|---|
| 🏠 **Ana ekran** | Saat, İstanbul saati, hava durumu, sistem göstergeleri, çalan müzik, uygulama kısayolları |
| ⚙️ **Sistem** | CPU çekirdekleri, ekran kartı (yük, VRAM, watt, sıcaklık), ağ grafiği, RAM ve diskler |
| 🎵 **Medya** | Büyük "şu an çalıyor" ekranı ve ses kontrolü (Spotify, YouTube, tarayıcı…) |
| ⏱️ **Odak** | Pomodoro sayacı, yapılacaklar listesi, notlar |
| 🌍 **Dünya** | Charlotte, İstanbul ve diğer şehirlerin saatleri |
| ⚙ **Ayarlar** | Dil, tema, renk, ana ekran düzeni, hava durumu şehirleri |

### Dili Türkçe yapmak
**Ayarlar** (sol alttaki dişli) → en üstteki **Language / Dil** → **Türkçe**

### Ayarlarda neler var
- **Dil:** English / Türkçe
- **6 tema:** Obsidian, Aurora, Synthwave, Ember, Terminal, Paper, ayrıca vurgu rengi
- **Ana ekran:** Bileşenleri aç/kapat ve sırala. Takvim, dünya saatleri ve odak sayacı da eklenebilir.
- 12 / 24 saat, °F / °C
- **Hava durumu:** Ana şehir ve ikinci şehir (varsayılan Charlotte ve İstanbul)
- **Gece karartma:** Gece parlaklığı otomatik düşürür.
- **Ekran koruyucu**

---

## Kaldırma
**Başlat menüsü** → **Edge Deck** → **Edge Deck Kaldır**

---

## İsteğe bağlı

- **CPU sıcaklığı:** Windows bunu kendiliğinden vermiyor. [LibreHardwareMonitor](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor) kurup *Options → Remote Web Server → Run* açarsanız panelde görünür. Ekran kartı sıcaklığı (NVIDIA) zaten çalışıyor.
- **Uygulama kısayollarını değiştirmek:** `%LOCALAPPDATA%\EdgeDeck\app\config.json` dosyasını düzenleyin. Her satırda `target` olarak bir program yolu, web adresi ya da `steam://rungameid/730` gibi bir bağlantı yazılabilir. Sonra bilgisayarı yeniden başlatın.

## Sorun giderme

- **Göstergelerde "PC bağlantısı yok" yazıyor:** Masaüstündeki **Edge Deck** simgesine çift tıklayın.
- **Dokunuşlar yanlış ekrana gidiyor:** Windows'ta *Denetim Masası → Tablet PC Ayarları → Kur → Dokunmatik giriş* adımına gidin ve istendiğinde Edge ekranına dokunun.
- **Üç/dört parmak hareketleri sorun çıkarıyor:** *Ayarlar → Bluetooth ve cihazlar → Dokunma* bölümünden kapatın.
- **Hava durumu yüklenmiyor:** İnternet bağlantısını kontrol edin. Veriler ücretsiz Open-Meteo servisinden geliyor.

---

<sub>Teknik: Node.js ile çalışan yerel bir sunucu (sadece `localhost`, dışarıdan erişilemez) ve dokunmatik bir web arayüzü. İstatistikler PowerShell üzerinden Windows'tan okunur. Ayarlar `settings.json` dosyasında saklanır.</sub>
