import '@testing-library/jest-dom'
// Shared polyfills for node test environment
if (typeof global.ReadableStream === 'undefined') {
	// Minimal polyfill sufficient for tests consuming small in-memory streams
	global.ReadableStream = class {
		constructor(opts){ this._chunks=[]; opts && opts.start && opts.start({ enqueue: c=>this._chunks.push(c), close:()=>{} }); }
		getReader(){ let i=0; const d=this._chunks; return { read: async ()=> i<d.length ? { value: new TextEncoder().encode(d[i++]), done:false } : { value: undefined, done:true } }; }
	};
}
if (typeof global.TextEncoder === 'undefined') {
	const { TextEncoder, TextDecoder } = require('util');
	global.TextEncoder = TextEncoder;
	global.TextDecoder = TextDecoder;
}
