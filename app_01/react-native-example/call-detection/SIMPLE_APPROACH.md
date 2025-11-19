# 간단한 접근 방법: 빠른 검색 버튼

Android 10+ 제한 때문에 전화번호를 자동으로 읽기 어렵습니다.
대신 **빠른 검색 기능**을 추가하는 것을 권장합니다.

## 🎯 개선된 접근 방법

### 현재 상황
- ✅ 로그인 기능 작동
- ✅ 수동 전화번호 검색 작동
- ❌ 자동 전화 감지 (Android 10+ 제한)

### 권장 해결책

전화가 오면:
1. 사용자가 앱을 빠르게 열고
2. 최근 입력한 번호나 즐겨찾기에서 선택
3. 또는 빠르게 번호 입력

## 📱 구현: 빠른 검색 기능

### src/screens/HomeScreen.tsx 개선

기존 코드에 다음 기능 추가:

```typescript
const HomeScreen = ({ navigation }: any) => {
  // ... 기존 state ...

  // 검색 기록 저장
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // 컴포넌트 마운트 시 검색 기록 불러오기
  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('search_history');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveToHistory = async (phone: string) => {
    try {
      const newHistory = [phone, ...searchHistory.filter(p => p !== phone)].slice(0, 5);
      setSearchHistory(newHistory);
      await AsyncStorage.setItem('search_history', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
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
        // 검색 기록에 저장
        await saveToHistory(phoneNumber);
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

  const quickSearch = async (phone: string) => {
    setPhoneNumber(phone);
    // 자동 검색
    setLoading(true);
    try {
      const result = await searchCandidate(phone);
      if (result) {
        setCandidateInfo(result);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
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

      {/* 검색 기록 - 빠른 검색 */}
      {searchHistory.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>⚡ 최근 검색</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {searchHistory.map((phone, index) => (
              <TouchableOpacity
                key={index}
                style={styles.historyItem}
                onPress={() => quickSearch(phone)}
              >
                <Text style={styles.historyText}>{phone}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 기존 검색 섹션 */}
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

      {/* 후보자 정보 표시 (기존 코드) */}
      {candidateInfo && (
        <View style={styles.resultContainer}>
          {/* ... */}
        </View>
      )}
    </ScrollView>
  );
};

// 스타일 추가
const additionalStyles = {
  historySection: {
    padding: 15,
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  historyItem: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  historyText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
};
```

## ✨ 추가 기능 제안

### 1. 위젯 (홈 화면 바로가기)

앱을 빠르게 열 수 있는 위젯 추가

### 2. 플로팅 버튼

전화 앱 위에 떠있는 검색 버튼 (오버레이 권한 필요)

### 3. 음성 입력

전화번호를 말로 입력

### 4. QR 코드 스캔

명함의 QR 코드를 스캔해서 바로 검색

## 🚀 구현 우선순위

1. **✅ 완료**: 로그인, 기본 검색
2. **🔄 진행 중**: 검색 기록 (빠른 검색)
3. **⏳ 다음**:
   - 플로팅 버튼
   - 위젯
   - 음성 입력

## 💡 실용적인 사용 시나리오

### 시나리오 1: 등록된 후보자
1. 전화가 옴
2. 앱을 열고 (빠른 실행)
3. 최근 검색에서 번호 탭 (1초)
4. 후보자 정보 확인 후 통화

### 시나리오 2: 새로운 번호
1. 전화가 옴
2. 전화번호 기억 (또는 메모)
3. 앱 열고 검색
4. 없으면 새 후보자로 등록 (향후 기능)

## 📊 현실적인 기대

- ❌ 완전 자동 (Android 제한)
- ✅ 매우 빠른 수동 검색 (1-2초)
- ✅ 검색 기록으로 더 빠르게
- ✅ 플로팅 버튼으로 앱 전환 없이

---

**결론**: 완전 자동보다는 "매우 빠른 수동"이 현실적입니다.

**작성일:** 2025-11-19
