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
var rects = []
var detailUfoLayer = {}
var detailsLayer = {}
var debugLayer = {}
var linesLayer = {}
var layerControl = {}
var parsedData = []
var cluster = {}

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


    detailUfoLayer = L.layerGroup().addTo(map);
    detailsLayer = L.layerGroup().addTo(map);
    debugLayer = L.layerGroup();
    linesLayer = L.layerGroup().addTo(map);

    cluster = L.markerClusterGroup({
        chunkedLoading: true,
        chunkProgress: (processed, total, time) => {console.log("Progress: " + ((processed/total)*100))}
    })
    map.addLayer(cluster);

    let baseLayers = {
        "Toner": toner,
        "Terrain": terrain,
        "Watercolor": watercolor,
    }

    let overlayLayers = {
        "UFOs": cluster,
        "Detail UFOs": detailUfoLayer,
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

async function createMarker(entry) {
    let icon = icons[entry.shape] ?? defaultIcon;
    let marker = L.marker([entry.city_latitude, entry.city_longitude], {icon: icon})
    return marker;
}

async function showDetails() {
    console.log("details")

    const bounds = map.getBounds();
    const rectsToShow = rects.filter(r => bounds.contains(L.latLng(r.lat, r.long)))

    rectsToShow.forEach((r)=> {
        const z = map.getZoom();
        const proj = map.project(r.latLong(), z);
        r.reset(proj);
    });

    await createDetails(rectsToShow);
}

async function createDetails(rectsToShow) {

    const success = await rearrange(rectsToShow);
    if(!success) {
        console.log("rearrange ran into timeout");
        alert("Rearrange ran into timeout");
        return;
    }

    map.removeLayer(cluster);
    detailsLayer.clearLayers();
    detailUfoLayer.clearLayers();
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
        detailUfoLayer.addLayer(rect.marker);
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

async function loadData(csvFile) {

    //let data = await fetch('./data/data.csv')
    let data = await fetch(csvFile)
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
        return !(isNaN(x.city_latitude) || isNaN(x.city_longitude)) && x != null;
    })

    parsedData.forEach((x,i) => {
        let r = new rectangle(0, 0, 270, 120, x.city_latitude, x.city_longitude);
        r.dataIndex = i;
        rects.push(r);
    });

    let markers = await Promise.all(parsedData.map((x, i) => {
        return createMarker(parsedData[i])
    }))

    cluster.addLayers(markers);

    markers.forEach((m, i) => {
        if(rects[i]!==null) {
            rects[i].marker = markers[i];
            markers[i].rectangle = rects[i];
        }
    })
}

document.addEventListener("DOMContentLoaded", async function () {

    await null;

    document.querySelector('#details-button').addEventListener('click', showDetails);

    createMap()

    loadData('./data/data.csv');
    //loadData('./data/nuforc_reports.csv');
})