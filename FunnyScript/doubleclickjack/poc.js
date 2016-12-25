const mediaDevices = navigator.mediaDevices;

var supportAudio;
var supportVideo;


function clickHandler() {
	var param = {
		audio: true,
		video: true
	};
	mediaDevices.getUserMedia(param)
		.then(stream => {
			console.log(stream);
			video.src = URL.createObjectURL(stream);
			btn.hidden = true;
		})
		.catch(err => {
			console.warn(err);
		})
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

function getUI() {
	var ua = navigator.userAgent;
	if (/Chrome/.test(ua)) {
		return getChromeUI();
	}
	// ..
}

function initUI() {
	var ui = getUI();
	if (!ui) {
		alert('当前浏览器不支持');
		return;
	}

	btn.style.cssText =
		'left:' + ui.x + 'px;' + 
		'top:' + ui.y + 'px;' + 
		'width:' + ui.w + 'px;' + 
		'height:' + ui.h + 'px';

	btn.onclick = clickHandler;
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
		alert('浏览器不支持');
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
