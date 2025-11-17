<?php
/**
 * SearchFirm CRM App - 후보자 검색 API (디버그 버전)
 * 실제 SQL 쿼리와 에러 메시지를 확인할 수 있습니다.
 */

define('_GNUBOARD_', true);

// 에러 표시 켜기 (디버깅용)
error_reporting(E_ALL);
ini_set('display_errors', 1);

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
    
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $token = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
    } elseif (isset($_GET['token'])) {
        $token = $_GET['token'];
    } elseif (isset($_POST['token'])) {
        $token = $_POST['token'];
    } else {
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
    
    $mb_id = $token_data['mb_id'];
    
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
    
    // 디버그 정보
    $debug_info = [
        'mb_id' => $mb_id,
        'phone_input' => $phone,
        'phone_cleaned' => $phone_cleaned,
        'phone_search' => $phone_search,
        'table_name' => $write_table
    ];
    
    // 후보자 검색 쿼리
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
    
    $debug_info['sql'] = $sql;
    
    $result = sql_query($sql);
    
    if (!$result) {
        // SQL 에러 상세 정보
        $error_msg = 'SQL 쿼리 실행 실패';
        
        // MySQL 에러 가져오기
        if (function_exists('mysqli_error')) {
            global $connect_db;
            if ($connect_db) {
                $error_msg .= ': ' . mysqli_error($connect_db);
            }
        }
        
        $debug_info['error'] = $error_msg;
        
        throw new Exception(json_encode($debug_info, JSON_UNESCAPED_UNICODE), 500);
    }
    
    $candidates = [];
    while ($row = sql_fetch_array($result)) {
        $stage = $row['interview_stage'] ? strip_tags($row['interview_stage']) : '진행중';
        
        $candidates[] = [
            'id' => $row['wr_id'],
            'parent_id' => $row['wr_parent'],
            'is_comment' => $row['wr_is_comment'],
            'name' => $row['candidate_name'],
            'phone_numbers' => $row['phone_numbers'],
            'email' => $row['email'],
            'stage' => $stage,
            'applied_position' => $row['applied_position'],
            'applied_company' => $row['applied_company'],
            'consultant_1_id' => $row['consultant_1_id'],
            'consultant_2_id' => $row['consultant_2_id'],
            'registered_at' => $row['registered_at'],
            'last_updated' => $row['last_updated']
        ];
    }
    
    if (empty($candidates)) {
        echo json_encode([
            'success' => true,
            'data' => [
                'found' => false,
                'candidates' => [],
                'total' => 0,
                'phone' => $phone_cleaned
            ],
            'debug' => $debug_info,
            'message' => '등록된 후보자가 없습니다'
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode([
            'success' => true,
            'data' => [
                'found' => true,
                'candidates' => $candidates,
                'total' => count($candidates),
                'phone' => $phone_cleaned
            ],
            'debug' => $debug_info,
            'message' => '후보자 정보 조회 성공'
        ], JSON_UNESCAPED_UNICODE);
    }
    
} catch (Exception $e) {
    $code = $e->getCode() ?: 500;
    http_response_code($code);
    
    // 에러 메시지가 JSON인 경우 파싱
    $message = $e->getMessage();
    $decoded = json_decode($message, true);
    
    if ($decoded) {
        echo json_encode([
            'success' => false,
            'error' => 'SEARCH_FAILED',
            'debug' => $decoded
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'SEARCH_FAILED',
            'message' => $message
        ], JSON_UNESCAPED_UNICODE);
    }
}
?>
