/* Officina dei Venti — dataset.

   Per ogni vento:
     - id, nome, abbr (sigla cardinale)
     - gradi: angolo bussola (0 = N, in senso orario)
     - origine: prosa breve sull'origine geografica
     - temperamento: { temperatura -1..+1, umidità 0..1, salinità 0..1, velocità 0..1 }
     - carattere: tre aggettivi
     - prosa: descrizione poetica
     - memoria: nota storica/mitologica
     - ricetta: parametri di sintesi audio (vedi audio.js)

   Dataset completo nei commit successivi. Per ora due venti come seme. */

const WINDS = [
  {
    id: "tramontana",
    nome: "Tramontana",
    abbr: "T",
    gradi: 0,
    origine: "Dalle Alpi e dalla pianura padana, oltre i monti.",
    temperamento: { temperatura: -0.7, umidita: 0.10, salinita: 0.10, velocita: 0.7 },
    carattere: ["secco", "freddo", "sferzante"],
    prosa: "Soffia da oltremonte, taglia la nebbia, asciuga i panni alle finestre.",
    memoria: "I latini la chiamavano Aquilone.",
    ricetta: {
      noise: "white",
      highpass: { freq: 600, q: 0.7 },
      bandpass: { freq: 1800, q: 8, lfo: { rate: 0.3, depth: 380 } },
      ampLfo: { rate: 0.55, depth: 0.18 },
      lfoBase: 0.45,
      attack: 2.6, release: 2.0,
    },
  },
  {
    id: "scirocco",
    nome: "Scirocco",
    abbr: "SE",
    gradi: 135,
    origine: "Dal deserto del Sahara, attraverso il Mediterraneo.",
    temperamento: { temperatura: 0.9, umidita: 0.45, salinita: 0.30, velocita: 0.5 },
    carattere: ["caldo", "opaco", "sabbioso"],
    prosa: "Cielo lattiginoso, polvere rossa sui davanzali, malinconia estiva.",
    memoria: "Dall'arabo šurūq, levante.",
    ricetta: {
      noise: "brown",
      lowpass: { freq: 620, q: 0.8 },
      drone: { shape: "sine", freq: 78, gain: 0.06, attack: 5 },
      ampLfo: { rate: 0.08, depth: 0.30 },
      lfoBase: 0.55,
      attack: 3.5, release: 2.5,
    },
  },
];
