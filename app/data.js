/*
	DATA.JS
	defines static objects that contain all gamedata except cars
*/

//config contains constants not related to the physics model, but rather governing the behavior of application
const config = {
	dt: 10/1000, //short time interval for the discreet simulation itself [s]
	vibration: 40, //frequency of vibration [Hz]
	imgLoadingArea: 1e4, //images will be split into areas of this length [m]
	minimapDistance: 1e4, //miniMap displays such distance [m]
	signDistance: 500, //intervals between special distance signs [m]
	ppm_min: 25, //min and max ppm (pixels per meter for graphical rendering [1/m])
	ppm_max: 200,
	minResolution: [1150, 650], //minimal recommended resolution
	idleGasConstant: 0.08, //slope of idleGas = idleGas(frequency error) [s]
	clutchTolerance: 0.5, //very important - difference of frequency on clutch to detect oscillation [Hz]. Must be bigger than zero, otherwise clutch will oscillate!
	integratorSwitch: 5, //in PID controller, integrator is turned off when velocity error is GREATER than this threshold, to prevent oscillation [m/s]
	derivatorSwitch: 0.5, //derivator is turned off when velocity error is LOWER than this threshold [m/s]
	maxMarks: 15, //maximum number of marks on a plot
	fPlotInt: 500/60, //frequency increment to tabelate values for plot [Hz]
	fPlotSpan: [1000/60, 7000/60], //frequency boundaries to tabelate values for plot [Hz]
	flash: 400 //duration of flash text [ms]. Note: this number is also in CSS @keyframes flash
};

//constants contain physical constants
const constants = {
	g: 9.81, //gravity [m/s^2]
	N2O: 2, //torque multiplier of N2O. A completely made up value, nitro is just for fun
	R: 8.314, //gas constant [J/K/mol]
	p: 101.325, //standard pressure [kPa]
	T: 298, //temperature [K]
	xO2: 0.21, //mole fraction of oxygen in air

	Mair: 0.0289644, // molar mass of air [kg/mol]

	//NATURAL 95
	dHsp: 46.4e3, //specific enthalpy of combustion [J/g]
	M: 114.1, //molar mass [g/mol]
	stc: 12.5, //stoichiometric coefficient for combustion with oxygen
	rho: 750 //density [g/l]
};

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

/*IMAGE SOURCES - these images will be preloaded by imgPreload() in misc.js
properties:
	img: image src as string (static images)
	t: duration of each frame [ms] (animations)
	frames: array of srcs for each frame (animations)
	width: real height [m] (decorations)
	height: real width [m] (decorations)
	hOffset: position offset downwards [m] (decorations, optional)
	mirror: if defined, image is mirrorable (decorations, optional)
(C) means that the image might be copyrighted
*/
let imgs = {
	//car images
	felicia:   {img: 'res/felicia.png'}, //(C)
	feliciaWH: {img: 'res/feliciaWH.png'}, //(C)
	Skoda105:   {img: 'res/Skoda105.png'}, //(C)
	Skoda105WH: {img: 'res/Skoda105WH.png'}, //(C)
	octavia:    {img: 'res/octavia.png'}, //(C)
	octaviaWH:  {img: 'res/octaviaWH.png'}, //(C)
	camaro:    {img: 'res/camaro.png'}, //(C)
	camaroWH:  {img: 'res/camaroWH.png'}, //(C)

	//decoration images
	oak:     {img: 'res/oak.png', width: 3, height: 4, mirror: true},
	radar:   {img: 'res/radar.png', width: 2, height: 3.5}, //(C)
	smrk:    {img: 'res/smrk.png', width: 4.3, height: 8, mirror: true}, //(C)
	cow:     {t: 500, frames: ['res/cow1.png', 'res/cow2.png'], width: 2.5, height: 1.775, mirror: true}, //(C)
	prejezd: {t: 500, frames: ['res/prejezd1.png', 'res/prejezd2.png'], width: 0.833, height: 2.5}, //(C)
	heli:    {t: 200, frames: ['res/heli1.png', 'res/heli2.png'], width: 6, height: 4, hOffset: 0.5, mirror: true}, //(C)
	plane:   {t: 100, frames: ['res/plane1.png', 'res/plane2.png', 'res/plane3.png'], width: 6, height: 3, hOffset: 0.45, mirror: true}, //(C)

	zn_km:       {img: 'res/zn_km.png',       width: 1, height: 1},
	zn_50:       {img: 'res/zn_50.png',       width: 1, height: 2},
	zn_prace:    {img: 'res/zn_prace.png',    width: 1, height: 2},
	zn_diry:     {img: 'res/zn_diry.png',     width: 1, height: 2},
	zn_stop:     {img: 'res/zn_stop.png',     width: 1, height: 2},
	zn_prednost: {img: 'res/zn_prednost.png', width: 1, height: 2},
	zn_radar:    {img: 'res/zn_radar.png',    width: 1, height: 2},
	zn_letadlo:  {img: 'res/zn_letadlo.png',  width: 1, height: 2},
	zn_vitr:     {img: 'res/zn_vitr.png',     width: 1, height: 2},
	zn_kameni:   {img: 'res/zn_kameni.png',   width: 1, height: 2},
	zn_krava:    {img: 'res/zn_krava.png',    width: 1, height: 2},
	zn_mraz:     {img: 'res/zn_mraz.png',     width: 1, height: 2},
	zn_serpent:  {img: 'res/zn_serpent.png',  width: 1, height: 2},
	zn_12up:     {img: 'res/zn_12up.png',     width: 1, height: 2},
	zn_12down:   {img: 'res/zn_12down.png',   width: 1, height: 2}
};

//levels contain definitions of levels. For explanation comments see 'Česká krajina'
const levels = [
	{
		name: 'Tutorial',
		description: 'Zde bude krok po kroku vysvětleno ovládání hry.',
		listeners: {
			onstart: () => tutorialFunctions.onstart(),
			continuous: () => tutorialFunctions.continuous(),
			onend: () => tutorialFunctions.onend(),
			onstall: () => tutorialFunctions.onstall()
		},
		generation: {
			f: 'straight',
			int: 1e3,
			length: 1e5,
			minimapScale: 1,
			images: []
		}
	},

	{
		name: 'Letiště',
		description: 'Rovný nekonečný asfalt bez jakýchkoliv omezení. Ideální pro hraní si a zkoušení všeho možného!',
		listeners: {
			onstart: function() {popup('Jeďte bezpečně', true, 1200);},
			onend: function() {popup('Konec ranveje', true, 2400);},
			onstall: function() {popup('Motor chcípl', true, 900);}
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
		name: 'Česká krajina',
		description: 'Mírně zvlněný terén. Očekávejte sklon až 10°, zde by žádné vozidlo nemělo mít problém.',
		/*listeners for "events":
			onstart: when level is initiated
			onend: when player travels the whole length of level
			onstall: when engine stalls
			continuous: each tick
		*/
		listeners: {
			onstart: function() {popup('Dávejte pozor na radary a díry v silnici!', true, 1600);},
			onend: function() {popup('Dojeli jste na hranici, česká krajina zde končí.', true, 2400);},
			onstall: function() {popup('Motor chcípl', true, 900);}
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
				{img: 'prejezd',     density: 1/800},
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
		name: 'Alpská krajina',
		description: 'Vysokohorská krajina s velice hrubým terénem, očekávejte až 30° sklon jakož i mnoho krav.',
		listeners: {
			onstart: function() {popup('Dávejte pozor na padající turisty či kamení!', true, 1600);},
			onend: function() {popup('Přejeli jste celé Alpy, alpská krajina zde končí.', true, 2400);},
			onstall: function() {popup('Motor chcípl', true, 900);}
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

//tutorial functions are exported here to make 'levels' more concise
const tutorialFunctions = {
	//define initial conditions
	onstart: function() {
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
	},
	//the story of tutorial
	continuous: function() {
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
		else if(S.f >= 7900/60 && S.script === 1) {
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
	},
	onend: function() {popup(['Dosáhli jste konce dráhy tutorialu. To jsem tedy fakt nečekal!', 'Pokud jste jej ale nedokončili, je třeba jej znovu spustit z menu.'], false, false, 400);},
	onstall: function() {
		(S.stalls === 0) && popup(['Motor chcípl!',
			'To se stane buď při startování (je třeba více plynu a rozhodně mít zařazenou jedničku), nebo při zabrždění (je třeba stisknout spojku, nebo naopak zrychlit).'],
			false, false, 500);

		(S.stalls > 0) && popup('Motor chcípl.', true, 1200);
		S.stalls++;
	}
};

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
