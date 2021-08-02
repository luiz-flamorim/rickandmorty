let data = d3.json('./dataForArcs.json')
  .then(data => drawCharts(data))

function drawCharts(data) {

  //set of removed elements - use that on filters
  let removedLinks = new Set()
  let removedNodes = new Set()

  // setup dimensions and margins of the graph
  let margin = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    },
    width = 2000 - margin.left - margin.right,
    height = 2000 - margin.top - margin.bottom;

  // DOM selector
  let svg = d3.select('#diagram')
    .append('svg')
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .append("g")
    .classed('svg-content-responsive', true)

  //new group to transform translate
  let container = svg.append('g')
    .attr("transform", `translate(${margin.left},${margin.top})`)

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

  // defining the unique species
  let species = []
  let speciesData = data.nodes.filter(d => d.category == 'character')
  let uniqueCharacters = d3.groups(speciesData, d => d.species)
  uniqueCharacters.forEach(d => {
    species.push(d[0])
  })
  species.sort()

  buildLegend(species)



  //using P5js for the Perlim Noise method for the links of the network graph
  let p5Noise = new p5()

  let nodes = data.nodes
  nodes.forEach(node => {
    node.radius = node.category == 'location' ? 40 : 8
    node.x = Math.random() * width;
    node.y = Math.random() * height;
  })

  let simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(data.links)
      .id(d => d.id)
      .distance((d, i) => 200 * (p5Noise.noise(i))))
      .force('center', d3.forceCenter()
        .x(width / 2)
        .y(height / 2))
    .force("charge", d3.forceManyBody().strength(-100))
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .force('collide', d3.forceCollide(d => d.radius))
    .on("tick", ticked);


  // network graph accessory functions
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart()
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }
  
  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0)
    d.fx = null;
    d.fy = null;
  }

  update(nodes, data.links)

  function update(nodes, links) {

    let link = container.selectAll("line")
    .data(links, d => d.index)
    .join(
      enter => enter.append("line")
      .attr("fill", "none")
      .attr("stroke-width", 1)
      .attr('stroke', d => {
        return d.source.category == 'location' ? colours(planetNumber(d.source.name)) : colours(planetNumber(d.source.location.name))
      }),
      update => update,
      exit => exit.remove()
    )

    let circles = container.selectAll("circle")
      .data(nodes, d => d.id)
      .join(
        enter => enter.append("circle")
        .attr("r", d => d.radius)
        .attr("radius", d => d.radius)
        .attr('fill', d => {
          return d.category == 'location' ? colours(planetNumber(d.name)) : colours(planetNumber(d.location.name))
        })
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)),

        update => update,
        
        exit => exit.style("opacity", 1)
        .transition()
        .duration(500)
        .style("opacity", 0)
        .remove()
      )
  }



    // this function works as a filter
    function filterSpecies(checkBox, item) {
      // let selectedSpecies = d3.selectAll('circle')
      //   .filter(d => d.species == item)

      let selectedSpecies = nodes.filter(d => d.species == item)
      let selectedLinks = data.links.filter(d => d.source.species == item)
      if (checkBox.checked) {
        selectedSpecies.forEach(item => {
          removedNodes.delete(item)
        })
        selectedLinks.forEach(item => {
          removedLinks.delete(item)
        })
      } else {
        selectedSpecies.forEach(item => {
          removedNodes.add(item)
        })
        selectedLinks.forEach(item => {
          removedLinks.add(item)
        })
      }

      let updatedNodes = nodes.filter(node => !removedNodes.has(node))
      let updatedLinks = data.links.filter(link => !removedLinks.has(link))

      update(updatedNodes, updatedLinks)
      simulation.alpha(.1).restart();
    }

    // this function gets the array of unique species to build the legend
    function buildLegend(species) {

      let legendDiv = document.querySelector('#legend')

      species.forEach(item => {
        let legendContent = document.createElement('div')
        legendContent.setAttribute('class', 'legend-item')
        legendDiv.appendChild(legendContent)

        let checkBox = document.createElement('input')
        checkBox.setAttribute('type', 'checkbox')
        checkBox.setAttribute('checked', 'true')
        legendContent.appendChild(checkBox)

        checkBox.addEventListener('change', () => {
          filterSpecies(checkBox, item)
        })

        let label = document.createElement('p')
        label.setAttribute('class', 'legend-text')
        label.innerHTML = item
        legendContent.appendChild(label)
      })
    }

  }



  // MAIN FUNCTIONS - - - - - - - - - - - - - - - - - - - - - - - - - -





  // CHARTS - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  function ticked() {
    let link = d3.selectAll('line')
    let circles = d3.selectAll('circle')
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
    circles
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
  }




  // GRID DIAGRAM - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function gridDiagram(data) {

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


  // ARC DIAGRAM - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function arcDiagram(data) {

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
    let labels = container.selectAll('text')
      .data(data.nodes)
      .join('text')
      .text(d => d.name)
      .attr('class', d => d.category == 'location' ? 'planet-label' : 'character-label')
      .attr('id', d => d.id)
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'middle')
      .attr("transform", (d, i) => {
        return `translate(${x(d.id)},${height - (margin.bottom * 15) + 5}) rotate(-90)`
      })
      .attr('x', 0)
      .attr('y', 0)
      .attr('font-size', 2)
      .attr('opacity', 1)
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
      return ['M', start, height - (margin.bottom * 15), //starting point (x,y point alues)
          'A', // A = elliptical arc
          (start - end) / 2, ',', // Next 2 lines are the coordinates of the inflexion point. Height of this point is proportional with start - end distance
          (start - end) / 2, 0, 0, ',',
          start < end ? 1 : 0, end, ',', height - (margin.bottom * 15)
        ] // arc on top; if end is before start, putting 0 here turn the arc upside down.
        .join(' ');
    }

    // Add the highlighting functionality to arcs
    arcLinksPaths.on('mouseover', function (d) {
        let idFinder = d3.select(this)
        let characterId = idFinder._groups[0][0].id.split('-')[0]
        let planetId = idFinder._groups[0][0].id.split('-')[1]

        //highlight the character
        d3.select(`#${CSS.escape(characterId)}`)
          .style('fill', 'white')
          .attr('font-size', 12)

        //highlight the Planet
        d3.select(`#${CSS.escape(planetId)}`)
          .style('fill', 'white')
          .attr('font-size', 12)

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

        labels.style("fill", d => {
            return d.category == 'location' ? colours(planetNumber(d.name)) : colours(planetNumber(d.location.name))
          })
          .attr('font-size', 2)
      })

    // Add the highlighting functionality to labels
    labels.on('mouseover', function (d) {
        let selection = d3.select(this)
        let className = selection._groups[0][0].className.animVal

        //check if the item is a planet or character
        if (className == 'planet-label') {
          let planetId = selection._groups[0][0].id
          //builds an array of ids to match the arc ids
          let arrayOfArcs = []
          let arrayOfCharacters = []
          data.links.forEach(item => {
            if (item.target.id == planetId) {
              arrayOfArcs.push(`${item.source.id}-${item.target.id}`)
              arrayOfCharacters.push(`${item.source.id}`)
            }
          })
          //highlight the arcs
          arrayOfArcs.forEach(item => {
            d3.select(`#${CSS.escape(item)}`)
              .style('stroke', 'white')
              .style('opacity', 1)
              .style("stroke-width", 1)
          })
          //highlight the characters
          arrayOfCharacters.forEach(item => {
            d3.select(`#${CSS.escape(item)}`)
              .style('fill', 'white')
              .attr('font-size', 12)
          })
          //highlight the planets
          d3.select(`#${CSS.escape(planetId)}`)
            .style('fill', 'white')
            .attr('font-size', 12)

        } else {
          let characterId = selection._groups[0][0].id
          let planetId
          let arcId
          data.links.forEach(item => {
            if (item.source.id == characterId) {
              arcId = `${item.source.id}-${item.target.id}`
              planetId = item.target.id
            }
          })
          //highlight the planets
          d3.select(`#${CSS.escape(planetId)}`)
            .style('fill', 'white')
            .attr('font-size', 12)
          //highlight the characters
          d3.select(`#${CSS.escape(characterId)}`)
            .style('fill', 'white')
            .attr('font-size', 12)
          //highlight the arcs
          d3.select(`#${CSS.escape(arcId)}`)
            .style('stroke', 'white')
            .style('opacity', 1)
            .style("stroke-width", 1)
        }

      })
      .on('mouseout', function (d) {
        arcLinksPaths
          .style("opacity", 0.3)
          .style("stroke-width", 1)
          .style("stroke", d => {
            return d.target.category == 'location' ? colours(planetNumber(d.target.name)) : colours(planetNumber(d.target.location.name))
          })

        labels.style("fill", d => {
            return d.category == 'location' ? colours(planetNumber(d.name)) : colours(planetNumber(d.location.name))
          })
          .attr('font-size', 2)
      })
  }