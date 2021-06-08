let size = 4000
let margin = {
  top: size / 20,
  bottom: size / 20,
  left: size / 20,
  right: size / 20
};
let width = size - margin.left - margin.right;
let x = width * 0.8
let maxRadius = x - margin.left
let height = 2 * maxRadius + (margin.bottom + margin.top)

let adjustDiv = d3.select("#grid-chart")
  .style("width", "2000")
// .style("height", "9000");

let data = d3.json('/characters.json')
  .then(data => arcDiagram(data))

function arcDiagram(data) {
  // console.log(data)

  let links = []
  let locationsList = new Map()
  let charactersList = new Map()
  let caractersAndLocationsList = []
  let count = data.length + 10
  let nodes = []

  data.forEach(item => {

    let id = count
    let location = item.location.name

    if (!charactersList.has(item.originalId)) {
      let charId = item.originalId
      let name = item.name
      let charObject = {
        id: charId,
        name: name,
        type: 'character'
      }
      nodes.push(charObject)
      charactersList.set(charId, name)
    }

    if (!locationsList.has(item.location.name)) {
      locationsList.set(location, id)
      let locObject = {
        id: id,
        name: location,
        type: 'location'
      }
      nodes.push(locObject)
      count++
    } else {
      id = locationsList.get(location)
    }

    let link = {
      source: item.originalId,
      target: id
    }
    links.push(link)

  })

  for (let [key, value] of charactersList) {
    caractersAndLocationsList.push(key)
  }
  for (let [key, value] of locationsList) {
    caractersAndLocationsList.push(value)
  }

  let y = d3.scaleBand()
    .domain(caractersAndLocationsList)
    .range([0, height - (margin.top + margin.bottom)])
    .padding(0.9)

  let svg = d3.select('#grid-chart')
    .append('svg')
    .attr('class', 'svg-container')
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .append("g")
    .classed('svg-content-responsive', true)

  let container = svg.append('g')
    .attr("transform", `translate(${margin.left},${margin.top})`);

  let names = container.selectAll('text')
    .data(nodes)

  let nameText = names.join('text')
    .attr('x', x + 100)
    .attr('y', d => y(d.id))
    .text(d => d.name)
    .attr('class', 'archItem')
    .classed('archItem-hidden', 'true')
    .style("alignment-baseline", 'central')
    .style("text-anchor", 'left')

    

  let rectangles = names.join('rect')
    .style("fill", "black")
    .attr('x', x)
    .attr("width", 30)
    .attr('y', d => y(d.id))
    .attr("height", 5)
    .on('mouseover', mouseOver)
    .on('mouseout', mouseOut)

  let arcLinksPaths = container.selectAll('path')
    .data(links, d => d.id);

  arcLinksPaths.join(
      enter => enter.append("path")
      .style("opacity", 0)
      .attr("stroke", '#000')
      .call(e => e.attr('d', getArc)
        .style('opacity', .3)
      ),
    )
    .style("fill", "none")
    .attr("stroke-width", 1);

  function mouseOver() {

    let rect = d3.select(this)
      .transition()
      .duration(500)

    rect.attr('x', x + x / 60)
      .attr('y', d => y(d.id) - 10)
      .style("fill", "red")
      .attr("width", 100)
      .attr("height", 40)
      .style('z-index', '2')

      nameText.classed('archItem-hidden', 'false')


  }

  function mouseOut() {

    let rect = d3.select(this)
      .transition()
      .duration(300)

    rect.attr('x', x)
      .attr('y', d => y(d.id))
      .attr("width", 30)
      .attr("height", 3)
      .style("fill", "black")
  }

  function getArc(d) {
    let start = y(d.source)
    let end = y(d.target)
    let middle = (end - start) / 2
    return [`M ${x - 2} ${start} A ${middle}, ${middle} 0 0, 0 ${x - 2}, ${end}`]
      .join(' ');
  }

}

function drawGrid(data) {

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
    .range([margin.top, height - margin.bottom])
    .domain(d3.range(numRows))

  let x = d3.scaleBand()
    .range([margin.left, width - margin.right])
    .domain(d3.range(numCols))

  let container = svg.append("g")
    .attr("transform", `translate(${x.bandwidth()/2},${y.bandwidth()/2})`);

  container.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("id", d => `${d.originalId}`)
    .attr('cx', d => x(d.id % numCols))
    .attr('cy', d => y(Math.floor(d.id / numCols)))
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