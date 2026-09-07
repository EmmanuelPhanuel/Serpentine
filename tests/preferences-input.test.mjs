import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBests, parseDifficulty, readPreference, writePreference } from '../src/preferences.ts';
import { shouldHandleShortcut, handleGameKey, swipeDirection } from '../src/game/input.ts';

test('saved scores accept only finite, nonnegative safe integers', () => {
  assert.deepEqual(parseBests('{"chill":10,"classic":40,"turbo":90}'),{chill:10,classic:40,turbo:90});
  for (const raw of [null,'bad JSON','null','[]','{"chill":-1,"classic":"100","turbo":1e999}','{"chill":1.5,"classic":true,"turbo":9007199254740992}']) {
    assert.deepEqual(parseBests(raw),{chill:0,classic:0,turbo:0});
  }
});

test('invalid saved difficulty falls back to classic', () => {
  for(const d of ['chill','classic','turbo']) assert.equal(parseDifficulty(d),d);
  for(const d of [null,'','hard']) assert.equal(parseDifficulty(d),'classic');
});

test('unavailable storage does not prevent playing', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('blocked');}});
  try { assert.equal(readPreference('test'),null); assert.doesNotThrow(()=>writePreference('test','value')); }
  finally { if(descriptor) Object.defineProperty(globalThis,'localStorage',descriptor); else delete globalThis.localStorage; }
});

const key = {key:' ',repeat:false,ctrlKey:false,altKey:false,metaKey:false,isComposing:false,defaultPrevented:false,target:null};

test('Arrow and WASD keys steer, including uppercase; action keys operate once', () => {
  const dirs=[];let pauses=0,restarts=0;
  const game={status:'ready',steer:d=>dirs.push(d),togglePause:()=>pauses++,restart:()=>restarts++};
  for(const pressed of ['ArrowUp','w','W','ArrowDown','s','S','ArrowLeft','a','A','ArrowRight','d','D']) {
    let prevented=false;handleGameKey({...key,key:pressed,preventDefault(){prevented=true;}},game);assert.ok(prevented);
  }
  assert.deepEqual(dirs,[...[{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}].flatMap(d=>[d,d,d])]);
  for(const pressed of [' ','p','P']) handleGameKey({...key,key:pressed,preventDefault(){}},game);
  for(const pressed of ['r','R','Enter']) handleGameKey({...key,key:pressed,preventDefault(){}},game);
  assert.equal(pauses,3);assert.equal(restarts,3);
});

test('held controls prevent scrolling without repeating gameplay actions', () => {
  const game={status:'running',steer(){throw new Error('repeat');},togglePause(){throw new Error('repeat');},restart(){throw new Error('repeat');}};
  for(const pressed of [' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']) {
    let prevented=false;handleGameKey({...key,key:pressed,repeat:true,preventDefault(){prevented=true;}},game);assert.ok(prevented);
  }
  let prevented=false;
  handleGameKey({...key,key:'ArrowDown',repeat:true,target:{closest:()=>({})},preventDefault(){prevented=true;}},game);
  assert.equal(prevented,false);
});

test('swipe sensitivity scales for small boards and ignores small finger movements', () => {
  assert.equal(swipeDirection(5,5,300),null);
  assert.deepEqual(swipeDirection(14,0,200),{x:1,y:0});
  assert.equal(swipeDirection(14,0,600),null);
  assert.deepEqual(swipeDirection(-30,5,600),{x:-1,y:0});
  assert.deepEqual(swipeDirection(2,-30,320),{x:0,y:-1});
  assert.deepEqual(swipeDirection(2,30,320),{x:0,y:1});
});
test('held keys, browser shortcuts and composition cannot trigger game actions', () => {
  assert.equal(shouldHandleShortcut(key),true);
  for(const flag of ['repeat','ctrlKey','altKey','metaKey','isComposing','defaultPrevented']) assert.equal(shouldHandleShortcut({...key,[flag]:true}),false);
});

test('editable fields retain shortcuts and buttons retain Space/Enter activation', () => {
  const input = {closest:()=>({})};
  assert.equal(shouldHandleShortcut({...key,key:'r',target:input}),false);
  const button = {closest:selector=>selector.startsWith('button') ? {} : null};
  for(const pressed of [' ','Enter']) assert.equal(shouldHandleShortcut({...key,key:pressed,target:button}),false);
  assert.equal(shouldHandleShortcut({...key,key:'ArrowUp',target:button}),true);
});
