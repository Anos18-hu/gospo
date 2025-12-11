
import React, { useState, useRef } from 'react';
import { FolderOpen, FileText, Download, Upload, Filter, Briefcase, Book, Scale, ClipboardList, Plus, Search, X, Save, CheckCircle2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DocumentItem {
    id: string;
    title: string;
    category: 'ADMIN' | 'PEDAGOGICAL' | 'PSYCH' | 'LEGAL';
    type: string;
    date: string;
    size: string;
}

const Documents: React.FC = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'ADMIN' | 'PEDAGOGICAL' | 'PSYCH' | 'LEGAL'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showToast, setShowToast] = useState(false);

    // Upload Modal State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [newDocTitle, setNewDocTitle] = useState('');
    const [newDocCategory, setNewDocCategory] = useState<'ADMIN' | 'PEDAGOGICAL' | 'PSYCH' | 'LEGAL'>('ADMIN');

    // Documents State
    const [documents, setDocuments] = useState<DocumentItem[]>([
        { id: '1', title: 'البرنامج السنوي للتوجيه والإرشاد', category: 'PEDAGOGICAL', type: 'DOCX', date: '2024-09-05', size: '1.2 MB' },
        { id: '2', title: 'استمارة متابعة تلميذ (نموذج 1)', category: 'PSYCH', type: 'PDF', date: '2023-11-15', size: '450 KB' },
        { id: '3', title: 'التقرير الفصلي لنشاطات التوجيه', category: 'ADMIN', type: 'DOCX', date: '2024-01-10', size: '2.5 MB' },
        { id: '4', title: 'المنشور الوزاري رقم 12 (الإجراءات التأديبية)', category: 'LEGAL', type: 'PDF', date: '2022-03-20', size: '3.1 MB' },
        { id: '5', title: 'بطاقة المعلومات الشخصية للتلميذ', category: 'ADMIN', type: 'XLSX', date: '2023-09-01', size: '120 KB' },
        { id: '6', title: 'دليل المقابلات الفردية والجماعية', category: 'PSYCH', type: 'PDF', date: '2024-02-12', size: '5.6 MB' },
        { id: '7', title: 'استدعاء ولي أمر تلميذ', category: 'ADMIN', type: 'DOCX', date: '2023-10-05', size: '85 KB' },
        { id: '8', title: 'مخطط الدعم والاستدراك البيداغوجي', category: 'PEDAGOGICAL', type: 'XLSX', date: '2024-01-20', size: '1.8 MB' },
        { id: '9', title: 'محضر جلسة تنسيق مع الأساتذة', category: 'PEDAGOGICAL', type: 'DOCX', date: '2024-03-15', size: '500 KB' },
        { id: '10', title: 'القانون الداخلي للمؤسسة (نموذج)', category: 'LEGAL', type: 'DOCX', date: '2022-09-01', size: '2.1 MB' },
    ]);

    const filteredDocs = documents.filter(doc => {
        const matchesCategory = selectedCategory === 'ALL' || doc.category === selectedCategory;
        const matchesSearch = doc.title.includes(searchTerm);
        return matchesCategory && matchesSearch;
    });

    const getCategoryLabel = (cat: string) => {
        switch (cat) {
            case 'ADMIN': return 'وثائق إدارية';
            case 'PEDAGOGICAL': return 'وثائق بيداغوجية';
            case 'PSYCH': return 'وثائق نفسية';
            case 'LEGAL': return 'نصوص تشريعية';
            default: return cat;
        }
    };

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'ADMIN': return 'bg-blue-100 text-blue-700';
            case 'PEDAGOGICAL': return 'bg-green-100 text-green-700';
            case 'PSYCH': return 'bg-purple-100 text-purple-700';
            case 'LEGAL': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getTypeIcon = (type: string) => {
        return <FileText size={24} className="text-gray-400" />;
    };

    const handleDownload = (docTitle: string) => {
        alert(`جاري تحميل الملف: ${docTitle} ...\n(هذه ميزة تجريبية)`);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPendingFile(file);
            setNewDocTitle(file.name.split('.').slice(0, -1).join('.'));
            setIsUploadModalOpen(true);
        }
        // Reset input
        e.target.value = '';
    };

    const handleSaveDocument = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pendingFile || !newDocTitle) return;

        const extension = pendingFile.name.split('.').pop()?.toUpperCase() || 'FILE';
        
        const newDoc: DocumentItem = {
            id: Date.now().toString(),
            title: newDocTitle,
            category: newDocCategory,
            type: extension as any,
            date: new Date().toISOString().split('T')[0],
            size: formatFileSize(pendingFile.size)
        };

        setDocuments(prev => [newDoc, ...prev]);
        setIsUploadModalOpen(false);
        setPendingFile(null);
        setNewDocTitle('');
        
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">وثائق عمل المستشار</h1>
                    <p className="text-gray-500 mt-1">المكتبة الرقمية للوثائق وأدوات التخطيط</p>
                </div>
                <div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                    />
                    <button 
                        onClick={handleUploadClick}
                        className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20"
                    >
                        <Upload size={20} />
                        <span>رفع وثيقة جديدة</span>
                    </button>
                </div>
            </div>

            {/* Quick Tools Section */}
            <div className="bg-gradient-to-r from-indigo-500 to-primary-600 rounded-xl p-6 text-white shadow-md">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Briefcase size={20} /> أدوات التخطيط السريع
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                        onClick={() => navigate('/annual-schedule')}
                        className="bg-white/20 hover:bg-white/30 p-4 rounded-lg flex items-center gap-4 transition-all border border-white/10"
                    >
                        <div className="bg-white text-primary-600 p-2 rounded-lg">
                            <Calendar size={24} />
                        </div>
                        <div className="text-right">
                            <h4 className="font-bold">البرنامج السنوي التقديري</h4>
                            <p className="text-xs text-indigo-100 opacity-90">إعداد وطباعة البرنامج السنوي (متوسط)</p>
                        </div>
                    </button>
                    
                    <button 
                        onClick={() => navigate('/schedule')}
                        className="bg-white/20 hover:bg-white/30 p-4 rounded-lg flex items-center gap-4 transition-all border border-white/10"
                    >
                        <div className="bg-white text-primary-600 p-2 rounded-lg">
                            <ClipboardList size={24} />
                        </div>
                        <div className="text-right">
                            <h4 className="font-bold">البرنامج الأسبوعي</h4>
                            <p className="text-xs text-indigo-100 opacity-90">إعداد وطباعة جدول النشاطات الأسبوعية</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Categories & Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative w-full md:w-64">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="بحث عن وثيقة..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    <Filter size={18} className="text-gray-400 shrink-0" />
                    {[
                        { id: 'ALL', label: 'الكل', icon: FolderOpen },
                        { id: 'ADMIN', label: 'إدارية', icon: Briefcase },
                        { id: 'PEDAGOGICAL', label: 'بيداغوجية', icon: Book },
                        { id: 'PSYCH', label: 'نفسية', icon: ClipboardList },
                        { id: 'LEGAL', label: 'تشريع', icon: Scale },
                    ].map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                                selectedCategory === cat.id 
                                    ? 'bg-primary-600 text-white shadow-md' 
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <cat.icon size={16} />
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocs.map((doc) => (
                    <div key={doc.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-primary-50 transition-colors">
                                {getTypeIcon(doc.type)}
                            </div>
                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${getCategoryColor(doc.category)}`}>
                                {getCategoryLabel(doc.category)}
                            </span>
                        </div>
                        
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 h-12 leading-relaxed" title={doc.title}>
                            {doc.title}
                        </h3>
                        
                        <div className="flex items-center justify-between text-xs text-gray-400 mt-4 pt-4 border-t border-gray-50">
                            <span>{doc.date}</span>
                            <span>{doc.size}</span>
                            <span className="font-bold font-mono">{doc.type}</span>
                        </div>

                        <button 
                            onClick={() => handleDownload(doc.title)}
                            className="absolute top-4 left-4 p-2 text-gray-300 hover:text-primary-600 transition-colors bg-white rounded-lg border border-transparent hover:border-gray-100 shadow-sm opacity-0 group-hover:opacity-100"
                            title="تحميل"
                        >
                            <Download size={18} />
                        </button>
                    </div>
                ))}
                
                {/* Empty State */}
                {filteredDocs.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FolderOpen size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">لا توجد وثائق</h3>
                        <p className="text-gray-500 text-sm">لم يتم العثور على وثائق تطابق بحثك.</p>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Upload size={20} className="text-primary-600" />
                                رفع وثيقة جديدة
                            </h3>
                            <button onClick={() => setIsUploadModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveDocument} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الملف</label>
                                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-200 mb-3 dir-ltr text-left truncate">
                                    {pendingFile?.name}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الوثيقة (للعرض)</label>
                                <input 
                                    type="text"
                                    required
                                    value={newDocTitle}
                                    onChange={(e) => setNewDocTitle(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
                                <select 
                                    value={newDocCategory}
                                    onChange={(e) => setNewDocCategory(e.target.value as any)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="ADMIN">وثائق إدارية</option>
                                    <option value="PEDAGOGICAL">وثائق بيداغوجية</option>
                                    <option value="PSYCH">وثائق نفسية</option>
                                    <option value="LEGAL">نصوص تشريعية</option>
                                </select>
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="submit" 
                                    className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg font-bold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save size={18} /> حفظ الوثيقة
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Success Toast */}
            {showToast && (
                <div className="fixed bottom-6 left-6 z-50 bg-gray-900 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in">
                    <div className="bg-green-500 rounded-full p-1.5">
                        <CheckCircle2 size={16} strokeWidth={3} className="text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">تم الرفع بنجاح</p>
                        <p className="text-xs text-gray-400">تمت إضافة الوثيقة إلى المكتبة</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Documents;
