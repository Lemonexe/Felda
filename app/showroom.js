/*
	SHOWROOM.JS
	definition of angular directive showroom, a very huge directive
*/

app.directive('showroom', () => ({
	restrict: 'E',
	templateUrl: 'app/ng/showroom.html?version=4',
	controller: ['$scope', function($scope) {
		//definition of showroom state variables except the one to rule them all - index of car, which is in CS.showroomIndex
		let showroom = {
			//control variables
			tab: 'general', //sub tab for showroom
			gas: 1, //gas throttle for T,P(f) plot in car showroom
			slope: 0, //slope for F(v) plot in car showroom
			altitude: 0, //altitude for F(v) plot in car showroom
			gears: {}, //which gears are currently selected

			//references and styles
			car: null, //car reference
			img: null, //image element of car
			imgWH: null, //image element of car wheels
			carStyle: {}, //ng-style for car image
			wheelStyles: [], //ng-style objects of wheel images
			colors: config.gearColors,
			engineType: '', //text description of engine type

			//results of computations
			Tmax: 0, //max torque [N*m]
			Tmaxf: 0, //@ frequency [Hz]
			Pmax: 0, //max power [W]
			Pmaxf: 0, //@ frequency [Hz]
			vmax: 0, //max speed [m/s]
			vmaxg: '1', //@ gear
			objPerformance: null, //object with request to draw a plot of performance - see R.drawPlot for explanation of the object
			objVelocity: null //same for velocity plot
		};
		['4', '5', '6'].forEach(g => (showroom.gears[g] = true));
		$scope.showroom = showroom;
		
		//initiate showroom (is called at the end of the file or by broadcast)
		function enterShowroom() {
			let i = CS.showroomIndex;
			showroom.car = cars[i];
			showroom.img   = imgs[cars[i].graphic.img].img;
			showroom.imgWH = imgs[cars[i].graphic.imgWH].img;

			let ppm = config.ppmShowroom; //image scale (to get width of 120 pixels per real meter)
			let [imgWidth, imgHeight] = [showroom.img.width, showroom.img.height]; //image source pixel size (car)
			
			let [width, height] = [ppm * cars[i].graphic.width, ppm * cars[i].graphic.height]; //final image pixel size (car)
			let radius = ppm * cars[i].graphic.r; //final image pixel size (wheel)

			//whether to draw wheels behind body (false) or before (true)
			let WHbottom = cars[i].graphic.hasOwnProperty('WHbottom') && cars[i].graphic.WHbottom;

			//ng-styles
			showroom.wheelStyles = cars[i].graphic.wheels.map(w => //generate ng-styles
				({
					position: 'absolute',
					top:  (w[1]/imgHeight*height - radius).toFixed() + 'px',
					left: (w[0]/imgWidth *width  - radius).toFixed() + 'px',
					width:  (2*radius).toFixed() + 'px',
					height: (2*radius).toFixed() + 'px',
					zIndex: 2-Number(WHbottom),
				}));
			showroom.carStyle = {
				position: 'absolute',
				width:  width .toFixed() + 'px',
				height: height.toFixed() + 'px',
				zIndex: 1+Number(WHbottom)
			}

			//text description
			engineTypes = {
				piston: 'čtyřtaktní pístový',
				wankel: 'Wankelův',
				cow: 'hovězí'
			};
			showroom.engineType = engineTypes[cars[i].engineType] || 'jiný';

			//prepare data (and draw plot?)
			$scope.preparePerformancePlot(); //this also obtains max values of P & T
			$scope.prepareVelocityPlot(); //this also obtains max velocity
			$scope.drawPlot();
		}

		//when car is changed using the <select>
		$scope.$on('enterShowroom', enterShowroom);

		$scope.getPressure = () => M.getPressure(showroom.altitude) * constants.p;

		//call canvas to draw a plot using the prepared plot object
		$scope.drawPlot = () => R.drawPlot((showroom.tab === 'engine') ? showroom.objPerformance : showroom.objVelocity);

		//get frequency bounds to draw plot
		let getfSpan = car => [car.engine.minRPM, 0.5*(car.engine.maxRPM+car.engine.redlineRPM)];

		//prepare data to draw plot of torque and power as a function of RPM
		$scope.preparePerformancePlot = function() {
			let car = showroom.car;
			let step = config.fPlotInt; //frequency increment [Hz]
			let fSpan = getfSpan(car); //span of frequency [Hz]
			let n = Math.round((fSpan[1] - fSpan[0])/step + 1); //number of elements in vectors

			let f = new Array(n).fill(0); //vector of frequency [Hz]
			let T = new Array(n).fill(0); //vector of torque [N*m]
			let P = new Array(n).fill(0); //vector of power [W]

			//tabelate the whole dataset of f, T, P values
			for(let i = 0; i < n; i++) {
				f[i] = fSpan[0] + i*step;
				//TORQUE [N·m]: car index, frequency, no starter, slider gas, no nitro, std pressure
				T[i] = M.getTorque(CS.showroomIndex, f[i], 0, showroom.gas, false, 1);
				P[i] = T[i] * 2*Math.PI * f[i]; //power [kW]
			}

			//find index of maximal values for T and P
			let callback = (iMax,o,i,arr) => (o > arr[iMax]) ? i : iMax;
			let iMaxT = T.reduce(callback, 0);
			let iMaxP = P.reduce(callback, 0);

			//save the maximal values
			showroom.Tmax = T[iMaxT]; showroom.Tmaxf = f[iMaxT];
			showroom.Pmax = P[iMaxP]; showroom.Pmaxf = f[iMaxP];

			if(T[iMaxT] <= 0 || P[iMaxP] <= 0) {return;}

			//convert Hz > RPM, convert W > unit of power
			P = P.map(item => item * CS.unitPow.val);
			f = f.map(item => item * 60);

			//create request to draw plot
			showroom.objPerformance = {
				axisX: {span: [NaN, NaN], int: NaN, color: 'black', name: 'RPM'},
				axisY: {span: [0  , NaN], int: NaN, color: 'red',   name: `P [${CS.unitPow.txt}]`},
				axisY2: {color: 'blue',  name: 'T [N·m]'},
				data: [
					{x: f, y: P, color: 'red'},
					{x: f, y: T, color: 'blue'}
				]
			};
		};

		//prepare data to draw plot of force as a function of velocity
		$scope.prepareVelocityPlot = function() {
			let car = showroom.car;
			let step = config.fPlotInt; //frequency increment [Hz]
			let fSpan = getfSpan(car); //span of frequency [Hz]
			let n = Math.round((fSpan[1] - fSpan[0])/step + 1); //number of elements in vectors
			let pR = M.getPressure(showroom.altitude); //relative pressure

			//gears that are selected and available
			let gears = Object.keys(showroom.gears)
				.filter(g => showroom.gears[g] && car.transmission.gears.hasOwnProperty(g));

			//no gears, no drawing
			if(gears.length === 0) {
				showroom.vmax = 0;
				showroom.objVelocity = null;
				return;
			}

			let angle = showroom.slope * Math.PI / 180; //slope from slider [rad]

			//array of dataset objects forEach gear
			let data = gears.map(item => ({
				x: new Array(n).fill(0),
				y: new Array(n).fill(0),
				color: config.gearColors[item]
			}));

			let nDiss = 300; //number of points for dissipative force, will be cut down later
			let vDissStep = 1; //step for dissipative force [m/s]

			let f  = new Array(n).fill(0); //frequency [Hz] - a mere auxiliary variable
			let v  = new Array(nDiss).fill(0); //velocity for dissipative force [m/s]
			let Fo = new Array(nDiss).fill(0); //dissipative force [N]

			//Fo = Fo(v)
			const Fdiss = v => car.transmission.loss.a + car.transmission.loss.b * pR * v**2 + car.m*constants.g*Math.sin(angle);

			//tabelate the dataset for dissipative force
			for(let i = 0; i < nDiss; i++) {
				v[i] = i * vDissStep; //velocity [m/s]
				Fo[i] = Fdiss(v[i]); //force [N]
			}

			//bounds of v, F for all gear datasets (in order to appropriately limit dissipative dataset)
			let vBound = 0, FBound = 0;

			//calculate v, P values forEach dataset
			data.forEach(function(dataset, j) {
				//effective wheel radius [m]
				let re = car.transmission.r / car.transmission.gears.fix / car.transmission.gears[gears[j]];

				//tabelate the whole dataset
				for(let i = 0; i < n; i++) {
					f[i] = fSpan[0] + i*step;
					let v = 2*Math.PI * f[i] * re; //velocity [m/s]

					//TORQUE [N*m]: car index, frequency, no starter, full gas, no nitro, relative pressure
					let T = M.getTorque(CS.showroomIndex, f[i], 0, 1, false, pR);
					let F = T / re; //force [N]

					dataset.x[i] = v;
					dataset.y[i] = F;
				}

				//maximum of v, F for current dataset
				let vMax = Math.max.apply(null, dataset.x);
				let FMax = Math.max.apply(null, dataset.y);
				//maximum of v, F for all datasets
				(vMax > vBound) && (vBound = vMax);
				(FMax > FBound) && (FBound = FMax);
			});

			//find top speed, first as vector of velocities forEach gear
			let vmaxVector = data.map(function(d) {
				let i;

				//find the greatest velocity where engine overpowers Fdiss
				for(i = n; i > 0; i--) {
					if(Fdiss(d.x[i]) <= d.y[i]) {break;}
				}

				//Fdiss is too high, engine cannot operate at all
				if(i <= 0) {return 0;}
				//Fdiss is too low, engine can run at max RPM
				if(i === n-1) {return d.x[n-1];}

				//interpolate the point of intersection
				return d.x[i] + (Fdiss(d.x[i]) - d.y[i]) * (d.x[i+1] - d.x[i]) / (d.y[i+1] - d.y[i] - Fdiss(d.x[i+1]) + Fdiss(d.x[i]));
			});

			//find the best gear
			showroom.vmax = 0;
			vmaxVector.forEach(function(v, i) {
				//top speed is higher than the previous, so save it and save the gear
				if(v > showroom.vmax) {
					showroom.vmax = v;
					showroom.vmaxg = gears[i];
				}
			});

			//finalize dissipative data: cut and create object
			let i = Fo.findIndex(item => item > FBound);
			let j =  v.findIndex(item => item > vBound);
			i = Math.min(i, j);
			Fo = Fo.slice(0, i+1);
			v  =  v.slice(0, i+1);

			(i > 0) && data.push({x: v, y: Fo, color: 'black'});

			//convert all velocities from m/s to custom unit
			data.forEach(d => (d.x = d.x.map(v => v * CS.unitVel.val)));

			//create request to draw plot
			showroom.objVelocity = {
				axisX: {span: [0, NaN], int: NaN, color: 'black', name: `v [${CS.unitVel.txt}]`},
				axisY: {span: [0, NaN], int: NaN, color: 'black', name: 'F [N]'},
				data: data
			};
		};

		//initiate showroom
		enterShowroom();
	}]
}));
