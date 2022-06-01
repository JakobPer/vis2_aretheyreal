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
var map = {}
var rects = {}
var detailsLayer = {}
var debugLayer = {}
var linesLayer = {}
var layerControl = {}
var parsedData = []

function createIcons() {
    for(const p in iconPaths) {
        icons[p] = L.icon({
            iconUrl: iconPaths[p],
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        })
    }
    redIcon = L.icon({
        iconUrl: "shapes/default_red.svg",
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    })
}

function createMap() {
    defaultIcon = L.icon({
        iconUrl: "shapes/default.svg",
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    })

    createIcons();

    map = L.map('map', {
        preferCanvas: true,
        center: [38.930771, -101.303710],
        zoom: 6
    });

    var toner = new L.StamenTileLayer("toner-lite");
    map.addLayer(toner);
    var terrain = new L.StamenTileLayer("terrain");
    var watercolor = new L.StamenTileLayer("watercolor");


    detailsLayer = L.layerGroup().addTo(map);
    debugLayer = L.layerGroup();
    linesLayer = L.layerGroup().addTo(map);

    let baseLayers = {
        "Toner": toner,
        "Terrain": terrain,
        "Watercolor": watercolor,
    }

    let overlayLayers = {
        "Details": detailsLayer,
        "Offset Lines" : linesLayer,
        "Debug" : debugLayer
    }

    layerControl = L.control.layers(baseLayers, overlayLayers, {
        collapsed: false, 
        hideSingleBase: true
    }).addTo(map);

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

async function showDetails() {
    console.log("details")

    const bounds = map.getBounds();
    const rectsToShow = rects.filter(r => bounds.contains(L.latLng(r.lat, r.long)))

    rectsToShow.forEach((r)=> {
        const z = map.getZoom();
        const proj = map.project(r.latLong(), z);
        console.log(proj);
        r.reset(proj);
    });

    await createDetails(rectsToShow);
}

async function createDetails(rectsToShow) {

    await rearrange(rectsToShow);

    detailsLayer.clearLayers();
    linesLayer.clearLayers();
    debugLayer.clearLayers();

    rectsToShow.forEach((rect) => {
        const start = map.unproject(rect.original_point());
        const end = map.unproject(rect.point());
        const p1 = map.unproject(rect.min())
        const p2 = map.unproject(rect.max())
        const d = parsedData[rect.dataIndex];

        const imgUrl = iconPaths[d.shape] ?? "shapes/default.svg";

        const popupContent = 
        `<div class='ufo-popup'>
            <img class='ufo-image' src='`+imgUrl+`'></img>
            <b>Shape: </b>`+(d.shape === null ? 'unknown' : d.shape)+ `<br> 
            <b>State: </b>`+d.state+`<br> 
            <b>City: </b>`+d.city+`<br>
            <b>Duration: </b>`+d.duration+`<br>
            <b>On: </b>`+d.date_time+`<br>
        </div>`;

        L.polyline([start, end], {color: 'green'}).addTo(linesLayer);
        L.rectangle([p1, p2]).addTo(debugLayer);
        let popup = L.ufopopup({
           minWidth: rect.w - 30, // 20 is CSS padding, compensate a bit more
           maxWidth: rect.w - 30,
           //minHeight: rect.h, <=== does not exist
           maxHeight: rect.h - 30,
           offset: L.point(0,rect.h/2 + 15), // 20 is the offset of the bottom tip
           autoPan: false,
           closeButton: false,
           autoClose: false,
           closeOnEscape: false,
           closeOnClick: false,
        }).setLatLng(L.latLng(end))
        .setContent(popupContent).addTo(detailsLayer);
    })
}

document.addEventListener("DOMContentLoaded", async function () {

    document.querySelector('#details-button').addEventListener('click', showDetails);

    createMap()

    let data = await fetch('./data/data.csv')
    let dataText = await data.text()
    let csvData = CSV.parse(dataText, csvDialect)
    let headings = csvData[0]
    // parse csv data and filter invalid entries
    // csvData = csvData.slice(0,300); // for testing
    parsedData = csvData.map((x,index) => {
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

    let projectedCoords = parsedData.map(x => {
        return map.project([x.city_latitude, x.city_longitude], map.getZoom())
    })

    rects = projectedCoords.map((x,i) => {
        if (x != null) {
            //return new rectangle(x.x, x.y, Math.random()*5, Math.random()*5);
            let r = new rectangle(x.x, x.y, 270, 120, parsedData[i].city_latitude, parsedData[i].city_longitude);
            r.dataIndex = i;
            return r;
        }
        return null;
    });

    let cluster = L.markerClusterGroup()

    let markers = await Promise.all(parsedData.map((x, i) => {
        return addPoint(parsedData[i], cluster)
    }))

    markers.forEach((m, i) => {
        if(rects[i]!==null) {
            rects[i].marker = markers[i];
            markers[i].rectangle = rects[i];
        }
    })

    map.addLayer(cluster);
    console.log(cluster)

    // get all the shapes
    /*
    let disctinctShapes = [...new Set(parsed.map(x => x.shape))]
    console.log(disctinctShapes)
    */


    //const intersections = bruteForceIntersections(rects)

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

    /*
    await rearrange(rects)
    */

    //createDetails(rects);

    //showDetails();
})