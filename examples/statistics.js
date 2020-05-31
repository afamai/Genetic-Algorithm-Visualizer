var chart = null;
var data = [];
var config = {
    type: 'line',
    data: {
        labels: [0]
    },
    options: {
        responsive: true,
        scales: {
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: "Generation"
                }
            }],
            yAxes: [{
                scaleLabel: {
                    display: true, 
                    labelString: "Fitness"
                },
                ticks: {
                    beginAtZero: true
                }
            }]
        }
    }
};

function updateStatistics(population, generation) {
    // get the best genome and calculate the average fitness
    let totalFitness = 0;
    let bestFitness = population[0].getFitness();
    population.forEach(function(genome) {
        totalFitness += genome.getFitness();
        if (genome.getFitness() > bestFitness) {
            bestFitness = genome.getFitness();
        }
    })

    let averageFitness = totalFitness / population.length;

    // update the text for current generation
    $("#current-stat").html("Generation: " + generation + "<br>Best Fitness: " + bestFitness + "<br>Average Fitness: " + averageFitness);
    // update the label if current generation is greater than the chart labels
    if (config.data.labels.slice(-1) < generation){
        config.data.labels.push(generation);
    }

    let datasets = config.data.datasets;
    // if generation == 1 then start a new run
    if (generation == 1) {
        let runNum = datasets.length / 2 + 1;
        datasets.push({
            label: "Run " + runNum + " Best",
            data: [0, bestFitness],
            borderColor: "rgba(255,159,64,1)",
            borderWidth: 1,
            fill: false
        }) 

        datasets.push({
            label: "Run " + runNum + " Average",
            data: [0, averageFitness],
            borderColor: "rgba(255,159,64,0.5)",
            borderWidth: 1,
            fill: false
        }) 
    }
    else {
        // append the data to the current run
        currentRunBest = datasets[datasets.length - 2];
        currentRunAverage = datasets[datasets.length - 1];
        currentRunBest.data.push(bestFitness);
        currentRunAverage.data.push(averageFitness);
    }

    // update the chart
    chart.update();
}

$(document).ready(function() {
    var ctx = $("#chart");
    chart = new Chart(ctx, config);
});