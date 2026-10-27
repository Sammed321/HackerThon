/**
 * SmritiGraph Cultural Dictionary — open, community-verifiable annotation store.
 * Each entry decodes a term found in archival audio (dialect, idiom, historical
 * place name, tradition, institution or technology) for a modern listener.
 *
 * Schema (add entries via the Standards Hub → Annotation PR Generator):
 *   id        stable slug
 *   aliases   surface forms matched in transcripts (case-insensitive)
 *   type      place | idiom | dialect | tradition | institution | tech | event
 *   era       period the term belongs to
 *   region    geographic anchor
 *   literal   dictionary-literal reading of the phrase
 *   cultural  what the phrase *did* in culture (beginner friendly)
 *   evolution historical / geographical evolution line (e.g. renames, borders)
 *   reels     reel ids where listeners can hear the term
 */
export const DICTIONARY = [
  {
    id: 'plc-belgaum', aliases: ['Belgaum', 'Belagavi', 'Belgaon'], type: 'place', era: '1911–present',
    region: 'North Karnataka, India',
    literal: '"Village of the bel (stone / bilva tree)" — old Kannada for a stone settlement.',
    cultural: 'For a century the administrative heart of North Karnataka: garrison town, cotton market, Congress stage, radio relay, and folk stage. Each generation said the name differently and meant a different city.',
    evolution: 'Belgaum (Bombay Presidency, 1818–1956) → Mysore State (1956) → Karnataka (1973) → officially renamed Belagavi (1 November 2014). Kannada speakers had always pronounced it "Belagavi"; the map finally agreed.',
    beginner: 'Same city, two names: the older reels say Belgaum, the new maps say Belagavi. Listen for which pronunciation the speaker is fighting for.',
    reels: ['reel-1924-belgaum', 'reel-1956-unification', 'reel-1974-bayalata'],
  },
  {
    id: 'plc-bombay-presidency', aliases: ['Bombay Presidency', 'Bombay Karnatak', 'Bombay-Karnatak'], type: 'place', era: '1661–1956',
    region: 'Western British India',
    literal: 'A "presidency" — the largest administrative province of British India, seated at Bombay.',
    cultural: 'For North Karnataka speakers it was not geography but paperwork: the office you paid tax to, the court you appealed to, the railway ticket you bought. Saying "Bombay Karnatak" announced a Kannada identity living under a Marathi seal.',
    evolution: 'Dissolved 1947; Kannada-speaking districts (Belgaum, Bijapur, Dharwad, North Kanara) transferred to Mysore State by the States Reorganisation Act, effective 1 November 1956.',
    beginner: 'Before 1956, parts of Karnataka were ruled from faraway Bombay — tell it as "our family lived under a different landlord\'s paperwork".',
    reels: ['reel-1924-belgaum', 'reel-1956-unification'],
  },
  {
    id: 'plc-tilakwadi', aliases: ['Tilakwadi', 'Tilak Wadi'], type: 'place', era: '1916–present',
    region: 'Belgaum (Belagavi)',
    literal: 'Named after Lokmanya Tilak ("wadi" = modest settlement/orchard quarter).',
    cultural: 'The quarter where 1924 camp delegates slept, spun and cooked — and later, where the young city grew its schools. A neighbourhood name that remembers a movement.',
    evolution: 'Named while Tilak\'s legacy was still debated; today a school-and-market quarter of Belagavi where elders still point "where the pandal stood".',
    beginner: 'A neighbourhood named after a great freedom-fighter — some cities name streets, this one named itself after a cause.',
    reels: ['reel-1924-belgaum'],
  },
  {
    id: 'plc-dharwar', aliases: ['Dharwar', 'Dharwad', 'Hubli', 'Hubballi'], type: 'place', era: 'Anglicised spelling retired c. 1971',
    region: 'North Karnataka',
    literal: 'Dravidian: a "gateway" town (dwāra-vāḍa) — the twin cities Dharwad–Hubballi.',
    cultural: 'The printing-and-poetry capital of old North Karnataka: Akashvani\'s studio, the Kannada press, the sammelana stage, Bendre\'s town. Old reels spell it Dharwar; new reels spell Dharwad — both said identically.',
    evolution: 'Dharwar (anglicised colonial spelling) → Dharwad (official Kannada spelling); Hubli likewise re-Kannadised to Hubballi (2014).',
    beginner: 'Two sister cities that grew into each other — like a poem and its printing press.',
    reels: ['reel-1924-belgaum', 'reel-1956-unification'],
  },
  {
    id: 'plc-mysore-state', aliases: ['Mysore State', 'Princely Mysore', 'Mysuru', 'Mysore'], type: 'place', era: 'Princely 1799–1947; State 1947–1973',
    region: 'Southern Karnataka',
    literal: '"Mysuru" from Mahishasurapura — city of the buffalo demon slain by the goddess.',
    cultural: 'The palace state whose model the whole south watched: a benchmark princely administration, then the anchor State that gave the unification movement its map, its capital and its confidence.',
    evolution: 'Princely Mysore → Mysore State (1947) → enlarged Mysore State (1 Nov 1956, absorbing Bombay-Karnatak, Hyderabad-Karnatak, Coorg, South Kanara) → renamed Karnataka (1 Nov 1973).',
    beginner: 'Think of Mysore State as the big brother that invited all its Kannada-speaking siblings home in 1956 — and changed its own name to Karnataka in 1973.',
    reels: ['reel-1956-unification', 'reel-1984-site'],
  },
  {
    id: 'plc-hyderabad-karnatak', aliases: ['Hyderabad-Karnatak', 'Hyderabad Karnataka', 'Hyderabad-Karnataka', 'Kalyana Karnataka'], type: 'place', era: '1724–1956 (Nizam era)',
    region: 'Northeast Karnataka',
    literal: 'The Kannada-speaking districts carved out of the enormous princely Hyderabad State.',
    cultural: 'A region that kept its Kannada alive under Nizam rule for over two centuries — printing secret pamphlets, singing unification songs at fairs, waiting for one map to draw them in.',
    evolution: 'Nizam\'s Hyderabad State → merged into Mysore State (1 Nov 1956) → formally named Kalyana Karnataka ("auspicious Karnataka", 2019).',
    beginner: 'This region once belonged to a different kingdom than the rest of Karnataka; in 1956 it "came home", and it celebrates that day as its second birthday.',
    reels: ['reel-1956-unification'],
  },
  {
    id: 'plc-kodagu', aliases: ['Coorg', 'Kodagu'], type: 'place', era: 'Anglicised name in official use until 1956',
    region: 'Western Ghats, Karnataka',
    literal: 'Kodagu — the homeland of the Kodava (Coorg) people; "Coorg" was the English ear\'s spelling.',
    cultural: 'The hill country of coffee, Cauvery springs and a martial culture — joining the unification map as a small but proud appendix of Mysore State.',
    evolution: 'Part C State "Coorg" → merged as Kodagu district of Mysore State (1 Nov 1956).',
    beginner: 'The misty coffee hills of Karnataka — the English called it Coorg, its own people always called it Kodagu.',
    reels: ['reel-1956-unification'],
  },
  {
    id: 'plc-ghataprabha', aliases: ['Ghataprabha', 'Ghataprabha river', 'Hidkal', 'Hidkal dam'], type: 'place', era: 'Canal era 1900s; dam 1970s',
    region: 'Belgaum & Bagalkot districts',
    literal: '"The bright river of the ghats" — a Krishna tributary rising in the Western Ghats.',
    cultural: 'The river whose canal turns were recited like lineage: who waters first, who waits. The Hidkal dam (1970s) re-ordered those recitations, which is why elders still argue turns at the sluice.',
    evolution: 'Pre-dam: village neeruganti distribution by word of mouth → post-Hidkal: engineered canals, but the customary turns remain spoken law.',
    beginner: 'A river that taught villages arithmetic before school did — its water turns were the community\'s shared timetable.',
    reels: ['reel-1974-bayalata'],
  },
  {
    id: 'idm-swaraj', aliases: ['Swaraj', 'Swa-raj'], type: 'idiom', era: '1905–1947 rallying cry',
    region: 'All-India freedom movement',
    literal: 'Sanskrit/Hindi: sva "self" + rāj "rule" — self-rule.',
    cultural: 'Not just overthrowing the British but teaching Indians to govern their own villages, cotton and consciences. In 1924 it meant running a Congress so orderly that the empire looked untidy.',
    evolution: 'Colonial slogan → post-1947 shorthand for decentralised village democracy (Gandhi\'s "gram swaraj").',
    beginner: 'Swaraj means "we rule ourselves" — and for the speaker in 1924, it started with spinning your own cloth and cleaning your own well.',
    reels: ['reel-1924-belgaum'],
  },
  {
    id: 'idm-satyagraha', aliases: ['Satyagraha', 'Satyagrahi', 'Satyagrahis'], type: 'idiom', era: 'Coined 1906, South Africa',
    region: 'All-India freedom movement',
    literal: 'Sanskrit: satya "truth" + graha "holding fast" — truth-force.',
    cultural: 'The discipline of refusing injustice without hating the opponent — picketing, jail-going, spinning. To elders, calling someone "a satyagrahi" was a certificate of character.',
    evolution: 'Movement weapon (1906–1947) → later moral shorthand used by civil-rights leaders worldwide — Martin Luther King read Gandhi, and "satyagraha" entered English dictionaries.',
    beginner: 'Satyagraha means fighting unfairness with stubborn truth instead of fists — you "hold fast to what is true".',
    reels: ['reel-1924-belgaum'],
  },
  {
    id: 'idm-swadeshi', aliases: ['Swadeshi'], type: 'idiom', era: '1905 onward',
    region: 'All-India freedom movement',
    literal: 'Sanskrit: sva "own" + dēśa "country" — "of one\'s own country".',
    cultural: 'The daily economics of patriotism: buy village cloth, refuse foreign salt, spin at evening meetings. The 1924 session in Belgaum turned it into a membership rule — spin two thousand yards a month or forfeit your vote.',
    evolution: 'Independence-era boycott movement → survives in modern "vocal for local" and khadi fashion revivals.',
    beginner: 'Swadeshi is the ancestor of "buy local, build local" — with the twist that not buying foreign cloth was once an act of courage.',
    reels: ['reel-1924-belgaum'],
  },
  {
    id: 'idm-vande-mataram', aliases: ['Vande Mataram', 'Bande Mataram', 'Vandē Mātaram'], type: 'idiom', era: 'Novel 1882; anthem-adjacent 1905+',
    region: 'All-India freedom movement',
    literal: 'Sanskrit/Bengali: "I bow to thee, Mother (land)".',
    cultural: 'The shout that assembled crowds before microphones existed — at flag hoistings, in jail yards, at Congress closes. Volunteers of the Seva Dal sang it at the 1924 flag lowering, three languages deep.',
    evolution: 'Novel chant (Chatterji\'s Anandamath) → national song (1950, Congress session variant shortened) → still sung at state openings including Karnataka Rajyotsava.',
    beginner: 'It\'s the oldest "thank you, homeland" chorus in Indian politics — one line, sung when a crowd must become one crowd.',
    reels: ['reel-1924-belgaum', 'reel-1956-unification'],
  },
  {
    id: 'idm-suvarna', aliases: ['Suvarna Karnataka', 'Suvarna'], type: 'idiom', era: 'Popularised with unification, 1956',
    region: 'Karnataka',
    literal: 'Kannada: suvarṇa "golden".',
    cultural: 'A promise more than a slogan: that the united State would be golden by the labour of its farmers, weavers and teachers — not by palace gold. Radio announcers repeated it until children thought the State was literally gilded.',
    evolution: 'Unification-era aspiration → 2000s official branding "Suvarna Karnataka" development schemes.',
    beginner: '"Golden Karnataka" was the elders\' way of saying: now that we are one, let the work shine.',
    reels: ['reel-1956-unification'],
  },
  {
    id: 'idm-naadu', aliases: ['Naadu', 'Nāḍu', 'namma naadu'], type: 'dialect', era: 'Evergreen',
    region: 'Karnataka',
    literal: 'Kannada: nāḍu — land, country, homeland, village all at once.',
    cultural: 'The most emotionally loaded syllable in the language: hear "namma naadu" ("our land") and you hear belonging, grief and responsibility braided into one word. Radio announcers wrote unification speeches just to earn the right to say it twice.',
    evolution: 'Village usage → unification-movement keyword → prefix of countless slogans and programmes (Namma Naadu, Nadu Habba...).',
    beginner: 'Naadu means "my land" the way "home" and "homeland" are said at the same time.',
    reels: ['reel-1956-unification', 'reel-1974-bayalata'],
  },
  {
    id: 'idm-jaagate', aliases: ['Jaagate', 'jagathe', 'Jaagatē'], type: 'dialect', era: 'Folk stage usage',
    region: 'North Karnataka',
    literal: 'Kannada idiom: "to keep the wake / hold the night-watch".',
    cultural: 'Used by folk troupes for the all-night performance itself: the story must run until dawn, and the audience\'s staying awake is part of the art. In this reel the recordist adopts the word as the show\'s title.',
    evolution: 'Vigil/temple-fair usage → folk-theatre jargon for night-long shows (Bayalata tradition).',
    beginner: 'Jaagate is when the whole village agrees tonight sleep can wait — the play comes first.',
    reels: ['reel-1974-bayalata'],
  },
  {
    id: 'idm-jola', aliases: ['Jowar', 'jowar', 'Jola', 'jolada', 'jolada rotti'], type: 'dialect', era: 'Agrarian Deccan, centuries old',
    region: 'North Karnataka',
    literal: 'Kannada jōḷa / Hindi jowār — sorghum, the rain-fed millet of the Deccan.',
    cultural: 'The staple that carries the Deccan: jolada rotti on festival plates, fodder for Dollu drummers\' strength, and the surety a farmer pledged to a canal turn. In folk speech, calling a meal "jowar" meant calling it honest.',
    evolution: 'Predates irrigation culture → still the core crop of unirrigated north Karnataka despite cash-crop waves.',
    beginner: 'Jowar (Kannada: Jola) is the sorghum millet — the everyday hero grain of north Karnataka bread.',
    reels: ['reel-1974-bayalata', 'reel-1956-unification'],
  },
  {
    id: 'idm-harake', aliases: ['Harake', 'haraké', 'harake hākko'], type: 'idiom', era: 'Evergreen folk practice',
    region: 'Karnataka',
    literal: 'Kannada: a vow (to a deity) with a promised offering.',
    cultural: 'How villagers sign contracts with the sacred: "if my son passes, a new roof for the shrine." In this reel, an elder\'s harake binds canal-water luck to his sons\' literacy — folklore writing a development agenda.',
    evolution: 'Temple-vow practice → survives as everyday speech ("harake hākko" = to pledge hard).',
    beginner: 'A harake is a promise made to the gods — with a gift promised in return, so it must be kept.',
    reels: ['reel-1974-bayalata'],
  },
  {
    id: 'idm-community-set', aliases: ['Community set', 'community viewing', 'community television set'], type: 'idiom', era: 'SITE era, 1975–76',
    region: 'Rural India',
    literal: 'One television set, owned by the panchayat or a school, watched by the lane.',
    cultural: 'SITE-era social invention: the TV arrived before the TV owner. Crowds of two hundred to one bulb produced an unplanned public sphere — a debating society with a broadcast schedule.',
    evolution: 'SITE/Kheda practice → cable-era "community TV" → legacy lives on in panchayat screens and village-square projections.',
    beginner: 'Before homes had TVs, a whole village shared one — most people\'s first television was the neighbour\'s courtyard.',
    reels: ['reel-1984-site'],
  },
  {
    id: 'ins-seva-dal', aliases: ['Seva Dal', 'Congress Seva Dal', 'the Dal'], type: 'institution', era: 'Founded 1920s',
    region: 'All-India Congress',
    literal: '"Service corps" — the volunteer brigade of the Congress.',
    cultural: 'The uniformed young volunteers who marshalled the 1924 Belgaum session: cooked camp kitchens, kept khadi stalls, taught pledge-writing. Discipline as patriotism — the session ran on their shoulders.',
    evolution: 'Congress sessions volunteer corps → adult & children wings (Hindustani Seva Dal) continuing volunteer training camps.',
    beginner: 'Think of the Seva Dal as the freedom movement\'s student-volunteer army — the ones who made giant rallies actually work.',
    reels: ['reel-1924-belgaum'],
  },
  {
    id: 'ins-akashvani', aliases: ['Akashvani', 'Aakashvani', 'All India Radio'], type: 'institution', era: 'Radio since 1936',
    region: 'India',
    literal: 'Sanskrit/Hindi: "voice from the sky" (ākāśa-vāṇī) — the poetic legal name of All India Radio.',
    cultural: 'The institution that gave India its common evening: news in fifteen languages, farm bulletins, Rajyotsava songs. For the 1956 unification, the Dharwad and Mysore studios were the ceremony\'s true town square.',
    evolution: 'AIR (1936) → the name Akashvani adopted (1957) → still India\'s public radio, now with digital and podcast arms.',
    beginner: 'Akashvani is All India Radio\'s beautiful other name — "the voice from the sky".',
    reels: ['reel-1956-unification', 'reel-1984-site'],
  },
  {
    id: 'ins-dd', aliases: ['Doordarshan', 'Door Darshan', 'Doordarshan Kendra', 'DD Kendra'], type: 'institution', era: 'TV since 1959',
    region: 'India',
    literal: 'Sanskrit/Hindi: "television", literally "distant-sight" (dūra-darśan).',
    cultural: 'The box that brought the nation\'s face to villages — SITE, Krishi Darshan, the SITE generation\'s science habits. The Bangalore Kendra of the 1980s narrated the satellite story in Kannada.',
    evolution: 'Delhi service 1959 → national expansion 1982–84 (colour, INSAT) → Prasar Bharati autonomy (1997); Kendras now stream online.',
    beginner: 'Doordarshan was India\'s public TV — for many villages, the first screen that showed them their own country.',
    reels: ['reel-1984-site'],
  },
  {
    id: 'ins-krishi-darshan', aliases: ['Krishi Darshan', 'Krishi Darśan'], type: 'institution', era: 'Since 26 Jan 1967',
    region: 'Delhi + relay states',
    literal: 'Hindi: "agriculture-viewing" — the farm-advice television programme.',
    cultural: 'India\'s longest-running farm broadcast: seed advisories, pest warnings, and the first place a farmer saw a new tool demonstrated — not just read about. Under SITE it was scheduled around ploughing hours, not prime time.',
    evolution: 'Started for 80 village sets → SITE broadcasts → now over 1800 episodes and multi-platform.',
    beginner: 'Krishi Darshan is TV that helped farmers farm — imagine weather and seed advice beamed to the village square.',
    reels: ['reel-1984-site'],
  },
  {
    id: 'tech-site', aliases: ['SITE', 'Satellite Instructional Television Experiment'], type: 'tech', era: '1 Aug 1975 – 31 Jul 1976',
    region: '2,400 villages, 6 States',
    literal: 'The Satellite Instructional Television Experiment — broadcasting via NASA\'s ATS-6 satellite "lent" to India.',
    cultural: 'The world\'s largest satellite-for-education experiment of its decade: instructional TV in four hours daily for villages with no electricity mains and no TV owners. It made "the sky mirror" a household object and seeded India\'s satellite policy.',
    evolution: 'ATS-6 loan (1975-76) → INSAT satellites took over transmissions (1983+) → today\'s education channels are its grandchildren.',
    beginner: 'SITE was India testing satellite TV lessons for village children and farmers, using a borrowed American satellite for one year.',
    reels: ['reel-1984-site'],
  },
  {
    id: 'tech-insat', aliases: ['INSAT', 'INSAT-1B', 'INSAT series'], type: 'tech', era: 'INSAT-1A 1982; INSAT-1B 1983',
    region: 'Indian space programme',
    literal: 'Indian National SAtellite system — India\'s multipurpose geostationary fleet (TV, telecom, weather).',
    cultural: 'The workhorse that made SITE-era promises permanent: national TV direct-to-receiver, monsoon watching, phone calls home. INSAT-1B, deployed from the Space Shuttle Challenger (1983), was the fleet\'s busiest bird for a decade.',
    evolution: 'INSAT-1 generation (1982-83) → fleets 2,3,4 → services absorbed by GSAT series and commercial transponders.',
    beginner: 'INSAT is India\'s satellite toolbox — one spacecraft family that delivered TV, weather and phone service.',
    reels: ['reel-1984-site'],
  },
  {
    id: 'tech-aryabhata', aliases: ['Aryabhata', 'Aryabhatta'], type: 'tech', era: 'Launched 19 April 1975',
    region: 'Indian space programme',
    literal: 'Named for the 5th-century astronomer-mathematician — India\'s first indigenously built satellite.',
    cultural: 'The nation\'s proof-of-concept: a 360-kg monument "made in India" that gave the SITE generation the confidence the sky was buildable, not just borrowable.',
    evolution: 'Launched from a Soviet launch site (1975) → operated to 1981 → its name carried forward on later missions and institutions.',
    beginner: 'Aryabhata was India\'s first home-built satellite — named for an ancient astronomer, flying while SITE taught villages under it.',
    reels: ['reel-1984-site'],
  },
  {
    id: 'trd-khadi', aliases: ['Khadi', 'Khadhi', 'khadi cloth'], type: 'tradition', era: 'Movement cloth 1918 →',
    region: 'All-India',
    literal: 'Hand-spun, hand-woven cotton cloth.',
    cultural: 'Cloth as conscience: wearing khadi paid a wage to the village weaver and refused one job to the mill city. At Belgaum 1924, khadi was not costume but currency — volunteers traded work in yards of yarn.',
    evolution: 'Freedom-movement uniform → khadi-certified outlets in every town → today\'s slow-fashion and worker-cooperative revival.',
    beginner: 'Khadi is cloth spun by hand on a charkha — in 1924, wearing it meant you were also helping someone eat.',
    reels: ['reel-1924-belgaum', 'reel-1956-unification'],
  },
  {
    id: 'trd-charkha', aliases: ['Charkha', 'charkha wheel', 'charaka'], type: 'tradition', era: 'Centuries old; iconic 1918–1947',
    region: 'All-India',
    literal: 'The spinning wheel — domestic cotton-to-yarn tool.',
    cultural: 'Gandhi re-routed it from household chore to portable politics: a wheel in every home meant the poor had paid work and the movement had a daily discipline. Meetings opened with spinning; jails rang with it.',
    evolution: 'Household tool → movement icon (Congress flag, pre-1931, bore a charkha) → faded post-1947 → revive now as heritage craft and meditation aid.',
    beginner: 'A charkha is a spinning wheel — in the 1920s it was both a tool to make thread and a symbol saying "we thought of the weaver first".',
    reels: ['reel-1924-belgaum'],
  },
  {
    id: 'trd-bayalata', aliases: ['Bayalata', 'Bayalāṭa', 'Bayalaata', 'bayalu aata'], type: 'tradition', era: 'Centuries old',
    region: 'North Karnataka',
    literal: 'Kannada: "open-ground play" (bayalu "open air" + āṭa "play").',
    cultural: 'The people\'s theatre that owes nobody a ticket price: performed on temple grounds after harvest, all night, with the community as the only sponsor. Its songs carry local histories that no court ever recorded.',
    evolution: 'Temple-fair performance → jingling troupes touring taluks → today documented festivals; several troupes digitize audio now.',
    beginner: 'Bayalata is open-air all-night folk theatre — part play, part concert, part community meeting.',
    reels: ['reel-1974-bayalata'],
  },
  {
    id: 'trd-sannata', aliases: ['Sannata', 'Sannatā', 'sannathas'], type: 'dialect', era: 'Bayalata convention',
    region: 'North Karnataka',
    literal: 'Kannada diminutive: roughly "the little ones / small fellows".',
    cultural: 'The comedy chorus of Bayalata — a stack of clown-servants who parody the hero, puncture pomposity and say the village\'s dangerous truths. Elders claim you can date a troupe by how sly its Sannata is.',
    evolution: 'Court-jester lineage absorbed into folk stage → now the signature comic beat audiences wait for.',
    beginner: 'The Sannata is Bayalata\'s joke crew — the "little" characters who tell the big truth.',
    reels: ['reel-1974-bayalata'],
  },
  {
    id: 'trd-dollu', aliases: ['Dollu', 'Dollu Kunitha', 'dollu drum'], type: 'tradition', era: 'Old harvest dance',
    region: 'North Karnataka (Kuruba community)',
    literal: 'The dollu: a heavy barrel drum hung on the shoulder and beaten standing.',
    cultural: 'Ritual thunder of the Kuruba community\'s thanksgiving dance (Dollu Kunitha): a dozen dancers beating barrel-tall drums until the ground forgets its own name. In this 1974 reel the Dollu is heard "borrowed from the neighbouring troupe" — arts trade, not rivalry.',
    evolution: 'Village thanksgiving rite → state cultural festivals → taught in school heritage wings.',
    beginner: 'Dollu Kunitha is a drumming dance — imagine dancing with a drum as tall as your knee strapped across you.',
    reels: ['reel-1974-bayalata'],
  },
  {
    id: 'trd-neeruganti', aliases: ['Neeruganti', 'nīruganti', 'Neeraganti'], type: 'tradition', era: 'Old canal commons',
    region: 'North Karnataka (Kalyana & irrigation belts)',
    literal: 'Kannada: the "water-turn caller" (nīru "water" — one who keeps the count).',
    cultural: 'The hereditary distributor of canal water: he decides whose field drinks today. Neither boss nor landlord, he enforced a shared timetable by reputation alone. This reel captures a son remembering the post with an officer\'s respect.',
    evolution: 'Customary commons office → reduced by dam engineering → now studied by commons scholars and revived by water-user associations.',
    beginner: 'The Neeruganti was the village\'s fair-share keeper for water — his word was the irrigation timetable.',
    reels: ['reel-1974-bayalata'],
  },
  {
    id: 'ev-ekikarana', aliases: ['Ekikarana', 'Ekikaraṇa', 'unification', 'Kannada unification'], type: 'event', era: 'Movement 1900s → 1 Nov 1956',
    region: 'Karnataka',
    literal: 'Kannada: "making one" — the unification of Kannada-speaking lands.',
    cultural: 'A fifty-year people\'s campaign to erase colonial borders that had split one language across four Governments. Radio, poetry, and processions carried the word until the map obeyed.',
    evolution: 'Aluru\'s Karnataka movement (1900s) → linguistic-states consensus → States Reorganisation Act (1956) → annual Ekikarana Day (1 Nov).',
    beginner: 'Ekikarana = "Uniting": the story of how Kannada-speaking lands in four different states became one Karnataka.',
    reels: ['reel-1956-unification'],
  },
  {
    id: 'ev-rajyotsava', aliases: ['Rajyotsava', 'Kannada Rajyotsava', 'Rājyōtsava'], type: 'event', era: 'Annually, 1 November (since 1956)',
    region: 'Karnataka',
    literal: 'Sanskrit-Kannada: "state festival" (rājya "state" + utsava "festival").',
    cultural: 'The state\'s birthday-festival: flag-hoistings at every school, new-year honours, red-gold bunting — and old radio reels like ours, replayed to remember the morning the borders changed.',
    evolution: 'Unification Day (1956) → renamed Rajyotsava after Karnataka renamed (1973) → now also celebrates the language with awards.',
    beginner: 'Kannada Rajyotsava is Karnataka\'s birthday party every 1 November — with flags, songs and school sweets.',
    reels: ['reel-1956-unification'],
  },
];

/** Fast lookup: normalized alias string → dictionary entry */
const byAlias = new Map();
for (const entry of DICTIONARY) {
  for (const alias of entry.aliases) {
    byAlias.set(alias.toLowerCase(), entry);
  }
}

export function lookupTerm(aliasLower) {
  return byAlias.get(aliasLower) || null;
}

export const ENTRIES_BY_ID = Object.fromEntries(DICTIONARY.map((e) => [e.id, e]));
