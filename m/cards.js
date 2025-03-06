const GH_REPO_API = "https://api.github.com/repos";
const HOST = "https://raw.githubusercontent.com/LukasDrsman/LukasDrsman.github.io/refs/heads/main/";
const MAX_TOP = 10;
// const HOST = "http://localhost:8080";

const getPhi = el => parseInt(el.style.getPropertyValue("--phi"));
const setInitial = (phi, el) => el.style.setProperty("--off", `${phi}`);

const rotate = (phi, el) => {
	let ephi = getPhi(el);
	el.style.setProperty("--phi", `${ephi + phi}`);
};

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

const norm = x => 1.3 * 31.84615 * Math.max(0, Math.log10(x));

const langsWithPct = async (project, account) => {
	account ??= "LukasDrsman";
	const resp = await fetch(`${GH_REPO_API}/${account}/${project}/languages`);

	if (!resp.ok) return null;
	const counts = await resp.json();

	const total = Object.keys(counts).reduce((it, k) => counts[k] + it, 0);
	return Object.keys(counts).map(k => ({lang: k, pct: counts[k] / total}));
};

const createLangSection = (lwpct) => {
	const langSec = document.createElement("div");
	langSec.classList.add("card-section");
	langSec.innerHTML = `<div class="card-section-title">Languages</div>`;

	console.log(lwpct);

	const langCont = document.createElement("div");
	langCont.classList.add("card-lang");
	let gradientStyle = "linear-gradient(to right";
	if (lwpct.length > 1) {
		lwpct.reduce((it, {lang, pct}) => {
			gradientStyle += `, ${GRADIENT_COLORS[lang]} ${it}%`;
			return it + pct * 100;
		}, 0);
		gradientStyle += ")";
	}
	else gradientStyle = `linear-gradient(to right, ${GRADIENT_COLORS[lwpct[0].lang]} 0%, ${GRADIENT_COLORS[lwpct[0].lang]} 100%)`;
	langCont.style.background = gradientStyle;

	console.log(gradientStyle);

	if (lwpct.length > 1) lwpct.forEach(({lang, pct}, i) => {
		const l = document.createElement("div");
		l.classList.add("card-lang-entry");
		l.innerText = lang;
		l.style.minWidth = `fit-content`;
		l.style.width = `${norm(pct * 100)}%`;
		langCont.appendChild(l);
	});
	else langCont.innerHTML = `
		<div class="card-lang-entry" style="width: 100%; min-width: fit-content; margin-right: auto; margin-left: 0; text-align: left;">
			${lwpct[0].lang}
		</div>
	`;

	langSec.appendChild(langCont);

	return [langSec, gradientStyle];
};

const createCard = async (data, canvas) => {
	const card = document.createElement("div");
	card.classList.add("card");
	card.innerHTML = `
		<div class="card-header">
			<a href="${data.link}" class="card-link">${data.link_alt}</a>
		</div>
	`;

	const cardCont = document.createElement("div");
	cardCont.classList.add("card-content");

	const cardCol1 = document.createElement("div");
	const cardCol2 = document.createElement("div");
	cardCol1.classList.add("card-content-col");
	cardCol2.classList.add("card-content-col");

	cardCont.append(cardCol1, cardCol2);
	card.appendChild(cardCont);

	if (data.gallery.includes("code")) {
		const l = data.gallery.split("::")[1];
		const code = document.createElement("code");
		const pre = document.createElement("pre");
		code.classList.add(`language-${l}`);
		// code.classList.add(`language-c`);
		code.textContent = await (await fetch(`${HOST}/gallery/${data.title}.${l}`)).text();
		pre.appendChild(code);
		pre.classList.add("card-image");
		cardCol1.appendChild(pre);
	}
	else {
		cardCol1.innerHTML =`
			<img src="${HOST}/gallery/${data.title}.png" alt="${data.title} preview" width="100%" class="card-image">
		`;
	}

	const [langSec, gradientStyle] = createLangSection(
		data.langs ? data.langs : await langsWithPct(data.title, data.author) ?? data.langs_fallback
	)
	cardCol2.appendChild(langSec);
	card.style.borderImage = gradientStyle;
	card.style.borderImageSlice = 1;

	cardCol2.innerHTML += `
		<div class="card-section">
			<div class="card-section-title">Description</div>
			<div class="card-section-para">${data.description}</div>
		</div>
	`;

	data.sections?.forEach(sec => {
		cardCol2.innerHTML += `
			<div class="card-section">
				<div class="card-section-title">${sec.title}</div>
				<div class="card-section-para">${sec.para}</div>
			</div>
		`;
	});

	canvas.appendChild(card);
	card.style.setProperty("--phi", "0");
	return card;
};

window.onload = async () => {
	const ccanvas = document.getElementById("card-canvas");
	const projects = (await (await fetch(`${HOST}/projects.json`)).json()).projects;
	for (const [i, project] of projects.entries()) await createCard(project, ccanvas);
	hljs.highlightAll();
};