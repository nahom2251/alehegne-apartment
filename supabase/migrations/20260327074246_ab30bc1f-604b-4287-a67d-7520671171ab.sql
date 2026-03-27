CREATE OR REPLACE FUNCTION public.get_available_apartments()
RETURNS TABLE(id uuid, label text, tenant_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT a.id, a.label, a.tenant_name
  FROM apartments a
  WHERE a.is_occupied = true AND a.tenant_user_id IS NULL
  ORDER BY a.floor, a.position;
$$;