import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SNAKE_COLORS, isColorUnlocked, unlockedColor, skinPreview, segmentColor } from '../src/game/worlds.ts';
import { highestLevelFromSaves, KEYS, writePreference, readPreference } from '../src/preferences.ts';

const zero={chill:0,classic:0,turbo:0};
test('all 18 skins unlock exactly at their level, through level 30', () => {
  assert.equal(Object.keys(SNAKE_COLORS).length,18);
  for (const [id,skin] of Object.entries(SNAKE_COLORS)) {
    assert.equal(isColorUnlocked(id,skin.unlock-1),false);
    assert.equal(isColorUnlocked(id,skin.unlock),true);
    assert.equal(isColorUnlocked(id,skin.unlock+10),true);
    assert.equal(unlockedColor(id,skin.unlock),id);
    if(id!=='lime') assert.equal(unlockedColor(id,skin.unlock-1),'lime');
  }
  assert.equal(SNAKE_COLORS.silver.unlock,30);
});

test('stored progress survives a new run and difficulty switch', () => {
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  const memory=new Map();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)}});
  try {
    writePreference(KEYS.highestLevel,'18');writePreference(KEYS.snakeColor,'tangerine');
    writePreference(KEYS.difficulty,'turbo');
    const highest=highestLevelFromSaves(readPreference(KEYS.highestLevel),zero);
    assert.equal(highest,18);
    assert.equal(unlockedColor(readPreference(KEYS.snakeColor),highest),'tangerine');
  } finally {
    if(descriptor) Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage;
  }
});

test('previous score-based and length-based achievements migrate into unlocks', () => {
  assert.equal(highestLevelFromSaves(null,{...zero,chill:60}),2);
  assert.equal(highestLevelFromSaves(null,{...zero,classic:100}),2);
  assert.equal(highestLevelFromSaves(null,{...zero,turbo:120}),2);
  assert.equal(highestLevelFromSaves('20',{...zero,classic:100}),20);
  for (const raw of [null,'nope','-1','1.5','Infinity']) assert.equal(highestLevelFromSaves(raw,zero),1);
});

test('each skin preview is distinct and rainbow segments actually vary', () => {
  assert.equal(new Set(Object.keys(SNAKE_COLORS).map(skinPreview)).size,18);
  assert.equal(new Set(Array.from({length:6},(_,i)=>segmentColor('orchid',i+1))).size,6);
  assert.equal(segmentColor('orchid',0),null);
  assert.equal(segmentColor('lime',2),null);
  assert.equal(SNAKE_COLORS.tangerine.pattern,'bands');
  assert.equal(SNAKE_COLORS.pearl.pattern,'spots');
  assert.notEqual(SNAKE_COLORS.aqua.head,SNAKE_COLORS.sky.head);
});
