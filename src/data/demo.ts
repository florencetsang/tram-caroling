import type { District, PrayerCard, PrayerItem, Profile, RosterEntry, Song } from '@/lib/types';

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
    name: 'Whitty Street & Sai Ying Pun',
    name_zh: '屈地街・西營盤',
    start_lat: 22.2866,
    start_lng: 114.1365,
    description: 'Setting off from the Whitty Street Tram Depot through old streets and dried seafood shops.',
    prayers: [
      ['Elderly living alone', 'For older neighbours in walk-up flats — for companionship, health and people who visit them.'],
      ['Local shop owners', 'For family businesses facing high rents — provision and perseverance.'],
      ['University students', 'For HKU students living nearby: wisdom in study, healthy friendships and hope for the future.'],
    ],
  },
  {
    name: 'Sheung Wan',
    name_zh: '上環',
    start_lat: 22.2872,
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
    start_lat: 22.2772,
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
    start_lat: 22.2794,
    start_lng: 114.1804,
    description: 'Shopping crowds around Yee Wo Street and Times Square.',
    prayers: [
      ['Young people', 'For teenagers and young adults who hang out here — identity, purpose and healthy hope.'],
      ['Retail workers', 'For shop staff working long holiday hours — patience, kindness from customers and rest.'],
    ],
  },
  {
    name: 'Happy Valley',
    name_zh: '跑馬地',
    start_lat: 22.2775,
    start_lng: 114.1818,
    description: 'Round the racecourse loop, past the hospitals and the old cemeteries.',
    prayers: [
      ['Freedom from gambling', 'For people and families harmed by gambling — freedom, healing and real hope.'],
      ['Hospitals and carers', 'For patients, doctors and nurses in the hospitals nearby — comfort, skill and strength.'],
      ['Those who grieve', 'For families remembering loved ones this Christmas — the comfort of the God of all comfort.'],
    ],
  },
  {
    name: 'Wan Chai (return)',
    name_zh: '灣仔（回程）',
    start_lat: 22.2794,
    start_lng: 114.1804,
    description: 'Heading back west along Hennessy Road.',
    prayers: [
      ['Ethnic minorities and refugees', 'For South and Southeast Asian neighbours and asylum seekers — welcome, dignity and provision.'],
      ['Social workers and NGOs', 'For people serving the poor and marginalised — strength, wisdom and joy in their work.'],
      ['Estate residents', 'For neighbours in crowded estates — patience, kindness and community.'],
    ],
  },
  {
    name: 'Admiralty & Central (return)',
    name_zh: '金鐘・中環（回程）',
    start_lat: 22.2774,
    start_lng: 114.1671,
    description: 'Back through the city centre.',
    prayers: [
      ['Unity of the church', 'For churches across Hong Kong to stand together in love and serve the city as one.'],
      ['Office workers', 'For people working late in the towers around us — healthy work-life balance and meaningful work.'],
      ['Peace for Hong Kong', 'For peace, healing and hope for our city and everyone who calls it home.'],
    ],
  },
  {
    name: 'Sheung Wan & Sai Ying Pun (return)',
    name_zh: '上環・西營盤（回程）',
    start_lat: 22.2851,
    start_lng: 114.1555,
    description: 'The last stretch home to the Whitty Street Tram Depot.',
    prayers: [
      ['Tram drivers and depot staff', 'Thanks for the drivers and staff who keep the "ding ding" running — safety, rest and blessing.'],
      ['Young families', 'For young families in the western district — that homes would be places of love and patience.'],
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

type DemoPerson = Omit<RosterEntry, 'form_key'>;

const person = (
  id: string,
  code: string,
  group_no: number | null,
  profile: Omit<Profile, 'id' | 'avatar_url' | 'visible'>,
  card: Omit<PrayerCard, 'profile_id'>,
): DemoPerson => ({
  profile: { id, avatar_url: null, visible: true, ...profile },
  code,
  group_no,
  card: { profile_id: id, ...card },
});

/** Demo participants; sign in with any of these codes in demo mode. */
export const DEMO_ROSTER: DemoPerson[] = [
  person(
    'demo-ada',
    'ADACHAN2',
    1,
    {
      display_name: 'Ada Chan',
      bio: 'Alto. Loves hot milk tea and singing harmonies on the upper deck.',
      church: 'Island Community Church',
      gender: 'Female',
      day_off: 'A slow brunch, then a hike up Dragon’s Back.',
      mbti: 'ENFJ',
      socials: { instagram: 'ada.sings', whatsapp: '85291234567' },
    },
    { conversation_starter: 'What’s a carol that reminds you of childhood?', prayer_request: 'Peace and wisdom as I start a new job in January.' },
  ),
  person(
    'demo-ben',
    'BENWNG23',
    1,
    {
      display_name: 'Ben Wong',
      bio: 'Guitar and chords. Ask me for a capo!',
      church: 'Wan Chai Fellowship',
      gender: 'Male',
      day_off: 'Jamming with friends and finding a new cha chaan teng.',
      mbti: 'ISFP',
      socials: { telegram: 'benwong', website: 'https://example.com' },
    },
    { conversation_starter: 'Ask me about my worst busking story.', prayer_request: 'Pray for my family to be reconciled this Christmas.' },
  ),
  person(
    'demo-carmen',
    'CARMEN23',
    null,
    {
      display_name: 'Carmen Lee',
      bio: 'Prayer team lead for the eastern districts.',
      church: null,
      gender: 'Female',
      day_off: 'Reading by the harbour with a good coffee.',
      mbti: 'INFJ',
      socials: { facebook: 'carmen.lee', linkedin: 'https://www.linkedin.com/in/example' },
    },
    { conversation_starter: 'What book has shaped your faith the most?', prayer_request: 'Rest and renewed energy after a busy term.' },
  ),
  person(
    'demo-david',
    'DAVDH234',
    null,
    {
      display_name: 'David Ho',
      bio: 'First time tram caroling!',
      church: 'North Point Alliance',
      gender: 'Male',
      day_off: 'Football in the morning, board games at night.',
      mbti: null,
      socials: {},
    },
    { conversation_starter: 'Which district would you most like to pray for?', prayer_request: null },
  ),
];
