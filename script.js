let size = 2000

let margin = {
  top: size / 20,
  bottom: size / 20,
  left: size / 20,
  right: size / 20
};

let width = size - margin.left - margin.right;
let height = size - margin.top - margin.bottom;

let data = d3.json('/characters.json')
  .then(data => arcDiagram(data))

let adjustDiv = d3.select("#grid-chart")
  .style("width", "800px")
  .style("height", "800px");

function arcDiagram(data) {
  console.log(data)

  let links = []
  let locationsList = new Set()
  let charactersList = []

  data.forEach(item => {
    if(!charactersList.includes(item.name)){
      charactersList.push(item.name)
    } 
    locationsList.add(item.location.name)
    let link = {
      id: item.originalId,
      source: item.name,
      target: item.location.name
    }
    links.push(link)
  })

  locationsList = Array.from(locationsList)
  locationsList.sort()
  charactersList.sort()

  let charactersAndLocationList = charactersList.concat(locationsList)
  let listLenght = charactersAndLocationList.length

  let x = width * 0.8

  let y = d3.scaleBand()
    .domain(charactersAndLocationList)
    .range([0, listLenght * 7])
    .padding(0.9)

  let svg = d3.select('#grid-chart')
    .append('svg')
    .attr('class', 'svg-container')
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .append("g")
    .classed('svg-content-responsive', true)

  let names = svg.selectAll('text')
    .data(charactersAndLocationList)

  let nameText = names.join('text')
    .attr('x', x)
    .attr('y', d => y(d))
    .text(d => d)
    .attr('class', 'archItem')
    .style("alignment-baseline", 'central')
    .style("text-anchor", 'left')

  let arcLinksPaths = svg.selectAll('path')
    .data(links, d => d.id);

  arcLinksPaths.join(
      enter => enter.append("path")
      .style("opacity", 0)
      .attr("stroke", '#000')
      .call(e => e.attr('d', getArc)
        .style('opacity', .1)
      ),
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