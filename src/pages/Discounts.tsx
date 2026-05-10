import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PRELOADED_DISCOUNTS } from '../data/discounts'
import type { Discount } from '../types'
import { Plus, Calendar, CreditCard, Tag, Info } from 'lucide-react'

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

  const inputClass = "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all text-sm"

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Descuentos</h2>
          <p className="text-white/40 text-sm mt-0.5">
            <span className="text-emerald-400 font-semibold">{todayCount}</span> promos activas hoy ({TODAY})
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/40"
        >
          <Plus size={16} />
          Agregar
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-[#13131a] border border-emerald-500/20 rounded-2xl p-5 shadow-2xl shadow-black/40">
          <h3 className="font-semibold text-white mb-4">Nuevo descuento</h3>
          <form onSubmit={handleAddDiscount} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <input placeholder="Comercio *" required value={form.commerce}
                  onChange={e => setForm(f => ({ ...f, commerce: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className={inputClass}>
                {['Supermercado','Carnicería','Pollería','Restaurante','Helados / Cafetería','Farmacia','Transporte privado','Transporte público','Delivery','General','Otros'].map(c => (
                  <option key={c} style={{ background: '#13131a' }}>{c}</option>
                ))}
              </select>
              <input placeholder="% descuento *" type="number" required value={form.percentage}
                onChange={e => setForm(f => ({ ...f, percentage: e.target.value }))}
                className={inputClass}
              />
              <input placeholder="Medio de pago" value={form.payment_method}
                onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
                className={inputClass}
              />
              <input placeholder="Tope $" type="number" value={form.cap_amount}
                onChange={e => setForm(f => ({ ...f, cap_amount: e.target.value }))}
                className={inputClass}
              />
              <input placeholder="Mínimo $" type="number" value={form.min_amount}
                onChange={e => setForm(f => ({ ...f, min_amount: e.target.value }))}
                className={inputClass}
              />
              <input type="date" value={form.valid_until}
                onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                className={`${inputClass} col-span-2`}
              />
            </div>
            <div>
              <p className="text-xs text-white/40 mb-2 uppercase tracking-wide">Días que aplica:</p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(d => (
                  <button key={d} type="button" onClick={() => toggleDay(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      form.days.includes(d)
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                        : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 border border-white/8'
                    }`}>
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            <textarea placeholder="Notas / condiciones" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className={`${inputClass} resize-none`}
            />
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-900/40">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white/60 font-semibold rounded-xl text-sm transition-all border border-white/8">
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
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterDay === d
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                  : 'bg-[#13131a] text-white/40 border border-white/8 hover:text-white/70'
              }`}>
              {d === 'Hoy' ? `Hoy (${TODAY.slice(0,3)})` : d.slice(0,3)}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterCat === c
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-[#13131a] text-white/40 border border-white/8 hover:text-white/70'
              }`}>
              {CATEGORY_EMOJI[c] ?? '📌'} {c}
            </button>
          ))}
        </div>
      </div>

      {/* Discounts list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#13131a] border border-white/5 rounded-2xl">
          <p className="text-4xl mb-3">🏷️</p>
          <p className="text-white/40">No hay descuentos para este filtro</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => (
            <div key={d.id} className="bg-[#13131a] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl">{CATEGORY_EMOJI[d.category] ?? '📌'}</span>
                    <span className="font-bold text-white text-sm">{d.commerce}</span>
                    <span className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded-full border border-white/8">{d.category}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/30">
                    {d.payment_method && (
                      <span className="flex items-center gap-1">
                        <CreditCard size={11} /> {d.payment_method}
                      </span>
                    )}
                    {d.days.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {d.days.map(day => day.slice(0,3)).join(' · ')}
                      </span>
                    )}
                    {d.cap_amount && (
                      <span className="flex items-center gap-1">
                        <Tag size={11} /> Tope ${d.cap_amount.toLocaleString('es-AR')}
                      </span>
                    )}
                    {d.min_amount && (
                      <span className="flex items-center gap-1">
                        <Info size={11} /> Mín. ${d.min_amount.toLocaleString('es-AR')}
                      </span>
                    )}
                    {d.valid_until && (
                      <span>Vence: {new Date(d.valid_until).toLocaleDateString('es-AR')}</span>
                    )}
                  </div>
                  {d.notes && (
                    <p className="text-xs text-white/20 mt-1.5 italic">{d.notes}</p>
                  )}
                </div>
                <div className="shrink-0 text-center bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5">
                  <span className="text-2xl font-black text-emerald-400">{d.percentage}%</span>
                  <p className="text-[10px] text-emerald-500/60 font-semibold mt-0.5">ahorro</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
