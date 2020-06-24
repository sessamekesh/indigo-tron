# indigo-tron
WebGL Tron clone - demonstrate game programming principles

## About
YouTube game programming video series, covering rendering techniques, ECS, testing, etc.
Inspired by [RevoTRON](http://revotron.tripod.com/screens.htm), which is what initially inspired my interest in game programming.

## Building
TODO (sessamekesh): Put in better notes here, this is all for you right now!

## General TODO
Here's a list of things I still need to do before launching this:
- [ ] Migrate RenderGroup to SceneGraph2
  - Create a new type of Renderable that has a cleanup method on itself (instead of on RenderableGroup)
    - Extend this with LambertRenderable, SolidColor2DRenderable, etc., in the librender / libgamerender modules
  - Create a SceneNodeAddon (librender) that stores map `Klass<T extends Renderable<any>> => T[]` and method getRenderableList(renderableKlass)
  - Create a SceneNodeModule (librender) that exposes getRenderables() and getRenderablesOfType(renderKlass) methods for the entire scene graph
- [ ] Adjust the wall rendering (notes in the wall shader)
- [ ] Finish migration to new renderable system (RenderGroup etc)
- [ ] Revamp physics
  - Create a traditional physics engine - simple force / constraints
  - Lightcycles are moved forward with a LightcycleDrivingForce
    - Drag increases linearly with velocity
    - Driving force is a constant
    - This should result in a smooth speed up to top speed when slowed / starting
  - Wall collisions are traditional constraint-based. No destruction of walls for collisions.
  - Vitality loss is a function of impact strength and wheel rotation adjustment
- [ ] Music
- [ ] Minimap rendering
- [ ] Game start state (button to begin game, start screen with AI wanderin around no collisions)
- [ ] Game victory state (victory - stop bike, show fireworks)
- [ ] Game loss state (follow another lightcycle, "restart game" button)
- [ ] Wall collision particle effect, lightcycle death particle effect
- [ ] Floor grid (soft white line - can just be quads across floor, maybe pulsing softly)
- [ ] Asynchronously load all resources (right now it's serial, and takes awhile)
- [ ] Create a joystick for mobile use (right hand side)
- [ ] Make arena wall a more pretty thing to look at - moderate value, instead of dark

Note: Object pool for temporary math objects (vec3 etc) is somewhat worth it to use, it seems to reduce frame memory increase by somewhere in the 10s KB range (~25% it seems like!)
Owned math resources, it is less clear if it helps or not.

ng build --prod --base-href /game-app/
