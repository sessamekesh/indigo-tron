# LibSceneNode2

## Overview

A _scene graph_ is a structure that is used to hold entities useful for a _scene_ - it is commonly
used in graphics programming, where each _scene node_ holds a transformation matrix, a list of
renderable objects attached to that node, and a list of child scene nodes.

For example: If you want to represent a scene with two characters sitting in a car, and the one
in the passenger seat is holding a bottle of crisp, cold water, you may set up a scene graph like
this:

* CarNode (child of RootNode) has ShinyThingRenderable
* MainCharacterNode (child of Car) has CharacterModelRenderable
* SecondaryCharacterNode (child of Car) has CharacterModelRenderable
* SecondaryCharacterArmNode (child of SecondaryCharacter) has CharacterModelRenderable (for arm) and ShinyThingRenderable (for wrist watch)
* CrispColdWaterNode (child of SecondaryCharacterArmNode) has WaterBottleRenderable

A scene graph has one root node, to which all child nodes are ancestors. The rendering engine would
query the scene graph object every frame for all renderables of each type on the scene, and then
draw those objects.

Additional properties could be added to scene nodes to give additional filtering power - e.g., an
"isVisible" property that allows filtering only on visible entities, a "castsShadow" property that
determines if renderables on a scene node (and children) can possibly cast shadows, etc.

Some of these properties are hierarchial - e.g., an AABB (axis-aligned bounding box) property of a
scene node would include that node's AABB property and expand to also include all child node AABBs.
Likewise, the transformation matrix for a scene node is determined by multiplying its own transform
against the parent transformation matrix.

### Complications of Naive Design

The naive design attaches an arbitrarily large set of properties that are useful to the specific
engine / library that uses the scene graph - this makes sense, but introduces a tight coupling for
anything that wants to use the scene graph implementation to rendering code. This is troubling if
logical code uses a scene node, which it very well might want to do - for example, a planetarium
would very likely want to use scene nodes to represent the rotation of the Earth around the Sun, the
Sun around the Saggitarius A*, and the moon around the Earth. This logical code would have to be
either placed in rendering logic (and therefore untestable), or mock out rendering objects in
logical test code (which also sucks ass).

### Addon Approach

To circumvent the problem of functionality coupling, the idea of a Module is used in this SceneGraph
implementation. A SceneNode itself has little/no functionality - it is simply a tree node which has
a reference to its parent (if one exists) and its children, along with methods to attach/detach
itself from parent/children.

The interesting functionality comes in _SceneGraphModule_ objects, which add on domain-specific
properties and functionality to scene nodes.

Example usage:

```typescript
SceneGraph mySceneGraph = new SceneGraph();
mySceneGraph.installModule(TransformMatrixModule);
mySceneGraph.installModule(ShinyRenderableModule);
mySceneGraph.installModule(CharacterRenderableModule);

const carNode = mySceneGraph.addNode()
    .addProperty(TransformMatrixModule.worldMatrix({
      pos: vec3.fromValues(10, 0, 0),
    }))
    .addProperty(ShinyRenderableModule.renderables([carRenderable]));
const characterNode = mySceneGraph.addNode()
    .setParent(carNode)
    .addProperty(TransformMatrixModule.worldMatrix({
      pos: vec3.fromValues(2, 4, 5),
    }))
    .addProperty(CharacterRenderableModule.renderables([characterBody, characterLegs]));

// ...
characterShader.activate(gl);
const characterRenderables = mySceneGraph.with(CharacterRenderableModule).getAllRenderables();
characterRenderables.forEach(renderable => characterShader.render(gl, frameProps, renderable));
```

### Addon Design
