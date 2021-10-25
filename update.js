 function filterCharAndPlanets(name) {
     let filteredName = data.nodes.filter(d => d.name == name)
     data.nodes.forEach(item => {
         if (item.locationToId == filteredName[0].locationToId) {
             item.opacity = 1
         } else {
             item.opacity = 0.2
         }
     })
     let updatedNodes = data.nodes.filter(node => !removedNodes.has(node))
     let updatedLinks = data.links.filter(link => !removedLinks.has(link))

     // needs the update function(?)
     // update(updatedNodes, updatedLinks, 2)
 }

 function update(nodes, links, slideNumber) {



     if (slideNumber == 0 && xGraphPos.length == 0) {
         /*should test this -- if at the first slide, and there are no current graph positions(meaning page should have just been loaded) then get them from the simulation*/
         circles.data()
             .map((d, i) => {
                 xGraphPos[d.index] = d.x;
                 yGraphPos[d.index] = d.y;
                 return [];
             })
     }

     svgContainer.selectAll("circle")
         .data(nodes, d => d.id)
         .join(
             enter => enter.append("circle")
             .attr("id", d => `planet-${d.id}`)
             .attr('cx', (d, i) => {
                 switch (slideNumber) {
                     case 0:
                         positionX = d.category == 'location' ? width / 2 : d.x;
                         break;
                     case 1:
                         return xGrid(i % numCols);
                         break;
                     case 2:
                         positionX = xGraphPos[d.index]
                         break;
                 }
                 return positionX;

             })

             .attr('cy', (d, i) => {

                 switch (slideNumber) {
                     case 0:
                         positionY = d.category == 'location' ? height / 2 : d.y;
                         break;
                     case 1:
                         positionY = yGrid(Math.floor(i / numCols));
                         break;
                     case 2:
                         positionY = yGraphPos[d.index]
                         break;
                 }
                 return positionY;
             })

             .attr('r', d => d.radius)
             .style('stroke', 'white')
             .style('stroke-width', 0)
             .style('fill', d => colours(planetNumber(d.name)))

             .style("opacity", d => {
                 switch (slideNumber) {
                     case 0:
                         opacity = d.category == 'location' ? 1 : 0;
                         break;
                     case 1:
                         opacity = d.category == 'location' ? 1 : 0;
                         break;
                     case 2:
                         opacity = 1
                         break;
                 }
                 return opacity;

             }),
             update => update
             .transition()
             .duration(1000)
             .attr('cx', (d, i) => {
                 switch (slideNumber) {
                     case 0:
                         positionX = d.category == 'location' ? width / 2 : d.x;
                         break;
                     case 1:
                         positionX = xGrid(i % numCols);
                         break;
                     case 2:
                         positionX = xGraphPos[d.index]
                         break;
                 }
                 return positionX;

             })

             .attr('cy', (d, i) => {
                 switch (slideNumber) {
                     case 0:
                         positionY = d.category == 'location' ? height / 2 : d.y;
                         break;
                     case 1:
                         positionY = yGrid(Math.floor(i / numCols));
                         break;
                     case 2:
                         positionY = yGraphPos[d.index]
                         break;
                 }
                 return positionY;
             })

             .attr('r', d => d.radius)
             .style('fill', d => colours(planetNumber(d.name)))
             .style("opacity", d => {
                 switch (slideNumber) {
                     case 0:
                         opacity = d.category == 'location' ? 1 : 0;
                         break;
                     case 1:
                         opacity = d.category == 'location' ? 1 : 0;
                         break;
                     case 2:
                         opacity = 1
                         break;
                 }
                 return opacity;

             }),
             exit => exit.remove()

         )
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
         .call(d3.drag()
             .on("start", dragstarted)
             .on("drag", dragged)
             .on("end", dragended)),

         link = svgContainer.selectAll("line")
         .data(links, d => d.index)
         .join(
             enter => enter.append("line")
             .style("stroke-width", 1)
             .style("opacity", 1)
             .style('stroke', d => {
                 return d.source.category == 'location' ? colours(planetNumber(d.source.name)) : colours(planetNumber(d.source.location.name))
             })
             .attr("x1", d => d.source.x)
             .attr("y1", d => d.source.y)
             .attr("x2", d => d.target.x)
             .attr("y2", d => d.target.y),

             update => update.transition()
             .duration(1000)
             .style("stroke-width", 1)
             .style("opacity", slideNumber == 2 ? 1 : 0)
             .style('stroke', d => {
                 return d.source.category == 'location' ? colours(planetNumber(d.source.name)) : colours(planetNumber(d.source.location.name))
             }),

             exit => exit.remove()
         )

     if (slideNumber == 2) {
         simulation.restart()
     }

     function dragstarted(event, d) {
         if (!event.active) simulation.alphaTarget(0.3).restart()
         d.fx = d.x;
         d.fy = d.y;
     }

     function dragged(event, d) {
         d.fx = event.x;
         d.fy = event.y;
     }

     function dragended(event, d) {
         if (!event.active) simulation.alphaTarget(0)
         d.fx = null;
         d.fy = null;

         circles.data()
             .map((d, i) => {
                 xGraphPos[d.index] = d.x;
                 yGraphPos[d.index] = d.y;
                 return [];
             })
     }








     let circles = svgContainer.selectAll("circle")
     tippy(circles.nodes(), {
         inertia: true,
         animateFill: true,
         offset: [0, 20]
     })
 }