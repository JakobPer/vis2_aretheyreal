import {rectangle, rearrange} from "./rectangle.js";

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

function getCoords(entry) {
    let lat = entry.city_latitude instanceof Number ? entry.city_latitude : parseFloat(entry.city_latitude)
    let long = entry.city_longitude instanceof Number ? entry.city_longitude : parseFloat(entry.city_longitude)

    return {lat: lat, long: long}
}

async function addPoint(entry, map) {
    let marker = L.marker([entry.city_latitude, entry.city_longitude], {icon: defaultIcon})
    map.addLayer(marker)
    return marker;
}

document.addEventListener("DOMContentLoaded", async function () {

    let map = createMap()

    let data = await fetch('./data/nuforc_reports_00')
    let dataText = await data.text()
    let csvData = CSV.parse(dataText, csvDialect)
    let headings = csvData[0]
    // parse csv data and filter invalid entries
    let parsed = csvData.map((x,index) => {
        try {
            let data = x
            let entry = {}
            for (let i = 0; i < headings.length && i < data.length; i++) {
               entry[headings[i]] = data[i] 
            }
            let coords = getCoords(entry);
            entry.city_latitude = coords.lat;
            entry.city_longitude = coords.long;
            return entry;
        } catch (error) {
            console.log('parsing failed for line: ' + index)
           return null 
        }
    }).filter((x,i,a) => {
        return !(isNaN(x.city_latitude) && isNaN(x.city_longitude))
    })

    let cluster = L.markerClusterGroup()

    let markers = parsed.map((x, i) => {
        return addPoint(parsed[i], cluster)
    })

    map.addLayer(cluster);

    // get all the shapes
    let disctinctShapes = [...new Set(parsed.map(x => x.shape))]

    let projectedCoords = parsed.map(x => {
        return map.project([x.city_latitude, x.city_longitude])
    })

    let rects = projectedCoords.map(x => {
        if (x != null) {
            return new rectangle(x.x, x.y, 1, 1);
        }
        return null;
    });

    rearrange(rects)
})