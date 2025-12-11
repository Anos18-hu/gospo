

export enum BehaviorType {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
}

export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum EducationStage {
  ELEMENTARY = 'ELEMENTARY',
  MIDDLE = 'MIDDLE',
  HIGH = 'HIGH',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED'
}

export enum InterviewType {
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  ADMIN = 'ADMIN',
  OTHER = 'OTHER'
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note?: string;
}

export interface InterviewRecord {
  id: string;
  studentId: string;
  date: string;
  type: InterviewType;
  title: string; // 2. سبب المقابلة
  notes: string; // Deprecated or used as short summary
  recommendations?: string; // 6. التوصيات والمتابعة
  // New Detailed Report Fields
  proceedings?: string; // 3. مجريات المقابلة والملاحظات
  assessment?: string; // 4. تقييم أولي للحالة
  actions?: string; // 5. الإجراءات المتخذة
  conclusion?: string; // 7. خاتمة التقرير
  
  // Admin specific fields
  adminRole?: string;     // رتبة الموظف
  adminRelation?: string; // علاقة الموظف بالتلميذ (مثلا: أستاذ المادة، مراقب..)
  // Parent specific fields
  parentName?: string;    // اسم الولي الحاضر
}

export interface BehaviorLog {
  id: string;
  studentId: string;
  type: BehaviorType;
  description: string;
  date: string; // ISO date string
  severity?: Severity; // For negative behaviors
  points: number; // Positive adds, negative subtracts implicitly
  notes?: string;
}

export interface SubjectResult {
  subject: string;
  score: number;
}

export interface AcademicRecord {
  year: string;
  term?: string;
  subjects: SubjectResult[];
  average?: number;
}

export interface FollowUpTask {
  id: string;
  studentId: string;
  title: string;
  deadline: string; // YYYY-MM-DD
  isCompleted: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  nationalId: string; // 16 digit ID
  grade: string;
  stage: EducationStage;
  avatarUrl: string;
  totalPoints: number;
  attendanceRecords?: AttendanceRecord[];
  interviews?: InterviewRecord[];
  // Extended Profile Fields
  dateOfBirth?: string;
  parentName?: string;
  parentPhone?: string;
  enrollmentDate?: string;
  schoolName?: string;
  academicRecords?: AcademicRecord[];
  gender?: string; // 'ذكر' or 'أنثى' from Excel col 4
  isRepeater?: boolean; // from Excel col 5
}

export interface AnalysisResult {
  summary: string;
  triggers: string[];
  strategies: string[];
}

// Scale Related Types
export interface ScaleQuestion {
  id: number;
  text: string;
}

export interface ScaleOption {
  val: number;
  label: string;
}

export interface Scale {
  id: string;
  title: string;
  description: string;
  targetStages: EducationStage[]; // Which stages this scale is valid for
  questions: ScaleQuestion[];
  options?: ScaleOption[]; // Custom Likert options (default is 0-3 if undefined)
  interpretation: (score: number, maxScore: number) => { level: string; color: string; advice: string };
}

export interface ScaleResult {
    scaleId: string;
    scaleTitle: string;
    date: string;
    score: number;
    maxScore: number;
    resultLevel: string;
    advice: string;
}