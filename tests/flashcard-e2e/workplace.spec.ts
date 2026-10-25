import { test, expect, type Page } from '@playwright/test';
import { createSessionFromIds } from '../../lib/sessions/engine';
import type { Session } from '../../lib/sessions/types';
import { cardFor } from '../../lib/content/cards';
import { communicationFor, modelFor } from '../../lib/practice/communication';
import { asGuest, guestSessionsKey, savedGuestSessions, switchMode, solveQuiz, currentQuizModel, rateSpeaking } from './helpers';

async function seed(page:Page,mode='quiz'){
  await asGuest(page);
  const s=createSessionFromIds({id:'workplace-browser',name:'Workplace review',cardIds:['career-office-007'],collection:'workplace',topic:'office',startingLevel:'difficult'});
  await page.addInitScript(([key,s])=>{
    if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({v:1,sessions:{[s.id]:s},pendingCreate:[],initial:{},pendingActions:{},pendingDelete:[],refused:{},lastOpened:{id:s.id,mode:'quiz'}}));
  },[guestSessionsKey,s] as [string,Session]);
  await page.goto(`/flashcards?session=${s.id}&mode=${mode}`);
}
async function saved(page:Page){return (await savedGuestSessions(page))[0] as unknown as Session;}
async function voices(page:Page,dutch=true){
  await page.addInitScript((dutch)=>{
    const w=window as unknown as {__spoken:{text:string;lang:string;rate:number}[];__cancels:number;SpeechSynthesisUtterance:unknown};
    w.__spoken=[];w.__cancels=0;
    class U{voice:unknown=null;lang='';rate=1;constructor(public text:string){}}
    w.SpeechSynthesisUtterance=U;
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{
      getVoices:()=>[{name:'English',lang:'en-US'},...(dutch?[{name:'Dutch Netherlands',lang:'nl-NL'},{name:'Belgian Dutch',lang:'nl-BE'}]:[])],
      speak:(u:U)=>w.__spoken.push({text:u.text,lang:u.lang,rate:u.rate}),cancel:()=>w.__cancels++,addEventListener:()=>{},removeEventListener:()=>{},
    }});
  },dutch);
}

test('collection and area selection use only the chosen eligible workplace pool',async({page})=>{
  await asGuest(page);await page.goto('/flashcards');await page.getByRole('button',{name:'Create session',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Create a session'});
  await dialog.getByLabel('Collection').selectOption('workplace');
  await dialog.getByLabel('Workplace area').selectOption('incidents');
  await expect(dialog.getByRole('radio',{name:/Difficult/})).toContainText('60 cards');
  await dialog.getByRole('button',{name:'Other',exact:true}).click();await dialog.getByLabel(/Number of cards/).fill('61');
  await expect(dialog.getByRole('button',{name:'Create session',exact:true})).toBeDisabled();
  await expect(dialog.getByTestId('level-unavailable')).toContainText('60');
  await dialog.getByLabel(/Number of cards/).fill('3');await dialog.getByLabel('Session name').fill('Incident practice');
  await dialog.getByRole('button',{name:'Create session',exact:true}).click();await expect(page.getByTestId('session-name')).toHaveText('Incident practice');
  const s=await saved(page);expect(s.collection).toBe('workplace');expect(s.cardIds).toHaveLength(3);expect(s.cardIds.every(id=>id.startsWith('career-incidents-'))).toBe(true);
  await expect(page.getByText('Incidents, escalation and handovers',{exact:true}).first()).toBeVisible();
  for(const mode of ['speaking','quiz','study'] as const){await switchMode(page,mode);await expect(page.locator('article')).toBeVisible();expect((await saved(page)).cardIds).toEqual(s.cardIds);await expect(page.locator('article img')).toHaveCount(0);}
});

for(const width of [390,1280])test(`pictureless workplace rotation, refresh, history and Dutch speech at ${width}px`,async({page},testInfo)=>{
  await page.setViewportSize({width,height:900});await voices(page);
  const errors:string[]=[];const assets:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(/\/(illustrations\/cards|audio\/flashcards)\//.test(r.url()))assets.push(r.url());});
  await seed(page);
  await expect(page.getByTestId('session-name')).toBeVisible();
  const choices=communicationFor(cardFor('nl','career-office-007')!).answers;const seen:string[]=[];
  for(let i=0;i<2;i++){
    await expect(page.getByTestId('quiz-situation')).toBeVisible();await expect(page.getByTestId('quiz-english')).toHaveCount(0);
    await expect(page.getByRole('button',{name:'Listen',exact:true})).toHaveCount(0);
    const current=await currentQuizModel(page);seen.push((await saved(page)).quiz.current!.answerId!);
    if(i===0){await page.locator('[data-token]').first().click();const before=await saved(page);await page.reload();await expect(page.locator('[data-token]').first()).toBeVisible();expect((await saved(page)).quiz.current).toEqual(before.quiz.current);await page.getByRole('button',{name:'Clear',exact:true}).click();}
    await solveQuiz(page,current.dutch);await page.getByRole('button',{name:'Check',exact:true}).click();
    await expect(page.getByTestId('quiz-model-answer')).toHaveText(current.dutch);
    await expect(page.getByTestId('answer-explanation')).toHaveText(modelFor(cardFor('nl',current.id)!,seen[i])!.explanation);
    await page.getByRole('button',{name:'Listen',exact:true}).click();
    await expect.poll(()=>page.evaluate(()=>((window as unknown as {__spoken:unknown[]}).__spoken).length)).toBe(1);
    const spoken=await page.evaluate(()=>(window as unknown as {__spoken:{text:string;lang:string;rate:number}[]}).__spoken);
    expect(spoken[0]).toEqual({text:current.dutch,lang:'nl-BE',rate:0.95});
    await page.getByRole('button',{name:'Listen slowly',exact:true}).click();
    await expect.poll(()=>page.evaluate(()=>(window as unknown as {__spoken:unknown[]}).__spoken.length)).toBe(2);
    expect((await page.evaluate(()=>(window as unknown as {__spoken:{rate:number}[]}).__spoken))[1].rate).toBe(0.75);
    const cancels=await page.evaluate(()=>(window as unknown as {__cancels:number}).__cancels);
    await page.getByRole('button',{name:'Stop audio',exact:true}).click();
    await expect.poll(()=>page.evaluate(()=>(window as unknown as {__cancels:number}).__cancels)).toBeGreaterThan(cancels);
    await page.evaluate(()=>(window as unknown as {__spoken:unknown[]}).__spoken=[]);
    await expect(page.locator('article img')).toHaveCount(0);await expect(page.getByText('Illustration awaiting generation')).toHaveCount(0);
    await expect(page.getByTestId('quiz-points')).toHaveText(String((i+1)*10));
    await page.reload();await expect(page.getByTestId('quiz-points')).toHaveText(String((i+1)*10));
    if(i===1){
      await expect(page.locator('article')).toHaveCSS('opacity','1');
      await page.screenshot({path:testInfo.outputPath(`workplace-quiz-${width}.png`),fullPage:true});
      await page.locator('article').evaluate(el=>el.scrollIntoView({block:'start'}));
      await page.screenshot({path:testInfo.outputPath(`workplace-quiz-focus-${width}.png`)});
    }
    await page.getByRole('button',{name:'Continue',exact:true}).click();
  }
  expect(new Set(seen).size).toBe(choices.length);
  const before=await saved(page);await page.getByRole('button',{name:'Previous card',exact:false}).click();
  const history=page.getByRole('dialog',{name:'Previous card'});await expect(history).toContainText(modelFor(cardFor('nl','career-office-007')!,seen[1])!.text);
  await history.getByRole('button',{name:'Return to current card'}).click();expect((await saved(page)).events).toEqual(before.events);expect((await saved(page)).quiz.points).toBe(20);
  await switchMode(page,'speaking');await expect(page.getByText('How do you say it?',{exact:true})).toBeVisible();
  await rateSpeaking(page,'Mastered');expect((await saved(page)).variations['career-office-007'].unlocked).toBe(2);
  const child=(await saved(page)).speaking.current!.cardId;expect(child).toContain('~v');await expect(page.locator('article img')).toHaveCount(0);
  await rateSpeaking(page,'Easy');const progressed=await saved(page);expect(progressed.variations['career-office-007'].unlocked).toBe(3);expect(progressed.childProgress[child].level).toBe('easy');
  await page.reload();await expect(page.locator('article')).toBeVisible();expect((await saved(page)).childProgress).toEqual(progressed.childProgress);
  await page.getByRole('checkbox',{name:'Practise variations of this sentence'}).uncheck();expect((await saved(page)).childProgress[child].level).toBe('easy');
  await switchMode(page,'study');await expect(page.locator('article')).toContainText('Vanaf maandag');
  await expect(page.locator('article img')).toHaveCount(0);await expect(page.locator('article')).toHaveCSS('opacity','1');await page.screenshot({path:testInfo.outputPath(`workplace-study-${width}.png`),fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);expect(assets).toEqual([]);
});

test('no Dutch voice leaves reading usable and never substitutes English speech',async({page})=>{
  await voices(page,false);await seed(page,'study');await page.getByRole('button',{name:'Listen',exact:true}).click();
  await expect(page.locator('article').getByRole('status')).toContainText('No Dutch voice is installed');
  expect(await page.evaluate(()=>(window as unknown as {__spoken:unknown[]}).__spoken)).toEqual([]);
  await expect(page.locator('article')).toContainText('Vanaf maandag');await page.getByRole('button',{name:'Next sentence',exact:true}).click();await expect(page.locator('article')).toBeVisible();
});

test('workplace sentence links have grammar and vocabulary and truthfully decline French',async({page})=>{
  await asGuest(page);await page.goto('/sentences/career-changes-001');
  await expect(page.getByRole('heading',{name:'Sentence example'})).toBeVisible();
  await expect(page.locator('article')).toContainText('Ik heb alleen leesrechten voor deze map.');
  await expect(page.locator('article img')).toHaveCount(0);
  await expect(page.getByText('Spoken by your device’s Dutch voice.',{exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'hebben',exact:true})).toBeVisible();
  await page.getByRole('link',{name:'hebben',exact:true}).click();await expect(page.getByRole('heading',{name:'Vocabulary',exact:true})).toBeVisible();
  await page.goto('/sentences/career-changes-001?lang=fr');await expect(page.getByTestId('sentence-unavailable')).toContainText('not available in French');
  await page.goto('/flashcards?lang=fr');await page.getByRole('button',{name:'Create session',exact:true}).click();
  await expect(page.getByRole('dialog').getByLabel('Collection')).toHaveCount(0);
  await expect(page.getByRole('dialog').getByRole('option',{name:'All places'})).toHaveCount(1);
});
