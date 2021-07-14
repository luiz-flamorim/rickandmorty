let data = d3.json('./dataForArcs.json')
  .then(data => drawCharts(data))

function drawCharts(data) {
  //QUESTION: if I turn the network and arc on together, I need to specify source.id and target.id on the arc
  // if I turn the arc on, I just need the source and target.

  networkGraph(data)
  arcDiagram(data)
  // girdDiagram(data.nodes)
}

function arcDiagram(data) {

  console.log(data)
  // setup: dimensions and margins of the graph
  let margin = {
      top: 20,
      right: 30,
      bottom: 20,
      left: 30
    },
    width = 1500 - margin.left - margin.right,
    height = 900 - margin.top - margin.bottom;
  let y = height - margin.bottom

  //selector
  let svg = d3.select('#arc-diagram')
    .append('svg')
    .attr('class', 'arc-container')
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .append("g")
    .classed('svg-content-responsive', true)

  //new grou to transform translate
  let container = svg.append('g')
    .attr("transform", `translate(${margin.left},${margin.top})`)

  // colour scale
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

  // Scales
  let x = d3.scalePoint()
    .range([0, width - (margin.left + margin.right)])
    .domain(data.caractersAndLocationsList)

  // Circles
  let circles = container
    .selectAll("circles")
    .data(data.nodes)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.id))
    .attr("cy", height - (margin.bottom * 3))
    .attr("r", 0.5)
    .style("fill", "white")

  // add labels
  let names = container.selectAll('text')
    .data(data.nodes)
    .join('text')
    .text(d => d.name)
    .attr('class', 'arc-text')
    .attr('text-anchor', 'end')
    .attr('id', d => d.id)
    .attr("transform", (d, i) => {
      return `translate(${x(d.id)},${height - (margin.bottom * 10) + 5}) rotate(-90)`
    })
    .attr('x', 0)
    .attr('y', 0)
    .style("fill", d => {
      return d.category == 'location' ? colours(planetNumber(d.name)) : colours(planetNumber(d.location.name))
    })

  // Add the arc links
  let arcLinksPaths = container.selectAll('path')
    .data(data.links)
    .join(
      enter => enter.append("path")
      .attr("class", 'arc')
      .attr("id", d => `${d.source.id}-${d.target.id}`)
      .call(e => e.attr('d', getArc)
        .attr("class", 'arc')
        .style("fill", "none")
        .style("opacity", 0.3)
        .style("stroke-width", 1)
      ))
    .style("stroke", d => {
      return d.target.category == 'location' ? colours(planetNumber(d.target.name)) : colours(planetNumber(d.target.location.name))
    })

  function getArc(d) {
    let start = x(d.source.id)
    let end = x(d.target.id)
    let middle = (end - start) / 2
    return ['M', start, height - (margin.bottom * 10), //starting point (x,y point alues)
        'A', // A = elliptical arc
        (start - end) / 2, ',', // Next 2 lines are the coordinates of the inflexion point. Height of this point is proportional with start - end distance
        (start - end) / 2, 0, 0, ',',
        start < end ? 1 : 0, end, ',', height - (margin.bottom * 10)
      ] // arc on top; if end is before start, putting 0 here turn the arc upside down.
      .join(' ');
  }

  // // Add the highlighting functionality
  arcLinksPaths.on('mouseover', function (d) {
    let idFinder = d3.select(this)
    let characterId = idFinder._groups[0][0].id.split('-')[0]
    let planetId = idFinder._groups[0][0].id.split('-')[1]
    // id = id.toString()
    
    let selected = d3.select(`#${characterId}`)
    
    //highlight the arc
    d3.select(this)
      .style('stroke', 'white')
      .style('opacity', 1)
      .style("stroke-width", 3)

  })
    .on('mouseout', function (d) {
      arcLinksPaths
        .style("opacity", 0.3)
        .style("stroke-width", 1)
        
      .style("stroke", d => {
        return d.target.category == 'location' ? colours(planetNumber(d.target.name)) : colours(planetNumber(d.target.location.name))
      })
  })
}


function girdDiagram(data) {

  let margin = {
      top: 20,
      right: 30,
      bottom: 20,
      left: 30
    },
    width = 1500 - margin.left - margin.right,
    height = 900 - margin.top - margin.bottom;

  let adjustDiv = d3.select("#grid-chart")
    .style("width", 3000)

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
  let margin = 20
  let width = 2000 - 2 * margin
  let height = 2000 - 2 * margin

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

  // Colour scale calculated from the unique planets
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

  // add the container to translate the position
  let container = svg.append('g')
    .attr("transform", `translate(${margin},${margin})`)

  let p5Noise = new p5() //using P5.js for the Perlim Noise method
  let links = data.links

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


//BACKUP code

//VERTICAL ARCH DIAGRAM
// function arcDiagram(data) {

//   //making the dimensions
// let margin = 20
// let width = 1500 - (margin * 2);
// let x = width * 0.7
// let maxRadius = x - margin
// let height = 2.3 * maxRadius + (margin * 2)

//   let y = d3.scaleBand()
//     .domain(data.caractersAndLocationsList)
//     .range([0, height - (margin * 2)])
//     .padding(0.9)

//   let svg = d3.select('#arc-diagram')
//     .append('svg')
//     .attr('class', 'arc-container')
//     .attr("preserveAspectRatio", "xMinYMin meet")
//     .attr("viewBox", `0 0 ${width*1.1} ${height}`)
//     .append("g")
//     .classed('svg-content-responsive', true)

//   let container = svg.append('g')
//     .attr("transform", `translate(${margin},${margin})`);

//   let names = container.selectAll('text')
//     .data(data.nodes)

//   let nameText = names.join('text')
//     .attr('x', x + 5)
//     .attr('y', d => y(d.id))
//     .text(d => d.name)
//     .attr('class', 'arc-text')
//     .attr('id', d => d.id)

//   let arcLinksPaths = container.selectAll('path')
//     .data(data.links);

//   arcLinksPaths.join(
//       enter => enter.append("path")
//       .attr("class", 'arc')
//       .attr("id", d => `${d.source}-${d.target}`)
//       .call(e => e.attr('d', getArc)
//         .attr("class", 'arc')
//         .style("opacity", 0.2)
//         .style("stroke-width", 0.5)
//         .on('mouseover', arcHover)
//         .on('mouseout', arcOut)
//       )
//     )
//     .style("fill", "none")
//     .attr("stroke-width", 1);

//   function getArc(d) {
//     let start = y(d.source)
//     let end = y(d.target)
//     let middle = (end - start) / 2
//     return [`M ${x - 2} ${start} A ${middle}, ${middle} 0 0, 0 ${x - 2}, ${end}`]
//       .join(' ');
//   }

//   function arcHover(event, d) {

//     let arc = d3.select(this)
//       .style("opacity", 1)
//       .style("stroke-width", 3)

//     let source = parseInt((this.getAttribute('id').split('-')[0]))
//     let target = parseInt((this.getAttribute('id').split('-')[1]))

//     let sourceText = d3.selectAll('#4')
//       .style('fill', 'red')
//   }

//   function arcOut(event, d) {
//     d3.select(this)
//       .style("opacity", 0.2)
//       .style("stroke-width", 0.5)

//   }
// }