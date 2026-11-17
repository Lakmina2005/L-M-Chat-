export type UILang = "en" | "si";
export type ThemeMode = "dark" | "light";

export type SectionId =
  | "home"
  | "app-settings"
  | "app-design"
  | "splash-screen"
  | "status-bar"
  | "bottom-nav"
  | "files"
  | "html-editor"
  | "css-editor"
  | "js-editor"
  | "python-backend"
  | "external-links"
  | "preview"
  | "console"
  | "error-fixer"
  | "export"
  | "apk-build"
  | "projects";

export type EditorTab = "html" | "css" | "js" | "python" | "json";

export type DeviceType =
  | "android-phone"
  | "small-phone"
  | "large-phone"
  | "tablet"
  | "iphone";

export type PreviewSizeMode = "mobile" | "tablet" | "desktop" | "custom";

export interface AppSettings {
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  description: string;
  developerName: string;
  themeColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  language: string;
  orientation: "portrait" | "landscape" | "auto";
  showAppHeader?: boolean;
}

export interface AppNameStyle {
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  letterSpacing: number;
  textShadow: string;
  gradientEnabled: boolean;
  gradientFrom: string;
  gradientTo: string;
  textColor: string;
  animation: "none" | "pulse" | "glow" | "slide" | "float";
  position: "header" | "center" | "top";
  alignment: "left" | "center" | "right";
}

export interface SplashVideoSettings {
  enabled: boolean;
  sourceType: "none" | "local" | "web" | "gdrive";
  url: string;
  localFileName: string;
  localDataUrl: string;
  localSizeBytes: number;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  objectFit: "cover" | "contain" | "fill";
  durationSec: number;
  cropZoom: number;
  position: "center" | "top" | "bottom";
}

export interface SplashSettings {
  enabled: boolean;
  durationMs: number;
  showIcon: boolean;
  iconSize: number;
  showName: boolean;
  nameSize: number;
  subtitle: string;
  position: "center" | "top" | "bottom";
  backgroundMode: "solid" | "gradient";
  backgroundColor: string;
  gradientFrom: string;
  gradientTo: string;
  textColor: string;
  animation: "fade-in" | "fade-out" | "zoom" | "slide" | "pulse";
  loadingAnimation: "spinner" | "dots" | "bar" | "none";
  video: SplashVideoSettings;
}

export interface StatusBarSettings {
  visible: boolean;
  backgroundColor: string;
  iconStyle: "light" | "dark";
  transparent: boolean;
  showTime: boolean;
  showBattery: boolean;
  showNetwork: boolean;
}

export type BottomNavAction =
  | "open-page"
  | "open-url"
  | "go-back"
  | "go-home"
  | "js-action";

export interface BottomNavItem {
  id: string;
  label: string;
  icon: string;
  action: BottomNavAction;
  target: string;
}

export interface BottomNavSettings {
  enabled: boolean;
  backgroundColor: string;
  textColor: string;
  activeColor: string;
  position: "bottom" | "floating";
  items: BottomNavItem[];
}

export interface ProjectFile {
  id: string;
  name: string;
  path: string; // e.g. "www/index.html", "www/assets/logo.png", "backend/app.py"
  folder: "www" | "www/assets" | "backend";
  mimeType: string;
  size: number;
  isBinary: boolean;
  content: string; // text or DataURL for binary
  updatedAt: number;
}

export type LinkOpenMode =
  | "in-app"
  | "external-browser"
  | "new-tab"
  | "fullscreen-webview";

export interface ExternalLinkItem {
  id: string;
  title: string;
  url: string;
  mode: LinkOpenMode;
}

export interface PreviewSettings {
  device: DeviceType;
  sizeMode: PreviewSizeMode;
  customWidth: number;
  customHeight: number;
}

export interface AppProject {
  id: string;
  projectName: string;
  createdAt: number;
  updatedAt: number;
  iconDataUrl: string;
  appSettings: AppSettings;
  nameStyle: AppNameStyle;
  splash: SplashSettings;
  statusBar: StatusBarSettings;
  bottomNav: BottomNavSettings;
  code: {
    html: string;
    css: string;
    js: string;
    python: string;
    json: string;
  };
  files: ProjectFile[];
  externalLinks: ExternalLinkItem[];
  preview: PreviewSettings;
}

export interface ConsoleEntry {
  id: string;
  level: "log" | "info" | "warn" | "error";
  message: string;
  timestamp: string;
  source?: string;
}

export interface CodeIssue {
  id: string;
  severity: "ERROR" | "WARNING" | "INFO";
  file: EditorTab;
  fileName: string;
  line: number;
  message: string;
  snippet: string;
}

export interface AiFixResult {
  explanation: string;
  fixedCode: string;
  whatChanged: string;
  usedFallback?: boolean;
}

export interface ApkBuildConfig {
  buildType: "debug" | "release";
  minSdk: number;
  targetSdk: number;
  keystoreAlias: string;
  keystorePath: string;
  cloudBuildUrl: string;
}
