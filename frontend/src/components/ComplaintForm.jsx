import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { clearHighlights, updateField } from '../store/complaintSlice'
import { resetSession, saveComplaint } from '../store/thunks'
import { Icon } from './Icon'

const SOURCES = ['Pharmacy', 'Hospital', 'Distributor', 'CDMO', 'Patient', 'Regulatory agency', 'Other']
const TYPES = ['Appearance', 'Labeling', 'Contamination', 'Packaging', 'Quantity', 'Efficacy', 'Other']
const UNITS = ['kg', 'capsules', 'tablets', 'drums', 'L', 'units']
const SEVERITY = ['Critical', 'Major', 'Minor']
const PRIORITY = ['Urgent', 'High', 'Medium', 'Low']

const SECTIONS = [
  {
    n: '01',
    title: 'Origin & Customer Details',
    fields: [
      {
        key: 'complaint_source',
        label: 'Complaint source',
        placeholder: 'e.g. Pharmacy, hospital, distributor...',
        options: SOURCES,
        icon: 'building',
      },
      {
        key: 'customer_name',
        label: 'Customer name',
        placeholder: 'e.g. Apollo Pharmacy, Bengaluru',
        icon: 'user',
      },
    ],
  },
  {
    n: '02',
    title: 'Product & Batch Identification',
    fields: [
      { key: 'product_name', label: 'Product name', placeholder: 'e.g. Amoxicillin Capsules', icon: 'pill' },
      { key: 'product_strength_grade', label: 'Product strength / grade', placeholder: 'e.g. 500 mg or IP/BP', icon: 'shield' },
      { key: 'batch_lot_number', label: 'Batch / lot number', placeholder: 'e.g. BMX24601', icon: 'barcode' },
      { key: 'manufacturing_date', label: 'Manufacturing date', placeholder: 'Select date', date: true, icon: 'calendar' },
      { key: 'expiry_date', label: 'Expiry date', placeholder: 'Select date', date: true, icon: 'calendar' },
      { key: 'quantity_affected', label: 'Quantity affected', qty: true, placeholder: '0', icon: 'list' },
    ],
  },
  {
    n: '03',
    title: 'Complaint Details',
    fields: [
      { key: 'complaint_type', label: 'Complaint type', placeholder: 'Select type', options: TYPES, icon: 'list' },
      { key: 'complaint_date', label: 'Complaint date', placeholder: 'Select date', date: true, icon: 'calendar' },
      {
        key: 'detailed_description',
        label: 'Detailed complaint description',
        wide: true,
        area: true,
        placeholder: 'Describe the defect, where it was found, and what the customer is requesting…',
      },
    ],
  },
  {
    n: '04',
    title: 'Initial Assessment & Priority',
    fields: [
      { key: 'initial_severity', label: 'Initial severity', options: SEVERITY, placeholder: 'Select severity' },
      { key: 'priority', label: 'Priority', options: PRIORITY, placeholder: 'Select priority' },
    ],
  },
]

function Control({ spec, value, unit, disabled, onChange }) {
  function set(key, next) {
    onChange(key, next)
  }

  if (spec.qty) {
    return (
      <div className="qty">
        <div className="with-icon">
          {spec.icon ? (
            <span className="field-icon left">
              <Icon name={spec.icon} size={15} />
            </span>
          ) : null}
          <input
            id={spec.key}
            value={value || ''}
            placeholder={spec.placeholder}
            disabled={disabled}
            onChange={(e) => set(spec.key, e.target.value)}
          />
        </div>
        <div className="with-icon unit-wrap">
          <select
            className="unit"
            value={unit || 'kg'}
            disabled={disabled}
            aria-label="Quantity unit"
            onChange={(e) => set('quantity_unit', e.target.value)}
          >
            {UNITS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <span className="field-icon">
            <Icon name="chevron" size={14} />
          </span>
        </div>
      </div>
    )
  }

  if (spec.options) {
    return (
      <div className="with-icon">
        {spec.icon ? (
          <span className="field-icon left">
            <Icon name={spec.icon} size={15} />
          </span>
        ) : null}
        <select
          id={spec.key}
          className={spec.icon ? 'has-left' : ''}
          value={value || ''}
          disabled={disabled}
          onChange={(e) => set(spec.key, e.target.value)}
        >
          <option value="">{spec.placeholder}</option>
          {spec.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="field-icon">
          <Icon name="chevron" size={14} />
        </span>
      </div>
    )
  }

  if (spec.area) {
    const count = (value || '').length
    return (
      <div className="area-wrap">
        <textarea
          id={spec.key}
          value={value || ''}
          placeholder={spec.placeholder}
          maxLength={5000}
          disabled={disabled}
          onChange={(e) => set(spec.key, e.target.value)}
        />
        <span className="counter">{count} / 5000</span>
      </div>
    )
  }

  return (
    <div className="with-icon">
      {spec.icon ? (
        <span className="field-icon left">
          <Icon name={spec.icon} size={15} />
        </span>
      ) : null}
      <input
        id={spec.key}
        className={spec.icon ? 'has-left' : ''}
        type={spec.date ? 'date' : 'text'}
        value={value || ''}
        placeholder={spec.placeholder}
        disabled={disabled}
        onChange={(e) => set(spec.key, e.target.value)}
      />
      {spec.date ? (
        <span className="field-icon">
          <Icon name="calendar" size={15} />
        </span>
      ) : null}
    </div>
  )
}

function Field({ spec, value, unit, highlighted, typing, disabled, onChange }) {
  const empty = !value
  const cls = `field ${spec.wide ? 'wide' : ''} ${empty ? 'empty' : ''} ${highlighted ? 'just-filled' : ''} ${typing ? 'typing' : ''}`

  return (
    <div className={cls}>
      <label htmlFor={spec.key}>{spec.label}</label>
      <Control spec={spec} value={value} unit={unit} disabled={disabled} onChange={onChange} />
    </div>
  )
}

export default function ComplaintForm() {
  const dispatch = useDispatch()
  const fields = useSelector((s) => s.complaint.fields)
  const highlighted = useSelector((s) => s.complaint.highlighted)
  const filling = useSelector((s) => s.complaint.filling)
  const fillingKey = useSelector((s) => s.complaint.fillingKey)
  const busy = useSelector((s) => s.chat.busy)

  useEffect(() => {
    if (filling || !highlighted.length) return undefined
    const t = setTimeout(() => dispatch(clearHighlights()), 1600)
    return () => clearTimeout(t)
  }, [highlighted, filling, dispatch])

  useEffect(() => {
    if (!fillingKey) return
    const field = document.getElementById(fillingKey)?.closest('.field')
    const pane = field?.closest('.record-scroll')
    if (!field || !pane) return
    const paneBox = pane.getBoundingClientRect()
    const fieldBox = field.getBoundingClientRect()
    const offset = fieldBox.top - paneBox.top - pane.clientHeight * 0.28
    pane.scrollTo({ top: pane.scrollTop + offset, behavior: 'smooth' })
  }, [fillingKey])

  return (
    <>
      <div className="form-fit">
      {SECTIONS.map((section) => (
        <section className="section" key={section.n}>
          <div className="section-title">
            <span className="idx">{section.n}</span>
            <span>{section.title}</span>
          </div>
          <div className={`grid ${section.n === '02' ? 'grid-3' : ''}`}>
            {section.fields.map((spec) => (
              <Field
                key={spec.key}
                spec={spec}
                value={fields[spec.key]}
                unit={fields.quantity_unit}
                highlighted={highlighted.includes(spec.key)}
                typing={fillingKey === spec.key}
                disabled={busy || filling}
                onChange={(key, value) => dispatch(updateField({ key, value }))}
              />
            ))}
          </div>
        </section>
      ))}
      </div>
    </>
  )
}

export function FormActions() {
  const dispatch = useDispatch()
  const busy = useSelector((s) => s.chat.busy)
  const filling = useSelector((s) => s.complaint.filling)
  const locked = busy || filling

  return (
    <div className="form-actions">
      <button className="btn btn-ghost" type="button" onClick={() => dispatch(resetSession())} disabled={locked}>
        <Icon name="refresh" size={15} />
        Reset form
      </button>
      <button className="btn btn-primary" type="button" onClick={() => dispatch(saveComplaint())} disabled={locked}>
        <Icon name="submit" size={15} />
        Submit complaint
      </button>
    </div>
  )
}
