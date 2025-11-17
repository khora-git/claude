<?php
/**
 * SearchFirm CRM App - 컨설턴트 목록 API
 * 앱 연락처 동기화용 컨설턴트 목록 조회
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
    
    // 토큰 검증 (간단한 방식)
    $token_file = G5_DATA_PATH . '/app_tokens/' . $token . '.json';
    if (!file_exists($token_file)) {
        throw new Exception('유효하지 않은 토큰입니다', 401);
    }
    
    $token_data = json_decode(file_get_contents($token_file), true);
    if (strtotime($token_data['expires_at']) < time()) {
        unlink($token_file);
        throw new Exception('토큰이 만료되었습니다', 401);
    }
    
    // 컨설턴트 목록 조회 (mb_level = 10)
    $sql = "SELECT 
                mb_id,
                mb_name,
                mb_nick,
                mb_hp,
                mb_email,
                mb_level,
                mb_datetime,
                mb_memo
            FROM {$g5['member_table']}
            WHERE mb_level = '10'
            ORDER BY mb_name ASC";
    
    $result = sql_query($sql);
    
    if (!$result) {
        throw new Exception('데이터 조회 실패', 500);
    }
    
    $consultants = [];
    while ($row = sql_fetch_array($result)) {
        // 전화번호 포맷팅 (010-1234-5678)
        $phone = preg_replace('/[^0-9]/', '', $row['mb_hp']);
        if (strlen($phone) == 11) {
            $formatted_phone = substr($phone, 0, 3) . '-' . substr($phone, 3, 4) . '-' . substr($phone, 7);
        } elseif (strlen($phone) == 10) {
            $formatted_phone = substr($phone, 0, 3) . '-' . substr($phone, 3, 3) . '-' . substr($phone, 6);
        } else {
            $formatted_phone = $row['mb_hp'];
        }
        
        $consultants[] = [
            'id' => $row['mb_id'],
            'name' => $row['mb_name'],
            'nick' => $row['mb_nick'],
            'phone' => $phone,  // 숫자만
            'phone_formatted' => $formatted_phone,  // 포맷팅된 번호
            'email' => $row['mb_email'],
            'level' => $row['mb_level'],
            'joined_at' => $row['mb_datetime']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'consultants' => $consultants,
            'total' => count($consultants),
            'synced_at' => date('Y-m-d H:i:s')
        ],
        'message' => '컨설턴트 목록 조회 성공'
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    $code = $e->getCode() ?: 500;
    http_response_code($code);
    
    echo json_encode([
        'success' => false,
        'error' => 'FETCH_FAILED',
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
