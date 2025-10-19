'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';

type Estado = 'ACTIVO' | 'INACTIVO' | 'AGOTADO';

export default function ProductsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Referencia para el formulario de edición
  const editFormRef = useRef<HTMLDivElement>(null);

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
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

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

  // --------- Utilidades ----------
  function currencyCOP(n: any) {
    const val = Number(n ?? 0);
    try {
      return val.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
    } catch {
      return `$ ${val.toLocaleString()}`;
    }
  }

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
    } catch (e: any) {
      alert(e?.response?.data?.message || 'No se pudo eliminar');
      setItems(prev);
    }
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
    }, 100); // Pequeño delay para asegurar que el DOM se haya actualizado
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
    // El filtrado se hace en el backend
    setCriticos(Array.isArray(data) ? data : []);
    setLastUpdate(new Date());
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

    // 2) Relee el producto actualizado (evita filas "vacías")
    const { data: refreshed } = await api.get<any>(`/productos/${id}`);

    if (refreshed && refreshed.id != null) {
      setItems((arr) => arr.map((p) => (p.id === refreshed.id ? refreshed : p)));
    } else {
      // Fallback por si algo raro pasa: fuerza un reload completo
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
    <section className="admin-panel space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Productos</h1>
        <button
          onClick={() => setCreateOpen((v) => !v)}
          className="btn-primary px-4 py-2 rounded-lg font-medium"
        >
          {createOpen ? 'Cerrar' : '+ Nuevo'}
        </button>
      </div>

      {loading && <div className="animate-pulse rounded-lg border p-6">Cargando...</div>}
      {err && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{err}</div>
      )}

      {!loading && !err && (
        <>
          {/* Tabla */}
          {empty ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-gray-500">
              No hay productos registrados.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
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
                <tbody className="divide-y divide-gray-100">
                  {items.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/60">
                      <td className="p-2">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 overflow-hidden rounded bg-gray-100">
                            {p.imagenUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
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
                          <label className="text-xs text-primary underline cursor-pointer">
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
                          className={`rounded-full px-2 py-0.5 text-sm ${
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

                      <td className="p-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => abrirEditar(p)}
                            className="rounded border px-2 py-1 text-sm hover:bg-gray-50"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => onEliminar(p.id)}
                            className="rounded border border-red-300 bg-red-50 px-2 py-1 text-sm text-red-700 hover:bg-red-100"
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

          {/* Crear (abajo de la tabla) */}
          {createOpen && (
            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold">Crear producto</h2>
              <form onSubmit={onCrear} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Nombre">
                  <input
                    className="input"
                    value={nuevo.nombre}
                    onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Marca">
                  <input
                    className="input"
                    value={nuevo.marca}
                    onChange={(e) => setNuevo({ ...nuevo, marca: e.target.value })}
                  />
                </Field>

                <Field label="Categoría">
                  <input
                    className="input"
                    value={nuevo.categoria}
                    onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Subcategoría">
                  <input
                    className="input"
                    value={nuevo.subcategoria}
                    onChange={(e) => setNuevo({ ...nuevo, subcategoria: e.target.value })}
                  />
                </Field>

                <Field label="Precio (COP)">
                  <input
                    className="input"
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
                    className="input"
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
                    className="input"
                    type="number"
                    min={0}
                    step="1"
                    value={nuevo.stockMinimo}
                    onChange={(e) => setNuevo({ ...nuevo, stockMinimo: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Estado">
                  <select
                    className="input"
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
                    className="input"
                    rows={3}
                    value={nuevo.descripcion}
                    onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })}
                    required
                  />
                </Field>

                {/* Archivo en creación */}
                <Field label="Imagen (opcional)" className="md:col-span-2">
                  <input
                    className="block w-full text-sm"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setNuevoArchivo(e.target.files?.[0] ?? null)}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Formatos: JPG, PNG, WEBP. Máx 5MB.
                  </p>
                </Field>

                <div className="col-span-full mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    className="rounded border px-3 py-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={cargandoCrear}
                    className="rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-60"
                  >
                    {cargandoCrear ? 'Creando...' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          )}

<div className="rounded-lg border bg-white p-5 text-black">
  <h2 className="mb-4 text-lg font-semibold">Ajuste de stock</h2>

  {/* Producto seleccionado (para mostrar imagen y datos) */}
  {(() => {
    const sel = typeof ajusteId === 'number' ? items.find((x) => x.id === ajusteId) : null;
    return (
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label="Producto">
          <select
            className="input text-black"
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
            className="input text-black"
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
            onClick={onAjustarStock}
            disabled={ajustando || !ajusteId || !ajusteCantidad}
            className="btn-primary w-full px-4 py-2 font-medium"
          >
            {ajustando ? 'Aplicando…' : 'Aplicar ajuste'}
          </button>
        </div>

        {/* Vista previa del producto seleccionado */}
        <div className="md:col-span-3">
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded bg-gray-100 flex-shrink-0">
                {sel?.imagenUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
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
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{sel?.nombre ?? 'Sin seleccionar'}</div>
                {sel ? (
                  <div className="mt-0.5 text-sm">
                    <span className="mr-2">Stock actual:</span>
                    <span className="font-semibold">{sel.stock}</span>
                    {typeof sel.stockMinimo === 'number' && (
                      <span className="ml-3 text-xs">
                        (mín.: <span className="font-semibold">{sel.stockMinimo}</span>)
                      </span>
                    )}
                    {sel.categoria && (
                      <div className="mt-0.5 text-xs">
                        Categoría: <span className="font-medium">{sel.categoria}</span>
                        {sel.subcategoria ? ` / ${sel.subcategoria}` : ''}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-0.5 text-sm text-gray-500">
                    Selecciona un producto para ver su detalle.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  })()}
</div>

{/* ========================== CRÍTICOS ========================== */}
<div className="rounded-lg border bg-white p-5 text-black">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Productos en estado crítico (menos de 15 unidades)</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Actualización automática cada 30 segundos"></div>
            <span className="text-xs text-gray-500">
              Auto-actualización
              {lastUpdate && (
                <span className="ml-1">
                  (Última: {lastUpdate.toLocaleTimeString('es-CO')})
                </span>
              )}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={cargarCriticos}
          className="btn-refresh px-3 py-2 rounded-lg font-medium"
        >
          {loadingCriticos ? 'Cargando…' : 'Refrescar'}
        </button>
      </div>

  {errCriticos && (
    <div className="mb-3 rounded border border-red-300 bg-red-50 p-3 text-red-800">
      {errCriticos}
    </div>
  )}

  {loadingCriticos ? (
    <div className="animate-pulse rounded border p-4">Cargando…</div>
  ) : criticos.length === 0 ? (
    <div className="rounded border border-dashed p-8 text-center text-gray-600">
      No hay productos críticos.
    </div>
  ) : (
    <div className="overflow-x-auto rounded border bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <Th>Imagen</Th>
            <Th>Nombre</Th>
            <Th>Categoría</Th>
            <Th>Stock</Th>
            <Th>Mínimo</Th>
            <Th>Estado</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {criticos.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50/60">
              <td className="p-2">
                <div className="h-12 w-12 overflow-hidden rounded bg-gray-100">
                  {p.imagenUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
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
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-sm text-red-700">{p.stock}</span>
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

{/* ========================== MOVIMIENTOS (LOGS) ========================== */}
<div className="rounded-lg border bg-white p-5 text-black">
  <h2 className="mb-4 text-lg font-semibold">Movimientos de stock</h2>

  {/* Filtros */}
  <form onSubmit={buscarLogsPorRango} className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
    <Field label="Fecha inicio">
      <input
        className="input text-black"
        type="date"
        value={logFilter.inicio}
        onChange={(e) => setLogFilter((f) => ({ ...f, inicio: e.target.value }))}
        required
      />
    </Field>

    <Field label="Fecha fin">
      <input
        className="input text-black"
        type="date"
        value={logFilter.fin}
        onChange={(e) => setLogFilter((f) => ({ ...f, fin: e.target.value }))}
        required
      />
    </Field>

    <Field label="Producto (opcional)">
      <select
        className="input text-black"
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
      <button type="submit" className="btn-search w-full px-4 py-2 font-medium">
        {loadingLogs ? 'Buscando…' : 'Buscar'}
      </button>
    </div>
  </form>

  {errLogs && (
    <div className="mb-3 rounded border border-red-300 bg-red-50 p-3 text-red-800">
      {errLogs}
    </div>
  )}

  {/* Tabla de logs */}
  {loadingLogs ? (
    <div className="animate-pulse rounded border p-4">Cargando…</div>
  ) : logs.length === 0 ? (
    <div className="rounded border border-dashed p-8 text-center text-gray-600">
      No hay movimientos para el criterio seleccionado.
    </div>
  ) : (
    <div className="overflow-x-auto rounded border bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <Th>Fecha</Th>
            <Th>Producto</Th>
            <Th>Tipo</Th>
            <Th>Cantidad</Th>
            <Th>Usuario</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map((l) => {
            const prod = items.find((p) => p.id === (l.productoId ?? l.producto?.id));
            const nombre = prod?.nombre ?? l.producto?.nombre ?? '—';
            const tipo = l.tipo ?? l.Tipo ?? '—';
            const cantidad = Number(l.cantidad ?? 0);
            const fecha = l.fecha ? new Date(l.fecha) : null;
            const fechaStr = fecha ? fecha.toLocaleString('es-CO') : '—';
            console.log('Log data:', l);
            const usuarioNombre = l.usuario?.nombre ?? 'Sistema';
            const usuarioRol = l.usuario?.rol ?? 'admin';
            return (
              <tr key={l.id ?? `${(l.productoId ?? 'x')}-${(l.fecha ?? Math.random())}`}>
                <Td>{fechaStr}</Td>
                <Td className="font-medium">{nombre}</Td>
                <Td>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      tipo === 'ENTRADA'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {tipo}
                  </span>
                </Td>
                <Td className={cantidad >= 0 ? 'text-emerald-700' : 'text-amber-800'}>
                  {cantidad >= 0 ? `+${cantidad}` : `${cantidad}`}
                </Td>
                <Td>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{usuarioNombre}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
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
            <div ref={editFormRef} className="rounded-lg border bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Editar producto</h2>
                <button
                  onClick={() => {
                    setEditId(null);
                    setEditData(null);
                  }}
                  className="rounded border px-2 py-1"
                >
                  Cerrar
                </button>
              </div>

              <form onSubmit={onGuardarEdit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Nombre">
                  <input
                    className="input"
                    value={editData.nombre}
                    onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Marca">
                  <input
                    className="input"
                    value={editData.marca}
                    onChange={(e) => setEditData({ ...editData, marca: e.target.value })}
                  />
                </Field>

                <Field label="Categoría">
                  <input
                    className="input"
                    value={editData.categoria}
                    onChange={(e) => setEditData({ ...editData, categoria: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Subcategoría">
                  <input
                    className="input"
                    value={editData.subcategoria}
                    onChange={(e) => setEditData({ ...editData, subcategoria: e.target.value })}
                  />
                </Field>

                <Field label="Precio (COP)">
                  <input
                    className="input"
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
                    className="input"
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
                    className="input"
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
                    className="input"
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
                    className="input"
                    rows={3}
                    value={editData.descripcion}
                    onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })}
                    required
                  />
                </Field>

                {/* Reemplazo de imagen en editar */}
                <Field label="Imagen (reemplazar)" className="md:col-span-2">
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded bg-gray-100">
                      {editData.imagenUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={editData.imagenUrl} alt="img" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                          —
                        </div>
                      )}
                    </div>
                    <label className="text-sm text-primary underline cursor-pointer">
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
                          } catch (e: any) {
                            alert(e?.response?.data?.message || 'Error subiendo imagen');
                          }
                        }}
                      />
                      Subir nueva imagen
                    </label>
                  </div>
                </Field>

                <div className="col-span-full mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditId(null);
                      setEditData(null);
                    }}
                    className="rounded border px-3 py-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoEdit}
                    className="rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-60"
                  >
                    {guardandoEdit ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ------- Helpers UI -------
function Th({
  children,
  className = '',
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <th className={`p-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 ${className}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  className = '',
}: React.PropsWithChildren<{ className?: string }>) {
  return <td className={`p-2 align-middle text-sm ${className}`}>{children}</td>;
}

function badgeForEstado(estado?: Estado) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
  switch (estado) {
    case 'ACTIVO':
      return `${base} bg-emerald-100 text-emerald-700`;
    case 'INACTIVO':
      return `${base} bg-gray-200 text-gray-700`;
    case 'AGOTADO':
      return `${base} bg-amber-100 text-amber-800`;
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
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-sm text-gray-700">{label}</span>
      {children}
    </label>
  );
}
