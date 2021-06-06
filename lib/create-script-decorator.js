"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Class decorator allowing the use of ES6 classes
 * to define and create PlayCanvas script types.
 * Caveat is: There is a slight iterative runtime overhead to this. (unlike Haxe which can utilize precompiled-macros)
 * The cool thing is that your script (if it uses properties) has an additional property called `attributesData` that can facilitate offboard property reflection/runtime-component
 * property GUI creation.
 * @param {pc.Application} [app]
 */
function createScript(name) {
    return function (obj) {
        var instance = new obj();
        var script = pc.createScript(name);
        // Add public attributes accessible in the editor
        if (instance.attributesData) {
            for (var attr in instance.attributesData) {
                script.attributes.add(attr, instance.attributesData[attr]);
            }
        }
        // Add instance properties and methods to prototype
        var proto = script.prototype;
        for (var prop in instance) {
            if (prop !== 'attributes' && !instance.attributesData[prop]) {
                proto[prop] = instance[prop];
            }
        }
        // Add static properties
        for (var prop in obj) {
            script[prop] = obj[prop];
        }
    };
}
exports.createScript = createScript;
function attrib(params) {
    return function (target, propertyKey, descriptor) {
        if (!target.attributesData) {
            target.attributesData = {};
        }
        target.attributesData[propertyKey] = params;
    };
}
exports.attrib = attrib;
;
/**
 * Base dummy duplicated pc.ScriptType class to be extended when defining.
 * All parameters and useful event-based methods made optional to avoid inadvertedly extending them or having to define them.
 * Caveat is: tsconfig.json needs to be set to: "strictNullChecks": false
 * @export
 * @class ScriptTypeBase
 */
var ScriptTypeBase = /** @class */ (function () {
    function ScriptTypeBase() {
    }
    return ScriptTypeBase;
}());
exports.ScriptTypeBase = ScriptTypeBase;
