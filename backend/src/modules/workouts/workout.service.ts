import { v4 as uuid } from 'uuid';
import { WorkoutPlan } from './workout.types';

const workouts: WorkoutPlan[] = [];

export class WorkoutService {
  listByStudent(studentId: string): WorkoutPlan[] {
    return workouts.filter((plan) => plan.studentId === studentId);
  }

  create(data: Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'>): WorkoutPlan {
    const plan: WorkoutPlan = {
      ...data,
      id: uuid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    workouts.push(plan);
    return plan;
  }

  update(id: string, updates: Partial<WorkoutPlan>): WorkoutPlan {
    const plan = workouts.find((item) => item.id === id);
    if (!plan) {
      throw new Error('Workout plan not found');
    }

    Object.assign(plan, updates, { updatedAt: new Date().toISOString() });
    return plan;
  }
}

export const workoutService = new WorkoutService();
