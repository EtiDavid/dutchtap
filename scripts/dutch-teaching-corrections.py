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
 # Subject je/jij must FOLLOW the finite verb for the ordinary added -t to disappear.
 # A stem-final t is retained: laten -> laat je, not la je.
 for field in ['order','forms','compare']:
  x[field]=x[field].replace('drops after je','drops when subject je/jij follows the finite verb')
 x['mistake']['why']=x['mistake']['why'].replace('drops after je','drops when subject je/jij follows the finite verb')
 for field in ['order','compare']:
  x[field]=x[field].replace('goes to the very end','usually closes the verb bracket').replace('moves to the very end','comes toward the end of its subordinate clause').replace('at the very end','in the final verb bracket').replace('goes to the end','normally occurs toward the end').replace('the verb is always second','the finite verb is second in this main clause')
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
fixes.update({
 'school-04':{'meaning':'Politely asking for a brief opportunity to ask a question.','forms':'Mag is the first-person singular of mogen. Iets means something and vragen is the infinitive. Even softens the request and suggests taking a moment; it does not demand that the question be spoken at high speed.','compare':'A natural English equivalent is May I ask a quick question? Dutch keeps vragen as an infinitive after mag and places even iets before it.'},
 'school-05':{'forms':'This perfect uses hebben: ik heb mijn huiswerk gemaakt. Heb is finite and gemaakt is the participle of maken. Al means already. Mijn is possessive my and stays the same before de- and het-words. The perfect does not always use hebben: some verbs and meanings use zijn, as in ik ben vertrokken.'},
 'school-08':{'compare':'English Tomorrow I am going keeps the subject before the verb. In Dutch, morgen is the first constituent, then finite ga comes before subject ik. The verb is second in the whole clause, not the first word.'},
 'transport-01':{'forms':'Vertrekken is irregular: ik vertrek, hij vertrekt; past vertrok/vertrokken; perfect is vertrokken. Welk modifies singular het spoor; welke modifies a singular de-word or a plural.','compare':'English allows From which platform does the train depart? and Which platform does the train depart from? The Dutch model keeps the complete phrase van welk spoor first, followed by finite vertrekt and subject de trein.'},
 'transport-02':{'forms':'Moeten: ik moet. Here moet is finite, so overstappen stays together as an infinitive. When overstappen itself is finite in a main clause, it splits: ik stap over. Perfect: ik ben overgestapt. Overstappen means transferring from one vehicle or connection to another, not necessarily only trains.'},
 'transport-08':{'compare':'English places buy before its object my ticket. Dutch puts the object mijn ticket before infinitive kopen, while finite kan follows waar and precedes subject ik.'},
 'home-03':{'forms':'This perfect uses hebben: heb je ... gedaan? Doen has participle gedaan. Compare statement je hebt and question heb je: subject je follows the auxiliary, so the ordinary added -t is omitted. De deur op slot doen means lock the door. Other perfects may use zijn, depending on verb and meaning.'},
 'home-06':{'forms':'Dit is a standalone demonstrative introducing an identification: dit is jouw kopje. It is not an adjective attached to kopje. Dutch can also say Dit is jouw tas even though tas is a de-word. Before a noun directly, use dit kopje but deze tas. Jouw/je means your; jou is the object form you.'},
 'home-08':{'forms':'Staan: singular er staat, plural er staan. Milk is understood through its container here, such as a standing carton or bottle. Compare Er staan twee pakken melk in de koelkast. Er is melk is also grammatical and simply states availability.'},
 'conversation-01':{'forms':'Spreken: ik spreek, jij/hij spreekt, wij spreken; simple past sprak/spraken; perfect heb/heeft gesproken. Een beetje means a little. The language name has no article in een beetje Nederlands spreken. An article is possible in other constructions, such as het Nederlands van vandaag (the Dutch of today).'},
 'conversation-04':{'forms':'Wonen: ik woon, jij woont, wij wonen; past woonde/woonden; perfect heb gewoond. With this city name use in Roeselare. Also in Gent and in België. This is not a claim that every geographical name always takes in.'},
 'transport-10':{'order':'Kunt is the finite modal and starts this polite yes/no question, followed by subject u. Mij is the person receiving help. Helpen stays an infinitive after kunt. The full prepositional phrase met mijn bagage naturally follows helpen here; closing the verb bracket does not mean being the last word of the sentence.','forms':'Kunnen: u kunt or u kan; both are standard. Mij means me, while mijn means my. Helpen met iets means help with something. Kunt u mij met mijn bagage helpen? is another natural order.'},
 'conversation-37':{'forms':'Terugbellen means call back. Here zal is finite and terugbellen stays together as an infinitive. When terugbellen itself is the finite verb in a main clause, it splits: hij belt terug. Perfect: hij heeft teruggebeld.'},
 'food-11':{'order':'Waar is the first question constituent, followed by finite is. The complete subject is de zak met eten: met eten describes what the bag contains, so it belongs inside the noun phrase.'},
 'conversation-56':{'order':'Wie is itself the subject in this question, meaning who. Is is the finite verb; daar says where and nu says when. There is no extra subject after is. Contrast Waar is de dokter?, where waar asks about place and de dokter is the subject.','forms':'The model uses singular is when asking who is there. Wie does not inherently mean exactly one person: plural agreement is possible in suitable contexts, as in Wie zijn dat? Learn the whole question rather than a rule that wie is always singular.'},
 'conversation-63':{'forms':'Laten zien means show: je laat het me zien, and Laat je het me zien? with question order. Laat is the stem of laten. Its t stays when subject je/jij follows: laat je, never la je. Only an added second-person -t is omitted in inversion; a stem-final t is retained. Zien remains an infinitive after finite laat.'},
 'health-07':{'order':'Ze is the shared subject of two coordinated actions: werd wakker and voelde zich veel beter. En joins them. The second action leaves out the repeated subject ze; voelde still agrees with that same woman. Werd and voelde are both finite past verbs, not an infinitive pair.'},
 'school-17':{'forms':'Leren: ik leer, ik leerde, ik heb geleerd. In iets nieuws, iets means something and nieuw is an adjective used with the ending -s. This is something new; the separate noun het nieuws means the news. The -s here is not a plural ending. Compare iets leuks (something nice), niets nieuws (nothing new), and een nieuw boek (a new book, without that -s).'},
 'food-15':{'forms':'Zitten te wachten describes waiting while seated. In the perfect, zitten appears as a replacement infinitive before wachten: ze heeft zitten wachten, not ze heeft gezeten wachten. Heeft is finite; zitten and wachten are infinitives. Een uur gives the duration. The literal seated posture is part of this situation, although posture verbs can also emphasise an ongoing activity.'},
 'work-09':{'order':'Ze is the subject, meaning she in this situation; is is the finite form of zijn. Druk bezig describes being occupied. Met introduces the noun-like activity het schrijven van een e-mail.','forms':'An infinitive used as an activity noun takes het: het schrijven, not de schrijven. Van een e-mail names what is being written. Compare the verbal progressive Ze is druk een e-mail aan het schrijven: aan het takes the infinitive schrijven, with een e-mail as its object.'}
})
fixes.update({
 'conversation-11':{'forms':'Zich zorgen maken over means worry about. Match the reflexive to the person worrying: ik maak me, jij maakt je, hij maakt zich, wij maken ons. Here hij is worried about losing his own keys. Het verliezen names an activity as a noun; van zijn sleutels says what he might lose. Zijn means his before sleutels, not the verb be.'},
 'work-03':{'forms':'Eindigen has stem eindig. Singular simple past adds -de: de vergadering eindigde. Plural adds -den: de vergaderingen eindigden. These are forms of this verb, not a rule that every singular past ends in -de; other regular verbs use -te, and irregular verbs have their own forms.'},
 'conversation-14':{'forms':'This perfect uses hebben: we hebben urenlang gepraat. Hebben is finite and agrees with plural we; gepraat is the participle of praten. The perfect can use zijn with other verbs/meanings, such as we zijn vertrokken. Compare simple past we praatten, with double t, and present we praten. Urenlang means for hours.'},
 'conversation-16':{'forms':'Zul je and zal je are both standard future questions. Compare je zult with zul je, where subject je follows the finite verb and the added -t is omitted. Hulp nodig hebben means need help: hebben remains an infinitive after zul/zal, with hulp nodig between the finite verb and infinitive.'},
 'work-05':{'practiceGuide':'Klaar met means finished with; bezig met means busy with. Both can introduce a noun-like activity: het lezen van het rapport. Compare Hij is klaar met lezen (finished reading) and Hij is bezig met lezen (still occupied with reading). The related examples practise naming activities and this contrast; being busy does not mean being finished.'}
})
for key,changes in fixes.items():b[key].update(changes)
b['conversation-11']['mistake']['why']='The intended person worrying is hij, so the reflexive is zich. Me refers to the speaker instead and would not express his own worry. Keep over het verliezen van zijn sleutels for what worries him.'
b['work-03']['mistake']['why']='This subject is one meeting, so eindigen takes singular past eindigde here. With plural de vergaderingen use eindigden. Do not generalise -de to every singular past verb.'
b['home-11']['mistake']['alternative']=False
b['conversation-16']['mistake'].update(alternative=True,why='Je zult hulp nodig hebben? can be a confirmation question with questioning intonation. For the neutral question here, use Zul je hulp nodig hebben? or Zal je hulp nodig hebben? The model is not a rule that statement-order confirmation questions are impossible.')
b['conversation-56']['parts'][0]['label']='subject (question word)'
b['conversation-56']['mistake']['why']='Wie is the subject. The neutral direct question places finite is immediately after it, before daar nu. No additional subject is inserted.'
b['food-11']['parts']=[{'label':'question word','text':'Waar'},{'label':'finite verb','text':'is'},{'label':'subject','text':'de zak met eten'}]
b['health-07']['mistake']['why']='For how someone feels, use zich voelen: ze voelde zich beter. Here zich refers back to ze. Voelen does not require a reflexive in every sense; for example, ik voel de stof means I feel the fabric.'
b['work-09']['mistake']['why']='This noun-like activity needs met het schrijven van een e-mail. Alternatively use a te-infinitive with its object: Ze is bezig een e-mail te schrijven. A bare schrijven followed by its object does not fit after is bezig.'
b['school-05']['mistake']['why']='Keep the object mijn huiswerk and adverb al before the participle gemaakt in this neutral model. Gemaakt closes the verb bracket; a full prepositional phrase can follow that bracket in other sentences.'
b['transport-04']['mistake'].update(alternative=True,why='Naar Gent specifies the destination, as required here. In Gent instead identifies a location, so it could fit buying a ticket while in Ghent but does not express the intended destination.')
for key in ['home-03','home-05','conversation-06']:
 b[key]['mistake'].update(alternative=True,why='This statement order can ask for confirmation or express surprise with questioning intonation. For the neutral question/request practised here, put the finite verb before the subject. With following subject je, use heb je or kun je, rather than je hebt or je kunt.')
b['conversation-01']['mistake']['why']='This amount of a language is een beetje Nederlands, without an article. De Nederlands is not the name of the language. The article het can occur in other expressions, such as het Nederlands van vandaag.'
b['conversation-04']['mistake']['why']='For residence in the city of Roeselare use in Roeselare. Op Roeselare does not express the intended location in this sentence.'
b['conversation-02']['mistake']['why']='In this neutral request, put the complete adverb phrase wat langzamer before the infinitive spreken. Do not infer that every possible Dutch phrase must precede the last verb: full prepositional phrases, for example, can follow the verb bracket.'
b['conversation-09']['parts']=[{'label':'subject','text':'Ik'},{'label':'finite verb','text':'ben'},{'label':'adjective','text':'moe'},{'label':'conjunction','text':'maar'},{'label':'subject','text':'ik'},{'label':'finite verb','text':'voel'},{'label':'reflexive pronoun','text':'me'},{'label':'adjective','text':'goed'}]
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
print('Applied targeted editorial corrections to the 600-record everyday collection; this is not a complete semantic review.')
