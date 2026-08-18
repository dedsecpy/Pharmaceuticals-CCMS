import { HexMark } from './Icon'

export default function BootSplash({ exiting }) {
  return (
    <div className={`boot ${exiting ? 'boot-exit' : ''}`} aria-live="polite" aria-busy={!exiting}>
      <div className="boot-card">
        <div className="boot-mark">
          <HexMark />
        </div>
        <h1>AIVOA QMS</h1>
        <p className="boot-sub">Customer Complaint Module</p>
        <div className="boot-bar" aria-hidden="true">
          <span />
        </div>
        <p className="boot-status">Preparing workspace…</p>
      </div>
    </div>
  )
}
