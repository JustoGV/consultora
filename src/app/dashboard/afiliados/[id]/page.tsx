'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { afiliadosService } from '@/services/afiliadosService';
import { certificadosDiscapacidadService } from '@/services/certificadosDiscapacidadService';
import { personaTercerosService } from '@/services/personaTercerosService';
import { alertasService } from '@/services/alertasService';
import {
  ArrowLeftIcon,
  UserCircleIcon,
  IdentificationIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BellAlertIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import type { Afiliado, CertificadoDiscapacidad, PersonaTercerosVinculado, Alerta } from '@/types';

type NivelAlerta = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';

const nivelAlertaColor: Record<NivelAlerta, string> = {
  BAJO: 'bg-green-100 text-green-800',
  MEDIO: 'bg-yellow-100 text-yellow-800',
  ALTO: 'bg-orange-100 text-orange-800',
  CRITICO: 'bg-red-100 text-red-800',
};

const prioridadColor: Record<string, string> = {
  BAJA: 'bg-green-100 text-green-800',
  MEDIA: 'bg-yellow-100 text-yellow-800',
  ALTA: 'bg-orange-100 text-orange-800',
  CRITICA: 'bg-red-100 text-red-800',
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-40 shrink-0 mb-0.5 sm:mb-0 sm:pt-0.5">{label}</span>
      <span className="text-sm text-gray-800">{value || <span className="text-gray-400 italic">—</span>}</span>
    </div>
  );
}

export default function AfiliadoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [afiliado, setAfiliado] = useState<Afiliado | null>(null);
  const [certificados, setCertificados] = useState<CertificadoDiscapacidad[]>([]);
  const [relaciones, setRelaciones] = useState<PersonaTercerosVinculado[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [afiliadoData, allCerts, allRelaciones, allAlertas] = await Promise.all([
          afiliadosService.getById(id),
          certificadosDiscapacidadService.getAll(),
          personaTercerosService.getAll(),
          alertasService.getAlertasByAfiliado(id).catch(() => [] as Alerta[]),
        ]);
        setAfiliado(afiliadoData);
        setCertificados(allCerts.filter((c) => c.afiliadoId === id));
        setRelaciones(allRelaciones.filter((r) => r.afiliadoId === id));
        setAlertas(allAlertas);
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la información del afiliado.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !afiliado) {
    return (
      <div className="p-6">
        <Link href="/dashboard/afiliados" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeftIcon className="w-4 h-4" /> Volver a Afiliados
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || 'Afiliado no encontrado.'}
        </div>
      </div>
    );
  }

  const fullName = `${afiliado.apellido}, ${afiliado.nombre}`;
  const initials = `${afiliado.nombre.charAt(0)}${afiliado.apellido.charAt(0)}`.toUpperCase();

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back */}
      <Link href="/dashboard/afiliados" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
        <ArrowLeftIcon className="w-4 h-4" /> Volver a Afiliados
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6 flex flex-col sm:flex-row items-start gap-5">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold text-blue-700">{initials}</span>
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${afiliado.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
              {afiliado.activo ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <XCircleIcon className="w-3.5 h-3.5" />}
              {afiliado.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            N° Afiliado: <span className="font-semibold text-gray-700">{afiliado.numeroAfiliado}</span>
            {' · '}
            Plan: <span className="font-semibold text-gray-700">{afiliado.plan}</span>
            {' · '}
            DNI: <span className="font-semibold text-gray-700">{afiliado.dni}</span>
          </p>
        </div>
      </div>

      {/* Datos grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Datos Personales */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4 text-blue-700">
            <UserCircleIcon className="w-5 h-5" />
            <h2 className="font-semibold text-sm uppercase tracking-wide">Datos Personales</h2>
          </div>
          <InfoRow label="Nombre" value={afiliado.nombre} />
          <InfoRow label="Apellido" value={afiliado.apellido} />
          <InfoRow label="DNI" value={afiliado.dni} />
          <InfoRow label="Fecha de Nacimiento" value={afiliado.fechaNacimiento ? new Date(afiliado.fechaNacimiento).toLocaleDateString('es-AR') : undefined} />
          <InfoRow label="Edad" value={afiliado.edad != null ? `${afiliado.edad} años` : undefined} />
          <InfoRow label="Sexo" value={afiliado.sexo} />
          <InfoRow label="Estado Civil" value={afiliado.estadoCivil?.nombre} />
        </div>

        {/* Afiliación */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4 text-blue-700">
            <IdentificationIcon className="w-5 h-5" />
            <h2 className="font-semibold text-sm uppercase tracking-wide">Afiliación</h2>
          </div>
          <InfoRow label="N° Afiliado" value={afiliado.numeroAfiliado} />
          <InfoRow label="Plan" value={afiliado.plan} />
          <InfoRow label="Administradora" value={afiliado.administradora?.nombre} />
          <InfoRow label="Estado" value={afiliado.activo ? 'Activo' : 'Inactivo'} />
          <InfoRow label="Alta" value={afiliado.createdAt ? new Date(afiliado.createdAt).toLocaleDateString('es-AR') : undefined} />
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4 text-blue-700">
            <PhoneIcon className="w-5 h-5" />
            <h2 className="font-semibold text-sm uppercase tracking-wide">Contacto</h2>
          </div>
          <InfoRow label="Email" value={afiliado.email} />
          <InfoRow label="Teléfono" value={afiliado.telefono} />
          <InfoRow label="Celular" value={afiliado.celular} />
        </div>

        {/* Domicilio */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4 text-blue-700">
            <MapPinIcon className="w-5 h-5" />
            <h2 className="font-semibold text-sm uppercase tracking-wide">Domicilio</h2>
          </div>
          <InfoRow label="Dirección" value={afiliado.direccion} />
          <InfoRow label="Localidad" value={afiliado.localidad} />
          <InfoRow label="Provincia" value={afiliado.provincia} />
          <InfoRow label="Código Postal" value={afiliado.codigoPostal} />
        </div>
      </div>

      {/* Adherentes / Terceros Vinculados */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4 text-purple-700">
          <UserGroupIcon className="w-5 h-5" />
          <h2 className="font-semibold text-sm uppercase tracking-wide">Adherentes / Terceros Vinculados</h2>
          <span className="ml-auto text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">{relaciones.length}</span>
        </div>
        {relaciones.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No hay terceros vinculados registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                  <th className="text-left py-2 pr-4">Nombre</th>
                  <th className="text-left py-2 pr-4">DNI</th>
                  <th className="text-left py-2 pr-4">Relación</th>
                  <th className="text-left py-2 pr-4">Edad</th>
                  <th className="text-left py-2">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {relaciones.map((rel) => (
                  <tr key={rel.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2 pr-4 font-medium text-gray-800">
                      {rel.tercerosVinculado
                        ? `${rel.tercerosVinculado.apellido}, ${rel.tercerosVinculado.nombre}`
                        : '—'}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{rel.tercerosVinculado?.dni || '—'}</td>
                    <td className="py-2 pr-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                        {rel.tipoRelacion}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {rel.tercerosVinculado?.edad != null ? `${rel.tercerosVinculado.edad} años` : '—'}
                    </td>
                    <td className="py-2 text-gray-500 text-xs">{rel.observaciones || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Certificados de Discapacidad */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4 text-teal-700">
          <DocumentTextIcon className="w-5 h-5" />
          <h2 className="font-semibold text-sm uppercase tracking-wide">Certificados de Discapacidad</h2>
          <span className="ml-auto text-xs bg-teal-100 text-teal-700 font-semibold px-2 py-0.5 rounded-full">{certificados.length}</span>
        </div>
        {certificados.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No hay certificados registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                  <th className="text-left py-2 pr-4">N° Certificado</th>
                  <th className="text-left py-2 pr-4">Grado</th>
                  <th className="text-left py-2 pr-4">Nivel Alerta</th>
                  <th className="text-left py-2 pr-4">Emisión</th>
                  <th className="text-left py-2 pr-4">Vencimiento</th>
                  <th className="text-left py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {certificados.map((cert) => (
                  <tr key={cert.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2 pr-4 font-medium text-gray-800">{cert.numeroCertificado}</td>
                    <td className="py-2 pr-4 text-gray-600">{cert.grado}</td>
                    <td className="py-2 pr-4">
                      {cert.nivelAlerta ? (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${nivelAlertaColor[cert.nivelAlerta as NivelAlerta] || 'bg-gray-100 text-gray-700'}`}>
                          {cert.nivelAlerta}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {cert.fechaEmision ? new Date(cert.fechaEmision).toLocaleDateString('es-AR') : '—'}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {cert.fechaVencimiento ? new Date(cert.fechaVencimiento).toLocaleDateString('es-AR') : '—'}
                    </td>
                    <td className="py-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cert.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                        {cert.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historial de Alertas */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4 text-amber-700">
          <BellAlertIcon className="w-5 h-5" />
          <h2 className="font-semibold text-sm uppercase tracking-wide">Historial de Alertas</h2>
          <span className="ml-auto text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">{alertas.length}</span>
        </div>
        {alertas.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No hay alertas registradas para este afiliado.</p>
        ) : (
          <div className="space-y-2">
            {alertas.map((alerta) => (
              <div key={alerta.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="mt-0.5">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${prioridadColor[alerta.prioridad] || 'bg-gray-100 text-gray-700'}`}>
                    {alerta.prioridad}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{alerta.titulo}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{alerta.mensaje}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {new Date(alerta.createdAt).toLocaleDateString('es-AR')}
                  </p>
                  <span className={`text-xs font-medium mt-1 inline-block ${alerta.estado === 'RESUELTA' ? 'text-green-600' : alerta.estado === 'PENDIENTE' ? 'text-amber-600' : 'text-gray-500'}`}>
                    {alerta.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
