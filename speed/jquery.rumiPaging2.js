/*
* ===========================================
* rumiPaging (한글명칭 : 루미페이징)
* ===========================================
* 제 작 일 : 2020년 01월 01일
* 수 정 일 : 2021년 07월 15일
* 최적화 : 2025년 03월 25일
* 제 작 자 : 조정영 (루미집사)
* 이 메 일 : cjy7627@naver.com
* 홈페이지 : https://www.suu.kr
* 라이센스 : FREE
*
* 위 정보를 삭제하지 않는 경우 자유롭게 수정 및 배포 가능합니다.
* 부득이하게 위 정보를 삭제하여야 하는 경우 반드시 이메일로 연락 주시기 바랍니다.
*
* 주요 기능:
* - Ajax 기반 페이징 처리
* - 검색 폼 통합
* - 캐시 기능 (현재 비활성화)
* - Promise 기반 비동기 처리
**/

(function($) {
    "use strict";

    /**
     * jQuery 플러그인: rumiPaging
     * Ajax 기반 게시판 페이징 플러그인
     */
    $.fn.rumiPaging = function(option) {
        // ========================================
        // 기본 설정값
        // ========================================
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

        // ========================================
        // 옵션 병합 및 변수 초기화
        // ========================================

        // 사용자 옵션과 기본 설정 병합
        if(option && typeof option == "object") {
            cfg = $.extend(cfg, option);
        }

        var rumiThis = this;
        var pagerID = cfg.pagerID;
        var dataUrl = cfg.dataUrl;
        var currentPage = 1;  // 현재 페이지 번호
        var totalCount = 0;   // 전체 게시물 수
        var dataCache = {};   // 데이터 캐싱 객체 (성능 최적화용)
        var enableCache = false; // 캐시 비활성화 (실시간 데이터 우선)
        var isFirstLoad = true;  // 첫 로딩 여부 플래그

        // ========================================
        // 유틸리티 함수
        // ========================================

        /**
         * 디바운싱 함수 - 연속된 호출 방지 (검색 최적화)
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

        // ========================================
        // 이벤트 바인딩
        // ========================================

        /**
         * 검색 폼 엔터키 이벤트 (디바운싱 적용)
         */
        $(cfg.formID+' input').keypress(debounce(function (e) {
            if (e.which == 13){
                // 로딩 표시 활성화
                if (window.showLoadingOnSearch !== undefined) {
                    window.showLoadingOnSearch = true;
                }
                // 1페이지로 이동하여 검색 실행
                rumiThis.get_datalist(1, rumiThis.searchString());
                return false;
            }
        }, 300));

        /**
         * 검색 버튼 클릭 이벤트 (항상 1페이지로 이동)
         */
        $(cfg.submitBtnID).click(debounce(function() {
            if (window.showLoadingOnSearch !== undefined) {
                window.showLoadingOnSearch = true;
            }
            rumiThis.get_datalist(1, rumiThis.searchString());
        }, 300));

        /**
         * 페이지당 게시물 수 변경 이벤트
         */
        $(cfg.formID).on('change', '.rows', function() {
            if (window.showLoadingOnSearch !== undefined) {
                window.showLoadingOnSearch = true;
            }
            rumiThis.get_datalist(currentPage, rumiThis.searchString());
        });

        /**
         * 검색 폼 초기화 버튼 클릭 이벤트
         */
        $(cfg.formID).on('click', cfg.resetBtnID, function(e) {
            if (window.showLoadingOnSearch !== undefined) {
                window.showLoadingOnSearch = true;
            }
            rumiThis.formReset();
        });

        /**
         * 새로고침 버튼 클릭 이벤트 (캐시 초기화 포함)
         */
        $(cfg.formID).on('click', cfg.reloadBtnID, function() {
            // 캐시 비우기 (최신 데이터 로드)
            rumiThis.clearCache();

            // showLoadingOnSearch 플래그 유지 (이미 설정된 상태)
            rumiThis.get_datalist(currentPage, rumiThis.searchString());
        });

        /**
         * 페이지 번호/버튼 클릭 이벤트 (이벤트 위임)
         */
        $(pagerID).on('click', '.page-num, .page-btn', function() {
            var pageName = $(this).attr("data-name");
            var pageNum = $(this).attr("data-page");
            $('#page').val(pageNum);

            // 페이지 이동 시 로딩 표시 활성화
            if (window.showLoadingOnSearch !== undefined) {
                window.showLoadingOnSearch = true;
            }

            // 페이지 버튼 종류에 따라 처리
            switch(pageName) {
                case 'page-num':        // 특정 페이지 이동
                    rumiThis.goPage(pageNum);
                    break;
                case 'next-group-page': // 다음 페이지 그룹 (10개 단위)
                    rumiThis.nextGroupPage(pageNum);
                    break;
                case 'last-page':       // 마지막 페이지
                    rumiThis.lastPage(pageNum);
                    break;
                case 'prev-group-page': // 이전 페이지 그룹
                    rumiThis.prevGroupPage(pageNum);
                    break;
                case 'first-page':      // 첫 페이지
                    rumiThis.firstPage(pageNum);
                    break;
                case 'prev-page':       // 이전 1페이지 (모바일)
                    rumiThis.prevPage(pageNum);
                    break;
                case 'next-page':       // 다음 1페이지 (모바일)
                    rumiThis.nextPage(pageNum);
                    break;
            }
        });

        // ========================================
        // 공개 메서드
        // ========================================

        /**
         * 검색 폼의 값을 객체로 변환
         * @returns {Object} 폼 데이터 객체
         */
        this.searchString = function() {
            var frmResult = {};
            var formArray = $(cfg.formID).serializeArray();

            // 배열 처리 최적화 (동일한 name의 다중 값 처리)
            for (var i = 0; i < formArray.length; i++) {
                var element = formArray[i];
                var node = frmResult[element.name];

                if ("undefined" !== typeof node && node !== null) {
                    // 이미 값이 있으면 배열로 변환 (체크박스 등)
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
         * 캐시 비우기 (새로고침 시 사용)
         */
        this.clearCache = function() {
            dataCache = {};
            console.log('캐시가 초기화되었습니다.');
            return this;
        };

        /**
         * 데이터 목록 가져오기 (Ajax 요청)
         * @param {Number} page 페이지 번호
         * @param {Object} terms 검색 조건 객체
         * @returns {Promise} 비동기 요청 Promise
         */
        this.get_datalist = function(page, terms) {
            // ========================================
            // 검색 조건 설정
            // ========================================
            terms['page'] = (terms['page']) ? terms['page'] : page;
            terms['rows'] = (terms['rows']) ? terms['rows'] : cfg.dataRows;
            terms['sidx'] = (terms['sidx']) ? terms['sidx'] : cfg.sortname;
            terms['sord'] = (terms['sord']) ? terms['sord'] : cfg.sortorder;

            // 브라우저 캐시 방지를 위한 타임스탬프 추가
            terms['_'] = new Date().getTime();

            // 캐시 키 생성 (JSON 문자열화)
            var cacheKey = JSON.stringify(terms);

            // ========================================
            // 로딩 표시 처리
            // ========================================

            // 첫 로딩이 아닐 때만 로딩 표시
            if (!isFirstLoad && window.showLoading && window.showLoadingOnSearch) {
                window.showLoading();
            } else if (isFirstLoad) {
                isFirstLoad = false; // 첫 로딩 플래그 해제
            }

            // Ajax 시작 콜백 실행
            cfg.ajaxStart();

            // ========================================
            // Promise 기반 비동기 처리
            // ========================================
            return new Promise(function(resolve, reject) {
                // 캐시 데이터가 있고 캐시 활성화 시 사용
                if (enableCache && dataCache[cacheKey]) {
                    // 캐시된 데이터 사용 (네트워크 요청 생략)
                    console.log('캐시된 데이터 사용');

                    var data = dataCache[cacheKey];
                    totalCount = data.totalCount;
                    currentPage = data.currentPage;

                    // 데이터 로드 콜백 실행
                    cfg.loadData(data);
                    rumiThis.initPage(totalCount, data.currentPage, data.totalPage);

                    // 로딩 숨김
                    if (window.hideLoading) {
                        window.hideLoading();
                    }

                    cfg.ajaxComplete();

                    resolve(data);
                    return;
                }

                // ========================================
                // Ajax 요청 (실제 데이터 조회)
                // ========================================
                $.ajax({
                    type: 'POST',
                    url: dataUrl,
                    data: terms,
                    dataType: 'json',
                    async: true,
                    cache: false, // 브라우저 캐싱 비활성화 (실시간 데이터 우선)
                    error: function(error) {
                        // Ajax 에러 처리
                        if (window.hideLoading) {
                            window.hideLoading();
                        }
                        cfg.ajaxError(error);
                        reject(error);
                    },
                    success: function(data) {
                        // ========================================
                        // 응답 데이터 처리
                        // ========================================
                        totalCount = data.totalCount;
                        currentPage = data.currentPage;

                        // 페이지 범위 초과 체크 (마지막 페이지 삭제 등의 경우)
                        if(data.currentPage > 1 && data.currentPage > data.totalPage) {
                            // 현재 페이지가 범위 초과 시 마지막 페이지로 이동
                            $('#page').val(data.totalPage);
                            var frmArr = rumiThis.searchString();
                            frmArr['page'] = data.totalPage;
                            // 재귀 호출로 마지막 페이지 데이터 로드
                            rumiThis.get_datalist(data.totalPage, frmArr)
                                .then(resolve)
                                .catch(reject);
                        } else {
                            // 정상 응답 처리

                            // 데이터 로드 콜백 실행
                            cfg.loadData(data);
                            // 페이징 UI 초기화
                            rumiThis.initPage(totalCount, data.currentPage, data.totalPage);

                            // 캐시 저장 (활성화 상태일 때만)
                            if (enableCache) {
                                // 캐시 크기 제한 (최대 20개 항목)
                                if (Object.keys(dataCache).length >= 20) {
                                    var oldestKey = Object.keys(dataCache)[0];
                                    delete dataCache[oldestKey];
                                }
                                dataCache[cacheKey] = data;
                            }

                            // 로딩 숨김
                            if (window.hideLoading) {
                                window.hideLoading();
                            }

                            resolve(data);
                        }
                    },
                    complete: function(e) {
                        // Ajax 완료 후 항상 실행
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
            // 입력 필드 및 select 박스 초기화
            $(cfg.formID+' input, select')
                .not(':button, :submit, :reset, :hidden')
                .val('')
                .prop('checked', false)
                .prop('selected', false);

            // select 박스 첫 번째 옵션 선택
            $('select').find('option:first').prop('selected', true);

            // 사용자 정의 리셋 콜백 실행
            cfg.formReset();

            // 캐시 비우기
            this.clearCache();

            // 폼 초기화 후 1페이지로 이동
            rumiThis.get_datalist(1, rumiThis.searchString());
        };

        // ========================================
        // 페이징 UI 생성 메서드
        // ========================================

        /**
         * 페이징 HTML 생성 및 출력
         * @param {Number} totalSize 전체 게시물 수
         * @param {Number} currentPage 현재 페이지 번호
         * @param {Number} totalPage 전체 페이지 수
         */
        this.initPage = function(totalSize, currentPage, totalPage) {
            // 페이지 그룹 계산 (예: 1-10, 11-20, ...)
            var totalPageList = Math.ceil(totalPage / cfg.pageCount);
            var pageList = Math.ceil(currentPage / cfg.pageCount);

            // 페이지 리스트 범위 조정 (최소 1, 최대 totalPageList)
            pageList = Math.max(1, Math.min(pageList, totalPageList));

            // 현재 그룹의 시작/끝 페이지 계산
            var startPageList = ((pageList - 1) * cfg.pageCount) + 1;
            var endPageList = startPageList + cfg.pageCount - 1;

            // 범위 조정 (전체 페이지 수를 초과하지 않도록)
            startPageList = Math.max(1, startPageList);
            endPageList = Math.min(totalPage, Math.max(1, endPageList));

            // 이전/다음 그룹 페이지 번호
            var prevGroupPage = startPageList - 1;
            var nextGroupPage = endPageList + 1;

            // ========================================
            // HTML 생성 (DocumentFragment 사용)
            // ========================================
            var fragment = document.createDocumentFragment();
            var pageInner = document.createElement('div');

            // 첫 페이지 및 이전 그룹 버튼
            if (pageList < 2) {
                // 첫 번째 그룹이면 비활성화
                pageInner.innerHTML += "<span class='page-btn inactive page-btn-arrow'><i class='fa fa-fast-backward' aria-hidden='true'></i></span>" +
                                     "<span class='page-btn inactive arrow-left page-btn-arrow'><i class='fa fa-backward' aria-hidden='true'></i></span>";
            } else {
                // 첫 번째 그룹이 아니면 활성화
                pageInner.innerHTML += "<span class='page-btn active page-btn-arrow' data-name='first-page' data-page='1'><i class='fa fa-fast-backward' aria-hidden='true'></i></span>" +
                                     "<span class='page-btn active arrow-left page-btn-arrow' data-name='prev-group-page' data-page='" + prevGroupPage + "'><i class='fa fa-backward' aria-hidden='true'></i></span>";
            }

            // 이전 페이지 버튼 (모바일용 - 1페이지씩 이동)
            var prevPageCls = (currentPage == 1) ? "inactive" : "active";
            var prevPage = (currentPage == 1) ? 0 : currentPage - 1;
            pageInner.innerHTML += "<span class='page-btn " + prevPageCls + " prev-page page-btn-mobile' data-name='prev-page' data-page='" + prevPage + "'>이전페이지</span>";

            // 페이지 번호 버튼 생성
            var pageHtml = '';
            for (var i = startPageList; i <= endPageList; i++) {
                if (i == currentPage) {
                    // 현재 페이지 (강조 표시)
                    pageHtml += "<span class='page-num page-current' data-name='page-num' data-page='" + i + "' id='" + i + "'>" + i + "</span> ";
                } else {
                    // 일반 페이지
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
                // 다음 그룹이 있으면 활성화
                pageInner.innerHTML += "<span class='page-btn active arrow-right page-btn-arrow' data-name='next-group-page' data-page='" + nextGroupPage + "'><i class='fa fa-forward' aria-hidden='true'></i></span>" +
                                      "<span class='page-btn active page-btn-arrow' data-name='last-page' data-page='" + totalPage + "'><i class='fa fa-fast-forward' aria-hidden='true'></i></span>";
            } else {
                // 마지막 그룹이면 비활성화
                pageInner.innerHTML += "<span class='page-btn inactive arrow-right page-btn-arrow'><i class='fa fa-forward' aria-hidden='true'></i></span>" +
                                      "<span class='page-btn inactive page-btn-arrow'><i class='fa fa-fast-forward' aria-hidden='true'></i></span>";
            }

            // 페이징 DOM 업데이트 (DocumentFragment 사용으로 reflow 최소화)
            fragment.appendChild(pageInner);
            $(pagerID).empty().append(fragment);
        };

        // ========================================
        // 페이지 이동 메서드
        // ========================================

        /**
         * 첫 페이지로 이동
         */
        this.firstPage = function() {
            rumiThis.get_datalist(1, rumiThis.searchString());
        };

        /**
         * 이전 페이지로 이동 (모바일용)
         * @param {Number} page 이동할 페이지 번호
         */
        this.prevPage = function(page) {
            if (page == 0) return false; // 1페이지 미만이면 무시
            rumiThis.get_datalist(page, rumiThis.searchString());
        };

        /**
         * 다음 페이지로 이동 (모바일용)
         * @param {Number} page 이동할 페이지 번호
         */
        this.nextPage = function(page) {
            if (page == 0) return false; // 마지막 페이지 초과면 무시
            rumiThis.get_datalist(page, rumiThis.searchString());
        };

        /**
         * 이전 페이지 그룹으로 이동 (10개 단위)
         */
        this.prevGroupPage = function() {
            currentPage -= cfg.pageCount;
            var pageList = Math.ceil(currentPage / cfg.pageCount);
            currentPage = (pageList - 1) * cfg.pageCount + cfg.pageCount;
            rumiThis.get_datalist(currentPage, rumiThis.searchString());
        };

        /**
         * 다음 페이지 그룹으로 이동 (10개 단위)
         */
        this.nextGroupPage = function() {
            currentPage += cfg.pageCount;
            var pageList = Math.ceil(currentPage / cfg.pageCount);
            currentPage = (pageList - 1) * cfg.pageCount + 1;
            rumiThis.get_datalist(currentPage, rumiThis.searchString());
        };

        /**
         * 마지막 페이지로 이동
         * @param {Number} totalSize 전체 페이지 수
         */
        this.lastPage = function(totalSize) {
            rumiThis.get_datalist(totalSize, rumiThis.searchString());
        };

        /**
         * 특정 페이지로 이동
         * @param {Number} num 페이지 번호
         */
        this.goPage = function(num) {
            rumiThis.get_datalist(num, rumiThis.searchString());
        };

        // ========================================
        // 초기화
        // ========================================

        /**
         * 플러그인 초기화 실행
         */
        this.init = function() {
            // 페이지 로드 시간 측정 (디버깅용)
            console.time('페이지 초기화');

            // 첫 로딩 플래그 설정
            isFirstLoad = true;

            // 초기 로딩 시 로딩 표시 비활성화 (UX 개선)
            if (window.showLoadingOnSearch !== undefined) {
                window.showLoadingOnSearch = false;
            }

            // 초기 데이터 로드 (Promise 기반)
            rumiThis.get_datalist(1, rumiThis.searchString())
                .then(function() {
                    console.timeEnd('페이지 초기화');
                })
                .catch(function(error) {
                    console.error('초기화 오류:', error);
                    console.timeEnd('페이지 초기화');
                });
        };

        // ========================================
        // 플러그인 실행
        // ========================================

        // 전역 접근을 위한 인스턴스 등록 (디버깅용)
        window.rumiPagingInstance = this;

        // 컴포넌트 초기화 실행
        this.init();

        // jQuery 체이닝을 위해 this 반환
        return this;
    };
}(jQuery));