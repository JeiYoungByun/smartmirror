/* global Module, Log, config, moment */

Module.register("calendar", {
	// 기본 설정
	defaults: {
		maximumEntries: 10,
		maximumNumberOfDays: 365,
		pastDaysCount: 0,      // 과거 며칠까지 보여줄지
		displaySymbol: true,
		defaultSymbol: "calendar-days",
		defaultSymbolClassName: "fas fa-fw fa-",
		showLocation: false,
		fetchInterval: 60 * 60 * 1000, // 1시간마다 갱신
		animationSpeed: 2000,
		dateFormat: "MMM Do",
		timeFormat: "relative", // "relative" 또는 "absolute"
		fullDayEventDateFormat: "MMM Do",
		showEnd: false,
		hidePrivate: false,
		hideOngoing: false,
		hideDuplicates: true,
		tableClass: "small",
		calendars: [
			{
				symbol: "calendar-alt",
				url: "https://www.calendarlabs.com/templates/ical/US-Holidays.ics"
			}
		],
		broadcastEvents: true,   // 다른 모듈로 이벤트 브로드캐스트
		excludedEvents: [],
		selfSignedCert: false
	},

	requiresVersion: "2.1.0",

	getStyles () {
		return ["calendar.css", "font-awesome.css"];
	},

	getScripts () {
		return ["moment.js", "moment-timezone.js"];
	},

	getTranslations () {
		// 코어 번역 사용
		return false;
	},

	start () {
		Log.info("Starting module: " + this.name);

		// locale 설정
		moment.updateLocale(config.language, {});

		// 캘린더 데이터 저장소
		this.calendarData = {};   // { urlKey: [events] }
		this.loaded = false;
		this.error = null;

		this.config.calendars.forEach((calendar) => {
			// webcal → http
			calendar.url = calendar.url.replace("webcal://", "http://");

			const calendarConfig = {
				maximumEntries: calendar.maximumEntries,
				maximumNumberOfDays: calendar.maximumNumberOfDays,
				pastDaysCount: calendar.pastDaysCount,
				excludedEvents: calendar.excludedEvents,
				fetchInterval: calendar.fetchInterval,
				broadcastPastEvents: calendar.broadcastPastEvents,
				selfSignedCert: calendar.selfSignedCert
			};

			// 구버전 user/pass 대응
			if (calendar.user && calendar.pass) {
				calendar.auth = {
					user: calendar.user,
					pass: calendar.pass
				};
			}

			this.addCalendar(calendar.url, calendar.auth, calendarConfig);
		});

		this.selfUpdate();
	},

	/**
	 * node_helper에 캘린더 추가 요청
	 */
	addCalendar (url, auth, calendarConfig) {
		this.sendSocketNotification("ADD_CALENDAR", {
			id: this.identifier,
			url: url,
			excludedEvents: calendarConfig.excludedEvents || this.config.excludedEvents,
			maximumEntries: calendarConfig.maximumEntries || this.config.maximumEntries,
			maximumNumberOfDays: calendarConfig.maximumNumberOfDays || this.config.maximumNumberOfDays,
			pastDaysCount: calendarConfig.pastDaysCount || this.config.pastDaysCount,
			fetchInterval: calendarConfig.fetchInterval || this.config.fetchInterval,
			auth: auth,
			broadcastPastEvents: calendarConfig.broadcastPastEvents || false,
			selfSignedCert: calendarConfig.selfSignedCert || this.config.selfSignedCert
		});
	},

	/**
	 * node_helper → 프론트로 오는 소켓 메시지 처리
	 * (버전 차이 상관없이 최대한 관대하게 처리)
	 */
	socketNotificationReceived (notification, payload) {
		if (notification === "CALENDAR_EVENTS") {
			const urlKey = (payload && payload.url) ? payload.url : "default";
			const events = (payload && payload.events) ? payload.events : [];

			this.calendarData[urlKey] = events;
			this.error = null;
			this.loaded = true;

			if (this.config.broadcastEvents) {
				this.broadcastEvents();
			}

			this.updateDom(this.config.animationSpeed);
		}
		else if (notification === "CALENDAR_ERROR") {
			let message = "CALENDAR ERROR";
			if (payload && payload.error_type) {
				message = payload.error_type;
			}
			this.error = message;
			this.loaded = true;
			this.updateDom(this.config.animationSpeed);
		}
	},

	/**
	 * 다른 모듈(MMM-QRCode 등)로 이벤트 배열 브로드캐스트
	 *  → payload 형식: [event, event, ...]
	 */
	broadcastEvents () {
		const allEvents = [];

		for (const urlKey in this.calendarData) {
			if (!Object.prototype.hasOwnProperty.call(this.calendarData, urlKey)) continue;
			const arr = this.calendarData[urlKey] || [];
			arr.forEach((e) => {
				// url 정보는 외부 모듈엔 필요 없으니 제거(optional)
				const copy = Object.assign({}, e);
				delete copy.url;
				allEvents.push(copy);
			});
		}

		// MMM-QRCode가 기대하는 포맷은 "배열"
		this.sendNotification("CALENDAR_EVENTS", allEvents);
	},

	/**
	 * DOM 생성
	 */
	getDom () {
		const wrapper = document.createElement("table");
		wrapper.className = this.config.tableClass;

		// 에러가 있으면 에러 표시
		if (this.error) {
			wrapper.innerHTML = this.error;
			wrapper.className = this.config.tableClass + " dimmed";
			return wrapper;
		}

		const events = this.createEventList();

		// 아직 데이터 안 들어왔으면 "LOADING"
		if (!this.loaded) {
			wrapper.innerHTML = this.translate
				? this.translate("LOADING")
				: "로딩 중...";
			wrapper.className = this.config.tableClass + " dimmed";
			return wrapper;
		}

		// 데이터는 받았는데 이벤트가 없으면 "EMPTY"
		if (events.length === 0) {
			wrapper.innerHTML = this.translate
				? this.translate("EMPTY")
				: "일정 없음";
			wrapper.className = this.config.tableClass + " dimmed";
			return wrapper;
		}

		// 실제 이벤트 렌더링
		events.forEach((event) => {
			const row = document.createElement("tr");
			row.className = "event-wrapper normal event";

			// 아이콘
			if (this.config.displaySymbol) {
				const symbolCell = document.createElement("td");
				const symbol = document.createElement("span");
				symbol.className = this.config.defaultSymbolClassName + this.config.defaultSymbol;
				symbolCell.className = "symbol";
				symbolCell.appendChild(symbol);
				row.appendChild(symbolCell);
			}

			// 타이틀
			const titleCell = document.createElement("td");
			titleCell.className = "title bright";
			titleCell.innerHTML = event.title || "(제목 없음)";
			row.appendChild(titleCell);

			// 시간
			const timeCell = document.createElement("td");
			timeCell.className = "time light";

			const start = moment(event.startDate, "x");
			const end = moment(event.endDate, "x");
			const now = moment();

			if (this.config.timeFormat === "absolute") {
				// 예: 12월 7일 18:30
				let text = start.format(this.config.dateFormat + " LT");
				if (this.config.showEnd && event.startDate !== event.endDate) {
					text += " - " + end.format("LT");
				}
				timeCell.innerHTML = text;
			} else {
				// relative 모드: 오늘 / 내일 / 3시간 후 등
				if (start.isSame(now, "day")) {
					timeCell.innerHTML = this.translate
						? "[" + this.translate("TODAY") + "] " + start.format("LT")
						: "[오늘] " + start.format("LT");
				} else if (start.isBefore(now)) {
					timeCell.innerHTML = start.fromNow(); // "x시간 전"
				} else {
					timeCell.innerHTML = start.fromNow(); // "x시간 후"
				}
			}

			row.appendChild(timeCell);

			wrapper.appendChild(row);

			// 위치 보이기 옵션
			if (this.config.showLocation && event.location) {
				const locRow = document.createElement("tr");
				locRow.className = "event-wrapper-location normal xsmall light";

				if (this.config.displaySymbol) {
					const emptySymbolCell = document.createElement("td");
					locRow.appendChild(emptySymbolCell);
				}

				const locCell = document.createElement("td");
				locCell.colSpan = 2;
				locCell.className = "location";
				locCell.innerHTML = event.location;
				locRow.appendChild(locCell);

				wrapper.appendChild(locRow);
			}
		});

		return wrapper;
	},

	/**
	 * this.calendarData → 화면용 리스트로 변환
	 */
	createEventList () {
		const now = moment();
		const pastLimit = now.clone().subtract(this.config.pastDaysCount, "days");
		const futureLimit = now.clone().add(this.config.maximumNumberOfDays, "days").endOf("day");

		let events = [];

		for (const urlKey in this.calendarData) {
			if (!Object.prototype.hasOwnProperty.call(this.calendarData, urlKey)) continue;
			const calendar = this.calendarData[urlKey] || [];

			calendar.forEach((event) => {
				const start = moment(event.startDate, "x");
				const end = moment(event.endDate, "x");

				if (this.config.hidePrivate && event.class === "PRIVATE") {
					return;
				}
				if (end.isBefore(pastLimit)) {
					return;
				}
				if (start.isAfter(futureLimit)) {
					return;
				}
				if (this.config.hideOngoing && start.isBefore(now) && end.isAfter(now)) {
					return;
				}

				event.url = urlKey;
				events.push(event);
			});
		}

		// 시작시간 기준 정렬
		events.sort((a, b) => {
			return parseInt(a.startDate, 10) - parseInt(b.startDate, 10);
		});

		// 최대 개수 제한
		return events.slice(0, this.config.maximumEntries);
	},

	/**
	 * 1분마다 DOM 강제 리프레시 (relative 시간 업데이트용)
	 */
	selfUpdate () {
		const ONE_MINUTE = 60 * 1000;
		setTimeout(() => {
			setInterval(() => {
				Log.debug("[Calendar] self update");
				this.updateDom(1000);
			}, ONE_MINUTE);
		}, ONE_MINUTE - (new Date() % ONE_MINUTE));
	}
});
