
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, Settings, Menu, X, 
  Home, PieChart, Activity, 
  GraduationCap, School, Smile,
  ClipboardList, BarChart3, BookOpen,
  ClipboardCheck, Stethoscope, Brain, ListChecks,
  TableProperties, MessageSquare, MessagesSquare, MessageCircle, UserCog,
  Cog, Sliders, Wrench, FolderOpen, Briefcase, FileStack, Files,
  CalendarDays, CalendarRange, Clock
} from 'lucide-react';
import { styles } from './Layout.styles';

interface LayoutProps {
  children: React.ReactNode;
  counselorName?: string;
  counselorRole?: string;
  logoUrl?: string;
}

// Define available icons for each navigation item
const ICON_OPTIONS: Record<string, { id: string; Icon: React.ElementType }[]> = {
  dashboard: [
    { id: 'LayoutDashboard', Icon: LayoutDashboard },
    { id: 'Home', Icon: Home },
    { id: 'PieChart', Icon: PieChart },
    { id: 'Activity', Icon: Activity },
  ],
  students: [
    { id: 'Users', Icon: Users },
    { id: 'GraduationCap', Icon: GraduationCap },
    { id: 'School', Icon: School },
    { id: 'Smile', Icon: Smile },
  ],
  interviews: [
    { id: 'MessageSquare', Icon: MessageSquare },
    { id: 'MessagesSquare', Icon: MessagesSquare },
    { id: 'UserCog', Icon: UserCog },
    { id: 'MessageCircle', Icon: MessageCircle },
  ],
  academic: [
    { id: 'BookOpen', Icon: BookOpen },
    { id: 'TableProperties', Icon: TableProperties },
    { id: 'GraduationCap', Icon: GraduationCap },
  ],
  reports: [
    { id: 'FileText', Icon: FileText },
    { id: 'ClipboardList', Icon: ClipboardList },
    { id: 'BarChart3', Icon: BarChart3 },
    { id: 'BookOpen', Icon: BookOpen },
  ],
  scales: [
    { id: 'ClipboardCheck', Icon: ClipboardCheck },
    { id: 'Stethoscope', Icon: Stethoscope },
    { id: 'Brain', Icon: Brain },
    { id: 'ListChecks', Icon: ListChecks },
  ],
  documents: [
    { id: 'FolderOpen', Icon: FolderOpen },
    { id: 'Briefcase', Icon: Briefcase },
    { id: 'FileStack', Icon: FileStack },
    { id: 'Files', Icon: Files },
  ],
  schedule: [
    { id: 'CalendarDays', Icon: CalendarDays },
    { id: 'CalendarRange', Icon: CalendarRange },
    { id: 'Clock', Icon: Clock },
  ],
  settings: [
    { id: 'Settings', Icon: Settings },
    { id: 'Cog', Icon: Cog },
    { id: 'Sliders', Icon: Sliders },
    { id: 'Wrench', Icon: Wrench },
  ]
};

const Layout: React.FC<LayoutProps> = ({ children, counselorName, counselorRole, logoUrl }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const location = useLocation();

  // Load icon preferences from localStorage or use defaults
  const [iconPrefs, setIconPrefs] = useState<Record<string, string>>(() => {
    const defaults = {
        dashboard: 'LayoutDashboard',
        students: 'Users',
        interviews: 'MessageSquare',
        academic: 'BookOpen',
        reports: 'FileText',
        scales: 'ClipboardCheck',
        documents: 'FolderOpen',
        schedule: 'CalendarDays',
        settings: 'Settings'
    };
    try {
      const saved = localStorage.getItem('nav_icon_prefs');
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  });

  const handleIconChange = (key: string, iconId: string) => {
    const newPrefs = { ...iconPrefs, [key]: iconId };
    setIconPrefs(newPrefs);
    localStorage.setItem('nav_icon_prefs', JSON.stringify(newPrefs));
  };

  const getIcon = (key: string) => {
    const prefId = iconPrefs[key];
    const option = ICON_OPTIONS[key]?.find(opt => opt.id === prefId);
    return option ? option.Icon : ICON_OPTIONS[key]?.[0].Icon || ClipboardCheck;
  };

  const navigation = [
    { name: 'لوحة القيادة', href: '/', icon: getIcon('dashboard'), key: 'dashboard' },
    { name: 'الطلاب', href: '/students', icon: getIcon('students'), key: 'students' },
    { name: 'المقابلات', href: '/interviews', icon: getIcon('interviews'), key: 'interviews' },
    { name: 'النتائج المدرسية', href: '/academic', icon: getIcon('academic'), key: 'academic' },
    { name: 'المقاييس النفسية', href: '/scales', icon: getIcon('scales'), key: 'scales' },
    // Removed Weekly Schedule from Sidebar
    { name: 'وثائق العمل', href: '/documents', icon: getIcon('documents'), key: 'documents' },
    { name: 'التقارير', href: '/reports', icon: getIcon('reports'), key: 'reports' },
    { name: 'الإعدادات', href: '/settings', icon: getIcon('settings'), key: 'settings' },
  ];

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <div className={styles.layout}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className={styles.mobileOverlay}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={styles.sidebar(isSidebarOpen)}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoContainer}>
            {logoUrl ? (
                <img src={logoUrl} alt="Logo" className={styles.logoImage} />
            ) : (
                <div className={styles.logoIconBox}>
                  <span className={styles.logoIconText}>ت</span>
                </div>
            )}
            {!logoUrl && <span className={styles.brandName}>تقويم</span>}
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className={styles.closeMenuButton}>
            <X size={24} />
          </button>
        </div>

        <nav className={styles.navContainer}>
          {navigation.map((item) => (
            <Link
              key={item.key}
              to={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className={styles.navItem(isActive(item.href))}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          ))}
          
          <button
            onClick={() => { setIsSettingsOpen(true); setIsSidebarOpen(false); }}
            className={styles.customizeButton}
          >
            <Sliders size={20} />
            <span>تخصيص القائمة</span>
          </button>
        </nav>
        
        <div className={styles.userProfileContainer}>
            <div className={styles.userProfileContent}>
                <img src="https://picsum.photos/40/40?random=user" alt="User" className={styles.userAvatar} />
                <div>
                    <p className={styles.userProfileText}>{counselorName || 'مستشار التوجيه'}</p>
                    <p className={styles.userProfileRole}>{counselorRole || 'مرشد طلابي'}</p>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Mobile Header */}
        <header className={styles.mobileHeader}>
          <div className={styles.mobileHeaderLogoGroup}>
             {logoUrl ? (
                <img src={logoUrl} alt="Logo" className={styles.mobileLogoImage} />
             ) : (
                <>
                <div className={styles.mobileLogoIconBox}>
                    <span className={styles.mobileLogoIconText}>ت</span>
                </div>
                <span className={styles.mobileBrandName}>تقويم</span>
                </>
             )}
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className={styles.mobileMenuButton}>
            <Menu size={24} />
          </button>
        </header>

        <div className={styles.contentArea}>
          {children}
        </div>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Sliders size={20} className="text-primary-600" />
                تخصيص أيقونات القائمة
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className={styles.modalCloseButton}>
                <X size={24} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.modalSection}>
                {Object.entries(ICON_OPTIONS).map(([key, options]) => (
                  <div key={key} className="space-y-2">
                    <label className={styles.modalLabel}>
                      {key === 'dashboard' ? 'لوحة القيادة' : 
                       key === 'students' ? 'الطلاب' : 
                       key === 'interviews' ? 'المقابلات' :
                       key === 'academic' ? 'النتائج المدرسية' :
                       key === 'scales' ? 'المقاييس النفسية' : 
                       key === 'schedule' ? 'البرمجة الأسبوعية' :
                       key === 'documents' ? 'وثائق العمل' :
                       key === 'settings' ? 'الإعدادات' : 'التقارير'}
                    </label>
                    <div className={styles.iconGrid}>
                      {options.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleIconChange(key, option.id)}
                          className={styles.iconButton(iconPrefs[key] === option.id)}
                          title={option.id}
                        >
                          <option.Icon size={24} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className={styles.modalActionBtn}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
