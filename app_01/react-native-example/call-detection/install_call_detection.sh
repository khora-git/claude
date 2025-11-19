#!/bin/bash

# SearchFirm CRM - 전화 감지 기능 설치 스크립트

echo "======================================"
echo "  전화 감지 기능 설치 시작"
echo "======================================"
echo ""

# 프로젝트 경로 확인
if [ ! -d "~/Projects/SearchFirmCRM" ]; then
    echo "❌ SearchFirmCRM 프로젝트를 찾을 수 없습니다."
    echo "   경로: ~/Projects/SearchFirmCRM"
    exit 1
fi

cd ~/Projects/SearchFirmCRM

echo "✅ 프로젝트 경로 확인 완료"
echo ""

# 1. components 폴더 생성
echo "[1/5] components 폴더 생성 중..."
mkdir -p src/components
echo "✅ 완료"
echo ""

# 2. 파일 복사
echo "[2/5] 전화 감지 파일 복사 중..."

# CallDetectionService.ts 복사
if [ -f "~/claude/app_01/react-native-example/call-detection/CallDetectionService.ts" ]; then
    cp ~/claude/app_01/react-native-example/call-detection/CallDetectionService.ts src/services/
    echo "  ✓ CallDetectionService.ts 복사 완료"
else
    echo "  ❌ CallDetectionService.ts 파일을 찾을 수 없습니다"
fi

# CallOverlay.tsx 복사
if [ -f "~/claude/app_01/react-native-example/call-detection/CallOverlay.tsx" ]; then
    cp ~/claude/app_01/react-native-example/call-detection/CallOverlay.tsx src/components/
    echo "  ✓ CallOverlay.tsx 복사 완료"
else
    echo "  ❌ CallOverlay.tsx 파일을 찾을 수 없습니다"
fi

echo "✅ 파일 복사 완료"
echo ""

# 3. AndroidManifest.xml 백업
echo "[3/5] AndroidManifest.xml 백업 중..."
cp android/app/src/main/AndroidManifest.xml android/app/src/main/AndroidManifest.xml.backup
echo "✅ 백업 완료: AndroidManifest.xml.backup"
echo ""

# 4. 권한 추가 안내
echo "[4/5] Android 권한 설정 필요"
echo ""
echo "다음 권한을 AndroidManifest.xml에 수동으로 추가해야 합니다:"
echo ""
echo "파일: android/app/src/main/AndroidManifest.xml"
echo ""
echo "추가할 내용 (<manifest> 태그 안에):"
echo "---"
echo '<uses-permission android:name="android.permission.READ_PHONE_STATE" />'
echo '<uses-permission android:name="android.permission.READ_CALL_LOG" />'
echo '<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />'
echo "---"
echo ""
echo "수동 추가 후 Enter를 눌러 계속 진행하세요..."
read

# 5. 라이브러리 설치
echo "[5/5] 라이브러리 설치 중..."
npm install react-native-permissions

echo ""
echo "======================================"
echo "  설치 완료!"
echo "======================================"
echo ""
echo "다음 단계:"
echo ""
echo "1. HomeScreen.tsx 수정:"
echo "   - CallDetectionService import"
echo "   - CallOverlay import"
echo "   - 전화 감지 로직 추가"
echo ""
echo "2. 앱 재빌드:"
echo "   cd android && ./gradlew clean && cd .."
echo "   npm run android"
echo ""
echo "3. 테스트:"
echo "   - 앱 실행 후 권한 허용"
echo "   - 다른 폰에서 전화 걸기"
echo "   - 팝업 확인"
echo ""
echo "자세한 내용은 CALL_DETECTION_GUIDE.md 참고하세요."
echo ""
