var request = require('request');

var timeswired = (function () {

	var pollTiming = 10000,
		pollInterval = null,
		populateTiming = 2000,
		populateInterval = null;

	var apiKey = '',
		apiCall = '';

	var offset = 0;

	var store = {};

	var setApiKey = function (key) {

		apiKey = key;
		apiCall = 'http://api.nytimes.com/svc/news/v3/content/all/all.json?limit=100&api-key=' + apiKey + '&offset=';

		return timeswired;
	};

	var start = function () {

		populate();

		if (pollInterval === null) {
			pollInterval = setInterval(poll, pollTiming);
			return true;
		}
		return false;
	};

	var stop = function () {
		clearInterval(pollInterval);
		pollInterval = null;
	};

	var poll = function () {

		request({
			url: apiCall,
			json: true,
			timeout: 3000
		}, function (err, response, data) {

			if (err || !data) {
				console.error(err);
				return;
			}

			var articles = data.results;
			if (articles && articles.length) {
				for (var i = 0, l = articles.length; i < l; i ++) {
					timeswired.put(articles[i]);
				}
			} else {
			}
		});

	};

	var populate = function () {

		if (timeswired.report().count > 1000) {
			return true;
		}

		offset = timeswired.report().count;

		request({
			url: apiCall + offset,
			json: true,
			timeout: 3000
		}, function (err, response, data) {

			if (err || ! data) {
				console.error(err);
				return;
			}

			var articles = data.results;

			if (articles && articles.length) {

				for (var i = 0, l = articles.length; i < l; i ++) {
					timeswired.put(articles[i]);
				}

				offset += articles.length;

			}

		});

		setTimeout(timeswired.populate, populateTiming);


	};

	var get = function (url) {
		if (typeof store[url] === 'undefined') {
			return false;
		}
		return store[url];
	};

	var put = function (article, key) {

		if (! key) {
			key = article.url;
		}
		store[key] = article;

	};

	var report = function () {

		var url, contents = [], count = 0,
			first, last,
			types = {};

		for (url in store) {

			if (! first || store[url].updated_date < first) {
				first = store[url].updated_date;
			}

			if (! types[store[url].item_type]) {
				types[store[url].item_type] = 0;
			}

			types[store[url].item_type]++;

			contents.push(url);
			count++;

		}

		return {
			count: count,
			first: first,
			types: types
		};

	};

	return {
		start: start,
		stop: stop,
		get: get,
		put: put,
		report: report,
		populate: populate,
		setApiKey: setApiKey
	};

}());

module.exports = timeswired;