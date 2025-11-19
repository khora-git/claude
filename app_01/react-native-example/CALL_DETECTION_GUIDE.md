# 전화 감지 기능 추가 가이드

전화가 오면 자동으로 후보자 정보를 표시하는 기능을 추가합니다.

## ⚠️ 주의사항

전화 감지 기능은 Android 10 이상에서 제한이 있습니다:
- **Android 9 이하**: 전화번호 읽기 가능
- **Android 10 이상**: 전화번호 읽기 제한 (전화 상태만 감지 가능)

이 가이드는 **Android 9 이하** 또는 **루팅된 기기**에서 완전히 작동합니다.

---

## 📝 1단계: Android 권한 추가

### AndroidManifest.xml 수정

터미널에서 실행:

```bash
cd ~/Projects/SearchFirmCRM
nano android/app/src/main/AndroidManifest.xml
```

`<manifest>` 태그 안에 다음 권한 추가:

```xml
<!-- 전화 상태 읽기 -->
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.READ_CALL_LOG" />

<!-- 오버레이 팝업 (다른 앱 위에 표시) -->
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

<!-- 인터넷 (API 호출용) -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- Android 10+ 전화번호 읽기 (제한적) -->
<uses-permission android:name="android.permission.READ_PHONE_NUMBERS" />
```

---

## 📦 2단계: 라이브러리 설치

### 방법 1: react-native-call-detection (간단)

```bash
cd ~/Projects/SearchFirmCRM
npm install react-native-call-detection
npm install react-native-permissions
cd android && ./gradlew clean && cd ..
```

### 방법 2: CallDetection 네이티브 모듈 직접 구현 (권장)

더 정확한 제어를 위해 직접 구현하는 것을 권장합니다.

---

## 🔧 3단계: 전화 감지 서비스 컴포넌트 생성

### src/services/CallDetectionService.ts

```typescript
import { NativeModules, NativeEventEmitter, PermissionsAndroid, Platform } from 'react-native';
import { searchCandidate } from './api';

export class CallDetectionService {
  private static instance: CallDetectionService;
  private callDetectionModule: any;
  private eventEmitter: NativeEventEmitter | null = null;
  private listeners: any[] = [];

  private constructor() {
    // CallDetection 네이티브 모듈이 있으면 사용
    this.callDetectionModule = NativeModules.CallDetection;

    if (this.callDetectionModule) {
      this.eventEmitter = new NativeEventEmitter(this.callDetectionModule);
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
      return false;
    }

    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);

      const allGranted = Object.values(granted).every(
        status => status === PermissionsAndroid.RESULTS.GRANTED
      );

      // 오버레이 권한 요청 (별도)
      if (allGranted && this.callDetectionModule?.requestOverlayPermission) {
        await this.callDetectionModule.requestOverlayPermission();
      }

      return allGranted;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  // 전화 감지 시작
  public startListening(onIncomingCall: (phoneNumber: string) => void) {
    if (!this.eventEmitter) {
      console.warn('CallDetection module not available');
      return;
    }

    // 수신 전화 리스너
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
  }

  // 전화 감지 중지
  public stopListening() {
    this.listeners.forEach(listener => listener.remove());
    this.listeners = [];
  }

  // 후보자 정보 자동 검색
  public async handleIncomingCall(phoneNumber: string) {
    try {
      const candidate = await searchCandidate(phoneNumber);
      return candidate;
    } catch (error) {
      console.error('Error searching candidate:', error);
      return null;
    }
  }
}

export default CallDetectionService.getInstance();
```

---

## 🖼️ 4단계: 오버레이 팝업 컴포넌트

### src/components/CallOverlay.tsx

```typescript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';

interface CandidateInfo {
  name: string;
  phone_numbers: string;
  email: string;
  stage: string;
  applied_position: string;
  applied_company: string;
}

interface CallOverlayProps {
  visible: boolean;
  phoneNumber: string;
  candidateInfo: CandidateInfo | null;
  onClose: () => void;
}

const CallOverlay: React.FC<CallOverlayProps> = ({
  visible,
  phoneNumber,
  candidateInfo,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerText}>📞 수신 전화</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.phoneNumber}>{phoneNumber}</Text>

          {candidateInfo ? (
            <View style={styles.infoContainer}>
              <Text style={styles.title}>후보자 정보</Text>

              <View style={styles.infoRow}>
                <Text style={styles.label}>이름:</Text>
                <Text style={styles.value}>{candidateInfo.name}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>진행단계:</Text>
                <Text style={[styles.value, styles.stage]}>
                  {candidateInfo.stage}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>지원 포지션:</Text>
                <Text style={styles.value}>{candidateInfo.applied_position}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>고객사:</Text>
                <Text style={styles.value}>{candidateInfo.applied_company}</Text>
              </View>

              {candidateInfo.email && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>이메일:</Text>
                  <Text style={styles.value}>{candidateInfo.email}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.notFoundContainer}>
              <Text style={styles.notFoundText}>
                등록된 후보자가 아닙니다
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: Dimensions.get('window').width * 0.9,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    maxHeight: Dimensions.get('window').height * 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 30,
    color: '#999',
  },
  phoneNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#007AFF',
    marginBottom: 20,
  },
  infoContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    width: 90,
    fontWeight: '600',
    color: '#666',
  },
  value: {
    flex: 1,
    color: '#333',
  },
  stage: {
    color: '#007AFF',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  notFoundContainer: {
    padding: 30,
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: '#999',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CallOverlay;
```

---

## 🏠 5단계: HomeScreen에 전화 감지 기능 추가

### src/screens/HomeScreen.tsx 수정

기존 HomeScreen에 다음 코드 추가:

```typescript
import React, { useState, useEffect } from 'react';
import CallDetectionService from '../services/CallDetectionService';
import CallOverlay from '../components/CallOverlay';

const HomeScreen = ({ navigation }: any) => {
  // ... 기존 state들 ...

  // 전화 감지 관련 state
  const [callDetectionEnabled, setCallDetectionEnabled] = useState(false);
  const [showCallOverlay, setShowCallOverlay] = useState(false);
  const [incomingNumber, setIncomingNumber] = useState('');
  const [incomingCandidateInfo, setIncomingCandidateInfo] = useState<any>(null);

  useEffect(() => {
    // 컴포넌트 마운트 시 권한 요청
    initializeCallDetection();

    return () => {
      // 컴포넌트 언마운트 시 리스너 제거
      CallDetectionService.stopListening();
    };
  }, []);

  const initializeCallDetection = async () => {
    const hasPermission = await CallDetectionService.requestPermissions();

    if (hasPermission) {
      startCallDetection();
    } else {
      Alert.alert(
        '권한 필요',
        '전화 감지 기능을 사용하려면 전화 상태 읽기 권한이 필요합니다.',
        [
          { text: '취소', style: 'cancel' },
          { text: '설정으로 이동', onPress: () => {
            // 설정 앱으로 이동 로직
          }},
        ]
      );
    }
  };

  const startCallDetection = () => {
    CallDetectionService.startListening(async (phoneNumber) => {
      console.log('전화 수신:', phoneNumber);
      setIncomingNumber(phoneNumber);

      // 후보자 정보 검색
      const candidate = await CallDetectionService.handleIncomingCall(phoneNumber);
      setIncomingCandidateInfo(candidate);

      // 오버레이 표시
      setShowCallOverlay(true);
    });

    setCallDetectionEnabled(true);
  };

  const stopCallDetection = () => {
    CallDetectionService.stopListening();
    setCallDetectionEnabled(false);
  };

  const toggleCallDetection = () => {
    if (callDetectionEnabled) {
      stopCallDetection();
    } else {
      startCallDetection();
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 기존 헤더 */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>안녕하세요, {userName}님</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      {/* 전화 감지 토글 */}
      <View style={styles.detectionToggle}>
        <Text style={styles.toggleLabel}>
          📞 자동 전화 감지 {callDetectionEnabled ? '켜짐' : '꺼짐'}
        </Text>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            callDetectionEnabled && styles.toggleButtonActive,
          ]}
          onPress={toggleCallDetection}
        >
          <Text style={styles.toggleButtonText}>
            {callDetectionEnabled ? 'OFF' : 'ON'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 기존 검색 섹션 */}
      {/* ... */}

      {/* 전화 오버레이 */}
      <CallOverlay
        visible={showCallOverlay}
        phoneNumber={incomingNumber}
        candidateInfo={incomingCandidateInfo}
        onClose={() => setShowCallOverlay(false)}
      />
    </ScrollView>
  );
};

// 스타일에 추가
const additionalStyles = {
  detectionToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  toggleButton: {
    backgroundColor: '#ddd',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleButtonActive: {
    backgroundColor: '#4CAF50',
  },
  toggleButtonText: {
    color: 'white',
    fontWeight: '600',
  },
};
```

---

## 🚀 6단계: 파일 복사 및 테스트

```bash
cd ~/Projects/SearchFirmCRM

# components 폴더 생성
mkdir -p src/components

# 파일 복사
cp ~/claude/app_01/react-native-example/call-detection/CallDetectionService.ts src/services/
cp ~/claude/app_01/react-native-example/call-detection/CallOverlay.tsx src/components/
cp ~/claude/app_01/react-native-example/call-detection/HomeScreen-with-call-detection.tsx src/screens/HomeScreen.tsx

# 앱 재빌드
npm run android
```

---

## ⚠️ 제한 사항 및 대안

### Android 10+ 제한 사항

Android 10 이상에서는 전화번호를 직접 읽을 수 없습니다. 대안:

1. **방법 1**: 사용자가 수동으로 전화번호 입력
2. **방법 2**: 통화 기록에서 읽기 (통화 후)
3. **방법 3**: 접근성 서비스 사용 (복잡함)

### 권장 사항

- **Android 9 이하**: 완전 자동 작동
- **Android 10+**: 전화가 오면 팝업을 띄우되, 사용자가 번호를 확인하고 수동 검색

---

## 🔍 테스트 방법

1. 앱 실행
2. 로그인
3. "자동 전화 감지" 켜기
4. 다른 폰에서 테스트 전화 걸기
5. 팝업에 후보자 정보 표시되는지 확인

---

## 📝 다음 작업

- [ ] Android 권한 추가
- [ ] 라이브러리 설치
- [ ] CallDetectionService 파일 생성
- [ ] CallOverlay 컴포넌트 생성
- [ ] HomeScreen 수정
- [ ] 테스트

---

**작성일:** 2025-11-19
**주의:** Android 10+ 에서는 전화번호 읽기 제한이 있습니다.
