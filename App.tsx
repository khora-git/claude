import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Button,
  Alert,
  NativeModules,
  NativeEventEmitter,
  PermissionsAndroid,
  Platform,
} from 'react-native';

import { searchCandidateApi } from './src/services/api';

const { PhoneStateModule } = NativeModules;

function App(): React.JSX.Element {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [lastIncomingCall, setLastIncomingCall] = useState<string | null>(null);
  const [candidateInfo, setCandidateInfo] = useState<any>(null);

  // API 키 (실제로는 로그인 후 받아야 함)
  const API_KEY = 'your_api_key_here';

  useEffect(() => {
    checkPermissions();
    setupPhoneStateListener();
  }, []);

  const checkPermissions = async () => {
    try {
      const permissions = await PhoneStateModule.checkPermissions();
      setHasPermissions(permissions.phoneState && permissions.callLog);
    } catch (error) {
      console.error('Permission check error:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
          PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        ]);

        const allGranted = Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );

        setHasPermissions(allGranted);

        if (allGranted) {
          Alert.alert('성공', '모든 권한이 허용되었습니다!');
        } else {
          Alert.alert('경고', '일부 권한이 거부되었습니다.');
        }
      }
    } catch (error) {
      console.error('Permission request error:', error);
      Alert.alert('오류', '권한 요청 중 오류가 발생했습니다.');
    }
  };

  const setupPhoneStateListener = () => {
    const eventEmitter = new NativeEventEmitter(PhoneStateModule);

    eventEmitter.addListener('onIncomingCall', async (event) => {
      console.log('Incoming call event:', event);
      const phoneNumber = event.phoneNumber;

      setLastIncomingCall(phoneNumber);

      // 후보자 정보 검색
      try {
        const result = await searchCandidateApi(API_KEY, phoneNumber);

        if (result.status === 'success' && result.data) {
          setCandidateInfo(result.data);

          // 팝업 표시
          Alert.alert(
            '후보자 정보',
            `이름: ${result.data.name}\n` +
            `회사: ${result.data.company || '정보 없음'}\n` +
            `직급: ${result.data.position || '정보 없음'}\n` +
            `컨설턴트: ${result.data.consultant_name || '정보 없음'}`,
            [{ text: '확인' }]
          );
        } else {
          Alert.alert(
            '후보자 정보 없음',
            `전화번호: ${phoneNumber}\n등록된 후보자가 아닙니다.`,
            [{ text: '확인' }]
          );
        }
      } catch (error) {
        console.error('Candidate search error:', error);
        Alert.alert('오류', '후보자 정보를 가져오는데 실패했습니다.');
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>SearchFirm CRM</Text>
          <Text style={styles.subtitle}>전화 수신 시 후보자 정보 표시</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>권한 상태</Text>
          <Text style={styles.text}>
            {hasPermissions ? '✅ 모든 권한 허용됨' : '❌ 권한 필요'}
          </Text>
          {!hasPermissions && (
            <Button title="권한 요청" onPress={requestPermissions} />
          )}
        </View>

        {lastIncomingCall && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>최근 수신 전화</Text>
            <Text style={styles.text}>전화번호: {lastIncomingCall}</Text>
            {candidateInfo && (
              <View style={styles.candidateInfo}>
                <Text style={styles.text}>이름: {candidateInfo.name}</Text>
                <Text style={styles.text}>
                  회사: {candidateInfo.company || '정보 없음'}
                </Text>
                <Text style={styles.text}>
                  직급: {candidateInfo.position || '정보 없음'}
                </Text>
                <Text style={styles.text}>
                  컨설턴트: {candidateInfo.consultant_name || '정보 없음'}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>사용 방법</Text>
          <Text style={styles.text}>
            1. 권한 요청 버튼을 클릭하여 모든 권한을 허용하세요.
          </Text>
          <Text style={styles.text}>
            2. 다른 폰에서 이 폰으로 전화를 걸어보세요.
          </Text>
          <Text style={styles.text}>
            3. 후보자 정보 팝업이 나타납니다!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  candidateInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});

export default App;
