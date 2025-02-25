const canvas = document.getElementById("interactive-canvas");

const createExperienceBlob = (x, y, tag, canvas) => {
	const el = document.createElement("div");
	el.classList.add("experience-blob");
	el.style.transform = `translate(${x}px, ${y}px)`;
	canvas.appendChild(el);
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

	let techUplink = {};
	Object.keys(tech).forEach(key => {
		techUplink[key] = createExperienceBlob(
			Math.floor(Math.random() * visualViewport.width / 2),
			Math.floor(Math.random() * visualViewport.height / 2),
			tech[key],
			canvas
		);

		canvas.innerHTML += `<br>k: ${key} v: ${tech[key]}<br>`;
	});
};