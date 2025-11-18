# CLAUDE.md - AI Assistant Guide for SearchFirm CRM Project

**Last Updated:** 2025-11-18
**Project Status:** Phase 1 Complete (Backend APIs), Phase 2 Pending (Mobile App Development)
**Language:** Korean (KO) & English (EN)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Repository Structure](#repository-structure)
4. [Architecture & Design Patterns](#architecture--design-patterns)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Security & Authentication](#security--authentication)
8. [Development Workflow](#development-workflow)
9. [Testing](#testing)
10. [Common Tasks](#common-tasks)
11. [Known Issues & Solutions](#known-issues--solutions)
12. [AI Assistant Guidelines](#ai-assistant-guidelines)
13. [Next Steps](#next-steps)

---

## Project Overview

### Purpose
Develop a mobile CRM application for recruitment consultants that automatically displays candidate information when receiving phone calls.

### Core Functionality
- **Backend (Complete):** RESTful APIs for authentication, consultant management, and candidate search
- **Frontend (Planned):** React Native mobile app (Android priority) with phone call detection

### Business Context
- **Users:** Recruitment consultants (컨설턴트) with `mb_level = 10`
- **Use Case:** When a consultant receives a call, the app automatically shows:
  - Candidate name and contact information
  - Applied position and company
  - Interview stage/progress
  - Assigned consultants

### Current Phase
✅ **Phase 1 Complete:** Backend API Development (100%)
⏳ **Phase 2 Pending:** React Native App Development (0%)

---

## Technology Stack

### Backend (Current)
- **Framework:** GnuBoard 5.x (Korean CMS/Framework)
- **Language:** PHP 8.2+
- **Database:** MariaDB 10.6.x
- **Authentication:** File-based token system (JSON files in `/data/app_tokens/`)
- **API Style:** REST with JSON responses

### Frontend (Planned)
- **Framework:** React Native
- **Platform:** Android (primary), iOS (future)
- **Key Libraries:**
  - `axios` - HTTP client
  - `@react-native-async-storage/async-storage` - Local storage
  - `react-native-call-detection` - Phone state monitoring

### Environment Details
- **Table Prefix:** `g5_sfs2_`
- **Board ID:** `project`
- **Full Table Name:** `g5_sfs2_write_project`
- **Data Directory:** `/data/` (relative to GnuBoard root)
- **API Directory:** `/api/` (relative to GnuBoard root)

---

## Repository Structure

```
/
├── api_test.html                   # Interactive API testing tool (browser-based)
├── app_login_api.php              # Login & authentication API
├── get_consultants_api.php        # Consultant directory API
├── search_candidate_api.php       # Candidate search API (core feature)
├── search_candidate_api_debug.php # Debug version with verbose logging
├── API_INSTALLATION_GUIDE.md      # Detailed setup instructions
├── PROJECT_STATUS.md              # Project progress & roadmap
├── CLAUDE.md                      # This file - AI assistant guide
└── app/                           # Mobile app directory (future)
    └── 1.txt                      # Placeholder
```

### File Purposes

| File | Purpose | Status |
|------|---------|--------|
| `app_login_api.php` | Authenticates consultants, returns token | ✅ Production Ready |
| `get_consultants_api.php` | Returns all consultants for contact sync | ✅ Production Ready |
| `search_candidate_api.php` | Searches candidates by phone number | ✅ Production Ready |
| `search_candidate_api_debug.php` | Debug version with SQL logging | 🔧 Development Only |
| `api_test.html` | Manual API testing interface | 🧪 Testing Tool |

---

## Architecture & Design Patterns

### API Architecture

All APIs follow this structure:

```php
1. Include GnuBoard common.php (with fallback paths)
2. Set JSON headers & CORS
3. Handle OPTIONS preflight
4. Try-Catch error handling
5. Token validation (except login API)
6. Input validation & sanitization
7. Database query with prepared statements
8. JSON response with standard format
```

### Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response-specific data
  },
  "message": "Operation description"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

### Error Codes

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| `SYSTEM_ERROR` | Cannot load GnuBoard common.php | 500 |
| `INVALID_METHOD` | Wrong HTTP method | 405 |
| `LOGIN_FAILED` | Authentication failure | 401 |
| `FETCH_FAILED` | Data retrieval error | 500 |
| `SEARCH_FAILED` | Search operation error | 500 |

### Token Management

**Token Generation:**
```php
$token = md5($mb_id . time() . uniqid());
```

**Token Storage:**
- Location: `/data/app_tokens/{token}.json`
- Format: JSON with `mb_id`, `mb_name`, `created_at`, `expires_at`
- Expiration: 30 days from creation
- Validation: File existence + expiration check

**Token Usage:**
Multiple methods supported (in priority order):
1. `Authorization: Bearer {token}` header (standard)
2. `?token={token}` GET parameter
3. `token={token}` POST parameter
4. JSON body `{"token": "..."}`

---

## Database Schema

### Tables Used

#### 1. `g5_sfs2_member` (Consultant Information)

```sql
-- Key fields for consultants
mb_id         VARCHAR     -- Consultant username
mb_name       VARCHAR     -- Full name
mb_nick       VARCHAR     -- Nickname/display name
mb_email      VARCHAR     -- Email address
mb_hp         VARCHAR     -- Phone number
mb_level      VARCHAR     -- Permission level ('10' = consultant)
mb_password   VARCHAR     -- Hashed password
mb_datetime   DATETIME    -- Registration date
```

**Important:** Only users with `mb_level = '10'` can access the APIs.

#### 2. `g5_sfs2_write_project` (Projects & Candidates)

This table uses a hierarchical structure:
- `wr_is_comment = 0` → Project (parent record)
- `wr_is_comment > 0` → Candidate (child/comment record)

**Candidate Fields (wr_is_comment > 0):**

```sql
wr_id         INT         -- Candidate record ID
wr_parent     INT         -- Parent project ID
wr_is_comment INT         -- Comment depth (> 0 for candidates)
wr_21         VARCHAR     -- Candidate name ⭐
wr_3          VARCHAR     -- Phone number(s) ⭐
wr_4          VARCHAR     -- Email address
wr_content    TEXT        -- Interview stage/progress ⭐
wr_8          VARCHAR     -- Applied position title ⭐
wr_12         VARCHAR     -- Applied company name ⭐
wr_10         VARCHAR     -- Consultant 1 ID ⭐
wr_22         VARCHAR     -- Consultant 2 ID ⭐
wr_datetime   DATETIME    -- Registration timestamp
wr_last       DATETIME    -- Last update timestamp
```

### Field Mapping Reference

When working with candidate data:

| Business Field | DB Column | Example Value |
|----------------|-----------|---------------|
| Candidate Name | `wr_21` | "홍길동" |
| Phone Number | `wr_3` | "010-1234-5678" |
| Email | `wr_4` | "hong@example.com" |
| Interview Stage | `wr_content` | "2차 인터뷰 진행중" |
| Applied Position | `wr_8` | "백엔드 개발자" |
| Applied Company | `wr_12` | "ABC 주식회사" |
| Primary Consultant | `wr_10` | "consultant_id" |
| Secondary Consultant | `wr_22` | "consultant_id_2" |

---

## API Endpoints

### 1. Login API

**Endpoint:** `POST /api/app_login_api.php`

**Purpose:** Authenticate consultant and receive access token

**Request:**
```json
{
  "mb_id": "consultant_username",
  "mb_password": "plain_password"
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "token": "a1b2c3d4e5f6789...",
    "user": {
      "mb_id": "consultant_username",
      "mb_name": "홍길동",
      "mb_nick": "길동",
      "mb_email": "hong@company.com",
      "mb_hp": "010-1234-5678",
      "mb_level": "10"
    }
  },
  "message": "로그인 성공"
}
```

**Implementation Notes:**
- Uses GnuBoard's `check_password()` function for password verification
- Validates `mb_level = '10'` requirement
- Creates token file in `/data/app_tokens/`
- Token expires after 30 days

**File Location:** `app_login_api.php:1-145`

---

### 2. Get Consultants API

**Endpoint:** `GET /api/get_consultants_api.php`

**Purpose:** Retrieve all consultants for contact synchronization

**Authentication:** Required (token)

**Request Headers:**
```
Authorization: Bearer {token}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "consultants": [
      {
        "id": "user1",
        "name": "김팀장",
        "nick": "팀장님",
        "phone": "01011112222",
        "phone_formatted": "010-1111-2222",
        "email": "kim@company.com",
        "level": "10",
        "joined_at": "2024-01-15 10:30:00"
      }
    ],
    "total": 4,
    "synced_at": "2025-11-18 15:30:00"
  },
  "message": "컨설턴트 목록 조회 성공"
}
```

**Implementation Notes:**
- Returns ALL consultants with `mb_level = '10'`
- Phone numbers provided in both raw (`phone`) and formatted (`phone_formatted`) versions
- Sorted alphabetically by name

**File Location:** `get_consultants_api.php:1-143`

---

### 3. Search Candidate API ⭐ CORE FEATURE

**Endpoint:** `GET /api/search_candidate_api.php?phone={phone_number}`

**Purpose:** Search candidates by phone number (called when consultant receives a call)

**Authentication:** Required (token)

**Query Parameters:**
- `phone` (required): Phone number to search (accepts any format: `010-1234-5678` or `01012345678`)

**Request:**
```
GET /api/search_candidate_api.php?phone=01012345678
Authorization: Bearer {token}
```

**Success Response (Candidate Found):**
```json
{
  "success": true,
  "data": {
    "found": true,
    "candidates": [
      {
        "id": "12345",
        "parent_id": "100",
        "name": "홍길동",
        "phone_numbers": "010-1234-5678",
        "email": "hong@email.com",
        "stage": "2차 인터뷰 진행중",
        "applied_position": "백엔드 개발자",
        "applied_company": "ABC 주식회사",
        "consultant_1_id": "user1",
        "consultant_2_id": "user2",
        "registered_at": "2025-09-15 14:30:00",
        "last_updated": "2025-10-03 10:20:00"
      }
    ],
    "total": 1,
    "phone": "01012345678"
  },
  "message": "후보자 정보 조회 성공"
}
```

**Success Response (No Candidate):**
```json
{
  "success": true,
  "data": {
    "found": false,
    "candidates": [],
    "total": 0,
    "phone": "01099998888"
  },
  "message": "등록된 후보자가 없습니다"
}
```

**Implementation Notes:**
- Phone number normalization: Removes all non-numeric characters before search
- SQL uses `REPLACE()` to ignore hyphens, spaces, commas in DB field
- **Security:** Only returns candidates assigned to logged-in consultant (`wr_10` or `wr_22`)
- Returns up to 10 matches, ordered by most recent first
- Handles multiple phone numbers in single field (comma-separated)

**Query Logic:**
```sql
WHERE wr_is_comment > 0  -- Only candidates (comments)
  AND REPLACE(REPLACE(REPLACE(wr_3, '-', ''), ' ', ''), ',', '')
      LIKE '%{phone_digits}%'
  AND (wr_10 = '{consultant_id}' OR wr_22 = '{consultant_id}')
ORDER BY wr_datetime DESC
LIMIT 10
```

**File Location:** `search_candidate_api.php:1-201`

---

## Security & Authentication

### Current Security Measures

✅ **Implemented:**

1. **SQL Injection Protection:**
   - All user inputs sanitized with `sql_escape_string()`
   - GnuBoard's built-in query functions used

2. **Authentication:**
   - Token-based system (30-day expiration)
   - Token validation on every protected endpoint
   - Password hashing via GnuBoard's `check_password()`

3. **Authorization:**
   - Permission level check (`mb_level = '10'`)
   - Data scoping: Consultants only see their own candidates
   - Query filters: `wr_10 = {mb_id} OR wr_22 = {mb_id}`

4. **CORS Configuration:**
   - Currently allows all origins (`Access-Control-Allow-Origin: *`)
   - Supports preflight OPTIONS requests

5. **Error Handling:**
   - Production mode: `error_reporting(0)`, `display_errors(0)`
   - Generic error messages (no SQL details exposed)
   - Proper HTTP status codes

### Security Improvements Needed

⚠️ **Recommended for Production:**

1. **HTTPS Enforcement:**
   ```php
   if (!isset($_SERVER['HTTPS']) || $_SERVER['HTTPS'] !== 'on') {
       // Redirect to HTTPS or reject
   }
   ```

2. **CORS Restriction:**
   ```php
   header('Access-Control-Allow-Origin: https://your-app-domain.com');
   ```

3. **Rate Limiting:**
   - Implement IP-based request throttling
   - Suggested: 60 requests/minute per IP
   - Failed login attempts: 5 tries → 10-minute lockout

4. **Token Improvements:**
   - Consider JWT instead of file-based tokens
   - Add token refresh mechanism
   - Implement logout (token deletion)
   - Add device/session tracking

5. **Input Validation:**
   - Add regex validation for phone numbers
   - Email format validation
   - Maximum length checks

6. **Security Headers:**
   ```php
   header('X-Content-Type-Options: nosniff');
   header('X-Frame-Options: DENY');
   header('X-XSS-Protection: 1; mode=block');
   ```

---

## Development Workflow

### Git Branch Strategy

**Current Branch:** `claude/claude-md-mi4gclzxu990t4qe-011KN37n1BoeX5YjWwhqYvX4`

**Branch Naming Convention:**
- All development branches must start with `claude/`
- Must end with matching session ID
- Format: `claude/[description]-[session-id]`

**Git Operations:**

```bash
# Push with retry logic (network failures)
git push -u origin <branch-name>
# Retry up to 4 times with exponential backoff: 2s, 4s, 8s, 16s

# Fetch specific branch
git fetch origin <branch-name>

# Pull specific branch
git pull origin <branch-name>
```

⚠️ **Critical:** Push to wrong branch format will fail with HTTP 403.

### Commit Guidelines

**Good Commit Messages:**
```
✅ Add phone number normalization to search API
✅ Fix token expiration validation bug
✅ Update API documentation with new endpoints
```

**Poor Commit Messages:**
```
❌ Update files
❌ Fix bug
❌ Changes
```

### Testing Before Commit

Always test using `api_test.html`:

1. Open `api_test.html` in browser
2. Enter API base URL (e.g., `https://your-domain.com/api`)
3. Test login with valid consultant credentials
4. Verify token is received and auto-filled
5. Test consultant list retrieval
6. Test candidate search with known phone number
7. Verify all responses match expected format

---

## Testing

### Manual Testing Tool

**File:** `api_test.html`

**Features:**
- Interactive web interface
- No installation required (open in browser)
- Automatic token management
- Response formatting with syntax highlighting
- Success/error visual indicators

**Usage:**
```
1. Open api_test.html in any modern browser
2. Enter base URL: https://your-domain.com/api
3. Section 1 - Login:
   - Enter mb_id (consultant username)
   - Enter mb_password
   - Click "로그인 테스트"
   - Token automatically saved for subsequent requests

4. Section 2 - Get Consultants:
   - Click "컨설턴트 목록 조회"
   - Review list of all consultants

5. Section 3 - Search Candidate:
   - Enter phone number (any format)
   - Click "후보자 검색"
   - Verify candidate information displayed
```

### cURL Testing Examples

**Login:**
```bash
curl -X POST https://your-domain.com/api/app_login_api.php \
  -H "Content-Type: application/json" \
  -d '{"mb_id":"test_user","mb_password":"password123"}'
```

**Get Consultants:**
```bash
curl -X GET https://your-domain.com/api/get_consultants_api.php \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Search Candidate:**
```bash
curl -X GET "https://your-domain.com/api/search_candidate_api.php?phone=01012345678" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Data Requirements

**Prerequisite Data:**

1. **At least one consultant account:**
   - `mb_level = '10'`
   - Valid password
   - Active status

2. **At least one candidate record:**
   - `wr_is_comment > 0`
   - Valid phone number in `wr_3`
   - Assigned to test consultant in `wr_10` or `wr_22`

### Expected Test Results

| Test Case | Expected Result |
|-----------|----------------|
| Login with valid credentials | HTTP 200, token returned |
| Login with invalid password | HTTP 401, error message |
| Login with non-consultant (mb_level ≠ 10) | HTTP 403, permission error |
| Get consultants without token | HTTP 401, auth error |
| Get consultants with valid token | HTTP 200, consultant array |
| Search with assigned candidate's phone | HTTP 200, found=true, candidate data |
| Search with non-assigned candidate | HTTP 200, found=false, empty array |
| Search with non-existent phone | HTTP 200, found=false, empty array |

---

## Common Tasks

### Adding a New API Endpoint

1. **Create PHP file in root directory** (e.g., `new_feature_api.php`)

2. **Use this template:**
```php
<?php
define('_GNUBOARD_', true);
error_reporting(0);
ini_set('display_errors', 0);

// Load GnuBoard
if (file_exists('../common.php')) {
    include_once '../common.php';
} elseif (file_exists('../../common.php')) {
    include_once '../../common.php';
} else {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'SYSTEM_ERROR',
        'message' => '시스템 초기화 실패'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Token validation
    $token = $_SERVER['HTTP_AUTHORIZATION'] ?? $_GET['token'] ?? '';
    $token = str_replace('Bearer ', '', $token);

    if (empty($token)) {
        throw new Exception('인증 토큰이 필요합니다', 401);
    }

    $token_file = G5_DATA_PATH . '/app_tokens/' . $token . '.json';
    if (!file_exists($token_file)) {
        throw new Exception('유효하지 않은 토큰입니다', 401);
    }

    $token_data = json_decode(file_get_contents($token_file), true);
    if (strtotime($token_data['expires_at']) < time()) {
        unlink($token_file);
        throw new Exception('토큰이 만료되었습니다', 401);
    }

    $mb_id = $token_data['mb_id'];

    // Your API logic here

    echo json_encode([
        'success' => true,
        'data' => [],
        'message' => 'Success message'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    $code = $e->getCode() ?: 500;
    http_response_code($code);

    echo json_encode([
        'success' => false,
        'error' => 'OPERATION_FAILED',
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
```

3. **Update documentation:**
   - Add endpoint to `API_INSTALLATION_GUIDE.md`
   - Add test case to `api_test.html`
   - Update this file (CLAUDE.md)

---

### Modifying Database Queries

**Important:** The table name is dynamically constructed:

```php
$write_table = $g5['write_prefix'] . 'project';
// Results in: g5_sfs2_write_project
```

**Never hardcode table names.** Always use `$g5['table_name']` or construct with prefix.

**Example - Safe Query:**
```php
$sql = "SELECT * FROM {$g5['write_prefix']}project WHERE wr_id = '{$safe_id}'";
```

**Example - UNSAFE Query:**
```php
$sql = "SELECT * FROM g5_sfs2_write_project WHERE wr_id = '$id'";
// ❌ Hardcoded table name
// ❌ Unsanitized variable
```

---

### Debugging API Issues

1. **Enable Debug Mode:**
   - Use `search_candidate_api_debug.php` instead of `search_candidate_api.php`
   - Contains verbose logging and SQL output

2. **Check Token Files:**
   ```bash
   ls -la /path/to/gnuboard/data/app_tokens/
   cat /path/to/gnuboard/data/app_tokens/{token}.json
   ```

3. **Common Issues:**

   | Symptom | Likely Cause | Solution |
   |---------|-------------|----------|
   | "시스템 초기화 실패" | `common.php` path wrong | Check `include_once` paths |
   | "유효하지 않은 토큰" | Token file doesn't exist | Re-login to get new token |
   | "토큰이 만료되었습니다" | Token > 30 days old | Re-login |
   | Empty candidate results | Consultant not assigned | Check `wr_10` and `wr_22` fields |
   | Phone search returns nothing | Format mismatch | Check `wr_3` field format in DB |

4. **SQL Debugging:**
   ```php
   // Add after query execution
   if (!$result) {
       error_log("SQL Error: " . sql_error_string());
       error_log("Query: " . $sql);
   }
   ```

---

### Updating Documentation

**When to Update:**
- New API endpoint added → Update all 3 docs
- Database schema changes → Update `PROJECT_STATUS.md` and `CLAUDE.md`
- Security changes → Update `API_INSTALLATION_GUIDE.md` and `CLAUDE.md`
- Bug fixes → Update `CLAUDE.md` Known Issues section

**Documentation Files:**
1. `CLAUDE.md` - For AI assistants (comprehensive technical guide)
2. `PROJECT_STATUS.md` - For project management (status, roadmap, progress)
3. `API_INSTALLATION_GUIDE.md` - For deployment (setup, installation, testing)

---

## Known Issues & Solutions

### Issue 1: Table doesn't exist error

**Symptom:**
```
"Table 'database.g5_sfs2_write_project' doesn't exist"
```

**Cause:** Hardcoded table name doesn't match actual prefix

**Solution:**
```php
// ❌ Wrong
$sql = "SELECT * FROM g5_sfs2_write_project WHERE ...";

// ✅ Correct
$write_table = $g5['write_prefix'] . 'project';
$sql = "SELECT * FROM {$write_table} WHERE ...";
```

**File Locations:** All `*_api.php` files at lines ~99

---

### Issue 2: Phone number search returns no results

**Symptom:** Known candidate phone returns `found: false`

**Possible Causes:**
1. Phone format different in DB vs. search query
2. Consultant not assigned to candidate
3. Wrong field being searched

**Solutions:**

**Cause 1 - Format Mismatch:**
```sql
-- Check DB format
SELECT wr_3, wr_21 FROM g5_sfs2_write_project WHERE wr_is_comment > 0 LIMIT 5;

-- Our query handles: "010-1234-5678", "01012345678", "010 1234 5678"
-- Uses: REPLACE(REPLACE(REPLACE(wr_3, '-', ''), ' ', ''), ',', '')
```

**Cause 2 - Authorization:**
```sql
-- Verify consultant assignment
SELECT wr_21, wr_10, wr_22
FROM g5_sfs2_write_project
WHERE wr_3 LIKE '%01012345678%'
  AND wr_is_comment > 0;

-- Check if logged-in consultant ID matches wr_10 or wr_22
```

**Cause 3 - Wrong Field:**
```sql
-- Verify phone numbers are in wr_3 (not wr_4 or other field)
DESC g5_sfs2_write_project;
```

**File Location:** `search_candidate_api.php:111-130`

---

### Issue 3: "인증 토큰이 필요합니다" despite sending token

**Symptom:** Token sent but API returns authentication error

**Cause:** `getallheaders()` function not available on some servers

**Solution:** Already implemented multiple token sources:
```php
// Priority order:
1. $_SERVER['HTTP_AUTHORIZATION']
2. $_GET['token']
3. $_POST['token']
4. JSON body 'token' field
```

**Workaround if needed:**
Use GET parameter: `/api/endpoint.php?token=YOUR_TOKEN`

**File Locations:**
- `get_consultants_api.php:38-60`
- `search_candidate_api.php:38-61`

---

### Issue 4: CORS errors from web app

**Symptom:**
```
Access to fetch at 'https://api.com/api/...' from origin 'https://app.com'
has been blocked by CORS policy
```

**Cause:** CORS headers not properly configured

**Current Configuration:**
```php
header('Access-Control-Allow-Origin: *');  // Allows all origins
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

**Production Configuration:**
```php
// Restrict to specific domain
header('Access-Control-Allow-Origin: https://your-app-domain.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

**File Locations:** All `*_api.php` files at lines ~28-34

---

### Issue 5: Token file permission denied

**Symptom:** Login succeeds but token not saved

**Cause:** `/data/` directory not writable

**Solution:**
```bash
# Check permissions
ls -ld /path/to/gnuboard/data

# Fix permissions
chmod 707 /path/to/gnuboard/data
# or
chmod 777 /path/to/gnuboard/data

# Verify app_tokens directory created
ls -la /path/to/gnuboard/data/app_tokens/
```

**File Location:** `app_login_api.php:102-115`

---

## AI Assistant Guidelines

### When Working on This Project

1. **Always Read Context First:**
   - Read `PROJECT_STATUS.md` for current project phase
   - Read `API_INSTALLATION_GUIDE.md` for deployment context
   - Read this file for technical architecture

2. **Follow Existing Patterns:**
   - Use the API template structure (see [Common Tasks](#common-tasks))
   - Maintain consistent error handling
   - Keep response format standardized
   - Use GnuBoard's built-in functions (`sql_escape_string`, `sql_query`, etc.)

3. **Security First:**
   - Never skip input validation
   - Always use `sql_escape_string()` before DB queries
   - Validate token on protected endpoints
   - Check user permissions before data access

4. **Korean Language Context:**
   - Project documentation is bilingual (Korean/English)
   - User-facing messages should be in Korean
   - Code comments can be in English
   - Database content is in Korean

5. **Database Field Mapping:**
   - Memorize the field mapping table (Section: Database Schema)
   - `wr_21` = name, `wr_3` = phone, `wr_content` = stage, etc.
   - Never assume field purposes without verification

6. **Testing Requirements:**
   - Always provide test instructions for new features
   - Update `api_test.html` if adding endpoints
   - Include cURL examples in documentation
   - Specify expected responses

7. **Documentation Discipline:**
   - Update all relevant docs when making changes
   - Add entries to "Known Issues" when fixing bugs
   - Keep file location references accurate
   - Update "Last Updated" date in this file

8. **Don't Assume:**
   - GnuBoard is a Korean CMS - it has unique conventions
   - Table prefix can vary (use `$g5['write_prefix']`)
   - Comment system is used for parent-child relationships
   - Phone number formats vary in database

9. **Code Style:**
   - Keep error reporting disabled in production code
   - Use `JSON_UNESCAPED_UNICODE` for Korean text
   - Follow existing indentation (4 spaces)
   - Add inline comments for complex logic

10. **Version Control:**
    - Never commit to main/master directly
    - Use branch format: `claude/[task]-[session-id]`
    - Write descriptive commit messages
    - Push with retry logic for network issues

---

## Next Steps

### Phase 2: React Native App Development

**Priority Tasks:**

1. **Development Environment Setup** (1 day)
   ```bash
   # Install prerequisites
   - Node.js v20+
   - Android Studio
   - React Native CLI

   # Create project
   npx react-native@latest init SearchFirmCRM
   cd SearchFirmCRM
   ```

2. **Essential Libraries** (1 day)
   ```bash
   npm install axios                                    # API calls
   npm install @react-native-async-storage/async-storage  # Token storage
   npm install react-native-call-detection              # Phone state
   ```

3. **Core Screens** (1 week)
   - Login screen (API integration)
   - Phone call overlay popup (main feature)
   - Settings screen (logout, preferences)

4. **Phone Detection Feature** (1 week)
   - Android permissions: `READ_PHONE_STATE`, `READ_CALL_LOG`, `SYSTEM_ALERT_WINDOW`
   - Native module: PhoneStateReceiver (Kotlin)
   - Overlay service: OverlayService (Kotlin)

5. **Testing & Deployment** (1 week)
   - Real device testing
   - APK build
   - (Optional) Google Play Store release

### App Feature Checklist

**Must-Have Features:**
- [ ] Login with consultant credentials
- [ ] Token persistence (AsyncStorage)
- [ ] Phone call detection (background service)
- [ ] Overlay popup on incoming call
- [ ] Candidate search by caller phone number
- [ ] Display candidate information in overlay
- [ ] Logout functionality

**Nice-to-Have Features:**
- [ ] Consultant contact sync
- [ ] Offline caching of recent candidates
- [ ] Call history integration
- [ ] Push notifications for updates
- [ ] Dark mode support

### Expected App Workflow

```
1. App Launch
   ├─→ Check for saved token
   ├─→ If no token → Show Login Screen
   ├─→ If token exists → Validate with API
   └─→ Start background phone detection service

2. User Logs In
   ├─→ Call app_login_api.php
   ├─→ Receive token
   ├─→ Save token to AsyncStorage
   ├─→ Fetch consultants list (get_consultants_api.php)
   └─→ Start background phone detection service

3. Incoming Call Detected
   ├─→ Extract phone number from call state
   ├─→ Call search_candidate_api.php?phone=XXX
   ├─→ Parse response
   ├─→ If found → Display overlay popup with candidate info
   └─→ If not found → Show "Unknown caller" or hide overlay

4. User Taps Overlay
   ├─→ Open candidate detail screen
   └─→ Show full information + history

5. User Logs Out
   ├─→ Delete token from AsyncStorage
   ├─→ Stop background service
   └─→ Return to login screen
```

---

## Appendix

### Useful GnuBoard Functions

```php
// Database
sql_query($sql)                    // Execute query, return result
sql_fetch($sql)                    // Fetch single row as array
sql_fetch_array($result)           // Fetch next row from result
sql_escape_string($str)            // Sanitize for SQL
sql_error_string()                 // Get last SQL error

// Password
check_password($plain, $hash)      // Verify password against hash

// Paths
G5_DATA_PATH                       // /path/to/gnuboard/data
G5_PATH                            // /path/to/gnuboard

// Tables
$g5['member_table']                // Full member table name
$g5['write_prefix']                // Write table prefix (e.g., g5_sfs2_write_)
```

### Phone Number Formats in Database

The system handles these formats automatically:

```
010-1234-5678    ← Most common
01012345678      ← No hyphens
010 1234 5678    ← Spaces
010-1234-5678, 010-9999-8888  ← Multiple numbers (comma-separated)
```

Search query normalizes all to digits only: `01012345678`

### HTTP Status Codes Used

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful operation |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Invalid/missing/expired token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 405 | Method Not Allowed | Wrong HTTP method |
| 500 | Internal Server Error | Server-side error |

### Directory Structure for Mobile App (Future)

```
SearchFirmCRM/
├── android/              # Android native code
│   ├── app/
│   │   └── src/main/
│   │       ├── java/
│   │       │   └── com/searchfirmcrm/
│   │       │       ├── PhoneStateReceiver.kt
│   │       │       └── OverlayService.kt
│   │       └── AndroidManifest.xml
├── ios/                  # iOS native code (future)
├── src/
│   ├── api/
│   │   └── client.js     # Axios configuration
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── OverlayScreen.js
│   │   └── SettingsScreen.js
│   ├── services/
│   │   ├── AuthService.js
│   │   └── PhoneService.js
│   ├── utils/
│   │   └── constants.js
│   └── App.js
├── package.json
└── README.md
```

---

**End of CLAUDE.md**

For questions or updates, modify this file and update the "Last Updated" date at the top.
