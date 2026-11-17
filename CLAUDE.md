# Maturitní deska – pokyny pro práci na projektu

`index.html` je **vygenerovaný** soubor. Nikdy ho neupravuj ručně – změny by se při dalším buildu ztratily.

## Kde co je
- `zdroj/build/template3.html` – HTML, CSS a jádro aplikace (verze 3 = ta na webu)
- `zdroj/build/labs.js`, `zdroj/build/labs2.js` – laboratoře a kreativní dílna
- `zdroj/build/extra.js` – profil, úrovně kvízu, materiály, čtečka
- `zdroj/build/lb.js` – žebříček (Supabase), `leaderboard.json` = URL + publishable klíč (veřejný, smí být v klientu)
- `zdroj/data_v1/`, `zdroj/data_x/`, `zdroj/data_oral/`, `zdroj/raw/` – otázky, ústní body, texty z PDF
- `zdroj/build/videa.json` – délky videí (videa leží ve `videa/NN.mp4`)
- `electron/` – desktopová aplikace (AppImage / portable exe), `build.sh`
- `supabase/` – Edge Function AI zkoušejícího a SQL (klíč ke Groq je jen v Supabase secrets, nikdy ne v repu)

## Postup po změně
```bash
python3 zdroj/build/build.py zdroj        # vytvoří zdroj/maturitni-deska-3.html (+ app1-3.html)
cp zdroj/maturitni-deska-3.html index.html
```
Commitni **zdroják i index.html** dohromady.

## Pravidla
- Fakta jen z podkladů (PDF v `materialy/`); co je navíc, označit „mimo PDF“.
- Žádné tajné klíče (service_role, sb_secret, gsk_…) do repa.
