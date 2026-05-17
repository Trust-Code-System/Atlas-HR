-- Add source tracking to job applications
alter table job_applications
  add column if not exists source text check (
    source is null or source in (
      'linkedin', 'indeed', 'referral', 'careers_page',
      'glassdoor', 'agency', 'direct', 'other'
    )
  );
