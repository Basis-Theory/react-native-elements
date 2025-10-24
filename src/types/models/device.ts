interface NetworkInformation {
  downlink: number;
  downlinkMax?: number;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  rtt: number;
  saveData: boolean;
  type?:
    | 'bluetooth'
    | 'cellular'
    | 'ethernet'
    | 'none'
    | 'wifi'
    | 'wimax'
    | 'other'
    | 'unknown';
}

export type DeviceInfo = {
  uaBrands?: Array<{ brand: string; version: string }>;
  uaMobile?: boolean;
  uaPlatform?: string;
  uaPlatformVersion?: string;
  languages?: string[];
  timeZone?: string;
  cookiesEnabled?: boolean;
  localStorageEnabled?: boolean;
  sessionStorageEnabled?: boolean;
  platform?: string;
  hardwareConcurrency?: number;
  deviceMemoryGb?: number | null;
  screenWidth?: number;
  screenHeight?: number;
  screenAvailWidth?: number;
  screenAvailHeight?: number;
  innerWidth?: number;
  innerHeight?: number;
  devicePixelRatio?: number;
  maxTouchPoints?: number;
  plugins?: string[];
  mimeTypes?: string[];
  webdriver?: boolean;
  suspectedHeadless?: boolean;
  webglVendor?: string;
  webglRenderer?: string;
  canvasHash?: string;
  network?: NetworkInformation;
};
