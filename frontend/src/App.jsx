import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ComplaintForm, { FormActions } from './components/ComplaintForm'
import CopilotPanel from './components/CopilotPanel'
import RiskAssessment from './components/RiskAssessment'
import BootSplash from './components/BootSplash'
import { HexMark, Icon } from './components/Icon'
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
      setTimeout(resolve, 1200)
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

  useEffect(() => {
    if (!toast) return undefined
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
            <HexMark />
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
            <span className="chip">ICH Q7</span>
            <span className="chip">21 CFR 211.198</span>
            <span className="chip">EU GMP Ch. 8</span>
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

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}
