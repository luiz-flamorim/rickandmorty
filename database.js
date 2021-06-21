const fs = require('fs')
const fetch = require("node-fetch");
const url = "https://rickandmortyapi.com/api/character/";

fetchData(url)

async function fetchData(url) {

    try {
        let numPages = await fetch(url)
            .then((res) => res.json())
            .then((data) => {
                let numberOfPages = data.info.pages;
                return numberOfPages;
            }).catch(err => console.log(err))

        // collecting the original data
        let originalData = [];
        for (let i = 1; i <= numPages; i++) {

            const percent = 100 / numPages
            const dots = ".".repeat(i)
            const left = numPages - i
            const empty = " ".repeat(left)
            process.stdout.write(`\r[${dots}${empty}] ${Math.ceil(i * percent)}%`)

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
        
        //pre-processing the original data for the arc diagram
        let links = []
        let locationsList = new Map()
        let charactersList = new Map()
        let caractersAndLocationsList = []
        let count = originalData.length + 10
        let nodes = []

        originalData.forEach(item => {

            let id = count
            let location = item.location.name

            if (!charactersList.has(item.id)) {
                let charId = item.id
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

        let dataForArcs = {
            links,
            caractersAndLocationsList,
            nodes
        }

        //write the files
        fs.writeFileSync('./originalData.json', JSON.stringify(originalData, null, '\t'));
        fs.writeFileSync('./dataForArcs.json', JSON.stringify(dataForArcs, null, '\t'));
        return originalData

    } catch (err) {
        console.log(err)
    }
}