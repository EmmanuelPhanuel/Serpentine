import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { SNAKE_COLORS } from '../src/game/worlds.ts';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let server;
let ui;
let worlds;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  ui = await server.ssrLoadModule('/src/components/ui.tsx');
  worlds = await server.ssrLoadModule('/src/components/WorldUI.tsx');
});

test('all color swatches activate and expose the selected color', () => {
  const selected=[];
  const element=worlds.SnakeColorPicker({value:'coral',highestLevel:30,onChange:color=>selected.push(color)});
  const controls=buttons(element);
  assert.equal(controls.length,18);
  for(const button of controls) button.props.onClick();
  assert.deepEqual(selected,Object.keys(SNAKE_COLORS));
  assert.equal(controls.filter(button=>button.props['aria-pressed']).length,1);
  assert.equal(controls.find(button=>button.props['aria-pressed']).props['aria-label'],'Crimson snake');
});

test('level progress shows the new world, remaining points and next destination', () => {
  const html=renderToStaticMarkup(worlds.LevelProgress({level:2,score:120,length:8}));
  assert.match(html,/Amber Dunes/);assert.match(html,/Frostpeak/);
  assert.match(html,/80 pts to go/);assert.match(html,/aria-valuenow="120"/);
  assert.match(html,/200/); assert.match(html,/Length/); assert.match(html,/7 segments to go/);
  const atlas=renderToStaticMarkup(worlds.WorldAtlas({level:8}));
  assert.match(atlas,/Level 8/);assert.match(atlas,/700 pts/);assert.match(atlas,/aria-current="step"/);
});

test('saved snake color is selected on page load', async () => {
  const {default:App}=await server.ssrLoadModule('/src/App.tsx');
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>key==='serpentine.snake-color.v1'?'aqua':key==='serpentine.highest-level.v1'?'2':null}});
  try {
    const html=renderToStaticMarkup(createElement(App));
    assert.match(html,/aria-label="Electric Blue snake" aria-pressed="true"/);
    assert.match(html,/data-biome="garden"/);
  } finally {
    if(descriptor) Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage;
  }
});
after(async () => { await server?.close(); });

function buttons(element) {
  if (!element || typeof element !== 'object') return [];
  const children = [element.props?.children].flat(Infinity);
  return [...(element.type === 'button' ? [element] : []), ...children.flatMap(buttons)];
}

test('D-pad buttons expose click activation for keyboard and assistive input', () => {
  const dirs=[]; let pauses=0;
  const element=ui.DPad({onDir: d=>dirs.push(d), onCenter:()=>pauses++, centerIcon:null, centerLabel:'Pause'});
  for(const button of buttons(element)) button.props.onClick();
  assert.deepEqual(dirs,[{x:0,y:-1},{x:-1,y:0},{x:1,y:0},{x:0,y:1}]);
  assert.equal(pauses,1);
});

test('both difficulty layouts expose selection, disabled state and reset warning', () => {
  for(const compact of [false,true]) {
    const element=ui.DifficultyPanel({value:'turbo',bests:{chill:0,classic:20,turbo:60},onChange:()=>{},compact,disabled:true});
    const controls=buttons(element);
    assert.equal(controls.length,3);
    assert.ok(controls.every(button=>button.props.disabled));
    assert.deepEqual(controls.map(button=>button.props['aria-pressed']),[false,false,true]);
    assert.match(renderToStaticMarkup(element),/Switching pace resets the run/);
  }
});

test('saved difficulty initializes the full page HUD at the correct speed', async () => {
  const {default:App}=await server.ssrLoadModule('/src/App.tsx');
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  try {
    for(const [difficulty,speed] of [['chill','6.1/s'],['turbo','11.9/s']]) {
      Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>key==='serpentine.difficulty.v1' ? difficulty : null}});
      const html=renderToStaticMarkup(createElement(App));
      assert.ok(html.includes(speed));
      assert.match(html,/aria-live="polite"/);
      assert.match(html,/START RUN/);
    }
  } finally {
    if(descriptor) Object.defineProperty(globalThis,'localStorage',descriptor);
    else delete globalThis.localStorage;
  }
});


test('D-pad responds immediately to pointer presses without double-activating clicks', () => {
  let pauses=0;const dirs=[];
  const element=ui.DPad({onDir:d=>dirs.push(d),onCenter:()=>pauses++,centerIcon:null,centerLabel:'Pause'});
  const controls=buttons(element);
  for(const button of controls) {
    button.props.onPointerDown({button:0,preventDefault(){}});
    button.props.onClick({detail:1});
    button.props.onPointerDown({button:2,preventDefault(){throw new Error('secondary click');}});
  }
  assert.equal(dirs.length,4);assert.equal(pauses,1);
  controls[0].props.onClick({detail:0});assert.equal(dirs.length,5);
});


test('locked styles show their level and reject selection until earned', () => {
  const chosen=[];
  let controls=buttons(worlds.SnakeColorPicker({value:'lime',highestLevel:1,onChange:color=>chosen.push(color)}));
  assert.equal(controls.filter(button=>!button.props.disabled).length,1);
  for(const button of controls) button.props.onClick();
  assert.deepEqual(chosen,['lime']);
  assert.match(renderToStaticMarkup(controls[1]),/unlocks at level 2/);
  controls=buttons(worlds.SnakeColorPicker({value:'lime',highestLevel:2,onChange:color=>chosen.push(color)}));
  assert.equal(controls[1].props.disabled,false);controls[1].props.onClick();assert.equal(chosen.at(-1),'aqua');
  assert.equal(controls.filter(button=>!button.props.disabled).length,2);
});

test('a saved locked selection falls back to the starter snake', async () => {
  const {default:App}=await server.ssrLoadModule('/src/App.tsx');
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>key==='serpentine.snake-color.v1'?'silver':null}});
  try {
    const html=renderToStaticMarkup(createElement(App));
    assert.match(html,/aria-label="Classic Lime snake" aria-pressed="true"/);
    assert.match(html,/Chrome snake, unlocks at level 30/);
  } finally {
    if(descriptor) Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage;
  }
});
