
import React, { useState } from 'react';
import { Printer, Calendar, Eraser, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WeeklySchedule: React.FC = () => {
  const navigate = useNavigate();

  // State for Header Info
  const [headerInfo, setHeaderInfo] = useState({
    wilaya: 'جيجل',
    center: '',
    year: '2023/2024',
    fromDate: '2023/09/25',
    toDate: '2023/09/29',
  });

  // State for Schedule Rows (Defaulting to the days in the screenshot)
  const [rows, setRows] = useState([
    { day: 'الأحد', activity: 'مرافقة التلاميذ في فترة الدخول المدرسي', goal: 'مرافقة وتحضير التلميذ نفسيا للرجوع إلى نظام الدراسة العادي', target: 'جميع المستويات', evaluation: '' },
    { day: 'الاثنين', activity: 'تنصيب وتحيين لجنة الإرشاد والمتابعة', goal: 'ضمان استمرارية العملية الإرشادية بالمتوسطة', target: 'جميع المستويات', evaluation: '' },
    { day: 'الثلاثاء', activity: 'تحليل نتائج شهادة التعليم المتوسط', goal: 'استنطاق المعطيات المتحصل عليها وتفسيرها وتشخيص نقاط القوة والضعف', target: 'الرابعة متوسط', evaluation: '' },
    { day: 'الأربعاء', activity: 'مرافقة التلاميذ في فترة الدخول المدرسي', goal: 'مرافقة وتحضير التلميذ نفسيا للرجوع إلى نظام الدراسة العادي', target: 'جميع المستويات', evaluation: '' },
    { day: 'الخميس', activity: 'استقبالات أولياء، تلاميذ، أساتذة', goal: 'الرد على استفساراتهم وضمان سيولة الإعلام', target: 'جميع المستويات', evaluation: '' },
  ]);

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>البرمجة الأسبوعية</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Tajawal', sans-serif; padding: 20px; color: #000; }
          .header { text-align: center; margin-bottom: 20px; }
          .title-box { border: 2px solid black; padding: 10px 30px; display: inline-block; border-radius: 10px; margin: 20px 0; background: #f9fafb; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; text-align: center; }
          th, td { border: 1px solid black; padding: 10px; font-size: 14px; vertical-align: middle; }
          th { background-color: #e5e7eb; font-weight: bold; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; padding: 0 50px; }
          input { border: none; background: transparent; text-align: center; width: 100%; font-family: inherit; }
        </style>
      </head>
      <body>
        <div class="header">
          <h3>الجمهورية الجزائرية الديمقراطية الشعبية</h3>
          <h3>وزارة التربية الوطنية</h3>
          <div style="display: flex; justify-content: space-between; margin-top: 30px; padding: 0 20px;">
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
                <h1 style="margin: 0; font-size: 24px;">البرمجة الأسبوعية التقديرية للنشاطات</h1>
            </div>
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 20px;">
                من: ${headerInfo.fromDate} &nbsp;&nbsp;&nbsp; إلى: ${headerInfo.toDate}
            </div>
        </div>

        <table>
          <thead>
            <tr>
              <th width="10%">الأيام</th>
              <th width="35%">النشاط المبرمج</th>
              <th width="30%">الهدف من النشاط</th>
              <th width="15%">الفئة المستهدفة</th>
              <th width="10%">التقييم</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                <td style="background-color: #f9fafb; font-weight: bold;">${row.day}</td>
                <td>${row.activity}</td>
                <td>${row.goal}</td>
                <td>${row.target}</td>
                <td>${row.evaluation}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
            <div style="text-align: center;">
                <p>مدير مركز التوجيه المدرسي</p>
                <br><br><br>
            </div>
            <div style="text-align: center;">
                <p>مستشار(ة) التوجيه .إ .م .م</p>
                <br><br><br>
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
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const handleClear = () => {
    if (window.confirm('هل أنت متأكد من مسح جميع الحقول؟')) {
        setRows(rows.map(r => ({ ...r, activity: '', goal: '', target: '', evaluation: '' })));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate('/documents')} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <ArrowRight size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="text-primary-600" />
                البرمجة الأسبوعية للنشاطات
              </h1>
              <p className="text-gray-500 text-sm mt-1">تعبئة وطباعة المخطط الأسبوعي التقديري.</p>
            </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleClear}
            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-200"
          >
            <Eraser size={18} /> مسح المحتوى
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-bold shadow-lg shadow-primary-500/20"
          >
            <Printer size={18} /> طباعة الوثيقة
          </button>
        </div>
      </div>

      {/* Document Preview (Interactive Area) */}
      <div className="overflow-auto bg-gray-100 p-4 md:p-8 rounded-xl border border-gray-200">
        <div 
            className="bg-white mx-auto shadow-2xl p-8 min-h-[297mm] w-[210mm] relative text-black"
            style={{ fontFamily: "'Tajawal', sans-serif" }}
        >
            {/* Header */}
            <div className="text-center mb-8 space-y-1">
                <h2 className="font-bold text-lg">الجمهورية الجزائرية الديمقراطية الشعبية</h2>
                <h3 className="font-bold text-lg">وزارة التربية الوطنية</h3>
                <div className="flex justify-between items-end mt-6 px-4">
                    <div className="text-right w-1/3">
                        <p>مديرية التربية لولاية: <input type="text" name="wilaya" value={headerInfo.wilaya} onChange={handleHeaderChange} className="border-b border-dotted border-gray-400 focus:outline-none w-24 text-center font-bold" /></p>
                        <p>مركز التوجيه المدرسي والمهني: <input type="text" name="center" value={headerInfo.center} onChange={handleHeaderChange} className="border-b border-dotted border-gray-400 focus:outline-none w-24 text-center" /></p>
                    </div>
                    <div className="text-left w-1/3">
                        <p>السنة الدراسية: <input type="text" name="year" value={headerInfo.year} onChange={handleHeaderChange} className="border-b border-dotted border-gray-400 focus:outline-none w-24 text-center font-bold dir-ltr" /></p>
                    </div>
                </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6 mt-10">
                <h1 className="text-3xl font-extrabold border-2 border-black inline-block px-8 py-2 rounded-lg shadow-sm bg-gray-50">
                    البرمجة الأسبوعية التقديرية للنشاطات
                </h1>
                <div className="mt-4 flex justify-center items-center gap-4 text-lg font-bold">
                    <span>من: <input type="text" name="fromDate" value={headerInfo.fromDate} onChange={handleHeaderChange} className="border-b border-black focus:outline-none w-28 text-center" /></span>
                    <span>إلى: <input type="text" name="toDate" value={headerInfo.toDate} onChange={handleHeaderChange} className="border-b border-black focus:outline-none w-28 text-center" /></span>
                </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-black mb-8 text-center">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border border-black p-2 w-[10%]">الأيام</th>
                        <th className="border border-black p-2 w-[35%]">النشاط المبرمج</th>
                        <th className="border border-black p-2 w-[30%]">الهدف من النشاط</th>
                        <th className="border border-black p-2 w-[15%]">الفئة المستهدفة</th>
                        <th className="border border-black p-2 w-[10%]">التقييم</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={index}>
                            <td className="border border-black p-2 bg-gray-50 font-bold">{row.day}</td>
                            <td className="border border-black p-0">
                                <textarea 
                                    value={row.activity}
                                    onChange={(e) => handleRowChange(index, 'activity', e.target.value)}
                                    className="w-full h-full p-2 resize-none focus:bg-blue-50 focus:outline-none text-right min-h-[60px]"
                                />
                            </td>
                            <td className="border border-black p-0">
                                <textarea 
                                    value={row.goal}
                                    onChange={(e) => handleRowChange(index, 'goal', e.target.value)}
                                    className="w-full h-full p-2 resize-none focus:bg-blue-50 focus:outline-none text-right min-h-[60px]"
                                />
                            </td>
                            <td className="border border-black p-0">
                                <textarea 
                                    value={row.target}
                                    onChange={(e) => handleRowChange(index, 'target', e.target.value)}
                                    className="w-full h-full p-2 resize-none focus:bg-blue-50 focus:outline-none text-center min-h-[60px]"
                                />
                            </td>
                            <td className="border border-black p-0">
                                <textarea 
                                    value={row.evaluation}
                                    onChange={(e) => handleRowChange(index, 'evaluation', e.target.value)}
                                    className="w-full h-full p-2 resize-none focus:bg-blue-50 focus:outline-none text-center min-h-[60px]"
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Footer / Signatures */}
            <div className="flex justify-between items-start mt-12 px-8">
                <div className="text-center">
                    <p className="font-bold mb-16">مدير مركز التوجيه المدرسي</p>
                </div>
                <div className="text-center">
                    <p className="font-bold mb-16">مستشار(ة) التوجيه .إ .م .م</p>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default WeeklySchedule;
