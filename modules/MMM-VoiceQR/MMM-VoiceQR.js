/* MMM-VoiceQR.js (Safe Version) */

Module.register("MMM-VoiceQR", {
    defaults: {
        debug: true
    },

    start: function() {
        Log.info("Starting module: " + this.name);
        this.sendSocketNotification("INIT", this.config);
        
        // [디버깅] 이 로그가 터미널에 떠야 캘린더도 살아납니다.
        console.log(">> [MMM-VoiceQR] Front-end Loaded!"); 
        this.sendSocketNotification("DEBUG_LOG", "Front-end Loaded!");

        this.isQRShowing = false;
        this.storedEvents = [];
    },

    getDom: function() {
        var wrapper = document.createElement("div");
        var icon = document.createElement("i");
        icon.className = "fas fa-microphone";
        icon.style.color = "#e74c3c";
        icon.style.fontSize = "30px";
        wrapper.appendChild(icon);
        return wrapper;
    },

    notificationReceived: function(notification, payload, sender) {
        // 캘린더 데이터 받으면 저장
        if (notification === "CALENDAR_EVENTS") {
            this.storedEvents = payload;
            this.sendSocketNotification("DEBUG_LOG", "Calendar Events: " + payload.length);
        }
        // 뉴스 데이터 처리
        if (notification === "RESPONSE_NEWS_DATA") {
            this.sendNotification("SHOW_QR", { url: payload.url });
        }
        // 뉴스 자동 변경
        if (notification === "NEWS_ARTICLE_CHANGED") {
            if (this.isQRShowing && payload.url) {
                this.sendNotification("SHOW_QR", { url: payload.url });
            }
        }
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "TURN_OVER") {
            if (payload.type === "NEWS") {
                this.isQRShowing = true;
                this.sendNotification("REQUEST_NEWS_DATA", {});
            } else if (payload.type === "CALENDAR") {
                this.isQRShowing = false;
                var idx = payload.index || 0;
                
                if (this.storedEvents && this.storedEvents.length > idx) {
                    var event = this.storedEvents[idx];
                    if (event.location) {
                        // 네이버 지도 URL 정리 로직 (간소화)
                        var finalUrl = event.location;
                        if (finalUrl.includes("/place/")) {
                            try {
                                var match = finalUrl.match(/\/place\/(\d+)/);
                                if (match) finalUrl = "https://map.naver.com/p/place/" + match[1];
                            } catch(e) {}
                        }
                        this.sendNotification("SHOW_QR", { url: finalUrl });
                    } else {
                        this.sendNotification("SHOW_QR", { url: "" });
                    }
                } else {
                    this.sendNotification("SHOW_QR", { url: "" });
                }
            } else if (payload.type === "OFF") {
                this.isQRShowing = false;
                this.sendNotification("SHOW_QR", { url: "" });
            }
        }
    }
});