-- Tindlovu Documents — initial schema
-- Financial document management with branch/section-scoped access control

-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Tables
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'user')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  drive_folder_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  drive_folder_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(branch_id, slug)
);

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  can_upload boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, branch_id, section_id)
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  name text NOT NULL,
  original_filename text NOT NULL,
  drive_file_id text,
  mime_type text,
  size_bytes bigint,
  document_date date NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'failed')),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS documents_section_deleted_date_idx ON documents(section_id, deleted_at, document_date DESC);
CREATE INDEX IF NOT EXISTS documents_branch_deleted_idx ON documents(branch_id, deleted_at);
CREATE INDEX IF NOT EXISTS documents_name_trgm_idx ON documents USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS documents_deleted_at_partial_idx ON documents(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS documents_document_date_idx ON documents(document_date);

-- Helper functions
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION has_section_access(section_uuid uuid) RETURNS boolean AS $$
  SELECT is_super_admin() OR EXISTS (
    SELECT 1 FROM permissions
    WHERE user_id = auth.uid() AND section_id = section_uuid
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS trigger AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
  BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'user')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
  END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT INSERT, SELECT, UPDATE ON public.profiles TO supabase_auth_admin;

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS: profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id OR is_super_admin());

DROP POLICY IF EXISTS "Super admins can insert profiles" ON profiles;
CREATE POLICY "Super admins can insert profiles" ON profiles FOR INSERT WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admins can update profiles" ON profiles;
CREATE POLICY "Super admins can update profiles" ON profiles FOR UPDATE USING (is_super_admin()) WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;
CREATE POLICY "Super admins can delete profiles" ON profiles FOR DELETE USING (is_super_admin());

-- RLS: branches
DROP POLICY IF EXISTS "Authenticated users can select branches" ON branches;
CREATE POLICY "Authenticated users can select branches" ON branches FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Super admins can insert branches" ON branches;
CREATE POLICY "Super admins can insert branches" ON branches FOR INSERT WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admins can update branches" ON branches;
CREATE POLICY "Super admins can update branches" ON branches FOR UPDATE USING (is_super_admin()) WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admins can delete branches" ON branches;
CREATE POLICY "Super admins can delete branches" ON branches FOR DELETE USING (is_super_admin());

-- RLS: sections
DROP POLICY IF EXISTS "Users can select permitted sections" ON sections;
CREATE POLICY "Users can select permitted sections" ON sections FOR SELECT USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM permissions
    WHERE permissions.branch_id = sections.branch_id
    AND permissions.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Super admins can insert sections" ON sections;
CREATE POLICY "Super admins can insert sections" ON sections FOR INSERT WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admins can update sections" ON sections;
CREATE POLICY "Super admins can update sections" ON sections FOR UPDATE USING (is_super_admin()) WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admins can delete sections" ON sections;
CREATE POLICY "Super admins can delete sections" ON sections FOR DELETE USING (is_super_admin());

-- RLS: permissions
DROP POLICY IF EXISTS "Users can select own permissions" ON permissions;
CREATE POLICY "Users can select own permissions" ON permissions FOR SELECT USING (auth.uid() = user_id OR is_super_admin());

DROP POLICY IF EXISTS "Super admins can insert permissions" ON permissions;
CREATE POLICY "Super admins can insert permissions" ON permissions FOR INSERT WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admins can update permissions" ON permissions;
CREATE POLICY "Super admins can update permissions" ON permissions FOR UPDATE USING (is_super_admin()) WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admins can delete permissions" ON permissions;
CREATE POLICY "Super admins can delete permissions" ON permissions FOR DELETE USING (is_super_admin());

-- RLS: documents
DROP POLICY IF EXISTS "Users can select live documents" ON documents;
CREATE POLICY "Users can select live documents" ON documents FOR SELECT USING (
  (has_section_access(section_id) AND deleted_at IS NULL) OR is_super_admin()
);

DROP POLICY IF EXISTS "Users can insert documents" ON documents;
CREATE POLICY "Users can insert documents" ON documents FOR INSERT WITH CHECK (
  is_super_admin() OR (
    has_section_access(section_id) AND EXISTS (
      SELECT 1 FROM permissions
      WHERE permissions.user_id = auth.uid()
      AND permissions.section_id = documents.section_id
      AND permissions.can_upload = true
    )
  )
);

DROP POLICY IF EXISTS "Users can update documents" ON documents;
CREATE POLICY "Users can update documents" ON documents FOR UPDATE USING (
  is_super_admin() OR has_section_access(section_id)
) WITH CHECK (
  is_super_admin() OR has_section_access(section_id)
);

DROP POLICY IF EXISTS "Super admins can delete documents" ON documents;
CREATE POLICY "Super admins can delete documents" ON documents FOR DELETE USING (is_super_admin());

-- Recycle bin view
CREATE OR REPLACE VIEW recycle_bin_documents AS
  SELECT * FROM documents WHERE deleted_at IS NOT NULL;
