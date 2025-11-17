<?php
/**
 * SearchFirm CRM App - 로그인 API
 * 앱에서 그누보드 회원 로그인 처리
 */

// 그누보드 경로 설정 (실제 경로에 맞게 수정 필요)
define('_GNUBOARD_', true);

// 에러 표시 끄기 (프로덕션)
error_reporting(0);
ini_set('display_errors', 0);

// 그누보드 공통 파일 로드 (경로 확인 필요)
if (file_exists('../common.php')) {
    include_once '../common.php';
} elseif (file_exists('../../common.php')) {
    include_once '../../common.php';
} else {
    // common.php를 찾을 수 없을 때
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'SYSTEM_ERROR',
        'message' => '시스템 초기화 실패'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// JSON 응답 헤더
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// POST 요청만 허용
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'error' => 'INVALID_METHOD',
        'message' => 'POST 요청만 허용됩니다'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // 입력 데이터 받기
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // JSON 파싱 실패 시 $_POST 사용
    if (!$data) {
        $data = $_POST;
    }
    
    $mb_id = isset($data['mb_id']) ? trim($data['mb_id']) : '';
    $mb_password = isset($data['mb_password']) ? trim($data['mb_password']) : '';
    
    // 입력값 검증
    if (empty($mb_id)) {
        throw new Exception('아이디를 입력해주세요', 400);
    }
    
    if (empty($mb_password)) {
        throw new Exception('비밀번호를 입력해주세요', 400);
    }
    
    // SQL Injection 방지
    $mb_id = sql_escape_string($mb_id);
    
    // 회원 정보 조회
    $sql = "SELECT mb_id, mb_name, mb_nick, mb_email, mb_hp, mb_level, mb_password 
            FROM {$g5['member_table']} 
            WHERE mb_id = '{$mb_id}'";
    
    $result = sql_fetch($sql);
    
    if (!$result) {
        throw new Exception('존재하지 않는 아이디입니다', 401);
    }
    
    // 비밀번호 확인
    if (!check_password($mb_password, $result['mb_password'])) {
        throw new Exception('비밀번호가 일치하지 않습니다', 401);
    }
    
    // 컨설턴트 권한 확인 (mb_level = 10)
    if ($result['mb_level'] != '10') {
        throw new Exception('앱 사용 권한이 없습니다. 관리자에게 문의하세요.', 403);
    }
    
    // 세션 토큰 생성 (간단한 토큰, 실제로는 JWT 사용 권장)
    $token = md5($mb_id . time() . uniqid());
    
    // 토큰을 DB에 저장하거나 Redis 사용 (여기서는 간단하게 파일로 저장)
    $token_dir = G5_DATA_PATH . '/app_tokens';
    if (!is_dir($token_dir)) {
        mkdir($token_dir, 0707, true);
    }
    
    $token_file = $token_dir . '/' . $token . '.json';
    $token_data = [
        'mb_id' => $result['mb_id'],
        'mb_name' => $result['mb_name'],
        'created_at' => date('Y-m-d H:i:s'),
        'expires_at' => date('Y-m-d H:i:s', strtotime('+30 days'))
    ];
    
    file_put_contents($token_file, json_encode($token_data, JSON_UNESCAPED_UNICODE));
    
    // 로그인 성공 응답
    echo json_encode([
        'success' => true,
        'data' => [
            'token' => $token,
            'user' => [
                'mb_id' => $result['mb_id'],
                'mb_name' => $result['mb_name'],
                'mb_nick' => $result['mb_nick'],
                'mb_email' => $result['mb_email'],
                'mb_hp' => $result['mb_hp'],
                'mb_level' => $result['mb_level']
            ]
        ],
        'message' => '로그인 성공'
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    $code = $e->getCode() ?: 500;
    http_response_code($code);
    
    echo json_encode([
        'success' => false,
        'error' => 'LOGIN_FAILED',
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
