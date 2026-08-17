import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { pushNotice, setProgress } from '../store/chatSlice'
import { sendMessage, uploadDocument } from '../store/thunks'
import { Icon } from './Icon'
import RobotMascot from './RobotMascot'

const STEPS = [
  { icon: 'wand', title: 'Describe the issue naturally' },
  { icon: 'doc', title: "I'll fill the form for you" },
  { icon: 'check', title: 'Review & submit' },
]

export default function CopilotPanel() {
  const dispatch = useDispatch()
  const { messages, busy, progress, progressLabel, error } = useSelector((s) => s.chat)
  const [draft, setDraft] = useState('')
  const fileRef = useRef(null)
  const bottomRef = useRef(null)
  const thread = messages.filter((msg) => msg.id !== 'welcome')
  const idle = thread.length === 0 && !busy

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
    <aside className="copilot" aria-label="AI complaint assistant">
      <div className="ai-hero">
        <div className="mascot-row">
          <RobotMascot />
          <div className="speech">
            Hi there! 👋 I can <strong>fill your complaint form</strong> for you.
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
              <span className="step-icon">
                <Icon name={step.icon} size={16} />
              </span>
              {step.title}
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
        <div className="composer-box">
          <button
            className="attach"
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            aria-label="Attach document"
          >
            <Icon name="paperclip" size={18} />
          </button>
          <input
            value={draft}
            placeholder="Describe your complaint here..."
            onChange={(e) => setDraft(e.target.value)}
            disabled={busy}
          />
          <button className="send" type="submit" disabled={busy || !draft.trim()} aria-label="Send">
            <Icon name="send" size={16} />
          </button>
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
        <p className="formats">PDF, DOCX, TXT, EML · 10MB max</p>
      </form>
    </aside>
  )
}
