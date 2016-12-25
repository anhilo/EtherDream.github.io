
var ACTIVEX = !!window.ActiveXObject;


function check3rdCookie(callback) {
	window.addEventListener('message', function(e) {
		var data = e.data;
		switch (data) {
		case 'CK:true':
			callback(true);
			break;
		case 'CK:false':
			callback(false);
			break;
		}
		e.stopImmediatePropagation();
	});

	var el = document.createElement('iframe');
	el.style.display = 'none';
	el.src = "data:text/html;,<script>parent.postMessage('CK:'+navigator.cookieEnabled,'*')</script>"
	document.body.appendChild(el);
}


function getFlashVer() {
	try {
		var ver = ACTIVEX
			? new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(',', '.')
			: navigator.plugins['Shockwave Flash'].description;
		
		return +ver.match(/\d+\.\d+/);
	}
	catch(e) {}
}


var flaID = 0;

function createSwf(url, param) {
	var box = document.createElement('box');
	var id = '__FLA_' + flaID++;

	// combine arguments
	var argstr = '';
	if (param) {
		var k, arg = [];
		for (k in param) {
			arg.push(k + "=" + escape(param[k]));
		}
		argstr = arg.join('&');
	}

	url = encodeURI(url);


	box.innerHTML = ACTIVEX ?
		'<object id=' + id + ' classid=clsid:D27CDB6E-AE6D-11cf-96B8-444553540000><param name=movie value=' + url + '><param name=flashvars value=' + argstr + '><param name=allowScriptAccess value=always></object>' :
		'<embed id=' + id + ' name=' + id + ' src=' + url + ' flashvars=' + argstr + ' allowScriptAccess=always></embed>';

	var swf = box.firstChild;
	// swf.style.cssText = 'position:absolute;top:-999px';
	document.body.appendChild(swf);
	return swf;
}


function TRY(fn) {
	return function() {
		try {
			return fn.apply(this, arguments);
		} catch (err) {
			console.error(err);
		}
	};
}


var fileterMap = {};

function addFilter(src, dst) {
	fileterMap[src] = dst;
}

function delFilter(src) {
	delete fileterMap[src];
}

var _raw = String.prototype.replace;

String.prototype.replace = function F(a, b, c) {
	if (b === '&amp;' && F.caller === window.__flash__escapeXML) {
		if (this in fileterMap) {
			var ret = fileterMap[this];
			// console.log('filter `%s` to `%s`', this + '', ret);
			return ret;
		}
	}
	return _raw.apply(this, arguments);
};
