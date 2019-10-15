/*
	MISC.JS
	declares state objects, defines some generic functions, saveService etc.
*/

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

//execute function if it exists, used for level listeners where the functions might not exist
function exec(f) {
	if(typeof f === 'function') {f();}
}

//shortcut to DOM
function geto(id) {
	return document.getElementById(id);
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
		CS.isLoadedGame = true;
	},
	clear: function() {
		CS.noSave = true;
		localStorage.removeItem('FeldaSimulation');
		location.reload();
	}
};


//create popup by feeding m = string or arrays of strings (multiline popup).
//other arguments are optional: suppress OK button, set timeout to vanish [ms], width [px]
function popup(m, noButton, timeout, width) {
	CS.popup = {
		lines: (typeof m === 'string') ? [m] : m,
		okButton: !noButton,
		width: width || 300
	};
	if(timeout) {CS.popup.timeout = timeout;}
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
		sounds[i].source = null;
		sounds[i].gainNode = null;
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
	angular.element(document).scope().resolutionCheck();
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
