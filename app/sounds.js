/*
	SOUNDS.JS
	declares the soundService object
*/

//just a compatibilty fix
window.AudioContext = window.AudioContext || window.webkitAudioContext;

//API for managing game sounds using AudioContext
const soundService = {
	//audio context for all audio work, will be created during this.init() when game is entered
	ctx: null,

	//initiate audio context and decode all audio files to finalize soundService for use
	init: function() {
		if(this.ctx) {return;}
		this.ctx = new AudioContext();

		for(let i of Object.keys(sounds)) {
			this.ctx.decodeAudioData(sounds[i].buffer, function(buffer) {
				sounds[i].buffer = buffer;
			});
		}
	},

	//play a sound for a single time
	play: function(name, volume, playbackRate) {
		let s = sounds[name];

		let result = this.sound(name, volume, playbackRate);
		if(!result) {return;}
		[s.source, s.gainNode] = result;

		s.source.start(0);
	},

	//stop a sound suddenly (and stop looping)
	stop: function(name) {
		sounds[name].source && sounds[name].source.stop();
		this.end(name);
	},

	//start or update a repeateble audio playing
	start: function(name, volume, playbackRate) {
		(typeof volume !== 'number') && (volume = 1);
		(typeof playbackRate !== 'number') && (playbackRate = 1);

		let s = sounds[name];

		//sound is playing, so just update it
		if(s.source && s.gainNode) {
			s.gainNode.gain.value = CS.volume/100 * volume;
			s.source.playbackRate.value = playbackRate;
			return;
		}

		//sound is not playing, initiate regular loop
		let result = this.sound(name, volume, playbackRate);
		if(!result) {return;}
		[s.source, s.gainNode] = result;

		s.source.loop = true;
		s.source.loopStart = s.repStart/1000;
		s.source.loopEnd   = s.repEnd/1000;
		s.source.start(0);
	},

	//end a repeatable audio (but let it die away unless also this.stop(name))
	end: function(name) {
		let s = sounds[name];
		if(!s.source || !s.gainNode) {return;}
		s.source.loop = false;
		s.source = null;
		s.gainNode = null;
	},

	//create sound ready to be started
	sound: function(name, volume, playbackRate) {
		(typeof volume !== 'number') && (volume = 1);
		(typeof playbackRate !== 'number') && (playbackRate = 1);

		let context = this.ctx;
		let source = context.createBufferSource();
		let gainNode = context.createGain();

		if(!(sounds[name].buffer instanceof AudioBuffer)) {return;} //decoded audio isn't ready
		source.buffer = sounds[name].buffer;
		source.connect(gainNode);
		CS.enableSounds && gainNode.connect(context.destination);

		//set volume and playbackRate
		gainNode.gain.value = CS.volume/100 * volume;
		source.playbackRate.value = playbackRate;

		return [source, gainNode];
	},

	//stop all sounds
	stopAll: function() {Object.keys(sounds).forEach(s => this.stop(s));}
};
