/* global Module, Log, moment, config */

Module.register("newsfeed", {
	// 기본 모듈 설정
	defaults: {
		feeds: [
			{
				title: "New York Times",
				url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
				encoding: "UTF-8" // ISO-8859-1 인코딩도 지원
			}
		],
		showAsList: false,             // 목록 형태로 보여줄지 여부
		showSourceTitle: true,         // 뉴스 출처 제목 표시 여부
		showPublishDate: true,         // 발행일 표시 여부
		broadcastNewsFeeds: true,      // 다른 모듈로 뉴스 피드 정보 전송 여부
		broadcastNewsUpdates: true,    // 뉴스 업데이트 정보 전송 여부
		showDescription: false,        // 기사 내용(요약) 표시 여부
		showTitleAsUrl: false,         // 제목을 URL 링크로 표시할지 여부
		wrapTitle: true,               // 제목 줄바꿈 허용 여부
		wrapDescription: true,         // 내용 줄바꿈 허용 여부
		truncDescription: true,        // 내용이 너무 길면 자를지 여부
		lengthDescription: 400,        // 내용을 자를 길이 (글자 수)
		hideLoading: false,            // 로딩 중 표시 숨김 여부
		reloadInterval: 5 * 60 * 1000, // 5분마다 피드 새로고침
		updateInterval: 10 * 1000,     // 10초마다 다음 기사로 전환
		animationSpeed: 2.5 * 1000,    // 전환 애니메이션 속도 (2.5초)
		maxNewsItems: 0,               // 가져올 최대 뉴스 개수 (0은 제한 없음)
		ignoreOldItems: false,         // 오래된 기사 무시 여부
		ignoreOlderThan: 24 * 60 * 60 * 1000, // 1일 이상 된 기사는 무시
		removeStartTags: "",           // 제목/내용 시작 부분에서 제거할 태그
		removeEndTags: "",             // 제목/내용 끝 부분에서 제거할 태그
		startTags: [],
		endTags: [],
		prohibitedWords: [],           // 금지어 목록 (포함된 기사는 무시)
		scrollLength: 500,             // 스크롤 길이
		logFeedWarnings: false,        // 피드 경고 로그 출력 여부
		dangerouslyDisableAutoEscaping: false // HTML 태그 자동 이스케이프 해제 여부 (주의 필요)
	},

	// URL 접두사 생성 (CORS 프록시 사용 시)
	getUrlPrefix (item) {
		if (item.useCorsProxy) {
			return `${location.protocol}//${location.host}${config.basePath}cors?url=`;
		} else {
			return "";
		}
	},

	// 필요한 스크립트 로드
	getScripts () {
		return ["moment.js"];
	},

	// 필요한 스타일시트(CSS) 로드
	getStyles () {
		return ["newsfeed.css"];
	},

	// 번역 파일 로드
	getTranslations () {
		return false;
	},

	// 모듈 시작 시퀀스
	start () {
		Log.info(`모듈 시작: ${this.name}`);

		// 로케일 설정
		moment.locale(config.language);

		this.newsItems = [];
		this.loaded = false;
		this.error = null;
		this.activeItem = 0;
		this.scrollPosition = 0;

		this.registerFeeds(); // 피드 등록 시작

		this.isShowingDescription = this.config.showDescription;
	},

	// 소켓 알림 수신 핸들러 (백엔드 -> 프론트엔드)
	socketNotificationReceived (notification, payload) {
		if (notification === "NEWS_ITEMS") {
			this.generateFeed(payload);

			if (!this.loaded) {
				if (this.config.hideLoading) {
					this.show();
				}
				this.scheduleUpdateInterval();
			}

			this.loaded = true;
			this.error = null;
		} else if (notification === "NEWSFEED_ERROR") {
			this.error = this.translate(payload.error_type);
			this.scheduleUpdateInterval();
		}
	},

	// 템플릿 이름 가져오기
	getTemplate () {
		if (this.config.feedUrl) {
			return "oldconfig.njk";
		} else if (this.config.showFullArticle) {
			return "fullarticle.njk";
		}
		return "newsfeed.njk";
	},

	// 템플릿에 전달할 데이터 생성
	getTemplateData () {
		if (this.activeItem >= this.newsItems.length) {
			this.activeItem = 0;
		}
		this.activeItemCount = this.newsItems.length;
		
		if (this.config.showFullArticle) {
			this.activeItemHash = this.newsItems[this.activeItem]?.hash;
			return {
				url: this.getActiveItemURL()
			};
		}
		if (this.error) {
			this.activeItemHash = undefined;
			return {
				error: this.error
			};
		}
		if (this.newsItems.length === 0) {
			this.activeItemHash = undefined;
			return {
				empty: true
			};
		}

		const item = this.newsItems[this.activeItem];
		this.activeItemHash = item.hash;

		const items = this.newsItems.map(function (item) {
			item.publishDate = moment(new Date(item.pubdate)).fromNow();
			return item;
		});

		return {
			loaded: true,
			config: this.config,
			sourceTitle: item.sourceTitle,
			publishDate: moment(new Date(item.pubdate)).fromNow(),
			title: item.title,
			url: this.getActiveItemURL(),
			description: item.description,
			items: items
		};
	},

	// 현재 활성 기사의 URL 가져오기
	getActiveItemURL () {
		const item = this.newsItems[this.activeItem];
		if (item) {
			return typeof item.url === "string" ? this.getUrlPrefix(item) + item.url : this.getUrlPrefix(item) + item.url.href;
		} else {
			return "";
		}
	},

	broadcastActiveArticle () {
		if (this.config.broadcastNewsFeeds || this.config.broadcastNewsUpdates) {
			const item = this.newsItems[this.activeItem];
			if (item) {
				this.sendNotification("NEWS_ARTICLE_CHANGED", item);
			}
		}
	},

	registerFeeds () {
		for (let feed of this.config.feeds) {
			this.sendSocketNotification("ADD_FEED", {
				feed: feed,
				config: this.config
			});
		}
	},

	getFeedProperty (feed, property) {
		let res = this.config[property];
		const f = this.config.feeds.find((feedItem) => feedItem.url === feed);
		if (f && f[property]) res = f[property];
		return res;
	},

	generateFeed (feeds) {
		let newsItems = [];
		for (let feed in feeds) {
			const feedItems = feeds[feed];
			if (this.subscribedToFeed(feed)) {
				for (let item of feedItems) {
					item.sourceTitle = this.titleForFeed(feed);
					if (!(this.getFeedProperty(feed, "ignoreOldItems") && Date.now() - new Date(item.pubdate) > this.getFeedProperty(feed, "ignoreOlderThan"))) {
						newsItems.push(item);
					}
				}
			}
		}
		newsItems.sort(function (a, b) {
			const dateA = new Date(a.pubdate);
			const dateB = new Date(b.pubdate);
			return dateB - dateA;
		});

		if (this.config.maxNewsItems > 0) {
			newsItems = newsItems.slice(0, this.config.maxNewsItems);
		}

		if (this.config.prohibitedWords.length > 0) {
			newsItems = newsItems.filter(function (item) {
				for (let word of this.config.prohibitedWords) {
					if (item.title.toLowerCase().indexOf(word.toLowerCase()) > -1) {
						return false;
					}
				}
				return true;
			}, this);
		}
		
		newsItems.forEach((item) => {
			if (this.config.removeStartTags === "title" || this.config.removeStartTags === "both") {
				for (let startTag of this.config.startTags) {
					if (item.title.slice(0, startTag.length) === startTag) {
						item.title = item.title.slice(startTag.length, item.title.length);
					}
				}
			}

			if (this.config.removeStartTags === "description" || this.config.removeStartTags === "both") {
				if (this.isShowingDescription) {
					for (let startTag of this.config.startTags) {
						if (item.description.slice(0, startTag.length) === startTag) {
							item.description = item.description.slice(startTag.length, item.description.length);
						}
					}
				}
			}

			if (this.config.removeEndTags) {
				for (let endTag of this.config.endTags) {
					if (item.title.slice(-endTag.length) === endTag) {
						item.title = item.title.slice(0, -endTag.length);
					}
				}

				if (this.isShowingDescription) {
					for (let endTag of this.config.endTags) {
						if (item.description.slice(-endTag.length) === endTag) {
							item.description = item.description.slice(0, -endTag.length);
						}
					}
				}
			}
		});

		const updatedItems = [];
		newsItems.forEach((value) => {
			if (this.newsItems.findIndex((value1) => value1 === value) === -1) {
				updatedItems.push(value);
			}
		});

		if (this.config.broadcastNewsUpdates && updatedItems.length > 0) {
			this.sendNotification("NEWS_FEED_UPDATE", { items: updatedItems });
		}

		this.newsItems = newsItems;
	},

	subscribedToFeed (feedUrl) {
		for (let feed of this.config.feeds) {
			if (feed.url === feedUrl) {
				return true;
			}
		}
		return false;
	},

	titleForFeed (feedUrl) {
		for (let feed of this.config.feeds) {
			if (feed.url === feedUrl) {
				return feed.title || "";
			}
		}
		return "";
	},

	scheduleUpdateInterval () {
		this.updateDom(this.config.animationSpeed);

		this.broadcastActiveArticle(); 

		if (this.config.broadcastNewsFeeds) {
			this.sendNotification("NEWS_FEED", { items: this.newsItems });
		}

		if (this.timer) clearInterval(this.timer);

		this.timer = setInterval(() => {
			if (this.newsItems.length > 1 || this.newsItems.length !== this.activeItemCount || this.activeItemHash !== this.newsItems[0]?.hash) {
				this.activeItem++; 
				this.updateDom(this.config.animationSpeed);

				this.broadcastActiveArticle(); 
			}

			if (this.config.broadcastNewsFeeds) {
				this.sendNotification("NEWS_FEED", { items: this.newsItems });
			}
		}, this.config.updateInterval);
	},

	resetDescrOrFullArticleAndTimer () {
		this.isShowingDescription = this.config.showDescription;
		this.config.showFullArticle = false;
		this.scrollPosition = 0;
		document.getElementsByClassName("region bottom bar")[0].classList.remove("newsfeed-fullarticle");
		if (!this.timer) {
			this.scheduleUpdateInterval();
		}
	},

	notificationReceived (notification, payload, sender) {
		const before = this.activeItem;
		if (notification === "MODULE_DOM_CREATED" && this.config.hideLoading) {
			this.hide();
		} else if (notification === "ARTICLE_NEXT") {
			this.activeItem++;
			if (this.activeItem >= this.newsItems.length) {
				this.activeItem = 0;
			}
			this.resetDescrOrFullArticleAndTimer();
			Log.debug(`${this.name} - 기사 전환: #${before} -> #${this.activeItem} (총 ${this.newsItems.length}개)`);
			this.updateDom(100);
		} else if (notification === "ARTICLE_PREVIOUS") {
			this.activeItem--;
			if (this.activeItem < 0) {
				this.activeItem = this.newsItems.length - 1;
			}
			this.resetDescrOrFullArticleAndTimer();
			Log.debug(`${this.name} - 기사 전환: #${before} -> #${this.activeItem} (총 ${this.newsItems.length}개)`);
			this.updateDom(100);
		}
		else if (notification === "ARTICLE_MORE_DETAILS") {
			if (this.config.showFullArticle === true) {
				this.scrollPosition += this.config.scrollLength;
				window.scrollTo(0, this.scrollPosition);
				Log.debug(`${this.name} - 아래로 스크롤`);
			} else {
				this.showFullArticle();
			}
		} else if (notification === "ARTICLE_SCROLL_UP") {
			if (this.config.showFullArticle === true) {
				this.scrollPosition -= this.config.scrollLength;
				window.scrollTo(0, this.scrollPosition);
				Log.debug(`${this.name} - 위로 스크롤`);
			}
		} else if (notification === "ARTICLE_LESS_DETAILS") {
			this.resetDescrOrFullArticleAndTimer();
			Log.debug(`${this.name} - 기사 제목만 표시 모드로 복귀`);
			this.updateDom(100);
		} else if (notification === "ARTICLE_TOGGLE_FULL") {
			if (this.config.showFullArticle) {
				this.activeItem++;
				this.resetDescrOrFullArticleAndTimer();
			} else {
				this.showFullArticle();
			}
		} else if (notification === "ARTICLE_INFO_REQUEST") {
			this.sendNotification("ARTICLE_INFO_RESPONSE", {
				title: this.newsItems[this.activeItem].title,
				source: this.newsItems[this.activeItem].sourceTitle,
				date: this.newsItems[this.activeItem].pubdate,
				desc: this.newsItems[this.activeItem].description,
				url: this.getActiveItemURL()
			});
		}
		
		// -----------------------------------------------------------
		// [수정 완료] MMM-VoiceQR을 위한 응답 로직
		// Localhost 문제 해결: getActiveItemURL() 대신 item.url(원본) 사용
		// -----------------------------------------------------------
		else if (notification === "REQUEST_NEWS_DATA") {
			// 현재 활성 아이템 가져오기
			const item = this.newsItems[this.activeItem];
			
			// [중요] item.url을 직접 사용하여 localhost 프록시 방지
			if (item && item.url) {
				this.sendNotification("RESPONSE_NEWS_DATA", { url: item.url });
			}
		}
	},

	showFullArticle () {
		this.isShowingDescription = !this.isShowingDescription;
		this.config.showFullArticle = !this.isShowingDescription;
		if (this.config.showFullArticle === true) {
			document.getElementsByClassName("region bottom bar")[0].classList.add("newsfeed-fullarticle");
		}
		clearInterval(this.timer);
		this.timer = null;
		Log.debug(`${this.name} - ${this.isShowingDescription ? "기사 요약" : "전체 기사"} 표시`);
		this.updateDom(100);
	}
});