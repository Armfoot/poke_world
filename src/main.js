'use strict';

//BOR DOM access functions
function getEl(idStr) {
  return document.getElementById(idStr);
}

function getElsByClass(classStr) {
  return document.getElementsByClassName(classStr);
}

function getElsBySelect(selStr) {
  return document.querySelector(selStr);
}

function updateTextContent(elementsArr, newVal) {
  for (let strPath of elementsArr) {
    strPath.textContent = newVal;
  }
}

function updateDOMElements(...strs) {
  updateTextContent(
    getElsByClass('poke-path__str'),
    strs[0]
  );
  updateTextContent(
    getElsByClass('poke-moves__num'),
    /^[nesw]+$/i.test(strs[0]) ? strs[0].length : 0
  );
  updateTextContent(
    getElsByClass('poke-caught__num'),
    strs[1]
  );
  updateTextContent(
    getElsByClass('poke-position__str'),
    strs[2]
  );

  if(strs.hasOwnProperty(3)) {
    // log text
    updateTextContent(
      getElsByClass('poke-tests-log__str'),
      strs[3]
    );
    // add path to textarea field
    getEl('auto-path').value = strs[0];
    // remove mark on map
    unmarkOnMap('0,0');
  }

  markOnMap(strs[2]);
}

function setUpDOMMap() {
  let grid = getElsByClass('poke-map__grid')[0];
  let row = getElsByClass('poke-map__row')[0];
  let cell = getElsByClass('poke-map__cell')[0];
  for (let i = -10; i <= 10; i++) {
    let nc = cell.cloneNode(true);
    nc.dataset.pos = i + ',';
    row.appendChild(nc);
  }
  cell.remove();
  for (let i = 10; i >= -10; i--) {
    let nr = row.cloneNode(true);
    if(i===0) {
      nr.children[10].classList.add('visited-bg');
      nr.children[10].classList.add('current-bg');
    }
    for(let c of nr.children) {
      c.dataset.pos += i;
    }
    grid.appendChild(nr);
  }
  row.remove();
}

function cleanUpDOMMap() {
  for(let c of getElsByClass('poke-map__cell')){
    c.classList.remove('current-bg');
    c.classList.remove('visited-bg');
  }
  markOnMap('0,0');
}

function getCellOnMap(pos) {
  return getElsBySelect(`.poke-map__grid [data-pos='${pos}']`);
}

function cleanCurrent() {
  for(let c of getElsByClass('poke-map__cell')){
    c.classList.remove('current-bg');
  }
}

function markOnMap(pos, mapLimit = 10) {
  let coords = getCoordinates(pos);
  if(Math.abs(coords.x) <= mapLimit && Math.abs(coords.y) <= mapLimit) {
    cleanCurrent();
    getCellOnMap(pos).classList.add('visited-bg', 'current-bg');
  }
}

function unmarkOnMap(pos) {
  getCellOnMap(pos).classList.remove('visited-bg', 'current-bg');
}

function resetDOMExploration() {
  updateDOMElements('Ash\'s new adventure!', 1 ,'0,0');
  cleanUpDOMMap();
}
//EOR

//BOR misc functions
function keyTranslate(keyCode) {
  switch(keyCode) {
    case 37:
    case 87:
      return 'W';
    case 38:
    case 78:
      return 'N';
    case 39:
    case 69:
      return 'E';
    case 40:
    case 83:
      return 'S';
    default:
      return '';
  }
}

function getCoordinates(coordStr) {
  let coordsArr = coordStr.split(',');
  return {x: parseInt(coordsArr[0]), y: parseInt(coordsArr[1])};
}

function prepAndExec(callback) {
  resetDOMExploration();
  updateTextContent(getElsByClass('poke-tests-log__str'), `Executing${'.'.repeat(30)}
    `);
  setTimeout(() => {
    let testMult = getEl('multiplier');
    let multNum = Math.abs(parseInt(testMult.value));
    multNum = isNaN(multNum) ? 20 : multNum;
    callback(testMult.value = multNum);
  }, 500);
}

function isSuperMove() {
  return getEl('super-move').checked;
}

function getTimeDiff(prev = 0) {
  return Number(Number(Math.round(
          (Number(new Date()) / 1000 - prev) +
         'e2') +'e-2').toFixed(2));
}

function getLogText(testId, time, ...details) {
  return `"${getEl('test-'+testId).title}" test${'.'.repeat(10)}` +
            (details.length < 2 ? '' : `
              Expected poke: ${details[0]}
              Expected moves: ${details[1]}
            ` + (details.length < 3 ? '' : details[2])) + `
          Took ${getTimeDiff(time)} seconds to complete.`;
}

String.prototype.transformIntoPath = function() {
  return this.replace(/[^nesw]/gi, '').toUpperCase();
}
//EOR

//BOR Classes
class PokeWorld {
  constructor () {
    this._curCoords = {
      x:0,
      y:0
    };
    this._map = new Set(['0,0']);
  }

  get map () { return Array.from(this._map) }
  get pos () { return this._curCoordsStr() }

  // operations
  move (dir) {
    this._curCoords = this._shift(dir);
    return this._curCoordsStr();
  }

  discovered (dir) {
    let shiftedCds = this._shift(dir);
    return this._map.has(`${shiftedCds.x},${shiftedCds.y}`);
  }

  discover (dir) {
    this._map.add(this.move(dir));
  }

  undiscoveredPositions (dir, shiftNum) {
    return this._operateDir(dir, shiftNum, this._curCoords, this._loopCdsFuncs(this._undiscLoop));
  }

  multiDiscovery (dir, shiftNum, positionsToDiscover = []) {
    if(positionsToDiscover.length) {
      for(let pos of positionsToDiscover) {
        this._map.add(pos);
      }
    } else {
      this._operateDir(dir, shiftNum, this._curCoords, this._loopCdsFuncs(this._discLoop));
    }
    if(dir.length === 1) {
      this._curCoords = this._shift(dir, shiftNum);
    } else { // diagonal directions
      this._curCoords = this._shift(dir[0], shiftNum / 2);
      this._curCoords = this._shift(dir[1], shiftNum / 2);
    }
    return this._curCoordsStr();
  }

  // aux
  _curCoordsStr (){
    return `${this._curCoords.x},${this._curCoords.y}`;
  }

  _loopCdsFuncs (callback) {
    return {
        w: (x, y, n) => {
          return callback(this._map, {x: x, xs: -1, y: y, ys: 0}, n);
        },
        n: (x, y, n) => {
          return callback(this._map, {x: x, xs: 0, y: y, ys: 1}, n);
        },
        e: (x, y, n) => {
          return callback(this._map, {x: x, xs: 1, y: y, ys: 0}, n);
        },
        s: (x, y, n) => {
          return callback(this._map, {x: x, xs: 0, y: y, ys: -1}, n);
        },
        wn: (x, y, n) => {
          return callback(this._map, {x: x, xs: -1, y: y, ys: 1}, n/2,
                                     {x: x, xs: -1, y: y - 1,ys: 1});
        },
        ws: (x, y, n) => {
          return callback(this._map, {x: x, xs: -1, y: y, ys: -1}, n/2,
                                     {x: x, xs: -1, y: y + 1, ys: -1});
        },
        nw: (x, y, n) => {
          return callback(this._map, {x: x, xs: -1, y: y, ys: 1}, n/2,
                                     {x: x + 1, xs: -1, y: y, ys: 1});
        },
        ne: (x, y, n) => {
          return callback(this._map, {x: x, xs: 1, y: y, ys: 1}, n/2,
                                     {x: x - 1, xs: 1, y: y, ys: 1});
        },
        sw: (x, y, n) => {
          return callback(this._map, {x: x, xs: -1, y: y, ys: -1}, n/2,
                                     {x: x + 1, xs: -1, y: y, ys: -1});
        },
        se: (x, y, n) => {
          return callback(this._map, {x: x, xs: 1, y: y, ys: -1}, n/2,
                                     {x: x - 1, xs: 1, y: y, ys: -1});
        },
        en: (x, y, n) => {
          return callback(this._map, {x: x, xs: 1, y: y, ys: 1}, n/2,
                                     {x: x, xs: 1, y: y - 1, ys: 1});
        },
        es: (x, y, n) => {
          return callback(this._map, {x: x, xs: 1, y: y, ys: -1}, n/2,
                                     {x: x, xs: 1, y: y + 1, ys: -1});
        }
      }
  }

  _discLoop (wmap, cds, len, extraCds) {
    if(extraCds == undefined) {
      for (let i = len; i >= 0; i--) {
        wmap.add(`${cds.x + cds.xs * i},${cds.y + cds.ys * i}`);
      }
    } else {
      for (let i = len; i > 0; i--) {
        wmap.add(`${cds.x + cds.xs * i},${cds.y + cds.ys * i}`);
        wmap.add(`${extraCds.x + extraCds.xs * i},${extraCds.y + extraCds.ys * i}`);
      }
    }
  }

  _undiscLoop (wmap, cds, len, extraCds) {
    let undiscoveredPosArr = [];
    if(extraCds == undefined) {
      for (let i = len; i >= 0; i--) {
        let pos = `${cds.x + cds.xs * i},${cds.y + cds.ys * i}`;
        if(!wmap.has(pos)) {
          undiscoveredPosArr.push(pos);
        }
      }
    } else {
      for (let i = len; i > 0; i--) {
        let pos = `${cds.x + cds.xs * i},${cds.y + cds.ys * i}`;
        if(!wmap.has(pos)) {
          undiscoveredPosArr.push(pos);
        }
        pos = `${extraCds.x + extraCds.xs * i},${extraCds.y + extraCds.ys * i}`;
        if(!wmap.has(pos)) {
          undiscoveredPosArr.push(pos);
        }
      }
    }
    return undiscoveredPosArr;
  }

  _shift (dir, num = 1) {
    return this._operateDir(dir, num,
      {x: this._curCoords.x, y: this._curCoords.y},
      {
        w: (x, y, n) => ({x: x - n, y: y}),
        n: (x, y, n) => ({x: x,     y: y + n}),
        s: (x, y, n) => ({x: x,     y: y - n}),
        e: (x, y, n) => ({x: x + n, y: y})
      }
    );
  }

  _operateDir(dir, num, coords, op) {
    return op[dir.toLowerCase()](coords.x, coords.y, num);
  }
}

class Exploration {
  constructor (initPath = '') {
    this._path = initPath;
    this._poke = 1;
    this._world = new PokeWorld;
  }

  get path () { return this._path }
  get poke () { return this._poke }
  get map () { return this._world.map }
  get pos () { return this._world.pos }

  // operations
  explore (dir) {
    if(this._world.discovered(dir)) {
      this._world.move(dir);
    } else {
      this._world.discover(dir);
      this._catch();
    }
    this._path += dir;
  }

  pathExplore (pathStr, isEntirePath = true) {
    if(isEntirePath) {
      this._path = pathStr;
    }
    if(this._isUniDir(pathStr)) {
      if(isEntirePath) {
        this._catchInAll(pathStr);
        this._world.multiDiscovery(pathStr[0], pathStr.length);
      } else {
        let undPos = this._catchIfUndiscovered(pathStr[0], pathStr.length);
        this._world.multiDiscovery(pathStr[0], pathStr.length, undPos);
      }
    } else if(this._isDiagDir(pathStr)) {
      if(isEntirePath) {
        this._catchInAll(pathStr);
        this._world.multiDiscovery(pathStr.substr(0,2), pathStr.length);
      } else {
        let undPos = this._catchIfUndiscovered(pathStr.substr(0,2), pathStr.length);
        this._world.multiDiscovery(pathStr.substr(0,2), pathStr.length, undPos);
      }
    } else if(this._isBiDir(pathStr)) {
      let moves = this._catchInOneDir(pathStr);
      this._world.multiDiscovery(moves.dir1, moves.numInDir1);
      this._world.multiDiscovery(moves.dir2, moves.numInDir2);
    } else {
      let uniPaths = this._splitDirs(pathStr);
      for(let uniP of uniPaths) {
        this.pathExplore(uniP, false);
      }
    }
  }

  _isUniDir (pathStr) {
    return /^(W+|N+|E+|S+)$/i.test(pathStr);
  }

  _isBiDir (pathStr) {
    return /^(N+S+|E+W+|S+N+|W+E+)$/i.test(pathStr);
  }

  _isDiagDir (pathStr) {
    return /^((WN)+|(WS)+|(NW)+|(NE)+|(SW)+|(SE)+|(EN)+|(ES)+)$/i.test(pathStr);
  }

  _splitDirs (pathStr) {
    return pathStr.match(/(WN)+|(WS)+|(NW)+|(NE)+|(SW)+|(SE)+|(EN)+|(ES)+|W+|N+|E+|S+/gi);
  }

  _catch () {
    ++this._poke;
  }

  _catchInAll (pathStr) {
    this._poke += pathStr.length;
  }

  _catchInOneDir (pathStr) {
    let dir1 = pathStr[0];
    let dir2;
    switch(dir1) {
      case 'W':
        dir2 = 'N';
        break;
      case 'N':
        dir2 = 'S';
        break;
      case 'E':
        dir2 = 'W';
        break;
      case 'S':
        dir2 = 'N';
        break;
    }
    let numInDir1 = pathStr.indexOf(dir2);
    let numInDir2 = pathStr.length - numInDir1;
    this._poke += numInDir1 > numInDir2 ? numInDir1 : numInDir2;
    return {dir1, numInDir1, dir2, numInDir2};
  }

  _catchIfUndiscovered (dir, shiftNum) {
    let undPos = this._world.undiscoveredPositions(dir, shiftNum);
    this._poke += undPos.length;
    return undPos;
  }

  reset () {
    this._path = '';
    this._poke = 1;
    delete this._world;
    this._world = new PokeWorld;
  }
}
//EOR

//BOR Tests
function test_ew(exp) {
  prepAndExec((mul) => {
    exp.reset();
    let stTime = getTimeDiff();
    let iterVal = 1000 * mul;
    let expectedPoke = iterVal + 1;
    let expectedMoves = iterVal * 2;
    let logTxt;
    if(isSuperMove()) {
      exp.pathExplore('E'.repeat(iterVal) + 'W'.repeat(iterVal))
      logTxt = getLogText('ew', stTime, expectedPoke, expectedMoves);
    } else {
      for (let i = iterVal - 1; i >= 0; i--) {
        exp.explore('E');
      }
      let eastTxt = `${getTimeDiff(stTime)} seconds to go.
      `;
      let wStTime = getTimeDiff();
      for (let i = iterVal - 1; i >= 0; i--) {
        exp.explore('W');
      }
      logTxt = getLogText('ew', stTime, expectedPoke, expectedMoves,
        eastTxt + `${getTimeDiff(wStTime)} seconds to come back.
        `);
    }
    updateDOMElements(exp.path, exp.poke, exp.pos, logTxt);
  });
}

function test_n(exp) {
  prepAndExec((mul) => {
    exp.reset();
    let stTime = getTimeDiff();
    let iterVal = 1000 * mul;
    let expectedPoke = iterVal + 1;
    let expectedMoves = iterVal;
    if(isSuperMove()) {
      exp.pathExplore('N'.repeat(iterVal))
    } else {
      for (let i = iterVal - 1; i >= 0; i--) {
        exp.explore('N');
      }
    }
    updateDOMElements(exp.path, exp.poke, exp.pos,
      getLogText('n', stTime, expectedPoke, expectedMoves));
  });
}

function test_nesw(exp) {
  prepAndExec((mul) => {
    exp.reset();
    let stTime = getTimeDiff();
    let iterVal = 1000 * mul;
    let expectedPoke = iterVal * 4;
    let expectedMoves = iterVal * 4;
    let logTxt;
    if(isSuperMove()) {
      exp.pathExplore('N'.repeat(iterVal) + 'E'.repeat(iterVal) +
        'S'.repeat(iterVal) + 'W'.repeat(iterVal));
      logTxt = getLogText('ew', stTime, expectedPoke, expectedMoves);
    } else {
      for (let i = iterVal - 1; i >= 0; i--) {
        exp.explore('N');
      }
      let subPathsTxt = `${getTimeDiff(stTime)} seconds moving North.
      `;
      let subPathStTime = getTimeDiff();
      for (let i = iterVal - 1; i >= 0; i--) {
        exp.explore('E');
      }
      subPathsTxt += `${getTimeDiff(subPathStTime)} seconds moving East.
      `;
      subPathStTime = getTimeDiff();
      for (let i = iterVal - 1; i >= 0; i--) {
        exp.explore('S');
      }
      subPathsTxt += `${getTimeDiff(subPathStTime)} seconds moving South.
      `;
      subPathStTime = getTimeDiff();
      for (let i = iterVal - 1; i >= 0; i--) {
        exp.explore('W');
      }
      logTxt = getLogText('nesw', stTime, expectedPoke, expectedMoves,
        subPathsTxt + `${getTimeDiff(subPathStTime)} seconds moving West.
        `);
    }
    updateDOMElements(exp.path, exp.poke, exp.pos, logTxt);
  });
}

function test_dsw(exp) {
  prepAndExec((mul) => {
    exp.reset();
    let stTime = getTimeDiff();
    let iterVal = 1000 * mul;
    let expectedPoke = iterVal + 1;
    let expectedMoves = iterVal;
    if(isSuperMove()) {
      exp.pathExplore('SW'.repeat(iterVal / 2));
    } else {
      for (let i = iterVal / 2 - 1; i >= 0; i--) {
        exp.explore('S');
        exp.explore('W');
      }
    }
    updateDOMElements(exp.path, exp.poke, exp.pos,
      getLogText('dsw', stTime, expectedPoke, expectedMoves));
  });
}

function test_dnesdwn(exp) {
  prepAndExec((mul) => {
    exp.reset();
    let stTime = getTimeDiff();
    let iterVal = 1000 * mul;
    let expectedPoke = iterVal * 3;
    let expectedMoves = iterVal * 3;
    let logTxt;
    if(isSuperMove()) {
      exp.pathExplore('NE'.repeat(iterVal / 2) + 'S'.repeat(iterVal) +
        'WN'.repeat(iterVal / 2));
      logTxt = getLogText('dnesdwn', stTime, expectedPoke, expectedMoves);
    } else {
      for (let i = iterVal / 2 - 1; i >= 0; i--) {
        exp.explore('N');
        exp.explore('E');
      }
      let subPathsTxt = `${getTimeDiff(stTime)} seconds moving North-East.
      `;
      let subPathStTime = getTimeDiff();
      for (let i = iterVal - 1; i >= 0; i--) {
        exp.explore('S');
      }
      subPathsTxt += `${getTimeDiff(subPathStTime)} seconds moving South.
      `;
      subPathStTime = getTimeDiff();
      for (let i = iterVal / 2 - 1; i >= 0; i--) {
        exp.explore('W');
        exp.explore('N');
      }
      logTxt = getLogText('dnesdwn', stTime, expectedPoke, expectedMoves,
        subPathsTxt + `${getTimeDiff(subPathStTime)} seconds moving North-West.
        `);
    }
    updateDOMElements(exp.path, exp.poke, exp.pos, logTxt);
  });
}

function test_2ndwsdse(exp) {
  prepAndExec((mul) => {
    exp.reset();
    let stTime = getTimeDiff();
    let iterVal = 1000 * mul;
    let expectedPoke = iterVal * (2 + 1 + 1);
    let expectedMoves = iterVal * (2 + 1 + 1);
    let logTxt;
    if(isSuperMove()) {
      exp.pathExplore('N'.repeat(iterVal * 2) + 'WS'.repeat(iterVal / 2) +
        'SE'.repeat(iterVal / 2));
      logTxt = getLogText('2ndwsdse', stTime, expectedPoke, expectedMoves);
    } else {
      for (let i = iterVal * 2 - 1; i >= 0; i--) {
        exp.explore('N');
      }
      let subPathsTxt = `${getTimeDiff(stTime)} seconds moving double-length North.
      `;
      let subPathStTime = getTimeDiff();
      for (let i = iterVal / 2 - 1; i >= 0; i--) {
        exp.explore('W');
        exp.explore('S');
      }
      subPathsTxt += `${getTimeDiff(subPathStTime)} seconds moving South-West.
      `;
      subPathStTime = getTimeDiff();
      for (let i = iterVal / 2 - 1; i >= 0; i--) {
        exp.explore('S');
        exp.explore('E');
      }
      logTxt = getLogText('2ndwsdse', stTime, expectedPoke, expectedMoves,
        subPathsTxt + `${getTimeDiff(subPathStTime)} seconds moving South-East.
        `);
    }
    updateDOMElements(exp.path, exp.poke, exp.pos, logTxt);
  });
}

function test_senw2senw(exp) {
  prepAndExec((mul) => {
    exp.reset();
    let stTime = getTimeDiff();
    let iterVal = 1000 * mul;
    let expectedPoke = iterVal * (1 * 2 + 2 * 4) - 1;
    let expectedMoves = iterVal * (4 + 2 * 4);
    let logTxt;
    if(isSuperMove()) {
      exp.pathExplore('S'.repeat(iterVal) + 'E'.repeat(iterVal) +
        'N'.repeat(iterVal) + 'W'.repeat(iterVal) +
        'S'.repeat(iterVal * 2) + 'E'.repeat(iterVal * 2) +
        'N'.repeat(iterVal * 2) + 'W'.repeat(iterVal * 2));
      logTxt = getLogText('senw2senw', stTime, expectedPoke, expectedMoves);
    } else {
      for (let i = iterVal - 1; i >= 0; i--) {
        exp.explore('S');
      }
      let subPathsTxt = `${getTimeDiff(stTime)} seconds moving South.
      `;
      let subPathStTime = getTimeDiff();
      for (let i = iterVal - 1; i >= 0; i--) {
        exp.explore('E');
      }
      subPathsTxt += `${getTimeDiff(subPathStTime)} seconds moving East.
      `;
      subPathStTime = getTimeDiff();
      for (let i = iterVal - 1; i >= 0; i--) {
        exp.explore('N');
      }
      subPathsTxt += `${getTimeDiff(subPathStTime)} seconds moving North.
      `;
      subPathStTime = getTimeDiff();
      for (let i = iterVal - 1; i >= 0; i--) {
        exp.explore('W');
      }
      subPathsTxt += `${getTimeDiff(subPathStTime)} seconds moving West.
      `;
      subPathStTime = getTimeDiff();
      for (let i = iterVal * 2 - 1; i >= 0; i--) {
        exp.explore('S');
      }
      subPathsTxt += `${getTimeDiff(subPathStTime)} seconds moving double-length South.
      `;
      subPathStTime = getTimeDiff();
      for (let i = iterVal * 2 - 1; i >= 0; i--) {
        exp.explore('E');
      }
      subPathsTxt += `${getTimeDiff(subPathStTime)} seconds moving double-length East.
      `;
      subPathStTime = getTimeDiff();
      for (let i = iterVal * 2 - 1; i >= 0; i--) {
        exp.explore('N');
      }
      subPathsTxt += `${getTimeDiff(subPathStTime)} seconds moving double-length North.
      `;
      subPathStTime = getTimeDiff();
      for (let i = iterVal * 2 - 1; i >= 0; i--) {
        exp.explore('W');
      }
      logTxt = getLogText('senw2senw', stTime, expectedPoke, expectedMoves,
        subPathsTxt + `${getTimeDiff(subPathStTime)} seconds moving double-length West.
        `);
    }
    updateDOMElements(exp.path, exp.poke, exp.pos, logTxt);
  });
}

function test_custom(exp) {
  prepAndExec(() => {
    exp.reset();
    let stTime = getTimeDiff();
    let pathStr = getEl('auto-path').value.transformIntoPath();
    if(isSuperMove()) {
      exp.pathExplore(pathStr);
    } else {
      for(let dir of pathStr){
        exp.explore(dir);
      }
    }
    updateDOMElements(exp.path, exp.poke, exp.pos, getLogText('custom', stTime));
  });
}
//EOR

//BOR on ready
document.addEventListener('DOMContentLoaded', () => {
  let uIn = getEl('direction-letter');
  let exp = new Exploration;

  setUpDOMMap();

  uIn.onkeyup = (e) => {
    uIn.value = '';
    let dir = keyTranslate(e.keyCode ? e.keyCode : e.which);
    if(dir.length) {
      uIn.value = dir;
      exp.explore(dir);
      updateDOMElements(exp.path, exp.poke, exp.pos);
    }
  };

  getEl('reset-exploration').addEventListener('click', () => {
    exp.reset();
    resetDOMExploration();
  });

  getEl('copy-exploration').addEventListener('click', () => {
    let expPath = getElsByClass('poke-path__str')[0].textContent;
    getEl('auto-path').value = /^[nesw]+$/i.test(expPath) ? expPath : '';
  });

  // automatic tests
  getEl('auto-path').value = ''; // clean the input textarea
  getEl('test-ew').addEventListener('click', () => {test_ew(exp);});
  getEl('test-n').addEventListener('click', () => {test_n(exp);});
  getEl('test-nesw').addEventListener('click', () => {test_nesw(exp);});
  getEl('test-dsw').addEventListener('click', () => {test_dsw(exp);});
  getEl('test-dnesdwn').addEventListener('click', () => {test_dnesdwn(exp);});
  getEl('test-2ndwsdse').addEventListener('click', () => {test_2ndwsdse(exp);});
  getEl('test-senw2senw').addEventListener('click', () => {test_senw2senw(exp);});
  getEl('test-custom').addEventListener('click', () => {test_custom(exp);});
});
//EOR
