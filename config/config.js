

/* Magic Mirror Config Sample
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 *
 * For more information on how you can configure this file
 * see https://docs.magicmirror.builders/getting-started/configuration.html#general
 * and https://docs.magicmirror.builders/modules/configuration.html
 */
let config = {
	address: "localhost", 	// Address to listen on, can be:
							// - "localhost", "127.0.0.1", "::1" to listen on loopback interface
							// - another specific IPv4/6 to listen on a specific interface
							// - "0.0.0.0", "::" to listen on any interface
							// Default, when address config is left out or empty, is "localhost"
	port: 8080,
	electronOptions: {
		fullscreen: false,
		width: 1024,
		height: 768, 
		frame: true
	},
	basePath: "/", 	// The URL path where MagicMirror is hosted. If you are using a Reverse proxy
					// you must set the sub path here. basePath must end with a /
	ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"], 	// Set [] to allow all IP addresses
															// or add a specific IPv4 of 192.168.1.5 :
															// ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.1.5"],
															// or IPv4 range of 192.168.3.0 --> 192.168.3.15 use CIDR format :
															// ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.3.0/28"],

	useHttps: false, 		// Support HTTPS or not, default "false" will use HTTP
	httpsPrivateKey: "", 	// HTTPS private key path, only require when useHttps is true
	httpsCertificate: "", 	// HTTPS Certificate path, only require when useHttps is true

	language: "ko",
	locale: "en-US",
	logLevel: ["INFO", "LOG", "WARN", "ERROR"], // Add "DEBUG" for even more logging
	timeFormat: 24,
	units: "metric",
	// serverOnly:  true/false/"local" ,
	// local for armv6l processors, default
	//   starts serveronly and then starts chrome browser
	// false, default for all NON-armv6l devices
	// true, force serveronly mode, because you want to.. no UI on this device

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
				calendars: [
					{
						symbol: "calendar-check",
						url: "https://calendar.google.com/calendar/ical/byeonjeiyoung%40gmail.com/private-06c85fe4330e4d1f521fc981782b0b70/basic.ics"
					}
				]
			}
		},
		// {
		// 	module: "weather",
		// 	position: "top_right",
		// 	config: {
		// 		weatherProvider: "openweathermap",
		// 		type: "current",
		// 		location: "Seoul",
		// 		locationID: "1835847", //ID from http://bulk.openweathermap.org/sample/city.list.json.gz; unzip the gz file and find your city
		// 		apiKey: "e53f49c81339869065034c25bf19327a",
		// 		onlyTemp: true
		// 	}
		// },
		// {
		// 	module: "weather",
		// 	position: "top_right",
		// 	//header: "예보",
		// 	config: {
		// 		weatherProvider: "openweathermap",
		// 		type: "forecast",
		// 		location: "Seoul",
		// 		locationID: "1835847", //ID from http://bulk.openweathermap.org/sample/city.list.json.gz; unzip the gz file and find your city
		// 		apiKey: "e53f49c81339869065034c25bf19327a"
		// 	}
		// },
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
		{
            module: "MMM-QRCode",
            position: "bottom_right", // 뉴스피드(top_right)의 아래쪽
            config: {
                // QR 코드의 세부 설정을 여기서 할 수 있습니다.
                colorDark: "#fff",      // QR 코드 색상
                colorLight: "#000",     // QR 코드 배경색
                imageSize: 150,         // QR 코드 크기 (픽셀)
                showRaw: false           // QR 코드 하단에 URL 텍스트 표시 여부
            }
        },
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {module.exports = config;}