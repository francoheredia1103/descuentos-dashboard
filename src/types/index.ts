export interface Profile {
  id: string
  name: string
  email: string
}

export interface Discount {
  id: string
  commerce: string
  category: string
  percentage: number
  payment_method: string | null
  days: string[]
  cap_amount: number | null
  min_amount: number | null
  valid_until: string | null
  notes: string | null
  created_at: string
}

export interface Expense {
  id: string
  user_id: string
  user_name: string
  date: string
  commerce: string
  category: string
  amount: number
  discount_id: string | null
  discount_pct: number
  saved_amount: number
  payment_method: string | null
  notes: string | null
  created_at: string
}

export const CATEGORIES = [
  'Supermercado',
  'Carnicería',
  'Pollería',
  'Restaurante',
  'Helados / Cafetería',
  'Farmacia',
  'Transporte privado',
  'Transporte público',
  'Delivery',
  'Otros',
] as const

export type Category = typeof CATEGORIES[number]

export const CATEGORY_COLORS: Record<string, string> = {
  'Supermercado': '#16a34a',
  'Carnicería': '#dc2626',
  'Pollería': '#d97706',
  'Restaurante': '#ea580c',
  'Helados / Cafetería': '#2563eb',
  'Farmacia': '#9333ea',
  'Transporte privado': '#475569',
  'Transporte público': '#0891b2',
  'Delivery': '#f59e0b',
  'Otros': '#6b7280',
}
