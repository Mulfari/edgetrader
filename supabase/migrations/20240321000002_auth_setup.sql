-- Eliminar triggers existentes
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_profile_updated on profiles;
drop trigger if exists handle_updated_at on profiles;
drop trigger if exists on_failed_login on auth.users;

-- Eliminar funciones existentes
drop function if exists public.handle_new_user() cascade;
drop function if exists public.handle_updated_at() cascade;
drop function if exists public.handle_failed_login() cascade;
drop function if exists public.get_current_profile() cascade;
drop function if exists public.check_email_exists() cascade;

-- Eliminar todas las políticas existentes
drop policy if exists "Los perfiles son visibles para usuarios autenticados" on profiles;
drop policy if exists "Los usuarios pueden actualizar su propio perfil" on profiles;
drop policy if exists "Usuarios pueden ver sus propios perfiles" on profiles;
drop policy if exists "Usuarios pueden crear sus propios perfiles" on profiles;
drop policy if exists "Usuarios pueden actualizar sus propios perfiles" on profiles;
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;
drop policy if exists "Enable read access for all users" on profiles;
drop policy if exists "Enable insert for authenticated users" on profiles;
drop policy if exists "Enable update for users based on email" on profiles;
drop policy if exists "Permitir verificación de email durante registro" on profiles;

-- Eliminar tipos existentes
drop type if exists user_role cascade;

-- Crear tipo enum para roles
create type user_role as enum ('limited', 'pro', 'admin');

-- Eliminar y recrear la tabla
drop table if exists public.profiles cascade;

-- Crear la tabla de perfiles
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique,
    full_name text,
    avatar_url text,
    phone_number text,
    country text,
    language text default 'es',
    timezone text default 'America/Santiago',
    role user_role default 'limited',
    role_updated_at timestamptz,
    role_updated_by uuid references auth.users(id),
    is_email_verified boolean default false,
    is_phone_verified boolean default false,
    last_sign_in timestamptz,
    failed_login_attempts int default 0,
    last_failed_login timestamptz,
    registration_ip text,
    registration_user_agent text,
    registration_timestamp timestamptz,
    account_locked boolean default false,
    lock_reason text,
    lock_timestamp timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    constraint valid_email check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Habilitar RLS
alter table public.profiles enable row level security;

-- Crear políticas de seguridad básicas
create policy "Los perfiles son visibles para usuarios autenticados"
    on profiles for select
    using (auth.role() = 'authenticated');

create policy "Permitir verificación de email durante registro"
    on profiles for select
    to anon
    using (true);

create policy "Los usuarios pueden actualizar su propio perfil"
    on profiles for update
    using (
        auth.uid() = id and (
            -- Permitir actualización si no se está cambiando el rol
            (role = (select role from profiles where id = auth.uid())) or
            -- O si el usuario es admin
            exists (
                select 1 from profiles
                where id = auth.uid() and role = 'admin'
            )
        )
    );

create policy "Los usuarios pueden insertar su propio perfil"
    on profiles for insert
    with check (auth.uid() = id);

-- Otorgar permisos básicos a la tabla profiles
grant usage on schema public to anon, authenticated;
grant select on table profiles to anon, authenticated;
grant insert, update on table profiles to authenticated;

-- Crear función para manejar actualizaciones de timestamp
create function public.handle_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- Crear trigger para timestamp de actualización
create trigger on_profile_updated
    before update on public.profiles
    for each row execute function public.handle_updated_at();

-- Crear función para manejar nuevos usuarios
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
    existing_email_count integer;
begin
    -- Verificar si el email ya existe
    select count(*)
    into existing_email_count
    from public.profiles
    where email = new.email
    and id != new.id;

    if existing_email_count > 0 then
        raise exception 'El correo electrónico % ya está registrado', new.email;
    end if;

    insert into public.profiles (
        id,
        email,
        full_name,
        role,
        is_email_verified,
        last_sign_in,
        registration_ip,
        registration_user_agent,
        registration_timestamp,
        created_at,
        updated_at
    )
    values (
        new.id,
        new.email,
        coalesce(
            new.raw_user_meta_data->>'full_name',
            split_part(new.email, '@', 1)
        ),
        'limited',
        new.email_confirmed_at is not null,
        new.last_sign_in_at,
        new.raw_user_meta_data->>'registration_ip',
        new.raw_user_meta_data->>'registration_user_agent',
        (new.raw_user_meta_data->>'registration_timestamp')::timestamptz,
        new.created_at,
        new.updated_at
    )
    on conflict (id) do update
    set
        email = excluded.email,
        full_name = excluded.full_name,
        is_email_verified = excluded.is_email_verified,
        last_sign_in = excluded.last_sign_in,
        updated_at = now();

    return new;
end;
$$;

-- Crear trigger para nuevos usuarios
create trigger on_auth_user_created
    after insert or update on auth.users
    for each row execute function public.handle_new_user();

-- Crear función para obtener el perfil actual
create function public.get_current_profile()
returns jsonb
language plpgsql
security definer
as $$
declare
    profile_data jsonb;
begin
    select 
        jsonb_build_object(
            'id', id,
            'email', email,
            'full_name', full_name,
            'avatar_url', avatar_url,
            'phone_number', phone_number,
            'country', country,
            'language', language,
            'timezone', timezone,
            'role', role,
            'is_email_verified', is_email_verified,
            'is_phone_verified', is_phone_verified,
            'last_sign_in', last_sign_in,
            'failed_login_attempts', failed_login_attempts,
            'last_failed_login', last_failed_login,
            'registration_timestamp', registration_timestamp,
            'account_locked', account_locked,
            'created_at', created_at,
            'updated_at', updated_at
        )
    into profile_data
    from public.profiles
    where id = auth.uid();

    return profile_data;
end;
$$;

-- Crear función para actualizar el rol de un usuario
create function public.update_user_role(
    target_user_id uuid,
    new_role user_role
)
returns boolean
language plpgsql
security definer
as $$
declare
    current_user_role user_role;
begin
    -- Verificar si el usuario actual es admin
    select role into current_user_role
    from public.profiles
    where id = auth.uid();

    if current_user_role != 'admin' then
        raise exception 'Solo los administradores pueden cambiar roles';
        return false;
    end if;

    -- Actualizar el rol del usuario objetivo
    update public.profiles
    set
        role = new_role,
        role_updated_at = now(),
        role_updated_by = auth.uid()
    where id = target_user_id;

    return true;
end;
$$;

-- Crear función para manejar intentos fallidos de inicio de sesión
create function public.handle_failed_login()
returns trigger
language plpgsql
security definer
as $$
begin
    update public.profiles
    set 
        failed_login_attempts = failed_login_attempts + 1,
        last_failed_login = now(),
        account_locked = case 
            when failed_login_attempts >= 5 then true 
            else account_locked 
        end,
        lock_reason = case 
            when failed_login_attempts >= 5 then 'Demasiados intentos fallidos de inicio de sesión'
            else lock_reason
        end,
        lock_timestamp = case 
            when failed_login_attempts >= 5 then now()
            else lock_timestamp
        end
    where id = new.id;
    return new;
end;
$$;

-- Crear trigger para intentos fallidos de inicio de sesión
create trigger on_failed_login
    after update of last_sign_in_at on auth.users
    for each row
    when (new.last_sign_in_at is null)
    execute function public.handle_failed_login();

-- Función para resetear los intentos fallidos de inicio de sesión
create or replace function public.reset_failed_login_attempts(user_email text)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set failed_login_attempts = 0,
      last_failed_login = null
  where email = user_email;
end;
$$;

-- Función para incrementar los intentos fallidos de inicio de sesión
create or replace function public.increment_failed_login_attempts(user_email text)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set failed_login_attempts = coalesce(failed_login_attempts, 0) + 1,
      last_failed_login = now()
  where email = user_email;
end;
$$;

-- Permisos para las funciones de intentos fallidos
grant execute on function public.reset_failed_login_attempts(text) to authenticated, anon;
grant execute on function public.increment_failed_login_attempts(text) to authenticated, anon;

-- Crear función para verificar si un email ya existe
create or replace function public.check_email_exists(email text)
returns boolean
language plpgsql
security definer
as $$
begin
    return exists (
        select 1 
        from auth.users 
        where auth.users.email = check_email_exists.email
    );
end;
$$;

-- Otorgar permisos para la función de verificación de email
grant execute on function public.check_email_exists(text) to anon, authenticated;

-- Crear trigger para evitar emails duplicados en auth.users
create or replace function public.prevent_duplicate_emails()
returns trigger
language plpgsql
security definer
as $$
begin
    if exists (
        select 1 
        from auth.users 
        where email = new.email 
        and id != new.id
    ) then
        raise exception 'El correo electrónico % ya está registrado', new.email;
    end if;
    return new;
end;
$$;

-- Crear el trigger en auth.users
drop trigger if exists prevent_duplicate_emails_trigger on auth.users;
create trigger prevent_duplicate_emails_trigger
    before insert or update on auth.users
    for each row
    execute function public.prevent_duplicate_emails();

-- Crear tabla para registrar intentos de inicio de sesión
create table if not exists public.login_logs (
    id uuid default gen_random_uuid() primary key,
    email text not null,
    success boolean not null,
    ip_address text,
    user_agent text,
    created_at timestamptz default now(),
    constraint valid_email check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Habilitar RLS para login_logs
alter table public.login_logs enable row level security;

-- Crear política para permitir inserciones desde funciones
create policy "Permitir inserciones desde funciones"
    on login_logs for insert
    with check (true);

-- Crear política para permitir lectura a administradores
create policy "Solo administradores pueden leer logs"
    on login_logs for select
    using (
        exists (
            select 1 from profiles
            where id = auth.uid()
            and role = 'admin'
        )
    );

-- Otorgar permisos básicos a la tabla login_logs
grant usage on schema public to anon, authenticated;
grant insert on table login_logs to anon, authenticated;
grant select on table login_logs to authenticated;

-- Función para registrar intentos de inicio de sesión
create or replace function public.log_login_attempt(
    p_email text,
    p_success boolean,
    p_ip_address text default null,
    p_user_agent text default null
)
returns void
language plpgsql
security definer
as $$
begin
    insert into public.login_logs (
        email,
        success,
        ip_address,
        user_agent
    ) values (
        p_email,
        p_success,
        p_ip_address,
        p_user_agent
    );
end;
$$;

-- Otorgar permisos para ejecutar la función
grant execute on function public.log_login_attempt to anon, authenticated; 