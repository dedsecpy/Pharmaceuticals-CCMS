import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { clearHighlights, updateField } from '../store/complaintSlice'
import { resetSession, saveComplaint } from '../store/thunks'

const SEVERITY = ['', 'Critical', 'Major', 'Minor']
const PRIORITY = ['', 'Urgent', 'High', 'Medium', 'Low']

const SECTIONS = [
  {
    n: '01',
    title: 'Origin & customer details',
    fields: [
      { key: 'complaint_source', label: 'Complaint source', placeholder: 'Pharmacy, hospital, distributor, CDMO…' },
      { key: 'customer_name', label: 'Customer name', placeholder: 'e.g. Apollo Pharmacy, Bengaluru' },
    ],
  },
  {
    n: '02',
    title: 'Product & batch identification',
    fields: [
      { key: 'product_name', label: 'Product name', placeholder: 'e.g. Amoxicillin Capsules' },
      { key: 'product_strength_grade', label: 'Product strength / grade', placeholder: 'e.g. 500 mg or IP/BP' },
      { key: 'batch_lot_number', label: 'Batch / lot number', placeholder: 'e.g. BMX24601' },
      { key: 'manufacturing_date', label: 'Manufacturing date', placeholder: 'YYYY-MM-DD' },
      { key: 'expiry_date', label: 'Expiry / retest date', placeholder: 'YYYY-MM-DD' },
      { key: 'quantity_affected', label: 'Quantity affected', qty: true, placeholder: 'e.g. 48', unitPlaceholder: 'capsules, kg, drums…' },
    ],
  },
  {
    n: '03',
    title: 'Complaint details',
    fields: [
      { key: 'complaint_type', label: 'Complaint type', placeholder: 'Appearance, labeling, contamination…' },
      { key: 'complaint_date', label: 'Complaint date', placeholder: 'YYYY-MM-DD' },
      {
        key: 'detailed_description',
        label: 'Detailed complaint description',
        wide: true,
        area: true,
        placeholder: 'What was observed, where, and what the customer is asking for…',
      },
    ],
  },
  {
    n: '04',
    title: 'Initial assessment & priority',
    fields: [
      { key: 'initial_severity', label: 'Initial severity', options: SEVERITY, placeholder: 'Select severity' },
      { key: 'priority', label: 'Priority', options: PRIORITY, placeholder: 'Select priority' },
    ],
  },
]

function Field({ spec, value, unit, highlighted, disabled, onChange }) {
  const empty = !value
  const cls = `field ${spec.wide ? 'wide' : ''} ${empty ? 'empty' : ''} ${highlighted ? 'just-filled' : ''}`

  function set(key, next) {
    onChange(key, next)
  }

  if (spec.qty) {
    return (
      <div className={cls}>
        <label htmlFor={spec.key}>{spec.label}</label>
        <div className="qty">
          <input
            id={spec.key}
            value={value || ''}
            placeholder={spec.placeholder}
            disabled={disabled}
            onChange={(e) => set(spec.key, e.target.value)}
          />
          <input
            className="unit"
            value={unit || ''}
            placeholder={spec.unitPlaceholder || 'kg, capsules…'}
            disabled={disabled}
            aria-label="Quantity unit"
            onChange={(e) => set('quantity_unit', e.target.value)}
          />
        </div>
      </div>
    )
  }

  if (spec.options) {
    return (
      <div className={cls}>
        <label htmlFor={spec.key}>{spec.label}</label>
        <select
          id={spec.key}
          value={value || ''}
          disabled={disabled}
          onChange={(e) => set(spec.key, e.target.value)}
        >
          <option value="">{spec.placeholder}</option>
          {spec.options.filter(Boolean).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className={cls}>
      <label htmlFor={spec.key}>{spec.label}</label>
      {spec.area ? (
        <textarea
          id={spec.key}
          value={value || ''}
          placeholder={spec.placeholder}
          disabled={disabled}
          onChange={(e) => set(spec.key, e.target.value)}
        />
      ) : (
        <input
          id={spec.key}
          value={value || ''}
          placeholder={spec.placeholder}
          disabled={disabled}
          onChange={(e) => set(spec.key, e.target.value)}
        />
      )}
    </div>
  )
}

export default function ComplaintForm() {
  const dispatch = useDispatch()
  const fields = useSelector((s) => s.complaint.fields)
  const highlighted = useSelector((s) => s.complaint.highlighted)
  const busy = useSelector((s) => s.chat.busy)

  useEffect(() => {
    if (!highlighted.length) return undefined
    const t = setTimeout(() => dispatch(clearHighlights()), 1600)
    return () => clearTimeout(t)
  }, [highlighted, dispatch])

  return (
    <>
      <div className="form-scroll">
        {SECTIONS.map((section) => (
          <section className="section" key={section.n}>
            <div className="section-title">
              <div className="idx">{section.n}</div>
              <span>{section.title}</span>
            </div>
            <div className="grid">
              {section.fields.map((spec) => (
                <Field
                  key={spec.key}
                  spec={spec}
                  value={fields[spec.key]}
                  unit={fields.quantity_unit}
                  highlighted={highlighted.includes(spec.key)}
                  disabled={busy}
                  onChange={(key, value) => dispatch(updateField({ key, value }))}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="form-actions">
        <button className="btn btn-ghost" type="button" onClick={() => dispatch(resetSession())} disabled={busy}>
          Reset form
        </button>
        <button className="btn btn-primary" type="button" onClick={() => dispatch(saveComplaint())} disabled={busy}>
          Save complaint
        </button>
      </div>
    </>
  )
}
