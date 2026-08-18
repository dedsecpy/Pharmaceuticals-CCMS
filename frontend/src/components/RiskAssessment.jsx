import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

function Cell({ label, value, wide }) {
  return (
    <div className={`risk-cell ${wide ? 'wide' : ''}`}>
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </div>
  )
}

export default function RiskAssessment() {
  const risk = useSelector((s) => s.complaint.risk)
  const insights = useSelector((s) => s.complaint.insights)
  const duplicates = useSelector((s) => s.complaint.duplicates)
  const severity = (risk.severity || '').toLowerCase()
  const score = insights.completeness_score || 0
  const ready = Boolean(
    risk.severity ||
      risk.next_action ||
      risk.rationale ||
      insights.summary ||
      insights.capa_recommendation ||
      duplicates.length,
  )
  const cardRef = useRef(null)
  const seen = useRef(false)

  useEffect(() => {
    if (!ready) {
      seen.current = false
      return
    }
    if (seen.current || !cardRef.current) return
    seen.current = true
    const card = cardRef.current
    const id = window.setTimeout(() => {
      const pane = card.closest('.record-scroll')
      if (!pane) return
      const paneBox = pane.getBoundingClientRect()
      const cardBox = card.getBoundingClientRect()
      pane.scrollTo({
        top: pane.scrollTop + (cardBox.top - paneBox.top) - 12,
        behavior: 'smooth',
      })
    }, 60)
    return () => window.clearTimeout(id)
  }, [ready])

  if (!ready) return null

  return (
    <div className="risk-card" ref={cardRef}>
      <header>
        <h3>AI copilot risk assessment</h3>
        <span className={`severity ${severity || 'empty'}`}>{risk.severity || 'Unclassified'}</span>
      </header>
      <div className="risk-grid">
        <Cell label="Next action" value={risk.next_action} wide />
        <Cell label="Patient safety impact" value={risk.patient_safety_impact} />
        <Cell label="Regulatory reporting" value={risk.regulatory_reporting} />
        <Cell label="Batch disposition" value={risk.batch_disposition} />
        <Cell label="Investigation" value={risk.investigation_type} />
        <div className="risk-cell">
          <dt>Completeness</dt>
          <dd>
            <div className="meter">
              <div className="meter-bar">
                <span style={{ width: `${score}%` }} />
              </div>
              {score}%
            </div>
          </dd>
        </div>
        <Cell label="Priority" value={risk.priority} />
        <Cell label="Rationale" value={risk.rationale} wide />
        <Cell label="Complaint summary" value={insights.summary} wide />
        <Cell label="Root cause hypothesis" value={insights.root_cause_hypothesis} wide />
        <Cell label="CAPA recommendation" value={insights.capa_recommendation} wide />
        {insights.missing_fields?.length ? (
          <Cell label="Missing for a complete intake" value={insights.missing_fields.join(', ')} wide />
        ) : null}
      </div>
      {duplicates.length ? (
        <div className="dupe">
          Possible duplicate{duplicates.length > 1 ? 's' : ''}:{' '}
          {duplicates
            .map((d) => `${d.complaint_number} (${d.similarity_reason})`)
            .join(' · ')}
        </div>
      ) : null}
    </div>
  )
}
