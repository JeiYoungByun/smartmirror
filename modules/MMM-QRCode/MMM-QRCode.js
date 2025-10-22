/* global Module */

/* Magic Mirror
 * Module: QRCode
 *
 * By Evghenii Marinescu https://github.com/MarinescuEvghenii/
 * MIT Licensed.
 */

'use strict';

Module.register("MMM-QRCode", {

    defaults: {
        text       : 'https://github.com/MarinescuEvghenii/MMM-QRCode', // 모듈 시작 시 기본 텍스트
        colorDark  : "#fff", // QR 코드 색상 (어두운 부분)
        colorLight : "#000", // QR 코드 색상 (밝은 부분)
        imageSize  : 150,    // QR 코드 이미지 크기 (픽셀)
        showRaw    : true    // QR 코드 하단에 URL 텍스트 표시 여부
    },

    getStyles: function() {
        return ["MMM-QRCode.css"];
    },

    getScripts: function() {
        return ["qrcode.min.js"];
    },


    start: function() {
        this.config = Object.assign({}, this.defaults, this.config);
        Log.log("Starting module: " + this.name);

        // 모듈 시작 시 config에 설정된 기본 텍스트로 qrText 초기화
        this.qrText = this.config.text;
    },

    // --- 여기가 수정된 핵심 부분입니다 ---
    notificationReceived: function(notification, payload, sender) {
        
        // 1. 기본 뉴스피드 모듈이 보내는 "NEWS_ARTICLE_CHANGED" 알림인지 확인
        if (notification === "NEWS_ARTICLE_CHANGED") {
            
            // 2. payload(기사 객체)가 유효하고, 그 안에 url 속성이 있으며,
            //    그 URL이 현재 QR코드의 URL과 다른지 확인
            if (payload && payload.url && this.qrText !== payload.url) {
                
                this.qrText = payload.url; // 3. 텍스트(URL)를 새 기사의 URL로 교체
                this.updateDom(500);       // 4. QR 코드를 새로 그리라고 명령 (애니메이션 0.5초)
            }
        }
    },
    // --- 수정 끝 ---

    getDom: function() {
        const wrapperEl = document.createElement("div");
        wrapperEl.classList.add('qrcode');

        // QR 코드를 담을 div 생성
        const qrcodeEl  = document.createElement("div");
        
        // qrcode.min.js 라이브러리를 사용하여 QR 코드 생성
        new QRCode(qrcodeEl, {
            text: this.qrText, // start 또는 notificationReceived에서 업데이트된 URL
            width: this.config.imageSize,
            height: this.config.imageSize,
            colorDark : this.config.colorDark,
            colorLight : this.config.colorLight,
            correctLevel : QRCode.CorrectLevel.H
        });

        // 생성된 QR 코드를 이미지 div에 추가
        const imageEl  = document.createElement("div");
        imageEl.classList.add('qrcode__image');
        imageEl.appendChild(qrcodeEl);

        wrapperEl.appendChild(imageEl);

        // config에서 showRaw가 true일 경우에만 URL 텍스트 표시
        if(this.config.showRaw) {
            const textEl = document.createElement("div");
            textEl.classList.add('qrcode__text');
            textEl.innerHTML = this.qrText; // 현재 QR 코드가 담고 있는 URL 텍스트
            wrapperEl.appendChild(textEl);
        }

        return wrapperEl;
    }
});