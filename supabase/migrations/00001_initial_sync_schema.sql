create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_owner_all" on profiles for all
  using (id = auth.uid()) with check (id = auth.uid());

create table exercises (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  is_custom boolean not null default false,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_exercises_user_id on exercises(user_id);
create index idx_exercises_updated_at on exercises(user_id, updated_at);

alter table exercises enable row level security;

create policy "exercises_owner_all" on exercises for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table entries (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  sets jsonb not null default '[]',
  notes text,
  performed_at date not null,
  estimated_1rm_kg numeric,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_entries_user_id on entries(user_id);
create index idx_entries_exercise_id on entries(user_id, exercise_id);
create index idx_entries_updated_at on entries(user_id, updated_at);

alter table entries enable row level security;

create policy "entries_owner_all" on entries for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table settings (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary_unit text not null default 'kg',
  age_bracket text not null default 'young',
  barbell_weight_kg numeric not null default 20,
  has_completed_onboarding boolean not null default false,
  updated_at timestamptz not null default now()
);

create index idx_settings_user_id on settings(user_id);

alter table settings enable row level security;

create policy "settings_owner_all" on settings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on profiles for each row execute procedure update_updated_at();
create trigger update_exercises_updated_at before update on exercises for each row execute procedure update_updated_at();
create trigger update_entries_updated_at before update on entries for each row execute procedure update_updated_at();
create trigger update_settings_updated_at before update on settings for each row execute procedure update_updated_at();
