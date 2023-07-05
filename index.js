const { InstanceBase, Regex, runEntrypoint } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
// import pageSelect from './actions/page-select'

class LightkeyInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config

		this.updateStatus('ok')

		this.updateActions() // export actions
	}
	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		this.config = config
	}

	// Return config fields for web config
	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Lightkey IP',
				width: 8,
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Lightkey Port',
				width: 4,
				regex: Regex.PORT,
				default: '21600',
			},
		]
	}

	updateActions() {
		const sendOscMessage = (path, args) => {
			this.log('debug', `Sending OSC ${this.config.host}:${this.config.port} ${path}`)
			this.log('debug', `Sending Args ${JSON.stringify(args)}`)
			this.oscSend(this.config.host, this.config.port, path, args)
		}

		this.setActionDefinitions({
			/***** LIVE VIEW ACTIONS *****/
			pageSelect: {
				name: 'Page Select',
				options: [
					{
						type: 'textinput',
						label: 'Page Name',
						id: 'pageName',
					},
					{
						type: 'textinput',
						label: 'Fade Time',
						id: 'fadeTime',
					},
				],
				callback: async (e) => {
					let pageName = e.options.pageName.replace(' ', '_')
					let args = []
					args = [
						{
							type: 'f',
							value: parseInt(e.options.fadeTime),
						},
					]

					sendOscMessage('/live/' + pageName + '/select', args)
				},
			},
			triggerCue: {
				name: 'Trigger Cue',
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
						isVisible: (options) => options.pageType == 'custom',
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
				callback: async (e) => {
					let pageName
					let args = []
					args = [
						{
							type: 'f',
							value: parseInt(e.options.fadeTime),
						},
					]

					if (e.options.pageType == 'selected') {
						pageName = 'selected'
					} else if (e.options.pageType == 'all') {
						pageName = '*'
					} else {
						pageName = e.options.pageName.replace(' ', '_')
					}

					let cueName = e.options.cueName.replace(' ', '_')

					sendOscMessage('/live/' + pageName + '/cue/' + cueName + '/' + e.options.mode, args)
				},
			},
			setCueIntensity: {
				name: 'Set Cue Intensity',
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
						isVisible: (options) => {
							return options.pageType == 'custom'
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
				callback: async (e) => {
					let args = []
					args = [
						{
							type: 'f',
							value: e.options.intensity / 100,
						},
					]
					let pageName

					if (e.options.pageType == 'selected') {
						pageName = 'selected'
					} else if (e.options.pageType == 'all') {
						pageName = '*'
					} else {
						pageName = e.options.pageName.replace(' ', '_')
					}

					let cueName = e.options.cueName.replace(' ', '_')

					sendOscMessage('/live/' + pageName + '/cue/' + cueName + '/intensity', args)
				},
			},

			cuelistPlayback: {
				name: 'Cuelist Playback',
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
						isVisible: (options) => {
							options.mode == 'nextCue' || options.mode == 'previousCue'
						},
					},
				],
				callback: async (e) => {
					if (e.options.mode == 'nextCue' || e.options.mode == 'previousCue') {
						let args = []
						args = [
							{
								type: 'i',
								value: parseInt(e.options.fadeTime),
							},
						]

						sendOscMessage('/live/' + e.options.mode, args)
					} else {
						sendOscMessage('/live/' + e.options.mode)
					}
				},
			},

			setXfade: {
				name: 'Set Cuelist Xfade',
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
				callback: async (e) => {
					let args = []
					args = [
						{
							type: 'f',
							value: e.options.xfade / 100,
						},
					]

					sendOscMessage('/live/xfade', args)
				},
			},
			skipCue: {
				name: 'Skip Cue',
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
				callback: async (e) => {
					let cuelistName = e.options.cuelistName.replace(/\s/g, '_')
					let cueName = e.options.cueName.replace(/\s/g, '_')

					sendOscMessage('/live/' + cuelistName + '/cue/' + cueName + '/' + e.options.mode)
				},
			},
			/***** PRESET PALETTE ACTIONS *****/
			presetPalette: {
				name: 'Preset Palette',
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
				],
				callback: async (e) => {
					let presetPath = e.options.path.replace(/\s/g, '_')

					sendOscMessage('/palette/' + presetPath + '/' + e.options.mode)
				},
			},

			startSequence: {
				name: 'Start/Stop Sequence',
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
				],
				callback: async (e) => {
					let presetPath = action.e.path.replace(/\s/g, '_')

					sendOscMessage('/palette/' + presetPath + '/' + action.e.mode)
				},
			},
			/***** OUTPUT CONTROL ACTIONS *****/
			blindMode: {
				name: 'Blind Mode',
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
				callback: async (e) => {
					sendOscMessage('/output/' + e.options.mode)
				},
			},
			freezeOutput: {
				name: 'Freeze Output',
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
				callback: async (e) => {
					sendOscMessage('/output/' + e.options.mode)
				},
			},

			masterDimmer: {
				name: 'Master Dimmer Level',
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
				callback: async (e) => {
					let args = []
					args = [
						{
							type: 'f',
							value: e.options.level / 100,
						},
					]

					sendOscMessage('/output/master', args)
				},
			},
			beatControl: {
				name: 'Beat Control',
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
						isVisible: (options) => {
							options.mode == 'setTempo'
						},
					},
				],
				callback: async (e) => {
					if (e.options.mode == 'tempo') {
						let args = []
						args = [
							{
								type: 'i',
								value: e.options.bpm,
							},
						]

						sendOscMessage('/beat/' + e.options.mode, args)
					} else {
						sendOscMessage('/beat/' + e.options.mode)
					}
				},
			},

			/***** CUSTOM OSC ACTIONS *****/
			custom: {
				name: 'Custom OSC Command',
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
						isVisible: (options) => {
							options.numOfValeus >= 1
						},
					},
					{
						type: 'textinput',
						label: 'Value 1',
						id: 'customValue1',
						isVisible: (options) => {
							options.numOfValeus >= 1
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
						isVisible: (options) => {
							options.numOfValeus >= 2
						},
					},
					{
						type: 'textinput',
						label: 'Value 2',
						id: 'customValue2',
						isVisible: (options) => {
							options.numOfValeus >= 2
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
						isVisible: (options) => {
							options.numOfValeus >= 3
						},
					},
					{
						type: 'textinput',
						label: 'Value 3',
						id: 'customValue3',
						isVisible: (options) => {
							options.numOfValeus >= 3
						},
					},
				],
				callback: async (e) => {
					let args = []

					if (e.options.numOfValeus >= 1) {
						if (e.options.oscType1 == 'i') {
							args.push({
								type: 'i',
								value: parseInt(e.options.customValue1),
							})
						} else if (e.options.oscType1 == 'f') {
							args.push({
								type: 'f',
								value: parseFloat(e.options.customValue1),
							})
						} else if (e.options.oscType1 == 's') {
							args.push({
								type: 's',
								value: '' + e.options.customValue1,
							})
						}
					}

					if (e.options.numOfValeus >= 2) {
						if (e.options.oscType2 == 'i') {
							args.push({
								type: 'i',
								value: parseInt(e.options.customValue2),
							})
						} else if (e.options.oscType2 == 'f') {
							args.push({
								type: 'f',
								value: parseFloat(e.options.customValue2),
							})
						} else if (e.options.oscType2 == 's') {
							args.push({
								type: 's',
								value: '' + e.options.customValue2,
							})
						}
					}

					if (e.options.numOfValeus >= 3) {
						if (e.options.oscType3 == 'i') {
							args.push({
								type: 'i',
								value: parseInt(e.options.customValue3),
							})
						} else if (e.options.oscType3 == 'f') {
							args.push({
								type: 'f',
								value: parseFloat(e.options.customValue3),
							})
						} else if (e.options.oscType3 == 's') {
							args.push({
								type: 's',
								value: '' + e.options.customValue3,
							})
						}
					}

					sendOscMessage(e.options.customPath, args)
				},
			},
		})
	}
}

runEntrypoint(LightkeyInstance, UpgradeScripts)
