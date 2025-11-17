$(function() {
    // 디바운싱을 위한 타이머 함수
    function debounceSearch(fn, delay) {
        let timer;
        return function() {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, arguments), delay);
        };
    }

    // 상단 유틸리티 함수 정의
    function numberWithCommas(x) {
        if (!x) return '0';
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // 전화번호 형식화 함수
    function formatPhoneNumber(phone) {
        // 숫자만 추출
        phone = phone.replace(/\D/g, '');
        // 전화번호 형식에 맞게 포맷팅
        return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }

    // 로딩 표시 플래그 - 검색만 로딩 표시를 위한 변수
    window.showLoadingOnSearch = false;

    $('#rumi-paging').rumiPaging({
        pagerID: '#rumi-paging',
        dataUrl: cfg.board_skin_url+'/listData.php?bo_table='+cfg.bo_table,
        formID: '#fsearch',
        submitBtnID: '#sch_btn',
        resetBtnID: '#rumiReset',
        reloadBtnID: '#rumiReload',
        dataRows: cfg.write_pages,
        pageCount: cfg.page_group,
        sortname: cfg.sortname,
        sortorder: cfg.sortorder,
        
        // Ajax 시작 전 콜백 추가
        ajaxStart: function() {
            // 검색 플래그가 true일 때만 로딩 표시
            if (window.showLoadingOnSearch) {
                $('#loading-overlay').show();
            }
        },
        
        // Ajax 완료 후 콜백 추가
        ajaxComplete: function() {
            // 로딩 표시를 항상 숨김
            $('#loading-overlay').hide();
            // 검색 후에는 플래그를 다시 false로 설정
            window.showLoadingOnSearch = false;

            // 툴팁 초기화
            $('[data-toggle="tooltip"]').tooltip();
        },

        loadData: function(data) {
            console.time('데이터 렌더링');
            $('#loading-overlay').hide(); // 로딩 오버레이 숨김
            window.showLoadingOnSearch = false; // 플래그 리셋
            console.log('데이터 로드 완료');
   
            var list = "";
            // 문서 프래그먼트 생성
            var fragment = $(document.createDocumentFragment());
            $('#tbl-list').empty();
            
            if(data.totalCount > 0) {
                $.each(data.rows, function(i, v) {
                    // 나이 계산
                    var now = new Date();
                    var year = now.getFullYear();
                    var age = year - v.wr_1 + 1;

                    // 현재 경력계산
                    var regyear = parseInt(v.wr_datetime.substring(0,4));
                    var nowyear = year;
                    var differ = nowyear - regyear;
                    var nowcareer = Number(v.wr_2) + differ; 
                    // nowcareer를 두 자리 문자열로 변환
                    nowcareer = nowcareer < 10 ? '0' + nowcareer : '' + nowcareer;

                    // 제목 문자열 처리
                    var subject = v.wr_subject;
                    var subjectShort = subject.length >= 6 ? subject.substr(0, 6) + "..." : subject;
                    var tooltipContent = subject.length >= 6 ? v.wr_subject : ''; // 툴팁 내용

                    // 파이프로 구분된 문자열 처리
                    var wr41 = v.wr_41 ? v.wr_41.replace(/\|/g, ',') : '';
                    var wr42 = v.wr_42 ? v.wr_42.replace(/\|/g, ',') : '';

                    // 연락처 처리
                    var formattedPhoneNumber = v.wr_14 ? v.wr_14 : '';

                    // 연락처 표시 여부 결정
                    var wr14, wr15;
                    if (v.wr_10 == cfg.g5m || cfg.g5m == 'admin' || v.wr_11 == '공개') {
                        wr14 = formattedPhoneNumber ? formattedPhoneNumber : (v.wr_20 ? v.wr_20 : '');
                        wr15 = v.wr_15 ? v.wr_15 : (v.wr_21 ? v.wr_21 : '');
                    } else {
                        wr14 = '비공개';
                        wr15 = '';
                    }

                    // 체크박스 설정
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

                    // 테이블 행 생성
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

            $('#page').val(data.currentPage);
            // 문서 프래그먼트 사용하여 DOM 업데이트 최적화
            fragment.append(list);
            $('#tbl-list').append(fragment);

            $('#total-count').text(numberWithCommas(data.totalCount));
            $('#current-page').text(data.currentPage);
            
            // 선택된 필터 표시 업데이트
            updateSelectedFilters();
            
            console.timeEnd('데이터 렌더링');
        },
    });

    // 선택된 필터 표시 업데이트 함수
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

    // 검색 버튼 클릭 이벤트 - 디바운싱 적용
    $('#sch_btn').click(debounceSearch(function() {
        console.log('검색 버튼 클릭됨');
        // 검색 시에만 로딩 표시 활성화
        window.showLoadingOnSearch = true;
        $('#loading-overlay').show();
        $('#rumiReload').click();
    }, 300));

    // 엔터키 검색 - 디바운싱 적용
    $('#stx').on('keypress', debounceSearch(function(e) {
        if(e.which == 13) {
            e.preventDefault();
            // 검색 시에만 로딩 표시 활성화
            window.showLoadingOnSearch = true;
            $('#sch_btn').click();
        }
    }, 300));

    // 카테고리 클릭
    $(".list-category").click(function() {
        $('#sca').val($(this).attr('data-id'));
        // 카테고리 변경은 검색으로 간주
        window.showLoadingOnSearch = true;
        $('#sch_btn').click();
        $('.list-category').removeClass('active');
        $(this).addClass('active');
    });


    // 정렬 링크 클릭
    $(document).on('click', '.sort-link', function(e) {
        e.preventDefault();
        var sortField = $(this).data('sort');
        var sortOrder = $(this).data('order');
        
        $('#sst').val(sortField);
        $('#sod').val(sortOrder);
        
        // 정렬 활성화 표시
        $('.sort_links li').removeClass('sort');
        $(this).closest('li').addClass('sort');
        
        // 페이지 리로드 (rumiPaging이 자동으로 새 정렬 파라미터를 포함하여 데이터를 가져옴)
        $('#rumiReload').click();
    });

    // 정렬 초기화 버튼
    $(document).on('click', '#sortReset', function(e) {
        e.preventDefault();
        $('#sst').val('');
        $('#sod').val('');
        $('.sort_links li').removeClass('sort');
        $('#rumiReset').click();
    });






    // 리스트 클릭 이벤트
    $('#tbl-list').on('click', '.tbl-list-subject', function(e) {
        var wr_id = $(this).attr('data-id'); 
        bbsView(wr_id);
    });
});

// Excel 다운로드
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
 * 게시판 글등록, 글보기 팝업창
 * @param {Number} wr_id 게시판 게시글 고유번호
 */
function bbsView(wr_id) {
    var _url = '';
    var subject;

    if(wr_id) {
        _url = cfg.board_skin_url+'/view.php?bo_table='+cfg.bo_table+'&wr_id='+wr_id;
        subject = 'Candidate Profile';
    } else {
        _url = cfg.bbs_url+'/write.php?bo_table='+cfg.bo_table;
        subject = 'Candidate Reg.';
    }

    // 팝업창 기본 코드
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
                // 닫기 버튼 클릭 시 즉시 반응하도록 변경
                $(this).prop('disabled', true).text('닫는 중...');
                rumiPopup.close();
            },
        },
        open: function() {
            $("div.rumiButton button:contains('닫기')").css({"background":"#555"});
        },
        close: function() {
            // 팝업이 완전히 닫힌 후 새로고침하도록 지연 추가
            // 로딩 표시 없이 새로고침
            window.showLoadingOnSearch = false;
            setTimeout(function() {
                $('#rumiReload').click();
            }, 100);
            $('[data-toggle="tooltip"]').tooltip(); // bootstrap tooltip ajax 때문 
        }
    });
}

// 스크랩 기능
function Scrap() {
    var wr_id_list = [];

    $("input[name='chk_wr_id[]']:checked").each(function() {
        var wrId = this.value;
        if (!isNaN(wrId)) {
            wr_id_list.push(wrId);
        }
    });

    if (wr_id_list.length < 1) {
        alert("스크랩할 항목을 선택하세요!");
        return;
    }

    // Build the URL with selected wr_id values
    var url = cfg.bbs_url + '/temp_update.php';
    var subject = '스크랩';

    // Build the URL with selected wr_id values
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

// 옵션/필터 팝업 열기
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
            // 로딩 표시 없이 새로고침
            window.showLoadingOnSearch = false;
            location.href = cfg.bbs_url + "/board.php?bo_table=db";
        }
    });
}

// 전역 함수로 로딩 표시/숨김 정의
window.showLoading = function() {
    // 검색 상황에서만 로딩 표시
    if (window.showLoadingOnSearch) {
        console.log("로딩 표시");
        $('#loading-overlay').show();
    }
};

window.hideLoading = function() {
    console.log("로딩 숨김");
    $('#loading-overlay').hide();
    // 로딩 숨김 후 플래그 초기화
    window.showLoadingOnSearch = false;
};

// 검색 버튼 클릭시 로딩 표시
$(document).ready(function() {
    // 초기 설정
    window.showLoadingOnSearch = false;
    
    $('#sch_btn').click(function() {
        window.showLoadingOnSearch = true;
        window.showLoading();
    });
    
    // 페이지 로드 완료 시 로딩 숨김
    $(window).on('load', function() {
        window.hideLoading();
    });
});