function WalkManager() {
  this.walks = [];
  this.walkspaceWidth = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;

  this.walkspaceHeight = window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight;

  this.gridSize = 4 ;

  $("body").append("<div id=data-div></div>")

  this.canvas = d3.select("body").append("svg:svg")
    .attr("width", this.walkspaceWidth)
    .attr("height", this.walkspaceHeight);

  this.defaultPalette = ['#fff7f3','#fde0dd','#fcc5c0','#fa9fb5','#f768a1','#dd3497','#ae017e','#7a0177','#49006a'].reverse();

  // this.generateRandomPalette = function() {
  //   return (new ColorScheme).from_hue(Math.ceil(Math.random()*30))
  //     .scheme('triade')   
  //     .variation('soft')
  //     .colors()
  //     .reverse()
  // }

  var wm = this
  $(document).ready(function (e) {
    $('body').click(function(e) {
      wm.buildWalk({
        x: e.pageX - (e.pageX % wm.gridSize),
        y: e.pageY - (e.pageY % wm.gridSize)
      }).move()
    })
  })  

  this.buildWalk = function(startPosition) {
    var args = {
      startPosition: startPosition,
      palette: this.defaultPalette,
      gridSize: this.gridSize,
      canvas: this.canvas,
      walkspaceWidth: this.walkspaceWidth,
      walkspaceHeight: this.walkspaceHeight,
      walkId: this.walks.length,
      reportMove: this.reportMove
    }

    var walk = new Walk(args)
    this.walks.push(walk)
    return walk
  }
}

function Walk(args = {}) {
  this.palette = args.palette || ['#fff7f3','#fde0dd','#fcc5c0','#fa9fb5','#f768a1','#dd3497','#ae017e','#7a0177','#49006a'].reverse();
  this.gridSize = args.gridSize || 10;
  this.canvas = args.canvas;
  this.walkspaceWidth = args.walkspaceWidth || 200;
  this.walkspaceHeight = args.walkspaceHeight || 200;
  this.walkId = args.walkId
  this.boxId = "walk-" + this.walkId + "-box" || "walk-0-box"
  this.spanId = "walk-" + this.walkId + "-span" || "walk-0-span"
  
  this.steps = 0

  this.canvas.append("text")
    .attr("id", this.spanId)
    .style("stroke","#fcc5c0")
    .style("fill","#fcc5c0")
    .style("font-family","Montserrat")
    .attr("x",50)
    .attr("y",50 + 20 * this.walkId)

  this.canvas.append("text")
    .attr("id", this.boxId + "-label")
    .style("stroke","#fcc5c0")
    .style("fill","#fcc5c0")
    .style("font-family","Montserrat")

  // $("#data-div").append("<span id=" + this.spanId + "/><br>")
  // this.span = $("#" + this.spanId)
  // this.span.css("color","#fcc5c0").css("font-family","Montserrat")

  this.generateRandomStart = function() {
    var x0 = Math.floor(this.walkspaceWidth * Math.random())
    x0 = x0 - (x0 % this.gridSize)
    var y0 = Math.floor(this.walkspaceHeight * Math.random())
    y0 = y0 - (y0 % this.gridSize)
    return {x: x0, y: y0}
  }

  this.startPosition = args.startPosition || this.generateRandomStart();

  this.currentPosition = this.startPosition;
  this.boxCoordinates = {
    p0: {
      x: this.currentPosition.x, 
      y: this.currentPosition.y
    }, 
    p1: {
      x: this.currentPosition.x, 
      y: this.currentPosition.y
    } 
  }

  this.isPointInBox = function(point) {
    if (point.x > this.box.p0.x && 
        point.x < this.box.p1.x &&
        point.y > this.box.p0.y &&
        point.y < this.box.p1.y)  {
      return true
    } else {
      return false
    }
  }

  this.updateBox = function() {
    if (this.currentPosition.x > this.boxCoordinates.p1.x) {
      this.boxCoordinates.p1.x = this.currentPosition.x
    }
    if (this.currentPosition.x < this.boxCoordinates.p0.x) {
      this.boxCoordinates.p0.x = this.currentPosition.x
    }
    if (this.currentPosition.y > this.boxCoordinates.p1.y) {
      this.boxCoordinates.p1.y = this.currentPosition.y
    }
    if (this.currentPosition.y < this.boxCoordinates.p0.y) {
      this.boxCoordinates.p0.y = this.currentPosition.y
    }
  } 

  this.move = function() {
    var walk = this;
    var x = walk.currentPosition.x
    var y = walk.currentPosition.y
    var x_end = walk.currentPosition.x
    var y_end = walk.currentPosition.y;

    var generateNextMove = function(currentValue, maxSize)  {
      var randProb = Math.random()
      var newMove = currentValue

      // var jump = Math.floor((Math.random() * 5))
      var jump = 1

      if (Math.random() < randProb) {
        if ((currentValue + (walk.gridSize * jump)) < maxSize) {
          newMove = currentValue + (walk.gridSize * jump)
        } else {
          newMove = currentValue - (walk.gridSize * jump)
        }
      } else {
        if ((currentValue - (walk.gridSize * jump)) >= 0) {
          newMove = currentValue - (walk.gridSize * jump)
        } else {
          newMove = currentValue + (walk.gridSize * jump);
        }
      }
      return newMove
    }

    var xOrY = Math.random()

    if (Math.random() < xOrY) {
      x_end = generateNextMove(x, this.walkspaceWidth)
    } else {
      y_end = generateNextMove(y, this.walkspaceHeight)
    }

    line = walk.canvas.select('line[x1="' + x + '"][x2="' + x_end + '"]'+
                      '[y1="' + y + '"][y2="' + y_end + '"]');
    if (line.empty()) {
      walk.canvas.append("svg:line")
        .attr("x1", x)
        .attr("y1", y)
        .attr("x2", x_end)
        .attr("y2", y_end)
        .style("stroke", walk.palette[0])
        .style("stroke-width", 2)
        .datum(0);
    } else {
      var color_idx = Math.min(line.datum() + 1, walk.palette.length - 1);
      line.style('stroke', walk.palette[color_idx])
        .datum(color_idx)
    }

    walk.currentPosition.x = x_end
    walk.currentPosition.y = y_end

    this.updateBox()

    walk.canvas.selectAll('#'+this.boxId).remove()

    var box = walk.canvas.append("svg:rect")
      .attr("x",this.boxCoordinates.p0.x)
      .attr("y",this.boxCoordinates.p0.y)
      .attr("width", this.boxCoordinates.p1.x - this.boxCoordinates.p0.x)
      .attr("height", this.boxCoordinates.p1.y - this.boxCoordinates.p0.y)
      .style("fill","rgb(0,0,0)")
      .style("fill-opacity",0.0)
      .style("stroke-width",2)
      .style("stroke","rgb(255,255,255)")
      .style("stroke-opacity",0.4)
      .attr("id", this.boxId)

    this.steps += 1

    walk.canvas.select('#' + this.boxId + "-label")
      .attr("x",this.boxCoordinates.p0.x - 10)
      .attr("y",this.boxCoordinates.p0.y - 5)
      .style("stroke","#fcc5c0")
      .style("fill","#fcc5c0")
      .style("font-family","Montserrat")
      .text(this.walkId)

    walk.canvas.select('#' + this.spanId)
      .text("walk " + this.walkId + " steps = " + this.steps)

    window.setTimeout(function() {
      walk.move();
    }, 0);
  }
}

var walkManager = new WalkManager()