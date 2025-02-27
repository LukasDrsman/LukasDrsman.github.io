const canvas = document.getElementById("interactive-canvas");

const AF = 1.0E-8;
const RF = 10.3;
const TF = 1.8E-10;
const G = 1.2E-10;

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
	if (d == 0) return 0;
	return AF / (d * d);
};

const tension = (i, j) => TF * dist(i, j) * dist(i, j);

const repulsion = (i, j) => {
	const d = dist(i, j);
	if (d == 0) return 0;
	return -RF / (d * d);
};

const gravity = (i, canvas) => {
	const c = {
		x: canvas.clientWidth / 2,
		y: canvas.clientHeight / 2
	};
	const iq = getPosition(i);
	const sep = vecDiff(c, iq);
	const d = vecMag(sep);
	const usep = vecScale(1 / d, sep);
	return vecScale(G / (d * d), usep);
};

const totalForce = (i, T) => {
	return Object.keys(T).reduce((pddq, key) => {
		const j = T[key];
		if (i == j) return pddq;

		return vecSum(pddq, vecScale(
			attraction(i, j) + tension(i, j) + repulsion(i, j),
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
	

	const nameTag = document.createElement("div");
	nameTag.classList.add("blob-tag");
	nameTag.id = `tag@${key}`;
	nameTag.innerHTML = tag;

	cont.appendChild(nameTag);
	cont.appendChild(el);

	translateXY(cont, x, y);
	canvas.appendChild(cont);
	return cont;
}

const createLine = (x, y, u, v, canvas) => {
	const line = document.createElement("div");
	line.classList.add("line");
	translateXY(line, x, y);
	translateUV(line, u, v);
	canvas.appendChild(line);
	return line;
}

const renderBlobs = (data, uplink, uplinkKey, canvas) => {
	Object.keys(data).forEach(key => {
		const k = `${uplinkKey}::${key}`;
		uplink[k] = createBlob(
			Math.floor(Math.random() * canvas.clientWidth / 8 + (1/2) * canvas.clientWidth),
			Math.floor(Math.random() * canvas.clientHeight / 8 + (1/3) * canvas.clientHeight),
			k, data[key], canvas
		);
	});
};

const renderGraph = (data, dataKey, uplink, uplinkKey, connect, canvas) => {
	data.forEach((obj, i) => {
		let k = obj.uplink ? `${uplinkKey}::${obj.uplink}` : `${uplinkKey}::${i}`;
		uplink[k] = createBlob(
			Math.floor(Math.random() * canvas.clientWidth / 8 + (1/2) * canvas.clientWidth),
			Math.floor(Math.random() * canvas.clientHeight / 8 + (1/3) * canvas.clientHeight),
			k, obj[dataKey], canvas
		);

		obj.connections.forEach(connKey => {
			console.log(k, connKey, uplink[connKey]);
			const z = getPosition(uplink[k]);
			const w = getPosition(uplink[connKey]);

			if (connect[k]) connect[k][connKey] = createLine(z.x, z.y, w.u, w.v, canvas);
			else {
				connect[k] = {};
				connect[k][connKey] = createLine(z.x, z.y, w.u, w.v, canvas);
			}
		});
	});
}


window.onload = async () => {
	canvas.innerHTML = "loaded";

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
	renderGraph(graph.projects, "project", uplink, "project", connect, canvas);

	canvas.addEventListener("mousemove", event => {});

	const dt = 50;

	setInterval(() => {
		const F = {};
		Object.keys(uplink).forEach(key => {
			const cont = uplink[key];
			F[key] = totalForce(cont, uplink);
		});
		Object.keys(uplink).forEach(key => {
			const cont = uplink[key];
			const f = F[key];
			const dx = Math.random() * 2 - 1;
			const dy = Math.random() * 2 - 1;
			move(cont, f.x * dt * dt + dx, f.y * dt * dt + dy);
		});
	}, dt);
};
