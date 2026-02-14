-- Create admin_client_overview view for analytics
create or replace view admin_client_overview as
select 
  c.id,
  c.client_name,
  c.created_at,
  count(cmp.id) as total_campaigns
from clients c
left join campaigns cmp on c.id = cmp.client_id
group by c.id, c.client_name, c.created_at;

-- Grant access to service role and admin users (if applicable)
-- Assuming authenticated users with admin role can access this via direct query if RLS allows, 
-- or via service role API.
