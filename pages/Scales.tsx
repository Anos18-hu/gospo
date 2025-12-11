import React, { useState, useRef } from 'react';
import { ClipboardCheck, Brain, ArrowRight, CheckCircle2, ChevronLeft, AlertCircle, AlertTriangle } from 'lucide-react';
import { Student, EducationStage, Scale, ScaleOption } from '../types';

// Default options for existing scales (0-3)
const DEFAULT_OPTIONS: ScaleOption[] = [
    { val: 0, label: 'أبداً' },
    { val: 1, label: 'نادراً' },
    { val: 2, label: 'أحياناً' },
    { val: 3, label: 'دائماً' }
];

// Define the Scales Data
const SCALES_DATA: Scale[] = [
    {
        id: 'educational_behavior_comprehensive',
        title: 'مقياس السلوك التربوي الشامل',
        description: 'تقييم شامل للسلوك التربوي عبر 5 أبعاد: الانضباط، السلوك الاجتماعي، المسؤولية، التحكم الانفعالي، والقيم.',
        targetStages: [EducationStage.ELEMENTARY, EducationStage.MIDDLE, EducationStage.HIGH],
        options: [
            { val: 1, label: 'أبداً' },
            { val: 2, label: 'نادراً' },
            { val: 3, label: 'أحياناً' },
            { val: 4, label: 'غالباً' },
            { val: 5, label: 'دائماً' }
        ],
        questions: [
            // Dimension 1: Discipline
            { id: 1, text: 'يلتزم بالتعليمات داخل القسم.' },
            { id: 2, text: 'يحترم أوقات الدخول والخروج.' },
            { id: 3, text: 'يحافظ على الهدوء أثناء الحصص.' },
            { id: 4, text: 'يتجنب السلوك الفوضوي أو المزعج.' },
            { id: 5, text: 'يمتثل لتعليمات المشرفين خارج القسم.' },
            { id: 6, text: 'يحافظ على النظام في الطابور والساحة.' },
            // Dimension 2: Social Behavior
            { id: 7, text: 'يتفاعل بإيجابية مع زملائه.' },
            { id: 8, text: 'يمد يد المساعدة عند الحاجة.' },
            { id: 9, text: 'يتواصل باحترام مع الآخرين.' },
            { id: 10, text: 'يتجنب الشجارات والمناوشات.' },
            { id: 11, text: 'يُظهر روح التعاون داخل القسم.' },
            { id: 12, text: 'يتقبل الاختلافات بين الزملاء.' },
            // Dimension 3: Responsibility
            { id: 13, text: 'يحافظ على أدواته ودفاتره.' },
            { id: 14, text: 'يسلّم الواجبات في وقتها.' },
            { id: 15, text: 'يشارك بجدية في الأنشطة الصفية.' },
            { id: 16, text: 'يلتزم بإنجاز المهام المكلف بها.' },
            { id: 17, text: 'يظهر اهتمامًا بالتعلم.' },
            { id: 18, text: 'يعترف بالأخطاء ويحاول تصحيحها.' },
            // Dimension 4: Emotional Control
            { id: 19, text: 'يتحكم في غضبه داخل المؤسسة.' },
            { id: 20, text: 'يتجنب التلفظ بكلمات غير لائقة.' },
            { id: 21, text: 'يتعامل بهدوء في المواقف الضاغطة.' },
            { id: 22, text: 'يقبل النقد بدون انفعال زائد.' },
            { id: 23, text: 'يظهر قدرة على حل المشكلات دون شجار.' },
            { id: 24, text: 'لا يلجأ إلى العنف اللفظي أو الجسدي.' },
            // Dimension 5: Ethical Behavior
            { id: 25, text: 'يحترم ممتلكات المؤسسة.' },
            { id: 26, text: 'يتحلى بالأمانة في تعاملاته.' },
            { id: 27, text: 'لا يغش في الامتحانات أو الواجبات.' },
            { id: 28, text: 'يحترم خصوصية الآخرين.' },
            { id: 29, text: 'يتحلى بالصدق في أقواله وأفعاله.' },
            { id: 30, text: 'يظهر سلوكًا يعكس القيم التربوية السليمة.' }
        ],
        interpretation: (score, max) => {
            if (score >= 120) return { level: 'سلوك تربوي ممتاز', color: 'text-green-700 bg-green-50', advice: 'الطالب يتمتع بمستوى عالٍ من الانضباط والمسؤولية. ينصح بتعزيز هذا السلوك وتشجيعه ليكون قدوة لزملائه.' };
            if (score >= 90) return { level: 'سلوك تربوي جيد', color: 'text-blue-600 bg-blue-50', advice: 'سلوك الطالب جيد عموماً مع وجود بعض الهفوات البسيطة. ينصح بالمتابعة المستمرة للحفاظ على هذا المستوى.' };
            if (score >= 60) return { level: 'يحتاج دعماً وتوجيهاً', color: 'text-orange-600 bg-orange-50', advice: 'توجد ملاحظات سلوكية متعددة. يحتاج الطالب إلى خطة توجيه فردية ومتابعة من المرشد التربوي.' };
            return { level: 'يستدعي تدخلاً تربوياً', color: 'text-red-700 bg-red-50', advice: 'مستوى السلوك منخفض ويشير إلى مشاكل انضباطية أو نفسية. يتطلب تدخلاً عاجلاً من الفريق التربوي والنفسي واستدعاء الولي.' };
        }
    },
    {
        id: 'adhd_short',
        title: 'مقياس كونرز المختصر (ADHD)',
        description: 'تقييم أولي لعلامات فرط الحركة وتشتت الانتباه لدى الأطفال والمراهقين.',
        targetStages: [EducationStage.ELEMENTARY, EducationStage.MIDDLE],
        questions: [
            { id: 1, text: 'كثير الحركة ولا يستقر في مكانه.' },
            { id: 2, text: 'يجد صعوبة في إتمام المهام التي تتطلب تركيزاً ذهنياً.' },
            { id: 3, text: 'سريع التشتت بالمؤثرات الخارجية.' },
            { id: 4, text: 'يندفع في الإجابة قبل اكتمال السؤال.' },
            { id: 5, text: 'يواجه صعوبة في انتظار دوره.' },
            { id: 6, text: 'يضيع أغراضه المدرسية باستمرار.' },
            { id: 7, text: 'يتحدث كثيراً وبشكل مفرط.' },
            { id: 8, text: 'يقاطع الآخرين ويتدخل في شؤونهم.' }
        ],
        interpretation: (score, max) => {
            const percentage = (score / max) * 100;
            if (percentage < 40) return { level: 'طبيعي', color: 'text-green-600 bg-green-50', advice: 'السلوك ضمن الحدود الطبيعية. لا يتطلب تدخلاً.' };
            if (percentage < 70) return { level: 'متوسط الاحتمالية', color: 'text-orange-600 bg-orange-50', advice: 'توجد بعض المؤشرات. يوصى بمراقبة السلوك وتطبيق استراتيجيات تعديل السلوك داخل الفصل.' };
            return { level: 'مرتفع الاحتمالية', color: 'text-red-600 bg-red-50', advice: 'مؤشرات قوية. يوصى بشدة بتحويل الطالب للمرشد النفسي أو المختص لإجراء تقييم شامل.' };
        }
    },
    {
        id: 'learning_diff',
        title: 'قائمة مؤشرات صعوبات التعلم (الابتدائي)',
        description: 'رصد الصعوبات الأكاديمية والإدراكية التي قد تشير إلى صعوبات تعلم.',
        targetStages: [EducationStage.ELEMENTARY],
        questions: [
            { id: 1, text: 'يجد صعوبة في الربط بين الحروف وأصواتها.' },
            { id: 2, text: 'يقرأ ببطء شديد ويرتكب أخطاء متكررة.' },
            { id: 3, text: 'يجد صعوبة في تذكر ما قرأه للتو.' },
            { id: 4, text: 'خطه رديء جداً وغير مقروء مقارنة بأقرانه.' },
            { id: 5, text: 'يخلط بين الرموز الرياضية (+ ، - ، ×).' },
            { id: 6, text: 'يجد صعوبة في فهم الاتجاهات (يمين، يسار، فوق، تحت).' },
        ],
        interpretation: (score, max) => {
            const percentage = (score / max) * 100;
            if (percentage < 30) return { level: 'منخفض', color: 'text-green-600 bg-green-50', advice: 'لا توجد مؤشرات واضحة لصعوبات التعلم.' };
            if (percentage < 60) return { level: 'متوسط', color: 'text-yellow-600 bg-yellow-50', advice: 'قد يعاني من بطء تعلم أو تأخر دراسي بسيط. يحتاج لدعم إضافي في الدروس.' };
            return { level: 'مرتفع', color: 'text-red-600 bg-red-50', advice: 'احتمالية وجود صعوبات تعلم نمائية أو أكاديمية. يرجى التنسيق مع معلم التربية الخاصة.' };
        }
    },
    {
        id: 'learning_diff_middle',
        title: 'مقياس مؤشرات صعوبات التعلم (المتوسط)',
        description: 'رصد الصعوبات الأكاديمية واستراتيجيات التعلم (40 بنداً شاملة).',
        targetStages: [EducationStage.MIDDLE],
        options: [
            { val: 0, label: 'أبداً' },
            { val: 1, label: 'أحياناً' },
            { val: 2, label: 'غالباً' },
            { val: 3, label: 'دائماً' }
        ],
        questions: [
            // Dimension 1: Attention & Focus
            { id: 1, text: 'يصعب عليه التركيز خلال الحصة أكثر من أقرانه.' },
            { id: 2, text: 'يتشتت بسهولة بواسطة الأصوات أو الحركة حوله.' },
            { id: 3, text: 'يبدأ مهمة ولا يكملها بدون تذكير مستمر.' },
            { id: 4, text: 'ينسى التعليمات متعددة الخطوات أو لا يتبعها.' },
            { id: 5, text: 'يظهر نشاطًا زائدًا أو قلقًا أثناء الجلوس المطلوب.' },
            // Dimension 2: Reading
            { id: 6, text: 'يعثر على صعوبة في تعرف الكلمات أو نطقها.' },
            { id: 7, text: 'يقرأ ببطء وبجهد مقارنة بزملائه.' },
            { id: 8, text: 'يجد صعوبة في فهم ما قرأه (لا يستطيع إعادة سرد الفكرة الأساسية).' },
            { id: 9, text: 'يتخطى أسطرًا أو يكرر أسطرًا عند القراءة.' },
            { id: 10, text: 'يتهجّى الكلمات بشكل غير متسق.' },
            // Dimension 3: Writing
            { id: 11, text: 'حروفه غير متناسقة أو صعبة القراءة.' },
            { id: 12, text: 'يواجه صعوبة في تنظيم أفكاره كتابة (جمل قصيرة غير مترابطة).' },
            { id: 13, text: 'أخطاء إملائية متكررة حتى في كلمات تعلمها.' },
            { id: 14, text: 'يستهلك وقتًا طويلًا لإكمال كتابة واجب بسيط.' },
            { id: 15, text: 'صعوبة في استخدام قواعد النحو البسيطة في الكتابة.' },
            // Dimension 4: Math
            { id: 16, text: 'صعوبة في حفظ جداول الضرب أو قواعد حسابية بسيطة.' },
            { id: 17, text: 'يخطئ في مسائل تحتاج ترتيب خطوات بسيطة.' },
            { id: 18, text: 'يواجه صعوبة في فهم الرموز الرياضية.' },
            { id: 19, text: 'أخطاء متكررة في العمليات الحسابية البديهية.' },
            { id: 20, text: 'صعوبة في تقدير الكميات أو مفاهيم المكان/الترتيب.' },
            // Dimension 5: Oral Language
            { id: 21, text: 'يعبر بصعوبة عن أفكاره شفهياً بطريقة مفهومة.' },
            { id: 22, text: 'ينسى الكلمات أثناء الحديث أو يستبدلها بكلمات غير مناسبة.' },
            { id: 23, text: 'صعوبة في فهم الأسئلة المعقدة أو التعليقات الطويلة.' },
            { id: 24, text: 'مشاكل في نطق بعض الأصوات بوضوح.' },
            { id: 25, text: 'يستجيب بتأخر للمحادثات أو لا يتبع الحوار بسهولة.' },
            // Dimension 6: Memory
            { id: 26, text: 'ينسى معلومات حديثة بعد لحظات (مثلاً تعليمات المعلم).' },
            { id: 27, text: 'يواجه صعوبة في تذكر تسلسل خطوات أو خطوات الواجب.' },
            { id: 28, text: 'يعتمد على التذكيرات المستمرة لتنفيذ المهام.' },
            { id: 29, text: 'ضعف في استدعاء معلومات محفوظة (تلميح لا يساعد كثيرًا).' },
            { id: 30, text: 'يخطئ في حفظ معلومات دراسية أساسية بالرغم من التدريب المتكرر.' },
            // Dimension 7: Executive Functions
            { id: 31, text: 'يعاني في تنظيم أدواته ودفاتره.' },
            { id: 32, text: 'يخطط قليلًا أو لا يخطط لتنفيذ مهمة بسيطة.' },
            { id: 33, text: 'يواجه صعوبة في البدء بالمهام (تأجيل مفرط).' },
            { id: 34, text: 'لا يلتزم بالمواعيد أو يفقد الأوراق باستمرار.' },
            { id: 35, text: 'يحتاج لتوجيه مستمر لتنظيم وقت إنجاز واجباته.' },
            // Dimension 8: Social/Emotional
            { id: 36, text: 'يظهر إحباطًا شديدًا أو يستسلم بسهولة عندما يواجه صعوبة تعلم.' },
            { id: 37, text: 'يتجنب المهام المدرسية خوفًا من الفشل.' },
            { id: 38, text: 'انخفاض الدافعية نحو التعلم مقارنة بزملائه.' },
            { id: 39, text: 'سلوك عدائي أو انسحاب اجتماعي مرتبط بالفشل الدراسي.' },
            { id: 40, text: 'شعور متكرر بالإحراج أو تراجع الثقة أثناء المواقف التعليمية.' }
        ],
        interpretation: (score, max) => {
            // Ranges based on user prompt (max 120)
            if (score <= 24) return { level: 'لا توجد دلائل قوية', color: 'text-green-600 bg-green-50', advice: 'السلوك ضمن النطاق الطبيعي. قد توجد مشاكل موضعية بسيطة تحتاج لملاحظة عابرة.' };
            if (score <= 48) return { level: 'دلائل طفيفة/محتملة', color: 'text-yellow-600 bg-yellow-50', advice: 'ينصح بتعديل استراتيجيات التدريس (تقصير التعليمات، توفير وقت إضافي) ودعم المعلم بتقنيات متعددة الحواس.' };
            if (score <= 84) return { level: 'دلائل متوسطة', color: 'text-orange-600 bg-orange-50', advice: 'يوصى بتخطيط تدخلات فردية وجلسات تقوية منظمة، والتواصل مع الولي لمتابعة المنزل.' };
            return { level: 'دلائل شديدة', color: 'text-red-600 bg-red-50', advice: 'إحالة فورية للتقييم النفسي التربوي أو الأخصائي (نطق، طبيب مختص) لاستبعاد العوامل العضوية وتشخيص الحالة بدقة.' };
        }
    },
    {
        id: 'anxiety',
        title: 'مقياس القلق المدرسي',
        description: 'قياس مستوى التوتر والخوف المرتبط بالبيئة المدرسية والامتحانات.',
        targetStages: [EducationStage.MIDDLE, EducationStage.HIGH],
        questions: [
            { id: 1, text: 'يشعر بالغثيان أو ألم بالمعدة قبل الذهاب للمدرسة.' },
            { id: 2, text: 'يخاف بشدة من ارتكاب الأخطاء أمام المعلم.' },
            { id: 3, text: 'يتجنب المشاركة في الأنشطة الاجتماعية المدرسية.' },
            { id: 4, text: 'يعاني من تعرق اليدين أو سرعة دقات القلب عند الامتحانات.' },
            { id: 5, text: 'يجد صعوبة في التركيز بسبب القلق.' },
        ],
        interpretation: (score, max) => {
            const percentage = (score / max) * 100;
            if (percentage < 30) return { level: 'قلق طبيعي', color: 'text-green-600 bg-green-50', advice: 'مستوى قلق طبيعي ودافع للإنجاز.' };
            if (percentage < 60) return { level: 'قلق متوسط', color: 'text-orange-600 bg-orange-50', advice: 'يحتاج الطالب لتعزيز الثقة بالنفس وتدريبه على تقنيات الاسترخاء.' };
            return { level: 'قلق مرتفع', color: 'text-red-600 bg-red-50', advice: 'قد يعاني من رهاب مدرسي أو قلق عام. يتطلب جلسات إرشاد فردية.' };
        }
    }
];

interface ScalesProps {
    students: Student[];
    onSaveResult?: (studentId: string, result: any) => void;
    logoUrl?: string;
}

const Scales: React.FC<ScalesProps> = ({ students, onSaveResult, logoUrl }) => {
    const [activeScale, setActiveScale] = useState<Scale | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [showResult, setShowResult] = useState(false);
    const [showValidation, setShowValidation] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [showToast, setShowToast] = useState(false);
    
    // Refs for scrolling to unanswered questions
    const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

    // Filter scales based on student stage if a student is selected, otherwise show all
    const selectedStudent = students.find(s => s.id === selectedStudentId);

    const handleStartScale = (scale: Scale) => {
        setActiveScale(scale);
        setAnswers({});
        setShowResult(false);
        setShowValidation(false);
        setIsSaved(false);
        // Don't clear student ID if already selected
    };

    const handleAnswer = (questionId: number, value: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleShowResult = () => {
        if (!activeScale) return;
        
        const answeredCount = Object.keys(answers).length;
        const totalCount = activeScale.questions.length;

        if (answeredCount < totalCount) {
            setShowValidation(true);
            // Find first unanswered question
            const firstUnanswered = activeScale.questions.find(q => answers[q.id] === undefined);
            if (firstUnanswered && questionRefs.current[firstUnanswered.id]) {
                questionRefs.current[firstUnanswered.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setShowResult(true);
    };

    const calculateResult = () => {
        if (!activeScale) return null;
        // Explicitly cast to number array to resolve arithmetic operation type error
        const totalScore = (Object.values(answers) as number[]).reduce((a, b) => a + b, 0);
        
        // Dynamic max score calculation based on options
        const currentOptions = activeScale.options || DEFAULT_OPTIONS;
        const maxOptionVal = Math.max(...currentOptions.map(o => o.val));
        const maxScore = activeScale.questions.length * maxOptionVal;

        return {
            score: totalScore,
            max: maxScore,
            details: activeScale.interpretation(totalScore, maxScore)
        };
    };

    const handleSave = () => {
        const result = calculateResult();
        if (result && selectedStudentId && activeScale && onSaveResult) {
            onSaveResult(selectedStudentId, {
                scaleId: activeScale.id,
                scaleTitle: activeScale.title,
                date: new Date().toISOString(),
                score: result.score,
                maxScore: result.max,
                resultLevel: result.details.level,
                advice: result.details.advice
            });
            setIsSaved(true);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    const handlePrintResult = () => {
        const result = calculateResult();
        if (!result || !selectedStudent || !activeScale) return;

        // Determine color for print based on the class logic
        let colorHex = '#374151'; // default
        const colorClass = result.details.color;
        if (colorClass.includes('green')) colorHex = '#16a34a';
        else if (colorClass.includes('blue')) colorHex = '#2563eb';
        else if (colorClass.includes('orange')) colorHex = '#ea580c';
        else if (colorClass.includes('red')) colorHex = '#dc2626';
        else if (colorClass.includes('yellow')) colorHex = '#ca8a04';

        const logoHtml = logoUrl ? `<img src="${logoUrl}" style="max-height: 50px;" />` : '<div class="logo">تقويم</div>';

        const printContent = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>نتيجة مقياس - ${selectedStudent.name}</title>
                <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Tajawal', sans-serif; padding: 40px; color: #1f2937; }
                    .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                    .logo { font-size: 24px; font-weight: 800; color: #0284c7; }
                    .report-title { font-size: 18px; color: #6b7280; }
                    .student-card { background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e5e7eb; display: flex; align-items: center; gap: 20px; }
                    .student-info h2 { margin: 0; font-size: 20px; color: #111827; }
                    .student-info p { margin: 5px 0 0; color: #6b7280; }
                    .result-container { text-align: center; margin: 40px 0; padding: 40px; border: 1px solid #e5e7eb; border-radius: 16px; }
                    .score-circle { width: 120px; height: 120px; border-radius: 50%; border: 6px solid ${colorHex}; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto 20px; }
                    .score-text { font-size: 32px; font-weight: bold; color: ${colorHex}; }
                    .score-sub { font-size: 12px; color: #9ca3af; }
                    .level { font-size: 28px; font-weight: bold; color: ${colorHex}; margin-bottom: 10px; }
                    .advice-box { background-color: #f3f4f6; border-right: 4px solid ${colorHex}; padding: 20px; text-align: right; margin-top: 30px; border-radius: 8px; }
                    .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    ${logoHtml}
                    <div class="report-title">تقرير قياس تربوي / نفسي</div>
                    <div>${new Date().toLocaleDateString('ar-EG-u-nu-latn')}</div>
                </div>

                <div class="student-card">
                    <div class="student-info">
                        <h2>${selectedStudent.name}</h2>
                        <p>${selectedStudent.grade}</p>
                        <p><strong>المقياس:</strong> ${activeScale.title}</p>
                    </div>
                </div>

                <div class="result-container">
                    <div class="score-circle">
                        <div class="score-text">${Math.round((result.score / result.max) * 100)}%</div>
                        <div class="score-sub">${result.score} من ${result.max}</div>
                    </div>
                    
                    <div class="level">${result.details.level}</div>
                    
                    <div class="advice-box">
                        <strong>التوجيه التربوي:</strong><br>
                        ${result.details.advice}
                    </div>
                </div>

                <div class="footer">
                    تم إجراء هذا التقييم عبر منصة "تقويم". النتائج أولية وتستخدم للتوجيه التربوي فقط.
                </div>

                <script>
                    window.onload = function() { window.print(); }
                ` + `<` + `/script>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
        }
    };

    const reset = () => {
        setActiveScale(null);
        setAnswers({});
        setShowResult(false);
        setShowValidation(false);
        setSelectedStudentId('');
        setIsSaved(false);
    };

    // Responsive grid columns based on number of options
    const getGridCols = (count: number) => {
        if (count >= 5) return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5';
        if (count === 4) return 'grid-cols-2 md:grid-cols-4';
        return 'grid-cols-2';
    };

    // Step 1: Select Scale
    if (!activeScale) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">المقاييس التربوية والنفسية</h1>
                    <p className="text-gray-500 mt-1">أدوات تقييم معيارية للكشف عن المشكلات السلوكية والنفسية.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {SCALES_DATA.map(scale => (
                        <div key={scale.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col h-full">
                            <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-4">
                                <ClipboardCheck size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{scale.title}</h3>
                            <p className="text-sm text-gray-500 mb-4 flex-1">{scale.description}</p>
                            
                            <div className="flex gap-2 mb-6 flex-wrap">
                                {scale.targetStages.map(stage => (
                                    <span key={stage} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                                        {stage === EducationStage.ELEMENTARY ? 'ابتدائي' : stage === EducationStage.MIDDLE ? 'متوسط' : 'ثانوي'}
                                    </span>
                                ))}
                            </div>

                            <button 
                                onClick={() => handleStartScale(scale)}
                                className="w-full py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                            >
                                بدء المقياس <ArrowRight size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Step 2: Select Student (if not selected)
    if (!selectedStudentId) {
        return (
            <div className="max-w-xl mx-auto mt-10 animate-fade-in">
                <button onClick={() => setActiveScale(null)} className="text-gray-500 hover:text-gray-900 mb-6 flex items-center gap-1">
                    <ChevronLeft size={20} /> العودة للمقاييس
                </button>
                
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Brain size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{activeScale.title}</h2>
                    <p className="text-gray-500 mb-8">الرجاء اختيار التلميذ المراد تقييمه لبدء الاستبيان.</p>

                    <div className="space-y-4 text-right">
                        <label className="block text-sm font-medium text-gray-700">اختر التلميذ</label>
                        <select 
                            className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            value={selectedStudentId}
                        >
                            <option value="">-- اختر التلميذ --</option>
                            {students
                                .map(student => (
                                <option key={student.id} value={student.id}>
                                    {student.name} ({student.grade})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-400">يتم عرض جميع التلاميذ، لكن يفضل الالتزام بالمرحلة العمرية المناسبة للمقياس.</p>
                    </div>
                </div>
            </div>
        );
    }

    // Result View
    if (showResult) {
        const result = calculateResult();
        if (!result) return null;

        return (
            <div className="max-w-2xl mx-auto mt-6 animate-fade-in relative">
                 <button onClick={reset} className="text-gray-500 hover:text-gray-900 mb-6 flex items-center gap-1">
                    <ChevronLeft size={20} /> العودة للقائمة الرئيسية
                </button>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 p-6 border-b border-gray-100 flex items-center gap-4">
                        <img src={selectedStudent?.avatarUrl} alt="" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                        <div>
                            <h2 className="font-bold text-gray-900 text-lg">نتيجة التقييم: {selectedStudent?.name}</h2>
                            <p className="text-sm text-gray-500">{activeScale.title}</p>
                        </div>
                    </div>

                    <div className="p-8 text-center">
                        <div className={`inline-flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 mb-6 ${result.details.color.replace('text-', 'border-').replace('bg-', '')} bg-white`}>
                            <span className={`text-3xl font-bold ${result.details.color.split(' ')[0]}`}>{Math.round((result.score / result.max) * 100)}%</span>
                            <span className="text-xs text-gray-400">الدرجة {result.score} من {result.max}</span>
                        </div>
                        
                        <h3 className={`text-2xl font-bold mb-2 ${result.details.color.split(' ')[0]}`}>
                            {result.details.level}
                        </h3>
                        
                        <div className={`p-4 rounded-xl mb-8 text-right ${result.details.color} bg-opacity-10`}>
                            <p className="font-medium flex items-start gap-2">
                                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                التوجيه التربوي:
                            </p>
                            <p className="mt-1 opacity-90 pr-7">{result.details.advice}</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleSave} 
                                disabled={isSaved}
                                className={`w-full py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${isSaved ? 'bg-green-100 text-green-700' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
                            >
                                {isSaved ? (
                                    <><CheckCircle2 size={20} /> تم الحفظ في الملف</>
                                ) : (
                                    <>حفظ النتيجة في ملف التلميذ</>
                                )}
                            </button>
                            <div className="flex gap-3">
                                <button onClick={reset} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                                    إغلاق
                                </button>
                                <button onClick={handlePrintResult} className="flex-1 py-3 bg-white border-2 border-primary-100 text-primary-600 rounded-xl font-bold hover:bg-primary-50 transition-colors">
                                    طباعة النتيجة
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toast Notification */}
                {showToast && (
                    <div className="fixed bottom-6 left-6 z-50 bg-gray-900 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all transform hover:scale-105 animate-fade-in">
                        <div className="bg-green-500 rounded-full p-1.5">
                            <CheckCircle2 size={16} strokeWidth={3} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">تم الحفظ بنجاح</p>
                            <p className="text-xs text-gray-400">تمت إضافة النتيجة إلى ملف التلميذ</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const currentOptions = activeScale.options || DEFAULT_OPTIONS;
    const answeredCount = Object.keys(answers).length;
    const totalCount = activeScale.questions.length;
    // Explicit casting to Number to ensure arithmetic operation is valid
    const progress = (Number(answeredCount) / Number(totalCount)) * 100;

    // Questionnaire View
    return (
        <div className="max-w-4xl mx-auto mt-6 animate-fade-in pb-20">
             <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <button onClick={() => setSelectedStudentId('')} className="text-gray-500 hover:text-gray-900 flex items-center gap-1">
                    <ChevronLeft size={20} /> تغيير التلميذ
                </button>
                
                {/* Progress Bar */}
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm w-full md:w-auto">
                    <div className="w-full md:w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-sm font-bold text-gray-700 whitespace-nowrap">
                        {answeredCount} / {totalCount}
                    </span>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="mb-8 border-b border-gray-100 pb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{activeScale.title}</h2>
                    <p className="text-gray-500">
                        التلميذ: <span className="font-bold text-primary-600">{selectedStudent?.name}</span>
                    </p>
                </div>

                <div className="space-y-8">
                    {activeScale.questions.map((q, idx) => {
                        const isUnanswered = showValidation && answers[q.id] === undefined;
                        return (
                            <div 
                                key={q.id} 
                                ref={(el) => { questionRefs.current[q.id] = el; }}
                                className={`animate-fade-in rounded-xl p-4 transition-colors ${isUnanswered ? 'bg-red-50 border border-red-200' : ''}`}
                                style={{ animationDelay: `${Math.min(idx * 20, 500)}ms` }}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <p className={`font-medium text-lg ${isUnanswered ? 'text-red-700' : 'text-gray-800'}`}>
                                        <span className="text-gray-300 ml-2 text-sm">{idx + 1}.</span> {q.text}
                                    </p>
                                    {isUnanswered && (
                                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-md flex items-center gap-1 font-bold shrink-0">
                                            <AlertTriangle size={12} /> مطلوب
                                        </span>
                                    )}
                                </div>
                                <div className={`grid gap-3 ${getGridCols(currentOptions.length)}`}>
                                    {currentOptions.map((option) => (
                                        <label 
                                            key={option.val}
                                            className={`
                                                cursor-pointer p-3 rounded-lg border text-center transition-all flex flex-col justify-center items-center h-full min-h-[60px] relative overflow-hidden
                                                ${answers[q.id] === option.val 
                                                    ? 'bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500' 
                                                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'}
                                            `}
                                        >
                                            <input 
                                                type="radio" 
                                                name={`q_${q.id}`} 
                                                value={option.val}
                                                checked={answers[q.id] === option.val}
                                                onChange={() => handleAnswer(q.id, option.val)}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                            <span className="font-bold text-sm md:text-base block relative z-10">{option.label}</span>
                                            {activeScale.options && <span className="text-xs text-gray-400 mt-1 relative z-10">({option.val})</span>}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-10 pt-6 border-t border-gray-100 sticky bottom-0 bg-white/95 backdrop-blur py-4 flex flex-col items-end">
                    {showValidation && answeredCount < totalCount && (
                        <p className="text-red-600 text-sm mb-3 font-medium flex items-center gap-2">
                            <AlertCircle size={16} />
                            يرجى الإجابة على جميع الأسئلة المتبقية ({totalCount - answeredCount}) لعرض النتيجة.
                        </p>
                    )}
                    <button 
                        onClick={handleShowResult}
                        className={`
                            bg-primary-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30 flex items-center gap-2
                            ${answeredCount < totalCount ? 'opacity-90' : ''}
                        `}
                    >
                        {answeredCount < totalCount ? (
                            <>استكمال الأسئلة ({answeredCount}/{totalCount})</>
                        ) : (
                            <><CheckCircle2 size={20} /> عرض النتيجة</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Scales;