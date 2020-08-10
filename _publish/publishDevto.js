const fs = require('fs')

function publishDevto() {
    appendToPublist('2020-08-01', 'artie is the best', '1122334455')
    // const stream = fs.createWriteStream('./publist', { flags: 'a' })
    // stream.write('test test #1')
    // stream.end();
}

async function appendToPublist(publishDate, postTitle, devtoId) {
    let publist = []
    await fs.readFile('./publist.json', 'utf-8', (err, data) => {
        if (data)
            publist = JSON.parse(data)
        let metaData = {
            publishDate: new Date(publishDate),
            postTitle,
            devtoId,
            lastModified: new Date()
        }
        publist.push(metaData)
        fs.writeFileSync('./publist.json', JSON.stringify(publist))
    }).then(what => console.log(what))
}
module.exports  = publishDevto;
