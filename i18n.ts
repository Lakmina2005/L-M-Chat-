import type { SectionId, UILang } from "./types";

export const NAV_LABELS: Record<SectionId, { en: string; si: string }> = {
  home: { en: "Home", si: "මුල් පිටුව" },
  "app-settings": { en: "App Settings", si: "ඇප් සැකසුම්" },
  "app-design": { en: "App Design", si: "ඇප් නිර්මාණය" },
  "splash-screen": { en: "Splash Screen", si: "Splash තිරය" },
  "status-bar": { en: "Status Bar", si: "Status තීරුව" },
  "bottom-nav": { en: "Bottom Navigation", si: "පහළ Navigation" },
  files: { en: "Files", si: "ගොනු (Files)" },
  "html-editor": { en: "HTML Editor", si: "HTML සංස්කාරකය" },
  "css-editor": { en: "CSS Editor", si: "CSS සංස්කාරකය" },
  "js-editor": { en: "JavaScript Editor", si: "JS සංස්කාරකය" },
  "python-backend": { en: "Python / Backend", si: "Python / Backend" },
  "external-links": { en: "External Links", si: "බාහිර සබැඳි" },
  preview: { en: "Preview", si: "පෙරදසුන (Preview)" },
  console: { en: "Console", si: "Console ලොග්" },
  "error-fixer": { en: "Error Fixer", si: "දෝෂ නිවැරදි කරන්න" },
  export: { en: "Export", si: "Export කරන්න" },
  "apk-build": { en: "APK Build", si: "APK සාදන්න" },
  projects: { en: "Project Save / Load", si: "ව්‍යාපෘති Save / Load" },
};

export const UI_COPY: Record<
  UILang,
  {
    subtitle: string;
    createApp: string;
    previewBtn: string;
    checkCode: string;
    fixErrors: string;
    exportProject: string;
    generateAndroid: string;
    downloadZip: string;
    saved: string;
    saving: string;
    runCode: string;
    simStatusNotice: string;
    browserApkNotice: string;
  }
> = {
  en: {
    subtitle: "HTML to Android Capacitor Project & Web App Studio",
    createApp: "Create App",
    previewBtn: "Preview",
    checkCode: "Check Code",
    fixErrors: "Fix Errors",
    exportProject: "Export Project",
    generateAndroid: "Generate Android Project",
    downloadZip: "Download ZIP",
    saved: "Saved",
    saving: "Saving...",
    runCode: "Run",
    simStatusNotice:
      "Browser preview shows a simulated Status Bar. Native Android builds configure real status bar colors via styles.xml and MainActivity.java.",
    browserApkNotice:
      "Web browsers cannot directly compile native Android .apk binaries because Gradle and the Android SDK do not run inside a browser. Generate and download the complete Android Capacitor Project ZIP below, then build your APK in Android Studio or via Gradle.",
  },
  si: {
    subtitle: "HTML සිට Android Capacitor APK ව්‍යාපෘති නිර්මාපකය",
    createApp: "ඇප් එක සාදන්න",
    previewBtn: "පෙරදසුන",
    checkCode: "කේතය පරීක්ෂා කරන්න",
    fixErrors: "දෝෂ නිවැරදි කරන්න",
    exportProject: "ව්‍යාපෘතිය Export",
    generateAndroid: "Android ව්‍යාපෘතිය සාදන්න",
    downloadZip: "ZIP බාගන්න",
    saved: "සුරැකුණි",
    saving: "සුරකිමින්...",
    runCode: "ධාවනය කරන්න (Run)",
    simStatusNotice:
      "Browser පෙරදසුනේ පෙන්වන්නේ අනුකරණය කළ (Simulated) Status Bar එකක් පමණි. සැබෑ APK එකේදී styles.xml සහ MainActivity.java හරහා native status bar එක පාලනය වේ.",
    browserApkNotice:
      "Browser එකක් තුළ Gradle සහ Android SDK නොමැති නිසා browser එකෙන් කෙලින්ම .apk ගොනුව compile කළ නොහැක. පහතින් සම්පූර්ණ Android Capacitor Project ZIP ගොනුව සාදා download කර, Android Studio හෝ Gradle මගින් APK එක build කරගන්න.",
  },
};
