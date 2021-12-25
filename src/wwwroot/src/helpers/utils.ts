/*!
 * Bravo for Power BI
 * Copyright (c) SQLBI corp. - All rights reserved.
 * https://www.sqlbi.com
*/

// Utils
export module Utils {

    export module Request {

        // Load local scripts
        export function loadScript(src: string, callback: any) {
            let s = document.createElement("script");
            s.setAttribute("src", src);
            if (callback) {
                s.onload=callback;
            }
            document.body.appendChild(s);
        }

        // Send ajax call
        export async function ajax(url: string, data = {}, options: RequestInit = {}) {

            let defaultOptions: RequestInit = {
                method: "GET", // *GET, POST, PUT, DELETE, etc.
                mode: "cors", // no-cors, *cors, same-origin
                cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
                credentials: "omit", // include, *same-origin, omit
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                redirect: "follow", // manual, *follow, error
                referrerPolicy: "unsafe-url", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
            };

            let mergedOptions = {...defaultOptions, ...options};

            if (data && !Utils.Obj.isEmpty(data)) {
                if (mergedOptions.method == "POST") {
                    if ((<any>mergedOptions.headers)["Content-Type"] == "application/json") {
                        mergedOptions.body = JSON.stringify(data);
                    } else {
                        mergedOptions.body = <BodyInit>data;
                    }

                } else if (mergedOptions.method == "GET") {

                    // Append data args to the URL
                    try {
                        let _url = new URL(url);
                        _url.search = new URLSearchParams(data).toString();
                        url = _url.href;

                    } catch(e) {}
                }
            }
            try {

                const response = await fetch(url, mergedOptions);
                if (response.ok) {
                    const text = await response.text();
                    try {
                        const json = JSON.parse(text);
                        return json;
                    } catch(err) {
                       return text;
                    }
                }
            } catch(e) {
                throw e;
            }
            throw new Error();
        }

        // Convenience func for GET ajax
        export async function get(url: string, data = {}) {
            return await Utils.Request.ajax(url, data, { method: "GET" });
        }

        // Convenience func for POST ajax
        export async function post(url: string, data = {}) {
           return await Utils.Request.ajax(url, data, { method: "POST" });
        }

        export async function upload(url: string, file: File) {
            return await Utils.Request.ajax(url, {}, { 
                method: "POST",  
                body: file, 
                headers: { }, //Set emtpy - this way the browser will automatically add the Content type header including the Form Boundary
            });
          }
    }

    export module Text {

        export interface FontInfo {
            fontFamily: string;
            fontSize: number;
            fontWeight?: string;
            fontStyle?: string;
            fontVariant?: string;
            whiteSpace?: string;
        }

        export function ucfirst(text: string): string {
            return text.substring(0, 1).toUpperCase() + text.substring(1).toLocaleLowerCase();
        }

        export function uuid(): string {
            const pad4 = function(num: number) {
                var ret = num.toString(16);
                while (ret.length < 4)
                    ret = "0" + ret;
                return ret;
            };
        
            var buf = new Uint16Array(8);
            window.crypto.getRandomValues(buf);
        
            return (pad4(buf[0]) + pad4(buf[1]) + "-" + pad4(buf[2]) + "-" + pad4(buf[3]) + "-" + pad4(buf[4]) + "-" + pad4(buf[5]) + pad4(buf[6]) + pad4(buf[7]));
        }
        
        export var measureCanvas: HTMLCanvasElement;
        export function measureWidth(text: string, font: FontInfo): number {

            if (!Utils.Text.measureCanvas)
                Utils.Text.measureCanvas = document.createElement('canvas');
            
            let context = Utils.Text.measureCanvas.getContext("2d");
            context.font = `${font.fontStyle || ""} ${font.fontVariant || ""} ${font.fontWeight || ""} ${font.fontSize} ${font.fontFamily}`;
            let size = context.measureText(text);
            return Math.ceil(size.width * 1.2);
        }
    }

    export module Format {

        export function bytes(value: number, decimals = 2, refValue = 0): string {
            if (value === 0) return "0 Bytes";
        
            const k = 1024;
            
            const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
            
            let i = Math.floor(Math.log(value) / Math.log(k));
            if (refValue) {
                for (let l = 0; l < sizes.length; l++) {
                    if (refValue >= Math.pow(k, l)) {
                        i = l;
                        break;
                    }
                }
            }
        
            let n = (value / Math.pow(k, i)).toFixed(i ? decimals : 0);
            if (n == "0") n = `<${n}`;
   
            return `${n} ${sizes[i]}`;
        }

        export function percentage(value: number, decimals = 2): string {
            let n = (value * 100).toFixed(decimals);
            if (value > 0 && n == "0") {
                n = `<${1 / Math.pow(10, decimals)}`;
            }
            return `${n}%`;
        }

        export function compress(value: number, decimals = 2): string {
            if (!value) return String(value);

            let si = [
              { value: 1, symbol: "" },
              { value: 1E3, symbol: "K" },
              { value: 1E6, symbol: "M" },
              /*{ value: 1E9, symbol: "G" },
              { value: 1E12, symbol: "T" },
              { value: 1E15, symbol: "P" },
              { value: 1E18, symbol: "E" }*/
            ];
            let i;
            for (i = si.length - 1; i > 0; i--) {
              if (value >= si[i].value) {
                break;
              }
            }
            return `${(value / si[i].value).toFixed(i ? decimals : 0)} ${si[i].symbol}`;
        }
    }

    export module Color {

        export interface rgbColor {
            r: number,
            g: number;
            b: number;
            a?: number;
        }

        export interface hslColor {
            h: number,
            s: number;
            l: number;
        }

        export function palette(colors: string[], count = 10) {
            let ret = [];
            let modifier = 0;
            let colorIndex = 0;
            for (let i = 0; i < count; i++) {
                if (colorIndex >= colors.length) {
                    colorIndex = 0;
                    modifier += 0.1;
                }
                ret.push(Utils.Color.shade(colors[colorIndex], modifier));
                colorIndex++;
            }
            return ret;
        }

        export function normalizeHex(hex: string): string {
            if (hex.substring(0, 1) !== "#")
                hex = `#${hex}`;
            if (hex.length == 4)
                hex += hex.substring(1,3);
            return hex.toLowerCase(); 
        }
    
        export function hexToRGB(hex: string, opacity = 1): rgbColor {
            let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(Utils.Color.normalizeHex(hex));
            return {
                r: (result ? parseInt(result[1], 16) : 0),
                g: (result ? parseInt(result[2], 16) : 0),
                b: (result ? parseInt(result[3], 16) : 0),
                a: opacity
            };
        }
    
        export function rgbToRGB(rgb: string): rgbColor {
            let [r, g, b, a] = rgb.split(",");
            return {
                r: parseInt(r[3]=="a" ? r.slice(5) : r.slice(4)),
                g: parseInt(g),
                b: parseInt(b),
                a: (a ? parseInt(a) : 1)
            };
        }
    
        export function rgbToString(rgb: rgbColor): string {
            return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a ? rgb.a : 1})`;
        }
    
        export function rgbToHex(rgb: rgbColor): string {
            return `#${((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1)}`;
        }
    
        export function hexToHSL(hex: string): hslColor {
            
            let rgb = Utils.Color.hexToRGB(hex);
            let r = rgb.r / 255,
                g = rgb.g / 255,
                b = rgb.b / 255,
                max = Math.max(r, g, b),
                min = Math.min(r, g, b),
                delta = max - min,
                l = (max + min) / 2,
                h = 0,
                s = 0;
    
            if (delta == 0) 
                h = 0;
            else if (max == r)
                h = 60 * (((g - b) / delta) % 6);
            else if (max == g)
                h = 60 * (((b - r) / delta) + 2);
            else
                h = 60 * (((r - g) / delta) + 4);
    
            if (delta == 0)
                s = 0;
            else
                s = (delta/(1-Math.abs(2*l - 1)))
    
            return {
                h: h,
                s: s,
                l: l
            }
        }
    
        export function hslToHex(hsl: hslColor): string {
            let h = hsl.h,
                s = hsl.s,
                l = hsl.l,
                c = (1 - Math.abs(2*l - 1)) * s,
                x = c * ( 1 - Math.abs((h / 60 ) % 2 - 1 )),
                m = l - c/ 2,
                r, g, b;
    
            if (h < 60) {
                r = c;
                g = x;
                b = 0;
            }
            else if (h < 120) {
                r = x;
                g = c;
                b = 0;
            }
            else if (h < 180) {
                r = 0;
                g = c;
                b = x;
            }
            else if (h < 240) {
                r = 0;
                g = x;
                b = c;
            }
            else if (h < 300) {
                r = x;
                g = 0;
                b = c;
            }
            else {
                r = c;
                g = 0;
                b = x;
            }
    
            let normalize = (color: number, m: number) => {
                color = Math.floor((color + m) * 255);
                if (color < 0) color = 0;
                return color;
            };
    
            return Utils.Color.rgbToHex({
                r: normalize(r, m),
                g: normalize(g, m),
                b: normalize(b, m)
            });
        }

        export function saturate(hex: string, percent: number, baseColor: string): string {

            if (baseColor) {    
                //Pretty saturation
                let rgb = Utils.Color.hexToRGB(hex);
                let baseRGB = Utils.Color.hexToRGB(baseColor);
    
                let returnRGB = {
                    r: Math.round(baseRGB.r + ((rgb.r - baseRGB.r) * percent)),
                    g: Math.round(baseRGB.g + ((rgb.g - baseRGB.g) * percent)),
                    b: Math.round(baseRGB.b + ((rgb.b - baseRGB.b) * percent))
                }
                return Utils.Color.rgbToHex(returnRGB);
                
            } else {
                //Real saturation
                let hsl = Utils.Color.hexToHSL(hex);
                hsl.s *= percent;
                return Utils.Color.hslToHex(hsl);
            }
        }

        /**
         * Shade blend v4.0 Universal
         * Source: http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
         * Source: https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js) 
         * @param c0 Initial color
         * @param p Blend percentage float - E.g. 0.5 
         * @param c1 Final color - optional, set null to auto determine
         * @param l Linear blending? - optional, set false to use Log blending
        */
        export function shade(c0: string, p: number, c1: string = null, l = false) {
            let r,g,b,P,f,t,h,i=parseInt,m=Math.round,a=Number(typeof(c1)=="string");
            if(typeof(p)!="number"||p<-1||p>1||typeof(c0)!="string"||(c0[0]!='r'&&c0[0]!='#')||(c1&&!a))return null;
            var pSBCr=(d: any)=>{
                let n=d.length,x: any={};
                if(n>9){
                    [r,g,b,a]=d=d.split(","),n=d.length;
                    if(n<3||n>4)return null;
                    x.r=i(r[3]=="a"?r.slice(5):r.slice(4)),x.g=i(g),x.b=i(b),x.a=a?a:-1
                }else{
                    if(n==8||n==6||n<4)return null;
                    if(n<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(n>4?d[4]+d[4]:"");
                    d=i(d.slice(1),16);
                    if(n==9||n==5)x.r=d>>24&255,x.g=d>>16&255,x.b=d>>8&255,x.a=m((d&255)/0.255)/1000;
                    else x.r=d>>16,x.g=d>>8&255,x.b=d&255,x.a=-1
                }return x
            };
            h=c0.length>9,h=a?c1.length>9?true:c1=="c"?!h:false:h,f=pSBCr(c0),P=p<0,t=c1&&c1!="c"?pSBCr(c1):P?{r:0,g:0,b:0,a:-1}:{r:255,g:255,b:255,a:-1},p=P?p*-1:p,P=1-p;
            if(!f||!t)return null;
            if(l)r=m(P*f.r+p*t.r),g=m(P*f.g+p*t.g),b=m(P*f.b+p*t.b);
            else r=m((P*f.r**2+p*t.r**2)**0.5),g=m((P*f.g**2+p*t.g**2)**0.5),b=m((P*f.b**2+p*t.b**2)**0.5);
            a=f.a,t=t.a,f=a>=0||t>=0,a=f?a<0?t:t<0?a:a*P+t*p:0;
            if(h)return"rgb"+(f?"a(":"(")+r+","+g+","+b+(f?","+m(a*1000)/1000:"")+")";
            else return"#"+(4294967296+r*16777216+g*65536+b*256+(f?m(a*255):0)).toString(16).slice(1,f?undefined:-2)
        }
    }

    export module Obj {

        // Clone object - memory eager!
        export function clone(obj: any) {
            return JSON.parse(JSON.stringify(obj));
        }

        // Check if object is empty = no properties
        export function isEmpty(object: any, includeNull = true): boolean {
            for (let prop in object) {
                if (object[prop] !== null || includeNull) {
                    return false;
                }
            }
            return true;
        }

        // Check if the object has been set
        export function isSet(object: any): boolean { 
            return (typeof object !== 'undefined' && object !== null); 
        }

        // Check object type
        export function is(x: any, what = "Object"): boolean { 
            return Object.prototype.toString.call(x) === `[object ${Utils.Text.ucfirst(what)}]`;
        }
        export function isObject(x: any): boolean {
            return Utils.Obj.is(x, "Object");
        }
        export function isArray(x: any): boolean {
            return Utils.Obj.is(x, "Array");
        }
        export function isFunction(x: any): boolean {
            return Utils.Obj.is(x, "Function");
        }
        export function isDate(x: any): boolean {
            return Utils.Obj.is(x, "Date");
        }

        // Merge two objects
        export function merge(source: any, target: any) {
            let result = {};
            for (let prop in source) {
                if (prop in target) {
                    if (Utils.Obj.isObject(source[prop]) && Utils.Obj.isObject(target[prop])) {
                        (<any>result)[prop] = Utils.Obj.merge(source[prop], target[prop]);
                    } else {
                        (<any>result)[prop] = target[prop];
                    }
                }
            }
            
            for (let prop in target) {
                if (!(prop in source)) {
                    (<any>result)[prop] = target[prop];
                }
            }
            
            return result;
        }

        // Find diff properties
        export function diff(source: any, target: any) {
            let result = {};
            for (let prop in target) {
                if (Utils.Obj.isFunction(target[prop])) {
                    continue;
                } else if (!(prop in source)) {
                    (<any>result)[prop] = target[prop]; //New branch
                } else {
                    if (Utils.Obj.isObject(target[prop]) || Utils.Obj.isArray(target[prop])) {
                        let _result = Utils.Obj.diff(source[prop], target[prop]);
                        if (!Utils.Obj.isEmpty(_result)) {
                            (<any>result)[prop] = _result;
                        }
                    } else if (Utils.Obj.isDate(target[prop])) {
                        if (target[prop].getTime() !== source[prop].getTime()) {
                            (<any>result)[prop] = target[prop];
                        }
                    } else {
                        if (source[prop] !== target[prop]) {
                            (<any>result)[prop] = target[prop];
                        }
                    }
                }
            }
            return result;
        }
    }
}

export interface Dic<T> {
    [key: string]: T
}

export interface Action {
    action: string
    data: any
}

// DOM helpers
declare global {
    interface Element {
        toggleClass(name: string, toggle?: boolean): void
        toggleAttr(name: string, toggle?: boolean, value?: string): void
        toggle(toggle: boolean): void
    }
    interface ParentNode {
        empty: boolean
    }
}
HTMLElement.prototype.toggleClass = function(name: string, toggle?: boolean) {

    if (typeof toggle === "undefined" || toggle === null)
        toggle = !this.classList.contains(name);

    if (toggle) {
        this.classList.add(name);
    } else {
        this.classList.remove(name);
    }
}
HTMLElement.prototype.toggleAttr = function(name: string, toggle?: boolean, value: string = "") {

    if (typeof toggle === "undefined" || toggle === null)
        toggle = !this.hasAttribute(name);

    if (toggle) {
        this.setAttribute(name, value);
    } else {
        this.removeAttribute(name);
    }
}
HTMLElement.prototype.toggle = function(toggle: boolean) {
    this.toggleAttr("hidden", !toggle);
}

// Selectors helpers
export function _(selector: string, container: ParentNode = document): HTMLElement {
    let element = container.querySelector(selector);
    if (!element) {
        element = document.createElement("del");
        element.empty = true;
    }
    return <HTMLElement>element;
}
export function __(selector: string, container: ParentNode = document): NodeList {
    return container.querySelectorAll(selector);
}

// On ready
export function onReady(callback: any) {
    if (document.readyState != "loading") {
        callback();
    } else {
        document.addEventListener("DOMContentLoaded", callback);
    }
}