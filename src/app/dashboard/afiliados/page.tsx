'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Afiliado, CreateAfiliadoDto, EstadoCivil } from '@/types';
import { afiliadosService } from '@/services/afiliadosService';
import { estadoCivilService } from '@/services/estadoCivilService';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import SearchableSelect from '@/components/SearchableSelect';
import Pagination from '@/components/Pagination';
import { usePagination } from '@/hooks/usePagination';

export default function AfiliadosPage() {
  const { user } = useAuth();
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [estadosCiviles, setEstadosCiviles] = useState<EstadoCivil[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAfiliado, setEditingAfiliado] = useState<Afiliado | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<CreateAfiliadoDto>({
    nombre: '',
    apellido: '',
    dni: '',
    fechaNacimiento: '',
    edad: 0,
    sexo: 'M',
    email: '',
    telefono: '',
    celular: '',
    direccion: '',
    localidad: '',
    provincia: '',
    codigoPostal: '',
    numeroAfiliado: '',
    plan: '',
    estadoCivilId: '',
    administradoraId: user?.administradoraId || '',
    activo: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [afiliadosData, estadosCivilesData] = await Promise.all([
        afiliadosService.getAll(),
        estadoCivilService.getAll(),
      ]);
      setAfiliados(afiliadosData);
      setEstadosCiviles(estadosCivilesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleOpenModal = (afiliado?: Afiliado) => {
    if (afiliado) {
      setEditingAfiliado(afiliado);
      setFormData({
        nombre: afiliado.nombre,
        apellido: afiliado.apellido,
        dni: afiliado.dni,
        fechaNacimiento: afiliado.fechaNacimiento.split('T')[0],
        edad: afiliado.edad,
        sexo: afiliado.sexo,
        email: afiliado.email || '',
        telefono: afiliado.telefono || '',
        celular: afiliado.celular || '',
        direccion: afiliado.direccion,
        localidad: afiliado.localidad,
        provincia: afiliado.provincia,
        codigoPostal: afiliado.codigoPostal,
        numeroAfiliado: afiliado.numeroAfiliado,
        plan: afiliado.plan,
        estadoCivilId: afiliado.estadoCivilId || '',
        administradoraId: afiliado.administradoraId,
        activo: afiliado.activo,
      });
    } else {
      setEditingAfiliado(null);
      setFormData({
        nombre: '',
        apellido: '',
        dni: '',
        fechaNacimiento: '',
        edad: 0,
        sexo: 'M',
        email: '',
        telefono: '',
        celular: '',
        direccion: '',
        localidad: '',
        provincia: '',
        codigoPostal: '',
        numeroAfiliado: '',
        plan: '',
        estadoCivilId: '',
        administradoraId: user?.administradoraId || '',
        activo: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAfiliado(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre || !formData.apellido || !formData.dni || !formData.fechaNacimiento) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    try {
      setSaving(true);
      const dataToSend = {
        ...formData,
        edad: calculateAge(formData.fechaNacimiento),
      };

      if (editingAfiliado) {
        await afiliadosService.update(editingAfiliado.id, dataToSend);
      } else {
        await afiliadosService.create(dataToSend);
      }

      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar afiliado');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este afiliado?')) return;

    try {
      await afiliadosService.delete(id);
      await loadData();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar afiliado');
    }
  };

  const filteredAfiliados = afiliados.filter(
    (afiliado) =>
      afiliado.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      afiliado.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      afiliado.dni.includes(searchTerm) ||
      afiliado.numeroAfiliado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedItems: paginatedAfiliados,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange
  } = usePagination({ items: filteredAfiliados, itemsPerPage: 10 });

  // Opciones para el select de estado civil
  const estadoCivilOptions = estadosCiviles.map(ec => ({
    value: ec.id,
    label: ec.nombre
  }));

  const sexoOptions = [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Afiliados
          </h1>
          <p className="text-neutral-600 mt-2">Gestión de afiliados del sistema</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nuevo Afiliado
        </button>
      </div>

      {/* Buscador */}
      <div className="premium-card p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, DNI o número de afiliado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <UserIcon className="absolute left-3 top-2.5 w-5 h-5 text-neutral-400" />
        </div>
      </div>

      {/* Tabla */}
      <div className="premium-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">N° Afiliado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">DNI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Teléfono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {paginatedAfiliados.map((afiliado) => (
                  <tr key={afiliado.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {afiliado.numeroAfiliado}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {afiliado.apellido}, {afiliado.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{afiliado.dni}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{afiliado.plan}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{afiliado.email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {afiliado.celular || afiliado.telefono || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          afiliado.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {afiliado.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleOpenModal(afiliado)} className="text-primary-600 hover:text-primary-900 mr-3 cursor-pointer">
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(afiliado.id)} className="text-red-600 hover:text-red-900 cursor-pointer">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginatedAfiliados.length === 0 && (
              <div className="text-center py-12">
                <p className="text-neutral-500">No se encontraron afiliados</p>
              </div>
            )}
          </div>
        )}

        {/* Paginación */}
        {!loading && filteredAfiliados.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden my-8 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b bg-white">
              <h3 className="text-xl font-semibold text-neutral-900">
                {editingAfiliado ? 'Editar Afiliado' : 'Nuevo Afiliado'}
              </h3>
              <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Datos Personales */}
              <div>
                <h4 className="text-lg font-semibold text-neutral-800 mb-4 pb-2 border-b">Datos Personales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Apellido *</label>
                    <input
                      type="text"
                      value={formData.apellido}
                      onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">DNI *</label>
                    <input
                      type="text"
                      value={formData.dni}
                      onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                      maxLength={20}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Fecha de Nacimiento *</label>
                    <input
                      type="date"
                      value={formData.fechaNacimiento}
                      onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Sexo *</label>
                    <SearchableSelect
                      options={sexoOptions}
                      value={formData.sexo}
                      onChange={(value) => setFormData({ ...formData, sexo: value })}
                      placeholder="Seleccionar sexo..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Estado Civil</label>
                    <SearchableSelect
                      options={estadoCivilOptions}
                      value={formData.estadoCivilId || ''}
                      onChange={(value) => setFormData({ ...formData, estadoCivilId: value })}
                      placeholder="Seleccionar estado civil..."
                    />
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <div>
                <h4 className="text-lg font-semibold text-neutral-800 mb-4 pb-2 border-b">Contacto</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      maxLength={50}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Celular</label>
                    <input
                      type="tel"
                      value={formData.celular}
                      onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      maxLength={50}
                    />
                  </div>
                </div>
              </div>

              {/* Domicilio */}
              <div>
                <h4 className="text-lg font-semibold text-neutral-800 mb-4 pb-2 border-b">Domicilio</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Dirección *</label>
                    <input
                      type="text"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                      maxLength={255}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Localidad *</label>
                    <input
                      type="text"
                      value={formData.localidad}
                      onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Provincia *</label>
                    <input
                      type="text"
                      value={formData.provincia}
                      onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Código Postal *</label>
                    <input
                      type="text"
                      value={formData.codigoPostal}
                      onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                      maxLength={20}
                    />
                  </div>
                </div>
              </div>

              {/* Datos de Afiliación */}
              <div>
                <h4 className="text-lg font-semibold text-neutral-800 mb-4 pb-2 border-b">Datos de Afiliación</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Número de Afiliado *</label>
                    <input
                      type="text"
                      value={formData.numeroAfiliado}
                      onChange={(e) => setFormData({ ...formData, numeroAfiliado: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                      maxLength={50}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Plan *</label>
                    <input
                      type="text"
                      value={formData.plan}
                      onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                      maxLength={100}
                    />
                  </div>

                  <div className="flex items-center md:col-span-2">
                    <input
                      type="checkbox"
                      id="activo"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="activo" className="ml-2 text-sm text-neutral-700">
                      Activo
                    </label>
                  </div>
                </div>
              </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 p-6 border-t bg-white">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : editingAfiliado ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
