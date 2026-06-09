create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

create table public.user_food_list_items (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	list_type text not null check (list_type in ('fridge', 'shopping')),
	fdc_id bigint not null,
	food jsonb not null check (jsonb_typeof(food) = 'object'),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (user_id, list_type, fdc_id)
);

create table public.custom_foods (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	fdc_id bigint not null,
	food jsonb not null check (jsonb_typeof(food) = 'object'),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (user_id, fdc_id)
);

create table public.saved_drinks (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	name text not null check (length(trim(name)) > 0),
	drink jsonb not null check (jsonb_typeof(drink) = 'object'),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.mix_preferences (
	user_id uuid primary key references auth.users(id) on delete cascade,
	nutrient_goals jsonb not null default '{}'::jsonb check (jsonb_typeof(nutrient_goals) = 'object'),
	mix_state jsonb not null default '{}'::jsonb check (jsonb_typeof(mix_state) = 'object'),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index user_food_list_items_user_list_idx
	on public.user_food_list_items (user_id, list_type);

create index custom_foods_user_created_idx
	on public.custom_foods (user_id, created_at desc);

create index saved_drinks_user_created_idx
	on public.saved_drinks (user_id, created_at desc);

create trigger set_user_food_list_items_updated_at
	before update on public.user_food_list_items
	for each row execute function public.set_updated_at();

create trigger set_custom_foods_updated_at
	before update on public.custom_foods
	for each row execute function public.set_updated_at();

create trigger set_saved_drinks_updated_at
	before update on public.saved_drinks
	for each row execute function public.set_updated_at();

create trigger set_mix_preferences_updated_at
	before update on public.mix_preferences
	for each row execute function public.set_updated_at();

alter table public.user_food_list_items enable row level security;
alter table public.custom_foods enable row level security;
alter table public.saved_drinks enable row level security;
alter table public.mix_preferences enable row level security;

create policy "Users can read their food list items"
	on public.user_food_list_items
	for select
	to authenticated
	using (user_id = (select auth.uid()));

create policy "Users can create their food list items"
	on public.user_food_list_items
	for insert
	to authenticated
	with check (user_id = (select auth.uid()));

create policy "Users can update their food list items"
	on public.user_food_list_items
	for update
	to authenticated
	using (user_id = (select auth.uid()))
	with check (user_id = (select auth.uid()));

create policy "Users can delete their food list items"
	on public.user_food_list_items
	for delete
	to authenticated
	using (user_id = (select auth.uid()));

create policy "Users can read their custom foods"
	on public.custom_foods
	for select
	to authenticated
	using (user_id = (select auth.uid()));

create policy "Users can create their custom foods"
	on public.custom_foods
	for insert
	to authenticated
	with check (user_id = (select auth.uid()));

create policy "Users can update their custom foods"
	on public.custom_foods
	for update
	to authenticated
	using (user_id = (select auth.uid()))
	with check (user_id = (select auth.uid()));

create policy "Users can delete their custom foods"
	on public.custom_foods
	for delete
	to authenticated
	using (user_id = (select auth.uid()));

create policy "Users can read their saved drinks"
	on public.saved_drinks
	for select
	to authenticated
	using (user_id = (select auth.uid()));

create policy "Users can create their saved drinks"
	on public.saved_drinks
	for insert
	to authenticated
	with check (user_id = (select auth.uid()));

create policy "Users can update their saved drinks"
	on public.saved_drinks
	for update
	to authenticated
	using (user_id = (select auth.uid()))
	with check (user_id = (select auth.uid()));

create policy "Users can delete their saved drinks"
	on public.saved_drinks
	for delete
	to authenticated
	using (user_id = (select auth.uid()));

create policy "Users can read their mix preferences"
	on public.mix_preferences
	for select
	to authenticated
	using (user_id = (select auth.uid()));

create policy "Users can create their mix preferences"
	on public.mix_preferences
	for insert
	to authenticated
	with check (user_id = (select auth.uid()));

create policy "Users can update their mix preferences"
	on public.mix_preferences
	for update
	to authenticated
	using (user_id = (select auth.uid()))
	with check (user_id = (select auth.uid()));

create policy "Users can delete their mix preferences"
	on public.mix_preferences
	for delete
	to authenticated
	using (user_id = (select auth.uid()));
