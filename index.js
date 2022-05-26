import {rectangle, rearrange, bruteForceIntersections, lineIntersecions} from "./rectangle.js";

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

const iconPaths = {
    "light": "shapes/light.svg",
    "triangle": "shapes/triangle.svg",
    "circle": "shapes/circle.svg",
    "unknown": "shapes/default.svg",
    "oval": "shapes/oval.svg",
    "other": "shapes/default.svg",
    "formation": "shapes/formation.svg",
    "sphere": "shapes/sphere.svg",
    "diamond": "shapes/diamond.svg",
    "flash": "shapes/flash.svg",
    "disk": "shapes/disk.svg",
    "delta": "shapes/delta.svg",
    "cigar": "shapes/cigar.svg",
    "fireball": "shapes/fireball.svg",
    "changing": "shapes/changing.svg",
    "rectangle": "shapes/rectangle.svg",
    "egg": "shapes/egg.svg",
    "chevron": "shapes/delta.svg",
    "cross": "shapes/cross.svg",
    "cylinder": "shapes/cylinder.svg",
    "cone": "shapes/cone.svg",
    "teardrop": "shapes/teardrop.svg"
}

var icons = {}
var redIcon = {}

function createIcons() {
    for(const p in iconPaths) {
        icons[p] = L.icon({
            iconUrl: iconPaths[p],
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        })
    }
    redIcon = L.icon({
        iconUrl: "shapes/default_red.svg",
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    })
}

function createMap() {
    defaultIcon = L.icon({
        iconUrl: "shapes/default.svg",
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    })

    createIcons();

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
    let icon = icons[entry.shape] ?? defaultIcon;
    let marker = L.marker([entry.city_latitude, entry.city_longitude], {icon: icon})
    map.addLayer(marker)
    return marker;
}

document.addEventListener("DOMContentLoaded", async function () {

    let map = createMap()

    let data = await fetch('./data/data.csv')
    let dataText = await data.text()
    let csvData = CSV.parse(dataText, csvDialect)
    let headings = csvData[0]
    // parse csv data and filter invalid entries
    csvData = csvData.slice(0,3000); // for testing
    let parsed = csvData.map((x,index) => {
        try {
            let data = x
            let entry = {}
            for (let i = 0; i < headings.length && i < data.length; i++) {
               entry[headings[i]] = data[i] 
            }
            let coords = getCoords(entry);
            entry.city_latitude = coords.lat + (Math.random()-0.5)/50;
            entry.city_longitude = coords.long+ (Math.random()-0.5)/50;
            return entry;
        } catch (error) {
            console.log('parsing failed for line: ' + index)
           return null 
        }
    }).filter((x,i,a) => {
        return !(isNaN(x.city_latitude) || isNaN(x.city_longitude))
    })

    let cluster = L.markerClusterGroup()

    let markers = await Promise.all(parsed.map((x, i) => {
        return addPoint(parsed[i], cluster)
    }))

    map.addLayer(cluster);
    console.log(cluster)

    // get all the shapes
    /*
    let disctinctShapes = [...new Set(parsed.map(x => x.shape))]
    console.log(disctinctShapes)
    */

    let projectedCoords = parsed.map(x => {
        return map.project([x.city_latitude, x.city_longitude])
    })

    let rects = projectedCoords.map(x => {
        if (x != null) {
            //return new rectangle(x.x, x.y, Math.random()*5, Math.random()*5);
            return new rectangle(x.x, x.y, 1,1);
        }
        return null;
    });

    const intersections = bruteForceIntersections(rects)

    // TEST INTERSECTIONS
    /*
    const lineIts = lineIntersecions(rects);
    console.log(intersections.length)
    console.log(lineIts.length)
    lineIts.forEach((s,i) => {
        if(!rects[s.a].intersects(rects[s.b])){
            console.log("wtf");
            console.log(rects[s.a])
            console.log(rects[s.b])
        }
    })
    */
    // ENDTEST

    console.log(markers[0]);
    intersections.forEach((i) => {
        markers[i.a].options.icon = redIcon;
        markers[i.b].options.icon = redIcon;
    });

    await rearrange(rects)

    rects.forEach((rect) => {
        const start = map.unproject(rect.original_point());
        const end = map.unproject(rect.point());
        const p1 = map.unproject([rect.x - rect.w/2, rect.y - rect.h/2])
        const p2 = map.unproject([rect.x + rect.w/2, rect.y + rect.h/2])
        L.polyline([start, end], {color: 'green'}).addTo(map);
        L.rectangle([p1, p2]).addTo(map);
    })

})