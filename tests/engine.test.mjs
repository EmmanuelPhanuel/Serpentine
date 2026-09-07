import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SnakeEngine, DIFFICULTIES, GRID } from '../src/game/engine.ts';
import { renderGame } from '../src/game/renderer.ts';

for (const difficulty of Object.keys(DIFFICULTIES)) {
  test(`${difficulty}: initial HUD, eating, score, growth and speed cap`, () => {
    const engine = new SnakeEngine(difficulty);
    const cfg = DIFFICULTIES[difficulty];
    assert.deepEqual(engine.getHud(), { status: 'ready', level: 1, score: 0, apples: 0, length: 3, tps: +(1000 / cfg.interval).toFixed(1) });
    engine.food = { x: 11, y: 10 };
    engine.start();
    engine.update(cfg.interval - 1);
    assert.equal(engine.snake[0].x, 10);
    engine.update(1);
    assert.equal(engine.score, 10 * cfg.mult);
    assert.equal(engine.apples, 1);
    assert.equal(engine.snake.length, 4);
    assert.equal(engine.interval, cfg.interval - cfg.ramp);
    engine.apples = 100;
    engine.food = { x: 12, y: 10 };
    engine.update(engine.interval);
    assert.equal(engine.interval, cfg.min);
    assert.ok(!engine.snake.some(s => s.x === engine.food.x && s.y === engine.food.y));
  });
}

test('rejects reversals and invalid directions; buffers at most three turns', () => {
  const e = new SnakeEngine('classic');
  for (const dir of [{x:-1,y:0}, {x:1,y:0}, {x:0,y:0}, {x:0.5,y:0.5}, {x:2,y:0}]) e.setDirection(dir);
  assert.equal(e.queue.length, 0);
  for (const dir of [{x:0,y:-1}, {x:-1,y:0}, {x:0,y:1}, {x:1,y:0}]) e.setDirection(dir);
  assert.equal(e.queue.length, 3);
  e.food = {x:20,y:20};
  e.start();
  e.update(e.interval); assert.deepEqual(e.snake[0], {x:10,y:9});
  e.update(e.interval); assert.deepEqual(e.snake[0], {x:9,y:9});
  e.update(e.interval); assert.deepEqual(e.snake[0], {x:9,y:10});
});

test('pause freezes movement and accumulated time; resume continues', () => {
  const e = new SnakeEngine('classic'); e.start(); e.update(50); e.pause();
  const before = structuredClone(e.snake);
  e.update(1000);
  assert.deepEqual(e.snake, before); assert.equal(e.acc, 50);
  e.resume(); e.update(e.interval - 50);
  assert.equal(e.snake[0].x, 11);
});

test('wall and body collisions end the run', () => {
  for (const snake of [
    [{x:20,y:0},{x:19,y:0},{x:18,y:0}],
    [{x:2,y:2},{x:3,y:2},{x:3,y:3},{x:2,y:3}],
  ]) {
    const e = new SnakeEngine('classic'); e.snake = snake; e.food = {x:10,y:10};
    e.start(); e.update(e.interval); assert.equal(e.status, 'over');
    const before = structuredClone(e.snake); e.update(1000); assert.deepEqual(e.snake, before);
  }
});

test('moving into the departing tail is allowed', () => {
  const e = new SnakeEngine('classic');
  e.snake = [{x:2,y:2},{x:2,y:3},{x:1,y:3},{x:1,y:2}]; e.dir = {x:-1,y:0}; e.food = {x:10,y:10};
  e.start(); e.update(e.interval);
  assert.equal(e.status, 'running'); assert.deepEqual(e.snake[0], {x:1,y:2});
});

function nearlyFullBoard() {
  const e = new SnakeEngine('classic'); e.snake = [];
  // One continuous serpentine path, with only (0, 0) left free.
  for (let y=0; y<GRID; y++) for (let i=0; i<GRID; i++) {
    const x = y % 2 ? GRID-1-i : i;
    if (x || y) e.snake.push({x,y});
  }
  e.prev = structuredClone(e.snake); e.dir = {x:-1,y:0}; e.food = {x:0,y:0};
  return e;
}

test('filling all 441 cells wins, clears food, and stops movement', () => {
  const e = nearlyFullBoard(); const events=[]; const hud=[];
  e.onEvent = event => events.push(event); e.onHud = h => hud.push(h);
  e.start(); e.update(e.interval);
  assert.equal(e.status, 'won'); assert.equal(e.food, null); assert.equal(e.snake.length, 441);
  assert.deepEqual(events, ['start','eat','win']); assert.equal(hud.at(-1).status, 'won');
  const before = structuredClone(e.snake); e.update(1000); assert.deepEqual(e.snake, before);
  e.steer({x:0,y:1}); assert.equal(e.queue.length, 0);
  e.start(); assert.equal(e.status, 'running'); assert.equal(e.snake.length, 3); assert.equal(e.score, 0);
});

test('ordinary movement does not emit unchanged HUD snapshots', () => {
  const e = new SnakeEngine('classic'); const hud=[]; e.onHud = h => hud.push(h); e.food = {x:20,y:20};
  e.start(); for (let i=0;i<5;i++) e.update(e.interval);
  assert.equal(hud.length, 1);
  e.food={x:16,y:10}; e.update(e.interval); assert.equal(hud.length, 2);
  e.pause(); assert.equal(hud.at(-1).status, 'paused');
  e.resume(); assert.equal(hud.at(-1).status, 'running');
});

test('restart and difficulty changes reset the run and announce reset', () => {
  const e = new SnakeEngine('classic'); const events=[]; e.onEvent=event=>events.push(event);
  e.food={x:11,y:10}; e.start(); e.update(e.interval); e.pause(); e.setDirection({x:0,y:1});
  e.setDifficulty('turbo');
  assert.equal(e.status,'ready'); assert.equal(e.score,0); assert.equal(e.queue.length,0);
  assert.equal(e.interval,84); assert.equal(e.particles.length,0); assert.equal(events.at(-1),'reset');
  e.restart(); assert.deepEqual(events.slice(-2),['reset','start']); assert.equal(e.status,'running');
});

test('reduced motion suppresses particles and floating score effects', () => {
  const e = new SnakeEngine('classic'); e.reducedMotion=true; e.food={x:11,y:10};
  e.start(); e.update(e.interval);
  assert.equal(e.particles.length,0); assert.equal(e.floaters.length,0);
});

test('renderer handles ready, running, paused, over and won snapshots', () => {
  const gradient={addColorStop() {}};
  const ctx = new Proxy({}, {get: (_target,key) => key === 'createRadialGradient' ? () => gradient : () => {}, set: () => true});
  for (const status of ['ready','running','paused','over','won']) {
    const e = new SnakeEngine('classic'); e.status=status; if(status==='won') e.food=null;
    assert.doesNotThrow(() => renderGame(e,ctx,320,1000));
  }
});
