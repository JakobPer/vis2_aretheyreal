import {rectangle, rearrange, bruteForceIntersections, lineIntersecions} from "./rectangle.js";

//var headings = ["summary","city","state","date_time","shape","duration","stats","report_link","text","posted","city_latitude","city_longitude"]
var headings = ["index","shape","city_latitude","city_longitude"]

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

const MAX_RECTS = 50;

var icons = {}
var redIcon = {}
var map = {}
var rects = []
var detailUfoLayer = {}
var detailsLayer = {}
var debugLayer = {}
var linesLayer = {}
var layerControl = {}
var globalData = {}
var cluster = {}
var dataCount = 0;

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
        chunkProgress: (processed, total, time) => {console.log("Progress: " + ((processed/total)*100))},
        disableClusteringAtZoom: 13,
        zoomToBoundsOnClick: false,
        spiderfyOnMaxZoom: false,
    })
    cluster.on('clusterclick',async function (a) {
        const markers = a.layer.getAllChildMarkers()
        if(markers.length > MAX_RECTS)
        {
            a.layer.zoomToBounds({padding: [20,20]});
            return;
        }
        let rectsToShow = Array();
        markers.forEach(m =>
            rects.filter(r => r.marker === m).forEach(f => rectsToShow.push(f))
        )
        rectsToShow.forEach((r)=> {
            const z = map.getZoom();
            const proj = map.project(r.latLong(), z);
            r.reset(proj);
        });
        let worker = new Worker("rearrange.js", { type: "module" })
        let rectanglesPost = rectsToShow.map(function (r) { return new rectangle(r.x,r.y,r.w,r.h, r.lat, r.long)});
        rectanglesPost.forEach( (r,i) => r.index = rectsToShow[i].index)
        console.log(rectsToShow)
        console.log(rectanglesPost)

        worker.postMessage(rectanglesPost);
        console.log('Message posted to worker');
        worker.onmessage = async function(e) {
            rectsToShow = e.data.map(function (r) { return new rectangle(r.x,r.y,r.w,r.h, r.lat, r.long)});
            rectsToShow.forEach( (r,i) => r.index = rectanglesPost[i].index)
            console.log(rectsToShow)
            await createDetails(rectsToShow);
        }

    });
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
    marker.on('click', a => {
        console.log(a);
        let rect = rects.filter(r => r.marker === a.sourceTarget);
        console.log(rect);
        if(rect != null ) {
            resetRectangles(rect);
            createDetails(rect);
        }
    })
    return marker;
}

function resetRectangles(rectsToShow)
{
    rectsToShow.forEach((r)=> {
        const z = map.getZoom();
        const proj = map.project(r.latLong(), z);
        r.reset(proj);
    });
}

async function showDetails() {
    const bounds = map.getBounds();
    let rectsToShow = rects.filter(r => bounds.contains(L.latLng(r.lat, r.long)))

    if(rectsToShow.length > MAX_RECTS) {
        alert("Too many UFOs in view to show the details. Zoom in to get a better view.")
        return;
    }

    console.log("showing details for "+ rectsToShow.length + " items")

    resetRectangles(rectsToShow);

    let worker = new Worker("rearrange.js", { type: "module" })
    let rectanglesPost = rectsToShow.map(function (r) { return new rectangle(r.x,r.y,r.w,r.h, r.lat, r.long)});
    rectanglesPost.forEach( (r,i) => r.index = rectsToShow[i].index)
    console.log(rectsToShow)
    console.log(rectanglesPost)

    worker.postMessage(rectanglesPost);
    console.log('Message posted to worker');
    worker.onmessage = async function(e) {
        rectsToShow = e.data.map(function (r) { return new rectangle(r.x,r.y,r.w,r.h, r.lat, r.long)});
        rectsToShow.forEach( (r,i) => r.index = rectanglesPost[i].index)
        console.log(rectsToShow)
        await createDetails(rectsToShow);
    }
}

function intersectionBenchmark() {
    const bounds = map.getBounds();
    const rectsToShow = rects.filter(r => bounds.contains(L.latLng(r.lat, r.long)))

    rectsToShow.forEach((r)=> {
        const z = map.getZoom();
        const proj = map.project(r.latLong(), z);
        r.reset(proj);
    });

    const startTime = new Date().getTime();
    let intersections = bruteForceIntersections(rectsToShow);
    const betweentime = new Date().getTime();
    let lineits = lineIntersecions(rectsToShow);
    const endTime = new Date().getTime();

    console.log(intersections.length);
    console.log(lineits.length)

    console.log(betweentime-startTime);
    console.log(endTime-betweentime);

    /*
    lineits.forEach(li => {
        const found = intersections.filter(x => (x.a == li.a && x.b == li.b) || (x.a == li.b && x.b == li.a))
        if(found.length == 0) {
            console.log("could not find intersection")
            console.log(li);
        }
    })
    console.log("intersection check done")
    */
}

async function createDetails(rectsToShow) {
    // clear detail layers
    detailsLayer.clearLayers();
    detailUfoLayer.clearLayers();
    linesLayer.clearLayers();
    debugLayer.clearLayers();

    // fetch detail data
    let dataPromises = [];
    rectsToShow.forEach(r => {
        dataPromises.push(fetchEntry(r.index));
    })

    // rearrange

    // remove the clusters
    //map.removeLayer(cluster);

    // wait on data
    let data = await Promise.all(dataPromises);

    // create popups for details and debug stuff
    rectsToShow.forEach((rect, i) => {
        const start = map.unproject(rect.original_point());
        const end = map.unproject(rect.point());
        const p1 = map.unproject(rect.min())
        const p2 = map.unproject(rect.max())
        const d = data[i];

        const imgUrl = iconPaths[d.shape] ?? "shapes/default.svg";

        const popupContent = 
        `<div class='ufo-popup'>
            <img class='ufo-image' src='`+imgUrl+`'></img>
            <b>Shape: </b>`+(d.shape === null ? 'unknown' : d.shape)+ `<br> 
            <b>State: </b>`+d.state+`<br> 
            <b>City: </b>`+d.city+`<br>
            <b>Duration: </b>`+d.duration+`<br>
            <b>On: </b>`+d.date_time+`<br>
            <a href="`+d.report_link+`">Link to report</a><br>
        </div>`;

        L.polyline([start, end], {color: 'green'}).addTo(linesLayer);
        L.rectangle([p1, p2]).addTo(debugLayer);
        //detailUfoLayer.addLayer(rect.marker);
        let popup = L.ufopopup({
           minWidth: rect.w - 30, // 20 is CSS padding, compensate a bit more
           maxWidth: rect.w - 30,
           maxHeight: rect.h - 30,
           offset: L.point(0,rect.h/2 + 15), // 20 is the offset of the bottom tip
           autoPan: false,
           closeButton: true,
           autoClose: false,
           closeOnEscape: false,
           closeOnClick: false,
        }).setLatLng(L.latLng(end))
        .setContent(popupContent).addTo(detailsLayer);
    })
}

async function fetchEntry(id) {
    let data = await fetch('./data/json/json_'+String(id).padStart(6, '0'))
    let parsed = await data.json()
    return parsed
}

async function loadData(csvFile) {

    //let data = await fetch('./data/data.csv')
    let data = await fetch(csvFile)
    let dataText = await data.text()
    let csvData = CSV.parse(dataText, csvDialect)
    // parse csv data and filter invalid entries
    // csvData = csvData.slice(0,300); // for testing
    let parsedData = csvData.map((x,index) => {
        try {
            let data = x
            let entry = {id: dataCount++}
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

    let markers = await Promise.all(parsedData.map((x, i) => {
        return createMarker(parsedData[i])
    }))

    parsedData.forEach((x,i) => {
        let r = new rectangle(0, 0, 200, 200, x.city_latitude, x.city_longitude);
        r.dataIndex = x.id;
        r.index = x.index;
        r.marker = markers[i];
        rects.push(r);
    });

    cluster.addLayers(markers);
}

document.addEventListener("DOMContentLoaded", async function () {

    await null; // apprently needed so browser does it async

    document.querySelector('#details-button').addEventListener('click', showDetails);

    createMap()

    //loadData('./data/data.csv');
    //loadData('./data/nuforc_reports.csv');
    //const chunkCount = 137;
    const chunkCount = 10;
    for(let i = 0; i < chunkCount; i++) {
        loadData('./data/coords_'+String(i).padStart(3,'0'));
    }
})