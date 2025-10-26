import { v4 as uuid } from 'uuid';
import { TrainerProfile } from './trainer.types';

const trainers: TrainerProfile[] = [];

export class TrainerService {
  list(): TrainerProfile[] {
    return trainers;
  }

  create(data: Omit<TrainerProfile, 'id' | 'createdAt' | 'rating' | 'totalStudents'>): TrainerProfile {
    const trainer: TrainerProfile = {
      ...data,
      id: uuid(),
      rating: 0,
      totalStudents: 0,
      createdAt: new Date().toISOString()
    };

    trainers.push(trainer);
    return trainer;
  }

  update(id: string, updates: Partial<TrainerProfile>): TrainerProfile {
    const trainer = trainers.find((item) => item.id === id);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    Object.assign(trainer, updates);
    return trainer;
  }
}

export const trainerService = new TrainerService();
