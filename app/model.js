/*
	MODEL.JS
	defines M object, which contains all functions related to the simulation itself
*/

const M = {
	//the governing function of simulation - calls a sequence of functions each game tick
	tick: function() {
		if(!S || !S.running || (S.tutorial && CS.popup)) {return;}

		M.processPedals();
		M.getPressure();
		M.engine();
		M.forceExchange();

		S.t += config.dt;
		S.d += S.v * config.dt * Math.cos(S.angle);
		L.mapPosition(S.d); //get new altitude & angle

		if(S.angle > 0) {
			S.ascension += S.v * config.dt * Math.sin(S.angle);
		}
		S.fuel += S.consumption * config.dt;

		S.firstTick = true;
		exec(levels[S.level.i].listeners.continuous);
	},

	//calculations to be performed on game initiation
	initCalculations: function() {
		let eng = cars[S.car].engine;

		// mass of gasoline in chamber per one cycle, at standard pressure [g]
		S.mFuelPerCycle = (constants.p * eng.V / constants.R / constants.T) * constants.xO2 / eng.lambda / constants.stc * constants.M;

		// constant of barometric equation as pR = exp(const * h) [m^-1]
		S.barometricConstant = -constants.g * constants.Mair / constants.R / constants.T;

		//constants of extinction lines 1 (minRPM) and 2 (maxRPM)
		let k1 =  1 / (eng.minExt[1] - eng.minExt[0]);
		let q1 = -k1 * eng.minExt[0];
		let k2 = -1 / (eng.maxExt[1] - eng.maxExt[0]);
		let q2 = -k2 * eng.maxExt[1];
		S.extinction = [k1, q1, k2, q2];
	},

	//turn on the engine starter
	start: function() {
		if(S.f < cars[S.car].engine.minRPM) {
			if((S.gear === 'N' || S.clutch < 1e-2)) {
				//set starter timeout
				S.starter = cars[S.car].engine.starter;
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

		//S.gas = how much is gas throttle open
		let idling = (S.f <= car.engine.idleRPM) && (gasPedal < car.engine.idleGas); //whether idling gas kicks in
		S.gas = idling ? car.engine.idleGas : gasPedal;

		//extinction lines for min and max RPM
		//torque multiplier grows linearly from minExt[0] (0) to minExt[1] (1), then falls from maxExt[0] (1) to maxExt[1] (0)
		let ext = S.extinction;
		S.gas *= (ext[0]*S.f + ext[1]).limit(0,1);
		S.gas *= (ext[2]*S.f + ext[3]).limit(0,1);

		//S.clutch = force transferable by clutch (as fraction of maximum)
		//clutch active interval (e.g. [0.2, 0.8]), the value is inverted once more
		let cInt = cars[S.car].transmission.clutchInt;
		S.clutch = (cInt[1] - clutchPedal) / (cInt[1] - cInt[0]);
		S.clutch = S.clutch.limit(0,1);
	},

	//barometric equation to calculate relative pressure at given altitude
	getPressure: () => (S.pR = (typeof S.altitude === 'number') ? Math.exp(S.barometricConstant * S.altitude) : 1),

	//torque function T = T(f), where f is frequency, based on car specs
	//this function doesn't use S, so it can be called independently... (like car showroom)
	// c = car index, f = frequency [Hz], starter = its countdown, gas = gas throttle, nitro = is nitro active
	getTorque: function(c, f, starter, gas, nitro) {
		let car = cars[c];

		//apply starter torque
		if(starter > 0) {return car.engine.starterT;}

		//RPM outside operational bounds
		if(f < car.engine.minRPM) {
			return -car.engine.TdissUnder(f);
		}
		else if(f > car.engine.maxRPM) {
			return -car.engine.TdissOver(f);
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
				Teng *= gas;
				if(nitro && f > car.engine.idleRPM) {Teng *= constants.N2O;}

				return Teng - Tdiss;
			}
		}
	},

	//calculate all current values describing engine output
	engine: function() {
		//calculate torque, multiply it by relative pressure and then convert it to power
		S.T = M.getTorque(S.car, S.f, S.starter, S.gas, S.nitro) * S.pR;
		S.P = S.T * 2*Math.PI * S.f;

		//countdown starter torque
		if(S.starter > 0) {
			S.starter -= config.dt;
			if(S.f > cars[S.car].engine.idleRPM) {S.starter = 0;}
		}

		S.consumption = S.pR * S.mFuelPerCycle * S.f / 2 * S.gas; //calculated theoretical consumption [g/s]
		if(S.nitro && S.f > cars[S.car].engine.idleRPM) {S.consumption *= constants.N2O;}
		S.rawPower = S.consumption * constants.dHsp; //reaction heat flow [W]
		S.ny = S.P / S.rawPower; //efficiency
	},

	//calculate dissipative & gravitational forces on car
	carForces: function() {
		let car = cars[S.car];

		//dissipative forces
		let Fc = -(car.transmission.loss.a + car.transmission.loss.b * S.v**2);

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

		//acceleration has to be calculated this way, because (Fc/car.m) can be negative while car is still
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
			exec(levels[S.level.i].listeners.onstall);
		}
	}
};
