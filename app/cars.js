/*
	CARS.JS
	defines car objects
*/

const cars = [
	{
		//these are just for description
		name: 'Škoda Felicia',
		year: 1996,
		engineName: '1.3 MPI 50kW',

		//everything related to rendering
		graphic: {
			//image of car, image of wheels
			img: 'felicia',
			imgWH: 'feliciaWH',
			width: 3.855, //real length of car [m]
			height: 1.446, //real height of car [m]
			r: 0.28, //apparent radius of wheel, should be same as in transmission [m]
			//positions of all wheels in pixels (of original image) [x, y]
			wheels: [
				[65, 121], [316, 121]
			]
		},

		//mass [kg] curb weight + driver
		m: 935+75,

		//describes clutch, transmission and dissipative forces on entire car
		transmission: {
			clutchInt: [0.2, 0.8], //active slider interval for clutch
			TclutchMax: 250, //maximal torque of clutch
			//coefficient of friction for braking
			friction: 0.7,
			//coefficients for dissipative forces (constant and quadratic)
			loss: {
				a: 250, //friction constant (-> force ~ v^0)  [N]
				b: 0.51 //drag constant (-> force ~ v^2) [kg/m]
			},
			r: 0.28, //radius of wheel [m]
			//gear ratios: 'fix' is required, otherwise there can be any number of gears, as long as there are keys binded to activate them
			gears: {
				fix: 4.167,
				1: 3.308,
				2: 1.913,
				3: 1.267,
				4: 0.927,
				5: 0.717
			},
			automat: [1500/60, 5000/60] //span of permissible frequency for automatic transmission [Hz]
		},

		//describes engine power and dissipative forces
		engine: {
			lambda: 1.01, //oxygen excess
			V: 1.289, //engine displacement [l],
			I: 0.15, //engine moment of inertia [kg*m2]
			minRPM: 500/60,  //[Hz] no power below this point
			maxRPM: 8000/60, //[Hz] no power above this point
			redlineRPM: 6000/60, //[Hz] warning shows up and PID turns off
			vibRPM: 5000/60, //[Hz] everything starts to vibrate insanely
			//function T(f) for dissipative torque [N*m] if RPM < minRPM  or RPM > maxRPM
			TdissUnder: f => 15,
			TdissOver: f => 3*f - 280,
			idleRPM: 750/60, //[Hz] if below this RPM, idleGas kicks in
			idleGas: 0.186, //standard gas throttle during idling (but it will be adjusted in model)
			starter: 2, //how long does starting take [s]
			starterT: 9, //starter torque [N*m]
			PID: [0.5, 10, 1], //PID parameters [r0, Ti, Td] (see model.js)
			//table of engine specifications as [frequency, dissipative torque, engine torque] with frequency in Hz (RPM/60), torque in N*m
			//it is imperative that specs cover the whole interval between minRPM and maxRPM
			specs: [
				[500/60,  16,  86 ],
				[1000/60, 18,  96 ],
				[1500/60, 20,  103],
				[2000/60, 23,  111],
				[2500/60, 26,  119],
				[3000/60, 30,  127],
				[3500/60, 35,  137],
				[4000/60, 40,  145],
				[4500/60, 46,  148],
				[5000/60, 53,  148],
				[5500/60, 61,  142],
				[6000/60, 70,  140],
				[6500/60, 80,  137],
				[7000/60, 92,  133],
				[7500/60, 106, 129],
				[8000/60, 120, 120]
			]
		}
	},

	{
		name: 'Škoda 105',
		year: 1977,
		engineName: '34kW',

		graphic: {
			img: 'Skoda105',
			imgWH: 'Skoda105WH',
			width: 4.160,
			height: 1.452,
			r: 0.297,
			wheels: [
				[290, 351], [1020, 351]
			]
		},

		m: 855+75,

		transmission: {
			clutchInt: [0.2, 0.8],
			TclutchMax: 180,
			friction: 0.6,
			loss: {
				a: 230,
				b: 0.52
			},
			r: 0.297,
			gears: {
				fix: 4.220,
				1: 3.800,
				2: 2.120,
				3: 1.410,
				4: 0.960
			},
			automat: [1500/60, 4500/60]
		},

		engine: {
		lambda: 1,
		V: 1.046,
		I: 0.12,
		minRPM: 500/60, 
		maxRPM: 7000/60,
		redlineRPM: 5500/60,
		vibRPM: 4500/60,
		TdissUnder: f => 12,
		TdissOver: f => 2*f - 148.3,
		idleRPM: 750/60,
		idleGas: 0.191,
		starter: 3,
		starterT: 4,
		PID: [0.7, 10, 0.5],
			specs: [
				[500/60,  13, 66 ],
				[1000/60, 14, 75 ],
				[1500/60, 16, 82 ],
				[2000/60, 18, 87 ],
				[2500/60, 21, 93 ],
				[3000/60, 24, 97 ],
				[3500/60, 28, 100],
				[4000/60, 33, 103],
				[4500/60, 39, 106],
				[5000/60, 46, 110],
				[5500/60, 54, 112],
				[6000/60, 63, 112],
				[6500/60, 73, 103],
				[7000/60, 85, 85 ]
			]
		}
	},

	{
		name: 'Škoda Octavia II',
		year: 2005,
		engineName: '2.0 FSI 110kW',

		graphic: {
			img: 'octavia',
			imgWH: 'octaviaWH',
			width: 4.572,
			height: 1.487,
			r: 0.328,
			wheels: [
				[182, 196], [616, 196]
			]
		},

		m: 1350+75,

		transmission: {
			clutchInt: [0.15, 0.85],
			TclutchMax: 500,
			friction: 0.9,
			loss: {
				a: 350,
				b: 0.52
			},
			r: 0.328,
			gears: {
				fix: 3.647,
				1: 3.780,
				2: 2.270,
				3: 1.520,
				4: 1.190,
				5: 0.970,
				6: 0.820
			},
			automat: [1500/60, 6000/60]
		},

		engine: {
		lambda: 1.01,
		V: 1.984,
		I: 0.25,
		minRPM: 500/60, 
		maxRPM: 8500/60,
		redlineRPM: 6500/60,
		vibRPM: 5500/60,
		TdissUnder: f => 23,
		TdissOver: f => 4*f - 346.6,
		idleRPM: 750/60,
		idleGas: 0.165,
		starter: 1.6,
		starterT: 25,
		PID: [0.4, 9, 1],
			specs: [
				[500/60,  24,  134],
				[1000/60, 27,  175],
				[1500/60, 30,  204],
				[2000/60, 34,  220],
				[2500/60, 39,  235],
				[3000/60, 45,  244],
				[3500/60, 52,  252],
				[4000/60, 60,  259],
				[4500/60, 69,  266],
				[5000/60, 79,  274],
				[5500/60, 91,  278],
				[6000/60, 105, 280],
				[6500/60, 122, 282],
				[7000/60, 142, 277],
				[7500/60, 165, 265],
				[8000/60, 191, 246],
				[8500/60, 220, 220]
			]
		}
	},

	{
		name: 'Chevrolet Camaro',
		year: 2017,
		engineName: '6.2 V8 339kW',

		graphic: {
			img: 'camaro',
			imgWH: 'camaroWH',
			width: 4.784,
			height: 1.364,
			r: 0.351,
			wheels: [
				[166, 177], [698, 177]
			]
		},

		m: 1671+75,

		transmission: {
			clutchInt: [0.1, 0.9],
			TclutchMax: 1800,
			friction: 1.2,
			loss: {
				a: 440,
				b: 0.72
			},
			r: 0.351,
			gears: {
				fix: 3.730,
				1: 2.660,
				2: 1.780,
				3: 1.300,
				4: 1.000,
				5: 0.740,
				6: 0.500
			},
			automat: [1500/60, 6000/60]
		},

		engine: {
		lambda: 1.01,
		V: 6.162,
		I: 0.80,
		minRPM: 500/60, 
		maxRPM: 8500/60,
		redlineRPM: 6500/60,
		vibRPM: 5500/60,
		TdissUnder: f => 70,
		TdissOver: f => 8*f - 450,
		idleRPM: 750/60,
		idleGas: 0.170,
		starter: 1.5,
		starterT: 100,
		PID: [0.25, 8, 0.5],
			specs: [
				[500/60,  75,  431],
				[1000/60, 84,  507],
				[1500/60, 93,  568],
				[2000/60, 106, 627],
				[2500/60, 121, 682],
				[3000/60, 140, 728],
				[3500/60, 162, 767],
				[4000/60, 186, 801],
				[4500/60, 214, 831],
				[5000/60, 245, 848],
				[5500/60, 283, 862],
				[6000/60, 326, 866],
				[6500/60, 379, 861],
				[7000/60, 441, 843],
				[7500/60, 512, 808],
				[8000/60, 593, 755],
				[8500/60, 683, 683]
			]
		}
	}
];
