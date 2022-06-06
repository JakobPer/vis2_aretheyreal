import {rectangle, rearrange, bruteForceIntersections, lineIntersecions} from "./rectangle.js";

onmessage = function(e) {
    const rectsToShow = e.data.map(function (r) { return new rectangle(r.x,r.y,r.w,r.h, r.lat, r.long)});

    console.log("showing details for " + rectsToShow.length + " items")
    rearrange(rectsToShow);
    postMessage(rectsToShow);
}