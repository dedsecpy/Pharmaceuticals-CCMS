import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ComplaintForm, { FormActions } from './components/ComplaintForm'
import CopilotPanel from './components/CopilotPanel'
import RiskAssessment from './components/RiskAssessment'
import { HexMark, Icon } from './components/Icon'
import { clearToast } from './store/chatSlice'
import { fetchComplaints } from './store/thunks'

export default function App() {
  const dispatch = useDispatch()
  const toast = useSelector((s) => s.chat.toast)
  const busy = useSelector((s) => s.chat.busy)
  const status = useSelector((s) => s.complaint.fields.status)
  const risk = useSelector((s) => s.complaint.risk)
  const insights = useSelector((s) => s.complaint.insights)
  const hasRisk = Boolean(
    risk.severity || risk.next_action || risk.rationale || insights.summary || insights.capa_recommendation,
  )
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark')

  useEffect(() => {
    dispatch(fetchComplaints())
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
      <div className="shell">
        <header className="chrome">
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
          <div className={`nprogress ${busy ? 'on' : ''}`} aria-hidden="true" />
        </header>

        <main className="workspace">
          <section className={`record ${busy ? 'syncing' : ''}`}>
            <div className="pane-head">
              <div>
                <h2>Log Customer Complaint</h2>
                <p>API & FDF Quality Assurance Module</p>
              </div>
            </div>
            <div className={`record-scroll ${hasRisk ? 'has-risk' : ''}`}>
              <ComplaintForm />
              <RiskAssessment />
            </div>
            <FormActions />
          </section>
          <CopilotPanel />
        </main>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}
