/* global Module, Log, QRCode */

"use strict";

Module.register("MMM-QRCode", {
    defaults: {
        text: "",
        colorDark: "#fff",
        colorLight: "#000",
        imageSize: 150,
        showRaw: false,
        listenNotification: "" // config.js에서 "SHOW_QR"로 설정됨
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
        
        // 1. 설정된 알림(SHOW_QR)이 아니면 무시
        if (notification !== this.config.listenNotification) {
            return;
        }

        let newQrText = null;

        // 2. 통합 로직: Payload 안에 URL이 있는지만 확인
        // (뉴스든 캘린더든 VoiceQR 모듈이 { url: "..." } 형태로 보내줌)
        if (payload && payload.url) {
            newQrText = payload.url;
        } else {
            // URL이 없거나 빈 문자열이면 숨김 처리
            newQrText = ""; 
        }
        
        // 3. 변경사항이 있을 때만 화면 업데이트
        if (newQrText !== null && this.qrText !== newQrText) {
            this.qrText = newQrText;
            Log.info(this.name + " updating QR code: " + (this.qrText ? "Show" : "Hide"));
            this.updateDom(100); 
        }
    },

    getDom: function () {
        const wrapperEl = document.createElement("div");
        wrapperEl.classList.add("qrcode");
        
        // 텍스트(URL)가 있을 때만 QR 코드 생성
        if (this.qrText) {
            const qrcodeEl = document.createElement("div");
            new QRCode(qrcodeEl, {
                text: this.qrText,
                width: this.config.imageSize,
                height: this.config.imageSize,
                colorDark: this.config.colorDark,
                colorLight: this.config.colorLight,
                correctLevel: QRCode.CorrectLevel.H
            });
            
            const imageEl = document.createElement("div");
            imageEl.classList.add("qrcode__image");
            imageEl.appendChild(qrcodeEl);
            wrapperEl.appendChild(imageEl);

            if (this.config.showRaw) {
                const textEl = document.createElement("div");
                textEl.classList.add("qrcode__text");
                textEl.innerHTML = this.qrText;
                wrapperEl.appendChild(textEl);
            }
        }
        // 텍스트가 없으면 빈 div 리턴 (화면에서 사라짐)
        return wrapperEl;
    }
});