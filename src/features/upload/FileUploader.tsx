import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { processExcelFile, ProcessedData } from '../processing/excelProcessor';
import { processPackingList, PackingListData } from '../processing/packingListProcessor';
import '../../styles/fileUploader.css';

interface FileUploaderProps {
  onFilesUploaded: (excelData: ProcessedData[], packingList: PackingListData[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesUploaded }) => {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [packingListFile, setPackingListFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missingFileMessage, setMissingFileMessage] = useState<string | null>(null);

  /**
   * 📌 `processFile`
   * Determina el tipo de archivo y lo procesa adecuadamente.
   */
  const processFile = async (file: File) => {
    try {
      const fileType = file.name.split('.').pop()?.toLowerCase();

      if (fileType === 'pdf' || fileType === 'png' || fileType === 'jpg' || fileType === 'jpeg') {
        setPackingListFile(file);
        const packingListData = await processPackingList(file);
        if (excelFile) {
          onFilesUploaded(await processExcelFile(excelFile), packingListData);
        }
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        const processedData = await processExcelFile(file);
        setExcelFile(file);

        if (packingListFile) {
          onFilesUploaded(processedData, await processPackingList(packingListFile));
        } else {
          setMissingFileMessage('❗ Falta subir el archivo Packing List');
        }
      } else {
        setError('Formato de archivo no soportado.');
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
