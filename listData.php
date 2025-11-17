<?php
include_once('./_common.php');

// 성능 모니터링 시작
$start_time = microtime(true);

// 캐싱 설정
$cache_time = 60; // 1분
header("Cache-Control: private, max-age=$cache_time");
header("Expires: " . gmdate("D, d M Y H:i:s", time() + $cache_time) . " GMT");

// 필요한 필드만 선택하도록 최적화
$include_fields = array(
    'wr_id', 'wr_num', 'wr_subject', 'wr_name', 'wr_file', 'wr_datetime',
    'wr_1', 'wr_2', 'wr_10', 'wr_11', 'wr_14', 'wr_15', 'wr_16', 
    'wr_41', 'wr_42', 'wr_51', 'wr_25', 'wr_26', 'wr_27', 'wr_33', 'wr_60'
);

// 검색 연산자 처리
$sop = strtolower($sop);
if ($sop != 'and' && $sop != 'or') $sop = 'and';

// 검색 조건 배열 초기화
$search_condition = array();

// 기본 조건: 댓글이 아닌 글만 검색 (인덱스 활용)
$search_condition[] = "wr_is_comment = 0";

// 분류 검색
if ($sca) {
    $search_condition[] = "ca_name = '" . sql_real_escape_string($sca) . "'";
}

// 검색어 검색 - 복합 검색어 처리 개선
if ($stx) {
    // wr_67 필드에 대한 검색일 경우 별도 처리
    if ($sfl == 'wr_67') {
        if (trim($stx) !== '') {
            $search_words = explode(' ', trim($stx));
            $word_conditions = array();
            
            foreach ($search_words as $word) {
                if (trim($word) !== '') {
                    $word_conditions[] = "wr_67 LIKE '%" . sql_real_escape_string($word) . "%'";
                }
            }
            
            if (!empty($word_conditions)) {
                $search_condition[] = "(" . implode($sop == 'and' ? ' AND ' : ' OR ', $word_conditions) . ")";
            }
        }
    } else {
        // 일반 검색은 기존 방식 사용 (get_sql_search 함수 사용)
        $search_condition[] = get_sql_search($sca, $sfl, $stx, $sop);
    }
}

// 성별 검색
if ($wr_16) {
    $search_condition[] = "wr_16 = '" . sql_real_escape_string($wr_16) . "'";
}

// 필드 검색 - 필요한 필드만 배열로 정의하여 반복문으로 처리
$fields = array('wr_51', 'wr_52', 'wr_53', 'wr_33', 'wr_34', 'wr_35', 'wr_27', 'wr_14', 'wr_15', 'wr_48', 'wr_25', 'wr_60');
foreach ($fields as $field) {
    if (!empty(${$field})) {
        $search_condition[] = "$field LIKE '%" . sql_real_escape_string(${$field}) . "%'";
    }
}

// 나이 검색 최적화 - BETWEEN 사용
if ($t_start && $t_end) {
    $search_condition[] = "wr_1 BETWEEN '" . sql_real_escape_string($t_start) . 
                         "' AND '" . sql_real_escape_string($t_end) . "'";
} else if ($t_start) {
    $search_condition[] = "wr_1 >= '" . sql_real_escape_string($t_start) . "'";
} else if ($t_end) {
    $search_condition[] = "wr_1 <= '" . sql_real_escape_string($t_end) . "'";
}

// 경력 검색 최적화 - BETWEEN 사용
if ($c_start && $c_end) {
    $search_condition[] = "CAST(wr_2 AS UNSIGNED) BETWEEN " . intval($c_start) . 
                         " AND " . intval($c_end);
} else if ($c_start) {
    $search_condition[] = "CAST(wr_2 AS UNSIGNED) >= " . intval($c_start);
} else if ($c_end) {
    $search_condition[] = "CAST(wr_2 AS UNSIGNED) <= " . intval($c_end);
}

// 언어 검색
foreach (array('wr_44', 'wr_45', 'wr_46') as $lang_field) {
    if (!empty(${$lang_field})) {
        $search_condition[] = "$lang_field = '" . sql_real_escape_string(${$lang_field}) . "'";
    }
}

// PM 검색
if ($wr_10) {
    $search_condition[] = "wr_10 = '" . sql_real_escape_string($wr_10) . "'";
}

// 체크박스 검색 최적화 - FIND_IN_SET 사용
foreach (array('wr_41', 'wr_42') as $field) {
    if (!empty(${$field}) && is_array(${$field})) {
        $checkbox_condition = array();
        foreach (${$field} as $value) {
            $checkbox_condition[] = "FIND_IN_SET('" . sql_real_escape_string($value) . "', REPLACE($field, '|', ',')) > 0";
        }
        $search_condition[] = '(' . implode(' OR ', $checkbox_condition) . ')';
    }
}

// 최종 검색 조건 조합
$sql_search = implode(' AND ', $search_condition);
if ($sql_search) {
    $sql_search = ' WHERE ' . $sql_search;
}

// 정렬 설정 - 인덱스가 있는 필드로 정렬
//$sst = isset($_POST['sst']) ? $_POST['sst'] : '';
//$sod = isset($_POST['sod']) ? $_POST['sod'] : 'desc';

// 기본 정렬은 인덱스가 있는 필드로 설정
//$sql_order = $sst ? " ORDER BY {$sst} {$sod} " : " ORDER BY wr_id DESC ";

// 정렬 처리
$sql_order = " ORDER BY wr_60 DESC ";

// 정렬 파라미터가 있으면 적용
if (isset($_POST['sst']) && $_POST['sst']) {
    $sst = sql_real_escape_string($_POST['sst']);
    $sod = isset($_POST['sod']) ? strtoupper(sql_real_escape_string($_POST['sod'])) : 'DESC';
    
    // 허용된 정렬 필드만 처리 (보안)
    $allowed_sort_fields = array('wr_datetime', 'wr_60');
    
    if (in_array($sst, $allowed_sort_fields)) {
        if ($sod != 'ASC' && $sod != 'DESC') {
            $sod = 'DESC';
        }
        $sql_order = " ORDER BY {$sst} {$sod}, wr_num DESC ";
    }
}


// 페이지네이션
$page_rows = G5_IS_MOBILE ? $board['bo_mobile_page_rows'] : $board['bo_page_rows'];
$page = ($page < 1) ? 1 : $page;
$from_record = ($page - 1) * $page_rows;

// 캐시 키 생성 - 검색 조건을 기반으로
$cache_key = md5($sql_search . $sql_order . $page . $page_rows);
$cached_data = get_cached_data($cache_key);

// 캐시 데이터가 있으면 사용, 없으면 DB 조회
if ($cached_data) {
    $response = $cached_data;
} else {
    // 쿼리 실행 시간 측정 시작
    $query_start_time = microtime(true);
    
    // 전체 게시물 수 조회 - COUNT(1)으로 최적화 및 인덱스 활용
    $sql = " SELECT COUNT(1) AS cnt FROM {$write_table} {$sql_search}";
    $row = sql_fetch($sql);
    $total_count = $row['cnt'];
    $total_page = ceil($total_count / $page_rows);
    
    // 쿼리 실행 시간 측정 종료
    $query_time = microtime(true) - $query_start_time;
    if ($query_time > 0.5) { // 0.5초 이상 걸린 쿼리 로깅
        error_log("Slow query (count): Time: {$query_time}s, SQL: {$sql}");
    }
    
    // 게시물 목록 조회 - 필요한 필드만 선택하여 최적화
    $select_fields = implode(', ', $include_fields);
    
    // 메인 쿼리 실행 시간 측정 시작
    $query_start_time = microtime(true);
    
    $sql = " SELECT {$select_fields} FROM {$write_table} {$sql_search} {$sql_order} LIMIT {$from_record}, {$page_rows} ";
    $result = sql_query($sql);
    
    // 쿼리 실행 시간 측정 종료
    $query_time = microtime(true) - $query_start_time;
    if ($query_time > 0.5) { // 0.5초 이상 걸린 쿼리 로깅
        error_log("Slow query (main): Time: {$query_time}s, SQL: {$sql}");
    }
    
    // 결과 처리
    $list = array();
    $num = $total_count - ($page - 1) * $page_rows;
    
    // 프로젝트 댓글 처리 최적화 - 한 번에 모든 wr_id 수집
    $wr_ids = array();
    while ($row = sql_fetch_array($result)) {
        $wr_ids[] = $row['wr_id'];
    }
    
    // 프로젝트 댓글은 한 번에 가져오기 (JOIN 대신 별도 쿼리로 처리)
    $project_comments = array();
    if (!empty($wr_ids)) {
        $wr_ids_str = implode(',', $wr_ids);
        
        // 댓글 쿼리 실행 시간 측정 시작
        $query_start_time = microtime(true);
        
        $comment_sql = " SELECT wr_23, wr_parent, wr_content, wr_datetime, wr_8, wr_28 
                         FROM {$g5['write_prefix']}project 
                         WHERE wr_23 IN ({$wr_ids_str}) 
                         AND wr_is_comment = 1 
                         AND wr_2 != '두번' 
                         ORDER BY wr_28 DESC ";
        $comment_result = sql_query($comment_sql);
        
        // 쿼리 실행 시간 측정 종료


$query_time = microtime(true) - $query_start_time;
        if ($query_time > 0.5) { // 0.5초 이상 걸린 쿼리 로깅
            error_log("Slow query (comments): Time: {$query_time}s, SQL: {$comment_sql}");
        }
        
        while ($row = sql_fetch_array($comment_result)) {
            if (!isset($project_comments[$row['wr_23']])) {
                $project_comments[$row['wr_23']] = array();
            }
            
            // 각 게시물당 최대 3개의 댓글만 표시
            if (count($project_comments[$row['wr_23']]) >= 3) continue;
            
            $pid = $row['wr_parent'];
            $rdate = $row['wr_28'] ? date("Y-m-d", strtotime($row['wr_28'])) : 
                                    date("Y-m-d", strtotime($row['wr_datetime']));
            $psub = $row['wr_8'];
            $step = get_step_color($row['wr_content']);
            
            $comment = get_comment_html($row, $rdate, $step);
            $project_comments[$row['wr_23']][] = $comment;
        }
    }
    
    // 목록 데이터 생성 - 데이터 재활용 최적화
    sql_data_seek($result, 0);
    for ($i=0; $row = sql_fetch_array($result); $i++) {
        $list_item = array();
        
        // 기본 필드 복사
        foreach ($include_fields as $field) {
            if (isset($row[$field])) {
                $list_item[$field] = $row[$field];
            }
        }
        
        // get_list 함수에서 필요한 처리만 추출하여 적용
        $list_item['subject'] = get_text($row['wr_subject']);
        $list_item['datetime'] = substr($row['wr_datetime'], 2, 8);
        $list_item['num'] = $num--;
        
        // 기본 정보
        $list_item['name'] = $row['wr_name'];
        $list_item['file'] = $row['wr_file'];
        $list_item['comment'] = isset($project_comments[$row['wr_id']]) ? implode('', $project_comments[$row['wr_id']]) : '';
        
        // 추가 정보 - 미리 계산된 교육/경력 정보
        $list_item['edu'] = get_education_info($row);
        $list_item['com'] = get_career_info($row);
        
		
if($list_item['wr_60']){
$list_item['wr_60'] = date("Y-m-d", strtotime($list_item['wr_60']));
}		
		
        $list[] = $list_item;
    }
    
    // 응답 생성
    $response = new stdClass();
    $response->currentPage = $page;
    $response->totalPage = $total_page;
    $response->totalCount = $total_count;
    $response->perPage = G5_IS_MOBILE ? $config['cf_mobile_pages'] : $config['cf_write_pages'];
    $response->rows = $list;
    $response->para = array_filter($_POST);
    
    // 캐싱 - 결과 저장 (5분)
    set_cached_data($cache_key, $response, 300);
}

// 출력
echo json_encode($response);

// 전체 실행 시간 로깅
$execution_time = microtime(true) - $start_time;
if ($execution_time > 1.0) { // 1초 이상 걸린 요청 로깅
    error_log("Slow request: Time: {$execution_time}s, Params: " . json_encode($_POST));
}

/**
 * 캐시 데이터 가져오기
 * 
 * @param string $key 캐시 키
 * @return mixed 캐시된 데이터 또는 false
 */
function get_cached_data($key) {
    global $g5;
    
    // 캐시 사용 여부 확인 (별도 설정에 따라 활성화)
    if (!defined('G5_USE_CACHE') || !G5_USE_CACHE) {
        return false;
    }
    
    $cache_file = G5_DATA_PATH . '/cache/' . $key . '.cache.php';
    
    if (file_exists($cache_file)) {
        $filetime = filemtime($cache_file);
        $cache_time = 300; // 5분
        
        if ($filetime && $filetime > (time() - $cache_time)) {
            $cache = include($cache_file);
            return $cache;
        }
    }
    
    return false;
}

/**
 * 캐시 데이터 저장
 * 
 * @param string $key 캐시 키
 * @param mixed $data 저장할 데이터
 * @param int $ttl 캐시 유지 시간 (초)
 * @return bool 저장 성공 여부
 */
function set_cached_data($key, $data, $ttl = 300) {
    global $g5;
    
    // 캐시 사용 여부 확인
    if (!defined('G5_USE_CACHE') || !G5_USE_CACHE) {
        return false;
    }
    
    $cache_dir = G5_DATA_PATH . '/cache';
    
    // 캐시 디렉토리 확인 및 생성
    if (!is_dir($cache_dir)) {
        @mkdir($cache_dir, 0755, true);
    }
    
    $cache_file = $cache_dir . '/' . $key . '.cache.php';
    $content = "<?php\nif (!defined('_GNUBOARD_')) exit;\nreturn " . var_export($data, true) . ";\n?>";
    
    return @file_put_contents($cache_file, $content, LOCK_EX);
}

// 유틸리티 함수들
function get_step_color($content) {
    $colors = [
        '서류추천' => 'color:#009900',
        '인터뷰예정' => 'color:#3867d6',
        '인터뷰진행중' => 'color:#3867d6',
        '인터뷰후대기' => 'color:#3867d6',
        '연봉협상중' => 'color:#3867d6',
        '최종합격' => 'color:#eb3b5a',
        '출근' => 'color:#eb3b5a'
    ];
    
    return isset($colors[$content]) ? $colors[$content] : 'color:#616c77';
}

function get_education_info($row) {
    // 배열로 한 번에 분리하여 처리 (메모리 최적화)
    $wr_body_25 = isset($row['wr_25']) ? explode("|", substr($row['wr_25'], 1)) : [];
    $wr_body_26 = isset($row['wr_26']) ? explode("|", substr($row['wr_26'], 1)) : [];
    $wr_body_27 = isset($row['wr_27']) ? explode("|", substr($row['wr_27'], 1)) : [];

    $edu = '';
    $count = count($wr_body_25);
    
    // 문자열 연결 최적화
    $edu_items = [];
    for ($j = 0; $j < $count; $j++) {
        $content = '';
        if (!empty($wr_body_25[$j])) {
            $content = htmlspecialchars($wr_body_25[$j]) . ' ' . 
                      (isset($wr_body_26[$j]) ? htmlspecialchars($wr_body_26[$j]) : '') . ' ' . 
                      (isset($wr_body_27[$j]) ? htmlspecialchars($wr_body_27[$j]) : '');
        }
        if ($content) {
            $edu_items[] = '<p style="padding:0px;margin:0px;">&middot; ' . trim($content) . '</p>';
        }
    }
    
    return implode('', $edu_items);
}

function get_career_info($row) {
    if (!isset($row['wr_33'])) return '';
    
    $wr_body_33 = explode("|", substr($row['wr_33'], 1));
    
    // 문자열 연결 최적화
    $com_items = [];
    foreach ($wr_body_33 as $item) {
        if (!empty($item)) {
            $com_items[] = '<p style="padding:0px;margin:0px;">&middot; ' . htmlspecialchars(trim($item)) . '</p>';
        }
    }
    
    return implode('', $com_items);
}

function get_comment_html($row, $rdate, $step) {
    $pid = $row['wr_parent'];
    $psub = $row['wr_8'];
    
    // HTML 생성 최적화 - 문자열 연결 최소화
    $html_parts = [];
    
    $html_parts[] = '<a href="#" class="popupLayer" data-id="'.G5_ADMIN_URL.'/bbs/board.php?bo_table=project&wr_id='.$pid.'" ';
    $html_parts[] = 'data-subject="Project" data-original-title="'.$psub.'" data-toggle="tooltip" data-placement="bottom" ';
    $html_parts[] = 'style="font-weight:700;display:inline-block;width:80px !important;"><span style="float:left;'.$step.'">'.$row['wr_content'].'</span></a>';
    $html_parts[] = '<span style="float:right;display:inline-block;"><a href="#" class="popupLayer" data-id="'.G5_ADMIN_URL.'/bbs/board.php?bo_table=project&wr_id='.$pid.'" ';
    $html_parts[] = 'data-subject="Project" style="font-size:11px;color:#007bff;">'.$rdate.'</a></span><br>';
    
    return implode('', $html_parts);
}
?>