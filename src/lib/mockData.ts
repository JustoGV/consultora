import { User, Category, Nomenclator, Patient, CertificateData, Administradora } from '@/types';

// Mock Administradoras
export const mockAdministradoras: Administradora[] = [
  {
    id: 'adm-1',
    name: 'Salud Integral SA',
    cuit: '30-12345678-9',
    address: 'Av. Corrientes 1234, CABA',
    phone: '+54 11 4444-5555',
    email: 'contacto@saludintegral.com',
    createdAt: '2023-01-15'
  },
  {
    id: 'adm-2',
    name: 'Medicina Total SRL',
    cuit: '30-87654321-0',
    address: 'Av. Santa Fe 5678, CABA',
    phone: '+54 11 5555-6666',
    email: 'info@medicinatotal.com',
    createdAt: '2023-03-20'
  },
  {
    id: 'adm-3',
    name: 'Asistencia Médica Plus',
    cuit: '30-11223344-5',
    address: 'Av. Libertador 9012, CABA',
    phone: '+54 11 6666-7777',
    email: 'contacto@asistenciaplus.com',
    createdAt: '2023-06-10'
  }
];

// Mock users - Un admin global y usuarios por administradora
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Administrador General',
    email: 'admin@consultora.com',
    role: 'admin',
    administradoraId: 'global',
    administradoraName: 'Administración General',
    avatar: 'https://ui-avatars.com/api/?name=Admin+Global&background=0D8ABC&color=fff'
  },
  {
    id: '2',
    name: 'Juan Pérez',
    email: 'juan@saludintegral.com',
    role: 'user',
    administradoraId: 'adm-1',
    administradoraName: 'Salud Integral SA',
    avatar: 'https://ui-avatars.com/api/?name=Juan+Perez&background=22c55e&color=fff'
  },
  {
    id: '3',
    name: 'María López',
    email: 'maria@medicinatotal.com',
    role: 'user',
    administradoraId: 'adm-2',
    administradoraName: 'Medicina Total SRL',
    avatar: 'https://ui-avatars.com/api/?name=Maria+Lopez&background=22c55e&color=fff'
  }
];

// Mock categories - Cada administradora tiene sus propias categorías
export const mockCategories: Category[] = [
  // Categorías globales administradas por el Admin Global
  {
    id: '1',
    name: 'Discapacidad Motriz',
    description: 'Afecciones relacionadas con la movilidad y el sistema motor',
    code: 'DM-001',
    administradoraId: 'global'
  },
  {
    id: '2',
    name: 'Discapacidad Sensorial',
    description: 'Afecciones relacionadas con los sentidos (visual, auditiva)',
    code: 'DS-002',
    administradoraId: 'global'
  },
  {
    id: '3',
    name: 'Discapacidad Mental',
    description: 'Afecciones relacionadas con la salud mental',
    code: 'DM-003',
    administradoraId: 'global'
  },
  {
    id: '4',
    name: 'Discapacidad Intelectual',
    description: 'Afecciones relacionadas con el desarrollo cognitivo',
    code: 'DI-004',
    administradoraId: 'global'
  },
  {
    id: '5',
    name: 'Discapacidad Visceral',
    description: 'Afecciones relacionadas con órganos internos',
    code: 'DV-005',
    administradoraId: 'global'
  },
  {
    id: '6',
    name: 'Discapacidad Motriz (Alternativa)',
    description: 'Otra versión de categoría motriz',
    code: 'DM-006',
    administradoraId: 'global'
  }
];

// Mock nomenclators - Cada administradora tiene sus propios nomencladores
export const mockNomenclators: Nomenclator[] = [
  // Nomencladores globales administrados por el Admin Global
  {
    id: '1',
    code: 'NOM-001',
    description: 'Silla de ruedas manual estándar',
    category: 'Discapacidad Motriz',
    price: 150000,
    administradoraId: 'global'
  },
  {
    id: '2',
    code: 'NOM-002',
    description: 'Silla de ruedas eléctrica',
    category: 'Discapacidad Motriz',
    price: 450000,
    administradoraId: 'global'
  },
  {
    id: '3',
    code: 'NOM-003',
    description: 'Audífono digital',
    category: 'Discapacidad Sensorial',
    price: 80000,
    administradoraId: 'global'
  },
  {
    id: '4',
    code: 'NOM-004',
    description: 'Bastón blanco para personas ciegas',
    category: 'Discapacidad Sensorial',
    price: 5000,
    administradoraId: 'global'
  },
  {
    id: '5',
    code: 'NOM-005',
    description: 'Prótesis de miembro inferior',
    category: 'Discapacidad Motriz',
    price: 300000,
    administradoraId: 'global'
  },
  {
    id: '6',
    code: 'NOM-006',
    description: 'Andador ortopédico',
    category: 'Discapacidad Motriz',
    price: 45000,
    administradoraId: 'global'
  }
];

// Mock patients - Un paciente puede tener certificados de múltiples administradoras
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
    administradoras: ['adm-1', 'adm-2'], // Paciente atendido por 2 administradoras
    certificates: [
      {
        id: 'cert-1',
        patientId: '1',
        administradoraId: 'adm-1', // Certificado de Salud Integral SA
        uploadDate: '2024-01-15',
        fileName: 'certificado_discapacidad_maria.pdf',
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
          observations: 'Requiere silla de ruedas eléctrica y adaptaciones en el hogar'
        }
      },
      {
        id: 'cert-3',
        patientId: '1',
        administradoraId: 'adm-2', // Otro certificado de Medicina Total SRL
        uploadDate: '2024-03-10',
        fileName: 'certificado_discapacidad_maria_2.pdf',
        fileUrl: '/uploads/cert-3.pdf',
        extractedData: {
          patientName: 'María González',
          documentNumber: '12345678',
          dateOfBirth: '1985-03-15',
          gender: 'Femenino',
          disability: 'Paraplejia',
          disabilityLevel: '76%',
          category: 'Discapacidad Intelectual',
          nomenclator: 'NOM-005',
          issueDate: '2024-03-05',
          expiryDate: '2026-03-05',
          certifyingDoctor: 'Dr. Pedro López',
          observations: 'Requiere prótesis de miembro inferior'
        }
      }
    ]
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
    administradoras: ['adm-1'], // Solo atendido por Salud Integral SA
    certificates: [
      {
        id: 'cert-2',
        patientId: '2',
        administradoraId: 'adm-1',
        uploadDate: '2024-02-20',
        fileName: 'certificado_discapacidad_roberto.pdf',
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
          observations: 'Requiere audífonos digitales bilaterales'
        }
      }
    ]
  },
  {
    id: '3',
    name: 'Laura Sánchez',
    documentNumber: '45678912',
    dateOfBirth: '1992-11-08',
    gender: 'Femenino',
    email: 'laura.sanchez@example.com',
    phone: '+54 11 4567-8912',
    address: 'Av. Santa Fe 5678, CABA',
    administradoras: ['adm-2', 'adm-3'], // Atendida por 2 administradoras diferentes
    certificates: [
      {
        id: 'cert-4',
        patientId: '3',
        administradoraId: 'adm-3',
        uploadDate: '2024-04-01',
        fileName: 'certificado_discapacidad_laura.pdf',
        fileUrl: '/uploads/cert-4.pdf',
        extractedData: {
          patientName: 'Laura Sánchez',
          documentNumber: '45678912',
          dateOfBirth: '1992-11-08',
          gender: 'Femenino',
          disability: 'Artritis reumatoide',
          disabilityLevel: '45%',
          category: 'Discapacidad Motriz',
          nomenclator: 'NOM-006',
          issueDate: '2024-03-28',
          expiryDate: '2026-03-28',
          certifyingDoctor: 'Dr. Juan Gómez',
          observations: 'Requiere andador ortopédico'
        }
      }
    ]
  },
  {
    id: '4',
    name: 'Carlos Rodríguez',
    documentNumber: '23456789',
    dateOfBirth: '1990-05-12',
    gender: 'Masculino',
    email: 'carlos.rodriguez@example.com',
    phone: '+54 11 2345-6789',
    address: 'Av. Libertador 3456, CABA',
    administradoras: ['adm-3'], // Solo atendido por Asistencia Médica Plus
    certificates: []
  }
];

// Mock certificate data for simulation
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
