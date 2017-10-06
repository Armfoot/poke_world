# Poke World

An interactive 2 dimensional world where Ash catches a *poke* (monster) each time he explores a new place.

You are able to manually guide Ash by using directional controls or by providing a sequence of directions to be explored. This sequence can be traveled in a step by step exploration fashion or in a super-fast-experimental-movement mode.


## Usage

1. Clone the project (`git clone https://github.com/Armfoot/poke_world.git`) or download and unzip.
1. Open *poke*.htm in a web browser.
1. Press the keyboard's arrow keys or the initials of the words **N**orth, **E**ast, **S**outh or **W**est when the page is loaded to manually explore the world (the input box is automatically selected).
1. Each new position/place that Ash explores will be translated to the visual map and increase the number of *poke* and *moves*. Traveling to an already visited place will only increment the *moves* value.
1. The explored path can be automatically copied to the tests text-area box by pressing the **Copy** button.
1. Any exploration can be entirely restarted by pressing the **Restart** button.
1. The tests text-area box accepts a sequence of directions, e.g. *NEEEW*, and once the **Run** button is clicked the sequence will be automatically explored, providing the final position marker, the number of *poke* and moves. Any non-directional symbol will be discarded before execution.
1. The smaller buttons with arrows or symbols on them will create sequences of directions that will be automatically multiplied by the value in the thousands multiplier input box (e.g. a value of 2 leads to a sequence of 2.000 of one particular direction). Each button can be hovered to access the test's description and, when pressed, the test will also be automatically run outputting a log with this description and with its respective performance.
1. A more efficient processing can be performed by checking a movement mode checkbox near the **Run** button.

**Notice**: very large sequences (hundreds of thousands of directions) may cause your web browser to become unresponsive or ask permission to allow the script to continue running for a longer period of time (possibly one to two minutes). For knowing the outcome of these sequences, the script should be allowed to run entirely.

### Instructions for developers

Several CSS/SASS and Lint packages can be installed by executing the [Node.js Package Manager](https://www.npmjs.com/get-npm) in the root (`package.json` folder):

    npm install

A `node_modules` will be created in the root with the downloaded packages and the following will be automatically executed after a successful install:

    npm run build

Console output may then be useful for linting:

- `npm run watch:lint` - lint errors output will be provided every time an HTML, JS or SASS file is saved.
- `npm run watch:css` - any `*.scss` change results in a new CSS file (SASS pre-processor) with the browser-specific prefixes added by the [autoprefixer](https://github.com/postcss/autoprefixer).

### IDE configuration

Your IDE may be further configured by using the following plugins:
- [`.editorconfig`](http://editorconfig.org/#download)
- [`.stylelintrc`](https://github.com/stylelint/stylelint/blob/master/docs/user-guide/complementary-tools.md#editor-plugins)
- [`.eslintrc`](http://eslint.org/docs/user-guide/integrations#editors)


## Structure

### CSS

[BEM-style](https://medium.com/@dte/understanding-css-selector-specificity-a02238a02a59) classes were used for retaining selectors' low specificity.

The only CSS file generated is `global.css`, which is a compilation of the several area-specific-styles (SCSS files) in the *SASS* folder.

### Javascript

The `main.js` uses *strict* mode (ES6) and several of its features.
The core exploration methods are inside the Exploration and PokeWorld classes.
Access to the DOM, tests and auxiliar methods were separated into regions starting with `//BOR` and ending with `//EOR`.

The more efficient movement mode relies on a path exploration recursive method instead of an individual step by step exploration. Linear repeating sequences are identified and divided in order to be explored in each recursion.


## Thanks

[Premium Minds](https://premium-minds.com/) for the idea and challenge.
