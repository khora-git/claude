# SearchFirm CRM - 백엔드 API

전화 수신 시 자동으로 후보자 정보를 표시하는 모바일 앱을 위한 백엔드 API

---

## 📁 폴더 구조

```
app_01/
├── README.md                    # 이 파일
├── docs/                        # 📚 상세 문서
│   ├── API_INSTALLATION_GUIDE.md    # 서버 설치 가이드
│   └── PROJECT_STATUS.md            # 프로젝트 진행 상황
├── server/                      # 🚀 서버에 업로드할 파일
│   ├── app_login_api.php            # 로그인 API
│   ├── get_consultants_api.php      # 컨설턴트 목록 API
│   └── search_candidate_api.php     # 후보자 검색 API (핵심!)
└── tools/                       # 🔧 테스트 도구
    ├── api_test.html                # 브라우저 테스트 도구
    └── search_candidate_api_debug.php   # 디버그용 API
```

---

## 🚀 빠른 시작 (5분 안에 테스트하기)

### 1단계: 서버에 API 파일 업로드

FTP 또는 파일 관리자로 접속:

```
그누보드 설치 경로/
└── api/                    ← 새로 만들 폴더
    ├── app_login_api.php
    ├── get_consultants_api.php
    └── search_candidate_api.php
```

**업로드할 파일:** `server/` 폴더 안의 3개 PHP 파일

**업로드 위치:** 그누보드 루트 폴더에 `/api` 폴더 생성 후 업로드

**파일 권한:** 644 (일반적으로 자동 설정됨)

---

### 2단계: 노트북에서 API 테스트

1. **노트북에 이 폴더(app_01) 다운로드**

2. **`tools/api_test.html` 파일을 브라우저로 열기**
   - 더블클릭하면 기본 브라우저에서 열림

3. **서버 URL 입력**
   ```
   https://your-domain.com/api
   ```
   (실제 도메인으로 변경하세요)

4. **로그인 정보 입력**
   - 아이디: 컨설턴트 아이디 (mb_level=10인 회원)
   - 비밀번호: 해당 비밀번호

5. **"로그인 테스트" 버튼 클릭**
   - 성공하면 토큰이 자동으로 입력됨

6. **나머지 API 테스트**
   - 컨설턴트 목록 조회
   - 후보자 검색 (전화번호 입력)

---

## ✅ 테스트 체크리스트

- [ ] 서버에 `/api` 폴더 생성됨
- [ ] 3개 PHP 파일 업로드 완료
- [ ] `api_test.html` 브라우저에서 열림
- [ ] 로그인 API 테스트 성공 ✅
- [ ] 컨설턴트 목록 API 테스트 성공 ✅
- [ ] 후보자 검색 API 테스트 성공 ✅

---

## 📱 API 기능 설명

### 1. 로그인 API (`app_login_api.php`)
- 그누보드 회원 인증
- 토큰 발급 (30일 유효)
- mb_level=10 (컨설턴트) 권한 확인

### 2. 컨설턴트 목록 API (`get_consultants_api.php`)
- 전체 컨설턴트 연락처 조회
- 앱 연락처 동기화용

### 3. 후보자 검색 API (`search_candidate_api.php`) ⭐ 핵심!
- 전화번호로 후보자 정보 조회
- 앱의 핵심 기능: 전화 수신 시 자동 정보 표시

---

## 🔧 문제 해결

### "시스템 초기화 실패" 에러
→ `server/` 폴더의 각 PHP 파일 상단에서 `common.php` 경로 확인
```php
// api 폴더가 그누보드 루트 바로 아래에 있으면:
include_once '../common.php';

// 다른 위치에 있으면:
include_once '../../common.php';  // 두 단계 위
```

### "인증 토큰이 필요합니다" 에러
→ 먼저 로그인 API 테스트 후 토큰 받아야 함

### "등록된 후보자가 없습니다" 메시지
→ 정상입니다! 입력한 전화번호가 DB에 없거나, 로그인한 컨설턴트가 담당하지 않은 후보자입니다.

**디버그 방법:**
- `tools/search_candidate_api_debug.php`를 서버에 업로드
- 같은 방법으로 테스트하면 상세한 SQL 쿼리와 에러 확인 가능

---

## 📚 상세 문서

더 자세한 정보는 `docs/` 폴더 참고:
- **API_INSTALLATION_GUIDE.md** - 서버 설치 상세 가이드
- **PROJECT_STATUS.md** - 프로젝트 전체 진행 상황

---

## 🔐 보안 주의사항

- ⚠️ **HTTPS 필수**: HTTP가 아닌 HTTPS로만 API 접근
- ⚠️ **디버그 파일**: `search_candidate_api_debug.php`는 개발용, 운영 서버에 두지 마세요
- ⚠️ **토큰 관리**: 토큰이 노출되지 않도록 주의

---

## 📞 다음 단계

백엔드 API 테스트가 성공하면:

1. **모바일 앱 개발 시작** (React Native 또는 Flutter)
2. **전화 감지 기능 추가**
3. **오버레이 팝업 구현**
4. **테스트 및 배포**

---

**작성일:** 2025-11-19
**상태:** 백엔드 API 완료, 앱 개발 준비 중
**환경:** 그누보드 5.x (PHP 8.2, MariaDB 10.6.x)
