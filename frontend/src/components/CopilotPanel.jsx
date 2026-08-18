import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { pushNotice, setProgress } from '../store/chatSlice'
import { sendMessage, uploadDocument } from '../store/thunks'
import bunnybot from '../assets/bunnybot.png'
import { Icon } from './Icon'

const STEPS = [
  {
    icon: 'wand',
    tone: 'green',
    title: 'Describe the issue naturally',
    copy: 'Type your complaint like you’re explaining it to a person.',
  },
  {
    icon: 'docbot',
    tone: 'blue',
    title: 'I’ll fill the form for you',
    copy: 'I’ll extract key details and populate the form accurately.',
  },
  {
    icon: 'check-circle',
    tone: 'purple',
    title: 'Review & submit',
    copy: 'You can review, edit if needed, and submit the complaint.',
  },
]

export default function CopilotPanel({ className = '' }) {
  const dispatch = useDispatch()
  const { messages, busy, progress, progressLabel, error } = useSelector((s) => s.chat)
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState(null)
  const fileRef = useRef(null)
  const bottomRef = useRef(null)
  const thread = messages.filter((msg) => msg.id !== 'welcome')
  const idle = thread.length === 0 && !busy
  const canSend = Boolean(draft.trim() || attachment)

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


  function submit() {
    if (busy || !canSend) return
    const note = draft.trim()
    const file = attachment
    setDraft('')
    setAttachment(null)
    if (file) {
      dispatch(uploadDocument({ file, note }))
    } else {
      dispatch(sendMessage(note))
    }
  }

  function stageFile(file) {
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
    setAttachment(file)
  }

  return (
    <aside className={`copilot ${className}`.trim()} aria-label="AI complaint assistant">
      <div className={`ai-hero ${idle ? '' : 'chat-started'}`.trim()}>
        <div className={`mascot-row ${idle ? '' : 'compact'}`.trim()}>
          <div className="mascot" aria-hidden="true">
            <span className="spark spark-a" aria-hidden="true" />
            <span className="spark spark-b" aria-hidden="true" />
            <img className="robot" src={bunnybot} alt="" />
          </div>
          <div className="speech">
            <p>Hi there! 👋</p>
            <p>
              I can <strong>fill your complaint form</strong> for you.
            </p>
          </div>
        </div>
        <p className="ai-copy">
          Just describe the issue in your own words, and I&apos;ll automatically fill the form with the correct details
          for you.
        </p>
      </div>

      {idle ? (
        <ul className="ai-steps">
          {STEPS.map((step) => (
            <li key={step.title}>
              <span className={`step-icon ${step.tone}`}>
                <Icon name={step.icon} size={14} />
              </span>
              <div>
                <strong>{step.title}</strong>
                <span>{step.copy}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="chat">
          {busy ? (
            <div className="progress-wrap on">
              <div className="bar">
                <span style={{ width: `${progress}%` }} />
              </div>
              <p>
                {progressLabel} {Math.round(progress)}%
              </p>
            </div>
          ) : null}
          {thread.map((msg) => (
            <div className={`bubble ${msg.role}`} key={msg.id}>
              {msg.content}
              {msg.tools?.filter((tool) => ['log_complaint', 'edit_complaint', 'extract_document'].includes(tool))
                .length ? (
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
          {busy ? (
            <div className="typing" aria-label="Assistant is working">
              <i />
              <i />
              <i />
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      )}

      {error ? <div className="disclaimer error">{error}</div> : null}

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        {attachment ? (
          <div className="attach-chip">
            <Icon name="doc" size={14} />
            <span title={attachment.name}>{attachment.name}</span>
            <button type="button" onClick={() => setAttachment(null)} aria-label="Remove attachment">
              ×
            </button>
          </div>
        ) : null}
        <div className="composer-box">
          <textarea
            value={draft}
            placeholder={attachment ? 'Add a note, then press Enter…' : 'Describe your complaint here...'}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            disabled={busy}
            rows={3}
          />
          <div className="composer-bar">
            <button
              className="attach"
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              aria-label="Attach document"
            >
              <Icon name="paperclip" size={18} />
            </button>
            <button className="send" type="submit" disabled={busy || !canSend} aria-label="Send">
              <Icon name="send" size={16} />
            </button>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          hidden
          accept=".pdf,.docx,.txt,.eml"
          onChange={(e) => {
            stageFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <p className="formats">
          You can attach supporting documents (PDF, DOCX, TXT, EML)
          <br />
          Max file size: 10MB
        </p>
      </form>
    </aside>
  )
}
