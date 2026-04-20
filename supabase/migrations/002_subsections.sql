-- Subsections: make the sections table self-referential.
-- A subsection is simply a section with parent_id != NULL.

ALTER TABLE sections ADD COLUMN IF NOT EXISTS parent_id uuid
  REFERENCES sections(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS sections_parent_id_idx ON sections(parent_id);

-- Slug uniqueness now depends on parent as well as branch.
ALTER TABLE sections DROP CONSTRAINT IF EXISTS sections_branch_id_slug_key;

CREATE UNIQUE INDEX IF NOT EXISTS sections_branch_parent_slug_unique
  ON sections(branch_id, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

-- Permissions cascade: if a user has permission on a section, treat that as permission
-- for all its descendants (so admins don't have to tick every subsection).
CREATE OR REPLACE FUNCTION has_section_access(section_uuid uuid) RETURNS boolean AS $$
  WITH RECURSIVE ancestors AS (
    SELECT id, parent_id FROM sections WHERE id = section_uuid
    UNION ALL
    SELECT s.id, s.parent_id FROM sections s
    JOIN ancestors a ON s.id = a.parent_id
  )
  SELECT is_super_admin() OR EXISTS (
    SELECT 1 FROM permissions
    WHERE user_id = auth.uid() AND section_id IN (SELECT id FROM ancestors)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
