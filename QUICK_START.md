# ⚡ 빠른 시작 가이드

## 5분 안에 앱 실행하기

### 1️⃣ 클론 (30초)

```bash
git clone https://github.com/khora-git/claude.git
cd claude
git checkout claude/setup-react-native-kotlin-015pAKx2qu4fXBfRBb6xFxo1
```

### 2️⃣ 의존성 설치 (2분)

```bash
npm install
```

### 3️⃣ API 설정 (1분)

**파일 1**: `src/config/api.ts`
```typescript
BASE_URL: 'https://your-domain.com/api',  // ← 실제 URL로 변경
```

**파일 2**: `App.tsx` (라인 21)
```typescript
const API_KEY = 'your_api_key_here';  // ← 실제 API 키로 변경
```

### 4️⃣ 폰 연결 (1분)

```bash
# 1. 폰 USB 연결
# 2. USB 디버깅 허용
# 3. 연결 확인
adb devices
```

### 5️⃣ 실행 (2분)

**터미널 1:**
```bash
npm start
```

**터미널 2:**
```bash
adb reverse tcp:8081 tcp:8081
npm run android
```

### 6️⃣ 테스트

1. 앱에서 **"권한 요청"** 클릭
2. 권한 **"허용"**
3. 다른 폰에서 **전화 걸기**
4. **팝업 확인!** 🎉

---

## 📱 필수 요구사항

- ✅ Node.js 18+
- ✅ Java 17
- ✅ Android SDK
- ✅ **실제 Android 폰** (에뮬레이터 X)

---

## 🆘 문제 해결

### Metro 연결 안 됨
```bash
adb reverse tcp:8081 tcp:8081
```

### 빌드 실패
```bash
cd android && ./gradlew clean && cd .. && npm run android
```

### 앱 크래시
```bash
adb logcat | grep -i searchfirmcrm
```

---

**상세 가이드**: `SETUP_GUIDE.md` 참고
