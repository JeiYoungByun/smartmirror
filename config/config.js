/* Magic Mirror Config
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
let config = {
    address: "0.0.0.0", 
    port: 8080,
    electronOptions: {
        fullscreen: false,
        width: 1024,
        height: 768,
        frame: true,
        // [라즈베리파이 5 화면 오류 방지 옵션]
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        backgroundColor: "#000000"
    },
    basePath: "/",
    
    ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.75.0/24"], 

    useHttps: false,
    httpsPrivateKey: "",
    httpsCertificate: "",

    language: "ko",
    locale: "en-US",
    logLevel: ["INFO", "LOG", "WARN", "ERROR"],
    timeFormat: 24,
    units: "metric",

    modules: [
        {
            module: "alert",
        },
        {
            module: "updatenotification",
            position: "top_bar"
        },
        {
            module: "clock",
            position: "top_left"
        },
        {
            module: "MMM-MonthCalendar",
            position: "top_left",
            header: "",
            config: {
                updateDelay: 60,
                showAdjacentMonths: true
            }
        }, 
        {
            module: "calendar",
            header: "My Schedule",
            position: "top_left",
            config: {
                broadcastEvents: true, // 필수
                maximumEntries: 50,        // 최대 50개까지 표시
                
                calendars: [
                    {
                        symbol: "calendar-check",
                        // 다시 본인의 비공개 주소로 설정하세요
                        url: "https://calendar.google.com/calendar/ical/byeonjeiyoung%40gmail.com/private-06c85fe4330e4d1f521fc981782b0b70/basic.ics"
                    }
                ]
            }
        },
        
        {
            module: "newsfeed",
            position: "top_right",
            config: {
                feeds: [
                    {
                        title: "헤드라인 뉴스",
                        url: "https://www.yna.co.kr/rss/news.xml"
                    }
                ],
                showSourceTitle: true,
                showPublishDate: true,
                broadcastNewsFeeds: true,
                broadcastNewsUpdates: true,
                ignoreOldItems: true,
                removeStartTags: "title, description",
                updateInterval: 30000,
                showDescription: true,
                wrapTitle: true
            }
        },

        // [QR 코드 모듈]
        {
            module: "MMM-QRCode",
            position: "bottom_right", 
            config: {
                imageSize: 200,
                showRaw: false,
                text: "", 
                
                // [중요] VoiceQR이 보내는 'SHOW_QR' 신호만 듣도록 설정 (그래야 음성 제어 가능)
                listenNotification: "SHOW_QR"
            }
        },
        
        // [음성 인식 모듈]
        {
            module: "MMM-VoiceQR",
            position: "top_right", 
            config: {
                debug: true
            }
        },
    ]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {module.exports = config;}