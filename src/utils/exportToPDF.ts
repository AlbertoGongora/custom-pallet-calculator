import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * 📄 Exporta la tabla de resultados como PDF
 */
export const exportToPDF = () => {
  const tabla = document.getElementById("tablaResultados");
  if (!tabla) {
    console.error("❌ No se encontró la tabla para exportar.");
    return;
  }

  // 🔥 Forzar visibilidad antes de capturar
  tabla.style.display = "block";

  setTimeout(() => {
    html2canvas(tabla, {
      scale: 2, // Aumenta la calidad del render
      useCORS: true, // Permite capturar estilos externos
      logging: false, // Activa logs para debug
      windowWidth: document.documentElement.scrollWidth, // Evita cortes en la captura
      windowHeight: document.documentElement.scrollHeight,
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 190; // Ancho en mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width; // Mantener proporción

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save("reporte.pdf");

      // 🔄 Restaurar el estado original después de exportar
      tabla.style.display = "";
    });
  }, 500); // 🔥 Espera 500ms para asegurarte de que el render es completo
};
