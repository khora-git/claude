import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';

interface CandidateInfo {
  name: string;
  phone_numbers: string;
  email: string;
  stage: string;
  applied_position: string;
  applied_company: string;
}

interface CallOverlayProps {
  visible: boolean;
  phoneNumber: string;
  candidateInfo: CandidateInfo | null;
  loading?: boolean;
  onClose: () => void;
}

const CallOverlay: React.FC<CallOverlayProps> = ({
  visible,
  phoneNumber,
  candidateInfo,
  loading = false,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerText}>📞 수신 전화</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.phoneNumber}>{phoneNumber}</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>검색 중...</Text>
            </View>
          ) : candidateInfo ? (
            <ScrollView style={styles.scrollContainer}>
              <View style={styles.infoContainer}>
                <Text style={styles.title}>✅ 후보자 정보</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>이름:</Text>
                  <Text style={styles.value}>{candidateInfo.name}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.label}>진행단계:</Text>
                  <Text style={[styles.value, styles.stage]}>
                    {candidateInfo.stage}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>지원 포지션:</Text>
                  <Text style={styles.value}>{candidateInfo.applied_position}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>고객사:</Text>
                  <Text style={styles.value}>{candidateInfo.applied_company}</Text>
                </View>

                {candidateInfo.email && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>이메일:</Text>
                    <Text style={[styles.value, styles.email]}>
                      {candidateInfo.email}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.notFoundContainer}>
              <Text style={styles.notFoundIcon}>❌</Text>
              <Text style={styles.notFoundText}>
                등록된 후보자가 아닙니다
              </Text>
              <Text style={styles.notFoundSubText}>
                새로운 연락처일 수 있습니다
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: Dimensions.get('window').width * 0.92,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    maxHeight: Dimensions.get('window').height * 0.75,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 32,
    color: '#999',
    lineHeight: 32,
  },
  phoneNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#007AFF',
    marginBottom: 20,
    paddingVertical: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  scrollContainer: {
    maxHeight: Dimensions.get('window').height * 0.4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  infoContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2c3e50',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingVertical: 4,
  },
  label: {
    width: 90,
    fontWeight: '600',
    color: '#7f8c8d',
    fontSize: 14,
  },
  value: {
    flex: 1,
    color: '#2c3e50',
    fontSize: 14,
    lineHeight: 20,
  },
  stage: {
    color: '#27ae60',
    fontWeight: '700',
    fontSize: 15,
  },
  email: {
    color: '#3498db',
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  notFoundContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff9f9',
    borderRadius: 12,
    marginBottom: 15,
  },
  notFoundIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  notFoundText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 5,
  },
  notFoundSubText: {
    fontSize: 14,
    color: '#95a5a6',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default CallOverlay;
