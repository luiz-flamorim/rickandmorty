// TO DO
// episodes: create a mini area chart on the popup: total episodes x character appearence
// grid for the episodes inside of the modal

// for the episode grid, think about building the list of episodes
// as 0 and 1 inside of the character object

// Search:
//  1- if the user searches a chatacter, the reuslt will isolate the cluster and the character will be paint white
//  2- if the user seaches a planet, the result is that the cluster of the planet will be isolated
// click on a planet isolates the cluster of the planet

// Filter:
// Use a range - slider - for the number of episodes the character appear
// this range will remove characters and also the planet if it has no children.


// AUTOCOMPLETE for the main form
let data = d3.json('./processed.json')
  .then(data => {
    drawCharts(data)
    // Materialize Init
    let autocompleteNames = {}
    let singleName = data.nodes.map(d => {
      let char = {
        [d.name]: d.image
      }
      Object.assign(autocompleteNames, char)
    })
    let init = M.AutoInit()
    let elems = document.querySelectorAll('.autocomplete');
    M.Autocomplete.init(elems, {
      data: autocompleteNames
    });
  })


function drawCharts(data) {

  console.log(data)

  //set of removed elements - use that on filters
  let removedLinks = new Set()
  let removedNodes = new Set()

  // Extent of the number of episodes
  let numberOfEpisodes = d3.extent(data.nodes, item => {
    if (item.episode) {
      return item.episode.length
    } else {
      return 0
    }
  })
  let minEp = numberOfEpisodes[0]
  let maxEp = numberOfEpisodes[1]

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

  // LEGEND
  // defining the unique species
  let species = []
  let speciesData = data.nodes.filter(d => d.category == 'character')
  let uniqueCharacters = d3.groups(speciesData, d => d.species)
  uniqueCharacters.forEach(d => {
    species.push(d[0])
  })
  species.sort()
  buildLegend(species)

  //using Perlim Noise method for the links of the network graph
  let noise = new p5()

  let nodes = data.nodes
  nodes.forEach(node => {
    node.radius = node.category == 'location' ? 40 : 8
    node.x = Math.random() * width;
    node.y = Math.random() * height;
  })

  let simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(data.links)
      .id(d => d.id)
      .distance((d, i) => 200 * (noise.noise(i))))
    .force('center', d3.forceCenter()
      .x(width / 2)
      .y(height / 2))
    .force("charge", d3.forceManyBody().strength(-100))
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .force('collide', d3.forceCollide(d => d.radius))
    .on("tick", ticked);

  // inserting the grid diagram here for now
  gridDiagram(data)

  slider(data, minEp, maxEp)

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
        .attr("class", d => d.category == 'location' ? 'locations' : 'characters')
        .attr("radius", d => d.radius)
        .attr('fill', d => {
          return d.category == 'location' ? colours(planetNumber(d.name)) : colours(planetNumber(d.location.name))
        })
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .attr('data-tippy-content', (d, i) => {
          return `${d.name}`
        })
        .on('mouseover', function () {
          d3.select(this)
            .raise()
            .transition()
            .duration(100)
            .attr('r', d => d.radius * 1.2)
        })
        .on('mouseout', function () {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', d => d.radius)
        })

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

    circles.on('click', function (event, d) {
      popUp(d, data, maxEp)
    })
  }

  // ADD Tooltips
  let circles = d3.selectAll("circle")

  tippy(circles.nodes(), {
    inertia: true,
    animateFill: true,
    offset: [0, 10]
  })


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

  function ticked() {
    let link = container.selectAll('line')
    let circles = container.selectAll('circle')
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
    circles
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
  }

  // this function gets the array of unique species to build the legend
  function buildLegend(species) {

    let legendDiv = document.querySelector('#legend')

    species.forEach(item => {
      let legendContent = document.createElement('label')
      legendContent.setAttribute('class', 'legend-item')
      legendDiv.appendChild(legendContent)

      let checkBox = document.createElement('input')
      checkBox.setAttribute('type', 'checkbox')
      checkBox.setAttribute('class', 'filled-in checkbox-colour')
      checkBox.setAttribute('id', `cb-${item}`)
      checkBox.setAttribute('checked', 'true')
      legendContent.appendChild(checkBox)

      checkBox.addEventListener('change', () => {
        filterSpecies(checkBox, item)
      })

      let label = document.createElement('span')
      label.htmlFor = `cb-${item}`
      label.appendChild(document.createTextNode(`${item}`))
      label.setAttribute('class', 'legend-text')
      legendContent.appendChild(label)
    })
  }


  // GRID DIAGRAM - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function gridDiagram(data) {

    data = data.nodes.filter(d => d.category == 'location')

    let svgGrid = d3.select('#grid-diagram')
      .append('svg')
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${width} ${height/2}`)
      .classed('svg-content-responsive', true)
      .append("g")

    let numCols = Math.ceil(Math.sqrt(data.length)) * 2;

    let y = d3.scaleBand()
      .range([margin.bottom, height - margin.top])
      .domain(d3.range(numCols))

    let x = d3.scaleBand()
      .range([margin.left, width - margin.right])
      .domain(d3.range(numCols))

    let container = svgGrid.append("g")
      .attr("transform", `translate(${x.bandwidth()/2},${y.bandwidth()/2})`);

    container.selectAll("circle")
      .data(data, d => d.id)
      .enter()
      .append("circle")
      .attr("id", d => `planet-${d.id}`)
      .attr('cx', (d, i) => x(i % numCols))
      .attr('cy', (d, i) => y(Math.floor(i / numCols)))
      .attr('r', d => d.radius)
      .style('stroke', 'white')
      .style('stroke-width', 0)

      .style('fill', d => colours(planetNumber(d.name)))
      .attr('data-tippy-content', (d, i) => {
        return `${d.name}`
      })
      .on('mouseover', function () {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('r', d => d.radius * 1.2)
      })
      .on('mouseout', function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d => d.radius)
      })
  }
}


// POP UP - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// it takes the selected circle data (d), the overall data object and the total episodes count (maxEp)
function popUp(nodeData, allData, maxEp) {

  // console.log(data)
  // If it's a character, builds a big modal
  if (nodeData.category == 'character') {
    let window = document.querySelector('#modal')
    let bg = document.querySelector('.modal-bg')
    bg.addEventListener('click', function () {
      window.innerHTML = ''
      bg.classList.remove('bg-active')
    })

    bg.classList.add('bg-active')

    let popupContainer = document.createElement('div')
    popupContainer.setAttribute('id', 'card' + '-' + nodeData.id)
    popupContainer.setAttribute('class', 'popup-container')
    window.appendChild(popupContainer)

    let imageDiv = document.createElement('div')
    imageDiv.setAttribute('class', 'popup-image-div')
    popupContainer.appendChild(imageDiv)

    let contentDiv = document.createElement('div')
    contentDiv.setAttribute('class', 'popup-content-div')
    popupContainer.appendChild(contentDiv)

    let image = document.createElement('img');
    image.setAttribute("src", nodeData.image);
    image.setAttribute('class', 'popup-image')
    imageDiv.appendChild(image);

    let charName = document.createElement('p')
    charName.innerHTML = nodeData.name
    charName.setAttribute('class', 'popup-char-name')
    contentDiv.appendChild(charName)

    let charGender = document.createElement('p')
    charGender.innerHTML = `<span class="popup-char-info-bold">Gender:</span> ${nodeData.gender}`
    charGender.setAttribute('class', 'popup-char-info')
    contentDiv.appendChild(charGender)

    let charOrigin = document.createElement('p')
    charOrigin.innerHTML = `<span class="popup-char-info-bold">Origin:</span> ${nodeData.origin.name}`
    charOrigin.setAttribute('class', 'popup-char-info')
    contentDiv.appendChild(charOrigin)

    let charSpecies = document.createElement('p')
    charSpecies.innerHTML = `<span class="popup-char-info-bold">Species:</span> ${nodeData.species}`
    charSpecies.setAttribute('class', 'popup-char-info')
    contentDiv.appendChild(charSpecies)

    let charEpisodesDiv = document.createElement('Div')
    charEpisodesDiv.setAttribute('class', 'popup-char-episodes')
    contentDiv.appendChild(charEpisodesDiv)

    let allEpisodes = []

    nodeData.episode.forEach(ep => allEpisodes.push(ep))

    let episodesParagraph = document.createElement('p')
    episodesParagraph.setAttribute('class', 'popup-char-info')
    let htmlText
    if (allEpisodes.length > 1) {
      htmlText = `<span class="popup-char-info-bold">Participation on ${allEpisodes.length} Episodes</span> ${allEpisodes.join(', ')}`
    } else {
      htmlText = `<span class="popup-char-info-bold">Participation on ${allEpisodes.length} Episode</span> ${allEpisodes.join(', ')}`
    }
    episodesParagraph.innerHTML = htmlText
    charEpisodesDiv.appendChild(episodesParagraph)

    // mini episodes chart
    // follow from here: https://observablehq.com/@d3/bar-chart

    // build an array of episodes the character has participated
    // compare this list to the episode list to generate the chart colour or interatcion

    let participationList = []
    nodeData.episode.forEach(item => {
      let epNumber = item.split('/').pop()
      participationList.push(epNumber)
    })

    let miniW = contentDiv.getBoundingClientRect().width
    let miniH = contentDiv.getBoundingClientRect().width / 5

    let chartArea = d3.select(contentDiv)
      .append('svg')
      .attr('class', 'pop-up-mini-chart')
      .attr('width', miniW)
      .attr('height', miniH)

    let x = d3.scaleBand()
      .domain(d3.range(Object.keys(allData.episodes).length))
      .range([0, miniW])
      .padding(0.2)

    chartArea.append("g")
      .selectAll("rect")
      .data(allData.episodes)
      .join("rect")
      .attr("class", "bar")
      .attr("x", (d, i) => x(i))
      // .attr("y", 10)
      .attr("width", x.bandwidth())
      .attr("height", miniH)
      .attr('fill', 'white')
      .attr("opacity", d => {
        let opacity
        participationList.forEach(ep => {
          if (d.id == (+ep)) {
            opacity = 1
          } else {
            opacity = 0.2
          }
        })
        console.log(opacity)
        return opacity
      })

      // I stopped here!

    // CLOSE BUTTON
    let xClose = document.createElement('span')
    xClose.setAttribute('class', 'close material-icons')
    xClose.innerHTML = 'cancel'
    popupContainer.appendChild(xClose)
    xClose.addEventListener('click', function () {
      window.innerHTML = ''
      bg.classList.remove('bg-active')
    })
  }
  // If it's a planet, do something else
  else {
    console.log('I need to handle the planets/ locations')
  }
}

// SLIDER - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function slider(data, minEp, maxEp) {

  let htmlSlider = d3.select('#slider')
    .attr('min', minEp)
    .attr('max', maxEp)
    .attr('step', 1)
    .attr('value', 0)
    .on('change', function () {
      // this.value
      // filter any nodes that's less than to this.value
      // make sure about the consistency of the removed nodes thorugh the different filters
      // data.nodes.filter(node => !removedNodes.has(node))
    })
}
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// BACKUP FROM HERE
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 


// PREVIOUS GRID DIAGRAM - - - - - - - - - - - - - - - - - - - - - - -

// function oldGridDiagram(data) {

// let margin = {
//     top: 20,
//     right: 30,
//     bottom: 20,
//     left: 30
//   },
//   width = 1500 - margin.left - margin.right,
//   height = 900 - margin.top - margin.bottom;

//   let adjustDiv = d3.select("#grid-chart")
//     .style("width", 3000)

//   data = data.filter(d => d.category !== 'location')

//   let numberOfCharacters = data.length

//   let svg = d3.select('#grid-diagram')
//     .append('svg')
//     .attr("preserveAspectRatio", "xMinYMin meet")
//     .attr("viewBox", `0 0 ${width} ${height}`)
//     .classed('svg-content-responsive', true)
//     .append("g")

//   let numCols = Math.ceil(Math.sqrt(numberOfCharacters));
//   let numRows = numCols

//   let y = d3.scaleBand()
//     .range([margin.top, height - margin.bottom])
//     .domain(d3.range(numRows))

//   let x = d3.scaleBand()
//     .range([margin, width - margin])
//     .domain(d3.range(numCols))

//   let container = svg.append("g")
//     .attr("transform", `translate(${x.bandwidth()/2},${y.bandwidth()/2})`);

//   container.selectAll("circle")
//     .data(data)
//     .enter()
//     .append("circle")
//     .attr("id", d => `${d.id}`)
//     .attr('cx', d => x((d.id - 1) % numCols))
//     .attr('cy', d => y(Math.floor((d.id - 1) / numCols)))
//     .attr('r', numCols / 3)
//     .attr('class', d => d.species)
//     .classed('bubble', true)
//     .append("title")
//     .text(d => `${d.name}: ${d.species}`)
// }

// // ARC DIAGRAM - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// function arcDiagram(data) {

//   // Scales
//   let x = d3.scalePoint()
//     .range([0, width - (margin.left + margin.right)])
//     .domain(data.caractersAndLocationsList)

//   // Circles
//   let circles = container
//     .selectAll("circles")
//     .data(data.nodes)
//     .enter()
//     .append("circle")
//     .attr("cx", d => x(d.id))
//     .attr("cy", height - (margin.bottom * 3))
//     .attr("r", 0.5)
//     .style("fill", "white")

//   // add labels
//   let labels = container.selectAll('text')
//     .data(data.nodes)
//     .join('text')
//     .text(d => d.name)
//     .attr('class', d => d.category == 'location' ? 'planet-label' : 'character-label')
//     .attr('id', d => d.id)
//     .attr('text-anchor', 'end')
//     .attr('alignment-baseline', 'middle')
//     .attr("transform", (d, i) => {
//       return `translate(${x(d.id)},${height - (margin.bottom * 15) + 5}) rotate(-90)`
//     })
//     .attr('x', 0)
//     .attr('y', 0)
//     .attr('font-size', 2)
//     .attr('opacity', 1)
//     .style("fill", d => {
//       return d.category == 'location' ? colours(planetNumber(d.name)) : colours(planetNumber(d.location.name))
//     })

//   // Add the arc links
//   let arcLinksPaths = container.selectAll('path')
//     .data(data.links)
//     .join(
//       enter => enter.append("path")
//       .attr("class", 'arc')
//       .attr("id", d => `${d.source.id}-${d.target.id}`)
//       .call(e => e.attr('d', getArc)
//         .attr("class", 'arc')
//         .style("fill", "none")
//         .style("opacity", 0.3)
//         .style("stroke-width", 1)
//       ))
//     .style("stroke", d => {
//       return d.target.category == 'location' ? colours(planetNumber(d.target.name)) : colours(planetNumber(d.target.location.name))
//     })

//   function getArc(d) {
//     let start = x(d.source.id)
//     let end = x(d.target.id)
//     let middle = (end - start) / 2
//     return ['M', start, height - (margin.bottom * 15), //starting point (x,y point alues)
//         'A', // A = elliptical arc
//         (start - end) / 2, ',', // Next 2 lines are the coordinates of the inflexion point. Height of this point is proportional with start - end distance
//         (start - end) / 2, 0, 0, ',',
//         start < end ? 1 : 0, end, ',', height - (margin.bottom * 15)
//       ] // arc on top; if end is before start, putting 0 here turn the arc upside down.
//       .join(' ');
//   }

//   // Add the highlighting functionality to arcs
//   arcLinksPaths.on('mouseover', function (d) {
//       let idFinder = d3.select(this)
//       let characterId = idFinder._groups[0][0].id.split('-')[0]
//       let planetId = idFinder._groups[0][0].id.split('-')[1]

//       //highlight the character
//       d3.select(`#${CSS.escape(characterId)}`)
//         .style('fill', 'white')
//         .attr('font-size', 12)

//       //highlight the Planet
//       d3.select(`#${CSS.escape(planetId)}`)
//         .style('fill', 'white')
//         .attr('font-size', 12)

//       //highlight the arc
//       d3.select(this)
//         .style('stroke', 'white')
//         .style('opacity', 1)
//         .style("stroke-width", 3)

//     })
//     .on('mouseout', function (d) {
//       arcLinksPaths
//         .style("opacity", 0.3)
//         .style("stroke-width", 1)
//         .style("stroke", d => {
//           return d.target.category == 'location' ? colours(planetNumber(d.target.name)) : colours(planetNumber(d.target.location.name))
//         })

//       labels.style("fill", d => {
//           return d.category == 'location' ? colours(planetNumber(d.name)) : colours(planetNumber(d.location.name))
//         })
//         .attr('font-size', 2)
//     })

//   // Add the highlighting functionality to labels
//   labels.on('mouseover', function (d) {
//       let selection = d3.select(this)
//       let className = selection._groups[0][0].className.animVal

//       //check if the item is a planet or character
//       if (className == 'planet-label') {
//         let planetId = selection._groups[0][0].id
//         //builds an array of ids to match the arc ids
//         let arrayOfArcs = []
//         let arrayOfCharacters = []
//         data.links.forEach(item => {
//           if (item.target.id == planetId) {
//             arrayOfArcs.push(`${item.source.id}-${item.target.id}`)
//             arrayOfCharacters.push(`${item.source.id}`)
//           }
//         })
//         //highlight the arcs
//         arrayOfArcs.forEach(item => {
//           d3.select(`#${CSS.escape(item)}`)
//             .style('stroke', 'white')
//             .style('opacity', 1)
//             .style("stroke-width", 1)
//         })
//         //highlight the characters
//         arrayOfCharacters.forEach(item => {
//           d3.select(`#${CSS.escape(item)}`)
//             .style('fill', 'white')
//             .attr('font-size', 12)
//         })
//         //highlight the planets
//         d3.select(`#${CSS.escape(planetId)}`)
//           .style('fill', 'white')
//           .attr('font-size', 12)

//       } else {
//         let characterId = selection._groups[0][0].id
//         let planetId
//         let arcId
//         data.links.forEach(item => {
//           if (item.source.id == characterId) {
//             arcId = `${item.source.id}-${item.target.id}`
//             planetId = item.target.id
//           }
//         })
//         //highlight the planets
//         d3.select(`#${CSS.escape(planetId)}`)
//           .style('fill', 'white')
//           .attr('font-size', 12)
//         //highlight the characters
//         d3.select(`#${CSS.escape(characterId)}`)
//           .style('fill', 'white')
//           .attr('font-size', 12)
//         //highlight the arcs
//         d3.select(`#${CSS.escape(arcId)}`)
//           .style('stroke', 'white')
//           .style('opacity', 1)
//           .style("stroke-width", 1)
//       }

//     })
//     .on('mouseout', function (d) {
//       arcLinksPaths
//         .style("opacity", 0.3)
//         .style("stroke-width", 1)
//         .style("stroke", d => {
//           return d.target.category == 'location' ? colours(planetNumber(d.target.name)) : colours(planetNumber(d.target.location.name))
//         })

//       labels.style("fill", d => {
//           return d.category == 'location' ? colours(planetNumber(d.name)) : colours(planetNumber(d.location.name))
//         })
//         .attr('font-size', 2)
//     })
// }