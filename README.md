# Vowel Lab

Vowel Lab is an interactive, real-time vowel synthesizer for exploring how a vocal source and simplified vocal-tract cavities shape sound. It runs entirely in the browser using the Web Audio API and has no runtime dependencies.

## Features

- Real-time harmonic vocal-cord source with pitch and brightness controls
- Independent laryngeal-cavity control for demonstrating vocal personality
- Rear and front oral-cavity controls for vowel shaping
- Adjustable mouth opening and output level
- Presets for **A**, **E**, **I**, **O**, and **U**
- Dynamic vocal-tract diagram and live output waveform
- Responsive, keyboard-accessible interface

Vowel presets modify only the two oral cavities and mouth opening. They deliberately leave the laryngeal setting unchanged so vowel identity and speaker character can be explored separately.

## Running Locally

Because browser audio features work best through HTTP, serve the `dist/` directory instead of opening `index.html` directly.

With Node.js:

```bash
npx serve dist
```

Alternatively, with Python:

```bash
python -m http.server 8000 --directory dist
```

Open the displayed local URL, select **Start sound**, and keep the initial output level low—especially when using headphones.

## Demo

[The demo page](https://akinori-ito.github.io/vocal-synth-site/index.html)  


## How the Model Works

The signal path is:

```text
glottal source → laryngeal personality filter → oral resonances → lip radiation
```

The cavity controls are designed as an intuitive teaching model. Internally, they adjust resonant filters continuously while the diagram provides a geometric analogy. It is not a biomechanically exact vocal-tract simulation, and cavity sizes should not be interpreted as direct anatomical measurements or precise F1/F2 values.

## Project Structure

```text
dist/  
├── index.html    # Application interface and SVG diagram  
├── app.js        # Audio synthesis and interaction logic  
├── styles.css    # Main layout and visual design  
└── diagram.css   # Dynamic vocal-tract styling
```

No build step is required. Edit the files under `dist/`, reload the page, and test with a current desktop browser that supports the Web Audio API.

## Contributing

Keep changes dependency-free unless a build system provides a clear benefit. Test all vowel presets, sliders, sound start/stop behavior, narrow-screen layout, and reduced-motion behavior before submitting a pull request. Describe audible changes clearly and include screenshots for interface modifications.

##   

 
