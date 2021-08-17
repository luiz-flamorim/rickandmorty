const fs = require('fs')
const fetch = require("node-fetch");
const urlChar = "https://rickandmortyapi.com/api/character/";
const urlEp = "https://rickandmortyapi.com/api/episode/"

fetchData(urlChar, urlEp)

async function fetchData(url, url2) {

    try {
        let numPages = await fetch(url)
            .then((res) => res.json())
            .then((data) => {
                let numberOfPages = data.info.pages;
                return numberOfPages;
            }).catch(err => console.log(err))

        // collecting the original data for characters
        let originalData = [];
        for (let i = 1; i <= numPages; i++) {

            const percent = 100 / numPages
            const dots = ".".repeat(i)
            const left = numPages - i
            const empty = " ".repeat(left)
            process.stdout.write(`Getting characters data \r[${dots}${empty}] ${Math.ceil(i * percent)}%`)

            let charData = await fetch(`${url}?page=${i}`)
                .then((res) => res.json())
                .then((data) => {
                    let dataMap = data.results.map((item) => {
                        let character = {
                            id: item.id,
                            name: item.name,
                            species: item.species,
                            type: item.type,
                            gender: item.gender,
                            origin: item.origin,
                            location: item.location,
                            image: item.image,
                            episode: item.episode,
                            url: item.url
                        };
                        originalData.push(character)
                        return character
                    });
                    return dataMap
                })
        }

        // collecting the original data for episodes
        let epPages = await fetch(url2)
            .then((res) => res.json())
            .then((data) => {
                let numberOfPages = data.info.pages;
                return numberOfPages;
            }).catch(err => console.log(err))

        let episodes = [];
        for (let i = 1; i <= epPages; i++) {

            const percent = 100 / epPages
            const dots = ".".repeat(i)
            const left = epPages - i
            const empty = " ".repeat(left)
            process.stdout.write(`Getting episodes data \r[${dots}${empty}] ${Math.ceil(i * percent)}%`)

            let charData = await fetch(`${url2}?page=${i}`)
                .then((res) => res.json())
                .then((data) => {
                    let dataMap = data.results.map((item) => {
                        let episode = {
                            id: item.id,
                            name: item.name,
                            airdate: item.air_date,
                            episode: item.episode,
                            characters: item.characters,
                            url: item.url,
                        };
                        episodes.push(episode)
                        return episode
                    });
                    return dataMap
                })
        }


        //pre-processing the original data for the arc diagram
        let links = []
        let locationsList = new Map()
        let charactersList = new Map()
        let caractersAndLocationsList = []
        let count = originalData.length + 10
        let nodes = []

        // Loop through the Original Characters data
        originalData.forEach(item => {

            let location = item.location.name
            let id = count

            if (!charactersList.has(item.id)) {
                // console.log(item.id)
                let charId = item.id
                // let name = item.name
                let charObject = {
                    id: charId,
                    name: item.name,
                    category: 'character',
                    species: item.species,
                    type: item.type,
                    gender: item.gender,
                    origin: item.origin,
                    location: item.location,
                    image: item.image,
                    episode: item.episode,
                    url: item.url
                }
                nodes.push(charObject)
                charactersList.set(item.id, item.name)
            }

            if (!locationsList.has(item.location.name)) {
                locationsList.set(location, id)
                let locObject = {
                    id: id,
                    name: location,
                    category: 'location',
                }
                nodes.push(locObject)
                count++
            } else {
                id = locationsList.get(location)
            }

            let link = {
                source: item.id,
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

        let processedData = {
            links,
            caractersAndLocationsList,
            nodes,
            episodes
        }

        fs.writeFileSync('./processed.json', JSON.stringify(processedData, null, '\t'));
        return originalData
    } catch (err) {
        console.log(err)
    }
}