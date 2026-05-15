import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.halalscan.app',
  appName: 'HalalScan',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
