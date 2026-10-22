import test from 'node:test'
import assert from 'node:assert/strict'
import LightkeyInstance, { UpgradeScripts } from '../main.js'

// Build the instance without Companion: Companion passes `internal`, which we do not have, so skip the constructor.
function setup() {
	const inst = Object.create(LightkeyInstance.prototype)
	inst.config = { host: '10.0.0.5', port: '21600' }
	inst.sent = []
	inst.log = () => {}
	inst.oscSend = (host, port, path, args) => inst.sent.push({ host, port, path, args })
	inst.setActionDefinitions = (d) => (inst.actions = d)
	inst.updateActions()
	return inst
}
const run = async (inst, id, options) => {
	inst.sent.length = 0
	await inst.actions[id].callback({ options })
	return inst.sent.map((m) => [m.path, m.args])
}

test('every action has the shape Companion 2.x needs', () => {
	const inst = setup()
	assert.ok(Object.keys(inst.actions).length >= 12)
	for (const [id, a] of Object.entries(inst.actions)) {
		assert.equal(typeof a.name, 'string', id)
		assert.equal(typeof a.callback, 'function', id)
		for (const o of a.options) {
			assert.ok(o.id && o.type && o.label, `${id}.${o.id}`)
			assert.equal(o.isVisible, undefined, `${id}.${o.id} still uses isVisible`)
			assert.equal(o.required, undefined)
			if (o.isVisibleExpression) {
				const names = [...o.isVisibleExpression.matchAll(/\$\(options:(\w+)\)/g)].map((m) => m[1])
				for (const n of names) {
					const dep = a.options.find((x) => x.id === n)
					assert.ok(dep, `${id}: visibility reads unknown option ${n}`)
					assert.equal(dep.disableAutoExpression, true, `${id}.${n} must disable auto-expression`)
				}
			}
		}
	}
})

test('upgrade scripts export is an array of functions', () => {
	assert.ok(Array.isArray(UpgradeScripts) && UpgradeScripts.every((f) => typeof f === 'function'))
})

test('trigger cue builds the live path from the options', async () => {
	const inst = setup()
	const sent = await run(inst, 'triggerCue', {
		mode: 'activate',
		pageType: 'custom',
		pageName: 'My Page',
		cueName: 'Warm White',
		fadeTime: '2',
	})
	assert.equal(sent.length, 1)
	assert.equal(sent[0][0], '/live/My_Page/cue/Warm_White/activate')
	assert.deepEqual(sent[0][1], [{ type: 'f', value: 2 }])
	assert.equal(inst.sent.length, 1)
	assert.deepEqual([inst.sent[0].host, inst.sent[0].port], ['10.0.0.5', 21600])
	assert.equal(
		(
			await run(inst, 'triggerCue', { mode: 'toggle', pageType: 'all', pageName: '', cueName: 'x', fadeTime: '0' })
		)[0][0],
		'/live/*/cue/x/toggle',
	)
})

test('cue intensity, master dimmer, cuelist x-fade scale percent to 0..1', async () => {
	const inst = setup()
	assert.deepEqual((await run(inst, 'masterDimmer', { level: '50' }))[0], [
		'/output/master',
		[{ type: 'f', value: 0.5 }],
	])
	assert.deepEqual((await run(inst, 'setXfade', { xfade: 25 }))[0], ['/live/xfade', [{ type: 'f', value: 0.25 }]])
	const ci = await run(inst, 'setCueIntensity', {
		pageType: 'selected',
		pageName: '',
		cueName: 'Spots',
		intensity: '80',
	})
	assert.equal(ci[0][0], '/live/selected/cue/Spots/intensity')
	assert.equal(ci[0][1][0].value, 0.8)
})

test('cuelist playback, blind, freeze, beat', async () => {
	const inst = setup()
	assert.deepEqual((await run(inst, 'cuelistPlayback', { mode: 'start', fadeTime: '' }))[0][0], '/live/start')
	const next = await run(inst, 'cuelistPlayback', { mode: 'nextCue', fadeTime: '3' })
	assert.deepEqual(next[0], ['/live/nextCue', [{ type: 'i', value: 3 }]])
	assert.equal((await run(inst, 'blindMode', { mode: 'toggleBlind' }))[0][0], '/output/toggleBlind')
	assert.equal((await run(inst, 'freezeOutput', { mode: 'freeze' }))[0][0], '/output/freeze')
	assert.equal((await run(inst, 'beatControl', { mode: 'tap', bpm: '' }))[0][0], '/beat/tap')
	assert.equal((await run(inst, 'beatControl', { mode: 'tempo', bpm: '120' }))[0][0], '/beat/tempo')
})

test('preset palette and start/stop sequence (this one read action.path before and sent nothing useful)', async () => {
	const inst = setup()
	assert.equal(
		(await run(inst, 'presetPalette', { mode: 'activate', path: 'Movers/Colors/Indigo Blue' }))[0][0],
		'/palette/Movers/Colors/Indigo_Blue/activate',
	)
	assert.equal(
		(await run(inst, 'startSequence', { mode: 'start', path: 'Movers/Chase One' }))[0][0],
		'/palette/Movers/Chase_One/start',
	)
})

test('custom OSC command passes typed values', async () => {
	const inst = setup()
	const sent = await run(inst, 'custom', {
		customPath: '/fixture/P1/overrides/dimmer',
		numOfValeus: 2,
		oscType1: 'f',
		customValue1: '0.5',
		oscType2: 'i',
		customValue2: '7',
		oscType3: 's',
		customValue3: '',
	})
	assert.equal(sent[0][0], '/fixture/P1/overrides/dimmer')
	assert.equal(sent[0][1].length, 2)
	assert.deepEqual(
		sent[0][1].map((a) => a.type),
		['f', 'i'],
	)
})

test('actions tolerate options that are missing or empty (a button saved before an option existed)', async () => {
	const inst = setup()
	assert.equal(
		(await run(inst, 'triggerCue', { mode: 'activate', pageType: 'all', cueName: 'orange' }))[0][0],
		'/live/*/cue/orange/activate',
	)
	assert.equal((await run(inst, 'startSequence', { mode: 'toggle' })).length, 0, 'no path: nothing sent, no crash')
	assert.equal((await run(inst, 'presetPalette', { mode: 'toggle' })).length, 1)
	assert.equal((await run(inst, 'setCueIntensity', { pageType: 'all', cueName: 'x' }))[0][0], '/live/*/cue/x/intensity')
})

test('custom page without a page name sends nothing (a saved button can be in this state)', async () => {
	const inst = setup()
	assert.equal((await run(inst, 'triggerCue', { mode: 'toggle', pageType: 'custom', cueName: 'HAZE SEQ' })).length, 0)
	assert.equal(
		(await run(inst, 'setCueIntensity', { pageType: 'custom', pageName: '  ', cueName: 'x', intensity: '50' })).length,
		0,
	)
})
