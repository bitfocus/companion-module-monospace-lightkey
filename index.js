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
					minChoicesForSearch: 8
				  }
			],
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


	// if (action.action == 'triggerColumn') {
	// 	var bol = {
	// 		type: 'i',
	// 		value: parseInt(1),
	// 	};
	// 	currentCompCol = action.options.column;

	// 	debug('sending', self.config.host, self.config.port, '/composition/columns/' + action.options.column + '/connect', [
	// 		bol,
	// 	]);
	// 	self.oscSend(self.config.host, self.config.port, '/composition/columns/' + action.options.column + '/connect', [
	// 		bol,
	// 	]);
	// }

	// if (action.action == 'clearLayer') {
	// 	var bol = {
	// 		type: 'i',
	// 		value: parseInt(1),
	// 	};
	// 	debug('sending', self.config.host, self.config.port, '/composition/layers/' + action.options.layer + '/clear', [
	// 		bol,
	// 	]);
	// 	self.oscSend(self.config.host, self.config.port, '/composition/layers/' + action.options.layer + '/clear', [bol]);
	// 	//sending second command with value 0 to reset the layer, else this command only works one time
	// 	var bol = {
	// 		type: 'i',
	// 		value: parseInt(0),
	// 	};
	// 	debug('sending', self.config.host, self.config.port, '/composition/layers/' + action.options.layer + '/clear', [
	// 		bol,
	// 	]);
	// 	self.oscSend(self.config.host, self.config.port, '/composition/layers/' + action.options.layer + '/clear', [bol]);
	// }

	// if (action.action == 'clearAll') {
	// 	var bol = {
	// 		type: 'i',
	// 		value: parseInt(1),
	// 	};
	// 	debug('sending', self.config.host, self.config.port, '/composition/disconnectall', [bol]);
	// 	self.oscSend(self.config.host, self.config.port, '/composition/disconnectall', [bol]);
	// }

	// if (action.action == 'tempoTap') {
	// 	var bol = {
	// 		type: 'i',
	// 		value: parseInt(1),
	// 	};
	// 	debug('sending', self.config.host, self.config.port, '/composition/tempocontroller/tempotap', [bol]);
	// 	self.oscSend(self.config.host, self.config.port, '/composition/tempocontroller/tempotap', [bol]);
	// }

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
	// if (action.action == 'grpNextCol') {
	// 	var bol = {
	// 		type: 'i',
	// 		value: '1',
	// 	};
	// 	if (groupPos[action.options.groupNext] == undefined) {
	// 		groupPos[action.options.groupNext] = 1;
	// 	} else {
	// 		groupPos[action.options.groupNext]++;
	// 	}
	// 	if (groupPos[action.options.groupNext] > action.options.colMaxGroupNext) {
	// 		groupPos[action.options.groupNext] = 1;
	// 	}

	// 	debug(
	// 		'sending',
	// 		self.config.host,
	// 		self.config.port,
	// 		'/composition/groups/' +
	// 			action.options.groupNext +
	// 			'//composition/columns/' +
	// 			groupPos[action.options.groupNext] +
	// 			'/connect'
	// 	);
	// 	self.oscSend(
	// 		self.config.host,
	// 		self.config.port,
	// 		'/composition/groups/' +
	// 			action.options.groupNext +
	// 			'//composition/columns/' +
	// 			groupPos[action.options.groupNext] +
	// 			'/connect',
	// 		[bol]
	// 	);
	// }
	// if (action.action == 'grpPrvCol') {
	// 	var bol = {
	// 		type: 'i',
	// 		value: '1',
	// 	};

	// 	if (groupPos[action.options.groupPrev] == undefined) {
	// 		groupPos[action.options.groupPrev] = 1;
	// 	} else {
	// 		groupPos[action.options.groupPrev]--;
	// 	}
	// 	if (groupPos[action.options.groupPrev] < 1) {
	// 		groupPos[action.options.groupPrev] = action.options.colMaxGroupPrev;
	// 	}

	// 	debug(
	// 		'sending',
	// 		self.config.host,
	// 		self.config.port,
	// 		'/composition/groups/' +
	// 			action.options.groupPrev +
	// 			'//composition/columns/' +
	// 			groupPos[action.options.groupPrev] +
	// 			'/connect'
	// 	);
	// 	self.oscSend(
	// 		self.config.host,
	// 		self.config.port,
	// 		'/composition/groups/' +
	// 			action.options.groupPrev +
	// 			'//composition/columns/' +
	// 			groupPos[action.options.groupPrev] +
	// 			'/connect',
	// 		[bol]
	// 	);
	// }
	// if (action.action == 'compNextCol') {
	// 	var bol = {
	// 		type: 'i',
	// 		value: '1',
	// 	};
	// 	currentCompCol++;
	// 	if (currentCompCol > action.options.colMaxCompNext) {
	// 		currentCompCol = 1;
	// 	}

	// 	debug('sending', self.config.host, self.config.port, '/composition/columns/' + currentCompCol + '/connect');
	// 	self.oscSend(self.config.host, self.config.port, '/composition/columns/' + currentCompCol + '/connect', [bol]);
	// }
	// if (action.action == 'compPrvCol') {
	// 	var bol = {
	// 		type: 'i',
	// 		value: '1',
	// 	};
	// 	currentCompCol--;
	// 	if (currentCompCol < 1) {
	// 		currentCompCol = action.options.colMaxCompPrev;
	// 	}

	// 	debug('sending', self.config.host, self.config.port, '/composition/columns/' + currentCompCol + '/connect');
	// 	self.oscSend(self.config.host, self.config.port, '/composition/columns/' + currentCompCol + '/connect', [bol]);
	// }
	// if (action.action == 'layNextCol') {
	// 	var bol = {
	// 		type: 'i',
	// 		value: '1',
	// 	};
	// 	if (layerPos[action.options.layerN] == undefined) {
	// 		layerPos[action.options.layerN] = 1;
	// 	} else {
	// 		layerPos[action.options.layerN]++;
	// 	}
	// 	if (layerPos[action.options.layerN] > action.options.colMaxLayerN) {
	// 		layerPos[action.options.layerN] = 1;
	// 	}
	// 	debug(
	// 		'sending',
	// 		self.config.host,
	// 		self.config.port,
	// 		'/composition/layers/' + action.options.layerN + '/clips/' + layerPos[action.options.layerN] + '/connect'
	// 	);
	// 	self.oscSend(
	// 		self.config.host,
	// 		self.config.port,
	// 		'/composition/layers/' + action.options.layerN + '/clips/' + layerPos[action.options.layerN] + '/connect',
	// 		[bol]
	// 	);
	// }
	// if (action.action == 'layPrvCol') {
	// 	var bol = {
	// 		type: 'i',
	// 		value: '1',
	// 	};
	// 	if (layerPos[action.options.layerP] == undefined) {
	// 		layerPos[action.options.layerP] = 1;
	// 	} else {
	// 		layerPos[action.options.layerP]--;
	// 	}
	// 	if (layerPos[action.options.layerP] < 1) {
	// 		layerPos[action.options.layerP] = action.options.colMaxLayerP;
	// 	}
	// 	debug(
	// 		'sending',
	// 		self.config.host,
	// 		self.config.port,
	// 		'/composition/layers/' + action.options.layerP + '/clips/' + layerPos[action.options.layerP] + '/connect'
	// 	);
	// 	self.oscSend(
	// 		self.config.host,
	// 		self.config.port,
	// 		'/composition/layers/' + action.options.layerP + '/clips/' + layerPos[action.options.layerP] + '/connect',
	// 		[bol]
	// 	);
	// }
};

instance_skel.extendedBy(instance);
exports = module.exports = instance;
