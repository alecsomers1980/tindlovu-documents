'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, FileText, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SearchResult {
  id: string
  name: string
  original_filename: string
  document_date: string
  uploaded_at: string
  size_bytes: number | null
  mime_type: string | null
  uploader_name: string
  branch_name: string
  section_name: string
  section_path: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setResults([]); setLoading(false); return }

      const baseUrl = window.location.origin
      const url = new URL('/api/search', baseUrl)
      url.searchParams.set('q', q.trim())
      const res = await fetch(url.toString())
      if (!res.ok) { setResults([]); setLoading(false); return }

      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    setSelectedIndex(-1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(query), 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, runSearch])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      const result = results[selectedIndex]
      if (result) {
        setOpen(false)
        setQuery('')
        const downloadUrl = `/api/documents/${result.id}/download`
        const path = result.section_path || '/dashboard'
        router.push(path)
        // Open download in new tab after navigation
        setTimeout(() => window.open(downloadUrl, '_blank'), 500)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search documents by name, date, or uploader..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { if (query) setOpen(true) }}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); inputRef.current?.focus() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (query || results.length > 0) && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-200 max-h-96 overflow-y-auto z-50">
          {loading && (
            <div className="flex items-center gap-2 px-4 py-6 justify-center text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-slate-400">
              No documents found for &ldquo;{query}&rdquo;
            </div>
          )}
          {!loading && results.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-medium text-slate-500 bg-slate-50 border-b border-slate-100">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              {results.map((result, idx) => (
                <button
                  key={result.id}
                  type="button"
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 flex items-start gap-3 hover:bg-slate-50 transition-colors ${
                    idx === selectedIndex ? 'bg-amber-50' : ''
                  }`}
                  onClick={() => {
                    setOpen(false)
                    setQuery('')
                    const downloadUrl = `/api/documents/${result.id}/download`
                    router.push(result.section_path || '/dashboard')
                    setTimeout(() => window.open(downloadUrl, '_blank'), 500)
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <FileText className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {result.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {result.branch_name} / {result.section_name}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span>{result.document_date}</span>
                      {result.size_bytes && (
                        <span>{formatBytes(result.size_bytes)}</span>
                      )}
                      <span>by {result.uploader_name}</span>
                      <span className="text-amber-600">
                        {formatDateTime(result.uploaded_at)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
