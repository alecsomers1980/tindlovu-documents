export type UserRole = 'super_admin' | 'user'

export type DocumentStatus = 'pending' | 'ready' | 'failed'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Branch {
  id: string
  name: string
  slug: string
  drive_folder_id: string | null
  created_at: string
}

export interface Section {
  id: string
  branch_id: string
  parent_id: string | null
  name: string
  slug: string
  drive_folder_id: string | null
  created_at: string
}

export interface Permission {
  id: string
  user_id: string
  branch_id: string
  section_id: string
  can_upload: boolean
  created_at: string
}

export interface Document {
  id: string
  branch_id: string
  section_id: string
  name: string
  original_filename: string
  drive_file_id: string | null
  mime_type: string | null
  size_bytes: number | null
  document_date: string
  uploaded_by: string | null
  uploaded_at: string
  status: DocumentStatus
  deleted_at: string | null
  deleted_by: string | null
}
