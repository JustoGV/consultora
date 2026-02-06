import { User, Categoria, Nomenclador, Patient, CertificateData, Administradora } from '@/types';

// Mock Administradoras (temporal - serán del API)
export const mockAdministradoras: Administradora[] = [
  {
    id: 'adm-1',
    nombre: 'Salud Integral SA',
    codigo: 'SI-001',
    descripcion: 'Obra social principal',
    activo: true,
    createdAt: '2023-01-15',
    updatedAt: '2023-01-15'
  },
  {
    id: 'adm-2',
    nombre: 'Medicina Total SRL',
    codigo: 'MT-002',
    descripcion: 'Prepaga médica',
    activo: true,
    createdAt: '2023-03-20',
    updatedAt: '2023-03-20'
  }
];

// Mock users - TEMPORAL (el backend maneja auth real)
export const mockUsers: User[] = [];

// Mock categories - TEMPORAL (vendrán del API)
export const mockCategories: Categoria[] = [];

// Mock nomenclators - TEMPORAL (vendrán del API)
export const mockNomenclators: Nomenclador[] = [];

// Mock patients - Datos de ejemplo ampliados
export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'María González',
    documentNumber: '12345678',
    dateOfBirth: '1985-03-15',
    gender: 'Femenino',
    email: 'maria.gonzalez@example.com',
    phone: '+54 11 1234-5678',
    address: 'Av. Corrientes 1234, CABA',
    administradoras: ['adm-1'],
    certificates: [{
      id: 'cert-1',
      patientId: '1',
      administradoraId: 'adm-1',
      uploadDate: '2024-01-15',
      fileName: 'certificado_maria.pdf',
      fileUrl: '/uploads/cert-1.pdf',
      extractedData: {
        patientName: 'María González',
        documentNumber: '12345678',
        dateOfBirth: '1985-03-15',
        gender: 'Femenino',
        disability: 'Paraplejia',
        disabilityLevel: '76%',
        category: 'Discapacidad Motriz',
        nomenclator: 'NOM-002',
        issueDate: '2024-01-10',
        expiryDate: '2026-01-10',
        certifyingDoctor: 'Dr. Carlos Ramírez',
        observations: 'Requiere silla de ruedas eléctrica'
      }
    }]
  },
  {
    id: '2',
    name: 'Roberto Fernández',
    documentNumber: '87654321',
    dateOfBirth: '1978-07-22',
    gender: 'Masculino',
    email: 'roberto.fernandez@example.com',
    phone: '+54 11 8765-4321',
    address: 'Calle Falsa 123, CABA',
    administradoras: ['adm-1'],
    certificates: [{
      id: 'cert-2',
      patientId: '2',
      administradoraId: 'adm-1',
      uploadDate: '2024-02-20',
      fileName: 'certificado_roberto.pdf',
      fileUrl: '/uploads/cert-2.pdf',
      extractedData: {
        patientName: 'Roberto Fernández',
        documentNumber: '87654321',
        dateOfBirth: '1978-07-22',
        gender: 'Masculino',
        disability: 'Hipoacusia bilateral severa',
        disabilityLevel: '65%',
        category: 'Discapacidad Sensorial',
        nomenclator: 'NOM-003',
        issueDate: '2024-02-15',
        expiryDate: '2026-02-15',
        certifyingDoctor: 'Dra. Ana Martínez',
        observations: 'Requiere audífonos bilaterales'
      }
    }]
  },
  {
    id: '3',
    name: 'Ana López',
    documentNumber: '23456789',
    dateOfBirth: '1992-11-08',
    gender: 'Femenino',
    email: 'ana.lopez@example.com',
    phone: '+54 11 2345-6789',
    address: 'Av. Santa Fe 2500, CABA',
    administradoras: ['adm-1'],
    certificates: [{
      id: 'cert-3',
      patientId: '3',
      administradoraId: 'adm-1',
      uploadDate: '2023-12-10',
      fileName: 'certificado_ana.pdf',
      fileUrl: '/uploads/cert-3.pdf',
      extractedData: {
        patientName: 'Ana López',
        documentNumber: '23456789',
        dateOfBirth: '1992-11-08',
        gender: 'Femenino',
        disability: 'Síndrome de Down',
        disabilityLevel: '85%',
        category: 'Discapacidad Mental',
        nomenclator: 'NOM-001',
        issueDate: '2023-12-01',
        expiryDate: '2025-12-01',
        certifyingDoctor: 'Dr. Juan Pérez',
        observations: 'Acompañamiento terapéutico necesario'
      }
    }]
  },
  {
    id: '4',
    name: 'Carlos Ruiz',
    documentNumber: '34567890',
    dateOfBirth: '1965-05-20',
    gender: 'Masculino',
    email: 'carlos.ruiz@example.com',
    phone: '+54 11 3456-7890',
    address: 'Calle Florida 800, CABA',
    administradoras: ['adm-2'],
    certificates: [{
      id: 'cert-4',
      patientId: '4',
      administradoraId: 'adm-2',
      uploadDate: '2024-01-05',
      fileName: 'certificado_carlos.pdf',
      fileUrl: '/uploads/cert-4.pdf',
      extractedData: {
        patientName: 'Carlos Ruiz',
        documentNumber: '34567890',
        dateOfBirth: '1965-05-20',
        gender: 'Masculino',
        disability: 'Ceguera bilateral',
        disabilityLevel: '95%',
        category: 'Discapacidad Sensorial',
        nomenclator: 'NOM-004',
        issueDate: '2024-01-01',
        expiryDate: '2026-01-01',
        certifyingDoctor: 'Dra. Laura Sánchez',
        observations: 'Bastón blanco y perro guía'
      }
    }]
  },
  {
    id: '5',
    name: 'Sofía Martínez',
    documentNumber: '45678901',
    dateOfBirth: '2005-09-12',
    gender: 'Femenino',
    email: 'sofia.martinez@example.com',
    phone: '+54 11 4567-8901',
    address: 'Av. Belgrano 1500, CABA',
    administradoras: ['adm-1'],
    certificates: [{
      id: 'cert-5',
      patientId: '5',
      administradoraId: 'adm-1',
      uploadDate: '2024-02-28',
      fileName: 'certificado_sofia.pdf',
      fileUrl: '/uploads/cert-5.pdf',
      extractedData: {
        patientName: 'Sofía Martínez',
        documentNumber: '45678901',
        dateOfBirth: '2005-09-12',
        gender: 'Femenino',
        disability: 'Parálisis cerebral',
        disabilityLevel: '70%',
        category: 'Discapacidad Motriz',
        nomenclator: 'NOM-002',
        issueDate: '2024-02-20',
        expiryDate: '2026-02-20',
        certifyingDoctor: 'Dr. Roberto García',
        observations: 'Terapia física semanal requerida'
      }
    }]
  },
  {
    id: '6',
    name: 'Diego Rodríguez',
    documentNumber: '56789012',
    dateOfBirth: '1988-04-30',
    gender: 'Masculino',
    email: 'diego.rodriguez@example.com',
    phone: '+54 11 5678-9012',
    address: 'Calle Lavalle 600, CABA',
    administradoras: ['adm-2'],
    certificates: [{
      id: 'cert-6',
      patientId: '6',
      administradoraId: 'adm-2',
      uploadDate: '2023-11-15',
      fileName: 'certificado_diego.pdf',
      fileUrl: '/uploads/cert-6.pdf',
      extractedData: {
        patientName: 'Diego Rodríguez',
        documentNumber: '56789012',
        dateOfBirth: '1988-04-30',
        gender: 'Masculino',
        disability: 'Esquizofrenia',
        disabilityLevel: '55%',
        category: 'Discapacidad Mental',
        nomenclator: 'NOM-005',
        issueDate: '2023-11-01',
        expiryDate: '2024-11-01',
        certifyingDoctor: 'Dra. María Fernández',
        observations: 'Tratamiento psiquiátrico continuo'
      }
    }]
  },
  {
    id: '7',
    name: 'Laura Díaz',
    documentNumber: '67890123',
    dateOfBirth: '1970-12-25',
    gender: 'Femenino',
    email: 'laura.diaz@example.com',
    phone: '+54 11 6789-0123',
    address: 'Av. 9 de Julio 1000, CABA',
    administradoras: ['adm-1'],
    certificates: [{
      id: 'cert-7',
      patientId: '7',
      administradoraId: 'adm-1',
      uploadDate: '2024-01-20',
      fileName: 'certificado_laura.pdf',
      fileUrl: '/uploads/cert-7.pdf',
      extractedData: {
        patientName: 'Laura Díaz',
        documentNumber: '67890123',
        dateOfBirth: '1970-12-25',
        gender: 'Femenino',
        disability: 'Amputación miembro inferior',
        disabilityLevel: '80%',
        category: 'Discapacidad Motriz',
        nomenclator: 'NOM-002',
        issueDate: '2024-01-15',
        expiryDate: '2026-01-15',
        certifyingDoctor: 'Dr. Miguel Torres',
        observations: 'Prótesis de pierna derecha'
      }
    }]
  },
  {
    id: '8',
    name: 'Pedro Sánchez',
    documentNumber: '78901234',
    dateOfBirth: '2010-08-18',
    gender: 'Masculino',
    email: 'pedro.sanchez@example.com',
    phone: '+54 11 7890-1234',
    address: 'Calle Maipú 400, CABA',
    administradoras: ['adm-1'],
    certificates: [{
      id: 'cert-8',
      patientId: '8',
      administradoraId: 'adm-1',
      uploadDate: '2024-02-10',
      fileName: 'certificado_pedro.pdf',
      fileUrl: '/uploads/cert-8.pdf',
      extractedData: {
        patientName: 'Pedro Sánchez',
        documentNumber: '78901234',
        dateOfBirth: '2010-08-18',
        gender: 'Masculino',
        disability: 'Autismo',
        disabilityLevel: '60%',
        category: 'Discapacidad Mental',
        nomenclator: 'NOM-001',
        issueDate: '2024-02-05',
        expiryDate: '2026-02-05',
        certifyingDoctor: 'Dra. Silvia Romero',
        observations: 'Integración escolar con apoyo'
      }
    }]
  }
];

// Mock certificate data template
export const mockCertificateData: CertificateData = {
  patientName: '',
  documentNumber: '',
  dateOfBirth: '',
  gender: '',
  disability: '',
  disabilityLevel: '',
  category: '',
  nomenclator: '',
  issueDate: '',
  expiryDate: '',
  certifyingDoctor: ''
};
