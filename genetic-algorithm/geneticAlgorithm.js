// Standard Normal variate using Box-Muller transform.
function randn_bm() {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

// guassian mutation
function gaussianMutation(genome, mutationRate, min=0, max=1) {
    for (let i = 0; i < genome.length; i++) {
        if (Math.random() < mutationRate) {
            genome[i] += randn_bm() * 0.1;
            if (genome[i] > max)
                genome[i] = max;

            if (genome[i] < min)
                genome[i] = min;
        }
    }
}

// uniform mutation
function uniformMutation(genome, mutationRate, min=0, max=1) {
    for (let i = 0; i < genome.length; i++) {
        if (Math.random() < mutationRate) {
            genome[i] = Math.random() * (max - min) + min;
        }
    }
}

// swap mutation
function swapMutation(genome, mutationRate) {
    if (Math.random() < mutationRate) {
        let index1 = Math.floor(Math.random() * genome.length);
        let index2 = Math.floor(Math.random() * genome.length);

        let temp = genome[index1];
        genome[index1] = genome[index2];
        genome[index2] = temp;
    }
}

// scramble mutation
function scrambleMutation(genome, mutationRate) {
    if (Math.random() < mutationRate) {
        let index1 = Math.floor(Math.random() * genome.length);
        let index2 = Math.floor(Math.random() * genome.length);

        if (index2 < index1) {
            let temp = index1;
            index1 = index2;
            index2 = temp;
        }
        
        let shuffle = genome.splice(index1, index2).sort(() => 0.5 - Math.random());
        shuffle.forEach(function(gene, idx) {
            genome.splice(index1 + idx, 0, gene);
        });
    }
}

// inverse mutation
function inversionMutation(genome, mutationRate) {
    if (Math.random() < mutationRate) {
        let index1 = Math.floor(Math.random() * genome.length);
        let index2 = Math.floor(Math.random() * genome.length);

        if (index2 < index1) {
            let temp = index1;
            index1 = index2;
            index2 = temp;
        }

        let reverse = genome.splice(index1, index2).reverse();
        reverse.forEach(function(gene, idx) {
            genome.splice(index1 + idx, 0, gene);
        });
    }
}

// single point crossover
function SPC(parent1, parent2, crossoverRate, geneLength=1) {
    if (Math.random() < crossoverRate) {        
        let index = Math.floor(Math.random() * parent1.length/geneLength) * geneLength;
        return parent1.slice(0, index).concat(parent2.slice(index));
    }
    return parent1;
}

// two point crossover
function TPC(parent1, parent2, crossoverRate, geneLength=1) {
    if (Math.random() < crossoverRate) {
        let len = parent1.length/geneLength;
        let index1 = Math.floor(Math.random() * len);
        let index2 = Math.floor(Math.random() * (len - index1) + index1); 
        index1 *= geneLength;
        index2 *= geneLength;
        return parent1.slice(0, index1).concat(parent2.slice(index1, index2)).concat(parent1.slice(index2));
    }
    return parent1
}

// Uniform crossover
function UC(parent1, parent2, crossoverRate, geneLength=1) {
    let offspring = [];
    if (Math.random() < crossoverRate) {
        for (let i = 0; i < parent1.length; i += geneLength) {
            let inheritedGene = (Math.random() < 0.5) ? parent1 : parent2;
            offspring = offspring.concat(inheritedGene.slice(i, i + geneLength));
        }
        return offspring;
    }
    return parent1;
}

function TOS(population, amount, k) {
    let selection = [];
    for (var i = 0; i < amount; i++) {
        // shuffle the population
        let shuffle = population.sort(() => 0.5 - Math.random());
        // select the best individual
        selection.push(shuffle.slice(0, k).sort((a, b) => a.fitness > b.fitness ? -1 : 1)[0]);
    }
    return selection;
}

function RWS(population, amount) {
    let totalFitness = population.reduce((acc, cv) => acc + cv.fitness, 0);
    let selection = [];
    for (var i = 0; i < amount; i++) {
        let point = Math.random() * totalFitness;
        let sum = 0
        for (var j = 0; j < population.length; j++) {
            sum += population[j].fitness;
            if (point < sum) {
                selection.push(population[j]);
                break;
            }
        }
    }
    return selection;
}

function SUS(population, amount) {
    let totalFitness = population.reduce((acc, cv) => acc + cv.fitness, 0);
    let delta = totalFitness / amount;
    let point = Math.random() * delta;
    let selection = [];
    
    let sum = population[0].fitness;
    for (var i = 0; i < amount; i++) {
        for (var j = 1; j < population.length; j++) {
            if (point < sum) {
                selection.push(population[j-1]);
                point += delta;
                break;
            }
            sum += population[i].fitness;
        }
    }

    return selection;
}