-- Eliminar triggers existentes
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_profiles_updated on profiles;
drop trigger if exists handle_profiles_updated on profiles;

-- Eliminar políticas existentes
drop policy if exists "Perfiles públicos son visibles para todos" on profiles;
drop policy if exists "Los usuarios pueden insertar sus propios perfiles" on profiles;
drop policy if exists "Los usuarios pueden actualizar sus propios perfiles" on profiles;
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;

-- Eliminar tablas existentes
drop table if exists public.profiles cascade;

-- Eliminar funciones existentes
drop function if exists public.handle_new_user() cascade;
drop function if exists public.handle_updated_at() cascade;

-- Crear tabla de perfiles
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text,
    full_name text,
    date_of_birth date,
    avatar_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Habilitar RLS
alter table public.profiles enable row level security;

-- Crear políticas de seguridad
create policy "Perfiles públicos son visibles para todos"
    on profiles for select
    using ( true );

create policy "Los usuarios pueden insertar sus propios perfiles"
    on profiles for insert
    with check ( auth.uid() = id );

create policy "Los usuarios pueden actualizar sus propios perfiles"
    on profiles for update
    using ( auth.uid() = id );

-- Función para manejar la actualización de timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql security definer;

-- Trigger para actualizar el timestamp
create trigger on_profiles_updated
    before update on public.profiles
    for each row
    execute procedure public.handle_updated_at();

-- Función para crear perfil automáticamente al registrar usuario
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, full_name, date_of_birth)
    values (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        (new.raw_user_meta_data->>'date_of_birth')::date
    );
    return new;
end;
$$ language plpgsql security definer;

-- Trigger para nuevos usuarios
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Índices para mejor rendimiento
create index if not exists profiles_email_idx on profiles (email);
create index if not exists profiles_created_at_idx on profiles (created_at); 