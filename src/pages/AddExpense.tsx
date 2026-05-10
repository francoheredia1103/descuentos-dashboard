import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { CATEGORIES } from '../types'
import type { Discount } from '../types'
import { CheckCircle } from 'lucide-react'

export default function AddExpense() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    commerce: '',
    category: 'Supermercado',
    amount: '',
    applyDiscount: false,
    discount_id: '',
    custom_pct: '',
    payment_method: '',
    notes: '',
  })

  useEffect(() => {
    supabase.from('discounts').select('*').order('category').then(({ data }) => {
      setDiscounts(data ?? [])
    })
  }, [])

  const selectedDiscount = discounts.find(d => d.id === form.discount_id)
  const discountPct = form.applyDiscount
    ? (selectedDiscount ? selectedDiscount.percentage : Number(form.custom_pct) || 0)
    : 0
  const amount = Number(form.amount) || 0
  const rawSaving = Math.round(amount * discountPct / 100)
  const cap = selectedDiscount?.cap_amount
  const savedAmount = cap ? Math.min(rawSaving, cap) : rawSaving
  const finalAmount = amount - savedAmount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !profile) return
    setSaving(true)
    await supabase.from('expenses').insert({
      user_id: user.id,
      user_name: profile.name,
      date: form.date,
      commerce: form.commerce,
      category: form.category,
      amount,
      discount_id: form.discount_id || null,
      discount_pct: discountPct,
      saved_amount: savedAmount,
      payment_method: form.payment_method || null,
      notes: form.notes || null,
    })
    setSuccess(true)
    setSaving(false)
    setTimeout(() => {
      setSuccess(false)
      navigate('/')
    }, 1500)
  }

  const inputClass = "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all text-sm"
  const labelClass = "text-xs font-medium text-white/40 mb-1.5 block uppercase tracking-wide"

  if (success) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-full p-6 shadow-2xl shadow-emerald-900/40">
          <CheckCircle size={48} className="text-emerald-400" />
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-white">¡Gasto registrado!</p>
          {savedAmount > 0 && (
            <p className="text-white/50 mt-1">Ahorraste <strong className="text-emerald-400">${savedAmount.toLocaleString('es-AR')}</strong></p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Registrar gasto</h2>
        <p className="text-white/40 text-sm mt-0.5">Agregá un gasto y aplicá el descuento si usaste uno</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Datos del gasto */}
        <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Datos del gasto</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Fecha</label>
              <input type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Categoría</label>
              <select value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className={inputClass}>
                {CATEGORIES.map(c => <option key={c} style={{ background: '#13131a' }}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Comercio / Local</label>
            <input placeholder="Ej: Coto, Farmacity..." value={form.commerce} required
              onChange={e => setForm(f => ({ ...f, commerce: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Monto total ($)</label>
            <input type="number" placeholder="0" value={form.amount} required
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className={`${inputClass} text-2xl font-bold`}
            />
          </div>
          <div>
            <label className={labelClass}>Medio de pago</label>
            <input placeholder="Ej: Galicia débito, MODO..." value={form.payment_method}
              onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>

        {/* Descuento */}
        <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Descuento aplicado</h3>
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className={`w-10 h-5 rounded-full transition-all relative ${form.applyDiscount ? 'bg-emerald-500' : 'bg-white/10'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow ${form.applyDiscount ? 'left-5' : 'left-0.5'}`} />
                <input type="checkbox" checked={form.applyDiscount}
                  onChange={e => setForm(f => ({ ...f, applyDiscount: e.target.checked, discount_id: '', custom_pct: '' }))}
                  className="sr-only"
                />
              </div>
              <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">Apliqué descuento</span>
            </label>
          </div>

          {form.applyDiscount && (
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Seleccioná del catálogo</label>
                <select value={form.discount_id}
                  onChange={e => setForm(f => ({ ...f, discount_id: e.target.value, custom_pct: '' }))}
                  className={inputClass}>
                  <option value="" style={{ background: '#13131a' }}>— Sin seleccionar —</option>
                  {discounts.map(d => (
                    <option key={d.id} value={d.id} style={{ background: '#13131a' }}>
                      {d.commerce} — {d.percentage}% ({d.payment_method ?? 'cualquier medio'})
                    </option>
                  ))}
                </select>
              </div>
              {!form.discount_id && (
                <div>
                  <label className={labelClass}>O ingresá % manualmente</label>
                  <input type="number" placeholder="Ej: 20" value={form.custom_pct}
                    onChange={e => setForm(f => ({ ...f, custom_pct: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Resumen */}
        {amount > 0 && (
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900/60 to-teal-900/40 border border-emerald-500/20 rounded-2xl p-5 space-y-3">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Resumen</h3>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Monto bruto</span>
              <span className="font-semibold text-white">${amount.toLocaleString('es-AR')}</span>
            </div>
            {savedAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Descuento ({discountPct}%)</span>
                <span className="font-semibold text-emerald-400">− ${savedAmount.toLocaleString('es-AR')}</span>
              </div>
            )}
            <div className="border-t border-white/10 pt-3 flex justify-between items-center">
              <span className="font-semibold text-white">Total a pagar</span>
              <span className="text-2xl font-black text-white">${finalAmount.toLocaleString('es-AR')}</span>
            </div>
            {selectedDiscount?.cap_amount && rawSaving > selectedDiscount.cap_amount && (
              <p className="text-xs text-white/30">* Descuento limitado al tope de ${selectedDiscount.cap_amount.toLocaleString('es-AR')}</p>
            )}
          </div>
        )}

        {/* Notas */}
        <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5">
          <label className={labelClass}>Notas (opcional)</label>
          <textarea rows={2} placeholder="Ej: Compra semanal, sin cola..." value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className={`${inputClass} resize-none`}
          />
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-40 text-white font-black rounded-2xl text-lg transition-all shadow-2xl shadow-emerald-900/40">
          {saving ? 'Guardando...' : 'Registrar gasto'}
        </button>
      </form>
    </div>
  )
}
