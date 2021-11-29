// POP UP - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// it takes the selected circle data (nodeData), the overall data object (allData) and the total episodes count (maxEp)
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

        let participationList = new Set()
        nodeData.episode.forEach(item => {
            let epNumber = item.split('/').pop()
            participationList.add(+epNumber)
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
            .padding(0.5)

        chartArea.append("g")
            .selectAll("rect")
            .data(allData.episodes)
            .join("rect")
            .attr("class", "bar")
            .attr("x", (d, i) => x(i))
            .attr("width", x.bandwidth())
            .attr("height", miniH)
            .attr('fill', 'white')
            .attr("opacity", d => participationList.has(d.id) ? 1 : 0.2)
            .attr('data-tippy-content', (d, i) => {
                return `${d.airdate} | ${d.name} | ${d.episode}`
            })

        // ADD to the mini chart
        let rectangles = d3.selectAll("rect")

        tippy(rectangles.nodes(), {
            inertia: true,
            animateFill: true,
            offset: [0, 10]
        })

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