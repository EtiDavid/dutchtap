"""Idempotent editorial corrections; run after author-dutch-practice.py.

Keep recordings and main sentences stable. Correct over-absolute claims and
contrast examples that are actually possible Dutch in a different context.
"""
import json,re,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
def read(n):return json.loads((root/'data'/n).read_text())
b=read('grammar-breakdowns.json');notes=read('grammar-notes.json')
# Teaching the verb bracket is more accurate than saying every verb is the last word.
for key,x in b.items():
 for field in ['order','compare']:
  x[field]=x[field].replace('goes to the very end','usually closes the verb bracket').replace('at the very end','in the final verb bracket').replace('goes to the end','normally occurs toward the end').replace('the verb is always second','the finite verb is second in this main clause')
  if 'imperative' in x['parts'][0]['label']:
   x[field]=x[field].replace('while the verb itself stays second','while the imperative verb comes first')
 for field in ['rule']:
  notes[key][field]=notes[key][field].replace('the verb is always second','the finite verb is second in an ordinary main clause').replace('always goes to the end','usually closes the verb bracket')
 # A statement-order echo question is possible. Do not cross it out as ungrammatical.
 wrong=x['mistake']['wrong'];parts=x['parts']
 subj=next((p['text'] for p in parts if p['label']=='subject'),None)
 finite=next((p['text'] for p in parts if 'finite verb' in p['label']),None)
 if wrong.endswith('?') and subj and finite and wrong.lower().startswith((subj+' '+finite+' ').lower()):
  x['mistake']['alternative']=True
  x['mistake']['why']='This statement order can be used as an echo or confirmation question, with questioning intonation. For an ordinary neutral yes/no question, put the finite verb before the subject, as in the model.'
for x in b.values():
 if 'niet een' in x['mistake']['wrong'].lower():
  x['mistake']['alternative']=True
  x['mistake']['why']='Niet een can express contrast or emphasis. To simply negate an indefinite noun phrase in this intended meaning, the ordinary form is geen. The model practises that unmarked negative form.'
# These are grammatical contrasts, not a general ban on an alternative word order/meaning.
contrasts={
 'work-15':'A prepositional phrase such as over het project may also follow gesproken. Both orders are possible. This card practises the common verb-bracket order, with the topic before the participle.',
 'conversation-59':'A full prepositional phrase can follow the infinitive. Both orders are possible; the model practises the phrase before geloven.',
 'conversation-78':'Both orders occur. In the model, waarom represents an omitted embedded reason question after weten. Ik wil waarom weten can stress the reason word itself. Practise the taught sentence without treating every other order as wrong.',
 'conversation-18':'Both hebben and zijn occur with vergeten, with differences in meaning and regional preference. Zijn is especially common for no longer remembering something; hebben is common for failing to do something. Do not treat heb ... vergeten as automatically ungrammatical.',
 'school-21':'Vergeten can use hebben or zijn depending on meaning and usage. The model uses zijn for no longer remembering the answer; the hebben version is not automatically an error.',
 'leisure-14':'Putting niet before de wedstrijd can create contrast: not the match, but something else. After the object it normally negates losing that match as a whole. The position depends on what you negate.',
 'weather-14':'De herfst komt is possible Dutch. Eraan adds the sense that autumn is approaching; it is not required in every sentence with komen.',
 'food-14':'Graag is commonly early in the middle of the clause, but it is not required to follow the finite verb immediately in every context.',
 'conversation-46':'Zij komen aan means they are arriving. Zij komen eraan means they are on their way/approaching. Both are grammatical, but the intended situation differs.',
 'home-08':'Er is melk in de koelkast is grammatical. Staat can describe a container standing in the fridge. Dutch often chooses a position verb, but is is not forbidden.',
 'school-07':'Mijn pen is op tafel is grammatical. Ligt more precisely describes a pen lying on the table. A position verb is useful, not compulsory.',
 'transport-01':'The model keeps van welk spoor together. Stranding van can occur in informal speech, but this card teaches the neutral complete fronted prepositional phrase.',
 'work-10':'Hieraan normally precedes samenwerken in this compact model. Learn this preferred model order rather than assuming all adverbs must always occur in a single fixed position.',
 'administration-02':'A full destination phrase may follow an infinitive. The model places naar me before opsturen; the other order is possible.',
 'conversation-33':'Hartelijk dank is the conventional standalone formula. With a possessive, the adjective is inflected: mijn hartelijke dank. Learn the fixed expression rather than generalising that hartelijk never takes -e.',
 'home-11':'Op zoek zijn naar is an idiom meaning be looking for. Dutch also has the ordinary verb zoeken: Ze zochten een flat. The issue in the first phrase is using a bare infinitive after waren.',
 'work-27':'Beginnen can take a direct object (een gesprek beginnen). Beginnen met explicitly introduces the activity begun here; met is not obligatory with every use of beginnen.',
 'work-64':'The model makes the beneficiary explicit with voor ons. Bare indirect objects are possible with some verbs and contexts; they are not a universal substitute for every voor-phrase.'
}
for key,why in contrasts.items():b[key]['mistake'].update(alternative=True,why=why)
# Specific forms, natural equivalents and the questions David asked while studying.
fixes={
 'transport-01':{'forms':'Vertrekken is irregular: ik vertrek, hij vertrekt; past vertrok/vertrokken; perfect is vertrokken. Welk modifies singular het spoor; welke modifies a singular de-word or a plural.'},
 'conversation-21':{'forms':'Het eens zijn met means agree with. Met becomes mee in a pronominal adverb: daar + mee = daarmee. Ik ben het daarmee eens means I agree with that.'},
 'home-15':{'forms':'Uitdoen: ik doe ... uit, ik deed ... uit, ik heb uitgedaan. In the participle, ge goes between the separable prefix uit and the stem: uit + ge + daan.'},
 'work-16':{'forms':'Afronden: we ronden ... af; we hebben afgerond. The participle contains ge between the separable prefix af and rond: af + ge + rond. Hadden afgerond is past perfect.'},
 'transport-23':{'forms':'Both vrijdag and op vrijdag are possible time expressions. Op vakantie means on holiday. Keep the holiday phrase separate from the day: Ze vertrekken vrijdag op vakantie, or Ze vertrekken op vrijdag op vakantie.'},
 'school-21':{'forms':'Weten: ik weet; simple past wist/wisten. Vergeten has participle vergeten and can use hebben or zijn. Here ben ... vergeten describes no longer remembering the answer.'},
 'conversation-18':{'forms':'Ik ben vergeten is a perfect with zijn. Vergeten can also use hebben in appropriate contexts. Je before naam is possessive your, not the subject pronoun you.'},
 'conversation-33':{'order':'Hartelijk dank is a conventional thank-you formula, without a finite verb or a subject. It is not a sentence requiring V2 order.','forms':'The standalone expression uses hartelijk dank. After a possessive, use the inflected adjective: mijn hartelijke dank. This formula is exceptional; it does not establish a general rule for all de-word adjectives.'},
 'conversation-78':{'order':'Ik is the subject and wil the finite modal. Weten is an infinitive after wil. Waarom stands for the reason you want to know; this omitted embedded question can follow weten. The last word is therefore not always the action verb.'},
 'food-07':{'forms':'Proberen: ik probeer (present), ik probeerde / wij probeerden (simple past), ik heb geprobeerd (perfect). The regular participle is ge + probeer + d. Het gerecht means the dish; het-word + indefinite een gives een nieuw gerecht. Compare de soep → een nieuwe soep, and het definite noun phrase het nieuwe gerecht.'},
 'leisure-10':{'forms':'Dansen: ik dans; past ik danste / wij dansten; perfect ik heb gedanst. The stem ends in s, so the regular past uses -te and participle -t. Met mijn vrouw means with my wife. Op de receptie names the reception event; aan de receptie commonly means at the reception desk. In describes a physical room or space.'},
 'home-09':{'forms':'Opruimen means tidy up or put things away: ik ruim ... op; perfect ik heb opgeruimd. Schoonmaken means clean dirt away: ik maak ... schoon; perfect ik heb schoongemaakt. You can tidy a room without cleaning it, or clean its floor after putting things away.'},
 'home-23':{'forms':'Bezig met can introduce a noun (de was = laundry) or an infinitive naming an activity (het wassen = washing). Het schoonmaken van de ramen is a noun-like cleaning phrase. Compare Hij is de ramen aan het schoonmaken, the verbal progressive. De koken is incorrect: a nominalised infinitive takes het.'},
 'work-150':{'forms':'Verkopen is inseparable: verkoop, verkocht, heeft verkocht. Verkoop is the imperative stem. Je in Verkoop je auto means your; Verkoop je de auto? instead has subject je and asks are you selling? Aan introduces the buyer; te introduces an infinitive, not a buyer. Naar also occurs in non-movement expressions such as luisteren naar, so it is not simply a movement-only word.'},
 'work-80':{'forms':'The first je is the subject, so question-form hebt becomes heb: Heb je ...? The second je is possessive your before taak. Afmaken: maak ... af; perfect afgemaakt. For object it, use Heb je het al afgemaakt? Unstressed het normally comes early in the middle of the clause, before al and the participle.'},
 'work-145':{'forms':'Ons and onze both mean our. Budget is singular and takes het, so use ons budget. Use onze before a singular de-word (onze auto) and every plural (onze budgetten). The number of owners does not decide the ending. We plannen is the plural present of plannen; Ik plande is simple past and We hebben gepland is perfect.'}
}
for key,changes in fixes.items():b[key].update(changes)
# Add the useful main-card detail to the short rule, instead of leaving inconsistent duplicates.
for key in fixes:notes[key]['rule']=b[key]['order']+' '+b[key]['forms']
notes['transport-01']['rule']=b['transport-01']['order']+' '+b['transport-01']['forms']
for key in ['school-21','conversation-18']:notes[key]['rule']=b[key]['order']+' '+b[key]['forms']
b['transport-23']['mistake']['why']='Friday may be vrijdag or op vrijdag. The phrase op vakantie must remain intact: inserting vrijdag between op and vakantie wrongly breaks that holiday expression.'
b['home-07']['order']='Na het werk is one time constituent in first position. Fiets is the finite verb in second position, followed by subject ik. Second position means second constituent, not second word.'
notes['conversation-01']['rule']='Een beetje means a little. Spreken has present ik spreek, jij/hij spreekt, wij spreken, but its past and participle are irregular: sprak/spraken, gesproken. Nederlands is a language and has no article here.'
notes['shopping-08']['rule']='With a plural noun, this/these uses deze and that/those uses die, regardless of the singular noun article. Zijn agrees with plural appels. Goedkoper is the comparative of goedkoop; as a predicate adjective it has no -e agreement ending.'
b['transport-12']['forms']='Vertrekken uses zijn in the perfect: is vertrokken. Do not generalise this to every movement activity: ik heb gefietst describes cycling, whereas ik ben naar huis gefietst describes reaching home. Geleden follows the duration and means ago.'
for n,data in [('grammar-breakdowns.json',b),('grammar-notes.json',notes)]:
 (root/'data'/n).write_text(json.dumps(data,ensure_ascii=False,indent=1)+'\n')
print('Reviewed 600 explanation records; applied contextual contrasts and specific teaching corrections.')
