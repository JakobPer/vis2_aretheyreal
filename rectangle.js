export class rectangle {
    constructor(x,y,w,h) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.x_rank = 0
        this.y_rank = 0
    }

    intesects(rectangle) {
        let xIntersects = this.x + this.w > rectangle.x - rectangle.w;
        xIntersects |= this.x - this.w < rectangle.x + rectangle.w;
        let yIntersects = this.y + this.h > rectangle.y - rectangle.h;
        yIntersects |= this.y - this.h < rectangle.y + rectangle.h;

        return xIntersects && yIntersects;
    }
}

export function rearrange(rectangles) {
    let x_rank = Array.from(Array(rectangles.length).keys())
        .sort((a, b) => rectangles[a].x < rectangles[b].x ? -1 : (rectangles[b].x < rectangles[a].x) | 0);
    let y_rank = Array.from(Array(rectangles.length).keys())
        .sort((a, b) => rectangles[a].y < rectangles[b].y ? -1 : (rectangles[b].y < rectangles[a].y) | 0);
    console.log(x_rank);
    console.log(y_rank);
}