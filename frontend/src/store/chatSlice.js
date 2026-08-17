import { createSlice } from '@reduxjs/toolkit'
import { sendMessage, uploadDocument, saveComplaint, resetSession } from './thunks'

const welcome = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hey, I’m Bunny — your QA assistant on this complaint desk. Say hi, ask what I can do, or just tell me what the customer reported. I’ll fill the official record on the left when it’s actually a complaint. I can’t write code or help with unrelated tech stuff, but I’m good company for quality issues.",
}

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [welcome],
    busy: false,
    progress: 0,
    progressLabel: '',
    error: null,
    toast: null,
  },
  reducers: {
    setProgress(state, action) {
      state.progress = action.payload.progress
      state.progressLabel = action.payload.label || state.progressLabel
    },
    clearToast(state) {
      state.toast = null
    },
    pushNotice(state, action) {
      state.messages.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: action.payload,
      })
    },
  },
  extraReducers: (builder) => {
    const pending = (state, action) => {
      state.busy = true
      state.error = null
      state.progress = 12
      const text = action.meta.arg
      if (typeof text === 'string' && text.trim()) {
        state.messages.push({ id: crypto.randomUUID(), role: 'user', content: text })
        state.progressLabel = 'Bunny is thinking…'
      } else {
        const name = action.meta.arg?.name || 'document'
        state.messages.push({
          id: crypto.randomUUID(),
          role: 'user',
          content: `Uploaded ${name}`,
        })
        state.progressLabel = 'Analyzing document content and extracting key details…'
      }
    }
    const fulfilled = (state, action) => {
      state.busy = false
      state.progress = 100
      state.progressLabel = ''
      state.messages.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: action.payload.assistant_reply,
        tools: action.payload.tools_used,
        trace: action.payload.trace,
      })
    }
    const rejected = (state, action) => {
      state.busy = false
      state.progress = 0
      state.error = action.payload || action.error.message
      state.messages.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I could not complete that step. ${state.error}`,
      })
    }

    builder
      .addCase(sendMessage.pending, pending)
      .addCase(sendMessage.fulfilled, fulfilled)
      .addCase(sendMessage.rejected, rejected)
      .addCase(uploadDocument.pending, pending)
      .addCase(uploadDocument.fulfilled, fulfilled)
      .addCase(uploadDocument.rejected, rejected)
      .addCase(saveComplaint.fulfilled, (state, action) => {
        state.toast = `Saved ${action.payload.complaint_number}`
        state.messages.push({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Complaint ${action.payload.complaint_number} is now on the QMS register with status Logged. Human review still required before investigation close.`,
        })
      })
      .addCase(saveComplaint.rejected, (state, action) => {
        state.error = action.payload || action.error.message
      })
      .addCase(resetSession.fulfilled, (state) => {
        state.messages = [welcome]
        state.busy = false
        state.progress = 0
        state.progressLabel = ''
        state.error = null
      })
  },
})

export const { setProgress, clearToast, pushNotice } = chatSlice.actions
export default chatSlice.reducer
