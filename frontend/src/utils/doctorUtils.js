export const doctorSpecializationMap = {
  'Dr. Dr Rishi': { specialization: 'Cancer Specialist', department_name: 'Oncology', experience_years: 17, consultation_fee: 1400 },
  'Dr. Dr Arun J Gowda': { specialization: 'Cardiologist', department_name: 'Cardiology', experience_years: 15, consultation_fee: 1500 },
  'Dr. Dr Bhanumati B': { specialization: 'Neurologist', department_name: 'Neurology', experience_years: 13, consultation_fee: 1300 },
  'Dr. Dr Mahesh Kollur': { specialization: 'Pediatrician', department_name: 'Pediatrics', experience_years: 12, consultation_fee: 1200 },
  'Dr. Dr Rahul Patil': { specialization: 'Orthopedic Surgeon', department_name: 'Orthopedics', experience_years: 14, consultation_fee: 1100 },
  'Dr. Dr Ramesh Bhat': { specialization: 'Dermatologist', department_name: 'Dermatology', experience_years: 16, consultation_fee: 900 },
};

export const normalizeDoctor = (doctor) => {
  if (!doctor) return doctor;
  
  const normalizedName = typeof doctor.full_name === 'string' ? doctor.full_name.trim() : '';
  
  const override = normalizedName ? (doctorSpecializationMap[normalizedName] || doctorSpecializationMap[`Dr. ${normalizedName}`] || doctorSpecializationMap[normalizedName.replace(/^Dr\.\s*/, '')]) : null;
  
  const normalizedDoctor = override ? { ...doctor, ...override } : { ...doctor };
  normalizedDoctor.experience_years = Math.max(Number(normalizedDoctor.experience_years) || 11, 11);
  normalizedDoctor.consultation_fee = Math.min(Math.max(Number(normalizedDoctor.consultation_fee) || 800, 800), 1500);
  
  if (normalizedDoctor.full_name && typeof normalizedDoctor.full_name === 'string') {
    normalizedDoctor.full_name = normalizedDoctor.full_name.replace(/^Dr\.\s*/i, '').trim();
  }
  
  return normalizedDoctor;
};
