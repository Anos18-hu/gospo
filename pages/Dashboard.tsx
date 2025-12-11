
import React, { useState, useMemo, useEffect } from 'react';
import { Users, TrendingUp, TrendingDown, AlertCircle, Calendar, Filter, ArrowLeft, Settings, Building2, UserCircle, Key, X, Trophy, ListTodo, Plus, CheckCircle2, Clock, Trash2, Layout, Eye, EyeOff, ArrowUp, ArrowDown, RotateCcw, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Student, BehaviorLog, BehaviorType, FollowUpTask } from '../types';
import { Link } from 'react-router-dom';

interface DashboardProps {
  students: Student[];
  logs: BehaviorLog[];
  tasks: FollowUpTask[];
  onAddTask: (task: FollowUpTask) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  institutionName?: string;
  counselorName?: string;
  counselorRole?: string;
  onUpdateSettings?: (instName: string, counsName: string, counsRole: string, code: string) => void;
}

type WidgetType = 'stats' | 'attention' | 'honor' | 'tasks' | 'charts';

interface DashboardWidget {
    id: WidgetType;
    label: string;
    isVisible: boolean;
    colSpan: string; // Tailwind class for lg breakpoint
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
    { id: 'stats', label: 'بطاقات الإحصائيات', isVisible: true, colSpan: 'lg:col-span-3' },
    { id: 'attention', label: 'تنبيهات المتابعة', isVisible: true, colSpan: 'lg:col-span-2' },
    { id: 'tasks', label: 'مهام المتابعة', isVisible: true, colSpan: 'lg:col-span-1' },
    { id: 'honor', label: 'لوحة الشرف', isVisible: true, colSpan: 'lg:col-span-2' },
    { id: 'charts', label: 'الرسوم البيانية', isVisible: true, colSpan: 'lg:col-span-3' },
];

const Dashboard: React.FC<DashboardProps> = ({ students, logs, tasks, onAddTask, onToggleTask, onDeleteTask, institutionName, counselorName, counselorRole, onUpdateSettings }) => {
  // 1. Calculate Academic Year
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentYear = today.getFullYear();
  
  const startYear = currentMonth >= 9 ? currentYear : currentYear - 1;
  const academicYearString = `${startYear}/${startYear + 1}`;

  // 2. Determine Current Term (Default Selection)
  const getCurrentTerm = () => {
    if (currentMonth >= 9 && currentMonth <= 12) return 1; // Term 1: Sept - Dec
    if (currentMonth >= 1 && currentMonth <= 3) return 2;  // Term 2: Jan - Mar
    return 3; // Term 3: Apr - Jun (and summer)
  };

  const [selectedTerm, setSelectedTerm] = useState<number>(getCurrentTerm());
  
  // Settings & Layout State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  
  // Dashboard Layout Configuration
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
      try {
          const saved = localStorage.getItem('dashboard_layout');
          return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
      } catch {
          return DEFAULT_WIDGETS;
      }
  });

  const [formInstName, setFormInstName] = useState(institutionName || '');
  const [formCounsName, setFormCounsName] = useState(counselorName || '');
  const [formCounsRole, setFormCounsRole] = useState(counselorRole || '');
  const [formCode, setFormCode] = useState('');

  // Add Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
      studentId: '',
      title: '',
      deadline: new Date().toISOString().split('T')[0],
      priority: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW'
  });

  // Save layout whenever it changes
  useEffect(() => {
      localStorage.setItem('dashboard_layout', JSON.stringify(widgets));
  }, [widgets]);

  // 3. Filter Logs based on Selected Term & Academic Year
  const filteredLogs = useMemo(() => {
    let termStartDate: Date;
    let termEndDate: Date;

    if (selectedTerm === 1) {
      termStartDate = new Date(startYear, 8, 1); // Month is 0-indexed (8 = Sept)
      termEndDate = new Date(startYear, 11, 31, 23, 59, 59);
    } else if (selectedTerm === 2) {
      termStartDate = new Date(startYear + 1, 0, 1);
      termEndDate = new Date(startYear + 1, 2, 31, 23, 59, 59);
    } else {
      termStartDate = new Date(startYear + 1, 3, 1);
      termEndDate = new Date(startYear + 1, 7, 31, 23, 59, 59);
    }

    return logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= termStartDate && logDate <= termEndDate;
    });
  }, [logs, selectedTerm, startYear]);

  // Calculate Stats based on Filtered Logs
  const totalStudents = students.length;
  const positiveLogs = filteredLogs.filter(l => l.type === BehaviorType.POSITIVE).length;
  const negativeLogs = filteredLogs.filter(l => l.type === BehaviorType.NEGATIVE).length;
  
  // Calculate Top 3 Students for the selected term
  const topStudents = useMemo(() => {
    const scores: Record<string, number> = {};
    students.forEach(s => scores[s.id] = 0);
    
    filteredLogs.forEach(log => {
        scores[log.studentId] = (scores[log.studentId] || 0) + log.points;
    });
    
    return students
        .map(s => ({...s, termPoints: scores[s.id] || 0}))
        .filter(s => s.termPoints > 0)
        .sort((a, b) => b.termPoints - a.termPoints)
        .slice(0, 3);
  }, [students, filteredLogs]);

  // Identify High Risk Students
  const studentsNeedingAttention = students.filter(s => {
      const gpa = s.academicRecords?.[0]?.average || 0;
      if (gpa >= 12) return false;
      return s.totalPoints < -5 || (gpa > 0 && gpa < 10);
  });

  // Sort tasks
  const sortedTasks = useMemo(() => {
      return [...tasks].sort((a, b) => {
          if (a.isCompleted === b.isCompleted) {
              return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          }
          return a.isCompleted ? 1 : -1;
      });
  }, [tasks]);
  
  // Data for Bar Chart
  const daysMap: Record<string, { pos: number, neg: number }> = {
      'الأحد': { pos: 0, neg: 0 },
      'الاثنين': { pos: 0, neg: 0 },
      'الثلاثاء': { pos: 0, neg: 0 },
      'الأربعاء': { pos: 0, neg: 0 },
      'الخميس': { pos: 0, neg: 0 },
  };

  filteredLogs.forEach(log => {
      const date = new Date(log.date);
      const dayName = date.toLocaleDateString('ar-EG', { weekday: 'long' });
      if (daysMap[dayName]) {
          if (log.type === BehaviorType.POSITIVE) daysMap[dayName].pos++;
          else daysMap[dayName].neg++;
      }
  });

  const chartData = Object.keys(daysMap).map(day => ({
      name: day,
      positive: daysMap[day].pos,
      negative: daysMap[day].neg
  }));

  const pieData = [
    { name: 'سلوك إيجابي', value: positiveLogs, color: '#22c55e' },
    { name: 'سلوك سلبي', value: negativeLogs, color: '#ef4444' },
  ];
  
  const handleSettingsSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (onUpdateSettings) {
          onUpdateSettings(formInstName, formCounsName, formCounsRole, formCode);
      }
      setIsSettingsOpen(false);
  };

  const openSettings = () => {
      setFormInstName(institutionName || '');
      setFormCounsName(counselorName || '');
      setFormCounsRole(counselorRole || '');
      setIsSettingsOpen(true);
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTaskData.studentId || !newTaskData.title) return;
      onAddTask({
          id: Date.now().toString(),
          studentId: newTaskData.studentId,
          title: newTaskData.title,
          deadline: newTaskData.deadline,
          priority: newTaskData.priority,
          isCompleted: false,
          createdAt: new Date().toISOString()
      });
      setIsTaskModalOpen(false);
      setNewTaskData({
          studentId: '',
          title: '',
          deadline: new Date().toISOString().split('T')[0],
          priority: 'MEDIUM'
      });
  };

  // Layout Management Functions
  const moveWidget = (index: number, direction: 'up' | 'down') => {
      const newWidgets = [...widgets];
      if (direction === 'up' && index > 0) {
          [newWidgets[index], newWidgets[index - 1]] = [newWidgets[index - 1], newWidgets[index]];
      } else if (direction === 'down' && index < newWidgets.length - 1) {
          [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
      }
      setWidgets(newWidgets);
  };

  const toggleWidgetVisibility = (id: WidgetType) => {
      setWidgets(prev => prev.map(w => w.id === id ? { ...w, isVisible: !w.isVisible } : w));
  };

  const resetLayout = () => {
      setWidgets(DEFAULT_WIDGETS);
  };

  // Render Helpers for Widgets
  const renderStats = (colSpan: string) => (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${colSpan}`}>
        <StatCard 
          title="عدد الطلاب المسجلين" 
          value={totalStudents} 
          icon={Users} 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="سلوكيات إيجابية (فصلي)" 
          value={positiveLogs} 
          icon={TrendingUp} 
          color="bg-green-500" 
        />
        <StatCard 
          title="سلوكيات سلبية (فصلي)" 
          value={negativeLogs} 
          icon={TrendingDown} 
          color="bg-red-500" 
        />
        <StatCard 
          title="تلاميذ يحتاجون متابعة" 
          value={studentsNeedingAttention.length} 
          icon={AlertCircle} 
          color="bg-orange-500" 
        />
      </div>
  );

  const renderAttention = (colSpan: string) => (
      <div className={`bg-red-50 border border-red-100 rounded-xl p-6 animate-fade-in flex flex-col h-full ${colSpan}`}>
        <h2 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
            <AlertCircle className="text-red-600" size={24} />
            تلاميذ يحتاجون لتدخل فوري
        </h2>
        {studentsNeedingAttention.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentsNeedingAttention.map(student => {
                const gpa = student.academicRecords?.[0]?.average || 0;
                return (
                    <Link to={`/students/${student.id}`} key={student.id} className="bg-white p-4 rounded-lg shadow-sm border border-red-100 flex items-center gap-4 hover:shadow-md transition-all">
                    <img src={student.avatarUrl} alt={student.name} className="w-12 h-12 rounded-full object-cover border-2 border-red-50" />
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{student.name}</h3>
                        <p className="text-xs text-gray-500">{student.grade}</p>
                        {gpa > 0 && gpa < 10 && <p className="text-xs text-red-500 font-bold mt-1">معدل: {gpa}</p>}
                    </div>
                    <div className={`font-bold text-lg dir-ltr ${student.totalPoints < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {student.totalPoints}
                    </div>
                    <ArrowLeft size={16} className="text-gray-300" />
                    </Link>
                );
                })}
            </div>
        ) : (
            <div className="flex-1 flex items-center justify-center text-red-300 text-sm">
                لا توجد حالات حرجة حالياً.
            </div>
        )}
      </div>
  );

  const renderHonor = (colSpan: string) => (
      <div className={`bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100 rounded-xl p-6 animate-fade-in flex flex-col h-full ${colSpan}`}>
        <h2 className="text-lg font-bold text-yellow-800 mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-600" size={24} />
            لوحة الشرف (الفصل الحالي)
        </h2>
        {topStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topStudents.map((student, index) => (
                    <div key={student.id} className="bg-white p-4 rounded-xl border border-yellow-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-br-lg shadow-sm">
                            #{index + 1}
                        </div>
                        <img src={student.avatarUrl} className="w-14 h-14 rounded-full border-2 border-yellow-100" />
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">{student.name}</h3>
                            <p className="text-xs text-gray-500">{student.grade}</p>
                        </div>
                        <div className="mr-auto text-center">
                            <span className="block text-xs text-gray-400 mb-0.5">نقاط الفصل</span>
                            <span className="font-bold text-xl text-yellow-600">+{student.termPoints}</span>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="flex-1 flex items-center justify-center text-yellow-600/40 text-sm">
                لا توجد بيانات كافية لهذا الفصل.
            </div>
        )}
      </div>
  );

  const renderTasks = (colSpan: string) => (
      <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full animate-fade-in ${colSpan}`}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <ListTodo size={20} className="text-primary-600" />
                مهام المتابعة
            </h2>
            <button 
                onClick={() => setIsTaskModalOpen(true)}
                className="p-1.5 bg-gray-50 hover:bg-primary-50 text-gray-600 hover:text-primary-600 rounded-lg transition-colors"
                title="إضافة مهمة"
            >
                <Plus size={20} />
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[400px] custom-scrollbar min-h-[150px]">
            {sortedTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <ListTodo size={40} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">لا توجد مهام متابعة حالياً.</p>
                </div>
            ) : (
                sortedTasks.map(task => {
                    const student = students.find(s => s.id === task.studentId);
                    return (
                        <div key={task.id} className={`p-3 rounded-lg border ${task.isCompleted ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200'} transition-all hover:shadow-sm group`}>
                            <div className="flex items-start gap-3">
                                <button 
                                    onClick={() => onToggleTask(task.id)}
                                    className={`mt-1 shrink-0 ${task.isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}`}
                                >
                                    <CheckCircle2 size={20} className={task.isCompleted ? 'fill-green-100' : ''} />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-bold text-sm text-gray-900 ${task.isCompleted ? 'line-through text-gray-500' : ''}`}>
                                        {task.title}
                                    </p>
                                    {student && (
                                        <Link to={`/students/${student.id}`} className="text-xs text-primary-600 hover:underline block mt-0.5 truncate">
                                            {student.name}
                                        </Link>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                            task.priority === 'HIGH' ? 'bg-red-50 text-red-700' :
                                            task.priority === 'MEDIUM' ? 'bg-orange-50 text-orange-700' :
                                            'bg-blue-50 text-blue-700'
                                        }`}>
                                            {task.priority === 'HIGH' ? 'عاجل' : task.priority === 'MEDIUM' ? 'متوسط' : 'عادي'}
                                        </span>
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                            <Clock size={10} /> {new Date(task.deadline).toLocaleDateString('ar-EG')}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onDeleteTask(task.id)}
                                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>
  );

  const renderCharts = (colSpan: string) => (
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${colSpan}`}>
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">نشاط السلوك الأسبوعي</h2>
              <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-1 rounded">خلال الفصل المحدد</span>
          </div>
          <div className="h-64">
            {positiveLogs + negativeLogs > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{fill: '#f9fafb'}}
                    />
                    <Bar dataKey="positive" name="إيجابي" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="negative" name="سلبي" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    لا توجد بيانات لهذا الفصل الدراسي
                </div>
            )}
          </div>
        </div>

        {/* Pie Chart & Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <h2 className="text-lg font-bold text-gray-800 mb-4">توزيع السلوك العام</h2>
          <div className="flex-1 flex items-center justify-center">
             <div className="h-64 w-full">
                {positiveLogs + negativeLogs > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        >
                        {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        لا توجد بيانات
                    </div>
                )}
             </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
             {pieData.map((entry) => (
                 <div key={entry.name} className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full" style={{backgroundColor: entry.color}}></div>
                     <span className="text-sm text-gray-600 font-medium">{entry.name}</span>
                 </div>
             ))}
          </div>
        </div>
      </div>
  );

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-start gap-4">
             <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">لوحة القيادة</h1>
                    <button onClick={openSettings} className="text-gray-400 hover:text-primary-600 transition-colors p-1" title="إعدادات المؤسسة">
                        <Settings size={20} />
                    </button>
                    <button onClick={() => setIsLayoutModalOpen(true)} className="text-gray-400 hover:text-primary-600 transition-colors p-1" title="تخصيص الواجهة">
                        <Layout size={20} />
                    </button>
                </div>
                <p className="text-gray-500 mt-1">{institutionName ? `${institutionName} - ` : ''}نظرة عامة على السلوك الطلابي.</p>
             </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
             {/* Academic Year Badge */}
             <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-xl border border-indigo-100 font-bold whitespace-nowrap">
                <Calendar size={18} />
                <span>السنة الدراسية: {academicYearString}</span>
             </div>

             {/* Term Selector */}
             <div className="relative">
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select 
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(Number(e.target.value))}
                    className="appearance-none bg-gray-50 text-gray-700 font-bold pr-10 pl-8 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-48 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                    <option value={1}>الفصل الدراسي الأول</option>
                    <option value={2}>الفصل الدراسي الثاني</option>
                    <option value={3}>الفصل الدراسي الثالث</option>
                </select>
             </div>
        </div>
      </div>

      {/* Dynamic Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-min">
          {widgets.map((widget) => {
              if (!widget.isVisible) return null;
              
              switch (widget.id) {
                  case 'stats': return <React.Fragment key={widget.id}>{renderStats(widget.colSpan)}</React.Fragment>;
                  case 'attention': return <React.Fragment key={widget.id}>{renderAttention(widget.colSpan)}</React.Fragment>;
                  case 'honor': return <React.Fragment key={widget.id}>{renderHonor(widget.colSpan)}</React.Fragment>;
                  case 'tasks': return <React.Fragment key={widget.id}>{renderTasks(widget.colSpan)}</React.Fragment>;
                  case 'charts': return <React.Fragment key={widget.id}>{renderCharts(widget.colSpan)}</React.Fragment>;
                  default: return null;
              }
          })}
      </div>

      {/* Layout Customization Modal */}
      {isLayoutModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Layout size={20} className="text-primary-600" />
                        تخصيص الواجهة
                    </h3>
                    <button onClick={() => setIsLayoutModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-500 mb-4">قم بترتيب العناصر أو إخفائها لتناسب احتياجاتك.</p>
                    <div className="space-y-3">
                        {widgets.map((widget, index) => (
                            <div key={widget.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => toggleWidgetVisibility(widget.id)}
                                        className={`p-1.5 rounded-md transition-colors ${widget.isVisible ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:text-gray-600'}`}
                                        title={widget.isVisible ? 'إخفاء' : 'إظهار'}
                                    >
                                        {widget.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                    <span className={`font-medium ${widget.isVisible ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                                        {widget.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => moveWidget(index, 'up')}
                                        disabled={index === 0}
                                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ArrowUp size={18} />
                                    </button>
                                    <button 
                                        onClick={() => moveWidget(index, 'down')}
                                        disabled={index === widgets.length - 1}
                                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ArrowDown size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 flex gap-3">
                        <button 
                            onClick={resetLayout}
                            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors text-sm flex items-center gap-2"
                        >
                            <RotateCcw size={16} /> استعادة الافتراضي
                        </button>
                        <button 
                            onClick={() => setIsLayoutModalOpen(false)}
                            className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-700 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <Save size={16} /> حفظ وإغلاق
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Settings size={20} className="text-primary-600" />
                        إعدادات المؤسسة / التفعيل
                    </h3>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSettingsSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">اسم المؤسسة</label>
                        <div className="relative">
                            <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text"
                                value={formInstName}
                                onChange={(e) => setFormInstName(e.target.value)}
                                placeholder="أدخل اسم المؤسسة"
                                className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستشار / المستخدم</label>
                        <div className="relative">
                            <UserCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text"
                                value={formCounsName}
                                onChange={(e) => setFormCounsName(e.target.value)}
                                placeholder="أدخل اسم المستشار"
                                className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">الصفة (المنصب)</label>
                        <div className="relative">
                            <UserCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text"
                                value={formCounsRole}
                                onChange={(e) => setFormCounsRole(e.target.value)}
                                placeholder="مثال: مستشار التوجيه والإرشاد"
                                className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">كود التفعيل (اختياري)</label>
                        <div className="relative">
                            <Key className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text"
                                value={formCode}
                                onChange={(e) => setFormCode(e.target.value)}
                                placeholder="أدخل كود التفعيل"
                                className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                                dir="ltr"
                            />
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button 
                            type="submit" 
                            className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg font-bold hover:bg-primary-700 transition-colors"
                        >
                            حفظ الإعدادات
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Add Task Modal */}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">التلميذ</label>
                        <select 
                            required
                            value={newTaskData.studentId}
                            onChange={(e) => setNewTaskData(prev => ({ ...prev, studentId: e.target.value }))}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="">اختر التلميذ...</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>
                            ))}
                        </select>
                    </div>
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

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
    <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden`}>
       <div className={`absolute inset-0 opacity-10 ${color}`}></div>
       <Icon className={`relative z-10 w-6 h-6 ${color.replace('bg-', 'text-')}`} />
    </div>
  </div>
);

export default Dashboard;
