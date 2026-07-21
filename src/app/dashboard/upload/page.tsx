'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  CreatePersonaDto,
  CreateAfiliacionDto,
  CreateCertificadoDiscapacidadDto,
  EstadoCivil,
  ObraSocial,
  TipoDiscapacidad,
  TipoDocumento,
  RolAfiliacion,
  Persona,
} from '@/types';
import { personasService } from '@/services/personasService';
import { afiliacionesService } from '@/services/afiliacionesService';
import { certificadosDiscapacidadService } from '@/services/certificadosDiscapacidadService';
import { estadoCivilService } from '@/services/estadoCivilService';
import { obrasSocialesService } from '@/services/obrasSocialesService';
import { administradoraService } from '@/services/administradoraService';
import { tipoDiscapacidadService } from '@/services/tipoDiscapacidadService';
import { CheckCircle2, FilePlus2, Check, Loader2 } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import DigitCounter from '@/components/DigitCounter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mapServerErrors } from '@/lib/errorUtils';
import {
  sanitizeDigits,
  isValidDni,
  isValidCuil,
  isValidEmailFormat,
  validateTelefonoAR,
  validateCodigoPostalAR,
  validateEmailLive,
  validarFechasCertificadoAR,
} from '@/lib/formUtils';
import { useFormKeyboard } from '@/hooks/useFormKeyboard';

const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string }[] = [
  { value: 'DNI', label: 'DNI' },
  { value: 'CUIL', label: 'CUIL/CUIT' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'OTRO', label: 'Otro' },
];

const SEXO_OPTIONS = [
  { value: 'M', label: 'M — Masculino' },
  { value: 'F', label: 'F — Femenino' },
  { value: 'X', label: 'X — Tercer género' },
];

const ROL_OPTIONS: { value: RolAfiliacion; label: string }[] = [
  { value: 'TITULAR', label: 'Titular' },
  { value: 'ADHERENTE', label: 'Adherente' },
];

const GRADO_OPTIONS = [
  { value: 'Leve', label: 'Leve' },
  { value: 'Moderado', label: 'Moderado' },
  { value: 'Severo', label: 'Severo' },
  { value: 'Muy Severo', label: 'Muy Severo' },
];

function emptyPersonaForm(administradoraId: string): CreatePersonaDto {
  return {
    nombre: '',
    apellido: '',
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    cuil: '',
    fechaNacimiento: '',
    sexo: '',
    email: '',
    telefono: '',
    celular: '',
    direccion: '',
    localidad: '',
    provincia: '',
    codigoPostal: '',
    estadoCivilId: '',
    administradoraId,
    activo: true,
  };
}

function emptyAfiliacionForm(personaId: string, administradoraId: string): CreateAfiliacionDto {
  return {
    personaId,
    obraSocialId: '',
    rol: 'TITULAR',
    numeroAfiliado: '',
    plan: '',
    fechaAlta: '',
    observaciones: '',
    administradoraId,
    activo: true,
  };
}

function emptyCertificadoForm(
  administradoraId: string
): Omit<CreateCertificadoDiscapacidadDto, 'personaId' | 'tipoDiscapacidadIds'> & { tipoDiscapacidadId: string } {
  return {
    numeroCertificado: '',
    fechaEmision: '',
    fechaVencimiento: '',
    grado: '',
    observaciones: '',
    tipoDiscapacidadId: '',
    administradoraId,
    activo: true,
  };
}

/** Omite claves vacías del payload: `""` nunca viaja en opcionales (RN-17/F1.4). */
function stripEmpty<T extends object>(data: T): T {
  const payload = { ...data };
  (Object.keys(payload) as (keyof T)[]).forEach((key) => {
    if (payload[key] === '') {
      (payload as Record<string, unknown>)[key as string] = undefined;
    }
  });
  return payload;
}

type Step = 1 | 2 | 3;

/**
 * Alta rápida rol USER (F-6): una sola pantalla en tres pasos —
 * (1) datos del paciente, (2) afiliación (opcional/salteable), (3) certificado
 * CUD. Reemplaza el viejo formulario monolítico de Afiliado+Certificado.
 */
export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [estadosCiviles, setEstadosCiviles] = useState<EstadoCivil[]>([]);
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([]);
  const [tiposDiscapacidad, setTiposDiscapacidad] = useState<TipoDiscapacidad[]>([]);

  const [personaCreada, setPersonaCreada] = useState<Persona | null>(null);
  const [afiliacionOmitida, setAfiliacionOmitida] = useState(false);

  const administradoraId = user?.administradoraId || '';

  const [personaData, setPersonaData] = useState<CreatePersonaDto>(() => emptyPersonaForm(administradoraId));
  const [afiliacionData, setAfiliacionData] = useState<CreateAfiliacionDto>(() => emptyAfiliacionForm('', administradoraId));
  const [certificadoData, setCertificadoData] = useState(() => emptyCertificadoForm(administradoraId));

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCatalogos();
  }, []);

  useEffect(() => {
    if (user?.administradoraId) {
      setPersonaData((prev) => ({ ...prev, administradoraId: user.administradoraId || '' }));
      setAfiliacionData((prev) => ({ ...prev, administradoraId: user.administradoraId || '' }));
      setCertificadoData((prev) => ({ ...prev, administradoraId: user.administradoraId || '' }));
    }
  }, [user?.administradoraId]);

  useEffect(() => {
    if (user?.administradoraId) {
      administradoraService
        .getById(user.administradoraId)
        .then((administradora) => {
          if (administradora.obraSocialPredeterminadaId) {
            // RN-14: preset editable de la OS predeterminada de la administradora
            setAfiliacionData((prev) => ({ ...prev, obraSocialId: administradora.obraSocialPredeterminadaId || '' }));
          }
        })
        .catch(() => { /* superadmin sin administradora u otro error: sin preset, silencioso */ });
    }
  }, [user?.administradoraId]);

  const loadCatalogos = async () => {
    try {
      const [estadosData, obrasSocialesData, tiposData] = await Promise.all([
        estadoCivilService.getAll(),
        obrasSocialesService.getAll(),
        tipoDiscapacidadService.getAll(),
      ]);
      setEstadosCiviles(estadosData);
      setObrasSociales(obrasSocialesData);
      setTiposDiscapacidad(tiposData);
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
    }
  };

  const estadoCivilOptions = estadosCiviles.map((estado) => ({ value: estado.id, label: estado.nombre }));
  const obraSocialOptions = obrasSociales.map((os) => ({
    value: os.id,
    label: os.sigla ? `${os.nombre} (${os.sigla})` : os.nombre,
  }));
  const tipoDiscapacidadOptions = tiposDiscapacidad.map((tipo) => ({ value: tipo.id, label: tipo.nombre }));

  const isDirtyPaso1 = useMemo(
    () => JSON.stringify(personaData) !== JSON.stringify(emptyPersonaForm(administradoraId)),
    [personaData, administradoraId]
  );

  // ---------- Paso 1: datos del paciente ----------
  const validatePersona = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!personaData.nombre.trim()) errors.nombre = 'Requerido';
    if (!personaData.apellido.trim()) errors.apellido = 'Requerido';
    if (!personaData.numeroDocumento.trim()) errors.numeroDocumento = 'Requerido';
    else if (personaData.tipoDocumento === 'DNI' && !isValidDni(personaData.numeroDocumento)) {
      errors.numeroDocumento = 'El DNI debe tener 7 u 8 dígitos';
    }
    if (personaData.cuil && !isValidCuil(personaData.cuil)) {
      errors.cuil = 'CUIL inválido (11 dígitos + verificador)';
    }
    if (!personaData.fechaNacimiento) errors.fechaNacimiento = 'Requerido';
    if (!personaData.email?.trim()) {
      errors.email = 'El email es obligatorio';
    } else if (!isValidEmailFormat(personaData.email)) {
      errors.email = 'Email con formato inválido';
    }
    const errorTelefono = validateTelefonoAR(personaData.telefono || '');
    if (errorTelefono) errors.telefono = errorTelefono;
    const errorCelular = validateTelefonoAR(personaData.celular || '');
    if (errorCelular) errors.celular = errorCelular;
    const errorCp = validateCodigoPostalAR(personaData.codigoPostal || '');
    if (errorCp) errors.codigoPostal = errorCp;
    return errors;
  };

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // UX-9 — validación en vivo onBlur del paso 1 (también se dispara con Enter).
  const handleBlurValidatePersona = (field: string) => {
    switch (field) {
      case 'numeroDocumento':
        if (personaData.tipoDocumento === 'DNI' && personaData.numeroDocumento && !isValidDni(personaData.numeroDocumento)) {
          setFieldErrors((prev) => ({ ...prev, numeroDocumento: 'El DNI debe tener 7 u 8 dígitos' }));
        } else {
          clearFieldError('numeroDocumento');
        }
        break;
      case 'cuil':
        if (personaData.cuil && !isValidCuil(personaData.cuil)) {
          setFieldErrors((prev) => ({ ...prev, cuil: 'CUIL inválido (11 dígitos + verificador)' }));
        } else {
          clearFieldError('cuil');
        }
        break;
      case 'email': {
        const errorEmail = !personaData.email?.trim()
          ? 'El email es obligatorio'
          : validateEmailLive(personaData.email);
        if (errorEmail) setFieldErrors((prev) => ({ ...prev, email: errorEmail }));
        else clearFieldError('email');
        break;
      }
      case 'telefono': {
        const errorTelefono = validateTelefonoAR(personaData.telefono || '');
        if (errorTelefono) setFieldErrors((prev) => ({ ...prev, telefono: errorTelefono }));
        else clearFieldError('telefono');
        break;
      }
      case 'celular': {
        const errorCelular = validateTelefonoAR(personaData.celular || '');
        if (errorCelular) setFieldErrors((prev) => ({ ...prev, celular: errorCelular }));
        else clearFieldError('celular');
        break;
      }
      case 'codigoPostal': {
        const errorCp = validateCodigoPostalAR(personaData.codigoPostal || '');
        if (errorCp) setFieldErrors((prev) => ({ ...prev, codigoPostal: errorCp }));
        else clearFieldError('codigoPostal');
        break;
      }
    }
  };

  // ---------- Paso 3: fechas del certificado ----------
  const handleBlurValidateCertificado = (field: 'fechaEmision' | 'fechaVencimiento') => {
    const error = validarFechasCertificadoAR(certificadoData.fechaEmision, certificadoData.fechaVencimiento || '');
    // El error de fechas se asocia al campo de vencimiento (es la relación
    // entre ambas fechas la que falla), salvo que la emisión sea futura por
    // sí sola, en cuyo caso se marca en emisión.
    const emisionFutura =
      !!certificadoData.fechaEmision && new Date(certificadoData.fechaEmision) > new Date();
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.fechaEmision;
      delete next.fechaVencimiento;
      if (error) {
        if (emisionFutura && field === 'fechaEmision') next.fechaEmision = error;
        else next.fechaVencimiento = error;
      }
      return next;
    });
  };

  const handleSubmitPaso1 = async () => {
    const errors = validatePersona();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      focusFirstError(errors);
      return;
    }
    setFieldErrors({});
    setFormError('');

    try {
      setLoading(true);
      const payload = stripEmpty(personaData);
      const creada = await personasService.create(payload);
      setPersonaCreada(creada);
      setAfiliacionData(emptyAfiliacionForm(creada.id, administradoraId));
      setStep(2);
    } catch (error) {
      const { fieldErrors: fe, formError: gf } = mapServerErrors(error, Object.keys(personaData));
      const conflict =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { status?: number } }).response?.status === 409
          : false;
      if (conflict && !fe.numeroDocumento) {
        fe.numeroDocumento = 'Ya existe una persona con ese documento';
      }
      setFieldErrors((prev) => ({ ...prev, ...fe }));
      if (gf && !conflict) setFormError(gf);
      focusFirstError(fe);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Paso 2: afiliación (opcional) ----------
  const handleSubmitPaso2 = async () => {
    if (!personaCreada) return;

    // Afiliación es opcional/salteable: si no cargaron obra social, se saltea sin crear nada.
    if (!afiliacionData.obraSocialId) {
      setAfiliacionOmitida(true);
      setFieldErrors({});
      setFormError('');
      setStep(3);
      return;
    }

    const errors: Record<string, string> = {};
    if (!afiliacionData.rol) errors.rol = 'Requerido';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setFormError('');

    try {
      setLoading(true);
      const payload = stripEmpty(afiliacionData);
      await afiliacionesService.create(payload);
      setAfiliacionOmitida(false);
      setStep(3);
    } catch (error) {
      const { fieldErrors: fe, formError: gf } = mapServerErrors(error, Object.keys(afiliacionData));
      const conflict =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { status?: number } }).response?.status === 409
          : false;
      if (conflict) {
        setFormError(gf || 'El paciente ya tiene una afiliación activa en esa obra social.');
      } else {
        setFieldErrors((prev) => ({ ...prev, ...fe }));
        if (gf) setFormError(gf);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaltearPaso2 = () => {
    setAfiliacionOmitida(true);
    setFieldErrors({});
    setFormError('');
    setStep(3);
  };

  // ---------- Paso 3: certificado CUD ----------
  const handleSubmitPaso3 = async () => {
    if (!personaCreada) return;

    const errors: Record<string, string> = {};
    if (!certificadoData.numeroCertificado) errors.numeroCertificado = 'Requerido';
    if (!certificadoData.fechaEmision) errors.fechaEmision = 'Requerido';
    if (!certificadoData.tipoDiscapacidadId) errors.tipoDiscapacidadId = 'Requerido';
    if (!certificadoData.grado) errors.grado = 'Requerido';
    const errorFechas = validarFechasCertificadoAR(certificadoData.fechaEmision, certificadoData.fechaVencimiento || '');
    if (errorFechas) errors.fechaVencimiento = errorFechas;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      focusFirstError(errors);
      return;
    }
    setFieldErrors({});
    setFormError('');

    try {
      setLoading(true);
      const { tipoDiscapacidadId, ...certRest } = certificadoData;
      const payload: CreateCertificadoDiscapacidadDto = {
        ...certRest,
        personaId: personaCreada.id,
        tipoDiscapacidadIds: [tipoDiscapacidadId],
        fechaVencimiento: certificadoData.fechaVencimiento || undefined,
        observaciones: certificadoData.observaciones || undefined,
      };

      await certificadosDiscapacidadService.create(payload);

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/afiliados');
      }, 2000);
    } catch (error) {
      const { fieldErrors: fe, formError: gf } = mapServerErrors(error, Object.keys(certificadoData));
      setFieldErrors((prev) => ({ ...prev, ...fe }));
      if (gf) setFormError(gf);
      focusFirstError(fe);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitStep = () => {
    if (step === 1) return handleSubmitPaso1();
    if (step === 2) return handleSubmitPaso2();
    return handleSubmitPaso3();
  };

  const handleVolver = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else router.back();
  };

  const { onKeyDown, focusFirstError } = useFormKeyboard({
    formRef,
    onSubmit: handleSubmitStep,
    onClose: () => router.back(),
    isDirty: isDirtyPaso1,
  });

  if (success) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Registro Exitoso!</h2>
          <p className="text-gray-600 mb-4">
            El afiliado y su certificado de discapacidad han sido creados correctamente.
          </p>
          <p className="text-sm text-gray-500">Redirigiendo a la lista de afiliados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent flex items-center gap-3">
          <FilePlus2 className="w-8 h-8 text-primary-600" />
          Nuevo Afiliado con Certificado
        </h1>
        <p className="text-gray-600 mt-2">Completá los datos en tres pasos: afiliado, afiliación y certificado.</p>
      </div>

      {/* Indicador de pasos */}
      <div className="flex items-center gap-3">
        <StepBadge n={1} active={step === 1} done={step > 1} label="Afiliado" />
        <StepDivider />
        <StepBadge n={2} active={step === 2} done={step > 2} label="Afiliación" />
        <StepDivider />
        <StepBadge n={3} active={step === 3} done={false} label="Certificado" />
      </div>

      <div
        ref={formRef}
        onKeyDown={onKeyDown}
        className="bg-white rounded-xl shadow-md p-6 space-y-4"
      >
        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Datos del afiliado</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nombre" required error={fieldErrors.nombre}>
                <Input
                  name="nombre"
                  value={personaData.nombre}
                  onChange={(e) => setPersonaData({ ...personaData, nombre: e.target.value })}
                  autoComplete="off"
                  aria-invalid={!!fieldErrors.nombre}
                />
              </Field>
              <Field label="Apellido" required error={fieldErrors.apellido}>
                <Input
                  name="apellido"
                  value={personaData.apellido}
                  onChange={(e) => setPersonaData({ ...personaData, apellido: e.target.value })}
                  autoComplete="off"
                  aria-invalid={!!fieldErrors.apellido}
                />
              </Field>
              <Field label="Tipo de documento" required>
                <SearchableSelect
                  options={TIPOS_DOCUMENTO}
                  value={personaData.tipoDocumento || 'DNI'}
                  onChange={(v) => setPersonaData({ ...personaData, tipoDocumento: v as TipoDocumento })}
                />
              </Field>
              <Field
                label="Número de documento"
                required
                error={fieldErrors.numeroDocumento}
                counter={
                  (personaData.tipoDocumento === 'DNI' || personaData.tipoDocumento === 'CUIL') && (
                    <DigitCounter
                      value={personaData.numeroDocumento}
                      max={personaData.tipoDocumento === 'DNI' ? 8 : 11}
                      min={personaData.tipoDocumento === 'DNI' ? 7 : 11}
                      hasError={!!fieldErrors.numeroDocumento}
                    />
                  )
                }
              >
                <Input
                  name="numeroDocumento"
                  value={personaData.numeroDocumento}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const value =
                      personaData.tipoDocumento === 'DNI'
                        ? sanitizeDigits(raw, 8)
                        : personaData.tipoDocumento === 'CUIL'
                          ? sanitizeDigits(raw, 11)
                          : raw;
                    setPersonaData({ ...personaData, numeroDocumento: value });
                  }}
                  onBlur={() => handleBlurValidatePersona('numeroDocumento')}
                  inputMode={personaData.tipoDocumento === 'DNI' || personaData.tipoDocumento === 'CUIL' ? 'numeric' : 'text'}
                  maxLength={personaData.tipoDocumento === 'DNI' ? 8 : personaData.tipoDocumento === 'CUIL' ? 11 : undefined}
                  className="tabular-nums"
                  autoComplete="off"
                  aria-invalid={!!fieldErrors.numeroDocumento}
                />
              </Field>
              <Field
                label="CUIL/CUIT"
                error={fieldErrors.cuil}
                counter={<DigitCounter value={personaData.cuil || ''} max={11} hasError={!!fieldErrors.cuil} />}
              >
                <Input
                  name="cuil"
                  value={personaData.cuil}
                  onChange={(e) => setPersonaData({ ...personaData, cuil: sanitizeDigits(e.target.value, 11) })}
                  onBlur={() => handleBlurValidatePersona('cuil')}
                  inputMode="numeric"
                  maxLength={11}
                  className="tabular-nums"
                  autoComplete="off"
                  aria-invalid={!!fieldErrors.cuil}
                />
              </Field>
              <Field label="Fecha de nacimiento" required error={fieldErrors.fechaNacimiento}>
                <Input
                  type="date"
                  name="fechaNacimiento"
                  value={personaData.fechaNacimiento}
                  onChange={(e) => setPersonaData({ ...personaData, fechaNacimiento: e.target.value })}
                  className="tabular-nums"
                  aria-invalid={!!fieldErrors.fechaNacimiento}
                />
              </Field>
              <Field label="Sexo">
                <SearchableSelect
                  options={SEXO_OPTIONS}
                  value={personaData.sexo || ''}
                  onChange={(v) => setPersonaData({ ...personaData, sexo: v })}
                  emptyMessage="Sin opciones"
                />
              </Field>
              <Field label="Estado civil">
                <SearchableSelect
                  options={estadoCivilOptions}
                  value={personaData.estadoCivilId || ''}
                  onChange={(v) => setPersonaData({ ...personaData, estadoCivilId: v })}
                  emptyMessage="Sin estados civiles cargados"
                />
              </Field>
              <Field label="Email" required error={fieldErrors.email}>
                <Input
                  type="email"
                  name="email"
                  value={personaData.email}
                  onChange={(e) => setPersonaData({ ...personaData, email: e.target.value })}
                  onBlur={() => handleBlurValidatePersona('email')}
                  autoComplete="off"
                  aria-invalid={!!fieldErrors.email}
                />
              </Field>
              <Field
                label="Teléfono"
                error={fieldErrors.telefono}
                counter={
                  <DigitCounter value={personaData.telefono || ''} max={13} min={6} hasError={!!fieldErrors.telefono} />
                }
              >
                <Input
                  name="telefono"
                  value={personaData.telefono}
                  onChange={(e) => setPersonaData({ ...personaData, telefono: sanitizeDigits(e.target.value, 13) })}
                  onBlur={() => handleBlurValidatePersona('telefono')}
                  inputMode="numeric"
                  maxLength={13}
                  className="tabular-nums"
                  autoComplete="off"
                  aria-invalid={!!fieldErrors.telefono}
                />
              </Field>
              <Field
                label="Celular"
                error={fieldErrors.celular}
                counter={
                  <DigitCounter value={personaData.celular || ''} max={13} min={6} hasError={!!fieldErrors.celular} />
                }
              >
                <Input
                  name="celular"
                  value={personaData.celular}
                  onChange={(e) => setPersonaData({ ...personaData, celular: sanitizeDigits(e.target.value, 13) })}
                  onBlur={() => handleBlurValidatePersona('celular')}
                  inputMode="numeric"
                  maxLength={13}
                  className="tabular-nums"
                  autoComplete="off"
                  aria-invalid={!!fieldErrors.celular}
                />
              </Field>
              <Field label="Dirección">
                <Input
                  name="direccion-sistema"
                  value={personaData.direccion}
                  onChange={(e) => setPersonaData({ ...personaData, direccion: e.target.value })}
                  autoComplete="off"
                />
              </Field>
              <Field label="Localidad">
                <Input
                  name="localidad-sistema"
                  value={personaData.localidad}
                  onChange={(e) => setPersonaData({ ...personaData, localidad: e.target.value })}
                  autoComplete="off"
                />
              </Field>
              <Field label="Provincia">
                <Input
                  name="provincia-sistema"
                  value={personaData.provincia}
                  onChange={(e) => setPersonaData({ ...personaData, provincia: e.target.value })}
                  autoComplete="off"
                />
              </Field>
              <Field label="Código postal" error={fieldErrors.codigoPostal}>
                <Input
                  name="codigoPostal-sistema"
                  value={personaData.codigoPostal}
                  onChange={(e) => setPersonaData({ ...personaData, codigoPostal: e.target.value.slice(0, 8) })}
                  onBlur={() => handleBlurValidatePersona('codigoPostal')}
                  maxLength={8}
                  className="tabular-nums"
                  autoComplete="off"
                  aria-invalid={!!fieldErrors.codigoPostal}
                />
              </Field>
            </div>
          </>
        )}

        {step === 2 && personaCreada && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">
              Afiliación de {personaCreada.apellido}, {personaCreada.nombre}{' '}
              <span className="text-sm font-normal text-gray-500">(opcional)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Obra Social" error={fieldErrors.obraSocialId}>
                <SearchableSelect
                  options={[{ value: '', label: 'Sin obra social (particular)' }, ...obraSocialOptions]}
                  value={afiliacionData.obraSocialId}
                  onChange={(v) => setAfiliacionData({ ...afiliacionData, obraSocialId: v })}
                  placeholder="Seleccionar obra social..."
                />
              </Field>
              <Field label="Rol" required error={fieldErrors.rol}>
                <SearchableSelect
                  options={ROL_OPTIONS}
                  value={afiliacionData.rol}
                  onChange={(v) => setAfiliacionData({ ...afiliacionData, rol: v as RolAfiliacion })}
                />
              </Field>
              <Field label="N° de afiliado">
                <Input
                  name="numeroAfiliado"
                  value={afiliacionData.numeroAfiliado}
                  onChange={(e) => setAfiliacionData({ ...afiliacionData, numeroAfiliado: e.target.value })}
                  className="tabular-nums"
                  autoComplete="off"
                  placeholder="Texto libre"
                />
              </Field>
              <Field label="Plan">
                <Input
                  name="plan"
                  value={afiliacionData.plan}
                  onChange={(e) => setAfiliacionData({ ...afiliacionData, plan: e.target.value })}
                  autoComplete="off"
                />
              </Field>
              <Field label="Fecha de alta">
                <Input
                  type="date"
                  name="fechaAlta"
                  value={afiliacionData.fechaAlta}
                  onChange={(e) => setAfiliacionData({ ...afiliacionData, fechaAlta: e.target.value })}
                  className="tabular-nums"
                />
              </Field>
            </div>
          </>
        )}

        {step === 3 && personaCreada && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">
              Certificado CUD de {personaCreada.apellido}, {personaCreada.nombre}
              {afiliacionOmitida && (
                <span className="ml-2 text-sm font-normal text-gray-500">(sin afiliación cargada)</span>
              )}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field label="Número de certificado" required error={fieldErrors.numeroCertificado}>
                  <Input
                    name="numeroCertificado"
                    value={certificadoData.numeroCertificado}
                    onChange={(e) =>
                      setCertificadoData({ ...certificadoData, numeroCertificado: e.target.value.toUpperCase() })
                    }
                    autoComplete="off"
                    aria-invalid={!!fieldErrors.numeroCertificado}
                  />
                </Field>
              </div>
              <Field label="Tipo de discapacidad" required error={fieldErrors.tipoDiscapacidadId}>
                <SearchableSelect
                  options={tipoDiscapacidadOptions}
                  value={certificadoData.tipoDiscapacidadId}
                  onChange={(v) => setCertificadoData({ ...certificadoData, tipoDiscapacidadId: v })}
                  placeholder="Seleccionar tipo..."
                />
              </Field>
              <Field label="Grado" required error={fieldErrors.grado}>
                <SearchableSelect
                  options={GRADO_OPTIONS}
                  value={certificadoData.grado}
                  onChange={(v) => setCertificadoData({ ...certificadoData, grado: v })}
                  placeholder="Seleccionar grado..."
                />
              </Field>
              <Field label="Fecha de emisión" required error={fieldErrors.fechaEmision}>
                <Input
                  type="date"
                  name="fechaEmision"
                  value={certificadoData.fechaEmision}
                  onChange={(e) => setCertificadoData({ ...certificadoData, fechaEmision: e.target.value })}
                  onBlur={() => handleBlurValidateCertificado('fechaEmision')}
                  className="tabular-nums"
                  aria-invalid={!!fieldErrors.fechaEmision}
                />
              </Field>
              <Field label="Fecha de vencimiento" error={fieldErrors.fechaVencimiento}>
                <Input
                  type="date"
                  name="fechaVencimiento"
                  value={certificadoData.fechaVencimiento}
                  onChange={(e) => setCertificadoData({ ...certificadoData, fechaVencimiento: e.target.value })}
                  onBlur={() => handleBlurValidateCertificado('fechaVencimiento')}
                  className="tabular-nums"
                  aria-invalid={!!fieldErrors.fechaVencimiento}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Observaciones">
                  <textarea
                    value={certificadoData.observaciones}
                    onChange={(e) => setCertificadoData({ ...certificadoData, observaciones: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    maxLength={500}
                    placeholder="Información adicional sobre el certificado..."
                  />
                </Field>
              </div>
            </div>
          </>
        )}

        {formError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <span className="font-medium">Error:</span> {formError}
          </div>
        )}

        <div className="flex gap-3 justify-end border-t pt-4">
          <Button type="button" variant="outline" onClick={handleVolver} disabled={loading}>
            {step === 1 ? 'Cancelar' : 'Volver'}
          </Button>
          {step === 2 && (
            <Button type="button" variant="ghost" onClick={handleSaltearPaso2} disabled={loading}>
              Saltear afiliación
            </Button>
          )}
          <Button type="button" onClick={handleSubmitStep} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? 'Guardando…' : step === 3 ? 'Crear certificado' : 'Continuar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepBadge({ n, active, done, label }: { n: number; active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
          done
            ? 'bg-primary-600 text-white'
            : active
              ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-600'
              : 'bg-neutral-100 text-neutral-500'
        }`}
      >
        {done ? <Check className="size-4" strokeWidth={2.5} /> : n}
      </span>
      <span className={`text-sm font-medium ${active ? 'text-neutral-900' : 'text-neutral-500'}`}>{label}</span>
    </div>
  );
}

function StepDivider() {
  return <span className="h-px w-8 bg-neutral-300" aria-hidden />;
}

function Field({
  label,
  required,
  error,
  counter,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  /** UX-11 — contador de dígitos (DigitCounter), se alinea a la derecha junto al error. */
  counter?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
      {(error || counter) && (
        <div className="mt-1 flex items-start justify-between gap-2">
          <p className="text-xs text-red-600">{error}</p>
          {counter}
        </div>
      )}
    </div>
  );
}
