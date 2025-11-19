#!/bin/bash

# SearchFirm CRM 개발 환경 체크 스크립트
# 우분투에서 React Native 개발 환경이 제대로 설정되었는지 확인합니다

echo "======================================"
echo "  SearchFirm CRM 개발 환경 체크"
echo "======================================"
echo ""

# 색상 코드
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 체크 카운터
PASS=0
FAIL=0
WARN=0

# 1. Node.js 체크
echo -n "Node.js 확인 중... "
if command -v node &> /dev/null
then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} 설치됨 ($NODE_VERSION)"
    PASS=$((PASS+1))
else
    echo -e "${RED}✗${NC} 설치되지 않음"
    echo "   → NVM 또는 공식 홈페이지에서 Node.js 설치 필요"
    FAIL=$((FAIL+1))
fi

# 2. npm 체크
echo -n "npm 확인 중... "
if command -v npm &> /dev/null
then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} 설치됨 (v$NPM_VERSION)"
    PASS=$((PASS+1))
else
    echo -e "${RED}✗${NC} 설치되지 않음"
    FAIL=$((FAIL+1))
fi

# 3. Java (JDK) 체크
echo -n "Java JDK 확인 중... "
if command -v java &> /dev/null
then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | awk -F '"' '{print $2}')
    echo -e "${GREEN}✓${NC} 설치됨 ($JAVA_VERSION)"
    PASS=$((PASS+1))
else
    echo -e "${RED}✗${NC} 설치되지 않음"
    echo "   → sudo apt install openjdk-17-jdk"
    FAIL=$((FAIL+1))
fi

# 4. Android SDK 환경 변수 체크
echo -n "ANDROID_HOME 환경 변수 확인 중... "
if [ -z "$ANDROID_HOME" ]; then
    echo -e "${RED}✗${NC} 설정되지 않음"
    echo "   → ~/.bashrc 파일에 ANDROID_HOME 추가 필요"
    FAIL=$((FAIL+1))
else
    echo -e "${GREEN}✓${NC} 설정됨 ($ANDROID_HOME)"
    PASS=$((PASS+1))
fi

# 5. Android SDK 실제 설치 확인
echo -n "Android SDK 설치 확인 중... "
if [ -d "$ANDROID_HOME" ]; then
    echo -e "${GREEN}✓${NC} 설치됨"
    PASS=$((PASS+1))
else
    echo -e "${RED}✗${NC} 폴더가 존재하지 않음"
    echo "   → Android Studio에서 SDK 설치 필요"
    FAIL=$((FAIL+1))
fi

# 6. adb (Android Debug Bridge) 체크
echo -n "adb 확인 중... "
if command -v adb &> /dev/null
then
    ADB_VERSION=$(adb --version | head -n 1)
    echo -e "${GREEN}✓${NC} 설치됨 ($ADB_VERSION)"
    PASS=$((PASS+1))
else
    echo -e "${RED}✗${NC} 설치되지 않음"
    echo "   → Android SDK Platform-Tools 설치 필요"
    FAIL=$((FAIL+1))
fi

# 7. Watchman 체크 (선택 사항)
echo -n "Watchman 확인 중... "
if command -v watchman &> /dev/null
then
    WATCHMAN_VERSION=$(watchman --version)
    echo -e "${GREEN}✓${NC} 설치됨 (v$WATCHMAN_VERSION)"
    PASS=$((PASS+1))
else
    echo -e "${YELLOW}⚠${NC} 설치되지 않음 (권장)"
    echo "   → 파일 변경 감지를 위해 설치 권장: sudo apt install watchman"
    WARN=$((WARN+1))
fi

# 8. Git 체크
echo -n "Git 확인 중... "
if command -v git &> /dev/null
then
    GIT_VERSION=$(git --version | awk '{print $3}')
    echo -e "${GREEN}✓${NC} 설치됨 (v$GIT_VERSION)"
    PASS=$((PASS+1))
else
    echo -e "${RED}✗${NC} 설치되지 않음"
    echo "   → sudo apt install git"
    FAIL=$((FAIL+1))
fi

# 9. React Native CLI 체크 (선택 사항)
echo -n "React Native CLI 확인 중... "
if npm list -g react-native-cli &> /dev/null || command -v react-native &> /dev/null
then
    echo -e "${GREEN}✓${NC} 설치됨"
    PASS=$((PASS+1))
else
    echo -e "${YELLOW}⚠${NC} 설치되지 않음 (npx 사용 가능)"
    echo "   → npm install -g react-native-cli (또는 npx 사용)"
    WARN=$((WARN+1))
fi

# 10. Android 기기 연결 체크 (선택 사항)
echo -n "연결된 Android 기기 확인 중... "
if command -v adb &> /dev/null
then
    DEVICES=$(adb devices | grep -w "device" | wc -l)
    if [ $DEVICES -gt 0 ]; then
        echo -e "${GREEN}✓${NC} $DEVICES 대 연결됨"
        PASS=$((PASS+1))
    else
        echo -e "${YELLOW}⚠${NC} 연결된 기기 없음"
        echo "   → USB 디버깅을 활성화한 Android 기기 연결 또는 에뮬레이터 실행"
        WARN=$((WARN+1))
    fi
else
    echo -e "${YELLOW}⚠${NC} adb가 없어 확인 불가"
    WARN=$((WARN+1))
fi

# 11. Android SDK Build Tools 확인
echo -n "Android SDK Build Tools 확인 중... "
if [ -d "$ANDROID_HOME/build-tools" ] && [ "$(ls -A $ANDROID_HOME/build-tools)" ]; then
    LATEST_BUILD_TOOLS=$(ls -v $ANDROID_HOME/build-tools | tail -n 1)
    echo -e "${GREEN}✓${NC} 설치됨 (최신: $LATEST_BUILD_TOOLS)"
    PASS=$((PASS+1))
else
    echo -e "${RED}✗${NC} 설치되지 않음"
    echo "   → Android Studio SDK Manager에서 Build Tools 설치"
    FAIL=$((FAIL+1))
fi

# 12. Android Platform (API Level) 확인
echo -n "Android Platform 확인 중... "
if [ -d "$ANDROID_HOME/platforms" ] && [ "$(ls -A $ANDROID_HOME/platforms)" ]; then
    PLATFORMS=$(ls $ANDROID_HOME/platforms | tr '\n' ', ' | sed 's/,$//')
    echo -e "${GREEN}✓${NC} 설치됨"
    echo "   설치된 플랫폼: $PLATFORMS"
    PASS=$((PASS+1))
else
    echo -e "${RED}✗${NC} 설치되지 않음"
    echo "   → Android Studio SDK Manager에서 Platform 설치 (API 31, 33, 34 권장)"
    FAIL=$((FAIL+1))
fi

# 결과 요약
echo ""
echo "======================================"
echo "  체크 결과"
echo "======================================"
echo -e "${GREEN}통과:${NC} $PASS"
echo -e "${YELLOW}경고:${NC} $WARN"
echo -e "${RED}실패:${NC} $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ 개발 환경이 준비되었습니다!${NC}"
    echo ""
    echo "다음 단계:"
    echo "  1. React Native 프로젝트 생성:"
    echo "     npx react-native@latest init SearchFirmCRM"
    echo ""
    echo "  2. 프로젝트 폴더로 이동:"
    echo "     cd SearchFirmCRM"
    echo ""
    echo "  3. 앱 실행:"
    echo "     npm run android"
    echo ""
    exit 0
else
    echo -e "${RED}✗ 개발 환경 설정이 완료되지 않았습니다${NC}"
    echo ""
    echo "위의 실패 항목을 먼저 해결해주세요."
    echo "자세한 설정 방법은 UBUNTU_DEV_SETUP.md 문서를 참고하세요."
    echo ""
    exit 1
fi
