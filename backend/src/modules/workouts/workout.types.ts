export interface WorkoutExercise {
  name: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  restSeconds: number;
  loadKg?: number;
  videoUrl?: string;
  instructions?: string;
}

export interface WorkoutPlan {
  id: string;
  trainerId: string;
  studentId: string;
  title: string;
  schedule: 'daily' | 'weekly' | 'custom';
  weekday?: number;
  notes?: string;
  exercises: WorkoutExercise[];
  createdAt: string;
  updatedAt: string;
}
