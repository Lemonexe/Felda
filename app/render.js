/*
	RENDER.JS
	defines R object, which contains all functions related to rendering of canvas as well as the state of rendering
*/
let R = {
	canvas: null,
	ctx: null,
	graphic: null,
	xc: 0,
	yc: 0,

	//CONTROL FUNCTION
	drawCanvas: function() {
		if(!CS.enableGraphics || CS.tab !== 'game' || !S || !S.firstTick) {return;}

		//references
		let canvas = geto('map');
		if(!canvas) {return;}
		let ctx = canvas.getContext('2d');
		this.canvas = canvas;
		this.ctx = ctx;

		this.graphic = cars[S.car].graphic;

		//clear whole canvas before drawing
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		//x,y coordinates of center of drawing, which is located on the ground between wheels
		//relative y position depends on angle, x could depend on velocity, but I didn't like it
		let xrel = 0.3; //(0.4 - S.v / 220).limit(0.2, 0.4);
		let yrel = (0.8 + 0.4 * Math.sin(S.angle)).limit(0.65, 0.95);
		
		this.xc = Math.round(xrel * canvas.width  + S.vibrationOffset[0]);
		this.yc = Math.round(yrel * canvas.height + S.vibrationOffset[1]);

		//call functions to draw elements of map
		this.drawLines();
		this.drawDecorations();
		this.drawCar();
		this.drawFlashTexts();
		this.onscreenMessage();
		this.progressBar();

		//draw minimap if it is open
		CS.showMap && this.drawMiniMap();
	},

	//DRAW BACKGROUND DECORATION IMAGES
	drawDecorations: function() {
		let ppm = CS.ppm;
		let w = this.canvas.width;
		let ctx = this.ctx;

		for(let item of S.level.images) {
			let obj = imgs[item[0]]; //get the image object from 'imgs'

			//dimensions of image; center of drawing is center of bottom edge
			let hOffset = obj.hasOwnProperty('hOffset') ? obj.hOffset : 0;
			let dw = Math.round(obj.width * ppm);
			let dh = Math.round(obj.height * ppm);
			let dx = Math.round(this.xc + (item[1] - S.d) * ppm);
			let dy = Math.round(this.yc - (LVL.getAltitude(item[1]) - S.altitude - hOffset) * ppm);

			//if image not in sight, skip it
			let visible = (dx - dw/2 < w) && (dx + dw/2 > 0);
			if(!visible) {continue;}
				
			//obj is an animation, get current frame as a HTML image element
			if(obj.hasOwnProperty('frames')) {
				let frame = Math.floor(Date.now() / obj.t) % obj.frames.length;
				var elem = obj.frames[frame];
			}
			//object is a static image, get it as a HTML image element
			else if(obj.hasOwnProperty('img')) {
				var elem = obj.img;
			}

			//if mirror is enabled, it will be defined by parity of position, a pseudo-random number (which is constant for each img instance!)
			let m = obj.hasOwnProperty('mirror') && item[1] % 2 < 1;

			//draw 'elem' either mirrored, or normally (it's faster to draw normally)
			if(m) {
				ctx.save();
				ctx.translate(dx-dw/2, dy-dh);
				ctx.scale(-1, 1);
				ctx.drawImage(elem, 0, 0, -dw, dh);
				ctx.restore();
			}
			else {
				ctx.drawImage(elem, dx-dw/2, dy-dh, dw, dh);
			}

			//check for a special image, the distance sign, and write text on it
			if(item[0] === 'zn_km') {
				let fontSize = (0.25*ppm).toFixed();
				let text = (item[1]/1000).toFixed(1).replace('.', ',');
				ctx.textAlign = 'center'; ctx.fillStyle = 'black';
				ctx.font = `bold ${fontSize}px Arial`;
				ctx.fillText(text, dx, dy-dh*2/3);
			}

		}
	},

	//DRAW CAR AND WHEELS
	drawCar: function() {
		let g = this.graphic;
		let ppm = CS.ppm;
		let img = imgs[g.img].img; //preloaded image of car
		let ctx = this.ctx;
		let expl = S.exploded; //graphical effect for the speed challenge

		//rendered image width and height
		let iw = Math.round(g.width * ppm);
		let ih = Math.round(g.height * ppm);

		//whether to draw wheels after car body (false) or before (true)
		let WHbottom = g.hasOwnProperty('WHbottom') && g.WHbottom;

		//draw image of car rotated around center of drawing (= center of bottom edge)
		function drawCarBody(xc, yc) {
			ctx.save();
			ctx.translate(xc, yc);
			ctx.rotate(-S.angle + !!expl*Math.PI);
			ctx.drawImage(img, -iw/2, -ih*!expl, iw, ih);
			ctx.restore();
		}
		!WHbottom && drawCarBody(this.xc, this.yc);

		//draw images of wheels
		let ir = Math.round(g.r * ppm); //rendered radius of wheels
		let imgWH = imgs[g.imgWH].img; //image of wheels
		for(let w of g.wheels) {
			if(expl) {continue;}
			ctx.save();
			//calculation of vector starting in center of drawing and pointing to wheel - original vector
			let vx = w[0]*iw/img.width - iw/2;
			let vy = w[1]*ih/img.height - ih;
			//new vector, rotated by current angle
			let vx2 = Math.round(vx*Math.cos(S.angle) + vy*Math.sin(S.angle));
			let vy2 = Math.round(vx*Math.sin(S.angle) - vy*Math.cos(S.angle));

			ctx.translate(this.xc + vx2, this.yc - vy2);
			ctx.rotate(S.d / g.r);
			ctx.drawImage(imgWH, -ir, -ir, ir*2, ir*2);
			ctx.restore();
		}

		WHbottom && drawCarBody(this.xc, this.yc);
	},

	//DRAW TERRAIN LINES
	drawLines: function() {
		let ctx = this.ctx;

		//get two nearest points
		let i = Math.floor(S.d / S.level.int);
		let points = [this.getCoords(i), this.getCoords(i+1)];

		//add points to the right if the line would be visible and if it exists
		let pointer = 2;
		while (
			this.isInView(points[points.length - 1]) &&
			typeof S.level.map[i + pointer] === 'number'
		) {
			points.push(this.getCoords(i + pointer));
			pointer++;
		}

		//same, but to the left
		pointer = -1;
		while (
			this.isInView(points[0]) &&
			typeof S.level.map[i + pointer] === 'number'
		) {
			points.unshift(this.getCoords(i + pointer));
			pointer--;
		}

		//draw the points
		ctx.beginPath();
		ctx.moveTo(points[0][0], points[0][1]);
		for(i = 1; i < points.length; i++) {
			ctx.lineTo(points[i][0], points[i][1]);
		}
		ctx.strokeStyle = 'black';
		ctx.lineWidth = 1;
		ctx.stroke();
	},
	//determines whether a point (represented by pixel coordinates) is within bounds of camera
	isInView: function(point) {
		return (
			(point[0] >= 0) &&
			(point[0] <= this.canvas.width) &&
			(point[1] >= 0) &&
			(point[1] <= this.canvas.height));
	},
	//get pixel coordinates of i-element of current level
	getCoords: function(i) {
		return [
			this.xc + (i * S.level.int - S.d) * CS.ppm,
			this.yc - (S.level.map[i] - S.altitude) * CS.ppm
		];
	},

	//draw all CS.flashes
	drawFlashTexts: function() {
		let ctx = this.ctx;
		let w = this.canvas.width;
		let h = this.canvas.height;

		CS.flashes.forEach(function(f) {
			let t = 1 - f[0]/config.flash; //dimensionless elapsed lifetime of flash text

			ctx.textAlign = 'center';
			ctx.fillStyle = `rgba(0, 0, 0, ${1-t})`; //opacity is remaining time
			ctx.font = (t*320).toFixed(0) + 'px Arial'; //font size scales with elapsed time
			ctx.fillText(f[1], Math.round(w/2), Math.round(h*(0.9-0.3*t))); //flash ascends with time
		});
	},

	//draw minimap over existing map
	drawMiniMap: function() {
		let ctx = this.ctx;
		let w = this.canvas.width;
		let h = this.canvas.height;

		ctx.fillStyle = '#ffffffe0';
		ctx.fillRect(0, 0, w, h);

		//get altitude interval
		let dMiniMap = config.minimapDistance; //only such distance will be displayed [m], not the whole level
		let hMiniMap = dMiniMap * h / w / S.level.minimapScale; //corresponding altitude interval to give desired scale
		let minAlt = S.altitude - hMiniMap/2;
		let maxAlt = S.altitude + hMiniMap/2;

		//get currentMap, a portion of level map
		let n = dMiniMap / S.level.int; //number of points in section
		let i = Math.floor(S.d / S.level.int); //pointer to map
		let start = (i - n/2).limit(0, NaN); //start index to slice
		let end = i + n/2 + 2; //end index to slice
		let currentMap = S.level.map.slice(start, end);

		//get x coordinate from distance and y coordinate from altitude
		let getX = d => Math.round(w * (0.5 + (d - S.d) / dMiniMap));
		let getY = a => Math.round(h * (1 - (a - minAlt) / (maxAlt - minAlt)));

		//for each map point: moveTo or lineTo (x coord, y coord)
		ctx.beginPath();
		currentMap.forEach((a, i) => ctx[(i === 0) ? 'moveTo' : 'lineTo'](getX((start+i)*S.level.int), getY(a)));
		ctx.strokeStyle = 'black';
		ctx.lineWidth = 1;
		ctx.stroke();

		//car as a blinking circle
		let t = (new Date).getMilliseconds()/1000; //time [s] since last second
		let r = Math.abs(t - 0.5) * 15; //radius changing in time [px]
		ctx.beginPath();
		ctx.arc(getX(S.d), getY(S.altitude), r, 0, 2*Math.PI);
		ctx.strokeStyle = 'red';
		ctx.lineWidth = 3;
		ctx.stroke();

		//fuel challenge - gas pump icon
		if(S.level.id === 'fuel' && S.nextPumpAt > 0) {
			ctx.textAlign = 'center'; ctx.fillStyle = 'black';
			ctx.font = `normal 20px Arial`;
			ctx.fillText('⛽', getX(S.nextPumpAt), getY(LVL.getAltitude(S.nextPumpAt)));
		}

		//for minimap directive
		let obj = CS.miniMapCursor;
		let dC = (obj.pageX/w - 0.5)*dMiniMap + S.d; //distance of cursor
		let aC = LVL.getAltitude(dC); //altitude corresponding to dC (not altitude of cursor)
		obj.d = dC;
		obj.a = aC;
		//if dC is actually within map, draw a blue circle on the relief
		if(!isNaN(aC) && obj.enabled) {
			ctx.fillStyle = 'blue';
			ctx.beginPath();
			ctx.arc(getX(dC), getY(aC), 3, 0, 2*Math.PI);
			ctx.fill();
		}
	},

	//draw text message on screen (usually triggered at the end of level)
	onscreenMessage: function() {
		if(!S.onscreenMessage) {return;}
		let ctx = this.ctx;
		let canvas = this.canvas;
		let obj = S.onscreenMessage;

		//blur everything else
		if(obj.hasOwnProperty('opacity')) {
			let opacity = Math.round(255*obj.opacity).toString(16);
			if(opacity.length === 1) {opacity = '0' + opacity;}
			ctx.fillStyle = '#ffffff' + opacity;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}

		//prepare text
		ctx.textAlign = obj.textAlign || 'center';
		ctx.fillStyle = obj.fillStyle || 'black';
		ctx.textBaseline = obj.textBaseline || 'alphabetic';
		ctx.font = obj.fontSize + 'px ' + obj.fontFamily;
		let top  = obj.hasOwnProperty('top')  ? obj.top  : 1/3;
		let left = obj.hasOwnProperty('left') ? obj.left : 1/2;

		//multiple lines
		for(let i = 0; i < obj.msg.length; i++) {
			ctx.fillText(obj.msg[i], Math.round(left*canvas.width), Math.round(top*canvas.height + i*obj.fontSize*1.2));
		}
	},

	//draw progress bar if defined
	progressBar: function() {
		if(!S.hasOwnProperty('progressBar') || S.progressBar <= 0) {return;}
		let ctx = this.ctx;
		let canvas = this.canvas;
		let w = canvas.width;
		let h = canvas.height;

		ctx.fillStyle = '#ffffff';
		ctx.fillRect(1, h-31, 300, 30);
		ctx.fillStyle = S.progressBarColor || '#ff0000';
		let L = Math.round(300 * S.progressBar.limit(0, 1)); //bar length
		ctx.fillRect(1, h-31, L, 30);
		ctx.lineWidth = 2;
		ctx.strokeStyle = 'black';
		ctx.strokeRect(1, h-31, 300, 30);
		ctx.lineWidth = 1;
	},

	/*draw plot using instructions in obj (for an example obj, see controller.js => $scope.preparePerformancePlot)
	obj: {
		axisX: {span [0, 104], int: 20, color: 'axis title color', name: 'axis title'},
		axisY: -||-
		axisY2: secondary axis - it's either undefined (no secondary axis), or {color: 'axis title color', name: 'axis title'},
			span = [min val and max val], NaN means to be determined by algorithm
			int = interval between marks, NaN means to be determined by algorithm
				span and int do nothing for axisY2, it has the same values as axisY, even if it's a different physical quantity, for convenience ;-)

		data: [
			{x: xValuesArray, y: yValuesArray, color: 'color of line'},
			{x: xValuesArray, y: yValuesArray, color: 'color of line'}
		]
	}
	*/
	drawPlot: function(obj) {
		let Y2 = obj && obj.hasOwnProperty('axisY2');

		let canvas = geto('plot');
		if(!canvas) {return;}
		let w = canvas.width;
		let h = canvas.height;

		let ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, w, h);
		if(!obj) {return;}
		ctx.save();
		ctx.translate(0.5, 0.5);

		//if bounds are missing, deduce them from mins and maxs of all x and y in all datasets
		let xMerged = obj.data.reduce((arr, d) => arr.concat(d.x), []);
		let yMerged = obj.data.reduce((arr, d) => arr.concat(d.y), []);

		isNaN(obj.axisX.span[0]) && (obj.axisX.span[0] = Math.min.apply(null, xMerged));
		isNaN(obj.axisX.span[1]) && (obj.axisX.span[1] = Math.max.apply(null, xMerged));
		isNaN(obj.axisY.span[0]) && (obj.axisY.span[0] = Math.min.apply(null, yMerged));
		isNaN(obj.axisY.span[1]) && (obj.axisY.span[1] = Math.max.apply(null, yMerged));

		//function to find suitable interval for a given span
		function findInt(span) {
			let intPrecise = (span[1] - span[0]) / (config.maxMarks-1); //interval when span is divided into 'maxMarks' of sections
			let order = 10**Math.floor(Math.log10(intPrecise)); //order of magnitude of intPrecise
			let aux = intPrecise / order; //the decisive number - shall we use 1, 2 or 5 (times 10**n)?
			if     (aux > 5) {aux = 10;}
			else if(aux > 2) {aux = 5;}
			else             {aux = 2;}
			return (aux * order).limit(1, NaN);
		}

		//if intervals are missing, deduced them using the findInt algorithm
		['axisX', 'axisY'].forEach(function(axis) {
			isNaN(obj[axis].int) && (obj[axis].int = findInt(obj[axis].span));

			//recalculate bounds to be divisible by the interval
			let int = obj[axis].int;
			obj[axis].span = [
				int * Math.floor(obj[axis].span[0] / int),
				int * Math.ceil (obj[axis].span[1] / int)
			];
		});

		//number of marks on axes
		obj.yMarkCount = Math.ceil((obj.axisY.span[1] - obj.axisY.span[0]) / obj.axisY.int + 1);
		obj.xMarkCount = Math.ceil((obj.axisX.span[1] - obj.axisX.span[0]) / obj.axisX.int + 1);

		//now that we have calculated all necessary variables, draw axes and data lines
		this.drawPlotAxes (ctx, obj, w, h, Y2);
		this.drawPlotLines(ctx, obj, w, h);

		ctx.restore();
	},

	//drawPlot: draw axes, their titles and marks
	drawPlotAxes: function(ctx, obj, w, h, Y2) {
		//axis lines
		ctx.strokeStyle = 'black';
		ctx.beginPath();
		ctx.moveTo(40, 40);
		ctx.lineTo(40, h-40); //left y axis
		ctx.lineTo(w-40, h-40); //x axis
		Y2 && ctx.lineTo(w-40, 40); //right y axis?
		ctx.stroke();

		//labels for axes
		ctx.textAlign = 'center';
		ctx.font = 'bold 13px Arial';
		ctx.fillStyle = obj.axisY.color;
		ctx.fillText(obj.axisY.name, 25, 15);
		Y2 && (ctx.fillStyle = obj.axisY2.color);
		Y2 && ctx.fillText(obj.axisY2.name, w-30, 15);
		ctx.fillStyle = obj.axisX.color;
		ctx.fillText(obj.axisX.name, w/2, h-5);
		ctx.font = 'normal 13px Arial';

		//y axes - marks and numbers
		for(let i = 0; i < obj.yMarkCount; i++) {
			let x1 = 40; //left axis
			let x2 = w-40; //right axis
			let y = (h-40) - (h-80) * i / (obj.yMarkCount-1);

			ctx.beginPath();
			ctx.moveTo(x1, y);
			ctx.lineTo(x1+5, y);
			Y2 && ctx.moveTo(x2, y);
			Y2 && ctx.lineTo(x2-5, y);
			ctx.stroke();

			y += 5 * (i > 0); //offset of 5 will place values in line with marks, but not zero, as it would intersect with x marks
			ctx.textAlign = 'right';
			ctx.fillText((obj.axisY.span[0] + i*obj.axisY.int).toFixed(), x1-4, y);
			Y2 && (ctx.textAlign = 'left');
			Y2 && ctx.fillText((obj.axisY.span[0] + i*obj.axisY.int).toFixed(), x2+4, y);
		}

		//x axis - marks and numbers
		ctx.textAlign = 'center';
		for(let i = 0; i < obj.xMarkCount; i++) {
			let x = 40 + (w-80) * i / (obj.xMarkCount-1);
			let y = h - 40;

			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x, y-5);
			ctx.stroke();

			ctx.fillText((obj.axisX.span[0] + i*obj.axisX.int).toFixed(), x, y+15);
		}
	},

	//drawPlot: draw lines for the actual datasets
	drawPlotLines: function(ctx, obj, w, h) {
		//draw one line
		function drawDataset(dataset) {
			ctx.beginPath();
			//for i in points
			for(let i = 0; i < dataset.y.length; i++) {
				let x = 40   + (w-80) * (dataset.x[i] - obj.axisX.span[0]) / (obj.axisX.span[1] - obj.axisX.span[0]);
				let y = h-40 - (h-80) * (dataset.y[i] - obj.axisY.span[0]) / (obj.axisY.span[1] - obj.axisY.span[0]);
				(i === 0) && ctx.moveTo(x, y);
 				(i  >  0) && ctx.lineTo(x, y);
			}
			ctx.strokeStyle = dataset.color;
			ctx.stroke();
		}

		ctx.lineWidth = 2;
		obj.data.forEach(drawDataset);
		ctx.lineWidth = 1;
	},

	//use canvas to render gearstick
	drawGearstick: function() {
		let canvas = geto('gearstick');
		if(!canvas) {return;}
		let ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, 200, 200);
		
		let gearbox = cars[S.car].transmission.gears;
		//gears: ['id', x,y position of text, x,y position of vertical line]
		let gears = [
			['1',  50,  60,  50,  70],
			['2',  50, 140,  50, 128],
			['3', 100,  60, 100,  70],
			['4', 100, 140, 100, 128],
			['5', 150,  60, 150,  70],
			['6', 150, 140, 150, 128],
			['N', 100, 100]
		];
		let gearFields = []; //returnable array with positions of clickable areas for each installed gear

		//draw circle
		ctx.fillStyle = '#dddddd';
		ctx.strokeStyle = '#777777';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(100, 100, 90, 0, 2*Math.PI);
		ctx.fill();
		ctx.stroke();

		//draw lines
		ctx.strokeStyle = '#222222';
		ctx.lineWidth = 1;
		ctx.beginPath();
		//horizontal line
		ctx.moveTo(50, 100);
		ctx.lineTo(150, 100);
		//vertical lines for each gear
		gears.forEach(function(g) {
			if(gearbox.hasOwnProperty(g[0])) {
				ctx.moveTo(g[3], 100);
				ctx.lineTo(g[3], g[4]);
			}
		});
		ctx.stroke();
		ctx.fillRect(88, 88, 24, 24); //clear space for N

		//write numbers
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#222222';
		ctx.font = 'bold 20px Arial';

		gears.forEach(function(g) {
			if(gearbox.hasOwnProperty(g[0]) || g[0] === 'N') {
				ctx.fillText(g[0], g[1], g[2]);
				gearFields.push({
					txt: g[0],
					x: (g[1]-20) + 'px',
					y: (g[2]-20) + 'px',
					w: 40 + 'px',
					h: 40 + 'px'
				});
			}
		});

		return gearFields;
	}
};
