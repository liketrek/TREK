// ─────────────────────────────────────────────────────────────────────────────
// FICHERO NUEVO: client/src/components/Packing/BikepackImportModal.tsx
//
// Modal que Trek muestra al pulsar "Importar desde Bikepack".
// Llama a la API de Bikepack, muestra una vista previa y luego usa
// packingApi.bulkImport + packingApi.createBag para rellenar el viaje.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { X, Loader2, Package, CheckCircle2, AlertCircle } from 'lucide-react'
import { packingApi } from '../../api/client'
import { useToast } from '../shared/Toast'

// URL base de Bikepack — ajustar si cambia el puerto
const BIKEPACK_URL = 'https://trekwanderer.info:448'
const BIKEPACK_USER_ID = '0563db31-017c-4b3f-8705-a373b34577d5'

interface BikepackGroup  { id: number; name: string; color: string }
interface BikepackItem   { id: number; name: string; weight_grams: number; category: string; quantity: number; bag_names: string[] }
interface BikepackBag    { id: number; name: string; color: string; config_idx: number }
interface BikepackProfile { groups: BikepackGroup[]; items: BikepackItem[]; bags: BikepackBag[] }

interface Props {
  tripId: number | string
  onClose: () => void
  onImported: () => void
}

export default function BikepackImportModal({ tripId, onClose, onImported }: Props) {
  const toast = useToast()
  const [step, setStep]       = useState<'preview' | 'loading' | 'done' | 'error'>('loading')
  const [profile, setProfile] = useState<BikepackProfile | null>(null)
  const [error, setError]     = useState('')
  const [importing, setImporting] = useState(false)

  // Cargar perfil de Bikepack al montar
  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    setStep('loading')
    try {
      // La petición se hace con credentials para enviar la cookie de sesión de Bikepack
      const res = await fetch(`${BIKEPACK_URL}/api/bikepack/profile/public?user_id=${BIKEPACK_USER_ID}`, {

        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error(`Bikepack devolvió ${res.status}`)
      const data: BikepackProfile = await res.json()
      setProfile(data)
      setStep('preview')
    } catch (err: any) {
      setError(err.message || 'No se pudo conectar con Bikepack')
      setStep('error')
    }
  }

  async function handleImport() {
    if (!profile) return
    setImporting(true)
    try {
      // 1. Borrar items y bolsas existentes del viaje
      const existingData = await packingApi.list(tripId)
      const existingItems = existingData.items || existingData
      await Promise.all(existingItems.map((i: any) => packingApi.delete(tripId, i.id)))
      const existingBagsData = await packingApi.listBags(tripId)
      const existingBags = existingBagsData.bags || existingBagsData
      await Promise.all(existingBags.map((b: any) => packingApi.deleteBag(tripId, b.id)))

      // 2. Importar items — packingService crea las bolsas automáticamente por nombre
      const itemsToImport = profile.items.filter(item => item.quantity > 0).map(item => ({
        name:          item.name,
        category:      item.category,
        quantity:      item.quantity,
        weight_grams:  item.weight_grams,
        // Enviamos el nombre de la bolsa para que packingService la resuelva
        bag:           item.bag_names.length > 0 ? item.bag_names[0] : undefined,
      }))

      await packingApi.bulkImport(tripId, itemsToImport)

      setStep('done')
      toast.success(`${itemsToImport.length} artículos importados desde Bikepack`)
      setTimeout(() => {
        onImported()
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Error al importar')
      setStep('error')
    } finally {
      setImporting(false)
    }
  }

  // ── Resumen por categoría para la vista previa ──────────────────────────
  function getCategorySummary() {
    if (!profile) return []
    const map: Record<string, { count: number; weight: number; color: string }> = {}
    for (const item of profile.items.filter(i => i.quantity > 0)) {
      const group = profile.groups.find(g => g.name === item.category)
      if (!map[item.category]) map[item.category] = { count: 0, weight: 0, color: group?.color ?? '#888780' }
      map[item.category].count  += item.quantity
      map[item.category].weight += item.weight_grams * item.quantity
    }
    return Object.entries(map).map(([name, data]) => ({ name, ...data }))
  }

  const totalWeight = profile?.items.filter(i => i.quantity > 0).reduce((s, i) => s + i.weight_grams * i.quantity, 0) ?? 0
  const totalItems  = profile?.items.filter(i => i.quantity > 0).reduce((s, i) => s + i.quantity, 0) ?? 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-teal-500" />
            <span className="font-medium text-[15px]">Importar desde Bikepack</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 min-h-[200px] flex flex-col">

          {/* Cargando */}
          {step === 'loading' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <Loader2 size={28} className="animate-spin" />
              <span className="text-sm">Conectando con Bikepack…</span>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <AlertCircle size={28} className="text-red-400" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">{error}</p>
              <p className="text-xs text-zinc-400 text-center">
                Asegúrate de estar logueado en{' '}
                <a href={BIKEPACK_URL} target="_blank" rel="noreferrer" className="text-teal-500 underline">
                  Bikepack
                </a>
              </p>
              <button
                onClick={fetchProfile}
                className="mt-2 px-4 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Hecho */}
          {step === 'done' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-green-500">
              <CheckCircle2 size={32} />
              <span className="text-sm font-medium">¡Importado correctamente!</span>
            </div>
          )}

          {/* Vista previa */}
          {step === 'preview' && profile && (
            <>
              {/* Stats globales */}
              <div className="flex gap-4 mb-4 text-sm">
                <div className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 text-center">
                  <div className="font-medium text-base">{profile.items.length}</div>
                  <div className="text-zinc-500 text-xs">artículos</div>
                </div>
                <div className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 text-center">
                  <div className="font-medium text-base">{profile.bags.length}</div>
                  <div className="text-zinc-500 text-xs">bolsas</div>
                </div>
                <div className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 text-center">
                  <div className="font-medium text-base">{(totalWeight / 1000).toFixed(1)} kg</div>
                  <div className="text-zinc-500 text-xs">peso total</div>
                </div>
              </div>

              {/* Categorías */}
              <div className="space-y-1.5 overflow-y-auto max-h-52 pr-1">
                {getCategorySummary().map(cat => (
                  <div key={cat.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="flex-1 truncate text-zinc-700 dark:text-zinc-300">{cat.name}</span>
                    <span className="text-zinc-400 text-xs">{cat.count} uds</span>
                    <span className="text-zinc-400 text-xs w-16 text-right">
                      {cat.weight >= 1000
                        ? `${(cat.weight / 1000).toFixed(2)} kg`
                        : `${cat.weight} g`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bolsas */}
              {profile.bags.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs text-zinc-400 mb-1.5">Bolsas que se crearán:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[...new Set(profile.bags.map(b => b.name))].map(name => {
                      const bag = profile.bags.find(b => b.name === name)!
                      return (
                        <span
                          key={name}
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: bag.color + '33', color: bag.color }}
                        >
                          {name}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {step === 'preview' && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-zinc-200 dark:border-zinc-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-4 py-2 text-sm rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {importing && <Loader2 size={14} className="animate-spin" />}
              Importar {profile?.items.filter(i => i.quantity > 0).length} artículos
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
