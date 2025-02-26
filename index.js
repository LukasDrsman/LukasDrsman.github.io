const canvas = document.getElementById("interactive-canvas");

const createExperienceBlob = (x, y, key, tag, canvas) => {
	const cont = document.createElement("div")
	cont.classList.add("blob-container");

	const el = document.createElement("div");
	el.classList.add("experience-blob");
	

	const nameTag = document.createElement("div");
	nameTag.classList.add("blob-tag");
	nameTag.id = `tag@${key}`;
	nameTag.innerHTML = tag;

	
	cont.appendChild(el)
	cont.appendChild(nameTag)

	cont.style.transform = `translate(${x}px, ${y}px)`;
	canvas.appendChild(cont);
	return el;
}

window.onload = async () => {
	canvas.innerHTML = "loaded";

	const resp = await fetch(
		"https://raw.githubusercontent.com/LukasDrsman/LukasDrsman.github.io/refs/heads/main/graph.json", {
			method: "GET"			
	});

	const data = await resp.json();
	const spheres = data.spheres;
	const tech = spheres.tech;

	let uplink = {};
	Object.keys(tech).forEach(key => {
		uplink[`tech::${key}`] = createExperienceBlob(
			Math.floor(Math.random() * visualViewport.width / 2 + (1/3) * visualViewport.width),
			Math.floor(Math.random() * visualViewport.height / 2),
			key, tech[key], canvas
		);

		canvas.innerHTML += `<br>tag@${key} -> ${tech[key]}`;
	});
};