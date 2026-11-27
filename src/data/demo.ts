import type { District, PrayerItem, Profile, Song } from '@/lib/types';

/*
 * Demo content. Mirrors supabase/seed.sql (same IDs) so the app looks the same
 * in demo mode and against a freshly seeded Supabase project.
 */

export const DEFAULT_EVENT_ID = '00000000-0000-0000-0000-000000000001';
export const DEMO_EVENT_NAME = 'HOLY NIGHT, CITY LIGHTS • DEC 13';

const did = (n: number) => `00000000-0000-0000-0001-${String(n).padStart(12, '0')}`;
const pid = (n: number) => `00000000-0000-0000-0002-${String(n).padStart(12, '0')}`;
const sid = (n: number) => `00000000-0000-0000-0003-${String(n).padStart(12, '0')}`;

type DistrictSeed = Omit<District, 'id' | 'prayer_items' | 'sort_order'> & {
  prayers: [string, string][];
};

const DISTRICT_SEEDS: DistrictSeed[] = [
  {
    name: 'Kennedy Town',
    name_zh: '堅尼地城',
    start_lat: 22.28318,
    start_lng: 114.12724,
    description: 'Western terminus — where our journey begins.',
    prayers: [
      ['Young families', 'For the many young families who have moved in since the MTR arrived — that homes would be places of love and patience.'],
      ['University students', 'For HKU students living nearby: wisdom in study, healthy friendships and hope for the future.'],
    ],
  },
  {
    name: 'Sai Ying Pun',
    name_zh: '西營盤',
    start_lat: 22.2864,
    start_lng: 114.139,
    description: 'Old streets, dried seafood shops and hillside neighbourhoods.',
    prayers: [
      ['Elderly living alone', 'For older neighbours in walk-up flats — for companionship, health and people who visit them.'],
      ['Local shop owners', 'For family businesses facing high rents — provision and perseverance.'],
    ],
  },
  {
    name: 'Sheung Wan',
    name_zh: '上環',
    start_lat: 22.287,
    start_lng: 114.147,
    description: 'Western Market, ferry piers and traditional trades.',
    prayers: [
      ['Workers at the ferry piers', 'For those who travel and work around the Macau Ferry Terminal — safety and rest.'],
      ['Seekers of peace', 'That people searching for meaning in this historic district would find true peace.'],
    ],
  },
  {
    name: 'Central',
    name_zh: '中環',
    start_lat: 22.284,
    start_lng: 114.1565,
    description: 'The financial heart of the city.',
    prayers: [
      ['Business and finance', 'For integrity, generosity and rest for people working long hours in offices and banks.'],
      ['Domestic helpers', 'For the domestic workers who gather here on Sundays — encouragement, fair treatment and strong community.'],
      ['Churches in Central', 'For congregations serving the city centre to be salt and light.'],
    ],
  },
  {
    name: 'Admiralty',
    name_zh: '金鐘',
    start_lat: 22.2795,
    start_lng: 114.163,
    description: 'Government offices and the courts.',
    prayers: [
      ['Leaders and officials', 'For wisdom, justice and compassion for those who govern and serve the public.'],
      ['Courts and lawyers', 'For truth and fairness in the courts nearby.'],
    ],
  },
  {
    name: 'Wan Chai',
    name_zh: '灣仔',
    start_lat: 22.2774,
    start_lng: 114.169,
    description: 'Busy markets, nightlife and old tenement streets.',
    prayers: [
      ['The vulnerable', 'For people caught in addiction, exploitation or poverty — protection, freedom and restoration.'],
      ['Street markets', 'For hawkers and market workers on Tai Yuen Street and Cross Street.'],
    ],
  },
  {
    name: 'Causeway Bay',
    name_zh: '銅鑼灣',
    start_lat: 22.279,
    start_lng: 114.179,
    description: 'Shopping crowds and Victoria Park.',
    prayers: [
      ['Young people', 'For teenagers and young adults who hang out here — identity, purpose and healthy hope.'],
      ['Retail workers', 'For shop staff working long holiday hours — patience, kindness from customers and rest.'],
    ],
  },
  {
    name: 'North Point',
    name_zh: '北角',
    start_lat: 22.283,
    start_lng: 114.191,
    description: 'Tin Hau, Fortress Hill and the Chun Yeung Street market.',
    prayers: [
      ['Fujianese community', 'For the many families with Fujian roots — blessing on homes, churches and associations.'],
      ['Market vendors', 'For vendors on Chun Yeung Street where the tram runs right through the market.'],
    ],
  },
  {
    name: 'Quarry Bay',
    name_zh: '鰂魚涌',
    start_lat: 22.289,
    start_lng: 114.209,
    description: 'Taikoo Place offices and dense housing estates.',
    prayers: [
      ['Office workers', 'For people at Taikoo Place — healthy work-life balance and meaningful work.'],
      ['Estate residents', 'For neighbours in crowded estates — patience, kindness and community.'],
    ],
  },
  {
    name: 'Shau Kei Wan',
    name_zh: '筲箕灣',
    start_lat: 22.283,
    start_lng: 114.221,
    description: 'Sai Wan Ho to the eastern terminus — an old fishing harbour.',
    prayers: [
      ['Fishing families', 'For the descendants of the fishing community and their heritage.'],
      ['Schools and churches', 'For local schools and churches serving the eastern district.'],
      ['The year ahead', 'Thanksgiving for this evening and blessing on Hong Kong in the year ahead.'],
    ],
  },
];

export const DEMO_DISTRICTS: District[] = DISTRICT_SEEDS.map((d, i) => {
  const id = did(i + 1);
  const prayer_items: PrayerItem[] = d.prayers.map(([title, body], j) => ({
    id: pid((i + 1) * 10 + j + 1),
    district_id: id,
    title,
    body,
    sort_order: j + 1,
  }));
  const { prayers: _prayers, ...rest } = d;
  return { ...rest, id, sort_order: i + 1, prayer_items };
});

export const DEMO_SONGS: Song[] = [
  {
    id: sid(1),
    title: 'Hark! The Herald Angels Sing',
    author: 'Charles Wesley / Felix Mendelssohn',
    song_key: 'G',
    score_url: null,
    sort_order: 1,
    session: '🎄 01 · Christmas Joy',
    chordpro: `{title: Hark! The Herald Angels Sing}
{subtitle: Charles Wesley / Felix Mendelssohn}
{key: G}

{start_of_verse: Verse 1}
[G]Hark! the herald [D]angels [G]sing,
"Glory [C]to the [D7]newborn [G]King;
Peace on earth, and [D]mercy [G]mild,
God and [Am]sinners [D]recon[G]ciled!"
[G]Joyful, all ye [C]nations, [D7]rise,
[G]Join the triumph [C]of the [D7]skies;
[C]With th'angelic [Em]host pro[Am]claim,
"[D]Christ is born in [G]Bethle[D]hem!"
{end_of_verse}

{start_of_chorus: Refrain}
[C]Hark! the [Em]herald [Am]angels [D]sing,
"[G]Glory [C]to the [D7]newborn [G]King!"
{end_of_chorus}
`,
  },
  {
    id: sid(2),
    title: '我要全心讚美',
    author: null,
    song_key: null,
    score_url: null,
    sort_order: 2,
    session: '🎄 01 · Christmas Joy',
    chordpro: `{title: 我要全心讚美}

{comment: Lyrics and chords to be added by an admin (licensed song).}
`,
  },
  {
    id: sid(3),
    title: 'Angels We Have Heard on High',
    author: 'Traditional French carol, tr. James Chadwick',
    song_key: 'F',
    score_url: null,
    sort_order: 3,
    session: '🎄 01 · Christmas Joy',
    chordpro: `{title: Angels We Have Heard on High}
{subtitle: Traditional French carol, tr. James Chadwick}
{key: F}

{start_of_verse: Verse 1}
[F]Angels we have [C]heard on [F]high,
Sweetly [C]singing [F]o'er the [C]plains,
[F]And the mountains [C]in re[F]ply
Echo[C]ing their [F]joyous [C]strains.
{end_of_verse}

{start_of_chorus: Chorus}
[F]Glo[Dm]-[Gm]-[C]-[F]-[Dm]-[Gm]-[C]-ria,
[F]In ex[C]celsis [F]De[C]o!
[F]Glo[Dm]-[Gm]-[C]-[F]-[Dm]-[Gm]-[C]-ria,
[F]In ex[C]celsis [F]De[C]-[F]o!
{end_of_chorus}

{start_of_verse: Verse 2}
[F]Shepherds, why this [C]jubi[F]lee?
Why your [C]joyous [F]strains pro[C]long?
[F]What the gladsome [C]tidings [F]be
Which in[C]spire your [F]heavenly [C]song?
{end_of_verse}

{start_of_verse: Verse 3}
[F]Come to Bethle[C]hem and [F]see
Him whose [C]birth the [F]angels [C]sing;
[F]Come, adore on [C]bended [F]knee
Christ the [C]Lord, the [F]newborn [C]King.
{end_of_verse}

{comment: Repeat chorus}
`,
  },
  {
    id: sid(4),
    title: '愛是不保留',
    author: null,
    song_key: null,
    score_url: null,
    sort_order: 4,
    session: '🎄 01 · Christmas Joy',
    chordpro: `{title: 愛是不保留}

{comment: Lyrics and chords to be added by an admin (licensed song).}
`,
  },
  {
    id: sid(5),
    title: 'Praise',
    author: null,
    song_key: null,
    score_url: null,
    sort_order: 5,
    session: '🙌 02 · Wonder & Worship',
    chordpro: `{title: Praise}

{comment: Lyrics and chords to be added by an admin (licensed song).}
`,
  },
  {
    id: sid(6),
    title: 'The First Noel',
    author: 'Traditional English carol',
    song_key: 'D',
    score_url: null,
    sort_order: 6,
    session: '🙌 02 · Wonder & Worship',
    chordpro: `{title: The First Noel}
{subtitle: Traditional English carol}
{key: D}

{start_of_verse: Verse 1}
The [D]first No[A]el the [D]angel [G]did [D]say
Was to [G]certain poor [D]shepherds in [G]fields as they [A]lay;
In [D]fields where [A]they [D]lay [G]keeping their [D]sheep,
On a [G]cold winter's [D]night that [G]was [A]so [D]deep.
{end_of_verse}

{start_of_chorus: Chorus}
No[D]el, No[A]el, No[D]el, No[G]-[D]el,
[G]Born is the [D]King of [G]Is[A]ra[D]el.
{end_of_chorus}

{start_of_verse: Verse 2}
They [D]looked [A]up and [D]saw a [G]star
[D]Shining in the [G]east beyond [D]them far;
And [D]to the [A]earth it [D]gave great [G]light,
And [D]so it con[G]tinued both [D]day [A]and [D]night.
{end_of_verse}

{start_of_verse: Verse 3}
Then [D]let us [A]all with [D]one ac[G]cord
[D]Sing praises to our [G]heavenly [D]Lord,
That [D]hath made [A]heaven and [D]earth of [G]nought,
And [D]with His [G]blood man[D]kind [A]hath [D]bought.
{end_of_verse}

{comment: Repeat chorus}
`,
  },
  {
    id: sid(7),
    title: 'Silent Night',
    author: 'Joseph Mohr / Franz Gruber, tr. John F. Young',
    song_key: 'C',
    score_url: null,
    sort_order: 7,
    session: '🙌 02 · Wonder & Worship',
    chordpro: `{title: Silent Night}
{subtitle: Joseph Mohr / Franz Gruber, tr. John F. Young}
{key: C}

{start_of_verse: Verse 1}
[C]Silent night, holy night,
[G7]All is calm, [C]all is bright
[F]Round yon virgin [C]mother and child,
[F]Holy infant so [C]tender and mild,
[G7]Sleep in heavenly [C]peace,
[C]Sleep in [G7]heavenly [C]peace.
{end_of_verse}

{start_of_verse: Verse 2}
[C]Silent night, holy night,
[G7]Shepherds quake [C]at the sight;
[F]Glories stream from [C]heaven afar,
[F]Heavenly hosts sing [C]Alleluia!
[G7]Christ the Saviour is [C]born,
[C]Christ the [G7]Saviour is [C]born!
{end_of_verse}

{start_of_verse: Verse 3}
[C]Silent night, holy night,
[G7]Son of God, [C]love's pure light;
[F]Radiant beams from [C]Thy holy face
[F]With the dawn of re[C]deeming grace,
[G7]Jesus, Lord, at Thy [C]birth,
[C]Jesus, [G7]Lord, at Thy [C]birth.
{end_of_verse}
`,
  },
  {
    id: sid(8),
    title: 'Holy Forever',
    author: null,
    song_key: null,
    score_url: null,
    sort_order: 8,
    session: '🙌 02 · Wonder & Worship',
    chordpro: `{title: Holy Forever}

{comment: Lyrics and chords to be added by an admin (licensed song).}
`,
  },
  {
    id: sid(9),
    title: '我向祢禱告',
    author: null,
    song_key: null,
    score_url: null,
    sort_order: 9,
    session: '💛 03 · Hope to Carry Home',
    chordpro: `{title: 我向祢禱告}

{comment: Lyrics and chords to be added by an admin (licensed song).}
`,
  },
  {
    id: sid(10),
    title: 'What a Beautiful Name',
    author: null,
    song_key: null,
    score_url: null,
    sort_order: 10,
    session: '💛 03 · Hope to Carry Home',
    chordpro: `{title: What a Beautiful Name}

{comment: Lyrics and chords to be added by an admin (licensed song).}
`,
  },
  {
    id: sid(11),
    title: 'Joy to the World',
    author: 'Isaac Watts / arr. Lowell Mason',
    song_key: 'D',
    score_url: null,
    sort_order: 11,
    session: '💛 03 · Hope to Carry Home',
    chordpro: `{title: Joy to the World}
{subtitle: Isaac Watts / arr. Lowell Mason}
{key: D}

{start_of_verse: Verse 1}
[D]Joy to the [G]world, the [A]Lord is [D]come!
Let earth re[G]ceive her [A]King;
[D]Let every heart prepare Him room,
And heaven and nature sing,
And [A]heaven and nature sing,
[D]And [G]heaven, and [D]heaven, and [A]nature [D]sing.
{end_of_verse}

{start_of_verse: Verse 2}
[D]Joy to the [G]earth, the [A]Saviour [D]reigns!
Let men their [G]songs em[A]ploy;
[D]While fields and floods, rocks, hills, and plains
Repeat the sounding joy,
Re[A]peat the sounding joy,
[D]Re[G]peat, re[D]peat the [A]sounding [D]joy.
{end_of_verse}

{start_of_verse: Verse 3}
[D]He rules the [G]world with [A]truth and [D]grace,
And makes the [G]nations [A]prove
[D]The glories of His righteousness,
And wonders of His love,
And [A]wonders of His love,
[D]And [G]wonders, [D]wonders, [A]of His [D]love.
{end_of_verse}
`,
  },
];

export const DEMO_PROFILES: Profile[] = [
  {
    id: 'demo-ada',
    display_name: 'Ada Chan',
    avatar_url: null,
    bio: 'Alto. Loves hot milk tea and singing harmonies on the upper deck.',
    church: 'Island Community Church',
    socials: { instagram: 'ada.sings', whatsapp: '85291234567' },
    visible: true,
  },
  {
    id: 'demo-ben',
    display_name: 'Ben Wong',
    avatar_url: null,
    bio: 'Guitar and chords. Ask me for a capo!',
    church: 'Wan Chai Fellowship',
    socials: { telegram: 'benwong', website: 'https://example.com' },
    visible: true,
  },
  {
    id: 'demo-carmen',
    display_name: 'Carmen Lee',
    avatar_url: null,
    bio: 'Prayer team lead for the eastern districts.',
    church: null,
    socials: { facebook: 'carmen.lee', linkedin: 'https://www.linkedin.com/in/example' },
    visible: true,
  },
  {
    id: 'demo-david',
    display_name: 'David Ho',
    avatar_url: null,
    bio: 'First time tram caroling!',
    church: 'North Point Alliance',
    socials: {},
    visible: true,
  },
];
