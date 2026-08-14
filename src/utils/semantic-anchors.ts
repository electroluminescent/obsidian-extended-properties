/**
 * The words that come with the plugin, and the colours they mean.
 *
 * Enough English that "fire", "poison", "gold" and "calm" colour themselves on
 * a fresh install, without carrying a dictionary in the bundle: colour names
 * first, then the words that pull hardest towards a colour - materials,
 * elements, weather, states, feelings. Anything wider comes from the optional
 * table (see `scripts/build-semantic.mjs`), and anything at all can be pinned
 * by hand in the palette's own word list.
 *
 * Written as one string and parsed on first use: a few hundred entries cost
 * nothing to ship this way and nothing to load until something asks.
 */

/** `word:rrggbb` pairs, comma-separated. */
const ANCHORS =
  // colours
  "red:e02020,crimson:c81e3a,scarlet:e03a2f,maroon:7b1b26,ruby:c41e4a,cherry:d42a4a," +
  "orange:f08a24,amber:f0a830,tangerine:f07d1a,peach:f4b189,apricot:eda15c," +
  "yellow:f2ce2b,gold:d9a441,golden:d9a441,lemon:eddb3a,honey:d8a63a,mustard:c9a227," +
  "lime:9fd13a,green:3fa34d,emerald:2fa36b,jade:36a186,forest:2c6e4a,olive:6b7a3a,moss:6f8f4a,mint:88d8b0,sage:9bb08a," +
  "teal:2a9d8f,cyan:31c4d6,turquoise:3ec9c0,aqua:53c9d6,sky:6cb8e6," +
  "blue:2f6fd0,azure:2f8fd0,cobalt:2a4fd0,navy:23386b,sapphire:2b5fbf,indigo:4a3fbf,denim:3a5f9f," +
  "purple:8a4fd0,violet:8a5fd6,lavender:b6a6e6,lilac:c0a6dd,plum:7a3f6b,magenta:d13fa8,orchid:c06fd0," +
  "pink:e88bb0,rose:e0728c,blush:eaa2ae,fuchsia:e04fa8,salmon:ee9080,coral:ef7f6a," +
  "brown:8a5a34,chocolate:6b432a,coffee:5c4033,tan:c19a6b,beige:d9c3a1,sand:d8c295,khaki:bfae7a,rust:9c4a24,copper:b06a3a,bronze:9c7b3a," +
  "grey:8f8f8f,gray:8f8f8f,silver:b8bcc0,slate:6e7b87,charcoal:4a4f55,graphite:53585e," +
  "black:2b2b2b,ink:23262b,shadow:32323c,white:f2f2f0,ivory:eee6d5,snow:f5f7fa,pearl:eae6de,cream:eee0c4," +
  // elements and nature
  "fire:e04b1f,flame:e85c22,ember:c8471f,burn:d4451c,heat:e0602a,lava:d43a1c,magma:c8341a," +
  "ice:8fd4ea,frost:aee0ef,snowy:e8f3f8,cold:7fc3e0,chill:8ec9e4,glacier:9fd6e8," +
  "water:3f8fd0,sea:2f7fa8,ocean:24608f,river:3f92c0,rain:6f9fc0,storm:5a6b7a,thunder:6b6f8a,lightning:e6d24a," +
  "wind:9fb8c4,air:a8c4d0,sky2:6cb8e6,cloud:c2cdd6,fog:aeb6bb,mist:bfc7cc," +
  "earth:8a6a44,stone:8d8d84,rock:7f7f76,sand2:d8c295,clay:a86a4a,mud:6b5236,dust:b5a893," +
  "wood:8a6034,tree:3f7a44,leaf:5aa04a,grass:6aa84a,flower:e07fa8,bloom:e88fb0,root:6b4a2a,vine:5a8a3a," +
  "metal:9aa2a8,iron:6f757a,steel:8792a0,rusted:9c4a24,lead:6a6f75,tin:aab0b5," +
  "sun:f0b429,solar:f0a41a,star:f2e07a,moon:c9cfd8,lunar:c2c9d4,night:2f3550,day:8fc4e6,dawn:f0a58a,dusk:6a5a8a," +
  // states and qualities
  "poison:6ab04a,toxic:7ac04a,venom:5aa03a,acid:9fd13a,corrosion:7a8a3a," +
  "holy:f0e0a4,divine:f2e6b0,sacred:eee0b4,light:f4efd8,radiant:f6e8b8,bless:f0e6c0," +
  "dark:3a3646,evil:4a2a3a,curse:5a2a4a,unholy:4a2436,void:2a2836,doom:3a2430," +
  "blood:9c1f2a,wound:a8323a,injury:a04048,pain:8a2a34,death:4a4048,decay:6a5a3a,rot:6a5f34," +
  "life:4aa06a,health:4fae6a,heal:5ab87a,vital:56b072,growth:6aba6a,fresh:7ac47a," +
  "magic:8a5fd0,arcane:7a4fc0,spell:8f6fd6,mystic:7a5fc6,psychic:c06fd0,ether:9f8fe0," +
  "energy:e6c235,power:e0a82a,force:d09a2a,speed:39c0d0,swift:44c8d8,slow:8a8a8a," +
  "calm:8fc4c0,peace:9fd0c4,quiet:a8c8c8,serene:9fd0d4,rest:a4c0c8," +
  "anger:d03a2a,rage:c42f24,fury:cf3428,wrath:b82a24,fear:5a4a6a,terror:4a3a5a,dread:52425e," +
  "joy:f2c14a,happy:f4c85a,cheer:f6cf62,sad:5a7a9a,sorrow:526f8f,grief:4a6484,melancholy:60789a," +
  "love:e0607a,heart:d9556f,passion:d63a4a,desire:cf4a5a," +
  "hope:8fd0c4,despair:4a4a5a,pride:c0a03a,shame:9a6a5a,guilt:8a5a4a,honor:d0b04a,honour:d0b04a," +
  // ranks and outcomes
  "good:4fae6a,great:3fa860,best:2fa060,excellent:34a866,fine:6fb87a,ok:9fb08a,average:9a9a8a," +
  "bad:d0602a,poor:c05a2a,worst:b02a24,fail:b83228,failure:b02a24,success:3fa860,win:34a860,lose:b03a2a," +
  "high:3fa860,low:c05a2a,max:2fa060,min:c0502a,full:3fa860,empty:8a8a8a,none:8a8a8a," +
  "new:4fa8d0,old:8a7a6a,ancient:7a6a52,modern:5fb0d0,rare:8a5fd0,common:8a8a8a,epic:b04fd0,legendary:e0a82a,mythic:d04fb0,unique:c06fd0," +
  "easy:5fb87a,hard:c05a3a,medium:d0a83a,simple:7ac07a,complex:8a5fd0," +
  "safe:4fae6a,danger:d0502a,warning:e0a02a,alert:e08a2a,critical:c42f24,stable:5fa8b0,broken:9a5a4a," +
  "active:3fa860,inactive:8a8a8a,done:4fae6a,todo:d0a83a,pending:c8a83a,progress:4fa8d0,blocked:c04a3a,paused:9a9a8a," +
  // creatures and character
  "dragon:c04a2a,beast:8a5a3a,wolf:7a7f86,bear:7a5a3a,snake:5a8a4a,spider:4a4a52,bird:6fb0d0,fish:4a9fc0," +
  "human:d0a48a,elf:7ab08a,dwarf:9a6a4a,orc:6a8a4a,undead:6a7a6a,ghost:c0c8d4,demon:a02a3a,angel:f0e6b8,fae:b08fd0," +
  "warrior:9a4a3a,fighter:a0503a,rogue:4a4a5a,thief:52525f,wizard:6a4fc0,mage:7a5fd0,cleric:e0d09a,priest:e6d8a8," +
  "bard:c06fa8,ranger:4a7a4a,druid:5a8a4a,monk:c08a4a,paladin:e0c86a,sorcerer:b04fc0,warlock:7a3f8a,barbarian:a0432a"
;

/** The table, parsed on first use and kept. */
let table: Map<string, string> | null = null;

/** Every word that ships with the plugin, and the colour it means. */
export function anchors(): Map<string, string> {
  if (table) return table;
  const m = new Map<string, string>();
  for (const pair of ANCHORS.split(",")) {
    const i = pair.indexOf(":");
    if (i <= 0) continue;
    m.set(pair.slice(0, i), "#" + pair.slice(i + 1));
  }
  table = m;
  return m;
}
