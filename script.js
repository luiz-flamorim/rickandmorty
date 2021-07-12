let margin = 20
let width = 1500 - (margin * 2);
let x = width * 0.7
let maxRadius = x - margin
let height = 2.3 * maxRadius + (margin * 2)

let adjustDiv = d3.select("#grid-chart")
  .style("width", 3000)

let data = d3.json('./dataForArcs.json')
  .then(data => drawCharts(data))

function drawCharts(data) {
  arcDiagram(data)
  girdDiagram(data.nodes)
  networkGraph(data)
}


function arcDiagram(data) {

  let y = d3.scaleBand()
    .domain(data.caractersAndLocationsList)
    .range([0, height - (margin * 2)])
    .padding(0.9)

  let svg = d3.select('#arc-diagram')
    .append('svg')
    .attr('class', 'arc-container')
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", `0 0 ${width*1.1} ${height}`)
    .append("g")
    .classed('svg-content-responsive', true)

  let container = svg.append('g')
    .attr("transform", `translate(${margin},${margin})`);

  let names = container.selectAll('text')
    .data(data.nodes)

  let nameText = names.join('text')
    .attr('x', x + 5)
    .attr('y', d => y(d.id))
    .text(d => d.name)
    .attr('class', 'arc-text')
    .attr('id', d => d.id)

  let arcLinksPaths = container.selectAll('path')
    .data(data.links);

  arcLinksPaths.join(
      enter => enter.append("path")
      .attr("class", 'arc')
      .attr("id", d => `${d.source}-${d.target}`)
      .call(e => e.attr('d', getArc)
        .attr("class", 'arc')
        .style("opacity", 0.2)
        .style("stroke-width", 0.5)
        .on('mouseover', arcHover)
        .on('mouseout', arcOut)
      )
    )
    .style("fill", "none")
    .attr("stroke-width", 1);

  function getArc(d) {
    let start = y(d.source)
    let end = y(d.target)
    let middle = (end - start) / 2
    return [`M ${x - 2} ${start} A ${middle}, ${middle} 0 0, 0 ${x - 2}, ${end}`]
      .join(' ');
  }

  function arcHover(event, d) {

    let arc = d3.select(this)
      .style("opacity", 1)
      .style("stroke-width", 3)

    let source = parseInt((this.getAttribute('id').split('-')[0]))
    let target = parseInt((this.getAttribute('id').split('-')[1]))

    let sourceText = d3.selectAll('#4')
      .style('fill', 'red')
  }

  function arcOut(event, d) {
    d3.select(this)
      .style("opacity", 0.2)
      .style("stroke-width", 0.5)

  }
}

function girdDiagram(data) {

  data = data.filter(d => d.category !== 'location')

  let numberOfCharacters = data.length

  let svg = d3.select('#grid-diagram')
    .append('svg')
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .classed('svg-content-responsive', true)
    .append("g")

  let numCols = Math.ceil(Math.sqrt(numberOfCharacters));
  let numRows = numCols

  let y = d3.scaleBand()
    .range([margin, height - margin])
    .domain(d3.range(numRows))

  let x = d3.scaleBand()
    .range([margin, width - margin])
    .domain(d3.range(numCols))

  let container = svg.append("g")
    .attr("transform", `translate(${x.bandwidth()/2},${y.bandwidth()/2})`);

  container.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("id", d => `${d.id}`)
    .attr('cx', d => x((d.id - 1) % numCols))
    .attr('cy', d => y(Math.floor((d.id - 1) / numCols)))
    .attr('r', numCols / 3)
    .attr('class', d => d.species)
    .classed('bubble', true)
    .append("title")
    .text(d => `${d.name}: ${d.species}`)
}

function networkGraph(data) {
  margin = 20
  width = 2000 - 2 * margin
  height = 2000 - 2 * margin

  let svg = d3.select('#network-diagram')
    .append('svg')
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", `0 0 ${width + 2 * margin} ${height + 2 * margin}`)
    .append("g")
    .classed('svg-content-responsive', true)

  let nodes = data.nodes
  nodes.forEach(node => {
    node.radius = node.category == 'location' ? 20 : 10
  })

  let links = data.links
  let planets = []
  let planetData = data.nodes.filter(d => d.category == 'location')

  let uniquePlanets = d3.groups(planetData, d => d.name)
  uniquePlanets.forEach(d => {
    planets.push(d[0])
  })

  let planetNumber = d3.scaleOrdinal()
    .domain(planets)
    .range(d3.range(planets.length))

  let colours = d3.scaleSequential()
    .domain([0, planets.length - 1])
    .interpolator(d3.interpolateRainbow)

  let container = svg.append('g')
    .attr("transform", `translate(${margin},${margin})`)

  let p5Noise = new p5()
  //using P5.js for the Perlim Noise method

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links)
      .id(d => d.id)
      .distance((d, i) => 200 * (p5Noise.noise(i))))
    .force("charge", d3.forceManyBody().strength(-100))
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .force('collide', d3.forceCollide(d => d.radius))
    .force('center', d3.forceCenter()
      .x(width / 2)
      .y(height / 2))
    .on("tick", ticked);

  const link = container.append("g")
    .attr("fill", "none")
    .attr("stroke-width", 1)
    .selectAll("line")
    .data(links)
    .join("line")
    .attr('stroke', d => {
      return d.source.category == 'location' ? colours(planetNumber(d.source.name)) : colours(planetNumber(d.source.location.name))
    })

  const node = container.append("g")
    .selectAll("g")
    .data(nodes)
    .join("g");

  const circles = node.append("circle")
    .attr("r", d => d.radius)
    .attr("radius", d => d.radius)
    .attr('fill', d => {
      return d.category == 'location' ? colours(planetNumber(d.name)) : colours(planetNumber(d.location.name))
    })
    .attr('x', Math.random() * width)
    .attr('y', Math.random() * height)
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended))


  function ticked() {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    circles
      .attr("cx", d => Math.max(d.radius, Math.min(width - (2 * d.radius), d.x)))
      .attr("cy", d => Math.max(d.radius, Math.min(height - (2 * d.radius), d.y)));
  }

  function dragstarted(event, d) {
    simulation.alphaTarget(1).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    simulation.alphaTarget(0)
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    d.fx = null;
    d.fy = null;
  }




}