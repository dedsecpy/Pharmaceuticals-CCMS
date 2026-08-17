import { useState } from 'react'

export default function PasteModal({ onClose, onSubmit }) {
  const [text, setText] = useState('')
  return (
    <div className="modal-back" onClick={onClose} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="paste-title"
      >
        <h3 id="paste-title">Paste complaint text / email</h3>
        <p className="modal-copy">
          Drop in the customer email or a narrative. The log complaint tool will extract the record.
        </p>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the email or complaint narrative…"
        />
        <div className="modal-actions">
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" type="button" disabled={!text.trim()} onClick={() => onSubmit(text)}>
            Extract
          </button>
        </div>
      </div>
    </div>
  )
}
