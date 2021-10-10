let myScrollama = scrollama();

const figureHeight = window.innerHeight * 0.8
const figureMarginTop = (window.innerHeight - figureHeight) / 2
const stepH = Math.floor(window.innerHeight * 1.8);

let figure = d3.select('figure');
// let imgV1 = d3.select('#imgV1');
// let imgV2 = d3.select('#imgV2');
// let imgV3 = d3.select('#imgV3');

let article = d3.select('article');
let steps = d3.selectAll('.step');

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

    let svgGrid = d3.select('#chart')
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
    console.log('Step changed: ' + response)
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