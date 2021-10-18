let myScrollama = scrollama();

const figureHeight = window.innerHeight * 0.8
const figureMarginTop = (window.innerHeight - figureHeight) / 2
const stepH = Math.floor(window.innerHeight * 1.8);

let xGraphPos = {};
let yGraphPos = {};

let figure = d3.select('figure');
let article = d3.select('article');
let steps = d3.selectAll('.step');

let episodesCount = d3.select('#episodesCount').node()
let planetsCount = d3.select('#planetsCount').node()
let speciesCount = d3.select('#speciesCount').node()
let charactersCount = d3.select('#charactersCount').node()


let svgContainer,
    svgGrid,
    numCols,
    xGrid,
    yGrid,
    colours,
    filter,
    simulation,
    circles,
    link

//set of removed elements - use that on filters
let removedLinks = new Set()
let removedNodes = new Set()

init()

// setup dimensions and margins of the graph
let margin = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
    },
    width = 1000 - margin.left - margin.right,
    height = 1000 - margin.top - margin.bottom;

d3.json('./processed.json')
    .then(raw => {
        return processData(raw)
    })
    .then(data => {
        return svgSetup(data)
    })

function svgSetup(data) {

    // update the figures in the HTML
    episodesCount.innerHTML = data.count.episodesCount
    planetsCount.innerHTML = data.count.planetsCount
    speciesCount.innerHTML = data.count.speciesCount
    charactersCount.innerHTML = data.count.speciesCount

    // set the autoComplete
    let autocompleteNames = {}
    data.nodes.map(d => {
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

    function filterCharAndPlanets(name) {
        let filteredName = data.nodes.filter(d => d.name == name)
        data.nodes.forEach(item => {
            if (item.locationToId == filteredName[0].locationToId) {
                item.opacity = 1
            } else {
                item.opacity = 0.2
            }
        })
        let updatedNodes = data.nodes.filter(node => !removedNodes.has(node))
        let updatedLinks = data.links.filter(link => !removedLinks.has(link))

        // needs the update function(?)
        // update(updatedNodes, updatedLinks)
    }


    // Array of the unique planets
    let planets = []
    let planetData = data.nodes.filter(d => d.category == 'location')
    let uniquePlanets = d3.groups(planetData, d => d.name)
    uniquePlanets.forEach(d => {
        planets.push(d[0])
    })

    // scale for the planets
    let planetNumber = d3.scaleOrdinal()
        .domain(planets)
        .range(d3.range(planets.length))

    colours = d3.scaleSequential()
        .domain([0, planets.length - 1])
        .interpolator(d3.interpolateRainbow)

    filter = data.nodes.filter(d => d.category == 'location')
    numCols = Math.ceil(Math.sqrt(filter.length))


    svgGrid = d3.select('#chart')
        .append('svg')
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .classed('svg-content-responsive', true)
        .append("g")


    yGrid = d3.scaleBand()
        .range([margin.bottom, height - margin.top])
        .domain(d3.range(numCols))

    xGrid = d3.scaleBand()
        .range([margin.left, width - margin.right])
        .domain(d3.range(numCols))

    svgContainer = svgGrid.append("g")
        .attr("transform", `translate(${xGrid.bandwidth()/2},${yGrid.bandwidth()/2})`);

    simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.links)
            .id(d => d.id)
            .distance((d, i) => 200 * Math.random())
        )
        .force('center', d3.forceCenter()
            .x(width / 2)
            .y(height / 2))
        .force("charge", d3.forceManyBody().strength(-100))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .force('collide', d3.forceCollide(d => d.radius))
        .on("tick", ticked)

    simulation.stop()
    for (let i in d3.range(300)) {
        ticked();
    }

    function ticked() {
        console.log('tick')
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

    link = svgContainer.selectAll("line")
        .data(data.links, d => d.index)
        .join(
            enter => enter.append("line")
            .attr("fill", "none")
            .attr("stroke-width", 1)
            .attr("opacity", 0)
            .attr('stroke', d => {
                return d.source.category == 'location' ? colours(planetNumber(d.source.name)) : colours(planetNumber(d.source.location.name))
            }),
            update => update,
            exit => exit.remove()
        )

    circles = svgContainer.selectAll("circle")
        .data(data.nodes, d => d.id)
        .join(
            enter => enter.append("circle")
            .attr("r", d => d.radius)
            .attr("class", d => d.category == 'location' ? 'locations' : 'characters')
            .attr("radius", d => d.radius)
            .attr("opacity", 0)
            .attr('fill', d => {
                return d.category == 'location' ? colours(planetNumber(d.name)) : colours(planetNumber(d.location.name))
            })
            .attr('x', d => d.x)
            .attr('y', d => d.y)
            .attr('data-tippy-content', (d, i) => {
                return `${d.name}`
            })
            .on('mouseover', function () {
                d3.select(this)
                    .style("cursor", "pointer")
                    .raise()
                    .transition()
                    .duration(100)
                    .attr('r', d => d.radius * 1.2)
            })
            .on('mouseout', function () {
                d3.select(this)
                    .lower()
                    .transition()
                    .duration(200)
                    .attr('r', d => d.radius)
            }),
            update => update,
            exit => exit
        )

    circles.data()
        .map((d, i) => {
            xGraphPos[d.index] = d.x;
            yGraphPos[d.index] = d.y;
            return [];
        })
    circles.attr('cx', d => {
            return d.category == 'location' ? width / 2 : d.x
        })
        .attr('cy', d => {
            return d.category == 'location' ? height / 2 : d.y
        })
        .style('opacity', d => {
            return d.category == 'location' ? 1 : 0
        })

    // ADD Tooltips
    let circlesInDiagram = svgContainer.selectAll("circle")

    tippy(circlesInDiagram.nodes(), {
        inertia: true,
        animateFill: true,
        offset: [0, 20]
    })

    return data
}

function processData(data) {

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
        node.radius = node.category == 'location' ? 40 : 8
        node.x = Math.random() * width;
        node.y = Math.random() * height;
    })
    return data
}

function handleResize() {

    steps.style("height", stepH + 'px')

    figure
        .style('height', figureHeight + 'px')
        .style('top', figureMarginTop + 'px')

    myScrollama.resize();
}

function handleStepChange(response) {
    console.log('Step changed: ' + response.element, response.direction, response.index)

    if (response.index == 0) {
        circles.data()
            .map((d, i) => {
                xGraphPos[d.index] = d.x;
                yGraphPos[d.index] = d.y;
                return [];
            })
        circles.transition()
            .duration(1000).attr('cx', d => {
                return d.category == 'location' ? width / 2 : d.x
            })
            .attr('cy', d => {
                return d.category == 'location' ? height / 2 : d.y
            })
            .style('opacity', d => {
                return d.category == 'location' ? 1 : 0
            })
    }

    if (response.index == 1) {
        circles.filter(d => d.category == 'location')
            .transition()
            .duration(1000)
            .attr('cx', (d, i) => xGrid(i % numCols))
            .attr('cy', (d, i) => yGrid(Math.floor(i / numCols)))
    }
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