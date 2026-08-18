import { createSlice } from '@reduxjs/toolkit'
import { EMPTY_COMPLAINT, EMPTY_INSIGHTS, EMPTY_RISK } from './defaults'
import { sendMessage, uploadDocument, saveComplaint, resetSession } from './thunks'

export const FILL_ORDER = [
  'complaint_source',
  'customer_name',
  'product_name',
  'product_strength_grade',
  'batch_lot_number',
  'manufacturing_date',
  'expiry_date',
  'quantity_affected',
  'quantity_unit',
  'complaint_type',
  'complaint_date',
  'detailed_description',
  'initial_severity',
  'priority',
]

const INTAKE = new Set(['log_complaint', 'edit_complaint', 'extract_document'])

function commitPayload(state, payload, fields) {
  if (fields) state.fields = fields
  state.risk = payload.risk_assessment || state.risk
  state.insights = payload.quality_insights || state.insights
  state.duplicates = payload.duplicates || []
  state.lastIntent = payload.intent
  state.toolsUsed = payload.tools_used || []
  state.trace = payload.trace || []
}

function abortFill(state) {
  if (state.pending) {
    commitPayload(state, state.pending, state.pending.complaint)
  }
  state.pending = null
  state.filling = false
  state.fillingKey = null
}

function applyGraphResult(state, action) {
  const prev = state.fields
  const next = action.payload.complaint || prev
  const tools = action.payload.tools_used || []
  const intake = tools.some((tool) => INTAKE.has(tool))
  const changed = FILL_ORDER.filter((key) => (next[key] || '') !== (prev[key] || ''))

  state.lastIntent = action.payload.intent
  state.toolsUsed = tools
  state.trace = action.payload.trace || []

  if (!intake || !changed.length) {
    commitPayload(state, action.payload, next)
    state.pending = null
    state.filling = false
    state.fillingKey = null
    state.highlighted = changed
    return
  }

  state.pending = {
    id: (state.fillId || 0) + 1,
    complaint: next,
    risk_assessment: action.payload.risk_assessment,
    quality_insights: action.payload.quality_insights,
    duplicates: action.payload.duplicates || [],
    intent: action.payload.intent,
    tools_used: tools,
    trace: action.payload.trace || [],
    keys: changed,
  }
  state.fillId = state.pending.id
  state.filling = true
  state.fillingKey = null
  state.highlighted = []
}

const complaintSlice = createSlice({
  name: 'complaint',
  initialState: {
    fields: { ...EMPTY_COMPLAINT },
    risk: { ...EMPTY_RISK },
    insights: { ...EMPTY_INSIGHTS },
    duplicates: [],
    highlighted: [],
    toolsUsed: [],
    trace: [],
    lastIntent: null,
    savedNumber: null,
    filling: false,
    fillingKey: null,
    fillId: 0,
    pending: null,
  },
  reducers: {
    clearHighlights(state) {
      if (state.filling) return
      state.highlighted = []
    },
    updateField(state, action) {
      const { key, value } = action.payload
      state.fields[key] = value === '' ? null : value
    },
    typeField(state, action) {
      const { key, value } = action.payload
      state.fields[key] = value === '' ? null : value
      state.fillingKey = key
      state.highlighted = [key]
    },
    finishFill(state) {
      if (state.pending) commitPayload(state, state.pending, state.pending.complaint)
      state.pending = null
      state.filling = false
      state.fillingKey = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, abortFill)
      .addCase(uploadDocument.pending, abortFill)
      .addCase(sendMessage.fulfilled, applyGraphResult)
      .addCase(uploadDocument.fulfilled, applyGraphResult)
      .addCase(saveComplaint.fulfilled, (state, action) => {
        state.savedNumber = action.payload.complaint_number
        state.fields.status = 'Logged'
      })
      .addCase(resetSession.fulfilled, (state, action) => {
        state.fields = action.payload.complaint
        state.risk = action.payload.risk_assessment
        state.insights = action.payload.quality_insights
        state.duplicates = []
        state.highlighted = []
        state.toolsUsed = []
        state.trace = []
        state.lastIntent = null
        state.savedNumber = null
        state.pending = null
        state.filling = false
        state.fillingKey = null
      })
  },
})

export const { clearHighlights, updateField, typeField, finishFill } = complaintSlice.actions
export default complaintSlice.reducer
