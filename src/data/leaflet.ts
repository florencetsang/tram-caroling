/** Content of the printed leaflet "Holy Night, City Lights — The Night Edition" (public/leaflet.pdf). */

export const LEAFLET_PDF = '/leaflet.pdf';

export const cover = {
  eyebrow: 'Before we board',
  title: ['Holy Night,', 'City Lights'],
  tagline: 'Christmas carols. Hong Kong after dark.',
  date: 'Sunday, 13 December 2026',
  details: 'Gather 8:15 p.m. / Green antique tram 9:00–11:00 p.m.',
};

export const note = {
  page: '02',
  eyebrow: 'A note before the night',
  title: ['Some songs need', 'no introduction.'],
  subtitle: 'The people beside you might.',
  paragraphs: [
    'A familiar melody starts, and the first line comes back before you’ve thought about it. We’ll have the songbook ready for verse three.',
    'On 13 December, we’re taking familiar songs somewhere different: a green antique tram, Hong Kong after dark, and people we’re still getting to know.',
    'We’re celebrating Jesus: God coming near in the Saviour who lived among us, died for our sins and rose again. His love gives us reason to sing and to care for the people around us.',
    'Between sets: something to eat, people to catch up with, and a view worth interrupting your conversation for.',
  ],
  signoff: 'See you on the tram.',
  references: ['John 1:1-14', '1 Corinthians 15:3-4'],
  contents: [
    { page: '03', label: 'The evening', id: 'evening' },
    { page: '04', label: 'Hong Kong', id: 'hong-kong' },
    { page: '05', label: 'BY NAME', id: 'by-name' },
    { page: '07', label: 'Before we sing', id: 'before-we-sing' },
  ],
};

export const evening = {
  page: '03',
  eyebrow: '13 December 2026 / Hong Kong time',
  title: 'The evening.',
  subtitle: 'Three singing sets, with refreshments and conversation between them.',
  items: [
    { time: '8:15', title: 'Gather at Whitty Street Terminus', note: 'Welcome, briefing and prayer before boarding.' },
    { time: '9:00', title: 'We’re on our way' },
    { time: '9:15', title: 'Christmas Joy', set: true },
    { time: '9:43', title: 'Toilet stop', note: 'About 15 minutes, including reboarding.' },
    { time: '10:03', title: 'Wonder & Worship', set: true },
    { time: '10:21', title: 'Drinks & conversation' },
    { time: '10:41', title: 'Hope to Carry Home', set: true },
    { time: '11:00', title: 'Journey ends', note: 'Closing thanks and prayer after disembarking.' },
  ] as { time: string; title: string; note?: string; set?: boolean }[],
  footnotes: [
    'All times p.m. Singing and stop times are approximate.',
    'Exact meeting pin to follow in WhatsApp.',
  ],
};

export const hongKong = {
  page: '04',
  eyebrow: 'The place we know',
  title: ['The city we', 'complain about.'],
  title2: ['The city we', 'keep photographing.'],
  paragraphs: [
    'The Hong Kong in our camera rolls often has better lighting than the one in our group chats. The skyline on a good night. The rent, the queues, the shop that closed. Both are edited versions.',
    'Some places matter for reasons a photograph can’t explain: your usual cha chaan teng, a familiar walk home, the street outside your first office.',
    'A skyline can impress a visitor. A tram stop can bring back five years. On 13 December, we’ll have time to enjoy both.',
  ],
};

export const byName = {
  page: '05',
  eyebrow: 'A name to pray for / A person to meet',
  title: 'BY NAME',
  subtitle: 'Pray by name. Meet on the night.',
  steps: [
    {
      n: '01',
      title: 'Receive',
      when: 'A name and profile',
      body: 'You’ll receive your partner’s name and the profile they’ve agreed to share. They’ll receive yours.',
    },
    {
      n: '02',
      title: 'Pray',
      when: 'Before the evening',
      body: 'Pray for what they’ve chosen to share, and give thanks for the good in their life.',
    },
    {
      n: '03',
      title: 'Meet',
      when: 'On the tram',
      body: 'Save your first hello for the tram. Find each other during the first mingling time.',
    },
  ],
  footnote:
    'Profiles stay within your assigned pair or trio. Contact details won’t be included. Message Alex privately if anything needs adjusting.',
};

export const sharedCity = {
  page: '06',
  eyebrow: 'Our shared city',
  title: ['Same city.', 'Different evenings.'],
  subtitle: 'Dinner with friends. A late shift. The journey home.',
  paragraphs: [
    'The city will have plenty of plans besides ours. Someone may recognise a chorus. Someone may wonder why we’re singing about Jesus. We can ask God to encourage them and welcome a conversation if it comes.',
    'In the Good Samaritan, Jesus turns a question about who counts as a neighbour into a call to show mercy.',
    'Our prayer for Hong Kong can begin with particular people, and continue in the care we give when the singing ends.',
  ],
  reading: 'Read the story: Luke 10:25-37',
};

export const beforeWeSing = {
  page: '07',
  eyebrow: 'A few things to bring to God',
  title: 'Before we sing.',
  subtitle: 'Choose a place to begin.',
  prompts: [
    {
      title: 'Jesus, whom we’re celebrating',
      body: 'Thank Jesus for coming among us, dying for our sins and rising again.',
    },
    { title: 'Your own life, as it is', body: 'Bring a good thing, a question or an unfinished concern.' },
    {
      title: 'The name you’ve been given',
      body: 'Remember what your BY NAME partner chose to share. Give thanks for the good in their life and pray for what lies ahead.',
    },
    {
      title: 'Hong Kong, in particular',
      body: 'Name a place or person you know. Pray for people facing difficulties, and those caring for them.',
    },
    { title: 'A passing chorus', body: 'Ask that someone might find joy or become curious about Jesus.' },
    {
      title: 'The people behind the evening',
      body: 'Remember the musicians, helpers and tram staff. Pray for a safe, joyful evening.',
    },
  ],
  reading: 'A short reading: Colossians 3:12-17',
};

export const closing = {
  page: '08',
  verse: ['The light shines', 'in the darkness,', 'and the darkness', 'has not overcome it.'],
  reference: 'John 1:5 / NIV',
  blessing:
    'May the joy of this night become gratitude, the names we learn become people we care for, and our praise continue in the way we live.',
  wordmark: 'Holy Night, City Lights',
  credits: [
    'Reflections and prayers are original commentary. The printed leaflet’s photographs (pp. 4 and 6) carry their own licences and are not reproduced here; see the PDF for credits.',
    'Scripture quotation taken from The Holy Bible, New International Version®, NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.® Used by permission. All rights reserved worldwide.',
  ],
};
