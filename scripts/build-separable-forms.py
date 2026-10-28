#!/usr/bin/env python3
"""Builds data/grammar-separable-forms.json: the forms of every separable verb in the verb dictionary.

The irregular facts (stem forms, past tense, participle, hebben/zijn) are authored in the table below; every other form is derived by
the separable-verb rules so that the whole table stays consistent. Tests check the table against the verb dictionary and the cards.
"""
import json, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
# lemma | particle | base verb | ik | hij | past singular | past plural | participle | auxiliary | preposition (optional) | reflexive (optional)
TABLE = """
terugbellen|terug|bellen|bel|belt|belde|belden|teruggebeld|hebben
opbellen|op|bellen|bel|belt|belde|belden|opgebeld|hebben
aanmelden|aan|melden|meld|meldt|meldde|meldden|aangemeld|hebben|voor|reflexive
uitloggen|uit|loggen|log|logt|logde|logden|uitgelogd|hebben
uitschakelen|uit|schakelen|schakel|schakelt|schakelde|schakelden|uitgeschakeld|hebben
inschakelen|in|schakelen|schakel|schakelt|schakelde|schakelden|ingeschakeld|hebben
opstarten|op|starten|start|start|startte|startten|opgestart|hebben
afsluiten|af|sluiten|sluit|sluit|sloot|sloten|afgesloten|hebben
uitvoeren|uit|voeren|voer|voert|voerde|voerden|uitgevoerd|hebben
bijwerken|bij|werken|werk|werkt|werkte|werkten|bijgewerkt|hebben
nakijken|na|kijken|kijk|kijkt|keek|keken|nagekeken|hebben
aanpassen|aan|passen|pas|past|paste|pasten|aangepast|hebben
terugzetten|terug|zetten|zet|zet|zette|zetten|teruggezet|hebben
opslaan|op|slaan|sla|slaat|sloeg|sloegen|opgeslagen|hebben
uitzoeken|uit|zoeken|zoek|zoekt|zocht|zochten|uitgezocht|hebben
doorgaan|door|gaan|ga|gaat|ging|gingen|doorgegaan|zijn
meedoen|mee|doen|doe|doet|deed|deden|meegedaan|hebben
deelnemen|deel|nemen|neem|neemt|nam|namen|deelgenomen|hebben|aan
bijwonen|bij|wonen|woon|woont|woonde|woonden|bijgewoond|hebben
voorbereiden|voor|bereiden|bereid|bereidt|bereidde|bereidden|voorbereid|hebben
afspreken|af|spreken|spreek|spreekt|sprak|spraken|afgesproken|hebben
opzoeken|op|zoeken|zoek|zoekt|zocht|zochten|opgezocht|hebben
uitproberen|uit|proberen|probeer|probeert|probeerde|probeerden|uitgeprobeerd|hebben
afdrukken|af|drukken|druk|drukt|drukte|drukten|afgedrukt|hebben
doorsturen|door|sturen|stuur|stuurt|stuurde|stuurden|doorgestuurd|hebben
opvragen|op|vragen|vraag|vraagt|vroeg|vroegen|opgevraagd|hebben
toevoegen|toe|voegen|voeg|voegt|voegde|voegden|toegevoegd|hebben|aan
overnemen|over|nemen|neem|neemt|nam|namen|overgenomen|hebben
uitvallen|uit|vallen|val|valt|viel|vielen|uitgevallen|zijn
vastlopen|vast|lopen|loop|loopt|liep|liepen|vastgelopen|zijn
opvallen|op|vallen|val|valt|viel|vielen|opgevallen|zijn
terugvinden|terug|vinden|vind|vindt|vond|vonden|teruggevonden|hebben
weggooien|weg|gooien|gooi|gooit|gooide|gooiden|weggegooid|hebben
aandoen|aan|doen|doe|doet|deed|deden|aangedaan|hebben
uitdoen|uit|doen|doe|doet|deed|deden|uitgedaan|hebben
aantrekken|aan|trekken|trek|trekt|trok|trokken|aangetrokken|hebben
uittrekken|uit|trekken|trek|trekt|trok|trokken|uitgetrokken|hebben
ophangen|op|hangen|hang|hangt|hing|hingen|opgehangen|hebben
vastmaken|vast|maken|maak|maakt|maakte|maakten|vastgemaakt|hebben
uitstappen|uit|stappen|stap|stapt|stapte|stapten|uitgestapt|zijn
instappen|in|stappen|stap|stapt|stapte|stapten|ingestapt|zijn
afronden|af|ronden|rond|rondt|rondde|rondden|afgerond|hebben
toelichten|toe|lichten|licht|licht|lichtte|lichtten|toegelicht|hebben
opnemen|op|nemen|neem|neemt|nam|namen|opgenomen|hebben
samenstellen|samen|stellen|stel|stelt|stelde|stelden|samengesteld|hebben
terugdraaien|terug|draaien|draai|draait|draaide|draaiden|teruggedraaid|hebben
uitschrijven|uit|schrijven|schrijf|schrijft|schreef|schreven|uitgeschreven|hebben|voor|reflexive
inschrijven|in|schrijven|schrijf|schrijft|schreef|schreven|ingeschreven|hebben|voor|reflexive
opbouwen|op|bouwen|bouw|bouwt|bouwde|bouwden|opgebouwd|hebben
afbreken|af|breken|breek|breekt|brak|braken|afgebroken|hebben
wegvallen|weg|vallen|val|valt|viel|vielen|weggevallen|zijn
aanmaken|aan|maken|maak|maakt|maakte|maakten|aangemaakt|hebben
opsturen|op|sturen|stuur|stuurt|stuurde|stuurden|opgestuurd|hebben
invullen|in|vullen|vul|vult|vulde|vulden|ingevuld|hebben
aanvragen|aan|vragen|vraag|vraagt|vroeg|vroegen|aangevraagd|hebben
opruimen|op|ruimen|ruim|ruimt|ruimde|ruimden|opgeruimd|hebben
afmaken|af|maken|maak|maakt|maakte|maakten|afgemaakt|hebben
inloggen|in|loggen|log|logt|logde|logden|ingelogd|hebben
aankomen|aan|komen|kom|komt|kwam|kwamen|aangekomen|zijn
meenemen|mee|nemen|neem|neemt|nam|namen|meegenomen|hebben
uitleggen|uit|leggen|leg|legt|legde|legden|uitgelegd|hebben
inleveren|in|leveren|lever|levert|leverde|leverden|ingeleverd|hebben
opschrijven|op|schrijven|schrijf|schrijft|schreef|schreven|opgeschreven|hebben
doorgeven|door|geven|geef|geeft|gaf|gaven|doorgegeven|hebben
meebrengen|mee|brengen|breng|brengt|bracht|brachten|meegebracht|hebben
binnenkomen|binnen|komen|kom|komt|kwam|kwamen|binnengekomen|zijn
opstaan|op|staan|sta|staat|stond|stonden|opgestaan|zijn
afwachten|af|wachten|wacht|wacht|wachtte|wachtten|afgewacht|hebben
"""
out = {}
for line in TABLE.strip().splitlines():
    f = line.split('|')
    lemma, particle, base, ik, hij, past_sg, past_pl, participle, aux = f[:9]
    prep = f[9] if len(f) > 9 and f[9] != 'reflexive' else None
    reflexive = 'reflexive' in f[9:]
    assert lemma == particle + base, lemma
    assert participle.startswith(particle), lemma
    assert aux in ('hebben', 'zijn'), lemma
    assert lemma not in out, lemma
    me = ' me' if reflexive else ''
    je = ' je' if reflexive else ''
    out[lemma] = {
        'lemma': lemma, 'particle': particle, 'base': base,
        'auxiliary': aux, 'reflexive': reflexive, **({'preposition': prep} if prep else {}),
        'presentIk': ik, 'presentHij': hij, 'pastSingular': past_sg, 'pastPlural': past_pl, 'participle': participle,
        # rule-derived forms
        'mainClause': f'ik {ik}{me} … {particle}',
        'simplePast': f'ik {past_sg}{me} … {particle}',
        'perfect': f"ik {'heb' if aux == 'hebben' else 'ben'}{me} … {participle}",
        'modal': f'ik wil{me} {lemma}',
        'teInfinitive': f'{particle} te {base}',
        'subordinate': f'dat ik{me} {particle}{ik}',
        'subordinatePast': f'dat ik{me} {particle}{past_sg}',
        'imperative': f'{ik.capitalize()}{je} {particle}!',
    }
(ROOT / 'data/grammar-separable-forms.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(len(out), 'separable verbs')
