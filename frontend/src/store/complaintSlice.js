import { createSlice } from '@reduxjs/toolkit'
import { EMPTY_COMPLAINT, EMPTY_INSIGHTS, EMPTY_RISK } from './defaults'
import { sendMessage, uploadDocument, saveComplaint, resetSession } from './thunks'

function applyGraphResult(state, action) {
  const prev = state.fields
  const next = action.payload.complaint || prev
  const changed = Object.keys(next).filter((key) => (next[key] || '') !== (prev[key] || ''))
  state.fields = next
  state.risk = action.payload.risk_assessment || state.risk
  state.insights = action.payload.quality_insights || state.insights
  state.duplicates = action.payload.duplicates || []
  state.highlighted = changed
  state.lastIntent = action.payload.intent
  state.toolsUsed = action.payload.tools_used || []
  state.trace = action.payload.trace || []
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
  },
  reducers: {
    clearHighlights(state) {
      state.highlighted = []
    },
    updateField(state, action) {
      const { key, value } = action.payload
      state.fields[key] = value === '' ? null : value
    },
  },
  extraReducers: (builder) => {
    builder
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
      })
  },
})

export const { clearHighlights, updateField } = complaintSlice.actions
export default complaintSlice.reducer
