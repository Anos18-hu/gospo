
import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, CheckCircle2, Search, BookOpen, ChevronDown, ChevronUp, Minus, Plus, History, Calendar, PieChart as PieChartIcon, BarChart3, List as ListIcon, TrendingUp, TrendingDown, AlertTriangle, Award, User, Layers, GraduationCap, Printer, Download, Brain, HeartPulse, Accessibility, Sparkles, ArrowLeft, Target, AlertCircle, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Student, SubjectResult, BehaviorLog, BehaviorType } from '../types';

interface AcademicResultsProps {
  students: Student[];
  logs: BehaviorLog[];
  onImportData: (importedStudents: Partial<Student>[], schoolName: string) => void;
}

const AcademicResults: React.FC<AcademicResultsProps> = ({ students, logs, onImportData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{ total: number; school: string; className: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'CURRENT' | 'PREVIOUS'>('CURRENT');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'LIST' | 'ANALYSIS' | 'INDIVIDUAL'>('LIST');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStudentForDeepDive, setSelectedStudentForDeepDive] = useState<Student | null>(null);

  // Filter students who have academic records
  const studentsWithResults = students.filter(s => s.academicRecords && s.academicRecords.length > 0);
  
  // Get unique grades for filter dropdown
  const availableGrades = useMemo(() => {
      const grades = new Set(studentsWithResults.map(s => s.grade));
      return Array.from(grades).sort();
  }, [studentsWithResults]);

  const filteredStudents = studentsWithResults.filter(s => {
    const matchesSearch = s.name.includes(searchTerm) || s.grade.includes(searchTerm);
    const matchesGrade = selectedGradeFilter ? s.grade === selectedGradeFilter : true;
    return matchesSearch && matchesGrade;
  });

  const toggleExpand = (studentId: string) => {
    setExpandedStudentId(expandedStudentId === studentId ? null : studentId);
  };

  const triggerFileUpload = (type: 'CURRENT' | 'PREVIOUS') => {
      setUploadType(type);
      if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset input
          fileInputRef.current.click();
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadedFileName(file.name);
    setImportSummary(null);

    const reader = new FileReader();

    reader.onload = (evt) => {
        try {
            const bstr = evt.target?.result;
            const workbook = XLSX.read(bstr, { type: 'binary' });
            
            // Assume first sheet
            const wsname = workbook.SheetNames[0];
            const ws = workbook.Sheets[wsname];
            
            // Convert to JSON array of arrays (header: 1)
            const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

            if (rows.length < 8) {
                throw new Error("الملف لا يحتوي على بيانات كافية.");
            }

            // 1. Extract School Name (Row 4 / Index 3)
            let schoolName = "مؤسسة غير محددة";
            if (rows[3]) {
                schoolName = String(rows[3].find(cell => cell && String(cell).length > 3) || rows[3][0] || "مؤسسة غير محددة").trim();
            }

            // 2. Extract Class Name (Row 5 / Index 4)
            let className = "قسم غير محدد";
            if (rows[4]) {
                const rawClassText = String(rows[4].find(cell => cell) || rows[4][0] || "").trim();
                const words = rawClassText.split(/\s+/);
                
                if (words.length > 5) {
                    className = words.slice(5).join(' ').trim();
                } else if (rawClassText.length > 0) {
                    className = rawClassText;
                }
            }

            // 3. Extract Subject Headers (Row 6 / Index 5)
            const headerRow = rows[5];
            const subjects: string[] = [];
            const lastColIndex = headerRow.length - 1; 

            for (let i = 5; i < lastColIndex; i++) {
                if (headerRow[i]) {
                    subjects.push(String(headerRow[i]).trim());
                }
            }

            // 4. Extract Student Data
            const importedData: Partial<Student>[] = [];
            
            const currentYear = new Date().getFullYear();
            const recordYear = uploadType === 'CURRENT' ? currentYear.toString() : (currentYear - 1).toString();
            const recordTerm = uploadType === 'CURRENT' ? 'الفصل الحالي' : 'المعدل السنوي';
            
            for (let i = 6; i < rows.length - 1; i++) {
                const row = rows[i];
                if (!row || row.length === 0) continue;

                const studentName = row[1] ? String(row[1]).trim() : null;
                if (!studentName) continue;

                let dob = undefined;
                if (row[2]) {
                    if (typeof row[2] === 'number') {
                         const dateObj = XLSX.SSF.parse_date_code(row[2]);
                         dob = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
                    } else {
                        dob = String(row[2]);
                    }
                }

                const gender = row[3] ? String(row[3]).trim() : undefined;
                const isRepeaterVal = row[4] ? String(row[4]).trim() : '';
                const isRepeater = isRepeaterVal.includes('نعم') || isRepeaterVal.includes('معيد');

                const generalAvgRaw = row[row.length - 1];
                const generalAvg = typeof generalAvgRaw === 'number' ? generalAvgRaw : parseFloat(String(generalAvgRaw));

                const studentSubjects: SubjectResult[] = [];
                
                subjects.forEach((subj, idx) => {
                    const colIndex = 5 + idx; 
                    if (row[colIndex] !== undefined && row[colIndex] !== null) {
                        const score = Number(row[colIndex]);
                        if (!isNaN(score)) {
                            studentSubjects.push({
                                subject: subj,
                                score: score
                            });
                        }
                    }
                });

                importedData.push({
                    name: studentName,
                    grade: className,
                    gender: gender,
                    isRepeater: isRepeater,
                    dateOfBirth: dob,
                    academicRecords: [{
                        year: recordYear,
                        term: recordTerm,
                        subjects: studentSubjects,
                        average: isNaN(generalAvg) ? 0 : Number(generalAvg.toFixed(2))
                    }]
                });
            }

            onImportData(importedData, schoolName);
            
            setImportSummary({
                total: importedData.length,
                school: schoolName,
                className: className
            });
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);

        } catch (error: any) {
            console.error("Error parsing file:", error);
            alert("حدث خطأ أثناء قراءة الملف. يرجى التأكد من أن الملف هو ملف Excel صالح (.xlsx أو .xls) ويتبع الهيكل المطلوب.");
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.readAsBinaryString(file);
  };

  // --- Analysis Logic ---
  const analysisData = useMemo(() => {
    if (studentsWithResults.length === 0) return null;

    // 1. Calculate General Statistics first
    const totalStudents = studentsWithResults.length;
    const passedStudents = studentsWithResults.filter(s => (s.academicRecords?.[0]?.average || 0) >= 10).length;
    const overallPassRate = (passedStudents / totalStudents) * 100;
    
    // Average GPA
    const totalGPA = studentsWithResults.reduce((sum, s) => sum + (s.academicRecords?.[0]?.average || 0), 0);
    const averageGPA = totalGPA / totalStudents;

    // 2. Collect all subjects
    const allSubjects = new Set<string>();
    studentsWithResults.forEach(s => {
        const rec = s.academicRecords?.[0];
        rec?.subjects?.forEach(sub => allSubjects.add(sub.subject));
    });

    const subjectsArray = Array.from(allSubjects);

    // 3. Analyze per subject
    const subjectAnalysis = subjectsArray.map(subject => {
        const scores = studentsWithResults.map(s => {
            const rec = s.academicRecords?.[0];
            const sub = rec?.subjects?.find(sb => sb.subject === subject);
            return sub ? sub.score : null;
        }).filter(score => score !== null) as number[];

        // Calculate Gender Specific Averages for Subject
        const femaleScores = studentsWithResults
            .filter(s => s.gender === 'أنثى' || s.gender === 'F')
            .map(s => {
                const rec = s.academicRecords?.[0];
                const sub = rec?.subjects?.find(sb => sb.subject === subject);
                return sub ? sub.score : null;
            }).filter(score => score !== null) as number[];

        const maleScores = studentsWithResults
            .filter(s => s.gender !== 'أنثى' && s.gender !== 'F')
            .map(s => {
                const rec = s.academicRecords?.[0];
                const sub = rec?.subjects?.find(sb => sb.subject === subject);
                return sub ? sub.score : null;
            }).filter(score => score !== null) as number[];

        if (scores.length === 0) return null;

        const sum = scores.reduce((a, b) => a + b, 0);
        const avg = sum / scores.length;
        const passCount = scores.filter(s => s >= 10).length;
        const passRate = (passCount / scores.length) * 100;

        const femaleAvg = femaleScores.length > 0 ? femaleScores.reduce((a, b) => a + b, 0) / femaleScores.length : 0;
        const maleAvg = maleScores.length > 0 ? maleScores.reduce((a, b) => a + b, 0) / maleScores.length : 0;

        // Standard Deviation
        const squareDiffs = scores.map(s => Math.pow(s - avg, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / scores.length;
        const stdDev = Math.sqrt(avgSquareDiff);

        // Coefficient of Variation
        const coefficientOfVariation = avg > 0 ? (stdDev / avg) * 100 : 0;
        
        // Comparison with General Average
        const comparison = avg > averageGPA ? 'أعلى من المعدل العام' : avg < averageGPA ? 'أقل من المعدل العام' : 'مساوي للمعدل العام';

        // Grade Distribution
        const above15 = scores.filter(s => s >= 15).length;
        const between10and15 = scores.filter(s => s >= 10 && s < 15).length;
        const between8and10 = scores.filter(s => s >= 8 && s < 10).length;
        const below8 = scores.filter(s => s < 8).length;

        const maxScore = Math.max(...scores);

        return {
            subject,
            average: avg,
            femaleAverage: femaleAvg,
            maleAverage: maleAvg,
            passRate,
            stdDev,
            coefficientOfVariation,
            comparison,
            above15,
            between10and15,
            between8and10,
            below8,
            passedCount: passCount,
            count: scores.length,
            maxScore: maxScore,
            minScore: Math.min(...scores),
            isExempt: maxScore === 0
        };
    }).filter(Boolean) as any[];

    // Detailed Gender Analysis
    const females = studentsWithResults.filter(s => s.gender === 'أنثى' || s.gender === 'F');
    const males = studentsWithResults.filter(s => s.gender !== 'أنثى' && s.gender !== 'F');

    const calculateDetailedStats = (group: Student[]) => {
         const scores = group.map(s => s.academicRecords?.[0]?.average || 0);
         const total = scores.length;
         const passed = scores.filter(s => s >= 10).length;
         const totalGPAVal = scores.reduce((a, b) => a + b, 0);
         
         return {
             total,
             passed,
             rate: total > 0 ? (passed / total) * 100 : 0,
             avgGPA: total > 0 ? totalGPAVal / total : 0,
             dist: {
                 excellent: scores.filter(s => s >= 18).length, // 18-20 امتياز
                 veryGood: scores.filter(s => s >= 16 && s < 18).length, // 16-17.99 جيد جدا
                 good: scores.filter(s => s >= 14 && s < 16).length, // 14-15.99 جيد
                 closeToGood: scores.filter(s => s >= 12 && s < 14).length, // 12-13.99 قريب من الجيد
                 acceptable: scores.filter(s => s >= 10 && s < 12).length, // 10-11.99 مقبول
                 fail: scores.filter(s => s < 10).length // < 10
             }
         };
    };

    const femaleStats = calculateDetailedStats(females);
    const maleStats = calculateDetailedStats(males);

    return {
        subjectAnalysis,
        general: {
            totalStudents,
            passedStudents,
            overallPassRate,
            averageGPA,
            females: femaleStats,
            males: maleStats
        }
    };
  }, [studentsWithResults]);

  // --- Specific Subject Analysis (Derived) ---
  const specificSubjectDetails = useMemo(() => {
      if (!selectedSubject || !studentsWithResults.length) return null;

      const studentsWithScore = studentsWithResults.map(s => {
          const rec = s.academicRecords?.[0];
          const subject = rec?.subjects?.find(sub => sub.subject === selectedSubject);
          return {
              ...s,
              score: subject ? subject.score : undefined
          };
      }).filter(s => s.score !== undefined)
      .sort((a, b) => (b.score || 0) - (a.score || 0)); // Sort Descending

      const stats = analysisData?.subjectAnalysis.find(s => s.subject === selectedSubject);
      
      return {
          students: studentsWithScore,
          stats
      };
  }, [selectedSubject, studentsWithResults, analysisData]);

  // --- Individual Categorization Logic ---
  const individualCategories = useMemo(() => {
      if (!studentsWithResults.length) return null;

      const topPerformers = studentsWithResults.filter(s => (s.academicRecords?.[0]?.average || 0) >= 15);
      const struggling = studentsWithResults.filter(s => {
          const avg = s.academicRecords?.[0]?.average || 0;
          return avg >= 8 && avg < 10;
      });
      // LD indicators: Very low GPA (<8) OR significant drop in key subjects (if data was granular)
      const learningDifficulties = studentsWithResults.filter(s => (s.academicRecords?.[0]?.average || 0) < 8);
      
      const behavioralDisorders = studentsWithResults.filter(s => s.totalPoints <= -5);
      
      // Heuristic: Check interview titles/notes for keywords or assume based on very high absences + low grades
      const psychological = studentsWithResults.filter(s => {
          const hasInterviewKeywords = s.interviews?.some(i => 
            i.title.includes('قلق') || i.title.includes('خوف') || i.title.includes('انطواء') || i.title.includes('نفسي')
          );
          return hasInterviewKeywords;
      });

      const specialCases = studentsWithResults.filter(s => {
          const hasKeywords = s.interviews?.some(i => 
             i.title.includes('صحة') || i.title.includes('إعاقة') || i.title.includes('طيف') || i.title.includes('توحد') || i.title.includes('حركة')
          );
          return hasKeywords;
      });

      return {
          topPerformers,
          struggling,
          learningDifficulties,
          behavioralDisorders,
          psychological,
          specialCases
      };

  }, [studentsWithResults]);

  // --- Export Excel Function ---
  const handleExportAnalysisExcel = () => {
    if (!analysisData) return;
    const wb = XLSX.utils.book_new();

    // Sheet 1: General Summary
    const summaryData = [
        ["تقرير تحليل النتائج المدرسية"],
        ["تاريخ الاستخراج", new Date().toLocaleDateString('ar-EG')],
        [],
        ["الإحصائيات العامة"],
        ["عدد التلاميذ", analysisData.general.totalStudents],
        ["نسبة النجاح العامة", `${analysisData.general.overallPassRate.toFixed(2)}%`],
        ["معدل القسم العام", analysisData.general.averageGPA.toFixed(2)],
        [],
        ["تحليل حسب الجنس", "العدد", "المعدل", "نسبة النجاح"],
        ["إناث", analysisData.general.females.total, analysisData.general.females.avgGPA.toFixed(2), `${analysisData.general.females.rate.toFixed(2)}%`],
        ["ذكور", analysisData.general.males.total, analysisData.general.males.avgGPA.toFixed(2), `${analysisData.general.males.rate.toFixed(2)}%`]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "ملخص عام");

    // Sheet 2: Subject Details
    const subjectData = analysisData.subjectAnalysis.map(s => ({
        "المادة": s.subject,
        "المعدل (المتوسط)": s.isExempt ? "معفاة" : s.average.toFixed(2),
        "معدل الذكور": s.isExempt ? "-" : s.maleAverage.toFixed(2),
        "معدل الإناث": s.isExempt ? "-" : s.femaleAverage.toFixed(2),
        "نسبة النجاح": s.isExempt ? "-" : `${s.passRate.toFixed(1)}%`,
        "الانحراف المعياري": s.isExempt ? "-" : s.stdDev.toFixed(2),
        "معامل التشتت": s.isExempt ? "-" : `${s.coefficientOfVariation.toFixed(2)}%`,
        "المقارنة": s.isExempt ? "معفاة" : s.comparison,
        "أكثر من 15": s.isExempt ? "-" : s.above15,
        "10-15": s.isExempt ? "-" : s.between10and15,
        "8-10": s.isExempt ? "-" : s.between8and10,
        "أقل من 8": s.isExempt ? "-" : s.below8
    }));
    const wsSubjects = XLSX.utils.json_to_sheet(subjectData);
    wsSubjects['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSubjects, "تحليل المواد");

    XLSX.writeFile(wb, `تحليل_النتائج_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // --- Print Analysis Function ---
  const handlePrintAnalysis = () => {
      if (!analysisData) return;
      
      const logoUrl = localStorage.getItem('institution_logo');
      const logoHtml = logoUrl ? `<img src="${logoUrl}" style="max-height: 80px; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;" />` : '';
      const dateStr = new Date().toLocaleDateString('ar-EG-u-nu-latn');

      const rowsHtml = analysisData.subjectAnalysis.map(sub => {
        if (sub.isExempt) {
            return `
            <tr style="background-color: #f3f4f6; color: #6b7280;">
                <td>${sub.subject}</td>
                <td style="text-align: center; font-weight: bold;">معفاة</td>
                <td style="text-align: center;">-</td>
                <td style="text-align: center;">-</td>
                <td style="text-align: center;">معفاة</td>
                <td style="text-align: center;">-</td>
                <td style="text-align: center;">-</td>
                <td style="text-align: center;">-</td>
                <td style="text-align: center;">-</td>
                <td style="text-align: center;">-</td>
                <td style="text-align: center;">-</td>
                <td style="text-align: center;">-</td>
            </tr>`;
        }
        return `
        <tr>
            <td>${sub.subject}</td>
            <td style="text-align: center; font-weight: bold;">${sub.average.toFixed(2)}</td>
            <td style="text-align: center;">${sub.maleAverage.toFixed(2)}</td>
            <td style="text-align: center;">${sub.femaleAverage.toFixed(2)}</td>
            <td style="text-align: center;">${sub.comparison}</td>
            <td style="text-align: center;">${sub.stdDev.toFixed(2)}</td>
            <td style="text-align: center;">${sub.coefficientOfVariation.toFixed(1)}%</td>
            <td style="text-align: center; background-color: #f0fdf4;">${sub.above15}</td>
            <td style="text-align: center; background-color: #eff6ff;">${sub.between10and15}</td>
            <td style="text-align: center; background-color: #fefce8;">${sub.between8and10}</td>
            <td style="text-align: center; background-color: #fef2f2;">${sub.below8}</td>
            <td style="text-align: center; font-weight: bold;">${sub.passRate.toFixed(1)}%</td>
        </tr>
      `}).join('');

      const printContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تقرير تحليل النتائج المدرسية</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Tajawal', sans-serif; padding: 20px; color: #1f2937; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .subtitle { font-size: 14px; color: #6b7280; }
          .grid-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
          .stat-box { border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; text-align: center; background: #f9fafb; }
          .stat-val { font-size: 20px; font-weight: bold; color: #111827; }
          .stat-label { font-size: 12px; color: #6b7280; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; }
          th { background-color: #1e293b; color: white; font-weight: bold; text-align: center; }
          tr:nth-child(even) { background-color: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoHtml}
          <div class="title">تقرير تحليل النتائج المدرسية</div>
          <div class="subtitle">تاريخ الاستخراج: ${dateStr}</div>
        </div>

        <h3 style="margin-bottom: 10px;">أولاً: الإحصائيات العامة</h3>
        <div class="grid-stats">
             <div class="stat-box">
                <div class="stat-label">عدد التلاميذ</div>
                <div class="stat-val">${analysisData.general.totalStudents}</div>
             </div>
             <div class="stat-box">
                <div class="stat-label">نسبة النجاح العامة</div>
                <div class="stat-val">${analysisData.general.overallPassRate.toFixed(2)}%</div>
             </div>
             <div class="stat-box">
                <div class="stat-label">المعدل العام للقسم</div>
                <div class="stat-val" style="color: #2563eb;">${analysisData.general.averageGPA.toFixed(2)}</div>
             </div>
        </div>
        
        <div class="grid-stats">
             <div class="stat-box" style="background-color: #fdf2f8; border-color: #fbcfe8;">
                <div class="stat-label">معدل الإناث</div>
                <div class="stat-val" style="color: #db2777;">${analysisData.general.females.avgGPA.toFixed(2)}</div>
                <div style="font-size: 10px; color: #be185d;">نسبة النجاح: ${analysisData.general.females.rate.toFixed(1)}%</div>
             </div>
             <div class="stat-box" style="background-color: #eff6ff; border-color: #bfdbfe;">
                <div class="stat-label">معدل الذكور</div>
                <div class="stat-val" style="color: #2563eb;">${analysisData.general.males.avgGPA.toFixed(2)}</div>
                <div style="font-size: 10px; color: #1d4ed8;">نسبة النجاح: ${analysisData.general.males.rate.toFixed(1)}%</div>
             </div>
        </div>

        <h3 style="margin-top: 30px; margin-bottom: 10px;">ثانياً: التحليل التفصيلي للمواد</h3>
        <table>
          <thead>
            <tr>
              <th rowspan="2">المادة</th>
              <th rowspan="2">المعدل العام</th>
              <th colspan="2">حسب الجنس</th>
              <th rowspan="2">المقارنة</th>
              <th rowspan="2">الانحراف</th>
              <th rowspan="2">التشتت</th>
              <th colspan="4">توزيع العلامات</th>
              <th rowspan="2">النجاح</th>
            </tr>
            <tr>
                <th style="background-color: #1e3a8a;">ذكور</th>
                <th style="background-color: #831843;">إناث</th>
                <th style="background-color: #064e3b;">≥15</th>
                <th style="background-color: #1e3a8a;">10-15</th>
                <th style="background-color: #b45309;">8-10</th>
                <th style="background-color: #7f1d1d;">&lt;8</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        
        <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #9ca3af;">
            تم استخراج هذا التقرير آلياً عبر منصة تقويم السلوك.
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


  const COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444'];
  const PIE_DATA = analysisData ? [
      { name: 'ناجحون', value: analysisData.general.passedStudents },
      { name: 'راسبون', value: analysisData.general.totalStudents - analysisData.general.passedStudents }
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">النتائج المدرسية</h1>
           <p className="text-gray-500 mt-1">رفع وعرض وتحليل كشوف نقاط التلاميذ</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1 w-fit overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('LIST')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === 'LIST' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
          >
              <ListIcon size={18} />
              قائمة النتائج
          </button>
          <button
            onClick={() => setActiveTab('ANALYSIS')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === 'ANALYSIS' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
          >
              <BarChart3 size={18} />
              تحليل النتائج
          </button>
          <button
            onClick={() => setActiveTab('INDIVIDUAL')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === 'INDIVIDUAL' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
          >
              <User size={18} />
              تحليل النتائج الفردية
          </button>
      </div>

      {activeTab === 'LIST' && (
          <>
            {/* Upload Section */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center animate-fade-in">
                <div className="max-w-2xl mx-auto space-y-4">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                    <Upload size={32} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">رفع ملف كشف النقاط (Excel)</h2>
                    <p className="text-sm text-gray-500 leading-relaxed">
                    يرجى رفع ملف <strong>Excel</strong> (.xlsx أو .xls).
                    <br />
                    <strong>الهيكل المطلوب:</strong> اسم المؤسسة (الصف 4)، القسم (الصف 5)، المواد (الصف 6)، بداية البيانات (الصف 7).
                    </p>
                    
                    <input 
                    type="file" 
                    accept=".xlsx, .xls"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden" 
                    id="excel-upload"
                    />
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                        <button 
                        onClick={() => triggerFileUpload('CURRENT')}
                        disabled={isProcessing}
                        className={`
                            inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all
                            ${isProcessing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/30'}
                        `}
                        >
                        {isProcessing && uploadType === 'CURRENT' ? 'جاري المعالجة...' : 'رفع نتائج السنة الحالية'}
                        {!isProcessing && <FileSpreadsheet size={20} />}
                        </button>

                        <button 
                        onClick={() => triggerFileUpload('PREVIOUS')}
                        disabled={isProcessing}
                        className={`
                            inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all border-2
                            ${isProcessing ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border-primary-100 text-primary-600 hover:bg-primary-50'}
                        `}
                        >
                        {isProcessing && uploadType === 'PREVIOUS' ? 'جاري المعالجة...' : 'رفع نتائج السنة الماضية'}
                        {!isProcessing && <History size={20} />}
                        </button>
                    </div>

                    {importSummary && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4 animate-fade-in text-green-800 text-right">
                            <p className="font-bold flex items-center justify-center gap-2 mb-2">
                                <CheckCircle2 size={18} /> تم الاستيراد بنجاح!
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <p><strong>المؤسسة:</strong> {importSummary.school}</p>
                                <p><strong>القسم المستخرج:</strong> {importSummary.className}</p>
                                <p><strong>عدد التلاميذ:</strong> {importSummary.total}</p>
                                <p><strong>نوع البيانات:</strong> {uploadType === 'CURRENT' ? 'السنة الحالية' : 'السنة الماضية'}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Results List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen className="text-primary-500" size={20} />
                        قائمة النتائج ({filteredStudents.length})
                    </h3>
                    
                    {/* Filters Container */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        {/* Grade Filter Dropdown */}
                        <div className="relative">
                             <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                             <select
                                value={selectedGradeFilter}
                                onChange={(e) => setSelectedGradeFilter(e.target.value)}
                                className="w-full sm:w-48 pr-10 pl-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm appearance-none bg-white"
                             >
                                 <option value="">كل الأقسام</option>
                                 {availableGrades.map(grade => (
                                     <option key={grade} value={grade}>{grade}</option>
                                 ))}
                             </select>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="بحث عن تلميذ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-gray-50 text-gray-600 text-sm">
                            <tr>
                                <th className="px-6 py-4 w-10"></th>
                                <th className="px-6 py-4">التلميذ</th>
                                <th className="px-6 py-4">القسم</th>
                                <th className="px-6 py-4">الجنس</th>
                                <th className="px-6 py-4">الإعادة</th>
                                <th className="px-6 py-4">المعدل العام</th>
                                <th className="px-6 py-4">ملخص السلوك</th>
                                <th className="px-6 py-4">أعلى مادة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-8 text-gray-500">
                                        لا توجد نتائج دراسية مسجلة. يرجى رفع ملف الاكسيل.
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map(student => {
                                    const record = student.academicRecords?.[0]; // Show latest (sorted by year desc in App)
                                    const topSubject = record?.subjects?.length 
                                        ? record.subjects.reduce((prev, current) => (prev.score > current.score) ? prev : current) 
                                        : null;
                                    const isExpanded = expandedStudentId === student.id;
                                    const avg = record?.average || 0;
                                    const avgColor = avg >= 15 ? 'text-green-600' : avg >= 10 ? 'text-blue-600' : 'text-red-600';
                                    
                                    // Behavior Summary
                                    const studentLogs = logs.filter(l => l.studentId === student.id);
                                    const posCount = studentLogs.filter(l => l.type === BehaviorType.POSITIVE).length;
                                    const negCount = studentLogs.filter(l => l.type === BehaviorType.NEGATIVE).length;

                                    return (
                                        <React.Fragment key={student.id}>
                                            <tr 
                                                onClick={() => toggleExpand(student.id)}
                                                className={`cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}
                                            >
                                                <td className="px-6 py-4 text-center">
                                                    {isExpanded ? <ChevronUp size={18} className="text-primary-500" /> : <ChevronDown size={18} className="text-gray-400" />}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img src={student.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-gray-200" />
                                                        <div>
                                                            <span className="block font-medium text-gray-900">{student.name}</span>
                                                            <span className="text-xs text-gray-400">{student.dateOfBirth}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{student.grade}</td>
                                                <td className="px-6 py-4 text-gray-600">{student.gender || '-'}</td>
                                                <td className="px-6 py-4">
                                                    {student.isRepeater ? (
                                                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">معيد</span>
                                                    ) : (
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">جديد</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-lg font-mono dir-ltr">
                                                    <span className={avgColor}>{avg}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-xs font-bold">
                                                        <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded">
                                                            <Plus size={10} /> {posCount}
                                                        </span>
                                                        <span className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded">
                                                            <Minus size={10} /> {negCount}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-green-600 font-medium text-sm">
                                                    {topSubject ? `${topSubject.subject} (${topSubject.score})` : '-'}
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-indigo-50/30">
                                                    <td colSpan={8} className="p-0">
                                                        <div className="p-6">
                                                            <div className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-600">
                                                                <Calendar size={16} /> 
                                                                السنة الدراسية: {record?.year} - {record?.term}
                                                            </div>
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-fade-in">
                                                                {record?.subjects?.map((sub, idx) => (
                                                                    <div key={idx} className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm text-center">
                                                                        <div className="text-xs text-gray-500 mb-1">{sub.subject}</div>
                                                                        <div className={`font-bold font-mono text-lg ${sub.score >= 10 ? 'text-gray-800' : 'text-red-500'}`}>
                                                                            {sub.score}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {student.academicRecords && student.academicRecords.length > 1 && (
                                                                <div className="mt-4 pt-4 border-t border-indigo-200">
                                                                    <h4 className="text-xs font-bold text-gray-500 mb-2">السجلات السابقة:</h4>
                                                                    <div className="flex gap-4 overflow-x-auto pb-2">
                                                                        {student.academicRecords.slice(1).map((hist, hIdx) => (
                                                                            <div key={hIdx} className="bg-white/50 px-3 py-2 rounded border border-indigo-100 min-w-[120px]">
                                                                                <div className="text-xs text-gray-500">{hist.year}</div>
                                                                                <div className="font-bold text-sm text-indigo-800">{hist.average}</div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </>
      )}

      {activeTab === 'INDIVIDUAL' && individualCategories && (
          <div className="space-y-6 animate-fade-in">
              {/* Category Grid */}
              {!selectedStudentForDeepDive ? (
                  <>
                      <h2 className="text-lg font-bold text-gray-900 mb-4">تصنيف التلاميذ حسب الأداء والاحتياجات</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* Top Performers */}
                          <div 
                              onClick={() => setSelectedCategory('TOP')}
                              className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${selectedCategory === 'TOP' ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white hover:border-green-200 hover:shadow-md'}`}
                          >
                              <div className="flex justify-between items-start mb-4">
                                  <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                                      <Award size={24} />
                                  </div>
                                  <span className="text-2xl font-bold text-gray-900">{individualCategories.topPerformers.length}</span>
                              </div>
                              <h3 className="font-bold text-gray-800 text-lg">التلاميذ المتفوقين</h3>
                              <p className="text-sm text-gray-500 mt-1">المعدل ≥ 15</p>
                          </div>

                          {/* Struggling */}
                          <div 
                              onClick={() => setSelectedCategory('STRUGGLING')}
                              className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${selectedCategory === 'STRUGGLING' ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-white hover:border-red-200 hover:shadow-md'}`}
                          >
                              <div className="flex justify-between items-start mb-4">
                                  <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                                      <TrendingUp className="rotate-180" size={24} />
                                  </div>
                                  <span className="text-2xl font-bold text-gray-900">{individualCategories.struggling.length}</span>
                              </div>
                              <h3 className="font-bold text-gray-800 text-lg">المتعثرين دراسيًا</h3>
                              <p className="text-sm text-gray-500 mt-1">8 ≤ المعدل &lt; 10</p>
                          </div>

                          {/* Learning Difficulties */}
                          <div 
                              onClick={() => setSelectedCategory('LD')}
                              className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${selectedCategory === 'LD' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white hover:border-orange-200 hover:shadow-md'}`}
                          >
                              <div className="flex justify-between items-start mb-4">
                                  <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                                      <BookOpen size={24} />
                                  </div>
                                  <span className="text-2xl font-bold text-gray-900">{individualCategories.learningDifficulties.length}</span>
                              </div>
                              <h3 className="font-bold text-gray-800 text-lg">مؤشرات صعوبات التعلم</h3>
                              <p className="text-sm text-gray-500 mt-1">المعدل &lt; 8 (خطر مرتفع)</p>
                          </div>

                          {/* Behavioral Disorders */}
                          <div 
                              onClick={() => setSelectedCategory('BEHAVIORAL')}
                              className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${selectedCategory === 'BEHAVIORAL' ? 'border-purple-500 bg-purple-50' : 'border-gray-100 bg-white hover:border-purple-200 hover:shadow-md'}`}
                          >
                              <div className="flex justify-between items-start mb-4">
                                  <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                                      <AlertTriangle size={24} />
                                  </div>
                                  <span className="text-2xl font-bold text-gray-900">{individualCategories.behavioralDisorders.length}</span>
                              </div>
                              <h3 className="font-bold text-gray-800 text-lg">الاضطرابات السلوكية</h3>
                              <p className="text-sm text-gray-500 mt-1">نقاط السلوك ≤ -5</p>
                          </div>

                          {/* Psychological */}
                          <div 
                              onClick={() => setSelectedCategory('PSYCH')}
                              className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${selectedCategory === 'PSYCH' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-md'}`}
                          >
                              <div className="flex justify-between items-start mb-4">
                                  <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                      <Brain size={24} />
                                  </div>
                                  <span className="text-2xl font-bold text-gray-900">{individualCategories.psychological.length}</span>
                              </div>
                              <h3 className="font-bold text-gray-800 text-lg">مؤشرات اضطرابات نفسية</h3>
                              <p className="text-sm text-gray-500 mt-1">قلق، اكتئاب، انطواء (من المقابلات)</p>
                          </div>

                          {/* Special Cases */}
                          <div 
                              onClick={() => setSelectedCategory('SPECIAL')}
                              className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${selectedCategory === 'SPECIAL' ? 'border-teal-500 bg-teal-50' : 'border-gray-100 bg-white hover:border-teal-200 hover:shadow-md'}`}
                          >
                              <div className="flex justify-between items-start mb-4">
                                  <div className="p-3 bg-teal-100 text-teal-600 rounded-lg">
                                      <Accessibility size={24} />
                                  </div>
                                  <span className="text-2xl font-bold text-gray-900">{individualCategories.specialCases.length}</span>
                              </div>
                              <h3 className="font-bold text-gray-800 text-lg">حالات خاصة</h3>
                              <p className="text-sm text-gray-500 mt-1">إعاقات، طيف توحد، فرط حركة</p>
                          </div>
                      </div>

                      {/* Filtered Student List */}
                      {selectedCategory && (
                          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 animate-fade-in overflow-hidden">
                              <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                  <h3 className="font-bold text-gray-800">
                                      {selectedCategory === 'TOP' && 'قائمة التلاميذ المتفوقين'}
                                      {selectedCategory === 'STRUGGLING' && 'قائمة التلاميذ المتعثرين'}
                                      {selectedCategory === 'LD' && 'قائمة مؤشرات صعوبات التعلم'}
                                      {selectedCategory === 'BEHAVIORAL' && 'قائمة الاضطرابات السلوكية'}
                                      {selectedCategory === 'PSYCH' && 'قائمة الاضطرابات النفسية'}
                                      {selectedCategory === 'SPECIAL' && 'قائمة الحالات الخاصة'}
                                  </h3>
                                  <span className="text-xs font-bold bg-white px-3 py-1 rounded-full border border-gray-200">
                                      العدد: {
                                          selectedCategory === 'TOP' ? individualCategories.topPerformers.length :
                                          selectedCategory === 'STRUGGLING' ? individualCategories.struggling.length :
                                          selectedCategory === 'LD' ? individualCategories.learningDifficulties.length :
                                          selectedCategory === 'BEHAVIORAL' ? individualCategories.behavioralDisorders.length :
                                          selectedCategory === 'PSYCH' ? individualCategories.psychological.length :
                                          individualCategories.specialCases.length
                                      }
                                  </span>
                              </div>
                              <div className="overflow-x-auto">
                                  <table className="w-full text-right text-sm">
                                      <thead className="bg-gray-50 text-gray-600">
                                          <tr>
                                              <th className="px-6 py-3">التلميذ</th>
                                              <th className="px-6 py-3">القسم</th>
                                              <th className="px-6 py-3">المعدل</th>
                                              <th className="px-6 py-3">نقاط السلوك</th>
                                              <th className="px-6 py-3">إجراءات</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                          {(() => {
                                              const list = selectedCategory === 'TOP' ? individualCategories.topPerformers :
                                                           selectedCategory === 'STRUGGLING' ? individualCategories.struggling :
                                                           selectedCategory === 'LD' ? individualCategories.learningDifficulties :
                                                           selectedCategory === 'BEHAVIORAL' ? individualCategories.behavioralDisorders :
                                                           selectedCategory === 'PSYCH' ? individualCategories.psychological :
                                                           individualCategories.specialCases;
                                              
                                              if (list.length === 0) return (
                                                  <tr><td colSpan={5} className="text-center py-6 text-gray-500">لا توجد حالات مسجلة في هذه الفئة.</td></tr>
                                              );

                                              return list.map(student => (
                                                  <tr key={student.id} className="hover:bg-gray-50">
                                                      <td className="px-6 py-4 font-bold text-gray-800">{student.name}</td>
                                                      <td className="px-6 py-4 text-gray-600">{student.grade}</td>
                                                      <td className="px-6 py-4 font-bold">{student.academicRecords?.[0]?.average || '-'}</td>
                                                      <td className={`px-6 py-4 font-bold dir-ltr text-right ${student.totalPoints < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                          {student.totalPoints > 0 ? '+' : ''}{student.totalPoints}
                                                      </td>
                                                      <td className="px-6 py-4">
                                                          <button 
                                                              onClick={() => setSelectedStudentForDeepDive(student)}
                                                              className="text-primary-600 hover:text-primary-800 text-xs font-bold underline"
                                                          >
                                                              عرض الملف الفردي
                                                          </button>
                                                      </td>
                                                  </tr>
                                              ));
                                          })()}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      )}
                  </>
              ) : (
                  // Deep Dive Profile View
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
                      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                          <button 
                              onClick={() => setSelectedStudentForDeepDive(null)}
                              className="flex items-center gap-2 text-gray-500 hover:text-gray-900"
                          >
                              <ArrowLeft size={20} /> عودة للتصنيفات
                          </button>
                          <h2 className="font-bold text-gray-900">الملف الفردي للتحليل المعمق</h2>
                      </div>
                      
                      <div className="p-8">
                          <div className="flex flex-col md:flex-row gap-8">
                              {/* Left Side: Info & Radar Chart */}
                              <div className="w-full md:w-1/3 space-y-6">
                                  <div className="text-center">
                                      <img src={selectedStudentForDeepDive.avatarUrl} alt="" className="w-24 h-24 rounded-full mx-auto border-4 border-gray-100" />
                                      <h3 className="mt-3 text-xl font-bold text-gray-900">{selectedStudentForDeepDive.name}</h3>
                                      <p className="text-gray-500">{selectedStudentForDeepDive.grade}</p>
                                  </div>

                                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                                      <div className="flex justify-between items-center">
                                          <span className="text-gray-600 text-sm">المعدل الفصلي</span>
                                          <span className="font-bold text-lg">{selectedStudentForDeepDive.academicRecords?.[0]?.average || '-'}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                          <span className="text-gray-600 text-sm">نقاط السلوك</span>
                                          <span className={`font-bold text-lg dir-ltr ${selectedStudentForDeepDive.totalPoints < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                              {selectedStudentForDeepDive.totalPoints > 0 ? '+' : ''}{selectedStudentForDeepDive.totalPoints}
                                          </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                          <span className="text-gray-600 text-sm">الغيابات</span>
                                          <span className="font-bold text-lg">
                                              {selectedStudentForDeepDive.attendanceRecords?.filter(r => r.status === 'ABSENT').length || 0}
                                          </span>
                                      </div>
                                  </div>
                              </div>

                              {/* Right Side: Analysis & Recommendations */}
                              <div className="w-full md:w-2/3 space-y-6">
                                  {/* Performance Radar */}
                                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm h-64">
                                      <h4 className="font-bold text-gray-700 mb-2 text-center text-sm">الأداء في المواد الأساسية</h4>
                                      <ResponsiveContainer width="100%" height="100%">
                                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={
                                              selectedStudentForDeepDive.academicRecords?.[0]?.subjects?.slice(0, 6).map(s => ({
                                                  subject: s.subject.length > 10 ? s.subject.substring(0, 10) + '...' : s.subject,
                                                  A: s.score,
                                                  fullMark: 20
                                              })) || []
                                          }>
                                              <PolarGrid />
                                              <PolarAngleAxis dataKey="subject" tick={{fontSize: 10}} />
                                              <PolarRadiusAxis angle={30} domain={[0, 20]} />
                                              <Radar name="Student" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.3} />
                                              <Tooltip />
                                          </RadarChart>
                                      </ResponsiveContainer>
                                  </div>

                                  {/* Category Specific Recommendation */}
                                  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                                      <div className="flex items-start gap-3">
                                          <div className="p-1 bg-amber-100 text-amber-600 rounded">
                                              <Sparkles size={20} />
                                          </div>
                                          <div>
                                              <h4 className="font-bold text-amber-800">التوجيه التربوي والنفسي</h4>
                                              <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                                                  {selectedCategory === 'TOP' && "تلميذ متفوق. ينصح بتشجيعه على المشاركة في المسابقات العلمية والأدبية، وتكليفه بمهام قيادية داخل القسم لتعزيز ثقته بنفسه واستثمار طاقاته."}
                                                  {selectedCategory === 'STRUGGLING' && "يعاني من تعثر دراسي. يجب تحديد مواد الضعف بدقة (انظر الرسم البياني) وتوجيهه لدروس الدعم. ينصح بمقابلة الولي لتنظيم المراجعة المنزلية."}
                                                  {selectedCategory === 'LD' && "مؤشرات تدل على صعوبات تعلم محتملة. يوصى بإجراء اختبارات تشخيصية (مثل مقياس عسر القراءة/الحساب) وتكييف طرق التدريس والتقويم معه."}
                                                  {selectedCategory === 'BEHAVIORAL' && "مشكلات سلوكية واضحة. يجب تفعيل خطة تعديل السلوك (التعزيز الإيجابي والعقود السلوكية). ينصح بدمجه في الأنشطة الرياضية لتفريغ الطاقة."}
                                                  {selectedCategory === 'PSYCH' && "مؤشرات نفسية تستدعي الاهتمام. يرجى عقد جلسات استماع فردية لتعزيز الشعور بالأمان، والتواصل بحذر مع الولي لفهم الظروف الأسرية."}
                                                  {selectedCategory === 'SPECIAL' && "حالة خاصة تتطلب رعاية فردية. يجب التنسيق مع طبيب الصحة المدرسية وتوفير التسهيلات اللازمة (مكان الجلوس، وقت إضافي)."}
                                              </p>
                                          </div>
                                      </div>
                                  </div>

                                  {/* Interview History Snippet */}
                                  {selectedStudentForDeepDive.interviews && selectedStudentForDeepDive.interviews.length > 0 && (
                                      <div>
                                          <h4 className="font-bold text-gray-700 mb-2">سجل المقابلات المرتبطة</h4>
                                          <ul className="space-y-2">
                                              {selectedStudentForDeepDive.interviews.slice(0, 3).map(i => (
                                                  <li key={i.id} className="text-sm bg-gray-50 p-2 rounded border border-gray-100 flex justify-between">
                                                      <span>{i.title}</span>
                                                      <span className="text-gray-400 text-xs">{new Date(i.date).toLocaleDateString('ar-EG')}</span>
                                                  </li>
                                              ))}
                                          </ul>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      )}

      {activeTab === 'ANALYSIS' && analysisData && (
          <div className="space-y-6 animate-fade-in">
              <div className="flex justify-end gap-3">
                    <button 
                        onClick={handlePrintAnalysis}
                        className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 font-bold transition-colors"
                        title="طباعة التقرير / حفظ PDF"
                    >
                        <Printer size={18} /> طباعة التقرير / PDF
                    </button>
                    <button 
                        onClick={handleExportAnalysisExcel}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 font-bold transition-colors shadow-lg shadow-green-500/20"
                    >
                        <Download size={18} /> تصدير Excel
                    </button>
              </div>

              {/* General Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-500 mb-1">العدد الإجمالي</p>
                      <h3 className="text-2xl font-bold text-gray-900">{analysisData.general.totalStudents}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                          إناث: {analysisData.general.females.total} | ذكور: {analysisData.general.males.total}
                      </p>
                  </div>
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-500 mb-1">نسبة النجاح العامة</p>
                      <h3 className={`text-2xl font-bold ${analysisData.general.overallPassRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                          {analysisData.general.overallPassRate.toFixed(2)}%
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">عدد الناجحين: {analysisData.general.passedStudents}</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-500 mb-1">معدل القسم العام</p>
                      <h3 className="text-2xl font-bold text-blue-600">
                          {analysisData.general.averageGPA.toFixed(2)}
                      </h3>
                  </div>
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-500 mb-1">نجاح حسب الجنس</p>
                      <div className="flex flex-col gap-1 mt-1">
                          <div className="flex justify-between text-xs">
                              <span>إناث:</span>
                              <span className="font-bold text-pink-600">{analysisData.general.females.rate.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                              <span>ذكور:</span>
                              <span className="font-bold text-blue-600">{analysisData.general.males.rate.toFixed(1)}%</span>
                          </div>
                      </div>
                  </div>
              </div>

            {/* Priority Intervention Analysis (Weakest Subjects) */}
            {(() => {
                // Determine lowest 3 subjects
                // Filter out exempted subjects (where max score is 0, indicating not taught)
                const activeSubjects = analysisData.subjectAnalysis.filter(sub => sub.maxScore > 0);
                
                if (activeSubjects.length === 0) return null;

                const lowestSubjects = [...activeSubjects]
                    .sort((a, b) => a.average - b.average)
                    .slice(0, 3);

                return (
                    <div className="bg-red-50 rounded-xl p-6 border border-red-100">
                        <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                            <AlertCircle size={20} /> تحليل المواد المتعثرة ونقاط التدخل البيداغوجي
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {lowestSubjects.map(sub => {
                                const strugglingStudents = studentsWithResults.map(s => {
                                    const rec = s.academicRecords?.[0];
                                    const subjectRecord = rec?.subjects?.find(sb => sb.subject === sub.subject);
                                    return {
                                        id: s.id,
                                        name: s.name,
                                        score: subjectRecord?.score || 0
                                    };
                                }).filter(s => s.score < 10).sort((a, b) => a.score - b.score);

                                return (
                                    <div key={sub.subject} className="bg-white rounded-lg shadow-sm border border-red-100 overflow-hidden">
                                        <div className="p-3 bg-red-100 border-b border-red-200 flex justify-between items-center">
                                            <h4 className="font-bold text-red-900 text-sm">{sub.subject}</h4>
                                            <span className="text-xs font-bold bg-white text-red-700 px-2 py-0.5 rounded">
                                                المعدل: {sub.average.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="p-3">
                                            <p className="text-xs text-gray-500 mb-2 font-bold">التلاميذ المتعثرين ({strugglingStudents.length})</p>
                                            <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                                                {strugglingStudents.length > 0 ? (
                                                    strugglingStudents.map(student => (
                                                        <div key={student.id} className="flex justify-between items-center text-xs bg-gray-50 p-1.5 rounded border border-gray-100">
                                                            <span className="truncate max-w-[120px] font-medium text-gray-700" title={student.name}>{student.name}</span>
                                                            <span className="font-bold text-red-600">{student.score}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-gray-400 text-center py-2">لا يوجد تلاميذ متعثرين في هذه المادة</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}
            
            {/* Subject Selector Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Layers size={20} className="text-primary-500" />
                      نافذة التحليل التفصيلي للمادة
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <div className="w-full sm:w-1/2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">اختر المادة للتحليل</label>
                          <select 
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-700 font-medium"
                          >
                              <option value="">-- اختر مادة --</option>
                              {analysisData.subjectAnalysis.map(sub => (
                                  <option key={sub.subject} value={sub.subject}>{sub.subject}</option>
                              ))}
                          </select>
                      </div>
                      {selectedSubject && specificSubjectDetails && (
                          <div className="flex items-center gap-4 mt-6 sm:mt-0 flex-1">
                              <div className="px-4 py-2 bg-indigo-50 rounded-lg text-center">
                                  <p className="text-xs text-indigo-600 font-bold mb-1">معدل المادة</p>
                                  <p className="text-xl font-bold text-gray-900">{specificSubjectDetails.stats.average.toFixed(2)}</p>
                              </div>
                              <div className="px-4 py-2 bg-green-50 rounded-lg text-center">
                                  <p className="text-xs text-green-600 font-bold mb-1">نسبة النجاح</p>
                                  <p className="text-xl font-bold text-gray-900">{specificSubjectDetails.stats.passRate.toFixed(1)}%</p>
                              </div>
                              <div className="px-4 py-2 bg-orange-50 rounded-lg text-center">
                                  <p className="text-xs text-orange-600 font-bold mb-1">أعلى علامة</p>
                                  <p className="text-xl font-bold text-gray-900">{specificSubjectDetails.stats.maxScore}</p>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Specific Subject Dashboard */}
                  {selectedSubject && specificSubjectDetails && (
                      <div className="mt-8 animate-fade-in border-t border-gray-100 pt-6">
                           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Grade Distribution Chart */}
                                <div className="lg:col-span-1">
                                    <h4 className="font-bold text-gray-700 mb-4 text-sm">توزيع العلامات</h4>
                                    <div className="h-48 w-full dir-ltr">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { name: '<8', value: specificSubjectDetails.stats.below8, fill: '#ef4444' },
                                                { name: '8-10', value: specificSubjectDetails.stats.between8and10, fill: '#f97316' },
                                                { name: '10-12', value: specificSubjectDetails.stats.between10and15, fill: '#eab308' },
                                                { name: '12+', value: specificSubjectDetails.stats.above15, fill: '#22c55e' },
                                            ]}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" tick={{fontSize: 10}} />
                                                <YAxis allowDecimals={false} width={20} tick={{fontSize: 10}} />
                                                <Tooltip cursor={{fill: 'transparent'}} />
                                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                                                    {
                                                        [0,1,2,3].map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={['#ef4444', '#f97316', '#eab308', '#22c55e'][index]} />
                                                        ))
                                                    }
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Lists: Weak vs Strong */}
                                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Students Needing Support */}
                                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                                        <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2 text-sm">
                                            <AlertTriangle size={16} /> تلاميذ يحتاجون للدعم (&lt;10)
                                        </h4>
                                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                            {specificSubjectDetails.students.filter(s => (s.score || 0) < 10).length > 0 ? (
                                                specificSubjectDetails.students.filter(s => (s.score || 0) < 10).map(s => (
                                                    <div key={s.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-red-100 text-sm">
                                                        <span className="font-medium text-gray-700 truncate max-w-[120px]" title={s.name}>{s.name}</span>
                                                        <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">{s.score}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-gray-500 text-center py-4">لا يوجد تلاميذ تحت المعدل</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Top Performers */}
                                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                        <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2 text-sm">
                                            <Award size={16} /> المتفوقون في المادة (≥15)
                                        </h4>
                                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                             {specificSubjectDetails.students.filter(s => (s.score || 0) >= 15).length > 0 ? (
                                                specificSubjectDetails.students.filter(s => (s.score || 0) >= 15).map(s => (
                                                    <div key={s.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-green-100 text-sm">
                                                        <span className="font-medium text-gray-700 truncate max-w-[120px]" title={s.name}>{s.name}</span>
                                                        <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">{s.score}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-gray-500 text-center py-4">لا يوجد تلاميذ متفوقين</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                           </div>
                      </div>
                  )}
            </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Subject Comparison Chart */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <BarChart3 size={20} className="text-primary-500" />
                          مقارنة متوسطات المواد
                      </h3>
                      <div className="h-72 w-full dir-ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analysisData.subjectAnalysis}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="subject" tick={{fontSize: 10}} interval={0} angle={-30} textAnchor="end" height={60} />
                                <YAxis domain={[0, 20]} />
                                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Bar dataKey="average" name="المعدل" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={30} />
                                <Bar dataKey="passRate" name="نسبة النجاح %" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={10} yAxisId="right" hide />
                            </BarChart>
                        </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Pass/Fail Pie Chart & Stats */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                       <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <PieChartIcon size={20} className="text-primary-500" />
                          نسب النجاح
                      </h3>
                      <div className="flex-1 flex items-center justify-center">
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={PIE_DATA}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {PIE_DATA.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.name === 'ناجحون' ? '#22c55e' : '#ef4444'} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Gender Analysis Detailed Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                    {/* Female Analysis Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden">
                        <div className="p-4 border-b border-pink-100 bg-pink-50 flex items-center gap-3">
                            <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
                                <User size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">تحليل الإناث</h3>
                                <p className="text-xs text-pink-600 font-bold">{analysisData.general.females.total} تلميذة</p>
                            </div>
                        </div>
                        <div className="p-6">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">نسبة النجاح</p>
                                    <p className="text-xl font-bold text-pink-600">{analysisData.general.females.rate.toFixed(1)}%</p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">معدل الإناث</p>
                                    <p className="text-xl font-bold text-gray-800">{analysisData.general.females.avgGPA.toFixed(2)}</p>
                                </div>
                            </div>
                            {/* Distribution */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">امتياز (18-20)</span>
                                    <span className="font-bold text-purple-600">{analysisData.general.females.dist.excellent}</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-purple-500 h-full" style={{width: `${analysisData.general.females.total ? (analysisData.general.females.dist.excellent / analysisData.general.females.total) * 100 : 0}%`}}></div>
                                </div>
                                
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">جيد جداً (16-17.99)</span>
                                    <span className="font-bold text-emerald-600">{analysisData.general.females.dist.veryGood}</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full" style={{width: `${analysisData.general.females.total ? (analysisData.general.females.dist.veryGood / analysisData.general.females.total) * 100 : 0}%`}}></div>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">جيد (14-15.99)</span>
                                    <span className="font-bold text-green-600">{analysisData.general.females.dist.good}</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-green-500 h-full" style={{width: `${analysisData.general.females.total ? (analysisData.general.females.dist.good / analysisData.general.females.total) * 100 : 0}%`}}></div>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">قريب من الجيد (12-13.99)</span>
                                    <span className="font-bold text-blue-600">{analysisData.general.females.dist.closeToGood}</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full" style={{width: `${analysisData.general.females.total ? (analysisData.general.females.dist.closeToGood / analysisData.general.females.total) * 100 : 0}%`}}></div>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">مقبول (10-11.99)</span>
                                    <span className="font-bold text-yellow-600">{analysisData.general.females.dist.acceptable}</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-yellow-500 h-full" style={{width: `${analysisData.general.females.total ? (analysisData.general.females.dist.acceptable / analysisData.general.females.total) * 100 : 0}%`}}></div>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">دون المعدل (&lt;10)</span>
                                    <span className="font-bold text-red-600">{analysisData.general.females.dist.fail}</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-red-500 h-full" style={{width: `${analysisData.general.females.total ? (analysisData.general.females.dist.fail / analysisData.general.females.total) * 100 : 0}%`}}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Male Analysis Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
                        <div className="p-4 border-b border-blue-100 bg-blue-50 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <User size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">تحليل الذكور</h3>
                                <p className="text-xs text-blue-600 font-bold">{analysisData.general.males.total} تلميذ</p>
                            </div>
                        </div>
                        <div className="p-6">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">نسبة النجاح</p>
                                    <p className="text-xl font-bold text-blue-600">{analysisData.general.males.rate.toFixed(1)}%</p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">معدل الذكور</p>
                                    <p className="text-xl font-bold text-gray-800">{analysisData.general.males.avgGPA.toFixed(2)}</p>
                                </div>
                            </div>
                            {/* Distribution */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">امتياز (18-20)</span>
                                    <span className="font-bold text-purple-600">{analysisData.general.males.dist.excellent}</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-purple-500 h-full" style={{width: `${analysisData.general.males.total ? (analysisData.general.males.dist.excellent / analysisData.general.males.total) * 100 : 0}%`}}></div>
                                </div>
                                
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">جيد جداً (16-17.99)</span>
                                    <span className="font-bold text-emerald-600">{analysisData.general.males.dist.veryGood}</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full" style={{width: `${analysisData.general.males.total ? (analysisData.general.males.dist.veryGood / analysisData.general.males.total) * 100 : 0}%`}}></div>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">جيد (14-15.99)</span>
                                    <span className="font-bold text-green-600">{analysisData.general.males.dist.good}</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-green-500 h-full" style={{width: `${analysisData.general.males.total ? (analysisData.general.males.dist.good / analysisData.general.males.total) * 100 : 0}%`}}></div>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">قريب من الجيد (12-13.99)</span>
                                    <span className="font-bold text-blue-600">{analysisData.general.males.dist.closeToGood}</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full" style={{width: `${analysisData.general.males.total ? (analysisData.general.males.dist.closeToGood / analysisData.general.males.total) * 100 : 0}%`}}></div>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">مقبول (10-11.99)</span>
                                    <span className="font-bold text-yellow-600">{analysisData.general.males.dist.acceptable}</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-yellow-500 h-full" style={{width: `${analysisData.general.males.total ? (analysisData.general.males.dist.acceptable / analysisData.general.males.total) * 100 : 0}%`}}></div>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">دون المعدل (&lt;10)</span>
                                    <span className="font-bold text-red-600">{analysisData.general.males.dist.fail}</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-red-500 h-full" style={{width: `${analysisData.general.males.total ? (analysisData.general.males.dist.fail / analysisData.general.males.total) * 100 : 0}%`}}></div>
                                </div>
                            </div>
                        </div>
                    </div>
              </div>

              {/* Subject Detailed Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                      <h3 className="font-bold text-gray-900">جدول تحليل المواد التفصيلي</h3>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-right text-sm border-collapse">
                          <thead className="bg-slate-800 text-white">
                              <tr>
                                  <th className="px-4 py-3 border-l border-slate-700">المادة</th>
                                  <th className="px-4 py-3 text-center border-l border-slate-700" title="المتوسط الحسابي: مجموع نقاط التلاميذ في المادة / العدد الإجمالي">معدل المادة (المتوسط)</th>
                                  <th className="px-4 py-3 text-center border-l border-slate-700 bg-blue-800 text-white">معدل الذكور</th>
                                  <th className="px-4 py-3 text-center border-l border-slate-700 bg-pink-800 text-white">معدل الإناث</th>
                                  <th className="px-4 py-3 text-center border-l border-slate-700">المقارنة</th>
                                  <th className="px-4 py-3 text-center border-l border-slate-700">الانحراف المعياري</th>
                                  <th className="px-4 py-3 text-center border-l border-slate-700">معامل التشتت</th>
                                  <th className="px-4 py-3 text-center border-l border-slate-700 bg-emerald-700 text-white">≥ 15</th>
                                  <th className="px-4 py-3 text-center border-l border-slate-700 bg-blue-700 text-white">10 - 14.99</th>
                                  <th className="px-4 py-3 text-center border-l border-slate-700 bg-amber-600 text-white">8 - 9.99</th>
                                  <th className="px-4 py-3 text-center border-l border-slate-700 bg-red-700 text-white">أقل من 8</th>
                                  <th className="px-4 py-3 text-center border-l border-slate-700">عدد الناجحين</th>
                                  <th className="px-4 py-3 text-center">نسبة النجاح</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {analysisData.subjectAnalysis.map((sub, idx) => {
                                  const isExempt = sub.maxScore === 0;
                                  return (
                                  <tr key={idx} className={`hover:bg-gray-50 ${isExempt ? 'bg-gray-50 opacity-70' : ''}`}>
                                      <td className="px-4 py-3 font-bold text-gray-800">{sub.subject}</td>
                                      <td className="px-4 py-3 text-center font-bold">
                                          {isExempt ? (
                                              <span className="text-gray-500 font-medium">معفاة</span>
                                          ) : (
                                              <div className="flex items-center justify-center gap-1.5" title={sub.average >= analysisData.general.averageGPA ? "أعلى من المعدل العام" : "أقل من المعدل العام"}>
                                                  <span className={sub.average >= analysisData.general.averageGPA ? "text-emerald-700" : "text-red-600"}>
                                                      {sub.average.toFixed(2)}
                                                  </span>
                                                  {sub.average >= analysisData.general.averageGPA ? (
                                                      <TrendingUp size={14} className="text-emerald-500" strokeWidth={2.5} />
                                                  ) : (
                                                      <TrendingDown size={14} className="text-red-500" strokeWidth={2.5} />
                                                  )}
                                              </div>
                                          )}
                                      </td>
                                      <td className="px-4 py-3 text-center font-bold text-blue-600 bg-blue-50/30">
                                          {isExempt ? '-' : (sub.maleAverage > 0 ? sub.maleAverage.toFixed(2) : '-')}
                                      </td>
                                      <td className="px-4 py-3 text-center font-bold text-pink-600 bg-pink-50/30">
                                          {isExempt ? '-' : (sub.femaleAverage > 0 ? sub.femaleAverage.toFixed(2) : '-')}
                                      </td>
                                      <td className="px-4 py-3 text-center text-xs font-bold text-gray-600">
                                          {!isExempt && (
                                              <span className={`px-2 py-1 rounded ${sub.average >= analysisData.general.averageGPA ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                  {sub.comparison}
                                              </span>
                                          )}
                                      </td>
                                      <td className="px-4 py-3 text-center text-gray-500 font-mono">
                                          {isExempt ? '-' : sub.stdDev.toFixed(2)}
                                      </td>
                                      <td className="px-4 py-3 text-center text-gray-500 font-mono">
                                          {isExempt ? '-' : `${sub.coefficientOfVariation.toFixed(1)}%`}
                                      </td>
                                      <td className="px-4 py-3 text-center bg-emerald-50/30 text-green-700 font-bold">
                                          {isExempt ? '-' : sub.above15}
                                      </td>
                                      <td className="px-4 py-3 text-center bg-blue-50/30 text-blue-700">
                                          {isExempt ? '-' : sub.between10and15}
                                      </td>
                                      <td className="px-4 py-3 text-center bg-yellow-50/30 text-yellow-700">
                                          {isExempt ? '-' : sub.between8and10}
                                      </td>
                                      <td className="px-4 py-3 text-center bg-red-50/30 text-red-700 font-bold">
                                          {isExempt ? '-' : sub.below8}
                                      </td>
                                      <td className="px-4 py-3 text-center font-bold">
                                          {isExempt ? '-' : sub.passedCount}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                          {!isExempt && (
                                              <span className={`px-2 py-1 rounded text-xs font-bold ${sub.passRate >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                  {sub.passRate.toFixed(1)}%
                                              </span>
                                          )}
                                      </td>
                                  </tr>
                              )})}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'ANALYSIS' && !analysisData && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
             <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
               <TrendingUp size={32} />
             </div>
             <h3 className="text-lg font-bold text-gray-900 mb-1">لا توجد بيانات للتحليل</h3>
             <p className="text-gray-500">يرجى رفع ملف النتائج أولاً في تبويب "قائمة النتائج" لتفعيل التحليل.</p>
          </div>
      )}
      
      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-6 z-50 bg-gray-900 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in">
           <div className="bg-green-500 rounded-full p-1.5">
             <CheckCircle2 size={16} strokeWidth={3} className="text-white" />
           </div>
           <div>
             <p className="font-bold text-sm">تم الحفظ بنجاح</p>
             <p className="text-xs text-gray-400">تم تحديث بيانات التلاميذ والنتائج</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default AcademicResults;
