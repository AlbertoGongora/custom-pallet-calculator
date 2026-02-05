import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import "../../styles/fileUploader.css";
import { processUploadedFile } from "../../services/fileService";
import { ProcessedData } from "../processing/excelProcessor";
import { PackingListData } from "../processing/packingListProcessor";

interface FileUploaderProps {
  onFilesUploaded: (excelData: ProcessedData[], packingList: PackingListData[]) => void;

  // ✅ viene del App (estado compartido)
  packlistSuffix: string;

  excelFile: File | null;
  setExcelFile: (f: File | null) => void;
  packingListFile: File | null;
  setPackingListFile: (f: File | null) => void;

  excelData: ProcessedData[] | null;
  setExcelData: (d: ProcessedData[] | null) => void;
  packingListData: PackingListData[] | null;
  setPackingListData: (d: PackingListData[] | null) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesUploaded,
  packlistSuffix,

  excelFile,
  setExcelFile,
  packingListFile,
  setPackingListFile,
  excelData,
  setExcelData,
  packingListData,
  setPackingListData,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [missingFileMessage, setMissingFileMessage] = useState<string | null>(null);

  const processFile = async (file: File) => {
    try {
      // ✅ pasamos el sufijo para PDF
      const result = await processUploadedFile(file, packlistSuffix);

      console.log('[Uploader] current suffix =', packlistSuffix);
      console.log('[Uploader] file dropped =', file.name);


      if (result.error) {
        setError(result.error);
        return;
      }

      setError(null);

      const newExcelData = result.excelData ? result.excelData : excelData;
      const newPackingListData = result.packingListData ? result.packingListData : packingListData;

      setExcelData(newExcelData);
      setPackingListData(newPackingListData);

      if (result.excelData) setExcelFile(file);
      if (result.packingListData) setPackingListFile(file);

      if (
        newExcelData &&
        newPackingListData &&
        newExcelData.length > 0 &&
        newPackingListData.length > 0
      ) {
        onFilesUploaded(newExcelData, newPackingListData);
        setMissingFileMessage(null);
      } else {
        setMissingFileMessage("Esperando el otro archivo para procesar.");
      }
    } catch (err) {
      console.error(err);
      setError(`Error al procesar el archivo: ${file.name}`);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    setError(null);
    setMissingFileMessage(null);

    if (acceptedFiles.length === 0) {
      setError("No se subió ningún archivo.");
      return;
    }

    for (const file of acceptedFiles) {
      await processFile(file);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
  });

  return (
    <section className="file-uploader">
      <div {...getRootProps()} className="upload-area">
        <input {...getInputProps()} />
        <p>Arrastra 1 archivo (Excel Base o Packing List) o</p>
        <p>haz clic para seleccionar primero uno y luego otro.</p>
      </div>

      {excelFile && <p>📊 Archivo Excel Ip6 cargado</p>}
      {packingListFile && <p>📄 Packing List cargado</p>}

      {missingFileMessage && <p className="warning">{missingFileMessage}</p>}
      {error && <p className="error-message">❌ {error}</p>}
    </section>
  );
};

export default FileUploader;
