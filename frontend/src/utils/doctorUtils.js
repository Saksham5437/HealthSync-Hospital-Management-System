/** Use API/database values as-is — only normalize display formatting. */
export const normalizeDoctor = (doctor) => {
  if (!doctor) return doctor;

  const normalized = { ...doctor };

  if (normalized.full_name && typeof normalized.full_name === 'string') {
    normalized.full_name = normalized.full_name.replace(/^Dr\.\s*/i, '').trim();
  }

  if (normalized.experience_years != null) {
    normalized.experience_years = Number(normalized.experience_years);
  }

  if (normalized.consultation_fee != null) {
    normalized.consultation_fee = Number(normalized.consultation_fee);
  }

  return normalized;
};
