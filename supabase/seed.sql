-- Seed data for the Tram Caroling MVP. IDs match src/data/demo.ts.
-- Safe to re-run: existing rows are updated in place.

insert into public.events (id, name, starts_at) values
  ('00000000-0000-0000-0000-000000000001', 'HOLY NIGHT, CITY LIGHTS • DEC 13', '2026-12-19 19:00:00+08')
on conflict (id) do update set name = excluded.name, starts_at = excluded.starts_at;

insert into public.districts (id, event_id, name, name_zh, description, sort_order, start_lat, start_lng) values
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'Kennedy Town', '堅尼地城', 'Western terminus — where our journey begins.', 1, 22.28318, 114.12724),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'Sai Ying Pun', '西營盤', 'Old streets, dried seafood shops and hillside neighbourhoods.', 2, 22.2864, 114.139),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'Sheung Wan', '上環', 'Western Market, ferry piers and traditional trades.', 3, 22.287, 114.147),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'Central', '中環', 'The financial heart of the city.', 4, 22.284, 114.1565),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000001', 'Admiralty', '金鐘', 'Government offices and the courts.', 5, 22.2795, 114.163),
  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0000-000000000001', 'Wan Chai', '灣仔', 'Busy markets, nightlife and old tenement streets.', 6, 22.2774, 114.169),
  ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0000-000000000001', 'Causeway Bay', '銅鑼灣', 'Shopping crowds and Victoria Park.', 7, 22.279, 114.179),
  ('00000000-0000-0000-0001-000000000008', '00000000-0000-0000-0000-000000000001', 'North Point', '北角', 'Tin Hau, Fortress Hill and the Chun Yeung Street market.', 8, 22.283, 114.191),
  ('00000000-0000-0000-0001-000000000009', '00000000-0000-0000-0000-000000000001', 'Quarry Bay', '鰂魚涌', 'Taikoo Place offices and dense housing estates.', 9, 22.289, 114.209),
  ('00000000-0000-0000-0001-000000000010', '00000000-0000-0000-0000-000000000001', 'Shau Kei Wan', '筲箕灣', 'Sai Wan Ho to the eastern terminus — an old fishing harbour.', 10, 22.283, 114.221)
on conflict (id) do update set
  name = excluded.name, name_zh = excluded.name_zh, description = excluded.description,
  sort_order = excluded.sort_order, start_lat = excluded.start_lat, start_lng = excluded.start_lng;

insert into public.prayer_items (id, district_id, title, body, sort_order) values
  ('00000000-0000-0000-0002-000000000011', '00000000-0000-0000-0001-000000000001', 'Young families', 'For the many young families who have moved in since the MTR arrived — that homes would be places of love and patience.', 1),
  ('00000000-0000-0000-0002-000000000012', '00000000-0000-0000-0001-000000000001', 'University students', 'For HKU students living nearby: wisdom in study, healthy friendships and hope for the future.', 2),
  ('00000000-0000-0000-0002-000000000021', '00000000-0000-0000-0001-000000000002', 'Elderly living alone', 'For older neighbours in walk-up flats — for companionship, health and people who visit them.', 1),
  ('00000000-0000-0000-0002-000000000022', '00000000-0000-0000-0001-000000000002', 'Local shop owners', 'For family businesses facing high rents — provision and perseverance.', 2),
  ('00000000-0000-0000-0002-000000000031', '00000000-0000-0000-0001-000000000003', 'Workers at the ferry piers', 'For those who travel and work around the Macau Ferry Terminal — safety and rest.', 1),
  ('00000000-0000-0000-0002-000000000032', '00000000-0000-0000-0001-000000000003', 'Seekers of peace', 'That people searching for meaning in this historic district would find true peace.', 2),
  ('00000000-0000-0000-0002-000000000041', '00000000-0000-0000-0001-000000000004', 'Business and finance', 'For integrity, generosity and rest for people working long hours in offices and banks.', 1),
  ('00000000-0000-0000-0002-000000000042', '00000000-0000-0000-0001-000000000004', 'Domestic helpers', 'For the domestic workers who gather here on Sundays — encouragement, fair treatment and strong community.', 2),
  ('00000000-0000-0000-0002-000000000043', '00000000-0000-0000-0001-000000000004', 'Churches in Central', 'For congregations serving the city centre to be salt and light.', 3),
  ('00000000-0000-0000-0002-000000000051', '00000000-0000-0000-0001-000000000005', 'Leaders and officials', 'For wisdom, justice and compassion for those who govern and serve the public.', 1),
  ('00000000-0000-0000-0002-000000000052', '00000000-0000-0000-0001-000000000005', 'Courts and lawyers', 'For truth and fairness in the courts nearby.', 2),
  ('00000000-0000-0000-0002-000000000061', '00000000-0000-0000-0001-000000000006', 'The vulnerable', 'For people caught in addiction, exploitation or poverty — protection, freedom and restoration.', 1),
  ('00000000-0000-0000-0002-000000000062', '00000000-0000-0000-0001-000000000006', 'Street markets', 'For hawkers and market workers on Tai Yuen Street and Cross Street.', 2),
  ('00000000-0000-0000-0002-000000000071', '00000000-0000-0000-0001-000000000007', 'Young people', 'For teenagers and young adults who hang out here — identity, purpose and healthy hope.', 1),
  ('00000000-0000-0000-0002-000000000072', '00000000-0000-0000-0001-000000000007', 'Retail workers', 'For shop staff working long holiday hours — patience, kindness from customers and rest.', 2),
  ('00000000-0000-0000-0002-000000000081', '00000000-0000-0000-0001-000000000008', 'Fujianese community', 'For the many families with Fujian roots — blessing on homes, churches and associations.', 1),
  ('00000000-0000-0000-0002-000000000082', '00000000-0000-0000-0001-000000000008', 'Market vendors', 'For vendors on Chun Yeung Street where the tram runs right through the market.', 2),
  ('00000000-0000-0000-0002-000000000091', '00000000-0000-0000-0001-000000000009', 'Office workers', 'For people at Taikoo Place — healthy work-life balance and meaningful work.', 1),
  ('00000000-0000-0000-0002-000000000092', '00000000-0000-0000-0001-000000000009', 'Estate residents', 'For neighbours in crowded estates — patience, kindness and community.', 2),
  ('00000000-0000-0000-0002-000000000101', '00000000-0000-0000-0001-000000000010', 'Fishing families', 'For the descendants of the fishing community and their heritage.', 1),
  ('00000000-0000-0000-0002-000000000102', '00000000-0000-0000-0001-000000000010', 'Schools and churches', 'For local schools and churches serving the eastern district.', 2),
  ('00000000-0000-0000-0002-000000000103', '00000000-0000-0000-0001-000000000010', 'The year ahead', 'Thanksgiving for this evening and blessing on Hong Kong in the year ahead.', 3)
on conflict (id) do update set title = excluded.title, body = excluded.body, sort_order = excluded.sort_order;

insert into public.songs (id, event_id, title, author, song_key, sort_order, session, chordpro) values
(
  '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000001',
  'Hark! The Herald Angels Sing', 'Charles Wesley / Felix Mendelssohn', 'G', 1, '🎄 01 · Christmas Joy',
$cp${title: Hark! The Herald Angels Sing}
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
$cp$
),
(
  '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000001',
  '我要全心讚美', null, null, 2, '🎄 01 · Christmas Joy',
$cp${title: 我要全心讚美}

{comment: Lyrics and chords to be added by an admin (licensed song).}
$cp$
),
(
  '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000001',
  'Angels We Have Heard on High', 'Traditional French carol, tr. James Chadwick', 'F', 3, '🎄 01 · Christmas Joy',
$cp${title: Angels We Have Heard on High}
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
$cp$
),
(
  '00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0000-000000000001',
  '我向祢禱告', null, null, 4, '🎄 01 · Christmas Joy',
$cp${title: 我向祢禱告}

{comment: Lyrics and chords to be added by an admin (licensed song).}
$cp$
),
(
  '00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000001',
  'Praise', null, null, 5, '🙌 02 · Wonder & Worship',
$cp${title: Praise}

{comment: Lyrics and chords to be added by an admin (licensed song).}
$cp$
),
(
  '00000000-0000-0000-0003-000000000006', '00000000-0000-0000-0000-000000000001',
  'The First Noel', 'Traditional English carol', 'D', 6, '🙌 02 · Wonder & Worship',
$cp${title: The First Noel}
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
$cp$
),
(
  '00000000-0000-0000-0003-000000000007', '00000000-0000-0000-0000-000000000001',
  'Silent Night', 'Joseph Mohr / Franz Gruber, tr. John F. Young', 'C', 7, '🙌 02 · Wonder & Worship',
$cp${title: Silent Night}
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
$cp$
),
(
  '00000000-0000-0000-0003-000000000008', '00000000-0000-0000-0000-000000000001',
  'Holy Forever', null, null, 8, '🙌 02 · Wonder & Worship',
$cp${title: Holy Forever}

{comment: Lyrics and chords to be added by an admin (licensed song).}
$cp$
),
(
  '00000000-0000-0000-0003-000000000009', '00000000-0000-0000-0000-000000000001',
  '上帝早已預備', null, null, 9, '💛 03 · Hope to Carry Home',
$cp${title: 上帝早已預備}

{comment: Lyrics and chords to be added by an admin (licensed song).}
$cp$
),
(
  '00000000-0000-0000-0003-000000000010', '00000000-0000-0000-0000-000000000001',
  'What a Beautiful Name', null, null, 10, '💛 03 · Hope to Carry Home',
$cp${title: What a Beautiful Name}

{comment: Lyrics and chords to be added by an admin (licensed song).}
$cp$
),
(
  '00000000-0000-0000-0003-000000000011', '00000000-0000-0000-0000-000000000001',
  'Build My Life', null, null, 11, '💛 03 · Hope to Carry Home',
$cp${title: Build My Life}

{comment: Lyrics and chords to be added by an admin (licensed song).}
$cp$
),
(
  '00000000-0000-0000-0003-000000000012', '00000000-0000-0000-0000-000000000001',
  'Joy to the World', 'Isaac Watts / arr. Lowell Mason', 'D', 12, '💛 03 · Hope to Carry Home',
$cp${title: Joy to the World}
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
$cp$
)
on conflict (id) do update set
  title = excluded.title, author = excluded.author, song_key = excluded.song_key,
  sort_order = excluded.sort_order, session = excluded.session, chordpro = excluded.chordpro;

insert into public.event_state (event_id) values ('00000000-0000-0000-0000-000000000001')
on conflict (event_id) do nothing;

-- After signing in once, make yourself an admin (replace the email):
-- insert into public.event_roles (event_id, user_id, role)
-- select '00000000-0000-0000-0000-000000000001', id, 'admin' from auth.users where email = 'you@example.com'
-- on conflict (event_id, user_id) do update set role = 'admin';
