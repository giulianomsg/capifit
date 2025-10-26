import { v4 as uuid } from 'uuid';
import { PhysicalAssessment, ProgressSnapshot } from './assessment.types';

const assessments: PhysicalAssessment[] = [];
const snapshots: ProgressSnapshot[] = [];

export class AssessmentService {
  listPhysical(studentId: string): PhysicalAssessment[] {
    return assessments.filter((item) => item.studentId === studentId);
  }

  listSnapshots(studentId: string): ProgressSnapshot[] {
    return snapshots.filter((item) => item.studentId === studentId);
  }

  createPhysical(data: Omit<PhysicalAssessment, 'id'>): PhysicalAssessment {
    const record: PhysicalAssessment = { ...data, id: uuid() };
    assessments.push(record);
    return record;
  }

  createSnapshot(data: Omit<ProgressSnapshot, 'id'>): ProgressSnapshot {
    const record: ProgressSnapshot = { ...data, id: uuid() };
    snapshots.push(record);
    return record;
  }
}

export const assessmentService = new AssessmentService();
