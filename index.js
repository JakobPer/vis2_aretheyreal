var csvDialect = {
    "dialect": {
      "csvddfVersion": 1.2,
      "delimiter": ";",
      "doubleQuote": true,
      "lineTerminator": "\r\n",
      "quoteChar": "\"",
      "skipInitialSpace": true,
      "header": true,
      "commentChar": "#"
    }
  }

var defaultIcon = {}

function createMap() {
    defaultIcon = L.icon({
        iconUrl: "shapes/default.svg",
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    })

    let map = L.map('map', {preferCanvas: true}).setView([38.930771, -101.303710], 5);

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoiamFrb2JwZXIiLCJhIjoiY2wxN3ZjYmZqMTgzcTNvcXp6YTd0dXYwZyJ9.IG2pM_8jQVxb6ohKX9lDzQ'
    }).addTo(map);

    return map
}

async function addPoint(entry, map) {

    let lat = entry.city_latitude instanceof Number ? entry.city_latitude : parseFloat(entry.city_latitude)
    let long = entry.city_longitude instanceof Number ? entry.city_longitude : parseFloat(entry.city_longitude)
    if(!isNaN(lat) && !isNaN(long)) {
        let marker = L.marker([lat, long], {icon: defaultIcon}).addTo(map)
    }
}

document.addEventListener("DOMContentLoaded", async function () {

    let map = createMap()

    let data = await fetch('./data/nuforc_reports_00')
    let dataText = await data.text()
    let csvData = CSV.parse(dataText, csvDialect)
    let headings = csvData[0]
    let parsed = csvData.map((x,index) => {
        try {
            let data = x
            let entry = {}
            for (let i = 0; i < headings.length && i < data.length; i++) {
               entry[headings[i]] = data[i] 
            }
            return entry;
        } catch (error) {
            console.log('parsing failed for line: ' + index)
           return null 
        }
    })
    delete csvData

    console.log(parsed[1])
    // add first 100 points
    for (let i = 0; i < 1000; i++) {
        addPoint(parsed[i], map)
    }

    // get all the shapes
    let disctinctShapes = [...new Set(parsed.map(x => x.shape))]
    console.log(disctinctShapes)
})