const url = "https://rickandmortyapi.com/api/character/";

getData(url)

async function getData(url) {
  let data = await fetchData(url)
  drawGrid(data)
}

function drawGrid(data) {

  console.log(data)

  let margin = {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50
  }

  let width = 750 - margin.left - margin.right
  let height = 750 - margin.top - margin.bottom

  let svgBackgroundColor = '#cecece';

  let svg = d3.select('#grid-chart')
    .append('svg')
    .attr("width", width)
    .attr("height", height)
    .style('background-color', svgBackgroundColor);

  let numCols = 20;
  let numRows = Math.ceil(data[0] / 20); // returns 34

  let y = d3.scaleBand()
    .range([0, data[0]])
    .domain(d3.range(numRows));

  let x = d3.scaleBand()
    .range([0, 250])
    .domain(d3.range(numCols));

  let dataGrid = d3.range(numCols * numRows);

  let container = svg.append("g")
    .attr("transform", "translate(135,130)");

  container.selectAll("circle")
    .data(data[1])
    .enter().append("circle")
    .attr("id", function (d) {
      return "id" + d.id;
    })
    .attr('cx', function (d) {
      // console.log(d.id % numCols)
      return x(d.id % numCols);
    })
    .attr('cy', function (d) {
      return y(Math.floor(d / numCols));
    })
    .attr('r', 12)
    .attr('fill', 'white')
    .style('stroke', 'black');

  //   container.selectAll("circle")
  //     .data(dataGrid)
  //     .enter().append("circle")
  //     .attr("id", function (d) {
  //       return "id" + d;
  //     })
  //     .attr('cx', function (d) {
  //       return x(d % numCols);
  //     })
  //     .attr('cy', function (d) {
  //       return y(Math.floor(d / numCols));
  //     })
  //     .attr('r', 12)
  //     .attr('fill', 'white')
  //     .style('stroke', 'black');

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
  let characters = []
  let numberOfCharacters = 0

  for (let i = 1; i <= numPages; i++) {
    let charData = await fetch(`${url}?page=${i}`)
      .then((res) => res.json())
      .then((data) => {
        let dataMap = data.results.map((item) => {
          let character = {
            id: item.id,
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