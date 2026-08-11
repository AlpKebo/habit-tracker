# Habit Tracker

Sınırsız goal ekleyip her birine deadline ve hatırlatma verebildiğin, tamamladıkça günlük seri
(streak) biriktiren bir React Native + Expo uygulaması. Backend, login veya external API yok —
her şey cihazda saklanır.

> Exposure AI Academy · Project 9 · React Native + Expo + Local Notifications

## Özellikler

- **Goal yönetimi** — sınırsız goal oluştur, düzenle, sil, tamamlandı işaretle ve geri al.
  Goal'lar Gecikmiş / Aktif / Tamamlanan bölümlerine ayrılır, her kartta durum rozeti vardır.
- **Deadline hatırlatmaları** — `expo-notifications` ile cihaz içi zamanlanmış local notification.
  Deadline'dan 0/1/2/3/7 gün önce ya da hiç hatırlatma yok. Goal düzenlenince eski bildirim iptal
  edilip yenisi planlanır; silinince veya tamamlanınca iptal edilir.
- **Günlük streak** — bir takvim gününde en az bir goal tamamlarsan o gün seriye sayılır. Aynı gün
  ikinci bir goal seriyi tekrar artırmaz. Güncel seri, en iyi seri ve bugünkü tamamlama sayısı
  ana ekranda görünür.
- **Kalıcılık** — goal'lar, notification ID'leri ve completion ledger'ı `AsyncStorage`'da tutulur.
  App tamamen kapatılıp açıldığında aynı state geri gelir.
- **Mobile UX** — empty state, form validation, geçmiş deadline hatası, bildirim izni banner'ı,
  safe area, klavye yönetimi ve otomatik light/dark tema.

## Teknik yapı

| Parça | Kullanılan |
| --- | --- |
| Framework | React Native 0.85 + Expo SDK 56 (Expo Go uyumlu) |
| Navigation | Expo Router (`src/app`) |
| Data | `@react-native-async-storage/async-storage` |
| Notifications | `expo-notifications` (scheduled local, remote push değil) |
| Tarih seçimi | `@react-native-community/datetimepicker` |
| Dil | TypeScript (strict) |

## Kurulum

```bash
npm install
```

Expo paketleri her zaman uyumlu sürümle kurulmalı:

```bash
npx expo install <paket-adı>
```

## Çalıştırma (Expo Go)

```bash
npx expo start --tunnel
```

Telefondan QR kodu okut (Android: Expo Go içindeki *Scan QR Code*, iPhone: Kamera uygulaması).
Bu terminal açık kalmalı; `Ctrl + C` sunucuyu durdurur.

Telefon ve bilgisayar aynı Wi-Fi'daysa tunnel'a gerek yoktur, `npx expo start` daha hızlıdır.
Tunnel için gereken `@expo/ngrok` devDependency olarak eklidir, ayrıca kurman gerekmez.

> Local scheduled notification'lar Expo Go'da hem Android hem iOS'ta çalışır. Expo Go'da
> çalışmayan şey *remote push*'tur ve bu proje remote push kullanmaz.

## Local development build

Native runtime'ı kendi makinende build etmek için:

```bash
# Android (Android Studio + Android SDK gerekir)
npx expo run:android

# iOS (yalnızca macOS + Xcode)
npx expo run:ios
```

İlk çalıştırmada `android/` ve `ios/` klasörleri üretilir, app build edilip cihaza/emulator'a
yüklenir ve Metro başlar.

## EAS Build

```bash
npm install -g eas-cli
eas login
eas whoami
eas build:configure
```

### Development build (dev client ile geliştirme)

```bash
eas build --profile development --platform android

# Fiziksel iPhone için önce cihaz kaydı
eas device:create
eas build --profile development --platform ios
```

Build telefona kurulduktan sonra:

```bash
npx expo start --dev-client --tunnel
```

### Preview build (paylaşılabilir test sürümü)

```bash
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

### Ne zaman yeniden build gerekir?

Sadece native runtime değiştiğinde: native kod içeren yeni paket/config plugin, `app.json`
içindeki permission / plugin / icon / splash / scheme / package / bundle identifier değişikliği,
`ios` veya `android` klasöründeki native dosyalar, ya da Expo SDK / React Native sürümü.
Sadece ekran, component, style veya TypeScript değiştiyse dev server yeterlidir.

## Proje yapısı

```
src/
  app/
    _layout.tsx        Stack navigator, tema ve GoalsProvider
    index.tsx          Ana ekran: streak kartı + bölümlü goal listesi
    goal/new.tsx       Yeni goal (modal)
    goal/[id].tsx      Goal düzenle / sil (modal)
  components/
    goal-card.tsx      Liste kartı, checkbox ve durum rozeti
    goal-form.tsx      Create ve edit'in paylaştığı form
    streak-card.tsx    Güncel / en iyi seri ve bugünkü tamamlamalar
    permission-banner.tsx
    ui/                Button, StatusBadge, DateTimeField
  lib/
    types.ts           Domain tipleri (hepsi JSON-safe)
    dates.ts           Gün anahtarı, deadline ve hatırlatma matematiği
    streak.ts          Saf streak hesabı
    goals.ts           Durum türetme, gruplama, hatırlatma seçenekleri
    storage.ts         AsyncStorage okuma/yazma + bozuk veriye dayanıklılık
    notifications.ts   İzin, schedule, cancel, reschedule
    goals-store.tsx    React context store, tüm mutasyonlar ve kalıcılık
```

## Streak mantığı

Seri, **completion ledger**'dan türetilir: en az bir goal tamamlanan her takvim günü için bir
kayıt. Bu yüzden aynı gün beş goal tamamlamak seriyi bir gün artırır, eski bir tamamlanmış
goal'ı silmek ise geçmiş seriyi bozmaz. Bir tamamlamayı geri aldığında, o günde başka
tamamlama kalmadıysa gün ledger'dan düşer.

**Grace period:** Kural "tam bir gün hiçbir goal tamamlanmadan geçerse streak bozulur" olduğu
için, son tamamlama dün ise seri bugün hâlâ ayaktadır — gün bitmeden bir goal tamamlarsan devam
eder. Bu durumda streak kartı "Serin risk altında" uyarısı gösterir. Seri, boş gün tamamen
geçtikten sonra sıfırlanır.

Ana senaryo ve edge case'ler doğrulandı: aynı gün duplicate artış yok, boş gün sonrası doğru
reset, ay sınırında ardışıklık, sırasız veri, ve en iyi serinin korunması.

## Manuel test kontrol listesi

- [ ] Birden fazla goal oluştur, düzenle, sil, tamamla ve geri al.
- [ ] Deadline'ı **2 dakika sonrasına**, hatırlatmayı **"Deadline anında"** ayarla ve bildirimin
      gerçekten geldiğini gör.
- [ ] Goal'ı düzenleyip deadline'ı değiştir; eski bildirimin gelmediğini, yenisinin geldiğini gör.
- [ ] Goal'ı tamamla veya sil; bildirimin artık gelmediğini doğrula.
- [ ] Geçmiş bir hatırlatma zamanı seç; açıklayıcı hatanın çıktığını ve app'in çökmediğini gör.
- [ ] Bildirim iznini reddet; banner'ın ve "Ayarları aç" akışının çalıştığını doğrula.
- [ ] App'i tamamen kapatıp aç; goal'ların ve streak'in korunduğunu doğrula.
- [ ] Bir gün hiç goal tamamlama; ertesi gün serinin sıfırlandığını doğrula.

## Notlar

- Bu proje **install edilebilir bir mobil uygulamadır**; web deploy'u yoktur.
- Repoda secret, API key veya kişisel credential yoktur.
