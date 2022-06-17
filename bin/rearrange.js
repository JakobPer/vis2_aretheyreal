import {rectangle, rearrange} from "./rectangle.js";

/**
 * Worker class to compute the rearrange function without freezing the UI
 * @param e.data triangles for which the rearrange algorithm should be applied
 */
onmessage = function(e) {
    const rectsToShow = e.data.map(function (r) { return new rectangle(r.x,r.y,r.w,r.h, r.lat, r.long)});

    console.log("showing details for " + rectsToShow.length + " items")
    rearrange(rectsToShow);
    postMessage(rectsToShow);
}