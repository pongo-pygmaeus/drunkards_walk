$(document).ready(function() {
  function WalkManager() {
    var wm = this;
    wm.walks = [];
    wm.boxesOn = true;

    windowWidth = window.innerWidth
      || document.documentElement.clientWidth
      || document.body.clientWidth;

    windowHeight = (window.innerHeight
      || document.documentElement.innerHeight
      || document.body.innerHeight);

    walkspaceWidth = 0.99 * windowWidth

    walkspaceHeight = 0.6 * windowHeight
    graphHeight = 0.3 * windowHeight

    wm.gridSize = 4 ;

    clickOffset = $("#header-div").height();

    wm.canvas = d3.select("#vis-div").append("svg:svg")
      .attr("width", walkspaceWidth)
      .attr("height", walkspaceHeight)
      .attr("id","vis-svg");

    wm.graphs = d3.select("#data-div").append("svg:svg")
      .attr("width", walkspaceWidth)
      .attr("height", graphHeight)
      .attr("id","data-svg");

    wm.defaultPalette = [
      '#fff7f3',
      '#fde0dd',
      '#fcc5c0',
      '#fa9fb5',
      '#f768a1',
      '#dd3497',
      '#ae017e',
      '#7a0177',
      '#49006a'].reverse();

    wm.buildWalk = function(startPosition) {
      var args = {
        startPosition: startPosition,
        palette: wm.defaultPalette,
        gridSize: wm.gridSize,
        canvas: wm.canvas,
        walkId: wm.walks.length,
        reportMove: wm.reportMove,
        boxesOn: wm.boxesOn
      };

      var walk = new Walk(args);
      wm.walks.push(walk);
      return walk;
    }

    $('#vis-div').click(function(e) {
      var x = e.pageX - (e.pageX % wm.gridSize)
      var y = (e.pageY - clickOffset) - ((e.pageY - clickOffset) % wm.gridSize)

      var clickedWalk = wm.walks.find(function(walk){
        //console.log("Checking Walk " + walk.walkId)
        return walk.isPointInBox({x: e.pageX, y: e.pageY - 40})
      })

      if (!(y < walkspaceHeight)) {
        y = walkspaceHeight - (walkspaceHeight % wm.gridSize)
      }

      if (!clickedWalk) {
        wm.buildWalk({
          x: x,
          y: y
        }).move();
      }
    })

    $("#vis-svg").on("mousedown", function(e) {
      //console.log("x " + e.pageX)
      //console.log("y " + (e.pageY))

      var clickedWalk = wm.walks.find(function(walk){
        //console.log("Checking Walk " + walk.walkId)
        return walk.isPointInBox({x: e.pageX, y: e.pageY - clickOffset})
      })

      if (clickedWalk) {
        //console.log("Clicked walk " + clickedWalk.walkId)
        wm.walks.filter(walk => walk.walkId != clickedWalk.walkId)
                .map( walk => walk.setBoxHighlighted(false))
        clickedWalk.toggleBoxHighlighted()
      }
    })


    $('#toggle-box-button').click(function(e) {
      e.preventDefault();
      wm.boxesOn = !wm.boxesOn;
      wm.walks.map( walk => walk.setBoxVisible(wm.boxesOn));
    })

    $(window).resize(function(){
      walkspaceWidth = window.innerWidth
        || document.documentElement.clientWidth
        || document.body.clientWidth;

      windowHeight = (window.innerHeight
        || document.documentElement.innerHeight
        || document.body.innerHeight);

      walkspaceHeight = 0.6 * windowHeight
      graphHeight = 0.3 * windowHeight
      clickOffset = $("#header-div").height();

      $('#vis-svg').width(walkspaceWidth)
      $('#data-svg').width(walkspaceWidth)
    })

    $('#clear-canvas-button').click(function(e) {
      e.preventDefault();
      // THIS IS PROBABLY NOT EFFICIENT. CHANGE LATER.
      wm.walks.map(walk => walk.clear());
      wm.walks = [];
    })
  }

  function Walk(args = {}) {
    var walk = this;

    var defaultPalette = [
      '#fff7f3',
      '#fde0dd',
      '#fcc5c0',
      '#fa9fb5',
      '#f768a1',
      '#dd3497',
      '#ae017e',
      '#7a0177',
      '#49006a'].reverse();

    walk.palette = args.palette || defaultPalette;
    walk.gridSize = args.gridSize || 10;
    walk.canvas = args.canvas;
    walk.walkId = args.walkId;
    walk.boxId = "walk-" + walk.walkId + "-box" || "walk-0-box";
    walk.spanId = "walk-" + walk.walkId + "-span" || "walk-0-span";
    walk.boxVisible = args.boxesOn || false;
    walk.steps = 0;
    walk.distanceFromStart = 0.0;
    walk.distanceDictionary = {};
    walk.boxHighlight = false;
    walk.elementClass = "walk-" + walk.walkId + "-class"
    walk.moving = true;

    walk.clear = function() {
      walk.moving = false;
      walk.canvas.selectAll('.'+ walk.elementClass).remove();
    }

    walk.generateRandomStart = function() {
      var x0 = Math.floor(walkspaceWidth * Math.random());
      x0 = x0 - (x0 % walk.gridSize);
      var y0 = Math.floor(walkspaceHeight * Math.random());
      y0 = y0 - (y0 % walk.gridSize);
      return {x: x0, y: y0};
    }

    walk.startPosition = args.startPosition || walk.generateRandomStart();

    walk.currentPosition = {
      x: walk.startPosition.x, 
      y: walk.startPosition.y
    };

    walk.lastPosition = {
      x: walk.startPosition.x, 
      y: walk.startPosition.y
    };

    walk.boxCoordinates = {
      p0: {
        x: walk.currentPosition.x, 
        y: walk.currentPosition.y
      }, 
      p1: {
        x: walk.currentPosition.x, 
        y: walk.currentPosition.y
      }
    }

    walk.setBoxVisible = function(visible) {
      walk.boxVisible = visible;
    }

    walk.toggleBoxHighlighted = function() {
      walk.boxHighlighted = !walk.boxHighlighted;
      console.log(walk.boxHighlighted)
    }

    walk.setBoxHighlighted = function(highlighted) {
      walk.boxHighlighted = highlighted;
    }

    walk.isPointInBox = function(point) {

      //console.log("Min X = " + walk.boxCoordinates.p0.x)
      //console.log("Max X = " + walk.boxCoordinates.p1.x)
      //console.log("Min Y = " + walk.boxCoordinates.p0.y)
      //console.log("Max Y = " + walk.boxCoordinates.p1.y)

      if (point.x > walk.boxCoordinates.p0.x && 
          point.x < walk.boxCoordinates.p1.x &&
          point.y > walk.boxCoordinates.p0.y &&
          point.y < walk.boxCoordinates.p1.y)  {
        return true;
      } else {
        return false;
      }
    }

    walk.updateBoxData = function() {
      if (walk.currentPosition.x > walk.boxCoordinates.p1.x) {
        walk.boxCoordinates.p1.x = walk.currentPosition.x;
      }
      if (walk.currentPosition.x < walk.boxCoordinates.p0.x) {
        walk.boxCoordinates.p0.x = walk.currentPosition.x;
      }
      if (walk.currentPosition.y > walk.boxCoordinates.p1.y) {
        walk.boxCoordinates.p1.y = walk.currentPosition.y;
      }
      if (walk.currentPosition.y < walk.boxCoordinates.p0.y) {
        walk.boxCoordinates.p0.y = walk.currentPosition.y;
      }
    } 

    walk.generateNextMove = function(currentValue, maxSize)  {
      var randProb = Math.random();
      var newMove = currentValue;
      // var jump = Math.floor((Math.random() * 5))
      var jump = 1;

      if (Math.random() < randProb) {
        if ((currentValue + (walk.gridSize * jump)) < (maxSize - 20)) {
          newMove = currentValue + (walk.gridSize * jump);
        } else {
          newMove = currentValue - (walk.gridSize * jump);
        }
      } else {
        if ((currentValue - (walk.gridSize * jump)) >= 17) {
          newMove = currentValue - (walk.gridSize * jump);
        } else {
          newMove = currentValue + (walk.gridSize * jump);
        }
      }
      return newMove
    }

    walk.calculateDistanceFromStart = function(){
      xDiff = walk.currentPosition.x - walk.startPosition.x;
      yDiff = walk.currentPosition.y - walk.startPosition.y;
      return Math.sqrt((xDiff * xDiff) + (yDiff * yDiff));
    }

    walk.updateWalkData = function() {
      var x = walk.currentPosition.x;
      var y = walk.currentPosition.y;
      var xEnd = walk.currentPosition.x;
      var yEnd = walk.currentPosition.y;

      var xOrY = Math.random();

      if (Math.random() < xOrY) {
        xEnd = walk.generateNextMove(x, walkspaceWidth);
      } else {
        yEnd = walk.generateNextMove(y, walkspaceHeight);
      }

      walk.lastPosition.x = walk.currentPosition.x;
      walk.lastPosition.y = walk.currentPosition.y;

      walk.currentPosition.x = xEnd;
      walk.currentPosition.y = yEnd;

      walk.updateBoxData();
      walk.steps += 1;

      var distanceFromStart = walk.calculateDistanceFromStart();
      var roundedDistanceFromStart = Math.floor(distanceFromStart);

      if (walk.distanceDictionary[roundedDistanceFromStart]) {
        walk.distanceDictionary[roundedDistanceFromStart] += 1;
      } else {
        walk.distanceDictionary[roundedDistanceFromStart] = 1;
      }
    }

    walk.drawMove = function() {
      var x = walk.lastPosition.x;
      var y = walk.lastPosition.y;
      var xEnd = walk.currentPosition.x;
      var yEnd = walk.currentPosition.y;

      var lineId = "line-" + x + "-" + y + "-" + xEnd + "-" + yEnd;

      line = walk.canvas.select("#"+lineId);

      if (line.empty()) {
        walk.canvas.append("svg:line")
          .attr("x1", x)
          .attr("y1", y)
          .attr("x2", xEnd)
          .attr("y2", yEnd)
          .style("stroke", walk.palette[0])
          .style("stroke-width", 2)
          .attr("id", lineId)
          .attr("class", walk.elementClass)
          .datum(0);
      } else {
        var colorIdx = Math.min(line.datum() + 1, walk.palette.length - 1);
        line.style('stroke', walk.palette[colorIdx]).datum(colorIdx);
      }

      walk.canvas.selectAll('#'+walk.boxId).remove();
      walk.canvas.select('#' + walk.boxId + "-label").remove();
      walk.canvas.select('#' + walk.spanId).remove();

      if(walk.boxVisible) { 
        var strokeWidth = 2;
        var strokeOpacity = 0.3;

        if (walk.boxHighlighted) {
          strokeOpacity = 0.7;
          strokeWidth = 3;

          walk.canvas.append("text")
            .attr("id", walk.spanId)
            .style("stroke", "#fcc5c0")
            .style("fill", "#fcc5c0")
            .style("font-family", "Montserrat")
            .attr("x", walk.boxCoordinates.p1.x - 8)
            .attr("y", walk.boxCoordinates.p1.y - 8)
            .attr("text-anchor", "end")
            .attr("class", "walk-box-label " + walk.elementClass)
            .text(walk.steps);
        }

        var box = walk.canvas.append("svg:rect")
          .attr("x", walk.boxCoordinates.p0.x)
          .attr("y", walk.boxCoordinates.p0.y)
          .attr("width", walk.boxCoordinates.p1.x - walk.boxCoordinates.p0.x)
          .attr("height", walk.boxCoordinates.p1.y - walk.boxCoordinates.p0.y)
          .style("fill", "rgb(0,0,0)")
          .style("fill-opacity", 0.0)
          .style("stroke-width", strokeWidth)
          .style("stroke", "rgb(255,255,255)")
          .style("stroke-opacity",strokeOpacity)
          .attr("id", walk.boxId)
          .attr("class", "walk-box-label " + walk.elementClass)

        walk.canvas.append("text")
          .attr("id", walk.boxId + "-label")
          .style("stroke", "#fcc5c0")
          .style("fill", "#fcc5c0")
          .style("font-family", "Montserrat")
          .attr("x", walk.boxCoordinates.p0.x + 6)
          .attr("y", walk.boxCoordinates.p0.y + 18)
          .text(walk.walkId)
          .attr("class", "walk-box-label " + walk.elementClass)
      }
    }

    walk.move = function() {
      if(walk.moving) {
        walk.updateWalkData();
        walk.drawMove();
        window.setTimeout(function() {
          walk.move();
        }, 0);
      }
    }
  }

  var walkManager = new WalkManager();
})