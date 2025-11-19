import { PermissionsAndroid, Platform, Linking } from 'react-native';
import { searchCandidate } from './api';

export class CallDetectionService {
  private static instance: CallDetectionService;
  private permissionsGranted: boolean = false;

  private constructor() {}

  public static getInstance(): CallDetectionService {
    if (!CallDetectionService.instance) {
      CallDetectionService.instance = new CallDetectionService();
    }
    return CallDetectionService.instance;
  }

  // 권한 요청
  public async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.log('Not Android platform');
      return false;
    }

    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      ];

      console.log('Requesting permissions:', permissions);

      const granted = await PermissionsAndroid.requestMultiple(permissions);

      console.log('Permission results:', granted);

      const allGranted = Object.values(granted).every(
        status => status === PermissionsAndroid.RESULTS.GRANTED
      );

      this.permissionsGranted = allGranted;

      return allGranted;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  // 오버레이 권한 요청 (다른 앱 위에 표시)
  public async requestOverlayPermission(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      // Android Settings로 이동
      await Linking.openSettings();
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  }

  // 후보자 정보 검색
  public async handleIncomingCall(phoneNumber: string) {
    try {
      console.log('Searching candidate for:', phoneNumber);
      const candidate = await searchCandidate(phoneNumber);
      console.log('Candidate found:', candidate);
      return candidate;
    } catch (error) {
      console.error('Error searching candidate:', error);
      return null;
    }
  }

  // 권한 상태 확인
  public hasPermissions(): boolean {
    return this.permissionsGranted;
  }
}

export default CallDetectionService.getInstance();
