/*
	DATA.JS
	defines static objects that contain all gamedata except cars
*/

//config contains constants not related to the physics model, but rather governing the behavior of application
const config = {
	//APP CONTROL
	dt: 10/1000, //short time interval for the discreet simulation itself [s]
	vibration: 40, //frequency of vibration [Hz]
	imgLoadingArea: 1e4, //images will be split into areas of this length [m]
	minimapDistance: 1e4, //miniMap displays such distance [m]
	signDistance: 500, //intervals between special distance signs [m]
	ppm_min: 25, //min and max ppm (pixels per meter for graphical rendering [m-1])
	ppm_max: 200,
	minResolution: [1150, 700], //minimal recommended resolution

	//MODEL
	idleGasConstant: 0.08, //slope of idleGas = idleGas(frequency error) [s]
	clutchTolerance: 0.5, //very important - difference of frequency on clutch to detect oscillation [Hz]. Must be bigger than zero, otherwise clutch will oscillate!
	integratorCap: 2, //to prevent immense oscillation of PID controller, integration is capped at this value. It has the meaning of control variable (gas)
	dDecoration: 5, //how far from road are decorations placed [m] for Doppler effect calculation
	vSound: 343, //speed of sound in air [m/s] for Doppler effect calculation
	soundExtinction: 0.02, //volume decrease [m-1] for ambient sounds
	
	//SHOWROOM
	maxMarks: 15, //maximum number of marks on a plot
	fPlotInt: 100/60, //frequency increment to tabelate values for plot [Hz]
	ppmShowroom: 120, //ppm for image of car in showroom [m-1]
	gearColors: {'1': 'red', '2': 'gold', '3': 'green', '4': 'blue', '5': 'magenta', '6': 'cyan'}, //colors for plot datasets
	flash: 400 //duration of flash text [ms]
};

//constants contain physical constants
const constants = {
	g: 9.81, //gravity [m/s^2]
	N2O: 2, //torque multiplier of N2O. A completely made up value, nitro is just for fun
	R: 8.314, //gas constant [J/K/mol]
	p: 101.325, //standard pressure [kPa]
	T: 298, //temperature [K]
	xO2: 0.21, //mole fraction of oxygen in air

	Mair: 0.0289644, //molar mass of air [kg/mol]

	//NATURAL 95
	dHsp: 46.4e3, //specific enthalpy of combustion [J/g]
	M: 114.1, //molar mass [g/mol]
	stc: 12.5, //stoichiometric coefficient for combustion with oxygen
	rho: 750 //density [g/l]
};

//constant of barometric equation as pR = exp(const * h) [m^-1]
constants.barometric = -constants.g * constants.Mair / constants.R / constants.T;

//definition of various units as val: conversion value to SI, txt: text representation, dgt: digits after decimal point to display
const units = {
	kmh:  {val: 3.6, txt: 'km/h', dgt: 0},
	ms:   {val: 1,   txt: 'm/s',  dgt: 1},
	kmhs: {val: 3.6, txt: 'km/h/s', dgt: 2},
	g:    {val: 1/constants.g, txt: 'g', dgt: 3},
	mss:  {val: 1, txt: 'm/s²', dgt: 2},
	kW:   {val: 1e-3,     txt: 'kW', dgt: 0},
	hp:   {val: 1.341e-3, txt: 'hp', dgt: 0}
};

/*IMAGE SOURCES
	these images will be preloaded by imgPreload() in misc.js
	that means the 'img' property will be REPLACED with HTML img element
properties:
	img: image src as string (static images)
	t: duration of each frame [ms] (animations)
	frames: array of srcs for each frame (animations)
	width: real height [m] (decorations)
	height: real width [m] (decorations)
	hOffset: position offset downwards [m] (decorations, optional)
	mirror: if defined, image is mirrorable (decorations, optional)
	sound: reference to sound that will loop when nearby (decorations, optional)
(C) means that the image might be copyrighted
*/
const imgs = {
	//car images
	felicia:    {img: 'res/cars/felicia.png'}, //(C)
	feliciaWH:  {img: 'res/cars/feliciaWH.png'}, //(C)
	Skoda105:   {img: 'res/cars/Skoda105.png'}, //(C)
	Skoda105WH: {img: 'res/cars/Skoda105WH.png'}, //(C)
	C2CV:       {img: 'res/cars/C2CV.png'}, //(C)
	C2CVWH:     {img: 'res/cars/C2CVWH.png'}, //(C)
	octavia:    {img: 'res/cars/octavia.png'}, //(C)
	octaviaWH:  {img: 'res/cars/octaviaWH.png'}, //(C)
	camaro:     {img: 'res/cars/camaro.png'}, //(C)
	camaroWH:   {img: 'res/cars/camaroWH.png'}, //(C)
	RX8:        {img: 'res/cars/RX8.png'}, //(C)
	RX8WH:      {img: 'res/cars/RX8WH.png'}, //(C)

	//decoration images
	oak:     {img: 'res/env/oak.png', width: 3, height: 4, mirror: true},
	radar:   {img: 'res/env/radar.png', width: 2, height: 3.5, sound: 'police'}, //(C)
	smrk:    {img: 'res/env/smrk.png', width: 4.3, height: 8, mirror: true}, //(C)
	cow:     {t: 500, frames: ['res/env/cow1.png', 'res/env/cow2.png'], width: 2.5, height: 1.775, mirror: true, sound: 'cow'}, //(C)
	prejezd: {t: 500, frames: ['res/env/prejezd1.png', 'res/env/prejezd2.png'], width: 0.833, height: 2.5, sound: 'prejezd'}, //(C)
	heli:    {t: 200, frames: ['res/env/heli1.png', 'res/env/heli2.png'], width: 6, height: 4, hOffset: 0.5, mirror: true}, //(C)
	plane:   {t: 100, frames: ['res/env/plane1.png', 'res/env/plane2.png', 'res/env/plane3.png'], width: 6, height: 3, hOffset: 0.45, mirror: true}, //(C)

	zn_km:       {img: 'res/signs/zn_km.png',       width: 1, height: 1},
	zn_50:       {img: 'res/signs/zn_50.png',       width: 1, height: 2},
	zn_prace:    {img: 'res/signs/zn_prace.png',    width: 1, height: 2},
	zn_diry:     {img: 'res/signs/zn_diry.png',     width: 1, height: 2},
	zn_stop:     {img: 'res/signs/zn_stop.png',     width: 1, height: 2},
	zn_prednost: {img: 'res/signs/zn_prednost.png', width: 1, height: 2},
	zn_radar:    {img: 'res/signs/zn_radar.png',    width: 1, height: 2},
	zn_letadlo:  {img: 'res/signs/zn_letadlo.png',  width: 1, height: 2},
	zn_vitr:     {img: 'res/signs/zn_vitr.png',     width: 1, height: 2},
	zn_kameni:   {img: 'res/signs/zn_kameni.png',   width: 1, height: 2},
	zn_krava:    {img: 'res/signs/zn_krava.png',    width: 1, height: 2},
	zn_mraz:     {img: 'res/signs/zn_mraz.png',     width: 1, height: 2},
	zn_serpent:  {img: 'res/signs/zn_serpent.png',  width: 1, height: 2},
	zn_12up:     {img: 'res/signs/zn_12up.png',     width: 1, height: 2},
	zn_12down:   {img: 'res/signs/zn_12down.png',   width: 1, height: 2}
};

/*SOUND SOURCES
properties:
	src: audio src as string
	repStart: where to start when repeating audio [ms]
	repEnd: where to end when repeating audio [ms]
	buffer: stores decoded audio, will be initiated as null
*/
const sounds = {
	engine: {src: 'res/sound/engine.wav', repStart: 0, repEnd: 2221},
	brake:  {src: 'res/sound/brake.mp3', repStart: 300, repEnd: 1300},
	nitro:  {src: 'res/sound/nitro.mp3', repStart: 200, repEnd: 400},
	cow:    {src: 'res/sound/cow.mp3', repStart: 0, repEnd: 3015},
	police: {src: 'res/sound/police.mp3', repStart: 0, repEnd: 3000},
	prejezd:{src: 'res/sound/prejezd.mp3', repStart: 670, repEnd: 1900},
	beep:   {src: 'res/sound/beep.mp3', repStart: 0, repEnd: 500},
	explode:{src: 'res/sound/explode.mp3'},
	start:  {src: 'res/sound/start.mp3'},
	shift:  {src: 'res/sound/shift.mp3'}
};

//levels contain definitions of levels. For explanation comments see 'Česká krajina'
const levels = [
	{
		id: 'tutorial',
		name: 'Tutorial',
		description: 'Zde bude krok po kroku vysvětleno ovládání hry.',
		listeners: {}, //will be filled later
		generation: {
			f: 'straight',
			int: 1e3,
			length: 1e5,
			minimapScale: 1,
			images: []
		}
	},

	{
		id: 'flat',
		name: 'Letiště',
		description: 'Rovný nekonečný asfalt bez jakýchkoliv omezení. Ideální pro hraní si a zkoušení všeho možného!',
		listeners: {
			onstart: () => popup('Jeďte bezpečně', true, 1200),
			onstall: () => popup('Motor chcípl', true, 900),
			onend: () => (S.onscreenMessage = {
				opacity: 0.5, fillStyle: '#cc4444', fontSize: 40, fontFamily: 'Comic Sans MS',
				msg: ['Konec ranveje']
			})
		},
		generation: {
			f: 'straight',
			int: 1e3,
			length: 1e5,
			minimapScale: 1,
			images: [
				{img: 'heli',       density: 1/600},
				{img: 'plane',      density: 1/400},
				{img: 'zn_letadlo', density: 1/200},
				{img: 'zn_vitr',    density: 1/400}
			]
		}
	},

	{
		id: 'hills', //the id must be unchanged because of references
		name: 'Česká krajina',
		description: 'Mírně zvlněný terén. Očekávejte sklon až 10°, zde by žádné vozidlo nemělo mít problém.',
		/*listeners for "events":
			onstart: when level is initiated
			onend: when player travels the whole length of level
			onstall: when engine stalls
			continuous: each tick
		*/
		listeners: {
			onstart: () => popup('Dávejte pozor na radary a díry v silnici!', true, 1600),
			onstall: () => popup('Motor chcípl', true, 900),
			onend: () => (S.onscreenMessage = {
				opacity: 0.5, fillStyle: '#cc4444', fontSize: 40, fontFamily: 'Comic Sans MS',
				msg: ['Jste na hranicích.', 'Česká krajina zde končí']
			})
		},
		//parameters for generation of map
		generation: {
			f: 'noise', //name of L function (see level.js)
			int: 100, //distance between map points [m]
			baseAlt: 50, //base altitude [m], only when f === 'noise'
			length: 1e5, //length of level [m]
			minimapScale: 5, //altitude:distance scale of miniMap (higher number will amplify heights)
			//only when f === 'noise'. Each noise: [interval, maxAltitude] as [m]
			noises: [
				[5000, 350], //4.0°
				[2000, 110], //3.1°
				[1000, 60], //3.4°
				[400, 20], //2.9°
				[200, 10] //2.9°
			],
			images: [
				//{link to 'imgs', density of images per m [1/m]}
				{img: 'oak',         density: 1/100},
				{img: 'radar',       density: 1/200},
				{img: 'prejezd',     density: 1/600},
				{img: 'zn_50',       density: 1/200},
				{img: 'zn_prace',    density: 1/400},
				{img: 'zn_diry',     density: 1/400},
				{img: 'zn_stop',     density: 1/600},
				{img: 'zn_prednost', density: 1/400},
				{img: 'zn_radar',    density: 1/1000}
			]
		}
	},

	{
		id: 'alps',
		name: 'Alpská krajina',
		description: 'Vysokohorská krajina s velice hrubým terénem, očekávejte až 30° sklon jakož i mnoho krav.',
		listeners: {
			onstart: () => popup('Dávejte pozor na padající turisty či kamení!', true, 1600),
			onstall: () => popup('Motor chcípl', true, 900),
			onend: () => (S.onscreenMessage = {
				opacity: 0.5, fillStyle: '#cc4444', fontSize: 40, fontFamily: 'Comic Sans MS',
				msg: ['Přejeli jste celé Alpy.', 'Alpská krajina zde končí']
			})
		},
		generation: {
			f: 'noise',
			int: 100,
			baseAlt: 500,
			length: 1e5,
			minimapScale: 2,
			noises: [
				[10000, 2000], //11°
				[2500, 630], //14°
				[2000, 300], //8.5°
				[400, 50], //7.1°
				[200, 20] //5.7°
			],
			images: [
				{img: 'cow',        density: 1/100},
				{img: 'smrk',       density: 1/100},
				{img: 'zn_kameni',  density: 1/1200},
				{img: 'zn_krava',   density: 1/800},
				{img: 'zn_mraz',    density: 1/1600},
				{img: 'zn_serpent', density: 1/400},
				{img: 'zn_12up',    density: 1/400},
				{img: 'zn_12down',  density: 1/400}
			]
		}
	}
];

//modify levels post-declaration
(function() {
	/*CREATE NEW LEVELS using the original levels as templates*/

	//DRAG RACE
	let drag = angular.copy(levels.find(i => i.id === 'flat'));
	drag.sublevel = 'flat'; drag.id = 'drag'; drag.name = 'Drag';
	drag.description = 'Klasický závod na čtvrt míle. Vystartujte kdy chcete a začne se počítat čas!';
	drag.generation.int = drag.generation.length = 402.336;
	drag.listeners = {
		onstart: function() {
			S.initiated = false; //set to true when first accelerating
			S.t60 = S.t100 = 0; //time when 60 or 100 km/h was reached
		},
		continuous: function() {
			if(!S.initiated && S.d > 0) {
				S.t = 0;
				S.initiated = true;
				flash('GO');
			}

			//acceleration stats
			(S.v >= 60/3.6  && S.t60  === 0) && (S.t60  = S.t);
			(S.v >= 100/3.6 && S.t100 === 0) && (S.t100 = S.t);
		},
		onend: () => (S.onscreenMessage = {
			opacity: 0.6, textAlign: 'right', fontSize: 28, fontFamily: 'Tahoma',
			msg: ['DOJELI JSTE DO CÍLE',
				`celkový čas: ${S.t.toFixed(1)} s`,
				`0-60: ${ S.t60 .toFixed(1)} s`,
				`0-100: ${S.t100.toFixed(1)} s`]
		})
		
	};
	levels.push(drag);

	
	//FUEL CHALLENGE
	let fuel = angular.copy(levels.find(i => i.id === 'hills'));
	fuel.sublevel = 'hills'; fuel.id = 'fuel'; fuel.name = 'Need 4 Natural 95';
	fuel.description = '50 km je dost velká dálka, když mají všechny benzínky vyprodáno! Vystačí vám troška paliva k další pumpě?';
	fuel.generation.length = 5e4;
	fuel.listeners = {
		onstart: function() {
			S.fuelChallenge = true;
			S.disableNitro = true;
			S.car = 0; //Felicia 4ever!!!
popup(['NENÍ HOTOVO!!!', 'tento level zatím není nic než kopie České krajiny']);
		},
		continuous: function() {
		},
		onend: () => (S.onscreenMessage = {
			opacity: 0.6, fontSize: 28, fontFamily: 'Tahoma',
			msg: ['VÍTĚZSTVÍ!',
				`zvládli jste ujet 50 km`,
				`se spotřebou ${(S.fuel / S.d / constants.rho * 1e5).toFixed(1)} l/100km`]
		})
	};
	levels.push(fuel);


	//SPEED CHALLENGE
	let speed = angular.copy(levels.find(i => i.id === 'hills'));
	speed.sublevel = 'hills'; speed.id = 'speed'; speed.name = 'Nebezpečná rychlost';
	speed.description = 'Chytrá bomba vás nutí dodržovat neustále se měnící rychlostní limit. Zvládnete přežít 10 km?';
	speed.generation.length = 1e4;
	speed.generation.noises[0] = [2000, 200]; //eliminate extra long slopes
	speed.generation.baseAlt = 100;
	speed.listeners = {
		onstart: function() {
			S.speedChallenge = true;
			S.disableNitro = true;
			S.car = 0; //Felicia 4ever!!!

			S.speedLimit = 0; //currently imposed speed limit [m/s]
			S.integrale = 0; //integrale of speed error * dt, which triggers the explosion [m]
			S.lastLimitAt = 0; //distance where last speed limit was imposed [m]
			S.odd = true; //odd (or even) iteration

			popup(['Po 200 m se aktivuje bomba a uvidíte rychlostní limit',
				'Chytrá bomba™ mění své požadavky každých 200 m',
				'Buďte ve střehu a vydržte 10 kilometrů!'],
				false, false, 600)
		},
		continuous: function() {
			const integraleBoom = 10; //integrale threshold that leads to explosion [m]
			const int = 200; //interval between new speed limits [m]
			let initiated = S.d > int; //challenge doesn't start until the first distance interval

			//impose a new limit using a linear regression for Škoda Felicia: v = a*angle + b
			if(S.d > S.lastLimitAt + int) {
				const a = -125.6;
				const b = 41.9;
				S.odd = !S.odd;
				S.speedLimit = (a * S.angle + b) * (0.3 + 0.2*S.odd + 0.1*Math.random());
				S.lastLimitAt = Math.floor(S.d/int)*int;
			}

			//calculate speed tolerance, lower & upper limit [m/s]
			let speedTol = 2/3.6 + 0.04*S.speedLimit;
			let vMin = S.speedLimit - speedTol;
			let vMax = S.speedLimit + speedTol;

			//accumulate integrale
			let err = (S.v < vMin || S.v > vMax) ? 1 : -2;
			S.integrale += initiated * err * config.dt;
			S.integrale = S.integrale.limit(0, NaN);
			S.progressBar = S.integrale / integraleBoom; //for rendering purposes

			//beeping sound when in danger
			let rate = S.v > S.speedLimit ? 2 : 0.6;
			(initiated && err > 0 && S.progressBar > 0.4) ? soundService.start('beep', 1, rate) : soundService.end('beep');

			//write speed limits
			let color = err > 0 ? '#ff0000' : '#00aa00';
			S.onscreenMessage = initiated ? {
				left: 0.01, top: 0.5, textAlign: 'left', textBaseline: 'middle', fillStyle: color, fontSize: 40, fontFamily: 'Tahoma',
				msg: [`${Math.ceil(vMin*CS.unitVel.val)} - ${Math.floor(vMax*CS.unitVel.val)} ${CS.unitVel.txt}`]
			} : null;

			//it goes BOOOOOM !!!
			if(S.integrale > integraleBoom) {
				soundService.end('beep');
				soundService.play('explode');
				S.exploded = true;
				S.finished = true;
				S.running = false;
				S.onscreenMessage = {
					top: 0.5, opacity: 0.6, fillStyle: '#ff6600', fontSize: 60, fontFamily: 'Tahoma',
					msg: ['BOOOOOM !!!', '💥💀']
				};
				//add salt to wound if you stare at your death for too long xD
				window.setTimeout(() => CS.tab === 'game' && S.exploded && popup('ok boomer'), 7e3);
			}
		},
		onend: function() {
			soundService.end('beep');
			S.onscreenMessage = {
				opacity: 0.6, fontSize: 28, fontFamily: 'Tahoma',
				msg: ['VÍTĚZSTVÍ!',
					`Sandra Bullock přežila celých 10 km`,
					'a Chytré Bombě™ došly baterky!']
			};
		}
	};
	levels.push(speed);


	/*TUTORIAL FUNCTIONS are exported here to make 'levels' more concise*/
	let tutorial = levels.find(i => i.id === 'tutorial');

	//define initial conditions
	tutorial.listeners.onstart = function() {
		S.tutorial = true; //has the effect that popups pause the game
		S.car = 0; //Felicia 4ever!!!
		S.script = 0; //control variable to advance through the story
		S.stalls = 0; //counter of stalls
		S.gear = '2';
		S.v = 10;
		S.a = 0;
		S.level.mapOLD = angular.copy(S.level.map);
		S.level.map = S.level.map.map((h, i) => 1000-0.1*i*levels[S.level.i].generation.int); //hardcode a downhill slope
		S.disable.keys = true;
		S.disable.controls = true;
		S.disable.brakes = true;
		S.disable.stats23 = true;

		popup(['Vítejte ve Felda simulátoru!',
			'Po odkliknutí OK (či stisknutí Esc) uvidíte vykreslenou grafiku a tabulku s nejdůležitějšími čísly: zařazený převod, rychlost a otáčky motoru.',
			'Dále je tam zrychlení a sklon - zatímco v realitě je cítíme a vidíme, zde se musí vypisovat.'],
			false, false, 550);
	};

	//the story of tutorial
	tutorial.listeners.continuous = function() {
		if(S.t >= 5 && S.script === 0) {
			S.script++;
			S.disable.keys = false;
			S.disable.controls = false;

			popup(['Nyní se zpřístupní ovládání.',
				'Nejdůležitější jsou dva posuvníky, které představují pedály spojky a plynu.',
				'Když jsou nahoře, je to jako když jsou pedály volné a když s nimi pohybujete dolů, je to jako když pedály sešlapujete.',
				'Posuvníky se ovládají myší a nebo tlačítky, které jsou u nich uvedené. Zkuste pomocí plynu zrychlit na 120 km/h.',
				'Pozn.: v nastavení lze význam pedálů obrátit'],
				false, false, 500);
		}
		else if(S.f >= 7800/60 && S.script === 1) {
			S.script++;

			popup(['Beze změny převodu to nepůjde.',
				'Je třeba stisknout spojku a vybrat vyšší převod - k tomu slouží řada čísel nad písmeny nebo numerická klávesnice.',
				'Středník nebo 0 znamená neutrál.'],
				false, false, 500);
		}
		else if(S.v >= 120/3.6 && (S.script === 1 || S.script === 2)) {
			S.script = 3;

			//stop car and make the map flat
			S.f = 0;
			S.v = 0;
			S.level.map = S.level.mapOLD;
			S.angle = 0;

			popup(['Výborně!', 'Nyní bude auto zastaveno, zkuste se rozjet na 30 km/h.',
				'Nejprve je potřeba stisknout spojku a nastartovat pomocí tlačítka START.',
				'Nejsnažší způsob jak se potom rozjet, je roztočit motor na vysoké otáčky a pak prostě pustit spojku.', '',
				'Ovšem v realitě to děláme trochu citlivěji... Můžete i zde zkusit koordinovaně pouštět spojku, přidávat plyn a udržet otáčky pod 2000 RPM.',
				'Je to těžké, ale jde to 😉'],
				false, false, 600);
		}
		else if(S.v >= 30/3.6 && S.script === 3) {
			S.script = 4;
			S.d = 0;
			S.fuel = 0;
			S.t = 0;

			S.disable.brakes = false;
			S.disable.stats23 = false;

			popup(['Skvělá práce!', 'Můžete si nyní vyzkoušet brzdu (mezerník).',
				'Už zbývá jen popsat zbývající údaje: spotřeba paliva, aktuální výkon a točivý moment, ujetá vzdálenost apod.',
				'Tlačítkem Esc se dostanete do hlavního menu, kde můžete spustit normální hru.',
				'Nezapomeňte si také prohlédnout Nastavení, kde lze hru přizpůsobit dle chuti či vyzkoušet různé speciální funkce: tempomat, automatické řazení, řazení pomocí myši či detailní údaje.'],
				false, false, 500);
		}
	};

	tutorial.listeners.onend = function() {
		popup(['Dosáhli jste konce dráhy tutorialu. To jsem tedy fakt nečekal!', 'Pokud jste jej ale nedokončili, je třeba jej znovu spustit z menu.'], false, false, 400);
		S.onscreenMessage = {
			opacity: 0.5, fillStyle: '#cc4444', fontSize: 40, fontFamily: 'Comic Sans MS',
			msg: ['Konec cesty xD']
		}
	};

	tutorial.listeners.onstall = function() {
		(S.stalls === 0) && popup(['Motor chcípl!',
			'To se stane buď při startování (je třeba více plynu a rozhodně mít zařazenou jedničku), nebo při zabrždění (je třeba stisknout spojku, nebo naopak zrychlit).'],
			false, false, 500);

		(S.stalls > 0) && popup('Motor chcípl.', true, 1200);
		S.stalls++;
	};
})();

//tooltips that are present on more than one elements
const tooltips = {
	ascension: 'nastoupaná výška za celou cestu',
	Fc: 'disipativní + gravitační síly působící na auto',
	Te: 'točivý moment motoru',
	FcF: 'výsledná síla na auto',
	TeF: 'výsledný točivý moment na motor',
	raw: 'teoretický výpočet z otáček a tlaku',
	ny: 'výkon / příkon',
	p: 'tlak vzduchu z barometrické rovnice',
	Tclutch: 'maximální točivý moment přenositelný spojkou',
	Tpass: 'točivý moment procházející spojkou od motoru k autu',
	df: 'prokluz na spojce (rozdíl frekvencí)',
	re: 'efektivní poloměr kol (se započtením převodu)',
	EkC: 'kinetická energie auta bez motoru',
	EkE: 'kinetická energie motoru',
	EkT: 'celková kinetické energie'
};
