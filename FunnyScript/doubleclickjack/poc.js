const mediaDevices = navigator.mediaDevices;

var supportAudio;
var supportVideo;
var pending;


function saveEnabledStatus(v) {
	localStorage.stat = v;
}

function readEnabledStatus() {
	return +localStorage.stat;
}


function requestMedia(timeout) {
	if (pending) {
		return;
	}
	pending = true;

	var param = {
		audio: true,
		video: true
	};

	if (timeout) {
		setTimeout(_ => {
			if (!pending) {
				return;
			}
			saveEnabledStatus(0);
			// x.reject();
			location.reload();
		}, timeout);
	}

	var x = mediaDevices.getUserMedia(param)
	.then(stream => {
		saveEnabledStatus(1);
		pending = false;
		console.log(stream);

		video.src = URL.createObjectURL(stream);
		btn.hidden = true;

	})
	.catch(err => {
		saveEnabledStatus(0);
		pending = false;
		console.warn(err);
	})
}


function clickHandler() {
	requestMedia();
}


function getChromeUI() {
	var barH = outerHeight - innerHeight;
	var hasBookmarkBar;
	/**
	  平台          书签关闭   书签开启
	  osx           74       97
	  win7 最大化    66       90
	  win7 普通      86       110
	  ...
	 */
	if (barH >= 90 && barH < 120) {
		hasBookmarkBar = true;
	}

	var rect = {x:310, y:70, w:70, h:26};

	if (hasBookmarkBar) {
		rect.y -= 20;
	}
	return rect
}


function getFireFoxUI() {

}


function getUI() {
	var ua = navigator.userAgent;
	if (/Chrome/.test(ua)) {
		return getChromeUI();
	}
	if (/Firefox/.test(ua)) {
		return getFireFoxUI();
	}
	
	// ..
}

function initUI() {
	// test
	var lastEnabled = readEnabledStatus();
	if (lastEnabled) {
		requestMedia(100);
		return;
	}


	var ui = getUI();
	if (!ui) {
		alert('当前浏览器不支持');
		return;
	}

	btn.style.cssText =
		'left:' + (ui.x + 200) + 'px;' + 
		'top:' + (ui.y + 200) + 'px;' + 
		'width:' + ui.w + 'px;' + 
		'height:' + ui.h + 'px';

	// btn.onclick = clickHandler;
	document.onclick = clickHandler;
	btn.hidden = false;
}


function deviceCheck() {
	return mediaDevices.enumerateDevices().then(devs => {
		devs.forEach(dev => {
			switch (dev.kind) {
			case 'audioinput':
				supportAudio = true;
				break;
			case 'videoinput':
				supportVideo = true;
				break;
			}
		});
	});
}

function main() {
	if (!mediaDevices) {
		alert('浏览器版本过低');
		return;
	}
	deviceCheck().then(_ => {
		if (supportAudio || supportVideo) {
			initUI();
		} else {
			alert('无可用设备');
		}
	});
}

main();
