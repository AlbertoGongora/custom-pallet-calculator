import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import '../../styles/fileUploader.css';
import { processUploadedFile } from '../../services/fileService';
import { ProcessedData } from '../processing/excelProcessor';
import { PackingListData } from '../processing/packingListProcessor';

interface FileUploaderProps {
  onFilesUploaded: (excelData: ProcessedData[], packingList: PackingListData[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesUploaded }) => {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [packingListFile, setPackingListFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<ProcessedData[] | null>(null);
  const [packingListData, setPackingListData] = useState<PackingListData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missingFileMessage, setMissingFileMessage] = useState<string | null>(null);

  /**
   * 📌 `processFile`
   * Determina el tipo de archivo y lo procesa adecuadamente.
   */
  const processFile = async (file: File) => {
    try {
      const result = await processUploadedFile(file);
  
      if (result.error) {
        setError(result.error);
        return;
      }

      setError(null); // ✅ Eliminamos errores previos

      // ✅ Guardamos los nuevos datos sin perder los anteriores
      const newExcelData = result.excelData ? result.excelData : excelData;
      const newPackingListData = result.packingListData ? result.packingListData : packingListData;

      setExcelData(newExcelData);
      setPackingListData(newPackingListData);

      if (result.excelData) {
        setExcelFile(file);
      }

      if (result.packingListData) {
        setPackingListFile(file);
      }

      console.log("✅ Excel Data después de setState:", newExcelData);
      console.log("✅ Packing List Data después de setState:", newPackingListData);

      // ✅ Comprobamos que ambos datos están listos antes de llamar a `onFilesUploaded`
      if (newExcelData && newPackingListData && newExcelData.length > 0 && newPackingListData.length > 0) {
        console.log("🚀 Ejecutando `onFilesUploaded`...");
        onFilesUploaded(newExcelData, newPackingListData);
        setMissingFileMessage(null);
      } else {
        console.log("⚠️ Falta un archivo para procesar.");
        setMissingFileMessage("❗ Esperando el otro archivo para procesar.");
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
      setError('No se subió ningún archivo.');
      return;
    }

    for (const file of acceptedFiles) {
      await processFile(file);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
  });

  return (
    <section className="file-uploader">
      <div {...getRootProps()} className="upload-area">
        <input {...getInputProps()} />
        <p>Arrastra los archivos (Excel Base y Packing List) o haz clic para seleccionarlos</p>
      </div>

      {/* 📂 Mostramos los archivos cargados */}
      {excelFile && <p>📊 Archivo Base cargado</p>}
      {packingListFile && <p>📄 Packing List cargado</p>}

      {/* 🚨 Mensajes de error o espera */}
      {missingFileMessage && <p className="warning">❗ {missingFileMessage}</p>}
      {error && <p className="error-message">❌ {error}</p>}
    </section>
  );
};

export default FileUploader;
