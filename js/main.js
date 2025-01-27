const $ = _ => document.querySelector(_)

const $c = _ => document.createElement(_)

let canvas, bg, fg, cf, ntiles, tileWidth, tileHeight, map, tools, tool, activeTool, isPlacing

/* texture from https://opengameart.org/content/isometric-landscape */
const texture = new Image()
texture.src = `textures/01_130x66_130x230.png?${new Date()}`
texture.onload = _ => init()

// Tiles de izq a der: Normal, Agua, Camino, Camino, Camino, Camino, Camino, Camino, Camino, Camino, Camino, Camino
//                     Movimiento de Suelo, Platea

const tileCosts = {
	'Normal': 0,
	'Agua': 12000,
	'Camino': 15000,
	'Movimiento de Suelo': 8000,
	'Platea': 16000
}

const tileTypes = {
	'0,0': 'Normal',
	'0,1': 'Agua',
	'0,2': 'Camino',
	'0,3': 'Camino',
	'0,4': 'Camino',
	'0,5': 'Camino',
	'0,6': 'Camino',
	'0,7': 'Camino',
	'0,8': 'Camino',
	'0,9': 'Camino',
	'0,10': 'Camino',
	'0,11': 'Camino',
	'1,0': 'Movimiento de Suelo',
	'1,1': 'Platea'
}

const init = () => {

	tool = [0,0]

	map = [
		[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
		[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
		[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
		[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
		[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
		[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
		[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]
	]

	canvas = $("#bg")
	canvas.width = 910
	canvas.height = 666
	w = 910
	h = 462
	texWidth = 12
	texHeight = 6
	bg = canvas.getContext("2d")
	ntiles = 7
	tileWidth = 128
	tileHeight = 64
	bg.translate(w/2,tileHeight*2)

	loadHashState(document.location.hash.substring(1))

	drawMap()

	fg = $('#fg')
	fg.width = canvas.width
	fg.height = canvas.height
	cf = fg.getContext('2d')
	cf.translate(w/2,tileHeight*2)
	fg.addEventListener('mousemove', viz)
	fg.addEventListener('contextmenu', e => e.preventDefault())
	fg.addEventListener('mouseup', unclick)
	fg.addEventListener('mousedown', click)
	fg.addEventListener('touchend', click)
	fg.addEventListener('pointerup', click)

	tools = $('#tools')

	let toolCount = 0
	for(let i = 0; i < texHeight; i++){
		for(let j = 0; j < texWidth; j++){
			const div = $c('div');
			div.id = `tool_${toolCount++}`
			div.classList.add('tool')
			// Add tile tag between span tags
			div.innerHTML = `<span class="tile-text">${tileTypes[`${i},${j}`]}</span>`
			/* width of 132 instead of 130  = 130 image + 2 border = 132 */
			div.style.backgroundPosition = `-${j*130+2}px -${i*230}px`
			div.addEventListener('click', e => {
				tool = [i,j]
				if (activeTool)
					$(`#${activeTool}`).classList.remove('selected')
				activeTool = e.target.id
				$(`#${activeTool}`).classList.add('selected')
			})
			tools.appendChild( div )
		}
	}

	updateSummary(); // Actualiza el resumen al iniciar
}

// From https://stackoverflow.com/a/36046727
const ToBase64 = u8 => {
	return btoa(String.fromCharCode.apply(null, u8))
}

const FromBase64 = str => {
	return atob(str).split('').map( c => c.charCodeAt(0) )
}

const updateHashState = () => {
	let c = 0
	const u8 = new Uint8Array(ntiles*ntiles)
	for(let i = 0; i < ntiles; i++){
		for(let j = 0; j < ntiles; j++){
			u8[c++] = map[i][j][0]*texWidth + map[i][j][1]
		}
	}
	const state = ToBase64(u8)
	history.replaceState(undefined, undefined, `#${state}`)
}

const loadHashState = state => {
	const u8 = FromBase64(state)
	let c = 0
	for(let i = 0; i < ntiles; i++) {
		for(let j = 0; j < ntiles; j++) {
			const t = u8[c++] || 0
			const x = Math.trunc(t / texWidth)
			const y = Math.trunc(t % texWidth)
			map[i][j] = [x,y]
		}
	}
}

const click = e => {
	const pos = getPosition(e)
	if (pos.x >= 0 && pos.x < ntiles && pos.y >= 0 && pos.y < ntiles) {
		
		map[pos.x][pos.y][0] = (e.which === 3) ? 0 : tool[0]
		map[pos.x][pos.y][1] = (e.which === 3) ? 0 : tool[1]
		isPlacing = true

		drawMap()
		cf.clearRect(-w, -h, w * 2, h * 2)
	}
	updateHashState();
	updateSummary(); // Actualiza el resumen después de cada click
}

const unclick = () => {
	if (isPlacing)
		isPlacing = false
}

const drawMap = () =>{
	bg.clearRect(-w,-h,w*2,h*2)
	for(let i = 0; i < ntiles; i++){
		for(let j = 0; j < ntiles; j++){
			drawImageTile(bg,i,j,map[i][j][0],map[i][j][1])
		}
	}
}

const drawTile = (c,x,y,color) => {
	c.save()
	c.translate((y-x) * tileWidth/2,(x+y)*tileHeight/2)
	c.beginPath()
	c.moveTo(0,0)
	c.lineTo(tileWidth/2,tileHeight/2)
	c.lineTo(0,tileHeight)
	c.lineTo(-tileWidth/2,tileHeight/2)
	c.closePath()
	c.fillStyle = color
	c.fill()
	c.restore()
}

const drawImageTile = (c,x,y,i,j) => {
	c.save()
	c.translate((y-x) * tileWidth/2,(x+y)*tileHeight/2)
	j *= 130
	i *= 230
	c.drawImage(texture,j,i,130,230,-65,-130,130,230)
	c.restore()
}

const getPosition = e => {
	const _y =  (e.offsetY - tileHeight * 2) / tileHeight,
				_x =  e.offsetX / tileWidth - ntiles / 2
	x = Math.floor(_y-_x)
	y = Math.floor(_x+_y)
	return {x,y}
}

const viz = (e) =>{
	if (isPlacing)
		click(e)
	const pos = getPosition(e)
	cf.clearRect(-w,-h,w*2,h*2)
	if( pos.x >= 0 && pos.x < ntiles && pos.y >= 0 && pos.y < ntiles)
		drawTile(cf,pos.x,pos.y,'rgba(0,0,0,0.2)')
}

const updateSummary = () => {
	const summary = {}
	for (let i = 0; i < ntiles; i++) {
		for (let j = 0; j < ntiles; j++) {
			const tileKey = `${map[i][j][0]},${map[i][j][1]}`
			const tileType = tileTypes[tileKey]
			if (tileType) {
				if (!summary[tileType]) summary[tileType] = 0
				summary[tileType]++
			}
		}
	}

	let totalCost = 0
	const resumeElement = $('#resume')
	let tableContent = '<table><tr><th>Tipo de Tile</th><th>Cantidad</th><th>Costo</th></tr>'

	for (const [tileType, count] of Object.entries(summary)) {
		const cost = tileCosts[tileType] * count
		totalCost += cost
		const row = `<tr><td>${tileType}</td><td>${count}</td><td>${cost}</td></tr>`
		tableContent += row
	}

	tableContent += `<tr><td colspan="2">Total</td><td>${totalCost}</td></tr></table>`
	resumeElement.innerHTML = tableContent
}

function shareOnWhatsApp() {
	const url = window.location.href;
	const text = `Te envio mi cotizacion: ${url}`;
	const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
	window.open(whatsappUrl, '_blank');
}