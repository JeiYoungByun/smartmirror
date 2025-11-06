/* Magic Mirror Config
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
let config = {
    // [설정 1] "0.0.0.0" (외부 접속 허용)
    address: "0.0.0.0", 
    port: 8080,
    electronOptions: {
        fullscreen: false,
        width: 1024,
        height: 768, 
        frame: true
    },
    basePath: "/",
    
    // [설정 2] 로컬 네트워크(192.168.75.xxx) 접속 허용
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
            module: 'MMM-MonthCalendar',
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
                // [핵심 1] 캘린더가 알림을 방송(Broadcast)하도록 설정
                broadcastEvents: true,
                calendars: [
                    {
                        symbol: "calendar-check",
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

        // 캘린더용 QR 코드 모듈
        {
            module: "MMM-QRCode",
            position: "bottom_center", 
            config: {
                imageSize: 150, // (뉴스 QR과 구분되게 사이즈 조절)
                showRaw: false,
                text: "", // 기본값
                
                // [핵심] 캘린더 알림을 듣도록 설정
                listenNotification: "CALENDAR_EVENTS"
            }
        },

        // 뉴스용 QR 코드 모듈
        {
            module: "MMM-QRCode",
            position: "bottom_right", // (예시: 오른쪽 아래)
            config: {
                imageSize: 120,
                showRaw: false,
                text: "", // 기본값
                
                // [핵심] 뉴스 알림을 듣도록 설정
                listenNotification: "NEWS_ARTICLE_CHANGED"
            }
        },
    ]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {module.exports = config;}