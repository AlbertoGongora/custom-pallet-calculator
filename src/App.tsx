import React from "react";
import FileUploader from "./features/upload/FileUploader";
import ResultsTable from "./features/results/ResultsTable";
import usePalletData from "./hooks/usePalletData"; // 🔥 Importamos el hook
import "./styles/app.css";

const App: React.FC = () => {
  // 🔹 Usamos el hook para manejar el estado
  const {
    optimizedResults,
    palletOption,
    isDataLoaded,
    setPalletOption,
    handleFilesUploaded,
    resetProcess,
  } = usePalletData();

  return (
    <main className="app-container">
      <h1 className="app-title">Custom Pallet Calculator 📦</h1>

      {/* 🔹 Muestra el selector de pallets y el FileUploader solo si aún no hay datos */}
      {!isDataLoaded && (
        <>
          <section className="pallet-option">
            <label>Selecciona el máximo de cajas por palet:</label>
            <select value={palletOption} onChange={(e) => setPalletOption(Number(e.target.value))}>
              <option value={12}>12 Cajas</option>
              <option value={16}>16 Cajas</option>
            </select>
          </section>

          {/* 🔹 Componente de subida de archivos */}
          <FileUploader onFilesUploaded={handleFilesUploaded} />
        </>
      )}

      {/* 🔹 Muestra la tabla de resultados solo si los datos fueron procesados */}
      {isDataLoaded && (
        <>
          <ResultsTable optimizedResults={optimizedResults} />

          {/* 🔹 Botón para reiniciar el proceso */}
          <button className="reset-button" onClick={resetProcess}>🔄 Nuevo Pedido</button>
        </>
      )}
    </main>
  );
};

export default App;
