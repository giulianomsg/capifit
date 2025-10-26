import { v4 as uuid } from 'uuid';
import { DietPlan } from './diet.types';

const diets: DietPlan[] = [];

export class DietService {
  listByStudent(studentId: string): DietPlan[] {
    return diets.filter((plan) => plan.studentId === studentId);
  }

  create(data: Omit<DietPlan, 'id' | 'createdAt' | 'updatedAt'>): DietPlan {
    const plan: DietPlan = {
      ...data,
      id: uuid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    diets.push(plan);
    return plan;
  }

  update(id: string, updates: Partial<DietPlan>): DietPlan {
    const plan = diets.find((item) => item.id === id);
    if (!plan) {
      throw new Error('Diet plan not found');
    }

    Object.assign(plan, updates, { updatedAt: new Date().toISOString() });
    return plan;
  }
}

export const dietService = new DietService();
