/**
 * Curated entity gazetteer (people & events) + hand-curated edges that the
 * knowledge graph layers on top of automatic reel→entity mentions.
 * Node ids here and in the cultural dictionary share one graph namespace:
 *   g-*  gazetteer entities    dv-*  dictionary entries    r-*  reels
 */
export const GAZETTEER = [
  {
    id: 'g-gandhi', label: 'Mahatma Gandhi', type: 'person', era: '1869–1948',
    aliases: ['Bapuji', 'Mahatma Gandhi', 'Gandhiji', 'Bapu', 'M.K. Gandhi', 'Mahatmaji'],
    desc: 'Led the mass phase of India\'s freedom movement through Satyagraha and constructive work (khadi, village reform). Presided over the 1924 Belgaum Congress — the only Congress session he ever chaired.',
  },
  {
    id: 'g-kasturba', label: 'Kasturba Gandhi', type: 'person', era: '1869–1944',
    aliases: ['Kasturba', 'Kasturba Gandhi', 'Ba'],
    desc: 'Freedom worker in her own right; organized women\'s picketing, khadi drives and ashram schools whose spindle collections reached camps like the one at Belgaum 1924.',
  },
  {
    id: 'g-deshpande', label: 'Gangadharrao Deshpande', type: 'person', era: '1871–1960',
    aliases: ['Gangadharrao Deshpande', 'Deshpande', 'Lion of Karnataka', 'Gangadhar Rao Deshpande'],
    desc: 'Veteran freedom leader of Belgaum honored in these reels as "the Lion of Karnataka"; anchored the reception effort for the 1924 Congress session on his home ground.',
  },
  {
    id: 'g-naidu', label: 'Sarojini Naidu', type: 'person', era: '1879–1949',
    aliases: ['Sarojini Naidu', 'Naidu'],
    desc: 'Poet and Congress leader, famed as an orator of the movement; her press-table warmth enlivened the 1924 Belgaum sessions reels.',
  },
  {
    id: 'g-alur', label: 'Aluru Venkata Rao', type: 'person', era: '1866–1955',
    aliases: ['Aluru Venkata Rao', 'Alur Venkatrao', 'Aluru Venkat Rao', 'Alur'],
    desc: 'Historian-editor who gave the unification movement its emotional vocabulary — hailed as Karnataka Kulapurohita ("high priest of Karnataka") for weaving Kannada lands into one imagined home.',
  },
  {
    id: 'g-kuvempu', label: 'Kuvempu', type: 'person', era: '1904–1994',
    aliases: ['Kuvempu', 'Kuppali Venkatappagowda Puttappa', 'Puttappa'],
    desc: 'Rashtrakavi Kuvempu — the national poet of Kannada; his ode "Bharata Jananiya Tanujate" later became the State song. His unification-era greetings read on Akashvani gave the new map a voice.',
  },
  {
    id: 'g-bendre', label: 'Da Ra Bendre', type: 'person', era: '1896–1986',
    aliases: ['Bendre', 'D R Bendre', 'D.R. Bendre', 'Bendre of Dharwad', 'Ambikatanayadatta'],
    desc: 'Jnanpith-laureate poet of Dharwad who wrote under the pen name Ambikatanayadatta; his recorded unification message on the 1956 reel is the archive\'s most quoted line.',
  },
  {
    id: 'g-sarabhai', label: 'Vikram Sarabhai', type: 'person', era: '1919–1971',
    aliases: ['Vikram Sarabhai', 'Sarabhai', 'Dr Vikram Sarabhai'],
    desc: 'Father of the Indian space programme; founded INCOSPAR/ISRO and insisted satellites serve village education — the conviction SITE was built on.',
  },
  {
    id: 'g-urrao', label: 'U R Rao', type: 'person', era: '1932–2017',
    aliases: ['U R Rao', 'U.R. Rao', 'Prof U R Rao', 'Professor Rao'],
    desc: 'Space scientist who project-directed the SITE experiment in 1975-76 and later chaired ISRO; his guest appearance on the 1984 reel carries the experiment\'s folk memory.',
  },
  {
    id: 'g-inc1924', label: '1924 Belgaum Congress Session', type: 'event', era: 'December 1924',
    aliases: ['Congress session', 'the Congress', 'Indian National Congress', 'thirty-ninth session', '39th session'],
    desc: 'The 39th session of the Indian National Congress, held at Belgaum with Mahatma Gandhi in the chair — the movement\'s only Gandhi-presided session — run on Seva Dal discipline and khadi economics.',
  },
  {
    id: 'g-reorg1956', label: 'States Reorganisation Act, 1956', type: 'event', era: 'Effective 1 Nov 1956',
    aliases: ['States Reorganisation', 'the Act', 'reorganisation', 'new map'],
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
  person: { ring: '#F59E0B', fill: '#B45309', label: 'Historical Figures' },
  place: { ring: '#22D3EE', fill: '#0E7490', label: 'Locations & Regions' },
  culture: { ring: '#A78BFA', fill: '#6D28D9', label: 'Traditions & Idioms' },
  event: { ring: '#FB7185', fill: '#BE123C', label: 'Historical Events' },
  tech: { ring: '#818CF8', fill: '#4338CA', label: 'Institutions & Technology' },
  reel: { ring: '#34D399', fill: '#047857', label: 'Archival Reels' },
};

export function nodeTypeColor(type) {
  if (type === 'idiom' || type === 'dialect' || type === 'tradition') return NODE_COLORS.culture;
  return NODE_COLORS[type] || NODE_COLORS.culture;
}
