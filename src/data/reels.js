/**
 * SmritiGraph — pre-loaded archival reels.
 * Each reel is a "digitized audiovisual record" described by timed transcript
 * segments (as an ASR pass would emit) plus provenance metadata. Cultural terms
 * & entities inside `text` are auto-detected by the local NLP engine using the
 * cultural dictionary + entity gazetteer, so highlighting, markers, the
 * knowledge graph and RAG citations all stay consistent for custom ingests too.
 */
export const REELS = [
  {
    id: 'reel-1924-belgaum',
    title: '1924 Belgaum Congress Session & Freedom Movement Reel',
    year: 1924,
    month: 'December',
    kind: 'audio', // audio | film
    duration: 300,
    source: 'Belgaum Congress Session Archive (reel AG-1024-A)',
    place: 'Belagaum, Bombay Presidency',
    languages: ['Hindustani', 'Kannada', 'Marathi', 'English'],
    tapeLabel: 'AG-1024-A',
    ingestNote: 'Digitized from a 78rpm lacquer disc recovered from the Tilakwadi camp kitchen ledger box.',
    description:
      'Field announcements and recordings from the 39th session of the Indian National Congress, held at Belgaum in December 1924 — the only session Mahatma Gandhi presided over — with camp-life texture from the Seva Dal pavilions at Tilakwadi.',
    tags: ['Freedom Movement', 'Khadi', 'Congress Session', 'North Karnataka'],
    segments: [
      {
        id: 's-24-01', t: 3, speaker: 'Seva Dal Volunteer', role: 'officiating the flag ceremony (Hindustani, translated)', text:
        'Namaskar! The thirty-ninth session of the Indian National Congress is declared open upon this ground at Belgaum. In the December cold of 1924, delegates from every district of the Bombay Presidency are gathered beneath the ochre banners of Swaraj.',
      },
      {
        id: 's-24-02', t: 30, speaker: 'Field Announcer', role: 'walking the camp rows (desc)', text:
        'The reception camp at Tilakwadi shelters ten thousand volunteers. The kitchens cook only country rice and millet, and every dhoti offered to a guest is woven khadi — cloth of the vow. Sugar, they say, is for the delegates; salt is for the charkha shifts.',
      },
      {
        id: 's-24-03', t: 58, speaker: 'All-India Congress Committee Recordist', role: 'minute-taker', text:
        'Bapuji\'s instruction is plain: no delegate may sit in the Congress this year without spinning two thousand yards of yarn on the charkha. Swadeshi is not a slogan here; it is an exercise, performed daily, like a prayer.',
      },
      {
        id: 's-24-04', t: 88, speaker: 'Mahatma Gandhi', role: 'archival address, translated', text:
        'Satyagraha begins where your village begins. If the weaver woman of Belgaum starves, then India starves. My advice to the young delegates is to learn your own speech, spin your own cloth, and quietly refuse every path that is not your own.',
      },
      {
        id: 's-24-05', t: 118, speaker: 'Kasturba Gandhi', role: 'recorded for the women\'s conference', text:
        'Our fund requests the women of Belgaum: bring the khadi spindles of your homes to the Seva Dal pavilion, and the Ashram will return them filled with thread spun by the women of Dharwar.',
      },
      {
        id: 's-24-06', t: 148, speaker: 'Sarojini Naidu', role: 'from the press table', text:
        'Friends — credit is owed to the delegates who came up from Bagalkot, Bijapur, Karwar and Dharwar: not one of them missed a spinning shift for the Congress fund this month.',
      },
      {
        id: 's-24-07', t: 176, speaker: 'Seva Dal Volunteer', role: 'flag-lowering orders', text:
        'Tonight the whole camp sings Vande Mataram at the flag lowering, and the students of the Tilakwadi school will recite the Congress pledge in Kannada, Marathi and Hindustani — three tongues of this one district.',
      },
      {
        id: 's-24-08', t: 202, speaker: 'Gangadharrao Deshpande', role: 'closing of day one', text:
        'This soil has carried my district\'s struggle for a decade. The Lion of Karnataka tells the visitors: Belgaum will keep Khadi alive long after the pavilions are folded, and our youth will answer to the discipline of Satyagraha — not to the district collector.',
      },
      {
        id: 's-24-09', t: 230, speaker: 'All-India Congress Committee Recordist', role: 'resolutions minute', text:
        'Resolution adopted: an all-India village reconstruction fund will carry the work of this session beyond the pandal, into the rain-fed fields of the Bombay Deccan.',
      },
      {
        id: 's-24-10', t: 254, speaker: 'Unknown Delegate', role: 'asr fragment, partially recovered', text:
        '…my jhola carries yarn, salt and — [reel scuff, unintelligible] — send word to my wife in Hubli that the good telegram came: the Congress is ours this week.',
      },
      {
        id: 's-24-11', t: 278, speaker: 'All-India Congress Committee Recordist', role: 'closing minute', text:
        'Flag lowered. Spinning wheel folded. The 1924 session closes tonight — the only Congress session Mahatma Gandhi ever presided over, here at Belgaum.',
      },
    ],
  },
  {
    id: 'reel-1956-unification',
    title: '1956 Suvarna Karnataka Unification Radio Broadcast',
    year: 1956,
    month: 'November',
    kind: 'audio',
    duration: 286,
    source: 'Akashvani Dharwad / Mysore (disc archive RW-56-C)',
    place: 'Dharwar & Mysore, Mysore State',
    languages: ['Kannada', 'English'],
    tapeLabel: 'RW-56-C',
    ingestNote: 'Transferred from a 16-inch shellac transcription disc; bilingual live studio shifts preserved.',
    description:
      'The 1 November 1956 morning broadcast marking the unification of Kannada-speaking lands into enlarged Mysore State — bilingual Kannada/English presentation, poets\' messages, and the first new map read on air.',
    tags: ['Ekikarana', 'Akashvani', 'Rajyotsava', 'States Reorganisation'],
    segments: [
      {
        id: 's-56-01', t: 4, speaker: 'Akashvani Announcer', role: 'Kannada studio (with translation echo)', text:
        'ನಮಸ್ಕಾರ. Idhu Akashvani — namma naadu. Namaskara: on this first of November, the voice from the sky has one sentence to say — the Kannada lands are one land from this sunrise. Today is Ekikarana day.',
      },
      {
        id: 's-56-02', t: 34, speaker: 'English Co-anchor', role: 'map reading, studio', text:
        'Good morning. Listeners on medium wave and in the village squares of Dharwad, Bijapur and Belgaum: with the States Reorganisation coming into force, the Kannada-speaking taluks of the old Bombay Presidency, the Hyderabad-Karnatak region, Coorg and South Kanara join Mysore State.',
      },
      {
        id: 's-56-03', t: 68, speaker: 'Kannada Announcer', role: 'reading the poet\'s greeting', text:
        'Kuvempu sends this greeting for the new map, and we read it as greeting the listeners: "This is the land that sings across its hills; today the song has found its house." The ode we heard at dawn — Bharata Jananiya Tanujate — belongs, they say, to every naadu gathered here.',
      },
      {
        id: 's-56-04', t: 100, speaker: 'Da Ra Bendre', role: 'poet\'s message recorded at Dharwad', text:
        'In the voice Ambikatanayadatta signs with, one line for the morning: Karnataka, do not ask who is inside and who is outside the border. Where Kannada is spoken with love, that is my naadu — and today that naadu has one roof.',
      },
      {
        id: 's-56-05', t: 130, speaker: 'English Co-anchor', role: 'map-change bulletin', text:
        'The maps change their colours this month: Belgaum moves from the Bombay list to the Mysore list, though its archive shelves keep the old registers of the Bombay Presidency. Hyderabad-Karnatak, listeners, closes the last chapter of the Nizam\'s rule this morning.',
      },
      {
        id: 's-56-06', t: 158, speaker: 'Field Correspondent', role: 'from the Dharwad station ground', text:
        'At the flag-hoisting at the Dharwad station ground, school children have brought jowar sheaves and jaggery — harvest sweets of the Deccan — as offerings for the new State. The Elders Society ties the first saffron flag with river-cane thread.',
      },
      {
        id: 's-56-07', t: 186, speaker: 'Kannada Correspondent', role: 'from Mysore city', text:
        'From Mysore: the old capital\'s palace lamps spell Ekikarana tonight, and the broadcasters call this the Suvarna Karnataka vow — golden by the labour of its farmers, weavers and teachers, not by any palace gold.',
      },
      {
        id: 's-56-08', t: 214, speaker: 'Regional Correspondent', role: 'from Bidar (Hyderabad-Karnatak)', text:
        'From Bidar, our correspondent says Hyderabad-Karnatak joins not as a guest region but as a heartland. The demand of Samyukta Karnataka — one united Karnataka — was carried for years in the Hubli press and in the Bidar fairs; today the handshake that promised it is finally an embrace.',
      },
      {
        id: 's-56-09', t: 244, speaker: 'English Co-anchor', role: 'closing note to future listeners', text:
        'A note for whoever digitizes this disc: by the time you hear it, the young listener should know — the borders here are younger than the songs. The State changed its name in time; the songs did not need to.',
      },
    ],
  },
  {
    id: 'reel-1974-bayalata',
    title: '1974 Bayalata & Janapada Oral Folklore Recording — Belagavi',
    year: 1974,
    month: 'February',
    kind: 'field-recording', // shows as film/field tape
    duration: 322,
    source: 'Janapada Heritage Field Tape (cassette JH-74-09, Belgaum taluk)',
    place: 'Bailhongal taluk, Belgaum district',
    languages: ['Kannada (Belagavi dialect)'],
    tapeLabel: 'JH-74-09',
    ingestNote: 'Cassette copy of an all-night Bayalata ground recording; dialect un-normalized by policy.',
    description:
      'A midnight Bayalata (open-air folk theatre) session near Bailhongal with the Sannata comedy interludes, Dollu drummers on visit, and agrarian oral testimony about canal water turns and village vows.',
    tags: ['Bayalata', 'Janapada', 'Folk Idioms', 'Agrarian Life'],
    segments: [
      {
        id: 's-74-01', t: 6, speaker: 'Field Recordist', role: 'catalogue note, whispered', text:
        'Recorded at midnight on a Bayalata ground near Bailhongal, Belgaum district. The troupe calls tonight\'s work the jaagate — the night watch — because the story must run until dawn, and the audience refusing to sleep is part of the art.',
      },
      {
        id: 's-74-02', t: 36, speaker: 'Sannata (comic interlocutor)', role: 'opening mockery', text:
        'Ay, people of the town! I am the Sannata, the little one with the big mouth: the tax inspector has two stomachs, the landlord has two ledgers, and the village still manages with one lamp. Laugh, but write it down somewhere honest.',
      },
      {
        id: 's-74-03', t: 66, speaker: 'Singer-Narrator', role: 'over the troupe drum', text:
        'Hear the story while the drum circles the fire: the heroine sings, the cymbals climb, and the night grows wings. We keep the songs of our grandmothers — they kept them from their grandmothers, and the ground keeps all of us.',
      },
      {
        id: 's-74-04', t: 96, speaker: 'Village Elder', role: 'oral testimony, seated', text:
        'Before the Ghataprabha canal came, we bargained with the sky. My father served this bank channel as its Neeruganti — twelve households, one water turn each, and his word was law sweeter than the Patil\'s writ.',
      },
      {
        id: 's-74-05', t: 126, speaker: 'Village Elder', role: 'continuing testimony', text:
        'When the Hidkal dam rose on the Ghataprabha, the turn-names changed but the turn-sense remained: the water, the Elders say, must belong to everyone by weight — never by the weight of anybody\'s gold.',
      },
      {
        id: 's-74-06', t: 154, speaker: 'Sannata (comic interlocutor)', role: 'kitchen-set piece', text:
        'From one sack of jowar my mother made seven joys: jolada rotti for the guest, grits for the hens, flour for the drummers\' troop, and — she counted me the seventh joy, mind you, as the taster.',
      },
      {
        id: 's-74-07', t: 182, speaker: 'Dollu Troupe Visitor', role: 'announcing the drum', text:
        'We came dancing from the next taluk — the Dollu on my shoulder speaks for us: it remembers harvests older than any road, and it does not need your electricity.',
      },
      {
        id: 's-74-08', t: 208, speaker: 'Village Elder', role: 'vow testimony', text:
        'I made a harake before the platform deity: a vow that my sons would study until they could read the canal register — the very book in which my father\'s water turns are written in his own hand.',
      },
      {
        id: 's-74-09', t: 234, speaker: 'Singer-Narrator', role: 'philosophy between plots', text:
        'Our plots are old and the songs are older, but the jokes are this year\'s harvest. A Bayalata keeps whatever can dance, and laughs away everything else — that is how the village archives itself.',
      },
      {
        id: 's-74-10', t: 262, speaker: 'Field Recordist', role: 'instrument inventory', text:
        'Inventory noted: a harmonium with one stubborn reed, a khanjari, iron cymbals, and the dollu drum borrowed from the neighbouring Kuruba dance party — proof that the folk arts trade with neighbours, not with borders.',
      },
      {
        id: 's-74-11', t: 292, speaker: 'Village Elder', role: 'closing to the young', text:
        'If your young ask what we lost with the canal and the school wall, answer with what we kept: the rotti shared, the turn kept for the last field, and the song that does not let the night end.',
      },
    ],
  },
  {
    id: 'reel-1984-site',
    title: 'Early Indian Satellite Instructional Television Experiment (SITE) Broadcast',
    year: 1984,
    month: 'August',
    kind: 'film', // video-flavoured presentation
    duration: 300,
    source: 'Doordarshan Heritage Tape (U-matic restore, DDH-84-Site)',
    place: 'Doordarshan Kendra Bangalore',
    languages: ['English', 'Hindi', 'Kannada'],
    tapeLabel: 'DDH-84-SITE',
    ingestNote: 'U-matic restoration scan; archival grain retained deliberately in the raw profile.',
    description:
      'A 1984 Doordarshan retrospective on the Satellite Instructional Television Experiment — the 1975-76 ATS-6 broadcasts to 2,400 villages — tracing the line from Akashvani radio to SITE to the INSAT fleet.',
    tags: ['SITE', 'INSAT', 'Doordarshan', 'Educational Broadcasting'],
    segments: [
      {
        id: 's-84-01', t: 5, speaker: 'Doordarshan Presenter', role: 'studio open', text:
        'Namaskar. Tonight, from Doordarshan Kendra Bangalore, a heritage programme: eleven summers ago, a borrowed satellite taught this country\'s villages to watch the sky.',
      },
      {
        id: 's-84-02', t: 32, speaker: 'Doordarshan Presenter', role: 'archive montage', text:
        'The Satellite Instructional Television Experiment — SITE — beamed about four hours of programmes daily, from August 1975 to July 1976, to roughly 2,400 villages across Andhra, Bihar, Karnataka, Madhya Pradesh, Orissa and Rajasthan, using the American ATS-6 satellite.',
      },
      {
        id: 's-84-03', t: 64, speaker: 'Archive Voice (1975)', role: 'policy clip', text:
        '"We must be second to none in the application of advanced technologies to the real problems of man and society." The words are Vikram Sarabhai\'s — and for the SITE generation, a village television set was an application problem, not a luxury.',
      },
      {
        id: 's-84-04', t: 94, speaker: 'Television Researcher', role: 'studio findings', text:
        'In Kheda, a community set drew two hundred people to one bulb; in Karnataka\'s dry belt, farmers timed their ploughing to the Krishi Darshan broadcast\'s seed advice. The set was one, but the common sense it carried was shared.',
      },
      {
        id: 's-84-05', t: 122, speaker: 'Doordarshan Presenter', role: 'space context', text:
        'Aryabhata, our first indigenously built satellite, rose in 1975 itself — SITE went up the same season India learned it could build what it borrowed.',
      },
      {
        id: 's-84-06', t: 150, speaker: 'U R Rao (guest)', role: 'who led the SITE project', text:
        'People called the satellite a star; for the engineers it was a dot in a slow, beautiful calculation — and the villagers gave it a simpler, kinder name: the television star.',
      },
      {
        id: 's-84-07', t: 178, speaker: 'Doordarshan Presenter', role: 'legacy bulletin', text:
        'From SITE\'s chalkboard grew the INSAT family — the multipurpose satellites that now carry our television, our forecast maps and our cyclone warnings. INSAT-1B itself was deployed from the Space Shuttle Challenger in 1983.',
      },
      {
        id: 's-84-08', t: 208, speaker: 'Doordarshan Veteran', role: 'to the archive\'s young audience', text:
        'Your parents\' first television was a village balcony and one bulb, and the whole lane argued about what to watch. That single shared screen made viewers of villagers — and, sometimes, thoughtful citizens of viewers.',
      },
      {
        id: 's-84-09', t: 238, speaker: 'Doordarshan Presenter', role: 'closing arc', text:
        'Remember the arc, listeners: Akashvani taught the nation to listen; SITE taught it to watch; INSAT taught the sky to speak Kannada, Telugu and Bhojpuri.',
      },
      {
        id: 's-84-10', t: 268, speaker: 'Archivist (catalogue note)', role: 'outro', text:
        'Restoration note: picture and sound recovered from U-matic tape. The grain and the hum you see and hear are the memory of a countryside that learned its science by lantern light.',
      },
    ],
  },
];

export const REELS_BY_ID = Object.fromEntries(REELS.map((r) => [r.id, r]));
