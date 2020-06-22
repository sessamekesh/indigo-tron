# indigo-tron
WebGL Tron clone - demonstrate game programming principles

## About
YouTube game programming video series, covering rendering techniques, ECS, testing, etc.
Inspired by [RevoTRON](http://revotron.tripod.com/screens.htm), which is what initially inspired my interest in game programming.

## Building
TODO (sessamekesh): Put in better notes here, this is all for you right now!

## General TODO
Here's a list of things I still need to do before launching this:
- [ ] Adjust the wall rendering (notes in the wall shader)
- [ ] Finish migration to new renderable system (RenderGroup etc)
- [ ] Revamp collision system - walls cannot be broken, constraint-based physics system.
- [ ] Music
- [ ] Minimap rendering
- [ ] Game start state (button to begin game, start screen with AI wanderin around no collisions)
- [ ] Game victory state (victory - stop bike, show fireworks)
- [ ] Game loss state (follow another lightcycle, "restart game" button)
- [ ] Wall collision particle effect
- [ ] Asynchronously load all resources (right now it's serial, and takes awhile)
- [ ] Create a joystick for mobile use (right hand side)
- [ ] Make arena wall a more pretty thing to look at - moderate value, instead of dark

Note: Object pool for math objects (vec3 etc) is somewhat worth it to use, it seems to reduce frame memory increase by somewhere in the 10s KB range (~25% it seems like!)

ng build --prod --base-href /game-app/
