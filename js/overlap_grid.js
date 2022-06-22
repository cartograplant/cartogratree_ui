/**
 * Initial code developed by Jahmad Attucks
 * Adjusted for dynamic purposed by Risharde Ramnath
 */



function create_filter_grid(container_id, data, width = 75, height = 75, row_label_width=120, total=10000, text_size=12) {
  // This will create the SVG element which is basically the foundation 
  // of the widget

  // Cater for reloading new data into 
  if(d3.select(container_id).select('svg') != undefined) {
    d3.select(container_id).html("");
  }

  // Calculate svg_width and svg_height based on values initialized
  var svg_width = 0;
  var svg_height =0;
  var data_count = data.length;

  svg_width = row_label_width + (data_count * width) + 5;
  svg_height = text_size + (3 * height) + 5;

  var svg = create_filter_grid_svg_element(container_id, svg_width, svg_height);
  var g = create_filter_grid_g_element(container_id);
  create_filter_grid_process_data(container_id, data, 0, width, height, row_label_width, total, text_size);
  create_filter_grid_add_results_container(container_id);
  
}


function create_filter_grid_add_results_container(container_id) {
  d3.select(container_id).append('div').attr('class', 'results');
}

function create_filter_grid_process_results(container_id) {
  var overlap_all_selected = d3.selectAll(container_id + ' .overlap_all[is_selected="true"]');
  var overlap_some_selected = d3.selectAll(container_id + ' .overlap_some[is_selected="true"]');
  var overlap_none_selected = d3.selectAll(container_id + ' .overlap_none[is_selected="true"]');

  var html = "";
  overlap_all_selected.each(function (p,j) {
    html += "Selected " + d3.select(this).attr("col_val") + " with " + d3.select(this).attr("value") + " overlaps over all studies<br />";
  });
  overlap_some_selected.each(function (p,j) {
    html += "Selected " + d3.select(this).attr("col_val") + " with " + d3.select(this).attr("value") + " overlaps over some studies<br />";
  });
  overlap_none_selected.each(function (p,j) {
    html += "Selected " + d3.select(this).attr("col_val") + " with " + d3.select(this).attr("value") + " overlaps over no studies<br />";
  }); 
  
  d3.selectAll(container_id + ' .results').html(html);
  
}

function create_filter_grid_process_data(container_id, data, x = 0, width = 75, height = 75, row_label_width=120, total=10000, text_size=12) {
  var g = d3.select(container_id).select('svg').select('g');

  // var height = 75; // this will be overriden as necessary 
  var count_label_color = "black";
  var current_x = row_label_width + x;
  var current_y = 0;


  // Let's create vertical text labels for each column first
  for (var j=0; j<data.length; j++) {
    var study_name = data[j]['study_name'];

    var study_name_text_element = d3.select(container_id).select('svg').select('g')
      .append('text')
      .attr("class",'col_label')
      .style("font-size", text_size + "px")
      .attr("x", current_x)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", text_size)      
      .attr("dy", "1em")
      .attr("dx", "0.75em")
      .attr("fill", "black")
      .text(study_name)

    current_x = current_x + width;
  }


  // Reset current_x to begin working on row labels which start at position left 0 (which is x assuming it is 0)
  current_x = x;
  current_y = text_size + 5; // this would be whatever the size of the previous text size was


  // Generate the row texts
    // Let's create text labels for each column first
  var rows_labels = [
    'Overlaps all',
    'Overlaps some',
    'Overlaps none'
  ]
  for (var j=0; j<rows_labels.length; j++) {
    var row_label = rows_labels[j];

    var row_text_element = d3.select(container_id).select('svg').select('g')
      .append('text')
      .attr("class", 'row_label')
      .style("font-size", text_size + "px")
      .attr("x", 0)
      .attr("y", current_y)
      .attr("width", width)
      .attr("height", text_size)      
      .attr("dy", "3em")
      .attr("dx", "0.75em")
      .attr("fill", "black")
      .text(row_label)
  
    current_y = current_y + height;
  }

  // Reset current_x to begin working on rectangles
  current_x = row_label_width;
  current_y = text_size + 5; // this would be whatever the size of the previous text size was

  // BEGIN WORKING ON THE RECTANGES TOP DOWN (overlap_all, some, none) AND THEN MOVE TO RIGHT
  for (var j=0;j<data.length; j++) {
    console.log(j, data[j]);
    var study_name = data[j]['study_name'];
    var item = [];
    item.push(data[j]);

    //console.log('dataj', data3[j]);

    // Calculate a height (as a percentage)
    // height = Math.ceil((item[0]['overlap_all'] / total) * 100);
    // GENERATE overlap_all box (rect)
    var dynamic_rect = d3.select(container_id).select("svg")
      .select("g")
      //.attr('transform', "translate(0,0)")
      .append("rect")
      .attr("class", "overlap_all")
      .attr("is_selected", "false")
      .attr("value", item[0]['overlap_all'])
      .attr("col_val", study_name)
      //.data(item)
      .attr("x", current_x)
      .attr("y", current_y)
      .attr("width", width)
      .attr("height", height)
      .attr("stroke", "black")
      .attr("stroke-width", "0.5px")
      //.attr("fill", "#c8ff91")
      .on("click", function() {
        if(d3.select(this).attr("is_selected") == "false") {
          d3.selectAll(container_id + ' .overlap_all').attr("is_selected", "true")
        }
        else {
          d3.selectAll(container_id + ' .overlap_all').attr("is_selected", "false")
        }
        create_filter_grid_process_results(container_id);
      })  

      // Add a text with the count
      d3.select(container_id).select("svg")
      .select("g")
      .append('text')
      .text(item[0]['overlap_all'])
      .attr("text-anchor", "middle")
      .attr("transform", "translate(" + width/2 + "," + width/2+ ")")
      //.attr("dy", "3em")
      //.attr("dx", "3em")
      .attr("fill", count_label_color)
      .attr("x", current_x)
      .attr("y", current_y)
      .attr("width", width)
      .attr("height", height)        


    // GENERATE the overlap_some box (rect)
    current_y = current_y + height;
    // Calculate a height (as a percentage)
    // height = Math.ceil((item[0]['overlap_some'] / total) * 100);
    var dynamic_rect = d3.select(container_id).select("svg")
      .select("g")
      //.attr('transform', "translate(0,0)")
      .append("rect")
      .attr("class", "overlap_some")
      .attr("is_selected", "false")
      .attr("value", item[0]['overlap_some'])
      .attr("col_val", study_name)
      //.data(item)
      .attr("x", current_x)
      .attr("y", current_y)
      .attr("width", width)
      .attr("height", height)
      .attr("stroke", "black")
      .attr("stroke-width", "0.5px")
      //.attr("fill", "#fff091")
      .on("click", function() {
        if(d3.select(this).attr("is_selected") == "false") {
          d3.select(this).attr("is_selected", "true")
        }
        else {
          d3.select(this).attr("is_selected", "false")
        }
        create_filter_grid_process_results(container_id)
      })       

      // Add a text with the count
      d3.select(container_id).select("svg")
      .select("g")
      .append('text')
      .text(item[0]['overlap_some'])
      .attr("text-anchor", "middle")
      .attr("transform", "translate(" + width/2 + "," + width/2+ ")")      
      // .attr("dy", "3em")
      // .attr("dx", "1.75em")
      .attr("fill", count_label_color)
      .attr("x", current_x)
      .attr("y", current_y)
      .attr("width", width)
      .attr("height", height)        

      
    // GENERATE the overlap_none box (rect)
    current_y = current_y + height;
    // Calculate a height (as a percentage)
    // height = Math.ceil((item[0]['overlap_none'] / total) * 100);
    var dynamic_rect = d3.select(container_id).select("svg")
      .select("g")
      //.attr('transform', "translate(0,0)")
      .append("rect")
      .attr("class", "overlap_none")
      .attr("is_selected", "false")
      .attr("value", item[0]['overlap_none'])
      .attr("col_val", study_name)
      //.data(item)
      .attr("x", current_x)
      .attr("y", current_y)
      .attr("width", width)
      .attr("height", height)
      .attr("stroke", "black")
      .attr("stroke-width", "0.5px")
      // .attr("fill", "#ff9a91")
      .on("click", function() {
        if(d3.select(this).attr("is_selected") == "false") {
          d3.select(this).attr("is_selected", "true")
        }
        else {
          d3.select(this).attr("is_selected", "false")
        }
        create_filter_grid_process_results(container_id)
      })      


      // Add a text with the count
      d3.select(container_id).select("svg")
      .select("g")
      .append('text')
      .text(item[0]['overlap_none'])
      .attr("text-anchor", "middle")
      .attr("transform", "translate(" + width/2 + "," + width/2+ ")")      
      // .attr("dy", "3em")
      // .attr("dx", "1.75em")
      .attr("fill", count_label_color)
      .attr("x", current_x)
      .attr("y", current_y)
      .attr("width", width)
      .attr("height", height)    


    // Make next rectangle appear to the right of this one (adjust the x value)
    // We can use the width of the current rectangle to add it to x to shift it
    // to the right
    current_x = current_x + width; 
    current_y = text_size + 5;
    
  }


}

function create_filter_grid_svg_element(container_id, width = 400, height = 400) {
  var svg = d3.select(container_id)
  .append("svg")
  .attr("width", width)
  .attr("height",height)
  return svg;
}

function create_filter_grid_g_element(container_id) {
  var g = d3.select(container_id).select('svg').append('g');
  return g;
}


function load_analysis_overlapping_genotypes_snp_grid_filter() {
  try {
    var svg = d3.select("#analysis-overlapping-genotypes-snp-grid-filter")
                .append("svg")
                .attr("width", 400)
                .attr("height",400)
                .style("font", "10px sans-serif")
                .append("g");


    var data3 = [
        {study_name: 'study1', overlap_all: 5, overlap_some: 25, overlap_none: 70, study_info: 'study 1 info'},
        {study_name: 'study2', overlap_all: 10, overlap_some: 35, overlap_none: 55, study_info: 'study 2 info'},
        {study_name: 'study3', overlap_all: 15, overlap_some: 45, overlap_none: 40, study_info: 'study 3 info'},
        {study_name: 'study4', overlap_all: 20, overlap_some: 65, overlap_none: 80, study_info: 'study 3 info'},
    ];

    for (var j=0;j<data3.length; j++) {
      console.log(j, data3[j]);
      var item = [];
      item.push(data3[j]);
      //console.log('Creating dynamic rect ' + j);
      //console.log(item);
      
      x_align = 0;
      
      var width = 75;
      //console.log('dataj', data3[j]);

      var dynamic_rect = d3.select("svg")
          .select("g")
          .attr('transform', "translate(0,0)")
          .attr("class", "test2")
        .append("rect");
          

      dynamic_rect
          .data(item)
          //.enter()
          .attr("transform", function(d) { 
            var x = (j * (width + 5));
            //console.log("x value: " + x);
            var y = 10;
            return "translate(" + x + "," + y + ")"; 
          })
          .attr("id", d => d.study_name)
          .attr("height", function(d) {
          // console.log(d);
          return d.overlap_all;
          //return d.study1; 
          
          })
          .attr("x", x_align) // pushing all rectangles to the right. for testing
          .attr("width", width)
          .attr("stroke", "black")
          .attr("stroke-width", "2px")
          .attr("fill", "green");

        var overlap_all_values = svg.selectAll(".test")
                  .data(item)
                  .enter() // used to get more than one data point
                  .append("text");
                  
      overlap_all_values.style("font-size", "16px")
        .attr("transform", function(d) { 
            
            var x = (j * (width + 5));
            //console.log("x value: " + x);
            var y = 10;
            return "translate(" + x + "," + y + ")"; 
          })// adjusting x adjusts the x spacing between each value
      .attr("x", x_align)
      //.attr("y", 50)
      .attr("fill", "orange")
      .attr("dy", ".35em")
      //.attr("transform", "translate(-10," + 20 + ")")
      .text(d => d.overlap_all);


      var dynamic_rect2 = d3.select("svg")
          .select("g")
          .attr('transform', "translate(0,0)")
        .append("rect");
          

      dynamic_rect2
          .data(item)
          .attr("transform", function(d) { 
            
            var x = (j * (width + 5));
            //console.log("x value: " + x);
            var y = 1;
            return "translate(" + x + "," + y + ")"; 
          })
          .attr("id", d => d.study_name)
          .attr("height", function(d) {
          // console.log(d);
          return d.overlap_some;
          //return d.study1; 
          
          })
          .attr("x", x_align)// pushing all rectangles to the right. for testing
          .attr("y", 50) 
          .attr("width", width)
          .attr("stroke", "black")
          .attr("stroke-width", "2px")
          .attr("fill", "yellow");


    var overlap_some_values = svg.selectAll(".test")
                  .data(item)
                  .enter() // used to get more than one data point
                  .append("text");
                  
      overlap_some_values.style("font-size", "16px")
        .attr("transform", function(d) { 
            var x = (j * (width + 5));
            //console.log("x value: " + x);
            var y = 10;
            return "translate(" + x + "," + y + ")"; 
          })// adjusting x adjusts the x spacing between each value
      .attr("x", x_align)
      .attr("y", 50)
      .attr("fill", "orange")
      .attr("dy", ".35em")
      //.attr("transform", "translate(-10," + 20 + ")")
      .text(d => d.overlap_some);



      var dynamic_rect3 = d3.select("svg")
        .select("g")
        .attr('transform', "translate(0,0)")
        .append("rect");

      dynamic_rect3
          .data(item)
          .attr("transform", function(d) { 
            var x = (j * (width + 5));
            //console.log("x value: " + x);
            var y = 1;
            return "translate(" + x + "," + y + ")"; 
          })
          .attr("id", d => d.study_name)
          .attr("height", function(d) {
            // console.log(d);
            return d.overlap_none;
            //return d.study1; 
          })
          .attr("x", x_align)
          .attr("y", 100) // pushing all rectangles to the right. for testing
          .attr("width", width)
          .attr("stroke", "black")
          .attr("stroke-width", "2px")
          .attr("fill", "red");
      



      var overlap_none_values = svg.selectAll(".test")
                  .data(item)
                  .enter() // used to get more than one data point
                  .append("text");
                  
      overlap_none_values.style("font-size", "16px")
        .attr("transform", function(d) { 
            
            var x = (j * (width + 5));
            //console.log("x value: " + x);
            var y = 10;
            return "translate(" + x + "," + y + ")"; 
          })// adjusting x adjusts the x spacing between each value
      .attr("x", x_align)
      .attr("y", 100)
      .attr("fill", "orange")
      .attr("dy", ".35em")
      //.attr("transform", "translate(-10," + 20 + ")")
      .text(d => d.overlap_none);
      
      
    }

    const subgraph = svg.append("g")
        .attr("id", "subgraph")
        .attr("transform", "translate(90," + 90 + ")");
        
    subgraph.append("text")
            .style("font-size", "16px")

    // Add the path using this helper function
    // svg.append('rect')
    //   .attr("id", "first")
    //   .attr('x', 10)
    //   .attr('y', 120)
    //   .attr('width', 100)
    //   .attr('height', 79)
    //   .attr('stroke', 'black')
    //   .attr('fill', '#39c757');
      
      
    // svg.append('rect')
    //   .attr("id", "second")
    //   .attr('x', 110)
    //   .attr('y', 120)
    //   .attr('width', 100)
    //   .attr('height', 79)
    //   .attr('stroke', 'black')
    //   .attr('fill', '#39c757');

    let clicked = false;

    d3.selectAll('rect')
      .on("click", function(){
          if(clicked == true){
              console.log("inside if");
              d3.select(this)
                .attr("fill", "#39c757");
                clicked = false;
          }
          else{
            d3.select(this)
              .attr("fill", "#198d31");
              console.log("clicked shape");
            clicked = true;
          }
      })// end of on click function
      .on("mouseover", function(){
          //d3.select(this);
          subgraph.selectAll("text")
                  .text("selected" + " "+  d3.select(this).attr("height"))
                  .attr("dy", 14)
                  .attr("dx", 14)
      })
      .on("mouseout", function(){
          subgraph.selectAll("text")
                  .text("")
                  .attr("dy", 14)
                  .attr("dx", 14)
      });
  }
  catch (err) {
    console.log(err);
  }
}