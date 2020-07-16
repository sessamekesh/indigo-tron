# indigo-tron
WebGL Tron clone - demonstrate game programming principles

## About
YouTube game programming video series, covering rendering techniques, ECS, testing, etc.
Inspired by [RevoTRON](http://revotron.tripod.com/screens.htm), which is what initially inspired my interest in game programming.

## Building
TODO (sessamekesh): Put in better notes here, this is all for you right now!

## General TODO
Here's a list of things I still need to do before launching this:
- [ ] Lightcycle model refactor
  - [x] Collision system that...
    - [x] Attaches collision bounds component to the lightcycle
    - [x] Checks for, and resolves, collisions against the wall
    - [x] In doing so, generate collision objects for the frame that can be used by downstream systems
      - [x] Collisions can probably be kept on the lightcycle, but might want to do on global singleton?
  - [x] Damage system - use upstream collision data, apply damage to lightcycle based on velocity impulses
  - [ ] Migrate AI to using the new system
- [ ] Music
- [ ] UI rendering (health bar, minimap?, steering indication)
- [ ] Game start state (button to begin game, start screen with AI wanderin around no collisions)
- [ ] Game victory state (victory - stop bike, show fireworks)
- [ ] Game loss state (follow another lightcycle, "restart game" button)
- [ ] Wall collision particle effect, lightcycle death particle effect
- [ ] Floor grid (soft white line - can just be quads across floor, maybe pulsing softly)
- [ ] Asynchronously load all resources (right now it's serial, and takes awhile)
- [ ] Create a joystick for mobile use (right hand side)

## Possible improvements?
- [ ] Rendering takes a long time - perhaps in making so many draw calls, especially on the walls.
  - [ ] Frame time could be dramatically (~60%) reduced by drawing walls instanced, or as part of a triangle strip.

Note: Object pool for temporary math objects (vec3 etc) is somewhat worth it to use, it seems to reduce frame memory increase by somewhere in the 10s KB range (~25% it seems like!)
Owned math resources, it is less clear if it helps or not.

npm start
