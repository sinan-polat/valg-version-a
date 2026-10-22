# valg.dk – prototype til bachelorprojekt

Kodet, klikbar prototype (ren HTML, CSS og JavaScript – ingen frameworks, ingen server) af en **opgavebaseret informationsarkitektur** for Valg.dk. Den er lavet til at blive testet med rigtige brugere og dokumenteret i bachelorprojektet.

> **Vigtigt:** Alle tal er **eksempeldata** (genereret af `tools/generate_data.py`). Prototypen er **ikke** den officielle Valg.dk og indeholder ingen officielle valgresultater. Det fremgår af banner og footer på alle sider.

Hvad kan prototypen?
| Skærm | Adresse | Hvad virker |
|---|---|---|
| Forside | #/ | Én skærm uden scroll: søgning og kommunevalg til venstre; til højre et kort med faner (**Mandatfordeling** · **Kort** · **Hvem er valgt ind?**) og skift mellem Kommunal- og Folketingsvalg. **Din kommune:** vælg en kommune i søgningen, i listen eller ved at klikke på kortet, så skifter kortet til kommunens resultat uden sideskift. Valget huskes i browseren (localStorage) og kan fjernes med «Hele landet». Valgaftens-simulationen startes med knappen i kortet og vises som en bjælke; «Din kommune» viser, om kommunen er optalt endnu |
| Find resultat | #/find | Valg, søgning på kommune/region, hurtigvalg for Hele landet og regioner |
| Resultat | #/resultat/horsholm, #/resultat/region-hovedstaden, #/resultat/land | Mandater, sortering, ændring, kort og kommuneliste for regioner/landet, download |
| Sammenlign | #/sammenlign | 2–3 områder (kommuner, regioner, hele landet) i diagram eller tabel |
| Hent data | #/data | Guide i 4 trin: nøgletal/parti, hele landet/regioner/kommuner, valg, format. Forhåndsvisning og download |
| Afstemningsområde | #/resultat/horsholm/o1 | Stemmer pr. parti på afstemningsområde-niveau (eksempeldata, fiktive navne), ændring ift. forrige valg, download. Mandater vises kun på kommuneniveau. |
| Parti | #/parti/V | Søg på partinavn eller bogstav (forslag på forsiden). Landstal, ændring og alle kommuner sorteret efter andel/mandater, download. Kandidatsøgning er ikke med (ender i blindgyde). |
| Faste sider | #/om-valg, #/driftstatus, #/tilgaengelighed, #/privatliv, #/sitemap | Tekst gengivet fra officielle valg.dk (gælder ikke prototypen) |

Kortet er skematisk (ikke et officielt kort); kommunernes placering er omtrentlig, og cirklens areal viser antal valgberettigede, så København ikke ser lille ud. Alle tal er eksempeldata.

Testpanel: åbn adressen med ?test=1. Panelet er en diskret fane i højre kant (Alt+T åbner/lukker) og lukker selv ved Start. Opgaver T1–T4; T4 = hent tal for alle kommuner i Region Hovedstaden (Hent data > Udvalgte regioner, 29 kommuner).

Opdater siden: git add . / git commit -m "Opdatering" / git push.

## Version C – nyt design: valgaften, kredse og kandidater

Åbn `?v=c` (fx `https://sinan-polat.github.io/valg.dk/?v=c`). Standard er stadig version B, så A/B-testen ikke ændrer sig. Vil du gøre C til standard, så ret den ene linje i `js/ver.js` (`: 'b'` → `: 'c'`).

| Nyt | Hvor | Hvad |
|---|---|---|
| Header | alle sider | Valgresultater, Kandidater og kredse, **Sammenlign** og **Hent data** ligger i headeren. Søg-knap (genvej: tasten /) og burgermenu med tre grupper: *Til dig som vælger*, *Til dig der vil nørde*, *Om valg.dk* |
| Forside | #/ | Én skærm uden scroll: søgning og kommunevalg til venstre, til højre et kort med faner (**Mandatfordeling** · **Kort** · **Hvem er valgt ind?**) og skift mellem Kommunal- og Folketingsvalg. Live-optælling (simuleret) vises som bjælke i kortet. På mobil stakkes indholdet, og kun kortets indhold scroller |
| Live | forsiden | Knappen *Se valgaftenen live (simulation)* tæller kommunerne op en ad gangen. Kort, mandatfordeling, valgte og status opdateres løbende. Pause, spring til slut, forfra |
| Kredse og kandidater | #/kredse | Træ der foldes ud: storkreds → opstillingskreds → kandidater (folketingsvalg) eller region → kommune → afstemningsområder og valgte (kommunalvalg). Filter på kandidatnavn |
| Hvem er valgt ind? | #/valgt | Mandatfordeling og alle valgte med filter på parti, område og navn, sortering og Excel-udtræk |
| Detaljesider | #/storkreds/…, #/kreds/…, #/kandidat/… | Tal, valgte og kandidater pr. kreds, og en side pr. kandidat |
| Kommunesiden | #/resultat/… | Nyt afsnit med valgte byrådsmedlemmer og alle kandidater pr. parti |
| Metode | #/metode | Enkelt svar på: hvad er mandatfordeling, og hvem er valgt ind? |

**Data:** `tools/generate_kandidater.py` laver `js/kandidater.js` ud fra `js/data.js`. Alle navne er fiktive, "Folketingsvalg (eksempel)" er et opdigtet valg, og mandatfordelingen er en forenklet beregning. Opstillingskredsene er en forenklet inddeling (ca. 95), ikke den officielle. Kør `python3 tools/generate_data.py` og derefter `python3 tools/generate_kandidater.py`, hvis du vil have nye tal.

Kommentar til rapporten: version C er en tredje variant og indgår ikke i A/B-testen, medmindre du selv beslutter det. Metodeteksten på #/metode er skrevet til prototypen og skal kontrolleres mod officielle kilder.

Læg den på GitHub Pages (ca. 5 minutter)

1. Log ind på github.com og klik **New repository**. Giv det et neutralt navn, fx `valg-prototype`. Vælg **Public**. (Gratis Pages kræver et offentligt repository.)
2. På repoets side: **uploading an existing file**. Træk **hele indholdet** af denne mappe ind (`index.html`, `css/`, `js/`, `tools/`, `README.md`, `.nojekyll`). Husk, at `index.html` skal ligge øverst i repoet. Klik **Commit changes**.
3. Gå til **Settings → Pages**. Under *Build and deployment* vælger du **Deploy from a branch**, branch **main** og mappe **/ (root)**. Klik **Save**.
4. Vent 1–2 minutter. Adressen står øverst på Pages-siden:  
   `https://DIT-BRUGERNAVN.github.io/valg-prototype/`
5. Test linket selv. Til deltagerne sender du blot det link. Til dig selv som facilitator åbner du:  
   `https://DIT-BRUGERNAVN.github.io/valg-prototype/?test=1`

Opdatering senere: upload de ændrede filer igen (samme filnavne), og vent et minut.

Siden har `noindex`, så søgemaskiner ikke bør vise den, men et offentligt link kan stadig deles. Kontrollér med Søren/KOMBIT, før du deler linket, da KOMBITs navn indgår i footeren. Læg ingen interviewcitater eller fortrolige oplysninger i repoet.

## Brug testpanelet (til dig som facilitator)

Åbn siden med `?test=1`. Panelet i hjørnet viser opgaven, og alt gemmes **kun lokalt i browseren**. Der indsamles ingen personoplysninger – brug et anonymt deltager-id (P01, P02 …).

1. Vælg opgave (T1–T4), læs den højt for deltageren, og tryk **Start**. Siden hopper til forsiden.
2. Deltageren løser opgaven og tænker højt. Panelet måler **tid, klik, sider og blindgyder** automatisk.
3. Tryk **Stop**, vælg udfald (Lykkedes / Delvist / Mislykkedes) og **SEQ 1–7** (hvor let var opgaven?), og skriv noter. Tryk **Gem opgave**.
4. Tryk **Næste** ved ny deltager. **Download CSV** giver alle resultater (åbner i Excel). Kolonner: deltager, opgave, gruppe, udfald, seq, sekunder, klik, sider, blindgyder, sorteringer, eksporter, søgninger, note, rutesti, tidspunkt.

Tip: Skjul panelet (pilen) under skærmdeling, og læs selv opgaven højt.

### ## A/B-test: nuværende struktur mod opgavebaseret

Prototypen har to versioner med samme data, samme sider og samme opgaver:

| Version | Adresse (send til deltageren) | Struktur |
|---|---|---|
| A – nuværende struktur | `https://sinan-polat.github.io/valg.dk/?v=a` | Som den nuværende side: forside med status på optælling og Danmarkskort (klik på kommune), derefter kommune og afstemningsområde. Valgtyper som liste. Sammenlign og Eksport ligger kun under det enkelte valg (og Eksport i footeren). Ingen opgavekort, regioner eller Hent data i menuen. |
| B – opgavebaseret | `https://sinan-polat.github.io/valg.dk/?v=b` (standard) | Opgavekort, kort over Danmark og regioner, Sammenlign og Hent data i hovedmenuen |

Versionen huskes i browserfanen. Del deltagerne ligeligt (fx P01, P03 … får A, P02, P04 … får B), og lad dem løse de samme opgaver. Facilitatoren åbner med `?test=1&v=a` eller `&v=b` og kan også skifte version i testpanelet.

Testpanelet gemmer pr. opgave: version, tid, klik, sider, blindgyder, første klik, udfald og SEQ. Knappen SUS åbner de ti SUS-spørgsmål, som stilles efter alle opgaver; scoren (0–100, 68 er gennemsnit) gemmes sammen med versionen.

Siden `#/testresultater` (kun med `?test=1`) sammenligner A og B pr. opgave med diagram, tabel og SUS, og kan indlæse CSV-filer fra andre enheder og hente en opsummering til Excel. Stikprøverne er små, så brug resultaterne til at pege på mønstre og ikke som statistisk bevis.

Testopgaver og forventede svar

| Id | Brugergruppe | Opgave | Forventet svar |
|---|---|---|---|
| T1 | Borger | Find ud af, hvor mange mandater Hørsholm Kommune fik ved Kommunalvalg 2025, og hvilket parti der fik flest. | 19 mandater. Parti C (Konservative) fik flest (6). |
| T2 | Journalist/analytiker | Sammenlign mandatfordelingen i Hørsholm og Ishøj, og hent tallene, så du kan åbne dem i et regneark. | Sammenligningssiden Hørsholm vs. Ishøj og en downloadet fil. |
| T3 | Borger/analytiker | Find ud af, hvilket parti der fik flest mandater i Ishøj, og om partiet fik flere eller færre end ved valget i 2021. | A (Socialdemokratiet), 9 mandater, ét færre end 2021. |
| T4 | Journalist/analytiker | Hent valgtal fra alle kommuner i Region Hovedstaden til et regneark. | Hent data > Udvalgte regioner > Region Hovedstaden, 29 kommuner, download. |

Forslag til succeskriterier: T1 inden for 30 sekunder uden hjælp; T2 når eksport uden hjælp; T3 inden for 60 sekunder. Brug 3–5 deltagere pr. brugergruppe.

## Hvordan prototypen hænger sammen med opgaven

- **Garrett (struktur/skelet):** forsiden er organiseret efter opgaver, ikke valgtyper. Valgtyperne ligger nederst som sekundær indgang.
- **Yablonski (2. udgave, 2024):** Hicks lov (tre opgavekort på forsiden i version B), Jakobs lov (kendte mønstre i søgning, og version A som kendt baseline), Chunking (Hent data i trin), Progressive disclosure (foldbare sektioner). Mandater øverst og størst er begrundet i interviewene (Marina), ikke i en bestemt lov.
- **Houde & Hill:** prototypen tester primært *role* og *look and feel* – om brugeren forstår strukturen og finder frem. *Implementation* er fingeret (eksempeldata).
- **Empiri (interviews):** ønsker om mandater først, størst-til-mindst, samlet eksport og at dele op efter, hvad man kommer for. Brug citater kun efter aftale med KOMBIT (anonymisering).

### Forslag til tekst i metodeafsnittet (5.6 Prototypeudvikling)

> Prototypen er udviklet som en kodet, klikbar webprototype i HTML, CSS og JavaScript og hostet på GitHub Pages, så den kan testes af brugere på egne enheder. Wireframes og informationsarkitektur er udarbejdet i Figma og dokumenterer designbeslutningerne. Prototypen bruger eksempeldata og er et testredskab for informationsarkitekturen, ikke et færdigt produkt. Udviklingen er sket med AI-assistance (Claude) ud fra mine beslutninger om koncept, brugerflows, indhold og teori. Jeg har gennemgået og tilpasset resultatet.

## Ændringer i forhold til Figma-skærmene

- Valget i prototypen er **Kommunalvalg 2025 og 2021** i stedet for Folketingsvalg, fordi mandater gælder pr. kommune ved kommunalvalg (og det er det, Valg-løsningen blev taget i brug til i november 2025). Folketingsvalg er ikke med.
- Sammenligning kan have op til **tre** områder, og der er fire mål.
- Eksport findes i to formater: **Excel** (semikolon, decimalkomma, åbner direkte i dansk Excel) og **CSV (UTF-8)** (komma, decimalpunktum).

## Skift eksempeldata ud med rigtige tal

`js/data.js` er genereret. Strukturen er beskrevet i `tools/generate_data.py`. Du kan enten ændre scriptet og køre `python3 tools/generate_data.py`, eller erstatte `js/data.js` med data i samme format (`window.DATA = {...}`). Ved rigtige tal bør du fjerne "eksempeldata"-teksterne (søg efter "eksempeldata" i `js/app.js` og `index.html`).

## Begrænsninger

- Opdateringer og seneste sammenligninger er opdigtede til prototypen.
- Søgning på parti og kandidat er ikke bygget (ender i blindgyde). Det er en bevidst afgrænsning.
- Kun en delmængde af valgtyper er med (se accordion på forsiden).

## Filer

```
index.html            skal + hovednavigation
css/style.css         design (farver som CSS-variabler øverst)
js/app.js             alle skærme, routing, søgeforslag, diagrammer, eksport
js/data.js            eksempeldata (genereret)
js/test-mode.js       testpanel (kun med ?test=1)
tools/generate_data.py  genererer eksempeldata
.nojekyll             så GitHub Pages serverer filerne uændret
```

## Del, udskriv og gem som billede
Resultat, sammenligning, parti og Hent data har knapperne Kopiér link (adressen uden testparametre) og Udskriv (printvenlig, uden menuer og knapper). Sammenligningsdiagrammet og kortene kan gemmes som PNG med titel, signaturforklaring og kildelinje.

## Stemmeændringer og afstemningsområder
Partitabellerne viser nu ændring i stemmeandel (%-point) og i antal stemmer ift. forrige valg, ud over ændring i mandater. Hver kommune har afstemningsområder (fiktive navne og tal, summerer til kommunens tal), og Hent data kan hente data pr. afstemningsområde.

## Logo
Logoet ligger i `img/valg.svg` (lyst logo til den mørke header/footer) og bruges i `index.html`. Det er dekorativt (`alt=""`); linket har `aria-label`.


### Billeder og video (skal tilføjes manuelt)
Prototypen indeholder bevidst ingen fotos eller videoer, fordi de ikke kunne hentes og licens-tjekkes automatisk. Tilføj egne billeder sådan:
1. Brug kun materiale med fri licens (fx Wikimedia Commons, CC BY/CC0) eller dine egne optagelser. Gem det i `img/`.
2. **Log hvert billede i kildelogen (bilag 14.6):** titel, ophavsperson, URL, licens, dato hentet og hvor det bruges. Skriv kreditering i `alt`-teksten eller i en billedtekst.
3. Billeder skal have meningsfuld `alt`-tekst, og videoer skal have undertekster.
4. Husk at prototypen ikke må kunne forveksles med den officielle valg.dk, så brug ikke officielle logoer eller pressefotos af rigtige politikere uden tilladelse.