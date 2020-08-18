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

function updateStatistics(population, generation, nochart=false) {
    // get the best genome and calculate the average fitness
    let totalFitness = 0;
    let bestFitness = population[0].fitness;
    population.forEach(function(genome) {
        totalFitness += genome.fitness;
        if (genome.fitness > bestFitness) {
            bestFitness = genome.fitness;
        }
    })

    let averageFitness = totalFitness / population.length;

    // update the text for current generation
    $("#current-stat").html("Generation: " + generation + "<br>Best Fitness: " + bestFitness + "<br>Average Fitness: " + averageFitness);
    
    if (!nochart) {
        // update the label if current generation is greater than the chart labels
        if (config.data.labels.slice(-1) < generation){
            config.data.labels.push(generation);
        }
        let datasets = config.data.datasets;
        // NOTE: There is a bug here where it does not report the last generation results.
        // if generation == 1 then start a new run
        if (generation == 1) {
            // randomize a color
            let r = Math.random() * 255;
            let g = Math.random() * 255;
            let b = Math.random() * 255;
            let runNum = datasets.length / 2 + 1;
            datasets.push({
                label: "Run " + runNum + " Best",
                lineTension: 0,
                data: [0, bestFitness],
                borderColor: "rgb(" + r + "," + g + "," + b + ",1)",
                borderWidth: 1,
                fill: false
            }) 

            datasets.push({
                label: "Run " + runNum + " Average",
                lineTension: 0,
                data: [0, averageFitness],
                borderColor: "rgb(" + r + "," + g + "," + b + ",0.5)",
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
}

$(document).ready(function() {
    var ctx = $("#chart");
    chart = new Chart(ctx, config);
});