# Maturitní deska – pokyny pro práci na projektu

Web (`index.html`, `img/`, `fonts/`, `icons/`, `sw.js`, `manifest.webmanifest`, `version.json`) je **vygenerovaný**.
Nikdy ho neupravuj ručně – změny by se při dalším buildu ztratily. Upravuj zdrojáky v `zdroj/`.

## Postup po změně
```bash
git pull                                   # nejdřív stáhni, co je nového (pracuje se i z druhého počítače)
python3 zdroj/build/build.py zdroj .       # vytvoří web v kořeni repa + zdroj/app3.html (aplikace) a zdroj/maturitni-deska-3.html (vše v jednom souboru)
```
Commitni **zdroják i vygenerovaný web** dohromady. Na GitHub Pages se web objeví do pár minut.
Aplikace (AppImage / exe): `cd electron && ONLY3=1 ./build.sh ../zdroj <cílová složka>`.

## Kde co je
- `zdroj/build/template3.html` – HTML, CSS a jádro aplikace (hlavička, kvízy, ústní, losování, routing)
- `zdroj/build/labs.js`, `zdroj/build/labs2.js` – laboratoře a kreativní dílna
- `zdroj/build/extra.js` – profil, úrovně kvízu, materiály, čtečka PDF
- `zdroj/build/nav.js` – panel Nastavení, spodní lišta na mobilu, systémové Zpět (historie), hledání
- `zdroj/build/imgs.js` – galerie obrázků a kvíz „Poznej obrázek“
- `zdroj/build/lb.js` – žebříček (Supabase); `leaderboard.json` = URL + publishable klíč (veřejný, smí být v klientu)
- `zdroj/build/web/` – service worker, manifest a ikony pro instalaci na plochu / offline
- `zdroj/data_v1/`, `zdroj/data_x/`, `zdroj/data_oral/`, `zdroj/raw/` – otázky, ústní body, texty z PDF
- `zdroj/build/images.json` – obrázky z PDF; `zdroj/obrazky/` – nakreslená schémata (`python3 zdroj/obrazky/kresli.py`)
- `zdroj/fonts/` – písma (Google Fonts, licence OFL), web je bere ze souborů, aplikace je má vložené
- `zdroj/build/videa.json` – videa k otázkám: číslo = délka v s pro `videa/NN.mp4`, nebo `{"yt": "ID", "len": sekundy}` pro YouTube
- `electron/` – desktopová aplikace (AppImage / portable exe), `build.sh`
- `supabase/` – Edge Function AI zkoušejícího a SQL (klíč ke Groq je jen v Supabase secrets, nikdy ne v repu)

## Videa
- Soubor do `videa/NN.mp4` (NN = číslo otázky, např. `07.mp4`). GitHub nepřijme soubor nad 100 MB.
- Delší video nahraj na YouTube jako neveřejné a do `zdroj/build/videa.json` zapiš `"7": {"yt": "ID_VIDEA", "len": 754}`.

## Pravidla
- Fakta jen z podkladů (PDF v `materialy/`); co je navíc, označit „mimo PDF“.
- Žádné tajné klíče (service_role, sb_secret, gsk_…) do repa.
- U kvízových otázek je správná odpověď vždy na indexu 1; špatné odpovědi nesmí jít uhodnout podle vzoru
  (všechny začínají stejně, mají „jen/vždy/nikdy“, správná je výrazně nejdelší).
