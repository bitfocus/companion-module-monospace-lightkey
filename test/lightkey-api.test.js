import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { LightkeyApi, apiBase, safeId, fixtureRgb, fixtureLevel, hex, textFor } from '../lightkey-api.js'
import * as feedbacks from '../feedbacks.js'

test('apiBase accepts an address with or without port and scheme', () => {
	assert.equal(apiBase('10.30.0.211'), 'http://10.30.0.211:8770')
	assert.equal(apiBase(' 10.30.0.211:9000 '), 'http://10.30.0.211:9000')
	assert.equal(apiBase('http://lights.local:8770/'), 'http://lights.local:8770')
	assert.equal(apiBase(''), null)
	assert.equal(apiBase(undefined), null)
	assert.equal(apiBase('bad host'), null)
})

test('safeId keeps variable ids valid', () => {
	assert.equal(safeId('MH 1/a'), 'MH_1_a')
	assert.equal(safeId('P-1_x'), 'P-1_x')
})

test('fixtureRgb is null when dark, scales by dimmer, and understands color wheels', () => {
	assert.equal(fixtureRgb({ lit: false, color: [1, 0, 0] }), null)
	assert.deepEqual(fixtureRgb({ lit: true, color: [1, 0, 0] }), [255, 0, 0])
	assert.deepEqual(fixtureRgb({ lit: true, color: [1, 0.5, 0], dimmer: 0.5 }), [128, 64, 0])
	assert.deepEqual(fixtureRgb({ lit: true, colorWheel: { dmx: 3, color: [0, 0, 1] } }), [0, 0, 255])
	assert.deepEqual(fixtureRgb({ lit: true }), [255, 255, 255])
	assert.equal(fixtureRgb(undefined), null)
})

test('fixtureLevel prefers dimmer, then color, then lit', () => {
	assert.equal(fixtureLevel({ dimmer: 0.345 }), 35)
	assert.equal(fixtureLevel({ color: [0.2, 0.8, 0.1] }), 80)
	assert.equal(fixtureLevel({ lit: true }), 100)
	assert.equal(fixtureLevel({ lit: false }), 0)
	assert.equal(fixtureLevel(undefined), 0)
})

test('hex and textFor', () => {
	assert.equal(hex([255, 0, 16]), '#ff0010')
	assert.deepEqual(textFor([255, 255, 0]), [0, 0, 0])
	assert.deepEqual(textFor([0, 0, 128]), [255, 255, 255])
})

test('compare', () => {
	assert.ok(feedbacks.compare('gte', 50, 50))
	assert.ok(!feedbacks.compare('gt', 50, 50))
	assert.ok(feedbacks.compare('lt', 49, 50))
	assert.ok(feedbacks.compare('lte', 50, 50))
})

function fakeAgent(state) {
	const server = http.createServer((req, res) => {
		res.setHeader('Content-Type', 'application/json')
		if (req.url === '/fixtures')
			return res.end(JSON.stringify({ fixtures: Object.keys(state.fixtures).map((name) => ({ name })) }))
		if (req.url === '/fixtures/state')
			return state.down
				? ((res.statusCode = 503), res.end('{}'))
				: res.end(JSON.stringify({ fixtures: state.fixtures }))
		res.statusCode = 404
		res.end('{}')
	})
	return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)))
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
async function until(fn, ms = 3000) {
	const end = Date.now() + ms
	while (Date.now() < end) {
		if (fn()) return
		await wait(20)
	}
	assert.fail('timed out')
}

test('client loads fixtures, reports changes only, and recovers when the agent returns', async () => {
	const state = { down: false, fixtures: { P1: { color: [0, 0, 0], lit: false }, MH1: { dimmer: 0.5, lit: true } } }
	const server = await fakeAgent(state)
	const events = { names: null, changed: [], status: [] }
	const api = new LightkeyApi({
		log: () => {},
		onFixtures: (n) => (events.names = n),
		onState: (c) => events.changed.push(c),
		onStatus: (ok) => events.status.push(ok),
		intervalMs: 30,
	})
	try {
		assert.equal(api.start('127.0.0.1:' + server.address().port), true)
		await until(() => events.status.includes(true))
		assert.deepEqual(events.names, ['P1', 'MH1'])
		assert.deepEqual(events.changed[0].sort(), ['MH1', 'P1'])

		const before = events.changed.length
		await wait(120)
		assert.equal(events.changed.length, before, 'no change, no event')

		state.fixtures.P1 = { color: [1, 0, 0], lit: true }
		await until(() => events.changed.length > before)
		assert.deepEqual(events.changed[events.changed.length - 1], ['P1'])

		state.down = true
		await until(() => events.status.includes(false))
		state.down = false
		await until(() => events.status[events.status.length - 1] === true)
	} finally {
		api.stop()
		server.close()
	}
})

test('an empty address starts nothing and stop is safe', () => {
	const api = new LightkeyApi({ log() {}, onFixtures() {}, onState() {}, onStatus() {} })
	assert.equal(api.start(''), false)
	api.stop()
})

test('define and publish drive Companion with the right shapes', () => {
	const calls = { feedbacks: null, variables: null, presets: null, values: null, checked: null }
	const instance = {
		lkApi: {
			fixtures: { MH1: { dimmer: 0.5, lit: true, color: [1, 0, 0] }, P1: { lit: false, color: [0, 0, 0] } },
			ok: true,
		},
		setFeedbackDefinitions: (d) => (calls.feedbacks = d),
		setVariableDefinitions: (d) => (calls.variables = d),
		setPresetDefinitions: (s, d) => ((calls.sections = s), (calls.presets = d)),
		setVariableValues: (v) => (calls.values = v),
		checkFeedbacks: (...ids) => (calls.checked = ids),
	}
	feedbacks.define(instance, ['MH1', 'P1'])
	assert.deepEqual(Object.keys(calls.feedbacks).sort(), [
		'fixtureColor',
		'fixtureLevel',
		'fixtureLit',
		'lightkeyApiConnected',
	])
	assert.deepEqual(Object.keys(calls.variables).sort(), [
		'MH1_color',
		'MH1_level',
		'MH1_lit',
		'P1_color',
		'P1_level',
		'P1_lit',
	])
	assert.ok(calls.variables.MH1_level.name)
	assert.ok(calls.presets.color_MH1 && calls.presets.lit_P1 && calls.presets.lightkeyApiStatus)
	assert.equal(calls.presets.color_MH1.type, 'simple')
	assert.equal(calls.feedbacks.fixtureColor.affectedProperties.join(), 'bgcolor,color')
	// every preset is listed in exactly one section
	const listed = calls.sections.flatMap((s) => s.definitions.flatMap((d) => d.presets))
	assert.deepEqual([...listed].sort(), Object.keys(calls.presets).sort())

	assert.equal(calls.feedbacks.fixtureLit.callback({ options: { fixture: 'MH1' } }), true)
	assert.equal(calls.feedbacks.fixtureLit.callback({ options: { fixture: 'P1' } }), false)
	assert.equal(calls.feedbacks.fixtureLit.callback({ options: { fixture: 'nope' } }), false)
	assert.equal(
		calls.feedbacks.fixtureLevel.callback({ options: { fixture: 'MH1', comparison: 'gte', level: 50 } }),
		true,
	)
	assert.equal(
		calls.feedbacks.fixtureLevel.callback({ options: { fixture: 'MH1', comparison: 'gt', level: 50 } }),
		false,
	)
	assert.deepEqual(Object.keys(calls.feedbacks.fixtureColor.callback({ options: { fixture: 'MH1' } })), [
		'bgcolor',
		'color',
	])
	assert.deepEqual(calls.feedbacks.fixtureColor.callback({ options: { fixture: 'P1' } }), {})
	assert.equal(calls.feedbacks.lightkeyApiConnected.callback(), true)

	feedbacks.publish(instance, ['MH1', 'P1'])
	assert.deepEqual(calls.values, {
		MH1_level: 50,
		MH1_lit: 1,
		MH1_color: '#800000',
		P1_level: 0,
		P1_lit: 0,
		P1_color: '#000000',
	})
	assert.deepEqual(calls.checked, ['fixtureLit', 'fixtureLevel', 'fixtureColor'])
})
