
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Minus, BrainCircuit, History, ArrowRight, Loader2, Sparkles, AlertTriangle, Check, Pen, X, Save, CalendarCheck, Clock, CheckCircle2, XCircle, Info, ClipboardList, Phone, User, MessageSquare, Briefcase, Users, FileText, ListTodo, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Student, BehaviorLog, BehaviorType, Severity, AnalysisResult, EducationStage, AttendanceRecord, AttendanceStatus, InterviewRecord, InterviewType, FollowUpTask } from '../types';
import { analyzeStudentBehavior, generateInterventionPlan } from '../services/geminiService';

// Algerian Secondary Education Structure
const SECONDARY_DATA = [
  {
    id: '1AS',
    label: 'السنة الأولى ثانوي',
    tracks: [
      { name: 'جذع مشترك علوم وتكنولوجيا', specialties: [] },
      { name: 'جذع مشترك آداب', specialties: [] }
    ]
  },
  {
    id: '2AS',
    label: 'السنة الثانية ثانوي',
    tracks: [
      { name: 'علوم تجريبية', specialties: [] },
      { name: 'رياضيات', specialties: [] },
      { name: 'تقني رياضي', specialties: ['هندسة ميكانيكية', 'هندسة كهربائية', 'هندسة مدنية', 'هندسة الطرائق'] },
      { name: 'تسيير واقتصاد', specialties: [] },
      { name: 'آداب وفلسفة', specialties: [] },
      { name: 'لغات أجنبية', specialties: [] },
      { name: 'رياضة ودراسة', specialties: [] }
    ]
  },
  {
    id: '3AS',
    label: 'السنة الثالثة ثانوي',
    tracks: [
      { name: 'علوم تجريبية', specialties: [] },
      { name: 'رياضيات', specialties: [] },
      { name: 'تقني رياضي', specialties: ['هندسة ميكانيكية', 'هندسة كهربائية', 'هندسة مدنية', 'هندسة الطرائق'] },
      { name: 'تسيير واقتصاد', specialties: [] },
      { name: 'آداب وفلسفة', specialties: [] },
      { name: 'لغات أجنبية', specialties: [] },
      { name: 'رياضة ودراسة', specialties: [] }
    ]
  }
];

// Mock Markdown renderer
const SimpleMarkdown = ({ content }: { content: string }) => {
    return <div className="prose prose-sm max-w-none whitespace-pre-line text-gray-700">{content}</div>;
};

interface StudentDetailProps {
  students: Student[];
  logs: BehaviorLog[];
  tasks: FollowUpTask[];
  onAddTask: (task: FollowUpTask) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddLog: (log: BehaviorLog) => void;
  onUpdateStudent: (student: Student) => void;
  onAddAttendance: (studentId: string, record: AttendanceRecord) => void;
  onAddInterview: (studentId: string, interview: InterviewRecord) => void;
}

export const StudentDetail: React.FC<StudentDetailProps> = ({ students, logs, tasks, onAddTask, onToggleTask, onDeleteTask, onAddLog, onUpdateStudent, onAddAttendance, onAddInterview }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const student = students.find(s => s.id === id);
  const studentLogs = logs.filter(l => l.studentId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const studentTasks = tasks.filter(t => t.studentId === id).sort((a, b) => {
      if (a.isCompleted === b.isCompleted) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      return a.isCompleted ? 1 : -1;
  });

  const [activeTab, setActiveTab] = useState<'history' | 'add' | 'analysis' | 'attendance' | 'interviews' | 'tasks'>('history');
  
  // Form State
  const [logType, setLogType] = useState<BehaviorType>(BehaviorType.POSITIVE);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>(Severity.LOW);
  const [points, setPoints] = useState(1);
  const [showToast, setShowToast] = useState(false);

  // Call Confirmation State
  const [showCallConfirm, setShowCallConfirm] = useState(false);

  // Edit Student State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNationalId, setEditNationalId] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editStage, setEditStage] = useState<EducationStage>(EducationStage.ELEMENTARY);
  const [editAvatar, setEditAvatar] = useState('');
  const [editDateOfBirth, setEditDateOfBirth] = useState('');
  const [editParentName, setEditParentName] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  
  // Secondary Education Helpers
  const [secYear, setSecYear] = useState('1AS');
  const [secTrack, setSecTrack] = useState('');
  const [secSpec, setSecSpec] = useState('');

  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [aiContext, setAiContext] = useState('');
  const [interventionPlan, setInterventionPlan] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Attendance State
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>(AttendanceStatus.PRESENT);
  const [attendanceNote, setAttendanceNote] = useState('');

  // Interview State
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [interviewData, setInterviewData] = useState({
      date: new Date().toISOString().split('T')[0],
      type: InterviewType.STUDENT,
      title: '',
      proceedings: '',
      assessment: '',
      actions: '',
      recommendations: '',
      conclusion: '',
      adminRole: '',
      adminRelation: '',
      parentName: ''
  });

  // Task State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
      title: '',
      deadline: new Date().toISOString().split('T')[0],
      priority: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW'
  });

  // Initialize edit form when student loads or modal opens
  useEffect(() => {
    if (student) {
        setEditName(student.name);
        setEditNationalId(student.nationalId || '');
        setEditGrade(student.grade);
        setEditStage(student.stage);
        setEditAvatar(student.avatarUrl);
        setEditDateOfBirth(student.dateOfBirth || '');
        setEditParentName(student.parentName || '');
        setEditParentPhone(student.parentPhone || '');

        // If secondary, try to parse existing grade to fill helpers
        if (student.stage === EducationStage.HIGH) {
            const g = student.grade;
            let y = '1AS';
            let t = '';
            let s = '';
            
            if (g.includes('الثانية')) y = '2AS';
            else if (g.includes('الثالثة')) y = '3AS';

            const yearObj = SECONDARY_DATA.find(obj => obj.id === y);
            if (yearObj) {
                const foundTrack = yearObj.tracks.find(tr => g.includes(tr.name));
                if (foundTrack) {
                    t = foundTrack.name;
                    const foundSpec = foundTrack.specialties.find(sp => g.includes(sp));
                    if (foundSpec) s = foundSpec;
                }
            }
            setSecYear(y);
            setSecTrack(t);
            setSecSpec(s);
        }
    }
  }, [student, isEditing]);

  // Update editGrade when secondary helpers change
  useEffect(() => {
      if (editStage === EducationStage.HIGH) {
          const yearLabel = SECONDARY_DATA.find(y => y.id === secYear)?.label || '';
          let fullGrade = `${yearLabel} ${secTrack}`;
          if (secSpec) {
              fullGrade += ` - ${secSpec}`;
          }
          setEditGrade(fullGrade);
      }
  }, [secYear, secTrack, secSpec, editStage]);

  // Prepare Chart Data
  const chartData = useMemo(() => {
    // Sort logs by date ascending for the chart
    const sorted = [...studentLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let cumulative = 0;
    return sorted.map(log => {
      cumulative += log.points;
      return {
        date: new Date(log.date).toLocaleDateString('ar-EG-u-nu-latn'),
        fullDate: new Date(log.date).toLocaleDateString('ar-EG'),
        score: cumulative,
        type: log.type
      };
    });
  }, [studentLogs]);

  // Attendance Statistics (Automated Calculation)
  const attendanceStats = useMemo(() => {
    const records = student?.attendanceRecords || [];
    
    // 1. Calculate Start Date (Enrollment or Sept 1st of current academic year)
    const today = new Date();
    const currentYear = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1; // Academic year starts in Sept
    const academicStart = new Date(`${currentYear}-09-01`); // Sept 1st
    
    // Use enrollment date if available and later than academic start, otherwise default to academic start
    let startDate = academicStart;
    if (student?.enrollmentDate) {
        const enrollDate = new Date(student.enrollmentDate);
        if (enrollDate > academicStart) startDate = enrollDate;
    }

    // 2. Count Total Theoretical School Days (excluding Fri/Sat)
    let totalSchoolDays = 0;
    let loopDate = new Date(startDate);
    
    // Iterate from start date to today
    while (loopDate <= today) {
        const day = loopDate.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
        // Algeria Weekend: Friday (5) and Saturday (6)
        if (day !== 5 && day !== 6) {
            totalSchoolDays++;
        }
        loopDate.setDate(loopDate.getDate() + 1);
    }

    // 3. Count Recorded Absences/Lates
    const absent = records.filter(r => r.status === AttendanceStatus.ABSENT).length;
    const excused = records.filter(r => r.status === AttendanceStatus.EXCUSED).length;
    const late = records.filter(r => r.status === AttendanceStatus.LATE).length;

    // 4. Calculate Actual Presence
    const totalAbsences = absent + excused;
    const calculatedPresence = Math.max(0, totalSchoolDays - totalAbsences);

    // 5. Calculate Rate
    const rate = totalSchoolDays > 0 ? Math.round((calculatedPresence / totalSchoolDays) * 100) : 100;

    return { 
        total: totalSchoolDays, 
        present: calculatedPresence, 
        absent, 
        late, 
        excused, 
        rate 
    };
  }, [student?.attendanceRecords, student?.enrollmentDate]);

  if (!student) {
    return <div className="p-8 text-center">التلميذ غير موجود</div>;
  }

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: BehaviorLog = {
      id: Date.now().toString(),
      studentId: student.id,
      type: logType,
      description,
      date: new Date().toISOString(),
      severity: logType === BehaviorType.NEGATIVE ? severity : undefined,
      points: logType === BehaviorType.POSITIVE ? Math.abs(points) : -Math.abs(points),
    };
    onAddLog(newLog);
    setDescription('');
    setPoints(1);
    setActiveTab('history');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
      e.preventDefault();
      if (editNationalId.length !== 16) {
          alert('الرقم المدرسي الوطني يجب أن يتكون من 16 رقمًا.');
          return;
      }

      onUpdateStudent({
          ...student,
          name: editName,
          nationalId: editNationalId,
          grade: editGrade,
          stage: editStage,
          avatarUrl: editAvatar,
          dateOfBirth: editDateOfBirth,
          parentName: editParentName,
          parentPhone: editParentPhone
      });
      setIsEditing(false);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeStudentBehavior(student.name, studentLogs, aiContext);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  const handleGeneratePlan = async (behaviorDesc: string) => {
      setIsGeneratingPlan(true);
      const plan = await generateInterventionPlan(student.name, behaviorDesc);
      setInterventionPlan(plan);
      setIsGeneratingPlan(false);
  }

  const handleSubmitAttendance = (e: React.FormEvent) => {
      e.preventDefault();
      onAddAttendance(student.id, {
          id: Date.now().toString(),
          date: attendanceDate,
          status: attendanceStatus,
          note: attendanceNote
      });
      setAttendanceNote('');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddInterviewSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onAddInterview(student.id, {
          id: Date.now().toString(),
          studentId: student.id,
          ...interviewData,
          notes: interviewData.proceedings, // Sync for older components
          adminRole: interviewData.type === InterviewType.ADMIN ? interviewData.adminRole : undefined,
          adminRelation: interviewData.type === InterviewType.ADMIN ? interviewData.adminRelation : undefined,
          parentName: interviewData.type === InterviewType.PARENT ? interviewData.parentName : undefined
      });
      setIsInterviewModalOpen(false);
      setInterviewData({
          date: new Date().toISOString().split('T')[0],
          type: InterviewType.STUDENT,
          title: '',
          proceedings: '',
          assessment: '',
          actions: '',
          recommendations: '',
          conclusion: '',
          adminRole: '',
          adminRelation: '',
          parentName: ''
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
  };
  
  const openInterviewModal = () => {
      // Pre-fill parent name if exists and set type
      setInterviewData(prev => ({
          ...prev,
          parentName: student.parentName || ''
      }));
      setIsInterviewModalOpen(true);
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskData.title) return;
    onAddTask({
        id: Date.now().toString(),
        studentId: student.id,
        title: newTaskData.title,
        deadline: newTaskData.deadline,
        priority: newTaskData.priority,
        isCompleted: false,
        createdAt: new Date().toISOString()
    });
    setIsTaskModalOpen(false);
    setNewTaskData({
        title: '',
        deadline: new Date().toISOString().split('T')[0],
        priority: 'MEDIUM'
    });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSendSMS = () => {
      if (!student.parentPhone) return;
      const message = `ولي الأمر المحترم، نعلمكم بأن ابنكم ${student.name} بحاجة لمتابعة بخصوص سلوكه في المدرسة. يرجى التواصل معنا.`;
      const encodedMsg = encodeURIComponent(message);
      window.open(`sms:${student.parentPhone}?body=${encodedMsg}`, '_blank');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
  };

  const handleCallParent = () => {
      if (!student.parentPhone) return;
      setShowCallConfirm(true);
  };

  // Helper for rendering secondary form parts
  const activeSecYear = SECONDARY_DATA.find(y => y.id === secYear);
  const activeSecTrack = activeSecYear?.tracks.find(t => t.name === secTrack);

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative">
      {/* Header */}
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowRight size={18} className="ml-1" />
        عودة للقائمة
      </button>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-6 relative">
        <button 
            onClick={() => setIsEditing(true)}
            className="absolute top-4 left-4 p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="تعديل بيانات التلميذ"
        >
            <Pen size={20} />
        </button>

        <img src={student.avatarUrl} alt={student.name} className="w-24 h-24 rounded-full object-cover border-4 border-gray-50" />
        <div className="flex-1 text-center md:text-right">
          <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
          <div className="flex flex-col md:flex-row gap-2 mt-1 items-center md:items-start text-gray-500">
             <span>{student.grade}</span>
             <span className="hidden md:inline">•</span>
             <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-600" dir="ltr">{student.nationalId}</span>
             <span className="hidden md:inline">•</span>
             <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                 {student.stage === EducationStage.ELEMENTARY ? 'الطور الابتدائي' : 
                  student.stage === EducationStage.MIDDLE ? 'الطور المتوسط' : 'الطور الثانوي'}
             </span>
          </div>
          
          <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
             <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-100 text-center">
                <span className="block text-xs text-gray-500">مجموع النقاط</span>
                <span className={`text-xl font-bold ${student.totalPoints >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {student.totalPoints > 0 ? '+' : ''}{student.totalPoints}
                </span>
             </div>
             <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-100 text-center">
                <span className="block text-xs text-gray-500">نسبة الحضور</span>
                <span className={`text-xl font-bold ${attendanceStats.rate >= 90 ? 'text-green-600' : attendanceStats.rate >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                    %{attendanceStats.rate}
                </span>
             </div>
          </div>
          
          {/* Contact Buttons */}
          {student.parentPhone && (
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                  <button 
                    onClick={handleSendSMS}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 bg-gray-50 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors border border-gray-200"
                    title="إرسال رسالة نصية"
                  >
                      <MessageSquare size={14} /> مراسلة الولي
                  </button>
                  <button 
                    onClick={handleCallParent}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 bg-gray-50 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors border border-gray-200"
                    title="اتصال هاتفي"
                  >
                      <Phone size={14} /> اتصال بالولي
                  </button>
              </div>
          )}
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => { setActiveTab('add'); setLogType(BehaviorType.POSITIVE); }}
                className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors font-medium"
            >
                <Plus size={18} /> تسجيل إيجابي
            </button>
            <button 
                onClick={() => { setActiveTab('add'); setLogType(BehaviorType.NEGATIVE); }}
                className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium"
            >
                <Minus size={18} /> تسجيل سلبي
            </button>
        </div>
      </div>

      {/* Cumulative Trend Chart */}
      {chartData.length > 1 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-fade-in">
           <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
               <History size={20} className="text-primary-500" />
               تطور السلوك (المؤشر التراكمي)
           </h3>
           <div className="h-64 w-full" dir="ltr">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#9ca3af" tickLine={false} axisLine={false} />
                  <YAxis tick={{fontSize: 12}} stroke="#9ca3af" tickLine={false} axisLine={false} />
                  <Tooltip 
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                     labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#0284c7" 
                    strokeWidth={3}
                    dot={{ fill: '#0284c7', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      )}

      {/* Call Confirmation Modal */}
      {showCallConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-fade-in transform scale-100 transition-transform">
             <div className="flex justify-center mb-4 text-green-600">
                <div className="bg-green-100 p-4 rounded-full">
                    <Phone size={32} />
                </div>
             </div>
             <h3 className="text-lg font-bold text-center text-gray-900 mb-2">تأكيد الاتصال</h3>
             <p className="text-center text-gray-500 mb-6 text-sm">
                هل تود الاتصال بولي الأمر على الرقم <br />
                <span className="font-mono font-bold text-gray-800 text-lg mt-2 block" dir="ltr">{student.parentPhone}</span>
             </p>
             <div className="flex gap-3">
                <button 
                  onClick={() => {
                      window.location.href = `tel:${student.parentPhone}`;
                      setShowCallConfirm(false);
                  }}
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-bold hover:bg-green-700 transition-colors"
                >
                  نعم، اتصال
                </button>
                <button 
                  onClick={() => setShowCallConfirm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
                    <h3 className="text-lg font-bold text-gray-900">تعديل بيانات التلميذ</h3>
                    <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">اسم التلميذ</label>
                        <input 
                            type="text" 
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">الرقم المدرسي الوطني (16 رقم)</label>
                        <input 
                            type="text" 
                            required
                            value={editNationalId}
                            onChange={(e) => setEditNationalId(e.target.value.replace(/\D/g, '').slice(0, 16))}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono dir-ltr text-right tracking-widest"
                            dir="ltr"
                        />
                        <div className="flex justify-end mt-1">
                            <span className={`text-xs ${editNationalId.length === 16 ? 'text-green-600' : 'text-gray-400'}`}>
                                {editNationalId.length} / 16
                            </span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">الطور الدراسي</label>
                        <select 
                            value={editStage}
                            onChange={(e) => setEditStage(e.target.value as EducationStage)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value={EducationStage.ELEMENTARY}>الطور الابتدائي</option>
                            <option value={EducationStage.MIDDLE}>الطور المتوسط</option>
                            <option value={EducationStage.HIGH}>الطور الثانوي</option>
                        </select>
                    </div>
                    
                    {editStage === EducationStage.HIGH ? (
                        <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">المستوى</label>
                                <select 
                                    value={secYear}
                                    onChange={(e) => {
                                        setSecYear(e.target.value);
                                        setSecTrack('');
                                        setSecSpec('');
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 text-sm"
                                >
                                    {SECONDARY_DATA.map(year => (
                                        <option key={year.id} value={year.id}>{year.label}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {activeSecYear && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">الشعبة / الجذع</label>
                                    <select 
                                        value={secTrack}
                                        onChange={(e) => {
                                            setSecTrack(e.target.value);
                                            setSecSpec('');
                                        }}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 text-sm"
                                    >
                                        <option value="">-- اختر الشعبة --</option>
                                        {activeSecYear.tracks.map(track => (
                                            <option key={track.name} value={track.name}>{track.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {activeSecTrack && activeSecTrack.specialties.length > 0 && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">التخصص</label>
                                    <select 
                                        value={secSpec}
                                        onChange={(e) => setSecSpec(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 text-sm"
                                    >
                                        <option value="">-- اختر التخصص --</option>
                                        {activeSecTrack.specialties.map(spec => (
                                            <option key={spec} value={spec}>{spec}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <p className="text-[10px] text-gray-400">القسم الناتج: {editGrade}</p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">القسم</label>
                            <input 
                                type="text" 
                                required
                                value={editGrade}
                                onChange={(e) => setEditGrade(e.target.value)}
                                placeholder="مثال: 1 متوسط 3"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الميلاد</label>
                        <input 
                            type="date"
                            value={editDateOfBirth}
                            onChange={(e) => setEditDateOfBirth(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">رابط الصورة (Avatar URL)</label>
                        <input 
                            type="url" 
                            value={editAvatar}
                            onChange={(e) => setEditAvatar(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left"
                            dir="ltr"
                        />
                    </div>

                    <div className="border-t border-gray-100 pt-4 mt-2">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">معلومات الولي</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">اسم الولي</label>
                                <div className="relative">
                                    <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input 
                                        type="text"
                                        value={editParentName}
                                        onChange={(e) => setEditParentName(e.target.value)}
                                        placeholder="اسم الأب أو الوصي"
                                        className="w-full pr-9 pl-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                                <div className="relative">
                                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input 
                                        type="tel"
                                        value={editParentPhone}
                                        onChange={(e) => setEditParentPhone(e.target.value)}
                                        placeholder="0X XX XX XX XX"
                                        className="w-full pr-9 pl-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button 
                            type="submit" 
                            className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg font-bold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Save size={18} /> حفظ التغييرات
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setIsEditing(false)}
                            className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                        >
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex gap-8 min-w-max" aria-label="Tabs">
          {[
            { id: 'history', name: 'سجل السلوك', icon: History },
            { id: 'attendance', name: 'المواظبة والغياب', icon: CalendarCheck },
            { id: 'interviews', name: 'المقابلات', icon: MessageSquare },
            { id: 'tasks', name: 'خطة العمل', icon: ListTodo },
            { id: 'add', name: 'إضافة ملاحظة', icon: Plus },
            { id: 'analysis', name: 'تحليل الذكاء الاصطناعي', icon: BrainCircuit },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <tab.icon className={`ml-2 -mr-0.5 h-5 w-5 ${activeTab === tab.id ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'history' && (
           <div className="space-y-4">
               {studentLogs.length === 0 ? (
                   <p className="text-gray-500 text-center py-10">لا توجد سجلات بعد.</p>
               ) : (
                   studentLogs.map(log => (
                       <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4 animate-fade-in">
                           <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${log.type === BehaviorType.POSITIVE ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                               {log.type === BehaviorType.POSITIVE ? <Plus size={20} /> : <Minus size={20} />}
                           </div>
                           <div className="flex-1">
                               <div className="flex justify-between items-start">
                                   <h3 className="font-semibold text-gray-900">{log.description}</h3>
                                   <span className="text-sm text-gray-400 font-mono" dir="ltr">{new Date(log.date).toLocaleDateString('ar-EG-u-nu-latn')}</span>
                               </div>
                               <div className="flex items-center gap-3 mt-2">
                                   <span className={`text-xs px-2 py-1 rounded-md font-medium ${log.type === BehaviorType.POSITIVE ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                       {log.type === BehaviorType.POSITIVE ? 'سلوك إيجابي' : 'سلوك سلبي'}
                                   </span>
                                   {log.severity && (
                                       <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                                           الإجراء: {log.severity === Severity.HIGH ? 'توبيخ / مجلس تأديب' : log.severity === Severity.MEDIUM ? 'إنذار كتابي' : 'تنبيه شفهي'}
                                       </span>
                                   )}
                                   <span className={`text-sm font-bold mr-auto ${log.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                     {log.points > 0 ? '+' : ''}{log.points} نقطة
                                   </span>
                               </div>
                           </div>
                       </div>
                   ))
               )}
           </div>
        )}

        {activeTab === 'tasks' && (
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div>
                        <h3 className="font-bold text-gray-900">خطة العمل والمتابعة</h3>
                        <p className="text-sm text-gray-500">المهام والإجراءات الواجب اتخاذها لهذا التلميذ</p>
                    </div>
                    <button 
                        onClick={() => setIsTaskModalOpen(true)}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-700 flex items-center gap-2"
                    >
                        <Plus size={16} /> مهمة جديدة
                    </button>
                </div>

                <div className="space-y-3">
                    {studentTasks.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ListTodo size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">لا توجد مهام</h3>
                            <p className="text-gray-500 text-sm">لم يتم تسجيل أي إجراءات متابعة بعد.</p>
                        </div>
                    ) : (
                        studentTasks.map(task => (
                            <div key={task.id} className={`p-4 rounded-xl border ${task.isCompleted ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200'} transition-all hover:shadow-sm group`}>
                                <div className="flex items-start gap-4">
                                    <button 
                                        onClick={() => onToggleTask(task.id)}
                                        className={`mt-1 shrink-0 ${task.isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}`}
                                    >
                                        <CheckCircle2 size={24} className={task.isCompleted ? 'fill-green-100' : ''} />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold text-lg text-gray-900 ${task.isCompleted ? 'line-through text-gray-500' : ''}`}>
                                            {task.title}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                                task.priority === 'HIGH' ? 'bg-red-50 text-red-700' :
                                                task.priority === 'MEDIUM' ? 'bg-orange-50 text-orange-700' :
                                                'bg-blue-50 text-blue-700'
                                            }`}>
                                                {task.priority === 'HIGH' ? 'عاجل' : task.priority === 'MEDIUM' ? 'متوسط' : 'عادي'}
                                            </span>
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <Clock size={12} /> يستحق في: {new Date(task.deadline).toLocaleDateString('ar-EG')}
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => onDeleteTask(task.id)}
                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {activeTab === 'attendance' && (
            <div className="space-y-6 animate-fade-in">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-xs text-gray-500 mb-1">نسبة الحضور</p>
                        <p className={`text-2xl font-bold ${attendanceStats.rate >= 90 ? 'text-green-600' : attendanceStats.rate >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                            %{attendanceStats.rate}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-xs text-gray-500 mb-1">عدد أيام الحضور (الفعلي)</p>
                        <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-xs text-gray-500 mb-1">عدد الغيابات</p>
                        <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-xs text-gray-500 mb-1">إجمالي الأيام</p>
                        <p className="text-2xl font-bold text-gray-600">{attendanceStats.total}</p>
                    </div>
                </div>

                {/* Add Attendance Form */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-primary-500" /> تسجيل الغياب / التأخر
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">يتم احتساب الحضور تلقائياً. يرجى تسجيل حالات الغياب أو التأخر فقط.</p>
                    <form onSubmit={handleSubmitAttendance} className="grid md:grid-cols-2 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                            <input 
                                type="date" 
                                value={attendanceDate}
                                onChange={(e) => setAttendanceDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 text-sm"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAttendanceStatus(AttendanceStatus.ABSENT)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium border ${attendanceStatus === AttendanceStatus.ABSENT ? 'bg-red-50 border-red-500 text-red-700' : 'border-gray-200 text-gray-600'}`}
                                >
                                    غائب
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAttendanceStatus(AttendanceStatus.LATE)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium border ${attendanceStatus === AttendanceStatus.LATE ? 'bg-orange-50 border-orange-500 text-orange-700' : 'border-gray-200 text-gray-600'}`}
                                >
                                    متأخر
                                </button>
                                 <button
                                    type="button"
                                    onClick={() => setAttendanceStatus(AttendanceStatus.EXCUSED)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium border ${attendanceStatus === AttendanceStatus.EXCUSED ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 text-gray-600'}`}
                                >
                                    مبرر
                                </button>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظة / سبب الغياب</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={attendanceNote}
                                    onChange={(e) => setAttendanceNote(e.target.value)}
                                    placeholder="اختياري..."
                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 text-sm"
                                />
                                <button type="submit" className="bg-primary-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-700 whitespace-nowrap">
                                    حفظ
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* History List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">سجل الغياب والتأخرات</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-6 py-3">التاريخ</th>
                                    <th className="px-6 py-3">الحالة</th>
                                    <th className="px-6 py-3">الملاحظة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {student.attendanceRecords && student.attendanceRecords.length > 0 ? (
                                    [...student.attendanceRecords].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
                                        <tr key={record.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono" dir="ltr">
                                                {record.date}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                    ${record.status === AttendanceStatus.PRESENT ? 'bg-green-100 text-green-800' : 
                                                      record.status === AttendanceStatus.ABSENT ? 'bg-red-100 text-red-800' : 
                                                      record.status === AttendanceStatus.LATE ? 'bg-orange-100 text-orange-800' :
                                                      'bg-blue-100 text-blue-800'}`}>
                                                    {record.status === AttendanceStatus.PRESENT ? 'حاضر' : 
                                                     record.status === AttendanceStatus.ABSENT ? 'غائب' : 
                                                     record.status === AttendanceStatus.LATE ? 'متأخر' : 'غياب مبرر'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {record.note || '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500 text-sm">
                                            سجل المواظبة نظيف (لا توجد غيابات مسجلة).
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'interviews' && (
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div>
                        <h3 className="font-bold text-gray-900">سجل المقابلات الفردية</h3>
                        <p className="text-sm text-gray-500">توثيق الجلسات مع التلميذ أو الولي</p>
                    </div>
                    <button 
                        onClick={openInterviewModal}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-700 flex items-center gap-2"
                    >
                        <Plus size={16} /> مقابلة جديدة
                    </button>
                </div>

                <div className="space-y-4">
                    {student.interviews && student.interviews.length > 0 ? (
                        [...student.interviews].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(interview => (
                            <div key={interview.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            interview.type === InterviewType.PARENT ? 'bg-purple-100 text-purple-600' :
                                            interview.type === InterviewType.ADMIN ? 'bg-orange-100 text-orange-600' :
                                            'bg-blue-100 text-blue-600'
                                        }`}>
                                            <MessageSquare size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{interview.title}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                    interview.type === InterviewType.PARENT ? 'bg-purple-50 text-purple-700' :
                                                    interview.type === InterviewType.ADMIN ? 'bg-orange-50 text-orange-700' :
                                                    'bg-blue-50 text-blue-700'
                                                }`}>
                                                    {interview.type === InterviewType.PARENT ? 'ولي الأمر' : 
                                                    interview.type === InterviewType.ADMIN ? 'إداري' : 'تلميذ'}
                                                </span>
                                                <span className="text-xs text-gray-400 font-mono">{new Date(interview.date).toLocaleDateString('ar-EG')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {interview.type === InterviewType.PARENT && interview.parentName && (
                                    <div className="flex items-center gap-2 text-xs text-purple-800 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 mb-3 w-fit">
                                        <Users size={12} /> <strong>الولي الحاضر:</strong> {interview.parentName}
                                    </div>
                                )}

                                {interview.type === InterviewType.ADMIN && (interview.adminRole || interview.adminRelation) && (
                                    <div className="flex items-center gap-3 text-xs text-orange-800 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 mb-3 w-fit">
                                        {interview.adminRole && (
                                            <span className="flex items-center gap-1">
                                                <Briefcase size={12} /> <strong>الرتبة:</strong> {interview.adminRole}
                                            </span>
                                        )}
                                        {interview.adminRelation && (
                                            <>
                                              <span className="text-orange-300">|</span>
                                              <span><strong>العلاقة:</strong> {interview.adminRelation}</span>
                                            </>
                                        )}
                                    </div>
                                )}

                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg leading-relaxed mb-2">
                                    {interview.proceedings || interview.notes}
                                </p>

                                {interview.assessment && (
                                    <div className="mt-2 bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800">
                                        <strong>التقييم الأولي:</strong> {interview.assessment}
                                    </div>
                                )}
                                {interview.actions && (
                                    <div className="mt-2 bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-yellow-800">
                                        <strong>الإجراءات:</strong> {interview.actions}
                                    </div>
                                )}

                                {interview.recommendations && (
                                    <div className="mt-2 flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                                        <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                                        <span><strong>التوصيات:</strong> {interview.recommendations}</span>
                                    </div>
                                )}

                                {interview.conclusion && (
                                    <div className="mt-2 bg-gray-100 p-3 rounded-lg border border-gray-200 text-sm text-gray-800">
                                        <strong>الخاتمة:</strong> {interview.conclusion}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageSquare size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">لا توجد مقابلات</h3>
                            <p className="text-gray-500 text-sm">لم يتم تسجيل أي جلسة متابعة لهذا التلميذ بعد.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'add' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
                <div className="mb-6 border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <ClipboardList className="text-primary-600" size={24} />
                        تسجيل ملاحظة سلوكية
                    </h3>
                    <p className="text-sm text-gray-500">قم بتعبئة النموذج التالي لإضافة سجل جديد لملف التلميذ.</p>
                </div>

                <form onSubmit={handleAddLog} className="space-y-6">
                    <div className={`p-4 rounded-xl border-2 transition-all ${logType === BehaviorType.POSITIVE ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                         <h4 className={`text-center font-bold mb-4 ${logType === BehaviorType.POSITIVE ? 'text-green-800' : 'text-red-800'}`}>
                             {logType === BehaviorType.POSITIVE ? 'نوع السلوك: إيجابي (+)' : 'نوع السلوك: سلبي (-)'}
                         </h4>
                         <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setLogType(BehaviorType.POSITIVE)}
                                className={`flex-1 py-3 rounded-lg font-bold transition-all ${logType === BehaviorType.POSITIVE ? 'bg-green-500 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                            >
                                <Plus className="inline mr-1" size={18} /> إيجابي
                            </button>
                            <button
                                type="button"
                                onClick={() => setLogType(BehaviorType.NEGATIVE)}
                                className={`flex-1 py-3 rounded-lg font-bold transition-all ${logType === BehaviorType.NEGATIVE ? 'bg-red-500 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                            >
                                <Minus className="inline mr-1" size={18} /> سلبي
                            </button>
                         </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">وصف السلوك</label>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="مثال: نسيان المئزر، التأخر عن تحية العلم، المشاركة الفعالة..."
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    {logType === BehaviorType.NEGATIVE && (
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">الإجراء المتخذ / الحدة</label>
                             <select 
                                value={severity}
                                onChange={(e) => setSeverity(e.target.value as Severity)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                             >
                                 <option value={Severity.LOW}>تنبيه شفهي (مخالفة بسيطة)</option>
                                 <option value={Severity.MEDIUM}>إنذار كتابي / استدعاء الولي</option>
                                 <option value={Severity.HIGH}>توبيخ / إحالة لمجلس التأديب</option>
                             </select>
                        </div>
                    )}

                    {/* Points Section */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700 text-center">
                            {logType === BehaviorType.POSITIVE ? 'نقاط الاستحقاق' : 'نقاط الخصم'}
                        </label>
                        
                        <div className="flex items-center justify-center gap-3">
                            {[1, 2, 3, 5].map(val => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setPoints(val)}
                                    className={`w-12 h-12 rounded-xl font-bold text-lg transition-all flex items-center justify-center ${
                                        points === val
                                            ? (logType === BehaviorType.POSITIVE 
                                                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 scale-110' 
                                                : 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110')
                                            : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:scale-105'
                                    }`}
                                >
                                    {logType === BehaviorType.NEGATIVE ? '-' : '+'}{val}
                                </button>
                            ))}
                        </div>

                        <div className="relative max-w-[180px] mx-auto">
                            <button
                                type="button"
                                onClick={() => setPoints(Math.max(1, points - 1))}
                                className={`absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-white border hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors z-10`}
                            >
                                <Minus size={16} />
                            </button>
                            
                            <div className="relative w-full">
                                {logType === BehaviorType.NEGATIVE && (
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-red-600 z-10 pointer-events-none">-</span>
                                )}
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={points}
                                    onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value) || 0))}
                                    className={`w-full px-12 py-4 text-center text-3xl font-black rounded-2xl border-2 focus:ring-4 focus:ring-opacity-20 outline-none transition-all shadow-sm ${
                                        logType === BehaviorType.POSITIVE 
                                            ? 'border-green-200 text-green-600 focus:border-green-500 focus:ring-green-500 bg-white' 
                                            : 'border-red-200 text-red-600 focus:border-red-500 focus:ring-red-500 bg-white'
                                    }`}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setPoints(Math.min(20, points + 1))}
                                className={`absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-white border hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors z-10`}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <p className={`text-center text-sm font-bold ${logType === BehaviorType.POSITIVE ? 'text-green-600' : 'text-red-600'}`}>
                            {logType === BehaviorType.NEGATIVE ? 'سيتم خصم' : 'سيتم إضافة'} {points} {points === 1 ? 'نقطة' : 'نقاط'}
                        </p>
                    </div>

                    <button type="submit" className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2 text-lg">
                        <Plus size={24} /> إضافة ملاحظة
                    </button>
                </form>
            </div>
        )}

        {activeTab === 'analysis' && (
            <div className="space-y-6">
                {!analysisResult ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BrainCircuit size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">تحليل السلوك بالذكاء الاصطناعي</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-6">
                            سيقوم النموذج بتحليل سجلات التلميذ لتحديد الأنماط السلوكية واقتراح استراتيجيات تربوية مخصصة.
                        </p>

                        <div className="max-w-lg mx-auto mb-6 px-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                تعليمات إضافية للتحليل (اختياري)
                            </label>
                            <textarea
                                value={aiContext}
                                onChange={(e) => setAiContext(e.target.value)}
                                placeholder="أضف أي ملاحظات أو أسئلة محددة تريد من الذكاء الاصطناعي التركيز عليها..."
                                className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm min-h-[80px]"
                            />
                        </div>

                        <button 
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || studentLogs.length < 3}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAnalyzing ? (
                                <>
                                  <Loader2 className="animate-spin" size={20} /> جاري التحليل...
                                </>
                            ) : (
                                <>
                                  <Sparkles size={20} /> بدء التحليل
                                </>
                            )}
                        </button>
                        {studentLogs.length < 3 && <p className="text-xs text-orange-500 mt-3">يجب توفر 3 سجلات على الأقل للتحليل.</p>}
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in">
                        {/* Summary Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-6 py-4">
                                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                    <BrainCircuit size={20} /> تقرير التحليل السلوكي
                                </h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-2">1. الملخص السلوكي</h4>
                                    <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        {analysisResult.summary}
                                    </p>
                                </div>
                                
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                            <AlertTriangle size={18} className="text-orange-500" /> المحفزات المحتملة
                                        </h4>
                                        <ul className="space-y-2">
                                            {analysisResult.triggers.map((trigger, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-gray-700 bg-orange-50 p-3 rounded-lg text-sm">
                                                    <span className="mt-1.5 w-1.5 h-1.5 bg-orange-400 rounded-full shrink-0"></span>
                                                    {trigger}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                            <Sparkles size={18} className="text-green-500" /> استراتيجيات مقترحة
                                        </h4>
                                        <ul className="space-y-2">
                                            {analysisResult.strategies.map((strategy, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-gray-700 bg-green-50 p-3 rounded-lg text-sm">
                                                    <span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full shrink-0"></span>
                                                    {strategy}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Intervention Plan Generator */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                             <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                 <FileText size={20} className="text-indigo-600" /> إنشاء خطة تدخل فردية
                             </h3>
                             <p className="text-sm text-gray-500 mb-4">
                                 يمكن للذكاء الاصطناعي إنشاء خطة تدخل مخصصة بناءً على سلوك سلبي محدد.
                             </p>
                             
                             {!interventionPlan ? (
                                 <div className="flex gap-2">
                                     <input 
                                        type="text" 
                                        id="targetBehavior"
                                        placeholder="مثال: التحدث بصوت مرتفع أثناء الدرس..."
                                        className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500"
                                     />
                                     <button 
                                        onClick={() => {
                                            const input = document.getElementById('targetBehavior') as HTMLInputElement;
                                            if (input.value) handleGeneratePlan(input.value);
                                        }}
                                        disabled={isGeneratingPlan}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50"
                                     >
                                         {isGeneratingPlan ? <Loader2 className="animate-spin" /> : 'إنشاء الخطة'}
                                     </button>
                                 </div>
                             ) : (
                                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                     <div className="flex justify-between items-center mb-2">
                                         <h4 className="font-bold text-gray-800">خطة التدخل المقترحة</h4>
                                         <button onClick={() => setInterventionPlan(null)} className="text-xs text-red-500 hover:underline">إغلاق</button>
                                     </div>
                                     <SimpleMarkdown content={interventionPlan} />
                                 </div>
                             )}
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 left-6 z-50 bg-gray-900 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in">
           <div className="bg-green-500 rounded-full p-1.5">
             <CheckCircle2 size={16} strokeWidth={3} className="text-white" />
           </div>
           <div>
             <p className="font-bold text-sm">تم الحفظ بنجاح</p>
             <p className="text-xs text-gray-400">تمت إضافة السجل إلى ملف التلميذ</p>
           </div>
        </div>
      )}

      {/* Add Interview Modal */}
      {isInterviewModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare size={20} className="text-primary-600" />
                تسجيل مقابلة جديدة
              </h3>
              <button onClick={() => setIsInterviewModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddInterviewSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ المقابلة</label>
                    <input 
                        type="date"
                        required
                        value={interviewData.date}
                        onChange={(e) => setInterviewData(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نوع المقابلة</label>
                  <select 
                    value={interviewData.type}
                    onChange={(e) => setInterviewData(prev => ({ ...prev, type: e.target.value as InterviewType }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value={InterviewType.STUDENT}>مع التلميذ</option>
                    <option value={InterviewType.PARENT}>مع الولي</option>
                    <option value={InterviewType.ADMIN}>مع الإدارة</option>
                    <option value={InterviewType.OTHER}>أخرى</option>
                  </select>
               </div>
              </div>

              {/* Admin Specific Fields */}
              {interviewData.type === InterviewType.ADMIN && (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 animate-fade-in space-y-3">
                  <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-2">بيانات الموظف / الإداري</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">رتبة الموظف</label>
                        <input 
                            type="text"
                            placeholder="مثال: مستشار، ناظر..."
                            value={interviewData.adminRole}
                            onChange={(e) => setInterviewData(prev => ({ ...prev, adminRole: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-orange-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">علاقته بالتلميذ</label>
                        <input 
                            type="text"
                            placeholder="مثال: أستاذ المادة، مراقب..."
                            value={interviewData.adminRelation}
                            onChange={(e) => setInterviewData(prev => ({ ...prev, adminRelation: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-orange-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        />
                    </div>
                  </div>
                </div>
              )}

              {/* Parent Specific Field */}
              {interviewData.type === InterviewType.PARENT && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 animate-fade-in">
                   <label className="block text-xs font-bold text-purple-800 mb-1">اسم الولي الحاضر</label>
                   <input 
                        type="text"
                        placeholder="الاسم الكامل للولي"
                        value={interviewData.parentName}
                        onChange={(e) => setInterviewData(prev => ({ ...prev, parentName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                   />
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 mt-2">
                 <h4 className="text-sm font-bold text-gray-900 mb-3 bg-gray-50 p-2 rounded">تفاصيل التقرير</h4>
                 
                 <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">2. سبب المقابلة (العنوان)</label>
                        <input 
                        type="text"
                        required
                        placeholder="مثال: تراجع النتائج، سلوك عدواني..."
                        value={interviewData.title}
                        onChange={(e) => setInterviewData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">3. مجريات المقابلة والملاحظات</label>
                        <textarea 
                        required
                        rows={3}
                        placeholder="يتم فيها نقل الحوار باختصار، تسجيل وضعية المستفيد، السلوك، الانفعالات، والمظاهر الملحوظة."
                        value={interviewData.proceedings}
                        onChange={(e) => setInterviewData(prev => ({ ...prev, proceedings: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">4. تقييم أولي للحالة</label>
                        <textarea 
                        rows={2}
                        placeholder="نقاط القوة – نقاط الضعف – الاحتياجات – الدوافع – العوامل المساعدة."
                        value={interviewData.assessment}
                        onChange={(e) => setInterviewData(prev => ({ ...prev, assessment: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">5. الإجراءات المتخذة</label>
                        <textarea 
                        rows={2}
                        placeholder="التدخلات، الاختبارات، الاستبيانات، التواصل مع الأطراف الأخرى…"
                        value={interviewData.actions}
                        onChange={(e) => setInterviewData(prev => ({ ...prev, actions: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">6. التوصيات والمتابعة</label>
                        <textarea 
                        rows={2}
                        placeholder="خطة المتابعة – مدة التكفل – جلسات علاجية – إحالة إن وجدت."
                        value={interviewData.recommendations}
                        onChange={(e) => setInterviewData(prev => ({ ...prev, recommendations: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-green-50/50 border-green-100"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">7. خاتمة التقرير</label>
                        <textarea 
                        rows={2}
                        placeholder="خلاصة..."
                        value={interviewData.conclusion}
                        onChange={(e) => setInterviewData(prev => ({ ...prev, conclusion: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                 </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-gray-100 mt-2">
                <button 
                  type="submit" 
                  className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg font-bold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={18} /> حفظ المقابلة
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsInterviewModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal (for Adding from Tasks Tab) */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <ListTodo size={20} className="text-primary-600" />
                        إضافة مهمة متابعة
                    </h3>
                    <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleTaskSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">عنوان المهمة</label>
                        <input 
                            type="text"
                            required
                            value={newTaskData.title}
                            onChange={(e) => setNewTaskData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="مثال: استدعاء الولي، جلسة توجيه..."
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الاستحقاق</label>
                            <input 
                                type="date"
                                required
                                value={newTaskData.deadline}
                                onChange={(e) => setNewTaskData(prev => ({ ...prev, deadline: e.target.value }))}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">الأولوية</label>
                            <select 
                                value={newTaskData.priority}
                                onChange={(e) => setNewTaskData(prev => ({ ...prev, priority: e.target.value as any }))}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="LOW">عادي</option>
                                <option value="MEDIUM">متوسط</option>
                                <option value="HIGH">عاجل</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-4">
                        <button 
                            type="submit" 
                            className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-bold hover:bg-primary-700 transition-colors"
                        >
                            حفظ المهمة
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
