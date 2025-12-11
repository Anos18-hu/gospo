
import React, { useState } from 'react';
import { Search, Plus, MessageSquare, Calendar, User, UserCog, Users, Filter, X, Save, MessageCircle, FileText, CheckCircle2, Briefcase, ChevronDown, ChevronUp, FolderOpen } from 'lucide-react';
import { Student, InterviewRecord, InterviewType } from '../types';
import { Link } from 'react-router-dom';

interface InterviewsProps {
  students: Student[];
  onAddInterview: (studentId: string, interview: InterviewRecord) => void;
}

const Interviews: React.FC<InterviewsProps> = ({ students, onAddInterview }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<InterviewType | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  // State for collapsible sections
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

  // Form State
  const [formData, setFormData] = useState({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    type: InterviewType.STUDENT,
    title: '', // Reason
    proceedings: '',
    assessment: '',
    actions: '',
    recommendations: '',
    conclusion: '',
    adminRole: '',
    adminRelation: '',
    parentName: ''
  });

  // Collect all interviews from all students into a flat list
  const allInterviews = students.flatMap(student => 
    (student.interviews || []).map(interview => ({
      ...interview,
      studentName: student.name,
      studentAvatar: student.avatarUrl,
      studentGrade: student.grade
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredInterviews = allInterviews.filter(interview => {
    const matchesSearch = interview.studentName.includes(searchTerm) || interview.title.includes(searchTerm);
    const matchesType = selectedType === 'ALL' || interview.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Group filtered interviews by Student ID
  const groupedInterviews = filteredInterviews.reduce((acc, interview) => {
      if (!acc[interview.studentId]) {
          acc[interview.studentId] = [];
      }
      acc[interview.studentId].push(interview);
      return acc;
  }, {} as Record<string, typeof filteredInterviews>);

  const toggleStudent = (studentId: string) => {
      const newSet = new Set(expandedStudents);
      if (newSet.has(studentId)) {
          newSet.delete(studentId);
      } else {
          newSet.add(studentId);
      }
      setExpandedStudents(newSet);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId) return;

    const newInterview: InterviewRecord = {
      id: Date.now().toString(),
      studentId: formData.studentId,
      date: formData.date,
      type: formData.type,
      title: formData.title,
      notes: formData.proceedings, // Keep sync for backward compatibility
      proceedings: formData.proceedings,
      assessment: formData.assessment,
      actions: formData.actions,
      recommendations: formData.recommendations,
      conclusion: formData.conclusion,
      adminRole: formData.type === InterviewType.ADMIN ? formData.adminRole : undefined,
      adminRelation: formData.type === InterviewType.ADMIN ? formData.adminRelation : undefined,
      parentName: formData.type === InterviewType.PARENT ? formData.parentName : undefined
    };

    onAddInterview(formData.studentId, newInterview);
    setIsModalOpen(false);
    resetForm();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    
    // Auto expand the student we just added to
    const newSet = new Set(expandedStudents);
    newSet.add(formData.studentId);
    setExpandedStudents(newSet);
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
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
  };

  const handleStudentSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedId = e.target.value;
      let pName = '';
      if (selectedId) {
          const st = students.find(s => s.id === selectedId);
          if (st && st.parentName) {
              pName = st.parentName;
          }
      }
      setFormData(prev => ({ ...prev, studentId: selectedId, parentName: pName }));
  };

  const getInterviewTypeLabel = (type: InterviewType) => {
    switch (type) {
      case InterviewType.STUDENT: return 'مقابلة تلميذ';
      case InterviewType.PARENT: return 'ولي الأمر';
      case InterviewType.ADMIN: return 'طاقم إداري';
      case InterviewType.OTHER: return 'أخرى';
      default: return type;
    }
  };

  const getInterviewTypeColor = (type: InterviewType) => {
    switch (type) {
      case InterviewType.STUDENT: return 'bg-blue-100 text-blue-700';
      case InterviewType.PARENT: return 'bg-purple-100 text-purple-700';
      case InterviewType.ADMIN: return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Stats
  const stats = {
    total: allInterviews.length,
    thisMonth: allInterviews.filter(i => new Date(i.date).getMonth() === new Date().getMonth()).length,
    parents: allInterviews.filter(i => i.type === InterviewType.PARENT).length,
    students: allInterviews.filter(i => i.type === InterviewType.STUDENT).length
  };

  return (
    <div className="space-y-6 relative animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">سجل المقابلات</h1>
          <p className="text-gray-500 mt-1">إدارة وتوثيق الجلسات الفردية مع التلاميذ وأولياء الأمور</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20"
        >
          <Plus size={20} />
          <span>مقابلة جديدة</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">إجمالي المقابلات</p>
          <div className="flex items-center gap-2">
            <MessageSquare size={20} className="text-primary-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">مقابلات هذا الشهر</p>
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-green-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.thisMonth}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">مع الأولياء</p>
          <div className="flex items-center gap-2">
            <Users size={20} className="text-purple-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.parents}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">مع التلاميذ</p>
          <div className="flex items-center gap-2">
            <User size={20} className="text-blue-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.students}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="بحث (اسم التلميذ، الموضوع)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter size={18} className="text-gray-400 shrink-0" />
          {[
            { id: 'ALL', label: 'الكل' },
            { id: InterviewType.STUDENT, label: 'التلاميذ' },
            { id: InterviewType.PARENT, label: 'الأولياء' },
            { id: InterviewType.ADMIN, label: 'إداري' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id as any)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedType === type.id 
                  ? 'bg-primary-100 text-primary-700 border border-primary-200' 
                  : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped Interviews List */}
      <div className="space-y-4">
        {Object.keys(groupedInterviews).length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">لا توجد مقابلات</h3>
            <p className="text-gray-500">قم بإضافة مقابلة جديدة للبدء في التوثيق.</p>
          </div>
        ) : (
          Object.entries(groupedInterviews).map(([studentId, rawInterviews]) => {
              const studentInterviews = rawInterviews as typeof filteredInterviews;
              const student = students.find(s => s.id === studentId);
              if (!student) return null;
              const isExpanded = expandedStudents.has(studentId);

              return (
                  <div key={studentId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      {/* Accordion Header */}
                      <button 
                        onClick={() => toggleStudent(studentId)}
                        className={`w-full flex items-center justify-between p-4 transition-colors ${isExpanded ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}`}
                      >
                          <div className="flex items-center gap-3">
                              <img src={student.avatarUrl} alt="" className="w-10 h-10 rounded-full bg-gray-200 object-cover" />
                              <div className="text-right">
                                  <h3 className="font-bold text-gray-900">{student.name}</h3>
                                  <p className="text-xs text-gray-500">{student.grade}</p>
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">
                                  <FolderOpen size={14} />
                                  {studentInterviews.length} مقابلات
                              </span>
                              {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                          </div>
                      </button>

                      {/* Accordion Content (List of Interviews) */}
                      {isExpanded && (
                          <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/50">
                              {studentInterviews.map((interview) => (
                                  <div key={interview.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative">
                                      <div className="flex flex-col md:flex-row gap-4 items-start">
                                          {/* Date Box */}
                                          <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-2 w-16 h-16 border border-gray-100 shrink-0">
                                              <span className="text-xs text-gray-500 font-medium">
                                                  {new Date(interview.date).toLocaleDateString('ar-EG', { month: 'short' })}
                                              </span>
                                              <span className="text-xl font-bold text-gray-800">
                                                  {new Date(interview.date).getDate()}
                                              </span>
                                              <span className="text-xs text-gray-400">
                                                  {new Date(interview.date).getFullYear()}
                                              </span>
                                          </div>

                                          {/* Content */}
                                          <div className="flex-1 min-w-0">
                                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${getInterviewTypeColor(interview.type)}`}>
                                                      {getInterviewTypeLabel(interview.type)}
                                                  </span>
                                                  <h3 className="text-lg font-bold text-gray-900 truncate">{interview.title}</h3>
                                              </div>

                                              {/* Parent Name Display */}
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

                                              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 leading-relaxed mb-3">
                                                  <p className="line-clamp-2 group-hover:line-clamp-none transition-all">
                                                      {interview.proceedings || interview.notes}
                                                  </p>
                                              </div>

                                              {interview.recommendations && (
                                                  <div className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                                                      <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                                                      <span>{interview.recommendations}</span>
                                                  </div>
                                              )}
                                          </div>

                                          {/* Actions */}
                                          <div className="flex gap-2 shrink-0">
                                              <Link to={`/students/${interview.studentId}`} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors" title="عرض في ملف التلميذ">
                                                  <FileText size={18} />
                                              </Link>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              );
          })
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare size={20} className="text-primary-600" />
                تسجيل مقابلة جديدة
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">التلميذ المعني</label>
                    <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select 
                        required
                        value={formData.studentId}
                        onChange={handleStudentSelectChange}
                        className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                    >
                        <option value="">اختر التلميذ...</option>
                        {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>
                        ))}
                    </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ المقابلة</label>
                    <input 
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>
              </div>
              
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نوع المقابلة</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as InterviewType }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value={InterviewType.STUDENT}>مع التلميذ</option>
                    <option value={InterviewType.PARENT}>مع الولي</option>
                    <option value={InterviewType.ADMIN}>مع الإدارة</option>
                    <option value={InterviewType.OTHER}>أخرى</option>
                  </select>
               </div>


              {/* Admin Specific Fields */}
              {formData.type === InterviewType.ADMIN && (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 animate-fade-in space-y-3">
                  <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-2">بيانات الموظف / الإداري</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">رتبة الموظف</label>
                        <input 
                            type="text"
                            placeholder="مثال: مستشار، ناظر..."
                            value={formData.adminRole}
                            onChange={(e) => setFormData(prev => ({ ...prev, adminRole: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-orange-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">علاقته بالتلميذ</label>
                        <input 
                            type="text"
                            placeholder="مثال: أستاذ المادة، مراقب..."
                            value={formData.adminRelation}
                            onChange={(e) => setFormData(prev => ({ ...prev, adminRelation: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-orange-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        />
                    </div>
                  </div>
                </div>
              )}

              {/* Parent Specific Field */}
              {formData.type === InterviewType.PARENT && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 animate-fade-in">
                   <label className="block text-xs font-bold text-purple-800 mb-1">اسم الولي الحاضر</label>
                   <input 
                        type="text"
                        placeholder="الاسم الكامل للولي"
                        value={formData.parentName}
                        onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
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
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">3. مجريات المقابلة والملاحظات</label>
                        <textarea 
                        required
                        rows={3}
                        placeholder="يتم فيها نقل الحوار باختصار، تسجيل وضعية المستفيد، السلوك، الانفعالات، والمظاهر الملحوظة."
                        value={formData.proceedings}
                        onChange={(e) => setFormData(prev => ({ ...prev, proceedings: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">4. تقييم أولي للحالة</label>
                        <textarea 
                        rows={2}
                        placeholder="نقاط القوة – نقاط الضعف – الاحتياجات – الدوافع – العوامل المساعدة."
                        value={formData.assessment}
                        onChange={(e) => setFormData(prev => ({ ...prev, assessment: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">5. الإجراءات المتخذة</label>
                        <textarea 
                        rows={2}
                        placeholder="التدخلات، الاختبارات، الاستبيانات، التواصل مع الأطراف الأخرى…"
                        value={formData.actions}
                        onChange={(e) => setFormData(prev => ({ ...prev, actions: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">6. التوصيات والمتابعة</label>
                        <textarea 
                        rows={2}
                        placeholder="خطة المتابعة – مدة التكفل – جلسات علاجية – إحالة إن وجدت."
                        value={formData.recommendations}
                        onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-green-50/50 border-green-100"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">7. خاتمة التقرير</label>
                        <textarea 
                        rows={2}
                        placeholder="خلاصة..."
                        value={formData.conclusion}
                        onChange={(e) => setFormData(prev => ({ ...prev, conclusion: e.target.value }))}
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
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 left-6 z-50 bg-gray-900 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <div className="bg-green-500 rounded-full p-1.5">
            <CheckCircle2 size={16} strokeWidth={3} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">تم الحفظ بنجاح</p>
            <p className="text-xs text-gray-400">تمت إضافة المقابلة إلى سجل التلميذ</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interviews;
