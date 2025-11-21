/**
 * 그누보드 기반 서치펌 시스템 - 메인 스크립트 파일
 * 파일명: script.js
 * rumiPaging 플러그인을 사용한 Ajax 게시판 목록 처리
 */

$(function() {
    // ========================================
    // 유틸리티 함수
    // ========================================

    /**
     * 디바운싱 함수 - 연속된 함수 호출 방지
     * @param {Function} fn 실행할 함수
     * @param {Number} delay 지연 시간 (ms)
     * @return {Function} 디바운싱된 함수
     */
    function debounceSearch(fn, delay) {
        let timer;
        return function() {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, arguments), delay);
        };
    }

    /**
     * 숫자에 천 단위 콤마 추가
     * @param {Number|String} x 숫자
     * @return {String} 콤마가 추가된 숫자 문자열
     */
    function numberWithCommas(x) {
        if (!x) return '0';
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /**
     * 전화번호 형식화 (010-1234-5678)
     * @param {String} phone 전화번호
     * @return {String} 형식화된 전화번호
     */
    function formatPhoneNumber(phone) {
        phone = phone.replace(/\D/g, ''); // 숫자만 추출
        return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }

    // 로딩 표시 플래그 (검색 시에만 로딩 표시)
    window.showLoadingOnSearch = false;

    // ========================================
    // rumiPaging 플러그인 초기화
    // ========================================

    $('#rumi-paging').rumiPaging({
        pagerID: '#rumi-paging',              // 페이징 출력 영역
        dataUrl: cfg.board_skin_url+'/listData.php?bo_table='+cfg.bo_table, // Ajax 데이터 URL
        formID: '#fsearch',                   // 검색 폼 ID
        submitBtnID: '#sch_btn',              // 검색 버튼 ID
        resetBtnID: '#rumiReset',             // 초기화 버튼 ID
        reloadBtnID: '#rumiReload',           // 새로고침 버튼 ID
        dataRows: cfg.write_pages,            // 페이지당 게시물 수
        pageCount: cfg.page_group,            // 페이징 그룹 수
        sortname: cfg.sortname,               // 기본 정렬 필드
        sortorder: cfg.sortorder,             // 기본 정렬 방향

        /**
         * Ajax 시작 전 콜백 - 로딩 표시
         */
        ajaxStart: function() {
            // 검색 플래그가 true일 때만 로딩 표시
            if (window.showLoadingOnSearch) {
                $('#loading-overlay').show();
            }
        },

        /**
         * Ajax 완료 후 콜백 - 로딩 숨김 및 툴팁 초기화
         */
        ajaxComplete: function() {
            // 로딩 표시 숨김
            $('#loading-overlay').hide();
            // 검색 플래그 초기화
            window.showLoadingOnSearch = false;

            // Bootstrap 툴팁 재초기화 (동적 콘텐츠에 적용)
            $('[data-toggle="tooltip"]').tooltip();
        },

        /**
         * 데이터 로드 완료 후 콜백 - 테이블 행 생성
         * @param {Object} data Ajax로 받은 데이터
         */
        loadData: function(data) {
            // 로딩 오버레이 숨김
            $('#loading-overlay').hide();
            window.showLoadingOnSearch = false;

            var list = "";
            // 문서 프래그먼트 생성 (DOM 조작 최적화)
            var fragment = $(document.createDocumentFragment());
            $('#tbl-list').empty();

            if(data.totalCount > 0) {
                // 각 게시물 행 생성
                $.each(data.rows, function(i, v) {
                    // ========================================
                    // 데이터 가공 및 계산
                    // ========================================

                    // 나이 계산 (출생년도 → 현재 나이)
                    var now = new Date();
                    var year = now.getFullYear();
                    var age = year - v.wr_1 + 1;

                    // 현재 경력 계산 (DB 입력 시점 경력 + 경과년수)
                    var regyear = parseInt(v.wr_datetime.substring(0,4)); // 등록년도
                    var nowyear = year;
                    var differ = nowyear - regyear; // 경과년수
                    var nowcareer = Number(v.wr_2) + differ;
                    nowcareer = nowcareer < 10 ? '0' + nowcareer : '' + nowcareer; // 2자리 포맷

                    // 제목 문자열 처리 (6자 이상이면 ... 표시)
                    var subject = v.wr_subject;
                    var subjectShort = subject.length >= 6 ? subject.substr(0, 6) + "..." : subject;
                    var tooltipContent = subject.length >= 6 ? v.wr_subject : '';

                    // 파이프(|) 구분자를 콤마(,)로 변환
                    var wr41 = v.wr_41 ? v.wr_41.replace(/\|/g, ',') : ''; // 업종
                    var wr42 = v.wr_42 ? v.wr_42.replace(/\|/g, ',') : ''; // 직종

                    // 연락처 포맷팅
                    var formattedPhoneNumber = v.wr_14 ? v.wr_14 : '';

                    // 연락처 표시 권한 확인
                    var wr14, wr15;
                    if (v.wr_10 == cfg.g5m || cfg.g5m == 'admin' || v.wr_11 == '공개') {
                        // 본인 DB, 관리자, 또는 공개 DB인 경우 연락처 표시
                        wr14 = formattedPhoneNumber ? formattedPhoneNumber : (v.wr_20 ? v.wr_20 : '');
                        wr15 = v.wr_15 ? v.wr_15 : (v.wr_21 ? v.wr_21 : '');
                    } else {
                        // 비공개 DB
                        wr14 = '비공개';
                        wr15 = '';
                    }

                    // ========================================
                    // HTML 생성
                    // ========================================

                    // 체크박스 HTML 생성
                    var chkBox = '';
                    var trCls = (v.is_notice) ? 'bo_notice' : '';

                    if(cfg.isCheckbox) {
                        chkBox = '<td class="td_chk chk_box">'
                                + '<input type="checkbox" name="chk_wr_id[]" value="'+v.wr_id+'" id="chk_wr_id_'+i+'" class="selec_chk">'
                                + '<label for="chk_wr_id_'+i+'">'
                                + '<span></span>'
                                + '<b class="sound_only">'+v.subject+'</b>'
                                + '</label>'
                                + '</td>';
                    }

                    // 테이블 행 HTML 생성
                    list += '<tr class='+trCls+'>'
                        + chkBox
                        + '<td class="tbl-list-num">'
                        + ( v.is_notice ? '<strong class="notice_icon"><i class="fa fa-bell" aria-hidden="true"></i><span class="sound_only">공지</span></strong>' : v.num )
                        + ( v.mail ? v.mail : '' )
                        +'</td>'

                        +'<td onClick="" style="cursor:pointer;" class="tbl-list-subject" data-id='+v.wr_id+'>'
                        + '<span class="subjectTxt" data-original-title="' + tooltipContent + '" data-html="true" data-toggle="tooltip" data-placement="auto">'
                        + ( (v.wr_11 == "비공개") && !( cfg.g5m == v.wr_10 || cfg.g5m == "admin") ? 
                        '<font style="color:#777;font-weight:700;">'+subjectShort+'</font>'
                        : 
                        '<font>'+subjectShort+'</font>'
                        ) 
                        + '</span>'
                        + ( v.wr_16 ? '<span>('+v.wr_16+')' : '' )
                        + ( v.wr_file > "0" ? ' <i class="fa fa-file-text-o" aria-hidden="true" style="color:red;"></i></span>' : '' )
                        + '</td>'

                        + '<td class="">'+ (v.wr_1 ? v.wr_1+ '년<br>('+age+'세)' : '') 
                        + '</td>'
                        + '<td data-original-title="DB입력시점 년차<br>현재시점에서 계산한 년차" data-html="true" data-toggle="tooltip" data-placement="bottom">'+ (v.wr_2 ? v.wr_2+ '년차<br>('+nowcareer+'년차)' : '')
                        + '</td>'
                        + '<td class="td_left">'
                        + ( v.edu ? v.edu : '' )
                        + '</td>'
                        + '<td class="td_left">'
                        + ( v.com ? v.com : '' )
                        + '</td>'

                        + '<td class="td_left" style="word-break: break-all;">'
                        + (wr41 ? '<i class="fa fa-caret-right"></i> '+wr41+'<br>' :'')
                        + (wr42 ? '<i class="fa fa-caret-right"></i> '+wr42+'<br>' :'')
                        + (v.wr_51 ? '<i class="fa fa-caret-right"></i> '+v.wr_51 :'')
                        + '</td>'

                        + '<td class="" style="text-align:left;padding-left:5px !important;">' 
                        + ( v.comment ? v.comment : '' )
                        + '</td>'

                        + '<td class="td_left td_contact">'+(wr14 ? wr14+'<br>' :'')+''+(wr15 ? wr15 :'')
                        + '</td>'

                        + '<td class="tbl-list-name td_name sv_use">'+v.name+'</td>'
                        + '<td class="td_contact">'+v.datetime+'</td>'
                        + '<td class="td_contact">'+v.wr_60+'</td>'						
                        + '</tr>';
                });
            } else {
                list += '<tr><td colspan="'+cfg.colspan+'" class="empty_table">Data가 없습니다.</td></tr>';
            }

            // ========================================
            // DOM 업데이트
            // ========================================

            $('#page').val(data.currentPage);

            // 문서 프래그먼트 사용하여 DOM 업데이트 (성능 최적화)
            fragment.append(list);
            $('#tbl-list').append(fragment);

            // 전체 게시물 수 표시 (제한된 COUNT인 경우 "500+" 표시)
            var countText;
            if (data.isLimited) {
                countText = numberWithCommas(data.totalCount) + '+';
            } else {
                countText = numberWithCommas(data.totalCount);
            }
            $('#total-count').text(countText);
            $('#current-page').text(data.currentPage);

            // 선택된 필터 표시 업데이트
            updateSelectedFilters();
        },
    });

    // ========================================
    // 필터 관리 함수
    // ========================================

    /**
     * 선택된 필터를 태그 형식으로 표시
     */
    function updateSelectedFilters() {
        var filterContainer = $('#selected-filters');
        filterContainer.empty();
        
        // 체크박스 필터 (wr_41, wr_42)
        $('input[name="wr_41[]"]:checked, input[name="wr_42[]"]:checked').each(function() {
            var value = $(this).val();
            var tag = $('<span class="tag">' + value + ' <i class="fa fa-times"></i></span>');
            
            tag.on('click', function() {
                $('input[value="' + value + '"]').prop('checked', false);
                $('#sch_btn').click();
            });
            
            filterContainer.append(tag);
        });
        
        // 다른 필터들 (성별, 나이, 경력, 언어, PM)
        var otherFilters = ['wr_16', 't_start', 't_end', 'c_start', 'c_end', 'wr_44', 'wr_45', 'wr_46', 'wr_10'];
        

// 필터 필드명과 표시 이름을 매핑
var filterLabels = {
    'wr_16': '성별',
    't_start': '나이 시작',
    't_end': '나이 끝',
    'c_start': '경력 시작',
    'c_end': '경력 끝',
    'wr_44': '언어',
    'wr_45': '언어2',
    'wr_46': '언어3',
    'wr_10': 'PM'
    // 필요한 다른 필드들도 여기에 추가
};


        $.each(otherFilters, function(i, name) {
            var value = $('#fsearch [name="' + name + '"]').val();
            if (value) {
                //var label = $('label[for="' + name + '"]').text() || name;
				var label = filterLabels[name] || name;
                var tag = $('<span class="tag">' + label + ': ' + value + ' <i class="fa fa-times"></i></span>');
                
                tag.on('click', function() {
                    $('#fsearch [name="' + name + '"]').val('');
                    $('#sch_btn').click();
                });
                
                filterContainer.append(tag);
            }
        });
        
        // 검색어
        var searchTerm = $('#stx').val();
        if (searchTerm) {
            var searchField = $('#sfl option:selected').text();
            var tag = $('<span class="tag">' + searchField + ': ' + searchTerm + ' <i class="fa fa-times"></i></span>');
            
            tag.on('click', function() {
                $('#stx').val('');
                $('#sch_btn').click();
            });
            
            filterContainer.append(tag);
        }
    }

    // ========================================
    // 이벤트 핸들러
    // ========================================

    /**
     * 검색 버튼 클릭 이벤트 (디바운싱 적용)
     */
    $('#sch_btn').click(debounceSearch(function() {
        window.showLoadingOnSearch = true;
        $('#loading-overlay').show();
        $('#rumiReload').click(); // rumiPaging 새로고침
    }, 300));

    /**
     * 검색어 입력 시 엔터키 이벤트 (디바운싱 적용)
     */
    $('#stx').on('keypress', debounceSearch(function(e) {
        if(e.which == 13) {
            e.preventDefault();
            window.showLoadingOnSearch = true;
            $('#sch_btn').click();
        }
    }, 300));

    /**
     * 카테고리 클릭 이벤트
     */
    $(".list-category").click(function() {
        $('#sca').val($(this).attr('data-id'));
        window.showLoadingOnSearch = true;
        $('#sch_btn').click();
        $('.list-category').removeClass('active');
        $(this).addClass('active');
    });

    /**
     * 정렬 링크 클릭 이벤트
     */
    $(document).on('click', '.sort-link', function(e) {
        e.preventDefault();
        var sortField = $(this).data('sort');
        var sortOrder = $(this).data('order');

        $('#sst').val(sortField);
        $('#sod').val(sortOrder);

        // 정렬 활성화 표시
        $('.sort_links li').removeClass('sort');
        $(this).closest('li').addClass('sort');

        // 페이지 리로드 (rumiPaging이 자동으로 새 정렬 파라미터 포함)
        $('#rumiReload').click();
    });

    /**
     * 정렬 초기화 버튼
     */
    $(document).on('click', '#sortReset', function(e) {
        e.preventDefault();
        $('#sst').val('');
        $('#sod').val('');
        $('.sort_links li').removeClass('sort');
        $('#rumiReset').click();
    });






    /**
     * 게시물 제목 클릭 이벤트 - 상세보기 팝업
     */
    $('#tbl-list').on('click', '.tbl-list-subject', function(e) {
        var wr_id = $(this).attr('data-id');
        bbsView(wr_id);
    });
});

// ========================================
// 전역 함수
// ========================================

/**
 * Excel 다운로드
 * @param {String} mode 다운로드 모드 ('excel')
 */
function prInt(mode) {
    var $form = $("#fsearch");
    var formData = $form.serialize();
    
    switch(mode) {
        case "excel":
            var checkedIds = $('input[name="chk_wr_id[]"]:checked').map(function() {
                return this.value;
            }).get();

            var queryString = 'bo_table=' + cfg.bo_table + '&mode=excel';
            
            if (checkedIds.length > 0) {
                queryString += '&chk_wr_id=' + checkedIds.join(',');
            } else {
                queryString += '&' + formData;
            }

            location.href = cfg.board_skin_url + '/excel_down2.php?' + queryString;
            break;
    }
}

/**
 * 게시물 보기/등록 팝업 열기
 * @param {Number} wr_id 게시글 고유번호 (없으면 등록 모드)
 */
function bbsView(wr_id) {
    var _url = '';
    var subject;

    // URL 및 제목 설정
    if(wr_id) {
        // 보기 모드
        _url = cfg.board_skin_url+'/view.php?bo_table='+cfg.bo_table+'&wr_id='+wr_id;
        subject = 'Candidate Profile';
    } else {
        // 등록 모드
        _url = cfg.bbs_url+'/write.php?bo_table='+cfg.bo_table;
        subject = 'Candidate Reg.';
    }

    // rumiPopup 플러그인으로 팝업 열기
    rumiPopup.popup({
        width: 1024,
        height: 90,
        fadeIn: true,
        fadeinTime: 200,
        iframe: true,
        url: _url,
        title: subject,
        print: true,
        reloadBtn: true,
        button: {
            "닫기": function() {
                $(this).prop('disabled', true).text('닫는 중...');
                rumiPopup.close();
            },
        },
        open: function() {
            // 닫기 버튼 스타일 변경
            $("div.rumiButton button:contains('닫기')").css({"background":"#555"});
        },
        close: function() {
            // 팝업 닫힌 후 목록 새로고침 (로딩 표시 없이)
            window.showLoadingOnSearch = false;
            setTimeout(function() {
                $('#rumiReload').click();
            }, 100);
            // 툴팁 재초기화
            $('[data-toggle="tooltip"]').tooltip();
        }
    });
}

/**
 * 스크랩 기능 - 선택된 게시물을 임시 저장
 */
function Scrap() {
    var wr_id_list = [];

    // 선택된 게시물 ID 수집
    $("input[name='chk_wr_id[]']:checked").each(function() {
        var wrId = this.value;
        if (!isNaN(wrId)) {
            wr_id_list.push(wrId);
        }
    });

    // 선택된 항목이 없으면 경고
    if (wr_id_list.length < 1) {
        alert("스크랩할 항목을 선택하세요!");
        return;
    }

    // 스크랩 URL 생성
    var url = cfg.bbs_url + '/temp_update.php';
    var subject = '스크랩';
    var popupUrl = url + '?wr_ids=' + wr_id_list.join(',') + '&subject=' + subject;

    // 팝업창 기본 코드
    rumiPopup.popup({
        width: 1024,
        height: 90,
        fadeIn: true,
        fadeinTime: 200,
        iframe: true,
        url: popupUrl,
        title: subject,
        print: true,
        reloadBtn: true,
        button: {
            "닫기": function() {
                rumiPopup.close();
            },
        },
        open: function() {
            $("div.rumiButton button:contains('닫기')").css({"background":"#555"});
        },
        close: function() {
            // 아무 작업 안함
        }
    });
}

/**
 * 옵션/필터 설정 팝업 열기
 * @param {String} action 액션 (미사용)
 * @param {String} url 팝업 URL
 * @param {String} title 팝업 제목
 */
function openPopup(action, url, title) {
    var subject = '' + title;
    var popupUrl = cfg.board_skin_url + '/' + url + '?w=u&bo_table=db';

    rumiPopup.popup({
        width: 800,
        height: 70,
        fadeIn: true,
        fadeinTime: 200,
        iframe: true,
        url: popupUrl,
        title: subject,
        print: true,
        reloadBtn: true,
        button: {
            "닫기": function() {
                rumiPopup.close();
            },
        },
        close: function() {
            // 팝업 닫힌 후 페이지 이동 (로딩 표시 없이)
            window.showLoadingOnSearch = false;
            location.href = cfg.bbs_url + "/board.php?bo_table=db";
        }
    });
}