/* Magic Mirror
 * Module: MMM-VoiceQR
 *
 * By ChangGongSeol Team
 * MIT Licensed.
 */

Module.register("MMM-VoiceQR", {
    defaults: {
        debug: false
    },

    start: function () {
        Log.info("Starting module: " + this.name);
        this.isListening = false;
        this.sendSocketNotification("INIT", this.config);
    },

    getDom: function () {
        const wrapper = document.createElement("div");
        // 상태 표시 아이콘 (마이크)
        const icon = document.createElement("i");
        icon.className = "fas fa-microphone " + (this.isListening ? "fa-pulse" : "");
        icon.style.color = this.isListening ? "#e74c3c" : "#555"; // 듣고 있으면 빨간색
        icon.style.fontSize = "30px";
        
        wrapper.appendChild(icon);
        return wrapper;
    },

    // [1] 백엔드(node_helper)로부터 메시지 수신
    socketNotificationReceived: function (notification, payload) {
        if (notification === "LISTENING_STATUS") {
            this.isListening = payload;
            this.updateDom();
        }
        else if (notification === "TURN_OVER") {
            // "뉴스 QR" 키워드가 감지됨
            if (payload.foundHook === "GET_NEWS_QR") {
                Log.info("[MMM-VoiceQR] 'News QR' command received. Requesting news data...");
                
                // [2] Newsfeed 모듈에게 URL 요청
                this.sendNotification("REQUEST_NEWS_DATA", {}); 
            }
        }
    },

    // [3] 다른 모듈(Newsfeed)로부터 알림 수신
    notificationReceived: function (notification, payload, sender) {
        
        // Newsfeed 모듈이 URL을 응답했을 때
        if (notification === "RESPONSE_NEWS_DATA") {
            Log.info("[MMM-VoiceQR] Received News Data. URL: " + payload.url);
            
            // [4] MMM-QRCode 모듈에게 URL 표시 명령 전달
            // payload에서 URL을 추출하여 QRCode 모듈이 이해할 수 있는 형태로 전송
            // (MMM-QRCode 모듈의 config.js 설정과 맞춰야 함)
            this.sendNotification("SHOW_QR_URL", { url: payload.url });
        }
    }
});