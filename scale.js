export const DPI = 100

/**
@typedef {("inch" | "pica" | "point" | "em" | "pixel")} UnitType
@typedef {{
	unit?: UnitType,
	value?: number,
	px: number
}} Unit
 */

export class Scale {
	constructor(scale = DPI) {
		this.dpi = window.devicePixelRatio * 96
		this.scale = scale / this.dpi
		console.log("dpi", window.devicePixelRatio)
	}

	add(unit1, unit2) {return (unit1 + unit2)}
	sub(unit1, unit2) {return (unit1 - unit2)}
	mul(unit1, unit2) {return unit1*unit2}
	div(unit1, unit2) {return unit1/unit2}

	em(value) {return this.inch(value / 6)}
	px(value) {return value * this.scale}
	px_raw(value) {return value}
	inch(value) {return value * this.dpi * this.scale}
	pica(value) { return this.em(value) }
	picas(value) { return this.pica(value) }
	point(value) {return  this.pica(value) / 12}
}

export let s = new Scale()
