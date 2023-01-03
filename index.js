var instance_skel = require('../../instance_skel');
var debug;
var log;
var groupPos = [];
var currentCompCol = 0;
var layerPos = [];

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions

	return self;
}

instance.GetUpgradeScripts = function () {
	return [
		function (context, config, actions, feedbacks) {
			let changed = false;

			let checkUpgrade = (action, changed) => {
				if (action.action == 'custom') {
					if (action.options.customCmd !== undefined) {
						action.options.customPath = action.options.customCmd;
						delete action.options.customCmd;
						changed = true;
					}
				}

				return changed;
			};

			for (let k in actions) {
				changed = checkUpgrade(actions[k], changed);
			}

			return changed;
		},
	];
};

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
					isVisible: (action) => { action.options.pageType == "custom" },
				},
				{
					type: 'textinput',
					label: 'Cue Name',
					id: 'cueName',
					tooltip: 'Enter * for all cuelists'
				},
				{
					type: 'textinput',
					label: 'Fade Time',
					id: 'fadeTime',
				}
			]
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
					isVisible: (action) => { action.options.pageType == "custom" },
				},
				{
					type: 'textinput',
					label: 'Cue Name',
					id: 'cueName',
					tooltip: 'Enter * for all cuelists'
				},
				{
					type: 'number',
					label: 'Intensity Level',
					id: 'intensity',
					tooltip: 'Enter value between 0 and 100',
					min: 0,
					max: 100,
					default: "",
				}
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
					]
				},
				{
					type: 'textinput',
					label: 'Fade Time',
					id: 'fadeTime',
					isVisible: (action) => { action.options.mode == "nextCue" || action.options.mode == "previousCue" },
				},
			]
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
				}
			]
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
					]
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
					tooltip: 'Enter * for all cues'
				},
			]
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
					label: "Path to Preset (e.g. Movers/Colors/Indigo)",
					id: 'path',
					tooltip: "Include all parent group names followed by preset name, each separated by slashes",
				}
			
				
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
			]
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

				{
					type: 'textinput',
					label: "Path to Sequence (e.g. Movers/Colors/Indigo)",
					tooltip: "Include all parent group names followed by preset name, each separated by slashes",
				}
			]
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
					  { id: 'enter', label: 'Enter Blind' },
					  { id: 'exit', label: 'Exit Blind' },
					  { id: 'toggle', label: 'Toggle Blind' },
					  { id: 'cancel', label: 'Cancel Blind' }
					],
				  }
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
					  { id: 'toggle', label: 'Toggle output' },
					],
				  }
			],
		},
		masterDimmer: {
			label: 'Master Dimmer Level',
			options: [
				{
					type: 'textinput',
					label: 'Master Dimmer Level',
					id: 'level',
					default: 'toggle',
				}
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
					  { id: 'setTempo', label: 'Set tempo' },
					],
				},
				{
					type: 'textinput',
					label: 'BPM',
					id: 'bpm',
					isVisible: (action) => { action.options.mode == "setTempo" },
				},
			]
		},
		
		/***** FIXTURE PROPERTY ACTIONS *****/
		fixtureProps: {
			label: 'Fixture Properties',
			options: [
				{
					type: 'dropdown',
					label: 'Property name',
					id: 'property',
					choices: [
						{ id: 'on', label: 'On or Off' },
						{ id: 'dimmer', label: 'Dimmer' },
						{ id: 'colorWheel', label: 'Color Wheel' },
						{ id: 'colorRGB', label: 'Color RGB' },
						{ id: 'colorTemperature', label: 'Color Temperature' },
						{ id: 'panAngle', label: 'Pan Angle' },
						{ id: 'tiltAngle', label: 'Tilt Angle' },
						{ id: 'gobo', label: 'Gobo' },
						{ id: 'goboRotationMode', label: 'Gobo Rotation Mode' },
						{ id: 'goboShakeMode', label: 'Gobo Shake Mode' },
						{ id: 'goboRotationSpeed', label: 'Gobo Rotation Speed' },
						{ id: 'goboAngle', label: 'Gobo Angle' },
						{ id: 'goboShakeSpeed', label: 'Gobo Shake Speed' },
						{ id: 'goboCycleSpeed', label: 'Gobo Cycle Speed' },
						{ id: 'shutterState', label: 'Shutter State' },
						{ id: 'strobeSpeed', label: 'Strobe Speed' },
						{ id: 'shutterPulseSpeed', label: 'Shutter Pulse Speed' },
						{ id: 'prismType', label: 'Prism Type' },
						{ id: 'prismRotationMode', label: 'Prism Rotation Mode' },
						{ id: 'prismRotationSpeed', label: 'Prism Rotation Speed' },
						{ id: 'PrismAngle', label: 'Prism Angle' },
						{ id: 'focus', label: 'Focus' },
						{ id: 'zoomAngle', label: 'Zoom Angle' },
						{ id: 'irisSize', label: 'Iris Size' },
					],
					minChoicesForSearch: 0,
				},
				{
					type: 'textinput',
					label: 'Value (comma separated for properties with multiple values)',
					id: 'value',
					tooltip: 'See OSC section in Lightkey manual for details on specific properties'
				}
			]
		},

		custom: {
			label: 'Custom OSC Command',
			options: [
				{
					type: 'textinput',
					label: 'Custom OSC Path',
					id: 'customPath',
				},
				{
					type: 'dropdown',
					label: 'OSC Type Flag',
					id: 'oscType',
					tooltip: 'select the type of the value data',
					choices: [
						{ id: 'i', label: 'integer' },
						{ id: 'f', label: 'float' },
						{ id: 's', label: 'string' },
					],
				},
				{
					type: 'textinput',
					label: 'Value',
					id: 'customValue',
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

		if(action.options.pageType == "selected") {
			pageName = "selected";
		} else if(action.options.pageType == "all") {
			pageName = "*";
		} else {
			pageName = action.options.pageName.replace(" ", "_");
		}

		let cueName = action.options.cueName.replace(" ", "_");

		console.log('/live/' + pageName + "/cue/" + cueName + "/" + action.options.mode);

		self.oscSend(
			self.config.host,
			self.config.port,
			'/live/' + pageName + "/cue/" + cueName + "/" + action.options.mode, 
			args
		);
	}

	if (action.action == 'setCueIntensity') {
		let args = [];
		args = [
			{
				type: 'f',
				value: action.options.intensity/100,
			},
		];
		let pageName;

		if(action.options.pageType == "selected") {
			pageName = "selected";
		} else if(action.options.pageType == "all") {
			pageName = "*";
		} else {
			pageName = action.options.pageName.replace(" ", "_");
		}

		let cueName = action.options.cueName.replace(" ", "_");

		console.log('/live/' + pageName + "/cue/" + cueName + "/intensity " + action.options.intensity/100);

		self.oscSend(
			self.config.host,
			self.config.port,
			'/live/' + pageName + "/cue/" + cueName + "/intensity", 
			args
		);
	}

	if (action.action == 'cuelistPlayback') {
		
		if(action.options.mode == 'nextCue' || action.options.mode == 'previousCue') {
			let args = [];
			args = [
				{
					type: 'i',
					value: parseInt(action.options.fadeTime),
				},
			];


			self.oscSend(
				self.config.host,
				self.config.port,
				'/live/' + action.options.mode, 
				args
			);
		} else {
			self.oscSend(
				self.config.host,
				self.config.port,
				'/live/' + action.options.mode
			);
		}

		console.log('/live/' + action.options.mode);
	}

	if (action.action == 'setXfade') {
		let args = [];
			args = [
				{
					type: 'f',
					value: action.options.xfade/100,
				},
			];

			console.log('/live/xfade ' + action.options.xfade/100)

		self.oscSend(
			self.config.host,
			self.config.port,
			'/live/xfade', 
			args
		);
	}

	if (action.action == 'skipCue') {

		let cuelistName = action.options.cuelistName.replace(/\s/g, "_");
		let cueName = action.options.cueName.replace(/\s/g, "_");

		console.log('/live/' + cuelistName + "/cue/" + cueName + "/" + action.options.mode);

		self.oscSend(
			self.config.host,
			self.config.port,
			'/live/' + cuelistName + "/cue/" + cueName + "/" + action.options.mode
		);
	}
	
	/***** PRESET PALETTE ACTIONS *****/
	if(action.action == "presetPalette") {

		let presetPath = action.options.path.replace(/\s/g, "_");

		console.log('/palette/' + presetPath + "/" + action.options.mode);

		self.oscSend(
			self.config.host,
			self.config.port,
			'/palette/' + presetPath + "/" + action.options.mode
		);
	}

	/***** OUTPUT CONTROL ACTIONS *****/
	if (action.action == 'blindMode') {
		if(action.options.mode == "enter") {
			console.log("Sending enter");
			self.oscSend(
				self.config.host,
				self.config.port,
				'/output/enterBlind/'
			);
		}
		if(action.options.mode == "exit") {
			console.log("Sending exit");
			self.oscSend(
				self.config.host,
				self.config.port,
				'/output/exitBlind/'
			);
		}
		if(action.options.mode == "toggle") {
			console.log("Sending toggle");
			self.oscSend(
				self.config.host,
				self.config.port,
				'/output/toggleBlind/'
			);
		}
		if(action.options.mode == "cancel") {
			console.log("Sending cancel");
			self.oscSend(
				self.config.host,
				self.config.port,
				'/output/cancelBlind/'
			);
		}
	}

	/***** FIXTURE PROPERTY ACTIONS *****/
	if (action.action == 'custom') {
		var args = [];
		if (action.options.oscType == 'i') {
			args = [
				{
					type: 'i',
					value: parseInt(action.options.customValue),
				},
			];
		} else if (action.options.oscType == 'f') {
			args = [
				{
					type: 'f',
					value: parseFloat(action.options.customValue),
				},
			];
		} else if (action.options.oscType == 's') {
			args = [
				{
					type: 's',
					value: '' + action.options.customValue,
				},
			];
		}
		debug('sending', self.config.host, self.config.port, action.options.customPath);
		self.oscSend(self.config.host, self.config.port, action.options.customPath, args);
	}
};

instance_skel.extendedBy(instance);
exports = module.exports = instance;