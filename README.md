# Spse-maturita – Maturitní deska

Učící hra na ústní maturitu z IT (SPŠE): 20 maturitních otázek jako čipy na základní desce.

**Hrát v prohlížeči:** https://jorok52.github.io/Spse-maturita/

- Kvízy, kartičky, spojovačky a ústní zkoušení s podrobnými body ke každé podotázce
- Laboratoře a kreativní dílna: plánovač procesů, disk, výměna stránek, SAR převodník, 74595, STM32 registry, unixový terminál, MBR v hexu, FAT, VLSM, mini Packet Tracer, stavba PC, procesor v assembleru…
- Obrázky z podkladů a kvíz „Poznej obrázek“
- Žebříček třídy – stačí zadat přezdívku a třídu, žádný účet
- Hledání v textech PDF, ústních bodech, pojmech i kvízových otázkách (klávesa /)
- Funguje i offline a jde nainstalovat na plochu jako aplikace

Postup se ukládá v prohlížeči. Windows verze (.exe) je v sekci Releases.

Obsah vychází ze školních podkladů; co je navíc podle oficiální osnovy, je ve hře označené „mimo PDF“.

## Vývoj

Zdrojáky jsou ve složce `zdroj/`, web v kořeni repa se z nich generuje:

```bash
python3 zdroj/build/build.py zdroj .
```

Web jde nainstalovat na plochu (Chrome/Edge: Nastavení → Nainstalovat jako aplikaci) a funguje i offline.
Desktopová aplikace je v `electron/`, AI zkoušející (Supabase Edge Function + SQL) je v `supabase/`. Podrobnosti najdeš v `CLAUDE.md`.

Písma Chakra Petch a IBM Plex jsou pod licencí SIL Open Font License (texty licencí jsou ve `fonts/`).
