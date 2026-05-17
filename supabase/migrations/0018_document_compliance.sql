-- Phase E.3: document compliance center.

create table if not exists public.document_requirement_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  name text not null,
  description text,
  applies_to_country text[],
  applies_to_employment_type text[],
  applies_to_role_pattern text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.document_requirements (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.document_requirement_templates(id) on delete cascade,
  doc_type text not null,
  display_name text not null,
  description text,
  is_required boolean default true,
  expiry_required boolean default false,
  expiry_warning_days int default 30,
  acceptable_formats text[] default array['pdf','jpg','png'],
  legal_basis text,
  knowledge_article_slug text
);

create table if not exists public.employee_document_status (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  doc_type text not null,
  status text not null check (status in ('missing','submitted','expired','expiring_soon','approved')),
  current_document_id uuid references public.employee_documents(id),
  last_checked_at timestamptz default now(),
  unique(employee_id, doc_type)
);

create table if not exists public.document_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  document_type text not null,
  document_version text not null,
  acknowledged_at timestamptz default now(),
  ip text,
  user_agent text,
  unique(employee_id, document_type, document_version)
);

create index if not exists idx_doc_req_templates_org
  on public.document_requirement_templates(org_id, is_active);
create index if not exists idx_doc_requirements_template
  on public.document_requirements(template_id);
create index if not exists idx_emp_doc_status_employee
  on public.employee_document_status(employee_id, status);
create index if not exists idx_emp_doc_status_status
  on public.employee_document_status(status);
create index if not exists idx_doc_ack_employee
  on public.document_acknowledgments(employee_id, document_type);

alter table public.document_requirement_templates enable row level security;
alter table public.document_requirements enable row level security;
alter table public.employee_document_status enable row level security;
alter table public.document_acknowledgments enable row level security;

create policy "View document templates by permission"
  on public.document_requirement_templates for select
  using (
    public.has_permission(org_id, 'all_hr')
    or public.has_permission(org_id, 'manage_documents')
    or public.has_permission(org_id, 'view_reports')
  );

create policy "Manage document templates by permission"
  on public.document_requirement_templates for all
  using (
    public.has_permission(org_id, 'all_hr')
    or public.has_permission(org_id, 'manage_documents')
  )
  with check (
    public.has_permission(org_id, 'all_hr')
    or public.has_permission(org_id, 'manage_documents')
  );

create policy "View document requirements by template permission"
  on public.document_requirements for select
  using (
    exists (
      select 1 from public.document_requirement_templates t
      where t.id = template_id
        and (
          public.has_permission(t.org_id, 'all_hr')
          or public.has_permission(t.org_id, 'manage_documents')
          or public.has_permission(t.org_id, 'view_reports')
        )
    )
  );

create policy "Manage document requirements by template permission"
  on public.document_requirements for all
  using (
    exists (
      select 1 from public.document_requirement_templates t
      where t.id = template_id
        and (
          public.has_permission(t.org_id, 'all_hr')
          or public.has_permission(t.org_id, 'manage_documents')
        )
    )
  )
  with check (
    exists (
      select 1 from public.document_requirement_templates t
      where t.id = template_id
        and (
          public.has_permission(t.org_id, 'all_hr')
          or public.has_permission(t.org_id, 'manage_documents')
        )
    )
  );

create policy "View document status by employee permission"
  on public.employee_document_status for select
  using (
    exists (
      select 1 from public.employees e
      where e.id = employee_id
        and (
          public.has_permission(e.org_id, 'all_hr')
          or public.has_permission(e.org_id, 'manage_documents')
          or public.has_permission(e.org_id, 'view_reports')
          or (
            public.has_permission(e.org_id, 'view_team')
            and public.manages_employee(e.id)
          )
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.email = e.email
          )
        )
    )
  );

create policy "View acknowledgments by employee permission"
  on public.document_acknowledgments for select
  using (
    exists (
      select 1 from public.employees e
      where e.id = employee_id
        and (
          public.has_permission(e.org_id, 'all_hr')
          or public.has_permission(e.org_id, 'manage_documents')
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.email = e.email
          )
        )
    )
  );

create policy "Employees can create own acknowledgments"
  on public.document_acknowledgments for insert
  with check (
    exists (
      select 1 from public.employees e
      join public.profiles p on p.email = e.email
      where e.id = employee_id
        and p.id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'employee-documents',
  'employee-documents',
  false,
  20971520,
  array['application/pdf','image/jpeg','image/jpg','image/png']
)
on conflict (id) do nothing;

create policy "View employee document files by HR permission"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'employee-documents'
    and exists (
      select 1
      from public.employees e
      where e.id::text = (string_to_array(name, '/'))[2]
        and (
          public.has_permission(e.org_id, 'all_hr')
          or public.has_permission(e.org_id, 'manage_documents')
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.email = e.email
          )
        )
    )
  );

create or replace function public.seed_document_requirements_for_org(_org_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  org_country text;
  template_id uuid;
begin
  select lower(coalesce(country, '')) into org_country
  from public.organisations
  where id = _org_id;

  if exists (
    select 1 from public.document_requirement_templates
    where org_id = _org_id
  ) then
    return;
  end if;

  if org_country like '%nigeria%' or org_country in ('ng', 'nga') then
    insert into public.document_requirement_templates (org_id, name, description, applies_to_country)
    values (_org_id, 'Standard Nigerian Employee', 'Default Nigeria employee compliance pack.', array['NG'])
    returning id into template_id;

    insert into public.document_requirements (template_id, doc_type, display_name, description, expiry_required, legal_basis, knowledge_article_slug) values
      (template_id, 'employment_contract', 'Signed employment contract', 'Signed contract or employment letter.', false, 'Core employment record and dispute evidence.', 'nigeria'),
      (template_id, 'government_id', 'Government-issued ID', 'National ID, passport, voter card, or driver licence.', false, 'Identity verification for HR records.', 'nigeria'),
      (template_id, 'tax_identification_number', 'Tax Identification Number (TIN)', 'Employee tax identification details for PAYE setup.', false, 'PAYE registration and payroll administration.', 'nigeria'),
      (template_id, 'bvn_verification', 'BVN verification document', 'Bank verification detail used for payroll bank validation.', false, 'Payroll identity and bank-account validation.', 'nigeria'),
      (template_id, 'bank_details', 'Bank account details form', 'Payroll bank account form or cancelled cheque/evidence.', false, 'Payroll setup requirement.', 'nigeria'),
      (template_id, 'pfa_details', 'Pension fund administrator details', 'PFA welcome letter, RSA PIN, or pension registration evidence.', false, 'PenCom RSA/PFA documentation for pension remittance.', 'nigeria'),
      (template_id, 'nhf_documentation', 'NHF number documentation', 'National Housing Fund number or applicable exemption note.', false, 'NHF payroll compliance where applicable.', 'nigeria'),
      (template_id, 'educational_certificates', 'Educational certificates', 'Role-relevant qualification certificates.', false, 'Credential validation for role requirements.', 'nigeria'),
      (template_id, 'reference_letters', 'Reference letters', 'Reference letters or completed reference checks.', false, 'Hiring due diligence record.', 'reference-checks-what-to-ask-what-to-avoid'),
      (template_id, 'medical_fitness_certificate', 'Medical fitness certificate', 'Medical fitness evidence where required by role.', false, 'Role-specific occupational fitness evidence.', 'nigeria'),
      (template_id, 'passport_photo', 'Passport photo', 'Passport photograph for HR records.', false, 'HR recordkeeping.', 'nigeria'),
      (template_id, 'next_of_kin', 'Next-of-kin form', 'Emergency contact and next-of-kin details.', false, 'Emergency contact record.', 'nigeria'),
      (template_id, 'code_of_conduct_ack', 'Code of conduct acknowledgment', 'Signed code of conduct acknowledgment.', true, 'Annual policy acknowledgment.', 'code-of-conduct-making-values-actionable'),
      (template_id, 'handbook_ack', 'Handbook acknowledgment', 'Signed employee handbook acknowledgment.', true, 'Annual handbook acknowledgment.', 'building-your-first-employee-handbook');

  elsif org_country like '%united states%' or org_country in ('us', 'usa') then
    insert into public.document_requirement_templates (org_id, name, description, applies_to_country)
    values (_org_id, 'Standard US Employee', 'Default US employee compliance pack.', array['US'])
    returning id into template_id;

    insert into public.document_requirements (template_id, doc_type, display_name, description, expiry_required, legal_basis, knowledge_article_slug) values
      (template_id, 'form_i9', 'Form I-9', 'Employment eligibility verification record.', false, 'USCIS Form I-9 for employment eligibility verification.', 'united-states'),
      (template_id, 'form_w4', 'Form W-4', 'Federal withholding certificate.', false, 'IRS federal income tax withholding setup.', 'united-states'),
      (template_id, 'state_tax_form', 'State tax withholding form', 'State-specific tax withholding form where applicable.', false, 'State payroll withholding administration.', 'united-states'),
      (template_id, 'direct_deposit', 'Direct deposit form', 'Payroll bank deposit authorization.', false, 'Payroll setup requirement.', 'united-states'),
      (template_id, 'handbook_ack', 'Handbook acknowledgment', 'Signed employee handbook acknowledgment.', true, 'Policy acknowledgment evidence.', 'building-your-first-employee-handbook');

  elsif org_country like '%united kingdom%' or org_country in ('uk', 'gb', 'gbr') then
    insert into public.document_requirement_templates (org_id, name, description, applies_to_country)
    values (_org_id, 'Standard UK Employee', 'Default UK employee compliance pack.', array['GB'])
    returning id into template_id;

    insert into public.document_requirements (template_id, doc_type, display_name, description, expiry_required, legal_basis, knowledge_article_slug) values
      (template_id, 'right_to_work', 'Right-to-work check', 'Right-to-work evidence or online check record.', true, 'UK employer right-to-work check and statutory excuse evidence.', 'united-kingdom'),
      (template_id, 'p45_or_starter_checklist', 'P45 or starter checklist', 'Previous employer P45 or HMRC starter checklist.', false, 'HMRC new-starter payroll information.', 'united-kingdom'),
      (template_id, 'national_insurance', 'National Insurance number', 'NI number evidence or employee declaration.', false, 'Payroll and tax administration.', 'united-kingdom'),
      (template_id, 'pension_details', 'Workplace pension details', 'Pension setup or opt-out evidence where applicable.', false, 'Workplace pension administration.', 'united-kingdom'),
      (template_id, 'handbook_ack', 'Handbook acknowledgment', 'Signed employee handbook acknowledgment.', true, 'Policy acknowledgment evidence.', 'building-your-first-employee-handbook');

  elsif org_country like '%india%' or org_country in ('in', 'ind') then
    insert into public.document_requirement_templates (org_id, name, description, applies_to_country)
    values (_org_id, 'Standard Indian Employee', 'Default India employee compliance pack.', array['IN'])
    returning id into template_id;

    insert into public.document_requirements (template_id, doc_type, display_name, description, expiry_required, legal_basis, knowledge_article_slug) values
      (template_id, 'pan_card', 'PAN card', 'Permanent Account Number evidence.', false, 'Income tax and payroll administration.', 'india'),
      (template_id, 'aadhaar', 'Aadhaar card', 'Aadhaar/KYC evidence where lawfully collected.', false, 'KYC and benefits administration where applicable.', 'india'),
      (template_id, 'epf_form_11', 'EPF Form 11 / UAN details', 'EPF self-declaration or UAN details.', false, 'EPFO onboarding and provident fund administration.', 'india'),
      (template_id, 'bank_details', 'Bank account details', 'Payroll bank account evidence.', false, 'Payroll setup requirement.', 'india'),
      (template_id, 'form_16_previous', 'Previous employer Form 16', 'Previous employer Form 16 where available.', false, 'Tax/TDS continuity and employee income documentation.', 'india'),
      (template_id, 'handbook_ack', 'Handbook acknowledgment', 'Signed employee handbook acknowledgment.', true, 'Policy acknowledgment evidence.', 'building-your-first-employee-handbook');
  else
    insert into public.document_requirement_templates (org_id, name, description)
    values (_org_id, 'Standard Employee', 'Default employee recordkeeping pack.')
    returning id into template_id;

    insert into public.document_requirements (template_id, doc_type, display_name, description, expiry_required, legal_basis, knowledge_article_slug) values
      (template_id, 'employment_contract', 'Signed employment contract', 'Signed contract or employment letter.', false, 'Core employment record and dispute evidence.', 'employment-contract-permanent'),
      (template_id, 'government_id', 'Government-issued ID', 'Identity document for employee records.', false, 'Identity verification for HR records.', null),
      (template_id, 'bank_details', 'Bank account details form', 'Payroll bank account details.', false, 'Payroll setup requirement.', null),
      (template_id, 'emergency_contact', 'Emergency contact form', 'Emergency contact details.', false, 'Health and safety recordkeeping.', null),
      (template_id, 'handbook_ack', 'Handbook acknowledgment', 'Signed employee handbook acknowledgment.', true, 'Policy acknowledgment evidence.', 'building-your-first-employee-handbook');
  end if;
end $$;

create or replace function public.seed_document_requirements_on_org_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.seed_document_requirements_for_org(new.id);
  return new;
end $$;

drop trigger if exists trg_seed_document_requirements_on_org_insert on public.organisations;
create trigger trg_seed_document_requirements_on_org_insert
  after insert on public.organisations
  for each row execute function public.seed_document_requirements_on_org_insert();

select public.seed_document_requirements_for_org(id)
from public.organisations;
