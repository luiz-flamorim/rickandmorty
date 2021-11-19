yGrid = d3.scaleBand()
    .range([margin.bottom, height - margin.top])
    .domain(d3.range(numCols))

xGrid = d3.scaleBand()
    .range([margin.left, width - margin.right])
    .domain(d3.range(numCols))

svgContainer = svgGrid.append("g")
    .attr("transform", `translate(${xGrid.bandwidth()/2},${yGrid.bandwidth()/2})`);