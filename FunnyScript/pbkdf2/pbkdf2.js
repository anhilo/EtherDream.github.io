/** @const */
var _DEBUG = (typeof _RELEASE == 'undefined');
var URL_FLASH = 'flascc.swf';
var URL_ASM_TINY = 'worker-asmjs-tiny.js';
var URL_ASM_FULL = 'worker-asmjs-full.js';
///<reference path="Const.ts"/>
var AsmJs;
(function (AsmJs) {
    var mWorkerUsed = [];
    var mWorkerFree = [];
    var mScriptUrl = URL_ASM_TINY;
    var mInited;
    function Check() {
        if (window['Worker']) {
            AsmJs.OnCheck(true);
        }
        else {
            AsmJs.OnCheck(false);
        }
    }
    AsmJs.Check = Check;
    function Load() {
        if (/Firefox/.test(navigator.userAgent)) {
            mScriptUrl = URL_ASM_FULL;
        }
        var x = [120];
        run(x, x, 2);
    }
    AsmJs.Load = Load;
    function Hash(pass, salt, iter) {
        var passBytes = Util.StrToBytes(pass);
        var saltBytes = Util.StrToBytes(salt);
        return run(passBytes, saltBytes, iter);
    }
    AsmJs.Hash = Hash;
    function Stop(id) {
        mWorkerUsed[id].terminate();
        mWorkerUsed[id] = null;
    }
    AsmJs.Stop = Stop;
    function run(passBytes, saltBytes, iter) {
        var w = mWorkerFree.pop();
        if (!w) {
            // 无空闲线程，创建一个新的
            w = new Worker(mScriptUrl);
            w.addEventListener('message', onMessage);
        }
        var id = mWorkerUsed.length;
        mWorkerUsed[id] = w;
        w.postMessage({ passBytes: passBytes, saltBytes: saltBytes, iter: iter, id: id });
        return id;
    }
    function verify(arr) {
        // 数据校验
        if (arr && arr.length == 32 && arr[0] == 0x98) {
            AsmJs.OnLoad(true);
        }
        else {
            AsmJs.OnLoad(false);
        }
    }
    function onMessage(e) {
        var w = e.target;
        var msg = e.data;
        var id = msg.id;
        switch (msg.type) {
            case 'done':
                mWorkerFree.push(w);
                mWorkerUsed[id] = null;
                if (!mInited) {
                    mInited = true;
                    verify(msg.result);
                    return;
                }
                var dk = Util.BytesToHex(msg.result);
                AsmJs.OnComplete(id, dk);
                break;
        }
    }
})(AsmJs || (AsmJs = {}));
///<reference path="Const.ts"/>
var FlasCC;
(function (FlasCC) {
    var ACTIVEX = 'ActiveXObject' in window;
    var mSwf;
    function Check() {
        FlasCC.OnCheck(getVer() > 10);
    }
    FlasCC.Check = Check;
    function Load() {
        window['__flash_callback'] = flashCallback;
        mSwf = createSwf(URL_FLASH);
    }
    FlasCC.Load = Load;
    function Hash(pass, salt, iter) {
        return mSwf.run(pass, salt, iter);
    }
    FlasCC.Hash = Hash;
    function Stop(id) {
        mSwf.cancel(id);
    }
    FlasCC.Stop = Stop;
    function flashCallback(msg, id, data) {
        switch (msg) {
            case 'ready':
                // flash 的回调位于错误捕获中，容易导致 BUG 被掩盖
                // 因此用 setTimeout 避开错误捕获
                Util.NextTick(function () {
                    FlasCC.OnLoad(true);
                });
                break;
            case 'done':
                Util.NextTick(function () {
                    FlasCC.OnComplete(id, data);
                });
                break;
        }
    }
    function createSwf(url) {
        var box = document.createElement('box');
        var id = '__fla_pbkdf2__';
        url = encodeURI(url);
        box.innerHTML = ACTIVEX ?
            "<object id=" + id + " classid=clsid:D27CDB6E-AE6D-11cf-96B8-444553540000><param name=movie value=" + url + "><param name=allowScriptAccess value=always></object>" :
            "<embed id=" + id + " name=" + id + " src=" + url + " type=application/x-shockwave-flash allowScriptAccess=always></embed>";
        var swf = box.firstChild;
        swf.style.cssText = 'position:absolute;top:-999px';
        document.body.appendChild(swf);
        return swf;
    }
    function getVer() {
        try {
            var ver = ACTIVEX
                ? new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(',', '.')
                : navigator.plugins['Shockwave Flash'].description;
            return +ver.match(/\d+\.\d+/);
        }
        catch (e) {
            return 0;
        }
    }
})(FlasCC || (FlasCC = {}));
var WebCrypt;
(function (WebCrypt) {
    var S = window.crypto && crypto.subtle;
    var mCounter = 0;
    function Check() {
        if (!S) {
            WebCrypt.OnCheck(false);
            return;
        }
        //
        // input:
        //     pass="x", salt="x", iter=2
        // expect:
        //     98433e88d2f86731aa806482a8d596716e26d572877a43b9f79a550f5d9c26c9
        //
        var x = new Uint8Array([120]); // 'x'
        pbkdf2(x, x, 2)
            .then(function (dk) {
            if (dk.length >= 32 && dk[0] == 0x98) {
                WebCrypt.OnCheck(true);
            }
            else {
                WebCrypt.OnCheck(false);
            }
        })['catch'](function (e) {
            WebCrypt.OnCheck(false);
        });
    }
    WebCrypt.Check = Check;
    function Load() {
        WebCrypt.OnLoad(true);
    }
    WebCrypt.Load = Load;
    function Hash(pass, salt, iter) {
        var id = mCounter++;
        var passBytes = Util.StrToBytes(pass);
        var saltBytes = Util.StrToBytes(salt);
        pbkdf2(passBytes, saltBytes, iter)
            .then(function (bytes) {
            var dk = Util.BytesToHex(bytes);
            Util.NextTick(function () {
                WebCrypt.OnComplete(id, dk);
            });
        });
        return id;
    }
    WebCrypt.Hash = Hash;
    function Stop(id) {
    }
    WebCrypt.Stop = Stop;
    function pbkdf2(pass, salt, iter) {
        var algo = {
            'name': 'PBKDF2',
            'hash': 'SHA-256',
            'salt': salt,
            'iterations': iter
        };
        var type = {
            name: 'AES-CBC',
            length: 256
        };
        return S.importKey('raw', pass, algo, true, ['deriveKey'])
            .then(function (key) { return S.deriveKey(algo, key, type, true, ['encrypt']); })
            .then(function (webKey) { return S.exportKey('raw', webKey); })
            .then(function (buf) {
            var u8 = new Uint8Array(buf);
            return u8;
        });
    }
})(WebCrypt || (WebCrypt = {}));
///<reference path="Const.ts"/>
///<reference path="WebCrypt.ts"/>
///<reference path="AsmJs.ts"/>
///<reference path="FlasCC.ts"/>
var PBKDF2;
(function (PBKDF2) {
    var FACTORY = {
        'asmjs': AsmJs,
        'webcrypt': WebCrypt,
        'flascc': FlasCC
    };
    ;
    var mModStatMap = {};
    var mMod;
    var mModName;
    var mIniting;
    function Init(name) {
        // 自动选择最合适的模块
        // if (!name) {
        //     name = 'AsmJs';
        // }
        mModName = name;
        // 如果之前已加载过，则立即返回
        switch (mModStatMap[name]) {
            case 2 /* INITING */:
                return;
            case 1 /* UNSUPPORTED */:
            case 3 /* UNUSABLE */:
                PBKDF2.OnInit(false);
                return;
            case 4 /* READY */:
                PBKDF2.OnInit(true);
                return;
        }
        // 禁止同时初始化多个模块
        if (mIniting) {
            return;
        }
        mIniting = false;
        mMod = FACTORY[name];
        if (!mMod) {
            throw new Error('unknown api: ' + name);
        }
        mMod.OnCheck = checkHandler;
        mMod.Check();
    }
    PBKDF2.Init = Init;
    function Hash(pass, salt, iter) {
        checkReady();
        return mMod.Hash(pass, salt, iter);
    }
    PBKDF2.Hash = Hash;
    function Stop(id) {
        checkReady();
        mMod.Stop(id);
    }
    PBKDF2.Stop = Stop;
    function checkReady() {
        if (mModStatMap[mModName] != 4 /* READY */) {
            throw new Error('not ready');
        }
    }
    function setModState(state) {
        mModStatMap[mModName] = state;
    }
    function checkHandler(support) {
        if (!support) {
            setModState(1 /* UNSUPPORTED */);
            mIniting = false;
            PBKDF2.OnInit(false);
            return;
        }
        setModState(2 /* INITING */);
        mMod.OnLoad = loadHandler;
        mMod.Load();
    }
    function loadHandler(success) {
        mIniting = false;
        if (!success) {
            setModState(3 /* UNUSABLE */);
            PBKDF2.OnInit(false);
            return;
        }
        setModState(4 /* READY */);
        PBKDF2.OnInit(true);
        mMod.OnComplete = completeHandler;
    }
    function completeHandler(id, dk) {
        PBKDF2.OnComplete(id, dk);
    }
    window['PBKDF2'] = PBKDF2;
})(PBKDF2 || (PBKDF2 = {}));
var Util;
(function (Util) {
    function BytesToHex(arr) {
        var str = '';
        for (var i = 0; i < arr.length; i++) {
            var v = arr[i];
            var s = v.toString(16);
            if (v < 16) {
                s = '0' + s;
            }
            str += s;
        }
        return str;
    }
    Util.BytesToHex = BytesToHex;
    // let mContainer: Node;
    // export function AddElem(el: Node) {
    //     if (!mContainer) {
    //         mContainer = document.createElement('div');
    //         document.body.appendChild(mContainer);
    //     }
    //     mContainer.appendChild(el);
    // }
    // export function LoadScript(url: string, callback: Function) {
    //     let spt = document.createElement('script');
    //     spt.onerror = function() {
    //         callback(true);
    //     };
    //     spt.src = url;
    //     document.head.appendChild(spt);
    //     AddElem(spt);
    // }
    function NextTick(fn) {
        setTimeout(fn, 0);
    }
    Util.NextTick = NextTick;
    var TextEncoder = window['TextEncoder'];
    function StrToBytes(str) {
        if (TextEncoder) {
            var te = new TextEncoder();
            return te.encode(str);
        }
        var buf = [], i = 0, j = 0, s = encodeURI(str), n = s.length;
        while (i < n) {
            var ch = s.charCodeAt(i);
            if (ch == 37) {
                var hex = s.substr(i + 1, 2);
                ch = parseInt(hex, 16);
                i += 3;
            }
            else {
                i++;
            }
            buf[j++] = ch;
        }
        return new Uint8Array(buf);
    }
    Util.StrToBytes = StrToBytes;
})(Util || (Util = {}));
