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


function rankSelection(population, amount) {
    population.sort(function(a, b) {
        return (a.fitness > b.fitness) ? 1 : -1;
    })
    return population.slice(0, amount);
}