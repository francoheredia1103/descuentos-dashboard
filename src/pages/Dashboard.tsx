import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Expense } from '../types'
import { CATEGORY_COLORS } from '../types'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { TrendingDown, TrendingUp, ShoppingBag } from 'lucide-react'

type Period = 'diario' | 'semanal' | 'mensual'
type View = 'personal' | 'compartido'

function formatARS(n: number) {
  return '$' + n.toLocaleString('es-AR')
}

function getWeekStart(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('mensual')
  const [view, setView] = useState<View>('personal')

  useEffect(() => { loadExpenses() }, [view])

  async function loadExpenses() {
    setLoading(true)
    let query = supabase.from('expenses').select('*').order('date', { ascending: false })
    if (view === 'personal' && user) {
      query = query.eq('user_id', user.id)
    }
    const { data } = await query
    setExpenses(data ?? [])
    setLoading(false)
  }

  const now = new Date()
  const filtered = expenses.filter(e => {
    const d = new Date(e.date + 'T00:00:00')
    if (period === 'diario') return e.date === now.toISOString().split('T')[0]
    if (period === 'semanal') return e.date >= getWeekStart(now)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const totalGastado = filtered.reduce((s, e) => s + e.amount, 0)
  const totalAhorrado = filtered.reduce((s, e) => s + e.saved_amount, 0)
  const cantidadCompras = filtered.length

  const byCategory = Object.entries(
    filtered.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  const barData = (() => {
    const grouped = filtered.reduce<Record<string, { gastado: number; ahorrado: number }>>((acc, e) => {
      const key = period === 'mensual'
        ? new Date(e.date + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
        : period === 'semanal'
        ? new Date(e.date + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'short' })
        : e.date
      if (!acc[key]) acc[key] = { gastado: 0, ahorrado: 0 }
      acc[key].gastado += e.amount
      acc[key].ahorrado += e.saved_amount
      return acc
    }, {})
    return Object.entries(grouped).map(([name, vals]) => ({ name, ...vals })).slice(-14)
  })()

  const RADIAN = Math.PI / 180
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  const savingsPct = totalGastado > 0
    ? ((totalAhorrado / (totalGastado + totalAhorrado)) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">

      {/* Hero header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0d1f1a] via-[#0e2018] to-[#0a0a0f] border border-white/5 p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/8 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <p className="text-white/40 text-sm mb-1 capitalize">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Hola, {profile?.name ?? ''}! 👋
          </h2>
          {totalAhorrado > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/20 rounded-xl px-4 py-2">
              <span className="text-emerald-400 text-sm font-semibold">✨ Ahorraste {formatARS(totalAhorrado)} este período</span>
            </div>
          )}
        </div>
      </div>

      {/* View + Period toggles */}
      <div className="flex flex-col gap-3">
        <div className="flex bg-[#13131a] border border-white/8 rounded-xl p-1 gap-1">
          {(['personal', 'compartido'] as View[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === v
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                  : 'text-white/30 hover:text-white/60'
              }`}>
              {v === 'personal' ? '👤 Mis gastos' : '👥 Compartido'}
            </button>
          ))}
        </div>

        <div className="flex bg-[#13131a] border border-white/8 rounded-xl p-1 gap-1 w-fit">
          {(['diario', 'semanal', 'mensual'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-5 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                period === p
                  ? 'bg-white/10 text-white'
                  : 'text-white/30 hover:text-white/60'
              }`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#13131a] border border-white/5 rounded-2xl p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="bg-red-500/10 rounded-xl p-2">
                  <TrendingDown size={18} className="text-red-400" />
                </div>
              </div>
              <p className="text-[10px] text-white/40 font-medium uppercase tracking-wide">Gastado</p>
              <p className="text-base font-bold text-white mt-1 leading-tight">{formatARS(totalGastado)}</p>
            </div>
            <div className="bg-[#13131a] border border-white/5 rounded-2xl p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="bg-emerald-500/10 rounded-xl p-2">
                  <TrendingUp size={18} className="text-emerald-400" />
                </div>
              </div>
              <p className="text-[10px] text-white/40 font-medium uppercase tracking-wide">Ahorrado</p>
              <p className="text-base font-bold text-emerald-400 mt-1 leading-tight">{formatARS(totalAhorrado)}</p>
            </div>
            <div className="bg-[#13131a] border border-white/5 rounded-2xl p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="bg-blue-500/10 rounded-xl p-2">
                  <ShoppingBag size={18} className="text-blue-400" />
                </div>
              </div>
              <p className="text-[10px] text-white/40 font-medium uppercase tracking-wide">Compras</p>
              <p className="text-base font-bold text-white mt-1 leading-tight">{cantidadCompras}</p>
            </div>
          </div>

          {/* Savings progress bar */}
          {totalGastado > 0 && (
            <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-white/60 text-sm font-medium">Ratio de ahorro</span>
                <span className="text-emerald-400 font-bold text-sm">{savingsPct}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(Number(savingsPct), 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-white/30 mt-2">
                <span>Pagado: {formatARS(totalGastado)}</span>
                <span>Ahorro: {formatARS(totalAhorrado)}</span>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-[#13131a] border border-white/5 rounded-2xl">
              <p className="text-4xl mb-4">📊</p>
              <p className="text-white/50 font-medium">No hay gastos en este período</p>
              <p className="text-white/25 text-sm mt-1">Agregá tu primer gasto con el botón + abajo</p>
            </div>
          ) : (
            <>
              {/* Pie chart */}
              <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5">
                <h3 className="font-semibold text-white/80 text-sm uppercase tracking-wide mb-4">Gastos por categoría</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={byCategory}
                      cx="50%" cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={95}
                      innerRadius={45}
                      dataKey="value"
                      stroke="none"
                    >
                      {byCategory.map((entry, i) => (
                        <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? `hsl(${i * 40}, 65%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: unknown) => formatARS(Number(v))}
                      contentStyle={{ borderRadius: 12, border: 'none', background: '#1e1e2a', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend
                      formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{value}</span>}
                      iconType="circle"
                      iconSize={7}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar chart */}
              <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5">
                <h3 className="font-semibold text-white/80 text-sm uppercase tracking-wide mb-4">
                  Gastos {period === 'diario' ? 'del día' : period === 'semanal' ? 'de la semana' : 'del mes'}
                </h3>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={barData} barSize={16} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(v: unknown) => formatARS(Number(v))}
                        contentStyle={{ borderRadius: 12, border: 'none', background: '#1e1e2a', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                      />
                      <Bar dataKey="gastado" name="Gastado" fill="#f87171" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="ahorrado" name="Ahorrado" fill="#34d399" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-white/30 text-sm py-8">Sin datos suficientes</p>
                )}
              </div>

              {/* Recent expenses */}
              <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5">
                <h3 className="font-semibold text-white/80 text-sm uppercase tracking-wide mb-4">Últimos gastos</h3>
                <div className="space-y-1">
                  {filtered.slice(0, 8).map((e, i) => (
                    <div key={e.id} className={`flex items-center justify-between py-3 ${i < filtered.slice(0, 8).length - 1 ? 'border-b border-white/5' : ''}`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-base shrink-0">
                          {e.category === 'Supermercado' ? '🛒'
                            : e.category === 'Restaurante' ? '🍔'
                            : e.category === 'Farmacia' ? '💊'
                            : e.category === 'Delivery' ? '📦'
                            : e.category === 'Transporte privado' ? '🚗'
                            : '🏷️'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm truncate">{e.commerce}</span>
                            {e.saved_amount > 0 && (
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-semibold shrink-0 border border-emerald-500/20">
                                −{formatARS(e.saved_amount)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-white/30">{e.category}</span>
                            {view === 'compartido' && (
                              <span className="text-[11px] text-white/30">· {e.user_name}</span>
                            )}
                            <span className="text-[11px] text-white/30">
                              · {new Date(e.date + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="font-bold text-white text-sm ml-3">{formatARS(e.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
