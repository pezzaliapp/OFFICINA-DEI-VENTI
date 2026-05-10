/* Officina dei Venti — applicazione.

   Per ora: motore audio collegato a una lista di pulsanti di prova,
   uno per ogni vento presente in winds.js. La rosa SVG e la scheda
   completa arrivano nei commit successivi. */

(function () {
  "use strict";

  const engine = new WindEngine();

  function init() {
    const rosa = document.getElementById("rosa");
    rosa.innerHTML = "";

    const lista = document.createElement("ul");
    lista.className = "venti-bozza";

    WINDS.forEach(wind => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-vento";
      btn.dataset.wind = wind.id;
      btn.textContent = wind.nome;

      btn.addEventListener("click", () => {
        if (engine.isActive(wind.id)) {
          engine.extinguishWind(wind.id);
          btn.classList.remove("attivo");
        } else {
          engine.igniteWind({ ...wind, intensita: 0.55 });
          btn.classList.add("attivo");
        }
        renderScheda(wind.id);
      });

      li.appendChild(btn);
      lista.appendChild(li);
    });

    rosa.appendChild(lista);

    renderScheda(WINDS[0] && WINDS[0].id);
  }

  function renderScheda(id) {
    const scheda = document.getElementById("scheda");
    const wind = WINDS.find(w => w.id === id);
    if (!wind) {
      scheda.innerHTML = '<p class="scheda-vuota"><em>nessun vento selezionato</em></p>';
      return;
    }
    const t = wind.temperamento;
    scheda.innerHTML = `
      <h2 class="scheda-nome">${wind.nome}</h2>
      <p class="scheda-direz">${wind.gradi}° &middot; ${wind.origine}</p>
      <p class="scheda-prosa"><em>${wind.prosa}</em></p>
      <p class="scheda-memoria">${wind.memoria}</p>
      <p class="scheda-temp">
        T ${t.temperatura.toFixed(2)} ·
        H ${t.umidita.toFixed(2)} ·
        S ${t.salinita.toFixed(2)} ·
        V ${t.velocita.toFixed(2)}
      </p>
    `;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
