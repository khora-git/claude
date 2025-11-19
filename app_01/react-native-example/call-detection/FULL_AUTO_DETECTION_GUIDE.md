# 완전 자동 전화 감지 구현 가이드

CallScreeningService + BroadcastReceiver를 사용하여 **모든 Android 버전에서 자동 전화 감지**

## ✅ 지원 범위

- **Android 10+ (API 29+)**: CallScreeningService 사용
- **Android 9 이하 (API 28-)**: BroadcastReceiver 사용
- **모든 버전**: 완전 자동 전화번호 읽기 가능!

---

## 📋 설치 단계

### 1단계: Android 네이티브 코드 추가

```bash
cd ~/Projects/SearchFirmCRM

# calldetection 폴더 생성
mkdir -p android/app/src/main/java/com/searchfirmcrm/calldetection

# 네이티브 파일 복사
cp ~/claude/app_01/react-native-example/call-detection/android-native/*.kt \
   android/app/src/main/java/com/searchfirmcrm/calldetection/
```

**생성된 파일들**:
```
android/app/src/main/java/com/searchfirmcrm/calldetection/
├── MyCallScreeningService.kt      # Android 10+ 전화 감지
├── PhoneCallReceiver.kt            # Android 9 이하 전화 감지
├── CallDetectionModule.kt          # React Native 브릿지
└── CallDetectionPackage.kt         # 패키지 등록
```

---

### 2단계: MainApplication.kt 수정

파일: `android/app/src/main/java/com/searchfirmcrm/MainApplication.kt`

```kotlin
package com.searchfirmcrm

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import com.searchfirmcrm.calldetection.CallDetectionPackage  // 추가

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              add(CallDetectionPackage())  // 추가
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      load()
    }
  }
}
```

---

### 3단계: AndroidManifest.xml 수정

파일: `android/app/src/main/AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- 권한 추가 -->
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <uses-permission android:name="android.permission.READ_CALL_LOG" />
    <uses-permission android:name="android.permission.READ_PHONE_NUMBERS" />
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:allowBackup="false"
        android:theme="@style/AppTheme">

        <!-- 기존 activity -->
        <activity
            android:name=".MainActivity"
            ...>
        </activity>

        <!-- CallScreeningService (Android 10+) -->
        <service
            android:name=".calldetection.MyCallScreeningService"
            android:permission="android.permission.BIND_SCREENING_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.telecom.CallScreeningService" />
            </intent-filter>
        </service>

        <!-- BroadcastReceiver (Android 9 이하) -->
        <receiver
            android:name=".calldetection.PhoneCallReceiver"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.PHONE_STATE" />
            </intent-filter>
        </receiver>

    </application>

</manifest>
```

---

### 4단계: React Native 서비스 파일 교체

```bash
cd ~/Projects/SearchFirmCRM

# 기존 파일 백업
mv src/services/CallDetectionService.ts src/services/CallDetectionService.ts.backup

# 새 파일 복사
cp ~/claude/app_01/react-native-example/call-detection/CallDetectionService-Full.ts \
   src/services/CallDetectionService.ts
```

---

### 5단계: HomeScreen.tsx 수정

기존 HomeScreen.tsx에 다음 코드 추가:

```typescript
import CallDetectionService from '../services/CallDetectionService';
import CallOverlay from '../components/CallOverlay';

const HomeScreen = ({ navigation }: any) => {
  // ... 기존 state ...

  const [callDetectionEnabled, setCallDetectionEnabled] = useState(false);
  const [showCallOverlay, setShowCallOverlay] = useState(false);
  const [incomingNumber, setIncomingNumber] = useState('');
  const [incomingCandidateInfo, setIncomingCandidateInfo] = useState<any>(null);

  useEffect(() => {
    initializeCallDetection();

    return () => {
      CallDetectionService.stopListening();
    };
  }, []);

  const initializeCallDetection = async () => {
    // 1. 기본 권한 요청
    const hasPermission = await CallDetectionService.requestPermissions();

    if (!hasPermission) {
      Alert.alert(
        '권한 필요',
        '전화 감지 기능을 사용하려면 전화 상태 읽기 권한이 필요합니다.'
      );
      return;
    }

    // 2. Android 10+ 추가 설정
    if (Platform.OS === 'android' && Platform.Version >= 29) {
      Alert.alert(
        '추가 설정 필요',
        'Android 10 이상에서는 통화 스크리닝 앱으로 설정해야 합니다.',
        [
          { text: '나중에', style: 'cancel' },
          {
            text: '설정하기',
            onPress: async () => {
              await CallDetectionService.requestScreeningRole();
            },
          },
        ]
      );
    }

    // 3. 전화 감지 시작
    startCallDetection();
  };

  const startCallDetection = async () => {
    const started = await CallDetectionService.startListening(
      async (phoneNumber) => {
        console.log('전화 수신:', phoneNumber);
        setIncomingNumber(phoneNumber);

        // 후보자 정보 검색
        const candidate = await CallDetectionService.handleIncomingCall(phoneNumber);
        setIncomingCandidateInfo(candidate);

        // 오버레이 표시
        setShowCallOverlay(true);
      }
    );

    setCallDetectionEnabled(started);
  };

  const stopCallDetection = async () => {
    await CallDetectionService.stopListening();
    setCallDetectionEnabled(false);
  };

  return (
    <ScrollView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>안녕하세요, {userName}님</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      {/* 전화 감지 상태 표시 */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {callDetectionEnabled ? '📞 자동 감지 활성화됨' : '❌ 자동 감지 비활성화됨'}
        </Text>
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
```

---

### 6단계: CallOverlay 컴포넌트 추가

```bash
# components 폴더 생성
mkdir -p src/components

# CallOverlay 복사
cp ~/claude/app_01/react-native-example/call-detection/CallOverlay.tsx \
   src/components/
```

---

### 7단계: 빌드 및 실행

```bash
cd ~/Projects/SearchFirmCRM

# Android 빌드 캐시 삭제
cd android
./gradlew clean
cd ..

# 앱 빌드 및 실행
npm run android
```

---

## 🎯 사용자 설정 안내

### Android 10+ 추가 설정

앱 실행 후 다음 설정 필요:

1. **앱 실행** → "추가 설정 필요" 팝업
2. **"설정하기"** 버튼 클릭
3. **통화 스크리닝 앱** 선택 화면에서 "SearchFirm CRM" 선택
4. **완료**

또는 수동 설정:
1. **설정** → **앱** → **기본 앱**
2. **통화 스크리닝 앱** 찾기
3. **SearchFirm CRM** 선택

---

## 🧪 테스트 방법

### 1. 권한 확인

```bash
# 앱 실행 로그 확인
adb logcat | grep "CallDetection"
```

### 2. 전화 걸기

다른 폰에서 테스트 폰으로 전화 걸기

### 3. 예상 동작

1. 전화가 옴
2. 앱이 자동으로 전화번호 감지
3. 후보자 정보 검색
4. 팝업에 후보자 정보 표시

### 4. 로그 확인

```
D/CallScreeningService: onScreenCall triggered
D/CallScreeningService: Incoming call from: 01012345678
D/CallDetectionModule: Sending event to React Native
```

---

## ⚙️ 문제 해결

### 문제 1: "CallDetectionModule not found"

**원인**: 네이티브 모듈이 등록되지 않음

**해결**:
```bash
cd android
./gradlew clean
cd ..
npm start -- --reset-cache
npm run android
```

### 문제 2: Android 10+에서 번호가 안 읽힘

**원인**: 통화 스크리닝 앱으로 설정 안 됨

**해결**:
- 설정 → 앱 → 기본 앱 → 통화 스크리닝 앱 → SearchFirm CRM 선택

### 문제 3: 권한 거부됨

**원인**: 사용자가 권한 거부

**해결**:
- 설정 → 앱 → SearchFirm CRM → 권한 → 전화 허용

### 문제 4: BroadcastReceiver가 작동 안 함

**원인**: AndroidManifest.xml 설정 누락

**해결**:
- AndroidManifest.xml에 `<receiver>` 추가 확인
- `android:exported="true"` 확인

---

## 📊 동작 원리

### Android 10+
```
전화 수신
  ↓
MyCallScreeningService.onScreenCall()
  ↓
전화번호 읽기
  ↓
CallDetectionModule → React Native
  ↓
후보자 검색 → 팝업 표시
```

### Android 9 이하
```
전화 수신
  ↓
PhoneCallReceiver.onReceive()
  ↓
TelephonyManager에서 번호 읽기
  ↓
CallDetectionModule → React Native
  ↓
후보자 검색 → 팝업 표시
```

---

## ✅ 최종 체크리스트

- [ ] 네이티브 코드 4개 파일 추가
- [ ] MainApplication.kt 수정
- [ ] AndroidManifest.xml 수정
- [ ] CallDetectionService.ts 교체
- [ ] HomeScreen.tsx 수정
- [ ] CallOverlay.tsx 추가
- [ ] 빌드 성공
- [ ] 권한 허용
- [ ] Android 10+ 스크리닝 앱 설정
- [ ] 테스트 전화로 확인

---

## 🎉 완료 후

모든 설정이 완료되면:
- ✅ 전화가 오면 자동으로 감지
- ✅ 후보자 정보 자동 검색
- ✅ 팝업에 정보 표시
- ✅ 모든 Android 버전 지원

---

**작성일:** 2025-11-19
**지원 버전:** Android 5.0+ (API 21+)
**완전 자동:** Android 모든 버전!
