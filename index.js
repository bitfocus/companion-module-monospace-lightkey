var instance_skel = require('../../instance_skel');
var debug;
var log;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions

	return self;
}

instance.prototype.updateConfig = function (config) {
	var self = this;

	self.config = config;
};

instance.prototype.init = function () {
	var self = this;

	self.status(self.STATE_OK);

	debug = self.debug;
	log = self.log;
};

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'Lightkey IP',
			width: 8,
			regex: self.REGEX_IP,
		},
		{
			type: 'textinput',
			id: 'port',
			label: 'Lightkey Port',
			width: 4,
			regex: self.REGEX_PORT,
			default: '21600',
		},
	];
};

// When module gets deleted
instance.prototype.destroy = function () {
	var self = this;
	debug('destroy');
};

instance.prototype.actions = function (system) {
	var self = this;
	self.setActions({
		/***** LIVE VIEW ACTIONS *****/
		triggerCue: {
			label: 'Trigger Cue',
			options: [
				{
					type: 'dropdown',
					label: 'Mode',
					id: 'mode',
					default: 'toggle',
					choices: [
						{ id: 'activate', label: 'Activate' },
						{ id: 'deactivate', label: 'Deactivate' },
						{ id: 'toggle', label: 'Toggle' },
					],
				},
				{
					type: 'dropdown',
					label: 'Page Type',
					id: 'pageType',
					default: 'custom',
					choices: [
						{ id: 'selected', label: 'Currently Selected Page' },
						{ id: 'all', label: 'All Pages' },
						{ id: 'custom', label: 'Custom Page' },
					],
				},
				{
					type: 'textinput',
					label: 'Page Name',
					id: 'pageName',
					tooltip: 'Find the page name by clicking on the Live dropdown menu in Lightkey',
					isVisible: (action) => {
						action.options.pageType == 'custom';
					},
				},
				{
					type: 'textinput',
					label: 'Cue Name',
					id: 'cueName',
					tooltip: 'Enter * for all cuelists',
				},
				{
					type: 'textinput',
					label: 'Fade Time',
					id: 'fadeTime',
				},
			],
		},
		setCueIntensity: {
			label: 'Set Cue Intensity',
			options: [
				{
					type: 'dropdown',
					label: 'Page Type',
					id: 'pageType',
					default: 'custom',
					choices: [
						{ id: 'selected', label: 'Currently Selected Page' },
						{ id: 'all', label: 'All Pages' },
						{ id: 'custom', label: 'Custom Page' },
					],
				},
				{
					type: 'textinput',
					label: 'Page Name',
					id: 'pageName',
					tooltip: 'Find the page name by clicking on the Live dropdown menu in Lightkey',
					isVisible: (action) => {
						action.options.pageType == 'custom';
					},
				},
				{
					type: 'textinput',
					label: 'Cue Name',
					id: 'cueName',
					tooltip: 'Enter * for all cuelists',
				},
				{
					type: 'number',
					label: 'Intensity Level',
					id: 'intensity',
					tooltip: 'Enter value between 0 and 100',
					min: 0,
					max: 100,
					default: '',
				},
			],
		},
		cuelistPlayback: {
			label: 'Cuelist Playback',
			options: [
				{
					type: 'dropdown',
					label: 'Mode',
					id: 'mode',
					default: 'toggle',
					choices: [
						{ id: 'start', label: 'Start' },
						{ id: 'stop', label: 'Stop' },
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'pause', label: 'Pause' },
						{ id: 'resume', label: 'Resume' },
						{ id: 'togglePaused', label: 'Toggle Paused' },
						{ id: 'nextCue', label: 'Next Cue' },
						{ id: 'previousCue', label: 'Previous Cue' },
					],
				},
				{
					type: 'textinput',
					label: 'Fade Time',
					id: 'fadeTime',
					isVisible: (action) => {
						action.options.mode == 'nextCue' || action.options.mode == 'previousCue';
					},
				},
			],
		},
		setXfade: {
			label: 'Set Cuelist Xfade',
			options: [
				{
					type: 'number',
					label: 'Xfade level of current cuelist',
					id: 'xfade',
					min: 0,
					max: 100,
					default: 0,
				},
			],
		},
		skipCue: {
			label: 'Skip Cue',
			options: [
				{
					type: 'dropdown',
					label: 'Mode',
					id: 'mode',
					choices: [
						{ id: 'skip', label: 'Skip' },
						{ id: 'unskip', label: 'Unskip' },
					],
				},
				{
					type: 'textinput',
					label: 'Cuelist Name',
					id: 'cuelistName',
					tooltip: 'Find the cuelist name by clicking on the Live dropdown menu in Lightkey',
				},
				{
					type: 'textinput',
					label: 'Cue Name',
					id: 'cueName',
					tooltip: 'Enter * for all cues',
				},
			],
		},

		/***** PRESET PALETTE ACTIONS *****/
		presetPalette: {
			label: 'Preset Palette',
			options: [
				{
					type: 'dropdown',
					label: 'Mode',
					id: 'mode',
					default: 'toggle',
					choices: [
						{ id: 'activate', label: 'Activate' },
						{ id: 'deactivate', label: 'Deactivate' },
						{ id: 'toggle', label: 'Toggle' },
					],
				},
				{
					type: 'textinput',
					label: 'Path to Preset (e.g. Movers/Colors/Indigo)',
					id: 'path',
					tooltip: 'See Lightkey OSC documentation for more details on how to specify a preset path',
				},

				// The isVisible property doesn't seem to be working... the following doesn't make sense to use without that property working.

				// {
				// 	type: 'number',
				// 	label: 'Number of groups',
				// 	id: 'numOfGroups',
				// 	default: "",
				// 	min: 0,
				// 	max: 5,
				// },
				// {
				// 	type: 'textinput',
				// 	label: 'Group 1 Name',
				// 	id: 'group1',
				// 	isVisible: (action) => { action.options.numOfGroups >= 1 },
				// },
				// {
				// 	type: 'textinput',
				// 	label: 'Group 2 Name',
				// 	id: 'group2',
				// 	isVisible: (action) => { action.options.numOfGroups >= 2 },
				// },
				// {
				// 	type: 'textinput',
				// 	label: 'Group 3 Name',
				// 	id: 'group3',
				// 	isVisible: (action) => { action.options.numOfGroups >= 3 },
				// },
				// {
				// 	type: 'textinput',
				// 	label: 'Group 4 Name',
				// 	id: 'group4',
				// 	isVisible: (action) => { action.options.numOfGroups >= 4 },
				// },
				// {
				// 	type: 'textinput',
				// 	label: 'Group 5 Name',
				// 	id: 'group5',
				// 	isVisible: (action) => { action.options.numOfGroups >= 5 },
				// },
				// {
				// 	type: 'textinput',
				// 	label: 'Preset Name',
				// 	id: 'preset',
				// },
			],
		},

		startSequence: {
			label: 'Start/Stop Sequence',
			options: [
				{
					type: 'dropdown',
					label: 'Mode',
					id: 'mode',
					default: 'toggle',
					choices: [
						{ id: 'start', label: 'Start' },
						{ id: 'stop', label: 'Stop' },
						{ id: 'toggle', label: 'Toggle' },
					],
				},
				{
					type: 'textinput',
					label: 'Path to Sequence (e.g. Movers/Colors/Indigo)',
					id: 'path',
					tooltip: 'See Lightkey OSC documentation for more details on how to specify a preset path',
				},

				// The isVisible property doesn't seem to be working... the following doesn't make sense to use without that property working.

				// {
				// 	type: 'number',
				// 	label: 'Number of groups',
				// 	id: 'numOfGroups',
				// 	default: "",
				// 	min: 0,
				// 	max: 5,
				// },
				// {
				// 	type: 'textinput',
				// 	label: 'Group 1 Name',
				// 	id: 'group1',
				// 	isVisible: (action) => { action.options.numOfGroups >= 1 },
				// },
				// {
				// 	type: 'textinput',
				// 	label: 'Group 2 Name',
				// 	id: 'group2',
				// 	isVisible: (action) => { action.options.numOfGroups >= 2 },
				// },
				// {
				// 	type: 'textinput',
				// 	label: 'Group 3 Name',
				// 	id: 'group3',
				// 	isVisible: (action) => { action.options.numOfGroups >= 3 },
				// },
				// {
				// 	type: 'textinput',
				// 	label: 'Group 4 Name',
				// 	id: 'group4',
				// 	isVisible: (action) => { action.options.numOfGroups >= 4 },
				// },
				// {
				// 	type: 'textinput',
				// 	label: 'Group 5 Name',
				// 	id: 'group5',
				// 	isVisible: (action) => { action.options.numOfGroups >= 5 },
				// },
				// {
				// 	type: 'textinput',
				// 	label: 'Preset Name',
				// 	id: 'preset',
				// },
			],
		},

		/***** OUTPUT CONTROL ACTIONS *****/
		blindMode: {
			label: 'Blind Mode',
			options: [
				{
					type: 'dropdown',
					label: 'Mode',
					id: 'mode',
					default: 'toggle',
					choices: [
						{ id: 'enterBlind', label: 'Enter Blind' },
						{ id: 'exitBlind', label: 'Exit Blind' },
						{ id: 'toggleBlind', label: 'Toggle Blind' },
						{ id: 'cancelBlind', label: 'Cancel Blind' },
					],
				},
			],
		},

		freezeOutput: {
			label: 'Freeze Output',
			options: [
				{
					type: 'dropdown',
					label: 'Mode',
					id: 'mode',
					default: 'toggle',
					choices: [
						{ id: 'freeze', label: 'Freeze output' },
						{ id: 'unfreeze', label: 'Unfreeze output' },
						{ id: 'toggleFreeze', label: 'Toggle output' },
					],
				},
			],
		},

		masterDimmer: {
			label: 'Master Dimmer Level',
			options: [
				{
					type: 'number',
					label: 'Master Dimmer Level',
					id: 'level',
					min: 0,
					max: 100,
					default: 100,
				},
			],
		},

		beatControl: {
			label: 'Beat Control',
			options: [
				{
					type: 'dropdown',
					label: 'Mode',
					id: 'mode',
					default: 'tempo',
					choices: [
						{ id: 'tap', label: 'Tap tempo' },
						{ id: 'sync', label: 'Sync' },
						{ id: 'syncDownbeat', label: 'Sync downbeat' },
						{ id: 'halve', label: 'Halve tempo' },
						{ id: 'double', label: 'Double tempo' },
						{ id: 'tempo', label: 'Set tempo' },
					],
				},
				{
					type: 'textinput',
					label: 'BPM',
					id: 'bpm',
					isVisible: (action) => {
						action.options.mode == 'setTempo';
					},
				},
			],
		},

		/***** FIXTURE PROPERTY ACTIONS *****/

		// Probably too complicated to be worth having a dedicated action for. If a user wants to control a specific fixture property, he or she is most likely perfectly capable of doing so using a custom OSC command.

		// fixtureProps: {
		// 	label: 'Fixture Properties',
		// 	options: [
		// 		{
		// 			type: 'dropdown',
		// 			label: 'Property name',
		// 			id: 'property',
		// 			choices: [
		// 				{ id: 'on', label: 'On or Off' },
		// 				{ id: 'dimmer', label: 'Dimmer' },
		// 				{ id: 'colorWheel', label: 'Color Wheel' },
		// 				{ id: 'colorRGB', label: 'Color RGB' },
		// 				{ id: 'colorTemperature', label: 'Color Temperature' },
		// 				{ id: 'panAngle', label: 'Pan Angle' },
		// 				{ id: 'tiltAngle', label: 'Tilt Angle' },
		// 				{ id: 'gobo', label: 'Gobo' },
		// 				{ id: 'goboRotationMode', label: 'Gobo Rotation Mode' },
		// 				{ id: 'goboShakeMode', label: 'Gobo Shake Mode' },
		// 				{ id: 'goboRotationSpeed', label: 'Gobo Rotation Speed' },
		// 				{ id: 'goboAngle', label: 'Gobo Angle' },
		// 				{ id: 'goboShakeSpeed', label: 'Gobo Shake Speed' },
		// 				{ id: 'goboCycleSpeed', label: 'Gobo Cycle Speed' },
		// 				{ id: 'shutterState', label: 'Shutter State' },
		// 				{ id: 'strobeSpeed', label: 'Strobe Speed' },
		// 				{ id: 'shutterPulseSpeed', label: 'Shutter Pulse Speed' },
		// 				{ id: 'prismType', label: 'Prism Type' },
		// 				{ id: 'prismRotationMode', label: 'Prism Rotation Mode' },
		// 				{ id: 'prismRotationSpeed', label: 'Prism Rotation Speed' },
		// 				{ id: 'PrismAngle', label: 'Prism Angle' },
		// 				{ id: 'focus', label: 'Focus' },
		// 				{ id: 'zoomAngle', label: 'Zoom Angle' },
		// 				{ id: 'irisSize', label: 'Iris Size' },
		// 			],
		// 			minChoicesForSearch: 0,
		// 		},
		// 		{
		// 			type: 'textinput',
		// 			label: 'Value (comma separated for properties with multiple values)',
		// 			id: 'value',
		// 			tooltip: 'See OSC section in Lightkey manual for details on specific properties',
		// 		},
		// 	],
		// },

		custom: {
			label: 'Custom OSC Command',
			options: [
				{
					type: 'textinput',
					label: 'OSC Path',
					id: 'customPath',
				},
				{
					type: 'number',
					label: 'Number of Additional Values',
					id: 'numOfValeus',
					default: 0,
					min: 0,
					max: 3,
				},
				{
					type: 'dropdown',
					label: 'Value 1 Type',
					id: 'oscType1',
					tooltip: 'select the type of the value data',
					choices: [
						{ id: 'i', label: 'integer' },
						{ id: 'f', label: 'float' },
						{ id: 's', label: 'string' },
					],
					isVisible: (action) => {
						action.options.numOfValeus >= 1;
					},
				},
				{
					type: 'textinput',
					label: 'Value 1',
					id: 'customValue1',
					isVisible: (action) => {
						action.options.numOfValeus >= 1;
					},
				},
				{
					type: 'dropdown',
					label: 'Value 2 Type',
					id: 'oscType2',
					tooltip: 'select the type of the value data',
					choices: [
						{ id: 'i', label: 'integer' },
						{ id: 'f', label: 'float' },
						{ id: 's', label: 'string' },
					],
					isVisible: (action) => {
						action.options.numOfValeus >= 2;
					},
				},
				{
					type: 'textinput',
					label: 'Value 2',
					id: 'customValue2',
					isVisible: (action) => {
						action.options.numOfValeus >= 2;
					},
				},
				{
					type: 'dropdown',
					label: 'Value 3 Type',
					id: 'oscType3',
					tooltip: 'select the type of the value data',
					choices: [
						{ id: 'i', label: 'integer' },
						{ id: 'f', label: 'float' },
						{ id: 's', label: 'string' },
					],
					isVisible: (action) => {
						action.options.numOfValeus >= 3;
					},
				},
				{
					type: 'textinput',
					label: 'Value 3',
					id: 'customValue3',
					isVisible: (action) => {
						action.options.numOfValeus >= 3;
					},
				},
			],
		},
	});
};

instance.prototype.action = function (action) {
	var self = this;

	/***** LIVE VIEW ACTIONS *****/
	if (action.action == 'triggerCue') {
		let args = [];
		args = [
			{
				type: 'f',
				value: parseInt(action.options.fadeTime),
			},
		];
		let pageName;

		if (action.options.pageType == 'selected') {
			pageName = 'selected';
		} else if (action.options.pageType == 'all') {
			pageName = '*';
		} else {
			pageName = action.options.pageName.replace(' ', '_');
		}

		let cueName = action.options.cueName.replace(' ', '_');

		console.log('/live/' + pageName + '/cue/' + cueName + '/' + action.options.mode);

		self.oscSend(
			self.config.host,
			self.config.port,
			'/live/' + pageName + '/cue/' + cueName + '/' + action.options.mode,
			args
		);
	}

	if (action.action == 'setCueIntensity') {
		let args = [];
		args = [
			{
				type: 'f',
				value: action.options.intensity / 100,
			},
		];
		let pageName;

		if (action.options.pageType == 'selected') {
			pageName = 'selected';
		} else if (action.options.pageType == 'all') {
			pageName = '*';
		} else {
			pageName = action.options.pageName.replace(' ', '_');
		}

		let cueName = action.options.cueName.replace(' ', '_');

		console.log('/live/' + pageName + '/cue/' + cueName + '/intensity ' + action.options.intensity / 100);

		self.oscSend(self.config.host, self.config.port, '/live/' + pageName + '/cue/' + cueName + '/intensity', args);
	}

	if (action.action == 'cuelistPlayback') {
		if (action.options.mode == 'nextCue' || action.options.mode == 'previousCue') {
			let args = [];
			args = [
				{
					type: 'i',
					value: parseInt(action.options.fadeTime),
				},
			];

			self.oscSend(self.config.host, self.config.port, '/live/' + action.options.mode, args);
		} else {
			self.oscSend(self.config.host, self.config.port, '/live/' + action.options.mode);
		}

		console.log('/live/' + action.options.mode);
	}

	if (action.action == 'setXfade') {
		let args = [];
		args = [
			{
				type: 'f',
				value: action.options.xfade / 100,
			},
		];

		console.log('/live/xfade ' + action.options.xfade / 100);

		self.oscSend(self.config.host, self.config.port, '/live/xfade', args);
	}

	if (action.action == 'skipCue') {
		let cuelistName = action.options.cuelistName.replace(/\s/g, '_');
		let cueName = action.options.cueName.replace(/\s/g, '_');

		console.log('/live/' + cuelistName + '/cue/' + cueName + '/' + action.options.mode);

		self.oscSend(
			self.config.host,
			self.config.port,
			'/live/' + cuelistName + '/cue/' + cueName + '/' + action.options.mode
		);
	}

	/***** PRESET PALETTE ACTIONS *****/
	if (action.action == 'presetPalette') {
		let presetPath = action.options.path.replace(/\s/g, '_');

		console.log('/palette/' + presetPath + '/' + action.options.mode);

		self.oscSend(self.config.host, self.config.port, '/palette/' + presetPath + '/' + action.options.mode);
	}

	if (action.action == 'startSequence') {
		let presetPath = action.options.path.replace(/\s/g, '_');

		console.log('/palette/' + presetPath + '/' + action.options.mode);

		self.oscSend(self.config.host, self.config.port, '/palette/' + presetPath + '/' + action.options.mode);
	}

	/***** OUTPUT CONTROL ACTIONS *****/
	if (action.action == 'blindMode') {
		console.log('/output/' + action.options.mode);
		self.oscSend(self.config.host, self.config.port, '/output/' + action.options.mode);
	}

	if (action.action == 'freezeOutput') {
		console.log('/output/' + action.options.mode);
		self.oscSend(self.config.host, self.config.port, '/output/' + action.options.mode);
	}

	if (action.action == 'masterDimmer') {
		let args = [];
		args = [
			{
				type: 'f',
				value: action.options.level / 100,
			},
		];

		console.log('/output/master ' + action.options.level);
		self.oscSend(self.config.host, self.config.port, '/output/master', args);
	}

	if (action.action == 'beatControl') {
		if (action.options.mode == 'tempo') {
			let args = [];
			args = [
				{
					type: 'i',
					value: action.options.bpm,
				},
			];

			console.log('/beat/' + action.options.mode + ' ' + action.options.bpm);
			self.oscSend(self.config.host, self.config.port, '/beat/' + action.options.mode, args);
		} else {
			console.log('/beat/' + action.options.mode);
			self.oscSend(self.config.host, self.config.port, '/beat/' + action.options.mode);
		}
	}

	/***** FIXTURE PROPERTY ACTIONS *****/
	if (action.action == 'custom') {
		let args = [];

		if (action.options.numOfValeus >= 1) {
			if (action.options.oscType1 == 'i') {
				args.push({
					type: 'i',
					value: parseInt(action.options.customValue1),
				});
			} else if (action.options.oscType1 == 'f') {
				args.push({
					type: 'f',
					value: parseFloat(action.options.customValue1),
				});
			} else if (action.options.oscType1 == 's') {
				args.push({
					type: 's',
					value: '' + action.options.customValue1,
				});
			}
		}

		if (action.options.numOfValeus >= 2) {
			if (action.options.oscType2 == 'i') {
				args.push({
					type: 'i',
					value: parseInt(action.options.customValue2),
				});
			} else if (action.options.oscType2 == 'f') {
				args.push({
					type: 'f',
					value: parseFloat(action.options.customValue2),
				});
			} else if (action.options.oscType2 == 's') {
				args.push({
					type: 's',
					value: '' + action.options.customValue2,
				});
			}
		}

		if (action.options.numOfValeus >= 3) {
			if (action.options.oscType3 == 'i') {
				args.push({
					type: 'i',
					value: parseInt(action.options.customValue3),
				});
			} else if (action.options.oscType3 == 'f') {
				args.push({
					type: 'f',
					value: parseFloat(action.options.customValue3),
				});
			} else if (action.options.oscType3 == 's') {
				args.push({
					type: 's',
					value: '' + action.options.customValue3,
				});
			}
		}

		debug('sending', self.config.host, self.config.port, action.options.customPath);
		self.oscSend(self.config.host, self.config.port, action.options.customPath, args);
	}
};

instance_skel.extendedBy(instance);
exports = module.exports = instance;
