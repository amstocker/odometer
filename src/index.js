import React from 'react';
import ReactDOM from 'react-dom';

import { setupCanvas } from './utils.js';

const N = 8;  // number of subdivisions
const EXP_N = 2**N;

const FONT = "18px Arial";
const FONT_COLOR = "black";
const GRID_COLOR = "#dbdbdb";
const SELECTED_COLOR = "#f442c5";

const DIAG_COLOR = "green";

const ORBIT_ITERS = 10;
const ORBIT_COLOR = "#4286f4";
const POINT_SIZE = 6;

const Mouse = {
    x: 0,
    y: 0
};


class CantorSet {
    constructor (x, y, w, h, vertical, show_bases, hide) {
        
        // constants
        this.mid = 1;
        this.spacing = 2;

        this.abs_x = x;
        this.abs_y = y;
        this.width = w;
        this.grid_height = Math.floor((5/13) * h);
        this.base_height = Math.floor(((1/(N-1)) * (8/13) * h) - this.spacing);
        
        this.segments = [[0, this.width]];
        this.bases = [this.segments];
        for (let i = 0; i < N; i++) {
            let new_segments = [];
            for (let seg of this.segments) {
                let w = seg[1] - seg[0];
                new_segments.push([seg[0], seg[0]+(w-this.mid)/2]);
                new_segments.push([seg[0]+(w+this.mid)/2, seg[1]]);
            }
            this.segments = new_segments;
            this.bases.push(this.segments);
        };

        this.vertical = vertical;
        this.show_bases = show_bases;
        this.hide = hide;

        this.selected = 0;
    }

    set_pos (x, y) {
        this.abs_x = x;
        this.abs_y = y;
    }

    pos_to_coord (x) {
        if (this.vertical) {
            return Math.floor((1 - (x/this.width)) * EXP_N);
        } else {
            return Math.floor((x/this.width) * EXP_N);
        };
    }

    coord_to_pos (c) {
        if (this.vertical) {
            return Math.floor((1 - (c/EXP_N)) * this.width);
        } else {
            return Math.floor((c/EXP_N) * this.width);
        };
    }

    coord_to_text (coord) {
        let t = "(";
        for (let i = N - 1; i >= 0; i--) {
            t += ((coord & 1 << i) >> i)  + ", ";
        };
        t += "...)"
        return t;
    }

    selected_pos () {
        return this.coord_to_pos(this.selected);
    }

    selected_text () {
        return this.coord_to_text(this.selected);
    }

    selected_bin () {
        let s = this.selected.toString(2);
        return "0000000000".substr(s.length + (10 - N)) + s
    }

    update () {
        let rel = this.vertical
                    ? Mouse.y - this.abs_y
                    : Mouse.x - this.abs_x;
        if (rel < 0) {
            this.selected = this.vertical ? EXP_N - 1 : 0;
        } else if (rel >= this.width) {
            this.selected = this.vertical ? 0 : EXP_N - 1;
        } else {
            this.selected = this.pos_to_coord(rel);
        };
    }

    draw (ctx) {
        if (this.hide) return;

        for (let i = 0; i < this.segments.length; i++) {
            let seg = this.segments[i];
            ctx.fillStyle = (i == this.selected) ? SELECTED_COLOR : GRID_COLOR;
            if (this.vertical) {
                ctx.fillRect(
                    this.abs_x - this.grid_height,
                    this.abs_y + this.width - seg[1],
                    this.grid_height,
                    seg[1] - seg[0]);

            } else {
                ctx.fillRect(
                    this.abs_x + seg[0],
                    this.abs_y,
                    seg[1] - seg[0],
                    this.grid_height);
            };
        };
        if (this.show_bases) {
            for (let j = 1; j < N; j++) {
                let base = this.bases[N-j];
                for (let i = 0; i < base.length; i++) {
                    let seg = base[i];
                    if (this.selected >> j == i) {
                        ctx.fillStyle = SELECTED_COLOR;
                    } else {
                        ctx.fillStyle = GRID_COLOR;
                    };
                    if (this.vertical) {
                        ctx.fillRect(
                            this.abs_x - this.grid_height - j * (this.spacing + this.base_height),
                            this.abs_y + seg[0],
                            this.base_height,
                            seg[1] - seg[0]);
                    } else {
                        ctx.fillRect(
                            this.abs_x + seg[0],
                            this.abs_y + this.grid_height + this.spacing + (j - 1) * (this.spacing + this.base_height),
                            seg[1] - seg[0],
                            this.base_height);
                    };
                };
            };
        };
    }
}


class Odometer {
    constructor (x, y, size) {
        
        // constants
        this.axis_spacing = 4;
        this.axis_height = 60;
        
        this.abs_x = x;
        this.abs_y = y;
        this.size = size;

        this.horizontal_axis = new CantorSet(x, y + this.size + this.axis_spacing, this.size, this.axis_height, false, true, false);
        this.vertical_axis = new CantorSet(x - this.axis_spacing, y, this.size, this.axis_height, true, false, false);
        
        this.actions = Array(EXP_N);
        for (let k = 0; k < EXP_N; k++) {
            this.actions[k] = this.group_action(k);
        };
    }

    set_pos (x, y) {
        this.abs_x = x;
        this.abs_y = y;
        this.horizontal_axis.set_pos(x, y + this.size + this.axis_spacing);
        this.vertical_axis.set_pos(x - this.axis_spacing, y);
    }

    group_action (x) {
        let mask = 1 << (N-1);
        while (mask) {
            let carry = x & mask;
            x = x ^ mask;
            mask = carry >> 1;
        }
        return x;
    }

    update () {
        this.horizontal_axis.update();
        this.vertical_axis.update();
    }

    draw (ctx) {
        this.horizontal_axis.draw(ctx);
        this.vertical_axis.draw(ctx);

        ctx.beginPath();
        ctx.moveTo(this.abs_x, this.abs_y + this.size);
        ctx.lineTo(this.abs_x + this.size, this.abs_y);
        ctx.strokeStyle = DIAG_COLOR;
        ctx.stroke();

        ctx.fillStyle = SELECTED_COLOR;
        ctx.fillRect(this.abs_x + this.horizontal_axis.selected_pos() - POINT_SIZE/2,
                     this.abs_y + this.vertical_axis.selected_pos() - POINT_SIZE/2,
                     POINT_SIZE,
                     POINT_SIZE);

        ctx.fillStyle = ORBIT_COLOR;
        ctx.strokeStyle = ORBIT_COLOR;
        let c = this.horizontal_axis.selected;
        for (let j = 0; j < ORBIT_ITERS; j++) {
            let d = c;
            for (let k = 0; k < ORBIT_ITERS; k++) {
                ctx.fillRect(this.abs_x + this.horizontal_axis.coord_to_pos(c) - POINT_SIZE/2,
                             this.abs_y + this.vertical_axis.coord_to_pos(d) - POINT_SIZE/2,
                             POINT_SIZE,
                             POINT_SIZE);
                d = this.actions[d];
            };
            c = this.actions[c];
        };
        ctx.fillStyle = FONT_COLOR;
        ctx.font = FONT;
        ctx.textBaseline = "bottom";
        ctx.textAlign = "right";
        ctx.fillText(
            this.horizontal_axis.selected_text(),
            this.abs_x + this.size,
            this.abs_y + this.size);
        ctx.textBaseline = "top";
        ctx.textAlign = "left";
        ctx.fillText(
            this.vertical_axis.selected_text(),
            this.abs_x,
            this.abs_y);
    }
}


class Main extends React.Component {
    constructor(props) {
        super(props);
        this.canvas = React.createRef();
        this.animate = this.animate.bind(this);

        this.odometer = new Odometer(0, 0, 700);
    }

    render() {
        return (
            <canvas className={"fullscreen"} ref={this.canvas} ></canvas>
        );
    }

    getCanvasInfo() {
        let cvs = this.canvas.current,
            ctx = setupCanvas(cvs),
            w = cvs.offsetWidth,
            h = cvs.offsetHeight;
        return [cvs, ctx, w, h];
    }

    componentDidMount() {
        window.addEventListener("mousemove", (e) => {
            e.preventDefault();   
            e.stopPropagation();
            Mouse.x = parseInt(e.clientX);
            Mouse.y = parseInt(e.clientY);
            this.odometer.update();
        });
        
        window.requestAnimationFrame(this.animate);
    }

    animate() {
        const [cvs, ctx, w, h] = this.getCanvasInfo();
        let abs_x = (w - this.odometer.size)/2,
            abs_y = 50;

        this.odometer.set_pos(abs_x, abs_y);
        
        ctx.clearRect(0, 0, w, h);
        this.odometer.draw(ctx);

        window.requestAnimationFrame(this.animate);
    }
}


ReactDOM.render(
    <Main />,
    document.getElementById('app')
);
