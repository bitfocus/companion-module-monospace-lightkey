'use strict'

// Optional live feedback from a running Lightkey, through the lightkey-api agent
// (https://github.com/huntrw6/lightkey-api). Lightkey itself sends no state over OSC or MIDI, so the agent reads
// Lightkey's DMX output on the Lightkey computer and serves the state of every fixture over HTTP.
// This file only talks to that HTTP API (lightkey-api 0.4.3 or newer: GET /fixtures and GET /fixtures/state).
// Nothing here decodes DMX.

const DEFAULT_PORT = 8770

/** "10.30.0.211" or "10.30.0.211:8770" -> "http://10.30.0.211:8770". Empty or invalid -> null. */
function apiBase(address) {
	const text = String(address || '').trim()
	if (!text) return null
	const m = /^(?:https?:\/\/)?([A-Za-z0-9.-]+)(?::(\d{1,5}))?\/?$/.exec(text)
	if (!m) return null
	return `http://${m[1]}:${m[2] || DEFAULT_PORT}`
}

/** Variable ids allow letters, digits, "-" and "_". */
function safeId(name) {
	return String(name).replace(/[^A-Za-z0-9_-]/g, '_')
}

/** The color a fixture shows, as [r, g, b] in 0..255, or null when it makes no light. */
function fixtureRgb(f) {
	if (!f || !f.lit) return null
	let rgb = null
	if (Array.isArray(f.color) && f.color.length >= 3) rgb = f.color
	else if (f.colorWheel && Array.isArray(f.colorWheel.color)) rgb = f.colorWheel.color
	else rgb = [1, 1, 1]
	const level = typeof f.dimmer === 'number' ? f.dimmer : 1
	return rgb.slice(0, 3).map((v) => Math.max(0, Math.min(255, Math.round(v * level * 255))))
}

/** Brightness 0..100. The dimmer when the fixture has one, else its brightest color channel, else lit or not. */
function fixtureLevel(f) {
	if (!f) return 0
	if (typeof f.dimmer === 'number') return Math.round(f.dimmer * 100)
	if (Array.isArray(f.color) && f.color.length >= 3) return Math.round(Math.max(...f.color.slice(0, 3)) * 100)
	return f.lit ? 100 : 0
}

function hex(rgb) {
	return '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('')
}

/** Black or white text, whichever reads better on this background. */
function textFor(rgb) {
	return 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2] > 140 ? [0, 0, 0] : [255, 255, 255]
}

class LightkeyApi {
	/**
	 * @param {object} opts
	 * @param {(msg: string) => void} opts.log
	 * @param {(names: string[]) => void} opts.onFixtures  the list of fixtures changed
	 * @param {(changed: string[]) => void} opts.onState    these fixtures changed
	 * @param {(ok: boolean, message: string) => void} opts.onStatus
	 * @param {number} [opts.intervalMs]
	 * @param {typeof fetch} [opts.fetch]
	 */
	constructor(opts) {
		this.opts = opts
		this.fetch = opts.fetch || fetch
		this.intervalMs = opts.intervalMs || 250
		this.base = null
		this.fixtures = {} // name -> latest properties
		this.names = []
		this.timer = null
		this.generation = 0
		this.ok = null
	}

	/** (Re)start for this address. An empty address stops everything and leaves Companion's other behaviour alone. */
	start(address) {
		this.stop()
		this.base = apiBase(address)
		if (!this.base) return false
		const generation = ++this.generation
		this.loop(generation)
		return true
	}

	stop() {
		this.generation++
		if (this.timer) clearTimeout(this.timer)
		this.timer = null
		this.fixtures = {}
		this.names = []
		this.ok = null
	}

	async get(path) {
		const res = await this.fetch(this.base + path, { signal: AbortSignal.timeout(3000) })
		if (!res.ok) throw new Error(`HTTP ${res.status}`)
		return res.json()
	}

	async loop(generation) {
		let backoff = 0
		while (generation === this.generation) {
			try {
				if (!this.names.length) await this.loadNames()
				const state = await this.get('/fixtures/state')
				if (generation !== this.generation) return
				this.apply(state.fixtures || {})
				this.setOk(true, 'Connected')
				backoff = 0
			} catch (e) {
				if (generation !== this.generation) return
				this.setOk(false, `Cannot reach lightkey-api at ${this.base}: ${e.message}`)
				backoff = Math.min(backoff ? backoff * 2 : 1000, 10000)
			}
			await new Promise((resolve) => {
				this.timer = setTimeout(resolve, this.intervalMs + backoff)
			})
		}
	}

	async loadNames() {
		const list = await this.get('/fixtures')
		this.names = (list.fixtures || []).map((f) => f.name)
		this.opts.onFixtures(this.names)
	}

	apply(next) {
		const changed = []
		for (const [name, props] of Object.entries(next)) {
			if (JSON.stringify(this.fixtures[name]) !== JSON.stringify(props)) changed.push(name)
		}
		this.fixtures = next
		if (changed.length) this.opts.onState(changed)
	}

	setOk(ok, message) {
		if (this.ok === ok) return
		this.ok = ok
		this.opts.onStatus(ok, message)
	}
}

export { LightkeyApi, apiBase, safeId, fixtureRgb, fixtureLevel, hex, textFor, DEFAULT_PORT }
