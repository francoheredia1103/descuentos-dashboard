import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PRELOADED_DISCOUNTS } from '../data/discounts'
import type { Discount } from '../types'
import { Plus, Tag, Calendar, CreditCard, Info } from 'lucide-react'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const TODAY = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]

const CATEGORY_EMOJI: Record<string, string> = {
  Supermercado: '🛒',
  Carnicería: '🥩',
  Pollería: '🍗',
  Restaurante: '🍔',
  'Helados / Cafetería': '🍦',
  Farmacia: '💊',
  'Transporte privado': '🚗',
  'Transporte público': '🚌',
  Delivery: '📦',
  General: '🏷️',
  'Comercios de barrio': '🏪',
  Otros: '📌',
}

export default function Discounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [seeded, setSeeded] = useState(false)
  const [filterDay, setFilterDay] = useState<string>('Hoy')
  const [filterCat, setFilterCat] = useState<string>('Todos')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    commerce: '', category: 'Supermercado', percentage: '', payment_method: '',
    days: [] as string[], cap_amount: '', min_amount: '', valid_until: '', notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadDiscounts() }, [])

  async function loadDiscounts() {
    setLoading(true)
    const { data } = await supabase.from('discounts').select('*').order('category')
    if (data && data.length === 0 && !seeded) {
      await seedDiscounts()
    } else {
      setDiscounts(data ?? [])
      setLoading(false)
    }
  }

  async function seedDiscounts() {
    setSeeded(true)
    await supabase.from('discounts').insert(PRELOADED_DISCOUNTS)
    const { data } = await supabase.from('discounts').select('*').order('category')
    setDiscounts(data ?? [])
    setLoading(false)
  }

  async function handleAddDiscount(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('discounts').insert({
      commerce: form.commerce,
      category: form.category,
      percentage: Number(form.percentage),
      payment_method: form.payment_method || null,
      days: form.days,
      cap_amount: form.cap_amount ? Number(form.cap_amount) : null,
      min_amount: form.min_amount ? Number(form.min_amount) : null,
      valid_until: form.valid_until || null,
      notes: form.notes || null,
    })
    setShowForm(false)
    setForm({ commerce: '', category: 'Supermercado', percentage: '', payment_method: '', days: [], cap_amount: '', min_amount: '', valid_until: '', notes: '' })
    await loadDiscounts()
    setSaving(false)
  }

  function toggleDay(day: string) {
    setForm(f => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day],
    }))
  }

  const categories = ['Todos', ...Array.from(new Set(discounts.map(d => d.category)))]

  const filtered = discounts.filter(d => {
    const dayMatch = filterDay === 'Todos' || (filterDay === 'Hoy' ? d.days.includes(TODAY) : d.days.includes(filterDay))
    const catMatch = filterCat === 'Todos' || d.category === filterCat
    return dayMatch && catMatch
  })

  const todayCount = discounts.filter(d => d.days.includes(TODAY)).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Descuentos</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            <span className="text-emerald-600 font-semibold">{todayCount}</span> promos activas hoy ({TODAY})
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow"
        >
          <Plus size={16} />
          Agregar
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-md p-5 border border-emerald-100">
          <h3 className="font-semibold text-slate-700 mb-4">Nuevo descuento</h3>
          <form onSubmit={handleAddDiscount} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <input placeholder="Comercio *" required value={form.commerce}
                  onChange={e => setForm(f => ({ ...f, commerce: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                {['Supermercado','Carnicería','Pollería','Restaurante','Helados / Cafetería','Farmacia','Transporte privado','Transporte público','Delivery','General','Otros'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input placeholder="% descuento *" type="number" required value={form.percentage}
                onChange={e => setForm(f => ({ ...f, percentage: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <input placeholder="Medio de pago" value={form.payment_method}
                onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <input placeholder="Tope $" type="number" value={form.cap_amount}
                onChange={e => setForm(f => ({ ...f, cap_amount: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <input placeholder="Mínimo $" type="number" value={form.min_amount}
                onChange={e => setForm(f => ({ ...f, min_amount: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <input type="date" value={form.valid_until}
                onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 col-span-2"
                placeholder="Válido hasta"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Días que aplica:</p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(d => (
                  <button key={d} type="button" onClick={() => toggleDay(d)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                      form.days.includes(d)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            <textarea placeholder="Notas / condiciones" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-colors">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {['Hoy', 'Todos', ...DAYS].map(d => (
            <button key={d} onClick={() => setFilterDay(d)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterDay === d ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}>
              {d === 'Hoy' ? `Hoy (${TODAY.slice(0,3)})` : d.slice(0,3)}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterCat === c ? 'bg-slate-700 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}>
              {CATEGORY_EMOJI[c] ?? '📌'} {c}
            </button>
          ))}
        </div>
      </div>

      {/* Discounts list */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando descuentos...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No hay descuentos para este filtro</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => (
            <div key={d.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{CATEGORY_EMOJI[d.category] ?? '📌'}</span>
                    <span className="font-semibold text-slate-800 text-sm">{d.commerce}</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{d.category}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    {d.payment_method && (
                      <span className="flex items-center gap-1">
                        <CreditCard size={12} /> {d.payment_method}
                      </span>
                    )}
                    {d.days.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {d.days.map(day => day.slice(0,3)).join(' · ')}
                      </span>
                    )}
                    {d.cap_amount && (
                      <span className="flex items-center gap-1">
                        <Tag size={12} /> Tope ${d.cap_amount.toLocaleString('es-AR')}
                      </span>
                    )}
                    {d.min_amount && (
                      <span className="flex items-center gap-1">
                        <Info size={12} /> Mín. ${d.min_amount.toLocaleString('es-AR')}
                      </span>
                    )}
                    {d.valid_until && (
                      <span>Vence: {new Date(d.valid_until).toLocaleDateString('es-AR')}</span>
                    )}
                  </div>
                  {d.notes && (
                    <p className="text-xs text-slate-400 mt-1 italic">{d.notes}</p>
                  )}
                </div>
                <div className="shrink-0 text-center bg-emerald-50 rounded-xl px-3 py-2">
                  <span className="text-2xl font-bold text-emerald-600">{d.percentage}%</span>
                  <p className="text-xs text-emerald-500 font-medium">ahorro</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
