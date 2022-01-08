/*
	CONTROLLER.JS
	definition of angular controller, which controls everything related to view & control, except for:
		angular directives (see directives.js)
		canvas (see render.js)
*/

let app = angular.module('Felda', []);

app.controller('ctrl', function($scope, $interval, $timeout) {
/*INFORMATION*/
	//version history
	$scope.vHistory = [
		{name: 'v1.3',  date: '30.12.2019', desc: 'přidána Reálná mapa (vytvořil Pavel Zbytovský)'},
		{name: 'v1.2',  date: '20.12.2019', desc: 'přidány nové levely - nové výzvy!'},
		{name: 'v1.1',  date: '13.10.2019', desc: 'přidány zvuky!'},
		{name: 'v1.0',  date: '02.08.2019', desc: 'zcela fundamentálně přepracováno, mnoho nových funkcí i nová auta'},
		{name: 'beta+', date: '13.10.2017', desc: 'nové obrázky a drobné změny, na dlouhou dobu vývoj ustal'},
		{name: 'beta',  date: '22.09.2017', desc: 'přidána první canvas grafika a generace levelů'},
		{name: 'alpha', date: '13.08.2017', desc: 'první zveřejněná verze, zatím jen samotný fyzikální model bez grafiky'}
	];

	//delete all userdata if not compatible with current version
	function versionCompatibility() {
		const v2number = v => v[0]*1e3 + v[1];
		const vLast = [1, 3]; //last supported version of userdata
		if(CS && (!CS.version || v2number(CS.version) < v2number(vLast))) {saveService.clear();}
	}

	$scope.credits = () => (CS.popup = {type: 'credits', width: 640}); //footer disclaimer
	//hint to enable sounds
	$scope.soundTroubleshoot = () => popup([
			'Pokud je zvuk zapnut v operačním systému i na reproduktorech, a přesto je auto tiché jako myš, možná je ve vašem prohlížeči zakázáno automatické spouštění zvuku.',
			'Najděte na začátku adresního řádku ikonku - po jejím rozklikutí by se měla objevit možnost povolit zvuk.'
		], false, false, 620);

	//hint to unlock easter egg
	$scope.easterEgg = () => popup('Pro odemknutí tohoto skvostu vyhrajte Need 4 Natural 95, Nebezpečnou rychlost a Drag (alespoň na "B")', false, false, 430);


/*CORE FUNCTIONALITY*/
	//link global variables to $scope
	$scope.CS = CS; //S will be referenced when created
	$scope.levels = levels;
	$scope.cars = cars;
	$scope.csts = constants;
	$scope.config = config;
	$scope.tt = tooltips;
	$scope.popup = popup; //global function to $scope
	$scope.version = version;

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
		CS.carSelect = CS.levelSelect = false;
		CS.tab = tab;
	};

	//escape game via cross in upper-right corner or Esc button
	$scope.escapeGame = function(button) {
		CS.tooltip.visible = false;
		$scope.tab('menu');
		S && (S.running = false);
		soundService.stopAll();
	};

	//progress through new game selection
	$scope.chooseLevel = function(i) {
		CS.levelSelect = i;
		if(levels[i].hasOwnProperty('compulsoryCar')) {
			CS.carSelect = levels[i].compulsoryCar;
			$scope.initGame();
		}
	}
	$scope.chooseCar = function(i) {
		CS.carSelect = i;
		$scope.initGame();
	};

	//reset all userdata
	$scope.hardReset = function() {
		confirm2('Opravdu smazat data?', ok => ok && saveService.clear());
	};

	//toggle in-game minimap on or off
	$scope.toggleMap = function(e) {
		CS.showMap = e;
		!e && (CS.tooltip.visible = CS.miniMapCursor.enabled = false);
	};

	//pass index of car to directive
	$scope.enterShowroom = function(i) {
		i = (typeof i === 'number') ? i : CS.showroomIndex;
		CS.showroomIndex = i;
		$scope.tab('carShowroom');
		$scope.$broadcast('enterShowroom');
	};

	//when buttons are clicked on prompt & confirm
	$scope.sendPrompt = () => CS.popup.callback(CS.popup.fields.map(f => f.value));
	$scope.sendConfirm = ok => {
		let cb = CS.popup.callback;
		CS.popup = false;
		cb(ok);
	};

	//get name of parent level of a sublevel
	$scope.getSublevelParent = sub => levels.find(item => item.id === sub).name;

	//is unlocked car with index i?
	$scope.isCarUnlocked = i => cars[i].id !== 'cow' || CS.secretUnlock;

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
		const enter = event.keyCode === 13 || event.key === 'Enter';
		const esc   = event.keyCode === 27 || event.key === 'Escape';

		//do popups FIRST - while active, they snatch away enter & esc
		if(!down && CS.popup && (enter || esc)) {
			if(CS.popup.type === 'confirm') {
				enter && $scope.sendConfirm(true);
				esc   && $scope.sendConfirm(false);
			}
			else if(CS.popup.type === 'prompt') {
				enter && $scope.sendPrompt();
			}
			else {CS.popup = false;}
			esc && (CS.keyBinding = false); //cancel keybinding
		}
		//escape button anywhere (but not during popup)
		else if(!down && esc) {$scope.escapeGame();}
		//enter button during 'newgame' tab (go with the choices from the running game)
		else if(!down && enter && CS.tab === 'newgame' && S) {
			if(CS.levelSelect === false) {$scope.chooseLevel(S.level.i);}
			else if(CS.carSelect === false) {$scope.chooseCar(S.car);}
		}
		//MOST IMPORTANT - identify keys during gameplay
		else if(S && S.running && !S.disable.keys) {
			let i = CS.keyBinds.findIndex(elem => elem[1] === event.keyCode || elem[2] === event.key);
			if(i > -1) {
				keyBindFunctions[CS.keyBinds[i][0]](down);
				event.preventDefault();
			}
		}
		//keybinding
		else if(!down && CS.keyBinding === true) {bindKey(event);}
	};

	//process onkeyup event if key is currently binded
	function bindKey(event) {
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
			popup('Nejprve vyberte vlevo k čemu přirazovat klávesu!', false, 1500);
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
	const largeKey = str => str.length === 1 ? str.toUpperCase() : str;
	$scope.viewKey = action => largeKey($scope.getKey(action) || 'nenastaveno').trim() || 'Mezera';

	//functions that are called by keyListeners to operate the simulation.
	//'e' = 'down' passed from $scope.keyPress()
	const keyBindFunctions = {
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
		nitro: e => (S.nitro = (e && !S.disable.nitro))
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


/*STYLE AND APPERANCE*/
	//Angular ng-style definitions. The numeric values are just placeholders, they are overwritten by resize()
	$scope.style = {
		popup: {top: '300px', left: '400px', width: '300px', display: 'block'},
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

		let pw = CS.popup.width || 300;
		$scope.style.popup.width = pw + 'px';
		$scope.style.popup.top = (height/3) + 'px';
		$scope.style.popup.left = (width - pw)/2 + 'px';

		let hAdv = 101 * (CS.enableDetails && S && !S.tutorial); //height of advanced stats
		//height of canvas: (available height) - stats - ?advanced? - controls - margin
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
		if(CS.noResizePopup) {return;}
		let [width, height]  = getScreenSize();
		let txt = ['VAROVÁNÍ', 'okno je příliš malé, vzhled stránky tedy může být ošklivý a nepřehledný!'];
		let [w2small, h2small] = [width < config.minResolution[0], height < config.minResolution[1]];
		w2small && txt.push(`Šírka: ${width } (doporučeno ${config.minResolution[0]})`);
		h2small && txt.push(`Výška: ${height} (doporučeno ${config.minResolution[1]})`);

		//if too small, generate popup
		if(w2small || h2small) {
			let button2 = {label: 'Příště nezobrazovat', callback: function() {CS.popup = false; CS.noResizePopup = true;}};
			popup(txt, false, 5000, 400, button2);
		}
		//if big enough and the current popup is this warning (LOL!), remove the warning
		else if(CS.popup && CS.popup.type === 'alert' && CS.popup.lines[0] === txt[0] && CS.popup.lines[1] === txt[1]) {
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
		eta:() => (!isNaN(S.eta) && S.eta !== null && isFinite(S.eta) && S.starter <= 0 && S.eta >= 0 && S.eta < 1) ? S.eta.toPercent() : '?',
		df: () => (S.df !== false) ? (Math.round(S.df * 60).toFixed() + ' RPM') : '?',
		re: () => (S.re !== false) ? ((S.re * 1000).toFixed() + ' mm') : '?',

		//converts simulation time to a nice time string
		getTime: () => time2str(S.t)
	};

	//warnings as object, f is a logical function (whether warning is active), txt is its content
	$scope.warnings = [
		{f: () => (S.starter > 0), txt: 'startování'},
		{f: () => (S.f > 0 && S.f < cars[S.car].engine.minRPM && S.starter <= 0), txt: 'motor chcípe'},
		{f: () => (S.f + 2 > cars[S.car].engine.maxRPM), txt: '!!! KRITICKÉ PŘETÁČENÍ MOTORU !!!'}, // 2 Hz (120 RPM) tolerance
		{f: () => (S.f > cars[S.car].engine.redlineRPM && S.f + 2 < cars[S.car].engine.maxRPM), txt: 'přetáčení motoru'},
		{f: () => (S.brakes && !S.disable.brakes), txt: 'brzda'},
		{f: () => (S.nitro && S.f > cars[S.car].engine.idleRPM), txt: 'NITRO'}
	];

	//this function is used in directives 'tooltip' and 'minimap' to fix left position, X0 is the initially planned left
	$scope.getTooltipX = function(X0) {
		let [sw, sh]  = getScreenSize();
		let ew = geto('tooltip').offsetWidth; //element width, this is vile and disgusting
		return X0.limit(5, sw-ew-5);
	};


/*LEAFLET MAP*/
	//container for leaflet objects
	const leaflet = {};

	//initialize or update realworld map leaflet, arg 'isNewGame' = newGame or continue
	function leafletMapInit(isNewGame) {
		if(S.level.id !== 'realworld') {return;}
		if(S.distMap) {S.level.distMap = S.distMap;} //just a compatibility fix...

		//create marker and route
		function createAccesories() {
			leaflet.marker = L.marker([50, 14]).addTo(leaflet.map);
			leaflet.geoJSON = L.geoJSON(S.level.rawData).addTo(leaflet.map);
		}

		//(newgame || continue) && leaflet not initialized: create everything
		if(!leaflet.map) {
			//prepare map layers
			const opts = {maxZoom: 17, attribution: '<a href="https://osm.org/copyright">OSM.org</a>, <a href="https://opentopomap.org/">opentopo</a>, <a href="http://www.mtbmap.cz">mtbmap.cz</a>'};
			const map1 = L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', opts);
			const map2 = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', opts);
			const map3 = L.tileLayer("http://tile.mtbmap.cz/mtbmap_tiles/{z}/{x}/{y}.png", opts);
			/*
			alternative options for map3: {maxZoom: 18, attribution: '', code: 'm', basic: true }
			//painted map, looks interesting but not particularly useful
			const map4 = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
			{maxZoom: 16, attribution: '&copy; CC-BY-SA <a href="https://openstreetmap.org/copyright">OSM</a>, imagery <a href="http://maps.stamen.com">Stamen Design</a>'});
			*/

			//init map, marker and route
			leaflet.map = L.map('leafletMap', {layers: [map1]});
			L.control.layers({'Standardní': map1, 'Alternativní': map2, 'Turistická': map3}).addTo(leaflet.map);
			createAccesories();

			//timestamp of last map dragging (in order to freeze map updating)
			leaflet.timestamp = 0;
			leaflet.map.on('dragstart', e => (leaflet.timestamp = Infinity));
			leaflet.map.on('dragend',   e => (leaflet.timestamp = Date.now()));
		}
		//newgame && leaflet initialized: only recreate marker and route
		else if(isNewGame) {
			leaflet.marker && leaflet.marker.remove();
			leaflet.geoJSON && leaflet.geoJSON.remove();
			createAccesories();
		}
		//else: continue && leaflet initialized: don't do anything
	}

	//update map marker and map view
	function updateLeafletMap() {
		//longest if in the entire project!
		if(
			S && S.level.id === 'realworld' && CS.tab === 'game' &&
			S.level.distMap && leaflet.map && leaflet.marker &&
			Date.now() - leaflet.timestamp > config.leafletFreeze
		) {
			const distMap = S.level.distMap;
			let j = 0;
			while (distMap[j][0] <= S.d) j++; // find closest bigger data point
			const lnglat = interpolateTwoCoords(S.d, distMap[j-1], distMap[j]);
			const latlng = [lnglat[1], lnglat[0]];
			leaflet.map.setView(latlng, leaflet.map.getZoom() || 16);
			leaflet.marker.setLatLng(latlng).update();
		}
		$timeout(() => updateLeafletMap(), config.dtLeafletMap);
	}

	//interpolate two coordinates, where d = wanted distance, p1 & p2 = [distance mark, [longtitude, latitude, altitude]]
	//returns [longtitude, latitude]
	function interpolateTwoCoords(d, p1, p2) {
		const dist1 = p1[0];
		const dist2 = p2[0];
		const distRelativeToP1 = d - p1[0];
		const intervalLength = dist2 - dist1;
		const ratio = distRelativeToP1 / intervalLength;
		const coords1 = p1[1], coords2 = p2[1];
		const interpolateOneCoord = (i) => coords1[i] + ratio * (coords2[i] - coords1[i]);
		return [interpolateOneCoord(0), interpolateOneCoord(1)];
	}

	//ng-style of map leaflet
	$scope.leafletStyle = () => ({display: (S && S.level.id === 'realworld' && CS.tab === 'game') ? 'block' : 'none'});

	//try to process leaflet.js error report into a friendlier string
	function generateLeafletError(err) {
		const errMessages = {
			2004: 'Příliš vzdálené cíle (musí být blíže než 6000 km)',
			2009: 'Nenalezena trasa mezi zadanými cíli'
		};
		if(typeof err !== 'object' || !err.message) {return err;}
		let obj = JSON.parse(err.message);
		if(!obj.error || !obj.error.code || !errMessages[obj.error.code]) {return err;}
		return errMessages[obj.error.code];
	}


/*CONTROL GAME*/
	//create a new simulation
	$scope.initGame = function() {
		CS.keyBinding = false; CS.popup = false;

		//ask to init or init right away
		if(S) {confirm2('Běžící hra bude ztracena, přesto pokračovat?', ok => ok ? initGame2() : (CS.levelSelect = CS.carSelect = false));}
		else{initGame2();}

		//actually init the game, this time for real
		function initGame2() {
			//create new level, level data will be filled later via a promise
			S = new State(CS.levelSelect, CS.carSelect);

			//fulfill promise
			function resolve() {
				CS.popup = false;
				$scope.tab('game');
				$scope.S = S;

				S.running = true;
				CS.invertedPedals && $scope.invertPedals();
				M.initCalculations();
				soundService.init();
				leafletMapInit(true);
			}
			function reject(err) {
				$scope.S = S = null;
				err = generateLeafletError(err);
				popup(['CHYBA', 'Level se nepodařilo načíst', err], false, false, 600);
			}

			//create promise
			LVL.levelGeneration(S.level.i).then(resolve, reject);
		}
	};

	//continue a running simulation
	$scope.continue = function() {
		if(!S) {return;}
		CS.popup = false;
		CS.keyBinding = false;
		$scope.tab('game');
		S.running = true && !S.finished;
		soundService.init();
		leafletMapInit(false);
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

		versionCompatibility();

		//detect M$ Edge and issue a warning
		!!window.StyleMedia && popup(['Byl detekován prohlížeč Microsoft Explorer.', 'Aplikace nemusí správně fungovat, doporučuji použít Google Chrome, Mozilla Firefox či Microsoft Edge.'], false, false, 400);

		$scope.resolutionCheck();

		//THE MOST IMPORTANT INTERVAL - MODEL TICK
		$interval(M.tick, config.dt*1000);

		//first call of FPS, it then calls itself with $timeout
		FPS();

		//first call of update leaflet map (also $timeout)
		updateLeafletMap();

		//set interval for vibration
		$interval(M.vibration, 1000/config.vibration);

		//save every second
		$interval(saveService.save, 1000);
	}

	onload();
});
