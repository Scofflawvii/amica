import { Box3, BufferAttribute } from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { GenerateMeshBVHWorker } from './GenerateMeshBVHWorker.js';
import { WorkerBase } from './utils/WorkerBase.js';

// Local helpers to avoid relying on three-mesh-bvh internal src paths
function isSharedArrayBufferSupported() {
	try {
		return typeof SharedArrayBuffer !== 'undefined' && typeof Atomics !== 'undefined';
	} catch {
		return false;
	}
}

function convertToBufferType(array, BufferType) {
	if (!array) return null;
	// If we want SharedArrayBuffer and current buffer isn't SAB, copy into SAB-backed array
	if (typeof SharedArrayBuffer !== 'undefined' && BufferType === SharedArrayBuffer && !(array.buffer instanceof SharedArrayBuffer)) {
		const Ctor = array.constructor; // preserve type (e.g., Float32Array, Uint32Array)
		const sab = new SharedArrayBuffer(array.byteLength);
		const copy = new Ctor(sab);
		copy.set(array);
		return copy;
	}
	return array;
}

function ensureIndex(geometry /*, options*/) {
	if (geometry.index) return;
	const position = geometry.getAttribute('position');
	if (!position) return;
	const vertexCount = position.count;
	// Use Uint32Array when necessary
	const IndexArray = vertexCount > 65535 ? Uint32Array : Uint16Array;
	const idx = new IndexArray(vertexCount);
	for (let i = 0; i < vertexCount; i++) idx[i] = i;
	geometry.setIndex(new BufferAttribute(idx, 1, false));
}

const DEFAULT_WORKER_COUNT = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 4;
class _ParallelMeshBVHWorker extends WorkerBase {

	constructor() {

		const worker = new Worker( new URL( './parallelMeshBVH.worker.js', import.meta.url ), { type: 'module' } );
		super( worker );

		this.name = 'ParallelMeshBVHWorker';
		this.maxWorkerCount = Math.max( DEFAULT_WORKER_COUNT, 4 );

		if ( ! isSharedArrayBufferSupported() ) {

			throw new Error( 'ParallelMeshBVHWorker: Shared Array Buffers are not supported.' );

		}

	}

	runTask( worker, geometry, options = {} ) {

		return new Promise( ( resolve, reject ) => {

			if ( ! geometry.index && ! options.indirect ) {

				ensureIndex( geometry, options );

			}

			if (
				geometry.getAttribute( 'position' ).isInterleavedBufferAttribute ||
				geometry.index && geometry.index.isInterleavedBufferAttribute
			) {

				throw new Error( 'ParallelMeshBVHWorker: InterleavedBufferAttribute are not supported for the geometry attributes.' );

			}

			worker.onerror = e => {

				reject( new Error( `ParallelMeshBVHWorker: ${ e.message }` ) );

			};

			worker.onmessage = e => {

				const { data } = e;

				if ( data.error ) {

					reject( new Error( data.error ) );
					worker.onmessage = null;

				} else if ( data.serialized ) {

					const { serialized, position } = data;
					const bvh = MeshBVH.deserialize( serialized, geometry, { setIndex: false } );
					const boundsOptions = {
						setBoundingBox: true,
						...options,
					};

					// we need to replace the arrays because they're neutered entirely by the
					// webworker transfer.
					geometry.attributes.position.array = position;
					if ( serialized.index ) {

						if ( geometry.index ) {

							geometry.index.array = serialized.index;

						} else {

							const newIndex = new BufferAttribute( serialized.index, 1, false );
							geometry.setIndex( newIndex );

						}

					}

					if ( boundsOptions.setBoundingBox ) {

						geometry.boundingBox = bvh.getBoundingBox( new Box3() );

					}

					if ( options.onProgress ) {

						options.onProgress( data.progress );

					}

					resolve( bvh );
					worker.onmessage = null;

				} else if ( options.onProgress ) {

					options.onProgress( data.progress );

				}

			};

			const index = geometry.index ? geometry.index.array : null;
			const position = geometry.attributes.position.array;
			worker.postMessage( {

				operation: 'BUILD_BVH',
				maxWorkerCount: this.maxWorkerCount,
				index: convertToBufferType( index, SharedArrayBuffer ),
				position: convertToBufferType( position, SharedArrayBuffer ),
				options: {
					...options,
					onProgress: null,
					includedProgressCallback: Boolean( options.onProgress ),
					groups: [ ... geometry.groups ],
				},

			} );

		} );

	}

}

export class ParallelMeshBVHWorker {

	constructor() {

		if ( isSharedArrayBufferSupported() ) {

			return new _ParallelMeshBVHWorker();

		} else {

			console.warn( 'ParallelMeshBVHWorker: SharedArrayBuffers not supported. Falling back to single-threaded GenerateMeshBVHWorker.' );

			const object = new GenerateMeshBVHWorker();
			object.maxWorkerCount = DEFAULT_WORKER_COUNT;
			return object;

		}

	}

}
