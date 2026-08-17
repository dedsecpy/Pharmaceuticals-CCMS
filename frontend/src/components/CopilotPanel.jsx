import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { pushNotice, setProgress } from '../store/chatSlice'
import { sendMessage, uploadDocument } from '../store/thunks'
import PasteModal from './PasteModal'

export default function CopilotPanel() {
  const dispatch = useDispatch()
  const { messages, busy, progress, progressLabel, error } = useSelector((s) => s.chat)
  const [draft, setDraft] = useState('')
  const [hot, setHot] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)
  const fileRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => {
    if (!busy) return undefined
    const id = setInterval(() => {
      dispatch(
        setProgress({
          progress: Math.min(92, (progress || 10) + Math.random() * 14),
        }),
      )
    }, 450)
    return () => clearInterval(id)
  }, [busy, dispatch, progress])

  function submit(text) {
    const value = (text ?? draft).trim()
    if (!value || busy) return
    setDraft('')
    dispatch(sendMessage(value))
  }

  function onFile(file) {
    if (!file || busy) return
    const ok = /\.(pdf|docx|txt|eml)$/i.test(file.name)
    if (!ok) {
      dispatch(pushNotice(`Unsupported file type for ${file.name}. Use PDF, DOCX, TXT, or EML.`))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      dispatch(pushNotice('That file exceeds the 10MB limit.'))
      return
    }
    dispatch(uploadDocument(file))
  }

  return (
    <aside className="pane copilot">
      <div className="pane-head">
        <div>
          <h2>
            Bunny
            <span className="beta">AI assistant</span>
          </h2>
          <p>I can chat — and I’ll log a complaint the moment you describe one.</p>
        </div>
      </div>

      <div className="intake">
        <div
          className={`dropzone ${hot ? 'hot' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setHot(true)
          }}
          onDragLeave={() => setHot(false)}
          onDrop={(e) => {
            e.preventDefault()
            setHot(false)
            onFile(e.dataTransfer.files?.[0])
          }}
        >
          <small>Document upload</small>
          <strong>Drop a complaint PDF, email, or text file</strong>
          <small>or click to browse</small>
        </div>
        <input
          ref={fileRef}
          type="file"
          hidden
          accept=".pdf,.docx,.txt,.eml"
          onChange={(e) => {
            onFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <div className="intake-row">
          <button className="btn btn-ghost" type="button" onClick={() => setPasteOpen(true)} disabled={busy}>
            Paste complaint text / email
          </button>
        </div>
        <div className="hint">PDF, DOCX, TXT, EML · 10MB max · text-based documents extract cleanly</div>
      </div>

      {busy || progressLabel ? (
        <div className="progress-wrap">
          <p>
            {progressLabel} {busy ? `${Math.round(progress)}%` : ''}
          </p>
          <div className="bar">
            <span style={{ width: `${busy ? progress : 100}%` }} />
          </div>
        </div>
      ) : null}

      <div className="chat">
        {messages.map((msg) => (
          <div className={`bubble ${msg.role}`} key={msg.id}>
            {msg.content}
            {msg.tools?.filter((tool) => ['log_complaint', 'edit_complaint', 'extract_document'].includes(tool)).length ? (
              <div className="tools">
                {msg.tools
                  .filter((tool) => ['log_complaint', 'edit_complaint', 'extract_document'].includes(tool))
                  .map((tool) => (
                  <span className="tool-chip" key={tool}>
                    {tool}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error ? <div className="disclaimer">{error}</div> : null}

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <input
          value={draft}
          placeholder="Hi Bunny…"
          onChange={(e) => setDraft(e.target.value)}
          disabled={busy}
        />
        <button type="submit" disabled={busy || !draft.trim()} aria-label="Send">
          ➤
        </button>
      </form>
      <p className="disclaimer">AI responses may contain errors. Verify before committing to the QMS register.</p>

      {pasteOpen ? (
        <PasteModal
          onClose={() => setPasteOpen(false)}
          onSubmit={(text) => {
            setPasteOpen(false)
            submit(text)
          }}
        />
      ) : null}
    </aside>
  )
}
