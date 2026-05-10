-- ============================================================
-- PromoTracker — Schema Supabase
-- Ejecutá esto en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- 1. Tabla de perfiles (se crea automáticamente al registrarse)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  created_at timestamptz default now()
);

-- 2. Tabla de descuentos (compartida, editable por todos)
create table if not exists public.discounts (
  id uuid default gen_random_uuid() primary key,
  commerce text not null,
  category text not null,
  percentage int not null,
  payment_method text,
  days text[] default '{}',
  cap_amount int,
  min_amount int,
  valid_until date,
  notes text,
  created_at timestamptz default now()
);

-- 3. Tabla de gastos (por usuario)
create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_name text not null,
  date date not null default current_date,
  commerce text not null,
  category text not null,
  amount int not null,
  discount_id uuid references public.discounts(id) on delete set null,
  discount_pct int default 0,
  saved_amount int default 0,
  payment_method text,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.discounts enable row level security;
alter table public.expenses enable row level security;

-- Profiles: cada usuario ve y edita su propio perfil
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Discounts: cualquier usuario autenticado puede leer e insertar
create policy "discounts_select" on public.discounts for select using (true);
create policy "discounts_insert" on public.discounts for insert with check (auth.role() = 'authenticated');

-- Expenses: cada usuario ve y gestiona sus propios gastos
create policy "expenses_select_own" on public.expenses for select using (auth.uid() = user_id);
create policy "expenses_insert_own" on public.expenses for insert with check (auth.uid() = user_id);
create policy "expenses_update_own" on public.expenses for update using (auth.uid() = user_id);
create policy "expenses_delete_own" on public.expenses for delete using (auth.uid() = user_id);

-- Vista compartida: usuarios autenticados pueden ver todos los gastos (para dashboard compartido)
create policy "expenses_select_shared" on public.expenses for select using (auth.role() = 'authenticated');

-- ============================================================
-- Trigger: crear perfil automáticamente al registrarse
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
