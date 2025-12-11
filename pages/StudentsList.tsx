
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, Award, Plus, X, UserPlus, AlertTriangle, Calendar, User, Phone, Book, Hash, Pen, Filter } from 'lucide-react';
import { Student, EducationStage } from '../types';

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

interface StudentsListProps {
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id' | 'totalPoints' | 'avatarUrl'>) => void;
  onUpdateStudent: (student: Student) => void;
}

const StudentsList: React.FC<StudentsListProps> = ({ students, onAddStudent, onUpdateStudent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<EducationStage | 'ALL'>('ALL');
  
  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Edit Student Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
      name: '',
      nationalId: '',
      grade: '',
      stage: EducationStage.ELEMENTARY,
      dateOfBirth: '',
      parentName: '',
      parentPhone: '',
      enrollmentDate: new Date().toISOString().split('T')[0],
      // Helper fields for Middle School Selection
      middleLevel: 'أولى متوسط',
      classNumber: '',
      // Helper fields for High School Selection
      secondaryYear: '1AS',
      secondaryTrack: '',
      secondarySpecialty: ''
  });

  // Update grade string when helpers change
  useEffect(() => {
      if (formData.stage === EducationStage.MIDDLE) {
          const fullGrade = formData.classNumber ? `${formData.middleLevel} ${formData.classNumber}` : formData.middleLevel;
          setFormData(prev => ({ ...prev, grade: fullGrade }));
      } else if (formData.stage === EducationStage.HIGH) {
          const yearLabel = SECONDARY_DATA.find(y => y.id === formData.secondaryYear)?.label || '';
          let fullGrade = `${yearLabel} ${formData.secondaryTrack}`;
          if (formData.secondarySpecialty) {
              fullGrade += ` - ${formData.secondarySpecialty}`;
          }
          setFormData(prev => ({ ...prev, grade: fullGrade }));
      }
  }, [formData.middleLevel, formData.classNumber, formData.stage, formData.secondaryYear, formData.secondaryTrack, formData.secondarySpecialty]);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.includes(searchTerm) || student.grade.includes(searchTerm) || student.nationalId?.includes(searchTerm);
    const matchesStage = selectedStage === 'ALL' || student.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  const stages = [
      { id: 'ALL', label: 'الكل' },
      { id: EducationStage.ELEMENTARY, label: 'الطور الابتدائي' },
      { id: EducationStage.MIDDLE, label: 'الطور المتوسط' },
      { id: EducationStage.HIGH, label: 'الطور الثانوي' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => {
          const updates: any = { [name]: value };
          // Reset child fields when parent changes
          if (name === 'secondaryYear') {
              updates.secondaryTrack = '';
              updates.secondarySpecialty = '';
          }
          if (name === 'secondaryTrack') {
              updates.secondarySpecialty = '';
          }
          return { ...prev, ...updates };
      });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nationalId.length !== 16) {
        alert('الرقم المدرسي الوطني يجب أن يتكون من 16 رقمًا.');
        return;
    }

    onAddStudent({
        ...formData,
        // Grade is already updated via useEffect
    });
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingStudentId) return;

      if (formData.nationalId.length !== 16) {
          alert('الرقم المدرسي الوطني يجب أن يتكون من 16 رقمًا.');
          return;
      }

      const existingStudent = students.find(s => s.id === editingStudentId);
      if (existingStudent) {
          onUpdateStudent({
              ...existingStudent,
              ...formData,
              // Grade is updated via useEffect
          });
      }
      setIsEditModalOpen(false);
      resetForm();
  };

  const resetForm = () => {
    setFormData({
        name: '',
        nationalId: '',
        grade: '',
        stage: EducationStage.ELEMENTARY,
        dateOfBirth: '',
        parentName: '',
        parentPhone: '',
        enrollmentDate: new Date().toISOString().split('T')[0],
        middleLevel: 'أولى متوسط',
        classNumber: '',
        secondaryYear: '1AS',
        secondaryTrack: '',
        secondarySpecialty: ''
    });
    setEditingStudentId(null);
  };

  const openEditModal = (student: Student) => {
      setEditingStudentId(student.id);
      
      // Defaults
      let mLevel = 'أولى متوسط';
      let cNum = '';
      let sYear = '1AS';
      let sTrack = '';
      let sSpec = '';

      if (student.stage === EducationStage.MIDDLE) {
          if (student.grade.includes('أولى متوسط')) mLevel = 'أولى متوسط';
          else if (student.grade.includes('ثانية متوسط')) mLevel = 'ثانية متوسط';
          else if (student.grade.includes('ثالثة متوسط')) mLevel = 'ثالثة متوسط';
          else if (student.grade.includes('رابعة متوسط')) mLevel = 'رابعة متوسط';
          
          const parts = student.grade.replace(mLevel, '').trim();
          cNum = parts.replace('السنة', '').trim();
      } else if (student.stage === EducationStage.HIGH) {
          // Attempt to parse existing grade string
          const g = student.grade;
          if (g.includes('الأولى')) sYear = '1AS';
          else if (g.includes('الثانية')) sYear = '2AS';
          else if (g.includes('الثالثة')) sYear = '3AS';

          // Try to find track
          const yearObj = SECONDARY_DATA.find(y => y.id === sYear);
          if (yearObj) {
              const foundTrack = yearObj.tracks.find(t => g.includes(t.name));
              if (foundTrack) {
                  sTrack = foundTrack.name;
                  const foundSpec = foundTrack.specialties.find(sp => g.includes(sp));
                  if (foundSpec) sSpec = foundSpec;
              }
          }
      }

      setFormData({
          name: student.name,
          nationalId: student.nationalId || '',
          grade: student.grade,
          stage: student.stage,
          dateOfBirth: student.dateOfBirth || '',
          parentName: student.parentName || '',
          parentPhone: student.parentPhone || '',
          enrollmentDate: student.enrollmentDate || new Date().toISOString().split('T')[0],
          middleLevel: mLevel,
          classNumber: cNum,
          secondaryYear: sYear,
          secondaryTrack: sTrack,
          secondarySpecialty: sSpec
      });
      setIsEditModalOpen(true);
  };

  const handleNationalIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, 16);
      setFormData(prev => ({ ...prev, nationalId: val }));
  };

  // Helper to get active secondary year options
  const activeSecondaryYear = SECONDARY_DATA.find(y => y.id === formData.secondaryYear);
  const activeTrack = activeSecondaryYear?.tracks.find(t => t.name === formData.secondaryTrack);

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">قائمة التلاميذ</h1>
           <p className="text-gray-500 mt-1">إدارة ملفات التلاميذ ومتابعة أدائهم التربوي</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
             <div className="relative w-full sm:w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="بحث عن تلميذ (الاسم، الرقم الوطني)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
                />
            </div>
            <button 
                onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                className="flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 whitespace-nowrap"
            >
                <UserPlus size={20} />
                <span>إضافة تلميذ</span>
            </button>
        </div>
      </div>

      {/* Stage Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 px-2 font-bold text-sm">
             <Filter size={16} />
             <span>تصفية حسب الطور:</span>
          </div>
          <div className="flex flex-wrap gap-1 flex-1">
            {stages.map((stage) => (
                <button
                    key={stage.id}
                    onClick={() => setSelectedStage(stage.id as any)}
                    className={`flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                        selectedStage === stage.id
                            ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                    {stage.label}
                </button>
            ))}
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50/80 border-b border-gray-200 backdrop-blur-sm sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-gray-700">التلميذ</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-700">الرقم الوطني</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-700">القسم</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-700">نقاط السلوك</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-700">الحالة</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-700">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((student) => {
                const isAttentionRequired = student.totalPoints < -5;
                const academicAvg = student.academicRecords?.[0]?.average || 0;
                const isDistinguished = academicAvg >= 12;
                const isLowAcademic = academicAvg > 0 && academicAvg < 10;
                
                // Determine row class based on status
                const rowClass = isAttentionRequired && !isDistinguished
                    ? 'bg-red-50 hover:bg-red-100 border-red-100'
                    : 'bg-white even:bg-gray-50/50 hover:bg-indigo-50/30';

                return (
                <tr 
                    key={student.id} 
                    className={`transition-all duration-200 border-b border-gray-50 last:border-none ${rowClass}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={student.avatarUrl} alt={student.name} className="w-10 h-10 rounded-full object-cover bg-gray-100 border border-gray-200" />
                      <div>
                          <p className="font-bold text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">
                              {student.stage === EducationStage.ELEMENTARY ? 'الطور الابتدائي' : student.stage === EducationStage.MIDDLE ? 'الطور المتوسط' : 'الطور الثانوي'}
                          </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-sm tracking-wide" dir="ltr">{student.nationalId || '-'}</td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{student.grade}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       {isAttentionRequired && !isDistinguished ? (
                           <AlertTriangle size={18} className="text-red-500" />
                       ) : (
                           <Award size={16} className={student.totalPoints >= 0 ? "text-yellow-500" : "text-gray-400"} />
                       )}
                       <span className={`font-bold ${student.totalPoints < 0 ? 'text-red-600' : 'text-green-600'}`}>
                         {student.totalPoints > 0 ? '+' : ''}{student.totalPoints}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isAttentionRequired && !isDistinguished ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                        تدخل فوري
                      </span>
                    ) : isDistinguished ? (
                       <div className="flex flex-col items-start gap-1">
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                متميز
                           </span>
                           <span className="text-[10px] text-green-600 font-mono font-bold">معدل: {academicAvg}</span>
                       </div>
                    ) : isLowAcademic ? (
                       <div className="flex flex-col items-start gap-1">
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                                <Book size={10} className="mr-1" /> ضعف دراسي
                           </span>
                           <span className="text-[10px] text-orange-600 font-mono font-bold">معدل: {academicAvg}</span>
                       </div>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        طبيعي
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex items-center justify-end gap-2">
                         <button 
                            onClick={() => openEditModal(student)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors shadow-sm"
                            title="تعديل البيانات"
                        >
                          <Pen size={14} />
                        </button>
                        <Link 
                          to={`/students/${student.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors shadow-sm"
                          title="عرض التفاصيل"
                        >
                          <ChevronLeft size={18} />
                        </Link>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        {filteredStudents.length === 0 && (
            <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
                    <Search size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">لا توجد نتائج</h3>
                <p className="text-gray-500">لم يتم العثور على أي تلاميذ يطابقون معايير البحث.</p>
            </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary-100 p-2 rounded-lg">
                             <UserPlus size={24} className="text-primary-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                {isEditModalOpen ? 'تعديل بيانات تلميذ' : 'تسجيل تلميذ جديد'}
                            </h3>
                            <p className="text-xs text-gray-500">يرجى ملء جميع البيانات بدقة.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} 
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={isEditModalOpen ? handleEditSubmit : handleAddSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Info Section */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-500 border-b pb-2 mb-2">البيانات الشخصية</h4>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">الاسم الكامل</label>
                                <div className="relative">
                                    <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input 
                                        type="text" name="name" required
                                        value={formData.name} onChange={handleInputChange}
                                        placeholder="اللقب والاسم"
                                        className="w-full pr-9 pl-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">تاريخ الميلاد</label>
                                <div className="relative">
                                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input 
                                        type="date" name="dateOfBirth"
                                        value={formData.dateOfBirth} onChange={handleInputChange}
                                        className="w-full pr-9 pl-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">الرقم المدرسي الوطني (16 رقم)</label>
                                <div className="relative">
                                    <Hash className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input 
                                        type="text" name="nationalId" required
                                        value={formData.nationalId} onChange={handleNationalIdChange}
                                        placeholder="XXXXXXXXXXXXXXXX"
                                        className="w-full pr-9 pl-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono dir-ltr text-right tracking-widest text-sm"
                                        dir="ltr"
                                    />
                                </div>
                                <div className="flex justify-end mt-1">
                                    <span className={`text-[10px] ${formData.nationalId.length === 16 ? 'text-green-600' : 'text-gray-400'}`}>
                                        {formData.nationalId.length} / 16
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Academic Info Section */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-500 border-b pb-2 mb-2">البيانات الدراسية</h4>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">الطور الدراسي</label>
                                <select 
                                    name="stage"
                                    value={formData.stage} onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                >
                                    <option value={EducationStage.ELEMENTARY}>الطور الابتدائي</option>
                                    <option value={EducationStage.MIDDLE}>الطور المتوسط</option>
                                    <option value={EducationStage.HIGH}>الطور الثانوي</option>
                                </select>
                            </div>
                            
                            {/* Dynamic Grade Input based on Stage */}
                            {formData.stage === EducationStage.MIDDLE ? (
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">القسم</label>
                                    <div className="flex gap-2">
                                        <select 
                                            name="middleLevel"
                                            value={formData.middleLevel}
                                            onChange={handleInputChange}
                                            className="w-2/3 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 text-sm"
                                        >
                                            <option value="أولى متوسط">أولى متوسط</option>
                                            <option value="ثانية متوسط">ثانية متوسط</option>
                                            <option value="ثالثة متوسط">ثالثة متوسط</option>
                                            <option value="رابعة متوسط">رابعة متوسط</option>
                                        </select>
                                        <input 
                                            type="text" 
                                            name="classNumber"
                                            value={formData.classNumber}
                                            onChange={handleInputChange}
                                            placeholder="رقم الفوج (1)"
                                            className="w-1/3 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 text-sm text-center"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">النتيجة: {formData.middleLevel} {formData.classNumber}</p>
                                </div>
                            ) : formData.stage === EducationStage.HIGH ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">المستوى</label>
                                        <select 
                                            name="secondaryYear"
                                            value={formData.secondaryYear}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 text-sm"
                                        >
                                            {SECONDARY_DATA.map(year => (
                                                <option key={year.id} value={year.id}>{year.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {activeSecondaryYear && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">الشعبة / الجذع</label>
                                            <select 
                                                name="secondaryTrack"
                                                value={formData.secondaryTrack}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 text-sm"
                                            >
                                                <option value="">-- اختر الشعبة --</option>
                                                {activeSecondaryYear.tracks.map(track => (
                                                    <option key={track.name} value={track.name}>{track.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {activeTrack && activeTrack.specialties.length > 0 && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">التخصص</label>
                                            <select 
                                                name="secondarySpecialty"
                                                value={formData.secondarySpecialty}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 text-sm"
                                            >
                                                <option value="">-- اختر التخصص --</option>
                                                {activeTrack.specialties.map(spec => (
                                                    <option key={spec} value={spec}>{spec}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-gray-400 mt-1">النتيجة: {formData.grade}</p>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">القسم</label>
                                    <div className="relative">
                                        <Book className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input 
                                            type="text" name="grade" required
                                            value={formData.grade} onChange={handleInputChange}
                                            placeholder="مثال: 5 ابتدائي 2"
                                            className="w-full pr-9 pl-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">تاريخ التسجيل</label>
                                <input 
                                    type="date" name="enrollmentDate"
                                    value={formData.enrollmentDate} onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                />
                            </div>
                        </div>

                        {/* Contact Info (Optional) */}
                        <div className="col-span-1 md:col-span-2 space-y-4">
                            <h4 className="text-sm font-bold text-gray-500 border-b pb-2 mb-2">معلومات الولي (اختياري)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">اسم الولي</label>
                                    <input 
                                        type="text" name="parentName"
                                        value={formData.parentName} onChange={handleInputChange}
                                        placeholder="اسم الأب أو الوصي"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">رقم الهاتف</label>
                                    <div className="relative">
                                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input 
                                            type="tel" name="parentPhone"
                                            value={formData.parentPhone} onChange={handleInputChange}
                                            placeholder="0X XX XX XX XX"
                                            className="w-full pr-9 pl-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm text-left"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-6 flex gap-3 border-t border-gray-100 mt-6">
                        <button 
                            type="submit" 
                            className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                        >
                            {isEditModalOpen ? 'حفظ التغييرات' : <><Plus size={20} /> حفظ الملف</>}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default StudentsList;
