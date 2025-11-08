'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';

type Estado = 'ACTIVO' | 'INACTIVO' | 'AGOTADO';

type Section = {
  id: string;
  label: string;
  icon: string;
};

const SECTIONS: Section[] = [
  { id: 'productos', label: 'Lista de Productos', icon: '📦' },
  { id: 'crear', label: 'Crear Producto', icon: '➕' },
  { id: 'ajuste', label: 'Ajuste de Stock', icon: '📊' },
  { id: 'criticos', label: 'Productos Críticos', icon: '⚠️' },
  { id: 'movimientos', label: 'Movimientos de Stock', icon: '📋' },
];

export default function ProductsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('productos');

  // Referencia para el formulario de edición
  const editFormRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Crear (form abajo)
  const [createOpen, setCreateOpen] = useState(false);
  const [cargandoCrear, setCargandoCrear] = useState(false);
  const [nuevo, setNuevo] = useState<any>({
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    categoria: '',
    subcategoria: '',
    marca: '',
    estado: 'ACTIVO' as Estado,
    stockMinimo: 0,
  });
  const [nuevoArchivo, setNuevoArchivo] = useState<File | null>(null);

  // Ajuste de stock (debajo de la tabla)
  const [ajusteId, setAjusteId] = useState<number | ''>('');
  const [ajusteCantidad, setAjusteCantidad] = useState<number>(0);
  const [ajustando, setAjustando] = useState(false);

  // --- Críticos ---
  const [criticos, setCriticos] = useState<any[]>([]);
  const [loadingCriticos, setLoadingCriticos] = useState(false);
  const [errCriticos, setErrCriticos] = useState<string | null>(null);

  // --- Logs / Movimientos ---
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [errLogs, setErrLogs] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<{ inicio: string; fin: string; productoId: number | '' }>({
    inicio: '',
    fin: '',
    productoId: '',
  });

  // Editar (panel simple en la misma página)
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any | null>(null);
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  // Detalles (modal)
  const [detalleProducto, setDetalleProducto] = useState<any | null>(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  // --------- Utilidades ----------
  function currencyCOP(n: any) {
    const val = Number(n ?? 0);
    try {
      return val.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
    } catch {
      return `$ ${val.toLocaleString()}`;
    }
  }

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = sectionRefs.current[sectionId];
    if (element) {
      // Obtener la posición del elemento relativa al documento
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - 100; // 100px de offset para el header
      
      // Hacer scroll en la ventana completa
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const res = await api.get<any[]>('/productos');
      setItems(res.data ?? []);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Error cargando productos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Actualización automática de productos críticos cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      cargarCriticos();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, []);


  // --------- Crear ----------
  async function onCrear(e: React.FormEvent) {
    e.preventDefault();
    try {
      setCargandoCrear(true);
      const payload = {
        ...nuevo,
        precio: Number(nuevo.precio ?? 0),
        stock: Number(nuevo.stock ?? 0),
        stockMinimo: Number(nuevo.stockMinimo ?? 0),
      };

      // 1) Crear producto base (sin imagenUrl manual)
      const res = await api.post<any>('/productos', payload); // requiere admin
      let creado = res.data;

      // 2) Si adjuntaste archivo, subir imagen
      if (nuevoArchivo) {
        const form = new FormData();
        form.append('file', nuevoArchivo);
        const up = await api.post<{ imagenUrl: string; imagenPublicId?: string }>(
          `/productos/${creado.id}/imagen`,
          form,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        creado = { ...creado, imagenUrl: up.data.imagenUrl };
      }

      // 3) Agregar a la tabla
      setItems((prev) => [creado, ...prev]);

      // 4) Reset
      setNuevo({
        nombre: '',
        descripcion: '',
        precio: 0,
        stock: 0,
        categoria: '',
        subcategoria: '',
        marca: '',
        estado: 'ACTIVO' as Estado,
        stockMinimo: 0,
      });
      setNuevoArchivo(null);
      setCreateOpen(false);
      alert('✅ Producto creado exitosamente');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'No se pudo crear');
    } finally {
      setCargandoCrear(false);
    }
  }

  // --------- Eliminar ----------
  async function onEliminar(id: number) {
    const ok = confirm('¿Eliminar este producto? Esta acción es irreversible.');
    if (!ok) return;
    const prev = items;
    setItems((p) => p.filter((x) => x.id !== id));
    try {
      await api.delete(`/productos/${id}`); // requiere rol admin
      alert('✅ Producto eliminado exitosamente');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'No se pudo eliminar');
      setItems(prev);
    }
  }

  // --------- Detalles ----------
  function abrirDetalles(p: any) {
    setDetalleProducto(p);
    setMostrarDetalle(true);
  }

  // --------- Editar ----------
  function abrirEditar(p: any) {
    setEditId(p.id);
    setEditData({
      nombre: p.nombre ?? '',
      descripcion: p.descripcion ?? '',
      precio: p.precio ?? 0,
      stock: p.stock ?? 0,
      categoria: p.categoria ?? '',
      subcategoria: p.subcategoria ?? '',
      marca: p.marca ?? '',
      imagenUrl: p.imagenUrl ?? '',
      estado: (p.estado ?? 'ACTIVO') as Estado,
      stockMinimo: p.stockMinimo ?? 0,
    });
    
    // Scroll automático al formulario de edición
    setTimeout(() => {
      if (editFormRef.current) {
        editFormRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  }

  async function onGuardarEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId || !editData) return;
    try {
      setGuardandoEdit(true);
      const payload = {
        ...editData,
        precio: Number(editData.precio ?? 0),
        stock: Number(editData.stock ?? 0),
        stockMinimo: Number(editData.stockMinimo ?? 0),
        imagenUrl: undefined, // no la actualizamos aquí
      };
      const { data: actualizado } = await api.patch(`/productos/${editId}`, payload); // admin
      setItems((arr) => arr.map((x) => (x.id === editId ? actualizado : x)));
      setEditId(null);
      setEditData(null);
      alert('✅ Producto actualizado exitosamente');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'No se pudo guardar');
    } finally {
      setGuardandoEdit(false);
    }
  }

  // --------- Cambiar imagen ----------
  async function onCambiarImagen(p: any, file: File) {
    try {
      const form = new FormData();
      form.append('file', file);

      const { data } = await api.post<{
        message: string;
        imagenUrl: string;
        imagenPublicId?: string;
      }>(`/productos/${p.id}/imagen`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setItems((arr) =>
        arr.map((x) => (x.id === p.id ? { ...x, imagenUrl: data.imagenUrl } : x))
      );
      alert('✅ Imagen actualizada exitosamente');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error subiendo imagen');
    }
  }

  // Cargar productos críticos (menos de 15 unidades)
  async function cargarCriticos() {
    try {
      setLoadingCriticos(true);
      setErrCriticos(null);
      const { data } = await api.get<any[]>('/productos/criticos');
      setCriticos(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErrCriticos(e?.response?.data?.message || 'No se pudieron obtener los críticos');
      setCriticos([]);
    } finally {
      setLoadingCriticos(false);
    }
  }

  // Buscar logs por rango (y opcionalmente por producto)
  async function buscarLogsPorRango(e: React.FormEvent) {
    e.preventDefault();
    if (!logFilter.inicio || !logFilter.fin) {
      alert('Selecciona fecha inicio y fin');
      return;
    }
    try {
      setLoadingLogs(true);
      setErrLogs(null);
      const dto: any = {
        fechaInicio: `${logFilter.inicio}T00:00:00.000Z`,
        fechaFin: `${logFilter.fin}T23:59:59.999Z`,
      };
      if (logFilter.productoId) dto.productoId = Number(logFilter.productoId);

      const { data } = await api.post<any[]>('/productos/logs/rango', dto);
      setLogs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErrLogs(e?.response?.data?.message || 'No se pudieron obtener los movimientos');
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }

  async function onAjustarStock(e: React.FormEvent) {
    e.preventDefault();

    const id = typeof ajusteId === 'number' ? ajusteId : Number(ajusteId);
    const qty = Number(ajusteCantidad);

    if (!id || !Number.isFinite(qty) || qty === 0) {
      alert('Selecciona un producto y una cantidad distinta de 0');
      return;
    }

    try {
      setAjustando(true);

      // 1) Ajusta stock (genera logs en el back)
      await api.patch(`/productos/${id}/stock`, { cantidad: qty });

      // 2) Relee el producto actualizado
      const { data: refreshed } = await api.get<any>(`/productos/${id}`);

      if (refreshed && refreshed.id != null) {
        setItems((arr) => arr.map((p) => (p.id === refreshed.id ? refreshed : p)));
        alert('✅ Stock ajustado exitosamente');
      } else {
        await load();
      }

      // 3) Limpia el formulario de ajuste
      setAjusteId('');
      setAjusteCantidad(0);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'No se pudo ajustar el stock');
    } finally {
      setAjustando(false);
    }
  }

  const empty = !loading && !err && items.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="max-w-7xl mx-auto">
        {/* Contenedor principal con barra lateral integrada */}
        <div className="flex items-start">
          {/* Barra lateral de navegación - Se mueve con el scroll */}
          <aside className="w-64 bg-white shadow-lg border-r-2 border-amber-200 flex-shrink-0 self-start">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-amber-800 mb-6 flex items-center gap-2">
                <span>☕</span>
                <span>Gestión de Productos</span>
              </h2>
              <nav className="space-y-2">
                {SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg transform scale-105'
                        : 'bg-gray-50 text-gray-700 hover:bg-amber-100 hover:text-amber-800'
                    }`}
                  >
                    <span className="text-xl">{section.icon}</span>
                    <span className="font-medium">{section.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Contenido principal */}
          <div className="flex-1 w-full min-w-0 p-8">
          {/* Sección: Lista de Productos */}
          <div 
            ref={(el) => { sectionRefs.current['productos'] = el; }}
            className="mb-12 bg-white rounded-2xl shadow-xl p-8 border-2 border-amber-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <span>📦</span>
                <span>Lista de Productos</span>
              </h2>
              <button
                onClick={() => {
                  setCreateOpen(!createOpen);
                  if (!createOpen) {
                    setTimeout(() => scrollToSection('crear'), 100);
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 font-bold shadow-lg hover:shadow-xl transition-all"
              >
                {createOpen ? 'Cerrar' : '+ Nuevo Producto'}
              </button>
            </div>

            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
              </div>
            )}
            
            {err && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
                {err}
              </div>
            )}

            {!loading && !err && empty && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">No hay productos registrados.</p>
              </div>
            )}

            {!loading && !err && !empty && (
              <div className="overflow-x-auto rounded-lg border-2 border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-amber-100 to-orange-100">
                    <tr>
                      <Th>Imagen</Th>
                      <Th>Nombre</Th>
                      <Th>Categoría</Th>
                      <Th>Precio</Th>
                      <Th>Stock</Th>
                      <Th>Estado</Th>
                      <Th className="text-right">Acciones</Th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((p) => (
                      <tr key={p.id} className="hover:bg-amber-50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-16 w-16 overflow-hidden rounded-lg bg-gray-100 shadow-md">
                              {p.imagenUrl ? (
                                <img
                                  src={p.imagenUrl}
                                  alt={p.nombre}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                  —
                                </div>
                              )}
                            </div>
                            <label className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800">
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) onCambiarImagen(p, f);
                                }}
                              />
                              Cambiar
                            </label>
                          </div>
                        </td>

                        <Td className="font-medium">{p.nombre}</Td>
                        <Td>
                          {p.categoria}
                          {p.subcategoria ? ` / ${p.subcategoria}` : ''}
                        </Td>
                        <Td>{currencyCOP(p.precio)}</Td>
                        <Td>
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-semibold ${
                              Number(p.stock) <= Number(p.stockMinimo ?? 0)
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {p.stock}
                          </span>
                        </Td>
                        <Td>
                          <span className={badgeForEstado(p.estado)}>{p.estado ?? '—'}</span>
                        </Td>

                        <td className="p-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => abrirDetalles(p)}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium text-sm transition-colors"
                            >
                              Detalles
                            </button>
                            <button
                              onClick={() => abrirEditar(p)}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => onEliminar(p.id)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-sm transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sección: Crear Producto */}
          <div 
            ref={(el) => { sectionRefs.current['crear'] = el; }}
            className="mb-12 bg-white rounded-2xl shadow-xl p-8 border-2 border-amber-100"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span>➕</span>
              <span>Crear Producto</span>
            </h2>

            {createOpen && (
              <form onSubmit={onCrear} className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Field label="Nombre">
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    value={nuevo.nombre}
                    onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Marca">
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    value={nuevo.marca}
                    onChange={(e) => setNuevo({ ...nuevo, marca: e.target.value })}
                  />
                </Field>

                <Field label="Categoría">
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    value={nuevo.categoria}
                    onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Subcategoría">
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    value={nuevo.subcategoria}
                    onChange={(e) => setNuevo({ ...nuevo, subcategoria: e.target.value })}
                  />
                </Field>

                <Field label="Precio (COP)">
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    type="number"
                    min={0}
                    step="1"
                    value={nuevo.precio}
                    onChange={(e) => setNuevo({ ...nuevo, precio: Number(e.target.value) })}
                    required
                  />
                </Field>
                <Field label="Stock">
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    type="number"
                    min={0}
                    step="1"
                    value={nuevo.stock}
                    onChange={(e) => setNuevo({ ...nuevo, stock: Number(e.target.value) })}
                    required
                  />
                </Field>

                <Field label="Stock mínimo">
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    type="number"
                    min={0}
                    step="1"
                    value={nuevo.stockMinimo}
                    onChange={(e) => setNuevo({ ...nuevo, stockMinimo: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Estado">
                  <select
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    value={nuevo.estado}
                    onChange={(e) => setNuevo({ ...nuevo, estado: e.target.value as Estado })}
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                    <option value="AGOTADO">AGOTADO</option>
                  </select>
                </Field>

                <Field label="Descripción" className="md:col-span-2">
                  <textarea
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    rows={3}
                    value={nuevo.descripcion}
                    onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })}
                    required
                  />
                </Field>

                <Field label="Imagen (opcional)" className="md:col-span-2">
                  <input
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-500 file:text-white hover:file:bg-amber-600"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setNuevoArchivo(e.target.files?.[0] ?? null)}
                  />
                </Field>

                <div className="col-span-full mt-4 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={cargandoCrear}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 font-bold disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
                  >
                    {cargandoCrear ? 'Creando...' : 'Crear Producto'}
                  </button>
                </div>
              </form>
            )}

            {!createOpen && (
              <div className="text-center py-8 text-gray-500">
                <p>Haz clic en &ldquo;Crear Producto&rdquo; para agregar un nuevo producto</p>
              </div>
            )}
          </div>

          {/* Sección: Ajuste de Stock */}
          <div 
            ref={(el) => { sectionRefs.current['ajuste'] = el; }}
            className="mb-12 bg-white rounded-2xl shadow-xl p-8 border-2 border-amber-100"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span>📊</span>
              <span>Ajuste de Stock</span>
            </h2>

            <form onSubmit={onAjustarStock} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Producto">
                  <select
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    value={ajusteId}
                    onChange={(e) => setAjusteId(e.target.value ? Number(e.target.value) : '')}
                    required
                  >
                    <option value="">— Selecciona —</option>
                    {items.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Cantidad (usa + para entrada, - para salida)">
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    type="number"
                    step={1}
                    value={ajusteCantidad}
                    onChange={(e) => setAjusteCantidad(Number(e.target.value))}
                    placeholder="Ej: 20 o -5"
                    required
                  />
                </Field>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={ajustando || !ajusteId || !ajusteCantidad}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-bold disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
                  >
                    {ajustando ? 'Aplicando…' : 'Aplicar Ajuste'}
                  </button>
                </div>
              </div>

              {(() => {
                const sel = typeof ajusteId === 'number' ? items.find((x) => x.id === ajusteId) : null;
                return sel ? (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 border-2 border-amber-200">
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 overflow-hidden rounded-lg bg-white shadow-md">
                        {sel.imagenUrl ? (
                          <img
                            src={sel.imagenUrl}
                            alt={sel.nombre}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                            —
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{sel.nombre}</h3>
                        <p className="text-sm text-gray-600">
                          Stock actual: <span className="font-bold text-amber-700">{sel.stock}</span>
                        </p>
                        {typeof sel.stockMinimo === 'number' && (
                          <p className="text-sm text-gray-600">
                            Mínimo: <span className="font-bold">{sel.stockMinimo}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </form>
          </div>

          {/* Sección: Productos Críticos */}
          <div 
            ref={(el) => { sectionRefs.current['criticos'] = el; }}
            className="mb-12 bg-white rounded-2xl shadow-xl p-8 border-2 border-red-200"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <span>⚠️</span>
                <span>Productos en Estado Crítico</span>
              </h2>
              <button
                onClick={cargarCriticos}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
              >
                {loadingCriticos ? 'Cargando…' : '🔄 Refrescar'}
              </button>
            </div>

            {errCriticos && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
                {errCriticos}
              </div>
            )}

            {loadingCriticos ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              </div>
            ) : criticos.length === 0 ? (
              <div className="text-center py-12 bg-green-50 rounded-lg border-2 border-dashed border-green-300">
                <p className="text-green-700 text-lg">✅ No hay productos críticos</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border-2 border-red-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-red-100 to-orange-100">
                    <tr>
                      <Th>Imagen</Th>
                      <Th>Nombre</Th>
                      <Th>Categoría</Th>
                      <Th>Stock</Th>
                      <Th>Mínimo</Th>
                      <Th>Estado</Th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {criticos.map((p) => (
                      <tr key={p.id} className="hover:bg-red-50 transition-colors">
                        <td className="p-3">
                          <div className="h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                            {p.imagenUrl ? (
                              <img src={p.imagenUrl} alt={p.nombre} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">—</div>
                            )}
                          </div>
                        </td>
                        <Td className="font-medium">{p.nombre}</Td>
                        <Td>
                          {p.categoria}
                          {p.subcategoria ? ` / ${p.subcategoria}` : ''}
                        </Td>
                        <Td>
                          <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                            {p.stock}
                          </span>
                        </Td>
                        <Td>{p.stockMinimo ?? 0}</Td>
                        <Td><span className={badgeForEstado(p.estado)}>{p.estado ?? '—'}</span></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sección: Movimientos de Stock */}
          <div 
            ref={(el) => { sectionRefs.current['movimientos'] = el; }}
            className="mb-12 bg-white rounded-2xl shadow-xl p-8 border-2 border-amber-100"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span>📋</span>
              <span>Movimientos de Stock</span>
            </h2>

            <form onSubmit={buscarLogsPorRango} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Field label="Fecha inicio">
                <input
                  className="input-modern"
                  type="date"
                  value={logFilter.inicio}
                  onChange={(e) => setLogFilter((f) => ({ ...f, inicio: e.target.value }))}
                  required
                />
              </Field>

              <Field label="Fecha fin">
                <input
                  className="input-modern"
                  type="date"
                  value={logFilter.fin}
                  onChange={(e) => setLogFilter((f) => ({ ...f, fin: e.target.value }))}
                  required
                />
              </Field>

              <Field label="Producto (opcional)">
                <select
                  className="input-modern"
                  value={logFilter.productoId}
                  onChange={(e) =>
                    setLogFilter((f) => ({ ...f, productoId: e.target.value ? Number(e.target.value) : '' }))
                  }
                >
                  <option value="">Todos</option>
                  {items.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="flex items-end">
                <button 
                  type="submit" 
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  {loadingLogs ? 'Buscando…' : '🔍 Buscar'}
                </button>
              </div>
            </form>

            {errLogs && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
                {errLogs}
              </div>
            )}

            {loadingLogs ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">No hay movimientos para el criterio seleccionado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border-2 border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                    <tr>
                      <Th>Fecha</Th>
                      <Th>Producto</Th>
                      <Th>Tipo</Th>
                      <Th>Cantidad</Th>
                      <Th>Usuario</Th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((l) => {
                      const prod = items.find((p) => p.id === (l.productoId ?? l.producto?.id));
                      const nombre = prod?.nombre ?? l.producto?.nombre ?? '—';
                      const tipo = l.tipo ?? l.Tipo ?? '—';
                      const cantidad = Number(l.cantidad ?? 0);
                      const fecha = l.fecha ? new Date(l.fecha) : null;
                      const fechaStr = fecha ? fecha.toLocaleString('es-CO') : '—';
                      const usuarioNombre = l.usuario?.nombre ?? 'Sistema';
                      const usuarioRol = l.usuario?.rol ?? 'admin';
                      return (
                        <tr key={l.id ?? `${(l.productoId ?? 'x')}-${(l.fecha ?? Math.random())}`} className="hover:bg-gray-50">
                          <Td>{fechaStr}</Td>
                          <Td className="font-medium">{nombre}</Td>
                          <Td>
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                tipo === 'ENTRADA'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {tipo}
                            </span>
                          </Td>
                          <Td className={cantidad >= 0 ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>
                            {cantidad >= 0 ? `+${cantidad}` : `${cantidad}`}
                          </Td>
                          <Td>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{usuarioNombre}</span>
                              <span className={`text-xs px-2 py-1 rounded-full inline-block w-fit ${
                                usuarioRol === 'admin'
                                  ? 'bg-blue-100 text-blue-800'
                                  : usuarioRol === 'cliente'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {usuarioRol}
                              </span>
                            </div>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Editar (panel simple) */}
          {editId && editData && (
            <div ref={editFormRef} className="mb-12 bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                  <span>✏️</span>
                  <span>Editar Producto</span>
                </h2>
                <button
                  onClick={() => {
                    setEditId(null);
                    setEditData(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                >
                  ✕ Cerrar
                </button>
              </div>

              <form onSubmit={onGuardarEdit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Field label="Nombre">
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    value={editData.nombre}
                    onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Marca">
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    value={editData.marca}
                    onChange={(e) => setEditData({ ...editData, marca: e.target.value })}
                  />
                </Field>

                <Field label="Categoría">
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    value={editData.categoria}
                    onChange={(e) => setEditData({ ...editData, categoria: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Subcategoría">
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    value={editData.subcategoria}
                    onChange={(e) => setEditData({ ...editData, subcategoria: e.target.value })}
                  />
                </Field>

                <Field label="Precio (COP)">
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    type="number"
                    min={0}
                    step={1}
                    value={editData.precio}
                    onChange={(e) => setEditData({ ...editData, precio: Number(e.target.value) })}
                    required
                  />
                </Field>
                <Field label="Stock">
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    type="number"
                    min={0}
                    step={1}
                    value={editData.stock}
                    onChange={(e) => setEditData({ ...editData, stock: Number(e.target.value) })}
                    required
                  />
                </Field>

                <Field label="Stock mínimo">
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    type="number"
                    min={0}
                    step={1}
                    value={editData.stockMinimo}
                    onChange={(e) =>
                      setEditData({ ...editData, stockMinimo: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Estado">
                  <select
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    value={editData.estado}
                    onChange={(e) => setEditData({ ...editData, estado: e.target.value as Estado })}
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                    <option value="AGOTADO">AGOTADO</option>
                  </select>
                </Field>

                <Field label="Descripción" className="md:col-span-2">
                  <textarea
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    rows={3}
                    value={editData.descripcion}
                    onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })}
                    required
                  />
                </Field>

                <Field label="Imagen (reemplazar)" className="md:col-span-2">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 overflow-hidden rounded-lg bg-gray-100 shadow-md">
                      {editData.imagenUrl ? (
                        <img src={editData.imagenUrl} alt="img" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                          —
                        </div>
                      )}
                    </div>
                    <label className="text-sm text-blue-600 underline cursor-pointer hover:text-blue-800">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          try {
                            const form = new FormData();
                            form.append('file', f);
                            const { data } = await api.post<{ imagenUrl: string }>(
                              `/productos/${editId}/imagen`,
                              form,
                              { headers: { 'Content-Type': 'multipart/form-data' } }
                            );
                            setEditData({ ...editData, imagenUrl: data.imagenUrl });
                            setItems((arr) =>
                              arr.map((x) =>
                                x.id === editId ? { ...x, imagenUrl: data.imagenUrl } : x
                              )
                            );
                            alert('✅ Imagen actualizada exitosamente');
                          } catch (e: any) {
                            alert(e?.response?.data?.message || 'Error subiendo imagen');
                          }
                        }}
                      />
                      Subir nueva imagen
                    </label>
                  </div>
                </Field>

                <div className="col-span-full mt-4 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditId(null);
                      setEditData(null);
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoEdit}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-bold disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
                  >
                    {guardandoEdit ? 'Guardando...' : '💾 Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modal de Detalles */}
          {mostrarDetalle && detalleProducto && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
                <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
                  <h2 className="text-2xl font-bold">Detalles del Producto</h2>
                  <button
                    onClick={() => setMostrarDetalle(false)}
                    className="text-white hover:text-gray-200 text-3xl font-bold transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 shadow-lg">
                        {detalleProducto.imagenUrl ? (
                          <img
                            src={detalleProducto.imagenUrl}
                            alt={detalleProducto.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-center">
                        <span className={badgeForEstado(detalleProducto.estado)}>
                          {detalleProducto.estado ?? '—'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-2">
                          {detalleProducto.nombre}
                        </h3>
                        {detalleProducto.marca && (
                          <p className="text-lg text-gray-600">{detalleProducto.marca}</p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-3 border-b-2 border-gray-200">
                          <span className="text-gray-600 font-medium">Precio:</span>
                          <span className="text-2xl font-bold text-amber-700">
                            {currencyCOP(detalleProducto.precio)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-3 border-b-2 border-gray-200">
                          <div>
                            <span className="text-gray-600 font-medium">Stock:</span>
                            <p className="text-xl font-semibold">
                              <span className={Number(detalleProducto.stock) <= Number(detalleProducto.stockMinimo ?? 0) ? 'text-red-600' : 'text-green-600'}>
                                {detalleProducto.stock}
                              </span>
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 font-medium">Stock Mínimo:</span>
                            <p className="text-xl font-semibold">{detalleProducto.stockMinimo ?? 0}</p>
                          </div>
                        </div>

                        <div className="py-3 border-b-2 border-gray-200">
                          <span className="text-gray-600 font-medium">Categoría:</span>
                          <p className="text-lg">{detalleProducto.categoria}</p>
                          {detalleProducto.subcategoria && (
                            <p className="text-sm text-gray-500">{detalleProducto.subcategoria}</p>
                          )}
                        </div>

                        <div className="py-3">
                          <span className="text-gray-600 font-medium">Descripción:</span>
                          <p className="text-gray-800 mt-2">{detalleProducto.descripcion || 'Sin descripción'}</p>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => {
                            setMostrarDetalle(false);
                            abrirEditar(detalleProducto);
                          }}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-bold shadow-lg hover:shadow-xl transition-all"
                        >
                          ✏️ Editar Producto
                        </button>
                        <button
                          onClick={() => {
                            setMostrarDetalle(false);
                            onEliminar(detalleProducto.id);
                          }}
                          className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold shadow-lg hover:shadow-xl transition-all"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ------- Helpers UI -------
function Th({
  children,
  className = '',
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <th className={`p-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 ${className}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  className = '',
}: React.PropsWithChildren<{ className?: string }>) {
  return <td className={`p-3 align-middle text-sm ${className}`}>{children}</td>;
}

function badgeForEstado(estado?: Estado) {
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold';
  switch (estado) {
    case 'ACTIVO':
      return `${base} bg-green-100 text-green-700`;
    case 'INACTIVO':
      return `${base} bg-gray-200 text-gray-700`;
    case 'AGOTADO':
      return `${base} bg-red-100 text-red-700`;
    default:
      return `${base} bg-gray-100 text-gray-600`;
  }
}

function Field({
  label,
  className = '',
  children,
}: React.PropsWithChildren<{ label: string; className?: string }>) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      {children}
    </label>
  );
}
