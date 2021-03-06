let myScrollama = scrollama();

const figureHeight = window.innerHeight * 0.8
const figureMarginTop = (window.innerHeight - figureHeight) / 2
const stepH = Math.floor(window.innerHeight * 1.8);

let xGraphPos = {};
let yGraphPos = {};

let x1GraphPos = {};
let x2GraphPos = {};
let y1GraphPos = {};
let y2GraphPos = {};

let figure = d3.select('figure');
let article = d3.select('article');
let steps = d3.selectAll('.step');

let episodesCount = d3.select('#episodesCount').node()
let planetsCount = d3.select('#planetsCount').node()
let speciesCount = d3.select('#speciesCount').node()
let charactersCount = d3.select('#charactersCount').node()

// it works on the update.js, to reheat the simulation on step 2
let verify = true

let svgContainer,
    svgGrid,
    numCols,
    xGrid,
    yGrid,
    colours,
    filter,
    simulation,
    circles,
    link,
    planetNumber

// setup dimensions and margins of the graph
let margin = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
    },
    width = 1000 - margin.left - margin.right,
    height = 1000 - margin.top - margin.bottom;

svgGrid = d3.select('#chart')
    .append('svg')
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .classed('svg-content-responsive', true)
    .append("g")

//set of removed elements - use that on filters
let removedLinks = new Set()
let removedNodes = new Set()

d3.json('./processed.json')
    .then(raw => {
        return processData(raw)
    })
    .then(data => {
        return svgSetup(data)
    })

function getPlanetData(data) {
    // Array of the unique planets
    let planets = []
    let planetData = data.nodes.filter(d => d.category == 'location')
    let uniquePlanets = d3.groups(planetData, d => d.name)
    uniquePlanets.forEach(d => {
        planets.push(d[0])
    })

    // scale for the planets
    planetNumber = d3.scaleOrdinal()
        .domain(planets)
        .range(d3.range(planets.length))

    colours = d3.scaleSequential()
        .domain([0, planets.length - 1])
        .interpolator(d3.interpolateRainbow)
}

function getUniqueSpecies(data) {
    let uniqueSpecies = []
    let uniqueSpeciesNodes = d3.groups(data.nodes, d => d.species)
    uniqueSpeciesNodes.forEach(item => {
        if (item[0]) {
            uniqueSpecies.push(item[0])
        }
    })
    return uniqueSpecies
}

function svgSetup(data) {

    // update the figures in the HTML
    episodesCount.innerHTML = data.count.episodesCount
    planetsCount.innerHTML = data.count.planetsCount
    speciesCount.innerHTML = data.count.speciesCount
    charactersCount.innerHTML = data.count.charactersCount

    // autocomplete
    autoComplete(data.nodes)

    // slider
    createSlider(data)

    filter = data.nodes.filter(d => d.category == 'location')
    numCols = Math.ceil(Math.sqrt(filter.length))

    yGrid = d3.scaleBand()
        .range([margin.bottom, height - margin.top])
        .domain(d3.range(numCols))

    xGrid = d3.scaleBand()
        .range([margin.left, width - margin.right])
        .domain(d3.range(numCols))

    svgContainer = svgGrid.append("g")
        .attr("transform", `translate(${xGrid.bandwidth()/2},${yGrid.bandwidth()/2})`);

    getPlanetData(data);

    simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.links)
            .id(d => d.id)
            .distance((d, i) => 80 * Math.random())
        )
        .force('center', d3.forceCenter()
            .x(width / 2.2)
            .y(height / 2.2))
        .force("charge", d3.forceManyBody().strength(-25))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .force('collide', d3.forceCollide(d => d.radius))
        .on("tick", ticked)

    circles = svgContainer.selectAll("circle")
        .data(data.nodes, d => d.id)
        .join("circle")
        .attr('r', d => d.radius)
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .style('opacity', 0)

    svgContainer.selectAll("line")
        .data(data.links, d => d.index)
        .join('line')

    circles.data()
        .map((d, i) => {
            xGraphPos[d.index] = d.x;
            yGraphPos[d.index] = d.y;
            return [];
        })

    simulation.stop()
    for (let i in d3.range(300)) {
        ticked();
    }

    function ticked() {
        let link = svgContainer.selectAll('line')
        let circles = svgContainer.selectAll('circle')
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        circles
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
    }

    function handleResize() {
        steps.style("height", stepH + 'px')
        figure
            .style('height', figureHeight + 'px')
            .style('top', figureMarginTop + 'px')
        myScrollama.resize();
    }

    function init() {
        handleResize()
        myScrollama.setup({
            step: '.step',
            offset: Math.floor(window.innerHeight) * 1 + 'px',
            debug: true
        }).onStepEnter(handleStepChange)
        window.addEventListener('resize', handleResize)
    }

    function handleStepChange(response) {

        switch (response.index) {
            case 0:
                update(filter, [], 0);
                break;
            case 1:
                update(filter, [], 1);
                break;

            case 2:
                update(data.nodes, data.links, 2);
                break;
        }
    }

    init();
}

function processData(data) {

    console.log(data)

    let episodesCount = data.episodes.length
    let charactersCount = data.nodes.filter(d => d.category == 'character').length
    let planetsCount = data.nodes.filter(d => d.category == 'location').length
    let speciesCount = d3.group(data.nodes, d => d.species).size

    data.count = {
        episodesCount,
        charactersCount,
        planetsCount,
        speciesCount
    }

    let dNodes = data.nodes
    dNodes.forEach(node => {
        node.opacity = 1
        node.radius = node.category == 'location' ? 20 : 5

        node.x = Math.random() * width;
        node.y = Math.random() * height;
    })
    return data
}

function autoComplete(nodes) {
    let autocompleteNames = {}
    nodes.map(d => {
        let char = {
            [d.name]: d.image
        }
        Object.assign(autocompleteNames, char)
    })
    M.AutoInit()

    let elems = document.querySelectorAll('.autocomplete')
    M.Autocomplete.init(elems, {
        data: autocompleteNames,
        onAutocomplete: filterCharAndPlanets,
        limit: 5
    });
}

function createSlider(data) {

    let slider = document.getElementById('mySlider');
    noUiSlider.create(slider, {
        start: [0],
        connect: 'lower',
        step: 1,
        orientation: 'horizontal',
        range: {
            'min': 0,
            'max': 100
        },
        tooltips: true,
        format: wNumb({
            decimals: 0
        })
    });

    let locationNodes = data.nodes.filter(d => d.category == 'location')
    let locationNameToId = new Map()

    for (const n in locationNodes) {
        locationNameToId.set(locationNodes[n].id, locationNodes[n].name)
    }

    let planetGroup = d3.rollup(data.nodes, v => v.length, d => {
        if (d.category == 'character') {
            return d.location.name
        } else {
            return
        }
    })


    slider.noUiSlider.on('change', function filterSlider(values, handle, unencoded, tap, positions, noUiSlider) {

        let filteredPlanets = new Set()

        for (const [key, value] of planetGroup) {
            if (value >= values[0] && key !== undefined) {
                filteredPlanets.add(key)
            }
        }

        let filteredP = data.nodes.filter(d => {
            if (d.category == 'character') {
                return filteredPlanets.has(d.location.name)
            } else {
                return filteredPlanets.has(d.location)
            }
        })

        let filteredL = data.links.filter(d => filteredPlanets.has(locationNameToId.get(d.target.id)))

        update(filteredP, filteredL, 2)
        simulation.alphaTarget(0.001).restart()

        circles.data()
            .map((d, i) => {
                xGraphPos[d.index] = d.x;
                yGraphPos[d.index] = d.y;
                return [];
            })

        link.data()
            .map((d, i) => {
                x1GraphPos[d.index] = d.source.x;
                x2GraphPos[d.index] = d.target.x;
                y1GraphPos[d.index] = d.source.y;
                y2GraphPos[d.index] = d.target.y;
                return [];
            })
    })
}