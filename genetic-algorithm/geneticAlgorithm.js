function randomResetting(genome, mutationRate) {
    genome.forEach(function(gene) {
        if (Math.random() < mutationRate) {
            gene.randomize();
        }
    })
}

function singlePointCrossover(parent1, parent2, crossoverRate) {
    if (Math.random() < crossoverRate) {        
        let index = Math.floor(Math.random() * parent1.length);
        return parent1.slice(0, index).concat(parent2.slice(index));
    }
    return parent1;
}

// generate a list of parents for producing off-springs
function rankSelection(population, amount) {
    population.sort(function(a, b) {
        return (a.fitness > b.fitness) ? 1 : -1;
    })
    return population.slice(0, amount);
}

function TOS(population, amount, k) {
    let selection = [];
    for (var i = 0; i < amount; i++) {
        // shuffle the population
        let shuffle = population.sort(() => 0.5 - Math.random());
        // select the best individual
        selection.push(shuffle.slice(0, k).sort((a, b) => a.getFitness() > b.getFitness() ? -1 : 1)[0]);
    }
    return selection;
}

function RWS(population, amount) {
    let totalFitness = population.reduce((acc, cv) => acc + cv.getFitness(), 0);
    let selection = [];
    for (var i = 0; i < amount; i++) {
        let point = Math.random() * totalFitness;
        let sum = 0
        for (var j = 0; j < population.length; j++) {
            sum += population[j].getFitness();
            if (point < sum) {
                selection.push(population[j]);
                break;
            }
        }
    }
    return selection;
}

function Test(n) {
    this.a = n;
    this.getFitness = function() {
        return this.a;
    }
}

var x = [];
for (var i = 0; i < 10; i++) {
    x.push(new Test(Math.floor(Math.random() * 100)));
}

function SUS(population, amount) {
    let totalFitness = population.reduce((acc, cv) => acc + cv.getFitness(), 0);
    let delta = totalFitness / amount;
    let point = Math.random() * delta;
    let selection = [];
    
    let sum = population[0].getFitness();
    for (var i = 0; i < amount; i++) {
        for (var j = 1; j < population.length; j++) {
            if (point < sum) {
                selection.push(population[j-1]);
                point += delta;
                break;
            }
            sum += population[i].getFitness();
        }
    }

    return selection;
}