#!/usr/bin/env python3
"""
Genererer EKSEMPELDATA til kandidater, storkredse og opstillingskredse (js/kandidater.js).

ALT er opdigtet:
  * kandidatnavne er fiktive (tilfældige kombinationer – ingen kobling til rigtige personer),
  * tal for "Folketingsvalg (eksempel)" er genereret og ligner IKKE et rigtigt valgresultat,
  * mandatfordelingen er en FORENKLET d'Hondt-beregning (se METODE nedenfor), ikke de officielle regler.

Kommunalvalg 2025: hver kommune får kandidater pr. parti med personlige stemmer; de øverste (= partiets mandater) er valgt.
Folketingsvalg (eksempel): 10 storkredse, ca. 90 opstillingskredse, 135 kredsmandater + 40 tillægsmandater = 175.

Kør (efter generate_data.py):  python3 tools/generate_kandidater.py
"""
import hashlib
import json
import math
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
D = json.loads((ROOT / "js" / "data.js").read_text(encoding="utf-8").split("window.DATA = ", 1)[1].rstrip().rstrip(";"))
PARTIES = list(D["parties"].keys())
KOM = {k["id"]: k for k in D["kommuner"]}


def rng(*parts):
    return random.Random(int(hashlib.md5("|".join(parts).encode()).hexdigest()[:12], 16))


def slug(name):
    s = name.lower()
    for a, b in (("æ", "ae"), ("ø", "o"), ("å", "aa"), ("–", "-")):
        s = s.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


FIRST_F = ["Anna", "Birgit", "Camilla", "Dorte", "Eva", "Freja", "Gitte", "Hanne", "Ida", "Jette", "Karen", "Lene", "Maja", "Nanna", "Olivia", "Pernille", "Rikke", "Sofie", "Tina", "Ulla", "Vibeke", "Winnie", "Yrsa", "Astrid", "Bodil", "Cecilie", "Dagmar", "Emilie", "Frederikke", "Gunhild", "Helle", "Inger", "Julie", "Katrine", "Lise", "Malene", "Nina", "Ruth", "Signe", "Trine"]
FIRST_M = ["Anders", "Bent", "Carsten", "Dennis", "Erik", "Frands", "Gustav", "Henrik", "Ivan", "Jens", "Knud", "Lars", "Martin", "Niels", "Ole", "Palle", "Rasmus", "Søren", "Thomas", "Ulrik", "Viggo", "Walther", "Aksel", "Benjamin", "Christian", "Daniel", "Emil", "Flemming", "Gert", "Hans", "Ib", "Jesper", "Kasper", "Leif", "Mads", "Nikolaj", "Oskar", "Peter", "Rune", "Steffen"]
LAST = ["Aagesen", "Bohnstedt", "Clausager", "Dalhoff", "Egebjerg", "Fjordbak", "Gammelgaard", "Hesselbjerg", "Illum", "Jessing", "Kjeldgaard", "Lundtoft", "Mossing", "Nyrup-Holm", "Ottosen", "Pilgaard", "Qvist", "Rosenlund", "Skovgaard", "Tolstrup", "Ulstrup", "Vestergren", "Winther-Holm", "Ahlmann", "Brandstrup", "Cordtsen", "Dybdahl", "Ejlersen", "Fogtmann", "Grønlykke", "Harritsø", "Ingvorsen", "Jerslev", "Kaasgaard", "Lykkeberg", "Munkholm", "Nedergaard", "Olufsen", "Plougmann", "Rasch", "Sandbæk", "Tarp", "Uhrenholt", "Vindeløv", "Wedell", "Zachariassen", "Agerskov", "Bendixen", "Christoffersen", "Damgaard", "Eskildsen", "Frisenvang", "Gylling", "Hvidberg", "Iversen-Lund", "Johannesen", "Krogsgaard", "Lindegaard", "Mølgaard", "Nørskov", "Overgaard", "Pagh", "Ravnsbæk", "Skjoldager", "Thorning-Vad", "Ulriksen", "Vium", "Westergaard", "Ørnsholt", "Åkjær", "Bruun-Lau", "Dyrberg", "Elkjær", "Fabricius-Dam", "Gadegaard", "Hjortshøj", "Isaksen", "Jonassen", "Kollerup", "Lassen-Brix", "Mikkelstrup", "Nygaard-Rye", "Orla-Dahl", "Poulstrup", "Risgaard", "Stilling", "Trolle-Bay", "Vangsgaard", "Ølgaard"]


class Namer:
    def __init__(self, seed):
        self.r = rng("navne", seed)
        self.used = set()

    def next(self):
        while True:
            f = self.r.choice(FIRST_F + FIRST_M)
            if self.r.random() < 0.3:
                f += " " + self.r.choice(FIRST_F + FIRST_M) if self.r.random() < 0.5 else ""
            n = f + " " + self.r.choice(LAST)
            if n not in self.used:
                self.used.add(n)
                return n


def dhondt(votes, seats):
    res = {p: 0 for p in votes}
    for _ in range(seats):
        best = max(votes, key=lambda p: (votes[p] / (res[p] + 1), votes[p], p))
        res[best] += 1
    return res


def alloc(total, weights):
    s = sum(weights)
    raw = [total * w / s for w in weights]
    out = [int(x) for x in raw]
    for i in sorted(range(len(raw)), key=lambda i: raw[i] - out[i], reverse=True)[: total - sum(out)]:
        out[i] += 1
    return out


# ------------------------------------------------------------------ Kommunalvalg 2025: kandidater
def kv_candidates():
    namer = Namer("kv")
    out = {}
    for k in D["kommuner"]:
        R = k["results"]["kv2025"]
        r = rng(k["id"], "kandidater")
        per_party = {}
        for p, V in R["votes"].items():
            m = R["mandates"].get(p, 0)
            n = min(18, max(2, m + r.randint(2, 5)))
            w = [1 / (i + 1) ** r.uniform(0.7, 1.1) * math.exp(r.gauss(0, 0.35)) for i in range(n)]
            personal = int(V * r.uniform(0.74, 0.88))
            vs = sorted(alloc(personal, w), reverse=True)
            per_party[p] = [[namer.next(), v] for v in vs]
        out[k["id"]] = per_party
    return out


# ------------------------------------------------------------------ Folketingsvalg (eksempel)
STORKREDSE = [
    ("koebenhavn", "Københavns Storkreds"),
    ("omegn", "Københavns Omegns Storkreds"),
    ("nordsjaelland", "Nordsjællands Storkreds"),
    ("bornholm", "Bornholms Storkreds"),
    ("sjaelland", "Sjællands Storkreds"),
    ("fyn", "Fyns Storkreds"),
    ("sydjylland", "Sydjyllands Storkreds"),
    ("oestjylland", "Østjyllands Storkreds"),
    ("vestjylland", "Vestjyllands Storkreds"),
    ("nordjylland", "Nordjyllands Storkreds"),
]
SK_OF = {}
for n in ["København", "Frederiksberg"]:
    SK_OF[n] = "koebenhavn"
for n in ["Albertslund", "Ballerup", "Brøndby", "Dragør", "Gentofte", "Gladsaxe", "Glostrup", "Herlev", "Hvidovre", "Høje-Taastrup", "Ishøj", "Lyngby-Taarbæk", "Rødovre", "Tårnby", "Vallensbæk"]:
    SK_OF[n] = "omegn"
for n in ["Allerød", "Egedal", "Fredensborg", "Frederikssund", "Furesø", "Gribskov", "Halsnæs", "Helsingør", "Hillerød", "Hørsholm", "Rudersdal"]:
    SK_OF[n] = "nordsjaelland"
SK_OF["Bornholm"] = "bornholm"
for n in ["Assens", "Faaborg-Midtfyn", "Kerteminde", "Langeland", "Middelfart", "Nordfyns", "Nyborg", "Odense", "Svendborg", "Ærø"]:
    SK_OF[n] = "fyn"
for n in ["Aabenraa", "Billund", "Esbjerg", "Fanø", "Fredericia", "Haderslev", "Kolding", "Sønderborg", "Tønder", "Varde", "Vejen", "Vejle"]:
    SK_OF[n] = "sydjylland"
for n in ["Aarhus", "Favrskov", "Hedensted", "Horsens", "Norddjurs", "Odder", "Samsø", "Silkeborg", "Skanderborg", "Syddjurs", "Randers"]:
    SK_OF[n] = "oestjylland"
for n in ["Herning", "Holstebro", "Ikast-Brande", "Lemvig", "Ringkøbing-Skjern", "Skive", "Struer", "Viborg"]:
    SK_OF[n] = "vestjylland"
for n in ["Brønderslev", "Frederikshavn", "Hjørring", "Jammerbugt", "Læsø", "Mariagerfjord", "Morsø", "Rebild", "Thisted", "Vesthimmerland", "Aalborg"]:
    SK_OF[n] = "nordjylland"
for k in D["kommuner"]:
    if k["name"] not in SK_OF:
        SK_OF[k["name"]] = "sjaelland"  # resten af Region Sjælland

DIRS = ["Nord", "Syd", "Øst", "Vest", "Midt", "Nordvest", "Sydvest", "Nordøst", "Sydøst", "Centrum"]
FV_BASE = {"A": 26.0, "V": 12.5, "M": 9.0, "Æ": 8.0, "I": 8.0, "C": 6.0, "F": 8.5, "Ø": 5.5, "B": 4.0, "D": 3.6, "O": 3.0, "Å": 3.0, "K": 1.1}
MERGE_LIMIT = 34000      # kommuner med færre valgberettigede kan slås sammen til én opstillingskreds
MERGE_DIST = 0.6        # maks. afstand (grader) mellem to kommuner, der slås sammen
POL_ORDER = ["Ø", "Å", "F", "A", "B", "M", "K", "C", "V", "I", "Æ", "D", "O"]


def build_kredse():
    """Opstillingskredse (forenklet inddeling): store kommuner deles, små naboer slås sammen."""
    kredse = []
    for sk, _ in STORKREDSE:
        ks = [k for k in D["kommuner"] if SK_OF[k["name"]] == sk]
        taken = set()
        small = [k for k in ks if k["results"]["kv2025"]["electorate"] < MERGE_LIMIT]
        for k in sorted(small, key=lambda x: (x["lat"], x["lon"])):
            if k["id"] in taken:
                continue
            cand = [o for o in small if o["id"] != k["id"] and o["id"] not in taken and math.hypot(o["lat"] - k["lat"], (o["lon"] - k["lon"]) * 0.6) < MERGE_DIST]
            if cand:
                o = min(cand, key=lambda o: math.hypot(o["lat"] - k["lat"], (o["lon"] - k["lon"]) * 0.6))
                taken |= {k["id"], o["id"]}
                a, b = sorted([k, o], key=lambda x: -x["results"]["kv2025"]["electorate"])
                kredse.append({"name": f"{a['name']}–{b['name']}", "sk": sk, "kom": [a["id"], b["id"]], "share": [1, 1]})
                continue
        for k in sorted(ks, key=lambda x: x["name"]):
            if k["id"] in taken:
                continue
            e = k["results"]["kv2025"]["electorate"]
            n = 8 if k["name"] == "København" else max(1, round(e / 60000))
            if n == 1:
                kredse.append({"name": k["name"], "sk": sk, "kom": [k["id"]], "share": [1]})
            else:
                for i in range(n):
                    kredse.append({"name": f"{k['name']} {DIRS[i]}", "sk": sk, "kom": [k["id"]], "share": [1 / n]})
    for kr in kredse:
        kr["id"] = slug(kr["name"])
    return kredse


def fv():
    namer = Namer("fv")
    kredse = build_kredse()
    out_k = []
    for kr in kredse:
        r = rng(kr["id"], "fv")
        elec = 0
        tilt = {p: 0.0 for p in FV_BASE}
        w = 0
        for kid, sh in zip(kr["kom"], kr["share"]):
            R = D["kommuner"][[x["id"] for x in D["kommuner"]].index(kid)]["results"]["kv2025"]
            e = R["electorate"] * sh
            elec += e
            for p in FV_BASE:
                tilt[p] += (R["votes"].get(p, 0) / R["valid"] * 100 if p in R["votes"] else FV_BASE[p]) * e
            w += e
        shares = {}
        for p in FV_BASE:
            local = tilt[p] / w
            mix = 0.55 * FV_BASE[p] + 0.45 * local
            shares[p] = max(0.3, mix * math.exp(r.gauss(0, 0.18)))
        tot = sum(shares.values())
        turnout = round(max(76.0, min(91.0, r.gauss(84.2, 2.8))), 1)
        elec = round(elec * 0.96)  # færre vælgere ved folketingsvalg end ved kommunalvalg (eksempel)
        cast = round(elec * turnout / 100)
        valid = round(cast * 0.993)
        votes = {p: max(1, round(valid * s / tot)) for p, s in shares.items()}
        votes[max(votes, key=votes.get)] += valid - sum(votes.values())
        cands = {}
        for p, v in votes.items():
            share = r.uniform(0.5, 0.82)
            cands[p] = [namer.next(), int(v * share)]
        out_k.append({"id": kr["id"], "name": kr["name"], "sk": kr["sk"], "kom": kr["kom"], "electorate": elec, "cast": cast, "valid": valid, "turnout": turnout, "votes": votes, "c": cands})

    # kredsmandater pr. storkreds (135 i alt; Bornholm = 2)
    sk_elec = {sk: sum(k["electorate"] for k in out_k if k["sk"] == sk) for sk, _ in STORKREDSE}
    others = [sk for sk, _ in STORKREDSE if sk != "bornholm"]
    seats = dict(zip(others, alloc(133, [sk_elec[s] for s in others])))
    seats["bornholm"] = 2
    # nationale stemmer og 2 %-spærregrænse (forenklet)
    nat = {p: sum(k["votes"].get(p, 0) for k in out_k) for p in FV_BASE}
    valid_tot = sum(nat.values())
    qual = {p: v for p, v in nat.items() if v / valid_tot >= 0.02}
    target = dhondt(qual, 175)
    elected = {}   # (kreds_id, parti) -> 1 kreds / 2 tillæg
    kreds_seats = {p: 0 for p in nat}
    sk_man = {}
    for sk, _ in STORKREDSE:
        sv = {p: sum(k["votes"].get(p, 0) for k in out_k if k["sk"] == sk) for p in qual}
        m = dhondt(sv, seats[sk])
        sk_man[sk] = {p: n for p, n in m.items() if n}
        for p, n in m.items():
            kreds_seats[p] += n
            best = sorted([k for k in out_k if k["sk"] == sk], key=lambda k: -k["c"][p][1])[:n]
            for k in best:
                elected[(k["id"], p)] = 1
    tillaeg = {p: max(0, target[p] - kreds_seats.get(p, 0)) for p in qual}
    while sum(tillaeg.values()) > 40:
        p = max(tillaeg, key=lambda q: tillaeg[q] / max(1, target[q]))
        tillaeg[p] -= 1
    while sum(tillaeg.values()) < 40:
        p = max(qual, key=lambda q: qual[q] / (kreds_seats[q] + tillaeg[q] + 1))
        tillaeg[p] += 1
    for p, n in tillaeg.items():
        rest = sorted([k for k in out_k if (k["id"], p) not in elected], key=lambda k: -k["c"][p][1])[:n]
        for k in rest:
            elected[(k["id"], p)] = 2
    for k in out_k:
        k["c"] = {p: [c[0], c[1], elected.get((k["id"], p), 0)] for p, c in k["c"].items()}
    # tillægsmandater pr. storkreds
    sk_till = {sk: {} for sk, _ in STORKREDSE}
    for (kid, p), st in elected.items():
        if st == 2:
            sk = next(k["sk"] for k in out_k if k["id"] == kid)
            sk_till[sk][p] = sk_till[sk].get(p, 0) + 1
    nat_seats = {p: {"kreds": kreds_seats.get(p, 0), "tillaeg": tillaeg.get(p, 0)} for p in nat}
    return {
        "name": "Folketingsvalg (eksempel)", "date": "eksempeldato – ikke et rigtigt valg",
        "seats": 175, "kredsSeats": 135, "tillaegSeats": 40,
        "nationalVotes": nat, "nationalSeats": nat_seats, "polOrder": POL_ORDER,
        "storkredse": [{"id": sk, "name": nm, "seats": seats[sk], "mandates": sk_man[sk], "tillaeg": sk_till[sk], "electorate": sk_elec[sk],
                        "kredse": [k["id"] for k in out_k if k["sk"] == sk]} for sk, nm in STORKREDSE],
        "kredse": out_k,
    }


def main():
    data = {"kv2025": kv_candidates(), "fv": fv()}
    out = ROOT / "js" / "kandidater.js"
    out.write_text("// GENERERET af tools/generate_kandidater.py – EKSEMPELDATA og FIKTIVE NAVNE, ikke rigtige personer eller resultater\nwindow.KAND = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    F = data["fv"]
    print(f"Skrev {out} ({out.stat().st_size // 1024} kB). Opstillingskredse: {len(F['kredse'])}; storkredse: {len(F['storkredse'])}")
    print("Kredsmandater pr. storkreds:", {s["name"].replace(" Storkreds", ""): s["seats"] for s in F["storkredse"]})
    tot = {p: v["kreds"] + v["tillaeg"] for p, v in F["nationalSeats"].items() if v["kreds"] + v["tillaeg"]}
    print("Mandater i alt:", sum(tot.values()), tot)
    print("Valgte kandidater:", sum(1 for k in F["kredse"] for c in k["c"].values() if c[2]))


if __name__ == "__main__":
    main()
