/**
 * Rectangle base class
 */
export class rectangle {
    /**
     * 
     * @param {Number} x the screen x coordinate
     * @param {Number} y the screen y coordinate
     * @param {Number} w the screen width
     * @param {Number} h the screen height
     * @param {Number} lat the latitude in degrees
     * @param {Number} long the longitude in degrees
     */
    constructor(x,y,w,h, lat, long) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.long = long;
        this.lat = lat;
        this.x_rank = 0
        this.y_rank = 0
        // remember original position
        this._orig_x = x;
        this._orig_y = y;
        // dataIndex will be assigned later
        this.dataIndex = -1;
    }

    /**
     * @returns The minimum point of the rectangel
     */
    min() {
        return {x: this.x - this.w/2, y: this.y - this.h/2}
    }

    /**
     * @returns The maximum point of the rectangel
     */
    max() {
        return {x: this.x + this.w/2, y: this.y + this.h/2}
    }

    /**
     * @returns The left x pos of the rectangle
     */
    left() {
        return this.x - this.w / 2;
    }

    /**
     * @returns The right x pos of the rectangle
     */
    right() {
        return this.x + this.w / 2;
    }

    /**
     * @returns The top y pos of the rectangle
     */
    top() {
        return this.y + this.h / 2;
    }

    /**
     * @returns The bottom y pos of the rectangle
     */
    bottom() {
        return this.y - this.h / 2;
    }

    /**
     * @returns The current point as an array with x at index 0 and y at index 1
     */
    point () {
        return [this.x, this.y];
    }

    /**
     * @returns The original point as an array with x at index 0 and y at index 1
     */
    original_point() {
        return [this._orig_x, this._orig_y];
    }

    /**
     * @returns The lat long as an array [lat, long]
     */
    latLong() {
        return [this.lat, this.long];
    }

    /**
     * Resets the rectangle to the given coordinates, changes orig pos.
     * @param {[lat, long]} coords 
     */
    reset(coords) {
        this.x = coords.x;
        this.y = coords.y;
        this._orig_x = this.x;
        this._orig_y = this.y;
    }

    /**
     * Checks for intersection with a given rectangle 
     * @param {rectangle} rectangle 
     * @returns true if the rectangles are intersecting
     */
    intersects(rectangle) {
        let minA = this.min();
        let maxA = this.max();
        let minB = rectangle.min();
        let maxB = rectangle.max();
        return !(maxB.x <= minA.x || minB.x >= maxA.x || maxB.y <= minA.y || minB.y >= maxA.y)
    }

    /**
     * Calculates the overlap in x direction according to their x ranks.
     * Return Infinity if the ranks are identical and 0 if there is no overlap. 
     * @param {rectangle} other 
     * @returns The overlap in x direction according to their x ranks.
     */
    xOverlap(other)
    {
        if(this.x_rank === other.x_rank) {
            return Infinity;
        }

        let overlap = 0
        if(this.x_rank < other.x_rank)
        {
            overlap =  this.right() - other.left()
        }
        else {
            overlap =  other.right() - this.left()
        }
        return overlap > 0 ? overlap : 0;
    }

    /**
     * Calculates the overlap in y direction according to their y ranks.
     * Return Infinity if the ranks are identical and 0 if there is no overlap. 
     * @param {rectangle} other 
     * @returns The overlap in y direction according to their y ranks.
     */
    yOverlap(other)
    {
        if(this.y_rank === other.y_rank) {
            return Infinity;
        }

        let overlap = 0
        if(this.y_rank < other.y_rank)
        {
            overlap =  this.top() - other.bottom()
        }
        else {
            overlap =  other.top() - this.bottom();
        }
        return overlap > 0 ? overlap : 0;
    }
}

/**
 * Small helper class
 */
class seachPoint {
    constructor(index, isInterval, isBottom,y, data) {
        this.index = index;
        this.isInterval = isInterval;
        this.isBottom = isBottom;
        this.data = data;
        this.y = y;
    }
}

// https://stackoverflow.com/a/21822316
/**
 * 
 * @param {*} array 
 * @param {*} value value to find the index for
 * @returns the sorted index of the value into the array
 */
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

function sortedYIndexPredecessor(array, value) {
    var low = 0,
        high = array.length;

    while (low < high) {
        var mid = (low + high) >>> 1;
        if (array[mid].y <= value.y) low = mid + 1;
        else high = mid;
    }
    return low;
}


/**
 * Finds the intersections of rectangles by checking if their edges intersect.
 * @param {rectangle[]} rectangles 
 * @returns {{a: index; b: index}} index pairs of intersecting rectangles 
 */
export function lineIntersecions(rectangles) {
    let Q = [];
    // build a set of all horizontal extents of the rects to perform line sweep
    rectangles.forEach((r,i) => {
        Q.push({i: i, x: r.left(), left: true});
        Q.push({i: i, x: r.right(), left: false});
    });
    // sort them by their x pos to perform line sweep
    Q.sort((a, b) => a.x < b.x ? -1 : a.x > b.x | 0);

    let R = [];
    let intersections = [];

    for(let i = 0; i < Q.length; i++) {
        let p = Q[i];
        let rect = rectangles[p.i];
        if(p.left) {
            // add the horizontal lines sorted by y to R
            let top = {i: p.i, y: rect.top(), top: true}
            let bottom = {i: p.i, y: rect.bottom(), top: false}

            // now all the "horizontal lines" that are in the vertical space of the current rect are intersecting
            const successor = sortedYIndex(R, bottom);
            const predecessor = sortedYIndexPredecessor(R, top);
            if(predecessor > successor) {
                let its = R.slice(successor, predecessor);
                //intersections = intersections.concat(unique.map(x => {return {a: x, b: p.i}}));
                intersections.splice(intersections.length,0,...its.map(x => {return {a: x.i, b: p.i}}));
            }

            // R needs to be sorted by y coords, do a sorted insert with binary search
            // splice is apparently really fast at inserting elements
            // first top then bottom so we don't shift the indices cause of insertion
            R.splice(predecessor, 0, top);
            R.splice(successor, 0, bottom);
        }
        else {
            // remove the "horizontal lines" again
            R.splice(R.findIndex(x => x.i === p.i), 1)
            R.splice(R.findIndex(x => x.i === p.i), 1)
        }
    }

    return intersections;
}


/**
 * Checks for rectangle intersections by simply checking every combination.
 * Used as benchmark reference
 * @param {rectangle[]} rectangles 
 * @returns {{a: index; b: index}} index pairs of intersecting rectangles 
 */
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

/**
 * Removes the overlap of two rectangles preserving their orthogonal order.
 * Doins so by getting the overlaps in both directions and moving them apart
 * in the direction of the shortest overlap. 
 * @param {rectangle} r1 the first rectangle
 * @param {rectangle} r2 the second rectangle
 * @param {Number} t0 the minimum overlap
 * @returns true if there was some overlap removed, false otherwise
 */
function removeOverlap(r1, r2, t0 = 5) {
    // get both overlaps
    let xOverlap = r1.xOverlap(r2);
    let yOverlap = r1.yOverlap(r2);

    // overlap size is the minimum of both overlaps
    let overlapSize = xOverlap < yOverlap ? xOverlap : yOverlap;
    const d = xOverlap < yOverlap ? 0 : 1;

    // if we actaully have an overlap to remove
    if (overlapSize > 0 && overlapSize < Infinity)
    {
        let retval = true
        // if the overlap size is smaller then t0 set it to t0 so don't do so infinitely
        if(overlapSize < t0)
        {
            overlapSize = t0;
            retval = false;
        }

        // if x dimension has the minimum overlap
        if(d === 0) {
            // depending on rank move both into opposite directions
            if(r1.x_rank < r2.x_rank) {
                r1.x -= xOverlap / 2;
                r2.x += xOverlap / 2;
            }
            else {
                r1.x += xOverlap / 2;
                r2.x -= xOverlap / 2;
            }
        }
        // do the same in y direction
        else {
            if(r1.y_rank < r2.y_rank) {
                r1.y -= yOverlap / 2;
                r2.y += yOverlap / 2;
            }
            else {
                r1.y += yOverlap / 2;
                r2.y -= yOverlap / 2;
            }
        }
        return retval;
    }
    return false;
}

// https://www.w3docs.com/snippets/javascript/how-to-randomize-shuffle-a-javascript-array.html
/**
 * Shuffles and array randomly
 * @param {[]} arr 
 */
function shuffleArray(arr) {
    arr.sort(() => Math.random() - 0.5);
}

/**
 * repair order algorithm from the paper which does not achieve correct results
 * should in theorie repair the order of the rank of the rectangles in dimension d
 * while beforming merge sort
 * @param rectangles for which the order should be repaired
 * @param d dimension in which the order should be repaired
 * @param left index of left side that should be ordered
 * @param right index of right side that should be ordered
 */
function repairOrder(rectangles,d, left, right) {
    if(left < right){
        //split
        let mid = Math.floor((left+right)-1/2);
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

/**
 * Our own repair order algorithm for the x dimension because the one from the paper does not achieve correct results
 * The difference to the paper is that if we find two triangles not ordered, we average their x coordinates and also swap their position in the array
 * instead of averaging every triangle thereafter
 *
 *
 * @param sorted triangles for which the order of their rank should be repaired, ordered ascending by their x coordinates
 *
 * basic merge sort implementation from https://stackoverflow.com/questions/63548204/iterative-approach-of-merge-sort-in-javascript by Michael Laszlo
 */
function repairOrderOwnX(sorted) {
    var n = sorted.length,
        buffer = new Array(n);
    for (var size = 1; size < n; size *= 2) {
        for (var leftStart = 0; leftStart < n; leftStart += 2*size) {
            var left = leftStart,
                right = Math.min(left + size, n),
                leftLimit = right,
                rightLimit = Math.min(right + size, n),
                i = left;
            while (left < leftLimit && right < rightLimit) {
                if (sorted[left].x_rank < sorted[right].x_rank) {
                    buffer[i++] = sorted[left++];
                } else {
                    sorted[left].x = (sorted[left].x + sorted[right].x)/2;
                    sorted[right].x = sorted[left].x;
                    buffer[i++] = sorted[right++];
                }
            }
            while (left < leftLimit) {
                buffer[i++] = sorted[left++];
            }
            while (right < rightLimit) {
                buffer[i++] = sorted[right++];
            }
        }
        var temp = sorted,
            sorted = buffer,
            buffer = temp;
    }
}

/**
 * Same as repairOrderOwnX but for dimension Y
 * @param sorted triangles for which the order of their rank should be repaired, ordered ascending by their y coordinates
 */
function repairOrderOwnY(sorted) {
    var n = sorted.length,
        buffer = new Array(n);

    for (var size = 1; size < n; size *= 2) {
        for (var leftStart = 0; leftStart < n; leftStart += 2*size) {
            var left = leftStart,
                right = Math.min(left + size, n),
                leftLimit = right,
                rightLimit = Math.min(right + size, n),
                i = left;
            while (left < leftLimit && right < rightLimit) {
                if (sorted[left].y_rank < sorted[right].y_rank) {
                    buffer[i++] = sorted[left++];
                } else {
                    sorted[left].y = (sorted[left].y + sorted[right].y)/2;
                    sorted[right].y = sorted[left].y;
                    buffer[i++] = sorted[right++];
                }
            }
            while (left < leftLimit) {
                buffer[i++] = sorted[left++];
            }
            while (right < rightLimit) {
                buffer[i++] = sorted[right++];
            }
        }
        var temp = sorted;
            sorted = buffer;
            buffer = temp;
    }
}




/**
 * Perform Rearrange according to the paper "Minimum-Displacement Overlap Removal for Geo-referenced Data Visualization"
 * https://onlinelibrary.wiley.com/doi/abs/10.1111/cgf.13199
 * 
 * First finds the orthogonal ranks in both x and y dimension of the rectangles.
 * As long as there are overlapping rectangles it randomly removes their overlap
 * and repairs orthogonal order violations.
 * @param {rectangle[]} rectangles 
 * @returns The rearranged rctangels
 */
export function rearrange(rectangles) {
    const startTime = new Date().getTime();
    let rectangles_sorted = rectangles.slice();
    rectangles_sorted.sort((a,b)=> a.x-b.x);
    // after sorting, rank is just the index
    rectangles_sorted.forEach((r,i) => r.x_rank = i)

    rectangles_sorted.sort((a,b)=> a.y-b.y);
    rectangles_sorted.forEach((r,i) => r.y_rank = i)

    let P = lineIntersecions(rectangles_sorted);
    let removedOverlap = false;
    while(P.length > 0) {
        const currTime = new Date().getTime();
        //timeout after 30 seconds
        if(currTime - startTime > 30000) {
            return false;
        }
        shuffleArray(P);
        removedOverlap = false;
        P.forEach((pair) => {
            removedOverlap = removedOverlap || removeOverlap(rectangles_sorted[pair.a], rectangles_sorted[pair.b]);
        })
        if(!removedOverlap) {
            break;
        }

        rectangles_sorted.sort((a,b)=> a.y-b.y);
        repairOrderOwnY(rectangles_sorted)
        rectangles_sorted.sort((a,b)=> a.x-b.x);
        repairOrderOwnX(rectangles_sorted)
        P = lineIntersecions(rectangles_sorted);
    }
    const endTime = new Date().getTime();

    console.log("done with rearrange")
    console.log(endTime-startTime)

    return true;
}