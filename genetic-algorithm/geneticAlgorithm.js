function randomResetting(genome, mutationRate) {
    genome.forEach(function(gene) {
        if (Math.random() < mutationRate) {
            gene.randomize();
        }
    })
}

function singlePointCrossover(parent1, parent2) {
    let index = Math.floor(Math.random() * parent1.length);
    return parent1.slice(0, index).concat(parent2.slice(index));
}

// generate a list of parents for producing off-springs
function rankSelection(population, amount) {
    population.sort(function(a, b) {
        return (a.fitness > b.fitness) ? 1 : -1;
    })
    return population.slice(0, amount);
}

function spinWheel(wheel) {
    let totalFitness = wheel.reduce((a, b) => a + b, 0);
    // generate random float to simulate the wheel spinning
    let num = Math.random() * totalFitness;
    let temp = 0;
    for(var i = 0; i < wheel.length; i++) {
        temp += wheel[i];
        if (temp > num) {
            return i;
        }
    };
}

function rouletteWheelSelection(population, amount) {
    // generate the wheel
    var wheel = population.map((genome) => genome.getFitness());

    // generate a list of parent pairs, where which pair will be used to produce 1 offspring
    var parents = [];
    for(var i = 0; i < amount; i++) {
        // pick the first parent
        var parent1 = spinWheel(wheel);

        // pick the second parent, and ensure that it is different from the first parent
        // NOTE: bad implementation, better solution is to do the crossover check here to avoid unnecessary loops
        do {
            parent2 = spinWheel(wheel);
            unique = parent1 != parent2;
        } while(!unique);

        // add pair
        parents.push({parentA: population[parent1], parentB: population[parent2]});
    }

    return parents;
}