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

	//master switch for sounds (along with CS.enableSounds - CS is for user muting, this is for automatic muting)
	enableSounds: true,

	//sound instances. Each instance = {key: key in sounds, id: unique id for instanced sounds, gainNode: gainNode object, source: source object}
	insts: [],

	//initiate audio context and decode all audio files to finalize soundService for use
	init: function() {
		if(this.ctx) {return;} //has been used already
		this.ctx = new AudioContext();

		for(let i of Object.keys(sounds)) {
			this.ctx.decodeAudioData(sounds[i].buffer, function(buffer) {
				sounds[i].buffer = buffer;
			});
			this.insts.push({key: i, gainNode: null, source: null});
		}
	},

	//get instance by name, and optionally, an instance id
	getInst: function(name, id) {
		return this.insts.find(i => (i.key === name) && (!id || i.id === id));
	},

	//construct a sound ready to be started as two objects: buffer source & gainnode
	sound: function(name, volume, playbackRate) {
		(typeof volume !== 'number') && (volume = 1);
		(typeof playbackRate !== 'number') && (playbackRate = 1);

		let ctx = this.ctx;
		let source = ctx.createBufferSource();
		let gainNode = ctx.createGain();

		if(!(sounds[name].buffer instanceof AudioBuffer)) {return;} //decoded audio isn't ready
		source.buffer = sounds[name].buffer;
		source.connect(gainNode);
		gainNode.connect(ctx.destination);

		//set volume and playbackRate
		if(!CS.volume) {CS.volume = 50;} //savegame compatibility
		gainNode.gain.value = CS.volume/100 * volume;
		source.playbackRate.value = playbackRate;

		return [source, gainNode];
	},

	//play a sound for a single time
	play: function(name, volume, playbackRate) {
		if(!CS.enableSounds || !this.enableSounds) {return;}

		let result = this.sound(name, volume, playbackRate);
		if(!result) {return;}
		let inst = this.insts.find(i => i.key === name);
		[inst.source, inst.gainNode] = result;

		inst.source.start(0);
	},

	//start or update a repeateble audio playing
	start: function(name, volume, playbackRate, id) {
		if(!CS.enableSounds || !this.enableSounds) {return;}

		(typeof volume !== 'number') && (volume = 1);
		(typeof playbackRate !== 'number') && (playbackRate = 1);

		let s = sounds[name];
		let inst = this.getInst(name, id);

		//generate a new instance that has the given id
		if(!inst) {
			inst = {key: name, id: id, gainNode: null, source: null};
			this.insts.push(inst);
		}

		//sound is playing, so just update it
		if(inst.source && inst.gainNode) {
			inst.gainNode.gain.value = CS.volume/100 * volume;
			inst.source.playbackRate.value = playbackRate;
			return;
		}

		//sound is not playing, initiate regular loop
		let result = this.sound(name, volume, playbackRate);
		if(!result) {return;}
		[inst.source, inst.gainNode] = result;

		inst.source.loop = true;
		inst.source.loopStart = s.repStart/1000;
		inst.source.loopEnd   = s.repEnd/1000;
		inst.source.start(0);
	},

	//stop a sound suddenly (and stop looping)
	stop: function(name, id) {
		this.stopInst(this.getInst(name, id));
	},
	stopInst: function(inst) {
		inst && inst.source && inst.source.stop();
		this.endInst(inst);
	},

	//end a repeatable audio (but let it die away unless also this.stop(name))
	end: function(name, id) {
		this.endInst(this.getInst(name, id));
	},
	endInst: function(inst) {
		if(!inst || !inst.source || !inst.gainNode) {return;}
		inst.source.loop = false;
		inst.source = null;
		inst.gainNode = null;
	},

	//delete all instances that bear id but have expired
	cull: function() {
		this.insts = this.insts.filter(inst => !inst.id || (inst.source && inst.gainNode));
	},

	//stop all sounds
	stopAll: function() {
		this.insts.forEach(i => this.stopInst(i));
	}
};
