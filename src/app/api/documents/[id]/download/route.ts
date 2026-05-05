import { createClient } from '@/lib/supabase/server'
import { getDriveClient } from '@/lib/drive/client'
import type { Readable } from 'node:stream'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: doc } = await supabase
    .from('documents')
    .select('id, branch_id, section_id, drive_file_id, original_filename, mime_type, deleted_at, status')
    .eq('id', id)
    .single()
  if (!doc) return new Response('Not found', { status: 404 })
  if (doc.deleted_at) return new Response('Not found', { status: 404 })
  if (doc.status !== 'ready' || !doc.drive_file_id)
    return new Response('Document not ready', { status: 409 })

  const drive = getDriveClient()
  const driveRes = await drive.files.get(
    { fileId: doc.drive_file_id, alt: 'media' },
    { responseType: 'stream' },
  )

  const nodeStream = driveRes.data as Readable
  const webStream = new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk: Buffer) => controller.enqueue(chunk))
      nodeStream.on('end', () => controller.close())
      nodeStream.on('error', (err) => controller.error(err))
    },
    cancel() {
      nodeStream.destroy()
    },
  })

  const filename = doc.original_filename.replace(/"/g, '')
  return new Response(webStream, {
    headers: {
      'Content-Type': doc.mime_type || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
