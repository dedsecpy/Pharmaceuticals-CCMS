import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { finishFill, typeField } from '../store/complaintSlice'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function useLiveFill() {
  const dispatch = useDispatch()
  const fillId = useSelector((s) => s.complaint.fillId)
  const pending = useSelector((s) => s.complaint.pending)

  useEffect(() => {
    if (!pending || pending.id !== fillId) return undefined
    let cancelled = false

    async function run() {
      for (const key of pending.keys) {
        if (cancelled) return
        const value = pending.complaint[key]
        const text = value == null ? '' : String(value)
        const typeOut = key === 'detailed_description' && text.length > 8

        if (typeOut) {
          let acc = ''
          const step = text.length > 180 ? 3 : 2
          for (let i = 0; i < text.length; i += step) {
            if (cancelled) return
            acc = text.slice(0, i + step)
            dispatch(typeField({ key, value: acc }))
            await sleep(14)
          }
          if (!cancelled) dispatch(typeField({ key, value: text }))
        } else {
          dispatch(typeField({ key, value }))
          await sleep(150)
        }
      }
      if (!cancelled) {
        await sleep(180)
        dispatch(finishFill())
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [dispatch, fillId, pending])
}
