/*
	LEVELDATA.JS
	defines level objects as well as post-declaration modifications
*/

//levels contain definitions of levels. For explanation comments see 'Česká krajina'
const levels = [
	{
		id: 'tutorial',
		name: 'Tutorial',
		description: 'Zde bude krok po kroku vysvětleno ovládání hry.',
		listeners: {}, //will be filled later
		compulsoryCar: 0, //if defined, the car $index will be obligatory
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
			f: 'noise', //name of LVL function (see level.js)
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
				//{link to 'imgs', density of images per meter [m-1], OPTIONAL h: [min altitude, max altitude]}
				{img: 'oak',         density: 1/100},
				{img: 'radar',       density: 1/400},
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
				{img: 'cow',         density: 1/100},
				{img: 'smrk',        density: 1/100},
				{img: 'zn_kameni',   density: 1/1200},
				{img: 'zn_krava',    density: 1/800},
				{img: 'zn_mraz',     density: 1/800, h: [2500, 1e4]},
				{img: 'zn_serpent',  density: 1/400},
				{img: 'zn_12up',     density: 1/400},
				{img: 'zn_12down',   density: 1/400}
			]
		}
	},

	{
		id: 'realworld',
		name: 'Reálná mapa',
		description: 'Zadáte dvě adresy a o zbytek se postará OpenStreetMap.',
		listeners: {
			onstart: () => popup([
				'Byla naplánovnána trasa:',
				CS.realMapFields[0],
				`→ ${CS.realMapFields[1]}`,
				`o celkové délce ${(S.level.length/1e3).toFixed(1)} km`,
				'Pozn.: kdyby mapa vlevo nahoře nefungovala, často pomůže F5'], false, false, 380),
			onstall: () => popup('Motor chcípl', true, 900),
			onend: () => (S.onscreenMessage = {
				left: 2/3, opacity: 0.5, fillStyle: '#cc4444', fontSize: 40, fontFamily: 'Comic Sans MS',
				msg: ['Dojeli jste do cíle :)']
			})
		},
		generation: {
			f: 'realMapInit',
			int: 50,
			length: 1e5, //mock value only - S.level.length will be later overwritten by the actual route distance
			minimapScale: 5,
			images: [
				//h = [min altitude, max altitude] to draw image
				{img: 'oak',         density: 1/100, h: [0, 700]},
				{img: 'radar',       density: 1/600, h: [0, 1000]},
				{img: 'prejezd',     density: 1/600, h: [0, 700]},
				{img: 'pump',        density: 1/1000,h: [0, 1000]},
				{img: 'cow',         density: 1/200, h: [500, 1e4]},
				{img: 'smrk',        density: 1/100, h: [500, 1e4]},
				{img: 'zn_50',       density: 1/400},
				{img: 'zn_prace',    density: 1/1000},
				{img: 'zn_diry',     density: 1/800},
				{img: 'zn_stop',     density: 1/1000},
				{img: 'zn_prednost', density: 1/800},
				{img: 'zn_radar',    density: 1/2000},
				{img: 'zn_kameni',   density: 1/1600},
				{img: 'zn_krava',    density: 1/1000},
				{img: 'zn_mraz',     density: 1/2400},
				{img: 'zn_serpent',  density: 1/800},
				{img: 'zn_12up',     density: 1/800},
				{img: 'zn_12down',   density: 1/800}
			]
		}
	}
];



//modify or create levels post-declaration
(function() {
	/*CREATE NEW LEVELS using the original levels as templates*/

	//DRAG RACE
	let drag = angular.copy(levels.find(i => i.id === 'flat'));
	drag.sublevel = 'flat'; drag.id = 'drag'; drag.name = 'Drag';
	drag.description = 'Klasický závod na čtvrt míle. Vystartujte kdy chcete a začne se počítat čas!';
	drag.generation.int = drag.generation.length = 402.336;
	drag.generation.images = [];
	drag.listeners = {
		onstart: function() {
			S.initiated = false; //set to true when first accelerating
			S.t60 = S.t100 = 0; //time when 60 or 100 km/h was reached
			S.usedNitro = false; //whether player has cheated
		},
		continuous: function() {
			S.usedNitro = S.usedNitro || S.nitro;

			if(S.d <= 0) {S.t = 0;}
			else if(!S.initiated) {
				S.t = 0;
				S.initiated = true;
				flash('GO');
			}

			//acceleration stats
			(S.v >= 60/3.6  && S.t60  === 0) && (S.t60  = S.t);
			(S.v >= 100/3.6 && S.t100 === 0) && (S.t100 = S.t);
		},
		onend: function() {
			S.onscreenMessage = {
				opacity: 0.6, textAlign: 'right', fontSize: 28, fontFamily: 'Tahoma',
				msg: ['DOJELI JSTE DO CÍLE',
					`celkový čas: ${S.t.toFixed(2)} s`,
					`0-60: ${ S.t60 .toFixed(2)} s`,
					`0-100: ${S.t100.toFixed(2)} s`]
			};

			//for each car, there are time limits to get [A, B, C, D, E] (else F), and in the comment the best RPM to shift ;-)
			let marks = ['A', 'B', 'C', 'D', 'E', 'F'];
			let markTable = {
				'felicia':  [18.4, 19.1, 20.7, 23.5, 27.0], //6000 RPM
				'Skoda105': [20.6, 21.2, 22.6, 25.0, 28.0], //6000 RPM
				'C2CV':     [21.8, 22.6, 24.5, 27.8, 32.0], //6500 RPM
				'octavia':  [15.6, 16.1, 17.3, 19.4, 22.0], //6500 RPM
				'camaro':   [11.5, 12.0, 13.1, 15.1, 17.5], //6000 RPM
				'RX8':      [13.6, 14.2, 15.6, 18.0, 21.0], //8500 RPM
				'cow':      [ 7.6,  8.3,  9.8, 12.6, 16.0]  // NaN RPM
			};

			if(S.usedNitro) {
				popup('Čas nebyl hodnocen, neboť jste použili nitro.', false, 3e3);
				return;
			}
			//determine mark
			if(markTable.hasOwnProperty(cars[S.car].id)) {
				let mRow = markTable[cars[S.car].id];
				let i;
				for(i = 0; i < marks.length; i++) {
					if(S.t <= mRow[i] || i === marks.length-1) {break;}
				}
				(i <= 1) && (CS.secretDrag = true); //"A" or "B"
				this.secret();
				S.onscreenMessage.msg.push(`hodnocení: "${marks[i]}"`);
				i > 0 && S.onscreenMessage.msg.push(`(${mRow[i-1].toFixed(1)} s pro "${marks[i-1]}")`);
			}
		},
		//special listener, will be copied to other levels as well - unlock easter egg car
		secret: function() {
			if(CS.secretDrag && CS.secretFuel && CS.secretSpeed && !CS.secretUnlock) {
				CS.secretUnlock = true;
				window.setTimeout(() => popup(['---TOP SECRET---',
					'Za zdolání třech náročných řidičských zkoušek se vám uděluje bonusový vůz!',
					'Ať dobře slouží!'], false, false, 400), 3e3);
			}
		}
	};
	levels.push(drag);

	
	//FUEL CHALLENGE
	let fuel = angular.copy(levels.find(i => i.id === 'hills'));
	fuel.sublevel = 'hills'; fuel.id = 'fuel'; fuel.name = 'Need 4 Natural 95';
	fuel.description = '20 km je dost velká dálka, když mají všechny benzínky vyprodáno! Vystačí vám troška paliva k další pumpě?';
	fuel.generation.length = 2e4;
	fuel.compulsoryCar = 0; //Felicia 4ever!!!
	fuel.listeners = {
		onstart: function() {
			S.disable.nitro = true;
			S.disable.PID = true;

			S.fuelTank = 75; //current fuel reserve [g]
			S.nextPumpAt = 0; //distance of next gas station [m]
			S.countdown = 1; //countdown for gas station [s]

			popup(['Žlutý ukazatel vlevo dole je vaše nádrž paliva',
				'Vzdálenost do příští benzínky je napsána vlevo',
				'U pumpy musíte ZASTAVIT, abyste dostali palivo!',
				'Trochu sebou hoďte, jinak vám pumpa zavře - po ujetí prvních 100 m se začne odpočítávat čas!',
				'A zapracujte na své uhlíkové neutralitě - jen ti nejdekarbonizovanější hráči vydrží celých 20 km...'],
				false, false, 570);
		},
		continuous: function() {
			const dCountdown = 100; //"free" distance before countdown begins [m]
			const dTol = 15; //distance tolerance to stop near a pump [m]

			//create next gas pump
			function newPump(gas) { //'gas' = whether the current pump was successfully harvested or missed
				const dPump = 2000; //average distance between pumps [m]
				const dSpread = 500; //spread of dPump [m]
				const vMin = 50/3.6; //minimal average velocity to reach next pump [m/s]

				let d = dPump + (2*Math.random()-1) * dSpread; //new distance [m]
				S.nextPumpAt = S.d + d;
				S.countdown = d/vMin;

				//move current image (if missed), or create new one (if successfully harvested or the 1st time)
				function updateOrPush(id, pos)  {
					let img = S.level.images.find(img => img[0] === id);
					(img && !gas) ? (img[1] = pos) : S.level.images.push([id, pos]);
				}
				updateOrPush('pump', S.nextPumpAt);
				updateOrPush('zn_pump',  S.nextPumpAt-dTol);
				updateOrPush('zn_pump2', S.nextPumpAt+dTol);

				//bounty
				gas && getGas();
			}

			//harvest gasoline (after next pump has been created)
			function getGas() {
				let nextPumpAt = (S.nextPumpAt >= S.level.length) ? S.level.length-1 : S.nextPumpAt; //non-reachable pump?
				const consEst = 6.5; //assumed consumption [l/100km]
				const etaEst = 0.25; //assumed engine efficiency

				let d = nextPumpAt - S.d; //distance to next pump [m]
				let dh = LVL.getAltitude(nextPumpAt) - S.altitude; //elevation to the next pump [m]
				let gas1 = d * consEst * 1e-5 * constants.rho; //estimate gas consumption on the distance [g]
				let gas2 = cars[S.car].m * constants.g * dh / constants.dHsp / etaEst; //estimate consumption on ascent (or savings on descent) [g]
				const gas3 = 15; //something extra to account for acceleration [g]

				S.fuelTank += (gas1 + gas2 + gas3).limit(0, NaN);
				S.d > 0 && flash('⛽');
			}

			//update current state
			let fuelPrev = S.fuelTank;
			S.fuelTank -= S.consumption * config.dt;
			if(S.fuelTank <= 0 && fuelPrev > 0) {
				soundService.play('beep');
				S.fuelTank = 0;
			}
			S.countdown -= config.dt * (S.d >= dCountdown);
			const fuelSTD = 375; //full tank meter [g]
			S.progressBar = S.fuelTank / fuelSTD;
			S.progressBarColor = '#eecc22';

			//events
			(S.countdown <= 0) && newPump(false); //missed countdown
			(Math.abs(S.nextPumpAt-S.d) <= dTol && S.v < 0.1) && newPump(true); //successfully stopped near a pump
			(S.d - S.nextPumpAt > dTol) && newPump(false); //missed it

			//display
			let color = (S.d < dCountdown && 'grey') || (S.countdown < 30 && 'red') || 'black';
			S.onscreenMessage = S.countdown > 30 || S.countdown % 1 < 0.8 ? { //blink if time is running out
				left: 0.01, top: 0.5, textAlign: 'left', textBaseline: 'middle', fillStyle: color, fontSize: 40, fontFamily: 'Tahoma',
				msg: [time2str(S.countdown) + '⏱', (S.nextPumpAt - S.d).toFixed() + ' m']
			} : false;

			//death of thirst
			if(S.fuelTank <= 0 && S.v < 0.1 && Math.abs(S.nextPumpAt-S.d) > dTol) {
				soundService.stopAll();
				S.finished = true;
				S.running = false;
				S.onscreenMessage = {
					top: 0.5, opacity: 0.6, fillStyle: '#707070', fontSize: 60, fontFamily: 'Tahoma',
					msg: ['Felda zhynula žízní...', 'rest in RIP']
				};
			}
		},
		onend: function() {
			CS.secretFuel = true;
			this.secret();
			S.onscreenMessage = {
				opacity: 0.6, fontSize: 28, fontFamily: 'Tahoma',
				msg: ['VÍTĚZSTVÍ!',
					`zvládli jste ujet 20 km`,
					`se spotřebou ${(S.fuel / S.d / constants.rho * 1e5).toFixed(1)} l/100km`]
			};
		},
		secret: drag.listeners.secret
	};
	levels.push(fuel);


	//SPEED CHALLENGE
	let speed = angular.copy(levels.find(i => i.id === 'hills'));
	speed.sublevel = 'hills'; speed.id = 'speed'; speed.name = 'Nebezpečná rychlost';
	speed.description = 'Chytrá bomba vás nutí dodržovat neustále se měnící rychlostní limit. Zvládnete přežít 10 km?';
	speed.generation.length = 1e4;
	speed.generation.noises[0] = [2000, 200]; //eliminate extra long slopes
	speed.generation.baseAlt = 100;
	speed.compulsoryCar = 0; //Felicia 5ever!!!
	speed.listeners = {
		onstart: function() {
			S.disable.nitro = true;
			S.disable.PID = true;

			S.speedLimit = 0; //currently imposed speed limit [m/s]
			S.integrale = 0; //integrale of speed error * dt, which triggers the explosion [m]
			S.lastLimitAt = 0; //distance where last speed limit was imposed [m]
			S.odd = true; //odd (or even) iteration

			popup(['Po 200 m se aktivuje bomba a uvidíte rychlostní limit',
				'Chytrá bomba™ mění své požadavky každých 200 m',
				'Buďte ve střehu a vydržte 10 kilometrů!'],
				false, 1e4, 600);
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
			S.progressBarColor = '#ff0000';

			//beeping sound when in danger
			let rate = S.v > S.speedLimit ? 2 : 0.6;
			(initiated && err > 0 && S.progressBar > 0.4) ? soundService.start('beep', 1, rate) : soundService.end('beep');

			//write speed limits
			let color = err > 0 ? '#ff0000' : '#00aa00';
			S.onscreenMessage = initiated ? {
				left: 0.01, top: 0.5, textAlign: 'left', textBaseline: 'middle', fillStyle: color, fontSize: 40, fontFamily: 'Tahoma',
				msg: [`${(S.v*CS.unitVel.val).toFixed()} ${CS.unitVel.txt}`,
				`→ ${Math.ceil(vMin*CS.unitVel.val)} - ${Math.floor(vMax*CS.unitVel.val)} ${CS.unitVel.txt}`]
			} : null;

			//it goes BOOOOOM !!!
			if(S.integrale > integraleBoom) {
				soundService.stopAll();
				soundService.play('explode');
				S.exploded = true;
				S.finished = true;
				S.running = false;
				S.onscreenMessage = {
					top: 0.5, opacity: 0.6, fillStyle: '#ff6600', fontSize: 60, fontFamily: 'Tahoma',
					msg: ['BOOOOOM !!!', '💥💀']
				};
				//add salt to wound if you stare at your death for too long xD
				window.setTimeout(() => CS.tab === 'game' && S.exploded && popup('ok boomer'), 8e3);
			}
		},
		onend: function() {
			CS.secretSpeed = true;
			this.secret();
			S.onscreenMessage = {
				opacity: 0.6, fontSize: 28, fontFamily: 'Tahoma',
				msg: ['VÍTĚZSTVÍ!',
					`Sandra Bullock přežila celých 10 km`,
					'a Chytré Bombě™ došly baterky!']
			};
		},
		secret: drag.listeners.secret
	};
	levels.push(speed);



	/*TUTORIAL FUNCTIONS are exported here to make 'levels' more concise*/
	let tutorial = levels.find(i => i.id === 'tutorial');

	//define initial conditions
	tutorial.listeners.onstart = function() {
		S.tutorial = true; //has the effect that popups pause the game
		S.disable.PID = true; //hide PID controls
		S.script = 0; //control variable to advance through the story
		S.stalls = 0; //counter of stalls
		S.gear = '2';
		S.v = 10;
		S.f = 45;
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
		else if(S.f >= 7500/60 && S.script === 1) {
			S.script++;

			popup(['Beze změny převodu to nepůjde 😐',
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

			popup(['Výborně! 🏆', 'Nyní bude auto zastaveno, zkuste se rozjet na 30 km/h.',
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
			S.disable.PID = false;

			popup(['Skvělá práce! 🥇', 'Nyní je zpřístupněno vše, můžete si vyzkoušet brzdu (mezerník) či tempomat (tlačítko dole, levý klik zapne, pravý klik či brzda vypne).',
				'A prohlédněte si zbývající údaje: spotřeba paliva, aktuální výkon a točivý moment, ujetá vzdálenost apod.',
				'Tlačítkem Esc se dostanete do hlavního menu, kde můžete spustit normální hru či některou speciální výzvu.',
				'Nezapomeňte si také projít Nastavení, kde lze hru přizpůsobit dle chuti či vyzkoušet další funkce: automatické řazení, řazení myší či detailní údaje.'],
				false, false, 600);
		}
	};

	tutorial.listeners.onend = function() {
		popup(['Dosáhli jste konce dráhy tutorialu. To jsem tedy fakt nečekal!', 'Pokud jste jej ale nedokončili, je třeba jej znovu spustit z menu.'], false, false, 400);
		S.onscreenMessage = {
			opacity: 0.5, fillStyle: '#cc4444', fontSize: 40, fontFamily: 'Comic Sans MS',
			msg: ['Konec cesty xD']
		};
	};

	tutorial.listeners.onstall = function() {
		(S.stalls === 0) && popup(['Motor chcípl!',
			'To se stane buď při startování (je třeba více plynu a rozhodně mít zařazenou jedničku), nebo při zabrždění (je třeba stisknout spojku, nebo naopak zrychlit).'],
			false, false, 500);

		(S.stalls > 0) && popup('Motor chcípl.', true, 1200);
		S.stalls++;
	};
})();
