/* Magic Mirror
 * Module: MMM-VoiceQR
 *
 * By ChangGongSeol Team
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const path = require("path");
const GoogleAssistant = require("google-assistant");
const record = require("node-record-lpcm16");

module.exports = NodeHelper.create({
    start: function () {
        console.log("MMM-VoiceQR helper started...");
        this.config = null;
        this.assistant = null;
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "INIT") {
            this.config = payload;
            this.initAssistant();
        } else if (notification === "START_LISTENING") {
            this.startConversation();
        }
    },

    initAssistant: function () {
        const authConfig = {
            keyFilePath: path.resolve(__dirname, "credentials.json"),
            savedTokensPath: path.resolve(__dirname, "token.json"),
        };

        this.assistant = new GoogleAssistant(authConfig.keyFilePath ? authConfig : null);

        this.assistant.on("ready", () => {
            console.log("[MMM-VoiceQR] Assistant is ready. Listening...");
            // 모듈 시작 시 자동으로 리스닝을 시작하거나, 필요에 따라 트리거 할 수 있습니다.
            // 여기서는 연속성을 위해 대화가 끝나면 다시 시작하는 로직을 startConversation에 포함합니다.
            this.startConversation(); 
        });

        this.assistant.on("error", (error) => {
            console.error("[MMM-VoiceQR] Assistant Auth Error:", error);
        });
    },

    startConversation: function () {
        if (!this.assistant) return;

        const conversationConfig = {
            audio: {
                encodingIn: "LINEAR16", // 마이크 입력 포맷
                sampleRateIn: 16000,    // 샘플 레이트
            },
            lang: "ko-KR", // 한국어 설정
        };

        this.assistant.start(conversationConfig, (conversation) => {
            this.sendSocketNotification("LISTENING_STATUS", true); // 화면에 '듣는 중' 표시용

            // 1. 마이크 입력을 Assistant로 파이프(전송) 연결
            const mic = record.record({
                sampleRate: 16000,
                threshold: 0,
                verbose: false,
                recordProgram: "arecord", // 라즈베리파이에서는 arecord 사용
                device: "plughw:1,0",     // ※ 중요: 사용하는 마이크 장치 번호로 변경 필요 (arecord -l 확인)
            });
            
            mic.stream().pipe(conversation);

            // 2. 음성 인식 결과 처리 (Speech-to-Text)
            conversation
                .on("transcription", (data) => {
                    // 사용자가 말하는 내용이 실시간으로 텍스트로 변환됨
                    if (data.transcription) {
                        console.log("[MMM-VoiceQR] Heard:", data.transcription);
                        
                        // [핵심 로직] 키워드 감지
                        const spokenText = data.transcription.toLowerCase().replace(/\s/g, ""); // 공백제거 후 비교
                        if (spokenText.includes("뉴스qr") || spokenText.includes("newsqr")) {
                            console.log("[MMM-VoiceQR] Keyword Detected! Sending Turn Over signal.");
                            this.sendSocketNotification("TURN_OVER", { foundHook: "GET_NEWS_QR" });
                        }
                    }
                })
                .on("ended", (error, continueConversation) => {
                    this.sendSocketNotification("LISTENING_STATUS", false);
                    mic.stop(); // 녹음 중지
                    
                    if (error) console.log("[MMM-VoiceQR] Conversation Ended Error:", error);
                    
                    // 연속 듣기를 위해 대화 종료 후 다시 시작 (필요 시 주석 처리하여 버튼 트리거로 변경 가능)
                    setTimeout(() => {
                        this.startConversation();
                    }, 1000);
                })
                .on("error", (error) => {
                    console.error("[MMM-VoiceQR] Conversation Error:", error);
                    mic.stop();
                    setTimeout(() => {
                        this.startConversation();
                    }, 3000);
                });
        });
    }
});