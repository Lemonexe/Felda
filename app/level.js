/*
	LEVEL.JS
	defines L object, which contains all function related generation of levels and their drawing
*/

const LVL = {
	//reads distance and current map and calculates current altitude and angle
	mapPosition: function() {
		//condition to end level
		if(S.d >= S.level.length) {
			S.finished = true;
			S.running = false;
			exec(levels[S.level.i].listeners, 'onend');
			soundService.stopAll();
			CS.showMap = false;
			return;
		}
		let i = Math.floor(S.d / S.level.int);
		S.angle = Math.atan((S.level.map[i+1] - S.level.map[i]) / S.level.int);
		S.altitude = LVL.getAltitude(S.d);
	},

	//get altitude at a distance
	getAltitude: function(d) {
		let i = Math.floor(d / S.level.int);
		let x = (d - i * S.level.int) / S.level.int;
		return (x*S.level.map[i+1] + (1-x)*S.level.map[i]);
	},

	//generate map for a selected level index
	levelGeneration: function(i) {
		let levelObject = levels[i];
		return new Promise(function(resolve, reject) {
			let f = levelObject.generation.f;
			if(typeof LVL[f] === 'function') {
				LVL[f](levelObject, resolve, reject);
			}
			else {reject('Generation function does not exist!');}
		});
	},

	//levelGeneration() - the simplest one
	straight: function(levelObject, resolve, reject) {
		let count = 1 + levelObject.generation.length / levelObject.generation.int;
		S.level.map = new Array(count).fill(0);
		resolve();
	},

/*
	//levelGeneration() - constant slope
	slope: function(levelObject, resolve, reject) {
		prompt2([{label: 'Stoupání ve stupních:', value: '0'}], function(fields) {
			S.level.angle = Number(fields[0]) || 0;
			straight2(levelObject, resolve, reject);
		});

		function straight2(levelObject, resolve, reject) {
			S.pRConst = 1; //prevent pressure change
			const int = levelObject.generation.int;
			const inc = int * Math.tan(S.level.angle * Math.PI / 180);
			const count = 1 + levelObject.generation.length / int;
			S.level.map = new Array(count).fill(0).map((o,i) => i*inc);
			resolve();
		}
	},
*/

	//levelGeneration() - several layers of random noise
	noise: function(levelObject, resolve, reject) {
		//see data.js > levels > 'Česká krajina'
		let int = levelObject.generation.int;
		let baseAlt = levelObject.generation.baseAlt;
		let noises = levelObject.generation.noises;
		let length = levelObject.generation.length;
		
		//total count of altitude points
		let count = length/int + 1;

		//initialize map with base altitude
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

		S.level.map = map;
		resolve();
	},

	//levelGeneration() - altitude map fetched from a route connecting two addresses
	//made by @zbycz, powered by OpenStreetMap
	//note: realMap won't be executed until the results of realMapInit are obtained
	realMap: async ({ generation: { int } }, resolve, reject) => {
		const fetchApi = async (uri) => {
			const res = await fetch(`https://api.openrouteservice.org${uri}&api_key=5b3ce3597851110001cf624898c926be72ed4c13a5583a52dfd5b278`);
			if (!res.ok || res.status < 200 || res.status >= 300) {
				throw new Error(await res.text());
			}
			return res.json();
		};
		const interpolate = (x, [x1, y1], [x2, y2]) => (y2 - y1) / (x2 - x1) * (x - x1) + y1;
		const makeXY = (distMapItem) => [distMapItem[0], distMapItem[1][2]];
		const getDistance = ([lon1, lat1], [lon2, lat2]) => {
			const R = 6378000; //radius of the earth in [m]
			const deg2rad = deg => deg * (Math.PI / 180);
			const dLat = deg2rad(lat2-lat1);
			const dLon = deg2rad(lon2-lon1);
			const a =
				Math.sin(dLat/2) * Math.sin(dLat/2) +
				Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
				Math.sin(dLon/2) * Math.sin(dLon/2);
			const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
			return R * c; //distance in [m]
		};
		try {
			const startStr = S.level.startStr;
			const endStr = S.level.endStr;

			const start = await fetchApi(`/geocode/search?text=${startStr}`);
			const end = await fetchApi(`/geocode/search?text=${endStr}`);
			const startCoord = start.features[0].geometry.coordinates;
			const endCoord = end.features[0].geometry.coordinates;

			const data = await fetchApi(`/directions?profile=driving-car&format=geojson&instructions=false&elevation=true&coordinates=${startCoord}|${endCoord}`);
			const coords = data.features[0].geometry.coordinates;
			const startPoint = coords[0];
			//L.geoJSON(data).addTo(leafletMap); // TODO

			//transform to [dist, [lon,lat,alt] ]
			const distMap = [[0, startPoint]];
			let dist = 0;
			for (let i = 1; i < coords.length; i++) {
				dist += getDistance(coords[i - 1], coords[i]); //distance between points [m]
				distMap.push([dist, coords[i]]);
			}
			S.distMap = distMap;

			//transform to fixed intervals
			const totalLength = distMap[distMap.length - 1][0];
			const numOfIntervals = Math.floor(totalLength / int);
			const map = [startPoint[2]];
			let j = 0;
			distMap.push([0, [0,0,0]]); //so we dont have to check if distMap[j+1] exists
			for (let i = 1; i <= numOfIntervals; i++) {
				const currentPosition = int * i;
				while (distMap[j][0] <= currentPosition) j++; //find closest data point
				map.push(interpolate(currentPosition, makeXY(distMap[j]), makeXY(distMap[j + 1])));
			}

			S.level.length = numOfIntervals * int;
			S.level.map = map;
			resolve();
		}
		catch (e){
			console.error(e);
			reject(e);
		}
	},

	//open prompt and wait for input, which will be saved in S.level.startStr & endStr
	realMapInit: function(levelObject, resolve, reject) {
		const field1 = {label: 'Zadejte startovní adresu:', value: 'Letiště Václava Havla'};
		const field2 = {label: 'Zadejte cílovou adresu:',   value: 'Staroměstské náměstí'};
		prompt2([field1,field2], function(fields) {
			fields = fields.map(f => f.trim());
			if(fields[0].length === 0 || fields[1].length === 0) {
				popup('Je nutné vyplnit obě pole.');
				return;
			}
			popup('Načítání', true);
			[S.level.startStr, S.level.endStr] = fields;
			LVL.realMap(levelObject, resolve, reject);
		});
	},

	//add new batch of images, delete old
	imageGeneration: function() {
		const dimg = config.imgDistance;

		//calculate (d1 = beginning, d2 = end) of new area to be generated
		if(S.level.dimgLoaded >= S.level.length) {return;}
		else if(S.d >= S.level.dimgLoaded) { //loaded area is exceeded, load 2*dimg (this shouldn't happen except at level initiation)
			var d1 = S.d;
			var d2 = S.level.dimgLoaded = S.d + 2*dimg;
		}
		else if(S.d >= S.level.dimgLoaded - dimg) { //loaded area ends less than dimg ahead, load another dimg (standard procedure)
			var d1 = S.level.dimgLoaded;
			var d2 = S.level.dimgLoaded += dimg;
		}
		else {return;} //no action needed

		d2 = d2.limit(d1, S.level.length);

		//generate new section of images
		//for i in possible images for this level
		const imgs = levels[S.level.i].generation.images;
		for(let i = 0; i < imgs.length; i++) {
			//skip image if outside of altitude bounds
			if(imgs[i].hasOwnProperty('h') && typeof S.altitude === 'number' && (S.altitude < imgs[i].h[0] || S.altitude > imgs[i].h[1])) {continue;}

			let n = (d2 - d1) * imgs[i].density; //theoretical number of images within section = (length * density), may not be an integer
			n = Math.floor(n) + (Math.random() > n%1); //count of images as integer - decide by chance whether to add the fractional part of number

			//create n images instances
			for(let j = 0; j < n; j++) {
				let pos = Math.round(d1 + (d2 - d1) * Math.random()); //random x position within section (y will be calculated during rendering)
				S.level.images.push([imgs[i].img, pos]); //push instance as [id, position], id is a pointer to 'imgs' library
			}
		}

		//distance signs - they are at fixed distance intervals, rather than randomly dispersed
		let ds = config.signDistance;
		let pos = d1 - d1%ds + ds*(d1<=0); //first position within section, skip 0.0 km

		while(pos < d2) {
			S.level.images.push(['zn_km', pos]);
			pos += ds;
		}

		//cull images left far behind
		S.level.images = S.level.images.filter(img => S.d - img[1] < dimg);
	}
};
