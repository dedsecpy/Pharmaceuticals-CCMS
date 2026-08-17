import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ComplaintForm from './components/ComplaintForm'
import CopilotPanel from './components/CopilotPanel'
import RiskAssessment from './components/RiskAssessment'
import { clearToast } from './store/chatSlice'
import { fetchComplaints } from './store/thunks'

export default function App() {
  const dispatch = useDispatch()
  const toast = useSelector((s) => s.chat.toast)
  const saved = useSelector((s) => s.complaint.savedNumber)
  const status = useSelector((s) => s.complaint.fields.status)

  useEffect(() => {
    dispatch(fetchComplaints())
  }, [dispatch])

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => dispatch(clearToast()), 3200)
    return () => clearTimeout(t)
  }, [toast, dispatch])

  return (
    <div className="app">
      <header className="chrome">
        <div className="brand">
          <div className="mark">A</div>
          <div>
            <h1>AIVOA QMS</h1>
            <p>Customer complaint module · API & FDF</p>
          </div>
        </div>
        <div className="chrome-meta">
          <span className="chip">{saved || 'Draft record'}</span>
          <span className="chip gmp">ICH Q7</span>
          <span className="chip gmp">21 CFR 211.198</span>
          <span className="chip gmp">EU GMP Ch. 8</span>
        </div>
      </header>

      <main className="workspace">
        <section className="pane">
          <div className="pane-head">
            <div>
              <h2>Log customer complaint</h2>
              <p>Official QA record — type it in yourself, or let Bunny fill it from a prompt or document.</p>
            </div>
            <div className={`status-pill ${status === 'Logged' ? 'logged' : ''}`}>
              <span className="dot" />
              {status || 'Pending Triage'}
            </div>
          </div>
          <ComplaintForm />
          <RiskAssessment />
        </section>
        <CopilotPanel />
      </main>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}
