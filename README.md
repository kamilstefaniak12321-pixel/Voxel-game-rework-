# Various Roots

Pierwsza wersja od podstaw. Gracz porusza się w widoku pierwszoosobowym po płaskim świecie. Każda kolumna składa się z dwunastu bloków kamienia, trzech bloków ziemi i jednego bloku ziemi z trawą. Świat powstaje po kawałku podczas marszu w dowolnym kierunku.

## Pobieranie i sterowanie

Instalatory są w [wydaniach gry](https://github.com/kamilstefaniak12321-pixel/Voxel-game-rework-/releases). Oba zawierają pełną grę i działają offline.

| Platforma | Instalacja | Sterowanie |
| --- | --- | --- |
| Windows 10/11 x64 | Uruchom plik `Windows-x64-Setup.exe` z numerem wersji w nazwie. Gra pojawi się w menu Start. | WASD lub strzałki poruszają postacią, mysz obraca widok, spacja pozwala skoczyć, Esc otwiera pauzę. |
| Android 8 lub nowszy | Otwórz plik `Android.apk` z numerem wersji w nazwie. Gra korzysta z systemowego WebView z obsługą WebGL 2. | Trzymaj telefon poziomo. Lewy joystick służy do chodzenia, przeciąganie prawym kciukiem obraca widok, a przycisk ↑ służy do skoku. Możesz używać ich jednocześnie. |

APK ma podpis testowy. Aktualizację w miejscu można zainstalować, jeśli obie wersje mają ten sam klucz. Instalator Windows instaluje grę dla bieżącego użytkownika i zawiera deinstalator.

## Uruchomienie ze źródeł

Zainstaluj Node.js 24 i wykonaj w głównym katalogu projektu:

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

GitHub Actions sprawdza kod i buduje oba instalatory. Po dodaniu nowego numeru wersji do `package.json` na `main` zamieszcza je w wydaniu testowym. W kolejnych buildach tego samego numeru pliki są dostępne w zakładce Actions. Opcjonalny sekret `ANDROID_PREVIEW_KEYSTORE_BASE64` przechowuje zakodowaną w Base64 kopię klucza testowego do podpisywania następnych wydań tym samym certyfikatem.

## Gdzie edytować grę

| Plik | Odpowiada za |
| --- | --- |
| `src/world.js` | Warstwy bloków i generowanie fragmentów 16 × 16 wokół gracza |
| `src/player.js` | Prędkość chodu, grawitację, skok i kontakt z podłożem |
| `src/input.js` | Klawiaturę, mysz, joystick i obsługę wielu palców |
| `src/terrain.js`, `assets/grass.png` | Rysowanie powierzchni i pikselową teksturę trawy, po 16 pikseli na blok |
