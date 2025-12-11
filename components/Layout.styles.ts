
export const styles = {
  layout: "min-h-screen bg-gray-50 flex",
  mobileOverlay: "fixed inset-0 bg-black/50 z-40 lg:hidden",
  sidebar: (isOpen: boolean) => `
    fixed lg:static inset-y-0 right-0 z-50 w-64 bg-white border-l border-gray-200 
    transform transition-transform duration-200 ease-in-out flex flex-col
    ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
  `,
  sidebarHeader: "h-20 flex items-center justify-between px-6 border-b border-gray-100 shrink-0",
  logoContainer: "flex items-center gap-3",
  logoImage: "h-10 w-auto object-contain max-w-[120px]",
  logoIconBox: "w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center shrink-0",
  logoIconText: "text-white font-bold text-xl",
  brandName: "text-xl font-bold text-gray-800",
  closeMenuButton: "lg:hidden text-gray-500",
  
  navContainer: "p-4 space-y-1 flex-1 overflow-y-auto",
  navItem: (isActive: boolean) => `
    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
    ${isActive 
      ? 'bg-primary-50 text-primary-700 font-medium' 
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
  `,
  customizeButton: "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900 mt-4 border-t border-gray-100 pt-4",
  
  userProfileContainer: "p-4 border-t border-gray-100 shrink-0",
  userProfileContent: "flex items-center gap-3",
  userAvatar: "w-10 h-10 rounded-full bg-gray-200",
  userProfileText: "text-sm font-medium text-gray-900",
  userProfileRole: "text-xs text-gray-500",

  mainContent: "flex-1 flex flex-col min-w-0 overflow-hidden",
  mobileHeader: "lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between shrink-0",
  mobileHeaderLogoGroup: "flex items-center gap-2",
  mobileLogoImage: "h-8 w-auto object-contain",
  mobileLogoIconBox: "w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center",
  mobileLogoIconText: "text-white font-bold text-xl",
  mobileBrandName: "text-xl font-bold text-gray-800",
  mobileMenuButton: "text-gray-600 p-2",
  
  contentArea: "flex-1 overflow-auto p-4 sm:p-6 lg:p-8",

  // Settings Modal Styles
  modalOverlay: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4",
  modalContainer: "bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto",
  modalHeader: "flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 sticky top-0 bg-white z-10",
  modalTitle: "text-lg font-bold text-gray-900 flex items-center gap-2",
  modalCloseButton: "text-gray-400 hover:text-gray-600 transition-colors",
  modalBody: "p-6 space-y-6",
  modalSection: "space-y-4",
  modalLabel: "block text-sm font-medium text-gray-700",
  iconGrid: "flex flex-wrap gap-3",
  iconButton: (isSelected: boolean) => `
    w-12 h-12 rounded-xl flex items-center justify-center transition-all border
    ${isSelected 
      ? 'bg-primary-50 border-primary-500 text-primary-600 ring-2 ring-primary-200' 
      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'}
  `,
  modalFooter: "p-6 border-t border-gray-100 bg-gray-50 flex justify-end sticky bottom-0",
  modalActionBtn: "bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition-colors",
};
