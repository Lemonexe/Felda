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
			exec(levels[S.level.i].listeners, 'onend');
			soundService.stopAll();
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
		return new Promise(function(resolve, reject) {
			let f = levelObject.generation.f;
			if(typeof L[f] === 'function') {
				L[f](levelObject, resolve, reject);
			}
		});
	},

	//levelGeneration() - the simplest one
	straight: function(levelObject, resolve, reject) {
		let int = levelObject.generation.int;
		let length = levelObject.generation.length;
		resolve(new Array(length/int + 1).fill(0));
	},

	//levelGeneration() - several layers of random noise
	noise: function(levelObject, resolve, reject) {
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

		resolve(map);
	},

	realMap: async ({ generation: { int } }, resolve, reject) => {
		const fetchApi = async (uri) => {
			const res = await fetch(`https://api.openrouteservice.org${uri}&api_key=5b3ce3597851110001cf624898c926be72ed4c13a5583a52dfd5b278`);
            if (!res.ok || res.status < 200 || res.status >= 300) {
                throw new Error(await res.text());
            }
            return res.json();
        };
        const interpolate = (x, [x1, y1], [x2, y2]) => (y2 - y1) / (x2 - x1) * (x - x1) + y1;
        const getDistance = ([lon1, lat1], [lon2, lat2]) => {
            const R = 6378000; // Radius of the earth in m
            const deg2rad = deg => deg * (Math.PI / 180);
            const dLat = deg2rad(lat2-lat1);
            const dLon = deg2rad(lon2-lon1);
            const a =
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c; // Distance in km
        };
        try {
            const startStr = prompt("Zadejte startovní adresu:", "Ke Džbánu");
            const endStr = prompt("Zadejte cílovou adresu:", "Malostranské náměstí");

            const start = await fetchApi(`/geocode/search?text=${startStr}`);
            const end = await fetchApi(`/geocode/search?text=${endStr}`);
            const startCoord = start.features[0].geometry.coordinates;
            const endCoord = end.features[0].geometry.coordinates;

            const data = await fetchApi(`/directions?profile=driving-car&format=geojson&instructions=false&elevation=true&coordinates=${startCoord}|${endCoord}`);
            const coords = data.features[0].geometry.coordinates;
            const startElevation = coords[0][2];

            //transform to [dist, elev]
            const distMap = [[0, startElevation]];
            let dist = 0;
            for (let i = 1; i < coords.length; i++) {
                dist += getDistance(coords[i - 1], coords[i]);
                distMap.push([dist, coords[i][2]]);
            }

            // transform to fixed intervals
            const totalLength = distMap[distMap.length - 1][0];
            const numOfIntervals = Math.floor(totalLength / int);
            const map = [startElevation];
            let j = 0;
            distMap.push([0, 0]); // so we dont have to check if distMap[j+1] exists
            for (let i = 1; i <= numOfIntervals; i++) {
                const currentPosition = int * i;
                while (distMap[j][0] <= currentPosition) j++; // find closest data point
                map.push(interpolate(currentPosition, distMap[j], distMap[j + 1]));
            }

            // levelObject.generation.length = totalLength; // TODO move to resolve
            resolve(map);
        }
        catch (e){
        	console.error(e);
        	reject(e);
		}
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
					//each image instance has random x position within section (y will be calculated during rendering)
					let pos = Math.round(i*d + d*Math.random());
					//push image instance as [id, position], id is a pointer to 'imgs' library
					field[i].push([g.images[j].img, pos]);
				}
			}

			//distance signs - they are at fixed distance intervals, rather than randomly dispersed
			let ds = config.signDistance;
			//for number of signs per section
			for(j = 0; j < d / ds; j++) {
				if(i === 0 && j === 0) {continue;} //don't draw sign at 0.0 km
				field[i].push(['zn_km', i*d + ds*j]);
			}
		}

		return field;
	}
};
