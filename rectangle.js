export class rectangle {
    constructor(x,y,w,h) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.x_rank = 0
        this.y_rank = 0
    }

    min() {
        return {x: this.x - this.w/2, y: this.y - this.h/2}
    }

    max() {
        return {x: this.x + this.w/2, y: this.y + this.h/2}
    }

    intersects(rectangle) {
        let minA = this.min();
        let maxA = this.max();
        let minB = rectangle.min();
        let maxB = rectangle.max();
        return !(maxB.x < minA.x || minB.x > maxA.x || maxB.y < minA.y || minB.y > minA.y)
    }
}

class sortPoint {
    constructor(rectIndex, x, isVertical, isLeft) {
        this.rectIndex = rectIndex;
        this.x = x;
        this.isVertical = isVertical;
        this.isLeft = isLeft;
    }
}

// https://stackoverflow.com/a/21822316
function sortedYIndex(array, value) {
    var low = 0,
        high = array.length;

    while (low < high) {
        var mid = (low + high) >>> 1;
        if (array[mid].y < value.y) low = mid + 1;
        else high = mid;
    }
    return low;
}

function lineIntersecions(rectangles) {
    let Q = [];
    // build a set of all horizontal extents of the rects to perform line sweep
    rectangles.forEach((x,i) => {
        Q.push({i: i, x: x.x - x.w/2, left: true});
        Q.push({i: i, x: x.x + x.w/2, left: false});
    });
    // sort them by their x pos
    Q.sort((a, b) => a.x < b.x ? -1 : a.x > b.x | 0);

    let R = [];
    let intersections = [];

    Q.forEach((p, i) => {
        let rect = rectangles[p.i];
        if(p.left) {
            // add the horizontal lines sorted by y to R
            let top = {i: p.i, y: rect.y + rect.h/2, top: true}
            let bottom = {i: p.i, y: rect.y - rect.h/2, top: false}
            // R needs to be sorted by y coords, do a sorted insert with binary search
            // splice is apparently really fast at inserting elements
            R.splice(sortedYIndex(R, top), 0, top);
            R.splice(sortedYIndex(R, bottom), 0, bottom);
        }
        else {
            // remove the "horizontal lines" again
            R.splice(R.findIndex(x => x.i === p.i), 1)
            R.splice(R.findIndex(x => x.i === p.i), 1)
        }
        // now all the "horizontal lines" that are in the vertical space of the current rect are intersecting
        let its = R.filter(x => x.y <= rect.y + rect.h/2 && x.y >= rect.y - rect.h/2 && x.i != p.i)
        let unique = [...new Set(its.map(x => x.i))];
        intersections = intersections.concat(unique.map(x => {return {a: x, b: p.i}}));
    })

    // create unique pairs
    let uniqueMap = new Map();

    intersections.forEach((x,i) => {
        if(uniqueMap.has(x.a)) {
            uniqueMap.get(x.a).add(x.b)
        }
        else if(uniqueMap.has(x.b)) {
            uniqueMap.get(x.b).add(x.a)
        }
        else {
            uniqueMap.set(x.a, new Set([x.b]))
        }
    })

    intersections =[]

    uniqueMap.forEach((val,k) => {
        val.forEach(v => {
            intersections.push({a: k, b: v})
        })
    })

    return intersections;
}

export function rearrange(rectangles) {
    let x_rank = Array.from(Array(rectangles.length).keys())
        .sort((a, b) => rectangles[a].x < rectangles[b].x ? -1 : (rectangles[b].x < rectangles[a].x) | 0);
    let y_rank = Array.from(Array(rectangles.length).keys())
        .sort((a, b) => rectangles[a].y < rectangles[b].y ? -1 : (rectangles[b].y < rectangles[a].y) | 0);

    x_rank.forEach((x,i) => rectangles[i].x_rank = x);
    y_rank.forEach((x,i) => rectangles[i].y_rank = x);

    let lineInts = lineIntersecions(rectangles);

    let testIntersections = [];
    let testNotIntersections = [];

    rectangles.forEach((x,i) => {
        for(let j = i; j < rectangles.length; j++) {
            if(i==j)
                continue;
            if(rectangles[i].intersects(rectangles[j])){
                testIntersections.push({a: i, b: j})
            }
            else {
                testNotIntersections.push({a: i, b: j})
            }
        }
    })

    lineInts.forEach(x => {
        let test = rectangles[x.a].intersects(rectangles[x.b]);
        if(!test) {
            console.log("no intersection")
            console.log(rectangles[x.a]);
            console.log(rectangles[x.b]);
        }
    })
}