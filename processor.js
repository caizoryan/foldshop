import {s} from "./scale.js"

// ["recto", 2, "x"]
// ["verso", 2, "x"]
let process_verso = (prop) => (grid) => {
	let index = Math.floor(prop[1])
	let diff = prop[1] - index
	// // TODO: Figure out column width
	let offset = s.mul(grid.column_width_verso(1), diff)
	return s.add(grid.verso_columns()[index][prop[2]], offset)
}
let process_recto = (prop) => (grid) => {
	let index = Math.floor(prop[1])
	let diff = prop[1] - index
	// TODO: Figure out column width
	let offset = s.mul(grid.column_width_recto(1), diff)
	return s.add(grid.recto_columns()[index][prop[2]], offset)
}

// TODO: Figure out column width
let process_column_width_verso = (prop) => (grid) => grid.column_width_verso(prop[1])
let process_column_width_recto = (prop) => (grid) => grid.column_width_recto(prop[1])

// ["hangline", 2]
let process_hangline = (prop) =>
	/**@param {Grid} grid */
	(grid) => {
		let index = Math.floor(prop[1])
		let diff = prop[1] - index

		let value = grid.hanglines()[index]
		//let next = grid.hanglines().length - 1 >= index ? grid.props.page_width : grid.hanglines()[index + 1]
		let next = grid.hanglines()[index + 1]
		if (!next) next = grid.props.page_width

		let dist = s.sub(next, value)
		let offset = s.mul(dist, diff)

		return s.add(value, offset)
	}

// ["em", 2]
let process_em = (prop) => s.em(prop[1])
let process_inch = (prop) => s.inch(prop[1])
let process_point = (prop) => s.point(prop[1])
let process_px = (prop) => s.px(prop[1])
let process_pica = (prop) => s.pica(prop[1])

let process_add = (prop) => s.add(prop[1], prop[2])
let process_mul = (prop) => s.mul(prop[1], prop[2])
let process_sub = (prop) => s.sub(prop[1], prop[2])
let process_div = (prop) => s.div(prop[1], prop)

/**
 * @param {(any[] | number | string)} property
 */
export let process_property = (property) => {
	if (Array.isArray(property)) {
		if (property[0] == "hangline") return process_hangline(property)
		if (property[0] == "verso") return process_verso(property)
		if (property[0] == "recto") return process_recto(property)
		if (property[0] == "column_width_verso") return process_column_width_verso(property)
		if (property[0] == "column_width_recto") return process_column_width_recto(property)

		// units
		if (property[0] == "em") return process_em(property)
		if (property[0] == "inch") return process_inch(property)
		if (property[0] == "px") return process_px(property)
		if (property[0] == "pica") return process_pica(property)
		if (property[0] == "point") return process_point(property)

		// math
		if (property[0] == "add") return process_add(property)
		if (property[0] == "sub") return process_sub(property)
		if (property[0] == "mul") return process_mul(property)
		if (property[0] == "div") return process_div(property)
	}

	else return property
}

export let reduceprops = (props) => props.reduce((acc, tuple) => {
	let key = tuple[0]
	let value = tuple[1]
	acc[key] = process_property(value)
	return acc
}, {})
