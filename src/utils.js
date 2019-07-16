
/*
 * Canvas setup boilerplate
 *
 *  (Source: https://www.html5rocks.com/en/tutorials/canvas/hidpi/)
 */
export function setupCanvas(canvas) {
    // Get the device pixel ratio, falling back to 1.
    var dpr = window.devicePixelRatio || 1;
    // Get the size of the canvas in CSS pixels.
    var rect = canvas.getBoundingClientRect();
    // Give the canvas pixel dimensions of their CSS
    // size * the device pixel ratio.
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    var ctx = canvas.getContext('2d');
    // Scale all drawing operations by the dpr, so you
    // don't have to worry about the difference.
    ctx.scale(dpr, dpr);
    return ctx;
}

/*
 * Color conversion
 *
 *  (Source: https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb)
 */
export function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function interpolateHex(hex1, hex2, t) {
    let rgb1 = hexToRgb(hex1),
        rgb2 = hexToRgb(hex2);
    let rd = rgb2.r - rgb1.r,
        gd = rgb2.g - rgb1.g,
        bd = rgb2.b - rgb1.b;
    return rgbToHex(Math.floor(rgb1.r + t * rd),
                    Math.floor(rgb1.g + t * gd),
                    Math.floor(rgb1.b + t * bd));
}
