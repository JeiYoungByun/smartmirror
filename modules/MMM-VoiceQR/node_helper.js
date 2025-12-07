/* Magic Mirror
 * Module: MMM-VoiceQR
 * Node Helper (Backend)
 */

require('module-alias').addAlias('grpc', '@grpc/grpc-js');

const NodeHelper = require("node_helper");
const path = require("path");
const GoogleAssistant = require("google-assistant");
const record = require("node-record-lpcm16");

module.exports = NodeHelper.create({
    start: function () {
        console.log("MMM-VoiceQR helper started...");
        this.assistant = null;
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "INIT") {
            this.config = payload;
            this.initAssistant();
        }
    },

    initAssistant: function () {
        const authConfig = {
            keyFilePath: path.resolve(__dirname, "credentials.json"),
            savedTokensPath: path.resolve(__dirname, "token.json"),
        };

        const conversationConfig = {
            lang: "ko-KR", 
            audio: {
                sampleRateIn: 16000,
                encodingIn: "LINEAR16",
            },
        };

        this.assistant = new GoogleAssistant(authConfig);

        this.assistant.on("ready", () => {
            console.log("[MMM-VoiceQR] Assistant Ready! Starting Mic...");
            this.startListening(conversationConfig);
        });

        this.assistant.on("error", (err) => {
            console.error("[MMM-VoiceQR] Auth Error:", err);
        });
    },

    startListening: function (conversationConfig) {
        if (!this.assistant) return;

        this.assistant.start(conversationConfig, (conversation) => {
            const mic = record.record({
                sampleRate: 16000,
                threshold: 0,
                verbose: false,
                recordProgram: "arecord", 
                device: "plughw:1,0", 
            });

            mic.stream().pipe(conversation);

            conversation
                .on("transcription", (data) => {
                    if (data.transcription) {
                        // 1. 텍스트 정제 (공백 제거, 소문자 변환)
                        const text = data.transcription.toLowerCase().replace(/\s/g, "");
                        
                        // [디버깅용 로그] 실제 들린 말 확인
                        console.log("Heard:", text); 

                        // ---------------------------------------------------------
                        // [명령어 처리 로직]
                        // ---------------------------------------------------------

                        // Case 1: [뉴스 QR] 켜기
                        if (text.includes("뉴스qr") || text.includes("newsqr")) {
                            console.log(">>> 명령 감지: 뉴스 QR");
                            this.sendSocketNotification("TURN_OVER", { type: "NEWS" });
                        }
                        
                        // Case 2: [캘린더 QR] "일정장소QR" 명령어로 통일
                        // 예: "일정 장소 QR 보여줘", "두 번째 일정 장소 QR"
                        else if (text.includes("일정장소qr") || text.includes("일정장소큐알")) {
                            
                            let index = 0; // 기본값: 첫 번째 (0)
                            
                            // 순서 키워드 감지 (없으면 0 유지)
                            if (text.includes("두번째") || text.includes("2번째")) index = 1;
                            else if (text.includes("세번째") || text.includes("3번째")) index = 2;
                            else if (text.includes("네번째") || text.includes("4번째")) index = 3;
                            else if (text.includes("다섯번째") || text.includes("5번째")) index = 4;
                            
                            console.log(`>>> 명령 감지: 일정 장소 QR (${index + 1}번째)`);
                            this.sendSocketNotification("TURN_OVER", { type: "CALENDAR", index: index });
                        }

                        // Case 3: [끄기] (공통)
                        else if (text.includes("qr꺼") || text.includes("지워") || text.includes("닫아") || text.includes("치워")) {
                            console.log(">>> 명령 감지: QR 끄기");
                            this.sendSocketNotification("TURN_OVER", { type: "OFF" });
                        }
                    }
                })
                .on("ended", (error) => {
                    mic.stop();
                    setTimeout(() => {
                        this.startListening(conversationConfig);
                    }, 500);
                })
                .on("error", (error) => {
                    mic.stop();
                    setTimeout(() => {
                        this.startListening(conversationConfig);
                    }, 2000);
                });
        });
    }
});