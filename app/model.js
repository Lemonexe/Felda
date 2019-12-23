/*
	MODEL.JS
	defines M object, which contains all functions related to the simulation itself
*/

const M = {
	//the governing function of simulation - calls a sequence of functions each game tick
	tick: function() {
		M.engineSound();
		M.ambientSound();
		if(!S || !S.running || (S.tutorial && CS.popup)) {return;}

		M.processPedals();
		M.PID();
		M.automat();
		S.pR = M.getPressure(S.altitude);
		M.engine();
		M.forceExchange();

		S.t += config.dt;
		S.d += S.v * config.dt * Math.cos(S.angle);
		LVL.mapPosition(S.d); //get new altitude & angle

		if(S.angle > 0) {
			S.ascension += S.v * config.dt * Math.sin(S.angle);
		}
		S.fuel += S.consumption * config.dt;

		S.firstTick = true;
		S.running && exec(levels[S.level.i].listeners, 'continuous'); //condition because of last tick before end
	},

	//calculations to be performed on game initiation
	initCalculations: function() {
		exec(levels[S.level.i].listeners, 'onstart');

		let eng = cars[S.car].engine;

		//mass of gasoline in chamber per one active rotation, at standard pressure [g]
		S.mFuelPerCycle = (constants.p * eng.V / constants.R / constants.T) * constants.xO2 / eng.lambda / constants.stc * constants.M;
	},

	//turn on the engine starter
	start: function() {
		if(!S.running) {return;}
		if(S.hasOwnProperty('fuelTank') && S.fuelTank <= 0) {return;} //fuel challenge
		let car = cars[S.car];
		if(S.f < car.engine.minRPM && S.starter <= 0) {
			if((S.gear === 'N' || S.clutch < 1e-2)) {
				//set starter timeout
				S.starter = car.engine.starter;
				soundService.play((car.sound && car.sound.start) || 'start');
			}
			else{popup('Nelze startovat bez neutrálu či spojky', true, 1000);}
		}
		else {popup('Není třeba startovat', true, 1000);}
	},

	//shift a gear (gear = string identifying it)
	shift: function(gear) {
		if(!(gear === 'N' || cars[S.car].transmission.gears.hasOwnProperty(gear))) {return;}
		if(S.clutch < 1e-2) {
			S.gear = gear;
			flash(gear);
			soundService.play((cars[S.car].sound && cars[S.car].sound.shift) || 'shift');
		}
		else {popup('Nelze zařadit bez spojky', true, 1000);}
	},

	//process input from pedal controls to actual values of clutch and gas percentage
	processPedals: function() {
		let car = cars[S.car];

		//move pedals if keys are pressed
		let i = config.dt / CS.pedalSpeed; //increment size
		S.clutchSlider += i * S.clutchPedalUp - i * S.clutchPedalDown;
		S.gasSlider    += i * S.gasPedalUp    - i * S.gasPedalDown;
		S.clutchSlider = S.clutchSlider.limit(0,1);
		S.gasSlider    = S.gasSlider.limit(0,1);

		//clutchPedal and gasPedal describe how much are pedals PRESSED
		//BEWARE: slider values are by default (!CS.invertedPedals) inverted - released = 1, pressed = 0
		//if CS.invertedPedals, they are actually direct
		let clutchPedal = CS.invertedPedals ? S.clutchSlider : 1-S.clutchSlider;
		let gasPedal    = CS.invertedPedals ? S.gasSlider    : 1-S.gasSlider;

		//calculate S.gas = how much is gas throttle open (idling gas overrides pedal gas if greater)
		//the standard idleGas value at idleRPM is defined in car, but there is also simple proportional regulation:
		//gas = gas0 + frequency error * slope
		let idleGas = car.engine.idleGas + (car.engine.idleRPM - S.f)*config.idleGasConstant;
		let idleStart = car.engine.idleGas/config.idleGasConstant + car.engine.idleRPM; //RPM when idleGas is zero
		let idling = (S.f <= idleStart) && (gasPedal < idleGas); //whether idling gas kicks in
		S.gas = idling ? idleGas : gasPedal;

		//S.clutch = force transferable by clutch (as fraction of maximum)
		//clutch active interval (e.g. [0.2, 0.8]), the value is inverted once more
		let cInt = cars[S.car].transmission.clutchInt;
		S.clutch = (cInt[1] - clutchPedal) / (cInt[1] - cInt[0]);
		S.clutch = S.clutch.limit(0,1);
	},

	//barometric equation to calculate relative pressure at given altitude
	getPressure: altitude => (typeof altitude === 'number') ? Math.exp(constants.barometric * altitude) : 1,

	//torque function T = T(f), where f is frequency, based on car specs
	//this function doesn't use S, so it can be called independently... (like car showroom)
	// c = car index, f = frequency [Hz], starter = its countdown, gas = gas throttle, nitro = is nitro active, pR = relative pressure
	getTorque: function(c, f, starter, gas, nitro, pR) {
		let car = cars[c];

		//apply starter torque
		if(starter > 0) {return car.engine.starterT;}

		//RPM outside operational bound
		let linF = (p, f) => p[0] * f + p[1]; //linear function

		if(f < car.engine.minRPM) {
			return -linF(car.engine.TdissUnder, f);
		}
		else if(f > car.engine.maxRPM) {
			return -linF(car.engine.TdissOver, f);
		}

		//RPM inside operational bounds
		let sp = car.engine.specs;
		//find such two engine spec points that f is between them
		for(let i = 0; i < (sp.length - 1); i++) {
			if(
				f >= sp[i][0] &&
				f <= sp[i+1][0]
			) {
				//x = weight of the next torque value; 1-x = weight of the previous one
				let x = (f - sp[i][0]) / (sp[i+1][0] - sp[i][0]);
				let Tdiss = x*sp[i+1][1] + (1-x)*sp[i][1];
				let Teng  = x*sp[i+1][2] + (1-x)*sp[i][2];
				Teng *= gas * pR;
				if(nitro && f > car.engine.idleRPM) {Teng *= constants.N2O;}

				return Teng - Tdiss;
			}
		}
	},

	//calculate all current values describing engine output
	engine: function() {
		//fuel challenge
		S.hasOwnProperty('fuelTank') && S.fuelTank <= 0 && (S.gas = 0);

		//calculate torque, multiply it by relative pressure and then convert it to power
		S.T = M.getTorque(S.car, S.f, S.starter, S.gas, S.nitro, S.pR);
		S.P = S.T * 2*Math.PI * S.f;

		//countdown starter torque
		if(S.starter > 0) {
			S.starter -= config.dt;
			if(S.f > cars[S.car].engine.idleRPM) {
				S.starter = 0;
				soundService.stop('start');
			}
		}

		let activeCycles = 2 / cars[S.car].engine.stroke; //fraction of rotations w/ ignition to all rotations
		S.consumption = S.pR * S.mFuelPerCycle * S.f * activeCycles  * S.gas; //calculated theoretical consumption [g/s]
		if(S.nitro && S.f > cars[S.car].engine.idleRPM) {S.consumption *= constants.N2O;}
		S.rawPower = S.consumption * constants.dHsp; //reaction heat flow [W]
		S.eta = S.P / S.rawPower; //overall efficiency
	},

	//calculate dissipative & gravitational forces on car
	carForces: function() {
		let car = cars[S.car];

		//dissipative forces
		let Fc = -(car.transmission.loss.a + car.transmission.loss.b * S.pR * S.v**2);

		//brakes
		if(S.brakes && !S.disable.brakes) {
			Fc -= car.m * constants.g * car.transmission.friction;
		}

		//gravity
		Fc -= car.m * constants.g * Math.sin(S.angle);
		return Fc;
	},

	//the most complicated function - it calculates exchange of forces between car and engine and the effect of forces
	forceExchange: function() {
		//backing up old velocity for acc calculation and frequency for stall detection
		let oldv = S.v;
		let oldf = S.f;
		let car = cars[S.car];

		//get forces on car		
		let Fc = M.carForces();
		S.Fc = Fc;

		//torque on engine
		let Te = S.T;

		//FORCE EXCHANGE. If neutral, forces are independent and the whole if statement is skipped
		if(S.gear !== 'N') {
			//effective wheel radius
			var re = car.transmission.r / car.transmission.gears.fix / car.transmission.gears[S.gear];

			//torque on car
			let Tc = Fc * re;

			//moment of inertia of car
			let Ic = car.m * re**2;

			//torque transferable through clutch
			var Tclutch = car.transmission.TclutchMax * S.clutch;
			if(S.nitro && S.f > car.engine.idleRPM) {Tclutch *= constants.N2O;}

			//car frequency (frequency on the transmission end of clutch, also ideal frequency for engine, will converge as fast as clutch torque enables it)
			let fc = S.v / (2*Math.PI * re);
			var df = S.f - fc; //frequency difference on clutch

			//torques for equal distribution
			let TeEq = (Te + Tc) / (1 + Ic / car.engine.I);
			let TcEq = (Te + Tc) / (1 + car.engine.I / Ic);

			//difference between actual torque and equalized torque - how much should be passed through clutch from engine & car
			let dTe = Te - TeEq;
			let dTc = Tc - TcEq;

			//torque passing from engine to car (is negative if passing from car to engine)
			var Tpass = dTe - dTc;

			//SMOOTH MODE - no slipping, engine & car act together
			if(
				df < config.clutchTolerance &&
				df > -config.clutchTolerance &&
				Tpass < Tclutch &&
				Tpass > -Tclutch
			) {
				//this isn't the final force effect, just equalization of frequencies! feq = equal freqeuncy
				let feq = (Ic*fc + car.engine.I*S.f) / (Ic + car.engine.I);
				S.v = feq * 2*Math.PI * re;
				S.f = feq;
				//forces to be used later
				Te = TeEq;
				Tc = TcEq;
			}
			//FRICTION MODE - when frequencies are unequal, full clutch force will be used
			//yes, even if Tpass doesn't exceed Tclutch! Clutch doesn't just serve to accelerate engine and car proportionally, but also to actually converge them first.
			else {
				Tpass = Tclutch * Math.sign(Tpass);
				let Tinc = Math.sign(df) * Tclutch/2; //torque that IS transfered from engine to car through clutch. It adds to Te and Tc, and TRIES to bring them closer
				Te -= Tinc;
				Tc += Tinc;
			}

			//back from car torque to car force
			Fc = Tc / re;
		}

		//effects of forces + corrections
		S.f += Te / (2*Math.PI * car.engine.I) * config.dt;
		S.v += Fc / car.m * config.dt;
		if(S.f < 0) {S.f = 0;}
		if(S.v < 0) {S.v = 0;}

		//acceleration [m/s^2] has to be calculated this way, because (Fc/car.m) can be negative while car is still
		S.a = (S.v - oldv) / config.dt;

		//just for advanced statistics
		S.Tclutch = Tclutch || 0;
		S.Tpass = Tpass || 0;
		S.df = (typeof df !== 'undefined') ? df : false;
		S.re = (typeof re !== 'undefined') ? re : false;
		S.FcFinal = Fc;
		S.TeFinal = Te;

		//kinetic energy of vehicle (moment of inertia of wheels and transmission is neglected) & kinetic energy of engine
		S.Ek = 0.5 * car.m * S.v**2;
		S.Eke = 0.5 * car.engine.I * (2*Math.PI * S.f)**2;

		//detect engine stall
		if(S.f === 0 && oldf !== 0) {
			exec(levels[S.level.i].listeners, 'onstall');
			M.remPID();
		}
	},

	//operation of cruise control as a PID controller (proportional–integral–derivative controller)
	//in our case, derivative part isn't important
	PID: function() {
		//cruise control is off
		if(!S.vTarget || !CS.enablePID) {return;}
		//turn off
		if(S.brakes || S.f > cars[S.car].engine.redlineRPM) {
			M.remPID();
			return;
		}
		//pause
		if(S.clutch < 0.99 || S.gear === 'N' || S.nitro) {
			S.PID = [0, 0, 0];
			return;
		}

		//calculation of gas throttle
		let [r0, Ti, Td] = cars[S.car].engine.PID; //PID parameters
		r0 /= cars[S.car].transmission.gears[S.gear]; //r0 (gain) is corrected by gear value. Lower gear = more sensitive system, therefore lower gain
		let [ep, int] = S.PIDmemory; //error previous, integral
		let dt = config.dt;
		let e = S.vTarget - S.v; //velocity difference [m/s] = ERROR VALUE

		let cap = config.integratorCap * Ti / r0; //calculate cap of integration sum [m] from the specified gas cap
		int = (int + e*dt).limit(-cap, cap); //integrale of error
		let der = (e - ep)/dt; //derivation of error

		//ＡＥＳＴＨＥＴＨＩＣ　ＣＯＤＥ
		let P = r0 * e;
		let I = r0 * int / Ti;
		let D = r0 * der * Td;

		S.PID = [P, I, D];

		//gas value = CORRECTION
		let gas = P + I + D;
		gas = gas.limit(0, 1);
		
		//update logs
		S.PIDmemory[0] = e;
		S.PIDmemory[1] = int;

		//PID acts after pedals, so it will only set the final gas value if it's greater than the pedal value
		(gas > S.gas) && (S.gas = gas);
	},
	//set target velocity for cruise control, also PID reset history
	setPID: function() {
		if(S.v > 3) {
			S.vTarget = S.v;
			S.PIDmemory = [0, 0];
		}
		else {
			popup('Lze jen za jízdy', true, 1000);
		}
	},
	//remove target velocity (turn off PID, delete history)
	remPID: function() {
		if(S.vTarget) {
			S.vTarget = false;
			S.PIDmemory = [0, 0];
			flash('🚫');
		}
	},

	//a very simple function to shift gears when RPM exceed bounds (which are a property of car)
	//no clutch is used, gears are thrown in "dirty"
	automat: function() {
		if(!CS.enableAutomat || S.tutorial || S.f < 10 || S.clutch < 0.99 || S.gear === 'N') {return;}
		let trans = cars[S.car].transmission;
		
		if     (S.f < trans.automat[0]) {var newGear = String(Number(S.gear) - 1);}
		else if(S.f > trans.automat[1]) {var newGear = String(Number(S.gear) + 1);}
		else {return;}

		if(trans.gears.hasOwnProperty(newGear)) {
			S.gear = newGear;
			flash(newGear);
			soundService.play((cars[S.car].sound && cars[S.car].sound.shift) || 'shift');
		}
	},

	//update all continuous sounds from car
	engineSound: function() {
		if(!S) {return;}

		let car = cars[S.car];
		let paused = !S.running || (S.tutorial && CS.popup);

		//engine sounds
		let volume = (0.5 + 0.5*S.gas) * (0.5 + 0.5*S.f/car.engine.maxRPM);
		volume = volume.limit(0,1);
		let rate = 0.3 + 2*S.f/car.engine.maxRPM;
		let file = (car.sound && car.sound.engine) || 'engine';

		//update the looped sound with new volume and playbackRate, or stop it altogether
		if(!paused && S.f > 2) {
			soundService.start(file, volume, rate);
		}
		else {soundService.stop(file);}

		file = (car.sound && car.sound.nitro) || 'nitro';
		//update or end looping of nitro
		if(!paused && S.nitro && S.f > car.engine.minRPM) {
			volume = 0.3 + 0.7*S.gas;
			soundService.start(file, volume);
		}
		else {soundService.end(file);}

		file = (car.sound && car.sound.brake) || 'brake';
		//update or end looping of brakes
		if(!paused && S.brakes && !S.disable.brakes && S.v > 1) {
			soundService.start(file);
		}
		else {soundService.end(file);}
	},

	//update ambient sounds, each item has it's own instance
	ambientSound: function() {
		if(!S) {return;}

		let paused = !S.running || (S.tutorial && CS.popup) || !CS.enableAmbientSounds || !CS.enableGraphics; //graphics because it could be pretty confusing

		let iarr = Math.floor(S.d / config.imgLoadingArea); //index of image area array

		//for each image in current image area array
		for(let item of S.level.images[iarr] || []) {
			let imgObj = imgs[item[0]]; //get the image object from 'imgs'
			if(!imgObj.hasOwnProperty('sound')) {continue;} //this decoration doesn't have any sound

			let dd = item[1] - S.d; //how far ahead is the image [m]

			//linear extinction of sound amplitude
			let reach = sounds[imgObj.sound].reach || 50; //maximal reach of sound [m]
			let volume = 1 - Math.abs(dd) / reach;

			//Doppler effect
			let dMin = config.dDecoration; //how far from road are decorations placed [m]
			let v = 1 / Math.sqrt(dd*dd + dMin*dMin) * dd * S.v; //velocity towards the object: v = dc/dt, where c is Euclidean distance
			let rate = 1 + v / config.vSound; //new frequency
			rate = rate.limit(1e-2, 1e2);
			
			//update or start this instance, where image position will act as a "unique" instance id
			//note.: if there are two images with equal position, they will share the instance. That's not a problem!
			if(!paused && volume > 0) {soundService.start(imgObj.sound, volume, rate, item[1]);}
			else {soundService.end(imgObj.sound, item[1]);}
		}

		soundService.cull(); //remove expired instances
	}
};
