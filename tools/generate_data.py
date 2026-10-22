#!/usr/bin/env python3
"""
Genererer EKSEMPELDATA til prototypen (js/data.js).

Tallene er opdigtede, men konsistente: mandater beregnes med d'Hondt ud fra
stemmetal, så sum af mandater = kommunens antal byrådsmedlemmer.
Prototypen bruger IKKE officielle valgresultater.

Kør:  python3 tools/generate_data.py
"""
import hashlib
import json
import math
import random
import re
from pathlib import Path

REGIONS = {
    "Region Hovedstaden": ["Albertslund", "Allerød", "Ballerup", "Bornholm", "Brøndby", "Dragør", "Egedal", "Fredensborg", "Frederiksberg", "Frederikssund", "Furesø", "Gentofte", "Gladsaxe", "Glostrup", "Gribskov", "Halsnæs", "Helsingør", "Herlev", "Hillerød", "Hvidovre", "Høje-Taastrup", "Hørsholm", "Ishøj", "København", "Lyngby-Taarbæk", "Rudersdal", "Rødovre", "Tårnby", "Vallensbæk"],
    "Region Sjælland": ["Faxe", "Greve", "Guldborgsund", "Holbæk", "Kalundborg", "Køge", "Lejre", "Lolland", "Næstved", "Odsherred", "Ringsted", "Roskilde", "Slagelse", "Solrød", "Sorø", "Stevns", "Vordingborg"],
    "Region Syddanmark": ["Assens", "Billund", "Esbjerg", "Fanø", "Fredericia", "Faaborg-Midtfyn", "Haderslev", "Kerteminde", "Kolding", "Langeland", "Middelfart", "Nordfyns", "Nyborg", "Odense", "Svendborg", "Sønderborg", "Tønder", "Varde", "Vejen", "Vejle", "Ærø", "Aabenraa"],
    "Region Midtjylland": ["Favrskov", "Hedensted", "Herning", "Holstebro", "Horsens", "Ikast-Brande", "Lemvig", "Norddjurs", "Odder", "Randers", "Ringkøbing-Skjern", "Samsø", "Silkeborg", "Skanderborg", "Skive", "Struer", "Syddjurs", "Viborg", "Aarhus"],
    "Region Nordjylland": ["Brønderslev", "Frederikshavn", "Hjørring", "Jammerbugt", "Læsø", "Mariagerfjord", "Morsø", "Rebild", "Thisted", "Vesthimmerland", "Aalborg"],
}

PARTIES = {
    "A": ("Socialdemokratiet", "#E4003B"),
    "B": ("Radikale Venstre", "#733280"),
    "C": ("Det Konservative Folkeparti", "#00583C"),
    "D": ("Nye Borgerlige", "#0F4C5C"),
    "F": ("SF – Socialistisk Folkeparti", "#E5007D"),
    "I": ("Liberal Alliance", "#12B7C4"),
    "K": ("Kristendemokraterne", "#F58220"),
    "M": ("Moderaterne", "#8B5CB8"),
    "O": ("Dansk Folkeparti", "#C9A400"),
    "V": ("Venstre", "#0B6CB5"),
    "Æ": ("Danmarksdemokraterne", "#5D6D7E"),
    "Ø": ("Enhedslisten", "#B5162B"),
    "Å": ("Alternativet", "#2EBD59"),
}

# Landsgennemsnitlige "basisandele" (eksempel) pr. valg
BASE = {
    "kv2025": {"A": 22, "B": 5, "C": 9, "F": 10, "I": 7, "K": 1.5, "M": 5, "O": 4, "V": 15, "Æ": 5, "Ø": 6, "Å": 1.5},
    "kv2021": {"A": 24, "B": 6, "C": 11, "D": 3, "F": 9, "I": 3, "K": 2, "O": 7, "V": 22, "Ø": 7, "Å": 3},
}

# Faste profiler til testcases (så opgaverne T1–T4 har entydige svar)
FIXED = {
    "Hørsholm": {
        "seats": 19, "electorate": 18400,
        "kv2025": {"turnout": 74.5, "shares": {"C": 31.0, "V": 21.5, "A": 16.2, "F": 11.0, "I": 9.8, "B": 5.6, "Ø": 4.9}},
        "kv2021": {"turnout": 72.1, "shares": {"C": 36.0, "V": 24.0, "A": 14.0, "F": 8.0, "I": 4.0, "B": 6.0, "Ø": 4.0, "O": 2.0, "Å": 2.0}},
    },
    "Ishøj": {
        "seats": 15, "electorate": 17200,
        "kv2025": {"turnout": 54.3, "shares": {"A": 44.0, "F": 11.0, "V": 8.5, "O": 7.5, "Ø": 8.0, "C": 4.5, "I": 5.0, "B": 4.5, "Æ": 4.0, "M": 3.0}},
        "kv2021": {"turnout": 52.0, "shares": {"A": 52.0, "O": 12.0, "V": 9.0, "F": 8.0, "Ø": 6.0, "C": 4.0, "B": 3.0, "K": 2.0, "Å": 4.0}},
    },
}

BIG = {"København": (55, 460000), "Aarhus": (31, 260000), "Odense": (29, 165000), "Aalborg": (31, 155000), "Frederiksberg": (25, 82000),
       "Esbjerg": (31, 85000), "Randers": (31, 75000), "Kolding": (31, 70000), "Horsens": (31, 70000), "Vejle": (31, 80000), "Roskilde": (31, 70000)}
SMALL = {"Fanø": 11, "Samsø": 11, "Ærø": 11, "Læsø": 11}
OFFICIAL_NAMES = {"Aabenraa": "Aabenraa", "Aalborg": "Aalborg", "Aarhus": "Aarhus"}


# Omtrentlige midtpunkter (breddegrad, længdegrad) – kun til det skematiske kort
COORDS = {
 "Albertslund":(55.66,12.35),"Allerød":(55.87,12.35),"Ballerup":(55.73,12.36),"Bornholm":(55.13,14.9),"Brøndby":(55.65,12.42),"Dragør":(55.59,12.67),"Egedal":(55.78,12.2),"Fredensborg":(55.98,12.4),"Frederiksberg":(55.68,12.53),"Frederikssund":(55.84,12.07),"Furesø":(55.8,12.38),"Gentofte":(55.75,12.55),"Gladsaxe":(55.75,12.48),"Glostrup":(55.67,12.4),"Gribskov":(56.03,12.25),"Halsnæs":(55.95,11.9),"Helsingør":(56.03,12.55),"Herlev":(55.72,12.43),"Hillerød":(55.93,12.3),"Hvidovre":(55.64,12.47),"Høje-Taastrup":(55.65,12.27),"Hørsholm":(55.88,12.5),"Ishøj":(55.61,12.35),"København":(55.68,12.58),"Lyngby-Taarbæk":(55.78,12.5),"Rudersdal":(55.84,12.45),"Rødovre":(55.69,12.45),"Tårnby":(55.62,12.6),"Vallensbæk":(55.63,12.37),
 "Faxe":(55.25,12.1),"Greve":(55.58,12.3),"Guldborgsund":(54.85,11.85),"Holbæk":(55.72,11.72),"Kalundborg":(55.68,11.1),"Køge":(55.46,12.18),"Lejre":(55.6,11.97),"Lolland":(54.8,11.35),"Næstved":(55.23,11.76),"Odsherred":(55.85,11.6),"Ringsted":(55.44,11.79),"Roskilde":(55.64,12.08),"Slagelse":(55.4,11.35),"Solrød":(55.53,12.22),"Sorø":(55.43,11.57),"Stevns":(55.35,12.37),"Vordingborg":(55.0,12.0),
 "Assens":(55.27,9.9),"Billund":(55.73,9.12),"Esbjerg":(55.47,8.45),"Fanø":(55.42,8.4),"Fredericia":(55.57,9.75),"Faaborg-Midtfyn":(55.2,10.2),"Haderslev":(55.25,9.5),"Kerteminde":(55.45,10.65),"Kolding":(55.5,9.45),"Langeland":(54.9,10.8),"Middelfart":(55.5,9.75),"Nordfyns":(55.5,10.2),"Nyborg":(55.31,10.8),"Odense":(55.4,10.38),"Svendborg":(55.06,10.6),"Sønderborg":(54.95,9.8),"Tønder":(54.95,8.9),"Varde":(55.62,8.48),"Vejen":(55.48,9.15),"Vejle":(55.7,9.55),"Ærø":(54.88,10.4),"Aabenraa":(55.05,9.4),
 "Favrskov":(56.35,10.1),"Hedensted":(55.77,9.7),"Herning":(56.13,8.97),"Holstebro":(56.36,8.62),"Horsens":(55.86,9.85),"Ikast-Brande":(55.98,9.17),"Lemvig":(56.55,8.3),"Norddjurs":(56.43,10.7),"Odder":(55.97,10.15),"Randers":(56.46,10.04),"Ringkøbing-Skjern":(55.95,8.4),"Samsø":(55.85,10.6),"Silkeborg":(56.17,9.55),"Skanderborg":(56.0,9.9),"Skive":(56.57,9.03),"Struer":(56.49,8.6),"Syddjurs":(56.27,10.55),"Viborg":(56.45,9.4),"Aarhus":(56.16,10.2),
 "Brønderslev":(57.27,9.94),"Frederikshavn":(57.45,10.4),"Hjørring":(57.45,10.0),"Jammerbugt":(57.2,9.4),"Læsø":(57.25,11.0),"Mariagerfjord":(56.65,9.95),"Morsø":(56.8,8.8),"Rebild":(56.8,9.7),"Thisted":(56.95,8.7),"Vesthimmerland":(56.85,9.4),"Aalborg":(57.05,9.95),
}


def rng(*parts):
    h = hashlib.md5("|".join(parts).encode()).hexdigest()
    return random.Random(int(h[:12], 16))


def slug(name):
    s = name.lower()
    for a, b in (("æ", "ae"), ("ø", "o"), ("å", "aa")):
        s = s.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def dhondt(votes, seats):
    res = {p: 0 for p in votes}
    for _ in range(seats):
        best = max(votes, key=lambda p: (votes[p] / (res[p] + 1), votes[p], p))
        res[best] += 1
    return res


def make_result(name, valg, seats, electorate, fixed):
    r = rng(name, valg)
    if fixed:
        turnout = fixed["turnout"]
        shares = dict(fixed["shares"])
    else:
        turnout = round(r.uniform(60, 77) if valg == "kv2025" else r.uniform(62, 75), 1)
        shares = {}
        for p, b in BASE[valg].items():
            v = b * math.exp(r.gauss(0, 0.45))
            if v >= 2.0:
                shares[p] = v
    tot = sum(shares.values())
    shares = {p: s / tot * 100 for p, s in shares.items()}
    cast = round(electorate * turnout / 100)
    valid = round(cast * 0.992)
    votes = {p: max(1, round(valid * s / 100)) for p, s in shares.items()}
    diff = valid - sum(votes.values())
    top = max(votes, key=votes.get)
    votes[top] += diff
    mand = dhondt(votes, seats)
    return {
        "electorate": electorate, "cast": cast, "valid": valid, "turnout": turnout,
        "votes": votes, "mandates": mand,
    }


AREA_WORDS = ["Nord", "Syd", "Øst", "Vest", "Midt", "Centrum", "Skovvejen", "Havnen", "Skolen", "Hallen", "Kirken", "Parken", "Bakken", "Engen", "Mosen", "Stranden", "Torvet", "Banen", "Åen", "Bykernen", "Lunden", "Højen", "Vænget", "Toften", "Dalen"]


def alloc(total, weights):
    """Fordel et heltal i forhold til vægte, så summen er præcis (største rest)."""
    s = sum(weights)
    raw = [total * w / s for w in weights]
    out = [int(x) for x in raw]
    for i in sorted(range(len(raw)), key=lambda i: raw[i] - out[i], reverse=True)[: total - sum(out)]:
        out[i] += 1
    return out


def make_areas(name, valg, res, n):
    """Eksempeldata på afstemningsområde-niveau. Summer af stemmer pr. parti = kommunens tal."""
    r = rng(name, valg, "areas")
    names = rng(name, "areanames").sample(AREA_WORDS, n)
    w = [r.uniform(0.6, 1.5) for _ in range(n)]
    votes = {i: {} for i in range(n)}
    for p, tot in res["votes"].items():
        sh = [wi * math.exp(r.gauss(0, 0.12)) for wi in w]
        for i, v in enumerate(alloc(tot, sh)):
            if v > 0:
                votes[i][p] = v
    valid = [sum(votes[i].values()) for i in range(n)]
    blanks = alloc(res["cast"] - res["valid"], valid)
    cast = [valid[i] + blanks[i] for i in range(n)]
    elec = alloc(res["electorate"], [cast[i] / (res["turnout"] / 100) * math.exp(r.gauss(0, 0.04)) for i in range(n)])
    for i in range(n):  # sikr afgivne <= valgberettigede
        if cast[i] > elec[i]:
            j = max(range(n), key=lambda x: elec[x] - cast[x])
            d = cast[i] - elec[i] + 1
            elec[i] += d
            elec[j] -= d
    return [{"id": "o%d" % (i + 1), "name": f"{name} {names[i]}", "electorate": elec[i], "cast": cast[i], "valid": valid[i], "votes": votes[i]} for i in range(n)]


def main():
    komm = []
    for region, names in REGIONS.items():
        for n in names:
            r = rng(n, "meta")
            if n in FIXED:
                seats, electorate = FIXED[n]["seats"], FIXED[n]["electorate"]
            elif n in BIG:
                seats, electorate = BIG[n]
                electorate = round(electorate * r.uniform(0.95, 1.05))
            elif n in SMALL:
                seats, electorate = SMALL[n], r.randint(3000, 5000)
            else:
                seats = r.choice([25, 27, 29, 31]) if r.random() < 0.55 else r.choice([19, 21, 23, 25])
                electorate = r.randint(9000, 65000)
            results = {}
            narea = max(2, min(25, round(electorate / 6000)))
            for valg in ("kv2025", "kv2021"):
                fixed = FIXED.get(n, {}).get(valg)
                results[valg] = make_result(n, valg, seats, round(electorate * (1.0 if valg == "kv2025" else 0.985)), fixed)
                results[valg]["areas"] = make_areas(n, valg, results[valg], narea)
            komm.append({"id": slug(n), "name": n, "region": region, "seats": seats, "lat": COORDS[n][0], "lon": COORDS[n][1], "results": results})
    komm.sort(key=lambda k: k["name"].replace("Aa", "Å").replace("Æ", "Zæ").replace("Ø", "Zø").replace("Å", "Zå"))
    data = {
        "meta": {"note": "EKSEMPELDATA – ikke officielle valgresultater", "count": len(komm)},
        "parties": {k: {"name": v[0], "color": v[1]} for k, v in PARTIES.items()},
        "elections": {
            "kv2025": {"name": "Kommunalvalg 2025", "date": "18. november 2025", "prev": "kv2021"},
            "kv2021": {"name": "Kommunalvalg 2021", "date": "16. november 2021", "prev": None},
        },
        "kommuner": komm,
    }
    out = Path(__file__).resolve().parent.parent / "js" / "data.js"
    out.write_text("// GENERERET af tools/generate_data.py – eksempeldata, ikke officielle tal\nwindow.DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"Skrev {out} ({len(komm)} kommuner, {out.stat().st_size // 1024} kB)")
    for n in ("Hørsholm", "Ishøj"):
        k = next(x for x in komm if x["name"] == n)
        for valg in ("kv2025", "kv2021"):
            m = {p: v for p, v in sorted(k["results"][valg]["mandates"].items(), key=lambda x: -x[1]) if v}
            print(n, valg, m)


if __name__ == "__main__":
    main()
