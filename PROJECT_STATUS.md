# SearchFirm CRM 앱 개발 프로젝트 - 진행 상황

## 📋 프로젝트 개요

**목표:** 컨설턴트가 후보자로부터 전화를 받을 때 자동으로 후보자 정보를 화면에 표시하는 모바일 앱 개발

**환경:**
- 백엔드: 그누보드 5.x (PHP 8.2, MariaDB 10.6.x)
- 테이블 접두사: `g5_sfs2_`
- 게시판: `project` (테이블명: `g5_sfs2_write_project`)
- 앱: React Native (Android 우선)

---

## ✅ 완료된 작업 (Phase 1: 백엔드 API 개발)

### 1. 백엔드 API 3개 완성 및 테스트 완료

#### ✅ 로그인 API (`app_login_api.php`)
- **경로:** `/api/app_login_api.php`
- **기능:** 그누보드 회원 인증 및 토큰 발급
- **테스트 결과:** ✅ 성공
- **응답 예시:**
```json
{
  "success": true,
  "data": {
    "token": "380a5798287602e4e034a61633645123",
    "user": {
      "mb_id": "admin",
      "mb_name": "관리자",
      "mb_level": "10"
    }
  }
}
```

#### ✅ 컨설턴트 목록 API (`get_consultants_api.php`)
- **경로:** `/api/get_consultants_api.php`
- **기능:** 전체 컨설턴트 연락처 조회 (mb_level = 10)
- **테스트 결과:** ✅ 성공 (4명 조회됨)
- **응답 예시:**
```json
{
  "success": true,
  "data": {
    "consultants": [
      {
        "id": "test",
        "name": "김수영",
        "nick": "김수영부장",
        "phone": "01023752234",
        "phone_formatted": "010-2375-2234",
        "email": "test@jobpost.co.kr"
      }
    ],
    "total": 4
  }
}
```

#### ✅ 후보자 검색 API (`search_candidate_api.php`) ⭐ 핵심!
- **경로:** `/api/search_candidate_api.php`
- **기능:** 전화번호로 후보자 정보 검색
- **테스트 결과:** ✅ 성공
- **응답 예시:**
```json
{
  "success": true,
  "data": {
    "found": true,
    "candidates": [
      {
        "name": "홍길선",
        "phone_numbers": "010-2375-2234",
        "stage": "컨택중",
        "applied_position": "유명 외국계 Filtration OEM Sales Engineer",
        "applied_company": "삼성엔지니어링(주)",
        "consultant_1_id": "test",
        "consultant_2_id": "admin"
      }
    ]
  }
}
```

---

## 📊 데이터베이스 구조

### 테이블: `g5_sfs2_write_project`

#### 후보자 데이터 (wr_is_comment = "1")
```
wr_21  → 후보자 이름 (예: "홍길선")
wr_3   → 전화번호 (예: "010-2375-2234")
wr_4   → 이메일
wr_content → 진행단계 (예: "컨택중")
wr_8   → 지원 포지션명
wr_12  → 지원 고객사명
wr_10  → 컨설턴트 1 ID (예: "test")
wr_22  → 컨설턴트 2 ID (예: "admin")
```

#### 회원 테이블: `g5_sfs2_member`
```
mb_level = '10' → 컨설턴트 권한
```

---

## 🔧 주요 기술 결정사항

### 1. 테이블명 자동 감지
```php
$write_table = $g5['write_prefix'] . 'project';
// → g5_sfs2_write_project
```

### 2. 전화번호 검색 (하이픈 무시)
```sql
REPLACE(REPLACE(REPLACE(wr_3, '-', ''), ' ', ''), ',', '') LIKE '%01023752234%'
```

### 3. 토큰 인증
- URL 파라미터 방식 사용: `?token=xxxxx`
- 토큰 저장 위치: `/data/app_tokens/`
- 유효기간: 30일

### 4. 컨설턴트 필터링
```sql
WHERE (wr_10 = '{mb_id}' OR wr_22 = '{mb_id}')
```
로그인한 컨설턴트가 담당한 후보자만 조회

---

## 📁 완성된 파일 목록

### 백엔드 API (서버에 업로드 완료)
```
/api/
├── app_login_api.php              ✅ 로그인
├── get_consultants_api.php        ✅ 컨설턴트 목록
├── search_candidate_api.php       ✅ 후보자 검색
└── search_candidate_api_debug.php ✅ 디버그용 (선택)
```

### 문서
```
├── API_INSTALLATION_GUIDE.md   ✅ API 설치 가이드
├── api_test.html               ✅ API 테스트 도구
└── app_dev_plan.md            ✅ 원본 개발 계획서
```

---

## 🚀 다음 단계 (Phase 2: 앱 개발)

### Step 1: 개발 환경 설정 (1일)
```bash
# 필수 설치
1. Node.js (v20+)
2. Android Studio
3. Git

# React Native 프로젝트 생성
npx react-native@latest init SearchFirmCRM
cd SearchFirmCRM
```

### Step 2: 기본 라이브러리 설치 (1일)
```bash
# API 통신
npm install axios

# 로컬 저장소
npm install @react-native-async-storage/async-storage

# 전화 감지 (나중에)
npm install react-native-call-detection
```

### Step 3: 앱 화면 구현 (1주)
```
필요한 화면 (최소 버전):
1. 로그인 화면
2. 전화 수신 팝업 (핵심!)
3. 설정 화면
```

### Step 4: 전화 감지 기능 (1주)
```
Android 권한:
- READ_PHONE_STATE
- READ_CALL_LOG
- SYSTEM_ALERT_WINDOW

네이티브 모듈 (Kotlin):
- PhoneStateReceiver
- OverlayService
```

### Step 5: 테스트 및 배포 (1주)
```
1. 실제 폰에서 테스트
2. APK 빌드
3. (선택) Google Play Store 등록
```

---

## 💡 핵심 로직 요약

### 앱이 해야 할 일:

1. **앱 시작 시**
   ```
   → app_login_api.php 호출
   → 토큰 받아서 로컬 저장
   → get_consultants_api.php 호출
   → 컨설턴트 목록 로컬 저장
   ```

2. **전화 수신 시**
   ```
   → 전화번호 감지
   → search_candidate_api.php?token=xxx&phone=xxx 호출
   → 후보자 정보 받음
   → 오버레이 팝업으로 화면에 표시
   ```

3. **팝업에 표시할 내용**
   ```
   📞 전화 수신
   ━━━━━━━━━━━━━━━━━━━━━
   후보자: 홍길선
   전화번호: 010-2375-2234
   
   📋 지원 포지션
   유명 외국계 Filtration OEM Sales Engineer
   
   🏢 지원 고객사
   삼성엔지니어링(주)
   
   📊 진행상황
   컨택중
   
   👤 담당 컨설턴트
   김수영부장, 관리자
   
   [상세보기] [통화시작]
   ```

---

## 🔐 보안 고려사항

### 현재 적용됨:
- ✅ SQL Injection 방지 (`sql_escape_string`)
- ✅ 토큰 기반 인증
- ✅ 컨설턴트 권한 체크 (mb_level = 10)
- ✅ 담당 후보자만 조회 (wr_10, wr_22)

### 향후 적용 필요:
- ⚠️ HTTPS 필수 (현재 HTTP도 가능)
- ⚠️ Rate Limiting (API 남용 방지)
- ⚠️ 토큰 갱신 메커니즘
- ⚠️ 로그아웃 시 토큰 삭제

---

## ⚙️ 서버 설정 정보

### API 주소
```
https://your-domain.com/api/
```

### 테이블 구조
```
테이블 접두사: g5_sfs2_
게시판 ID: project
전체 테이블명: g5_sfs2_write_project
```

### 컨설턴트 조건
```sql
mb_level = '10'
```

---

## 🧪 API 테스트 방법

### 1. 로그인
```bash
curl -X POST https://your-domain.com/api/app_login_api.php \
  -H "Content-Type: application/json" \
  -d '{"mb_id":"admin","mb_password":"your_password"}'
```

### 2. 컨설턴트 목록
```bash
curl "https://your-domain.com/api/get_consultants_api.php?token=380a5798287602e4e034a61633645123"
```

### 3. 후보자 검색
```bash
curl "https://your-domain.com/api/search_candidate_api.php?token=380a5798287602e4e034a61633645123&phone=01023752234"
```

---

## 📝 알려진 이슈 및 해결 방법

### Issue 1: "Table doesn't exist" 에러
**원인:** 테이블명 하드코딩
**해결:** `$g5['write_prefix'] . 'project'` 사용

### Issue 2: 전화번호 검색 안 됨
**원인:** DB에 하이픈 포함, 검색 시 하이픈 없음
**해결:** `REPLACE()` 함수로 하이픈 제거 후 비교

### Issue 3: "인증 토큰이 필요합니다" 에러
**원인:** `getallheaders()` 함수 미지원
**해결:** `$_SERVER['HTTP_AUTHORIZATION']` + URL 파라미터 방식 병행

---

## 🎯 현재 진행률

```
Phase 1: 백엔드 API 개발  [████████████████████] 100% ✅
Phase 2: 앱 개발 환경 설정 [                    ]   0% ⏳
Phase 3: 앱 기본 화면      [                    ]   0% ⏳
Phase 4: 전화 감지 기능    [                    ]   0% ⏳
Phase 5: 테스트 및 배포    [                    ]   0% ⏳
```

**전체 진행률:** 20% (1/5 완료)

---

## 📞 다음 대화에서 이어서 진행하려면

다음 대화창에서 이렇게 시작하세요:

```
"SearchFirm CRM 앱 개발 프로젝트를 이어서 진행하고 싶어요.
백엔드 API는 완성되었고, 이제 React Native 앱 개발을 시작하려고 합니다.
앱 개발 환경 설정부터 도와주세요."
```

그리고 이 문서들을 첨부하세요:
1. `PROJECT_STATUS.md` (이 파일)
2. `app_dev_plan.md` (원본 계획서)
3. `API_INSTALLATION_GUIDE.md` (API 문서)

---

## 💾 중요 파일 백업 위치

모든 파일은 다음 위치에 저장되어 있습니다:
```
/mnt/user-data/outputs/
├── app_login_api.php
├── get_consultants_api.php
├── search_candidate_api.php
├── search_candidate_api_debug.php
├── api_test.html
├── API_INSTALLATION_GUIDE.md
└── app_dev_plan.md
```

---

**작성일:** 2025-11-17  
**마지막 업데이트:** 2025-11-17 19:40  
**진행 상태:** Phase 1 완료, Phase 2 준비 중  
**다음 작업:** React Native 앱 개발 시작
