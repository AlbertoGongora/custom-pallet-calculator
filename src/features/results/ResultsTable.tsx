import React, { useRef, useEffect } from "react";
// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";
import { OptimizedPallet } from "../../services/optimizePallets";
import "../../styles/resultsTable.css";

interface ResultsTableProps {
  optimizedResults: OptimizedPallet[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ optimizedResults }) => {
  const tableRef = useRef<HTMLDivElement>(null);

  // ✅ Log para verificar que los datos llegan correctamente
  useEffect(() => {
  }, [optimizedResults]);

  /**
   * 📌 **Función `generatePDF`**
   * Captura la tabla de resultados y la exporta como PDF.
   */
  // const generatePDF = async () => {
  //   if (!tableRef.current) return;

  //   try {
  //     const canvas = await html2canvas(tableRef.current, { 
  //       backgroundColor: "#FFFFFF",
  //       useCORS: true, // 🔹 Evita problemas de seguridad con imágenes externas
  //     });

  //     const imgData = canvas.toDataURL("image/png");
  //     const pdf = new jsPDF("p", "mm", "a4");
  //     const imgWidth = 190;
  //     const imgHeight = (canvas.height * imgWidth) / canvas.width;

  //     pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
  //     pdf.save("Optimización_Pallets.pdf");
  //   } catch (error) {
  //     console.error("❌ Error al generar el PDF:", error);
  //   }
  // };

  /**
   * 📌 **Función `printResults`**
   * Imprime directamente la tabla en formato limpio.
   */
  const printResults = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Optimización de Pallets</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; color: black; display: flex; align-items: center; flex-direction: column; }
              table { width: 80%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid black; padding: 10px; text-align: center; }
              th { background-color: #f2f2f2; }
              .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; margin-left: 10%; align-self: flex-start; }
              .pallets { text-align: left; margin-left: 20px; }
              .summary-table { margin-top: 20px; witdh: 60%; }
              .finalIzq { text-align: left; margin-left: 20px; width: 40%; }
              .finalDer { text-align: left; margin-left: 20px;  }
            </style>
          </head>
          <body>
            <h2 class="title">📦 Lotes Procesados</h2>
            <table>
              <thead>
                <tr><th>Lote</th><th>Pallets</th></tr>
              </thead>
              <tbody>
                ${optimizedResults.map(data => `
                  <tr>
                    <td>${data.lote}</td>
                    <td class="pallets">${data.pallets.length > 0 ? data.pallets.join(", ") : "Sin pallets asignados"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            <h3 class="title">📊 Resumen Final</h3>
            <table class="summary-table">
              <tbody>
                  <tr>
                  <td class="finalIzq">📝 Recepción:</td>
                  <td class="finalDer"></td>
                </tr>
                <tr>
                  <td class="finalIzq">📲 Palets leídos:</td>
                  <td class="finalDer"></td>
                </tr>
                <tr>
                  <td class="finalIzq">➕ Palets añadidos:</td>
                  <td  class="finalDer">${optimizedResults.length > 0 ? optimizedResults[optimizedResults.length - 1].extraPallets : 0}</td>
                </tr>
                <tr>
                  <td class="finalIzq">📦 Cajas movidas:</td>
                  <td class="finalDer">${optimizedResults.length > 0 ? optimizedResults[optimizedResults.length - 1].cajasMovidas : 0}</td>
                </tr>
                <tr>
                  <td class="finalIzq">⏱️ Tiempo:</td>
                  <td class="finalDer"></td>
                </tr>
                  <tr>
                  <td class="finalIzq">🔹 Nombres:</td>
                  <td class="finalDer"></td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <section className="results-container">
      <h2>📦 Lotes Procesados</h2>

      {optimizedResults.length === 0 ? (
        <p className="warning">⚠️ No hay datos optimizados para mostrar.</p>
      ) : (
        <div ref={tableRef}>
          <table className="results-table">
            <thead>
              <tr>
                <th>Lote</th>
                <th>Pallets</th>
              </tr>
            </thead>
            <tbody>
              {optimizedResults.map((data, index) => (
                <tr key={index}>
                  <td>{data.lote}</td>
                  <td className="palletNum">{data.pallets.length > 0 ? data.pallets.join(", ") : "Sin pallets asignados"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 📌 Sección de resumen */}
          <h3 className="title2">📊 Resumen Final</h3>
          <table className="summary-table">
            <tbody>
              <tr>
                <td>➕ Palets añadidos:</td>
                <td>{optimizedResults.length > 0 ? optimizedResults[optimizedResults.length - 1].extraPallets : 0}</td>
              </tr>
              <tr>
                <td>📦 Cajas movidas:</td>
                <td>{optimizedResults.length > 0 ? optimizedResults[optimizedResults.length - 1].cajasMovidas : 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 📌 Botones para exportar */}
      <div className="button-container">
        {/* <button className="pdf-button" onClick={generatePDF}>
          📄 Descargar PDF
        </button> */}
        <button className="print-button" onClick={printResults}>
          🖨️ Imprimir
        </button>
      </div>
    </section>
  );
};

export default ResultsTable;
