# (Work In Progress) Indigo TRON

WebGL game in which players ride motorcycles around an enclosed arena trying to outlast other players
while avoiding walls left behind by their own (and enemy) cycles.

Live demo at [https://sessamekesh.github.io/game-app/](https://sessamekesh.github.io/game-app/). Game app is kept somewhat up to date.

**This project is a work-in-progress! A loose task list is found at the bottom of this doc. Browse at your own peril - I haven't gone through and done any cleanup on it yet!**.

I'm making this public while it's still a WIP for a couple reasons:
1) I want to get some other eyes on it before I actually publish a final version
2) It'll likely be another 3-6 months before I actually finish this up with how my day job is going, but I think a lot of pieces of it are already a good enough example that it can start showing how to do certain things.
3) It's a good way to be transparent on the progress of the code for the project - people can see the code I'm committing!

Last updated 17 July 2020

## About

WebGL game based loosely loosely on the TRON [arcade game](https://en.wikipedia.org/wiki/Tron_(video_game)),
which in turn is loosely based on the events of the Disney film [Tron](https://en.wikipedia.org/wiki/Tron),
which itself may have been named after the [TRace ON](https://en.wikipedia.org/wiki/TRON_command) command in BASIC.

The intention of this project is to provide a nice example of some common game programming concepts. This project and repository serves as a proof of concept - once it is complete, I will be re-implementing it in a YouTube tutorial series.

Concepts covered:
* Entity Component Systems
* Scene Graphs
* Render Engine Abstractions
* Collision Detection
* Player input management
* Game AI (non-human players)
* Modular code design
* Software Testing

Inspired by [RevoTRON](http://revotron.tripod.com/screens.htm), which is what initially inspired my interest in game programming (and programming in general!)

## Design Philosophies

Loosely speaking, I try to follow these philosophies when writing the code:

1) Be clear to follow for a student of game programming / software engineering
2) Be functional (i.e., build a game that works well enough)
3) Be representative of common game programming concepts

Though really, if I'm being honest, I left one out:
0) Be whatever the hell comes out of my tired brain at 2:00 AM when I do most of my side project development

You'll notice "optimize the hell out of things" or "take the optimal approach to everything" isn't anywhere on the list, except for maybe being somewhat implied by (2). I prefer clear intent in the code, because ultimately I want beginners to be able to read this and understand what's going on - if I'm doing clever cheeky stuff, then I violate that guiding principle.

## Project Structure

Top level directory can be almost completely ignored. I need to just clean it up one of these days. The project is organized using a hacky monorepo setup that isn't a proper monorepo with nicely scoped library modules though, it's more like a giant blob of code that has a bunch of different entry points that all happen to use the same TypeScript build rules and are organized into folders as if it were organized into libraries.

All the interesting stuff is under `projects`. Some notable directories (in order of how interesting they are):

* `game-app-react`: Entry point to the main production game.
* `assets`: Images, 3D models, WASM binaries, etc. go here. Essentially non-code stuff required for game.
* `libgamemodel`: Game logic goes here
* `librender`: Rendering logic not specific to Indigo TRON goes here. Loosely speaking, this is the "rendering engine"
* `libgamerender`: Rendering logic specific to Indigo TRON goes here (specific shaders, render systems, etc).
* `libecs`: Custom ECS (Entity-Component-System) library implementation. Not an ideal one, but workable.
* `libscenegraph`: Custom scene graph implementation. Definitely not ideal, I'm not even sure I like it that much, but it's workable and modular.
* `io`: User I/O utilities. Is smol.
* `app-template`: Quick barebones application that can be copy-pasted when a new app needs to be created in this project.
* `testutils`: Utilities for Jasmine unit tests (custom matchers and their types)

Some of the others are things that I haven't gotten around to cleaning up. I'll take elements from them into the final product / YouTube series, but they probably do n't even run anymore.
* `libintegrationtest`: Multi-system integration testing framework that optionally allows attaching a renderer for manually supervising test runs. An interesting idea, one that I think is worthwhile to have, but uses a very old iteration of the ECS / application setup that I was using.
* `environment-editor`: Another good idea that I failed to scope properly, and got nerd-sniped trying to use it to design a fun lightcycle wall visual effect (spoiler: I scrapped that in the interest of time), and as a result never ended up being much of an editor at all.
* `particleplayground`: Particle effects playground

The rest of them are garbage and should be ignored.

## Building and Running
```
cd projects/game-app-react
npm install
npm start
```

Open a browser to localhost:8080

## General TODO
Here's a list of things I still need to do before launching this:
- [x] Lightcycle model refactor
  - [x] Collision system that...
    - [x] Attaches collision bounds component to the lightcycle
    - [x] Checks for, and resolves, collisions against the wall
    - [x] In doing so, generate collision objects for the frame that can be used by downstream systems
      - [x] Collisions can probably be kept on the lightcycle, but might want to do on global singleton?
  - [x] Damage system - use upstream collision data, apply damage to lightcycle based on velocity impulses
  - [x] Migrate AI to using the new system
- [ ] Move UI rendering to WebGL, instead of relying on DOM rendering
- [ ] Game start state (button to begin game, start screen with AI wandering around no collisions)
- [ ] Music
- [ ] Cleanup old iterations of core systems (physics, physics2, physics3, lightcycle2...)
- [ ] UI rendering (health bar, minimap?, steering indication, enemy health indication)
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
