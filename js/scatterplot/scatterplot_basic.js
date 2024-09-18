var scatterplot_basic_container = "div"; // should always be a div
function scatterplot_basic_set_container(container) {
  if(container != undefined) {
    scatterplot_basic_container = container;
  }
  else {
    scatterplot_basic_container = 'body';
  }
}


function scatterplot_basic_create() {

    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 30, left: 60},
        width = 350 - margin.left - margin.right,
        height = 350 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select(scatterplot_basic_container)
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");


    // Create the x and y axis lines
    // Add X axis
    var x = d3.scaleLinear()
        .domain([0, 4000])
        .range([ 0, width ]);

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, 500000])
        .range([ height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append('g').attr('class','dots');

    //Read the data
    console.log('scatter_plot','reading CSV data');

    // It seems this reads per line in our D3 for some reason
    // as opposed to the example which using D3 v4. This is quite irritating.
    d3.csv("https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/2_TwoNum.csv", function(data) {
    // console.log('scatter_plot_basic_data', data);

    // Add dots
    
        svg.select(".dots").append('circle')
            .attr("cx", x(data.GrLivArea))
            .attr("cy", y(data.SalePrice))
            .attr("r", 1.5)
            .style("fill", "#69b3a2");


    })

}