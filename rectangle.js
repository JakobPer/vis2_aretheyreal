export class rectangle {
    constructor(x,y,w,h) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.x_rank = 0
        this.y_rank = 0
        this._orig_x = x;
        this._orig_y = y;
    }

    min() {
        return {x: this.x - this.w/2, y: this.y - this.h/2}
    }

    max() {
        return {x: this.x + this.w/2, y: this.y + this.h/2}
    }

    left() {
        return this.x - this.w / 2;
    }

    right() {
        return this.x + this.w / 2;
    }

    top() {
        return this.y + this.h / 2;
    }

    bottom() {
        return this.y - this.h / 2;
    }

    point () {
        return [this.x, this.y];
    }

    original_point() {
        return [this._orig_x, this._orig_y];
    }

    intersects(rectangle) {
        let minA = this.min();
        let maxA = this.max();
        let minB = rectangle.min();
        let maxB = rectangle.max();
        return !(maxB.x <= minA.x || minB.x >= maxA.x || maxB.y <= minA.y || minB.y >= maxA.y)
    }

    xOverlap(other)
    {
        if(this.x === other.x) {
            return Infinity;
        }

        if(this.x_rank < other.x_rank)
        {
            return (this.x + this.w/2) - (other.x - other.w/2)
        }
        else {
            return (other.x + other.w/2) - (this.x - this.w/2)
        }
    }

    yOverlap(other)
    {
        if(this.y === other.y) {
            return Infinity;
        }

        if(this.y_rank < other.y_rank)
        {
            return (this.y + this.h/2) - (other.y - other.h/2)
        }
        else {
            return (other.y + other.h/2) - (this.y - this.h/2)
        }
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

export function lineIntersecions(rectangles) {
    let Q = [];
    // build a set of all horizontal extents of the rects to perform line sweep
    rectangles.forEach((r,i) => {
        Q.push({i: i, x: r.left(), left: true});
        Q.push({i: i, x: r.right(), left: false});
    });
    // sort them by their x pos
    Q.sort((a, b) => a.x < b.x ? -1 : a.x > b.x | 0);

    let R = [];
    let intersections = [];

    Q.forEach((p, i) => {
        let rect = rectangles[p.i];
        if(p.left) {
            // add the horizontal lines sorted by y to R
            let top = {i: p.i, y: rect.top(), top: true}
            let bottom = {i: p.i, y: rect.bottom(), top: false}
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
        let its = R.filter(e => e.y <= rect.top() && e.y >= rect.bottom() && e.i != p.i)
        let unique = [...new Set(its.map(x => x.i))];
        intersections = intersections.concat(unique.map(x => {return {a: x, b: p.i}}));
    })

    // create unique pairs
    let uniqueMap = new Map();

    intersections.forEach((x,i) => {
        if(uniqueMap.has(x.a)) {
            if(!(uniqueMap.has(x.b) && uniqueMap.get(x.b).has(x.a))) {
                uniqueMap.get(x.a).add(x.b)
            }
        }
        else if(uniqueMap.has(x.b)) {
            if(!(uniqueMap.has(x.a) && uniqueMap.get(x.a).has(x.b))) {
                uniqueMap.get(x.b).add(x.a)
            }
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

export function bruteForceIntersections(rectangles) {
    let testIntersections = [];
    
    rectangles.forEach((x,i) => {
        for(let j = i; j < rectangles.length; j++) {
            if(i==j)
                continue;
            if(rectangles[i].intersects(rectangles[j])){
                testIntersections.push({a: i, b: j})
            }
        }
    })

    return testIntersections
}

function removeOverlap(r1, r2, t0 = 0.1) {
    let xOverlap = r1.xOverlap(r2);
    xOverlap = xOverlap < t0 && xOverlap > 0 ? t0 : xOverlap;
    let yOverlap = r1.yOverlap(r2);
    yOverlap = yOverlap < t0 && yOverlap > 0 ? t0 : yOverlap;

    if(xOverlap === Infinity && yOverlap === Infinity) {
        xOverlap = t0;
        yOverlap = t0;
    }

    if((xOverlap > 0 && xOverlap < Infinity) && 
        ((xOverlap < yOverlap && yOverlap > 0) || yOverlap <= 0)) {
        if(r1.x_rank < r2.x_rank) {
            r1.x -= xOverlap / 2;
            r2.x += xOverlap / 2;
        }
        else {
            r1.x += xOverlap / 2;
            r2.x -= xOverlap / 2;
        }
    }
    else if(yOverlap > 0 && yOverlap < Infinity) {
        if(r1.y_rank < r2.y_rank) {
            r1.y -= yOverlap / 2;
            r2.y += yOverlap / 2;
        }
        else {
            r1.y += yOverlap / 2;
            r2.y -= yOverlap / 2;
        }
    }
}

// https://www.w3docs.com/snippets/javascript/how-to-randomize-shuffle-a-javascript-array.html
function shuffleArray(arr) {
  arr.sort(() => Math.random() - 0.5);
}

function repairOrder(rectangles,d, left, right) {
    if(left < right){
        //split
        let mid = Math.floor((left+right-1)/2);
        repairOrder(rectangles, d, left, mid);
        repairOrder(rectangles, d, mid+1, right);

        let rectangles_new = [...rectangles];
        //merge with rearrange
        let i = left;
        let j = mid+1;
        let k = left;
        // x dimension
        if(d === 0) {
            while (i <= mid && j <= right) {
                //in order
                if (rectangles[i].x_rank < rectangles[j].x_rank) {
                    rectangles_new[k] = rectangles[i];
                    i++;
                    k++;
                } else {
                    let cavg = 0;
                    let count = 0
                    let cr = rectangles[i].x_rank;
                    let group = [];
                    while (i <= mid) {
                        group.push(rectangles[i]);
                        cavg += rectangles[i].x;
                        count++;
                        i++;
                    }
                    while (rectangles[j].x_rank === cr) {
                        group.push(rectangles[j]);
                        cavg += rectangles[j].x;
                        count++;
                        rectangles_new[k] = rectangles[j];
                        j++;
                        k++;
                    }
                    cavg /= count;
                    group.forEach(r => r.x = cavg);
                }
            }
        }
        else{
            // y dimension
            while (i <= mid && j <= right) {
                //in order
                if (rectangles[i].y_rank < rectangles[j].y_rank) {
                    rectangles_new[k] = rectangles[i];
                    i++;
                    k++;
                } else {
                    let cavg = 0;
                    let count = 0
                    let cr = rectangles[i].y_rank;
                    let group = [];
                    while (i <= mid) {
                        group.push(rectangles[i]);
                        cavg += rectangles[i].y;
                        count++;
                        i++;

                    }
                    while (rectangles[j].y_rank === cr) {
                        group.push(rectangles[j]);
                        cavg += rectangles[j].y;
                        count++;
                        rectangles_new[k] = rectangles[j];
                        j++;
                        k++;
                    }

                    cavg /= count;
                    group.forEach(r => r.y = cavg);
                }
            }
        }
        for(let h=i; h<=mid; h++) {
            rectangles[k + h - i] = rectangles[h];
        }
        for(let h=left; h<k; h++) {
            rectangles[h] = rectangles_new[h];
        }
    }

}

export async function rearrange(rectangles) {
    const startTime = new Date().getTime();

    let x_rank = Array.from(Array(rectangles.length).keys())
        .sort((a, b) => rectangles[a].x < rectangles[b].x ? -1 : (rectangles[b].x < rectangles[a].x) | 0);
    let y_rank = Array.from(Array(rectangles.length).keys())
        .sort((a, b) => rectangles[a].y < rectangles[b].y ? -1 : (rectangles[b].y < rectangles[a].y) | 0);

    x_rank.forEach((x,i) => rectangles[i].x_rank = x);
    y_rank.forEach((x,i) => rectangles[i].y_rank = x);
    let P = bruteForceIntersections(rectangles);
    //let P = lineIntersecions(rectangles);
    let d = 0;
    while(P.length > 0) {
        console.log(P.length)
        shuffleArray(P);
        P.forEach((pair) => {
            removeOverlap(rectangles[pair.a], rectangles[pair.b]);
        })
        //repairOrder(rectangles, 0,0, rectangles.length-1);

        repairOrder(rectangles, 0, 0, rectangles.length - 1);
       // repairOrder(rectangles, d%2, 0, rectangles.length - 1);


        d++;

        P = bruteForceIntersections(rectangles);
        //P = lineIntersecions(rectangles);

    }

    const endTime = new Date().getTime();

    console.log("done with rearrange")
    console.log(endTime-startTime)
}