/* global Module, Log, QRCode */

"use strict";

Module.register("MMM-QRCode", {
    defaults: {
        text: "",
        colorDark: "#fff",
        colorLight: "#000",
        imageSize: 150,
        showRaw: false,
        listenNotification: "" // config.js에서 설정
    },

    getStyles: function () {
        return ["MMM-QRCode.css"];
    },

    getScripts: function () {
        return ["qrcode.min.js"];
    },

    start: function () {
        this.config = Object.assign({}, this.defaults, this.config);
        Log.info(
            "Starting module: " +
                this.name +
                ". Listening for: '" +
                this.config.listenNotification +
                "'"
        );
        this.qrText = this.config.text;
    },

    notificationReceived: function (notification, payload, sender) {
        
        // 우리가 기다리던 알림(listenNotification)이 아니면 무시
        if (notification !== this.config.listenNotification) {
            return;
        }

        let newQrText = null; // 새 QR 텍스트를 저장할 변수

        // 2. 알림 종류에 따라 다르게 처리
        
        // [A] 캘린더 모듈이 보낸 알림일 경우 (payload는 배열)
        if (notification === "CALENDAR_EVENTS") {
            
            // 2-1. 캘린더에 일정이 하나 이상 있고,
            if (payload && Array.isArray(payload) && payload.length > 0) {
                
                const firstEvent = payload[0]; // 첫 번째(가장 가까운) 일정을 가져옴
                
                // 2-2. 그 일정의 'location' (위치) 필드에 값이 있다면
                if (firstEvent.location) {
                    newQrText = firstEvent.location; // QR 텍스트를 그 위치 URL로 설정
                } else {
                    // 일정이 있지만 위치 값이 없는 경우
                    newQrText = ""; // QR 코드를 숨김 (빈 문자열)
                }
            } else {
                // 일정이 아예 없는 경우
                newQrText = ""; // QR 코드를 숨김 (빈 문자열)
            }
        }
        
        // [B] 뉴스 모듈이 보낸 알림일 경우 (payload는 객체)
        else if (notification === "NEWS_ARTICLE_CHANGED") {
            
            // 2-1. 뉴스 페이로드가 유효하고, 그 안에 url 속성이 있다면
            if (payload && payload.url) {
                newQrText = payload.url; // QR 텍스트를 뉴스 기사 URL로 설정
            } else {
                // 뉴스 페이로드가 비어있는 경우
                newQrText = ""; // QR 코드를 숨김
            }
        }
        
        // 3. 최종적으로 QR 코드를 업데이트할지 결정
        if (newQrText !== null && this.qrText !== newQrText) {
            this.qrText = newQrText;
            Log.info(this.name + " updating QR code to: '" + (this.qrText || "empty") + "'");
            this.updateDom(3000);
        }
    },

    getDom: function () {
        // (getDom 함수는 이전과 동일합니다 - qrText가 비어있으면 QR 안 그림)
        const wrapperEl = document.createElement("div");
        wrapperEl.classList.add("qrcode");
        const qrcodeEl = document.createElement("div");

        if (this.qrText) {
            new QRCode(qrcodeEl, {
                text: this.qrText,
                width: this.config.imageSize,
                height: this.config.imageSize,
                colorDark: this.config.colorDark,
                colorLight: this.config.colorLight,
                correctLevel: QRCode.CorrectLevel.H
            });
        }
        const imageEl = document.createElement("div");
        imageEl.classList.add("qrcode__image");
        imageEl.appendChild(qrcodeEl);
        wrapperEl.appendChild(imageEl);
        if (this.config.showRaw && this.qrText) {
            const textEl = document.createElement("div");
            textEl.classList.add("qrcode__text");
            textEl.innerHTML = this.qrText;
            wrapperEl.appendChild(textEl);
        }
        return wrapperEl;
    }
});