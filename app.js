/* Officina dei Venti — collegamenti, rosa SVG, scheda, registro.
   Implementazione progressiva. Per ora una bozza minima. */

(function () {
  "use strict";

  function init() {
    document.getElementById("scheda").innerHTML =
      '<p class="scheda-vuota"><em>Atelier in costruzione.</em></p>';
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
