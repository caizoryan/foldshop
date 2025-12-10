import { Q5 as p5 } from "./lib/q5/q5.js"
import { reactive, memo } from './hok.js'
import { dom } from './dom.js'
import { s } from "./scale.js"
import { runa, o, f, isFunction, fn, isObject, isScopedFunction, isSymbol } from './runa.js'
import { printing, drawSaddle, drawSignature, setprinting, foot, signature, spread, drawSaddleDouble } from './baselibrary.js'

let inc = .5
let renderers = {
	"Fold": (el, i, address, change) => {
		if (isFunction(el) && el.name == 'Fold') return ["span.fold-marker", "▶︎"]
		else change(() => ["span.fold", selected(i, address), "(x)"])
		return ["span.fold", selected(i, address), (isFunction(el) || isSymbol(el)) ? el.name : "[ Folded(...) ]"]
	},
	"History": (el, i, address, change) => {
		let num = parseInt(el)
		if (isFunction(el) && el.name == 'History') return ["span.fold-marker", selected(i, address), "...︎"]
		else if (typeof num != 'number') console.error("Next num from history should be parseable as number")
		else {
			change((el, ii, address) => ii == (num + i) ? defaultrenderer(el, ii, address, change) : ["span.symbol", selected(ii, address), "(x)"])
			return ["span.fold", selected(i, address), "(" + el + ")"]
		}
	}
}
let width = s.inch(10)
let height = s.inch(8)
// let viewport = .8
let viewport = .8
let right = true

let v = (x, y) => p.createVector(x, y)
let vdup = v => p.createVector(v.x, v.y)

function drawQuad(vectors, _p = p) {
	_p.stroke(1)
	_p.strokeWeight(1)
	_p.quad(
		...vectors.reduce((acc, e) => acc.concat([e.x, e.y]), [])
	)
}
function drawLine(vectors, _p = p) {
	_p.stroke(1)
	_p.strokeWeight(1)
	_p.line(
		...vectors.reduce((acc, e) => acc.concat([e.x, e.y]), [])
	)
}

function mirror(p, m) {
	let dx, dy, a, b;
	let x2, y2;

	let x0 = m[0].x
	let x1 = m[1].x
	let y0 = m[0].y
	let y1 = m[1].y

	dx = (x1 - x0);
	dy = (y1 - y0);

	a = (dx * dx - dy * dy) / (dx * dx + dy * dy);
	b = 2 * dx * dy / (dx * dx + dy * dy);

	x2 = (a * (p.x - x0) + b * (p.y - y0) + x0);
	y2 = (b * (p.x - x0) - a * (p.y - y0) + y0);

	return v(x2, y2)

}

let el = document.querySelector(".q5")
let p = new p5('instance', el);

let nx = 0
let ny = 0
let nh = s.inch(11 * 3)
let nw = s.inch(8.5 / 3)

let index = 0

let mainrect = [
	v(nx, ny),
	v(nx + nw, ny),
	v(nx + nw, ny + nh),
	v(nx, ny + nh)
]

let sheet2 = {
	color: '#dff9',
	width,
	height,

	offset: {
		vertical: s.em(0),
		horizontal: s.em(-6)
	}
}
let sheet1 = {
	color: '#eff2',
	width,
	height: s.sub(height, s.inch(2)),

	offset: {
		vertical: s.inch(1),
		horizontal: s.em(0)
	}
}
let sheet4 = {
	color: '#fff9',
	width,
	height,

	offset: {
		vertical: s.em(0),
		horizontal: s.inch(0)
	}
}

let baselines = []
let off = 350
for (let i = 0; i < 12; i++) {
	let o = i > 1 ? off : 0
	baselines.push([v(nx, ny + (i + 1) * 150 + Math.random() * 45 + o),
									v(nx + nw, ny + (i + 1) * 150 + Math.random() * 35 + o)])
}
baselines.push([vdup(mainrect[3]), vdup(mainrect[2])])

let rup = () => baselines[index][1].add(v(0, -5))
let lup = () => baselines[index][0].add(v(0, -5))
let rdown = () => baselines[index][1].add(v(0, +5))
let ldown = () => baselines[index][0].add(v(0, +5))

let load_json = () => {
	let f = document.createElement("input");
	f.style.display = "none";
	f.type = "file";
	f.name = "file";
	f.onchange = (e2) => {
		const [file] = e2.target.files;
		console.log(file);
		const reader = new FileReader;
		reader.addEventListener("load", () => {
			console.log(reader.result);
			let val = JSON.parse(reader.result);
			contentsOne = val
			render()
		}, false);
		if (file)
			reader.readAsText(file);
	};
	f.click();
};

// THINK how can you add functional programming concepts in here?

// Signature will take in array of array of contents as spread
// Signature will take sheets and produce spreads
// offsets are sheets now...

// To be rethought to have fun grids
class Structure {}
let mapfn = fn => arr => arr.map(fn)
p.setup = () => {
	// p.createCanvas(s.inch(11), s.inch(17))
	// p.createCanvas(s.inch(11*3), s.inch(8.5/3))
	p.createCanvas(s.inch(11), s.inch(8.5))
	let el = document.querySelector(".q5")
	el.style.transform = "scale(" + (1 / s.scale) * viewport + ")"
	p.angleMode('degrees')
}

function throttle( fn, wait ){
  let lastCall = 0;
    return function(event){
    if( Date.now() - lastCall > wait  ){
      lastCall = Date.now()
      fn(event)
    }
  }
}

let wheel = (event) => {
	if (event.delta > 0) right ? rup() : lup()
	else right ? rdown(): ldown()
	render()
}

p.mouseWheel = throttle(wheel, 100)
		// either it starts with a symbol or is treated as an array

// [x, 1] [2, 3] [4, 5] [6, 7] [8, x], 
let pagenums = [reactive(0), reactive(6), reactive(0)]
let oninit = []
setTimeout(() => oninit.forEach(fn => fn()), 500)

oninit.push(() => {
	pagenums.forEach(f => f.subscribe(render))
	render()
})
function render() {
	let transform = a => a
		.map(mapfn(e => runa(e)))
		.map(f => spread(f, (g) => g))

	let limit = (r, start, end) => r.value() > end ? r.next(end) : r.value() < start ? r.next(start) : null
	let sheetset1 = [sheet1, sheet2]
	let sheetset2 = [sheet4, sheet4, sheet1, sheet4, sheet1, sheet4, sheet4, sheet4, sheet4]




	let c1 = transform(contentsOne)
	let c2 = transform(contentsTwo)
	let signatures = [c2, c1]
	signatures = signatures.map((s, i) => {
		limit(pagenums[i], 0, s.length - 1)
		let setsheet = i == 1 ? sheetset2 : sheetset1
		return signature(s, setsheet, pagenums[i].value())
	})

	// runa(
	// 	[f("progn"),
	// 		[f("set"), "signatures", signatures],
	// 		[f("accordion"), p, o("signatures")]])

	let _y = (p.height - height) / 2
	p.push()
	p.translate(x, y)
	p.scale(scale)
	let buff = p.createGraphics(s.inch(11 * 3), s.inch(8.5 / 3))
	if (printing) {
		p.background('#fff')
		drawSaddle(p,
			signatures[1].spreads,
			signatures[1].sheets,
			p.width / 2, _y,
			signatures[1].spreadNum,
		)
		// drawSaddleDouble(p,
		// 	signatures[1].spreads,
		// 	signatures[1].sheets,
		// 	signatures[1].spreadNum,
		// 	p.width / 2,
		// 	s.em(2), height + s.inch(.5) + s.em(1),
		// )
	}
	else {
		p.background('#eee')
		signatures[1].spreads[1].draw(buff)
		drawingFolds(buff)
		// p.image(buff, 0, 0, buff.width, buff.height)
		p.stroke(0)
		p.noFill()
		p.rect(0, 0, buff.width, buff.height)
		// drawSignature(p,
		// 	signatures[1].spreads,
		// 	signatures[1].sheets,
		// 	p.width / 2, _y,
		// 	signatures[1].spreadNum
		// )
	}
	p.pop()
}

function drawingFolds(buff) {
	console.log("buff", buff.width, buff.height)
	p.push()
	p.translate(0, nw)
	p.rotate(-90)
	// p.opacity(.3)
	// p.rotate(-p.mouseX)

	let circles = img => {
		img.push()
		// img.rotate(-5)
		img.angleMode(img.DEGREE)
		img.rotate(90)
		img.translate(0,-buff.height)
		// img.translate(0, -buff.height)
		img.image(buff, 0,0, buff.width, buff.height)
		// img.rect(0,0,buff.width, buff.height)
		img.pop()
	}

	let imgss = p.createGraphics(buff.height, buff.width)
	circles(imgss)
	p.image(imgss, nx, ny, buff.height, buff.width)

	let lines = JSON.parse(JSON.stringify(baselines))
	let linescopy = JSON.parse(JSON.stringify(baselines))

	// drawQuad(mainrect, )
	lines.forEach((e, i) => {
		if (i == index) {
			p.stroke(255, 0, 0)
			p.strokeWeight(1)
			p.line(e[0].x, e[0].y, e[1].x, e[1].y,)
		}
		else drawLine(e)
	})

	p.opacity(.95)

	let drawat = []
	let _index = 0
	let currentline = []
	let currentmirror = []
	if (right) {
		let pp = p.createGraphics(p.width, p.height)
		pp.fill(255)
		pp.opacity(.95)
		pp.push()
		pp.translate(350, 150)

		while (lines.length > 1) {
			let popped = lines.shift()
			let mirrorline = [popped[0], popped[1]]
			let f = [mirrorline[0], mirrorline[1], lines[0][1], lines[0][0],].reduce((acc, e) => {
				let otherside = mirror(e, mirrorline)
				acc.push(otherside)
				return acc
			}, [])

			lines = lines.reduce((acc, e) => {
				// let otherside = mirror(e, mirrorline)
				acc.push([mirror(e[0], mirrorline), mirror(e[1], mirrorline)])
				return acc
			}, [])

			pp.fill(205)
			// drawQuad(tomirror)
			pp.fill(255, 150, 150)
			drawQuad(f, pp)
			mirrorline.map((e, i) => { pp.text(i, e.x, e.y) })
			mainrect.map((e, i) => { pp.text(i, e.x, e.y) })

			if (_index == index) {
				currentline = popped
				currentmirror = mirrorline
			}

			if (_index % 2 == 1) {
				let img = pp.createGraphics(buff.height, buff.width)
				circles(img)

				let mask = pp.createGraphics(nw, nh)
				// drawQuad(v(0,0), v(30,15), v(28,45), v(0,45), mask)
				let vv1 = baselines[_index]
				let vv2 = baselines[_index + 1]
				let cuttl = [vv1[0].x - nx, vv1[0].y - ny]
				mask.quad(
					cuttl[0],
					cuttl[1],
					vv1[1].x - nx,
					vv1[1].y - ny,

					vv2[1].x - nx,
					vv2[1].y - ny,
					vv2[0].x - nx,
					vv2[0].y - ny
				)
				img.mask(mask)
				let yy = pp.min(cuttl[1], vv1[1].y - ny)
				img = img.get(cuttl[0], yy, nw, pp.max(vv2[1].y, vv2[0].y) - yy)

				let realcurrentline = linescopy[_index]
				let start = vdup(realcurrentline[0])
				let end = vdup(mirrorline[0])
				let diffv = end.sub(start)
				let transformedline = realcurrentline.map(v => vdup(v)).map(e => e.add(diffv))

				let p2 = mirrorline[0]
				let p1 = mirrorline[1]
				let p3 = transformedline[1]

				let inv = 1
				if (p1.y - p3.y < 0) inv = -1

				// pp.stroke(255,0,255)
				// pp.strokeWeight(5)
				// pp.line(transformedline[0].x, transformedline[0].y, transformedline[1].x, transformedline[1].y)
				// pp.triangle(p1.x,p1.y, p2.x, p2.y, p3.x, p3.y)

				let AB = pp.dist(p1.x, p1.y, p2.x, p2.y);
				let BC = pp.dist(p2.x, p2.y, p3.x, p3.y);
				let AC = pp.dist(p1.x, p1.y, p3.x, p3.y);
				let cosAngle = (AB * AB + BC * BC - AC * AC) / (2 * AB * BC);
				// cosAngle = pp.constrain(cosAngle, -1, 1);
				let _angle = pp.acos(cosAngle)

				pp.push()
				let off = 0
				if (p3.y < p2.y) off = p2.y - p3.y
				pp.translate(mirrorline[0].x, mirrorline[0].y)
				pp.rotate(_angle * inv)
				pp.image(img, 0, -off, img.width, img.height)
				pp.pop()

			}

			_index++

		}
		// pp.line(currentline[0].x, currentline[0].y, currentline[1].x, currentline[1].y)

		pp.pop()
		p.image(pp, -550, 50, pp.width, pp.height)
	}

	p.stroke(255, 0, 0)
	p.strokeWeight(1)

	p.stroke(255, 0, 255)
	// p.line(transformedline[0].x, transformedline[0].y,transformedline[1].x, transformedline[1].y)
	p.text(index, 30, 50)

	p.stroke(0, 0, 255)


	p.pop()
}

let x = 0
let scale = 1
let y = 0

let contentsOne = [
	[
		[f("map"), ['hello', 'world', 'what'], f('foot')]
	],
	[
		[f("History"), 1,
		[f("Circle"), f("{}"),
		['radius', [f('inch'), 2]],
		['stroke', 'blue'],
		['strokeWeight', [5]],
		[f('position'), [f('inch'), 0.5], [f('inch'), 2.8]]
		],

		[f("Circle"), f("{}"),
		['radius', [f('inch'), 2]],

		['stroke', 'blue'],
		['strokeWeight', [5]],
		['x', [f('inch'), 0.5]],
		['y', [f('inch'), 2.2]]
		],

		[f("Circle"), f("{}"),
		['radius', [f('inch'), 2]],

		['stroke', 'blue'],
		['strokeWeight', [5]],
		['x', [f('inch'), 0.5]],
		['y', [f('inch'), 1.6]]
		]
		],

		[f("Fold"), f("Circle"), f("{}"),
		['radius', [f('inch'), 1]],

		['stroke', 'blue'],
		['strokeWeight', [5]],
		['x', [f('inch'), 0.5]],
		['y', [f('inch'), 1.2]]],

		[f("Fold"), fn("Loop"), [o("i"), [f("range"), 5]],
		[f("Circle"), f("{}"),
		['radius', [f('inch'), o("i")]],
		['stroke', 'blue'],
		['strokeWeight', [5]],
		['x', [f('inch'), 1]],
		['y', [f('inch'), 1.2]]],
		],
	],

	[
		[f("foot"), 'DAWG', 'right']
	],
	[foot(['Fall'])], [],
]

if (localStorage.getItem("data")) {
	contentsOne = JSON.parse(localStorage.getItem('data'))
}


let contentsTwo = [
	[foot(['2025', 'right'])], [], [foot(['screenings', 'right'])], [foot(['lucida', 'right'])], [],
]


let mode = reactive('display')
mode.toggle = () => { mode.value() == 'saddle' ? mode.next('display') : mode.next('saddle') }
oninit.push(() =>
	mode.subscribe((v) => (v == 'saddle'
		? setprinting(true)
		: setprinting(false), render())))

let button = (fn, text, attr) => ['button', { onclick: fn, ...attr }, text]
let cursor = reactive([0])
// setTimeout(() => cursor.next([0,1]), 2800)
cursor.subscribe((v) => {
	let selected = document.querySelector("*[selected='true']")
	if (selected) selected.setAttribute('selected', 'false')

	selected = document.querySelector(`*[address='${v.join("-")}']`)
	if (selected) {
		selected.setAttribute('selected', 'true')
		selected.scrollIntoView({ block: "center", behavior: "smooth" })
	}

})

let flashselected = () => {
	document.querySelectorAll("*[selected='true']").forEach(e => {
		e.setAttribute("selected", 'false')
		setTimeout(() => { e.setAttribute("selected", 'true') }, 50)
	})
}

cursor.goNext = (out = false) => {
	let [ref, refindex] = getcurrentref()
	if (refindex < ref.length - 1) {
		cursor.next((e) => (e[e.length - 1] += 1, e))
		let [ref, refindex] = getcurrentref()
		if (out && Array.isArray(ref[refindex])) {
			let notdone = true
			while (notdone) {
				cursor.next(e => (e.push(0), e))
				ref = getcurrentref()[0]
				refindex = getcurrentref()[1]

				if (!Array.isArray(ref[refindex])) notdone = false
			}
		}
	}
	else if (out) (cursor.goUp(), cursor.goNext(true))
}
cursor.goPrev = (out = false) => {
	let [_, refindex] = getcurrentref()
	if (refindex != 0) {
		cursor.next((e) => (e[e.length - 1] -= 1, e))

		let [ref, refindex] = getcurrentref()
		if (out && Array.isArray(ref[refindex])) {
			let notdone = true

			while (notdone) {
				cursor.next((e) => (e.push(ref[refindex].length - 1), e))
				ref = getcurrentref()[0]
				refindex = getcurrentref()[1]

				if (!Array.isArray(ref[refindex])) notdone = false
			}
		}
	}
	else if (out) (cursor.goUp(), cursor.goPrev(true))
	else cursor.goUp()
}

cursor.goUp = () => {
	if (cursor.value().length > 1) cursor.next((e) => (e.pop(), e))
}

let selected = (i, address) => {
	let addy = [...address]
	if (i != undefined) { addy.push(i) }
	let addy_str = addy.join('-')
	return {
		address: addy_str, selected: addy_str == cursor.value().join('-'), onclick: (e) => {
			e.stopImmediatePropagation()
			e.stopPropagation()
			cursor.next([...addy])
		}
	}
}
let defaultrenderer = (el, i, a, change) => {
	if (Array.isArray(el)) { return arrayui(el, a.concat([i])) }
	else if (isSymbol(el) || isFunction(el)) {
		let r = renderers[el.name]
		if (r) { change(r); return r(el, i, a, change) }
		else return ["span" + (isFunction(el) ? isScopedFunction(el) ? ".scoped.function" : ".function" : ".symbol"), selected(i, a), el.name]
	}
	else if (typeof el == 'string') { return ["span.string", selected(i, a), el] }
	else if (typeof el == 'number') { return ["span.number", selected(i, a), el + ""] }
	else console.error(el)
}

let arrayui = (arr, address = [], renderer = defaultrenderer) => {
	// change should manage the resetting back of the rendere
	let change = r => renderer = r
	let f = arr.map((el, i) => {
		return renderer(el, i, address, change)
	})

	return ['.array', {
		tabindex: 0,
		...selected(address[address.length - 1], address.slice(0, -1)),
	},
		...f]
}
let uirenders = reactive(0)
uirenders.subscribe(() => {
	localStorage.setItem('data', JSON.stringify(contentsOne))
})

let current = contentsOne
let sidebar = [
	".side-bar",
	memo(() => arrayui(current), [uirenders])
]

let plus = (e) => e + 1

let exportmaybe = () => {
	pagenums[1].next(0)
	for (let i = 0; i < 19; i++) {
		setTimeout(() => {
			p.save("ead-spreads-" + pagenums[1].value() + ".jpg")
			pagenums[1].next(e => e + 1)
		}, 850)
	}
}

let ui = dom(
	[".root",
		sidebar,
		['.ui',
			...pagenums.slice(1, 2).map(num => ['div',
				button(() => num.next(v => v - 1), 'prev'),
				['span.number', num],
				button(() => num.next(v => v + 1), 'next'),
			]),

			['div',
				button(() => mode.toggle(), mode),
				button(() => p.save("ead-spreads-" + pagenums[1].value() + ".jpg"), 'download'),
				button(exportmaybe, 'export')
			],

			['div',
				['div',
					button(() => { x -= 100; render() }, "<-"),
					button(() => { x += 100; render() }, "->"),
				],

				['div',
					button(() => { y -= 100; render() }, "^"),
					button(() => { y += 100; render() }, "v"),
				],

				['div',
					button(() => { scale += .1; render() }, "+"),
					button(() => { scale -= .1; render() }, "-"),
				],

			],
		]])

let last = []
document.body.appendChild(ui)
// Book will manage the spreads itself

// Canvas....
// Canvas is the drawing context that takes a book and manages the drawing
// can it take multiple books?

// what I'm calling a book right now is just a signature...

// so if I rename and begin again
// canvas manages
// book manages
// signatures manages
// sheets and spreads
// manages content

// book manages accordian view
// signatures just manage their individual content

// now if I want 

// A [0, 1] [2, 3] [4 0] 
// B [0, 1] [2, 3] [4 0]

// A (3) and B (2) to make an alt spread...
// Where will the content for this go. 
// Which will treat the Recto of A as Verso and Verso of B as Recto

// Does the book manage this? How does it tell spreads to draw this?
// Does it draw over them?

// somethjing like....
// let a = new Signature([1,2,3])
// let b = new Signature([1,2,3])

// something like this?
// a.add(3, contents, {xoffset, yoffset})
// b.add(2, contents, {xoffset, yoffset})

// where xoffset and yoffset are based on spine to edge distance
// the offsets will make the content work so that they treat recto as verso and verso as recto type shit

// note: a graphic element that connects across spreads^
// will validate their status as a spread... cuz they join. (paratext for book?)

// making books is just about surfaces and coordinate system.
// so you can alter the coordinate system and surfaces...

let mountinput = (attr, after = false) => {
	let pos = document.querySelector("*[selected='true']")
	let { x, y, width, height } = pos.getBoundingClientRect()
	let input = dom(['input', attr])
	let div = dom('.input-box', {
		style: `
				position: fixed;
				left: ${x}px;
				top: ${y + height}px;
				background: yellow;`}, input)
	setTimeout(() => {
		document.body.appendChild(div)
		input.focus()
	}, 10)
}

document.onkeydown = e => {
	if (e.key == 'l') pagenums[0].next(v => v + 1)
	// if (e.key == 'R') {
	// 	let [ref, refindex] = getcurrentref()
	// 	let item = ref[refindex]
	// 	// Make a history for execution reversal
	// 	// ref[refindex] = [f("History"), 1, item,runa(item)]
	// 	console.log(runa(ref[refindex]))
	// 	ref[refindex] = runa(item)
	// 	uirenders.next(plus)
	// 	render()

	// }

	if (e.key == 'q'){index > 0 ? index--:null}
	if (e.key == 'e'){baselines.length-2 > index ? index++:null}
	if (e.key == 'w'){right = !right}

	if (e.key == 'f') {
		let [ref, refindex] = getcurrentref()
		if (isFunction(ref[refindex][0]) && ref[refindex][0].name == 'Fold') {
			ref[refindex].shift()
			uirenders.next(plus)
			render()
		}

		else {
			ref[refindex].unshift(f("Fold"))
			uirenders.next(plus)
			render()
		}
	}
	if (e.key == 'ArrowRight') {
		let [ref, refindex] = getcurrentref()
		if (isFunction(ref[refindex][0]) && ref[refindex][0].name == 'History') {
			ref[refindex][1] += 1
			uirenders.next(plus)
			render()
		}

		else {
			// cursor go next but go inside if it is array
			if (Array.isArray(ref[refindex])) {
				let notdone = true
				while (notdone) {
					cursor.next(e => (e.push(0), e))
					ref = getcurrentref()[0]
					refindex = getcurrentref()[1]
					if (!Array.isArray(ref[refindex])) notdone = false
				}
			}
			else cursor.goNext(true)
		}
	}

	if (e.key == 'a') {
		e.preventDefault()
		let [ref, refindex] = getcurrentref()
		ref.splice(refindex + 1, 0, [f("function")])
		uirenders.next(plus)
		render()
	}

	if (e.key == 'd') {
		e.preventDefault()
		let [ref, refindex] = getcurrentref()
		ref.splice(refindex + 1, 0, f("function"))
		uirenders.next(plus)
		render()
	}

	if (e.key == 'n') {
		e.preventDefault()
		let [ref, refindex] = getcurrentref()
		ref.splice(refindex + 1, 0, 69)
		uirenders.next(plus)
		render()
	}

	if (e.key == 's') {
		e.preventDefault()
		let [ref, refindex] = getcurrentref()
		ref.splice(refindex + 1, 0, "string")
		uirenders.next(plus)
		render()
	}

	if (e.key == 'o') {
		e.preventDefault()
		let [ref, refindex] = getcurrentref()
		ref.splice(refindex + 1, 0, o("symbol"))
		uirenders.next(plus)
		render()
	}

	// if (e.key == 'w') {
	// 	let [ref, refindex] = getcurrentref()
	// 	if (isFunction(ref[refindex][0]) && ref[refindex][0].name == 'position') {
	// 		ref[refindex][2][1] -= .25
	// 		uirenders.next(plus)
	// 		render()
	// 	}
	// }
	// if (e.key == 'a') {
	// 	let [ref, refindex] = getcurrentref()
	// 	if (isFunction(ref[refindex][0]) && ref[refindex][0].name == 'position') {
	// 		ref[refindex][1][1] -= .25
	// 		uirenders.next(plus)
	// 		render()
	// 	}
	// }
	// if (e.key == 's') {
	// 	let [ref, refindex] = getcurrentref()
	// 	if (isFunction(ref[refindex][0]) && ref[refindex][0].name == 'position') {
	// 		ref[refindex][2][1] += .25
	// 		uirenders.next(plus)
	// 		render()
	// 	}
	// }
	// if (e.key == 'd') {
	// 	let [ref, refindex] = getcurrentref()
	// 	if (isFunction(ref[refindex][0]) && ref[refindex][0].name == 'position') {
	// 		// use (next number location or smth for this)
	// 		ref[refindex][1][1] += .25
	// 		uirenders.next(plus)
	// 		render()
	// 	}
	// }

	if (e.key == 'ArrowLeft') {
		let [ref, refindex] = getcurrentref()
		if (isFunction(ref[refindex][0]) && ref[refindex][0].name == 'History') {
			ref[refindex][1] -= 1
			uirenders.next(plus)
			render()
		}

		else {
			// if it is an array go inside and to last of the el
			if (Array.isArray(ref[refindex])) {
				let notdone = true
				while (notdone) {
					cursor.next((e) => (e.push(ref[refindex].length - 1), e))
					ref = getcurrentref()[0]
					refindex = getcurrentref()[1]

					if (!Array.isArray(ref[refindex])) notdone = false
					else console.log("still going...")
				}
			}
			else cursor.goPrev(true)
		}
	}

	if (e.key == 'ArrowDown') {
		// have strategy functions for what next means in different contexts
		cursor.goNext()
	}
	if (e.key == 'ArrowUp') {
		cursor.goPrev()
	}

	if (e.key == '/') {
		e.preventDefault()
		e.stopPropagation()
		let findandactivate = (search, address) => {
			let found = false
			let ref = getref(address, current)
			if (Array.isArray(ref)) ref.forEach((item, i) => {
				if (found) return
				if (Array.isArray(item)) {
					found = findandactivate(search, [...address, i])
				}

				else {
					if (isObject(item)) {
						// check item[0].name
						if (item.name == search) {
							cursor.next([...address, i]);
							found = true
						}
					}
					else {
						if (item == search) {
							cursor.next([...address, i]);
							found = true
						}
					}
				}
			})
			else found = findandactivate(search, address.slice(0, -1))
			return found

		}
		let att = {
			onkeydown: (e) => {
				e.stopPropagation()
				if (e.key == "Escape") e.target.parentNode.remove()
				if (e.key == 'Enter') {
					findandactivate(e.target.value, cursor.value())
					e.target.parentNode.remove();
				}
			}
		}
		mountinput(att)
	}

	if (e.key == 'Enter') {
		let [ref, refindex] = getcurrentref()
		if (Array.isArray(ref[refindex])) {
			if (e.shiftKey) {
				last.push(current)
				current = ref[refindex]
				cursor.next([0])
				uirenders.next(plus)
				render()
			}
			else cursor.next((e) => (e.push(0), e))
		}
		else {
			let buffer = ref[refindex]?.name != undefined
				? ref[refindex].name : ref[refindex]
			let att = {
				oninput: (e) => buffer = e.target.value,
				onkeydown: (e) => {
					e.stopPropagation()
					if (e.key == "Escape") e.target.parentNode.remove()
					if (e.key == 'Enter') {
						let type = ref[refindex]
						if (isSymbol(type) || isFunction(type)) {
							if (isScopedFunction(type)) ref[refindex] = fn(buffer)
							else if (isFunction(type)) ref[refindex] = f(buffer)
							else ref[refindex] = o(buffer)
						}

						else if (typeof type == 'number') {
							ref[refindex] = parseFloat(buffer);
						}

						else ref[refindex] = buffer;
						uirenders.next(plus);
						render();
						e.target.parentNode.remove()
					}
				}, value: buffer
			}
			mountinput(att)
		}
	}

	if (e.key == 'Escape') {
		let i = document.querySelector(".input-box")
		if (i) {
			i.remove()
		} else {
			if (e.shiftKey && last.length > 0) {
				current = last.pop()
				cursor.next([0])
				uirenders.next(plus)
				render()
			} else cursor.goUp()
		}
	}

	if (e.key == 'x') {
		let [ref, refindex] = getcurrentref()
		buffer = ref[refindex]
		ref.splice(refindex, 1)
		uirenders.next(plus)
		render()
	}

	if (e.key == 'j') {
		// check if at cursor is number, and if is reduce
		let [ref, refindex] = getcurrentref()
		if (typeof ref[refindex] == 'number') {
			ref[refindex] -= inc
			uirenders.next(plus)
			render()
		}
	}


	if (e.key == 'k') {
		let [ref, refindex] = getcurrentref()
		if (typeof ref[refindex] == 'number') {
			ref[refindex] += inc
			uirenders.next(plus)
			render()
		}
	}

	if (e.key == 'y') {
		let [ref, refindex] = getcurrentref()
		buffer = ref[refindex]
		flashselected()
	}

	if (e.key.toLowerCase() == 'p' && buffer != undefined) {
		e.preventDefault()
		let [ref, refindex] = getcurrentref()
		if (e.shiftKey) ref.splice(refindex, 0, JSON.parse(JSON.stringify(buffer)))
		else ref.splice(refindex + 1, 0, JSON.parse(JSON.stringify(buffer)))
		uirenders.next(plus)
		render()
	}

	if (e.key == 'S') {
		let download_json = (json, file = 'data') => {
			let a = document.createElement("a");
			var json = JSON.stringify(json), blob = new Blob([json], { type: "octet/stream" }), url = window.URL.createObjectURL(blob);
			a.href = url;
			a.download = file + ".json";
			a.click();
			window.URL.revokeObjectURL(url);
		};
		download_json(contentsOne)
	}

	if (e.key == 'L') { load_json() }
	if (e.key == 'G') {
		let v = cursor.value()
		if (current == contentsOne && v.length == 1) {
			pagenums[1].next(v[0])
		}
	}
	if (e.key == 'a') {
		// will create an input box and try to parse a type
		// numbers for number
		// if starts with ' is a symbol...
		// # is a function and #: is scoped function
		// can also do arrays
	}

	if (e.key == 'h') pagenums[1].next(v => v - 1)
	if (e.key == 'l') pagenums[1].next(v => v + 1)
}

// Can be an array.... of items....
let buffer

let getcurrentref = () => {
	let curse = cursor.value()
	if (curse.length == 1) return [current, curse[0]]

	let refaddress = curse.slice(0, -1)
	let refindex = cursor.value()[cursor.value().length - 1]
	let ref = getref(refaddress, current)
	return [ref, refindex]
}
let getref = (address, arr) => {
	let copy = [...address]
	let index = copy.shift()
	if (copy.length == 0) return arr[index]
	return getref(copy, arr[index])
}

