import { v4 as uuid } from 'uuid';
import { SubscriptionPlan, SubscriptionContract } from './subscription.types';

const plans: SubscriptionPlan[] = [];
const contracts: SubscriptionContract[] = [];

export class SubscriptionService {
  listPlans(): SubscriptionPlan[] {
    return plans;
  }

  createPlan(data: Omit<SubscriptionPlan, 'id' | 'createdAt'>): SubscriptionPlan {
    const plan: SubscriptionPlan = {
      ...data,
      id: uuid(),
      createdAt: new Date().toISOString()
    };
    plans.push(plan);
    return plan;
  }

  listContractsByTrainer(trainerId: string): SubscriptionContract[] {
    return contracts.filter((contract) => contract.trainerId === trainerId);
  }

  createContract(data: Omit<SubscriptionContract, 'id' | 'createdAt'>): SubscriptionContract {
    const contract: SubscriptionContract = {
      ...data,
      id: uuid(),
      createdAt: new Date().toISOString()
    };
    contracts.push(contract);
    return contract;
  }
}

export const subscriptionService = new SubscriptionService();
