const canvas = document.getElementById("interactive-canvas");

const AF = 1.0E-8;
const RF = 10.3;
const TF = 1.8E-10;
const G = 1E-9;

const translateXY = (el, x, y) => {
	el.style.setProperty("--x", x);
	el.style.setProperty("--y", y);
};

const translateUV = (el, u, v) => {
	el.style.setProperty("--u", u);
	el.style.setProperty("--v", v);
};

const getPosition = el => {
	return {
		x: parseInt(el.style.getPropertyValue("--x")),
		y: parseInt(el.style.getPropertyValue("--y"))
	};
};

const move = (el, dx, dy) => {
	const p = getPosition(el);
	translateXY(el, p.x + dx, p.y + dy);
};

const vecSum = (u, v) => ({
	x: u.x + v.x,
	y: u.y + v.y
});

const vecScale = (l, v) => ({
	x: l * v.x,
	y: l * v.y
});

const vecDiff = (u, v) => ({
	x: u.x - v.x,
	y: u.y - v.y
});

const vecMag = v => Math.sqrt(v.x * v.x + v.y * v.y);

const dist = (i, j) => vecMag(vecDiff(getPosition(j), getPosition(i)));

const unitSep = (i, j) => {
	const iq = getPosition(i);
	const jq = getPosition(j);
	const dq = vecDiff(jq, iq);

	return vecScale(1 / vecMag(dq), dq);
};

const attraction = (i, j) => {
	const d = dist(i, j);
	if (d === 0) return 0;
	return AF / (d * d);
};

const tension = (i, j) => TF * dist(i, j) * dist(i, j);

const repulsion = (i, j) => {
	const d = dist(i, j);
	if (d === 0) return 0;
	return -RF / (d * d);
};

const gravity = (i, cx, cy) => {
	const c = {
		x: cx,
		y: cy
	};
	const iq = getPosition(i);
	const sep = vecDiff(c, iq);
	const d = vecMag(sep);
	const usep = vecScale(1 / d, sep);
	return vecScale(G * d * d, usep);
};

const totalForce = (i, T) => {
	return Object.keys(T).reduce((pddq, key) => {
		const j = T[key];
		if (i === j) return pddq;

		return vecSum(pddq, vecScale(
			attraction(i, j) /*+ tension(i, j)*/ + repulsion(i, j),
			unitSep(i, j)
		));
	}, {x: 0, y: 0});
}

const createBlob = (x, y, key, tag, canvas) => {
	const cont = document.createElement("div")
	cont.classList.add("blob-container");
	cont.id = `cont@${key}`;

	const el = document.createElement("div");
	el.classList.add("blob")
	el.classList.add(`${key.split("::")[0]}-blob`);
	el.id = `blob@${key}`;

	el.addEventListener("mouseenter", event => {
		document.querySelectorAll(`.line--${key.replace("::", "--")}`).forEach(e => {
			e.classList.add("line-hi");
		});
	});
	el.addEventListener("mouseleave", event => {
		document.querySelectorAll(`.line--${key.replace("::", "--")}`).forEach(e => {
			e.classList.remove("line-hi");
		});
	});

	const nameTag = document.createElement("div");
	nameTag.classList.add("blob-tag");
	nameTag.id = `tag@${key}`;
	nameTag.innerHTML = tag;

	nameTag.addEventListener("mouseenter", event => {
		document.querySelectorAll(`.line--${key.replace("::", "--")}`).forEach(e => {
			e.classList.add("line-hi");
		});
	});
	nameTag.addEventListener("mouseleave", event => {
		document.querySelectorAll(`.line--${key.replace("::", "--")}`).forEach(e => {
			e.classList.remove("line-hi");
		});
	});

	cont.appendChild(el);
	cont.appendChild(nameTag);

	translateXY(cont, x, y);
	canvas.appendChild(cont);
	return cont;
}

const createLine = (x, y, u, v, uplink1, uplink2, canvas) => {
	const line = document.createElement("div");
	line.classList.add("line");
	line.classList.add(`line--${uplink1.replace("::", "--")}`);
	line.classList.add(`line--${uplink2.replace("::", "--")}`);
	translateXY(line, x, y);
	translateUV(line, u, v);
	canvas.prepend(line);
	return line;
}

const renderBlobs = (data, uplink, uplinkKey, canvas) => {
	Object.keys(data).forEach(key => {
		const k = `${uplinkKey}::${key}`;
		uplink[k] = createBlob(
			Math.floor(Math.random() * canvas.clientWidth / 10 + (1/2) * canvas.clientWidth),
			Math.floor(Math.random() * canvas.clientHeight / 10 + (1/3) * canvas.clientHeight),
			k, data[key], canvas
		);
	});
};

const renderGraph = (data, dataKey, uplink, uplinkKey, connect, canvas, k) => {
	const angle = 2 * Math.PI / data.length;
	const offset = Math.random();
	const len = k * Math.min(canvas.clientHeight, canvas.clientWidth);
	data.forEach((obj, i) => {
		// let k = obj.uplink ? `${uplinkKey}::${obj.uplink}` : `${uplinkKey}::${i}`;
		let k = `${uplinkKey}::${i}`;
		uplink[k] = createBlob(
			len * Math.cos(i * angle + offset) + canvas.clientWidth / 2,
			len * Math.sin(i * angle + offset) + 2 * canvas.clientHeight / 5,
			k, obj[dataKey], canvas
		);

		obj.connections.forEach(connKey => {
			const z = getPosition(uplink[k]);
			const w = getPosition(uplink[connKey]);

			if (connect[k]) connect[k][connKey] = createLine(z.x, z.y, w.x, w.y, k, connKey, canvas);
			else {
				connect[k] = {};
				connect[k][connKey] = createLine(z.x, z.y, w.x, w.y, k, connKey, canvas);
			}
		});
	});
}


window.onload = async () => {

	const resp = await fetch(
		"https://raw.githubusercontent.com/LukasDrsman/LukasDrsman.github.io/refs/heads/main/graph.json", {
			method: "GET"			
	});

	const data = await resp.json();
	const spheres = data.spheres;
	const graph = data.graph;

	let uplink = {};
	/* uplink1: {
			uplink2: line
	   }
	*/
	let connect = {};
	renderBlobs(spheres.tech, uplink, "tech", canvas);
	renderBlobs(spheres.plang, uplink, "plang", canvas);
	renderGraph(graph.projects, "project", uplink, "project", connect, canvas, 1 / 3);
	renderGraph(graph.work, "company", uplink, "work", connect, canvas, 1 / 5);

	let MF = {};
	document.addEventListener("mousemove", event => {
		const x = event.x;
		const y = event.y;
		Object.keys(uplink).forEach(key => {
			MF[key] = gravity(uplink[key], x, y);
		});
	});

	const dt = 50;

	setInterval(() => {
		const F = {};
		Object.keys(uplink).forEach(key => {
			const cont = uplink[key];
			F[key] = totalForce(cont, uplink);
			if (!MF[key]) MF[key] = {x: 0, y: 0};
		});
		Object.keys(uplink).forEach(key => {
			if (key.includes("project") || key.includes("work")) return;
			const cont = uplink[key];
			const f = F[key];
			const g = MF[key];
			const dx = Math.random() * 2 - 1;
			const dy = Math.random() * 2 - 1;
			// const dx = 0;
			// const dy = 0;
			move(cont, (f.x + g.x) * dt * dt + dx, (f.y + g.y) * dt * dt + dy);
		});

		Object.keys(connect).forEach(key1 => {
			Object.keys(connect[key1]).forEach(key2 => {
				const line = connect[key1][key2];
				const u1 = uplink[key1]
				const u2 = uplink[key2]
				const f = vecScale(40 * tension(u1, u2), unitSep(u1, u2));

				// move(u1, f.x * dt * dt, f.y * dt * dt);
				move(u2, -f.x * dt * dt, -f.y * dt * dt);

				const p1 = getPosition(u1);
				const p2 = getPosition(u2);
				translateXY(line, p1.x, p1.y);
				translateUV(line, p2.x, p2.y);
			});
		})
	}, 25);

	const ccanvas = document.getElementById("card-canvas");
	const projects = (await (await fetch(`${HOST}/projects.json`)).json()).projects;

	const cards = [];
	const pphi = 180 / (projects.length - 1);
	for (const [i, project] of projects.entries()) {
		const card = await createCard(project, ccanvas);
		// translateXY(card, 0, 10 + i * 82);
		setInitial(i * pphi, card);
		cards.push(card);
	}

	hljs.highlightAll();
	ccanvas.style.display = "";

	document.onwheel = event => {
		const dy = Math.sign(event.deltaY);

		cards.forEach((card, i) => {
			rotate(-Math.abs(event.deltaY)*dy / 10, card);
		});
	};
};
