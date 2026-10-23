# Skrifttyper i version D

Version D (`?v=d`) bruger **Roboto**, den skrifttype det rigtige valg.dk bruger, så prototypen genkendes som valg.dk.

| Fil i `fonts/` | CSS-navn | Original | Ophav / copyright | Licens |
|---|---|---|---|---|
| `roboto-400.woff`, `roboto-500.woff`, `roboto-700.woff` | VD Roboto | Roboto 2.137 (Regular, Medium, Bold) | Copyright 2011 Google Inc. All Rights Reserved. (Christian Robertson) | Apache License 2.0 – fuld tekst i `Apache-2.0.txt` |

## Hentet fra og ændret
- Hentet 23. oktober 2026 fra valg.dk's eget stylesheet (`https://valg.dk/styles.b7277aee8c8914b8.css` peger på `Roboto-Regular/Medium/Bold.*.ttf` på valg.dk). Filernes metadata bekræfter, at det er Googles Roboto 2.137 under Apache License 2.0.
- Filerne er gjort mindre med `pyftsubset` (fontTools): kun latinske tegn og de tegn, dansk bruger, gemt som WOFF. Copyright- og licensoplysninger i fontfilerne er bevaret.
- CSS-navnet "VD Roboto" bruges, så version A, B og C ikke ændrer udseende.

## Ikke længere i brug
`inter-*.woff`, `interdisplay-800.woff`, `lora-var.woff` og `OFL-1.1.txt` blev brugt i en tidligere udgave af version D og indlæses ikke længere. De kan slettes. Hvis de bliver liggende, gælder SIL Open Font License 1.1 (`OFL-1.1.txt`): Inter, Copyright 2016 The Inter Project Authors; Lora, Copyright 2011 The Lora Project Authors (Reserved Font Name "Lora", den medfølgende delmængde er omdøbt).

## Til kildelogen (bilag 14.6)
- Roboto (Google, Christian Robertson), Apache License 2.0, hentet 23.10.2026 fra valg.dk, brugt som skrifttype i prototypens version D.
- Farvekoderne i version D er aflæst fra valg.dk's stylesheet samme dag (fx `--color-primary-gray: #3F5061`, `--color-primary-yellow: #ECE5B7`, `--color-tertiary-page-background: #F9F9F8`).
