#!/bin/bash

# SearchFirm CRM - 완전 자동 전화 감지 설치 스크립트
# CallScreeningService + BroadcastReceiver 구현

echo "======================================"
echo "  완전 자동 전화 감지 기능 설치"
echo "======================================"
echo ""
echo "Android 10+: CallScreeningService"
echo "Android 9 이하: BroadcastReceiver"
echo "모든 버전에서 자동 전화번호 읽기 가능!"
echo ""

# 프로젝트 경로 확인
if [ ! -d "$HOME/Projects/SearchFirmCRM" ]; then
    echo "❌ SearchFirmCRM 프로젝트를 찾을 수 없습니다."
    echo "   경로: ~/Projects/SearchFirmCRM"
    exit 1
fi

cd $HOME/Projects/SearchFirmCRM

echo "✅ 프로젝트 경로 확인 완료"
echo ""

# 1. calldetection 네이티브 폴더 생성
echo "[1/8] Android 네이티브 코드 폴더 생성 중..."
mkdir -p android/app/src/main/java/com/searchfirmcrm/calldetection
echo "✅ 완료"
echo ""

# 2. 네이티브 파일 복사
echo "[2/8] Android 네이티브 파일 복사 중..."

if [ -d "$HOME/claude/app_01/react-native-example/call-detection/android-native" ]; then
    cp $HOME/claude/app_01/react-native-example/call-detection/android-native/*.kt \
       android/app/src/main/java/com/searchfirmcrm/calldetection/

    echo "  ✓ MyCallScreeningService.kt 복사 완료"
    echo "  ✓ PhoneCallReceiver.kt 복사 완료"
    echo "  ✓ CallDetectionModule.kt 복사 완료"
    echo "  ✓ CallDetectionPackage.kt 복사 완료"
    echo "✅ 완료"
else
    echo "❌ 네이티브 파일을 찾을 수 없습니다"
    echo "   먼저 GitHub에서 최신 코드를 pull 하세요:"
    echo "   cd ~/claude && git pull"
    exit 1
fi
echo ""

# 3. components 폴더 생성
echo "[3/8] components 폴더 생성 중..."
mkdir -p src/components
echo "✅ 완료"
echo ""

# 4. CallOverlay.tsx 복사
echo "[4/8] CallOverlay.tsx 복사 중..."
if [ -f "$HOME/claude/app_01/react-native-example/call-detection/CallOverlay.tsx" ]; then
    cp $HOME/claude/app_01/react-native-example/call-detection/CallOverlay.tsx src/components/
    echo "✅ 완료"
else
    echo "⚠️  CallOverlay.tsx 파일을 찾을 수 없습니다"
fi
echo ""

# 5. CallDetectionService.ts 교체
echo "[5/8] CallDetectionService.ts 업데이트 중..."
if [ -f "src/services/CallDetectionService.ts" ]; then
    mv src/services/CallDetectionService.ts src/services/CallDetectionService.ts.backup
    echo "  ✓ 기존 파일 백업 완료"
fi

if [ -f "$HOME/claude/app_01/react-native-example/call-detection/CallDetectionService-Full.ts" ]; then
    cp $HOME/claude/app_01/react-native-example/call-detection/CallDetectionService-Full.ts \
       src/services/CallDetectionService.ts
    echo "✅ 완료"
else
    echo "⚠️  CallDetectionService-Full.ts 파일을 찾을 수 없습니다"
fi
echo ""

# 6. AndroidManifest.xml 백업
echo "[6/8] AndroidManifest.xml 백업 중..."
cp android/app/src/main/AndroidManifest.xml android/app/src/main/AndroidManifest.xml.backup
echo "✅ 백업 완료"
echo ""

# 7. 수동 설정 안내
echo "[7/8] 수동 설정 필요 항목"
echo ""
echo "다음 파일들을 수동으로 수정해야 합니다:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  MainApplication.kt 수정"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "파일: android/app/src/main/java/com/searchfirmcrm/MainApplication.kt"
echo ""
echo "추가할 import:"
echo "import com.searchfirmcrm.calldetection.CallDetectionPackage"
echo ""
echo "getPackages() 함수에 추가:"
echo "add(CallDetectionPackage())"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  AndroidManifest.xml 수정"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "파일: android/app/src/main/AndroidManifest.xml"
echo ""
echo "<manifest> 태그 안에 권한 추가:"
echo '<uses-permission android:name="android.permission.READ_PHONE_STATE" />'
echo '<uses-permission android:name="android.permission.READ_CALL_LOG" />'
echo '<uses-permission android:name="android.permission.READ_PHONE_NUMBERS" />'
echo ""
echo "<application> 태그 안에 추가:"
echo '<service'
echo '    android:name=".calldetection.MyCallScreeningService"'
echo '    android:permission="android.permission.BIND_SCREENING_SERVICE"'
echo '    android:exported="true">'
echo '    <intent-filter>'
echo '        <action android:name="android.telecom.CallScreeningService" />'
echo '    </intent-filter>'
echo '</service>'
echo ""
echo '<receiver'
echo '    android:name=".calldetection.PhoneCallReceiver"'
echo '    android:exported="true">'
echo '    <intent-filter>'
echo '        <action android:name="android.intent.action.PHONE_STATE" />'
echo '    </intent-filter>'
echo '</receiver>'
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "자세한 내용은 다음 파일 참고:"
echo "~/claude/app_01/react-native-example/call-detection/FULL_AUTO_DETECTION_GUIDE.md"
echo ""
echo "수동 수정 완료 후 Enter를 눌러 계속..."
read

# 8. 빌드 캐시 삭제
echo ""
echo "[8/8] Android 빌드 캐시 삭제 중..."
cd android
./gradlew clean
cd ..
echo "✅ 완료"
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
echo "   (가이드 문서 참고)"
echo ""
echo "2. 앱 빌드:"
echo "   npm run android"
echo ""
echo "3. 앱 실행 후:"
echo "   - 권한 허용"
echo "   - Android 10+: 통화 스크리닝 앱 설정"
echo "   - 테스트 전화 걸기"
echo ""
echo "자세한 가이드:"
echo "cat ~/claude/app_01/react-native-example/call-detection/FULL_AUTO_DETECTION_GUIDE.md"
echo ""
