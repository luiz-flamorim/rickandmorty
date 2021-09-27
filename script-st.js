var container = d3.select('#scroll');
var graphic = container.select('.scroll__graphic');
var chart = graphic.select('.chart');
var text = container.select('.scroll__text');
var step = text.selectAll('.step');

var scroller = scrollama();

function handleResize() {
	var stepHeight = Math.floor(window.innerHeight * 0.75);
	step.style('height', stepHeight + 'px');

	var bodyWidth = d3.select('body').node().offsetWidth;

	graphic
		.style('height', window.innerHeight + 'px');

	var chartMargin = 32;
	var textWidth = text.node().offsetWidth;
	var chartWidth = graphic.node().offsetWidth - textWidth - chartMargin;
	var chartHeight = Math.floor(window.innerHeight / 2);

	chart
		.style('width', chartWidth + 'px')
		.style('height', chartHeight + 'px');

	scroller.resize();
}

function handleStepEnter(response) {
    // response = { element, direction, index }

	step.classed('is-active', function (d, i) {
		return i === response.index;
	})
	var stepData = step.attr('data-step')
}

function handleContainerEnter(response) {
    // response = { direction }
	graphic.classed('is-fixed', true);
	graphic.classed('is-bottom', false);
}

function handleContainerExit(response) {
	graphic.classed('is-fixed', false);
	graphic.classed('is-bottom', response.direction === 'down');
}


// kick-off code to run once on load
function init() {
	handleResize();

	scroller
		.setup({
			container: '#scroll',
			graphic: '.scroll__graphic',
			text: '.scroll__text',
			step: '.scroll__text .step',
			offset: 0.5,
			debug: true,
		})
		.onStepEnter(handleStepEnter)
		.onContainerEnter(handleContainerEnter)
		.onContainerExit(handleContainerExit);

	// setup resize event
	window.addEventListener('resize', handleResize);
}

// start it up
init();