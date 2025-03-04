import React, { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { OptimizedPallet } from "../../services/optimizationService";
import "../../styles/resultsTable.css";

interface ResultsTableProps {
  optimizedResults: OptimizedPallet[];
}

/**
 * 📌 **Componente `ResultsTable`**
 * Muestra los resultados de la optimización de pallets y permite descargar en PDF.
 */
const ResultsTable: React.FC<ResultsTableProps> = ({ optimizedResults }) => {
  const tableRef = useRef<HTMLDivElement>(null); // Referencia para capturar la tabla en PDF

  /**
   * 📌 **Función `generatePDF`**
   * Captura la tabla de resultados y la exporta como PDF.
   */
  const generatePDF = async () => {
    if (!tableRef.current) return;

    try {
      // Captura la tabla como imagen con `html2canvas`
      const canvas = await html2canvas(tableRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      // Configuración del PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Agregar la imagen al PDF y guardarlo
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save("Optimización_Pallets.pdf");
    } catch (error) {
      console.error("❌ Error al generar el PDF:", error);
    }
  };

  return (
    <section className="results-container">
      <h2>📦 Lotes Procesados</h2>

      {/* 📌 Contenedor de la tabla (se captura para el PDF) */}
      <div ref={tableRef}>
        <table className="results-table">
          <thead>
            <tr>
              <th>Lote</th>
              <th>Pallets</th>
              <th>Cajas en Pallet Extra</th>
            </tr>
          </thead>
          <tbody>
            {optimizedResults.map((data, index) => (
              <tr key={index}>
                <td>{data.lote}</td>
                <td>{data.pallets.join(", ")}</td>
                <td>{data.extraPallets > 0 ? `✅ Palet extra creado` : "❌ No necesita extra"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 📌 Sección de resumen */}
        <h3>📊 Resumen Final</h3>
        <table className="summary-table">
          <tbody>
            <tr>
              <td>🛠️ Palets leídos (vacíos sin datos):</td>
              <td>{optimizedResults.filter(p => p.pallets.length === 0).length}</td>
            </tr>
            <tr>
              <td>➕ Palets añadidos:</td>
              <td>{optimizedResults.reduce((sum, p) => sum + p.extraPallets, 0)}</td>
            </tr>
            <tr>
              <td>📦 Cajas movidas:</td>
              <td>{optimizedResults.reduce((sum, p) => sum + p.cajasMovidas, 0)}</td>
            </tr>
            <tr>
              <td>⏳ Tiempo:</td>
              <td>________ (rellenar manualmente)</td>
            </tr>
          </tbody>
        </table>

        {/* 📌 Sección de operarios */}
        <h3>👤 Operarios:</h3>
        <label><input type="checkbox" /> ✅ 1 Operario</label>
        <br />
        <label><input type="checkbox" /> ✅ Varios Operarios</label>
        <br />
        <br />
        <label>✏️ Nombre: <input type="text" placeholder="Escribe tu nombre aquí" /></label>
      </div>

      {/* 📌 Botón para descargar en PDF */}
      <button className="pdf-button" onClick={generatePDF}>
        📄 Descargar PDF
      </button>
    </section>
  );
};

export default ResultsTable;
