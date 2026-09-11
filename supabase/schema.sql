-- MASJID DIGITAL - SUPABASE DATABASE
-- Jalankan seluruh file ini di Supabase SQL Editor.
-- Setelah itu buat satu user admin di Authentication > Users.
-- JANGAN memasukkan service_role key ke website.

create extension if not exists pgcrypto;

create table if not exists public.mosque_profile (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Masjid Digital',
  address text,
  contact text,
  email text,
  description text,
  updated_at timestamptz not null default now()
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  short_description text,
  description text,
  event_date date,
  event_time text,
  location text,
  contact text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cash_transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income','expense')),
  transaction_date date not null default current_date,
  amount numeric(14,2) not null check (amount >= 0),
  description text not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  published_at timestamptz not null default now(),
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.mosque_profile(name,description)
select 'Masjid Digital','Portal informasi jadwal shalat, program, transparansi kas, dan pengumuman masjid.'
where not exists (select 1 from public.mosque_profile);

alter table public.mosque_profile enable row level security;
alter table public.programs enable row level security;
alter table public.cash_transactions enable row level security;
alter table public.announcements enable row level security;

drop policy if exists "public read mosque profile" on public.mosque_profile;
create policy "public read mosque profile" on public.mosque_profile for select using (true);

drop policy if exists "public read published programs" on public.programs;
create policy "public read published programs" on public.programs for select using (is_published = true or auth.role() = 'authenticated');

drop policy if exists "admins manage programs" on public.programs;
create policy "admins manage programs" on public.programs for all to authenticated using (true) with check (true);

drop policy if exists "public read published cash" on public.cash_transactions;
create policy "public read published cash" on public.cash_transactions for select using (is_published = true or auth.role() = 'authenticated');

drop policy if exists "admins manage cash" on public.cash_transactions;
create policy "admins manage cash" on public.cash_transactions for all to authenticated using (true) with check (true);

drop policy if exists "public read published announcements" on public.announcements;
create policy "public read published announcements" on public.announcements for select using (is_published = true or auth.role() = 'authenticated');

drop policy if exists "admins manage announcements" on public.announcements;
create policy "admins manage announcements" on public.announcements for all to authenticated using (true) with check (true);

drop policy if exists "admins update profile" on public.mosque_profile;
create policy "admins update profile" on public.mosque_profile for update to authenticated using (true) with check (true);

-- Seed contoh:
insert into public.programs(title,category,short_description,description,event_date,event_time,location)
values
('Kajian Rutin','Kajian','Kajian rutin untuk jamaah umum.','Kajian rutin membahas tema keislaman dan kehidupan sehari-hari.','2026-09-13','19.30–21.00','Ruang utama masjid');

insert into public.cash_transactions(type,transaction_date,amount,description)
values
('income',current_date,1500000,'Infaq jamaah'),
('expense',current_date,350000,'Listrik dan air');

insert into public.announcements(title,content)
values ('Selamat datang di Portal Masjid','Informasi program, jadwal, dan transparansi kas akan diperbarui oleh pengurus secara berkala.');
