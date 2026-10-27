/**
 * Curated entity gazetteer (people & events) + hand-curated edges that the
 * knowledge graph layers on top of automatic reel→entity mentions.
 * Node ids here and in the cultural dictionary share one graph namespace:
 *   g-*  gazetteer entities    dv-*  dictionary entries    r-*  reels
 */
export const GAZETTEER = [
  {
    id: 'g-gandhi', label: 'Mahatma Gandhi', type: 'person', era: '1869–1948',
    region: 'Pan-India',
    aliases: ['Bapuji', 'Mahatma Gandhi', 'Gandhiji', 'Bapu', 'M.K. Gandhi', 'Mahatmaji'],
    literal: 'Mohandas Karamchand Gandhi, revered across the world as "Mahatma" (Great Soul).',
    cultural: 'Led the mass phase of India\'s freedom movement through Satyagraha and constructive work (khadi, village reform). Presided over the 1924 Belgaum Congress — the only Congress session he ever chaired.',
    evolution: 'South African civil rights campaigns (1893–1914) → Non-Cooperation and Salt Satyagraha → Father of the Nation.',
    beginner: 'The leader of India\'s non-violent independence struggle, affectionately called Bapu by millions.',
    desc: 'Led the mass phase of India\'s freedom movement through Satyagraha and constructive work (khadi, village reform). Presided over the 1924 Belgaum Congress — the only Congress session he ever chaired.',
  },
  {
    id: 'g-kasturba', label: 'Kasturba Gandhi', type: 'person', era: '1869–1944',
    region: 'Gujarat / Pan-India',
    aliases: ['Kasturba', 'Kasturba Gandhi', 'Ba'],
    literal: 'Kasturba Mohandas Gandhi, affectionately revered across the movement as "Ba" (Mother).',
    cultural: 'Freedom worker and leader in her own right; organized women\'s picketing, khadi drives and ashram schools whose spindle collections reached camps like the one at Belgaum 1924.',
    evolution: 'Pioneer of women\'s participation in Indian satyagraha → Imprisoned multiple times for civil disobedience → Memorialized in the Kasturba National Memorial Trust.',
    beginner: 'A fearless freedom fighter and Gandhi\'s partner, who led protests and mobilized women across India.',
    desc: 'Freedom worker in her own right; organized women\'s picketing, khadi drives and ashram schools whose spindle collections reached camps like the one at Belgaum 1924.',
  },
  {
    id: 'g-deshpande', label: 'Gangadharrao Deshpande', type: 'person', era: '1871–1960',
    region: 'Belgaum (Belagavi), Karnataka',
    aliases: ['Gangadharrao Deshpande', 'Deshpande', 'Lion of Karnataka', 'Gangadhar Rao Deshpande'],
    literal: '"Karnataka Kesari" — the Lion of Karnataka, chief organizer of the national movement in North Karnataka.',
    cultural: 'Veteran freedom leader of Belgaum who brought Tilak and Gandhi together; anchored the massive reception effort for the 1924 Congress session on his home ground.',
    evolution: 'Tilakite nationalist → Close disciple of Gandhi → Founded Hudli Khadi ashram near Belgaum.',
    beginner: 'The leading freedom fighter of Belgaum who organized the famous 1924 national Congress session in Karnataka.',
    desc: 'Veteran freedom leader of Belgaum honored in these reels as "the Lion of Karnataka"; anchored the reception effort for the 1924 Congress session on his home ground.',
  },
  {
    id: 'g-naidu', label: 'Sarojini Naidu', type: 'person', era: '1879–1949',
    region: 'Hyderabad / Pan-India',
    aliases: ['Sarojini Naidu', 'Naidu', 'Nightingale of India'],
    literal: 'Sarojini Naidu (née Chattopadhyay), acclaimed as the "Nightingale of India" (Bharat Kokila).',
    cultural: 'Renowned lyric poet, eloquent orator, and foremost woman leader of the Indian national movement; elected Congress President in 1925 and later became India\'s first female Governor.',
    evolution: 'Celebrated poet in English → Leader of the Salt Satyagraha → First woman Governor of Uttar Pradesh.',
    beginner: 'A brilliant poet and orator who became one of India\'s most influential freedom struggle leaders.',
    desc: 'Poet and Congress leader, famed as an orator of the movement; her press-table warmth enlivened the 1924 Belgaum sessions reels.',
  },
  {
    id: 'g-alur', label: 'Aluru Venkata Rao', type: 'person', era: '1866–1955',
    region: 'Dharwad, Karnataka',
    aliases: ['Aluru Venkata Rao', 'Alur Venkatrao', 'Aluru Venkat Rao', 'Alur'],
    literal: 'Hailed as "Karnataka Kulapurohita" (the high priest / guardian ancestor of Karnataka).',
    cultural: 'Historian-editor who gave the Karnataka unification movement its emotional and historical vocabulary through his seminal 1907 work "Karnataka Gatha Vaibhava".',
    evolution: 'Rediscovered Vijayanagara ruins at Hampi (1905) → Sparked linguistic unification campaign → Lived to see the unification resolution pass.',
    beginner: 'The historian-writer whose inspiring books motivated Kannada speakers to unite into a single state.',
    desc: 'Historian-editor who gave the unification movement its emotional vocabulary — hailed as Karnataka Kulapurohita ("high priest of Karnataka") for weaving Kannada lands into one imagined home.',
  },
  {
    id: 'g-kuvempu', label: 'Kuvempu', type: 'person', era: '1904–1994',
    region: 'Shimoga / Mysore, Karnataka',
    aliases: ['Kuvempu', 'Kuppali Venkatappagowda Puttappa', 'Puttappa'],
    literal: 'Kuppali Venkatappagowda Puttappa, writing under the pen name "Kuvempu"; first Kannada writer to receive the Jnanpith Award.',
    cultural: 'Rashtrakavi Kuvempu — the national poet of Kannada; his anthem "Jaya Bharata Jananiya Tanujate" became the official State song. His unification-era broadcasts gave the new state its moral imagination.',
    evolution: 'Pioneered universal humanist literature (Vishwa Manava) → Vice-Chancellor of Mysore University → Honored as Karnataka Ratna.',
    beginner: 'Karnataka\'s most beloved poet, who composed the state anthem and championed human equality.',
    desc: 'Rashtrakavi Kuvempu — the national poet of Kannada; his ode "Bharata Jananiya Tanujate" later became the State song. His unification-era greetings read on Akashvani gave the new map a voice.',
  },
  {
    id: 'g-bendre', label: 'Da Ra Bendre', type: 'person', era: '1896–1986',
    region: 'Dharwad, Karnataka',
    aliases: ['Bendre', 'D R Bendre', 'D.R. Bendre', 'Bendre of Dharwad', 'Ambikatanayadatta'],
    literal: 'Dattatreya Ramachandra Bendre, writing as "Ambikatanayadatta" (Ambika\'s son Datta); Jnanpith laureate.',
    cultural: 'Master lyric poet of Dharwad who turned folk speech into timeless metaphysical and patriotic verses. His recorded message on the 1956 unification reel is the archive\'s most quoted broadcast.',
    evolution: 'Jailed for his patriotic poem "Narabali" (1932) → Jnanpith Award for "Naku Tanti" (1973) → Revered voice of modern Kannada lyricism.',
    beginner: 'A legendary poet of Dharwad known for his musical folk verses and moving unification messages.',
    desc: 'Jnanpith-laureate poet of Dharwad who wrote under the pen name Ambikatanayadatta; his recorded unification message on the 1956 reel is the archive\'s most quoted line.',
  },
  {
    id: 'g-sarabhai', label: 'Vikram Sarabhai', type: 'person', era: '1919–1971',
    region: 'Ahmedabad / Thumba / Bangalore',
    aliases: ['Vikram Sarabhai', 'Sarabhai', 'Dr Vikram Sarabhai'],
    literal: 'Dr. Vikram Ambalal Sarabhai, widely revered as the "Father of the Indian Space Programme".',
    cultural: 'Visionary physicist who founded ISRO and insisted that satellite technology must leapfrog poverty and directly educate remote villages — the foundational premise of the 1975 SITE satellite experiment.',
    evolution: 'Founded Physical Research Laboratory (1947) → Launched India\'s first rocket at Thumba (1963) → Conceived the Satellite Instructional Television Experiment (SITE).',
    beginner: 'The visionary scientist who created India\'s space programme and used satellites to bring education to rural villages.',
    desc: 'Father of the Indian space programme; founded INCOSPAR/ISRO and insisted satellites serve village education — the conviction SITE was built on.',
  },
  {
    id: 'g-urrao', label: 'U R Rao', type: 'person', era: '1932–2017',
    region: 'Udupi / Bangalore, Karnataka',
    aliases: ['U R Rao', 'U.R. Rao', 'Prof U R Rao', 'Professor Rao'],
    literal: 'Prof. Udupi Ramachandra Rao, internationally distinguished space scientist and former Chairman of ISRO.',
    cultural: 'Project Director for Aryabhata (India\'s first satellite, 1975) and key architect of the SITE ground-reception arrays in Karnataka villages, carrying the project\'s institutional memory.',
    evolution: 'Cosmic ray physicist with NASA → Built Aryabhata satellite (1975) → Chaired ISRO (1984–1994) directing the launch of INSAT and PSLV.',
    beginner: 'The space pioneer who led the building of India\'s first satellite, Aryabhata.',
    desc: 'Space scientist who project-directed the SITE experiment in 1975-76 and later chaired ISRO; his guest appearance on the 1984 reel carries the experiment\'s folk memory.',
  },
  {
    id: 'g-inc1924', label: '1924 Belgaum Congress Session', type: 'event', era: 'December 1924',
    region: 'Belgaum (Belagavi), Karnataka',
    aliases: ['Congress session', 'the Congress', 'Indian National Congress', 'thirty-ninth session', '39th session'],
    literal: 'The 39th plenary session of the Indian National Congress, held at Tilakwadi, Belgaum.',
    cultural: 'The historic annual convention of the national movement and the only session ever presided over by Mahatma Gandhi. Featured the iconic Vijayanagara-styled Gopuram entrance and introduced khadi and village industry mandates.',
    evolution: 'December 1924 historic session → Cemented Karnataka\'s vanguard role in the freedom struggle → Site today commemorates Gandhi Smarak.',
    beginner: 'The famous December 1924 independence meeting in Belgaum, the only one Mahatma Gandhi ever chaired.',
    desc: 'The 39th session of the Indian National Congress, held at Belgaum with Mahatma Gandhi in the chair — the movement\'s only Gandhi-presided session — run on Seva Dal discipline and khadi economics.',
  },
  {
    id: 'g-reorg1956', label: 'States Reorganisation Act, 1956', type: 'event', era: 'Effective 1 Nov 1956',
    region: 'Pan-India / Karnataka',
    aliases: ['States Reorganisation', 'the Act', 'reorganisation', 'new map'],
    literal: 'A major legislative reform that reorganized India\'s states and territories along linguistic lines.',
    cultural: 'Dismantled colonial administrative borders (Bombay Presidency, Madras Presidency, Hyderabad State) and unified dispersed linguistic communities into coherent democratic states, creating the enlarged Mysore State (now Karnataka).',
    evolution: 'Fazal Ali Commission report (1955) → Passed by Parliament (August 1956) → Took effect 1 November 1956 → Formed modern state boundaries.',
    beginner: 'The 1956 law that reorganized Indian state borders by language, giving Kannada speakers a single united state.',
    desc: 'Redrew India\'s internal map on linguistic lines; effective 1 November 1956 it folded Bombay-Karnatak, Hyderabad-Karnatak, Coorg and South Kanara into an enlarged Mysore State — the foundation of today\'s Karnataka.',
  },
];

/**
 * Hand-curated semantic edges (entity ↔ entity). Reel-anchor edges are derived
 * automatically from transcript mentions; these add the historian's layer.
 */
export const CURATED_EDGES = [
  // 1924 — the movement constellation
  ['g-gandhi', 'g-inc1924'], ['g-gandhi', 'trd-khadi'], ['g-gandhi', 'trd-charkha'],
  ['g-gandhi', 'ins-seva-dal'], ['g-gandhi', 'idm-satyagraha'], ['g-gandhi', 'idm-swaraj'],
  ['g-kasturba', 'g-inc1924'], ['g-kasturba', 'trd-khadi'], ['g-kasturba', 'ins-seva-dal'],
  ['g-naidu', 'g-inc1924'], ['g-naidu', 'plc-bombay-presidency'],
  ['g-deshpande', 'g-inc1924'], ['g-deshpande', 'plc-belgaum'],
  ['g-inc1924', 'plc-belgaum'], ['g-inc1924', 'idm-vande-mataram'],
  ['trd-charkha', 'trd-khadi'], ['trd-khadi', 'idm-swadeshi'],
  ['idm-vande-mataram', 'g-inc1924'], ['idm-swaraj', 'g-inc1924'],
  // 1956 — unification constellation
  ['ev-ekikarana', 'g-reorg1956'], ['ev-ekikarana', 'plc-mysore-state'],
  ['ev-ekikarana', 'plc-hyderabad-karnatak'], ['ev-ekikarana', 'plc-belgaum'],
  ['ev-ekikarana', 'g-alur'], ['ev-ekikarana', 'g-kuvempu'], ['ev-ekikarana', 'g-bendre'],
  ['ev-rajyotsava', 'ev-ekikarana'], ['ev-rajyotsava', 'ins-akashvani'],
  ['g-alur', 'plc-dharwar'], ['g-bendre', 'plc-dharwar'], ['g-kuvempu', 'plc-mysore-state'],
  ['plc-belgaum', 'plc-bombay-presidency'], ['plc-belgaum', 'plc-dharwar'],
  ['idm-naadu', 'g-kuvempu'], ['idm-naadu', 'g-bendre'],
  // 1974 — folk commons
  ['trd-bayalata', 'trd-sannata'], ['trd-bayalata', 'idm-jaagate'],
  ['trd-bayalata', 'plc-belgaum'], ['trd-dollu', 'trd-bayalata'],
  ['trd-neeruganti', 'plc-ghataprabha'], ['idm-jola', 'trd-neeruganti'],
  ['idm-jola', 'trd-bayalata'], ['idm-harake', 'trd-neeruganti'],
  ['plc-ghataprabha', 'plc-belgaum'],
  // 1984 — broadcast sky-mirror
  ['tech-site', 'g-sarabhai'], ['tech-site', 'g-urrao'], ['tech-site', 'tech-aryabhata'],
  ['tech-site', 'tech-insat'], ['tech-site', 'idm-community-set'], ['tech-site', 'ins-krishi-darshan'],
  ['g-sarabhai', 'tech-aryabhata'], ['g-urrao', 'tech-insat'], ['tech-insat', 'tech-aryabhata'],
  ['ins-akashvani', 'tech-site'], ['ins-dd', 'ins-krishi-darshan'], ['ins-dd', 'tech-insat'],
  ['ins-dd', 'plc-mysore-state'], ['ins-akashvani', 'plc-dharwar'],
];

/** Node-type palette (matches the color-coded spec + reels in emerald). */
export const NODE_COLORS = {
  person: { ring: '#D97706', fill: '#92400E', label: 'Historical Figures' },
  place: { ring: '#0891B2', fill: '#155E75', label: 'Locations & Regions' },
  culture: { ring: '#7C3AED', fill: '#5B21B6', label: 'Traditions & Idioms' },
  event: { ring: '#E11D48', fill: '#9F1239', label: 'Historical Events' },
  tech: { ring: '#4F46E5', fill: '#3730A3', label: 'Institutions & Technology' },
  reel: { ring: '#059669', fill: '#065F46', label: 'Archival Reels' },
};

export function nodeTypeColor(type) {
  if (type === 'idiom' || type === 'dialect' || type === 'tradition') return NODE_COLORS.culture;
  return NODE_COLORS[type] || NODE_COLORS.culture;
}
