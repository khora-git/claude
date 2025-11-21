<?php
/**
 * 그누보드 기반 서치펌 시스템 - 게시판 목록 스킨 (Ajax 방식)
 * 파일명: list.skin_ajax.php
 */
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가

// ========================================
// 1. 초기 설정 및 변수 초기화
// ========================================

// 체크박스 필터 값 초기화 (URL 파라미터에서 가져오기)
// wr_41: 업종, wr_42: 직종 (콤마로 구분된 문자열을 배열로 변환)
$wr_41_values = isset($_GET['wr_41']) ? explode(',', $_GET['wr_41']) : [];
$wr_42_values = isset($_GET['wr_42']) ? explode(',', $_GET['wr_42']) : [];

// 테이블 컬럼 수 계산
$is_checkbox = true;
$colspan = 15; // 기본 컬럼 수

if ($is_checkbox) $colspan++; // 체크박스 컬럼 추가
if ($is_good) $colspan++; // 추천 컬럼 추가
if ($is_nogood) $colspan++; // 비추천 컬럼 추가

// ========================================
// 2. 정적 자원 로드 (CSS, JavaScript)
// ========================================

// 스타일시트 목록 - priority 값이 낮을수록 먼저 로드
$styles = [
    G5_PLUGIN_URL.'/rumiPopup/rumiPopup.css' => 0, // 팝업 스타일
    $board_skin_url.'/style_a.css' => 5            // 게시판 스킨 스타일
];

// 자바스크립트 목록 - priority 값이 낮을수록 먼저 로드
$scripts = [
    G5_PLUGIN_URL.'/rumiPaging/jquery.rumiPaging2.js' => 200, // 페이징 플러그인
    G5_PLUGIN_URL.'/rumiPopup/jquery.rumiPopup.js' => 201,    // 팝업 플러그인
    $board_skin_url.'/script.js' => 202                       // 게시판 스크립트
];

// 정적 자원 로드 (defer 속성으로 비동기 로드)
foreach ($styles as $href => $priority) {
    add_stylesheet('<link rel="stylesheet" href="'.$href.'" media="all">', $priority);
}

foreach ($scripts as $src => $priority) {
    add_javascript('<script src="'.$src.'" defer></script>', $priority);
}

// ========================================
// 3. JavaScript 전역 설정 변수 전달
// ========================================

// PHP 설정값을 JavaScript로 전달 (JSON 형식)
$config_js = [
    'bo_table' => $bo_table,                                                              // 게시판 테이블명
    'board_skin_url' => $board_skin_url,                                                  // 스킨 URL
    'bbs_url' => G5_ADMIN_BBS_URL,                                                        // 게시판 URL
    'write_pages' => G5_IS_MOBILE ? $config['cf_mobile_pages'] : $config['cf_write_pages'], // 페이지당 게시물 수
    'page_group' => 10,                                                                   // 페이징 그룹 수
    'sortname' => "id_no",                                                                // 기본 정렬 필드
    'sortorder' => "desc",                                                                // 기본 정렬 방향
    'colspan' => $colspan,                                                                // 테이블 컬럼 수
    'isCheckbox' => $is_checkbox,                                                         // 체크박스 사용 여부
    'isCategory' => $is_category,                                                         // 카테고리 사용 여부
    'isGood' => $is_good,                                                                 // 추천 사용 여부
    'isNogood' => $is_nogood,                                                             // 비추천 사용 여부
    'g5m' => $member['mb_id'],                                                            // 현재 로그인 사용자 ID
    'g5adm' => $is_admin                                                                  // 관리자 권한 여부
];

// JavaScript 전역 변수로 설정값 전달
add_javascript('
<script>
var cfg = '.json_encode($config_js).';
// 초기 로딩에서는 로딩 표시 비활성화
window.showLoadingOnSearch = false;
</script>
', 99);
?>

<!-- ======================================== -->
<!-- 4. 커스텀 스타일 정의 -->
<!-- ======================================== -->
<style>
/* 이미지 크기 제한 */
p img { height:18px; }

/* 체크박스 레이블 텍스트 스타일 */
.chktext { display: inline-block; vertical-align: top; margin-left: 5px;margin-top: -6px;}
.chktext { color:#333; }
.dark-mode .chktext { color:#ced4da; }

/* 테이블 행 배경 */
.trb { background:#999; }
.dark-mode .trb { background:#3e3e3e; }

/* 선택된 필터 표시 영역 */
.selected-filters {
    margin-bottom: 0px;
}

/* 필터 태그 스타일 */
.tag {
    display: inline-block;
    background-color: #27CBC0;
    color:#fff;
    padding: 5px 10px;
    margin-right: 5px;
    margin-bottom: 5px;
    border-radius: 3px;
    cursor: pointer;
}
.tag:hover {
    background-color: #777;
}

/* 전체 게시물 수 표시 */
.total {margin-bottom:0.5rem;color:#333;font-size:0.7rem;}
.dark-mode .total {color:#eee;}

/* Sticky 헤더 적용 - 이름 컬럼 고정 */
.tbl_wrap table th:nth-child(3){
  position: -webkit-sticky;
  position: sticky;
  left: -1px;
}
.tbl_wrap table td:nth-child(3){
  background-color: #F9F9F9;
  position: -webkit-sticky;
  position: sticky;
  left: -1px;
}

/* 다크모드에서 Sticky 컬럼 배경색 */
.dark-mode .tbl_head01 tbody td:nth-child(3){
  background-color: #222 !important;
}

/* 툴팁 스타일 확장 */
.tooltip-inner {
    max-width: 1000px !important;
    text-align: left !important;
}

/* 로딩 오버레이 스타일 */
#loading-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 999999;
    background: rgba(0,0,0,0.5);
    opacity: 0;
    transition: opacity 0.3s ease; /* 페이드 효과 */
}
#loading-overlay.show {
    opacity: 1;
}
#loading-content {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    background: white;
    padding: 20px;
    border-radius: 5px;
    box-shadow: 0 0 15px rgba(0,0,0,0.2);
}
.loading-spinner {
    color: #26b4ff;
}

/* 페이징 버튼 - 첫번째/마지막 화살표 숨기기 */
#rumi-paging .page-btn-arrow:first-child,
#rumi-paging .page-btn-arrow:last-child {
    display: none !important;
}

.page-btn[data-name='first-page'],
.page-btn[data-name='last-page'] {
    display: none !important;
}

/* 드롭다운 메뉴 스타일 (정렬 선택) */
.dropdown-menu li.active > a {
    background-color: #337ab7;
    color: #fff;
}

.dropdown-menu li.active > a:hover {
    background-color: #286090;
    color: #fff;
}

.dropdown-menu > li > a {
    padding: 8px 20px;
    font-size: 0.7rem;
}

.dropdown-menu > li > a i {
    margin-right: 8px;
    width: 14px;
    text-align: center;
}
</style>

<!-- ======================================== -->
<!-- 5. 게시판 목록 UI -->
<!-- ======================================== -->

<!-- 게시판 목록 시작 { -->
<div id="bo_list" style="width:<?php echo $width; ?>">
    <!-- 선택된 필터 표시 영역 (태그 형식) -->
    <div id="selected-filters" class="selected-filters">
        <!-- 선택된 필터들이 여기에 동적으로 추가됩니다 (script.js에서 처리) -->
    </div>

    <!-- 전체 게시물 수 및 현재 페이지 표시 -->
    <div class="total">
        Total <span id="total-count">0</span>건
        <span id="current-page">1</span> 페이지
		
<div class="dropdown" style="display:inline-block;margin-left:10px;">
    <button type="button" class="btn btn-xs btn-info dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
 	<i class="fa fa-sort"></i> <?php 
		if($sst == 'wr_datetime') echo '등록일순';
		elseif($sst == 'wr_60') echo '수정일순';
		else echo '정렬';
	?> <span class="caret"></span>
    </button>
	<ul class="dropdown-menu" role="menu">

	 <li class="divider"></li>
	 <li<?php if($sst == 'wr_datetime') echo ' class="active"';?>>
	  <a href="#" class="sort-link" data-sort="wr_datetime" data-order="desc"><i class="fa fa-clock-o"></i> 등록일순</a>
	 </li>
	 <li<?php if($sst == 'wr_60') echo ' class="active"';?>>
	  <a href="#" class="sort-link" data-sort="wr_60" data-order="desc"><i class="fa fa-calendar"></i> 수정일순</a>
	 </li>
	 <li<?php if(!$sst) echo ' class="active"';?>>
	  <a href="#" class="sort-link" data-sort="" data-order=""><i class="fa fa-list"></i> 초기화</a>
	 </li> 
	</ul>
</div>		
		
		
<?php
// 현재 URL에 wr_10 파라미터가 있는지 확인
$is_personal = isset($_GET['wr_10']) && !empty($_GET['wr_10']);
?>

<span style="padding-left:10px;">
    <?php if ($is_personal): ?>
        <!-- 현재 "본인 Order" 상태이므로 "전체 Order" 버튼 표시 -->
        <a href="<?php echo G5_ADMIN_BBS_URL; ?>/board.php?bo_table=db" 
           class="btn btn-xs btn-info" 
           style="color:#fff;"> 전체 DB </a>
    <?php else: ?>
        <!-- 현재 "전체 Order" 상태이므로 "본인 Order" 버튼 표시 -->
        <a href="<?php echo G5_ADMIN_BBS_URL; ?>/board.php?bo_table=db&wr_10=<?php echo $member['mb_id'] ?>" 
           class="btn btn-xs btn-info" 
           style="color:#fff;"> 본인 DB </a>
    <?php endif; ?>
</span>
		

    </div>
    
    <!-- 게시판 검색 시작 { -->
    <div class="bo_sch_wrap">
        <fieldset class="bo_sch">
            <form name="fsearch" id="fsearch" method="get" autocomplete="off">
                <input type="hidden" name="bo_table" value="<?php echo $bo_table ?>">
                <input type="hidden" name="sca" id="sca" value="<?php echo $sca ?>">
                <input type="hidden" name="page" id="page" value="<?php echo $page ?>">
                <!--<input type="hidden" name="sop" value="and">-->

<input type="hidden" name="sst" id="sst" value="<?php echo $sst ?>">
<input type="hidden" name="sod" id="sod" value="<?php echo $sod ?>">

                <!-- ======================================== -->
                <!-- 업종/직종 체크박스 필터 -->
                <!-- ======================================== -->
                <div class="form-group row" style="padding:0 0px;">
                    <div class="col-sm-12">
                        <label for="" class="col-form-label stTxt" style="margin-bottom:0;width:100%;">▣ <?php echo $board['bo_7_subj'] ?> (중복검색가능)
                        <?php if($is_admin == 'super') { ?>
                            <a onclick="openPopup('Job', 'job_form.php', '<?php echo $board['bo_7_subj'] ?>/<?php echo $board['bo_8_subj'] ?> 추가삭제');" style="background:#000;color:#fff;height:22px;font-size:10px;padding:3px 10px;"><?php echo $board['bo_7_subj'] ?>/<?php echo $board['bo_8_subj'] ?>수정</a>
                        <?php } ?>
                        </label>
                        <hr style="margin:0;">

                        <!-- 업종 체크박스 목록 -->
                        <div style="line-height:26px;margin-top:10px;">
                        <?php
                        // 게시판 설정에서 업종 목록 가져오기 (파이프 구분자)
                        $field_value = $board["bo_7"];
                        $field_value_exp = explode("|", $field_value);
                        for ($k = 1; $k < count($field_value_exp); $k++) {
                            $value = $field_value_exp[$k];
                            $checked = in_array($value, $wr_41_values) ? 'checked' : '';
                            ?>
                            <span style="display:inline-block;width:160px;" class="chk_box">
                                <input type="checkbox" id="wr_41_<?php echo $k; ?>" name="wr_41[]" <?php echo $checked; ?> value="<?php echo $value; ?>" class="selec_chk">
                                <label for="wr_41_<?php echo $k; ?>"><span></span> <font class="chktext"><?php echo $value; ?></font></label>
                            </span>
                        <?php } ?>
                        </div>

                        <label for="" class="col-form-label stTxt" style="margin-top:0px;margin-bottom:0;width:100%;">▣ <?php echo $board['bo_8_subj'] ?> (중복검색가능)</label>
                        <hr style="margin:0;">

                        <!-- 직종 체크박스 목록 -->
                        <div style="line-height:26px;margin-top:10px;">
                        <?php
                        // 게시판 설정에서 직종 목록 가져오기 (파이프 구분자)
                        $field_value = $board["bo_8"];
                        $field_value_exp = explode("|", $field_value);
                        for ($k = 1; $k < count($field_value_exp); $k++) {
                            $value = $field_value_exp[$k];
                            $checked = in_array($value, $wr_42_values) ? 'checked' : '';
                            ?>
                            <span style="display:inline-block;width:160px;" class="chk_box">
                                <input type="checkbox" id="wr_42_<?php echo $k; ?>" name="wr_42[]" <?php echo $checked; ?> value="<?php echo $value; ?>" class="selec_chk">
                                <label for="wr_42_<?php echo $k; ?>"><span></span> <font class="chktext"><?php echo $value; ?></font></label>
                            </span>
                        <?php } ?>
                        </div>
                    </div>
                </div>

                <hr style="margin:0 8px;">

                <!-- ======================================== -->
                <!-- 기본 필터 (성별, 나이, 경력) -->
                <!-- ======================================== -->
                <div class="form-group row" style="margin-top:10px;">
                    <!-- 성별 필터 -->
                    <div class="col-sm-4" style="margin-bottom:1px;">
                        <label for="" class="col-form-label stTxt">▣ 성별 : </label>
                        <select name="wr_16" class="form-control input-sm w100" style="display:inline-block;">
                            <option value=''>성별</option>
                            <option value="남" <?=($wr_16=='남')?'selected':''?>>남</option>
                            <option value="여" <?=($wr_16=='여')?'selected':''?>>여</option>
                        </select>
                    </div>

                    <!-- 나이 범위 필터 (출생년도 기준) -->
                    <div class="col-sm-4">
                        <label for="" class="col-form-label stTxt">▣ 나이 : </label>
                        <?php
                        $startYear = date("Y")-70; // 최소 출생년도 (70세)
                        $endYear = date("Y")-19;   // 최대 출생년도 (19세)
                        ?>

                        <select name='t_end' class="form-control input-sm w100" style="display:inline-block;">
                            <option value=''>나이</option>
                            <?php for($i = $endYear; $i > $startYear; $i--) { 
                                $age = date('Y') - $i + 1; ?>
                                <option value='<?=$i?>' <?=($t_end==$i)?'selected':''?>><?=$age?>세(<?=$i?>)</option>
                            <?php } ?>
                        </select>
                        ~
                        <select name='t_start' class="form-control input-sm w100" style="display:inline-block;">
                            <option value=''>나이</option>
                            <?php for($i = $endYear; $i > $startYear; $i--) { 
                                $age = date('Y') - $i + 1; ?>
                                <option value='<?=$i?>' <?=($t_start==$i)?'selected':''?>><?=$age?>세(<?=$i?>)</option>
                            <?php } ?>
                        </select>
                    </div>

                    <!-- 경력 범위 필터 (년차 기준) -->
                    <div class="col-sm-4">
                        <label for="" class="col-form-label stTxt">▣ 경력 : </label>
                        <select name='c_start' class="form-control input-sm w100" style="display:inline-block;">
                            <option value=''>경력</option>
                            <?php
                            $cstart = "00"; // 최소 경력 (신입)
                            $cend = "41";   // 최대 경력 (40년차)
                            for($i = $cstart; $i < $cend; $i++) {
                                $i = sprintf("%02d", $i); // 2자리 포맷 (01, 02, ...)
                                ?>
                                <option value='<?=$i?>' <?=($c_start==$i)?'selected':''?>><?=$i?></option>
                            <?php } ?>
                        </select>
                        ~
                        <select name='c_end' class="form-control input-sm w100" style="display:inline-block;">
                            <option value=''>경력</option>
                            <?php for($i = $cstart; $i < $cend; $i++) {
                                $i = sprintf("%02d", $i); ?>
                                <option value='<?=$i?>' <?=($c_end==$i)?'selected':''?>><?=$i?></option>
                            <?php } ?>
                        </select>
                    </div>
                </div>

                <!-- ======================================== -->
                <!-- 언어, PM, 학력 필터 -->
                <!-- ======================================== -->
                <div class="form-group row" style="margin-top:10px;margin-bottom:30px;">
                    <!-- 언어 필터 (영어, 일본어, 중국어) -->
                    <div class="col-sm-4">
                        <label for="" class="col-form-label stTxt">▣ 언어 : </label>
                        <select name='wr_44' class="form-control input-sm w70" style="display:inline-block;">
                            <option value=''>영어</option>
                            <option value="상" <?=($wr_44=='상')?'selected':''?>>상</option>
                            <option value="중" <?=($wr_44=='중')?'selected':''?>>중</option>
                            <option value="하" <?=($wr_44=='하')?'selected':''?>>하</option>
                        </select>
                        <select name='wr_45' class="form-control input-sm w70" style="display:inline-block;">
                            <option value=''>일본어</option>
                            <option value="상" <?=($wr_45=='상')?'selected':''?>>상</option>
                            <option value="중" <?=($wr_45=='중')?'selected':''?>>중</option>
                            <option value="하" <?=($wr_45=='하')?'selected':''?>>하</option>
                        </select>
                        <select name='wr_46' class="form-control input-sm w70" style="display:inline-block;">
                            <option value=''>중국어</option>
                            <option value="상" <?=($wr_46=='상')?'selected':''?>>상</option>
                            <option value="중" <?=($wr_46=='중')?'selected':''?>>중</option>
                            <option value="하" <?=($wr_46=='하')?'selected':''?>>하</option>
                        </select>
                    </div>

                    <!-- PM(컨설턴트) 필터 -->
                    <div class="col-sm-4">
                        <label for="" class="col-form-label stTxt">▣ PM : </label>
                        <select name="wr_10" class="form-control input-sm w150" style="display:inline-block;">
                            <option value=''>컨설턴트선택</option>
                            <?php
                            // mb_level = 10인 컨설턴트 목록 조회
                            $sql3 = "SELECT mb_id, mb_name, mb_nick, mb_datetime FROM {$g5['member_table']} WHERE mb_level = '10' order by mb_name asc";
                            $result3 = sql_query($sql3);
                            while($row3 = sql_fetch_array($result3)) { ?> 
                                <option value='<?=$row3['mb_id']?>' <?php if($wr_10 == $row3['mb_id']) echo "selected"; ?>><?=$row3['mb_nick']?>(<?=$row3['mb_id']?>)</option> 
                            <?php } ?> 
                        </select>
                    </div>

                    <!-- 학력 필터 (학교, 학과) -->
                    <div class="col-sm-4">
                        <label for="" class="col-form-label stTxt">▣ 학력 : </label>
                        <input type="text" name="wr_25" value="<?php echo $_GET['wr_25'] ?>" class="form-control input-sm w100" placeholder="학교" >
                        <input type="text" name="wr_27" value="<?php echo $_GET['wr_27'] ?>" class="form-control input-sm w100" placeholder="학과">
                    </div>
                </div>

                <!-- ======================================== -->
                <!-- 검색어 입력 및 검색 버튼 -->
                <!-- ======================================== -->
                <div class="form-group row" style="margin-top:10px;">
                    <div class="col-sm-5">
                        <!-- 검색 대상 선택 -->
                        <label for="sfl" class="sound_only">검색대상</label>
                        <div style="float:left;width:29%;">
                            <select name="sfl" id="sfl" style="height:50px;">
                                <option value="wr_subject"<?php echo get_selected($sfl, 'wr_subject', true); ?>>이름</option>
                                <option value="wr_51"<?php echo get_selected($sfl, 'wr_51', true); ?>>키워드</option>
                                <option value="wr_33"<?php echo get_selected($sfl, 'wr_33', true); ?>>회사</option>
                                <option value="wr_14||wr_15"<?php echo get_selected($sfl, 'wr_14||wr_15', true); ?>>연락처</option>
                                <option value="wr_67"<?php echo get_selected($sfl, 'wr_67'); ?>>상세내용</option>
                            </select>
                        </div>

                        <!-- 검색어 입력 -->
                        <label for="stx" class="sound_only">검색어<strong class="sound_only"> 필수</strong></label>
                        <div class="sch_bar schWrap" style="float:right;width:70%;">
                            <input type="text" name="stx" value="<?php echo stripslashes($stx) ?>" id="stx" class="sch_input" placeholder=" 검색어를 입력해주세요">
                        </div>
                    </div>

                    <!-- 검색 연산자 선택 (AND/OR) -->
                    <div class="col-sm-1" style="display: flex; justify-content: center; align-items: center;">
                        <input type="radio" name="sop" value="and">and&nbsp;&nbsp;
                        <input type="radio" name="sop" value="or">or
                    </div>

                    <!-- 빠른 검색 옵션 (근사값 COUNT) -->
                    <div class="col-sm-12" style="margin-top: 10px; padding-left: 15px;">
                        <label style="font-size: 13px; cursor: pointer;">
                            <input type="checkbox" name="use_approx_count" id="use_approx_count" value="1">
                            빠른 검색 (근사값 카운트 사용) - 정확도는 낮지만 검색 속도가 빠릅니다
                        </label>
                    </div>

<script>
    if ('<?=$sop?>' == 'and')
        document.fsearch.sop[0].checked = true;
    if ('<?=$sop?>' == 'or')
        document.fsearch.sop[1].checked = true;
</script> 					
					
					
                    <div class="col-sm-6">
                        <div class="frmSearchBtns" style="width:100%;display:inline-block;">
                            <button type="button" id="rumiReload" class="sch_btn" style="display:none;"></button>
                            <button type="button" id="rumiReset" class="sch_btn" style="width:30%;background:#222;color:#fff;"><i class='fa fa-refresh' aria-hidden='true'></i><span class="sound_only">새로고침</span></button>
                            <button type="button" value="검색" id="sch_btn" class="sch_btn" style="width:70%;background:#26b4ff;color:#fff;"><i class="fa fa-search" aria-hidden="true"></i><span class="sound_only">검색</span></button>
                        </div>
                    </div>
                </div>
            </form>
        </fieldset>
    </div>
    <!-- } 게시판 검색 끝 -->
    
    <form name="fboardlist" id="fboardlist" action="<?php echo G5_ADMIN_BBS_URL; ?>/board_list_update.php" onsubmit="return fboardlist_submit(this);" method="post">
        <input type="hidden" name="bo_table" value="<?php echo $bo_table ?>">
        <input type="hidden" name="sfl" value="<?php echo $sfl ?>">
        <input type="hidden" name="stx" value="<?php echo $stx ?>">
        <input type="hidden" name="spt" value="<?php echo $spt ?>">
        <input type="hidden" name="sca" value="<?php echo $sca ?>">
        <input type="hidden" name="page" value="<?php echo $page ?>">
        <input type="hidden" name="sw" value="">

        <!-- ======================================== -->
        <!-- 게시판 테이블 -->
        <!-- ======================================== -->

        <!-- 관리 버튼 영역 -->
        <div class="btn_fixed_top btn_confirm">
             <?php if ($write_href) { ?><a href="javascript:bbsView();" class="btn btn_a01" title="등록하기"><i class="fa fa-pencil" aria-hidden="true"></i> <span class="hidden">등록하기</span></a><?php } ?>
        </div>

        <div id="bo_btn_top"></div>

        <!-- 게시물 목록 테이블 -->
        <div class="tbl_head01 tbl_wrap">
            <table>
                <caption><?php echo $board['bo_subject'] ?> 목록</caption>
                <thead>
                    <tr>
                        <?php if ($is_checkbox) { ?>
                        <!-- 전체 선택 체크박스 -->
                        <th scope="col" class="all_chk chk_box" width="30px">
                            <input type="checkbox" id="chkall" onclick="if (this.checked) all_checked(true); else all_checked(false);" class="selec_chk">
                            <label for="chkall">
                                <span></span>
                                <b class="sound_only">현재 페이지 게시물 전체선택</b>
                            </label>
                        </th>
                        <?php } ?>
                        <!-- 테이블 헤더 -->
                        <th scope="col" width="50px"><i class="fa fa-list-ol"></i></th>
                        <th scope="col" width="85px">이름</th>
                        <th scope="col" width="60px">나이</th>
                        <th scope="col" width="70px">경력</th>
                        <th scope="col" width="220px">학력</th>
                        <th scope="col" width="230px">경력회사</th>
                        <th scope="col" width="" style="min-width:230px;">업종/직무/키워드</th>
                        <th scope="col" width="180px">추천히스토리</th>
                        <th scope="col" width="160px">연락처</th>
                        <th scope="col" width="100px">PM</th>
                        <th scope="col" width="80px">등록일</th>
                        <th scope="col" width="80px">수정일</th>
                    </tr>
                </thead>
                <!-- 게시물 목록 (Ajax로 동적 로드) -->
                <tbody id="tbl-list"></tbody>
            </table>
        </div>

        <!-- ======================================== -->
        <!-- 페이징 및 버튼 영역 -->
        <!-- ======================================== -->

        <!-- 페이징 출력 영역 (rumiPaging 플러그인) -->
        <div id="rumi-paging"></div>

        <?php if ($list_href || $is_checkbox || $write_href) { ?>
        <!-- 좌측 버튼 (선택삭제 등) -->
        <div class="bo_fx" style="float:left;">
            <?php if ($list_href || $write_href) { ?>
            <ul class="btn_bo_user">
                <?php if ($admin_href) { ?>
                <button type="submit" name="btn_submit" value="선택삭제" onclick="document.pressed=this.value" class="btn btn_04"><i class="fa fa-trash-o" aria-hidden="true"></i> <span class="hidden">선택삭제</span></button>
                <?php } ?>

                <!-- 엑셀 다운로드 기능 (주석 처리됨)
                <?php if ($admin_href) { ?>
                <a id="excel" onclick="prInt('excel');" class="btn btn-primary excel">엑셀파일로 저장</a>
                <?php } ?>
                -->
            </ul>
            <?php } ?>
        </div>    
        
        <!-- 우측 버튼 (등록하기) -->
        <div class="bo_fx">
            <?php if ($list_href || $write_href) { ?>
            <ul class="btn_bo_user">
                <?php if ($write_href) { ?><a href="javascript:bbsView();" class="btn btn_a01" title="등록하기" data-toggle="tooltip"><i class="fa fa-pencil" aria-hidden="true"></i> <span class="hidden">등록하기</span></a><?php } ?>
            </ul>
            <?php } ?>
        </div>
        <?php } ?>
    </form>
</div>

<!-- ======================================== -->
<!-- JavaScript 이벤트 처리 -->
<!-- ======================================== -->

<?php if($is_checkbox) { ?>
<noscript>
<p>자바스크립트를 사용하지 않는 경우<br>별도의 확인 절차 없이 바로 선택삭제 처리하므로 주의하시기 바랍니다.</p>
</noscript>

<script>
// ========================================
// 체크박스 및 폼 처리 함수
// ========================================
/**
 * 체크박스 전체 선택/해제
 * @param {Boolean} sw true면 전체 선택, false면 전체 해제
 */
function all_checked(sw) {
    var f = document.fboardlist;
    for (var i=0; i<f.length; i++) {
        if (f.elements[i].name == "chk_wr_id[]")
            f.elements[i].checked = sw;
    }
}

/**
 * 폼 전송 전 검증 (선택삭제, 선택이동 등)
 * @param {HTMLFormElement} f 폼 객체
 * @return {Boolean} 전송 가능 여부
 */
function fboardlist_submit(f) {
    // 선택된 게시물 개수 확인
    var chk_count = 0;
    for (var i=0; i<f.length; i++) {
        if (f.elements[i].name == "chk_wr_id[]" && f.elements[i].checked)
            chk_count++;
    }

    // 선택된 게시물이 없으면 경고
    if (!chk_count) {
        alert(document.pressed + "할 게시물을 하나 이상 선택하세요.");
        return false;
    }

    // 버튼 종류에 따른 처리
    if(document.pressed == "선택스크랩") {
        select_copy("copy");
        return;
    }

    if(document.pressed == "선택이동") {
        select_copy("move");
        return;
    }

    if(document.pressed == "선택삭제") {
        // 삭제 확인
        if (!confirm("선택한 DATA를 정말 삭제하시겠습니까?\n\n한번 삭제한 DATA는 복구할 수 없습니다."))
            return false;

        f.removeAttribute("target");
        f.action = "./board_list_update.php";
    }

    return true;
}

// ========================================
// jQuery 이벤트 초기화
// ========================================
jQuery(function($){
    // 더 보기 버튼 클릭 이벤트
    $(".btn_more_opt.is_list_btn").on("click", function(e) {
        e.stopPropagation();
        $(".more_opt.is_list_btn").toggle();
    });

    // 외부 클릭 시 메뉴 닫기
    $(document).on("click", function (e) {
        if(!$(e.target).closest('.is_list_btn').length) {
            $(".more_opt.is_list_btn").hide();
        }
    });

    // Bootstrap 툴팁 초기화
    $('[data-toggle="tooltip"]').tooltip();

    // 페이지 로드 완료 후 로딩 애니메이션 숨김
    $(window).on('load', function() {
        if (window.hideLoading) {
            window.hideLoading();
        }
    });
});

// ========================================
// DOM 준비 완료 이벤트
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    /**
     * 폼 서브밋 이벤트 핸들러
     * 엔터키로 검색 시 페이지 새로고침 방지 및 Ajax 검색 실행
     */
    var form = document.querySelector('form[name="fsearch"]');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); // 기본 폼 제출 방지

            // 검색 플래그 설정 및 로딩 표시
            window.showLoadingOnSearch = true;
            if (window.showLoading) {
                window.showLoading();
            }

            // Ajax 검색 실행
            $('#sch_btn').click();
        });
    }
});
</script>
<?php } ?>

<!-- ======================================== -->
<!-- 로딩 오버레이 UI -->
<!-- ======================================== -->
<div id="loading-overlay">
    <div id="loading-content">
        <i class="fa fa-spinner fa-spin fa-3x loading-spinner"></i>
        <p style="margin-top:10px; color:#333;">검색중...</p>
    </div>
</div>

<!-- ======================================== -->
<!-- 로딩 표시/숨김 전역 함수 -->
<!-- ======================================== -->
<script>
/**
 * 로딩 오버레이 표시 (페이드인 효과)
 */
window.showLoading = function() {
    var overlay = $('#loading-overlay');
    overlay.show();
    overlay[0].offsetHeight; // 강제 리플로우로 애니메이션 트리거
    overlay.addClass('show'); // 페이드인 효과 적용
};

/**
 * 로딩 오버레이 숨김 (페이드아웃 효과)
 */
window.hideLoading = function() {
    var overlay = $('#loading-overlay');
    overlay.removeClass('show'); // 페이드아웃 효과

    // 애니메이션 완료 후 완전히 숨김 (300ms)
    setTimeout(function() {
        overlay.hide();
    }, 300);

    // 로딩 플래그 초기화
    window.showLoadingOnSearch = false;
};

// ========================================
// 검색 버튼 이벤트 바인딩
// ========================================
$(document).ready(function() {
    /**
     * 검색 버튼 클릭 시 로딩 표시 활성화
     * (실제 검색은 script.js의 rumiPaging에서 처리)
     */
    $('#sch_btn').click(function() {
        window.showLoadingOnSearch = true;
        window.showLoading();
    });
});
</script>
