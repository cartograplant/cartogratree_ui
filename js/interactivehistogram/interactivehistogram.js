/**
 * Coded by Jahmad Attucks, Joseph Wireman
 * Modified by Risharde Ramnath to work with CartograPlant UI
 * Requires D3multi module to use the v3 version of D3.js (DEPRECATED)
 * 
 * LIMITATIONS: This works only with a single instance.
 * 
 */

function interactive_histogram_create(container = "body", title = null, width_overall = 400, height_overall = 400, data_array = null) {
  var drag = d3m.v3.behavior.drag(),
  activeClassName = 'active-d3-item',
  // lowColor = "#4682B4", // original blue color
  // highColor = "#266091"; // original blue color (darker)
  lowColor = "#b3b4b5", // original blue color
  highColor = "#036e63"; // original blue color (darker)

  div = d3m.v3.select(container).append('div')
  

  //Generate random data for histogram
  // var randoNums = d3m.v3.range(5000).map(d3m.v3.random.normal());

  var randoNums = data_array;

  // console.log('randoNums', randoNums);

  //Margin convention: DON'T TOUCH
  var margin = {
    top: 40,
    right: 40,
    bottom: 40,
    left: 40
  },
  width = width_overall - margin.left - margin.right,
  height = height_overall - margin.top - margin.bottom;
  console.log(height);
  var svg = d3m.v3.select(container).append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Set title
  if(title == null) {
    title = "";
  }
  d3m.v3.select(container + " svg")
  .append("text").text(title)
  .attr({"x": width_overall / 2, "y": 20})
  .attr('text-anchor', 'middle');

  //Get max and min of data for X axis
  var max = d3m.v3.max(randoNums),
  min = d3m.v3.min(randoNums);

  //Set X axis scale
  var x = d3m.v3.scale.linear()
  .domain([min, max])
  .range([0, width]);


  //Make a histogram layout with 30 bins
  var data = d3m.v3.layout.histogram()
  .bins(x.ticks(20))
  (randoNums);
  //console.log(data);

  //Get max and min of histogram bins
  var yMax = d3m.v3.max(data, function(d) {
    return d.length
  }),
  yMin = d3m.v3.min(data, function(d) {
    return d.length
  });

  //Set Y axis scale
  var y = d3m.v3.scale.linear()
  .domain([0, yMax])
  .range([height, 0]);

  //Set color scale before threshold      
  var lowColorScale = d3m.v3.scale.linear()
  .domain([yMin, yMax])
  //.range([d3m.v3.rgb(lowColor).brighter(), d3m.v3.rgb(lowColor).darker()]); // gradient (original)
  .range([d3m.v3.rgb(lowColor), d3m.v3.rgb(lowColor)]);

  //Set color scale after threshold
  var highColorScale = d3m.v3.scale.linear()
  .domain([yMin, yMax])
  // .range([d3m.v3.rgb(highColor).brighter(), d3m.v3.rgb(highColor).darker()]); gradient (original)
  .range([d3m.v3.rgb(highColor), d3m.v3.rgb(highColor)]);
  //console.log(data.x)
  //Make the columns
  var column = svg.selectAll(".column")
  .data(data)
  .enter()
  .append("g")
  .attr("class", "column")
  .attr("transform", function(d) {
  //console.log(d.x)
    return "translate(" + x(d.x) + "," + y(d.y) + ")";
  });

  var columnHeight = function(d) {
    return height - y(d.y);
  }

  //Draw the columns
  column.append("rect")
  .attr("x", 0)
  .attr("width", (x(data[0].dx) - x(0)) - 0.5)
  .attr("height", columnHeight)
  .attr("fill", function(d) {
    return lowColorScale(d.y)
  })
  .style("stroke", function(d) {
    return highColorScale(d.y)
  })
  .style("stroke-width", "3px")



  //Data for the threshold line
  var thresholdOrigin = [{
    'x1': width, // 5
    'y1': -50, // -50
    'x2': width, // 5
    'y2': 425 // 425
  }];


  var thresholdOrigin2 = [{
    'x1': -10, // 5
    'y1': -50, // -50
    'x2': -10, // 5
    'y2': 425 // 425
  }];

  // Generate the svg lines attributes
  var lineAttributes = {
    'x1': function(d) {
    return d.x1;
    },
    'y1': function(d) {
    return d.y1;
    },
    'x2': function(d) {
    return d.x2;
    },
    'y2': function(d) {
    return d.y2;
    }
  };


  var lineAttributes2 = {
    'x1': function(d) {
    return d.x1;
    },
    'y1': function(d) {
    return d.y1;
    },
    'x2': function(d) {
    return d.x2;
    },
    'y2': function(d) {
    return d.y2;
    }
  };


  //Drag behavior for threshold line
  var drag = d3m.v3.behavior.drag()
  .origin(function(d) {
    return d;
  })
  .on('dragstart', null)
  .on('drag', null)
  .on('dragend', null)  
  .on('dragstart', dragstarted)
  .on('drag', dragged)
  .on('dragend', dragended);

  // created a new line for testing purpose with my line chart
  // since there is already a line
  var line1 = svg
  .data(thresholdOrigin)
  .append('line')
  .attr('class', 'line1')
  .attr(lineAttributes)
  .call(drag);


  var line2 = svg
  .data(thresholdOrigin2)
  .append('line')
  .attr('class', 'line2')
  .attr(lineAttributes2)
  .call(drag);

  // Pointer to the d3 lines
  //var lines = svg
  //.selectAll('line')
  //.data(thresholdOrigin)
  //.enter()
  //.append('line')
  //.attr(lineAttributes)
  //.call(drag);

  //Choose the column the threshold is over
  var thisColumn = d3m.v3.selectAll('rect')
  .filter(function(d, i) {
    if (x == line1.attr('x2')) {
      return d3m.v3.select(this).classed(chosenBar, true);
    }
  })

  // both of these var don't affect drag or higlighting
  // of bars if removed
  var thisBar = d3m.v3.selectAll(".chosenBar");
  // some kind of height fix for bars to sepearate them
  // instead of having them bunched up
  var thisBarHeight = columnHeight.thisBar;

  //Start drag function
  function dragstarted() {
    d3m.v3.select(this).classed(activeClassName, true);
  }

  //Drag function
  function dragged() {
    var lineScale = d3m.v3.scale.linear().domain([0, width]).range([min, max]);
    var linePosition = lineScale(line1.attr("x2")); // this checks the overlap
    var linePositionNoOverlap = lineScale(line2.attr("x2"));
    console.log('linePosition', linePosition);
    console.log('linePositionNoOverlap', linePositionNoOverlap);
    // console.log("this is x event" + " " + d3.event.dx)
    var x = d3.event.dx;// where error occurs
    var y = d3.event.dy;
    var line = d3m.v3.select(this);
    var formatter = d3m.v3.format(".1f");
    var scaledPosition = formatter(linePosition);
    var total = d3m.v3.sum(d3m.v3.selectAll("rect").attr("height"));

    // Update threshold line properties after drag event
    var attributes = {
      x1: parseInt(line.attr('x1')) + x,
      y1: parseInt(line.attr('y1')),

      x2: parseInt(line.attr('x2')) + x,
      y2: parseInt(line.attr('y2')),
    };

    line.attr(attributes);

    // This is for the line1 (which is the upper thresh line)
    d3m.v3.selectAll("rect")
    .attr("fill", function(d) {
      if (d.x < (linePosition) && d.x > linePositionNoOverlap) {
        return highColorScale(d.y);
      } else {
        return lowColorScale(d.y);
      }
    })
    .style("stroke", function(d) {
      if (d.x < linePosition && d.x > linePositionNoOverlap) {
        return lowColorScale(d.y);
      } else {
        return highColorScale(d.y)
      }
    })
    .style("stroke-width", "3px")
    // .attr("class", (function(d) {
    //   if (d.x <= linePosition) {
    //     return 'belowThreshold'
    //   }
    // })) //Every rect below threshold gets class belowThreshold




    //updateLegend()

    // var belows = d3m.v3.sum(d3m.v3.selectAll('.belowThreshold').attr("height"));
    // //moved var total up to line 156
    // var percentage = (total / belows) * 100 //will replace with d3.format if I ever get it working


    /*
    //updated legend
    function updateLegend() {
    d3.selectAll('.legendText').text("x: " + scaledPosition + " " + percentage + "%");
    legend.text('scaledPosition')
      .attr("class", "legendText, absolute");
    }
    */
  }



  //End drag function
  function dragended() {
    d3m.v3.select(this)
    .classed(activeClassName, false)
  };

  //Make x axis
  var xAxis = d3m.v3.svg.axis()
  .scale(x)
  .orient("bottom");

  //Draw x axis    
  svg.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + height + ")")
  .call(xAxis);

  //Make y axis
  var yAxis = d3m.v3.svg.axis()
  .scale(y)
  .orient("left");

  //Draw x axis    
  svg.append("g")
  .attr("class", "y axis")
  .attr("transform", "translate(0,0)")
  .call(yAxis);  

}// end of v3_code function