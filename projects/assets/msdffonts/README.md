# Multi-Channel Signed Distance Field Fonts

Indigo Tron uses multi-channel signed distance fields for its text rendering. While not suitable for
all applications, it's an excellent trick for high quality text rendering in many applications, and
is designed to run quickly on modern hardware.

For an introduction to signed distance fields (SDF), see [this Valve paper](https://steamcdn-a.akamaihd.net/apps/valve/2007/SIGGRAPH2007_AlphaTestedMagnification.pdf).
It offers an academic coverage of the topic, from its usage in Team Fortress 2.

These fonts use multi-channel signed distance fields (MSDF), see [the msdfgen library](https://github.com/Chlumsky/msdfgen)
on GitHub for more information about how they are generated and used.

Finally, fonts are generated using the [msdf-bmfont-web](https://github.com/donmccurdy/msdf-bmfont-web)
tool ([live tool here](https://msdf-bmfont.donmccurdy.com/)). Rendering is done through custom MSDF
rendering code, but is based heavily on the msdf-bmfont-web library... which in turn is based on
[three-bmfont-text](https://github.com/Jam3/three-bmfont-text)... which uses [msdf-bmfont](https://github.com/soimy/msdf-bmfont-xml) for generating glyphs... using the [BMFont](http://www.angelcode.com/products/bmfont/doc/file_format.html) format. It's open source turtles all the way down!
