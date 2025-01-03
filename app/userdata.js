/*
	USERDATA.JS
	defines factories for state objects
*/

//S = STATE OBJECT
//everything related to the simulation itself
//not all properties are defined here, some are defined later in model functions. These are the most important!
//arguments: i = levelIndex, c = carIndex
function State(i, c) {return {
	running: false, //to pause simulation
	finished: false, //when the whole level length is travelled

	//level object
	level: {
		i: i, //index of current level
		id: levels[i].id, //id of current level
		//see levels definitions in data.js
		int: levels[i].generation.int,
		length: levels[i].generation.length,
		minimapScale: levels[i].generation.minimapScale,
		map: [], //vector of altitude marks [m] that describes the terrain
		images: [], //collection of generated images, each image = ['image id', distance]
		dimgLoaded: -1, //farthest distance where images have been loaded [m]
	},

	car: c, //index of current car
	firstTick: false, //first iteration has been calculated

	t: 0, //time [s]
	d: 0, //distance [m]
	altitude: 0, // [m]
	ascension: 0, //total ascended altitude (descent does not count) [m]
	angle: 0, //elevation angle [rad]
	pR: 1, //relative pressure (to standard pressure)
	pRConst: false, //if set, pR will not be calculated, but held constant

	gear: 'N',
	brakes: false, //whether brakes are currently applied
	nitro: false, //whether nitro is currently applied
	starter: 0, //starter countdown [s], zero when starter is not active

	//ng-model control variables
	clutchSlider: 1,
	gasSlider: 1,

	//whether pedals are currently moved up or down with keys
	clutchPedalUp: false,
	clutchPedalDown: false,
	gasPedalUp: false,
	gasPedalDown: false,

	//slider control variable processed into physical values
	gas: 0,
	clutch: 1,

	v: 0, //velocity [m/s]
	f: 0, //engine frequency [Hz]
	P: 0, //power [W]
	T: 0, //torque [N.m]

	consumption: 0, //instantaneous fuel consumption [g/s]
	fuel: 0, //fuel consumed in total [g]

	//these are only for special levels
	disable: {
		nitro: false,
		PID: false,
		keys: false,
		brakes: false,
		controls: false,
		stats23: false
	},

	onscreenMessage: null, //scripts can write a message on canvas screen

	//PID controller
	vTarget: false, //target speed for cruise control as number [m/s] or false (cruise control off)
	PIDmemory: [0, 0], //[error previous, integral]
	PID: [0, 0, 0], //gas throttle from [proportional, integrational, derivational] formula (for view)

	//current vibration offset x && y [px]
	//(actually a view related value, but very closely tied to model!)
	vibrationOffset: [0, 0]
}}

//CS = CONTROLLER STATE OBJECT
//factory for new a CS, which is always created in misc.js, but will be overwritten by CS loaded from save
function ControllerState() {return {
	version: version, //current game version
	tab: 'menu', //current view
	showroomIndex: 0,
	levelSelect: false, //current selection of level (index)
	carSelect: false, //current selection of car (index)
	isLoadedGame: false, //has a game been loaded from local storage?
	showIntro: true, //show or hide intro paragraph in menu
	showMap: false, //draw in-game minimap of terrain
	flashes: [], //flash texts (array of arrays=[timeout, text])

	/*display popup, which can be false (inactive), or object, distinguished by 'type' property:
		type: 'alert'     highly customizable alert generated, see popup() misc.js
			{lines: [strings], okButton: true, width: 300 [px], timeout: 1000 [ms], button2: {label: '', callback: function}}
		type: 'confirm'   confirmation dialog with buttons that trigger callback(true / false), see confirm2() misc.js
			text: 'description', callback: function(ok)
		type: 'prompt'    form with several text fields as {label: '', value: 'ng-model'}, see prompt2() misc.js
			fields: [], callback: function(array of field values)
		type: 'credits'   just to display credits section
	note: confirm will automatically close itself on any button, while prompt won't (has to be closed within callback)*/
	popup: false,
	
	//current state of tooltip
	tooltip: {
		visible: false,
		style: {'top': '0px', 'left': '0px'}, //numeric values are just placeholders
		message: ''
	},

	//this object is used to exchange data between minimap directive and R.drawMiniMap
	miniMapCursor: {
		enabled: false,
		pageY: 0,
		pageX: 0,
		angle: 0, //angle at cursor [rad]
		d: 0,  //distance at cursor [m]
		a: 0   //altitude at cursor [m]
	},

	//OPTIONS
	unitVel: units.kmh,  //unit of velocity
	unitAcc: units.kmhs, //unit of acceleration
	unitPow: units.kW,   //unit of power
	pedalSpeed: 0.2, //how long it takes to fully press or release a pedal [s]
	invertedPedals: false, //pedals have inverted meaning in model
	FPS: 30, //frames per second for drawing [Hz]
	ppm: 100, //pixels per meter for graphical rendering [1/m]

	enableSounds: true, //master switch for all sounds
	enableAmbientSounds: true,
	enableBackgroundMute: true, //mute sounds when bluring window to background
	volume: 50, //master sound volume [%]

	enableGraphics: true,
	enableVibration: true,
	enableAutomat: false, //automatic transmission
	enableGearstick: false, //show gearstick
	enableDetails: false, //show tables with detailed information
	mapToggle: false, // Tab toggles map on/off instead (false = show on hold)

	//is key currently being binded?
	keyBinding: false,

	//current keyBinds, the first six can be changed. ['action', 'keyCode', 'key']
	keyBinds: [
		['brake', 32, ' '],
		['map', 9, 'Tab'],
		['cu', 81, 'q'],
		['cd', 65, 'a'],
		['gu', 87, 'w'],
		['gd', 83, 's'],

		['neutral', 192, ';'],
		['neutral', 48, 'é'],
		['1', 49, '+'],
		['2', 50, 'ě'],
		['3', 51, 'š'],
		['4', 52, 'č'],
		['5', 53, 'ř'],
		['6', 54, 'ž'],

		['neutral', 96, '0'],
		['1', 97, '1'],
		['2', 98, '2'],
		['3', 99, '3'],
		['4', 100, '4'],
		['5', 101, '5'],
		['6', 102, '6'],
		
		['nitro', 78, 'n']
	]
}}
