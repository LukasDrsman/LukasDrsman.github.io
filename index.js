const canvas = document.getElementById("interactive-canvas");

window.onload = () => {
	canvas.innerHTML = "loaded";

	const resp = await fetch(
		"https://raw.githubusercontent.com/LukasDrsman/LukasDrsman.github.io/refs/heads/main/graph.json", {
			method: "GET"			
	});

	canvas.innerHTML += `<br><br>${resp.json}`;
};