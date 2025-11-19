#!/bin/bash

# SearchFirm CRM - 완성된 파일 복사 스크립트
# 전화 감지 기능이 추가된 HomeScreen.tsx 복사

echo "======================================"
echo "  파일 복사 시작"
echo "======================================"
echo ""

PROJECT_DIR="$HOME/Projects/SearchFirmCRM"

# 프로젝트 경로 확인
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ SearchFirmCRM 프로젝트를 찾을 수 없습니다."
    echo "   경로: $PROJECT_DIR"
    exit 1
fi

echo "✅ 프로젝트 경로 확인 완료"
echo ""

# 1. HomeScreen.tsx 백업
echo "[1/3] 기존 HomeScreen.tsx 백업 중..."
if [ -f "$PROJECT_DIR/src/screens/HomeScreen.tsx" ]; then
    cp "$PROJECT_DIR/src/screens/HomeScreen.tsx" \
       "$PROJECT_DIR/src/screens/HomeScreen.tsx.backup"
    echo "✅ 백업 완료: HomeScreen.tsx.backup"
else
    echo "⚠️  기존 파일이 없습니다 (신규 생성)"
fi
echo ""

# 2. 전화 감지 기능이 추가된 HomeScreen.tsx 복사
echo "[2/3] 전화 감지 기능이 추가된 HomeScreen.tsx 복사 중..."
if [ -f "$HOME/claude/app_01/react-native-example/call-detection/HomeScreen-with-CallDetection.tsx" ]; then
    cp "$HOME/claude/app_01/react-native-example/call-detection/HomeScreen-with-CallDetection.tsx" \
       "$PROJECT_DIR/src/screens/HomeScreen.tsx"
    echo "✅ 복사 완료"
else
    echo "❌ HomeScreen-with-CallDetection.tsx 파일을 찾을 수 없습니다"
    echo "   먼저 GitHub에서 최신 코드를 pull 하세요:"
    echo "   cd ~/claude && git pull"
    exit 1
fi
echo ""

# 3. CallOverlay.tsx 복사 (없으면)
echo "[3/3] CallOverlay.tsx 확인 중..."
if [ ! -f "$PROJECT_DIR/src/components/CallOverlay.tsx" ]; then
    echo "  CallOverlay.tsx가 없습니다. 복사합니다..."
    mkdir -p "$PROJECT_DIR/src/components"

    if [ -f "$HOME/claude/app_01/react-native-example/call-detection/CallOverlay.tsx" ]; then
        cp "$HOME/claude/app_01/react-native-example/call-detection/CallOverlay.tsx" \
           "$PROJECT_DIR/src/components/"
        echo "✅ CallOverlay.tsx 복사 완료"
    else
        echo "❌ CallOverlay.tsx 파일을 찾을 수 없습니다"
    fi
else
    echo "✅ CallOverlay.tsx가 이미 있습니다"
fi
echo ""

echo "======================================"
echo "  복사 완료!"
echo "======================================"
echo ""
echo "복사된 파일:"
echo "  - src/screens/HomeScreen.tsx (전화 감지 기능 추가됨)"
echo "  - src/components/CallOverlay.tsx"
echo ""
echo "백업 파일:"
echo "  - src/screens/HomeScreen.tsx.backup"
echo ""
echo "다음 단계:"
echo "  1. 앱 빌드:"
echo "     cd $PROJECT_DIR"
echo "     npm run android"
echo ""
echo "  2. 앱 실행 후:"
echo "     - 권한 허용"
echo "     - Android 10+: 통화 스크리닝 앱 설정"
echo "     - 테스트 전화 걸기"
echo ""
