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

        let characters = [];

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
                            originalId: item.id,
                            id: item.id - 1,
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
                        characters.push(character)
                        return character
                    });
                    return dataMap
                })
        }
        fs.writeFileSync('./characters.json', JSON.stringify(characters, null, '\t'));
        return characters

    } catch (err) {
        console.log(err)
    }
}