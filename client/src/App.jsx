import { BrowserRouter, Routes, Route } from 'react-router-dom'
import UploadPage from './pages/UploadPage.jsx'
import ResultsPage from './pages/ResultsPage.jsx'

function NotFound() {
  return <h1>Page not found</h1>
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '4px',
        background: 'linear-gradient(90deg, var(--priority-5) 0%, var(--condition-good) 100%)',
        zIndex: 9999,
      }} />
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
