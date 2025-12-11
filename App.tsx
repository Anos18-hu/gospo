
import React, { useState, useEffect } from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StudentsList from './pages/StudentsList';
// Fix: Import StudentDetail as named export
import { StudentDetail } from './pages/StudentDetail';
import Reports from './pages/Reports';
import Scales from './pages/Scales';
import AcademicResults from './pages/AcademicResults';
import Interviews from './pages/Interviews';
import Documents from './pages/Documents';
import Settings from './pages/Settings';
import WeeklySchedule from './pages/WeeklySchedule';
import AnnualSchedule from './pages/AnnualSchedule'; // Import Annual Schedule
import { Student, BehaviorLog, BehaviorType, Severity, EducationStage, ScaleResult, AttendanceRecord, AttendanceStatus, InterviewRecord, InterviewType, FollowUpTask } from './types';

const App: React.FC = () => {
  // Mock Data Initialization with Algerian Education System
  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: 'ياسين براهيمي', nationalId: '1092837465102938', grade: 'السنة الخامسة ابتدائي', stage: EducationStage.ELEMENTARY, avatarUrl: 'https://picsum.photos/200?random=1', totalPoints: 12, dateOfBirth: '2014-02-15', parentName: 'أحمد براهيمي', attendanceRecords: [], interviews: [] },
    { id: '2', name: 'أمين شرفي', nationalId: '2019384756102938', grade: 'السنة الرابعة متوسط (3)', stage: EducationStage.MIDDLE, avatarUrl: 'https://picsum.photos/200?random=2', totalPoints: -8, dateOfBirth: '2009-06-22', attendanceRecords: [{ id: 'a1', date: '2024-10-01', status: AttendanceStatus.ABSENT, note: 'غياب بدون مبرر' }], interviews: [{ id: 'i1', studentId: '2', date: '2024-10-05', type: InterviewType.PARENT, title: 'تراجع النتائج وتكرار الغياب', notes: 'تم استدعاء الولي لمناقشة تراجع نتائج التلميذ.', recommendations: 'متابعة منزلية + دروس دعم' }] },
    { id: '3', name: 'لينا بن محمد', nationalId: '3092837465564738', grade: '2 ثانوي - علوم تجريبية', stage: EducationStage.HIGH, avatarUrl: 'https://picsum.photos/200?random=3', totalPoints: 25, dateOfBirth: '2007-11-03', attendanceRecords: [], interviews: [] },
    { id: '4', name: 'يوسف عطال', nationalId: '4092837465102938', grade: 'السنة الأولى متوسط (1)', stage: EducationStage.MIDDLE, avatarUrl: 'https://picsum.photos/200?random=4', totalPoints: 2, attendanceRecords: [], interviews: [] },
    { id: '5', name: 'سارة لعمامرة', nationalId: '5092837465102938', grade: 'السنة الثالثة ابتدائي', stage: EducationStage.ELEMENTARY, avatarUrl: 'https://picsum.photos/200?random=5', totalPoints: 18, attendanceRecords: [], interviews: [] },
    { id: '6', name: 'كريم مطمور', nationalId: '6092837465102938', grade: '3 ثانوي - تسيير واقتصاد', stage: EducationStage.HIGH, avatarUrl: 'https://picsum.photos/200?random=6', totalPoints: -3, attendanceRecords: [], interviews: [] },
  ]);

  const [logs, setLogs] = useState<BehaviorLog[]>([
    { id: '101', studentId: '1', type: BehaviorType.POSITIVE, description: 'المشاركة الفعالة في الحصة', date: new Date(Date.now() - 86400000).toISOString(), points: 2 },
    { id: '102', studentId: '2', type: BehaviorType.NEGATIVE, description: 'التشويش داخل القسم', date: new Date(Date.now() - 172800000).toISOString(), points: -2, severity: Severity.LOW },
    { id: '103', studentId: '2', type: BehaviorType.NEGATIVE, description: 'عدم إحضار المئزر', date: new Date(Date.now() - 86400000).toISOString(), points: -2, severity: Severity.LOW },
    { id: '104', studentId: '3', type: BehaviorType.POSITIVE, description: 'مساعدة الزملاء في حل التمارين', date: new Date().toISOString(), points: 3 },
  ]);

  const [tasks, setTasks] = useState<FollowUpTask[]>([
    { id: 't1', studentId: '2', title: 'استدعاء الولي (غيابات متكررة)', deadline: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], isCompleted: false, priority: 'HIGH', createdAt: new Date().toISOString() },
    { id: 't2', studentId: '6', title: 'جلسة توجيه (تحضير البكالوريا)', deadline: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], isCompleted: false, priority: 'MEDIUM', createdAt: new Date().toISOString() }
  ]);

  const [scaleResults, setScaleResults] = useState<Record<string, ScaleResult[]>>({});
  const [institutionName, setInstitutionName] = useState<string>('مؤسسة التربية والتعليم');
  const [counselorName, setCounselorName] = useState<string>('أ. محمد الأحمد');
  const [counselorRole, setCounselorRole] = useState<string>('مستشار التوجيه');
  const [activationCode, setActivationCode] = useState<string>('');
  
  // Initialize logoUrl from localStorage
  const [logoUrl, setLogoUrl] = useState<string | null>(() => {
      return localStorage.getItem('institution_logo');
  });

  const handleAddLog = (newLog: BehaviorLog) => {
    setLogs(prev => [newLog, ...prev]);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? { ...s, ...updatedStudent } : s));
  };

  const handleAddStudent = (studentData: Omit<Student, 'id' | 'totalPoints' | 'avatarUrl'>) => {
    const newStudent: Student = {
      id: Date.now().toString(),
      name: studentData.name,
      nationalId: studentData.nationalId,
      grade: studentData.grade,
      stage: studentData.stage,
      avatarUrl: `https://picsum.photos/200?random=${Date.now()}`,
      totalPoints: 0,
      dateOfBirth: studentData.dateOfBirth,
      parentName: studentData.parentName,
      parentPhone: studentData.parentPhone,
      enrollmentDate: studentData.enrollmentDate,
      attendanceRecords: [],
      interviews: []
    };
    setStudents(prev => [...prev, newStudent]);
  };

  const handleAddAttendance = (studentId: string, record: AttendanceRecord) => {
    setStudents(prev => prev.map(s => {
        if (s.id === studentId) {
            return {
                ...s,
                attendanceRecords: [record, ...(s.attendanceRecords || [])]
            };
        }
        return s;
    }));
  };

  const handleAddInterview = (studentId: string, interview: InterviewRecord) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          interviews: [interview, ...(s.interviews || [])]
        };
      }
      return s;
    }));
  };

  // Task Management Handlers
  const handleAddTask = (task: FollowUpTask) => {
    setTasks(prev => [task, ...prev]);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleResetData = () => {
    setStudents([]);
    setLogs([]);
    setTasks([]);
    setScaleResults({});
    setLogoUrl(null);
    localStorage.removeItem('institution_logo');
  };

  const handleRestoreData = (data: any) => {
      if (data.students) setStudents(data.students);
      if (data.logs) setLogs(data.logs);
      if (data.tasks) setTasks(data.tasks);
      if (data.scaleResults) setScaleResults(data.scaleResults);
      if (data.settings) {
          setInstitutionName(data.settings.institutionName || 'مؤسسة التربية والتعليم');
          setCounselorName(data.settings.counselorName || '');
          setCounselorRole(data.settings.counselorRole || '');
          if (data.settings.logoUrl) {
              setLogoUrl(data.settings.logoUrl);
              localStorage.setItem('institution_logo', data.settings.logoUrl);
          }
      }
  };

  // Helper to determine stage from grade string
  const determineStage = (grade: string): EducationStage => {
      if (!grade) return EducationStage.ELEMENTARY;
      const g = grade.trim();
      if (g.includes('ثانوي')) return EducationStage.HIGH;
      // Handles 'متوسط', 'سنة رابعة متوسط', 'رابعة متوسط', etc.
      if (g.includes('متوسط')) return EducationStage.MIDDLE;
      return EducationStage.ELEMENTARY;
  };

  const handleImportAcademicData = (importedData: Partial<Student>[], schoolName: string) => {
    if (schoolName && schoolName !== 'مؤسسة غير محددة') {
        setInstitutionName(schoolName);
    }
    setStudents(prevStudents => {
        const newStudents = [...prevStudents];
        
        importedData.forEach(imported => {
            const existingIndex = newStudents.findIndex(s => s.name === imported.name);
            const stage = imported.grade ? determineStage(imported.grade) : EducationStage.ELEMENTARY;

            if (existingIndex >= 0) {
                // Update existing student
                const newRecord = imported.academicRecords?.[0];
                let updatedRecords = newStudents[existingIndex].academicRecords || [];
                
                if (newRecord) {
                    // Remove existing record for the same year/term to enable update
                    updatedRecords = updatedRecords.filter(r => !(r.year === newRecord.year && r.term === newRecord.term));
                    updatedRecords.push(newRecord);
                    // Sort by year descending (latest first)
                    updatedRecords.sort((a, b) => b.year.localeCompare(a.year));
                }

                newStudents[existingIndex] = {
                    ...newStudents[existingIndex],
                    schoolName: schoolName,
                    academicRecords: updatedRecords,
                    grade: imported.grade || newStudents[existingIndex].grade, 
                    stage: imported.grade ? stage : newStudents[existingIndex].stage, // Update stage if grade is provided
                    gender: imported.gender || newStudents[existingIndex].gender,
                    isRepeater: imported.isRepeater !== undefined ? imported.isRepeater : newStudents[existingIndex].isRepeater,
                    dateOfBirth: imported.dateOfBirth || newStudents[existingIndex].dateOfBirth
                };
            } else {
                // Add new student
                newStudents.push({
                    id: Date.now().toString() + Math.random().toString().slice(2, 6),
                    name: imported.name || 'Unknown',
                    nationalId: '', 
                    grade: imported.grade || 'غير محدد',
                    stage: stage, // Use determined stage
                    avatarUrl: `https://picsum.photos/200?random=${Date.now()}`,
                    totalPoints: 0,
                    schoolName: schoolName,
                    academicRecords: imported.academicRecords,
                    attendanceRecords: [],
                    interviews: [],
                    gender: imported.gender,
                    isRepeater: imported.isRepeater,
                    dateOfBirth: imported.dateOfBirth
                } as Student);
            }
        });
        
        return newStudents;
    });
  };

  const handleAddScaleResult = (studentId: string, result: ScaleResult) => {
    setScaleResults(prev => ({
        ...prev,
        [studentId]: [...(prev[studentId] || []), result]
    }));
  };
  
  const handleUpdateSettings = (instName: string, counsName: string, counsRole: string, code: string) => {
      setInstitutionName(instName);
      setCounselorName(counsName);
      setCounselorRole(counsRole);
      setActivationCode(code);
      // Optional: Logic to verify code can go here
  };

  const handleUpdateLogo = (url: string | null) => {
      setLogoUrl(url);
      if (url) {
          localStorage.setItem('institution_logo', url);
      } else {
          localStorage.removeItem('institution_logo');
      }
  };

  // Re-calculate points dynamically based on logs for the UI
  const studentsWithPoints = students.map(s => {
      const studentLogs = logs.filter(l => l.studentId === s.id);
      const calculatedPoints = studentLogs.reduce((acc, curr) => acc + curr.points, 0);
      return { ...s, totalPoints: calculatedPoints }; 
  });

  return (
    <MemoryRouter>
      <Layout 
        counselorName={counselorName} 
        counselorRole={counselorRole} 
        logoUrl={logoUrl || undefined}
      >
        <Routes>
          <Route path="/" element={
            <Dashboard 
                students={studentsWithPoints} 
                logs={logs} 
                tasks={tasks}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                institutionName={institutionName} 
                counselorName={counselorName}
                counselorRole={counselorRole}
                onUpdateSettings={handleUpdateSettings}
            />
          } />
          <Route 
            path="/students" 
            element={
              <StudentsList 
                students={studentsWithPoints} 
                onAddStudent={handleAddStudent} 
                onUpdateStudent={handleUpdateStudent} 
              />
            } 
          />
          <Route 
            path="/students/:id" 
            element={
                <StudentDetail 
                    students={studentsWithPoints} 
                    logs={logs} 
                    tasks={tasks}
                    onAddTask={handleAddTask}
                    onToggleTask={handleToggleTask}
                    onDeleteTask={handleDeleteTask}
                    onAddLog={handleAddLog} 
                    onUpdateStudent={handleUpdateStudent} 
                    onAddAttendance={handleAddAttendance}
                    onAddInterview={handleAddInterview}
                />
            } 
          />
          <Route 
            path="/interviews"
            element={
              <Interviews 
                students={studentsWithPoints}
                onAddInterview={handleAddInterview}
              />
            }
          />
          <Route 
            path="/academic"
            element={
                <AcademicResults 
                    students={studentsWithPoints} 
                    logs={logs}
                    onImportData={handleImportAcademicData}
                />
            }
          />
          <Route 
            path="/reports" 
            element={
                <Reports 
                    students={studentsWithPoints} 
                    logs={logs} 
                    scaleResults={scaleResults}
                    logoUrl={logoUrl || undefined}
                />
            } 
          />
          <Route 
            path="/scales" 
            element={
                <Scales 
                    students={studentsWithPoints} 
                    onSaveResult={handleAddScaleResult}
                    logoUrl={logoUrl || undefined}
                />
            } 
          />
          <Route 
            path="/schedule" 
            element={
                <WeeklySchedule />
            } 
          />
          <Route 
            path="/annual-schedule" 
            element={
                <AnnualSchedule />
            } 
          />
          <Route 
            path="/documents" 
            element={
                <Documents />
            } 
          />
          <Route 
            path="/settings" 
            element={
                <Settings 
                    institutionName={institutionName}
                    counselorName={counselorName}
                    counselorRole={counselorRole}
                    activationCode={activationCode}
                    students={students}
                    logs={logs}
                    tasks={tasks}
                    scaleResults={scaleResults}
                    logoUrl={logoUrl}
                    onUpdateSettings={handleUpdateSettings}
                    onUpdateLogo={handleUpdateLogo}
                    onResetData={handleResetData}
                    onRestoreData={handleRestoreData}
                />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </MemoryRouter>
  );
};

export default App;
