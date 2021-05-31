let data = d3.json('/characters.json')
  .then(data => drawGrid(data))

async function arcDiagram(data) {

}

function drawGrid(data) {

  let numberOfCharacters = data.length

  let size = 800

  let margin = {
    top: size / 20,
    bottom: size / 20,
    left: size / 20,
    right: size / 20
  };

  let width = size - margin.left - margin.right;
  let height = size - margin.top - margin.bottom;

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
    .attr("id", d => `${d.id}`)
    .attr('cx', d => x(d.id % numCols))
    .attr('cy', d => y(Math.floor(d.id / numCols)))
    .attr('r', numCols / 3)
    .attr('class', 'bubble')
}