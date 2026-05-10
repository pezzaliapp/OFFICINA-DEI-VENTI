/* Officina dei Venti — applicazione.

   Costruisce la rosa SVG procedurale, lega click/hover ai venti,
   renderizza la scheda dinamica, anima il barometro Beaufort.
   Il registro di bordo è implementato come storia persistita in
   localStorage. */

(function () {
  "use strict";

  /* ============================================================
     STATO E MOTORE
     ============================================================ */

  const engine = new WindEngine();

  const state = {
    selezionato: null,           // id del vento mostrato in scheda
    intensita: {},               // id → 0..100
  };

  const STORAGE_KEY = "officina-venti.registro";

  /* ============================================================
     COSTRUZIONE DELLA ROSA SVG
     ============================================================ */

  const SVG_NS = "http://www.w3.org/2000/svg";

  const ROSA = {
    SIZE: 780,
    R_ext: 320,
    R_inner_rim: 304,
    R_main_tip: 282,
    R_main_notch: 100,
    R_half_tip: 195,
    R_half_notch: 70,
    R_label: 358,
    R_sigla: 304,
    R_center: 26,
    HALF_WIDTH_MAIN: 14,
    HALF_WIDTH_HALF: 9,
  };

  function pt(angDeg, r, C) {
    const a = (angDeg - 90) * Math.PI / 180;
    return [
      (C + r * Math.cos(a)).toFixed(2),
      (C + r * Math.sin(a)).toFixed(2),
    ];
  }

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function buildRosa() {
    const { SIZE } = ROSA;
    const C = SIZE / 2;

    const svg = svgEl("svg", {
      viewBox: `0 0 ${SIZE} ${SIZE}`,
      class: "rosa-svg",
      role: "img",
      "aria-label":
        "Rosa dei venti — otto venti italiani disposti sui punti cardinali e intercardinali. " +
        "Tocca un nome per accendere il vento corrispondente.",
    });

    // doppio anello esterno
    [ROSA.R_ext, ROSA.R_inner_rim].forEach((r, i) => {
      svg.appendChild(svgEl("circle", {
        cx: C, cy: C, r,
        class: i === 0 ? "rosa-anello" : "rosa-anello rosa-anello-fine",
      }));
    });

    // tacche dei gradi
    for (let deg = 0; deg < 360; deg += 5) {
      const cardinale = deg % 90 === 0;
      const intercardinale = deg % 45 === 0;
      const big = deg % 30 === 0;
      const len = cardinale ? 14 : intercardinale ? 12 : big ? 9 : (deg % 15 === 0 ? 6 : 4);
      const inner = ROSA.R_inner_rim - 4;
      const outer = inner - len;
      const [x1, y1] = pt(deg, inner, C);
      const [x2, y2] = pt(deg, outer, C);
      svg.appendChild(svgEl("line", {
        x1, y1, x2, y2,
        class: big ? "tacca tacca-grande" : "tacca",
      }));
    }

    // mezzopetali decorativi (intercardinali fini, non interattivi)
    for (let i = 0; i < 8; i++) {
      const ang = i * 45 + 22.5;
      const [tx, ty] = pt(ang, ROSA.R_half_tip, C);
      const [lx, ly] = pt(ang - ROSA.HALF_WIDTH_HALF, ROSA.R_half_notch, C);
      const [rx, ry] = pt(ang + ROSA.HALF_WIDTH_HALF, ROSA.R_half_notch, C);

      svg.appendChild(svgEl("path", {
        d: `M ${C} ${C} L ${lx} ${ly} L ${tx} ${ty} Z`,
        class: "mezzopetalo mezzopetalo-chiaro",
      }));
      svg.appendChild(svgEl("path", {
        d: `M ${C} ${C} L ${tx} ${ty} L ${rx} ${ry} Z`,
        class: "mezzopetalo mezzopetalo-scuro",
      }));
    }

    // petali principali — gli otto venti italiani
    WINDS.forEach(wind => {
      const ang = wind.gradi;
      const [tx, ty] = pt(ang, ROSA.R_main_tip, C);
      const [lx, ly] = pt(ang - ROSA.HALF_WIDTH_MAIN, ROSA.R_main_notch, C);
      const [rx, ry] = pt(ang + ROSA.HALF_WIDTH_MAIN, ROSA.R_main_notch, C);

      const left = svgEl("path", {
        d: `M ${C} ${C} L ${lx} ${ly} L ${tx} ${ty} Z`,
        class: "petalo petalo-chiaro",
        "data-wind": wind.id,
        tabindex: 0,
        role: "button",
        "aria-label": `${wind.nome}, ${cardinaleIT(wind.gradi)}, ${wind.gradi} gradi`,
      });
      const right = svgEl("path", {
        d: `M ${C} ${C} L ${tx} ${ty} L ${rx} ${ry} Z`,
        class: "petalo petalo-scuro",
        "data-wind": wind.id,
        tabindex: -1,
      });
      svg.appendChild(left);
      svg.appendChild(right);
    });

    // centro (cerchio + stella)
    svg.appendChild(svgEl("circle", {
      cx: C, cy: C, r: ROSA.R_center, class: "rosa-centro",
    }));
    svg.appendChild(svgEl("circle", {
      cx: C, cy: C, r: 5, class: "rosa-stella",
    }));

    // sigle sui petali (vicino alla punta)
    WINDS.forEach(wind => {
      const [sx, sy] = pt(wind.gradi, ROSA.R_main_tip + 18, C);
      const sigla = svgEl("text", {
        x: sx, y: sy,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        class: "rosa-sigla",
        "data-wind": wind.id,
      });
      sigla.textContent = wind.abbr;
      svg.appendChild(sigla);
    });

    // etichette dei venti (nomi distesi sull'arco esterno)
    WINDS.forEach(wind => {
      const [lx, ly] = pt(wind.gradi, ROSA.R_label, C);
      const label = svgEl("text", {
        x: lx, y: ly,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        class: "rosa-nome",
        "data-wind": wind.id,
      });
      label.textContent = wind.nome.toLowerCase();
      svg.appendChild(label);
    });

    // delegazione eventi
    svg.addEventListener("click", e => {
      const id = e.target.dataset && e.target.dataset.wind;
      if (!id) return;
      selezionaVento(id);
      toggleVento(id);
    });

    svg.addEventListener("mouseover", e => {
      const id = e.target.dataset && e.target.dataset.wind;
      if (id) selezionaVento(id, /* solo scheda */ true);
    });

    svg.addEventListener("keydown", e => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const id = e.target.dataset && e.target.dataset.wind;
      if (!id) return;
      e.preventDefault();
      selezionaVento(id);
      toggleVento(id);
    });

    document.getElementById("rosa").appendChild(svg);
  }

  /* ============================================================
     SCHEDA DEL VENTO
     ============================================================ */

  const ATELIER_INTRO = `
    <div class="atelier-intro">
      <h2 class="atelier-titolo">L'atelier</h2>
      <p class="atelier-paragrafo">
        Otto venti italiani siedono in questa officina, ciascuno con la propria
        voce, geografia, temperamento. Tocca un nome sulla rosa per accenderlo.
        Più venti possono soffiare insieme — assieme formano composizioni, e
        nei tuoi orecchi nasce un mediterraneo immaginario.
      </p>
      <p class="atelier-paragrafo">
        La rosa qui accanto è incisa secondo i modi dei cartografi del Cinquecento;
        l'audio che ascolterai è invece sintetizzato dal vivo, dal nulla del
        rumore bianco filtrato e modulato. Niente registrazioni, niente
        campioni — solo numeri.
      </p>
      <p class="atelier-firma">— sfiora un vento per leggerne la scheda —</p>
    </div>
  `;

  function cardinaleIT(deg) {
    return ({
      0: "tramontana", 45: "greco", 90: "levante", 135: "scirocco",
      180: "ostro",    225: "libeccio", 270: "ponente", 315: "maestrale",
    })[deg] || "";
  }

  function cardinaleAbbr(deg) {
    return ({ 0:"N", 45:"NE", 90:"E", 135:"SE", 180:"S", 225:"SW", 270:"W", 315:"NW" })[deg] || "";
  }

  function pad3(n) { return String(n).padStart(3, "0"); }

  function indicatoreHTML(etichetta, valore, bipolare) {
    let leftPct, widthPct;
    if (bipolare) {
      if (valore >= 0) { leftPct = 50; widthPct = valore * 50; }
      else { leftPct = 50 + valore * 50; widthPct = -valore * 50; }
    } else {
      leftPct = 0; widthPct = valore * 100;
    }
    const valoreFmt = bipolare
      ? (valore >= 0 ? "+" : "−") + Math.abs(valore).toFixed(2)
      : valore.toFixed(2);
    return `
      <div class="indicatore">
        <span class="ind-etichetta">${etichetta}</span>
        <div class="ind-barra">
          ${bipolare ? '<div class="ind-mezzo"></div>' : ''}
          <div class="ind-fill" style="left:${leftPct}%; width:${widthPct}%;"></div>
        </div>
        <span class="ind-valore">${valoreFmt}</span>
      </div>
    `;
  }

  function renderScheda(id) {
    const scheda = document.getElementById("scheda");
    const wind = WINDS.find(w => w.id === id);

    if (!wind) {
      scheda.removeAttribute("data-vento");
      scheda.style.removeProperty("--tinta");
      scheda.innerHTML = ATELIER_INTRO;
      return;
    }

    const t = wind.temperamento;
    const acceso = engine.isActive(wind.id);
    const intensita = state.intensita[wind.id] != null ? state.intensita[wind.id] : 55;

    scheda.dataset.vento = wind.id;
    scheda.style.setProperty("--tinta", wind.tinta);

    scheda.innerHTML = `
      <div class="scheda-cap">
        <span class="scheda-deg">${pad3(wind.gradi)}°</span>
        <span>·</span>
        <span class="scheda-card">${cardinaleAbbr(wind.gradi)} · ${wind.abbr}</span>
      </div>
      <h2 class="scheda-titolo">${wind.nome}</h2>
      <p class="scheda-aggettivi">
        ${wind.carattere.map(a => `<em>${a}</em>`).join('<span class="punto">&middot;</span>')}
      </p>
      <div class="scheda-temperamento">
        ${indicatoreHTML("temperatura", t.temperatura, true)}
        ${indicatoreHTML("umidità",     t.umidita,     false)}
        ${indicatoreHTML("salinità",    t.salinita,    false)}
        ${indicatoreHTML("velocità",    t.velocita,    false)}
      </div>
      <div class="scheda-divider-line"></div>

      <h4 class="scheda-rubrica">Origine</h4>
      <p class="scheda-paragrafo">${wind.origine}</p>

      <h4 class="scheda-rubrica">Carattere</h4>
      <p class="scheda-paragrafo prosa">${wind.prosa}</p>

      <h4 class="scheda-rubrica">Memoria</h4>
      <p class="scheda-paragrafo memoria">${wind.memoria}</p>

      <div class="scheda-azioni">
        <button class="btn-scheda${acceso ? ' attivo' : ''}" id="btn-toggle-vento" type="button">
          ${acceso ? 'spegni il vento' : 'accendi il vento'}
        </button>
        <div class="scheda-intensita"${acceso ? '' : ' hidden'}>
          <label for="slider-intensita">intensità</label>
          <input type="range" id="slider-intensita" min="5" max="100" value="${intensita}">
          <output id="slider-valore">${intensita}%</output>
        </div>
      </div>
    `;

    document.getElementById("btn-toggle-vento")
      .addEventListener("click", () => toggleVento(wind.id));

    const slider = document.getElementById("slider-intensita");
    if (slider) {
      slider.addEventListener("input", e => {
        const v = parseInt(e.target.value, 10);
        state.intensita[wind.id] = v;
        engine.setIntensity(wind.id, v / 100);
        document.getElementById("slider-valore").textContent = v + "%";
        aggiornaBarometro();
      });
    }
  }

  function selezionaVento(id, soloScheda) {
    state.selezionato = id;
    renderScheda(id);
    if (!soloScheda) {
      // accent on label/sigla active
    }
    aggiornaEvidenze();
  }

  function aggiornaEvidenze() {
    document.querySelectorAll("[data-wind]").forEach(el => {
      const id = el.dataset.wind;
      const acceso = engine.isActive(id);
      el.classList.toggle("attivo", acceso);
    });
    aggiornaConteggio();
  }

  function aggiornaConteggio() {
    const n = engine.activeCount();
    const conteggio = document.getElementById("rosa-conteggio");
    const spegni = document.getElementById("spegni-tutti");
    if (conteggio) {
      conteggio.textContent =
        n === 0 ? "nessun vento attivo" :
        n === 1 ? "1 vento attivo" :
                  `${n} venti attivi`;
    }
    if (spegni) spegni.hidden = n === 0;
  }

  function toggleVento(id) {
    const wind = WINDS.find(w => w.id === id);
    if (!wind) return;
    if (engine.isActive(id)) {
      engine.extinguishWind(id);
    } else {
      const intensita = (state.intensita[id] != null ? state.intensita[id] : 55) / 100;
      engine.igniteWind({ ...wind, intensita });
    }
    aggiornaEvidenze();
    aggiornaBarometro();
    if (state.selezionato === id) renderScheda(id);
  }

  /* ============================================================
     BAROMETRO BEAUFORT
     ============================================================ */

  function buildBarometro() {
    const tacche = document.getElementById("quadrante-tacche");
    if (!tacche) return;
    // L'arco copre il semicerchio superiore: 180° fra -90° (estrema sinistra)
    // e +90° (estrema destra). Tredici tacche, 0..12, distribuite linearmente:
    //   B = i  →  ang = -90 + (i/12) * 180.
    // Il punto sull'arco a quel θ è  (cx + R sin θ, cy - R cos θ).
    for (let i = 0; i <= 12; i++) {
      const angDeg = -90 + (i / 12) * 180;
      const rad = angDeg * Math.PI / 180;
      const cx = 100, cy = 110, R = 80;
      const big = i % 3 === 0;
      const len = big ? 8 : 4;
      const x1 = cx + (R - 1) * Math.sin(rad);
      const y1 = cy - (R - 1) * Math.cos(rad);
      const x2 = cx + (R - 1 - len) * Math.sin(rad);
      const y2 = cy - (R - 1 - len) * Math.cos(rad);
      const tick = svgEl("line", {
        x1, y1, x2, y2,
        stroke: "currentColor",
        "stroke-width": big ? 1.0 : 0.5,
        opacity: big ? 0.85 : 0.55,
      });
      tacche.appendChild(tick);

      if (big) {
        const lr = R + 9;
        const lx = cx + lr * Math.sin(rad);
        const ly = cy - lr * Math.cos(rad);
        const lab = svgEl("text", {
          x: lx, y: ly + 3,
          "text-anchor": "middle",
          "font-family": "JetBrains Mono, monospace",
          "font-size": 8,
          fill: "currentColor",
          opacity: 0.75,
        });
        lab.textContent = String(i);
        tacche.appendChild(lab);
      }
    }
  }

  // forza totale = somma delle intensità (0..1) pesate dalla velocità
  // del vento (un libeccio pesa più di un ostro a parità di slider).
  // mappa non lineare sulla scala Beaufort:
  //   B = round( min(12, 6.5 · forza^0.6) ), con minimo 1 a venti accesi.
  // calibrato così:
  //   1 vento al 5%   → 1   (Bava di vento)
  //   1 vento al 50%  → 3   (Brezza tesa)
  //   1 vento al 90%  → ~5  (Vento teso)
  //   1 vento al 100% → ~6  (Vento fresco)
  //   2 venti al 100% → ~10 (Tempesta)
  //   4+ al 100%      → 12  (Uragano)
  function calcolaBeaufort() {
    let forza = 0;
    for (const id of engine.activeIds()) {
      const wind = WINDS.find(w => w.id === id);
      if (!wind) continue;
      const i = (state.intensita[id] != null ? state.intensita[id] : 55) / 100;
      const peso = 0.6 + 0.4 * wind.temperamento.velocita;
      forza += i * peso;
    }
    if (forza <= 0) return 0;
    const B = Math.round(6.5 * Math.pow(forza, 0.6));
    return Math.min(12, Math.max(1, B));
  }

  function aggiornaBarometro() {
    const grado = calcolaBeaufort();
    // L'ago è disegnato verticale verso l'alto (B=6 in posizione neutra);
    // ruotare di -90° lo punta a sinistra (B=0), +90° a destra (B=12).
    //   ang_rotazione = -90 + (B/12) × 180
    const ang = -90 + (grado / 12) * 180;
    const ago = document.getElementById("ago-barometro");
    if (ago) ago.setAttribute("transform", `rotate(${ang} 100 110)`);
    document.getElementById("grado-beaufort").textContent = grado;
    document.getElementById("nome-beaufort").textContent = BEAUFORT[grado];
  }

  /* ============================================================
     REGISTRO DI BORDO (persistito in localStorage)
     ============================================================ */

  function caricaRegistro() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function salvaRegistro(registro) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(registro)); }
    catch (e) { /* quota piena, niente da fare */ }
  }

  function formattaData(iso) {
    const d = new Date(iso);
    return d.toLocaleString("it-IT", {
      day: "2-digit", month: "short",
      hour: "2-digit", minute: "2-digit",
    });
  }

  function annotaComposizione() {
    const venti = engine.activeIds().map(id => ({
      id, intensita: state.intensita[id] != null ? state.intensita[id] : 55,
    }));
    const inp = document.getElementById("registro-nota");
    if (venti.length === 0) {
      inp.classList.add("scossa");
      inp.placeholder = "— accendi almeno un vento —";
      setTimeout(() => {
        inp.classList.remove("scossa");
        inp.placeholder = "annota la composizione…";
      }, 1500);
      return;
    }
    const nota = (inp.value || "").trim();
    const data = new Date().toISOString();
    const registro = caricaRegistro();
    registro.unshift({
      data, nota: nota || "(senza titolo)", venti,
    });
    if (registro.length > 32) registro.length = 32;
    salvaRegistro(registro);
    inp.value = "";
    renderRegistro();
  }

  function ripristinaComposizione(voce) {
    engine.extinguishAll();
    aggiornaEvidenze();
    setTimeout(() => {
      voce.venti.forEach(v => {
        const wind = WINDS.find(w => w.id === v.id);
        if (!wind) return;
        state.intensita[v.id] = v.intensita;
        engine.igniteWind({ ...wind, intensita: v.intensita / 100 });
      });
      aggiornaEvidenze();
      aggiornaBarometro();
      if (state.selezionato) renderScheda(state.selezionato);
    }, 80);
  }

  function eliminaVoce(idx) {
    const registro = caricaRegistro();
    registro.splice(idx, 1);
    salvaRegistro(registro);
    renderRegistro();
  }

  function renderRegistro() {
    const registro = caricaRegistro();
    const elenco = document.getElementById("registro-elenco");
    const vuoto = document.getElementById("registro-vuoto");
    elenco.innerHTML = "";
    if (!registro.length) {
      vuoto.hidden = false;
      return;
    }
    vuoto.hidden = true;

    registro.forEach((voce, idx) => {
      const li = document.createElement("li");
      li.className = "registro-voce";
      li.tabIndex = 0;
      li.title = "tocca per ripristinare la composizione";

      const data = document.createElement("span");
      data.className = "registro-voce-data";
      data.textContent = formattaData(voce.data);

      const corpo = document.createElement("div");
      corpo.className = "registro-voce-corpo";

      const nota = document.createElement("div");
      nota.className = "registro-voce-nota";
      nota.textContent = voce.nota;

      const venti = document.createElement("div");
      venti.className = "registro-voce-venti";
      venti.textContent = voce.venti.map(v => {
        const w = WINDS.find(x => x.id === v.id);
        return w ? w.abbr : "?";
      }).join(" · ");

      corpo.appendChild(nota);
      corpo.appendChild(venti);

      const elimina = document.createElement("button");
      elimina.className = "registro-voce-elimina";
      elimina.type = "button";
      elimina.title = "elimina questa voce";
      elimina.textContent = "✕";
      elimina.addEventListener("click", e => {
        e.stopPropagation();
        eliminaVoce(idx);
      });

      li.appendChild(data);
      li.appendChild(corpo);
      li.appendChild(elimina);

      const ripristina = () => {
        li.classList.add("lampeggia");
        setTimeout(() => li.classList.remove("lampeggia"), 900);
        ripristinaComposizione(voce);
      };

      li.addEventListener("click", ripristina);
      li.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          ripristina();
        }
      });

      elenco.appendChild(li);
    });
  }

  function bindRegistro() {
    document.getElementById("registro-salva")
      .addEventListener("click", annotaComposizione);

    const inp = document.getElementById("registro-nota");
    inp.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        annotaComposizione();
      }
    });
  }

  function bindSpegniTutti() {
    document.getElementById("spegni-tutti")
      .addEventListener("click", () => {
        engine.extinguishAll();
        aggiornaEvidenze();
        aggiornaBarometro();
        if (state.selezionato) renderScheda(state.selezionato);
      });
  }

  /* ============================================================
     INIT
     ============================================================ */

  function init() {
    buildRosa();
    buildBarometro();
    bindRegistro();
    bindSpegniTutti();
    renderScheda(null);          // mostra l'introduzione dell'atelier
    renderRegistro();
    aggiornaBarometro();
    aggiornaConteggio();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
