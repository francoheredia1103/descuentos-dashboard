import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Expense } from '../types'
import { CATEGORY_COLORS } from '../types'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { TrendingDown, TrendingUp, ShoppingBag, Sparkles } from 'lucide-react'

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

  // Filter by period
  const now = new Date()
  const filtered = expenses.filter(e => {
    const d = new Date(e.date + 'T00:00:00')
    if (period === 'diario') {
      return e.date === now.toISOString().split('T')[0]
    } else if (period === 'semanal') {
      return e.date >= getWeekStart(now)
    } else {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }
  })

  // Summary stats
  const totalGastado = filtered.reduce((s, e) => s + e.amount, 0)
  const totalAhorrado = filtered.reduce((s, e) => s + e.saved_amount, 0)
  const cantidadCompras = filtered.length

  // Pie chart: gastos por categoría
  const byCategory = Object.entries(
    filtered.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount
      return acc
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Bar chart: gastos por fecha
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
    return Object.entries(grouped)
      .map(([name, vals]) => ({ name, ...vals }))
      .slice(-14)
  })()

  const RADIAN = Math.PI / 180
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Hola, {profile?.name ?? ''}! 👋
          </h2>
          <p className="text-slate-500 text-sm">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1">
          {(['personal', 'compartido'] as View[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                view === v ? 'bg-emerald-500 text-white shadow' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {v === 'personal' ? '👤 Mis gastos' : '👥 Compartido'}
            </button>
          ))}
        </div>
      </div>

      {/* Period toggle */}
      <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1 w-fit">
        {(['diario', 'semanal', 'mensual'] as Period[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              period === p ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Cargando...</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="bg-red-50 rounded-xl p-2">
                  <TrendingDown size={20} className="text-red-500" />
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium">Gastado</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{formatARS(totalGastado)}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="bg-emerald-50 rounded-xl p-2">
                  <TrendingUp size={20} className="text-emerald-500" />
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium">Ahorrado</p>
              <p className="text-lg font-bold text-emerald-600 mt-1">{formatARS(totalAhorrado)}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="bg-blue-50 rounded-xl p-2">
                  <ShoppingBag size={20} className="text-blue-500" />
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium">Compras</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{cantidadCompras}</p>
            </div>
          </div>

          {/* Savings highlight */}
          {totalAhorrado > 0 && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 flex items-center gap-3 text-white shadow-lg">
              <Sparkles size={28} className="shrink-0" />
              <div>
                <p className="font-bold text-lg">¡Ahorraste {formatARS(totalAhorrado)}!</p>
                <p className="text-emerald-100 text-sm">
                  {totalGastado > 0
                    ? `Eso es el ${((totalAhorrado / (totalGastado + totalAhorrado)) * 100).toFixed(1)}% de tus compras`
                    : 'Gracias a los descuentos aplicados'}
                </p>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-slate-500 font-medium">No hay gastos en este período</p>
              <p className="text-slate-400 text-sm mt-1">Agregá tu primer gasto con el botón + abajo</p>
            </div>
          ) : (
            <>
              {/* Pie chart */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <h3 className="font-semibold text-slate-700 mb-4">Gastos por categoría</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={byCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={100}
                      innerRadius={45}
                      dataKey="value"
                      stroke="none"
                    >
                      {byCategory.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={CATEGORY_COLORS[entry.name] ?? `hsl(${i * 40}, 65%, 50%)`}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => formatARS(v)}
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
                    />
                    <Legend
                      formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                      iconType="circle"
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar chart */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <h3 className="font-semibold text-slate-700 mb-4">
                  Gastos {period === 'diario' ? 'del día' : period === 'semanal' ? 'de la semana' : 'del mes'}
                </h3>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={barData} barSize={20} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(v: number) => formatARS(v)}
                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="gastado" name="Gastado" fill="#f87171" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="ahorrado" name="Ahorrado" fill="#34d399" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-slate-400 text-sm py-8">Sin datos suficientes para mostrar</p>
                )}
              </div>

              {/* Recent expenses */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <h3 className="font-semibold text-slate-700 mb-3">Últimos gastos</h3>
                <div className="space-y-2">
                  {filtered.slice(0, 8).map(e => (
                    <div key={e.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700 text-sm truncate">{e.commerce}</span>
                          {e.saved_amount > 0 && (
                            <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium shrink-0">
                              −{formatARS(e.saved_amount)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">{e.category}</span>
                          {view === 'compartido' && (
                            <span className="text-xs text-slate-400">· {e.user_name}</span>
                          )}
                          <span className="text-xs text-slate-400">
                            · {new Date(e.date + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <span className="font-semibold text-slate-800 text-sm ml-3">{formatARS(e.amount)}</span>
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
