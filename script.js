const url = "https://rickandmortyapi.com/api/character/";

getData(url)

async function getData(url) {
  let data = await fetchData(url)
  drawGrid(data)
}

async function arcDiagram(data) {

}

function drawGrid(data) {

  let dimension = 40
  let margin = {
    top: dimension,
    bottom: dimension,
    left: dimension,
    right: dimension
  };

  let width = 750 - margin.left - margin.right;
  let height = 750 - margin.top - margin.bottom;

  let svgBackgroundColor = "#cecece";

  let svg = d3.select('#grid-chart')
    .append('svg')
    .attr("width", width)
    .attr("height", height)
    .style('background-color', svgBackgroundColor)
    .append("g")

  let numCols = Math.ceil(Math.sqrt(data[0]));
  let numRows = numCols

  let y = d3.scaleBand()
    .range([margin.top, height - margin.bottom])
    .domain(d3.range(numRows))

  let x = d3.scaleBand()
    .range([margin.left, width - margin.right])
    .domain(d3.range(numCols))

  let container = svg.append("g")
    .attr('id', 'container')
    .attr("transform", `translate(${x.bandwidth()/2},${y.bandwidth()/2})`);

  container.selectAll("circle")
    .data(data[1])
    .enter()
    .append("circle")
    .attr("id", d => `${d.id}`)
    .attr('cx', function (d, i) {
      return x((d.id) % numCols);
    })
    .attr('cy', function (d, i) {
      return y(Math.floor(d.id / numCols));
    })
    .attr('r', numCols / 3)
    .attr('fill', 'white')
    .style('stroke', 'black');
}

async function fetchData(url) {
  let numPages = await fetch(url)
    .then((res) => res.json())
    .then((data) => {
      let numberOfPages = data.info.pages;
      return numberOfPages;
    }).catch(err => console.log(err))

  let genderList = new Map();
  let speciesList = new Map();
  let characters = [];
  let numberOfCharacters = 0

  for (let i = 1; i <= numPages; i++) {
    let charData = await fetch(`${url}?page=${i}`)
      .then((res) => res.json())
      .then((data) => {
        let dataMap = data.results.map((item) => {
          let character = {
            id: item.id - 1,
            origin: item.origin.name,
            name: item.name,
            gender: item.gender,
            species: item.species,
            image: item.image,
            url: item.url
          };
          characters.push(character)
          numberOfCharacters++

          if (!genderList.has(item.gender)) {
            genderList.set(`${item.gender}`, 1);
          } else {
            genderList.set(
              `${item.gender}`,
              genderList.get(`${item.gender}`) + 1
            );
          }

          if (!speciesList.has(item.species)) {
            speciesList.set(`${item.species}`, 1);
          } else {
            speciesList.set(
              `${item.species}`,
              speciesList.get(`${item.species}`) + 1
            );
          }
          return character
        });
        return dataMap
      })
  }
  return [numberOfCharacters, characters, genderList, speciesList]
}