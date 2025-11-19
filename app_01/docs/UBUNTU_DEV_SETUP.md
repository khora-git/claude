# 우분투 개발 환경 설정 가이드 (초보자용)

**맥북에어 우분투 환경에서 SearchFirm CRM 앱 개발 및 출시하기**

---

## 📌 목차

1. [시작하기 전에](#시작하기-전에)
2. [1단계: 개발 도구 설치](#1단계-개발-도구-설치)
3. [2단계: React Native 개발 환경 구축](#2단계-react-native-개발-환경-구축)
4. [3단계: 프로젝트 생성 및 설정](#3단계-프로젝트-생성-및-설정)
5. [4단계: 앱 개발](#4단계-앱-개발)
6. [5단계: 앱 테스트](#5단계-앱-테스트)
7. [6단계: 앱 빌드 및 출시](#6단계-앱-빌드-및-출시)
8. [문제 해결](#문제-해결)

---

## 시작하기 전에

### 프로젝트 개요
- **앱 이름**: SearchFirm CRM
- **목적**: 전화 수신 시 자동으로 후보자 정보를 화면에 표시
- **기술 스택**: React Native (Android)
- **백엔드**: 이미 완성됨 ✅

### 필요한 것들
- ✅ 맥북에어 (우분투 설치됨)
- ✅ 인터넷 연결
- ✅ 4GB 이상의 여유 디스크 공간
- ⏳ Android 폰 (테스트용) - 나중에 필요

### 예상 소요 시간
- **1단계 (도구 설치)**: 1-2시간
- **2단계 (React Native 설정)**: 1-2시간
- **3단계 (프로젝트 생성)**: 30분
- **4단계 (앱 개발)**: 1-2주
- **5단계 (테스트)**: 3-5일
- **6단계 (출시)**: 2-3일

---

## 1단계: 개발 도구 설치

### 1.1 시스템 업데이트

터미널을 열고 다음 명령어를 실행하세요:

```bash
# 시스템 패키지 목록 업데이트
sudo apt update

# 설치된 패키지 업그레이드
sudo apt upgrade -y
```

**설명**:
- `sudo`: 관리자 권한으로 실행 (비밀번호 입력 필요)
- `apt update`: 최신 패키지 정보 가져오기
- `apt upgrade -y`: 설치된 프로그램들을 최신 버전으로 업데이트 (`-y`는 자동 확인)

---

### 1.2 필수 도구 설치

```bash
# curl (파일 다운로드 도구)
sudo apt install -y curl

# git (버전 관리 도구)
sudo apt install -y git

# build-essential (컴파일 도구들)
sudo apt install -y build-essential

# 추가 필수 라이브러리
sudo apt install -y libssl-dev libffi-dev python3-dev
```

**각 도구의 역할**:
- **curl**: 인터넷에서 파일 다운로드
- **git**: 코드 버전 관리 및 GitHub 연동
- **build-essential**: C/C++ 컴파일러 (일부 패키지 설치에 필요)

---

### 1.3 Node.js 설치 (JavaScript 실행 환경)

React Native는 Node.js가 필요합니다.

```bash
# NVM (Node Version Manager) 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 터미널 재시작 (또는 다음 명령 실행)
source ~/.bashrc

# NVM이 설치되었는지 확인
nvm --version

# Node.js LTS 버전 설치 (v20 권장)
nvm install 20

# Node.js 설치 확인
node --version
npm --version
```

**예상 출력**:
```
v20.x.x
10.x.x
```

**설명**:
- **NVM**: Node.js 버전을 쉽게 관리할 수 있는 도구
- **LTS**: Long Term Support (장기 지원 버전, 안정적)

---

### 1.4 Watchman 설치 (파일 변경 감지)

React Native 개발 시 파일 변경을 자동으로 감지하는 도구입니다.

```bash
# Watchman 저장소 추가
cd /tmp
git clone https://github.com/facebook/watchman.git
cd watchman
git checkout v2023.11.20.00

# 빌드 및 설치
sudo apt-get install -y autoconf automake build-essential libtool pkg-config libssl-dev
./autogen.sh
./configure
make
sudo make install

# 설치 확인
watchman --version
```

**또는 간단하게**:
```bash
sudo apt install -y watchman
```

---

### 1.5 JDK (Java Development Kit) 설치

Android 앱을 빌드하려면 Java가 필요합니다.

```bash
# OpenJDK 17 설치
sudo apt install -y openjdk-17-jdk

# Java 설치 확인
java -version
javac -version
```

**예상 출력**:
```
openjdk version "17.0.x"
javac 17.0.x
```

---

### 1.6 Android Studio 설치

Android 앱 개발 도구입니다.

#### 방법 1: 공식 홈페이지에서 다운로드

1. **웹 브라우저에서 접속**:
   ```
   https://developer.android.com/studio
   ```

2. **Linux용 다운로드** 버튼 클릭

3. **다운로드한 파일 압축 해제**:
   ```bash
   cd ~/Downloads
   tar -xzf android-studio-*.tar.gz
   sudo mv android-studio /opt/
   ```

4. **Android Studio 실행**:
   ```bash
   /opt/android-studio/bin/studio.sh
   ```

5. **설치 마법사 진행**:
   - "Standard" 설치 선택
   - Android SDK, Android SDK Platform-Tools, Android Emulator 자동 설치
   - 완료까지 약 10-20분 소요

#### 방법 2: Snap으로 설치 (더 쉬운 방법)

```bash
sudo snap install android-studio --classic
```

---

### 1.7 Android SDK 환경 변수 설정

**중요**: 이 설정을 해야 React Native가 Android를 찾을 수 있습니다.

```bash
# .bashrc 파일 열기
nano ~/.bashrc

# 파일 맨 아래에 다음 내용 추가:
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Ctrl + O (저장), Enter, Ctrl + X (종료)

# 설정 적용
source ~/.bashrc

# 확인
echo $ANDROID_HOME
```

**예상 출력**:
```
/home/your-username/Android/Sdk
```

---

### 1.8 Android SDK 설치 확인

Android Studio를 열고:

1. **메뉴**: Tools → SDK Manager
2. **SDK Platforms 탭**:
   - ✅ Android 14.0 (API 34) - 최신
   - ✅ Android 13.0 (API 33)
   - ✅ Android 12.0 (API 31)

3. **SDK Tools 탭**:
   - ✅ Android SDK Build-Tools
   - ✅ Android SDK Platform-Tools
   - ✅ Android Emulator
   - ✅ Android SDK Tools (Obsolete) - 체크

4. **Apply** 버튼 클릭하여 설치

---

## 2단계: React Native 개발 환경 구축

### 2.1 React Native CLI 설치

```bash
# React Native CLI 전역 설치
npm install -g react-native-cli

# 설치 확인
react-native --version
```

**또는** (권장):
```bash
# npx를 사용하면 설치 없이 최신 버전 사용 가능
npx react-native --version
```

---

### 2.2 개발 환경 진단

```bash
# React Native 개발 환경 체크
npx react-native doctor
```

**예상 출력**:
```
✓ Node.js
✓ npm
✓ Watchman
✓ Android SDK
✓ Android Studio
```

모든 항목이 ✓ 이면 준비 완료!

---

## 3단계: 프로젝트 생성 및 설정

### 3.1 작업 폴더 생성

```bash
# 홈 디렉토리의 Projects 폴더에 작업
cd ~
mkdir -p Projects
cd Projects
```

---

### 3.2 React Native 프로젝트 생성

```bash
# SearchFirmCRM 프로젝트 생성
npx react-native@latest init SearchFirmCRM

# 프로젝트 폴더로 이동
cd SearchFirmCRM
```

**설명**:
- 프로젝트 이름은 공백 없이, 대문자로 시작
- 약 5-10분 소요 (패키지 다운로드)

---

### 3.3 프로젝트 구조 확인

```bash
# 폴더 구조 보기
ls -la
```

**생성된 주요 폴더/파일**:
```
SearchFirmCRM/
├── android/          # Android 네이티브 코드
├── ios/              # iOS 코드 (맥북에서는 사용 안 함)
├── node_modules/     # 설치된 패키지들
├── App.tsx           # 메인 앱 파일 (여기서 개발!)
├── package.json      # 프로젝트 설정 및 의존성
└── index.js          # 앱 진입점
```

---

### 3.4 필요한 라이브러리 설치

```bash
# API 통신 라이브러리
npm install axios

# 로컬 저장소 (토큰, 설정 저장용)
npm install @react-native-async-storage/async-storage

# 네비게이션 (화면 전환)
npm install @react-navigation/native
npm install @react-navigation/stack
npm install react-native-screens react-native-safe-area-context

# 권한 관리
npm install react-native-permissions

# 전화 감지 (나중에 필요)
# npm install react-native-call-detection
```

---

### 3.5 Android 권한 설정

앱이 전화번호를 읽으려면 권한이 필요합니다.

```bash
# Android 매니페스트 파일 열기
nano android/app/src/main/AndroidManifest.xml
```

**`<manifest>` 태그 안에 추가**:
```xml
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.READ_CALL_LOG" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.INTERNET" />
```

---

### 3.6 첫 번째 실행 테스트

#### 에뮬레이터 없이 개발 서버만 실행

```bash
# Metro 서버 시작 (React Native 개발 서버)
npm start
```

**새 터미널 창을 열고**:

```bash
# Android 앱 빌드 및 실행 (실제 폰 연결 필요)
cd ~/Projects/SearchFirmCRM
npm run android
```

**또는 에뮬레이터 사용**:

```bash
# Android Studio에서 AVD Manager 열기
# Create Virtual Device → Phone → Pixel 5 → API 34 → Finish

# 에뮬레이터 실행 후
npm run android
```

**성공하면**: 휴대폰/에뮬레이터에 "Welcome to React Native" 화면 표시!

---

## 4단계: 앱 개발

### 4.1 API 연동 코드 작성

#### API 설정 파일 생성

```bash
# 프로젝트 내에 config 폴더 생성
mkdir -p src/config
nano src/config/api.ts
```

**api.ts 내용**:
```typescript
// API 기본 설정
export const API_CONFIG = {
  BASE_URL: 'https://your-domain.com/api', // 실제 도메인으로 변경
  TIMEOUT: 10000, // 10초
};

export const API_ENDPOINTS = {
  LOGIN: '/app_login_api.php',
  CONSULTANTS: '/get_consultants_api.php',
  SEARCH_CANDIDATE: '/search_candidate_api.php',
};
```

---

#### API 서비스 파일 생성

```bash
mkdir -p src/services
nano src/services/apiService.ts
```

**apiService.ts 내용**:
```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, API_ENDPOINTS } from '../config/api';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// 토큰을 자동으로 헤더에 추가
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 로그인
export const login = async (mb_id: string, mb_password: string) => {
  const response = await api.post(API_ENDPOINTS.LOGIN, {
    mb_id,
    mb_password,
  });

  if (response.data.success && response.data.data.token) {
    // 토큰 저장
    await AsyncStorage.setItem('auth_token', response.data.data.token);
    await AsyncStorage.setItem('user_info', JSON.stringify(response.data.data.user));
  }

  return response.data;
};

// 후보자 검색
export const searchCandidate = async (phone: string) => {
  const response = await api.get(
    `${API_ENDPOINTS.SEARCH_CANDIDATE}?phone=${phone}`
  );
  return response.data;
};

// 컨설턴트 목록
export const getConsultants = async () => {
  const response = await api.get(API_ENDPOINTS.CONSULTANTS);
  return response.data;
};

export default api;
```

---

### 4.2 로그인 화면 만들기

```bash
mkdir -p src/screens
nano src/screens/LoginScreen.tsx
```

**LoginScreen.tsx 내용**:
```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { login } from '../services/apiService';

const LoginScreen = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('오류', '아이디와 비밀번호를 입력하세요');
      return;
    }

    setLoading(true);
    try {
      const result = await login(username, password);

      if (result.success) {
        Alert.alert('성공', '로그인되었습니다');
        navigation.navigate('Home');
      } else {
        Alert.alert('오류', result.message || '로그인 실패');
      }
    } catch (error) {
      Alert.alert('오류', '서버 연결 실패');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SearchFirm CRM</Text>

      <TextInput
        style={styles.input}
        placeholder="아이디"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? '로그인 중...' : '로그인'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
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

export default LoginScreen;
```

---

### 4.3 홈 화면 (전화 감지 화면)

```bash
nano src/screens/HomeScreen.tsx
```

**HomeScreen.tsx 내용**:
```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { searchCandidate } from '../services/apiService';

const HomeScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [candidateInfo, setCandidateInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!phoneNumber) {
      Alert.alert('오류', '전화번호를 입력하세요');
      return;
    }

    setLoading(true);
    try {
      const result = await searchCandidate(phoneNumber);

      if (result.success && result.data.found) {
        setCandidateInfo(result.data.candidates[0]);
      } else {
        Alert.alert('알림', '등록된 후보자가 없습니다');
        setCandidateInfo(null);
      }
    } catch (error) {
      Alert.alert('오류', '검색 실패');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>후보자 검색</Text>

      <TextInput
        style={styles.input}
        placeholder="전화번호 입력 (예: 01012345678)"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSearch}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? '검색 중...' : '검색'}
        </Text>
      </TouchableOpacity>

      {candidateInfo && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>📞 후보자 정보</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>이름:</Text>
            <Text style={styles.value}>{candidateInfo.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>전화번호:</Text>
            <Text style={styles.value}>{candidateInfo.phone_numbers}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>진행단계:</Text>
            <Text style={styles.value}>{candidateInfo.stage}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>지원 포지션:</Text>
            <Text style={styles.value}>{candidateInfo.applied_position}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>고객사:</Text>
            <Text style={styles.value}>{candidateInfo.applied_company}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
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
  resultContainer: {
    marginTop: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    width: 100,
    fontWeight: '600',
    color: '#666',
  },
  value: {
    flex: 1,
    color: '#333',
  },
});

export default HomeScreen;
```

---

### 4.4 App.tsx 수정 (네비게이션 설정)

```bash
nano App.tsx
```

**App.tsx 내용**:
```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'SearchFirm CRM' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
```

---

## 5단계: 앱 테스트

### 5.1 개발 모드에서 테스트

```bash
# 프로젝트 폴더에서
cd ~/Projects/SearchFirmCRM

# Metro 서버 시작
npm start
```

**새 터미널에서**:
```bash
# Android 실행
npm run android
```

---

### 5.2 실제 폰에서 테스트

#### 1. Android 폰 설정

1. **설정** → **개발자 옵션** 활성화
   - 설정 → 휴대전화 정보 → 빌드번호 7번 연속 터치

2. **개발자 옵션**에서:
   - ✅ USB 디버깅 활성화
   - ✅ USB를 통한 설치 허용

3. **USB로 노트북과 폰 연결**

4. **폰에서 "USB 디버깅 허용" 팝업 → 허용**

---

#### 2. 연결 확인

```bash
# Android 기기 목록 확인
adb devices
```

**예상 출력**:
```
List of devices attached
ABC123XYZ    device
```

---

#### 3. 앱 실행

```bash
npm run android
```

앱이 자동으로 폰에 설치되고 실행됩니다!

---

### 5.3 기능 테스트 체크리스트

- [ ] 로그인 화면 표시됨
- [ ] 로그인 성공
- [ ] 홈 화면으로 이동
- [ ] 전화번호 입력 후 검색 가능
- [ ] 후보자 정보 표시됨
- [ ] 등록되지 않은 번호는 "없음" 메시지

---

## 6단계: 앱 빌드 및 출시

### 6.1 APK 파일 생성 (배포용)

#### 1. Release 키 생성

```bash
# 프로젝트 android/app 폴더로 이동
cd ~/Projects/SearchFirmCRM/android/app

# 키스토어 생성
keytool -genkeypair -v -storetype PKCS12 \
  -keystore searchfirm-release-key.keystore \
  -alias searchfirm-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000

# 비밀번호 입력 (잊지 마세요!)
# 이름, 조직 등 정보 입력
```

**주의**: `searchfirm-release-key.keystore` 파일을 안전하게 보관하세요!

---

#### 2. Gradle 설정

```bash
nano ~/Projects/SearchFirmCRM/android/gradle.properties
```

**파일 끝에 추가**:
```
MYAPP_RELEASE_STORE_FILE=searchfirm-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=searchfirm-key-alias
MYAPP_RELEASE_STORE_PASSWORD=여기에_비밀번호_입력
MYAPP_RELEASE_KEY_PASSWORD=여기에_비밀번호_입력
```

---

```bash
nano ~/Projects/SearchFirmCRM/android/app/build.gradle
```

**`android { ... }` 블록 안에 추가**:
```gradle
signingConfigs {
    release {
        if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

---

#### 3. APK 빌드

```bash
cd ~/Projects/SearchFirmCRM/android

# Release APK 생성
./gradlew assembleRelease
```

**APK 위치**:
```
~/Projects/SearchFirmCRM/android/app/build/outputs/apk/release/app-release.apk
```

---

### 6.2 APK 테스트

```bash
# APK를 실제 폰에 설치
adb install ~/Projects/SearchFirmCRM/android/app/build/outputs/apk/release/app-release.apk
```

또는 APK 파일을 폰에 복사하여 직접 설치

---

### 6.3 Google Play Store 출시 (선택)

#### AAB (Android App Bundle) 생성

```bash
cd ~/Projects/SearchFirmCRM/android
./gradlew bundleRelease
```

**AAB 위치**:
```
~/Projects/SearchFirmCRM/android/app/build/outputs/bundle/release/app-release.aab
```

---

#### Google Play Console 등록

1. **Google Play Console 접속**:
   - https://play.google.com/console

2. **개발자 계정 등록**:
   - 일회성 등록비: $25

3. **앱 만들기**:
   - 앱 이름: SearchFirm CRM
   - 카테고리: 업무용
   - 무료/유료 선택

4. **AAB 파일 업로드**:
   - 프로덕션 → 새 버전 만들기
   - `app-release.aab` 업로드

5. **스토어 등록정보 작성**:
   - 앱 설명
   - 스크린샷 (최소 2개)
   - 아이콘

6. **심사 제출**:
   - 심사 기간: 보통 1-3일

---

## 문제 해결

### 1. "SDK location not found" 에러

```bash
# android/local.properties 파일 생성
echo "sdk.dir=$HOME/Android/Sdk" > ~/Projects/SearchFirmCRM/android/local.properties
```

---

### 2. "INSTALL_FAILED" 에러

```bash
# 기존 앱 삭제 후 재설치
adb uninstall com.searchfirmcrm
npm run android
```

---

### 3. Metro 서버 연결 안 됨

```bash
# Metro 캐시 삭제
npm start -- --reset-cache
```

---

### 4. 빌드 실패 시

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
npm install

# Android 빌드 캐시 삭제
cd android
./gradlew clean
cd ..

# 재시도
npm run android
```

---

## 다음 단계

### Phase 4: 전화 감지 기능 추가

전화 수신 시 자동으로 팝업을 띄우려면:

1. **react-native-call-detection** 설치
2. **네이티브 코드 수정** (Kotlin)
3. **백그라운드 서비스** 구현
4. **오버레이 권한** 요청

이 부분은 조금 복잡하므로 기본 앱이 완성된 후 진행하는 것을 권장합니다.

---

## 📚 학습 자료

- **React Native 공식 문서**: https://reactnative.dev/
- **Android 개발자 가이드**: https://developer.android.com/
- **Stack Overflow**: 막히면 검색!

---

## 🎯 개발 진행 체크리스트

### Phase 1: 환경 설정
- [ ] Node.js 설치
- [ ] Android Studio 설치
- [ ] React Native 프로젝트 생성
- [ ] 첫 실행 성공

### Phase 2: 기본 앱 개발
- [ ] 로그인 화면 구현
- [ ] API 연동
- [ ] 후보자 검색 기능
- [ ] 실제 폰에서 테스트

### Phase 3: 배포
- [ ] APK 빌드
- [ ] 실제 폰에 설치
- [ ] (선택) Play Store 등록

### Phase 4: 고급 기능
- [ ] 전화 감지 기능
- [ ] 오버레이 팝업
- [ ] 백그라운드 서비스

---

**작성일**: 2025-11-19
**대상**: 앱 개발 초보자
**환경**: 맥북에어 (우분투), Android
**예상 완성**: 2-3주
