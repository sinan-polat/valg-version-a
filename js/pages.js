/* Tekstindhold til faste sider. Teksten er gengivet fra den officielle valg.dk til brug i prototypen,
   så sider og sprog ligner det officielle site. Teksterne beskriver den officielle side og gælder ikke for prototypen. */
window.PAGES = {
  notice: 'Teksten på denne side er gengivet fra den officielle valg.dk til brug i prototypen. Den beskriver den officielle side og er ikke gældende for denne prototype.',

  om: {
    title: 'Om valg.dk',
    paras: [
      'Valg.dk er den offentlige indgang for valg i Danmark. Her kan du både finde valgresultater for igangværende og tidligere valg.',
      'KOMBIT er ansvarlig for hjemmesiden VALG.dk. Hvis du har spørgsmål, kan du kontakte valg@kombit.dk.',
    ],
  },

  drift: {
    title: 'Driftstatus for valg.dk',
    lead: 'Information om driftstatus på valg.dk',
    items: [
      { date: '13. marts 2026', tag: 'INFORMATION', title: 'Visning af sammenligningstal på afstemningsområdeniveau er fjernet', body: ['Visning af sammenligningstal på kommune- og regionsniveau samt kredsniveau er uændret.'] },
      { date: '21. oktober 2025', tag: 'SERVICEVINDUE', title: 'Servicevindue d. 21/10/2025 fra kl. 21-23', body: ['Releasedato: 21/10/2025', 'Versionsnummer: 1.8.7', 'Bemærk, at du ikke kan tilgå valg.dk i dette tidsrum.'] },
      { date: '02. oktober 2025', tag: 'SERVICEVINDUE', title: 'Servicevindue d. 02/10/2025 fra kl. 18:30-22:30', body: ['Releasedato: 02/10/2025', 'Versionsnummer: 1.8.5', 'Bemærk, at du ikke kan tilgå valg.dk i dette tidsrum.'] },
      { date: '29. juli 2025', tag: 'SERVICEVINDUE', title: 'Servicevindue d. 07/08/2025 fra kl. 10.30-20.00', body: ['Releasedato: 07/08/2025', 'Versionsnummer: 1.8.0', 'Bemærk, at du ikke kan tilgå valg.dk i dette tidsrum.'] },
      { date: '07. juli 2025', tag: 'SERVICEVINDUE', title: 'Servicevindue d. 08/07/2025 fra kl. 10.30-20.00', body: ['Releasedato: 08/07/2025', 'Versionsnummer: 1.6.0', 'Bemærk, at du ikke kan tilgå valg.dk i dette tidsrum.'] },
      { date: '11. juni 2025', tag: 'SERVICEVINDUE', title: 'Servicevindue d. 16/06/2025 fra kl. 10.30-20.00', body: ['Releasedato: 16/06/2025', 'Versionsnummer: 1.7.0', 'Bemærk, at du ikke kan tilgå valg.dk i dette tidsrum.'] },
      { date: '13. maj 2025', tag: 'SERVICEVINDUE', title: 'Servicevindue d. 15/05/2025 fra kl. 12-16', body: ['Bemærk, at du ikke kan tilgå valg.dk i dette tidsrum.'] },
      { date: '02. april 2025', tag: 'SERVICEVINDUE', title: 'Servicevindue d. 02/04/2025 fra kl. 15-16', body: ['Releasedato: 02/04/2025', 'Versionsnummer: 1.5.1', 'Bemærk, at du ikke kan tilgå valg.dk i dette tidsrum.'] },
    ],
  },

  tilg: {
    title: 'Tilgængelighedserklæring',
    sections: [
      [null, ['KOMBIT A/S forpligter sig til at gøre webstedet www.valg.dk tilgængeligt, jf. Lov om tilgængelighed af offentlige organers websteder og mobilapplikationer (herefter ’webtilgængelighedsloven’).']],
      ['Oplever du, at der er ikke-tilgængeligt indhold på www.valg.dk?', [
        'Her har du mulighed for at underrette det ansvarlige offentlige organ om webstedets manglende overholdelse af tilgængelighedskrav i webtilgængelighedsloven. Derudover har du også mulighed for at anmode om oplysninger, som det ansvarlige offentlige organ eventuelt har undtaget i medfør af lovens § 1, stk. 5 (undtagelse af indhold) og § 3, stk. 2 (uforholdsmæssig stor byrde).',
        'Du kan kontakte KOMBIT A/S, hvis du oplever, at der er ikke-tilgængeligt indhold på www.valg.dk:',
        { list: ['Kontaktside: https://kombit.dk/loesninger/valg', 'E-mail: valg@kombit.dk', 'Telefon: 33349400'] },
        'Du bør ikke angive fortrolige eller følsomme personoplysninger som fx personnummer og helbredsoplysninger, når du kontakter det offentlige organ.']],
      ['Overholdelsesstatus', [
        'Som offentligt organ skal man angive, i hvilket omfang ens websted overholder kravene til webtilgængelighed, som de fremgår af den harmoniserede standard EN 301 549. Overholdelsesstatus skal udelukkende afspejle indhold omfattet af loven, og ikke tage højde for retmæssigt undtaget indhold. Overholdelsesstatus kan være:',
        { list: ['Webstedet overholder loven fuldt ud', 'Webstedet overholder loven delvist (overholder de fleste krav)', 'Webstedet overholder ikke loven (overholder ikke de fleste krav)'] },
        'Det offentlige organ oplyser: Webstedet overholder loven fuldt ud']],
      ['Evalueringsrapporter', ['Det offentlige organ har mulighed for at henvise til eventuelle evalueringsrapporter.', 'Det offentlige organ oplyser: Ingen henvisning til evalueringsrapporter']],
      ['Ikke-tilgængeligt indhold', [
        'Det offentlige organ har kategoriseret det ikke-tilgængelige indhold på dette websted. Under hver kategori kan der være en række emner, som vises med overskrifter samt en forklarende tekst. Et emne kan fx være manglende alternative tekster.',
        'Ikke-tilgængeligt indhold inddeles i tre kategorier, og omhandler funktion eller indhold, der:',
        { list: ['ikke overholder webtilgængelighedsloven.', 'ikke overholder webtilgængelighedsloven og falder ind under undtagelsen om en uforholdsmæssig stor byrde, fx en rapport eller vejledning der er meget omfangsrig og med en lille læserskare.', 'ikke er omfattet af webtilgængelighedsloven, som fx tekstning af videoer, der sendes live.'] }]],
      ['Overholder ikke webtilgængelighedsloven', ['Intet at angive']],
      ['Uforholdsmæssig stor byrde', ['Intet at angive']],
      ['Ikke omfattet af loven', ['Intet at angive']],
      ['Initiativer for at opnå en højere grad af webtilgængelighed', ['Det offentlige organ har mulighed for at beskrive, hvad de gør for at opnå en højere grad af webtilgængelighed på webstedet.', 'Det offentlige organs beskrivelse:', 'Ingen beskrivelse']],
      ['Henvendelse til Digitaliseringsstyrelsen', [
        'Digitaliseringsstyrelsen fører tilsyn med, om webtilgængelighedsloven overholdes.',
        'Før du kontakter Digitaliseringsstyrelsen, skal du kontakte den ansvarlige myndighed eller det offentligretlige organ med henblik på at løse webtilgængelighedsproblemet. Det gør du ved hjælp af kontaktinformationen, der fremgår øverst i denne tilgængelighedserklæring.',
        'Hvis du oplever, at myndigheden eller det offentligretlige organ, der har ansvaret for webstedet, ikke svarer tilfredsstillende på din henvendelse, kan du sende en henvendelse til Digitaliseringsstyrelsen på mail webtilsyn@digst.dk eller indtale en besked på telefon 20 16 36 12.',
        'Digitaliseringsstyrelsen vurderer din henvendelse og vender tilbage inden 10 arbejdsdage.',
        'Digitaliseringsstyrelsen anvender henvendelserne som input til tilsynsindsatsen for overholdelse af webtilgængelighedsloven. For henvendelser, der ikke er relateret til webtilgængelighed, skal du kontakte den relevante myndighed direkte.']],
      [null, ['Denne erklæring blev første gang offentliggjort den 13. december 2023.', 'Erklæringen blev senest revideret den 15. april 2026.']],
    ],
  },

  priv: {
    title: 'Privatlivspolitik og brug af data',
    sections: [
      ['Privatlivspolitik', []],
      ['Kommunens, regionens, Ankestyrelsens eller Indenrigsministeriets behandling af personoplysninger om kandidater', [
        'Kommunen, regionen, Ankestyrelsen eller Indenrigsministeriet er dataansvarlige for behandlingen og offentliggørelse af kandidatoplysninger og valgresultater i forbindelse med valghandlinger.',
        'Ifølge databeskyttelsesforordningens (Europa-Parlamentets og Rådets forordning (EU) 2016/679 af 27. april 2016 om beskyttelse af fysiske personer i forbindelse med behandling af personoplysninger og om fri udveksling af sådanne oplysninger og om ophævelse af direktiv 95/46/EF) artikel 13 og 14 skal vi informere kandidater til valg om, hvordan oplysninger om kandidaterne, der indsamles i forbindelse med valg, behandles.',
        'Oplysninger om kandidater, herunder navn, stemmetal, oplysning om politisk overbevisning og oplysning om, i hvilken kommune/region en kandidat har været opstillet, offentliggøres på valg.dk med henblik på at holde resultaterne af valg let tilgængelige for offentligheden, hvilket anses for at være af væsentlig samfundsmæssig interesse i et demokratisk samfund.',
        'Offentliggørelsen af ikke-følsomme personoplysninger om kandidater har hjemmel i forordningens artikel 6, stk. 1, litra e, hvorefter behandling er lovlig, når behandlingen er nødvendig af hensyn til udførelsen af en opgave i samfundets interesse. Det samme gælder offentliggørelsen af følsomme personoplysninger om politisk overbevisning, som videre har hjemmel i forordningens artikel 9, stk. 2, litra g, jf. databeskyttelseslovens § 7, stk. 4. Af sidstnævnte bestemmelse følger, at behandling af oplysninger omfattet af databeskyttelsesforordningens artikel 9, stk. 1 - herunder oplysninger om politisk overbevisning - kan ske for en offentlig myndighed, hvis behandlingen er nødvendig af hensyn til væsentlige samfundsinteresser, jf. databeskyttelsesforordningens artikel 9, stk. 2, litra g. Offentligheden i et demokratisk samfund må, af hensyn til gennemsigtighed, kunne stole på, at det er det fulde, uredigerede og endelige valgresultat, der ligger offentliggjort på de hjemmesider, der opfattes som valgmyndighedernes officielle kanaler.']],
      ['Hvor stammer personoplysningerne om kandidater fra?', ['Vi har de oplysninger, som kandidaten selv eller vedkommendes parti har givet kandidatanmeldelsesmyndigheden for den specifikke valghandling, og som kandidatanmeldelsesmyndigheden har videregivet til kommune eller region, hvor kandidaten er opstillet.']],
      ['Hvor længe opbevarer vi personoplysningerne?', ['Vi opbevarer oplysninger om kandidater, så længe valgresultatet er af væsentlig samfundsmæssig interesse.']],
      ['Hvem videregiver eller overlader vi personoplysninger til?', ['Der videregives eller overlades personoplysninger til følgende kategorier af modtagere, udover at oplysningerne er offentlige tilgængelige på valg.dk:', { list: ['Medier, Danmarks Statistik og offentlige myndigheder', 'Databehandlere, der behandler og opbevarer oplysninger om kandidater for os, fx It-leverandører.'] }]],
      ['Ret til berigtigelse, sletning, begrænsning, indsigelse og indsigt', [
        'Efter databeskyttelsesforordningen har de personer, der behandles oplysninger om (de registrerede), ret til at anmode om indsigt i og berigtigelse eller sletning af oplysningerne. De registrerede har også ret til at anmode om begrænsning af og til at gøre indsigelse mod behandlingen af oplysninger om dem. Der gælder dog visse undtagelser til de nævnte rettigheder, herunder retten til sletning. Retten til sletning gælder således eksempelvis ikke, når fortsat behandling af oplysningerne, der ønskes slettet, er nødvendig for at overholde en retlig forpligtelse.',
        'Valghandlinger og behandlingen af kandidaters personoplysninger er reguleret i valglovene, hhv. lov om kommunale og regionale valg, lov om valg til Folketinget og lov om valg af danske medlemmer til Europa-Parlamentet. Det følger af valglovene, at valgmaterialet skal opbevares som fastsat efter lov om offentlige arkiver m.v. Efter valget er godkendt, opbevares ikke andre personoplysninger, end dem som er frit tilgængelige på valg.dk. Der opbevares dermed ikke andre personoplysninger, som der efterfølgende kan anmodes om indsigt i hos kommunen, regionen, Ankestyrelsen eller Indenrigministeriet.']],
      ['Spørgsmål til rettighederne efter databeskyttelsesforordningen til berigtigelse, sletning m.v.', ['Hvis kandidater har spørgsmål vedrørende de oplysninger, der registreres om dem i forbindelse med valg, eller de registreredes rettigheder efter databeskyttelsesforordningen kan de kontakte kommunens, regionens, Ankestyrelsens eller Indenrigsministeriets databeskyttelsesrådgiver (også kaldet DPO / Data Protection Officer) ved brug af kontaktoplysninger på kommunens, regionens eller Indenrigsministeriet hjemmeside. På datatilsynet.dk kan der læses mere om databeskyttelsesrådgiverens rolle.']],
      ['Klage til Datatilsynet', ['Kandidater har ret til at indgive en klage til Datatilsynet, hvis de er utilfredse med den måde, vi behandler deres personoplysninger på. Datatilsynets kontaktoplysninger kan findes på www.datatilsynet.dk.']],
      ['Brug af data', [
        'KOMBIT er ansvarlig for hjemmesiden Valg.dk, hvor der vises data om opstillede kandidater og partier samt stemmetal indtastet af kommuner og regioner.',
        'Data vedrørende valg afholdt før den 1. oktober 2025 stammer fra tredjepart. KOMBIT kan ikke garantere for disse datas korrekthed eller fuldstændighed. KOMBIT fraskriver sig ethvert ansvar for fejl, mangler eller konsekvenser ved brug af disse data. Brug af data sker således på eget ansvar.',
        'Alle data på hjemmesiden Valg.dk – herunder dataudtræk til download – kan frit anvendes både kommercielt og ikke-kommercielt, forudsat at kilde angives. Dette svarer til licensen Creative Commons CC BY 4.0.']],
    ],
  },
};
