/*
	CONTROLLER.JS
	definition of angular controller, which controls everything related to view & control, except for:
		angular directives (see directives.js)
		canvas (see render.js)
*/

let app = angular.module('Felda', []);

app.controller('ctrl', function($scope, $interval, $timeout) {
	//current version
	$scope.version = [1, 1];

	//version history
	$scope.vHistory = [
		{name: 'v1.1',  date: '13.10.2019', desc: 'přidány zvuky!'},
		{name: 'v1.0',  date: '02.08.2019', desc: 'zcela fundamentálně přepracováno, mnoho nových funkcí i nová auta'},
		{name: 'beta+', date: '13.10.2017', desc: 'nové obrázky a drobné změny, na dlouhou dobu vývoj ustal'},
		{name: 'beta',  date: '22.09.2017', desc: 'přidána první canvas grafika a generace levelů'},
		{name: 'alpha', date: '13.08.2017', desc: 'první zveřejněná verze, zatím jen samotný fyzikální model bez grafiky'}
	];

	//footer disclaimer
	$scope.disclaimer = function() {
		let msg = ['Jiří Zbytovský je autorem pouze samotného programu, zatímco názvy vozidel, jejich vzhled i použité obrázky mohou být intelektuálním vlastnictvím jiných subjektů.',
			'Tato aplikace není provozována pro zisk, má pouze zábavní a vzdělávací účel, kdyby si však vlastníci práv přáli odstranění určitých prvků, nechť kontaktují autora.'];
		popup(msg, false, false, 620);
	};

	//hint to enable sounds
	$scope.soundTroubleshoot = function() {
		let msg = ['Pokud je zvuk zapnut v operačním systému i na reproduktorech, a přesto je auto tiché jako myš, možná je ve vašem prohlížeči zakázáno automatické spouštění zvuku.',
		'Najděte na začátku adresního řádku ikonku - po jejím rozklikutí by se měla objevit možnost povolit zvuk.'];
		popup(msg, false, false, 620);
	};

	//link global variables to $scope
	$scope.CS = CS; //S will be referenced when created
	$scope.levels = levels;
	$scope.cars = cars;
	$scope.csts = constants;
	$scope.config = config;
	$scope.tt = tooltips;
	$scope.popup = popup; //global function to $scope

	//control variables
	let ctrl = {
		optionTab: 'control', //current option section
		key2bind: false //selection of key to be binded
	};
	$scope.ctrl = ctrl;

	//switch game tab
	$scope.tab = function(tab) {
		CS.popup = false;
		CS.keyBinding = false;
		CS.tab = tab;
	};

	//escape game via cross in upper-right corner or Esc button
	$scope.escapeGame = function(button) {//'button' = whether it originated from keyboard
		//always remove tooltip
		CS.tooltip.visible = false;

		//keyboard button either closes popup, or switches tab to menu, while the graphical button switches right away
		if(button && CS.popup) {
			CS.popup = false;
		}
		else {
			$scope.tab('menu');
			S && (S.running = false);
			soundService.stopAll();
		}
	};

	//toggle in-game minimap on or off
	$scope.toggleMap = function(e) {
		CS.showMap = e;
		if(!e) {
			CS.tooltip.visible = false;
			CS.miniMapCursor.enabled = false;
		}
	};

	//getter / setter function for pedals
	$scope.getSetGas    = newVal => (typeof newVal === 'number') ? (S.gasSlider    = newVal) : S.gasSlider;
	$scope.getSetClutch = newVal => (typeof newVal === 'number') ? (S.clutchSlider = newVal) : S.clutchSlider;

	//one-time pedal inversion (when the option is changed)
	$scope.invertPedals = function() {
		if(!S) {return;}
		S.gasSlider    = 1 - S.gasSlider;
		S.clutchSlider = 1 - S.clutchSlider;
	};

	//keyPress function - call appropriate listener function or bindKey. While identifying key, event.keyCode is prefered, event.key is fallback
	$scope.keyPress = function(event, down) {
		//hardcoded escape - it is available anywhere
		if(event.keyCode === 27 || event.key === 'Escape') {keyBindFunctions.esc(down);}
		//identify keys during gameplay
		else if(S && S.running && !S.disable.keys) {
			let i = CS.keyBinds.findIndex(elem => elem[1] === event.keyCode || elem[2] === event.key);
			if(i > -1) {
				keyBindFunctions[CS.keyBinds[i][0]](down);
				event.preventDefault();
			}
		}
		//keybinding
		else if(CS.keyBinding === true && !down) {bindKey(event);}
	};

	//process onkeyup event if key is currently binded
	function bindKey(event) {
		//cancel
		if(event.keyCode === 27 || event.key === 'Escape') {
			CS.popup = false;
			CS.keyBinding = false;
			return;
		}

		//index of keybind that contains the selected key (for conflicts)
		let i = CS.keyBinds.findIndex(item => item[1] === event.keyCode || item[2] === event.key)
		//index of keybind that contains the selected function
		let j = CS.keyBinds.findIndex(item => item[0] === ctrl.key2bind.action)

		//key is unchanged, do nothing
		if(i > -1 && i === j) {
			CS.popup = false;
			CS.keyBinding = false;
		}
		//key is in conflict
		else if(i > -1) {
			let msg = 'Konflikt, stiskněte jinou klávesu.';
			(CS.popup.lines.slice(-1)[0] !== msg) && CS.popup.lines.push(msg);
		}
		//set the new key
		else {
			CS.keyBinds[j][1] = event.keyCode;
			CS.keyBinds[j][2] = event.key;
			CS.popup = false;
			CS.keyBinding = false;
			popup('OK', true, 600);
		}
	}

	//open the prompt to set a key
	$scope.setKey = function() {
		if(!ctrl.key2bind) {
			popup('Nejprve vyberte činnost k přiřazení klávesy!', false, 1200);
			return;
		}
		let opt = $scope.optsKeys.find(item => item.action === ctrl.key2bind.action); //get binding option object for current action
		let desc = opt ? opt.description : 'Žádná činnost. WTF?'; //get description of action from opt
		let keybind = CS.keyBinds.find(item => item[0] === ctrl.key2bind.action); //get current keybind for current action
		let key = keybind ? keybind[2] : 'nic'; //get key of current keybind

		popup(['Vyberte klávesu pro:', desc, `(nyní nastaveno "${key}")`], true);
		CS.keyBinding = true;
	};

	//get keybind by its action (as string)
	$scope.getKey = action => (CS.keyBinds.find(item => item[0] === action) || [])[2];

	//view key currently binded to action next to the form
	$scope.viewKey = action => ($scope.getKey(action) || 'nenastaveno').trim() || 'Mezera';

	//functions that are called by keyListeners to operate the simulation.
	//'e' = 'down' passed from $scope.keyPress()
	const keyBindFunctions = {
		esc: e => !e && $scope.escapeGame(true) ,
		map: e => $scope.toggleMap(e),
		neutral: e => !e && M.shift('N'),
		'1':     e => !e && M.shift('1'),
		'2':     e => !e && M.shift('2'),
		'3':     e => !e && M.shift('3'),
		'4':     e => !e && M.shift('4'),
		'5':     e => !e && M.shift('5'),
		'6':     e => !e && M.shift('6'),
		brake: e => (S.brakes = e),
		cu: e => (S.clutchPedalUp = e),
		cd: e => (S.clutchPedalDown = e),
		gu: e => (S.gasPedalUp = e),
		gd: e => (S.gasPedalDown = e),
		nitro: e => (S.nitro = e)
	};

	//OPTIONS TO CHOOSE FROM
	//keybinding: select text, action
	$scope.optsKeys = [
		{action: 'gu', description: 'Uvolnit plyn'},
		{action: 'gd', description: 'Stisknout plyn'},
		{action: 'cu', description: 'Uvolnit spojku'},
		{action: 'cd', description: 'Stisknout spojku'},
		{action: 'brake', description: 'Brzda'},
		{action: 'map', description: 'Mapa'}
	];

	//velocity units, acceleration units and power units
	$scope.optsVel = [units.kmh, units.ms];
	$scope.optsAcc = [units.kmhs, units.g, units.mss];
	$scope.optsPow = [units.kW, units.hp];

	//pedal operation duration: select text, duration [s]
	$scope.optsPedals = {
		'pomalá (0.7s)':  0.7,
		'střední (0.4s)': 0.4,
		'rychlá (0.2s)':  0.2
	};
	//headline in showroom contains these options
	$scope.optsShowroom = cars.map((c,i) => ({i: i, txt: `${c.name} ${c.engineName} (${c.year})`}));

	//Angular ng-style definitions. The numeric values are just placeholders, they are overwritten by resize()
	$scope.style = {
		popup: {top: '300px', left: '400px', width: '300px'},
		stats: {top: '401px'},
		advanced: {top: '542px'},
		controls: {top: '643px'}
	};

	//get available resolution
	let getScreenSize = () => ([
		window.innerWidth  || document.documentElement.clientWidth  || document.body.clientWidth,
		window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
	]);

	//resize responsive game elements
	function resize() {
		let [width, height]  = getScreenSize();

		$scope.style.popup.width = CS.popup.width + 'px';
		$scope.style.popup.top = (height/3) + 'px';
		$scope.style.popup.left = (width - CS.popup.width)/2 + 'px';

		let hAdv = 101 * (CS.enableDetails && S && !S.tutorial); // height of advanced stats
		// height of canvas: (available height) - stats - ?advanced? - controls - margin
		let hMap = height - 141 - hAdv - 241 - 10;
		hMap = CS.enableGraphics ? Math.max(200, hMap) : 40;

		let m = geto('map');
		if (m && m.width !== width - 2) {
			m.width = width - 2;
		}
		if (m && m.height !== hMap) {
			m.height = hMap;
		}

		$scope.style.stats   .top = (hMap+1) + 'px';
		$scope.style.advanced.top = (hMap+142) + 'px';
		$scope.style.controls.top = (hMap+142+hAdv) + 'px';
	}

	//check if there is enough of available resolution (and issue a warning)
	$scope.resolutionCheck = function() {
		let [width, height]  = getScreenSize();
		let txt = ['VAROVÁNÍ', 'okno je příliš malé, vzhled stránky tedy může být ošklivý a nepřehledný!'];
		let [w2small, h2small] = [width < config.minResolution[0], height < config.minResolution[1]];
		w2small && txt.push(`Šírka: ${width } (doporučeno ${config.minResolution[0]})`);
		h2small && txt.push(`Výška: ${height} (doporučeno ${config.minResolution[1]})`);

		//if too small, generate popup
		if(w2small || h2small) {
			popup(txt, false, 5000, 400);
		}
		//if big enough and the current popup is this warning, remove the warning
		else if(CS.popup && CS.popup.lines[0] === txt[0] && CS.popup.lines[1] === txt[1]) {
			CS.popup = false;
		}
	};

	//special functions to write stats
	$scope.st = {
		//get string after unit conversion from SI value 'val' and unit object 'unit'
		calculateUnit: (val, unit) => (val*unit.val).toFixed(unit.dgt) + ' ' + unit.txt,

		//fuel per 100km, avg per 100km
		kmfuel: () => (S.v > 1) ? ((S.consumption / S.v / constants.rho * 1e5).toFixed(1)) : '?',
		avgfuel: () => (S.d > 100) ? ((S.fuel / S.d / constants.rho * 1e5).toFixed(1)) : '?',

		//frequency is the only case where I have even less precision than 1
		f: () => (10 * Math.round(S.f * 60 / 10)).toFixed(),

		//efficiency, frequency difference on clutch and effective radius of wheels
		ny: () => (!isNaN(S.ny) && isFinite(S.ny) && S.starter <= 0 && Math.abs(S.ny) < 1) ? S.ny.toPercent() : '?',
		df: () => (S.df !== false) ? (Math.round(S.df * 60).toFixed() + ' RPM') : '?',
		re: () => (S.re !== false) ? ((S.re * 1000).toFixed() + ' mm') : '?',

		//converts simulation time to a nice time string
		getTime: function() {
			let f = t => (t < 10) ? ('0' + t) : t;

			let secs = Math.floor(S.t);
			let h = Math.floor(secs / 3600);
			let m = Math.floor((secs - (h * 3600)) / 60);
			let s = secs - (h * 3600) - (m * 60);

			return h + ':' + f(m) + ':' + f(s);
		}
	};

	//warnings as object, f is a logical function (whether warning is active), txt is it's content
	$scope.warnings = [
		{f: () => (S.starter > 0), txt: 'startování'},
		{f: () => (S.f > 0 && S.f < cars[S.car].engine.minRPM && S.starter <= 0), txt: 'motor chcípe'},
		{f: () => (S.f + 2 > cars[S.car].engine.maxRPM), txt: '!!! KRITICKÉ PŘETÁČENÍ MOTORU !!!'}, // 2 Hz (120 RPM) tolerance
		{f: () => (S.f > cars[S.car].engine.redlineRPM && S.f + 2 < cars[S.car].engine.maxRPM), txt: 'přetáčení motoru'},
		{f: () => (S.brakes && !S.disable.brakes), txt: 'brzda'},
		{f: () => (S.nitro && S.f > cars[S.car].engine.idleRPM), txt: 'NITRO'}
	];

	//pass index of car to directive
	$scope.enterShowroom = function(i) {
		(!CS.hasOwnProperty('showroomIndex')) && (CS.showroomIndex = 0); //compatibility
		i = (typeof i === 'number') ? i : CS.showroomIndex;
		CS.showroomIndex = i;
		$scope.tab('carShowroom');
		$scope.$broadcast('enterShowroom');
	};

	//this function is used in directives 'tooltip' and 'minimap' to fix left position, X0 is the initially planned left
	$scope.getTooltipX = function(X0) {
		let [sw, sh]  = getScreenSize();
		let ew = geto('tooltip').offsetWidth; //element width, this is vile and disgusting
		return X0.limit(5, sw-ew-5);
	};

	/*CONTROL GAME*/
	//create a new simulation
	$scope.initGame = function() {
		CS.keyBinding = false;
		if(S) {
			if(!confirm('Běžící hra bude ztracena, přesto pokračovat?')) {return;}
		}
		popup('Načítání', true);

		//create new level, which contains a promise
		S = new State(CS.levelSelect, CS.carSelect);

		//fulfill promise
		function resolve(result) {
			CS.popup = false;
			$scope.tab('game');
			$scope.S = S;

			S.level.map = result;
			S.running = true;
			M.initCalculations();
			exec(levels[CS.levelSelect].listeners.onstart);
			soundService.init();
		}
		function reject(err) {
			S = null;
			popup(['CHYBA', 'Level se nepodařilo načíst', err]);
		}
		S.level.map.then(resolve, reject);
	};

	//continue a running simulation
	$scope.continue = function() {
		if(!S) {return;}
		CS.popup = false;
		CS.keyBinding = false;
		$scope.tab('game');
		S.running = true && !S.finished;
		soundService.init();
	};

	//decrement countdowns and decide what to do
	function timeouts() {
		//timeouts for flashtexts
		CS.flashes = CS.flashes.filter(function(f) {
			f[0] -= 1000 / CS.FPS;
			return f[0] > 0;
		});

		//timeouts for popups
		if(CS.popup.hasOwnProperty('timeout')) {
			CS.popup.timeout -= 1000 / CS.FPS;
		}
		(CS.popup.timeout <= 0) && (CS.popup = false);
	}

	//execute each FPS: resize, decrement countdowns, draw game, schedule new FPS call
	function FPS() {
		resize();
		timeouts();
		(CS.tab === 'game' && S && S.firstTick && CS.enableGraphics) && R.drawCanvas();
		$timeout(FPS, Math.round(1000/CS.FPS));
	}

	//execute right away - onload of angular controller
	function onload() {
		//try loading the game
		try {
			saveService.load();
			$scope.S  = S;
			$scope.CS = CS;
		}
		catch(err) {
			alert('FATÁLNÍ CHYBA:\n(při načítání uložených dat)\nSave není kompatibilní, proto bude resetován a stránka bude obnovena.');
			saveService.clear();
		}

		//detect M$ Edge and issue a warning
		!!window.StyleMedia && popup(['Byl detekován prohlížeč Microsoft Explorer či Edge.', 'Aplikace nemusí správně fungovat, doporučuji použít Google Chrome či Mozilla Firefox.'], false, false, 400);

		$scope.resolutionCheck();

		//THE MOST IMPORTANT INTERVAL - MODEL TICK
		$interval(M.tick, config.dt*1000);

		//first call of FPS, it then calls itself with $timeout
		FPS();

		//set interval for vibration
		$interval(R.vibration, 1000/config.vibration);

		//save every second
		$interval(saveService.save, 1000);
	}

	onload();
});
