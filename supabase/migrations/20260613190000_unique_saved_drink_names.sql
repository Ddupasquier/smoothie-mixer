create unique index saved_drinks_user_name_unique_idx
	on public.saved_drinks (user_id, lower(btrim(name)));
