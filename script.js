let margin = 20
let width = 3000 - (margin * 2);
let x = width * 0.7
let maxRadius = x - margin
let height = 2.3 * maxRadius + (margin * 2)

let adjustDiv = d3.select("#grid-chart")
  .style("width", 6000)

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
    // console.log(source, target)

    // .append("title")
    // .text(d => {
    //   d.source
    // })

    //look into the Circles = dark lyrics
    let sourceText = d3.selectAll('#4')
      // .select(source)
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

  let radius = 8
  let height = 1000
  let width = 1000
  let padding = 5

  // let svg = d3.select("#network-diagram")
  //   .attr("width", width)
  //   .attr("height", height)
  //   .style("background-color", svgBackgroundColor),
  //   nodes = data.nodes,
  //   links = data.links
  // // clusters = graph.clusters;  // need to build this array

  // const container = svg.append("g");

  let svg = d3.select('#network-diagram')
    .append('svg')
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .append("g")
    .classed('svg-content-responsive', true)

  let nodes = data.nodes
  let links = data.links
  let planets = []
  let planetData = data.nodes.filter(d => d.category == 'location')

  let uniquePlanets = d3.groups(planetData, d => d.name)
  uniquePlanets.forEach(d => {
    planets.push(d[0])
  })



// let colours = d3.scaleSequential(t => d3.hsl(t * 360, 1, 0.5).toString())
//   .domain(planets)

  let colours = d3.scaleOrdinal()
    .domain(planets)
    .range(["#f72585","#b5179e","#7209b7","#560bad","#480ca8","#3a0ca3","#3f37c9","#4361ee","#4895ef","#4cc9f0","#f72585","#b5179e","#7209b7","#560bad","#480ca8","#3a0ca3","#3f37c9","#4361ee","#4895ef","#4cc9f0","#f72585","#b5179e","#7209b7","#560bad","#480ca8","#3a0ca3","#3f37c9","#4361ee","#4895ef","#4cc9f0","#f72585","#b5179e","#7209b7","#560bad","#480ca8","#3a0ca3","#3f37c9","#4361ee","#4895ef","#4cc9f0","#f72585","#b5179e","#7209b7","#560bad","#480ca8","#3a0ca3","#3f37c9","#4361ee","#4895ef","#4cc9f0","#f72585","#b5179e","#7209b7","#560bad","#480ca8","#3a0ca3","#3f37c9","#4361ee","#4895ef","#4cc9f0","#f72585","#b5179e","#7209b7","#560bad","#480ca8","#3a0ca3","#3f37c9","#4361ee","#4895ef","#4cc9f0","#f72585","#b5179e","#7209b7","#560bad","#480ca8","#3a0ca3","#3f37c9","#4361ee","#4895ef","#4cc9f0","#f72585","#b5179e","#7209b7","#560bad","#480ca8","#3a0ca3","#3f37c9","#4361ee","#4895ef","#4cc9f0","#f72585","#b5179e","#7209b7","#560bad","#480ca8","#3a0ca3","#3f37c9","#4361ee","#4895ef","#4cc9f0"])
  // let colours = d3.scaleLinear()
  //   .domain(d3.range(planets.length))
  //   .range(["red", "green", "blue"])
  //   .interpolate(d3.interpolateRgb.gamma(2.2))
  //   (0.5)


  let container = svg.append('g')
    .attr("transform", `translate(${margin},${margin})`)

  const simulation = d3.forceSimulation(nodes)

    .force("link", d3.forceLink(links).id(d => d.id))
    .force("charge", d3.forceManyBody().strength(20))
    .force('collide', d3.forceCollide(d => 22))
    .force('center', d3.forceCenter()
      .x(width / 2)
      .y(height / 2))
    .on("tick", ticked);

  const link = container.append("g")
    .attr("fill", "none")
    .attr("stroke-width", 0.3)
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke", 'white')

  const node = container.append("g")
    .selectAll("g")
    .data(nodes)
    .join("g");


  //  console.log(colours(4))

  const circles = node.append("circle")
    // .attr("stroke", 'white')
    // .attr("stroke-width", 1.5)
    .attr("r", 5)
    .attr("radius", 5)
    .attr('fill', d => {
      console.log(d)
      // return d.category == 'location' ? colours(planets.indexOf(d.name)) : colors(planets.indexOf(d.origin.name))
      return d.category == 'location' ? colours(d.name) : colours(d.origin.name)

    })
    // .attr('fill', d => d.category == 'location' ? colours(planets.indexOf(d.name)) : colors(planets.indexOf(d.origin.name)))
    .attr('x', Math.random() * width)
    .attr('y', Math.random() * height)

  // const text = node.append("text")
  //   .text(d => d.name)
  //   .attr("fill", svgBackgroundColor)
  //   .style("opacity", 0)
  //   .attr("text-anchor", "middle")
  //   .attr("dy", 5)
  //   .attr("font-size", d => isNaN(d.name) == true ?  "1.1em" : "0.8em")
  //   .attr("font-family", "helvetica")
  //   .attr("font-weight", "bold")

  function ticked() {

    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    circles
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

    // text
    //   .attr("x", d => Math.max(d.radius, Math.min(width - d.radius, d.x)))
    //   .attr("y", d => Math.max(d.radius, Math.min(height - d.radius, d.y)));

  }

  // function hideNumbers(){
  //   text.style("opacity", 0);
  //   let button = d3.select("button#hideNumbers");
  //   button.attr("id", "showNumbers");
  //   button.on("click", showNumbers);
  //   button.html("Show Labels");
  // }

  // function showNumbers(){
  //   text.style("opacity", 1);
  //   let button = d3.select("button#showNumbers");
  //   button.attr("id", "hideNumbers");
  //   button.on("click", hideNumbers);
  //   button.html("Hide Labels");
  // }


  // d3.select("button#showNumbers").on("click", showNumbers);

}