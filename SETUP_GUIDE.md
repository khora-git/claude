# SearchFirm CRM - 세션 이어가기 가이드

## 📌 프로젝트 정보

- **저장소**: khora-git/claude
- **브랜치**: `claude/setup-react-native-kotlin-015pAKx2qu4fXBfRBb6xFxo1`
- **백업 브랜치**: `claude/main-015pAKx2qu4fXBfRBb6xFxo1`
- **패키지명**: com.searchfirmcrm
- **앱 이름**: SearchFirm CRM

---

## 🚀 노트북에서 프로젝트 클론하기

### 1단계: 저장소 클론

```bash
# GitHub 저장소 클론
git clone https://github.com/khora-git/claude.git
cd claude

# 작업 브랜치로 전환
git checkout claude/setup-react-native-kotlin-015pAKx2qu4fXBfRBb6xFxo1
```

또는 main 브랜치 백업을 사용:

```bash
git checkout claude/main-015pAKx2qu4fXBfRBb6xFxo1
```

### 2단계: 의존성 설치

```bash
# Node.js 패키지 설치
npm install

# 또는 yarn 사용 시
yarn install
```

**예상 소요 시간**: 2-5분

---

## ⚙️ 필수 설정

### API 설정

#### 1. 서버 URL 설정

`src/config/api.ts` 파일을 열고 실제 API 서버 URL로 변경:

```typescript
export const API_CONFIG = {
  BASE_URL: 'https://your-domain.com/api',  // ← 실제 서버 URL로 변경!
  ENDPOINTS: {
    LOGIN: '/app_login_api.php',
    GET_CONSULTANTS: '/get_consultants_api.php',
    SEARCH_CANDIDATE: '/search_candidate_api.php',
  },
  TIMEOUT: 10000,
};
```

#### 2. API 키 설정

`App.tsx` 파일을 열고 API 키 설정:

```typescript
// 라인 21 부근
const API_KEY = 'your_api_key_here';  // ← 로그인 후 받은 실제 API 키로 변경!
```

---

## 📱 Android 폰 설정 (필수!)

**중요**: 에뮬레이터는 실제 전화를 받을 수 없으므로 **반드시 실제 Android 폰**을 사용해야 합니다.

### 1. 개발자 옵션 활성화

1. **설정 → 휴대전화 정보**
2. **"빌드 번호"를 7번 연속 탭**
3. "개발자 옵션이 활성화되었습니다" 메시지 확인

### 2. USB 디버깅 활성화

1. **설정 → 개발자 옵션**
2. **"USB 디버깅"** 켜기
3. **"설치 소스 확인"** 켜기 (선택사항)

### 3. 폰 연결 확인

```bash
# USB로 폰 연결 후
adb devices
```

**정상적인 결과:**
```
List of devices attached
XXXXXXXXXX    device    ← 폰이 device로 표시되어야 함
```

**문제 발생 시:**
- 폰에 "USB 디버깅 허용" 팝업 나타나면 **"허용"** 선택
- 안 보이면: `adb kill-server && adb start-server`
- 여전히 안 보이면: USB 케이블 교체 또는 다른 USB 포트 시도

---

## 🔨 빌드 및 실행

### 터미널 1: Metro 서버 시작

```bash
cd claude
npm start

# 또는 캐시 클리어 후 시작
npm start -- --reset-cache
```

**Metro가 시작되면 다음과 같은 메시지가 나타납니다:**
```
Welcome to Metro!
              Fast - Scalable - Integrated

r - reload the app
d - open developer menu
j - open debugger
```

### 터미널 2: 앱 빌드 및 설치

새 터미널을 열고:

```bash
cd claude

# 포트 포워딩 (Metro 연결용)
adb reverse tcp:8081 tcp:8081

# 앱 빌드 및 폰에 설치
npm run android
```

**첫 빌드 소요 시간**: 2-3분

**빌드 성공 메시지:**
```
BUILD SUCCESSFUL in 2m 34s
info Connecting to the development server...
info Starting the app on "XXXXXXXXXX"...
```

---

## ✅ 앱 테스트

### 1. 권한 허용

1. 앱이 자동으로 실행됩니다
2. **"권한 요청"** 버튼 클릭
3. 권한 팝업에서 **"허용"** 선택 (2번)
   - 전화 상태 읽기
   - 통화 기록 읽기

### 2. 전화 수신 테스트

1. **다른 폰에서 이 폰으로 전화** 걸기
2. **후보자 정보 팝업** 나타나는지 확인!

**팝업 예시:**
```
후보자 정보
─────────────
이름: 홍길동
회사: ABC 주식회사
직급: 부장
컨설턴트: 김철수

[확인]
```

---

## 🐛 문제 해결

### Metro 연결 오류

```bash
# 포트 포워딩 재실행
adb reverse tcp:8081 tcp:8081

# 또는 앱에서 수동 설정
# 1. 폰 흔들기 → Dev Settings
# 2. Debug server host & port for device
# 3. "192.168.x.x:8081" 입력 (노트북 IP)
```

### 빌드 오류

```bash
# Android 캐시 정리
cd android
./gradlew clean

# 다시 빌드
cd ..
npm run android
```

### 앱 강제 종료됨

```bash
# 로그 확인
adb logcat | grep -i "searchfirmcrm"

# 또는 React Native 로그만 보기
npx react-native log-android
```

### 권한 팝업이 안 나타남

AndroidManifest.xml이 올바른지 확인:
```bash
cat android/app/src/main/AndroidManifest.xml | grep -A2 "uses-permission"
```

다음 권한이 있어야 함:
- `READ_PHONE_STATE`
- `READ_CALL_LOG`
- `INTERNET`

---

## 📂 프로젝트 구조

```
claude/
├── android/                          # Android 네이티브 코드
│   ├── app/
│   │   ├── build.gradle             # 앱 빌드 설정
│   │   ├── debug.keystore           # 디버그 서명
│   │   └── src/main/
│   │       ├── AndroidManifest.xml  # 권한 및 서비스 등록
│   │       └── java/com/searchfirmcrm/
│   │           ├── MainActivity.kt           # 메인 액티비티
│   │           ├── MainApplication.kt        # 앱 초기화
│   │           ├── PhoneStateModule.kt       # 네이티브 모듈
│   │           ├── PhoneStatePackage.kt      # 패키지 등록
│   │           ├── PhoneCallReceiver.kt      # 전화 수신 감지
│   │           └── PhoneCallScreeningService.kt  # 전화 스크리닝
│   ├── build.gradle                 # 프로젝트 설정
│   └── gradle.properties            # Gradle 설정
│
├── src/                             # React Native 소스
│   ├── config/
│   │   └── api.ts                   # ⚠️ API 서버 URL 설정
│   └── services/
│       └── api.ts                   # API 호출 함수
│
├── App.tsx                          # ⚠️ 메인 앱 (API 키 설정)
├── package.json                     # npm 의존성
├── index.js                         # 앱 엔트리 포인트
└── README.md                        # 프로젝트 설명
```

---

## 🔑 중요 파일 위치

### 수정해야 할 파일 (API 설정)

1. **`src/config/api.ts`** - API 서버 URL
2. **`App.tsx`** (라인 21) - API 키

### Kotlin 네이티브 코드

- `android/app/src/main/java/com/searchfirmcrm/PhoneStateModule.kt`
- `android/app/src/main/java/com/searchfirmcrm/PhoneCallReceiver.kt`
- `android/app/src/main/java/com/searchfirmcrm/PhoneCallScreeningService.kt`

### Android 설정

- `android/app/src/main/AndroidManifest.xml`
- `android/app/build.gradle`

---

## 📝 개발 팁

### 코드 수정 후 리로드

Metro가 실행 중이면:
- **Android**: `R` 키를 두 번 누르기
- **또는**: 폰을 흔들고 "Reload" 선택

### 개발자 메뉴 열기

- 폰을 흔들기
- 또는 터미널에서 `adb shell input keyevent 82`

### 디버깅

```bash
# React Native 디버거 열기
# Metro 터미널에서 'j' 입력

# Chrome DevTools에서 디버깅 가능
```

---

## 🌟 다음 단계 (기능 추가)

현재 구현된 기능:
- ✅ 전화 수신 감지
- ✅ 후보자 정보 검색
- ✅ 팝업 알림

추가할 수 있는 기능:
- [ ] 로그인 화면
- [ ] 후보자 목록 화면
- [ ] 컨설턴트별 필터링
- [ ] 통화 기록 저장
- [ ] 오프라인 모드

---

## 📞 연락처

문제가 발생하면 다음을 확인하세요:

1. `README.md` - 전체 프로젝트 가이드
2. `SETUP_GUIDE.md` (이 파일) - 세션 이어가기 가이드
3. GitHub Issues - 버그 리포트

---

**마지막 업데이트**: 2025-11-19
**작업 브랜치**: claude/setup-react-native-kotlin-015pAKx2qu4fXBfRBb6xFxo1
