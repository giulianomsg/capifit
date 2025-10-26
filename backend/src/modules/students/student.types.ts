export interface StudentProfile {
  id: string;
  userId: string;
  trainerId: string;
  goals: string[];
  medicalNotes?: string;
  subscriptionStatus: 'active' | 'expired' | 'pending';
  lastCheckIn?: string;
  createdAt: string;
}
