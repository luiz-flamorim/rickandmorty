let myScrollama = scrollama();

const figureHeight = window.innerHeight * 0.8
const figureMarginTop = (window.innerHeight - figureHeight) / 2
const stepH = Math.floor(window.innerHeight * 1.8);

let xGraphPos = {};
let yGraphPos = {};

let figure = d3.select('figure');
let article = d3.select('article');
let steps = d3.selectAll('.step');

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

    console.log(data)

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
            .attr('y', d => d.y), update => update,
            exit => exit
        )

        circles.data()
                .map((d, i) => {
                    xGraphPos[d.index] = d.x;
                    yGraphPos[d.index] = d.y;
                    return [];
                })
            circles.attr('cx', d => {
                    return d.category == 'location' ? 0 : d.x
                })
                .attr('cy', d => {
                    return d.category == 'location' ? 0 : d.y
                })
                .style('opacity', d => {
                    return d.category == 'location' ? 1 : 0
                })
                console.log('ended')
    return data
}




function gridDiagram(data) {

    // data = data.nodes.filter(d => d.category == 'location')
    // numCols = Math.ceil(Math.sqrt(data.length))

    svgContainer.selectAll("circle")
        .data(data, d => d.id)
        .enter()
        .append("circle")
        .attr("id", d => `planet-${d.id}`)
        .attr('cx', (d, i) => x(i % numCols))
        .attr('cy', (d, i) => y(Math.floor(i / numCols)))
        .attr('r', d => d.radius)
        .style('stroke', 'white')
        .style('stroke-width', 0)
        .style('fill', d => colours(planetNumber(d.name)))
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
        })

    // ADD Tooltips
    let circles = d3.selectAll("circle")

    tippy(circles.nodes(), {
        inertia: true,
        animateFill: true,
        offset: [0, 20]
    })
}


function processData(data) {
    let dNodes = data.nodes
    dNodes.forEach(node => {
        node.opacity = 1
        node.radius = node.category == 'location' ? 40 : 8
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
        offset: Math.floor(window.innerHeight) * 1.3 + 'px',
        debug: false
    }).onStepEnter(handleStepChange)

    window.addEventListener('resize', handleResize)
}