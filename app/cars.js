/*
	CARS.JS
	defines car objects
*/

const cars = [
	{
		//these are just for description
		id: 'felicia', //id is almost useless
		name: 'Škoda Felicia',
		year: 1996,
		engineName: '1.3 MPI 50kW',
		engineType: 'piston',
		//showroom text as array of paragraphs
		description: [
			'Tento legendární hatchback z mladoboleslavské produkce je vlajkovou lodí Felda simulátoru, neboť dlouho byl jediným zde implementovaným automobilem.',
			'Felda se vyráběla v letech 1994 - 2001 a zde je představena její nejpoužívanější motorizace. Ta by si měla bez obtíží poradit i s Alpami.'
		],

		//everything related to rendering
		graphic: {
			//image of car, image of wheels
			img: 'felicia',
			imgWH: 'feliciaWH',
			width: 3.855, //real length of car [m]
			height: 1.446, //real height of car [m]
			r: 0.28, //apparent radius of wheel, should be same as in transmission [m]
			//positions of all wheel centers in pixels (of original image) [x, y]
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
			//spans of frequency limits [Hz] for automatic transmission defined at 0%, 100% gas : lower 0%, upper 0%, lower 100%, upper 100%
			automat: [1000/60, 2000/60, 2600/60, 5100/60]
		},

		//describes engine power and dissipative forces
		engine: {
			stroke: 4, //four stroke engine, meaning 2/4 = 0.5 ignitions per revolution
			lambda: 1.01, //oxygen excess
			V: 1.289, //engine displacement [l],
			I: 0.15, //engine moment of inertia [kg*m2]
			minRPM: 500/60,  //[Hz] no power below this point
			maxRPM: 8000/60, //[Hz] no power above this point
			redlineRPM: 6000/60, //[Hz] warning shows up and PID turns off
			vibRPM: 5000/60, //[Hz] everything starts to vibrate insanely
			//dissipative torque [N*m] as a function of frequency [Hz], if (RPM < minRPM) or (RPM > maxRPM), as [a,b] constants for T = a*f + b
			TdissUnder: [0, 15],
			TdissOver: [3, -280],
			idleRPM: 750/60, //[Hz] if below this RPM, idleGas kicks in
			idleGas: 0.204, //standard gas throttle during idling (but it will be adjusted in model)
			starter: 2, //how long does starting take [s]
			starterT: 9, //starter torque [N*m]
			PID: [0.5, 10, 0], //PID parameters [r0, Ti, Td] (see model.js)
			//table of engine specifications as [frequency, dissipative torque, engine torque] with frequency in Hz (RPM/60), torque in N*m
			//it is imperative that specs cover the whole interval between minRPM and maxRPM
			specs: [
				[500/60,  16,  71 ],
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
		id: 'Skoda105',
		name: 'Škoda 105',
		year: 1977,
		engineName: '34kW',
		engineType: 'piston',
		description: [
			'Kdo by neznal toto vozidlo socialistického lidu, které je ikonou dávno minulé éry?',
			'Modelovou řadu Škoda 742 vyráběl AZNP v letech 1976 - 1990, dnes už tedy bývají poněkud rezavé.',
			'Zdolávat horské vrcholy raději nezkoušejte, neboť stopětka je nejslabší motorizací z této řady.'
		],

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
			automat: [1000/60, 2000/60, 2300/60, 5300/60]
		},

		engine: {
			stroke: 4,
			lambda: 1,
			V: 1.046,
			I: 0.12,
			minRPM: 500/60,
			maxRPM: 7000/60,
			redlineRPM: 5500/60,
			vibRPM: 4500/60,
			TdissUnder: [0, 12],
			TdissOver: [2, -148.3],
			idleRPM: 750/60,
			idleGas: 0.206,
			starter: 3,
			starterT: 4,
			PID: [0.7, 10, 0],
			specs: [
				[500/60,  13, 56 ],
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
		id: 'C2CV',
		name: 'Citroën 2CV',
		year: 1968,
		engineName: '21kW',
		engineType: 'piston',
		description: [
			'Milovníci pomalé jízdy se mohou vyřádit v tomto fracouzském vozítku známém jako "kachna".',
			'O oblíbenosti tohoto minimalistického modelu svědčí to, že kačen bylo vyrobeno po celém světě více než 5 milionů.',
			'Závodní bourák to úplně není, ale který jiný automobil vám nabídne možnost vozit vejce přes čerstvě zorané pole bez rozbití?'
		],
		graphic: {
			img: 'C2CV',
			imgWH: 'C2CVWH',
			WHbottom: true, //wheels will be drawn behind car (otherwise before)
			width: 3.875,
			height: 1.580,
			r: 0.300,
			wheels: [
				[218, 370], [926, 370]
			]
		},
		m: 610+75,
		transmission: {
			clutchInt: [0.25, 0.75],
			TclutchMax: 100,
			friction: 0.5,
			loss: {
				a: 165,
				b: 0.52
			},
			r: 0.300,
			gears: {
				fix: 3.625,
				1: 7.411,
				2: 3.573,
				3: 2.133,
				4: 1.474
			},
			automat: [1000/60, 2000/60, 2300/60, 5800/60]
		},
		engine: {
			stroke: 4,
			lambda: 1,
			V: 0.602,
			I: 0.07,
			minRPM: 500/60,
			maxRPM: 8000/60,
			redlineRPM: 6500/60,
			vibRPM: 5000/60,
			TdissUnder: [0, 6],
			TdissOver: [2, -200.67],
			idleRPM: 800/60,
			idleGas: 0.264,
			starter: 3.5,
			starterT: 2,
			PID: [1.1, 12, 0],
			specs: [
				[500/60,  7,  24.0],
				[1000/60, 8,  32.0],
				[1500/60, 9,  37.2],
				[2000/60, 10, 42.9],
				[2500/60, 12, 47.8],
				[3000/60, 14, 51.7],
				[3500/60, 16, 55.0],
				[4000/60, 19, 57.8],
				[4500/60, 22, 60.1],
				[5000/60, 26, 63.0],
				[5500/60, 31, 66.5],
				[6000/60, 36, 69.4],
				[6500/60, 42, 72.9],
				[7000/60, 49, 75.0],
				[7500/60, 57, 75.0],
				[8000/60, 66, 66.0]
			]
		}
	},

	{
		id: 'octavia',
		name: 'Škoda Octavia II',
		year: 2005,
		engineName: '2.0 FSI 110kW',
		engineType: 'piston',
		description: [
			'Nejvýkonnější atmosferický motor mladoboleslavské produkce si našel cestu do druhé generace oblíbeného rodinného sedanu.',
			'Octavia II se vyráběla v letech 2004 - 2013, avšak v roce 2009 se jí bohužel přihodila tragédie jménem "facelift".'
		],

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
			automat: [1000/60, 2000/60, 2400/60, 6200/60]
		},

		engine: {
			stroke: 4,
			lambda: 1.01,
			V: 1.984,
			I: 0.25,
			minRPM: 500/60,
			maxRPM: 8500/60,
			redlineRPM: 6500/60,
			vibRPM: 5500/60,
			TdissUnder: [0, 23],
			TdissOver: [4, -346.6],
			idleRPM: 750/60,
			idleGas: 0.168,
			starter: 1.6,
			starterT: 25,
			PID: [0.4, 9, 0],
			specs: [
				[500/60,  24,  128],
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
		id: 'camaro',
		name: 'Chevrolet Camaro',
		year: 2017,
		engineName: '6.2 V8 339kW',
		engineType: 'piston',
		description: [
			'\'Murica fuck yeah!',
			'Legendární detroitský V8, hypertrofovaný až do neskutečných šesti litrů, je jednou z nejvýkonnějších atmosfér na trhu. Užívejte si trhání asfaltu!'
		],

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
			automat: [1000/60, 2000/60, 2800/60, 6200/60]
		},

		engine: {
			stroke: 4,
			lambda: 1.01,
			V: 6.162,
			I: 0.80,
			minRPM: 500/60,
			maxRPM: 8500/60,
			redlineRPM: 6500/60,
			vibRPM: 5500/60,
			TdissUnder: [0, 70],
			TdissOver: [8, -450],
			idleRPM: 750/60,
			idleGas: 0.180,
			starter: 1.5,
			starterT: 100,
			PID: [0.25, 8, 0],
			specs: [
				[500/60,  75,  375],
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
	},

	{
		id: 'RX8',
		name: 'Mazda RX-8',
		year: 2008,
		engineName: '1.3 170kW',
		engineType: 'wankel',
		description: [
			'Zapomeňte na písty a pořádně to roztočte s Wankelovým rotačním motorem!',
			'Tato pohroma silnic z Hirošimy se vyráběla v letech 2003 - 2012. Emisní limity sice posledního wankela vyřadily z trhu, ale v našich srdcích se bude točit navždy!'
		],

		graphic: {
			img: 'RX8',
			imgWH: 'RX8WH',
			width: 4.435,
			height: 1.340,
			r: 0.330,
			wheels: [
				[123, 136], [482, 136]
			]
		},

		m: 1323+75,

		transmission: {
			clutchInt: [0.1, 0.9],
			TclutchMax: 600,
			friction: 1.0,
			loss: {
				a: 330,
				b: 0.52
			},
			r: 0.330,
			gears: {
				fix: 4.444,
				1: 3.760,
				2: 2.269,
				3: 1.645,
				4: 1.187,
				5: 1.000,
				6: 0.843
			},
			automat: [1200/60, 2500/60, 3500/60, 8400/60]
		},

		engine: {
			stroke: 2,
			lambda: 1.01,
			V: 1.308,
			I: 0.15,
			minRPM: 500/60,
			maxRPM: 1e4/60,
			redlineRPM: 9000/60,
			vibRPM: 8500/60,
			TdissUnder: [0, 15],
			TdissOver: [4, -460.67],
			idleRPM: 1000/60,
			idleGas: 0.160,
			starter: 1.5,
			starterT: 15,
			PID: [0.4, 8, 0],
			specs: [
				[500/60,  16,  57.0 ],
				[1000/60, 18,  112.7],
				[1500/60, 20,  162.1],
				[2000/60, 23,  188.8],
				[2500/60, 26,  206.0],
				[3000/60, 30,  219.5],
				[3500/60, 35,  231.2],
				[4000/60, 40,  241.3],
				[4500/60, 46,  251.3],
				[5000/60, 53,  261.4],
				[5500/60, 61,  272.0],
				[6000/60, 70,  280.6],
				[6500/60, 80,  289.2],
				[7000/60, 92,  299.0],
				[7500/60, 106, 309.8],
				[8000/60, 122, 321.8],
				[8200/60, 129, 327.0],
				[8500/60, 140, 324.1],
				[9000/60, 160, 303.0],
				[9500/60, 182, 264.0],
				[1e4/60 , 206, 206.0]
			]
		}
	},

	{
		id: 'cow', name: 'Crazy Cow', year: 2345, engineName: '', engineType: 'cow',
		description: [`Tur domácí (Bos primigenius f. taurus) je domestikovaný sudokopytnatý savec celosvětově chovaný pro mnohostranný hospodářský užitek.
			Společně s kurem domácím jde v celosvětovém měřítku o nejpočetnější druh chovaného hospodářského zvířete.`],
		sound: {start: 'explode', engine: 'cowcar', shift: 'beep', brake: 'prejezd', nitro: 'brake'},
		graphic: {
			img: 'cowcar', imgWH: 'cowcar',
			width: 4, height: 1.5, r: 0.5,
			wheels: [[110, 205], [270, 205]]
		},
		m: 700,
		transmission: {
			clutchInt: [0.05, 0.9],
			TclutchMax: 2000,
			friction: 0.6,
			loss: {a: 700, b: 0.47},
			r: 0.5,
			gears: {fix: 3.5, 1: 0.863, 2: 1.044, 3: 1.289, 4: 1.693, 5: 2.722, 6: 4.643},
			automat: [4000/60, 2500/60, 2000/60, 8000/60]
		},

		engine: {
			stroke: 15, lambda: 1.01, V: 100, I: 4,
			minRPM: 500/60, maxRPM: 1e4/60, redlineRPM: 8500/60, vibRPM: 6000/60,
			TdissUnder: [0, 220], TdissOver: [4, -566.67],
			idleRPM: 700/60, idleGas: 1,
			starter: 1, starterT: 1500,
			PID: [0.005, 0.01, 5],
			specs: [
				[500/60 ,50 ,110 ], [1000/60,70 ,160 ],
				[1500/60,100,240 ], [2000/60,200,500 ],
				[2500/60,350,1100], [3000/60,400,1300],
				[3500/60,350,1200], [4000/60,250,800 ],
				[4500/60,220,650 ], [5000/60,230,630 ],
				[5500/60,250,680 ], [6000/60,270,820 ],
				[6500/60,290,1050], [7000/60,310,1110],
				[7500/60,330,1010], [8000/60,350,750 ],
				[8500/60,370,620 ], [9000/60,390,590 ],
				[9500/60,410,570 ], [1e4/60 ,430,570 ]
			]
		}
	}
];
