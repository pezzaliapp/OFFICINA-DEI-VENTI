# Officina dei Venti

> *i venti hanno nomi propri. lo scirocco non è il libeccio.*

Atelier sonoro degli **otto venti italiani** della rosa cardinale: *tramontana, grecale, levante, scirocco, ostro, libeccio, ponente, maestrale*. Ogni vento è uno strumento — con la sua geografia, il suo temperamento, la sua firma sonora — che si accende dalla rosa e può soffiare insieme agli altri.

🌬️ **In linea:** [alessandropezzali.it/OFFICINA-DEI-VENTI/](https://www.alessandropezzali.it/OFFICINA-DEI-VENTI/)

---

## Cos'è

Una piccola applicazione web che vive in una sola pagina. Niente meteo in tempo reale, niente icone di sole e nuvole: i venti qui non sono dati, sono **figure**. Ognuno è descritto in prosa, situato nella sua geografia di origine, dotato di parametri di temperamento (temperatura, umidità, salinità, velocità) e — soprattutto — generato come suono dal vivo nel tuo browser, sintetizzato a partire dal rumore filtrato secondo una ricetta che gli è propria.

Si possono accendere più venti contemporaneamente. Il **barometro Beaufort** misura la composizione complessiva, dalla *Calma* fino all'*Uragano*. Le composizioni interessanti si annotano nel **registro di bordo**, persistito in locale (nessun account, nessun servizio remoto).

## Perché

I venti del Mediterraneo hanno nomi antichi che portano dentro la loro storia: *scirocco* dall'arabo *šurūq* (levante), *libeccio* dal greco *libykós* (libico), *ostro* dal latino *auster*. Sono nomi propri — strumenti culturali, non sinonimi intercambiabili. L'app è un piccolo omaggio a quei nomi, e un esperimento su quanto suono espressivo si possa ottenere da rumore, filtri biquad, e qualche LFO — niente registrazioni, niente librerie, solo Web Audio nudo.

## Come si usa

1. **Tocca un nome** o un petalo della rosa per accendere il vento corrispondente. Il petalo si illumina, il suono parte (con un attacco morbido — non una partenza brusca).
2. **Tocca di nuovo** per spegnerlo. Più venti possono soffiare insieme.
3. La **scheda** sulla destra (o sotto, su mobile) mostra origine, prosa, memoria storica e parametri del vento sfiorato. Da lì puoi anche regolare l'**intensità** del vento acceso.
4. Il **barometro** misura la potenza complessiva della tua composizione lungo la scala Beaufort italiana classica (Calma → Bava di vento → Brezza leggera → … → Fortunale → Uragano).
5. **Annota una composizione** nel registro: torna utile per ritrovarla, e per associarle un nome — *brezza dello stretto*, *temporale di scirocco*, *meriggio di ostro*. Si ripristina con un click.

## Tecnica

- **Niente backend, niente account, niente API esterne.** Tutto vive nel browser. Il registro persiste in `localStorage`.
- **Audio sintetizzato dal vivo** con Web Audio API nuda:
  - rumore generato a mano (white / pink — algoritmo di Paul Kellet / brown — random walk)
  - filtri biquad (highpass, lowpass, bandpass risonante per l'effetto fischio)
  - LFO indipendenti su frequenza del bandpass e su ampiezza (le raffiche)
  - oscillatore *drone* sub-bass per i venti pesanti (scirocco, ostro)
  - `StereoPannerNode` posizionato dai gradi cardinali del vento
  - envelope di attacco/rilascio per accendere e spegnere senza click
- **Niente build step.** Apri `index.html` e funziona. Si può servire con qualsiasi static server.
- Un solo file CSS, un solo file JS per il motore audio (`audio.js`), uno per il dataset (`winds.js`), uno per la UI (`app.js`). Nessuna dipendenza runtime — solo Google Fonts via CDN.

## Avvio locale

```bash
npm start
# equivale a: python3 -m http.server 4173
# poi apri http://localhost:4173/
```

Non c'è alcun `npm install` da fare. Il `package.json` esiste solo per metadati e per lo script di avvio.

## Pubblicazione su GitHub Pages

L'app è pensata per girare sotto un sottopercorso (es. `/OFFICINA-DEI-VENTI/`) di un dominio personalizzato user-level. Tutti i percorsi nel codice sono **relativi** (`style.css`, non `/style.css`); è incluso un `.nojekyll` per evitare il processing Jekyll. Niente file `CNAME` qui dentro: il custom domain è gestito a livello user.

## Struttura

```
.
├── index.html         frontespizio + contenitori (rosa, scheda, barometro, registro)
├── style.css          palette di carta nautica, tipografia, layout
├── winds.js           dataset degli otto venti + scala Beaufort italiana
├── audio.js           WindEngine — motore Web Audio
├── app.js             rosa SVG procedurale, scheda, barometro, registro
├── .nojekyll          (vuoto, per GitHub Pages)
└── package.json       solo metadati + script "start"
```

## Note sul dataset

I temperamenti e le ricette sonore sono **ritratti**, non misurazioni. Sono stati scelti per evocare il carattere di ogni vento secondo come è entrato nella lingua e nell'immaginario italiano: lo scirocco lento e oppressivo, il libeccio violento e irregolare, il maestrale cristallino, la tramontana sferzante. Le brevi prose e le note di memoria sono frutto di letture e suggestioni, non di filologia esatta.

I nomi dei venti sono lasciati **intraducibili**: *scirocco* non è "*south-east wind*", è *scirocco*. Tradurli vorrebbe dire toglierli dal loro contesto.

---

## In English (brief)

**Officina dei Venti** ("Workshop of the Winds") is a single-page sound atelier dedicated to the **eight Italian winds** of the compass rose. Each wind has its own geography, temperament, and synthesized sonic signature — generated live in the browser from filtered noise, with no recordings or samples.

Click a name on the wind rose to ignite a wind; multiple winds can blow together. A Beaufort scale measures the composite force; a logbook saves your compositions to `localStorage`. Italian wind names are kept untranslated — they are proper names: *scirocco* is not interchangeable with *libeccio*.

Open `index.html` and it works. No build, no dependencies, no API keys.

---

*Officina dei Venti · atelier sonoro · MMXXVI*
*Alessandro Pezzali · MIT License*
