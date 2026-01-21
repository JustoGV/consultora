'use client';

import { useState } from 'react';
import { CloudArrowUpIcon, DocumentIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    patientName: string;
    documentNumber: string;
    dateOfBirth: string;
    gender: string;
    disability: string;
    disabilityLevel: string;
    category: string;
    nomenclator: string;
    issueDate: string;
    expiryDate: string;
    certifyingDoctor: string;
    observations: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploaded(false);
      setExtractedData(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    
    // Simulate upload and data extraction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock extracted data
    const mockData = {
      patientName: 'Juan Pérez',
      documentNumber: '12345678',
      dateOfBirth: '1990-05-15',
      gender: 'Masculino',
      disability: 'Discapacidad Visual Bilateral',
      disabilityLevel: '80%',
      category: 'Discapacidad Sensorial',
      nomenclator: 'NOM-004',
      issueDate: '2024-01-20',
      expiryDate: '2026-01-20',
      certifyingDoctor: 'Dra. Patricia López',
      observations: 'Requiere bastón blanco y adaptaciones visuales'
    };

    setExtractedData(mockData);
    setUploading(false);
    setUploaded(true);
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Subir Certificado de Discapacidad</h1>
      <p className="text-gray-600 mb-8">Carga el certificado en formato PDF para extraer la información automáticamente</p>

      {/* Upload Area */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
          {!file ? (
            <div>
              <CloudArrowUpIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Arrastra y suelta el archivo PDF aquí, o haz clic para seleccionar</p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
              >
                Seleccionar Archivo
              </label>
            </div>
          ) : (
            <div>
              <DocumentIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <p className="text-gray-900 font-medium mb-2">{file.name}</p>
              <p className="text-gray-500 text-sm mb-4">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              {!uploaded && (
                <div className="space-x-4">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400"
                  >
                    {uploading ? 'Procesando...' : 'Procesar Certificado'}
                  </button>
                  <button
                    onClick={() => setFile(null)}
                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}
              {uploaded && (
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <CheckCircleIcon className="w-6 h-6" />
                  <span className="font-semibold">Certificado procesado exitosamente</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Extracted Data */}
      {extractedData && (
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Datos Extraídos del Certificado</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Paciente</label>
              <input
                type="text"
                value={extractedData.patientName}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Documento</label>
              <input
                type="text"
                value={extractedData.documentNumber}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
              <input
                type="text"
                value={extractedData.dateOfBirth}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
              <input
                type="text"
                value={extractedData.gender}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Discapacidad</label>
              <input
                type="text"
                value={extractedData.disability}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Discapacidad</label>
              <input
                type="text"
                value={extractedData.disabilityLevel}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <input
                type="text"
                value={extractedData.category}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomenclador</label>
              <input
                type="text"
                value={extractedData.nomenclator}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Emisión</label>
              <input
                type="text"
                value={extractedData.issueDate}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento</label>
              <input
                type="text"
                value={extractedData.expiryDate}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Médico Certificante</label>
              <input
                type="text"
                value={extractedData.certifyingDoctor}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea
                value={extractedData.observations}
                readOnly
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              />
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Guardar Certificado
            </button>
            <button
              onClick={() => {
                setFile(null);
                setExtractedData(null);
                setUploaded(false);
              }}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Subir Otro Certificado
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
