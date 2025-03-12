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
   * Procesa el archivo y lo almacena en el estado.
   */
  const processFile = async (file: File) => {
    try {
      const result = await processUploadedFile(file);
      console.log(result);
      

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.excelData) {
        setExcelFile(file);
        setExcelData(result.excelData);
      }

      if (result.packingListData) {
        setPackingListFile(file);
        setPackingListData(result.packingListData);
      }

      // 🔥 Cuando ambos archivos han sido procesados, los enviamos juntos
      if (excelData && packingListData) {
        onFilesUploaded(excelData, packingListData);
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
        <p>Arrastra uno o dos archivos (Excel, PDF o Imagen) o haz clic para seleccionar</p>
      </div>

      {excelFile && <p>📊 Archivo Base cargado: {excelFile.name}</p>}
      {packingListFile && <p>📄 Packing List cargado: {packingListFile.name}</p>}

      {missingFileMessage && <p className="warning">{missingFileMessage}</p>}
      {error && <p className="error-message">{error}</p>}
    </section>
  );
};

export default FileUploader;
