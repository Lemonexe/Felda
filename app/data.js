/*
	DATA.JS
	defines static objects that contain all gamedata except cars
*/

//config contains constants not related to the physics model, but rather governing the behavior of application
const config = {
	//APP CONTROL
	dt: 10/1000, //short time interval for the discreet simulation itself [s]
	vibration: 40, //frequency of vibration [Hz]
	dtLeafletMap: 250, //time interval to update leaflet map [ms]
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
	cowcar:  {img: 'res/env/cow1.png'},
	prejezd: {t: 500, frames: ['res/env/prejezd1.png', 'res/env/prejezd2.png'], width: 0.833, height: 2.5, sound: 'prejezd'}, //(C)
	heli:    {t: 200, frames: ['res/env/heli1.png', 'res/env/heli2.png'], width: 6, height: 4, hOffset: 0.5, mirror: true, sound: 'plane'}, //(C)
	plane:   {t: 100, frames: ['res/env/plane1.png', 'res/env/plane2.png', 'res/env/plane3.png'], width: 6, height: 3, hOffset: 0.45, mirror: true, sound: 'plane'}, //(C)
	pump:    {img: 'res/env/pump.png', width: 1.4, height: 4},

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
	reach: maximal reach of sound for ambience [m]
	buffer: stores decoded audio, will be initiated as null
*/
const sounds = {
	engine: {src: 'res/sound/engine.wav', repStart: 0, repEnd: 2221},
	brake:  {src: 'res/sound/brake.mp3', repStart: 300, repEnd: 1300},
	nitro:  {src: 'res/sound/nitro.mp3', repStart: 200, repEnd: 400},
	cow:    {src: 'res/sound/cow.mp3', repStart: 0, repEnd: 3015, reach: 50},
	cowcar: {src: 'res/sound/cow.mp3', repStart: 250, repEnd: 2850},
	police: {src: 'res/sound/police.mp3', repStart: 0, repEnd: 3000, reach: 40},
	prejezd:{src: 'res/sound/prejezd.mp3', repStart: 670, repEnd: 1900, reach: 90},
	plane:  {src: 'res/sound/plane.mp3', repStart: 500, repEnd: 2000, reach: 100},
	beep:   {src: 'res/sound/beep.mp3', repStart: 0, repEnd: 500},
	explode:{src: 'res/sound/explode.mp3'},
	start:  {src: 'res/sound/start.mp3'},
	shift:  {src: 'res/sound/shift.mp3'}
};

//tooltips that are present on more than one elements
const tooltips = {
	ascension: 'nastoupaná výška za celou cestu',
	Fc: 'disipativní + gravitační síly působící na auto',
	Te: 'točivý moment motoru',
	FcF: 'výsledná síla na auto',
	TeF: 'výsledný točivý moment na motor',
	raw: 'teoretický výpočet z otáček a tlaku',
	eta: 'výkon / příkon',
	p: 'tlak vzduchu z barometrické rovnice',
	Tclutch: 'maximální točivý moment přenositelný spojkou',
	Tpass: 'točivý moment procházející spojkou od motoru k autu',
	df: 'prokluz na spojce (rozdíl frekvencí)',
	re: 'efektivní poloměr kol (se započtením převodu)',
	EkC: 'kinetická energie auta bez motoru',
	EkE: 'kinetická energie motoru',
	EkT: 'celková kinetické energie'
};
