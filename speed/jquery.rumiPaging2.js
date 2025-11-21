/*
* 명    칭 : rumiPaging (한글명칭 : 루미페이징)
* 제 작 일 : 2020년 01월 01일
* 수 정 일 : 2021년 07월 15일
* 제 작 자 : 조정영 (루미집사)
* 이 메 일 : cjy7627@naver.com
* 홈페이지 : https://www.suu.kr
* 라이센스 : FREE
* 위 정보를 삭제하지 않는 경우 자유롭게 수정 및 배포 가능합니다.
* 부득이하게 위 정보를 삭제하여야 하는경우 반드시 이메일로 연락 주시기 바랍니다.
* 
* 최적화 : 2025년 03월 25일
**/

(function($) {
    "use strict";
    
    $.fn.rumiPaging = function(option) {
        // 기본 설정값
        var cfg = {
            pagerID     : '#rumi-paging', // 페이지가 보여질 div id (기본값 : div#rumi-paging) 값이 변경되면 CSS도 함께 수정필요.
            dataUrl     : 'basic_data.php', // ajax : DB query 데이터 파일
            formID      : '#frmSearch', // 검색 form ID
            submitBtnID : '#rumi-btn-submit', // 검색 버튼의 ID
            resetBtnID  : '#rumi-btn-reset', // 검색 버튼의 ID
            reloadBtnID : '#rumi-btn-reload', // 검색 버튼의 ID
            dataRows    : 10, // 한페이지에 보여줄 데이터 수
            pageCount   : 10, // 한번에 보여줄 페이지
            sortname    : 'id_no',  // 기본 정렬
            sortorder   : 'desc', // 기본정렬순
            loadData    : function(e) {}, /* ajax로 데이터를 불러온 이후 실행될 사용자 추가 함수 */
            formReset   : function(e) {}, /* 검색 form의 초기화 버튼 클릭시 추가로 실행될 사용자 추가 함수 */
            ajaxError   : function(e) {}, /* DB ajax 통신 실패 사용자 추가 함수 */
            ajaxStart   : function(e) {}, /* Ajax 통신 시작시 실행될 함수 */
            ajaxComplete: function(e) {} /* ajax 통신시 무조건 실행될 사용자 추가 함수 */
        };

        // 옵션 병합
        if(option && typeof option == "object") {
            cfg = $.extend(cfg, option);
        }

        var rumiThis = this;
        var pagerID = cfg.pagerID;
        var dataUrl = cfg.dataUrl;
        var currentPage = 1;  // 현재페이지
        var totalCount = 0; // DB 결과 데이터 수
        var dataCache = {}; // 데이터 캐싱을 위한 객체
        var enableCache = false; // 캐시 비활성화 (수정된 부분)
        var isFirstLoad = true; // 첫 로딩 여부 플래그

        /**
         * 디바운싱 함수 - 연속된 호출을 방지
         * @param {Function} func 실행할 함수
         * @param {Number} delay 지연 시간(ms)
         * @returns {Function} 디바운싱된 함수
         */
        function debounce(func, delay) {
            var timer;
            return function() {
                var context = this;
                var args = arguments;
                clearTimeout(timer);
                timer = setTimeout(function() {
                    func.apply(context, args);
                }, delay);
            };
        }

        // 검색 - 검색어 입력후 엔터키 입력시 검색 실행 (디바운싱 적용)
        $(cfg.formID+' input').keypress(debounce(function (e) {
            if (e.which == 13){
                // 검색 시 로딩 표시 활성화
                if (window.showLoadingOnSearch !== undefined) {
                    window.showLoadingOnSearch = true;
                }
                rumiThis.get_datalist(1, rumiThis.searchString());
                return false;
            }
        }, 300));

        // 검색 버튼 클릭, 검색을 실행하면 무조건 1페이지로 이동.
        $(cfg.submitBtnID).click(debounce(function() {
            // 검색 시 로딩 표시 활성화
            if (window.showLoadingOnSearch !== undefined) {
                window.showLoadingOnSearch = true;
            }
            rumiThis.get_datalist(1, rumiThis.searchString());
        }, 300));

        // rows 변경시 : 한페이지에 보여줄 데이터 수 변경.
        $(cfg.formID).on('change', '.rows', function() {
            // 설정 변경 시 로딩 표시 활성화
            if (window.showLoadingOnSearch !== undefined) {
                window.showLoadingOnSearch = true;
            }
            rumiThis.get_datalist(currentPage, rumiThis.searchString());
        });

        // 검색 form 초기화 버튼 클릭
        $(cfg.formID).on('click', cfg.resetBtnID, function(e) {
            // 초기화 시 로딩 표시 활성화
            if (window.showLoadingOnSearch !== undefined) {
                window.showLoadingOnSearch = true;
            }
            rumiThis.formReset();
        });

        // 새로고침 버튼 클릭
        $(cfg.formID).on('click', cfg.reloadBtnID, function() {
            // 캐시 비우기 추가 (수정된 부분)
            rumiThis.clearCache();
            
            // showLoadingOnSearch 플래그는 유지 (이미 설정된 상태 유지)
            rumiThis.get_datalist(currentPage, rumiThis.searchString());
        });

        // 페이지 이동 - 이벤트 위임 사용
        $(pagerID).on('click', '.page-num, .page-btn', function() {
            var pageName = $(this).attr("data-name");
            var pageNum = $(this).attr("data-page");
            $('#page').val(pageNum);
            
            // 페이지 이동 시 로딩 표시 활성화
            if (window.showLoadingOnSearch !== undefined) {
                window.showLoadingOnSearch = true;
            }
            
            switch(pageName) {
                case 'page-num': // 페이지 이동
                    rumiThis.goPage(pageNum);
                    break;
                case 'next-group-page': // 다음 페이지 그룹
                    rumiThis.nextGroupPage(pageNum);
                    break;
                case 'last-page': // 마지막 페이지 이동
                    rumiThis.lastPage(pageNum);
                    break;
                case 'prev-group-page': // 이전 페이지 그룹
                    rumiThis.prevGroupPage(pageNum);
                    break;
                case 'first-page': // 첫 페이지로 이동
                    rumiThis.firstPage(pageNum);
                    break;
                case 'prev-page': // 이전 1페이지 이동 (모바일용)
                    rumiThis.prevPage(pageNum);
                    break;
                case 'next-page': // 다음 1페이지 이동 (모바일용)
                    rumiThis.nextPage(pageNum);
                    break;
            }
        });

        /**
         * 검색 폼의 값을 객체로 변환
         * @returns {Object} 폼 데이터 객체
         */
        this.searchString = function() {
            var frmResult = {};
            var formArray = $(cfg.formID).serializeArray();
            
            // 배열 처리 최적화
            for (var i = 0; i < formArray.length; i++) {
                var element = formArray[i];
                var node = frmResult[element.name];
                
                if ("undefined" !== typeof node && node !== null) {
                    if ($.isArray(node)) {
                        node.push(element.value);
                    } else {
                        frmResult[element.name] = [node, element.value];
                    }
                } else {
                    frmResult[element.name] = element.value;
                }
            }
            
            return frmResult;
        };

        /**
         * 캐시 비우기 함수 추가 (수정된 부분)
         */
        this.clearCache = function() {
            dataCache = {};
            console.log('캐시가 초기화되었습니다.');
            return this;
        };

        /**
         * 데이터 목록 가져오기
         * @param {Number} page 페이지 번호
         * @param {Object} terms 검색 조건
         * @returns {Promise} 비동기 요청 Promise
         */
        this.get_datalist = function(page, terms) {
            // 검색 조건 설정
            terms['page'] = (terms['page']) ? terms['page'] : page;
            terms['rows'] = (terms['rows']) ? terms['rows'] : cfg.dataRows;
            terms['sidx'] = (terms['sidx']) ? terms['sidx'] : cfg.sortname;
            terms['sord'] = (terms['sord']) ? terms['sord'] : cfg.sortorder;
            
            // 캐시 방지를 위한 타임스탬프 추가 (수정된 부분)
            terms['_'] = new Date().getTime();
            
            // 캐시 키 생성
            var cacheKey = JSON.stringify(terms);
            
            // 첫 로딩이 아닐 때만 로딩 표시 
            // window.showLoadingOnSearch가 정의되어 있고 true일 때만 로딩 표시
            if (!isFirstLoad && window.showLoading && window.showLoadingOnSearch) {
                window.showLoading();
            } else if (isFirstLoad) {
                // 첫 로딩 시에는 플래그 변경
                isFirstLoad = false;
            }
            
            // Ajax 시작 콜백 호출
            cfg.ajaxStart();
            
            // Promise 반환
            return new Promise(function(resolve, reject) {
                // 캐시 데이터가 있고 캐시 활성화 상태일 때만 사용 (수정된 부분)
                if (enableCache && dataCache[cacheKey]) {
                    console.log('캐시된 데이터 사용');
                    
                    var data = dataCache[cacheKey];
                    totalCount = data.totalCount;
                    currentPage = data.currentPage;
                    
                    cfg.loadData(data);
                    rumiThis.initPage(totalCount, data.currentPage, data.totalPage);
                    
                    if (window.hideLoading) {
                        window.hideLoading();
                    }
                    
                    cfg.ajaxComplete();
                    
                    resolve(data);
                    return;
                }
                
                // Ajax 요청
                $.ajax({
                    type: 'POST',
                    url: dataUrl,
                    data: terms,
                    dataType: 'json',
                    async: true,
                    cache: false, // 브라우저 캐싱 비활성화 (수정된 부분)
                    error: function(error) {
                        if (window.hideLoading) {
                            window.hideLoading();
                        }
                        cfg.ajaxError(error);
                        reject(error);
                    },
                    success: function(data) {
                        // 응답 처리
                        totalCount = data.totalCount;
                        currentPage = data.currentPage;
                        
                        // 페이지 범위 체크
                        if(data.currentPage > 1 && data.currentPage > data.totalPage) {
                            $('#page').val(data.totalPage);
                            var frmArr = rumiThis.searchString();
                            frmArr['page'] = data.totalPage;
                            rumiThis.get_datalist(data.totalPage, frmArr)
                                .then(resolve)
                                .catch(reject);
                        } else {
                            // 데이터 로드 및 페이지 초기화
                            cfg.loadData(data);
                            rumiThis.initPage(totalCount, data.currentPage, data.totalPage);
                            
                            // 캐시 활성화 상태일 때만 캐시에 저장 (수정된 부분)
                            if (enableCache) {
                                // 캐시에 데이터 저장 (최대 20개 항목 유지)
                                if (Object.keys(dataCache).length >= 20) {
                                    var oldestKey = Object.keys(dataCache)[0];
                                    delete dataCache[oldestKey];
                                }
                                dataCache[cacheKey] = data;
                            }
                            
                            if (window.hideLoading) {
                                window.hideLoading();
                            }
                            
                            resolve(data);
                        }
                    },
                    complete: function(e) {
                        if (window.hideLoading) {
                            window.hideLoading();
                        }
                        cfg.ajaxComplete(e);
                    }
                });
            });
        };

        /**
         * 검색 폼 초기화
         */
        this.formReset = function() {
            // 빠른 검색 체크박스 상태 저장
            var useApproxCount = $('#use_approx_count').is(':checked');

            $(cfg.formID+' input, select')
                .not(':button, :submit, :reset, :hidden')
                .val('')
                .prop('checked', false)
                .prop('selected', false);

            $('select').find('option:first').prop('selected', true);

            // 빠른 검색 체크박스 복원
            $('#use_approx_count').prop('checked', useApproxCount);

            // 페이지 번호를 1로 명시적으로 초기화
            $('#page').val(1);
            currentPage = 1;

            // cached_total_count도 비우기 (새로운 검색이므로)
            $('#cached_total_count').val('');

            // 사용자 추가 리셋 코드 실행
            cfg.formReset();

            // 캐시 비우기 추가 (수정된 부분)
            this.clearCache();

            // DOM 업데이트 강제 (체크박스 상태가 반영되도록)
            // 브라우저가 DOM을 완전히 업데이트하도록 강제 리플로우 발생
            $('#use_approx_count')[0].offsetHeight;

            // 폼 초기화 후 1페이지로 이동
            rumiThis.get_datalist(1, rumiThis.searchString());
        };

        /**
         * 페이징 생성
         * @param {Number} totalSize 전체 자료수
         * @param {Number} currentPage 현재 페이지 번호
         * @param {Number} totalPage 전체 페이지 수
         */
        this.initPage = function(totalSize, currentPage, totalPage) {
            // 페이지 관련 변수 계산
            var totalPageList = Math.ceil(totalPage / cfg.pageCount);
            var pageList = Math.ceil(currentPage / cfg.pageCount);
            
            // 페이지 리스트 범위 조정
            pageList = Math.max(1, Math.min(pageList, totalPageList));
            
            // 시작 페이지와 끝 페이지 계산
            var startPageList = ((pageList - 1) * cfg.pageCount) + 1;
            var endPageList = startPageList + cfg.pageCount - 1;
            
            // 범위 조정
            startPageList = Math.max(1, startPageList);
            endPageList = Math.min(totalPage, Math.max(1, endPageList));
            
            // 이전/다음 그룹 페이지 계산
            var prevGroupPage = startPageList - 1;
            var nextGroupPage = endPageList + 1;
            
            // HTML 생성 - DocumentFragment 사용
            var fragment = document.createDocumentFragment();
            var pageInner = document.createElement('div');
            
            // 첫 페이지 및 이전 그룹 버튼
            if (pageList < 2) {
                pageInner.innerHTML += "<span class='page-btn inactive page-btn-arrow'><i class='fa fa-fast-backward' aria-hidden='true'></i></span>" +
                                     "<span class='page-btn inactive arrow-left page-btn-arrow'><i class='fa fa-backward' aria-hidden='true'></i></span>";
            } else {
                pageInner.innerHTML += "<span class='page-btn active page-btn-arrow' data-name='first-page' data-page='1'><i class='fa fa-fast-backward' aria-hidden='true'></i></span>" +
                                     "<span class='page-btn active arrow-left page-btn-arrow' data-name='prev-group-page' data-page='" + prevGroupPage + "'><i class='fa fa-backward' aria-hidden='true'></i></span>";
            }
            
            // 이전 페이지 버튼 (모바일용)
            var prevPageCls = (currentPage == 1) ? "inactive" : "active";
            var prevPage = (currentPage == 1) ? 0 : currentPage - 1;
            pageInner.innerHTML += "<span class='page-btn " + prevPageCls + " prev-page page-btn-mobile' data-name='prev-page' data-page='" + prevPage + "'>이전페이지</span>";
            
            // 페이지 버튼 생성
            var pageHtml = '';
            for (var i = startPageList; i <= endPageList; i++) {
                if (i == currentPage) {
                    pageHtml += "<span class='page-num page-current' data-name='page-num' data-page='" + i + "' id='" + i + "'>" + i + "</span> ";
                } else {
                    pageHtml += "<span class='page-num page-none' data-name='page-num' data-page='" + i + "' id='" + i + "'>" + i + "</span> ";
                }
            }
            pageInner.innerHTML += pageHtml;
            
            // 다음 페이지 버튼 (모바일용)
            var nextPageCls = (currentPage == totalPage) ? "inactive" : "active";
            var nextPage = (currentPage == totalPage) ? 0 : currentPage + 1;
            pageInner.innerHTML += "<span class='page-btn " + nextPageCls + " next-page page-btn-mobile' data-name='next-page' data-page='" + nextPage + "'>다음페이지</span>";
            
            // 다음 그룹 및 마지막 페이지 버튼
            if (totalPageList > pageList) {
                pageInner.innerHTML += "<span class='page-btn active arrow-right page-btn-arrow' data-name='next-group-page' data-page='" + nextGroupPage + "'><i class='fa fa-forward' aria-hidden='true'></i></span>" +
                                      "<span class='page-btn active page-btn-arrow' data-name='last-page' data-page='" + totalPage + "'><i class='fa fa-fast-forward' aria-hidden='true'></i></span>";
            } else {
                pageInner.innerHTML += "<span class='page-btn inactive arrow-right page-btn-arrow'><i class='fa fa-forward' aria-hidden='true'></i></span>" +
                                      "<span class='page-btn inactive page-btn-arrow'><i class='fa fa-fast-forward' aria-hidden='true'></i></span>";
            }
            
            // 페이징 DOM 업데이트
            fragment.appendChild(pageInner);
            $(pagerID).empty().append(fragment);
        };

        // 페이지 이동 함수들
        this.firstPage = function() {
            rumiThis.get_datalist(1, rumiThis.searchString());
        };

        this.prevPage = function(page) {
            if (page == 0) return false;
            rumiThis.get_datalist(page, rumiThis.searchString());
        };

        this.nextPage = function(page) {
            if (page == 0) return false;
            rumiThis.get_datalist(page, rumiThis.searchString());
        };

        this.prevGroupPage = function() {
            currentPage -= cfg.pageCount;
            var pageList = Math.ceil(currentPage / cfg.pageCount);
            currentPage = (pageList - 1) * cfg.pageCount + cfg.pageCount;
            rumiThis.get_datalist(currentPage, rumiThis.searchString());
        };

        this.nextGroupPage = function() {
            currentPage += cfg.pageCount;
            var pageList = Math.ceil(currentPage / cfg.pageCount);
            currentPage = (pageList - 1) * cfg.pageCount + 1;
            rumiThis.get_datalist(currentPage, rumiThis.searchString());
        };

        this.lastPage = function(totalSize) {
            rumiThis.get_datalist(totalSize, rumiThis.searchString());
        };

        this.goPage = function(num) {
            rumiThis.get_datalist(num, rumiThis.searchString());
        };

        // 초기 실행
        this.init = function() {
            // 페이지 로드 시간 측정 시작
            console.time('페이지 초기화');
            
            // 첫 로딩 플래그 설정
            isFirstLoad = true;
            
            // 초기 로딩 시 로딩 표시 없이 데이터 로드
            if (window.showLoadingOnSearch !== undefined) {
                window.showLoadingOnSearch = false;
            }
            
            // 초기 데이터 로드
            rumiThis.get_datalist(1, rumiThis.searchString())
                .then(function() {
                    console.timeEnd('페이지 초기화');
                })
                .catch(function(error) {
                    console.error('초기화 오류:', error);
                    console.timeEnd('페이지 초기화');
                });
        };

        // 전역 접근을 위한 인스턴스 등록 (수정된 부분)
        window.rumiPagingInstance = this;

        // 컴포넌트 초기화
        this.init();
        
        // 체이닝을 위해 this 반환
        return this;
    };
}(jQuery));