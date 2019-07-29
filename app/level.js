/*
	LEVEL.JS
	defines L object, which contains all function related generation of levels and their drawing
*/

const L = {
	//reads distance and current map and calculates current altitude and angle
	mapPosition: function() {
		//condition to end level
		if(S.d >= S.level.length) {
			S.finished = true;
			S.running = false;
			exec(levels[S.level.i].listeners.onend);
			CS.showMap = false;
			return;
		}
		let i = Math.floor(S.d / S.level.int);
		S.angle = Math.atan((S.level.map[i+1] - S.level.map[i]) / S.level.int);
		S.altitude = L.getAltitude(S.d);
	},

	//get altitude at a distance
	getAltitude: function(d) {
		let i = Math.floor(d / S.level.int);
		let x = (d - i * S.level.int) / S.level.int;
		return (x*S.level.map[i+1] + (1-x)*S.level.map[i]);
	},

	//generate map from a given levelObject
	levelGeneration: function(levelObject) {
		let f = levelObject.generation.f;
		if(typeof L[f] === 'function') {
			return L[f](levelObject);
		}
	},

	//levelGeneration() - the simplest one
	straight: function(levelObject) {
		return [0, 0];
	},

	//levelGeneration() - several layers of random noise
	noise: function(levelObject) {
		//see data.js > levels > 'Česká krajina'
		let int = levelObject.generation.int;
		let baseAlt = levelObject.generation.baseAlt;
		let noises = levelObject.generation.noises;
		let length = levelObject.generation.length;
		
		//total count of altitude points
		let count = length/int + 1;

		let map = new Array(count).fill(baseAlt);
		//for all noise layers (n = [interval, maxAltitude])
		for(let n of noises) {
			//two random numbers for previous node and next node
			let rnd1;
			let rnd2 = Math.random() * n[1];
			for(let j = 0; j < count; j++) {
				//how many ints have passed since last noise layer node
				let mod = j % Math.round(n[0] / int);
				//we are at a noise layer node - save old random number and choose a new one
				if(mod === 0) {
					rnd1 = rnd2;
					rnd2 = Math.random() * n[1];
				}

				//fraction of noise interval for interpolation
				let x = mod / (n[0] / int);
				map[j] += x*rnd2 + (1-x)*rnd1;
			}
		}

		return map;
	},

	//generate array of loading areas ('field'), each loading area is an array of images to be rendered
	imageGeneration: function(levelObject) {
		let g = levelObject.generation;
		let d = config.imgLoadingArea;

		//how many loading areas
		let n = Math.ceil(g.length / d);
		let field = new Array(n);

		for(let i = 0; i < n; i++) {
			field[i] = []; //new array = section with images to be rendered

			//for j in possible images for this level
			for(let j = 0; j < g.images.length; j++) {
				//number of images within section is constant = distance * density
				let count = Math.ceil(d * g.images[j].density);
				for(let k = 0; k < count; k++) {
					//each image instance has random position within section
					let pos = Math.round(i*d + d*Math.random());
					//push image instance as [image type, position], image type is a pointer to g.images (index)
					field[i].push([j, pos]);
				}
			}

			//distance signs - they are at fixed distance intervals, rather than randomly dispersed
			let ds = config.signDistance
			//for number of signs per section
			for(j = 0; j < d / ds; j++) {
				if(i === 0 && j === 0) {continue;} //don't draw sign at 0.0 km
				field[i].push(['km', i*d + ds*j]); //image type is magical string instead of pointer
			}
		}

		return field;
	}
};
