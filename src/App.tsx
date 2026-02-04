import React from "react";
import FileUploader from "./features/upload/FileUploader";
import ResultsTable from "./features/results/ResultsTable";
import usePalletData from "./hooks/usePalletData";
import "./styles/App.css";

const App: React.FC = () => {
  const {
    optimizedResults,
    palletOption,
    isDataLoaded,
    setPalletOption,
    handleFilesUploaded,
    resetProcess,

    // ✅ estados compartidos
    excelFile,
    setExcelFile,
    packingListFile,
    setPackingListFile,
    excelData,
    setExcelData,
    packingListData,
    setPackingListData,

    // ✅ sufijo
    packlistSuffix,
    setPacklistSuffix,
  } = usePalletData();

  return (
    <main className="app-container">
      <h1 className="app-title">Custom Pallet Calculator 📦</h1>

      {!isDataLoaded && (
        <section className="packinglist-suffix">
          <label htmlFor="packlistSuffix">
            Packing list abreviado (últimos 4 dígitos)
          </label>
          <input
            id="packlistSuffix"
            type="text"
            maxLength={4}
            placeholder="Ej: TENA"
            value={packlistSuffix}
            onChange={(e) => setPacklistSuffix(e.target.value.toUpperCase().trim())}
          />
        </section>
      )}

      {!isDataLoaded && (
        <>
          <section className="pallet-option">
            <label>Selecciona el máximo de cajas por palet:</label>
            <select
              value={palletOption}
              onChange={(e) => setPalletOption(Number(e.target.value))}
            >
              <option value={8}>8 Cajas</option>
              <option value={12}>12 Cajas</option>
              <option value={16}>16 Cajas</option>
            </select>
          </section>

          <FileUploader
            onFilesUploaded={handleFilesUploaded}
            packlistSuffix={packlistSuffix}
            excelFile={excelFile}
            setExcelFile={setExcelFile}
            packingListFile={packingListFile}
            setPackingListFile={setPackingListFile}
            excelData={excelData}
            setExcelData={setExcelData}
            packingListData={packingListData}
            setPackingListData={setPackingListData}
          />
        </>
      )}

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
