# indigo-tron
WebGL Tron clone - demonstrate game programming principles

## About
YouTube game programming video series, covering rendering techniques, ECS, testing, etc.
Inspired by [RevoTRON](http://revotron.tripod.com/screens.htm), which is what initially inspired my interest in game programming.

## Building
TODO (sessamekesh): Put in better notes here, this is all for you right now!

## General TODO
Here's a list of things I still need to do before launching this:
- [ ] Minimap rendering
- [ ] Game start state (button to begin game, start screen with AI wanderin around no collisions)
- [ ] Game victory state (victory - stop bike, show fireworks)
- [ ] Game loss state (follow another lightcycle, "restart game" button)
- [ ] Music
- [ ] Wall collision particle effect
- [ ] Revamp collision physics (constraints based, physics update cycle)
- [ ] Asynchronously load all resources (right now it's serial, and takes awhile)
- [ ] Examine if using an object pool is worthwhile at all - it looks like the answer is "NO!"
- [ ] Create a joystick for mobile use (right hand side)
- [ ] Make arena wall a more pretty thing to look at - moderate value, instead of dark

ng build --prod --base-href /game-app/
