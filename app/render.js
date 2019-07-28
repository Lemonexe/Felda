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
		//ctx.fillRect(xc, yc, 3, 3);

		//x,y coordinates of center of drawing, which is located on the ground between wheels
		//relative y position depends on angle, x could depend on velocity, but I didn't like it
		let xrel = 0.3; //(0.4 - S.v / 220).limit(0.2, 0.4);
		let yrel = (0.8 + 0.4 * Math.sin(S.angle)).limit(0.65, 0.95);
		
		this.xc = Math.round(xrel * canvas.width  + S.vibrationOffset[0]);
		this.yc = Math.round(yrel * canvas.height + S.vibrationOffset[1]);

		//call functions to draw elements of map
		this.drawDecorations();
		this.drawCar();
		this.drawLines();

		//end message
		if(S.finished) {
			ctx.textAlign = 'center'; ctx.fillStyle = '#cc4444'; ctx.font = '40px Comic Sans MS';
			ctx.fillText('konec cesty :-)', Math.round(canvas.width/2), Math.round(canvas.height/3));
		}
	},

	//DRAW BACKGROUND DECORATION IMAGES
	drawDecorations: function() {
		let d = config.imgLoadingArea; //images are divided into sectors of such length
		let iarr = Math.floor(S.d / d); //index of image array

		//draw current area, one before and one after
		this.drawArea(S.level.images[iarr-1]);
		this.drawArea(S.level.images[iarr]);
		this.drawArea(S.level.images[iarr+1]);
	},
	//render all items in given loading area
	drawArea: function(area) {
		if(!area) {return;}

		let ppm = CS.ppm;
		let imglib = levels[S.level.i].generation.images;
		let canvas = this.canvas;
		let ctx = this.ctx;

		for(let item of area) {
			let isKmSign = item[0] === 'km'; //check for magical string that denotes a special image: the distance sign
			//reference to preloaded image
			let ref = isKmSign ? config.signObj : imglib[item[0]];

			//dimensions of image; center of drawing is center of bottom edge
			let dw = Math.round(ref.width * ppm);
			let dh = Math.round(ref.height * ppm);
			let dx = Math.round(this.xc + (item[1] - S.d) * ppm);
			let dy = Math.round(this.yc - (L.getAltitude(item[1]) - S.altitude) * ppm);

			//if it is visible, draw it
			if(
				dx - dw/2 < canvas.width &&
				dx + dw/2 > 0
			) {
				ctx.drawImage(imgs[ref.img], dx-dw/2, dy-dh, dw, dh);

				//write text on distance sign
				if(isKmSign) {
					let fontSize = (0.25*ppm).toFixed();
					let text = (S.d/1000).toFixed(1).replace('.', ',');
					ctx.textAlign = 'center'; ctx.fillStyle = 'black'; 
					ctx.font = `bold ${fontSize}px Arial`;
					ctx.fillText(text, dx, dy-dh*2/3);
				}
			}
		}
	},

	//DRAW CAR AND WHEELS
	drawCar: function() {
		let g = this.graphic;
		let ppm = CS.ppm;
		let img = imgs[g.img]; //preloaded image of car
		let ctx = this.ctx;

		//rendered image width and height
		let iw = Math.round(g.width * ppm);
		let ih = Math.round(g.height * ppm);

		//draw image of car rotated around center of drawing
		//center of drawing is center of bottom edge
		ctx.save();
		ctx.translate(this.xc, this.yc);
		ctx.rotate(-S.angle);
		ctx.drawImage(img, -iw/2, -ih, iw, ih);
		ctx.restore();

		//draw images of wheels
		let ir = Math.round(g.r * ppm); //rendered radius of wheels
		let imgWH = imgs[g.imgWH]; //image of wheels
		for(let w of g.wheels) {
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

	//TODO
	drawMiniMap: function() {},

	//calculate vibration of canvas and store it in S, because FPS has variable frequency, while vibration is constant
	vibration: function() {
		if(!S || !S.running || !S.firstTick || !CS.enableVibration) {return;}

		let car = cars[S.car];
		let v = 0; //current vibration amplitude

		//if condition is met, raise vibration amplitude
		let raise = (cond, n) => cond && n > v && (v = n);

		//calculate vibration sources
		raise(
			(S.f > car.engine.vibRPM),
			(6 * (S.f - car.engine.vibRPM) / (car.engine.maxRPM - car.engine.vibRPM))
		);
		raise(
			(S.df !== false && Math.abs(S.df) > 15 && S.Tclutch > 0.1*car.transmission.TclutchMax),
			(S.df - 15) * (S.Tclutch / car.transmission.TclutchMax) / 3
		);
		raise(
			(S.brakes && S.v > 0),
			0.5 + S.v/20
		);
		raise(
			(S.nitro && S.f > car.engine.idleRPM),
			4 * S.gas
		);

		let rnd = (v) => 2*v*(Math.random() - 0.5);
		S.vibrationOffset[0] = rnd(v);
		S.vibrationOffset[1] = rnd(v);
	},

	//draw plot from vectors of frequency (f) [RPM], torque (T) [N*m] and power (P) [kW]
	drawPlot: function(f, T, P) {
		let canvas = geto('plot');
		if(!canvas) {return;}
		let w = canvas.width;
		let h = canvas.height;

		let ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, w, h);

		//lines for axes
		ctx.save();
		ctx.translate(0.5, 0.5);

		ctx.strokeStyle = 'black';
		ctx.beginPath();
		ctx.moveTo(40, 40);
		ctx.lineTo(40, h-40); //left y axis
		ctx.lineTo(w-40, h-40); //x axis
		ctx.lineTo(w-40, 40); //right y axis
		ctx.stroke();

		//labels for axes
		ctx.textAlign = 'center';
		ctx.font = 'bold 13px Arial';
		ctx.fillStyle = 'red';
		ctx.fillText('P [kW]', 25, 15);
		ctx.fillStyle = 'blue';
		ctx.fillText('T [N·m]', w-30, 15);
		ctx.fillStyle = 'black';
		ctx.fillText('RPM', w/2, h-5);
		ctx.font = 'normal 13px Arial';

	//AXES
		//find max value of y axis (max of T & P) and both min & max of x axis (frequency bounds)
		let yMin = 0;
		let yMax = Math.max.apply(null, T.concat(P));
		let xMin = Math.min.apply(null, f);
		let xMax = Math.max.apply(null, f);

		//parameters for axis marks
		let yMarkInt = (yMax - yMin > 49) ? 10 : 5; //interval of 10 kW or N*m
		let xMarkInt = 500; //interval of 500 RPM
		let yMarkCount = Math.round((yMax - yMin) / yMarkInt + 1); //number of marks on y axes
		let xMarkCount = Math.round((xMax - xMin) / xMarkInt + 1); //number of marks on x axis

		//y axes - marks and numbers
		//both T & P use the same scale for convenience - numerical values are within the same order of magnitude
		for(let i = 0; i < yMarkCount; i++) {
			let x1 = 40; //left axis
			let x2 = w-40; //right axis
			let y = (h-40) - (h-80) * i / (yMarkCount-1);

			ctx.beginPath();
			ctx.moveTo(x1, y);
			ctx.lineTo(x1+5, y);
			ctx.moveTo(x2, y);
			ctx.lineTo(x2-5, y);
			ctx.stroke();

			y += 5 * (i > 0); //offset of 5 will place values in line with marks, but not zero, as it would intersect with x marks
			ctx.textAlign = 'right';
			ctx.fillText((yMin + i*yMarkInt).toFixed(),  x1-4, y);
			ctx.textAlign = 'left';
			ctx.fillText((yMin + i*yMarkInt).toFixed(),  x2+4, y);
		}

		//x axis - marks and numbers
		ctx.textAlign = 'center';
		for(let i = 0; i < xMarkCount; i++) {
			let x = 40 + (w-80) * i / (xMarkCount-1);
			let y = h - 40;

			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x, y-5);
			ctx.stroke();

			ctx.fillText((xMin + i*xMarkInt).toFixed(),  x, y+15);
		}

	//CHARTS
		//draw the data line itself from x points and y points
		function drawDataset(color, xset, yset) {
			ctx.beginPath();
			//for i in points
			for(let i = 0; i < yset.length; i++) {
				let x = 40   + (w-80) * (xset[i] - xMin) / (xMax - xMin);
				let y = h-40 - (h-80) * (yset[i] - yMin) / (yMax - yMin);
				(i === 0) && ctx.moveTo(x, y);
 				(i > 0)   && ctx.lineTo(x, y);
			}
			ctx.strokeStyle = color;
			ctx.stroke();
		}

		//draw P and T
		drawDataset('blue', f, P);
		drawDataset('red',  f, T);

		ctx.restore();
	}
};
