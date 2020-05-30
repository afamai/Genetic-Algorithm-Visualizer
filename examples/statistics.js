function updateStatistics(population, generation) {
    // get the best genome and calculate the average fitness
    let totalFitness = 0;
    let best = population[0];
    population.forEach(function(genome) {
        totalFitness += genome.getFitness();
        if (genome.getFitness() > best.getFitness) {
            best = genome;
        }
    })

    let averageFitness = totalFitness / population.length;
}