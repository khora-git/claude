<?php
/**
 * SearchFirm CRM App - 후보자 검색 API
 * 전화번호로 후보자 정보 조회 (order_list5.php 로직 기반)
 * 앱의 핵심 기능: 전화 수신 시 자동으로 후보자 정보 표시
 */

define('_GNUBOARD_', true);

error_reporting(0);
ini_set('display_errors', 0);

// 그누보드 공통 파일 로드
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
    // 토큰 인증 - 여러 방법으로 토큰 받기
    $token = '';
    
    // 방법 1: Authorization 헤더에서 (표준 방식)
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $token = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
    }
    // 방법 2: GET 파라미터
    elseif (isset($_GET['token'])) {
        $token = $_GET['token'];
    }
    // 방법 3: POST 파라미터
    elseif (isset($_POST['token'])) {
        $token = $_POST['token'];
    }
    // 방법 4: JSON body
    else {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        if ($data && isset($data['token'])) {
            $token = $data['token'];
        }
    }
    
    if (empty($token)) {
        throw new Exception('인증 토큰이 필요합니다', 401);
    }
    
    // 토큰 검증
    $token_file = G5_DATA_PATH . '/app_tokens/' . $token . '.json';
    if (!file_exists($token_file)) {
        throw new Exception('유효하지 않은 토큰입니다', 401);
    }
    
    $token_data = json_decode(file_get_contents($token_file), true);
    if (strtotime($token_data['expires_at']) < time()) {
        unlink($token_file);
        throw new Exception('토큰이 만료되었습니다', 401);
    }
    
    $mb_id = $token_data['mb_id'];  // 로그인한 컨설턴트 ID
    
    // 전화번호 파라미터 받기
    $phone = isset($_GET['phone']) ? $_GET['phone'] : (isset($_POST['phone']) ? $_POST['phone'] : '');
    
    if (empty($phone)) {
        throw new Exception('전화번호를 입력해주세요', 400);
    }
    
    // 전화번호 정리 (숫자만 추출)
    $phone_cleaned = preg_replace('/[^0-9]/', '', $phone);
    
    if (strlen($phone_cleaned) < 9) {
        throw new Exception('유효하지 않은 전화번호입니다', 400);
    }
    
    // SQL Injection 방지
    $phone_search = sql_escape_string($phone_cleaned);
    
    // 그누보드 게시판 테이블명 가져오기
    $write_table = $g5['write_prefix'] . 'project';
    
    // 후보자 검색 쿼리 (댓글 테이블에서 직접 조회)
    // 전화번호 검색: REPLACE로 하이픈 제거 후 비교
    // wr_is_comment > 0 : 후보자 (댓글)
    // wr_21: 후보자 이름
    // wr_3: 전화번호
    // wr_4: 이메일
    // wr_content: 진행단계
    // wr_8: 지원 포지션명
    // wr_12: 지원 고객사명
    // wr_10, wr_22: 관련 컨설턴트
    $sql = "SELECT 
                wr_id,
                wr_parent,
                wr_is_comment,
                wr_21 as candidate_name,
                wr_3 as phone_numbers,
                wr_4 as email,
                wr_content as interview_stage,
                wr_8 as applied_position,
                wr_12 as applied_company,
                wr_10 as consultant_1_id,
                wr_22 as consultant_2_id,
                wr_datetime as registered_at,
                wr_last as last_updated
            FROM {$write_table}
            WHERE wr_is_comment > 0
              AND REPLACE(REPLACE(REPLACE(wr_3, '-', ''), ' ', ''), ',', '') LIKE '%{$phone_search}%'
              AND (wr_10 = '{$mb_id}' OR wr_22 = '{$mb_id}')
            ORDER BY wr_datetime DESC
            LIMIT 10";
    
    $result = sql_query($sql);
    
    if (!$result) {
        // SQL 에러 상세 정보 (개발 중에만 사용, 프로덕션에서는 제거)
        $error_msg = '데이터베이스 조회 실패';
        if (function_exists('sql_error_string')) {
            $error_msg .= ': ' . sql_error_string();
        }
        throw new Exception($error_msg, 500);
    }
    
    $candidates = [];
    while ($row = sql_fetch_array($result)) {
        // 진행 단계 텍스트 (wr_content에 저장된 값)
        $stage = $row['interview_stage'] ? strip_tags($row['interview_stage']) : '진행중';
        
        $candidates[] = [
            'id' => $row['wr_id'],
            'parent_id' => $row['wr_parent'],
            'name' => $row['candidate_name'],                  // wr_21: 후보자 이름
            'phone_numbers' => $row['phone_numbers'],          // wr_3: 전화번호
            'email' => $row['email'],                          // wr_4: 이메일
            'stage' => $stage,                                 // wr_content: 진행단계
            'applied_position' => $row['applied_position'],    // wr_8: 지원 포지션명
            'applied_company' => $row['applied_company'],      // wr_12: 지원 고객사명
            'consultant_1_id' => $row['consultant_1_id'],      // wr_10: 컨설턴트 1
            'consultant_2_id' => $row['consultant_2_id'],      // wr_22: 컨설턴트 2
            'registered_at' => $row['registered_at'],
            'last_updated' => $row['last_updated']
        ];
    }
    
    if (empty($candidates)) {
        // 후보자 정보 없음
        echo json_encode([
            'success' => true,
            'data' => [
                'found' => false,
                'candidates' => [],
                'total' => 0,
                'phone' => $phone_cleaned
            ],
            'message' => '등록된 후보자가 없습니다'
        ], JSON_UNESCAPED_UNICODE);
    } else {
        // 후보자 정보 있음
        echo json_encode([
            'success' => true,
            'data' => [
                'found' => true,
                'candidates' => $candidates,
                'total' => count($candidates),
                'phone' => $phone_cleaned
            ],
            'message' => '후보자 정보 조회 성공'
        ], JSON_UNESCAPED_UNICODE);
    }
    
} catch (Exception $e) {
    $code = $e->getCode() ?: 500;
    http_response_code($code);
    
    echo json_encode([
        'success' => false,
        'error' => 'SEARCH_FAILED',
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
