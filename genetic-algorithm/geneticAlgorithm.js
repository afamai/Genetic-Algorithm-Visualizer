class Test {
    constructor(x) {
        this.x = x;
    }
}

a = [];
for(var i = 0; i < 10; i++) {
    a.push(new Test(i));
}

// random resetting
function randomResetting(genome, mutationRate) {
    genome.forEach(function(gene) {
        if (Math.random() < mutationRate) {
            gene.randomize();
        }
    })
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
function SPC(parent1, parent2, crossoverRate) {
    if (Math.random() < crossoverRate) {        
        let index = Math.floor(Math.random() * parent1.length);
        return parent1.slice(0, index).concat(parent2.slice(index));
    }
    return parent1;
}

// two point crossover
function TPC(parent1, parent2, crossoverRate) {
    if (Math.random() < crossoverRate) {
        let len = parent1.length;
        let index1 = Math.floor(Math.random() * len);
        let index2 = Math.floor(Math.random() * (len - index1 - 1) + index1);
        return parent1.slice(0, index1).concat(parent2.slice(index1, index2)).concat(parent1.slice(index2));
    }
    return parent1
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