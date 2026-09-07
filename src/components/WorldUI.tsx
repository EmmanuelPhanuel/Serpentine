import { LEVELS, nextLevelTargets, isColorUnlocked, skinPreview, SNAKE_COLORS, worldForLevel, type SnakeColor, type World } from "../game/worlds";

export function SnakeColorPicker({ value, highestLevel, onChange }: { value: SnakeColor; highestLevel: number; onChange: (color: SnakeColor) => void }) {
  const styles = Object.entries(SNAKE_COLORS) as [SnakeColor, typeof SNAKE_COLORS[SnakeColor]][];
  const count = styles.filter(([id]) => isColorUnlocked(id, highestLevel)).length;
  const next = styles.find(([id]) => !isColorUnlocked(id, highestLevel));
  return (
    <div>
      <div className="snake-preview" aria-hidden="true">
        {[0, 1, 2, 3, 4].map(i => <span key={i} style={{ background: i === 4 ? SNAKE_COLORS[value].head : skinPreview(value), width: 12 + i * 3, height: 12 + i * 3 }} />)}
        <span className="snake-preview-name">{SNAKE_COLORS[value].name}</span>
      </div>
      <p className="text-[10px] text-fern-300 mb-3" role="status">{count} / {styles.length} unlocked - Best level {highestLevel}</p>
      <div className="skin-grid" role="group" aria-label="Snake color">
        {styles.map(([id, color]) => {
          const available = isColorUnlocked(id, highestLevel);
          return <button key={id} type="button" className="skin-option" disabled={!available}
            aria-label={color.name + " snake" + (available ? "" : ", unlocks at level " + color.unlock)} aria-pressed={value === id}
            title={available ? color.name : "Reach level " + color.unlock + " to unlock " + color.name}
            onClick={() => { if (available) onChange(id); }}>
            <span className="skin-chip" style={{ background: skinPreview(id) }} aria-hidden="true">
              {value === id ? "✓" : !available ? <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M4 7V5a4 4 0 018 0v2h1v8H3V7zm2 0h4V5a2 2 0 00-4 0z" /></svg> : ""}
            </span>
            <strong className="skin-name">{color.name}</strong>
            <span className="skin-level">{available ? (value === id ? "EQUIPPED" : "UNLOCKED") : "LEVEL " + color.unlock}</span>
          </button>;
        })}
      </div>
      <p className="text-[10px] text-fern-300 mt-3">{next ? "Next: " + next[1].name + " at level " + next[1].unlock + "." : "Collection complete!"} Earned styles stay unlocked.</p>
    </div>
  );
}

export function LevelProgress({ level, score, length }: { level: number; score: number; length: number }) {
  const world = worldForLevel(level);
  const next = worldForLevel(level + 1);
  const target = nextLevelTargets(level);
  return (
    <div className="level-card">
      <div className="flex items-center gap-3">
        <span className="world-emblem" aria-hidden="true">{world.symbol}</span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[9px] tracking-[0.2em] text-fern-300">LEVEL {String(level).padStart(2, "0")} {level <= LEVELS.length ? " / 30" : " / ENDLESS"}</p>
          <p className="text-lg font-semibold text-leaf-200 leading-tight">{world.name}</p>
        </div>
      </div>
      <p className="text-[11px] text-fern-300 mt-2">Reach either target to enter {next.name}.</p>
      <div className="level-targets">
        {[{ name: "Score", value: score, goal: target.score, unit: "pts" }, { name: "Length", value: length, goal: target.length, unit: "segments" }].map(item => (
          <div key={item.name}>
            <div className="level-track" role="progressbar" aria-label={item.name + " target for level " + (level + 1)}
              aria-valuemin={0} aria-valuemax={item.goal} aria-valuenow={Math.min(item.value, item.goal)}>
              <span style={{ width: Math.min(100, item.value / item.goal * 100) + "%" }} />
            </div>
            <p className="text-[10px] text-fern-300">{item.name}: <strong className="text-leaf-200">{item.value} / {item.goal}</strong></p>
            <p className="text-[9px] text-fern-300">{Math.max(0, item.goal - item.value)} {item.unit} to go</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorldAtlas({ level }: { level: number }) {
  const expedition = Math.floor((level - 1) / LEVELS.length);
  return (
    <div>
      <p className="text-[10px] text-fern-300 mb-2">30 destinations. Reach the points OR length shown.</p>
      <ol className="world-atlas" aria-label="World journey" tabIndex={0} data-game-shortcuts="off">
        {LEVELS.map(stage => {
          const number = expedition * LEVELS.length + stage.number;
          const world = worldForLevel(number);
          const target = nextLevelTargets(number - 1);
          return <li key={number} aria-current={number === level ? "step" : undefined} className={number === level ? "current-world" : ""}>
            <span className="atlas-symbol" style={{ color: world.accent }} aria-hidden="true">{number < level ? "✓" : world.symbol}</span>
            <span className="flex-1 min-w-0"><span className="block text-xs font-semibold">{world.name}</span><span className="text-[9px] text-fern-300">Level {number} - {target.score} pts or length {target.length}</span></span>
            {number === level && <span className="text-[8px] tracking-widest text-leaf-300">HERE</span>}
          </li>;
        })}
      </ol>
    </div>
  );
}

export function WorldBackdrop({ world }: { world: World }) {
  return (
    <div className="world-backdrop" aria-hidden="true">
      <div className="world-orb" />
      <svg viewBox="0 0 1440 700" preserveAspectRatio="xMidYMax slice" className="world-landscape">
        {world.id === "desert" && <><path d="M0 410Q250 180 650 420T1440 350V700H0Z" /><path d="M0 580Q600 260 1440 560V700H0Z" className="terrain-near" /><path d="M1180 610V455m0 70h-30v-38m30 61h28v-47" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" /></>}
        {world.id === "snow" && <><path d="M0 600L240 210L490 540L730 120L1100 550L1300 260L1440 440V700H0Z" /><path d="M145 360L240 210L350 355L260 325L220 340Z M592 330L730 120L905 337L778 286L716 310L668 270Z" className="snow-caps" /></>}
        {world.id === "water" && <><path d="M0 410Q180 340 360 410T720 410T1080 410T1440 410V700H0Z" /><path d="M0 530Q180 460 360 530T720 530T1080 530T1440 530V700H0Z" className="terrain-near" /><path d="M120 660Q180 570 150 510M1280 700Q1200 620 1250 560" fill="none" stroke="currentColor" strokeWidth="16" /></>}
        {world.id === "volcano" && <><path d="M0 620L250 410L450 580L670 270L770 270L1050 600L1300 380L1440 590V700H0Z" /><path d="M670 270L700 335L680 410L730 490L710 630L755 700H830L770 600L792 480L732 386L760 300L770 270Z" className="lava-flow" /></>}
        {world.id === "garden" && <><path d="M0 520Q250 350 500 510T1000 490T1440 430V700H0Z" /><path d="M0 680L120 350L240 680M1000 700L1140 280L1280 700M1200 700L1340 360L1480 700" className="terrain-near" /></>}
        {world.id === "jungle" && <><path d="M0 470Q150 130 300 450T600 430T900 470T1200 420T1440 450V700H0Z" /><path d="M120 100Q230 400 130 700M1230 0Q1120 300 1240 700" fill="none" stroke="currentColor" strokeWidth="18" /></>}
        {world.id === "canyon" && <path d="M0 270H180V350H280V500H400V700H1000V510H1120V330H1260V210H1440V700H0Z" />}
        {world.id === "crystal" && <><path d="M40 700L160 280L250 490L350 700M1030 700L1180 170L1360 510L1440 700Z" /><path d="M160 280L185 700M1180 170L1220 700" fill="none" stroke="currentColor" strokeWidth="5" /></>}
        {world.id === "marsh" && <><path d="M0 570Q300 500 600 590T1200 580T1440 570V700H0Z" /><path d="M60 700L95 420M120 700L160 480M1300 700L1270 410M1380 700L1340 470" fill="none" stroke="currentColor" strokeWidth="7" /></>}
        {world.id === "cosmos" && <><ellipse cx="1130" cy="330" rx="230" ry="45" transform="rotate(-25 1130 330)" fill="none" stroke="currentColor" strokeWidth="9" /><circle cx="1130" cy="330" r="106" /><path d="M0 690L170 570L300 620L440 550L670 700L940 590L1190 650L1440 580V700H0Z" className="terrain-near" /></>}
      </svg>
    </div>
  );
}
