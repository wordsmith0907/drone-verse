-- ==============================================================================
-- DroneVerse Ecommerce - Supabase Database Schema & RLS Setup
-- Run this complete script in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ==============================================================================

-- 1. Create Profiles Table (Linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  role text default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Comment on profiles
comment on table public.profiles is 'Customer and admin user profile data linked to auth.users.';

-- 2. Create Orders Table
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  order_number text unique not null,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  gst_amount numeric(12, 2) default 0.00 check (gst_amount >= 0),
  shipping_fee numeric(12, 2) default 0.00,
  status text default 'confirmed' check (status in ('pending', 'confirmed', 'processing', 'dispatched', 'shipped', 'delivered', 'cancelled')),
  shipping_address jsonb not null default '{}'::jsonb,
  tracking_number text,
  courier text default 'Bluedart Express',
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Index for orders query by user and date
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_created_at on public.orders(created_at desc);

-- 3. Create Wishlist Table
create table if not exists public.wishlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (user_id, product_id)
);

create index if not exists idx_wishlist_user_id on public.wishlist(user_id);

-- 4. Enable Row Level Security (RLS) on all tables
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.wishlist enable row level security;

-- 5. Helper Function: Check if current user is an admin (Security Definer avoids recursive RLS)
create or replace function public.is_admin()
returns boolean as $$
declare
  user_role text;
begin
  select role into user_role from public.profiles where id = auth.uid();
  return user_role = 'admin';
end;
$$ language plpgsql security definer;

-- 6. Row Level Security Policies

-- --- Profiles Policies ---
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Admins can insert profiles" on public.profiles;
create policy "Admins can insert profiles"
  on public.profiles for insert
  with check (auth.uid() = id or public.is_admin());

-- --- Orders Policies ---
drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can create own orders" on public.orders;
create policy "Users can create own orders"
  on public.orders for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
  on public.orders for update
  using (public.is_admin());

-- --- Wishlist Policies ---
drop policy if exists "Users can view own wishlist" on public.wishlist;
create policy "Users can view own wishlist"
  on public.wishlist for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can add to own wishlist" on public.wishlist;
create policy "Users can add to own wishlist"
  on public.wishlist for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove from own wishlist" on public.wishlist;
create policy "Users can remove from own wishlist"
  on public.wishlist for delete
  using (auth.uid() = user_id or public.is_admin());

-- 7. Trigger: Auto-create Profile row when a new user signs up in auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    'customer'
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone;
  return new;
end;
$$ language plpgsql security definer;

-- Bind trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==============================================================================
-- INSTRUCTIONS FOR PROMOTING AN ADMIN:
-- To make a user an admin, run this SQL in Supabase SQL Editor after they sign up:
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'YOUR_USER_UUID';
-- ==============================================================================
