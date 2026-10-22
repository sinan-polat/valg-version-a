# Skrifttyper i version D

Version D (`?v=d`) bruger tre skrifttyper. Alle er under **SIL Open Font License 1.1** (fuld tekst i `OFL-1.1.txt`) og er **selv-hostet** (ingen forbindelse til Google eller andre ved sidevisning).

| Fil i `fonts/` | CSS-navn | Original | Ophav / copyright | Brug |
|---|---|---|---|---|
| `inter-400.woff`, `inter-600.woff`, `inter-700.woff` | VD Sans | Inter 4.0 | Copyright 2016 The Inter Project Authors (Rasmus Andersson). https://rsms.me/inter/ | Brødtekst, knapper, tabeller |
| `interdisplay-800.woff` | VD Display | Inter Display 4.0 ExtraBold | Copyright 2016 The Inter Project Authors | Overskrifter og tal |
| `lora-var.woff` | VD Serif | Lora 3.008 (variabel) | Copyright 2011 The Lora Project Authors (https://github.com/cyrealtype/Lora-Cyrillic), with Reserved Font Name "Lora" | Sætningen og resuméet |

## Hvad der er ændret

- Filerne er **delmænger** (kun latinske tegn og de tegn, dansk bruger) lavet med `pyftsubset` (fontTools) og gemt som WOFF. Det gør dem små (ca. 24–41 kB pr. fil).
- Fordi Lora har et Reserved Font Name (RFN), er den modificerede delmængde **omdøbt** internt til "VD Serif". Inter har ingen RFN; navnene "VD Sans" og "VD Display" bruges alligevel, så versionerne A, B og C (der bruger `Inter` som første valg i `css/style.css`) ikke ændrer udseende hos besøgende uden Inter installeret.
- Copyright-linjerne i fontfilernes metadata er bevaret.

## Hentet fra

- Inter: Debian-pakken `fonts-inter` 4.0+ds-1 i udviklingsmiljøet (OTF), hentet/brugt 22. oktober 2026.
- Lora: filen `Lora-Variable.ttf` i Google Fonts-samlingen i udviklingsmiljøet, brugt 22. oktober 2026.

## Til kildelogen (bilag 14.6)

Log hver skrifttype (titel, ophavsperson, kilde-URL, licens, dato, hvor den bruges). Kan også nævnes i rapporten under teknisk implementering: "Skrifttyperne Inter og Lora er under SIL Open Font License 1.1 og er selv-hostet."
