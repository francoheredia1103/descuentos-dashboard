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

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="bg-emerald-100 text-emerald-600 rounded-full p-5">
          <CheckCircle size={48} />
        </div>
        <p className="text-xl font-semibold text-slate-700">¡Gasto registrado!</p>
        {savedAmount > 0 && (
          <p className="text-slate-500">Ahorraste <strong className="text-emerald-600">${savedAmount.toLocaleString('es-AR')}</strong></p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Registrar gasto</h2>
        <p className="text-slate-500 text-sm mt-0.5">Agregá un gasto y aplicá el descuento si usaste uno</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Fecha y comercio */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Datos del gasto</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Fecha</label>
              <input type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Categoría</label>
              <select value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Comercio / Local</label>
            <input placeholder="Ej: Coto, Farmacity..." value={form.commerce} required
              onChange={e => setForm(f => ({ ...f, commerce: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Monto total ($)</label>
            <input type="number" placeholder="0" value={form.amount} required
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 text-lg font-semibold"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Medio de pago</label>
            <input placeholder="Ej: Galicia débito, MODO..." value={form.payment_method}
              onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>

        {/* Descuento */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Descuento aplicado</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.applyDiscount}
                onChange={e => setForm(f => ({ ...f, applyDiscount: e.target.checked, discount_id: '', custom_pct: '' }))}
                className="w-4 h-4 accent-emerald-500"
              />
              <span className="text-sm text-slate-600">Apliqué descuento</span>
            </label>
          </div>

          {form.applyDiscount && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Seleccioná del catálogo</label>
                <select value={form.discount_id}
                  onChange={e => setForm(f => ({ ...f, discount_id: e.target.value, custom_pct: '' }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                  <option value="">— Sin seleccionar —</option>
                  {discounts.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.commerce} — {d.percentage}% ({d.payment_method ?? 'cualquier medio'})
                    </option>
                  ))}
                </select>
              </div>
              {!form.discount_id && (
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">O ingresá % manualmente</label>
                  <input type="number" placeholder="Ej: 20" value={form.custom_pct}
                    onChange={e => setForm(f => ({ ...f, custom_pct: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Resumen */}
        {amount > 0 && (
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white space-y-3">
            <h3 className="text-sm font-semibold opacity-80 uppercase tracking-wide">Resumen</h3>
            <div className="flex justify-between text-sm">
              <span className="opacity-80">Monto bruto</span>
              <span className="font-semibold">${amount.toLocaleString('es-AR')}</span>
            </div>
            {savedAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="opacity-80">Descuento ({discountPct}%)</span>
                <span className="font-semibold text-emerald-200">− ${savedAmount.toLocaleString('es-AR')}</span>
              </div>
            )}
            <div className="border-t border-white/20 pt-2 flex justify-between">
              <span className="font-semibold">Total a pagar</span>
              <span className="text-xl font-bold">${finalAmount.toLocaleString('es-AR')}</span>
            </div>
            {selectedDiscount?.cap_amount && rawSaving > selectedDiscount.cap_amount && (
              <p className="text-xs opacity-70">* Descuento limitado al tope de ${selectedDiscount.cap_amount.toLocaleString('es-AR')}</p>
            )}
          </div>
        )}

        {/* Notas */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <label className="text-xs text-slate-500 mb-1 block">Notas (opcional)</label>
          <textarea rows={2} placeholder="Ej: Compra semanal, sin cola..." value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
          />
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-2xl text-lg transition-colors shadow-lg">
          {saving ? 'Guardando...' : 'Registrar gasto'}
        </button>
      </form>
    </div>
  )
}
