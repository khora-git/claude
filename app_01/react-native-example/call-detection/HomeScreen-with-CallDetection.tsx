import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { searchCandidate, logout, getCurrentUser } from '../services/api';
import CallDetectionService from '../services/CallDetectionService';
import CallOverlay from '../components/CallOverlay';

const HomeScreen = ({ navigation }: any) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [candidateInfo, setCandidateInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');

  // 전화 감지 관련 state
  const [callDetectionEnabled, setCallDetectionEnabled] = useState(false);
  const [showCallOverlay, setShowCallOverlay] = useState(false);
  const [incomingNumber, setIncomingNumber] = useState('');
  const [incomingCandidateInfo, setIncomingCandidateInfo] = useState<any>(null);

  useEffect(() => {
    loadUserInfo();
    initializeCallDetection();

    return () => {
      CallDetectionService.stopListening();
    };
  }, []);

  const loadUserInfo = async () => {
    const user = await getCurrentUser();
    if (user) {
      setUserName(user.mb_name);
    }
  };

  const initializeCallDetection = async () => {
    // 1. 기본 권한 요청
    const hasPermission = await CallDetectionService.requestPermissions();

    if (!hasPermission) {
      Alert.alert(
        '권한 필요',
        '전화 감지 기능을 사용하려면 전화 상태 읽기 권한이 필요합니다.',
        [
          { text: '나중에', style: 'cancel' },
          {
            text: '확인',
            onPress: () => {
              console.log('권한 설정으로 이동 필요');
            },
          },
        ]
      );
      return;
    }

    // 2. Android 10+ 추가 설정
    if (Platform.OS === 'android' && Platform.Version >= 29) {
      Alert.alert(
        '추가 설정 필요 (Android 10+)',
        '통화 스크리닝 앱으로 설정하면 자동으로 전화번호를 읽을 수 있습니다.\n\n설정 → 앱 → 기본 앱 → 통화 스크리닝 앱 → SearchFirm CRM 선택',
        [
          { text: '나중에', style: 'cancel' },
          {
            text: '설정하기',
            onPress: async () => {
              await CallDetectionService.requestScreeningRole();
            },
          },
        ]
      );
    }

    // 3. 전화 감지 시작
    startCallDetection();
  };

  const startCallDetection = async () => {
    const started = await CallDetectionService.startListening(
      async (phoneNumber) => {
        console.log('📞 전화 수신:', phoneNumber);
        setIncomingNumber(phoneNumber);

        // 후보자 정보 검색
        const candidate = await CallDetectionService.handleIncomingCall(phoneNumber);
        setIncomingCandidateInfo(candidate);

        // 오버레이 표시
        setShowCallOverlay(true);
      }
    );

    if (started) {
      setCallDetectionEnabled(true);
      console.log('✅ 전화 감지 활성화됨');
    } else {
      console.log('❌ 전화 감지 활성화 실패');
    }
  };

  const stopCallDetection = async () => {
    await CallDetectionService.stopListening();
    setCallDetectionEnabled(false);
    Alert.alert('전화 감지 비활성화', '전화 감지 기능이 꺼졌습니다.');
  };

  const toggleCallDetection = () => {
    if (callDetectionEnabled) {
      stopCallDetection();
    } else {
      initializeCallDetection();
    }
  };

  const handleSearch = async () => {
    if (!phoneNumber) {
      Alert.alert('입력 오류', '전화번호를 입력하세요');
      return;
    }

    setLoading(true);
    setCandidateInfo(null);

    try {
      const result = await searchCandidate(phoneNumber);

      if (result) {
        setCandidateInfo(result);
      } else {
        Alert.alert('알림', '등록된 후보자가 없습니다');
      }
    } catch (error) {
      Alert.alert('오류', '검색 실패');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '확인',
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>안녕하세요, {userName}님</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      {/* 전화 감지 상태 표시 */}
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <Text style={styles.statusIcon}>
            {callDetectionEnabled ? '📞' : '❌'}
          </Text>
          <Text style={styles.statusText}>
            {callDetectionEnabled ? '자동 감지 활성화됨' : '자동 감지 비활성화됨'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            callDetectionEnabled && styles.toggleButtonActive,
          ]}
          onPress={toggleCallDetection}
        >
          <Text style={styles.toggleButtonText}>
            {callDetectionEnabled ? 'OFF' : 'ON'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 검색 섹션 */}
      <View style={styles.searchSection}>
        <Text style={styles.title}>📞 후보자 검색</Text>

        <TextInput
          style={styles.input}
          placeholder="전화번호 입력 (예: 01012345678)"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>검색</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 후보자 정보 표시 */}
      {candidateInfo && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>후보자 정보</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>이름:</Text>
            <Text style={styles.value}>{candidateInfo.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>전화번호:</Text>
            <Text style={styles.value}>{candidateInfo.phone_numbers}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>이메일:</Text>
            <Text style={styles.value}>{candidateInfo.email || '-'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>진행단계:</Text>
            <Text style={[styles.value, styles.stage]}>{candidateInfo.stage}</Text>
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

      {/* 전화 오버레이 */}
      <CallOverlay
        visible={showCallOverlay}
        phoneNumber={incomingNumber}
        candidateInfo={incomingCandidateInfo}
        onClose={() => setShowCallOverlay(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  toggleButton: {
    backgroundColor: '#ddd',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleButtonActive: {
    backgroundColor: '#4CAF50',
  },
  toggleButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  searchSection: {
    padding: 20,
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
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
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    margin: 15,
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
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
  stage: {
    color: '#007AFF',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
});

export default HomeScreen;
