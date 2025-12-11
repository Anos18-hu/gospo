
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Trophy, AlertTriangle, Search, FileText, Loader2, Printer, Calendar, List, CheckCircle2, XCircle, Users, FileSpreadsheet, MessageSquare, GraduationCap, TrendingUp, TrendingDown, Lightbulb, Activity } from 'lucide-react';
import { Student, BehaviorLog, BehaviorType, ScaleResult, AttendanceStatus, InterviewType } from '../types';

interface ReportsProps {
  students: Student[];
  logs: BehaviorLog[];
  scaleResults: Record<string, ScaleResult[]>;
  logoUrl?: string;
}

type ReportType = 'GENERAL' | 'CRITICAL' | 'EXITED' | 'HONOR' | 'INTERVIEWS' | 'TRANSCRIPT' | 'COMPREHENSIVE';

const Reports: React.FC<ReportsProps> = ({ students, logs, scaleResults, logoUrl }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeReportTab, setActiveReportTab] = useState<ReportType>('GENERAL');
  
  // Transcript State
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Date Filter State
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  // --- Logic Helpers ---

  // 1. Filter logs based on date range
  const filteredLogsByDate = logs.filter(log => {
    const logDate = new Date(log.date);
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    return logDate >= start && logDate <= end;
  });

  // 2. Calculate lists
  // A. Exited System (Graduated/Distinguished): GPA >= 12
  const exitedStudents = students.filter(s => {
      const gpa = s.academicRecords?.[0]?.average || 0;
      return gpa >= 12;
  });

  // B. Critical Cases: (Points < -5 OR GPA < 10) AND NOT Exited (GPA < 12)
  const criticalStudents = students.filter(s => {
      const gpa = s.academicRecords?.[0]?.average || 0;
      if (gpa >= 12) return false; // Exclude if distinguished
      return s.totalPoints < -5 || (gpa > 0 && gpa < 10);
  });

  // C. Honor Board: Based on PERIOD points (not total balance), excluding critical cases
  const studentPointsInPeriod = students.map(student => {
    const periodPoints = filteredLogsByDate
        .filter(l => l.studentId === student.id)
        .reduce((acc, curr) => acc + curr.points, 0);
    return { ...student, periodPoints };
  });

  const honorStudents = studentPointsInPeriod
    .filter(s => s.periodPoints > 0) // Only positive contributors
    .sort((a, b) => b.periodPoints - a.periodPoints);

  // D. Interview Students: Students who have at least one interview record
  const interviewStudents = students.filter(s => s.interviews && s.interviews.length > 0);

  // E. General List: All students (filtered by search if applied)
  const generalStudents = students;

  // Determine currently visible list based on tab
  const getActiveList = () => {
      let list: any[] = [];
      switch (activeReportTab) {
          case 'CRITICAL': list = criticalStudents; break;
          case 'EXITED': list = exitedStudents; break;
          case 'HONOR': list = honorStudents; break;
          case 'INTERVIEWS': list = interviewStudents; break;
          case 'TRANSCRIPT': list = []; break; // Handled separately
          case 'COMPREHENSIVE': list = generalStudents; break; // Uses all students but displays different columns
          case 'GENERAL': default: list = generalStudents; break;
      }
      // Apply search filter
      return list.filter(s => s.name.includes(searchTerm) || s.grade.includes(searchTerm));
  };

  const activeList = getActiveList();

  // --- Transcript Analysis Logic ---
  const getStudentTranscriptData = () => {
      if (!selectedStudentId) return null;
      const student = students.find(s => s.id === selectedStudentId);
      if (!student || !student.academicRecords || student.academicRecords.length === 0) return null;

      const record = student.academicRecords[0]; // Latest record
      const subjects = record.subjects || [];
      const gpa = record.average || 0;

      // Analysis
      const strengths = subjects.filter(s => s.score >= 13).sort((a, b) => b.score - a.score);
      const weaknesses = subjects.filter(s => s.score < 10).sort((a, b) => a.score - b.score);
      
      const maxSubject = subjects.length > 0 ? subjects.reduce((prev, current) => (prev.score > current.score) ? prev : current) : null;
      const minSubject = subjects.length > 0 ? subjects.reduce((prev, current) => (prev.score < current.score) ? prev : current) : null;

      // Recommendation Logic
      let recommendation = "";
      if (gpa >= 16) recommendation = "نتائج ممتازة. ينصح بالحفاظ على وتيرة العمل وتشجيع التلميذ على المشاركة في المسابقات العلمية.";
      else if (gpa >= 14) recommendation = "نتائج جيدة جداً. التلميذ يملك قدرات عالية، يحتاج فقط لتعزيز الثقة في المواد التي تقل علامته فيها عن 14.";
      else if (gpa >= 12) recommendation = "مستوى جيد. يجب التركيز على نقاط الضعف المحددة أدناه لرفع المعدل العام.";
      else if (gpa >= 10) recommendation = "مستوى متوسط. التلميذ يحتاج إلى مراجعة مكثفة وتنظيم وقت الدراسة لتجنب التراجع.";
      else recommendation = "مستوى ضعيف (إنذار أكاديمي). يتطلب تدخلاً عاجلاً ودروس دعم في المواد الأساسية وتواصل فوري مع الولي.";

      return {
          student,
          record,
          strengths,
          weaknesses,
          maxSubject,
          minSubject,
          recommendation
      };
  };

  // Helper to get Insight for Comprehensive Report
  const getComprehensiveInsight = (student: Student) => {
    const gpa = student.academicRecords?.[0]?.average || 0;
    const points = student.totalPoints;

    if (gpa >= 15 && points >= 10) return { label: 'نموذج مثالي', color: 'bg-emerald-100 text-emerald-800' };
    if (gpa >= 12 && points < -5) return { label: 'مشاكل سلوكية رغم التفوق', color: 'bg-purple-100 text-purple-800' };
    if (gpa < 9 && points >= 5) return { label: 'تعثر دراسي رغم الانضباط', color: 'bg-orange-100 text-orange-800' };
    if (gpa < 10 && points < -5) return { label: 'خطر مزدوج (دراسي وسلوكي)', color: 'bg-red-100 text-red-800' };
    if (gpa < 10) return { label: 'يحتاج دعم دراسي', color: 'bg-yellow-100 text-yellow-800' };
    if (points < -5) return { label: 'يحتاج تقويم سلوكي', color: 'bg-pink-100 text-pink-800' };
    return { label: 'وضع مستقر', color: 'bg-gray-100 text-gray-700' };
  };

  // --- Export to Excel Function ---
  const handleExportExcel = () => {
    const titleMap = {
        'GENERAL': 'القائمة_العامة',
        'CRITICAL': 'الحالات_الحرجة',
        'EXITED': 'المتخرجون_من_النظام',
        'HONOR': 'لوحة_الشرف',
        'INTERVIEWS': 'سجل_المقابلات',
        'TRANSCRIPT': 'كشف_النقاط',
        'COMPREHENSIVE': 'تقرير_الاداء_والسلوك'
    };
    const fileName = `${titleMap[activeReportTab]}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Map data to Arabic headers
    const data = activeList.map((s, index) => {
        const gpa = s.academicRecords?.[0]?.average || 0;
        const points = activeReportTab === 'HONOR' ? (s as any).periodPoints : s.totalPoints;
        let statusNote = '-';
        
        if (activeReportTab === 'HONOR') statusNote = 'تميّز سلوكي';
        else if (activeReportTab === 'EXITED') statusNote = 'معدل مرتفع';
        else if (activeReportTab === 'CRITICAL') statusNote = (gpa !== '-' && Number(gpa) < 10 ? 'تدني التحصيل' : 'سلوك');
        else if (activeReportTab === 'INTERVIEWS') statusNote = `عدد المقابلات: ${s.interviews?.length || 0}`;
        else if (activeReportTab === 'COMPREHENSIVE') statusNote = getComprehensiveInsight(s).label;

        const baseObj = {
            "رقم التسلسل": index + 1,
            "الاسم واللقب": s.name,
            "الرقم الوطني": s.nationalId || '-',
            "القسم": s.grade,
            "الجنس": s.gender || '-',
            "المعدل العام": gpa,
        };

        if (activeReportTab === 'INTERVIEWS') {
            return {
                ...baseObj,
                "عدد المقابلات": s.interviews?.length || 0,
                "آخر مقابلة": s.interviews && s.interviews.length > 0 ? new Date(s.interviews[0].date).toLocaleDateString('ar-EG') : '-',
                "المرحلة": s.stage === 'ELEMENTARY' ? 'ابتدائي' : s.stage === 'MIDDLE' ? 'متوسط' : 'ثانوي'
            };
        }

        if (activeReportTab === 'COMPREHENSIVE') {
            return {
                ...baseObj,
                "نقاط السلوك": points,
                "عدد الغيابات": s.attendanceRecords?.filter(r => r.status === 'ABSENT').length || 0,
                "التصنيف/الحالة": statusNote,
                "المرحلة": s.stage === 'ELEMENTARY' ? 'ابتدائي' : s.stage === 'MIDDLE' ? 'متوسط' : 'ثانوي'
            };
        }

        return {
            ...baseObj,
            "تاريخ الميلاد": s.dateOfBirth || '-',
            "نقاط السلوك": points,
            "الملاحظة": statusNote,
            "المرحلة": s.stage === 'ELEMENTARY' ? 'ابتدائي' : s.stage === 'MIDDLE' ? 'متوسط' : 'ثانوي'
        };
    });

    // Create Workbook and Sheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths (approximate)
    const wscols = [
        { wch: 10 }, // Index
        { wch: 30 }, // Name
        { wch: 20 }, // National ID
        { wch: 15 }, // Grade
        { wch: 10 }, // Gender
        { wch: 15 }, // DOB/Stats
        { wch: 12 }, // GPA
        { wch: 12 }, // Points
        { wch: 20 }, // Note
        { wch: 15 }  // Stage
    ];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "التقرير");
    XLSX.writeFile(wb, fileName);
  };

  // --- Print List Function ---
  const handlePrintList = () => {
    const titleMap = {
        'GENERAL': 'القائمة العامة للتلاميذ',
        'CRITICAL': 'قائمة الحالات الحرجة (المتابعة الخاصة)',
        'EXITED': 'قائمة المتخرجون من النظام (خارج المتابعة)',
        'HONOR': 'لوحة الشرف والتميز السلوكي',
        'INTERVIEWS': 'قائمة التلاميذ الخاضعين للمقابلات الإرشادية',
        'TRANSCRIPT': 'كشف النقاط',
        'COMPREHENSIVE': 'تقرير الأداء الشامل (دراسي وسلوكي)'
    };

    const title = titleMap[activeReportTab];
    const dateStr = new Date().toLocaleDateString('ar-EG-u-nu-latn');
    
    // Generate Rows
    const rowsHtml = activeList.map((s, index) => {
        const gpa = s.academicRecords?.[0]?.average || '-';
        
        if (activeReportTab === 'INTERVIEWS') {
             const count = s.interviews?.length || 0;
             const lastInterview = s.interviews && s.interviews.length > 0 ? new Date(s.interviews[0].date).toLocaleDateString('ar-EG-u-nu-latn') : '-';
             const types = Array.from(new Set(s.interviews?.map((i:any) => i.type))).map(t => 
                t === 'PARENT' ? 'ولي' : t === 'ADMIN' ? 'إدارة' : 'تلميذ'
             ).join('، ');

             return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${s.name}</td>
                    <td>${s.grade}</td>
                    <td style="text-align: center; font-weight: bold;">${count}</td>
                    <td style="text-align: center;">${lastInterview}</td>
                    <td style="text-align: center;">${types}</td>
                </tr>
             `;
        }

        if (activeReportTab === 'COMPREHENSIVE') {
            const insight = getComprehensiveInsight(s);
            const absences = s.attendanceRecords?.filter(r => r.status === 'ABSENT').length || 0;
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${s.name}</td>
                    <td>${s.grade}</td>
                    <td style="font-weight: bold; text-align: center;">${gpa}</td>
                    <td style="font-weight: bold; text-align: center; color: ${s.totalPoints >= 0 ? '#166534' : '#b91c1c'};">${s.totalPoints > 0 ? '+' : ''}${s.totalPoints}</td>
                    <td style="text-align: center;">${absences}</td>
                    <td style="text-align: center;"><span style="padding: 2px 6px; border-radius: 4px; background-color: #f3f4f6; font-size: 11px;">${insight.label}</span></td>
                </tr>
            `;
        }

        const points = activeReportTab === 'HONOR' ? s.periodPoints : s.totalPoints;
        const note = activeReportTab === 'HONOR' ? 'تميّز سلوكي' : 
                     activeReportTab === 'EXITED' ? 'معدل مرتفع' :
                     activeReportTab === 'CRITICAL' ? (gpa !== '-' && Number(gpa) < 10 ? 'تدني التحصيل' : 'سلوك') : '-';

        return `
            <tr>
                <td>${index + 1}</td>
                <td>${s.name}</td>
                <td style="font-family: monospace;">${s.nationalId || '-'}</td>
                <td>${s.grade}</td>
                <td>${s.gender || '-'}</td>
                <td style="font-weight: bold;">${gpa}</td>
                <td dir="ltr" style="text-align:center; font-weight: bold; color: ${points >= 0 ? '#166534' : '#b91c1c'};">${points > 0 ? '+' : ''}${points}</td>
                <td>${note}</td>
            </tr>
        `;
    }).join('');

    let columnsHtml = '';
    if (activeReportTab === 'INTERVIEWS') {
        columnsHtml = `
            <th width="5%">ر.ت</th>
            <th width="30%">الاسم واللقب</th>
            <th width="15%">القسم</th>
            <th width="10%">العدد</th>
            <th width="20%">تاريخ آخر مقابلة</th>
            <th width="20%">نوع المقابلات</th>
        `;
    } else if (activeReportTab === 'COMPREHENSIVE') {
        columnsHtml = `
            <th width="5%">ر.ت</th>
            <th width="25%">الاسم واللقب</th>
            <th width="15%">القسم</th>
            <th width="10%">المعدل</th>
            <th width="10%">ن. السلوك</th>
            <th width="10%">الغيابات</th>
            <th width="25%">التصنيف/الحالة</th>
        `;
    } else {
        columnsHtml = `
            <th width="5%">ر.ت</th>
            <th width="25%">الاسم واللقب</th>
            <th width="15%">الرقم الوطني</th>
            <th width="15%">القسم</th>
            <th width="10%">الجنس</th>
            <th width="10%">المعدل</th>
            <th width="10%">ن. السلوك</th>
            <th width="10%">الملاحظات</th>
        `;
    }

    const logoHtml = logoUrl ? `<img src="${logoUrl}" style="max-height: 80px; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;" />` : '';

    const printContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Tajawal', sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
          th { background-color: #f3f4f6; font-weight: bold; color: #374151; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; color: #111827; margin-bottom: 5px; }
          .date { color: #6b7280; font-size: 0.9em; }
          tr:nth-child(even) { background-color: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoHtml}
          <div class="title">${title}</div>
          <div class="date">تاريخ الاستخراج: ${dateStr}</div>
        </div>
        <table>
          <thead>
            <tr>${columnsHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
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

  // --- Print Transcript Function ---
  const handlePrintTranscript = () => {
      const data = getStudentTranscriptData();
      if (!data) return;
      const { student, record, strengths, weaknesses, recommendation } = data;
      
      const logoHtml = logoUrl ? `<img src="${logoUrl}" style="max-height: 80px;" />` : '<div style="font-size: 24px; font-weight: bold;">الجمهورية الجزائرية الديمقراطية الشعبية</div>';
      const dateStr = new Date().toLocaleDateString('ar-EG-u-nu-latn');

      const subjectsRows = record.subjects.map(sub => {
          let observation = '';
          if (sub.score >= 18) observation = 'ممتاز';
          else if (sub.score >= 16) observation = 'جيد جداً';
          else if (sub.score >= 14) observation = 'جيد';
          else if (sub.score >= 12) observation = 'قريب من الجيد';
          else if (sub.score >= 10) observation = 'متوسط';
          else observation = 'ضعيف';

          return `
            <tr>
                <td style="text-align: right; padding: 8px;">${sub.subject}</td>
                <td style="text-align: center; font-weight: bold;">${sub.score}</td>
                <td style="text-align: center;">${observation}</td>
            </tr>
          `;
      }).join('');

      const printContent = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>كشف نقاط - ${student.name}</title>
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Tajawal', sans-serif; padding: 40px; color: #111; max-width: 210mm; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
                .info-item { margin-bottom: 10px; }
                .info-label { font-weight: bold; color: #555; }
                
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th, td { border: 1px solid #000; padding: 10px; }
                th { background-color: #eee; }
                
                .analysis-box { border: 1px solid #000; padding: 15px; margin-bottom: 20px; }
                .analysis-title { font-weight: bold; text-decoration: underline; margin-bottom: 10px; display: block; }
                
                .footer { margin-top: 50px; display: flex; justify-content: space-between; }
                .signature { text-align: center; width: 200px; }
                
                .gpa-box { text-align: center; margin: 20px 0; font-size: 18px; border: 2px solid #000; display: inline-block; padding: 10px 40px; background: #f0f0f0; }
            </style>
        </head>
        <body>
            <div class="header">
                ${logoHtml}
                <h2 style="margin: 10px 0;">بطاقة تقييم النتائج المدرسية</h2>
                <div>السنة الدراسية: ${record.year}</div>
            </div>

            <div class="info-grid">
                <div class="info-item"><span class="info-label">الاسم واللقب:</span> ${student.name}</div>
                <div class="info-item"><span class="info-label">تاريخ الميلاد:</span> ${student.dateOfBirth || '-'}</div>
                <div class="info-item"><span class="info-label">القسم:</span> ${student.grade}</div>
                <div class="info-item"><span class="info-label">الرقم الوطني:</span> ${student.nationalId || '-'}</div>
                <div class="info-item"><span class="info-label">المؤسسة:</span> ${student.schoolName || 'غير محددة'}</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th width="40%">المادة</th>
                        <th width="20%">العلامة / 20</th>
                        <th width="40%">الملاحظات</th>
                    </tr>
                </thead>
                <tbody>
                    ${subjectsRows}
                </tbody>
            </table>

            <div style="text-align: center;">
                <div class="gpa-box">
                    <strong>المعدل الفصلي:</strong> ${record.average} / 20
                </div>
            </div>

            <div class="analysis-box">
                <span class="analysis-title">تحليل نقاط القوة والضعف:</span>
                <div style="display: flex; gap: 20px;">
                    <div style="flex: 1;">
                        <strong>🟢 نقاط القوة:</strong>
                        <ul style="margin-top: 5px;">
                            ${strengths.length > 0 ? strengths.slice(0, 3).map(s => `<li>${s.subject} (${s.score})</li>`).join('') : '<li>لا توجد نقاط قوة بارزة</li>'}
                        </ul>
                    </div>
                    <div style="flex: 1;">
                        <strong>🔴 نقاط الضعف:</strong>
                        <ul style="margin-top: 5px;">
                             ${weaknesses.length > 0 ? weaknesses.slice(0, 3).map(s => `<li>${s.subject} (${s.score})</li>`).join('') : '<li>لا توجد نقاط ضعف واضحة</li>'}
                        </ul>
                    </div>
                </div>
            </div>

            <div class="analysis-box" style="background-color: #fffbeb;">
                <span class="analysis-title">التوجيه التربوي:</span>
                <p style="margin: 0;">${recommendation}</p>
            </div>

            <div class="footer">
                <div class="signature">
                    توقيع الولي
                    <br><br><br>
                </div>
                <div class="signature">
                    توقيع وختم المدير
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

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">التقارير والإحصائيات</h1>
           <p className="text-gray-500 mt-1">تصدير القوائم والتقارير الدورية.</p>
        </div>
        
        {/* Actions - Only show if not in Transcript mode or if student selected */}
        {activeReportTab !== 'TRANSCRIPT' && (
             <div className="flex gap-3">
                <button 
                    onClick={handlePrintList}
                    className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 font-bold transition-colors"
                >
                    <Printer size={18} /> طباعة القائمة
                </button>
                <button 
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 font-bold transition-colors shadow-lg shadow-green-500/20"
                >
                    <FileSpreadsheet size={18} /> تصدير Excel
                </button>
            </div>
        )}
      </div>

      {/* Report Tabs */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <div className="flex space-x-2 space-x-reverse min-w-max">
              {[
                  { id: 'GENERAL', label: 'القائمة العامة', icon: List },
                  { id: 'COMPREHENSIVE', label: 'الأداء والسلوك', icon: Activity },
                  { id: 'HONOR', label: 'لوحة الشرف', icon: Trophy },
                  { id: 'CRITICAL', label: 'الحالات الحرجة', icon: AlertTriangle },
                  { id: 'EXITED', label: 'المتخرجون', icon: CheckCircle2 },
                  { id: 'INTERVIEWS', label: 'المقابلات', icon: MessageSquare },
                  { id: 'TRANSCRIPT', label: 'كشف نقاط التلميذ', icon: GraduationCap },
              ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveReportTab(tab.id as ReportType)}
                    className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all
                        ${activeReportTab === tab.id 
                            ? 'bg-primary-600 text-white shadow-md' 
                            : 'text-gray-600 hover:bg-gray-100'}
                    `}
                  >
                      <tab.icon size={18} />
                      {tab.label}
                  </button>
              ))}
          </div>
      </div>

      {/* Filters (Date for Honor/General) */}
      {(activeReportTab === 'HONOR' || activeReportTab === 'GENERAL' || activeReportTab === 'COMPREHENSIVE') && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-end gap-4">
              <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">من تاريخ</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">إلى تاريخ</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-gray-500 mb-1">بحث سريع</label>
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="بحث بالاسم أو القسم..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-9 pl-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>
              </div>
          </div>
      )}

      {/* Transcript View */}
      {activeReportTab === 'TRANSCRIPT' ? (
          <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4">اختيار التلميذ</h3>
                  <div className="max-w-xl">
                    <select 
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        <option value="">-- اختر التلميذ لعرض كشف النقاط --</option>
                        {students
                            .filter(s => s.academicRecords && s.academicRecords.length > 0)
                            .map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">ملاحظة: تظهر فقط أسماء التلاميذ الذين لديهم سجلات أكاديمية مستوردة.</p>
                  </div>
              </div>

              {selectedStudentId && getStudentTranscriptData() && (
                  (() => {
                      const data = getStudentTranscriptData();
                      if (!data) return null;
                      const { student, record, strengths, weaknesses, maxSubject, minSubject, recommendation } = data;
                      
                      return (
                          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
                              <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                      <FileText size={20} className="text-primary-600" />
                                      كشف النقاط والتحليل
                                  </h3>
                                  <button 
                                    onClick={handlePrintTranscript}
                                    className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-bold transition-colors text-sm"
                                  >
                                      <Printer size={16} /> طباعة الكشف
                                  </button>
                              </div>
                              
                              <div className="p-8">
                                  {/* Header Info */}
                                  <div className="grid md:grid-cols-2 gap-6 mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
                                      <div className="space-y-2">
                                          <p className="text-sm text-gray-500">الاسم واللقب</p>
                                          <p className="font-bold text-lg text-gray-900">{student.name}</p>
                                          
                                          <p className="text-sm text-gray-500 mt-2">الرقم الوطني</p>
                                          <p className="font-mono text-gray-900">{student.nationalId || '-'}</p>
                                      </div>
                                      <div className="space-y-2">
                                          <p className="text-sm text-gray-500">القسم</p>
                                          <p className="font-bold text-lg text-gray-900">{student.grade}</p>
                                          
                                          <p className="text-sm text-gray-500 mt-2">المؤسسة</p>
                                          <p className="text-gray-900">{student.schoolName || 'غير محددة'}</p>
                                      </div>
                                  </div>

                                  {/* GPA Badge */}
                                  <div className="flex justify-center mb-8">
                                      <div className="text-center bg-indigo-50 px-12 py-4 rounded-2xl border border-indigo-100">
                                          <p className="text-indigo-600 font-bold mb-1">المعدل العام</p>
                                          <p className="text-4xl font-black text-indigo-900">{record.average}</p>
                                      </div>
                                  </div>

                                  {/* Grades Table */}
                                  <div className="overflow-x-auto mb-8">
                                      <table className="w-full text-right border-collapse">
                                          <thead>
                                              <tr className="bg-gray-100 text-gray-700 text-sm">
                                                  <th className="p-3 border rounded-tr-lg">المادة</th>
                                                  <th className="p-3 border text-center">العلامة / 20</th>
                                                  <th className="p-3 border rounded-tl-lg">التقدير</th>
                                              </tr>
                                          </thead>
                                          <tbody>
                                              {record.subjects.map((sub, idx) => (
                                                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                      <td className="p-3 border-x font-medium">{sub.subject}</td>
                                                      <td className="p-3 border-x text-center font-bold">{sub.score}</td>
                                                      <td className="p-3 border-x text-sm text-gray-600">
                                                          {sub.score >= 15 ? 'جيد جداً' : sub.score >= 12 ? 'جيد' : sub.score >= 10 ? 'متوسط' : 'ضعيف'}
                                                      </td>
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                  </div>

                                  {/* Analysis Grid */}
                                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                                      <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                                          <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                                              <TrendingUp size={20} /> نقاط القوة
                                          </h4>
                                          {strengths.length > 0 ? (
                                              <ul className="space-y-2">
                                                  {strengths.map((s, i) => (
                                                      <li key={i} className="flex justify-between items-center bg-white p-2 rounded-lg border border-green-100 text-sm">
                                                          <span className="font-medium text-gray-700">{s.subject}</span>
                                                          <span className="font-bold text-green-600">{s.score}</span>
                                                      </li>
                                                  ))}
                                              </ul>
                                          ) : (
                                              <p className="text-sm text-gray-500 italic">لا توجد مواد متميزة (≥ 13).</p>
                                          )}
                                      </div>

                                      <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                                          <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                                              <TrendingDown size={20} /> نقاط الضعف
                                          </h4>
                                          {weaknesses.length > 0 ? (
                                              <ul className="space-y-2">
                                                  {weaknesses.map((s, i) => (
                                                      <li key={i} className="flex justify-between items-center bg-white p-2 rounded-lg border border-red-100 text-sm">
                                                          <span className="font-medium text-gray-700">{s.subject}</span>
                                                          <span className="font-bold text-red-600">{s.score}</span>
                                                      </li>
                                                  ))}
                                              </ul>
                                          ) : (
                                              <p className="text-sm text-gray-500 italic">لا توجد مواد ضعيفة (&lt; 10).</p>
                                          )}
                                      </div>
                                  </div>

                                  {/* Recommendation Box */}
                                  <div className="bg-amber-50 rounded-xl p-6 border border-amber-100 flex items-start gap-4">
                                      <div className="bg-amber-100 p-2 rounded-lg text-amber-600 shrink-0">
                                          <Lightbulb size={24} />
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-amber-900 mb-2">التوجيه التربوي المقترح</h4>
                                          <p className="text-amber-800 text-sm leading-relaxed">
                                              {recommendation}
                                          </p>
                                          {minSubject && maxSubject && (maxSubject.score - minSubject.score > 8) && (
                                              <p className="text-xs text-amber-700 mt-2 pt-2 border-t border-amber-200">
                                                  * ملاحظة: يوجد تباين كبير بين أعلى علامة ({maxSubject.subject}: {maxSubject.score}) وأدنى علامة ({minSubject.subject}: {minSubject.score}). يرجى البحث في أسباب هذا التفاوت.
                                              </p>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      );
                  })()
              )}

              {selectedStudentId && !getStudentTranscriptData() && (
                  <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                      <p className="text-gray-500">هذا التلميذ لا يملك سجلات أكاديمية مسجلة لعرضها.</p>
                  </div>
              )}
          </div>
      ) : (
          /* List View (General, Honor, Comprehensive, etc) */
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <FileText size={18} className="text-gray-500" />
                      نتائج التقرير
                  </h3>
                  <span className="text-xs font-bold bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-600">
                      العدد: {activeList.length}
                  </span>
              </div>
              
              <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                      <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                          <tr>
                              <th className="px-6 py-4">#</th>
                              <th className="px-6 py-4">التلميذ</th>
                              <th className="px-6 py-4">القسم</th>
                              {activeReportTab === 'INTERVIEWS' ? (
                                  <>
                                    <th className="px-6 py-4">عدد المقابلات</th>
                                    <th className="px-6 py-4">آخر مقابلة</th>
                                    <th className="px-6 py-4">النوع</th>
                                  </>
                              ) : activeReportTab === 'COMPREHENSIVE' ? (
                                  <>
                                     <th className="px-6 py-4">المعدل العام</th>
                                     <th className="px-6 py-4">نقاط السلوك</th>
                                     <th className="px-6 py-4">الغيابات</th>
                                     <th className="px-6 py-4">التصنيف/الحالة</th>
                                  </>
                              ) : (
                                  <>
                                    <th className="px-6 py-4">الرقم الوطني</th>
                                    <th className="px-6 py-4">المعدل</th>
                                    <th className="px-6 py-4">النقاط</th>
                                    <th className="px-6 py-4">الحالة</th>
                                  </>
                              )}
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {activeList.length === 0 ? (
                              <tr>
                                  <td colSpan={7} className="text-center py-12 text-gray-500">
                                      لا توجد بيانات تطابق المعايير الحالية.
                                  </td>
                              </tr>
                          ) : (
                              activeList.map((s, idx) => {
                                 const gpa = s.academicRecords?.[0]?.average || '-';
                                 const points = activeReportTab === 'HONOR' ? (s as any).periodPoints : s.totalPoints;
                                 
                                 return (
                                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500">{idx + 1}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{s.name}</td>
                                        <td className="px-6 py-4 text-gray-600">{s.grade}</td>
                                        
                                        {activeReportTab === 'INTERVIEWS' ? (
                                            <>
                                                <td className="px-6 py-4 font-bold">{s.interviews?.length || 0}</td>
                                                <td className="px-6 py-4 text-gray-500 font-mono">
                                                    {s.interviews && s.interviews.length > 0 
                                                        ? new Date(s.interviews[0].date).toLocaleDateString('ar-EG-u-nu-latn') 
                                                        : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {Array.from(new Set(s.interviews?.map((i: any) => i.type))).map((t: any) => (
                                                            <span key={t} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                                                {t === 'PARENT' ? 'ولي' : t === 'ADMIN' ? 'إداري' : 'تلميذ'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                            </>
                                        ) : activeReportTab === 'COMPREHENSIVE' ? (
                                            <>
                                                <td className="px-6 py-4 font-bold text-gray-800">{gpa}</td>
                                                <td className={`px-6 py-4 font-bold ${s.totalPoints < 0 ? 'text-red-600' : 'text-green-600'}`} dir="ltr">
                                                    {s.totalPoints > 0 ? '+' : ''}{s.totalPoints}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {s.attendanceRecords?.filter(r => r.status === 'ABSENT').length || 0}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {(() => {
                                                        const insight = getComprehensiveInsight(s);
                                                        return (
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${insight.color}`}>
                                                                {insight.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4 font-mono text-gray-500" dir="ltr">{s.nationalId || '-'}</td>
                                                <td className="px-6 py-4 font-bold">{gpa}</td>
                                                <td className={`px-6 py-4 font-bold ${points < 0 ? 'text-red-600' : 'text-green-600'}`} dir="ltr">
                                                    {points > 0 ? '+' : ''}{points}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {activeReportTab === 'CRITICAL' ? (
                                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">متابعة</span>
                                                    ) : activeReportTab === 'HONOR' ? (
                                                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold">متميز</span>
                                                    ) : activeReportTab === 'EXITED' ? (
                                                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-bold">متخرج</span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">-</span>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                 );
                              })
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}
    </div>
  );
};

export default Reports;
