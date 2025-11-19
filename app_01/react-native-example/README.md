# SearchFirm CRM - React Native 예제 코드

이 폴더에는 SearchFirm CRM 앱의 완성된 예제 코드가 들어있습니다.

## 📋 사용 방법

### 방법 1: 파일 복사 (권장)

```bash
# 1. 프로젝트 폴더로 이동
cd ~/Projects/SearchFirmCRM

# 2. 예제 파일들을 프로젝트로 복사
cp -r ~/claude/app_01/react-native-example/src/* ./src/
cp ~/claude/app_01/react-native-example/App.tsx ./App.tsx

# 3. 확인
ls -la src/screens/
ls -la src/services/
```

### 방법 2: 개별 파일 복사

```bash
cd ~/Projects/SearchFirmCRM

# screens 폴더 생성
mkdir -p src/screens

# 파일 복사
cp ~/claude/app_01/react-native-example/src/screens/LoginScreen.tsx src/screens/
cp ~/claude/app_01/react-native-example/src/screens/HomeScreen.tsx src/screens/
cp ~/claude/app_01/react-native-example/src/services/api.ts src/services/
cp ~/claude/app_01/react-native-example/App.tsx ./
```

## 📂 파일 구조

```
react-native-example/
├── App.tsx                      # 메인 앱 (네비게이션 설정)
└── src/
    ├── screens/
    │   ├── LoginScreen.tsx     # 로그인 화면
    │   └── HomeScreen.tsx      # 홈 화면 (후보자 검색)
    └── services/
        └── api.ts              # API 서비스 (완전판)
```

## ✅ 복사 후 할 일

1. **파일 복사 확인**
   ```bash
   ls -la ~/Projects/SearchFirmCRM/src/screens/
   ls -la ~/Projects/SearchFirmCRM/src/services/
   ```

2. **앱 실행**
   ```bash
   cd ~/Projects/SearchFirmCRM
   npm run android
   ```

## 🔧 주요 기능

### LoginScreen.tsx
- 아이디/비밀번호 입력
- 로그인 API 호출
- 토큰 저장
- 홈 화면으로 이동

### HomeScreen.tsx
- 사용자 환영 메시지
- 전화번호 검색
- 후보자 정보 표시
- 로그아웃 기능

### api.ts (완전판)
- ✅ login() - 로그인 함수
- ✅ searchCandidate() - 후보자 검색
- ✅ logout() - 로그아웃
- ✅ getCurrentUser() - 현재 사용자 정보

## 🚀 API 서버 주소

현재 설정: `https://uiworld.mycafe24.com/sfs2u/api`

변경하려면 `src/config/api.ts` 파일 수정:
```typescript
export const API_CONFIG = {
  BASE_URL: 'https://your-domain.com/api',  // 여기 수정
  ENDPOINTS: {
    LOGIN: '/app_login_api.php',
    GET_CONSULTANTS: '/get_consultants_api.php',
    SEARCH_CANDIDATE: '/search_candidate_api.php',
  },
};
```

## 💡 문제 해결

### 파일 복사가 안 되면
```bash
# 경로 확인
ls -la ~/claude/app_01/react-native-example/

# 프로젝트 경로 확인
pwd
# 출력: /home/kim/Projects/SearchFirmCRM
```

### 빌드 에러 발생 시
```bash
# 캐시 삭제
cd ~/Projects/SearchFirmCRM
rm -rf node_modules
npm install

# Android 빌드 캐시 삭제
cd android
./gradlew clean
cd ..

# 재실행
npm run android
```

## 📞 다음 단계

앱이 정상 실행되면:
1. 실제 서버 아이디/비밀번호로 로그인 테스트
2. 후보자 전화번호로 검색 테스트
3. 전화 감지 기능 추가 (고급)

---

**작성일:** 2025-11-19
**대상:** SearchFirm CRM 프로젝트
**환경:** React Native 0.82, TypeScript
