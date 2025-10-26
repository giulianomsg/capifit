export interface DietMealItem {
  food: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  notes?: string;
}

export interface DietMeal {
  time: string;
  title: string;
  items: DietMealItem[];
}

export interface DietPlan {
  id: string;
  trainerId: string;
  studentId: string;
  title: string;
  totalCalories: number;
  meals: DietMeal[];
  createdAt: string;
  updatedAt: string;
}
