export const EMPTY_COMPLAINT = {
  complaint_source: null,
  customer_name: null,
  product_name: null,
  product_strength_grade: null,
  batch_lot_number: null,
  manufacturing_date: null,
  expiry_date: null,
  quantity_affected: null,
  quantity_unit: 'kg',
  complaint_type: null,
  complaint_date: null,
  detailed_description: null,
  initial_severity: null,
  priority: null,
  status: 'Pending Triage',
}

export const EMPTY_RISK = {
  severity: null,
  priority: null,
  patient_safety_impact: null,
  regulatory_reporting: null,
  batch_disposition: null,
  next_action: null,
  investigation_type: null,
  rationale: null,
  confidence: null,
}

export const EMPTY_INSIGHTS = {
  summary: null,
  completeness_score: 0,
  missing_fields: [],
  root_cause_hypothesis: null,
  capa_recommendation: null,
  is_complete: false,
}

