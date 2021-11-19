function gridDiagram(data) {




    // data = data.nodes.filter(d => d.category == 'location')
    // numCols = Math.ceil(Math.sqrt(data.length))

    svgContainer.selectAll("circle")
        .data(data, d => d.id)
        .enter()
        .append("circle")
        .attr("id", d => `planet-${d.id}`)
        .attr('cx', (d, i) => x(i % numCols))
        .attr('cy', (d, i) => y(Math.floor(i / numCols)))
        .attr('r', d => d.radius)
        .style('stroke', 'white')
        .style('stroke-width', 0)
        .style('fill', d => colours(planetNumber(d.name)))
        .attr('data-tippy-content', (d, i) => {
            return `${d.name}`
        })
        .on('mouseover', function () {
            d3.select(this)
                .style("cursor", "pointer")
                .raise()
                .transition()
                .duration(100)
                .attr('r', d => d.radius * 1.2)
        })
        .on('mouseout', function () {
            d3.select(this)
                .lower()
                .transition()
                .duration(200)
                .attr('r', d => d.radius)
        })

        // ADD Tooltips
    let circles = d3.selectAll("circle")

    tippy(circles.nodes(), {
        inertia: true,
        animateFill: true,
        offset: [0, 20]
    })
}