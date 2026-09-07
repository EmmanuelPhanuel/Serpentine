import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SnakeEngine, DIFFICULTIES } from '../src/game/engine.ts';
import { renderGame } from '../src/game/renderer.ts';
import { LEVELS, WORLDS, SNAKE_COLORS, levelForProgress, nextLevelTargets, levelForScore, worldForLevel, parseSnakeColor, worldStyle } from '../src/game/worlds.ts';

test('30 named levels span ten environments before endless expeditions', () => {
  for (const [score,level] of [[0,1],[99,1],[100,2],[199,2],[200,3],[500,6],[600,7],[13140,132]]) assert.equal(levelForScore(score),level);
  assert.deepEqual(WORLDS.map((_,i)=>worldForLevel(i+1).id),['garden','desert','snow','water','volcano','cosmos','jungle','canyon','crystal','marsh']);
  assert.equal(LEVELS.length,30); assert.equal(new Set(LEVELS.map(s=>s.world.name)).size,30);
  assert.equal(worldForLevel(31).id,'garden');
  assert.equal(worldForLevel(32).id,'desert');
  assert.match(worldForLevel(31).name,/Expedition 2/);
  assert.notEqual(worldForLevel(1).sky,worldForLevel(11).sky);
});

for (const difficulty of Object.keys(DIFFICULTIES)) {
  test(`${difficulty}: crossing 100 points advances without resetting the snake`, () => {
    const e=new SnakeEngine(difficulty,'violet'); const events=[]; const hud=[];
    e.onEvent=event=>events.push(event); e.onHud=h=>hud.push(h);
    const points=10*DIFFICULTIES[difficulty].mult;
    // Scores are real multiples of each difficulty's apple value.
    e.score=Math.floor(99/points)*points;
    e.food={x:11,y:10}; e.start(); e.update(e.interval);
    assert.equal(e.level,2); assert.equal(e.status,'running');
    assert.equal(e.snake.length,4); assert.equal(e.snakeColor,'violet');
    assert.equal(hud.at(-1).level,2);
    assert.deepEqual(events,['start','eat','level']);
    e.food={x:12,y:10};e.update(e.interval);
    assert.equal(events.filter(event=>event==='level').length,1);
    e.pause();e.update(3000);assert.equal(e.level,2);
    e.restart();assert.equal(e.level,1);assert.equal(e.score,0);assert.equal(e.snakeColor,'violet');
    e.score=400;e.setDifficulty('chill');assert.equal(e.level,1);
  });
}

test('changing snake color preserves progress, position and queued turns', () => {
  const e=new SnakeEngine('classic');e.score=200;e.start();e.setDirection({x:0,y:-1});
  const before=structuredClone(e.snake);e.snakeColor='aqua';
  assert.deepEqual(e.snake,before);assert.equal(e.level,3);assert.equal(e.status,'running');assert.equal(e.queue.length,1);
});

test('snake colors validate saved values without accepting object properties', () => {
  for(const color of Object.keys(SNAKE_COLORS)) assert.equal(parseSnakeColor(color),color);
  for(const color of [null,'','red','__proto__','constructor']) assert.equal(parseSnakeColor(color),'lime');
});

test('all 30 levels and 18 snake colors render, including reduced motion', () => {
  const signature=[];
  for (const [i,stage] of LEVELS.entries()) {
    const world=stage.world;
    const fills=[];
    const ctx=new Proxy({}, {
      get:(_target,key)=>key==='createRadialGradient' ? ()=>({addColorStop(){}}) : ()=>{},
      set:(_target,key,value)=>{if(key==='fillStyle')fills.push(value);return true;},
    });
    for (const [color,palette] of Object.entries(SNAKE_COLORS)) for (const reducedMotion of [false,true]) {
      const e=new SnakeEngine('classic',color);e.score=i*100;e.reducedMotion=reducedMotion;
      renderGame(e,ctx,400,1000);
      const n=parseInt(palette.head.slice(1),16);
      assert.ok(fills.includes(`rgb(${n>>16},${(n>>8)&255},${n&255})`));
    }
    assert.ok(fills.includes(world.board));
    assert.equal(worldStyle(world)['--world-sky'],world.sky);
    signature.push(world.board);
  }
  assert.equal(new Set(signature).size,30);
});

test('all snake colors contrast with every board', () => {
  const luminance=hex=>{
    const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(n=>n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4);
    return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
  };
  for(const {world} of LEVELS) for(const palette of Object.values(SNAKE_COLORS)) {
    for (const part of ['head','tail']) assert.ok((luminance(palette[part])+0.05)/(luminance(world.board)+0.05)>=3,`${palette.name} ${part} in ${world.name}`);
  }
});


test('either score or length unlocks the next level, with exact boundaries', () => {
  assert.equal(levelForProgress(0,3),1);
  assert.equal(levelForProgress(99,8),1);
  assert.equal(levelForProgress(100,3),2);
  assert.equal(levelForProgress(0,9),2);
  assert.equal(levelForProgress(199,14),2);
  assert.equal(levelForProgress(200,3),3);
  assert.equal(levelForProgress(0,15),3);
  assert.deepEqual(nextLevelTargets(1),{score:100,length:9});
  assert.deepEqual(nextLevelTargets(29),{score:2900,length:177});
});

test('eating at the length threshold emits one level event even below the score target', () => {
  const e=new SnakeEngine('chill');e.snake=Array.from({length:8},(_,i)=>({x:10-i,y:10}));
  e.score=50;e.food={x:11,y:10};const events=[];e.onEvent=event=>events.push(event);
  e.start();e.update(e.interval);
  assert.equal(e.score,60);assert.equal(e.snake.length,9);assert.equal(e.level,2);
  assert.deepEqual(events,['start','eat','level']);
  e.food={x:12,y:10};e.update(e.interval);assert.equal(events.filter(x=>x==='level').length,1);
});

test('score and length crossing together do not emit duplicate level-ups', () => {
  const e=new SnakeEngine('classic');e.snake=Array.from({length:8},(_,i)=>({x:10-i,y:10}));
  e.score=80;e.food={x:11,y:10};const events=[];e.onEvent=event=>events.push(event);
  e.start();e.update(e.interval);assert.equal(e.level,2);assert.equal(events.filter(x=>x==='level').length,1);
});
