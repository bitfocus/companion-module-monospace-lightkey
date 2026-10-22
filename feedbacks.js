import { combineRgb } from '@companion-module/base'
import { fixtureRgb, fixtureLevel, hex, textFor, safeId } from './lightkey-api.js'

// Feedbacks, variables and presets that show what Lightkey is doing now.
// They exist only when "lightkey-api address" is set in the module config.

const COMPARISONS = [
	{ id: 'gte', label: 'is at least' },
	{ id: 'lte', label: 'is at most' },
	{ id: 'gt', label: 'is above' },
	{ id: 'lt', label: 'is below' },
]

export function compare(kind, value, limit) {
	if (kind === 'lte') return value <= limit
	if (kind === 'gt') return value > limit
	if (kind === 'lt') return value < limit
	return value >= limit
}

export function fixtureOption(names) {
	const choices = names.map((n) => ({ id: n, label: n }))
	return {
		type: 'dropdown',
		id: 'fixture',
		label: 'Fixture',
		default: names[0] || '',
		choices,
		allowCustom: true,
		tooltip: 'The fixture name as it is in Lightkey',
	}
}

/** Define everything for the fixtures we know about. Call again when the fixture list changes. */
export function define(instance, names) {
	const api = instance.lkApi
	const get = (feedback) => api.fixtures[String(feedback.options.fixture).trim()]

	instance.setFeedbackDefinitions({
		lightkeyApiConnected: {
			type: 'boolean',
			name: 'lightkey-api is connected',
			description: 'Lit while the lightkey-api agent answers',
			defaultStyle: { bgcolor: combineRgb(0, 120, 0), color: combineRgb(255, 255, 255) },
			options: [],
			callback: () => api.ok === true,
		},
		fixtureLit: {
			type: 'boolean',
			name: 'Fixture is lit',
			description: 'Lit while the fixture gives light now, from any cue, override or effect',
			defaultStyle: { bgcolor: combineRgb(255, 200, 0), color: combineRgb(0, 0, 0) },
			options: [fixtureOption(names)],
			callback: (feedback) => !!(get(feedback) && get(feedback).lit),
		},
		fixtureLevel: {
			type: 'boolean',
			name: 'Fixture brightness',
			description: 'Compare the fixture brightness (0 to 100) with a level',
			defaultStyle: { bgcolor: combineRgb(255, 200, 0), color: combineRgb(0, 0, 0) },
			options: [
				fixtureOption(names),
				{
					type: 'dropdown',
					id: 'comparison',
					label: 'Brightness',
					default: 'gte',
					choices: COMPARISONS,
				},
				{ type: 'number', id: 'level', label: 'Level (%)', default: 50, min: 0, max: 100 },
			],
			callback: (feedback) => {
				const f = get(feedback)
				return !!f && compare(feedback.options.comparison, fixtureLevel(f), Number(feedback.options.level))
			},
		},
		fixtureColor: {
			type: 'advanced',
			affectedProperties: ['bgcolor', 'color'],
			name: 'Fixture color as button color',
			description: 'Paint the button with the color the fixture shows. It stays unchanged while the fixture is dark.',
			options: [fixtureOption(names)],
			callback: (feedback) => {
				const rgb = fixtureRgb(get(feedback))
				if (!rgb) return {}
				const text = textFor(rgb)
				return { bgcolor: combineRgb(...rgb), color: combineRgb(...text) }
			},
		},
	})

	const variables = {}
	for (const n of names) {
		const id = safeId(n)
		variables[`${id}_level`] = { name: `${n} brightness (0-100)` }
		variables[`${id}_lit`] = { name: `${n} is lit (1 or 0)` }
		variables[`${id}_color`] = { name: `${n} color (#rrggbb)` }
	}
	instance.setVariableDefinitions(variables)

	const presets = {
		lightkeyApiStatus: {
			type: 'simple',
			name: 'lightkey-api status',
			style: { text: 'API', size: '18', color: combineRgb(255, 255, 255), bgcolor: combineRgb(60, 0, 0) },
			steps: [{ down: [], up: [] }],
			feedbacks: [{ feedbackId: 'lightkeyApiConnected', options: {}, style: { bgcolor: combineRgb(0, 120, 0) } }],
		},
	}
	const colorIds = []
	const litIds = []
	for (const n of names) {
		const id = safeId(n)
		const base = { text: n, size: 'auto', color: combineRgb(255, 255, 255), bgcolor: combineRgb(30, 30, 30) }
		presets[`color_${id}`] = {
			type: 'simple',
			name: `${n} color`,
			style: base,
			steps: [{ down: [], up: [] }],
			feedbacks: [{ feedbackId: 'fixtureColor', options: { fixture: n } }],
		}
		presets[`lit_${id}`] = {
			type: 'simple',
			name: `${n} on or off`,
			style: base,
			steps: [{ down: [], up: [] }],
			feedbacks: [
				{
					feedbackId: 'fixtureLit',
					options: { fixture: n },
					style: { bgcolor: combineRgb(255, 200, 0), color: combineRgb(0, 0, 0) },
				},
			],
		}
		colorIds.push(`color_${id}`)
		litIds.push(`lit_${id}`)
	}
	const sections = [
		{
			id: 'status',
			name: 'lightkey-api',
			definitions: [{ id: 'status', type: 'simple', name: 'Status', presets: ['lightkeyApiStatus'] }],
		},
		{
			id: 'fixtureColor',
			name: 'Fixture color',
			definitions: [{ id: 'fixtureColorButtons', type: 'simple', name: 'Fixture color', presets: colorIds }],
		},
		{
			id: 'fixtureLit',
			name: 'Fixture on or off',
			definitions: [{ id: 'fixtureLitButtons', type: 'simple', name: 'Fixture on or off', presets: litIds }],
		},
	]
	instance.setPresetDefinitions(sections, presets)
}

/** Push the changed fixtures to variables and refresh the feedbacks that read them. */
export function publish(instance, changed) {
	const values = {}
	for (const name of changed) {
		const f = instance.lkApi.fixtures[name]
		const id = safeId(name)
		values[`${id}_level`] = fixtureLevel(f)
		values[`${id}_lit`] = f && f.lit ? 1 : 0
		const rgb = fixtureRgb(f)
		values[`${id}_color`] = rgb ? hex(rgb) : '#000000'
	}
	instance.setVariableValues(values)
	instance.checkFeedbacks('fixtureLit', 'fixtureLevel', 'fixtureColor')
}
