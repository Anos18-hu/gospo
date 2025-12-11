
import React, { useState } from 'react';
import { Printer, Calendar, Eraser, Save, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AnnualSchedule: React.FC = () => {
  const navigate = useNavigate();
  
  // State for Header Info
  const [headerInfo, setHeaderInfo] = useState({
    wilaya: 'جيجل',
    center: '',
    year: '2023/2024',
    counselorName: '....................',
    directorName: '....................'
  });

  // Default Middle School Annual Program Data
  const [months, setMonths] = useState([
    { 
        month: 'سبتمبر', 
        objectives: 'الاستقبال، التكيف، والتحضير النفسي', 
        activities: '- المشاركة في تحضير الدخول المدرسي\n- استقبال تلاميذ السنة الأولى متوسط\n- المساعدة في تشكيل الأفواج التربوية', 
        target: 'جميع المستويات', 
        observation: '' 
    },
    { 
        month: 'أكتوبر', 
        objectives: 'التشخيص والتعرف على التلاميذ', 
        activities: '- ملء البطاقة الفردية والمتابعة\n- اكتشاف حالات صعوبات التعلم\n- انتخاب مندوبي الأقسام', 
        target: '1 متوسط + جدد', 
        observation: '' 
    },
    { 
        month: 'نوفمبر', 
        objectives: 'الإعلام والمتابعة البيداغوجية', 
        activities: '- حملات إعلامية حول النظام الداخلي\n- تنظيم حصص حول منهجية الاستذكار\n- التحضير لفروض الفصل الأول', 
        target: 'جميع المستويات', 
        observation: '' 
    },
    { 
        month: 'ديسمبر', 
        objectives: 'التقييم الفصلي الأول', 
        activities: '- المشاركة في مجالس الأقسام\n- تحليل نتائج الفصل الأول\n- استقبال الأولياء لمناقشة النتائج', 
        target: 'الأساتذة والأولياء', 
        observation: '' 
    },
    { 
        month: 'جانفي', 
        objectives: 'الإعلام المدرسي (التوجيه المسبق)', 
        activities: '- التحسيس بأهمية التوجيه (الرابعة متوسط)\n- التعريف بالجذوع المشتركة للتعليم الثانوي\n- تنظيم أبواب مفتوحة على التوجيه', 
        target: 'الرابعة متوسط', 
        observation: '' 
    },
    { 
        month: 'فيفري', 
        objectives: 'المتابعة النفسية والتحفيز', 
        activities: '- التكفل بالتلاميذ المتأخرين دراسياً\n- المقابلات الفردية لتعزيز الدافعية\n- التحضير لفروض الفصل الثاني', 
        target: 'المتعثرين دراسياً', 
        observation: '' 
    },
    { 
        month: 'مارس', 
        objectives: 'التقييم الفصلي الثاني', 
        activities: '- المشاركة في مجالس الأقسام للفصل الثاني\n- تحليل النتائج وتحديد مؤشرات التوجيه\n- بطاقة الرغبات (الرابعة متوسط)', 
        target: 'جميع المستويات', 
        observation: '' 
    },
    { 
        month: 'أفريل', 
        objectives: 'الإعلام وتصحيح الرغبات', 
        activities: '- دراسة رغبات تلاميذ الرابعة متوسط\n- الطعون وتعديل الرغبات\n- تنظيم حصص حول قلق الامتحانات', 
        target: 'الرابعة متوسط', 
        observation: '' 
    },
    { 
        month: 'ماي', 
        objectives: 'التحضير للامتحانات الرسمية', 
        activities: '- الإرشاد النفسي للمقبلين على شهادة BEM\n- نصائح حول التغذية والنوم والمراجعة النهائية\n- زيارة مراكز الامتحان (إن أمكن)', 
        target: 'الرابعة متوسط', 
        observation: '' 
    },
    { 
        month: 'جوان', 
        objectives: 'التقييم السنوي والختامي', 
        activities: '- المشاركة في مجالس القبول والتوجيه\n- إعداد التقرير السنوي لنشاطات التوجيه\n- غلق الملفات والأرشيف', 
        target: 'الطاقم الإداري', 
        observation: '' 
    },
    { 
        month: 'جويلية', 
        objectives: 'الأعمال الإدارية الختامية', 
        activities: '- توقيع محاضر الخروج\n- الترتيبات النهائية للسنة الدراسية القادمة', 
        target: '-', 
        observation: '' 
    }
  ]);

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>البرنامج السنوي التقديري</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Tajawal', sans-serif; padding: 20px; color: #000; }
          .header { text-align: center; margin-bottom: 20px; }
          .title-box { border: 2px solid black; padding: 10px 30px; display: inline-block; border-radius: 10px; margin: 10px 0; background: #f9fafb; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; text-align: center; font-size: 12px; }
          th, td { border: 1px solid black; padding: 6px; vertical-align: middle; }
          th { background-color: #e5e7eb; font-weight: bold; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; padding: 0 30px; }
          .activity-cell { text-align: right; white-space: pre-line; }
          input { border: none; background: transparent; text-align: center; width: 100%; font-family: inherit; font-weight: bold; }
          @page { size: A4 portrait; margin: 10mm; }
        </style>
      </head>
      <body>
        <div class="header">
          <h3>الجمهورية الجزائرية الديمقراطية الشعبية</h3>
          <h3>وزارة التربية الوطنية</h3>
          <div style="display: flex; justify-content: space-between; margin-top: 20px; padding: 0 10px; font-size: 14px;">
             <div style="text-align: right;">
                <p>مديرية التربية لولاية: <b>${headerInfo.wilaya}</b></p>
                <p>مركز التوجيه المدرسي والمهني: <b>${headerInfo.center}</b></p>
             </div>
             <div style="text-align: left;">
                <p>السنة الدراسية: <b dir="ltr">${headerInfo.year}</b></p>
             </div>
          </div>
        </div>

        <div style="text-align: center;">
            <div class="title-box">
                <h1 style="margin: 0; font-size: 20px;">البرنامج السنوي التقديري لنشاطات مستشار التوجيه</h1>
            </div>
        </div>

        <table>
          <thead>
            <tr>
              <th width="8%">الشهر</th>
              <th width="20%">الأهداف</th>
              <th width="40%">النشاطات والعمليات</th>
              <th width="15%">الفئة المستهدفة</th>
              <th width="17%">ملاحظات / تاريخ التنفيذ</th>
            </tr>
          </thead>
          <tbody>
            ${months.map(row => `
              <tr>
                <td style="background-color: #f9fafb; font-weight: bold;">${row.month}</td>
                <td class="activity-cell" style="text-align: center;">${row.objectives}</td>
                <td class="activity-cell">${row.activities}</td>
                <td>${row.target}</td>
                <td>${row.observation}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
            <div style="text-align: center;">
                <p>مستشار(ة) التوجيه</p>
                <p style="margin-top: 5px;">${headerInfo.counselorName}</p>
            </div>
            <div style="text-align: center;">
                <p>مدير(ة) المؤسسة</p>
                <p style="margin-top: 5px;">${headerInfo.directorName}</p>
            </div>
            <div style="text-align: center;">
                <p>مفتش التوجيه المدرسي</p>
                <br>
            </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (win) {
        win.document.write(printContent);
        win.document.close();
    }
  };

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHeaderInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleRowChange = (index: number, field: string, value: string) => {
    const newMonths = [...months];
    newMonths[index] = { ...newMonths[index], [field]: value };
    setMonths(newMonths);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate('/documents')} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <ArrowRight size={20} className="text-gray-600" />
            </button>
            <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="text-primary-600" />
                    البرنامج السنوي التقديري
                </h1>
                <p className="text-gray-500 text-sm mt-1">خاص بمرحلة التعليم المتوسط</p>
            </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-bold shadow-lg shadow-primary-500/20"
          >
            <Printer size={18} /> طباعة البرنامج
          </button>
        </div>
      </div>

      {/* Inputs Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid md:grid-cols-4 gap-4">
          <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">الولاية</label>
              <input type="text" name="wilaya" value={headerInfo.wilaya} onChange={handleHeaderChange} className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">مركز التوجيه</label>
              <input type="text" name="center" value={headerInfo.center} onChange={handleHeaderChange} className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">اسم المستشار</label>
              <input type="text" name="counselorName" value={headerInfo.counselorName} onChange={handleHeaderChange} className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">اسم المدير</label>
              <input type="text" name="directorName" value={headerInfo.directorName} onChange={handleHeaderChange} className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
          </div>
      </div>

      {/* Editable Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
                <thead className="bg-gray-50 text-gray-700 text-sm">
                    <tr>
                        <th className="p-4 border-b border-gray-200 w-24">الشهر</th>
                        <th className="p-4 border-b border-gray-200 w-48">الأهداف</th>
                        <th className="p-4 border-b border-gray-200">النشاطات والعمليات</th>
                        <th className="p-4 border-b border-gray-200 w-32">الفئة المستهدفة</th>
                        <th className="p-4 border-b border-gray-200 w-40">ملاحظات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                    {months.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50/50">
                            <td className="p-3 font-bold text-gray-900 bg-gray-50/30 text-center">{row.month}</td>
                            <td className="p-1">
                                <textarea 
                                    value={row.objectives}
                                    onChange={(e) => handleRowChange(index, 'objectives', e.target.value)}
                                    className="w-full p-2 rounded border-transparent focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-100 bg-transparent resize-none text-right min-h-[60px]"
                                />
                            </td>
                            <td className="p-1">
                                <textarea 
                                    value={row.activities}
                                    onChange={(e) => handleRowChange(index, 'activities', e.target.value)}
                                    className="w-full p-2 rounded border-transparent focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-100 bg-transparent resize-none text-right min-h-[80px]"
                                />
                            </td>
                            <td className="p-1">
                                <textarea 
                                    value={row.target}
                                    onChange={(e) => handleRowChange(index, 'target', e.target.value)}
                                    className="w-full p-2 rounded border-transparent focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-100 bg-transparent resize-none text-center min-h-[60px]"
                                />
                            </td>
                            <td className="p-1">
                                <textarea 
                                    value={row.observation}
                                    onChange={(e) => handleRowChange(index, 'observation', e.target.value)}
                                    placeholder="تاريخ التنفيذ..."
                                    className="w-full p-2 rounded border-transparent focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-100 bg-transparent resize-none text-center min-h-[60px]"
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default AnnualSchedule;
