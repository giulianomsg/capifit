export interface PhysicalAssessment {
  id: string;
  trainerId: string;
  studentId: string;
  date: string;
  weight: number;
  height: number;
  bodyFat: number;
  muscleMass: number;
  imc: number;
  notes?: string;
  attachments?: string[];
}

export interface ProgressSnapshot {
  id: string;
  studentId: string;
  date: string;
  weight: number;
  waist: number;
  hip: number;
  chest: number;
  thigh: number;
  photos?: string[];
}
