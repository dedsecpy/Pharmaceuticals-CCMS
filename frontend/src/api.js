async function handle(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = data.detail
    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((item) => item.msg || JSON.stringify(item)).join('; ')
          : data.message || `Request failed (${res.status})`
    throw new Error(message)
  }
  return data
}

export function chat(body) {
  return fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(handle)
}

export function upload(file, note = '') {
  const form = new FormData()
  form.append('file', file)
  if (note) form.append('note', note)
  return fetch('/api/upload', { method: 'POST', body: form }).then(handle)
}

export function saveComplaintApi(body) {
  return fetch('/api/complaints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(handle)
}

export function listComplaints() {
  return fetch('/api/complaints').then(handle)
}

export function resetDraft() {
  return fetch('/api/complaints/reset', { method: 'POST' }).then(handle)
}

export function health() {
  return fetch('/api/health').then(handle)
}
