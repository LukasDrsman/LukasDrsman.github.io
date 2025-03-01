const GH_REPO_API = "https://api.github.com/repos"

const GRADIENT_COLORS = {
	"C": "#FF008C",
	"Makefile": "#0077FF",
	"C++": "#0077FF",
	"Python": "#FF008C",
	"GLSL": "#65AC44",
	"CMake": "#FF7700",
	"JavaScript": "#FFBF00",
	"CSS": "#FF008C",
	"HTML": "#0077FF"
};

const TEST_PROJECT = [
	{
		"title": "voxels",
		"author": "LukasDrsman",
		"link": "https://github.com/LukasDrsman/voxels",
		"link_alt": "voxels@github",
		"langs": null,
		"description": "Voxels for parametric volume and point-cloud approximation and rendering.",
		"sections": [
			{
				"title": "Key takeaways",
				"para": "I learnt to work with OpenGL4.5 VAOs and VBOs and GLSL, applying to me then unbeknownst concepts."
			}
		]
	},
	{
		"title": "libev3min",
		"author": "TatranskiDravci",
		"link": "https://github.com/TatranskiDravci/libev3min",
		"link_alt": "libev3min@github",
		"langs": null,
		"description": "Minimalist open-source library for EV3 LEGO robots, used during First Lego League Challenge nationals in Slovakia."
	}
];

const norm = x => 31.84615 * Math.max(0, Math.log10(x));

const langsWithPct = async (project, account) => {
	account ??= "LukasDrsman";
	const resp = await fetch(`${GH_REPO_API}/${account}/${project}/languages`);
	const counts = await resp.json();

	const total = Object.keys(counts).reduce((it, k) => counts[k] + it, 0);
	return Object.keys(counts).map(k => ({lang: k, pct: counts[k] / total}));
};

const createLangSection = (lwpct) => {
	const langSec = document.createElement("div");
	langSec.classList.add("card-section");
	langSec.innerHTML = `<div class="card-section-title">Language</div>`;

	const langCont = document.createElement("div");
	langCont.classList.add("card-lang");
	let gradientStyle = "linear-gradient(to right";
	lwpct.reduce((it, {lang, pct}) => {
		console.log(norm(pct * 100));
		gradientStyle += `, ${GRADIENT_COLORS[lang]} ${it}%`;
		return it + pct * 100;
	}, 0);
	gradientStyle += ")";
	langCont.style.background = gradientStyle;

	lwpct.forEach(({lang, pct}, i) => {
		const l = document.createElement("div");
		l.classList.add("card-lang-entry");
		l.innerText = lang;
		l.style.minWidth = `fit-content`;
		l.style.width = `${norm(pct * 100)}%`;
		langCont.appendChild(l);
	});

	langSec.appendChild(langCont);

	return [langSec, gradientStyle];
};

const createCard = async (data, canvas) => {
	const card = document.createElement("div");
	card.classList.add("card");
	card.innerHTML = `
		<div class="card-header">
			<span class="card-title">${data.title}</span>
			<a href="${data.link}" class="card-link">${data.link_alt}</a>
		</div>
	`;

	const cardCont = document.createElement("div");
	cardCont.classList.add("card-content");

	card.appendChild(cardCont);
	const [langSec, gradientStyle] = createLangSection(
		data.langs ? data.langs : await langsWithPct(data.title, data.author)
	)
	cardCont.appendChild(langSec);
	card.style.borderImage = gradientStyle;
	card.style.borderImageSlice = 1;

	cardCont.innerHTML += `
		<div class="card-section">
			<div class="card-section-title">Description</div>
			<div class="card-section-para">${data.description}</div>
		</div>
	`;

	data.sections?.forEach(sec => {
		cardCont.innerHTML += `
			<div class="card-section">
				<div class="card-section-title">${sec.title}</div>
				<div class="card-section-para">${sec.para}</div>
			</div>
		`;
	});

	canvas.appendChild(card);
	return card;
};

window.onload = async () => {
	const canvas = document.getElementById("card-canvas");
	const voxels = await createCard(TEST_PROJECT[0], canvas);
	const vis3dvf = await createCard(TEST_PROJECT[1], canvas);
	voxels.style.transform = "translate3d(0vw, 25vh, 0px)";
	vis3dvf.style.transform = "translate3d(50vw, 92.5vh, 0px)";
};