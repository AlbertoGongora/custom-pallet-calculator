import React from "react";
import FileUploader from "./features/upload/FileUploader";
import ResultsTable from "./features/results/ResultsTable";
import usePalletData from "./hooks/usePalletData";
import "./styles/App.css";

const App: React.FC = () => {
  // 🔹 Usamos el hook para manejar el estado
  const {
    optimizedResults,
    palletOption,
    isDataLoaded,
    setPalletOption,
    handleFilesUploaded,
    resetProcess,
    packlistSuffix,
    setPacklistSuffix,
  } = usePalletData();

  return (
    <main className="app-container">
      <h1 className="app-title">Custom Pallet Calculator 📦</h1>

      {/* 🔹 Input de Packing List abreviado */}
      {!isDataLoaded && (
        <section className="packinglist-suffix">
          <label htmlFor="packlistSuffix">
            Packing list abreviado: 
          </label>
          <input
            id="packlistSuffix"
            type="text"
            maxLength={4}
            placeholder="ultimos 4 dígitos"
            value={packlistSuffix}
            onChange={(e) =>
              setPacklistSuffix(e.target.value.toUpperCase().trim())
            }
          />
        </section>
      )}

      {/* 🔹 Selector de pallets y subida de archivos */}
      {!isDataLoaded && (
        <>
          <section className="pallet-option">
            <label>Selecciona el máximo de cajas por palet:</label>
            <select
              value={palletOption}
              onChange={(e) => setPalletOption(Number(e.target.value))}
            >
              <option value={12}>12 Cajas</option>
              <option value={16}>16 Cajas</option>
            </select>
          </section>

          {/* 🔹 Componente de subida de archivos */}
          <FileUploader onFilesUploaded={handleFilesUploaded} />
        </>
      )}

      {/* 🔹 Resultados */}
      {isDataLoaded && (
        <>
          <ResultsTable optimizedResults={optimizedResults} />

          <button className="reset-button" onClick={resetProcess}>
            🔄 Nuevo Pedido
          </button>
        </>
      )}
    </main>
  );
};

export default App;
