/**
 * Coded by Jahmad Attucks, Joseph Wireman
 * Modified by Risharde Ramnath to work with CartograPlant UI
 */

  interactive_histograms_selected_data = {} // key based on container

 function interactive_histogram_create_v5(container = "body", unique_id = null, title = null, width_overall = 400, height_overall = 400, data_array = null, data_keys = [], threshold_lines = true) {
    // console.log('d3',d3);
    var drag = d3.drag(),
    activeClassName = 'active-d3-item',
    // lowColor = "#4682B4", // original blue color
    // highColor = "#266091"; // original blue color (darker)
    lowColor = "#b3b4b5", // original blue color
    highColor = "#036e63"; // original blue color (darker)
  
    // div = d3.select(container).append('div')

    //Generate random data for histogram
    // var randoNums = d3.range(5000).map(d3.random.normal());
  
    var randoNums = [];
    for(var i=0; i<data_array.length; i++) {
      randoNums.push(parseFloat(data_array[i]['value']));
    }
  
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
    
    if(unique_id == null) {
      unique_id = "";
    }
    d3.select(container).attr('unique_id', unique_id);
    console.log('unique_id', unique_id);

    var svg = d3.select(container).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
    // Set title
    if(title == null) {
      title = "";
    }

  
    d3.select(container + " svg")
    .append("text").text(title)
    .attr("x", width_overall / 2)
    .attr("y", 20)
    .attr('text-anchor', 'middle');
  
    //Get max and min of data for X axis
    var max = d3.max(randoNums),
    min = d3.min(randoNums);
  
    //Set X axis scale
    var x = d3.scaleLinear()
    .domain([min, max])
    .range([0, width]);
  
  
    // Converted from v3 to v5 using https://stackoverflow.com/questions/47727746/d3-layout-histogram-and-attributes-dont-work-in-v4
    //Make a histogram layout with 30 bins
    var data = d3.histogram()
    .value(function (d) {
      // console.log(d);
      d.value = parseFloat(d.value);
      return d.value
    })    
    .thresholds(x.ticks(20))
    //(randoNums);
    (data_array)
    // console.log(data);
  
    //Get max and min of histogram bins
    var yMax = d3.max(data, function(d) {
      return d.length
    }),
    yMin = d3.min(data, function(d) {
      return d.length
    });
  
    //Set Y axis scale
    var y = d3.scaleLinear()
    .domain([0, yMax])
    .range([height, 0]);
  
    //Set color scale before threshold      
    var lowColorScale = d3.scaleLinear()
    .domain([yMin, yMax])
    //.range([d3.rgb(lowColor).brighter(), d3.rgb(lowColor).darker()]); // gradient (original)
    .range([d3.rgb(lowColor), d3.rgb(lowColor)]);
  
    //Set color scale after threshold
    var highColorScale = d3.scaleLinear()
    .domain([yMin, yMax])
    // .range([d3.rgb(highColor).brighter(), d3.rgb(highColor).darker()]); gradient (original)
    .range([d3.rgb(highColor), d3.rgb(highColor)]);
    //Make the columns
    var column = svg
    .selectAll(".column")
    .data(data)
    .enter()
    .append("g")
    .attr("class", "column")
    .attr("transform", function(d) {
      //console.log('d',d)
      // return "translate(" + x(d.x) + "," + y(d.y) + ")"; // v3
      return "translate(" + x(d.x0) + "," + y(d.length - 2) + ")";
    });
  
    var columnHeight = function(d) {
      // console.log('d', d);
      // return height - y(d.y); // v3
      return height - y(d.length - 2);
    }

  
    //Draw the columns (original)
    // column.append("rect")
    // .attr("x", 0)
    // //.attr("width", (x(data[0].dx) - x(0)) - 0.5) // v3
    // .attr("width", width / svg.selectAll(".column").size())
    // .attr("height", columnHeight)
    // .attr("plant_accessions")
    // .attr("fill", function(d) {
    //   return lowColorScale(d.length - 2)
    // })
    // .style("stroke", function(d) {
    //   return highColorScale(d.length - 2)
    // })
    // .style("stroke-width", "1px")
    // console.log('column', column);

    // This code will attach all the data values from data_keys
    // into the rectangles
    column.each(function() {
      var rect = d3.select(this).append("rect");
      // console.log('rect',rect);
      // console.log('data_keys', data_keys);
      // for all keys in data_array
      for(var j=0; j<data_keys.length; j++) {
        rect.attr(data_keys[j], function(d) {
          // console.log('d',d);
          var csv_string = "";
          for(var k=0; k<(d.length - 2); k++) {
            
            if(k > 0) {
              csv_string += ",";
            }
            csv_string += d[k][data_keys[j]];
          }
          return csv_string;
        });
      }
      rect.attr("x", 0)
      //.attr("width", (x(data[0].dx) - x(0)) - 0.5) // v3
      .attr("width", width / svg.selectAll(".column").size())
      .attr("height", columnHeight)
      .attr("fill", function(d) {
        return lowColorScale(d.length - 2)
      })
      .style("stroke", function(d) {
        return highColorScale(d.length - 2)
      })
      .style("stroke-width", "1px");
    });
  
  
  
    //Data for the threshold line
    var thresholdOrigin = [{
      'x1': 5, // 5
      'y1': -50, // -50
      'x2': 5, // 5
      'y2': 425 // 425
    }];
  
  
    var thresholdOrigin2 = [{
      'x1': -10, // 5
      'y1': -50, // -50
      'x2': -10, // 5
      'y2': 425 // 425
    }];
  
    //Drag behavior for threshold line
    // Upgraded origin with subject
    // https://stackoverflow.com/questions/38650637/how-to-set-the-origin-while-drag-in-d3-js-in-v4
    var drag = d3.drag()
    .subject(function(d) {
      // console.log('subject d',d);
      return d;
    })
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
    // console.log('drag',drag);
  
    // created a new line for testing purpose with my line chart
    // since there is already a line
    
    var line1 = svg
    .data(thresholdOrigin)
    .append('line')
    .on("mouseover", function() {
      d3.select(this).style('cursor','col-resize');
    })
    .on("mouseout", function() {
      d3.select(this).style('cursor','initial');
    })
    .attr('class', 'line1')
    .attr('x1',function(d){return d.x1;})
    .attr('x2',function(d){return d.x2;})
    .attr('y1',function(d){return d.y1;})
    .attr('y2',function(d){return d.y2;})
    .call(drag);
  
  
    var line2 = svg
    .data(thresholdOrigin2)
    .append('line')
    .on("mouseover", function() {
      d3.select(this).style('cursor','col-resize');
    })
    .on("mouseout", function() {
      d3.select(this).style('cursor','initial');
    })
    .attr('class', 'line2')
    .attr('x1',function(d){return d.x1;})
    .attr('x2',function(d){return d.x2;})
    .attr('y1',function(d){return d.y1;})
    .attr('y2',function(d){return d.y2;})
    .call(drag);
    
  
    if(threshold_lines == false) {
      line1.style('display','none');
      line2.style('display','none');
    }
    // Pointer to the d3 lines
    //var lines = svg
    //.selectAll('line')
    //.data(thresholdOrigin)
    //.enter()
    //.append('line')
    //.attr(lineAttributes)
    //.call(drag);
  
    //Choose the column the threshold is over
    var thisColumn = d3.selectAll(container + ' svg rect')
    .filter(function(d, i) {
      if (x == line1.attr('x2')) {
        return d3.select(this).classed(chosenBar, true);
      }
    })
  
    // both of these var don't affect drag or higlighting
    // of bars if removed
    var thisBar = d3.selectAll(container + " svg .chosenBar");
    // some kind of height fix for bars to sepearate them
    // instead of having them bunched up
    var thisBarHeight = columnHeight.thisBar;
  
    //Start drag function
    function dragstarted() {
      d3.select(this).classed(activeClassName, true);
    }
  
    //Drag function
    function dragged() {
      var lineScale = d3.scaleLinear().domain([0, width]).range([min, max]);
      var linePosition = lineScale(line1.attr("x2")); // this checks the overlap
      var linePositionNoOverlap = lineScale(line2.attr("x2"));
      console.log('linePosition', linePosition);
      console.log('linePositionNoOverlap', linePositionNoOverlap);
      // console.log("this is x event" + " " + d3.event.dx)
      var x = d3.event.dx;// where error occurs
      var y = d3.event.dy;
      var line = d3.select(this);
      var formatter = d3.format(".1f");
      var scaledPosition = formatter(linePosition);
      var total = d3.sum(d3.selectAll(container + " svg rect").attr("height"));
  
      // Update threshold line properties after drag event
      line.attr("x1", parseInt(line.attr('x1')) + x);
      line.attr("y1", parseInt(line.attr('y1')));
      line.attr("x2", parseInt(line.attr('x2')) + x);
      line.attr("y2", parseInt(line.attr('y2')));
  


      var all_rects = d3.selectAll(container + " svg rect");
      // go through each histogram bar/rectangle
      all_rects.each(function (d) {
        // console.log('d', d);
        var rect = d3.select(this);
        //console.log('rect', rect);

        if (linePositionNoOverlap <= linePosition) {
          // If rect x0 is more than left line && If rect x0 is less than right line 
          if(d.x1 > linePositionNoOverlap && d.x0 < linePosition) {
            rect.attr('fill', highColorScale(d.length - 2));
            rect.style('stroke', lowColorScale(d.length - 2));
            rect.attr('selected', 'true');
          }
          // If rect is less than left line && rect is less than right line
          else if(d.x0 < linePositionNoOverlap && d.x0 < linePosition) {
            rect.attr('fill', lowColorScale(d.length -2));
            rect.style('stroke', highColorScale(d.length - 2));
            rect.attr('selected', 'false');
          }
          // If rect is more than left line && rect is more than right line
          else if(d.x0 > linePositionNoOverlap && d.x0 > linePosition) {
            rect.attr('fill', lowColorScale(d.length -2));
            rect.style('stroke', highColorScale(d.length - 2));
            rect.attr('selected', 'false');
          }
        }
        else {
          // lines are flipped, so we need to do inversion
          if(d.x0 < linePositionNoOverlap && d.x0 <= linePosition) {
            rect.attr('fill', highColorScale(d.length - 2));
            rect.style('stroke', lowColorScale(d.length - 2));
            rect.attr('selected', 'true');            
          }
          else if (d.x0 > linePositionNoOverlap && d.x0 > linePosition) {
            rect.attr('fill', highColorScale(d.length - 2));
            rect.style('stroke', lowColorScale(d.length - 2));
            rect.attr('selected', 'true');                 
          }
          else if (d.x0 < linePositionNoOverlap && d.x0 > linePosition) {
            rect.attr('fill', lowColorScale(d.length -2));
            rect.style('stroke', highColorScale(d.length - 2));
            rect.attr('selected', 'false');            
          }
        }
      });

      // This is for the line1 (which is the upper thresh line)
      // d3.selectAll(container + " svg rect")
      // .attr('selected', function(d) {
      //   if (d.x0 > linePositionNoOverlap && d.x0 < linePosition ) {
      //     //return highColorScale(d.y); // v3
      //     return "true"
      //   } else {
      //     // return lowColorScale(d.y); // v3
      //     return "false"
      //   }        
      // })
      // .attr("fill", function(d) {
      //   // console.log('fill d', d);
      //   if (d.x0 > linePositionNoOverlap && d.x0 < linePosition) {
      //     //return highColorScale(d.y); // v3
      //     return highColorScale(d.length - 2);
      //   } 
      //   else if (d.x0 > linePositionNoOverlap && d.x0 > linePosition) {

      //   }
      //   else if (d.x0 < linePositionNoOverlap && d.x0 > linePosition) {
      //     // return lowColorScale(d.y); // v3
      //     return lowColorScale(d.length - 2);
      //   }
      // })
      // .style("stroke", function(d) {
      //   if (d.x0 > linePositionNoOverlap && d.x0 < linePosition) {
      //     // return lowColorScale(d.y); // v3
      //     return lowColorScale(d.length - 2);
      //   } 
      //   else if (d.x0 < linePositionNoOverlap && d.x0 > linePosition) {
      //     // return highColorScale(d.y); // v3
      //     return highColorScale(d.length - 2);
      //   }
      // })
      // .style("stroke-width", "1px")

  
    }
  
  
  
    //End drag function
    function dragended() {
      d3.select(this)
      .classed(activeClassName, false)

      // Get all selected rects from this histogram
      interactive_histograms_selected_data[unique_id] = [];
      var rects = d3.selectAll(container + ' svg rect');
      rects.each(function (d) {
        var rect = d3.select(this);
        if(rect.attr('selected') == 'true') {
          var object = {};
          for(var i=0; i<data_keys.length;i++) {
            object[data_keys[i]] = rect.attr(data_keys[i]);
          }
          interactive_histograms_selected_data[unique_id].push(object);
        }
      });
      console.log('interactive_histogram_selected_data for container ' + container + ' with unique_id: ' + unique_id + ' is:', interactive_histograms_selected_data[unique_id]);
      // interactive_histogram_data object
    };
  
    //Make x axis
    var xAxis = d3.axisBottom()
    .scale(x)
    //.orient("bottom");
  
    //Draw x axis    
    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);
  
    //Make y axis
    var yAxis = d3.axisLeft()
    .scale(y)
    //.orient("left");
  
    //Draw x axis    
    svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(0,0)")
    .call(yAxis);  
  
  }// end of v3_code function