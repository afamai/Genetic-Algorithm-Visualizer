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