import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ComplaintForm, { FormActions } from './components/ComplaintForm'
import CopilotPanel from './components/CopilotPanel'
import RiskAssessment from './components/RiskAssessment'
import BootSplash from './components/BootSplash'
import logo from './assets/aivoa-logo.png'
import { Icon } from './components/Icon'
import { clearToast } from './store/chatSlice'
import { fetchComplaints } from './store/thunks'
import useLiveFill from './hooks/useLiveFill'

export default function App() {
  const dispatch = useDispatch()
  useLiveFill()
  const toast = useSelector((s) => s.chat.toast)
  const busy = useSelector((s) => s.chat.busy)
  const filling = useSelector((s) => s.complaint.filling)
  const working = busy || filling
  const status = useSelector((s) => s.complaint.fields.status)
  const risk = useSelector((s) => s.complaint.risk)
  const insights = useSelector((s) => s.complaint.insights)
  const hasRisk = Boolean(
    risk.severity || risk.next_action || risk.rationale || insights.summary || insights.capa_recommendation,
  )
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark')
  const [bootPhase, setBootPhase] = useState('loading')

  useEffect(() => {
    let cancelled = false
    const minDelay = new Promise((resolve) => {
      setTimeout(resolve, 2500)
    })

    Promise.all([dispatch(fetchComplaints()).unwrap().catch(() => {}), minDelay]).then(() => {
      if (cancelled) return
      setBootPhase('exit')
      window.setTimeout(() => {
        if (!cancelled) setBootPhase('done')
      }, 460)
    })

    return () => {
      cancelled = true
    }
  }, [dispatch])

  const [showSuccess, setShowSuccess] = useState(false)
  const [successText, setSuccessText] = useState('')

  useEffect(() => {
    if (!toast) return undefined
    if (toast.startsWith('Submitted')) {
      setSuccessText(toast)
      setShowSuccess(true)
      const t = setTimeout(() => {
        setShowSuccess(false)
        dispatch(clearToast())
      }, 3400)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => dispatch(clearToast()), 3200)
    return () => clearTimeout(t)
  }, [toast, dispatch])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.dataset.theme = next ? 'dark' : 'light'
  }

  return (
    <div className="app">
      {bootPhase !== 'done' ? <BootSplash exiting={bootPhase === 'exit'} /> : null}

      <div className={`shell ${bootPhase === 'done' ? 'shell-ready' : 'shell-boot'}`}>
        <header className="chrome chrome-enter">
          <div className="brand">
            <img className="app-logo" src={logo} alt="AIVOA QMS" />
            <div>
              <h1>AIVOA QMS</h1>
              <p>Customer Complaint Module</p>
            </div>
          </div>
          <div className="chrome-meta">
            <div className={`status-pill ${status === 'Logged' ? 'logged' : ''}`}>
              <span className="dot" />
              {status || 'Pending Triage'}
            </div>
            <button className="theme-btn" type="button" onClick={toggleTheme} aria-label="Toggle theme">
              <Icon name={dark ? 'moon' : 'sun'} size={16} />
            </button>
          </div>
          <div className={`nprogress ${working ? 'on' : ''}`} aria-hidden="true" />
        </header>

        <main className="workspace">
          <section className={`record record-enter ${working ? 'syncing' : ''}`}>
            <div className={`record-scroll ${filling ? 'can-scroll' : ''} ${hasRisk ? 'has-risk' : ''}`}>
              <ComplaintForm />
              <RiskAssessment />
            </div>
            <FormActions />
          </section>
          <CopilotPanel className="copilot-enter" />
        </main>
      </div>

      {showSuccess ? (
        <div className="success-overlay" aria-live="polite">
          <div className="success-card">
            <div className="success-ring">
              <svg viewBox="0 0 52 52" className="success-check">
                <circle cx="26" cy="26" r="24" fill="none" stroke="#22c55e" strokeWidth="2.5" className="success-circle" />
                <path d="M15 27l6 6 16-16" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="success-tick" />
              </svg>
            </div>
            <h2>Complaint Submitted!</h2>
            <p>{successText.replace('Submitted ', '')}</p>
            <span className="success-sub">Logged to QMS register</span>
          </div>
          {Array.from({ length: 20 }).map((_, i) => (
            <span
              key={i}
              className="confetti"
              style={{
                '--x': `${Math.random() * 100}vw`,
                '--d': `${600 + Math.random() * 1800}ms`,
                '--r': `${Math.random() * 360}deg`,
                '--s': `${0.5 + Math.random() * 0.6}`,
                left: `${Math.random() * 100}%`,
                background: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'][i % 5],
              }}
              aria-hidden="true"
            />
          ))}
        </div>
      ) : toast ? (
        <div className="toast">{toast}</div>
      ) : null}
    </div>
  )
}
