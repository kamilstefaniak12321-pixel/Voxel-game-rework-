# Various Roots

Pierwsza wersja od podstaw. Gracz porusza się w widoku pierwszoosobowym po płaskim świecie. Każda kolumna składa się z dwunastu bloków kamienia, trzech bloków ziemi i jednego bloku ziemi z trawą. Świat powstaje po kawałku podczas marszu w dowolnym kierunku.

W wersji 0.1.1 kamera lekko przechyla się na boki w rytm marszu. Przy pełnej prędkości wychylenie sięga jednego stopnia w każdą stronę. Wolniejszy chód zmniejsza amplitudę i tempo, a zatrzymanie lub skok płynnie poziomują widok.

W wersji 0.1.3 ustawienia są dostępne z menu startowego i z pauzy. Kołysanie kamery ma zakres 0–150% (domyślnie 100%, czyli maksymalnie 1°). Zasięg terenu to promień 2–8 chunków (domyślnie 5); mgła dopasowuje się do jego krawędzi. Obie zmiany działają od razu i zapisują się na urządzeniu.

Esc podczas gry otwiera pauzę, ponowne naciśnięcie wznawia grę. W ustawieniach cofa do menu, z którego je otwarto. Analogicznie działają ekranowy przycisk w prawym górnym rogu i systemowy przycisk Wstecz na Androidzie.

Od 0.1.4 na płaskim terenie rosną kępki trawy z ośmiu dwustronnych płaszczyzn. Tymczasowy generator miesza duże plamy z luźnymi kępkami. Rozmieszczenie zależy od współrzędnych świata, więc odtwarza się po powrocie.

## Pobieranie i sterowanie

Instalatory są w [wydaniach gry](https://github.com/kamilstefaniak12321-pixel/Voxel-game-rework-/releases). Oba zawierają pełną grę i działają offline.

| Platforma | Instalacja | Sterowanie |
| --- | --- | --- |
| Windows 10/11 x64 | Uruchom plik `Windows-x64-Setup.exe` z numerem wersji w nazwie. Gra pojawi się w menu Start. | WASD lub strzałki poruszają postacią, mysz obraca widok, spacja pozwala skoczyć, Esc otwiera pauzę. |
| Android 8 lub nowszy | Otwórz plik `Android.apk` z numerem wersji w nazwie. Gra korzysta z systemowego WebView z obsługą WebGL 2. | Trzymaj telefon poziomo. Lewy joystick służy do chodzenia, przeciąganie prawym kciukiem obraca widok, a przycisk ↑ służy do skoku. Możesz używać ich jednocześnie. |

APK ma podpis testowy. Aktualizację w miejscu można zainstalować, jeśli obie wersje mają ten sam klucz. Instalator Windows instaluje grę dla bieżącego użytkownika i zawiera deinstalator.

## Uruchomienie ze źródeł

Zainstaluj Node.js 24 i wykonaj poniższe polecenia w głównym katalogu projektu.

```sh
npm ci
npm test
npm run build
```

Otwórz `dist/index.html` w przeglądarce z WebGL 2. Ten sam plik trafia do obu instalatorów. Zawiera kod, teksturę i interfejs gry.

## Budowanie instalatorów

Po zbudowaniu gry uruchom odpowiedni skrypt w Pythonie 3.11 lub nowszym. Pliki wynikowe znajdziesz w `out/`.

| Cel | Narzędzia | Polecenie |
| --- | --- | --- |
| Windows x64 | NSIS 3 z `makensis` w PATH. Skrypt pobiera przypięty pakiet Electron i sprawdza jego SHA-256. | `python scripts/package-windows.py` |
| Android | JDK 17+, zmienna `ANDROID_HOME`, pakiety SDK `platforms;android-35` i `build-tools;35.0.0`. | `python scripts/package-android.py` |

Opcja `--debug-keystore ŚCIEŻKA` wybiera klucz testowy Androida. Domyślnie skrypt używa `~/.android/debug.keystore` lub katalogu `ANDROID_USER_HOME`. Przy pierwszym buildzie tworzy klucz, jeśli plik jeszcze nie istnieje. Zachowaj go, żeby kolejne APK mogły aktualizować tę samą instalację.

## Aktualizacje

Od 0.1.2 gra sprawdza wydania GitHuba przy otwieraniu menu startowego, również testowe. Można wejść do świata w trakcie sprawdzania i bez internetu. Windows pobiera instalator w tle, sprawdza sumy kontrolne i po kliknięciu w menu instaluje go oraz uruchamia grę. Android otwiera właściwy APK w przeglądarce, a gracz potwierdza instalację.

Pierwsza instalacja 0.1.2 jest ręczna. Na Androidzie przejście z 0.1.0 lub 0.1.1 wymaga usunięcia poprzedniej wersji z powodu różnicy podpisów.

GitHub Actions po zmianie wersji na `main` publikuje APK, instalator Windows i manifest `latest.yml`. Opis wydania można umieścić w `releases/vX.Y.Z.md`. Android używa stałego klucza testowego od 0.1.2. Dla tej wersji workflow może pobrać wcześniej podpisany APK z przypiętego commitu i porównuje jego podpis oraz zasoby z lokalnym buildem. Dla kolejnych wydań właściciel dodaje klucz w Base64 jako sekret repozytorium `ANDROID_PREVIEW_KEYSTORE_BASE64`. Każde wydanie musi mieć ten sam certyfikat. Testy pull requestów mogą używać tymczasowego klucza.

## Gdzie edytować grę

| Plik | Odpowiada za |
| --- | --- |
| `src/world.js` | Warstwy bloków i generowanie fragmentów 16 × 16 wokół gracza |
| `src/player.js` | Prędkość chodu, grawitację, skok i kontakt z podłożem |
| `src/input.js` | Klawiaturę, mysz, joystick i obsługę wielu palców |
| `src/terrain.js`, `assets/grass.png` | Rysowanie powierzchni i pikselową teksturę trawy, po 16 pikseli na blok |
| `src/grass-placement.js` | Tymczasowe rozmieszczenie kępek, wielkość plam i gęstość między nimi |
