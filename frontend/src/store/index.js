import { configureStore } from '@reduxjs/toolkit'
import complaintReducer from './complaintSlice'
import chatReducer from './chatSlice'
import recordsReducer from './recordsSlice'

const store = configureStore({
  reducer: {
    complaint: complaintReducer,
    chat: chatReducer,
    records: recordsReducer,
  },
})

export default store
