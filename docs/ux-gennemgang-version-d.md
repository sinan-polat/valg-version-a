# UX-gennemgang af version D (22. oktober 2026)

Gennemgangen er lavet med Claude (AI) og brugerens egne bots: Koordinatoren, Brugerrejse-eksperten, UX-eksperten, Dommeren og Idégeneratoren. Rejserne er kørt automatisk i Chromium (Playwright) på 1440 og 390 px. Det er **ikke** en brugertest med rigtige deltagere. Profiler og opgaver er rapportens egne (tabel 3, afsnit 6.2, og testopgaverne T1–T4 i afsnit 5.7). Tallene er prototypens eksempeldata.

Hvis noget herfra bruges i rapporten, skal brugen af AI deklareres, og dokumentet kan ligge som bilag.

## Formål
Hver brugergruppe skal kunne besvare "Hvordan gik valget?" for deres eget behov på få skridt, uden blindgyder.

## Friktionstabel

| # | Profil | Opgave | Friktion før | Skridt før → efter | Løsning |
|---|---|---|---|---|---|
| 1 | Analytiker/journalist | T4: hent tal for alle kommuner i Region Hovedstaden | Region gav én samlet række, ikke 29 kommuner (blindgyde) | ikke muligt → 3 (Hent data, vælg region, hent) | Region i Hent data giver én række pr. kommune; menuen viser "Region Hovedstaden (29 kommuner)" |
| 2 | Journalist/analytiker | T2: sammenlign Hørsholm og Ishøj og hent tallene | Ingen hent-knap på sammenligningen (blindgyde) | ikke muligt → 4 (Sammenlign, område 1, område 2, hent) | Knap "Hent sammenligningen (Excel)" |
| 3 | Borger | T1: mandater i Hørsholm | Kommunen skulle findes i en menu med 104 punkter eller på kortet; søgning lå bag en knap | 2–3 + rul → 1 felt + skriv + Enter | Synligt søgefelt på forsiden (P2: bevar søgningen, som interviewpersonen fremhævede) |
| 4 | Borger/analytiker | T3: største parti i Ishøj og ændring siden 2021 | Ændringen stod kun som tal i en kolonne | aflæses i tabellen → står i første sætning | Resuméet siger fx "9 af 15 mandater, 1 mandat færre end ved kommunalvalg 2021" |
| 5 | Politiker i valgcafé | Se på storskærm, om man er valgt ind | Storskærmen viste landets topstemmer, og kommunen kunne ikke vælges | ikke muligt → 2 (vælg kommune, billede "Valgt i …") | Kommunevalg på Storskærm og billede med alle valgte i kommunen |

## Rettede fejl
- Søgefeltet arvede partibogstav-boksens faste bredde (navnekonflikt på klassen `.box`), så feltet blev 30 px bredt i version D.
- Forskellen i procentpoint blev klippet i sammenligningen på 375 px.

## Dommerens vurdering (1–5)

| Kriterium | Før | Efter | Begrundelse |
|---|---|---|---|
| Opgaveløsning T1–T4 | 2 | 5 | T2 og T4 var blindgyder; nu løses alle fire |
| Dækning af profiler (tabel 3) | 3 | 4 | Politikeren har nu en egnet visning; borgerens afstemningssted ligger stadig ét niveau nede ("Se alle tal") |
| Genkendelighed (P2) | 3 | 4 | Søgefeltet er synligt igen |
| Tilgængelighed (egne scripts) | 4 | 4 | Synlig fokus, navngivne felter, ingen vandret scroll; ikke en officiel audit |
| Risiko | 3 | 4 | Færre blindgyder; designet er stadig ikke brugertestet |

**Dom:** 🟡 Godkendt med ændringer: test version D med 3–5 brugere på opgaverne T1–T4 plus politikerens opgave, før effekten beskrives i rapporten.

## Idégeneratorens tre bedste næste skridt
1. Kør T1–T4 med 3–5 deltagere på mobil i version D (testpanel: `?v=d&test=1`).
2. Vis afstemningsstedet direkte i svaret, når en kommune er valgt (borgerens job i tabel 3).
3. En link-knap på svaret, så journalister kan dele præcis den visning (adressen opdateres allerede).
