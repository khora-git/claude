import { NativeModules, NativeEventEmitter, PermissionsAndroid, Platform } from 'react-native';
import { searchCandidate } from './api';

const { CallDetectionModule } = NativeModules;

export class CallDetectionService {
  private static instance: CallDetectionService;
  private eventEmitter: NativeEventEmitter | null = null;
  private listeners: any[] = [];
  private permissionsGranted: boolean = false;

  private constructor() {
    if (CallDetectionModule) {
      this.eventEmitter = new NativeEventEmitter(CallDetectionModule);
    }
  }

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

  // Call Screening 역할 요청 (Android 10+)
  public async requestScreeningRole(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    if (!CallDetectionModule) {
      console.error('CallDetectionModule not available');
      return false;
    }

    try {
      await CallDetectionModule.requestScreeningRole();
      return true;
    } catch (error) {
      console.error('Error requesting screening role:', error);
      return false;
    }
  }

  // 전화 감지 시작
  public async startListening(onIncomingCall: (phoneNumber: string) => void): Promise<boolean> {
    if (!this.eventEmitter || !CallDetectionModule) {
      console.warn('CallDetection module not available');
      return false;
    }

    try {
      // 네이티브 모듈에 시작 요청
      await CallDetectionModule.startListening();

      // 이벤트 리스너 등록
      const listener = this.eventEmitter.addListener(
        'PhoneCallIncoming',
        (data: { phoneNumber: string }) => {
          console.log('Incoming call from:', data.phoneNumber);
          if (data.phoneNumber) {
            onIncomingCall(data.phoneNumber);
          }
        }
      );

      this.listeners.push(listener);
      return true;
    } catch (error) {
      console.error('Error starting call detection:', error);
      return false;
    }
  }

  // 전화 감지 중지
  public async stopListening(): Promise<void> {
    try {
      // 이벤트 리스너 제거
      this.listeners.forEach(listener => listener.remove());
      this.listeners = [];

      // 네이티브 모듈에 중지 요청
      if (CallDetectionModule) {
        await CallDetectionModule.stopListening();
      }
    } catch (error) {
      console.error('Error stopping call detection:', error);
    }
  }

  // 후보자 정보 자동 검색
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

  // 네이티브 모듈 권한 체크
  public async checkNativePermissions(): Promise<any> {
    if (CallDetectionModule) {
      return await CallDetectionModule.checkPermissions();
    }
    return null;
  }
}

export default CallDetectionService.getInstance();
