import type { Tone } from '@/lib/categories'

export type SectionId =
  | 'produce' | 'bread' | 'dairy' | 'meat' | 'frozen' | 'dry'
  | 'drinks' | 'snacks' | 'household' | 'personal' | 'other'

/** Rækkefølgen svarer nogenlunde til en tur gennem et dansk supermarked */
export const SECTIONS: { id: SectionId; label: string; tone: Tone }[] = [
  { id: 'produce', label: 'Frugt & grønt', tone: 'good' },
  { id: 'bread', label: 'Brød & bager', tone: 'warn' },
  { id: 'meat', label: 'Kød & fisk', tone: 'accent' },
  { id: 'dairy', label: 'Køl & mejeri', tone: 'info' },
  { id: 'frozen', label: 'Frost', tone: 'info' },
  { id: 'dry', label: 'Tørvarer', tone: 'warn' },
  { id: 'drinks', label: 'Drikkevarer', tone: 'info' },
  { id: 'snacks', label: 'Snacks & slik', tone: 'accent' },
  { id: 'household', label: 'Husholdning', tone: 'muted' },
  { id: 'personal', label: 'Personlig pleje', tone: 'muted' },
  { id: 'other', label: 'Andet', tone: 'muted' },
]

export const SECTION_ORDER: Record<SectionId, number> = Object.fromEntries(SECTIONS.map((s, i) => [s.id, i])) as Record<SectionId, number>

export function getSection(id: string | null | undefined) {
  return SECTIONS.find((s) => s.id === id) ?? SECTIONS[SECTIONS.length - 1]
}

const KEYWORDS: Record<Exclude<SectionId, 'other'>, string[]> = {
  produce: [
    'æble', 'banan', 'pære', 'appelsin', 'clementin', 'mandarin', 'citron', 'lime', 'vindru', 'jordbær', 'blåbær', 'hindbær',
    'melon', 'avocado', 'tomat', 'agurk', 'salat', 'spinat', 'kål', 'broccoli', 'blomkål', 'gulerod', 'gulerødder', 'løg',
    'hvidløg', 'kartof', 'peberfrugt', 'chili', 'squash', 'aubergine', 'champignon', 'svampe', 'porre', 'selleri', 'ingefær',
    'persille', 'basilikum', 'dild', 'koriander', 'purløg', 'mango', 'ananas', 'kiwi', 'frugt', 'grønt', 'rucola', 'radise',
    'majs', 'ærter', 'bønner', 'asparges', 'fennikel', 'rødbede', 'græskar', 'sød kartoffel', 'urter', 'mynte', 'rosmarin', 'timian',
  ],
  bread: ['brød', 'rugbrød', 'franskbrød', 'boller', 'bolle', 'toast', 'bagel', 'croissant', 'kage', 'wienerbrød', 'knækbrød', 'tortilla', 'pita', 'naan', 'rundstyk', 'tebirkes', 'kanelsnegl'],
  dairy: [
    'mælk', 'skyr', 'yoghurt', 'ost', 'smør', 'fløde', 'creme fraiche', 'cremefraiche', 'æg', 'kærnemælk', 'a38', 'ymer',
    'hytteost', 'feta', 'mozzarella', 'parmesan', 'havremælk', 'plantemælk', 'margarine', 'kefir', 'budding', 'tykmælk',
    'koldskål', 'kvark', 'flødeost', 'kiks og ost', 'cheasy', 'philadelphia',
  ],
  meat: [
    'kylling', 'oksekød', 'hakket', 'svinekød', 'bacon', 'pølse', 'skinke', 'laks', 'torsk', 'rejer', 'tun', 'fisk', 'kød',
    'kalkun', 'frikadelle', 'pålæg', 'leverpostej', 'spegepølse', 'salami', 'bøf', 'lam', 'kotelet', 'mørbrad', 'flæsk',
    'medister', 'kebab', 'fiskefrikadelle', 'sild', 'makrel',
  ],
  frozen: ['frost', 'frossen', 'frosne', 'ispind', 'flødeis', 'is ', 'pizza', 'pommes', 'fiskefilet', 'fiskepinde', 'frysepose'],
  dry: [
    'pasta', 'spaghetti', 'ris', 'mel', 'sukker', 'salt', 'havregryn', 'müsli', 'musli', 'cornflakes', 'nudler', 'linser',
    'kikærter', 'dåse', 'ketchup', 'sennep', 'mayo', 'remoulade', 'olie', 'eddike', 'soja', 'krydderi', 'karry', 'paprika',
    'bouillon', 'honning', 'marmelade', 'nutella', 'peanutbutter', 'kaffe', 'te ', 'kakao', 'sauce', 'couscous', 'bulgur',
    'quinoa', 'gær', 'bagepulver', 'vanilje', 'rosiner', 'dadler', 'konserves', 'tomatpure', 'kokosmælk', 'pesto', 'tacos',
    'lasagneplader', 'grød', 'suppe', 'syltet', 'kapers', 'oliven', 'krydder',
  ],
  drinks: ['vand', 'sodavand', 'cola', 'juice', 'saft', 'øl', 'vin', 'danskvand', 'kondi', 'pepsi', 'fanta', 'sprite', 'energidrik', 'red bull', 'kombucha', 'cider', 'smoothie', 'drik'],
  snacks: ['chips', 'slik', 'chokolade', 'kiks', 'popcorn', 'nødder', 'mandler', 'lakrids', 'vingummi', 'småkager', 'snack', 'müslibar', 'bar ', 'karameller', 'peanuts', 'cashew'],
  household: [
    'toiletpapir', 'køkkenrulle', 'opvask', 'vaskemiddel', 'skyllemiddel', 'sæbe', 'rengøring', 'affaldspose', 'skraldepose',
    'poser', 'stanniol', 'sølvpapir', 'bagepapir', 'husholdningsfilm', 'batteri', 'stearinlys', 'fyrfadslys', 'karklud',
    'viskestykke', 'tændstik', 'servietter', 'rengøringsmiddel', 'wc-rens', 'afkalk', 'kattemad', 'hundemad', 'kattegrus', 'ble', 'vådservietter', 'lyspære',
  ],
  personal: ['tandpasta', 'tandbørste', 'shampoo', 'balsam', 'deo', 'barber', 'bind', 'tampon', 'creme', 'solcreme', 'mundskyl', 'vatpinde', 'vat', 'plaster', 'panodil', 'ipren', 'medicin', 'håndsæbe', 'hårprodukt', 'tandtråd', 'læbepomade'],
}

/** Gætter butikssektion ud fra varenavnet (længste match vinder) */
export function detectSection(name: string): SectionId {
  const n = ` ${name.toLowerCase().trim()} `
  let best: { id: SectionId; len: number } | null = null
  for (const [id, words] of Object.entries(KEYWORDS) as [Exclude<SectionId, 'other'>, string[]][]) {
    for (const w of words) {
      if (n.includes(w) && (!best || w.length > best.len)) best = { id, len: w.length }
    }
  }
  return best?.id ?? 'other'
}

export function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}
