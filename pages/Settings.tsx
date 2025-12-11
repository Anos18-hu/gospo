import React, { useState, useRef } from 'react';
import { Save, Building2, UserCircle, Key, Download, Trash2, CheckCircle2, AlertTriangle, RefreshCcw, Upload, Image as ImageIcon } from 'lucide-react';
import { Student, BehaviorLog } from '../types';

interface SettingsProps {
    institutionName: string;
    counselorName: string;
    counselorRole: string;
    activationCode: string;
    students: Student[];
    logs: BehaviorLog[];
    scaleResults?: Record<string, any[]>;
    logoUrl?: string | null;
    onUpdateSettings: (instName: string, counsName: string, counsRole: string, code: string) => void;
    onUpdateLogo?: (url: string | null) => void;
    onResetData: () => void;
    onRestoreData: (data: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
    institutionName, 
    counselorName, 
    counselorRole, 
    activationCode,
    students,
    logs,
    scaleResults,
    logoUrl,
    onUpdateSettings,
    onUpdateLogo,
    onResetData,
    onRestoreData
}) => {
    const [formInstName, setFormInstName] = useState(institutionName);
    const [formCounsName, setFormCounsName] = useState(counselorName);
    const [formCounsRole, setFormCounsRole] = useState(counselorRole);
    const [formCode, setFormCode] = useState(activationCode);
    
    const [showToast, setShowToast] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSettings(formInstName, formCounsName, formCounsRole, formCode);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handleExportData = () => {
        const data = {
            students,
            logs,
            scaleResults,
            settings: {
                institutionName,
                counselorName,
                counselorRole,
                logoUrl
            },
            exportDate: new Date().toISOString()
        };

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = `taqweem_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        onResetData();
        setShowDeleteConfirm(false);
        alert('تم حذف جميع البيانات بنجاح.');
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                onRestoreData(json);
                alert('تم استعادة البيانات بنجاح!');
            } catch (error) {
                console.error(error);
                alert('حدث خطأ أثناء قراءة الملف. يرجى التأكد من صحة ملف النسخة الاحتياطية.');
            }
        };
        reader.readAsText(file);
        // Reset input so same file can be selected again if needed
        e.target.value = '';
    };

    const handleLogoClick = () => {
        logoInputRef.current?.click();
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Check size (e.g. max 1MB)
        if (file.size > 1024 * 1024) {
            alert('حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 1 ميغابايت.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            if (onUpdateLogo) {
                onUpdateLogo(result);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
             <div>
                <h1 className="text-2xl font-bold text-gray-900">الإعدادات العامة</h1>
                <p className="text-gray-500 mt-1">تخصيص التطبيق وإدارة البيانات</p>
             </div>

             {/* General Settings Form */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <UserCircle size={20} className="text-primary-600" />
                        بيانات المؤسسة والمستشار
                    </h2>
                </div>
                <div className="p-6 space-y-6">
                    {/* Logo Section */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center gap-6">
                        <div className="shrink-0">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-20 h-20 object-contain bg-white rounded-lg border border-gray-200" />
                            ) : (
                                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                                    <ImageIcon size={32} />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">شعار المؤسسة</h3>
                            <p className="text-sm text-gray-500 mb-2">يظهر الشعار في القائمة الجانبية وعلى التقارير المطبوعة.</p>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleLogoClick}
                                    className="text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    رفع شعار
                                </button>
                                {logoUrl && (
                                    <button 
                                        onClick={() => onUpdateLogo && onUpdateLogo(null)}
                                        className="text-sm bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                                    >
                                        حذف
                                    </button>
                                )}
                            </div>
                            <input 
                                type="file" 
                                ref={logoInputRef}
                                onChange={handleLogoChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">اسم المؤسسة</label>
                                <div className="relative">
                                    <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="text"
                                        value={formInstName}
                                        onChange={(e) => setFormInstName(e.target.value)}
                                        className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="أدخل اسم المؤسسة التربوية"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">كود التفعيل (اختياري)</label>
                                <div className="relative">
                                    <Key className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="text"
                                        value={formCode}
                                        onChange={(e) => setFormCode(e.target.value)}
                                        className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                                        placeholder="XXXX-XXXX-XXXX"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">اسم المستشار / المستخدم</label>
                                <input 
                                    type="text"
                                    value={formCounsName}
                                    onChange={(e) => setFormCounsName(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="الاسم واللقب"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">الصفة الوظيفية</label>
                                <input 
                                    type="text"
                                    value={formCounsRole}
                                    onChange={(e) => setFormCounsRole(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="مثال: مستشار التوجيه والإرشاد"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button 
                                type="submit" 
                                className="bg-primary-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition-colors flex items-center gap-2"
                            >
                                <Save size={18} /> حفظ التغييرات
                            </button>
                        </div>
                    </form>
                </div>
             </div>

             {/* Data Management Section */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <RefreshCcw size={20} className="text-primary-600" />
                        إدارة البيانات والنسخ الاحتياطي
                    </h2>
                </div>
                <div className="p-6 space-y-6">
                    {/* Export */}
                    <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Download size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">تصدير قاعدة البيانات</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                قم بتحميل نسخة كاملة من بيانات التلاميذ، السجلات، والمقابلات في ملف JSON للحفظ الآمن.
                            </p>
                        </div>
                        <button 
                            onClick={handleExportData}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                            تحميل نسخة
                        </button>
                    </div>

                    {/* Import */}
                    <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-100 rounded-xl">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <Upload size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">استيراد نسخة احتياطية</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                استعادة البيانات من ملف JSON تم تصديره سابقاً. سيتم استبدال البيانات الحالية.
                            </p>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".json"
                            className="hidden"
                        />
                        <button 
                            onClick={handleImportClick}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors whitespace-nowrap"
                        >
                            رفع ملف
                        </button>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="font-bold text-red-600 flex items-center gap-2 mb-4">
                            <AlertTriangle size={20} /> منطقة الخطر
                        </h3>
                        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl">
                            <div>
                                <h4 className="font-bold text-gray-900">حذف جميع البيانات</h4>
                                <p className="text-sm text-gray-500 mt-1">
                                    هذا الإجراء سيقوم بمسح كافة التلاميذ والسجلات والمقابلات. لا يمكن التراجع عن هذه الخطوة.
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowDeleteConfirm(true)}
                                className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-600 hover:text-white transition-colors whitespace-nowrap"
                            >
                                <Trash2 size={18} className="inline ml-2" />
                                حذف البيانات
                            </button>
                        </div>
                    </div>
                </div>
             </div>

             <div className="text-center text-sm text-gray-400 mt-8">
                <p>Taqweem App v1.3.0 - Developed for Educational Guidance</p>
             </div>

            {/* Success Toast */}
            {showToast && (
                <div className="fixed bottom-6 left-6 z-50 bg-gray-900 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in">
                    <div className="bg-green-500 rounded-full p-1.5">
                        <CheckCircle2 size={16} strokeWidth={3} className="text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">تم الحفظ بنجاح</p>
                        <p className="text-xs text-gray-400">تم تحديث الإعدادات العامة</p>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-fade-in">
                        <div className="flex justify-center mb-4 text-red-600">
                            <div className="bg-red-100 p-4 rounded-full">
                                <AlertTriangle size={32} />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-center text-gray-900 mb-2">هل أنت متأكد؟</h3>
                        <p className="text-center text-gray-500 mb-6 text-sm">
                            سيتم حذف جميع البيانات المسجلة نهائياً. يرجى التأكد من أنك قمت بتصدير نسخة احتياطية أولاً.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={handleReset}
                                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-bold hover:bg-red-700 transition-colors"
                            >
                                نعم، حذف الكل
                            </button>
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;