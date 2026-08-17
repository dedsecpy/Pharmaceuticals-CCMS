import { createAsyncThunk } from '@reduxjs/toolkit'
import { chat, listComplaints, resetDraft, saveComplaintApi, upload } from '../api'

export const sendMessage = createAsyncThunk(
  'qms/sendMessage',
  async (message, { getState, rejectWithValue }) => {
    try {
      const { fields, risk, insights } = getState().complaint
      return await chat({
        message,
        complaint: fields,
        risk_assessment: risk,
        quality_insights: insights,
      })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const uploadDocument = createAsyncThunk(
  'qms/uploadDocument',
  async (file, { rejectWithValue }) => {
    try {
      return await upload(file)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const saveComplaint = createAsyncThunk(
  'qms/saveComplaint',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { fields, risk, insights } = getState().complaint
      if (!fields.product_name && !fields.detailed_description) {
        throw new Error('Add a product name or a complaint description before saving.')
      }
      return await saveComplaintApi({
        complaint: fields,
        risk_assessment: risk,
        quality_insights: insights,
      })
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const resetSession = createAsyncThunk('qms/reset', async () => resetDraft())

export const fetchComplaints = createAsyncThunk('qms/list', async () => listComplaints())
