/*
	MISC.JS
	declares state objects, defines some generic functions, saveService etc.
*/

//current version
const version = [1, 3];

//state objects: S is for model (variables related to simulation), CS for view & controller
let S;
let CS = ControllerState();

//define new methods in number prototype
//return number as a percentage with 'd' digits after decimal point
Number.prototype.toPercent = function(d) {return (this.valueOf()*100).toFixed(d ? d : 0) + ' %';};
//return number confined to bounds (a = min, b = max), use NaN as unset bound
Number.prototype.limit = function(a, b) {
	let v = this.valueOf();
	if(!isNaN(a) && v < a) {return a;}
	else if(!isNaN(b) && v > b) {return b;}
	else {return v;}
};

//execute method 'f' on object 'obj' if it exists - used for level listeners where they might not exist
function exec(obj, f) {
	if(typeof obj[f] === 'function') {obj[f]();}
}

//shortcut to DOM
function geto(id) {
	return document.getElementById(id);
}

//time in [s] to h:mm:ss
function time2str(t) {
	let f = str => str.length === 1 ? '0'+str : str; //add leading zero?

	t = Math.floor(t);
	let h = Math.floor(t / 3600);
	let m = Math.floor((t - (h * 3600)) / 60);
	let s = t - (m * 60) - (h * 3600);
	[h, m, s] = [h.toFixed(), m.toFixed(), s.toFixed()];

	return (h !== '0') ? h+':'+f(m)+':'+f(s) : m+':'+f(s);
}

//saving and loading local save
const saveService = {
	save: () => !CS.hasOwnProperty('noSave') && localStorage.setItem('FeldaSimulation', JSON.stringify({S: S, CS: CS})),
	load: function() {
		let data = localStorage.getItem('FeldaSimulation');
		if(!data) {return;}
		data = JSON.parse(data);
		if(!data.CS) {return;}
		S  = data.S;
		CS = data.CS;
		if(S) {S.running = false;}
		CS.tab = 'menu';
		CS.keyBinding = false;
		CS.popup = false;
		CS.isLoadedGame = true;
	},
	clear: function() {
		CS.noSave = true;
		localStorage.removeItem('FeldaSimulation');
		location.reload();
	}
};

//  SHORTCUT FUNCTIONS FOR POPUP GENERATION - see CS.popup in userdata.js for more details on data structure
//ALERT-like with m = either string, or arrays of strings for multiline popup
//other arguments are optional: suppress OK button, set timeout to vanish [ms], width [px], button2: {label: '', callback: function}
function popup(m, noButton, timeout, width, button2) {
	CS.popup = {
		type: 'alert',
		lines: (typeof m === 'string') ? [m] : m,
		okButton: !noButton,
		width: width || 300
	};
	if(timeout) {CS.popup.timeout = timeout;}
	if(button2) {CS.popup.button2 = button2;}
}
//CONFIRM-like popup with text description, callback = function(ok) and optional width [px]
function confirm2(text, callback, width) {
	CS.popup = {
		type: 'confirm',
		text: text,
		callback: callback,
		width: width || 300
	};
}
//PROMPT-like popup with array of field objects, callback = function(array of field values) and optional width [px]
function prompt2(fields, callback, width) {
	CS.popup = {
		type: 'prompt',
		fields: fields,
		callback: callback,
		width: width || 300
	};
}

//create flash text with m string (should be just 1 || 2 chars!)
function flash(m) {
	CS.flashes.push([config.flash, m]);
}

//test availability of ECMA6 with a small sample code
function ECMA6test() {
	try {
		eval('const a=[1,2];for(let i of a){};a.map(i => i);');
	}
	catch(err) {
		alert('FATÁLNÍ CHYBA:\n(chybí podpora ECMA6 Javascriptu)\nZdá se, že používáte velmi starý webový prohlížeč, v němž aplikace nemůže fungovat!');
	}
}
ECMA6test();

//initialize a database of images & sounds
function resourcePreload() {
	//load one image
	function loadIMG(src) {
		let elem = new Image()
		elem.src = src;
		return elem;
	}

	//load all images as HTML img elements
	for(let i of Object.keys(imgs)) {
		//static image
		if(imgs[i].hasOwnProperty('img')) {
			imgs[i].img = loadIMG(imgs[i].img);
		}
		//animation
		else if(imgs[i].hasOwnProperty('frames')) {
			imgs[i].frames = imgs[i].frames.map(o => loadIMG(o));
		}
	}

	//load all sounds as array buffers (raw mp3 files)
	for(let i of Object.keys(sounds)) {
		sounds[i].buffer = null;
		let request = new XMLHttpRequest();
		request.open('GET', sounds[i].src, true);
		request.responseType = 'arraybuffer';
		request.onload = function() {
			sounds[i].buffer = request.response;
		}
		request.send();
	}
}
resourcePreload();

//zoom game
window.onwheel = function(event) {
	if(!CS || !CS.ppm || CS.tab !== 'game') {return;}
	if     (event.deltaY < 0 && CS.ppm < config.ppm_max) {CS.ppm += 5;}
	else if(event.deltaY > 0 && CS.ppm > config.ppm_min) {CS.ppm -= 5;}
};

//because there is no ngOnResize directive, I have to trigger it from outside, from a normal event listener, and then force a digest cycle
window.onresize = function() {
	let scope = angular.element(document).scope();
	scope && typeof scope.resolutionCheck === 'function' && scope.resolutionCheck();
};

//mute sounds when in background
window.onblur = function() {
	if(CS.enableBackgroundMute) {
		soundService.enableSounds = false;
		soundService.stopAll();
	}
}
//enable them again
window.onfocus = () => (soundService.enableSounds = true);

window.onerror = function(err) {
	(err.length >= 200) && (err = err.slice(0, 200) + '...');
	let msg = 'FATÁLNÍ CHYBA:\n(' + err + ')\n\nChyba by mohla být způsobena starým, nekompatibilním savem.\nPřejete si jej resetovat a obnovit stránku?';
	confirm(msg) && saveService.clear();
	window.onerror = null;
};
