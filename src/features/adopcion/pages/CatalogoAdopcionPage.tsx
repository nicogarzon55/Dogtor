import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { CampoSelect } from '@/components/ui/Campo'
import { Cargando } from '@/components/ui/Cargando'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { TarjetaMascota } from '@/features/adopcion/components/TarjetaMascota'
import {
  listarCatalogo,
  listarCiudadesCatalogo,
  RANGOS_EDAD,
} from '@/features/adopcion/services/adopcion'
import { useConsulta } from '@/hooks/useConsulta'
import { ETIQUETA_ESPECIE, ETIQUETA_SEXO, ETIQUETA_TAMANO, opciones } from '@/lib/formato'
import type { FiltrosCatalogo } from '@/types'

const CLAVES: Array<keyof FiltrosCatalogo> = ['especie', 'edad', 'tamano', 'sexo', 'ciudad']

/** REQ-ADO-01/04/05: catálogo público con filtros combinables en la URL. */
export function CatalogoAdopcionPage() {
  const [parametros, setParametros] = useSearchParams()

  // Los filtros viven en la URL para que el enlace se pueda compartir.
  const filtros = useMemo(() => {
    const f: Record<string, string> = {}
    for (const clave of CLAVES) {
      const valor = parametros.get(clave)
      if (valor) f[clave] = valor
    }
    return f as FiltrosCatalogo
  }, [parametros])

  const hayFiltros = Object.keys(filtros).length > 0

  const { datos: mascotas, error } = useConsulta(() => listarCatalogo(filtros), parametros.toString())
  const { datos: ciudades = [] } = useConsulta(listarCiudadesCatalogo, 'ciudades')

  function cambiarFiltro(clave: keyof FiltrosCatalogo, valor: string) {
    const siguientes = new URLSearchParams(parametros)
    if (valor) siguientes.set(clave, valor)
    else siguientes.delete(clave)
    setParametros(siguientes, { replace: true })
  }

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-ink">Mascotas en adopción</h1>
        <p className="mt-1 max-w-2xl text-ink-muted">
          Perros, gatos y otras mascotas de refugios y fundaciones verificados. Escoge una y
          contacta directamente al refugio.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-2 items-end gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-3 lg:grid-cols-6">
        <CampoSelect
          etiqueta="Especie"
          vacio="Todas"
          value={filtros.especie ?? ''}
          onChange={(e) => cambiarFiltro('especie', e.target.value)}
          opciones={opciones(ETIQUETA_ESPECIE)}
        />
        <CampoSelect
          etiqueta="Edad"
          vacio="Cualquiera"
          value={filtros.edad ?? ''}
          onChange={(e) => cambiarFiltro('edad', e.target.value)}
          opciones={Object.entries(RANGOS_EDAD).map(([valor, r]) => ({ valor, etiqueta: r.etiqueta }))}
        />
        <CampoSelect
          etiqueta="Tamaño"
          vacio="Todos"
          value={filtros.tamano ?? ''}
          onChange={(e) => cambiarFiltro('tamano', e.target.value)}
          opciones={opciones(ETIQUETA_TAMANO)}
        />
        <CampoSelect
          etiqueta="Sexo"
          vacio="Ambos"
          value={filtros.sexo ?? ''}
          onChange={(e) => cambiarFiltro('sexo', e.target.value)}
          opciones={opciones(ETIQUETA_SEXO)}
        />
        <CampoSelect
          etiqueta="Ciudad"
          vacio="Todas"
          value={filtros.ciudad ?? ''}
          onChange={(e) => cambiarFiltro('ciudad', e.target.value)}
          opciones={ciudades.map((c) => ({ valor: c, etiqueta: c }))}
        />
        <Button
          variante="secundario"
          disabled={!hayFiltros}
          onClick={() => setParametros(new URLSearchParams(), { replace: true })}
        >
          Limpiar filtros
        </Button>
      </div>

      {error && <Aviso tipo="error">{error}</Aviso>}
      {!error && !mascotas && <Cargando texto="Buscando mascotas…" />}
      {mascotas?.length === 0 && (
        <EstadoVacio
          titulo={hayFiltros ? 'Ninguna mascota coincide con los filtros' : 'Aún no hay mascotas publicadas'}
          texto={hayFiltros ? 'Prueba quitando alguno de los filtros.' : 'Vuelve pronto: los refugios publican con frecuencia.'}
        />
      )}
      {mascotas && mascotas.length > 0 && (
        <>
          <p className="mb-3 text-sm text-ink-muted" aria-live="polite">
            {mascotas.length} {mascotas.length === 1 ? 'mascota encontrada' : 'mascotas encontradas'}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mascotas.map((m) => (
              <TarjetaMascota key={m.id} mascota={m} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
