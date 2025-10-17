import { Platform, Dimensions } from 'react-native';
import type { DeviceInfo } from '../types';

/**
 * Collects device information for React Native applications
 * This information is sent with API requests for analytics and security purposes
 */
export const getDeviceInfo = (): DeviceInfo => {
  const { width, height } = Dimensions.get('window');
  const screenDimensions = Dimensions.get('screen');

  const deviceInfo: DeviceInfo = {
    // Platform information
    platform: Platform.OS,
    uaPlatform: Platform.OS,
    
    // Screen dimensions
    screenWidth: screenDimensions.width,
    screenHeight: screenDimensions.height,
    innerWidth: width,
    innerHeight: height,
    
    // Device capabilities
    uaMobile: Platform.OS === 'ios' || Platform.OS === 'android',
  };

  // Add platform version if available
  if (Platform.Version) {
    deviceInfo.uaPlatformVersion = String(Platform.Version);
  }

  // Add pixel ratio if available
  const pixelRatio = Dimensions.get('window').scale;
  if (pixelRatio) {
    deviceInfo.devicePixelRatio = pixelRatio;
  }

  return deviceInfo;
};
