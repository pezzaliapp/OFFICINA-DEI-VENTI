/* Officina dei Venti — dataset.

   Gli otto venti italiani della rosa cardinale, con la loro
   geografia, temperamento, prosa e ricetta sonora.

   I nomi non sono tradotti: lo scirocco non si traduce in 'south-east
   wind', il libeccio non è un 'south-west wind'. Sono nomi propri,
   con la loro lingua dentro — araba, greca, latina, libica.

   Convenzioni:
     - gradi: angolo bussola, 0 = N in senso orario
     - temperatura: -1 (gelo alpino) → +1 (deserto in agosto)
     - umidità, salinità, velocità: 0 (assente) → 1 (massimo)
     - tinta: colore guida per l'interfaccia, scelto sul temperamento
     - ricetta: sintetizzata in audio.js — niente registrazioni,
       solo rumore filtrato e modulato in tempo reale.
*/

const WINDS = [

  {
    id: "tramontana",
    nome: "Tramontana",
    abbr: "TRA",
    gradi: 0,
    origine: "Da oltre i monti settentrionali — dalle Alpi e dalla pianura padana.",
    temperamento: { temperatura: -0.70, umidita: 0.10, salinita: 0.10, velocita: 0.70 },
    carattere: ["secco", "freddo", "sferzante"],
    tinta: "#9eb4c1",
    prosa:
      "Soffia da oltremonte, taglia la nebbia, asciuga i panni alle finestre. " +
      "È il vento dei cieli tersi, delle notti senza luna in cui le stelle " +
      "paiono spilli. Quando arriva, le imposte sbattono e gli olivi mostrano " +
      "l'argento del rovescio.",
    memoria:
      "I latini la chiamavano Aquilone, dimora dei venti del nord. " +
      "Per Dante è il vento che spinge i giusti su per il monte del Purgatorio.",
    ricetta: {
      noise: "white",
      highpass: { freq: 600, q: 0.7 },
      bandpass: { freq: 1800, q: 8, lfo: { rate: 0.30, depth: 380 } },
      ampLfo: { rate: 0.55, depth: 0.18, shape: "sine" },
      lfoBase: 0.45,
      attack: 2.6, release: 2.0,
    },
  },

  {
    id: "grecale",
    nome: "Grecale",
    abbr: "GRE",
    gradi: 45,
    origine: "Dalle isole greche, attraverso l'Egeo e l'Adriatico.",
    temperamento: { temperatura: -0.40, umidita: 0.55, salinita: 0.55, velocita: 0.65 },
    carattere: ["freddo", "agitato", "marino"],
    tinta: "#6e8294",
    prosa:
      "Cala dall'Egeo come un coro antico, scuote l'Adriatico, fa cantare le " +
      "sartie. Porta tempeste invernali sul Tirreno e quando si placa il mare " +
      "resta a lungo in collera, lungo le coste di Puglia e di Romagna.",
    memoria:
      "Dal latino graecus: vento da terra di Grecia. Sulle carte portolane " +
      "medievali appare semplicemente come 'Greco'.",
    ricetta: {
      noise: "pink",
      highpass: { freq: 240, q: 0.7 },
      bandpass: { freq: 760, q: 4, lfo: { rate: 0.45, depth: 180 } },
      ampLfo: { rate: 0.42, depth: 0.26, shape: "sine" },
      lfoBase: 0.55,
      attack: 2.4, release: 1.8,
    },
  },

  {
    id: "levante",
    nome: "Levante",
    abbr: "LEV",
    gradi: 90,
    origine: "Dal Vicino Oriente, attraverso lo Ionio e lo Stretto di Messina.",
    temperamento: { temperatura: 0.05, umidita: 0.75, salinita: 0.55, velocita: 0.40 },
    carattere: ["umido", "regolare", "paziente"],
    tinta: "#c69b5a",
    prosa:
      "Viene da dove il sole nasce, costante come una preghiera. Bagna la terra " +
      "senza fretta, porta nuvole basse e regolari, una pioggia paziente. " +
      "I pescatori dello Stretto lo aspettano per scendere verso Messina.",
    memoria:
      "Eurus per i greci, custode dell'aurora. Nelle istruzioni nautiche del " +
      "Rinascimento è il 'vento de la levata'.",
    ricetta: {
      noise: "pink",
      lowpass: { freq: 1300, q: 0.8 },
      ampLfo: { rate: 0.15, depth: 0.20, shape: "sine" },
      lfoBase: 0.60,
      attack: 3.0, release: 2.2,
    },
  },

  {
    id: "scirocco",
    nome: "Scirocco",
    abbr: "SCI",
    gradi: 135,
    origine: "Dal deserto del Sahara, attraverso il Mediterraneo.",
    temperamento: { temperatura: 0.90, umidita: 0.45, salinita: 0.30, velocita: 0.50 },
    carattere: ["caldo", "opaco", "sabbioso"],
    tinta: "#c47a3c",
    prosa:
      "Quando soffia, il cielo diventa lattiginoso e sulle macchine resta una " +
      "polvere rossa portata dal Sahara. Pesa la testa, rallenta i pensieri, " +
      "accende le malinconie d'estate. È il vento sotto cui i normanni cantavano " +
      "e i poeti tacevano.",
    memoria:
      "Dall'arabo šurūq, levante: il vento del sole nascente del mondo arabo. " +
      "I siciliani lo chiamano anche Xaloc.",
    ricetta: {
      noise: "brown",
      lowpass: { freq: 620, q: 0.8 },
      drone: { shape: "sine", freq: 78, gain: 0.06, attack: 5 },
      ampLfo: { rate: 0.08, depth: 0.30, shape: "sine" },
      lfoBase: 0.55,
      attack: 3.5, release: 2.8,
    },
  },

  {
    id: "ostro",
    nome: "Ostro",
    abbr: "OST",
    gradi: 180,
    origine: "Da mezzogiorno, dall'Africa mediterranea.",
    temperamento: { temperatura: 0.65, umidita: 0.70, salinita: 0.50, velocita: 0.40 },
    carattere: ["tiepido", "umido", "sonnolento"],
    tinta: "#b56548",
    prosa:
      "Vento di mezzogiorno, denso e tiepido, sa di mare e di alghe in " +
      "decomposizione. Le vele si gonfiano pigre, le ombre si accorciano. " +
      "È il fratello quieto dello scirocco, fratello pacificato del Notos greco.",
    memoria:
      "Auster per i romani, fratello latinizzato di Notos. Sulle rose dei venti " +
      "del Cinquecento è raffigurato come un vecchio con una brocca rovesciata.",
    ricetta: {
      noise: "brown",
      lowpass: { freq: 820, q: 0.7 },
      drone: { shape: "sine", freq: 110, gain: 0.05, attack: 4 },
      ampLfo: { rate: 0.18, depth: 0.22, shape: "sine" },
      lfoBase: 0.55,
      attack: 3.2, release: 2.4,
    },
  },

  {
    id: "libeccio",
    nome: "Libeccio",
    abbr: "LIB",
    gradi: 225,
    origine: "Dalla Libia, attraverso il Tirreno meridionale.",
    temperamento: { temperatura: 0.40, umidita: 0.65, salinita: 0.85, velocita: 0.90 },
    carattere: ["violento", "ondoso", "irregolare"],
    tinta: "#8b3a4e",
    prosa:
      "Il più mediterraneo dei venti — strappa, sferza, ammonticchia onde. " +
      "Sui golfi tirreni alza le libecciate, mareggiate furiose che schiumano " +
      "contro gli scogli di Genova e di Livorno. Quando si scatena, ogni barca " +
      "cerca un porto.",
    memoria:
      "Dal greco Libykós, dalla Libia. I marinai antichi lo chiamavano anche " +
      "Africo o Garbino. Nelle cronache pisane è il vento più temuto.",
    ricetta: {
      noise: "pink",
      highpass: { freq: 200, q: 0.6 },
      bandpass: { freq: 1400, q: 2, lfo: { rate: 0.35, depth: 220 } },
      ampLfo: { rate: 1.5, depth: 0.45, shape: "triangle" },
      lfoBase: 0.55,
      attack: 1.8, release: 1.6,
    },
  },

  {
    id: "ponente",
    nome: "Ponente",
    abbr: "PON",
    gradi: 270,
    origine: "Dall'Atlantico, oltre lo Stretto di Gibilterra.",
    temperamento: { temperatura: 0.20, umidita: 0.50, salinita: 0.70, velocita: 0.40 },
    carattere: ["fresco", "sereno", "salmastro"],
    tinta: "#c98668",
    prosa:
      "Viene da dove il sole muore, fresco come acqua di pozzo. Spazza il cielo, " +
      "asciuga i timori, porta nuvole bianche e rotonde. È il vento delle sere " +
      "d'estate sulla riviera, dei tramonti che prendono tutto il tempo.",
    memoria:
      "Zefiro per i greci, sposo di Cloride, padre dei fiori. Botticelli lo " +
      "dipinge mentre soffia accanto a Venere appena nata.",
    ricetta: {
      noise: "pink",
      lowpass: { freq: 2000, q: 0.7 },
      bandpass: { freq: 600, q: 1.5 },
      ampLfo: { rate: 0.35, depth: 0.16, shape: "sine" },
      lfoBase: 0.60,
      attack: 2.8, release: 2.4,
    },
  },

  {
    id: "maestrale",
    nome: "Maestrale",
    abbr: "MAE",
    gradi: 315,
    origine: "Dalla valle del Rodano e dal Golfo del Leone.",
    temperamento: { temperatura: -0.20, umidita: 0.20, salinita: 0.55, velocita: 0.80 },
    carattere: ["limpido", "deciso", "cristallino"],
    tinta: "#7d9e98",
    prosa:
      "Il vento maestro: pulisce il cielo, spazza le nuvole, lascia un azzurro " +
      "così netto da far male agli occhi. In Sardegna alza il maestralone, in " +
      "Provenza chiamano il suo cugino Mistral. Soffia per tre giorni, sei o " +
      "nove — sempre dispari, sempre giusto.",
    memoria:
      "Il vento dominante del Mediterraneo occidentale. Già nell'isolario di " +
      "Bartolomeo Dalli Sonetti era 'Maistro', il padrone della rosa.",
    ricetta: {
      noise: "pink",
      highpass: { freq: 400, q: 0.7 },
      bandpass: { freq: 2400, q: 5, lfo: { rate: 0.60, depth: 320 } },
      ampLfo: { rate: 0.70, depth: 0.20, shape: "sine" },
      lfoBase: 0.50,
      attack: 2.4, release: 2.0,
    },
  },

];

/* Scala Beaufort in italiano antico — usata dal barometro poetico. */
const BEAUFORT = [
  "Calma",
  "Bava di vento",
  "Brezza leggera",
  "Brezza tesa",
  "Vento moderato",
  "Vento teso",
  "Vento fresco",
  "Vento forte",
  "Burrasca moderata",
  "Burrasca forte",
  "Tempesta",
  "Fortunale",
  "Uragano",
];
