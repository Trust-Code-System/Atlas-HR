-- Add linkedin_url to job_applications (candidates provide during application)
alter table public.job_applications
  add column if not exists linkedin_url text;

-- Add linkedin_url to employees (staff can add to their profile)
alter table public.employees
  add column if not exists linkedin_url text;
