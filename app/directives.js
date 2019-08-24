/*
	DIRECTIVES.JS
	definition of angular directives, which extend the controller
*/

//attribute directive for custom tooltip as a replacement for title
app.directive('tooltip', () => ({
	restrict: 'A',
	link: function(scope, elem, attrs) {
		//create tooltip when you move mouse over the element
		function create(event) {
			if(!attrs.tooltip) {return;}
			CS.tooltip.visible = true;
			CS.tooltip.style.top = (event.pageY + 25) + 'px';
			CS.tooltip.style.left = event.pageX + 'px';
			CS.tooltip.message = [attrs.tooltip];
		}

		//remove tooltip when no longer relevant
		let rem = () => (CS.tooltip.visible = false);

		elem.on('mousemove', create);
		elem.on('mouseout', rem);
		elem.on('click', rem);
	}
}));

//custom tooltip is hijacked by miniMap
app.directive('minimap', () => ({
	restrict: 'A',
	link: function(scope, elem, attrs) {
		//create tooltip when you move mouse over the element
		function create(event) {
			if(!CS.showMap) {return;}
			let obj = CS.miniMapCursor;

			obj.enabled = !isNaN(obj.a);
			CS.tooltip.visible = obj.enabled;
			CS.tooltip.style.top  = (event.pageY + 20) + 'px';
			CS.tooltip.style.left = (event.pageX - 20) + 'px';
			CS.tooltip.message = [
				`x: ${(obj.d/1000).toFixed(1)} km`,
				`y: ${obj.a.toFixed()} m`
			];
			obj.pageY = event.pageY;
			obj.pageX = event.pageX;
		}

		//remove tooltip when no longer relevant
		let rem = function() {
			CS.tooltip.visible = false;
			CS.miniMapCursor.enabled = false;
		}

		elem.on('mousemove', create);
		elem.on('mouseout', rem);
	}
}));

//use canvas to render gearstick image and use angular to create clickable areas
app.directive('gearstick', () => ({
	restrict: 'E',
	template: `
		<div style="position: relative">
			<canvas id="gearstick" width="200" height="200"></canvas>
			<div ng-repeat="g in gearstickAreas" ng-click="shiftGear(g.txt)" ng-style="gearstickAreaStyle(g)" class="gearstickArea"></div>
		</div>`,
	controller: ['$scope', function($scope) {
		$scope.gearstickAreas = R.drawGearstick(); //draw canvas and get clickable areas
		$scope.gearstickAreaStyle = g => ({top: g.y, left: g.x, width: g.w, height: g.h}); //get ng-style for clickable area
		$scope.shiftGear = g => M.shift(g); //throw in a gear
	}]
}));
