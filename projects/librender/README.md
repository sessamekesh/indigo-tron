_Placeholder README for librender_

This module is for reasonably generic rendering objects:
* Geometry types
* Geometry generating objects / functions
* Shader utilities, wrappers, and generic implementations
* Model parsing utilities
* WebGL 2 wrapper types (texture, etc)

Notice there is some game-specific code (_cough cough_ specific shader implementations) that is in
here. That's a mistake. Whoops. Re-do that on writing the actual thing.

Notice: Logic in here should be remarkably simple wherever possible, because it will be difficult or
impossible to unit test any code in this directory because of the WebGL dependency.

## Concepts

Within the librender directory, there are some recurring ideas and themes that are important to
understand:

### Render Data

In order to render 3D geometry to the screen, the following information is needed. _Notice: similar information is needed for 2D rendering_.

#### Geometry

_Geometry_ is comprised of (1) a list of vertices and (2) a list of triangles formed of points in
that vertex list, identified by their index in the vertex list. Each _vertex_ is generally comprised
of at least a 3D position that defines where in space it is located relative to the origin of the
geometry, but may also contain other information, such as:

* Vertex normal: The direction in 3D space this vertex is facing - i.e., which way is "out"
* UV coordinate(s): The coordinate on a texture this vertex should use in texture sampling
* Tangent/bitangent: Vectors orthogonal to the vertex normal, used in bump mapping / lighting
* Skeleton bone IDs + weights: Identifies which bones in an animation skeleton affect this vertex, and how much.
* Color: Identify the color of the object in question at this vertex

#### Per-Frame Uniforms

_Per-frame uniforms_ are chunks of data that are needed for shading, and are consistent between all
render calls in a frame. The term is loose - some per-frame uniforms may change a few times for a
single scene. For example, the _view transformation matrix_ is treated as a per-frame uniform, even
though a single frame may include render calls from several different cameras that each provide a
different view transform matrix. On the other hand, the _projection transformation matrix_ is only
updated when the render target is resized, and generally does not change for the entire application
lifecycle.

Common examples: View transformation, projection transformation, light color, light direction,
ambient light coefficient, camera position.

#### Per-Object Uniforms

_Per-object uniforms_ are chunks of data that are needed for shading, but are different for each
object in a scene.

Common examples: World transformation matrix, texture binding, skeleton matrices (animation).

### Renderable

A _renderable_ contains (1) a reference to the geometry used for the object in question, (2) a
collection of all per-object uniform values required to render the object in question, and (3) any
tags/metadata that is needed for filtering.

## Frame organization

For each type of shading, a _Shader_ is defined. Each shader has a corresponding _Geometry_ type
that it uses - which can be made with an _Extractor_ (from a 3D model file) or a _Generator_ (from
a list of parameters, e.g. the size of a box).

Each shader has a _RenderCall_ type that it exports - this is a POD struct that contains a reference
to the geometry, and the uniforms that are needed to perform a render call.

To help with rendering, a _Renderable_ type can be made for a shader type. This is not a requirement,
but it does help quite a bit - a _Renderable_ is a stateful class that contains a reference to a
geometry object, and any per-object uniforms (e.g., world transformation matrix, texture refs) needed
to render the thing. Renderables also contain arbitrary metadata, e.g., tags that define their type.

If a _Renderable_ type has been defined, a _RenderableGroup_ instance can be made, a collection
of _Renderable_ objects as well as a collection of tags that may pertain to each renderable.
Queries can be made against these renderables to return a group that should be rendered.

_RenderableUtils_ are utility classes that take in per-frame uniforms and a collection of renderables
and draws them to the currently bound buffer.
