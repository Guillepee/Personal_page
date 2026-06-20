/* ============================================================
   pdf-export.js
   Exporta el CV a PDF con html2pdf.js (vendored en vendor/).
   Captura el contenido del main (sin la sidebar) respetando el tema activo:
   le pasa como fondo el color del tema, de modo que el PDF se ve como la
   página en pantalla. Descarga directa, sin pasar por el diálogo de impresión.
   ============================================================ */
(function () {
  const button = document.getElementById("downloadCv");
  // Se captura el contenedor del contenido (sin sidebar ni controles).
  const target = document.querySelector(".main__inner");
  if (!button || !target) return;

  // Nombre del archivo: derivado del nombre del CV (hero); fallback genérico.
  function fileName() {
    const name = document.querySelector(".hero__name")?.textContent?.trim();
    if (!name) return "CV.pdf";
    return `CV-${name.replace(/\s+/g, "-")}.pdf`;
  }

  function buildOptions() {
    // Fondo del tema activo: html2canvas rellena el lienzo con este color, así
    // los temas oscuros conservan su fondo (si no, saldría blanco).
    const background = getComputedStyle(document.body).backgroundColor;
    return {
      margin: 8,
      filename: fileName(),
      image: { type: "jpeg", quality: 0.98 },
      // scale 2 -> nitidez (el contenido se rasteriza). useCORS para intentar
      // cargar imágenes externas (favicons); las que no permitan CORS se omiten.
      html2canvas: { scale: 2, backgroundColor: background, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      // Evita cortar un bloque entre páginas (equivalente a break-inside: avoid).
      pagebreak: {
        mode: ["css", "legacy"],
        avoid: [".timeline-item", ".skills__group", ".project-card", ".resource-item", ".contact-item"],
      },
    };
  }

  async function exportPdf() {
    if (typeof html2pdf === "undefined") {
      // Falla visible: sin la librería no se puede generar el PDF.
      console.error("html2pdf no está disponible (¿no cargó vendor/html2pdf.bundle.min.js?).");
      return;
    }
    // Feedback: evitar doble clic mientras se genera.
    button.disabled = true;
    button.classList.add("is-loading");
    // Clase solo para la captura: html2pdf rasteriza el DOM real (no usa
    // @media print), así que los ajustes exclusivos del PDF se aplican con
    // esta clase y se revierten al terminar. Hoy: oculta la línea conectora
    // de la timeline, que en el PDF se ve como una raya en el margen.
    target.classList.add("is-pdf-export");
    try {
      await html2pdf().set(buildOptions()).from(target).save();
    } catch (error) {
      // No silenciar: si la generación falla, dejar rastro para diagnosticar.
      console.error("Error generando el PDF del CV:", error);
    } finally {
      target.classList.remove("is-pdf-export");
      button.disabled = false;
      button.classList.remove("is-loading");
    }
  }

  button.addEventListener("click", exportPdf);
})();
