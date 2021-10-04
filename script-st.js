let container = d3.select('#scroll');
let graphic = container.select('.scroll__graphic');
let chart = graphic.select('.chart');
let text = container.select('.scroll__text');
let step = text.selectAll('.step');
let scroller = scrollama();


// Initialize Scrollama
init();

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
        gridDiagram(data)
    })


function gridDiagram(data) {



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

    // scale for the colours
    let colours = d3.scaleSequential()
        .domain([0, planets.length - 1])
        .interpolator(d3.interpolateRainbow)

    data = data.nodes.filter(d => d.category == 'location')

    let svgGrid = d3.select('.chart')
        .append('svg')
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .classed('svg-content-responsive', true)
        .append("g")

    let numCols = Math.ceil(Math.sqrt(data.length))

    let y = d3.scaleBand()
        .range([margin.bottom, height - margin.top])
        .domain(d3.range(numCols))

    let x = d3.scaleBand()
        .range([margin.left, width - margin.right])
        .domain(d3.range(numCols))

    let svgContainer = svgGrid.append("g")
        .attr("transform", `translate(${x.bandwidth()/2},${y.bandwidth()/2})`);

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
}


function processData(data) {
    let dNodes = data.nodes
    dNodes.forEach(node => {
        node.opacity = 1
        node.radius = node.category == 'location' ? 40 : 8
    })
    return data
}


// Scrollama functions
function handleResize() {
    let stepHeight = Math.floor(window.innerHeight * 0.75);
    step.style('height', stepHeight + 'px');

    let bodyWidth = d3.select('body').node().offsetWidth;

    graphic
        .style('height', window.innerHeight + 'px');

    let chartMargin = 32;
    let textWidth = text.node().offsetWidth;
    let chartWidth = graphic.node().offsetWidth - textWidth - chartMargin;
    let chartHeight = Math.floor(window.innerHeight / 2);

    chart
        .style('width', chartWidth + 'px')
    scroller.resize();
}

function handleStepEnter(response) {
    // response = { element, direction, index }
    step.classed('is-active', function (d, i) {
        return i === response.index;
    })
    var stepData = step.attr('data-step')
}

function handleContainerEnter(response) {
    // response = { direction }
    graphic.classed('is-fixed', true);
    graphic.classed('is-bottom', false);
}

function handleContainerExit(response) {
    graphic.classed('is-fixed', false);
    graphic.classed('is-bottom', response.direction === 'down');
}

// kick-off code to run once on load
function init() {
    handleResize();

    scroller
        .setup({
            container: '#scroll',
            graphic: '.scroll__graphic',
            text: '.scroll__text',
            step: '.scroll__text .step',
            offset: 0.5,
            debug: false,
        })
        .onStepEnter(handleStepEnter)

    // setup resize event
    window.addEventListener('resize', handleResize);
}