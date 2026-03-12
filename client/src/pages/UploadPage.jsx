import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import CyclingLoader from '../components/CyclingLoader'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const styles = {
  page: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '1rem',
  },
  card: {
    background: 'var(--card-bg, #e7e7e7)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    padding: '2rem',
    width: '100%',
    maxWidth: '600px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
  },
  heading: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 600,
    textAlign: 'center',
  },
  dropZone: (isDragging) => ({
    border: `2px dashed ${isDragging ? '#646cff' : 'rgba(255,255,255,0.3)'}`,
    borderRadius: '8px',
    padding: '2rem 1rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
    background: isDragging ? 'rgba(100,108,255,0.08)' : 'transparent',
    userSelect: 'none',
  }),
  dropText: {
    margin: '0 0 0.5rem',
    fontSize: '0.95rem',
    opacity: 0.7,
  },
  browseLabel: {
    color: '#646cff',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  preview: {
    width: '100%',
    maxHeight: '220px',
    objectFit: 'contain',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.12)',
  },
  fileName: {
    fontSize: '0.85rem',
    opacity: 0.6,
    textAlign: 'center',
    margin: 0,
  },
  analyzeBtn: (enabled) => ({
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '8px',
    border: 'none',
    cursor: enabled ? 'pointer' : 'not-allowed',
    background: enabled ? '#646cff' : '#444',
    color: enabled ? '#fff' : 'rgba(255,255,255,0.4)',
    transition: 'background 0.2s',
  }),
  error: {
    color: '#f87171',
    fontSize: '0.9rem',
    textAlign: 'center',
    margin: 0,
  },
  btnSpinner: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    animation: 'spin 0.7s linear infinite',
    marginRight: '0.5rem',
    verticalAlign: 'middle',
  },
}

export default function UploadPage() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const handleFile = useCallback((f) => {
    if (!f) return
    setFile(f)
    setError(null)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }, [])

  const onInputChange = (e) => {
    const f = e.target.files[0]
    if (f) handleFile(f)
  }

  const onDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => setIsDragging(false)

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const onZoneClick = () => inputRef.current?.click()

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append('image', file)
    try {
      const response = await axios.post('/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      navigate('/results', { state: { result: response.data, photoUrl: preview, file } })
    } catch {
      setError('Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={onSubmit}>
        <h1 style={styles.heading}>Bike Inspection</h1>
        <p style={{ ...styles.dropText, textAlign: 'center', margin: 0 }}>
          Drop your bike photo to get a full component diagnosis
        </p>

        <div
          style={styles.dropZone(isDragging)}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onZoneClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onZoneClick()}
          aria-label="Drop zone — click or drag a photo here"
        >
          <p style={styles.dropText}>Drag &amp; drop a photo here, or</p>
          <span style={styles.browseLabel}>browse files</span>
          <p style={{ ...styles.dropText, marginTop: '0.5rem', fontSize: '0.8rem' }}>
            JPEG, PNG, or WebP accepted
          </p>
        </div>

        {/* Hidden file input — accept attribute enforces allowed types in browser picker */}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={onInputChange}
        />

        {preview && (
          <>
            <img src={preview} alt="Selected bike preview" style={styles.preview} />
            <p style={styles.fileName}>{file.name}</p>
          </>
        )}

        {error && <p style={styles.error}>{error}</p>}

        {loading ? (
          <CyclingLoader />
        ) : (
          <button
            type="submit"
            disabled={!file}
            style={styles.analyzeBtn(!!file)}
          >
            Run Diagnosis
          </button>
        )}
      </form>
    </div>
  )
}
