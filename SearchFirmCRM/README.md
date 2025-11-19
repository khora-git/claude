# SearchFirm CRM - React Native + Kotlin

전화 수신 시 후보자 정보를 자동으로 표시하는 CRM 앱입니다.

## 📋 프로젝트 구조

```
SearchFirmCRM/
├── android/
│   └── app/src/main/
│       ├── AndroidManifest.xml           ✅ 권한 설정 완료
│       └── java/com/searchfirmcrm/
│           ├── PhoneStateModule.kt       ✅ 네이티브 모듈
│           ├── PhoneStatePackage.kt      ✅ 패키지 등록
│           ├── PhoneCallReceiver.kt      ✅ BroadcastReceiver
│           ├── PhoneCallScreeningService.kt ✅ CallScreeningService
│           ├── MainActivity.kt           ✅ 메인 액티비티
│           └── MainApplication.kt        ✅ 앱 초기화
├── src/
│   ├── config/api.ts                     ✅ API 설정
│   └── services/api.ts                   ✅ API 호출 함수
├── App.tsx                               ✅ React Native UI
└── package.json                          ✅ 의존성 관리
```

## 🚀 설치 방법

### 1단계: 의존성 설치

```bash
cd SearchFirmCRM
npm install
```

### 2단계: 실제 폰 설정 (권장!)

에뮬레이터는 실제 전화를 받을 수 없으므로, **반드시 실제 폰**을 사용해야 합니다.

#### 폰에서 설정:

1. **설정 → 휴대전화 정보**
2. **"빌드 번호"를 7번 연속 탭** → 개발자 옵션 활성화
3. **설정 → 개발자 옵션**
4. **"USB 디버깅" 활성화**

#### USB 연결 확인:

```bash
# 폰을 USB로 컴퓨터에 연결

# 연결 확인
adb devices
```

**결과:**
```
List of devices attached
XXXXXXXXXX    device    ← 실제 폰이 보여야 함
```

폰에 팝업이 나오면 **"허용"** 선택

### 3단계: API 설정

`src/config/api.ts` 파일을 열고 서버 URL을 수정하세요:

```typescript
export const API_CONFIG = {
  BASE_URL: 'https://your-domain.com/api',  // ← 여기를 수정!
  ...
};
```

`App.tsx` 파일에서 API 키를 설정하세요:

```typescript
// 실제 API 키로 변경 (로그인 후 받은 키)
const API_KEY = 'your_api_key_here';  // ← 여기를 수정!
```

## 📱 빌드 및 실행

### 터미널 1: Metro 서버 시작

```bash
cd SearchFirmCRM
npm start
```

### 터미널 2: 앱 빌드 및 설치

```bash
cd SearchFirmCRM

# 포트 포워딩
adb reverse tcp:8081 tcp:8081

# 앱 빌드 및 폰에 설치
npm run android
```

**빌드 시간:** 첫 빌드는 2-3분 소요됩니다.

## ✅ 테스트

1. 앱이 폰에 설치되면 자동으로 실행됩니다.
2. **"권한 요청"** 버튼을 클릭합니다.
3. 권한 팝업에서 **"허용"**을 선택합니다.
4. **다른 폰에서 전화**를 걸어보세요.
5. **후보자 정보 팝업**이 나타납니다! 🎉

## 🔧 문제 해결

### 빌드 오류가 발생하는 경우

```bash
# Android 캐시 정리
cd SearchFirmCRM/android
./gradlew clean

# 다시 빌드
cd ..
npm run android
```

### 폰이 인식되지 않는 경우

```bash
# ADB 서버 재시작
adb kill-server
adb start-server
adb devices
```

### Metro 연결 오류가 발생하는 경우

```bash
# 포트 포워딩 다시 실행
adb reverse tcp:8081 tcp:8081

# 또는 폰에서 수동으로 설정
# 앱 실행 → 흔들기 → Dev Settings → Debug server host
# "192.168.x.x:8081" 입력 (컴퓨터 IP 주소)
```

## 📁 주요 파일 설명

### Kotlin 네이티브 모듈

- **PhoneStateModule.kt**: 권한 관리 및 React Native 브릿지
- **PhoneCallReceiver.kt**: 전화 수신 감지
- **PhoneCallScreeningService.kt**: 전화번호 스크리닝 (Android 7.0+)
- **MainApplication.kt**: 네이티브 모듈 등록

### React Native 코드

- **App.tsx**: 메인 UI 및 전화 수신 이벤트 처리
- **src/config/api.ts**: API 서버 URL 설정
- **src/services/api.ts**: 로그인, 후보자 검색 API 호출

### Android 설정

- **AndroidManifest.xml**: 필수 권한 및 서비스 등록
  - READ_PHONE_STATE
  - READ_CALL_LOG
  - INTERNET

## 🎯 앱 동작 원리

1. **전화 수신** → PhoneCallReceiver가 감지
2. **전화번호 추출** → React Native로 이벤트 전송
3. **API 호출** → 후보자 정보 검색
4. **팝업 표시** → 후보자 이름, 회사, 직급, 컨설턴트 정보 표시

## 🔐 필수 권한

- **READ_PHONE_STATE**: 전화 상태 읽기
- **READ_CALL_LOG**: 통화 기록 읽기
- **INTERNET**: API 서버 통신

## 📞 API 엔드포인트

- **로그인**: `/api/app_login_api.php`
- **컨설턴트 목록**: `/api/get_consultants_api.php`
- **후보자 검색**: `/api/search_candidate_api.php`

## 🌟 다음 단계

1. 로그인 화면 추가
2. 후보자 목록 화면 추가
3. 컨설턴트별 필터링
4. 통화 기록 저장
5. 오프라인 모드 지원

## 📝 라이선스

MIT License

## 👨‍💻 개발자

SearchFirm CRM Team
