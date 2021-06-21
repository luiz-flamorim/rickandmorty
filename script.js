let margin = 20
let width = 1500 - (margin * 2);
let x = width * 0.7
let maxRadius = x - margin
let height = 2.3 * maxRadius + (margin * 2)

let adjustDiv = d3.select("#grid-chart")
  .style("width", 3000)

let data = d3.json('./dataForArcs.json')
  .then(data => arcDiagram(data))

function arcDiagram(data) {

  let y = d3.scaleBand()
    .domain(data.caractersAndLocationsList)
    .range([0, height - (margin * 2)])
    .padding(0.9)

  let svg = d3.select('#grid-chart')
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
    // console.log(this)
      // .append("title")
      // .text(d => {
      //   d.source
      // })
      let sourceText = d3.selectAll(d.id)
      console.log(arc, sourceText)
      
  }
  function arcOut(event, d) {
    d3.select(this)
    .style("opacity", 0.2)
    .style("stroke-width", 0.5)

  }
}


function girdDiagram(data) {

  let numberOfCharacters = data.length

  let svg = d3.select('#grid-chart')
    .append('svg')
    .attr('class', 'svg-container')
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
    .attr("id", d => `${d.originalId}`)
    .attr('cx', d => x(d.id % numCols))
    .attr('cy', d => y(Math.floor(d.id / numCols))) //possibly I need to fix the 'id' to 'id - 1'
    .attr('r', numCols / 3)
    .attr('class', d => d.species)
    .classed('bubble', true)
    .append("title")
    .text(d => `${d.name}: ${d.species}`)
}

function getSpecies(data) {
  // generates a list of unique species items from the characters
  let species = new Set();
  for (let i = 0; i < data.length; i++) {
    species.add(data[i].species)
  }
  return species
}

function getGender(data) {
  // generates a list of unique genres items from the characters
  let gender = new Set();
  for (let i = 0; i < data.length; i++) {
    gender.add(data[i].gender)
  }
  return gender
}