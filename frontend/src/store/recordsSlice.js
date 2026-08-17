import { createSlice } from '@reduxjs/toolkit'
import { fetchComplaints, saveComplaint } from './thunks'

const recordsSlice = createSlice({
  name: 'records',
  initialState: { items: [] },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.items = action.payload
      })
      .addCase(saveComplaint.fulfilled, (state, action) => {
        state.items = [action.payload, ...state.items.filter((row) => row.id !== action.payload.id)]
      })
  },
})

export default recordsSlice.reducer
