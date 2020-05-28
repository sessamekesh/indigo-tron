# Draco3D Library

The contents of this directory are the compiled output of Google's [Draco](https://github.com/google/draco) library. As of the writing of this code (September 2019), this compiled output could be found in the "javascript" directory of that repo.

Draco is a library for compressing and decompressing 3D meshes, intended to improve the storage and transmission of 3D graphics. I've found it very useful for web apps, where download speed is the most limiting factor for loading 3D geometry.

Both WebAssembly and JavaScript bindings are present - the WebAssembly code should be preferred, though the JavaScript code _can_ be used as a fallback if needed. As of today, WASM is supported in [all major browsers](https://caniuse.com/#feat=wasm), and [runs faster](https://www.lucidchart.com/techblog/2017/05/16/webassembly-overview-so-fast-so-fun-sorta-difficult/) than naive JavaScript, especially for low-level math operations such as decoding geometry.

## A Quick Caveat
I use Draco by itself as a geometry interchange format - I would suggest looking into [glTF](https://www.khronos.org/gltf/) for your own work as an option, since it is much more standard than Draco, especially for complex scenes. Since WebAssembly is so widely supported, it may even be worthwhile to write your asset loading code in C++ and use [Assimp](http://www.assimp.org/), a brilliant C/C++ library for loading 3D assets from a wide variety of formats, including glTF.

## Generating Draco files
TODO (sessamekesh): complete this section
I've been using some hacked together custom code to convert FBX files into Draco (DRC) format. I'm planning on open sourcing it with this project, along with my custom animation format code... If this text is still here, open an issue about that. This is _not_ meant to make it to the final version of this demo!
