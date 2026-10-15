"""Reproducible authoring from an explicitly written Dutch practice bank.

No machine translation, tense mutation, or noun replacement happens here.
Sentences and meanings below are authored pairs. Families reuse checked examples
of a shared construction: these are related practice, not claimed video quotes.
"""
import json, pathlib, re
ROOT=pathlib.Path(__file__).resolve().parents[1]
def read(name): return json.loads((ROOT/'data'/name).read_text())
def write(name,value): (ROOT/'data'/name).write_text(json.dumps(value,ensure_ascii=False,indent=(1 if name in ['grammar-notes.json','grammar-breakdowns.json'] else 2))+'\n')
BANK={}
def family(key,focus,rule,lines):
    pairs=[line.split('|') for line in lines.strip().splitlines()]
    assert len(pairs)>=12 and all(len(p)==2 for p in pairs)
    BANK[key]={'focus':focus,'rule':rule,'pairs':pairs}

family('present','Present tense and agreement',
"The finite verb changes with the subject: ik werk, hij werkt, wij werken. In an ordinary statement it follows the subject; a complete time/place phrase can occupy first position instead. Dutch simple present can also describe what is happening now; English often uses an -ing form. Do not put is before an unrelated infinitive.",'''
Ik werk vandaag thuis.|I am working from home today.
Mijn broer woont in Gent.|My brother lives in Ghent.
Wij leren elke dag Nederlands.|We learn Dutch every day.
Zij kookt graag voor haar vrienden.|She enjoys cooking for her friends.
Ik controleer de bestelling.|I am checking the order.
De les begint om negen uur.|The lesson starts at nine o'clock.
Wij plannen onze vakantie.|We are planning our holiday.
Mijn collega schreef gisteren een verslag.|My colleague wrote a report yesterday.
Ik zocht gisteren mijn sleutels.|I looked for my keys yesterday.
Hij betaalde met zijn kaart.|He paid by card.
De kinderen spelen in de tuin.|The children are playing in the garden.
Ik begrijp deze uitleg.|I understand this explanation.
''')
family('past','Simple past and subject agreement',
"The simple past places an action/state in a past situation. Regular verbs use -de/-te in the singular and -den/-ten in the plural; irregular forms must be learned. Compare ik probeerde and wij probeerden. The finite past verb still follows main-clause V2, or comes first in a yes/no question. A past-time expression does not require one particular past tense in every context.",'''
Ik probeerde een nieuwe soep.|I tried a new soup.
Wij probeerden een nieuw restaurant.|We tried a new restaurant.
Hij werkte gisteren thuis.|He worked from home yesterday.
Zij belde haar moeder.|She called her mother.
Wij woonden vroeger in Gent.|We used to live in Ghent.
Ik danste met mijn vrouw.|I danced with my wife.
De vergadering eindigde om vijf uur.|The meeting ended at five o'clock.
Mijn collega controleerde de voorraad.|My colleague checked the stock.
Ik las gisteren een boek.|I read a book yesterday.
Zij kocht een nieuwe jas.|She bought a new coat.
We maakten plannen voor het weekend.|We made plans for the weekend.
Hij gaf me goed advies.|He gave me good advice.
''')
family('perfect','Perfect tense and the verb bracket',
"Use a finite auxiliary (heb/heeft/hebben or ben/is/zijn) and a past participle. The auxiliary occupies the main clause's finite-verb position; the participle usually closes its verb bracket. Unstressed object pronouns normally occur early: Ik heb het gisteren gedaan. Auxiliary choice depends on the verb and meaning: an activity such as cycling uses hebben, directed movement can use zijn. Perfect and simple past overlap; neither is selected only by 'today' versus 'yesterday'.",'''
Ik heb een nieuw recept geprobeerd.|I tried a new recipe.
Wij hebben de soep geproefd.|We tasted the soup.
Hij heeft de bestelling gecontroleerd.|He checked the order.
Ik heb mijn kamer opgeruimd.|I tidied my room.
Zij heeft de ramen schoongemaakt.|She cleaned the windows.
Wij hebben twee uur gefietst.|We cycled for two hours.
Ik ben naar huis gefietst.|I cycled home.
Hij is vroeg vertrokken.|He left early.
Zij heeft haar moeder gebeld.|She called her mother.
We hebben over het probleem gesproken.|We talked about the problem.
Ik heb het gisteren afgemaakt.|I finished it yesterday.
De trein is op tijd aangekomen.|The train arrived on time.
''')
family('pluperfect','An action before another past moment',
"Had/hadden or was/waren plus a participle expresses something already completed before a past reference point. Compare Ik heb gegeten (a completed event) with Ik had al gegeten toen hij kwam (completed before he came). Keep the auxiliary finite and the participle in its verb bracket; a toen-clause has its own final verb.",'''
Ik had de soep al gemaakt.|I had already made the soup.
Wij hadden het rapport al gelezen.|We had already read the report.
Zij had de brief al geschreven.|She had already written the letter.
Ik had mijn huiswerk al gemaakt.|I had already done my homework.
Hij was al naar huis gegaan.|He had already gone home.
We waren vroeg vertrokken.|We had left early.
Ik had de deur al op slot gedaan.|I had already locked the door.
Zij had het nieuws al gehoord.|She had already heard the news.
Wij hadden de rekening al betaald.|We had already paid the bill.
Ik had de kamer opgeruimd voordat zij kwam.|I had tidied the room before she came.
De trein was al vertrokken toen ik aankwam.|The train had already left when I arrived.
Hij had het probleem al opgelost.|He had already solved the problem.
''')
family('modal','Modal verbs and final infinitives',
"A modal such as kunnen, moeten, willen, mogen or zullen is the finite verb. The action verb stays an infinitive, normally at the end of the main clause: Ik wil de soep proberen. No te directly after these modals. If the infinitive itself requires te, that separate relationship remains: Ik zal proberen te slapen. English to has no single Dutch translation.",'''
Ik wil de soep proberen.|I want to try the soup.
Wij moeten de deur sluiten.|We must close the door.
Hij kan morgen niet komen.|He cannot come tomorrow.
Zij mag hier parkeren.|She is allowed to park here.
We zullen je morgen bellen.|We will call you tomorrow.
Ik moet mijn telefoon opladen.|I need to charge my phone.
Wij willen samen oefenen.|We want to practise together.
Hij wil een nieuwe baan vinden.|He wants to find a new job.
Ik zal proberen te slapen.|I will try to sleep.
We zullen proberen het lek te repareren.|We will try to repair the leak.
Je moet het morgen afmaken.|You have to finish it tomorrow.
Ik kan het je niet uitleggen.|I cannot explain it to you.
''')
family('modal-question','Questions with a modal verb',
"In a yes/no question the finite modal comes before the subject, and the other verb remains an infinitive: Kun je het raam openen? With subject je/jij AFTER the finite verb, the usual second-person -t drops (kun je); u retains its form. With u, both kunt u and kan u are possible; both hebt u and heeft u are standard. A bare noun request can leave an understood action unspoken: Mag ik de bon?",'''
Wil je deze soep proberen?|Do you want to try this soup?
Mag ik dit gerecht proberen?|May I try this dish?
Kun je het raam openmaken?|Can you open the window?
Kunt u mij helpen?|Can you help me?
Moet ik hier overstappen?|Do I have to change trains here?
Kunnen we samen oefenen?|Can we practise together?
Zullen we morgen afspreken?|Shall we meet tomorrow?
Moet je het morgen afmaken?|Do you have to finish it tomorrow?
Mag ik met de kaart betalen?|May I pay by card?
Kan ik de jas passen?|Can I try on the coat?
Wil je de deur sluiten?|Do you want to close the door?
Zullen we samen eten?|Shall we eat together?
''')
family('question','Question-word phrases and inversion',
"A question word or complete question phrase comes first, then the finite verb and usually the subject: Hoe laat komt de trein? Hoe laat is ONE constituent despite being two words. Subject questions are different: Wie komt? already has wie as its subject. Other infinitives/participles usually close the clause's verb bracket.",'''
Waar kan ik brood kopen?|Where can I buy bread?
Hoe laat begint de les?|What time does the lesson start?
Wanneer moeten we dit inleveren?|When do we have to hand this in?
Wat betekent dit woord?|What does this word mean?
Hoeveel kost deze jas?|How much does this coat cost?
Waar heb je gegeten?|Where did you eat?
Waar woont je broer?|Where does your brother live?
Waarom ben je te laat?|Why are you late?
Hoe gaat het met je werk?|How is your work going?
Van welk spoor vertrekt de trein?|From which platform does the train depart?
Wat wil je drinken?|What do you want to drink?
Wie heeft de deur gesloten?|Who closed the door?
''')
family('yesno','Yes/no questions and agreement',
"A yes/no question begins with the finite verb: Je hebt tijd → Heb je tijd? Put the subject after that verb. If je/jij is the subject following the verb, a present-tense -t usually disappears: jij werkt → werk jij. This does not mean that every written je removes -t: possessive je inside je broer is not the subject pronoun.",'''
Heb je morgen tijd?|Do you have time tomorrow?
Is deze plaats vrij?|Is this seat free?
Spreekt u Engels?|Do you speak English?
Werk je vandaag thuis?|Are you working from home today?
Woont hij in Gent?|Does he live in Ghent?
Heeft u een kleinere maat?|Do you have a smaller size?
Hebt u een afspraak?|Do you have an appointment?
Heb je het al afgemaakt?|Have you finished it yet?
Verkoop je de oude auto aan Zoë?|Are you selling the old car to Zoë?
Is de winkel op maandag open?|Is the shop open on Mondays?
Gaat deze trein naar Brugge?|Does this train go to Bruges?
Voel je je beter?|Do you feel better?
''')
family('imperative','Commands and separable particles',
"A normal imperative uses the verb's stem without a spoken subject: Verkoop de printer. Je in Verkoop je auto means YOUR, not YOU. A separable prefix normally goes later: Ruim je kamer op. Pronouns naming recipients occur early (Geef het me); aan can explicitly identify the recipient/buyer. A command is not an ordinary subject-first statement.",'''
Verkoop de oude printer aan hem.|Sell the old printer to him.
Verkoop je oude auto aan Zoë.|Sell your old car to Zoë.
Probeer dit gerecht eens!|Try this dish!
Ruim je kamer op.|Tidy your room.
Maak de ramen schoon.|Clean the windows.
Leg het me uit.|Explain it to me.
Lees de brief voor.|Read the letter aloud.
Geef het boek aan je broer.|Give the book to your brother.
Stuur het me op.|Send it to me.
Kom morgen op tijd.|Come on time tomorrow.
Bel de tandarts terug.|Call the dentist back.
Doe de deur op slot.|Lock the door.
''')
family('lets','Suggestions with laten we',
"Laten we + infinitive means let's do something together. Laten introduces the suggestion; we names the people included, and the action verb remains an infinitive. With two action verbs, both can be infinitives: Laten we koffie gaan drinken. This is a suggestion, not the normal declarative wij laten pattern.",'''
Laten we samen oefenen.|Let's practise together.
Laten we een kop koffie drinken.|Let's have a cup of coffee.
Laten we een nieuw restaurant proberen.|Let's try a new restaurant.
Laten we de vergadering verzetten.|Let's reschedule the meeting.
Laten we een afspraak maken.|Let's make an appointment.
Laten we de prijzen vergelijken.|Let's compare the prices.
Laten we naar huis gaan.|Let's go home.
Laten we het raam openmaken.|Let's open the window.
Laten we een wandeling maken.|Let's go for a walk.
Laten we onze vakantie plannen.|Let's plan our holiday.
Laten we het probleem bespreken.|Let's discuss the problem.
Laten we morgen verdergaan.|Let's continue tomorrow.
''')
family('progressive','An action happening now: aan het',
"Use a conjugated form of zijn + aan het + infinitive. The object normally comes before aan het: Hij is de ramen aan het wassen. These models place aan het directly before the infinitive. With separable verbs, both de ramen aan het schoonmaken and de ramen schoon aan het maken are correct. Dutch simple present can also mean an English ongoing action. Aan het werk contains the NOUN werk, whereas aan het werken contains an infinitive; they are not identical constructions.",'''
Hij is aan het koken.|He is cooking.
Ik ben de soep aan het maken.|I am making the soup.
Wij zijn Nederlands aan het leren.|We are learning Dutch.
Zij is een boek aan het lezen.|She is reading a book.
Hij is de ramen aan het schoonmaken.|He is cleaning the windows.
Mijn manager is ons aan het bellen.|My manager is calling us.
Wat ben je aan het doen?|What are you doing?
Ik was mijn kamer aan het opruimen.|I was tidying my room.
Wij waren op de trein aan het wachten.|We were waiting for the train.
Hij is zijn kleren aan het wassen.|He is washing his clothes.
Zij was een verslag aan het schrijven.|She was writing a report.
We zijn de tafel aan het dekken.|We are setting the table.
''')
family('busy','Bezig met: a noun or an activity',
"Bezig met introduces what occupies someone: a noun (de was) or an infinitive used as an activity noun (het wassen). Infinitives used as nouns take het, not de: het koken. Met het schoonmaken van de ramen is a noun-like phrase; compare the verbal progressive de ramen aan het schoonmaken. Bezig can also introduce te + infinitive, with different word order.",'''
Hij is bezig met koken.|He is busy cooking.
Hij is bezig met de was.|He is busy with the laundry.
Zij is bezig met het schoonmaken van de ramen.|She is busy cleaning the windows.
Ik ben bezig met het schrijven van een brief.|I am busy writing a letter.
Wij zijn bezig met het plannen van onze vakantie.|We are busy planning our holiday.
Hij was bezig met het opruimen van zijn kamer.|He was busy tidying his room.
Zij was bezig met koken.|She was busy cooking.
Hij is bezig de winkel te sluiten.|He is busy closing the shop.
Ik ben met mijn huiswerk bezig.|I am busy with my homework.
Wij zijn bezig met het lezen van het verslag.|We are busy reading the report.
Hij is klaar met het lezen van het boek.|He has finished reading the book.
Zij is verantwoordelijk voor het opruimen.|She is responsible for tidying up.
''')
family('te','Te-infinitives and separable verbs',
"Some verbs/expressions introduce te + infinitive: proberen te slapen, klaar zijn om te gaan. Om ... te often introduces purpose or an infinitive clause, not a recipient. With a separable verb, te occurs between prefix and verb: af te maken, deel te nemen. A preceding modal does not erase the te required by proberen: Ik zal proberen te bellen.",'''
Ik probeer te slapen.|I am trying to sleep.
Hij probeert Nederlands te leren.|He is trying to learn Dutch.
Wij probeerden de deur te openen.|We tried to open the door.
Ik zal proberen te bellen.|I will try to call.
Ik ben hier om je te helpen.|I am here to help you.
Zij is klaar om te vertrekken.|She is ready to leave.
Het is belangrijk om op tijd te komen.|It is important to arrive on time.
Ik heb tijd om het af te maken.|I have time to finish it.
Wij zijn van plan om deel te nemen.|We plan to participate.
Hij vraagt me om terug te bellen.|He asks me to call back.
Ik heb zin om naar buiten te gaan.|I feel like going outside.
Het is moeilijk om dat uit te leggen.|It is difficult to explain that.
''')
family('separable','Separable verbs in different forms',
"In a main clause a separable verb's finite part and particle separate: ik ruim ... op. With a modal, the infinitive stays together: ik moet opruimen. A participle normally puts ge between prefix and stem (opgeruimd), but stems beginning with unstressed be-/ver-/ont-/her- may not add ge. With te, split around te: op te ruimen. Learn the whole expression and its meaning.",'''
Ik ruim mijn kamer op.|I tidy my room.
Hij maakt de ramen schoon.|He cleans the windows.
Wij bellen de klant terug.|We call the customer back.
Ik heb mijn kamer opgeruimd.|I tidied my room.
Zij heeft de keuken schoongemaakt.|She cleaned the kitchen.
Kun je het raam openmaken?|Can you open the window?
Ik moet mijn telefoon opladen.|I need to charge my phone.
Wij nemen water mee.|We take water with us.
Hij heeft een boek meegenomen.|He brought a book along.
Ik heb tijd om de kamer op te ruimen.|I have time to tidy the room.
Zij woonde de vergadering bij.|She attended the meeting.
We nemen deel aan de cursus.|We participate in the course.
''')
family('reflexive','Reflexive pronouns refer to the subject',
"Match the reflexive to the subject: ik/me, jij/je, hij-zij/zich, wij/ons, jullie/je, zij plural/zich. A question can contain two je forms: Voel je je beter? The first is the subject, the second reflexive. The reflexive belongs to the Dutch expression even if natural English does not say myself. In an embedded clause the verb group normally closes the clause.",'''
Ik voel me vandaag goed.|I feel good today.
Hij voelt zich moe.|He feels tired.
Wij voelen ons welkom.|We feel welcome.
Voel je je beter?|Do you feel better?
Zij maakte zich zorgen.|She was worried.
Ik vraag me af waar hij is.|I wonder where he is.
Wij vragen ons af wanneer de trein komt.|We wonder when the train will arrive.
Hij herinnert zich mijn naam.|He remembers my name.
Ik herinner me die dag.|I remember that day.
Jullie haasten je.|You are hurrying.
Zij stelt zich voor.|She introduces herself.
Ik weet dat hij zich goed voelt.|I know that he feels good.
''')
family('subordinate','Main clauses versus embedded clauses',
"Omdat means because and is written as one word. Subordinators such as omdat, dat, als, terwijl and toen introduce a clause whose verb or verb group normally comes at the end. Dutch allows more than one order inside some final verb clusters; do not call every alternative wrong. If the whole embedded clause comes first, the main clause's finite verb follows it before the subject.",'''
Ik blijf thuis omdat ik ziek ben.|I am staying home because I am ill.
Ik weet dat hij morgen komt.|I know that he is coming tomorrow.
Als ik tijd heb, oefen ik Nederlands.|If I have time, I practise Dutch.
Toen ik thuiskwam, was ik moe.|When I got home, I was tired.
Hij leest terwijl ik kook.|He reads while I cook.
Ik bel je zodra ik thuis ben.|I will call you as soon as I am home.
Ik blijf hier totdat de trein komt.|I am staying here until the train arrives.
Ik vraag me af of zij thuis is.|I wonder whether she is home.
Omdat het regent, blijven we binnen.|Because it is raining, we are staying inside.
Ik denk dat hij het kan uitleggen.|I think he can explain it.
Ik was niet thuis toen je belde.|I was not home when you called.
Zij zegt dat ze morgen moet werken.|She says that she has to work tomorrow.
''')
family('inversion','One fronted constituent, then finite verb',
"The finite verb is second in a Dutch main clause: one constituent comes first, then the finite verb, then the subject if it was not first. A constituent can contain several words (Na het werk). In a perfect/modal clause the auxiliary/modal is finite and the other verb occurs later. Fronting can emphasise an object as well as time or place; it does not create a question by itself.",'''
Vandaag drink ik koffie.|Today I am drinking coffee.
Morgen werk ik thuis.|Tomorrow I am working from home.
Na het werk fiets ik naar huis.|After work I cycle home.
Sinds vorig jaar woon ik in Roeselare.|I have lived in Roeselare since last year.
Op tafel ligt een boek.|There is a book on the table.
Elke ochtend hoor ik de vogels zingen.|Every morning I hear the birds singing.
Gisteren probeerde ik een nieuwe soep.|Yesterday I tried a new soup.
Na de les hebben we samen geoefend.|After the lesson we practised together.
Hier kun je een ticket kopen.|You can buy a ticket here.
Een glas water heb ik gedronken.|I drank a glass of water.
Dat zie ik ook.|I see that too.
Volgende week gaan we naar Gent.|Next week we are going to Ghent.
''')
family('existential','Er and position verbs',
"Existential er introduces something present or available: er is/zijn, er ligt/staat/hangt. The verb agrees with the noun introduced (er is een boek, er zijn boeken). Ligt/staat/hangt is already the finite verb, so do not add another is. Position verbs make the physical arrangement explicit. If a place phrase comes first, normal V2 still applies.",'''
Er ligt een boek op tafel.|There is a book on the table.
Er staan twee kopjes op mijn bureau.|There are two cups on my desk.
Er is melk in de koelkast.|There is milk in the fridge.
Er zijn geen wolken.|There are no clouds.
Op mijn bureau staat een kop koffie.|There is a cup of coffee on my desk.
Er hangt een foto aan de muur.|There is a photo on the wall.
Er zat een kat op de stoel.|There was a cat sitting on the chair.
Er was een onweersbui.|There was a thunderstorm.
Er is een aardbeving geweest.|There has been an earthquake.
Is er gratis wifi?|Is there free Wi-Fi?
Er zijn nog drie plaatsen vrij.|There are still three seats available.
In deze straat is er een bakker.|There is a bakery in this street.
''')
family('negation','Niet and geen with the right scope',
"Geen negates an indefinite noun: geen tijd, geen koffie. Niet can negate a predicate, action or more specific constituent: niet moe, de vraag niet begrijpen. Its location depends on what is negated, not on an absolute rule 'always at the end'. With a second verb the final verb bracket stays after niet. Dutch niet hoeven te means not having to; niet mogen means not being allowed to.",'''
Ik heb geen tijd.|I have no time.
Zij drinkt geen koffie.|She does not drink coffee.
Ik begrijp deze vraag niet.|I do not understand this question.
Hij is niet moe.|He is not tired.
Wij kunnen vandaag niet komen.|We cannot come today.
Ik heb de brief niet gelezen.|I did not read the letter.
Zij heeft haar koffie niet gedronken.|She did not drink her coffee.
Er zijn geen wolken.|There are no clouds.
Je hoeft morgen niet te werken.|You do not have to work tomorrow.
Je mag hier niet parkeren.|You are not allowed to park here.
Ik wil geen thee drinken.|I do not want to drink tea.
Wij hebben geen zak nodig.|We do not need a bag.
''')
family('possessive','Possessives and noun agreement',
"Ons/onze both mean our. Use ons before a singular het-word (ons huis, ons budget); onze before singular de-words and all plurals (onze auto, onze huizen). The number of owners does not choose ons/onze. Other possessives such as mijn/je/jouw/zijn/haar do not change that way. Je can mean you or your depending on its grammatical role.",'''
We plannen ons budget.|We are planning our budget.
Onze auto staat buiten.|Our car is outside.
Ons huis is klein.|Our house is small.
Wij controleren onze budgetten.|We are checking our budgets.
Dit is mijn tas.|This is my bag.
Dat is jouw kopje.|That is your cup.
Zij heeft haar boek meegenomen.|She brought her book along.
Zijn vergadering begint straks.|His meeting starts shortly.
Onze kinderen leren Nederlands.|Our children are learning Dutch.
Ik heb ons verslag gelezen.|I read our report.
Verkoop je oude auto aan hem.|Sell your old car to him.
Is dit haar voorstel?|Is this her proposal?
''')
family('adjective','Adjective endings and noun type',
"Before a noun an adjective usually has -e: de rode tas, het rode boek. The main beginner exception is a singular indefinite het-word: een rood boek, een nieuw gerecht. Possessives/demonstratives make that het-noun definite: ons nieuwe huis. A predicate adjective after zijn normally has no agreement -e: het huis is mooi. Comparative forms have their own spelling; do not form every ending by simply appending e.",'''
Ik probeer een nieuw gerecht.|I am trying a new dish.
Ik probeerde een nieuwe soep.|I tried a new soup.
Het nieuwe gerecht is lekker.|The new dish is tasty.
Dat is een rood boek.|That is a red book.
De rode tas is duur.|The red bag is expensive.
Ons nieuwe huis is groot.|Our new house is big.
Dit is een groot bedrijf.|This is a large company.
Het kantoor is rustig.|The office is quiet.
Ik zoek een kleinere maat.|I am looking for a smaller size.
Deze appels zijn goedkoper.|These apples are cheaper.
Zij kocht een mooie jas.|She bought a beautiful coat.
Wij hebben lekkere broodjes gegeten.|We ate tasty rolls.
''')
family('relative','Relative die/dat and embedded word order',
"A relative clause describes a noun: de vrouw die hier woont, het boek dat op tafel ligt. Use die for singular de-words and plural nouns, dat for singular het-words. The relative clause normally places its verb group at the end. Demonstrative dat in Dat zie ik is a different role from relative dat or conjunction dat; spelling alone does not tell you the structure.",'''
Dit is de vrouw die in Gent woont.|This is the woman who lives in Ghent.
Ik lees het boek dat je me gaf.|I am reading the book you gave me.
De mensen die buiten staan, wachten op de bus.|The people standing outside are waiting for the bus.
Ik luister naar nummers die ik leuk vind.|I listen to songs I like.
Dat is het huis dat naast het park staat.|That is the house next to the park.
Ik zoek de pen die op tafel lag.|I am looking for the pen that was on the table.
Hij draagt de jas die hij gisteren kocht.|He is wearing the coat he bought yesterday.
Dit is het gerecht dat ik heb geprobeerd.|This is the dish I tried.
De collega die ons helpt, spreekt Nederlands.|The colleague helping us speaks Dutch.
Waar is het formulier dat ik moet invullen?|Where is the form I have to fill in?
Zij kent de man die daar werkt.|She knows the man who works there.
Ik heb de sleutels gevonden die ik zocht.|I found the keys I was looking for.
''')
family('preposition','Learn the preposition with its expression',
"English at/to/on does not determine a single Dutch preposition. Learn the combination: verkopen aan a buyer; luisteren naar; houden van; wachten op. Op een feest names an event, in de zaal a physical space. Naar often introduces a destination but also belongs to non-motion expressions such as luisteren naar. Te before an infinitive is not a recipient preposition.",'''
Ik verkoop de printer aan mijn collega.|I am selling the printer to my colleague.
Ik luister naar mijn moeder.|I listen to my mother.
Hij wacht op de trein.|He is waiting for the train.
Zij houdt van lezen.|She loves reading.
Wij praten over de vergadering.|We are talking about the meeting.
Ik dans op de bruiloft.|I am dancing at the wedding.
Ik ben op kantoor.|I am at the office.
Morgen ga ik naar kantoor.|Tomorrow I am going to the office.
Na het werk ga ik naar huis.|After work I am going home.
De foto hangt aan de muur.|The photo hangs on the wall.
Hij zit in de kamer.|He is sitting in the room.
Ik vraag mijn collega om hulp.|I ask my colleague for help.
''')
family('noun-activity','An infinitive used to name an activity',
"An infinitive can name an activity and function like a noun: het lezen, het schoonmaken. A whole activity phrase can be the subject: De hond uitlaten is mijn taak. Its finite verb still follows that entire first constituent. Infinitives used as nouns normally take het; de was is a separate noun meaning laundry. Do not confuse the activity noun with a conjugated verb.",'''
Lezen is mijn hobby.|Reading is my hobby.
Rusten is goed voor je.|Resting is good for you.
De hond uitlaten is mijn taak.|Walking the dog is my task.
Het schoonmaken van de keuken kost tijd.|Cleaning the kitchen takes time.
Nederlands leren is belangrijk voor mij.|Learning Dutch is important to me.
Samen koken is leuk.|Cooking together is fun.
Ik hou van lezen in de buitenlucht.|I love reading outdoors.
Hij is bezig met het wassen van de ramen.|He is busy washing the windows.
Aan jou denken maakt me blij.|Thinking of you makes me happy.
Het plannen van de reis is gemakkelijk.|Planning the trip is easy.
Zingen was haar passie.|Singing was her passion.
Het opruimen van mijn kamer duurde een uur.|Tidying my room took an hour.
''')
family('copula','Zijn/worden and descriptions',
"Zijn describes a state; worden describes becoming/changing: het is koud versus het wordt koud. Use one finite verb for the main clause, not is wordt. The predicate adjective normally stays uninflected: het huis is mooi. A noun complement keeps its own article/possessive, and the finite verb agrees with its subject (de kamers zijn).",'''
Het is erg mistig.|It is very foggy.
Mijn telefoon is leeg.|My phone's battery is dead.
Het kantoor is rustig.|The office is quiet.
Hij is erg lang.|He is very tall.
De kamers zijn schoon.|The rooms are clean.
Dit is mijn huis.|This is my house.
Dat is een goed idee.|That is a good idea.
Het wordt koud.|It is getting cold.
Zij werd een goede dokter.|She became a good doctor.
Morgen wordt het een drukke dag.|Tomorrow is going to be a busy day.
Het was een prachtige zonsondergang.|It was a beautiful sunset.
Dat lijkt op goud.|That looks like gold.
''')
family('pronoun','Objects, recipients and short pronouns',
"Short unstressed pronouns such as het/me/je normally occur early in the clause, before much new information. Het as an object means it; it is not the noun article in that use. Aan can name a recipient explicitly, but some verbs also allow a recipient without a preposition: Geef het me. Keep participles/infinitives in their later verb bracket; never move het after afgemaakt just because English ends differently.",'''
Heb je het afgemaakt?|Have you finished it?
Moet je het morgen afmaken?|Do you have to finish it tomorrow?
Ik geef het aan hem.|I give it to him.
Geef het me.|Give it to me.
Zij heeft het mij uitgelegd.|She explained it to me.
Ik kan het je niet vertellen.|I cannot tell you.
Laat je het me zien?|Will you show it to me?
Hij heeft me gisteren gebeld.|He called me yesterday.
We sturen het morgen op.|We will send it tomorrow.
Ik heb je boek meegenomen.|I brought your book along.
Zij gaf ons goed advies.|She gave us good advice.
Ik wil het je uitleggen.|I want to explain it to you.
''')
family('trial','Proberen: try a thing or try to act',
"Proberen means try. Ik probeer is present; ik probeerde is singular simple past; wij probeerden is plural past; ik heb geprobeerd uses the participle with hebben. The regular participle is ge + probeer + d. A thing can be tried directly; trying to do something uses proberen + te + infinitive. After zal the verb becomes proberen: ik zal proberen te bellen. Trying on clothes usually uses passen; tasting food can use proeven.",'''
Ik probeer een nieuw gerecht.|I am trying a new dish.
Ik probeerde een nieuwe soep.|I tried a new soup.
Wij probeerden een nieuw restaurant.|We tried a new restaurant.
Heb je dit gerecht al geprobeerd?|Have you tried this dish yet?
Ik heb een nieuw recept geprobeerd.|I tried a new recipe.
Wil je deze soep proberen?|Do you want to try this soup?
Mag ik dit gerecht proberen?|May I try this dish?
Morgen probeer ik een ander gerecht.|Tomorrow I will try a different dish.
Ik zal proberen de soep te maken.|I will try to make the soup.
Probeer dit gerecht eens!|Try this dish!
Zij probeert de saus.|She is trying the sauce.
We hebben een andere aanpak geprobeerd.|We tried a different approach.
''')
family('since','Since, duration, and time expressions',
"Sinds identifies a starting point that continues to the reference time: Ik woon hier sinds vorig jaar. Dutch commonly uses PRESENT tense for a situation still true, where English uses have lived/have worked. A duration is different: Ik heb twee uur gefietst. Fronted time expressions form one constituent and trigger main-clause inversion. Learn clock expressions carefully: half zes is 5:30, not 6:30.",'''
Ik woon sinds vorig jaar in Roeselare.|I have lived in Roeselare since last year.
Sinds september werk ik in Brussel.|I have worked in Brussels since September.
Hij leert sinds januari Nederlands.|He has been learning Dutch since January.
Ik heb twee uur gefietst.|I cycled for two hours.
Wij hebben tien minuten gewacht.|We waited for ten minutes.
De les begint om half zes.|The lesson starts at half past five.
Zullen we om drie uur afspreken?|Shall we meet at three o'clock?
Na het werk ga ik naar huis.|After work I am going home.
Hij is een uur geleden vertrokken.|He left an hour ago.
Wij werken drie dagen per week.|We work three days a week.
De trein heeft tien minuten vertraging.|The train is ten minutes late.
Ik ben hier al een uur.|I have been here for an hour.
''')

family('passive','Passive voice and completed states',
"In a passive clause the subject receives the action: het formulier wordt ingevuld. Worden forms an ongoing/event passive; zijn plus a participle can describe the completed passive or resulting state. In the simple past use werd/werden. Do not classify every is + participle as an active movement perfect; identify whether the subject performed the action.","""
De vergadering wordt geannuleerd.|The meeting is being cancelled.
De vergadering is geannuleerd.|The meeting has been cancelled.
Het formulier wordt ingevuld.|The form is being filled in.
Het formulier is ingevuld.|The form has been filled in.
De ramen worden schoongemaakt.|The windows are being cleaned.
De deur werd gesloten.|The door was closed.
Het voorstel werd geaccepteerd.|The proposal was accepted.
De bestelling is bevestigd.|The order has been confirmed.
De tickets worden gecontroleerd.|The tickets are being checked.
Het probleem is opgelost.|The problem has been solved.
Zijn inspanningen werden erkend.|His efforts were recognised.
De brief werd gisteren verstuurd.|The letter was sent yesterday.
""")
family('perception','Perception verb and bare infinitive',
"Horen/zien can introduce someone doing an action: Ik hoor de vogels zingen. The birds are the object of hoor and the understood subject of zingen. The second verb is an infinitive without te in this construction. Other verb combinations such as helpen/laten and posture + te have different patterns; do not invent one universal two-verb rule.","""
Ik hoor de vogels zingen.|I hear the birds singing.
Zij hoort de kinderen spelen.|She hears the children playing.
We zien de trein aankomen.|We see the train arriving.
Ik zag hem naar buiten gaan.|I saw him go outside.
Hij hoorde iemand bellen.|He heard someone calling.
Wij horen haar Nederlands spreken.|We hear her speaking Dutch.
Ik zie de kinderen dansen.|I see the children dancing.
Zij zag de kat weglopen.|She saw the cat walk away.
Ik hoor mijn buurman lachen.|I hear my neighbour laughing.
We zagen de bus vertrekken.|We saw the bus leave.
Hij hoort de hond blaffen.|He hears the dog barking.
Ik zag haar de deur sluiten.|I saw her close the door.
""")
family('need','Nodig hebben: needing a thing',
"In iets nodig hebben, hebben is the finite verb and nodig is a predicative word, not a participle. Ik heb een pen nodig is present, not perfect just because it contains heb. Contrast ik had een pen nodig (past) and ik zal een pen nodig hebben (future/modal). Geen negates an indefinite needed item: ik heb geen pen nodig.","""
Ik heb een pen nodig.|I need a pen.
Wij hebben meer tijd nodig.|We need more time.
Hij heeft zijn paspoort nodig.|He needs his passport.
Ik heb geen zak nodig.|I do not need a bag.
Zij had hulp nodig.|She needed help.
We hadden geen kaart nodig.|We did not need a map.
Zul je hulp nodig hebben?|Will you need help?
Ik zal morgen mijn laptop nodig hebben.|I will need my laptop tomorrow.
Heb je een ticket nodig?|Do you need a ticket?
Wij hebben een oplossing nodig.|We need a solution.
Hij heeft goed advies nodig.|He needs good advice.
Ik heb wat water nodig.|I need some water.
""")
family('position','Posture, movement and activity',
"Zitten/staan/liggen describe a position: ik zit op de stoel. Gaan zitten expresses moving into sitting: ik ga zitten. Its perfect is ik ben gaan zitten, with gaan as an infinitive in the verb cluster. A posture verb can describe an ongoing action with te: ik sta te wachten. These differ from bare is + infinitive, which is not the progressive.","""
Mijn pen ligt op tafel.|My pen is on the table.
Ik zit op de stoel.|I am sitting on the chair.
Ik ga op de bank zitten.|I am going to sit down on the sofa.
Ik ben op de bank gaan zitten.|I sat down on the sofa.
Hij staat bij de bushalte.|He is standing at the bus stop.
Zij lag op het bed.|She was lying on the bed.
Ik sta op de bus te wachten.|I am waiting for the bus.
Hij stond bij de ingang te wachten.|He was waiting at the entrance.
Zij zit een boek te lezen.|She is reading a book.
Wij blijven hier staan.|We remain standing here.
De auto staat buiten.|The car is parked outside.
Ik heb een uur zitten wachten.|I waited for an hour.
""")
family('polite','Short expressions and their intended meaning',
"Some useful expressions are fragments rather than full subject-plus-verb clauses: Hartelijk dank, Graag gedaan. Do not invent V2 inversion for a phrase with no finite verb. Learn what the expression does in the conversation, and compare related full sentences. A polite formula can have several natural English equivalents.","""
Bedankt voor je hulp.|Thank you for your help.
Hartelijk dank.|Thank you very much.
Graag gedaan.|You're welcome.
Goed gedaan!|Well done!
Een kop koffie, alstublieft.|A cup of coffee, please.
Twee broodjes, alstublieft.|Two rolls, please.
Tot morgen!|See you tomorrow!
Veel succes!|Good luck!
Geen probleem.|No problem.
Dat is vriendelijk van je.|That is kind of you.
Sorry voor de vertraging.|Sorry for the delay.
Fijn weekend!|Have a nice weekend!
""")
family('demonstrative','This/that and the noun they refer to',
"Use dit/dat with a singular het-word and deze/die with a singular de-word or any plural. Dit boek, deze tas, deze boeken. Distance is usually nearby dit/deze versus farther away dat/die; context can also determine it. Standalone dit/dat in Dit is mijn tas is not agreement with tas: it introduces an identification. Do not transfer the attached-noun rule mechanically to every pronoun.","""
Dit boek is interessant.|This book is interesting.
Deze tas is duur.|This bag is expensive.
Dat huis is groot.|That house is big.
Die auto staat buiten.|That car is outside.
Deze boeken zijn nieuw.|These books are new.
Die mensen wonen hier.|Those people live here.
Ik wil dit brood.|I want this bread.
Ik neem deze jas.|I will take this coat.
Heb je dat gerecht geprobeerd?|Have you tried that dish?
Wat betekent dit woord?|What does this word mean?
Dit is mijn tas.|This is my bag.
Dat is onze auto.|That is our car.
""")
HINTS={
    "present": "The finite verb agrees with its subject and carries the tense: ik werk, hij werkt, wij werken; past ik werkte. In an ordinary statement it is the second constituent. Dutch present can describe an ongoing action.",
    "past": "Regular simple-past forms use -de/-te in the singular and -den/-ten in the plural; irregular verbs change their stem. Keep the finite verb in main-clause second position. Compare the subject and time in the model.",
    "perfect": "The finite auxiliary agrees with the subject; the participle usually closes the verb bracket. Put short unstressed objects early: Ik heb het gedaan. Learn hebben/zijn with the verb and its meaning.",
    "pluperfect": "Had/hadden or was/waren plus a participle places an action before another past moment. The auxiliary is finite; the participle is not. Compare the past reference point with a normal perfect.",
    "modal": "Conjugate the modal; leave its following action as an infinitive without te. A later verb may still require te: Ik zal proberen te bellen. Keep objects before the final action verb in these models.",
    "modal-question": "Ask with finite modal + subject + remaining words + infinitive. Kun je and kunt u have different agreement forms. Compare permission (mogen), possibility (kunnen), necessity (moeten), and suggestions (zullen).",
    "question": "A complete question phrase comes first, then the finite verb and usually the subject. Hoe laat is one phrase. In Wie komt?, wie already is the subject; do not add a second subject.",
    "yesno": "Put the finite verb before the subject for a neutral yes/no question. Subject je/jij after a present verb normally drops its -t: Heb je...? This does not apply to possessive je or subject u.",
    "imperative": "An ordinary command starts with the stem and omits the subject. Separable particles come later: Ruim je kamer op. Je before auto means your. Aan identifies a recipient; it is not infinitive-marker te.",
    "lets": "Laten we + infinitive means let’s do this together. The action stays an infinitive, without te. Keep objects before it in these models. Compare the activity you suggest with the supporting example.",
    "progressive": "Conjugate zijn and use aan het with an infinitive. Put the object before that construction: Hij is de ramen aan het wassen. Past was/waren changes the time; the action verb remains an infinitive.",
    "busy": "Bezig met can introduce a noun (de was) or a noun-like infinitive (het wassen). Use het, not de, for a nominalised infinitive. With van, identify what is being cleaned, read, or repaired.",
    "te": "These verbs and expressions introduce a te-infinitive. With separable verbs, insert te inside: af te maken. Om ... te can express purpose; it does not name a buyer or recipient.",
    "separable": "Separate the finite verb and its particle in a main clause: ik ruim ... op. Join them in a bare infinitive: opruimen. Compare participle opgeruimd and te-infinitive op te ruimen.",
    "reflexive": "Match the reflexive to the subject: ik/me, hij/zich, wij/ons. In Voel je je beter?, the first je is subject and the second is reflexive. Natural English may omit the reflexive.",
    "subordinate": "After omdat, dat, als, or another subordinator, the verb group normally closes that clause. If the whole clause comes first, the following main clause uses inversion. Some final verb-cluster orders have valid alternatives.",
    "inversion": "A fronted time/place/object phrase is one constituent. The finite verb follows it, then the subject: Morgen werk ik thuis. Do not count individual words when deciding the verb’s second position.",
    "existential": "Er introduces something present or available. Agreement follows the noun: er is een boek, er zijn boeken. Ligt/staat/hangt describes its position; that verb is already finite, so do not add is.",
    "negation": "Geen negates an indefinite noun; niet negates a predicate or another constituent. The placement depends on the meaning. Niet hoeven te means no obligation; niet mogen means no permission.",
    "possessive": "Ons goes with a singular het-word; onze goes with a singular de-word or any plural. Compare ons budget and onze budgetten. The number of owners does not decide the form.",
    "adjective": "Before a noun, use -e in most cases. A singular indefinite het-word is the key exception: een nieuw gerecht. Compare een nieuwe soep and definite het nieuwe gerecht. Predicate adjectives normally have no agreement -e.",
    "relative": "Relative die describes a singular de-word or a plural noun; dat describes a singular het-word. The relative clause normally has a final verb group. Relative dat differs from standalone that and conjunction dat.",
    "preposition": "Learn the whole expression: verkopen aan, luisteren naar, wachten op, houden van. Naar also occurs without movement. Prepositions depend on the expression and intended meaning, not a word-for-word English substitution.",
    "noun-activity": "An infinitive can name an activity, often with het. A whole activity phrase can be a singular subject: De hond uitlaten is mijn taak. Distinguish noun de was from activity het wassen.",
    "copula": "Zijn describes a state; worden describes becoming. A predicate adjective normally has no attributive -e: het is koud, het wordt koud. The finite verb agrees with the subject, not a nearby noun.",
    "pronoun": "Use subject ik/jij/hij to name who acts, and object me/je/hem for an object or after a preposition. Unstressed object pronouns normally appear early; the supporting example shows their role.",
    "trial": "Compare ik probeer (present), ik probeerde / wij probeerden (past), and ik heb geprobeerd (perfect). Try a thing directly, but try to act with proberen te. After zal: zal proberen te, not zal probeer.",
    "since": "Dutch often uses present with sinds for a situation still true; English uses have lived/worked. A duration describes how long an activity lasted. Half zes is 5:30: half an hour before six.",
    "passive": "The subject receives the action. Wordt/werd plus a participle describes present/past passive; is plus a participle often describes completed passive or its resulting state. Do not use heeft as if that subject performs the action.",
    "perception": "Horen/zien can take an object plus a bare infinitive: Ik hoor de vogels zingen. No te belongs in this construction. In the perfect, a perception verb before another infinitive may be a replacing infinitive.",
    "need": "Iets nodig hebben means to need something. Nodig is an adjective, not an infinitive. Hebben is finite and agrees with the subject; the thing needed comes before nodig in these models.",
    "position": "Zitten/staan/liggen describes posture. Gaan zitten means sit down; its perfect is ben gaan zitten. A posture verb with te can describe an ongoing activity: staan te wachten. Bare is + infinitive is not that pattern.",
    "polite": "Learn this expression by its conversational purpose. Some polite formulas have no subject or finite verb, so V2 is irrelevant. Graag gedaan answers thanks; bedankt expresses thanks.",
    "demonstrative": "Before a singular het-word, use dit/dat; before a de-word or a plural, use deze/die. Standalone Dit is mijn tas is an identification: dit does not have to agree with tas."
}
for key,hint in HINTS.items(): BANK[key]['hint']=hint

OVERRIDES={
 'conversation-10':'polite','conversation-33':'polite','conversation-79':'polite','shopping-13':'polite','work-110':'polite','work-242':'polite',
 'school-07':'position','home-26':'present','transport-32':'present','home-30':'noun-activity','leisure-17':'noun-activity','leisure-18':'noun-activity','leisure-20':'noun-activity','conversation-26':'noun-activity',
 'work-51':'noun-activity','work-152':'noun-activity','work-186':'noun-activity','work-194':'noun-activity','work-325':'noun-activity',
 'work-166':'preposition','work-209':'te','work-322':'yesno','work-221':'question','work-235':'question','work-233':'present',
 'work-107':'passive','work-155':'passive','work-172':'passive','work-116':'past','work-128':'possessive','work-317':'need','work-303':'noun-activity',
 'work-63':'copula','work-149':'copula','work-263':'copula','transport-38':'past','work-19':'present',
 'work-169':'question','work-71':'copula','work-255':'subordinate','work-138':'subordinate','work-206':'subordinate',
 'work-39':'present','work-58':'present','work-258':'preposition','work-90':'imperative','work-147':'imperative','work-219':'imperative','work-243':'imperative',
 'work-41':'need','work-57':'need','work-95':'need','work-108':'need','work-123':'need','work-69':'need',
 'shopping-06':'need','health-02':'need','transport-24':'need','shopping-24':'need',
 'conversation-24':'past','shopping-17':'past','conversation-40':'past','weather-08':'past','work-20':'past','leisure-10':'past','home-20':'past',
 'shopping-19':'past','leisure-12':'past','leisure-13':'past','transport-31':'past','shopping-21':'past','conversation-61':'past','conversation-65':'past','weather-13':'past','leisure-22':'past','conversation-74':'past','conversation-77':'past',
 'work-111':'past','work-270':'separable','food-18':'negation','health-03':'reflexive','home-25':'perception','food-15':'position','health-04':'position',
 'weather-04':'modal','work-26':'modal','transport-35':'modal','work-214':'modal','work-313':'modal',
 'home-06':'demonstrative','shopping-10':'demonstrative','shopping-20':'demonstrative',
 'conversation-23':'noun-activity','administration-04':'yesno','conversation-63':'yesno',
 'work-145':'possessive','work-80':'perfect','work-150':'imperative','food-07':'trial','leisure-10':'past','home-23':'busy','home-09':'separable','transport-01':'question','conversation-18':'perfect','home-15':'pluperfect','work-16':'pluperfect','conversation-78':'modal','conversation-21':'copula','transport-23':'present','transport-12':'perfect','conversation-01':'present','shopping-08':'adjective',
 'work-321':'pluperfect','school-21':'perfect','work-50':'separable','work-220':'separable','work-177':'position','transport-34':'position','shopping-25':'perfect'
}

def classify(c,b):
    if c['id'] in OVERRIDES:return OVERRIDES[c['id']]
    t=c['dutch'].lower(); n=(b['forms']+' '+b['order']).lower()
    if 'probe' in t or 'proberen' in t:return 'trial'
    if 'aan het ' in t and not 'aan het werk' in t:return 'progressive'
    if 'bezig' in t or re.search(r'(klaar met|verantwoordelijk voor).*het ',t):return 'busy'
    if any(x in t for x in ['voel me','voelt zich','voelen ons','voel je je','zich','me af','ons af','je beter']):return 'reflexive'
    if re.search(r'\b(omdat|terwijl|totdat|zodra|voordat|nadat|toen|als|of)\b',t) or re.search(r'\b(zegt|denk|weet|hoop).*\bdat\b',t):return 'subordinate'
    if 'relative' in n:return 'relative'
    if t.startswith('laten we'):return 'lets'
    if t.startswith('sinds ') or ' sinds ' in t or 'half zes' in t:return 'since'
    if t.startswith('er ') or ' er ' in t and any(x in t for x in ['staat','staan','ligt','liggen','is','zijn']):return 'existential'
    if 'imperative' in n or t.startswith(('gelieve ','wees ','laat ','geef ','stuur ','verkoop ','leg ','vraag ','breng ','kom ','maak ','ruim ','bel ')):return 'imperative'
    if re.search(r'\b(had|hadden)\b',t) or 'pluperfect' in n:return 'pluperfect'
    if 'perfect' in n and 'imperfect' not in n and not 'past perfect' in n:return 'perfect'
    if 'participle' in n and re.search(r'\b(heb|hebt|heeft|hebben|ben|is|zijn)\b',t):return 'perfect'
    if t.startswith(('kun ','kan ','kunt ','kunnen ','moet ','moeten ','mag ','mogen ','wil ','willen ','zal ','zul ','zullen ')):return 'modal-question'
    if '?' in t and t.startswith(('waar','wat','hoe','wanneer','waarom','wie','van welk')):return 'question'
    if '?' in t:return 'yesno'
    if re.search(r'\b(zal|zullen|moet|moeten|kan|kunnen|wil|willen|mag|mogen)\b',t):return 'modal'
    if ' te ' in t or 'om ' in t and ' te ' in t:return 'te'
    if 'infinitive as' in n or 'activity' in n and re.search(r'^\w+en is ',t):return 'noun-activity'
    if 'particle' in n or 'separable' in n:return 'separable'
    if re.search(r'\b(ons|onze)\b',t):return 'possessive'
    if 'adjective' in n and ('-e' in n or 'comparative' in n or 'superlative' in n):return 'adjective'
    if re.search(r'\b(niet|geen)\b',t):return 'negation'
    if 'past' in n or 'verleden' in n:return 'past'
    if 'inversion' in n or b['parts'][0]['label'] in ['time phrase','place phrase','time expression']:return 'inversion'
    if re.search(r'\b(naar|aan|van|voor|met|over|op)\b',t) and 'preposition' in n:return 'preposition'
    if re.search(r'\b(is|zijn|ben|bent|wordt|worden|lijkt)\b',t):return 'copula'
    return 'present'

cards=sum([read(n) for n in ['flashcards.json','flashcard-additions.json','flashcard-additions-2.json']],[])
notes=read('grammar-notes.json'); breakdowns=read('grammar-breakdowns.json'); result={}; review=[]
# Published family assignments are stable; richer teaching prose must not reclassify saved child IDs.
existing=read('dutch-variations.json') if (ROOT/'data'/'dutch-variations.json').exists() else {}
for c in cards:
    b=breakdowns[c['id']]; k=OVERRIDES.get(c['id']) or existing.get(c['id'],{}).get('pattern') or classify(c,b); group=BANK[k]
    indices=[i for i,p in enumerate(group['pairs']) if p[0].casefold() not in {c['dutch'].casefold(), c.get('variation','').casefold()}][:10]
    pairs=[group['pairs'][i] for i in indices]
    assert len(pairs)==10
    # Closed authored banks, rather than automatic conjugation of arbitrary source text.
    result[c['id']]={'pattern':k,'indices':indices}
    notes[c['id']]['examples']=[{'dutch':t,'english':e} for t,e in pairs]
    b['practiceFocus']=group['focus'];b['practiceGuide']=group['rule']
    review.append({'id':c['id'],'focus':k,'method':'authored shared grammar bank; sentence-specific breakdown retained','examples':10})
write('dutch-variations.json',result);write('grammar-notes.json',notes);write('grammar-breakdowns.json',breakdowns)
write('dutch-practice-bank.json',BANK)
(ROOT/'docs'/'DUTCH-VARIATION-COVERAGE.json').write_text(json.dumps(review,indent=2)+'\n')
print('Authored',len(BANK),'construction banks;',len(result),'families;',sum(len(f['indices']) for f in result.values()),'practice links.')
