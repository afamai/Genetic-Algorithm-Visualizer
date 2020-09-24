# Genetic-Algorithm-Visualizer

This application was built to showcase the genetic algorithm by using it in different scenarios. There are currently only 2 demos, but I do plan on building more in the future. I hope you enjoy playing around with the demos and watching the algorithm using the theory of natural evolution to find an optimal solution.

Link to the app: https://afamai.github.io/Genetic-Algorithm-Visualizer/

## Smart Balls
This program demonstrates the genetic algorithm through a simulation of bouncing balls built using Box2D. The goal of the program is the find the most optimal series of jumps required to reach the target.

#### Genome Representation
The genome representation for each ball in this program is an array of jumps. Each jump can be represented as 2 floats, one for the angle and one for the jump strenth.

#### Fitness Function
The fitness for each ball is calculated by how close it got to the target. Using the euclidean distance the program can determine how close the ball have reached the target and using that value the program can determine its fitness value.

## Evolving Images
This program demonstrates the genetic algorithm by reproducing an image using a bunch of polygons.

#### Genome Representation
The genome representation for each image in this program is an array of polygons. Each polygon can be represented as **4 + 2 * number_of_vertices** floats, where the first 4 floats are used to represent the color of the polygons and the sequencial floats will represent the vertices for the polygon.

#### Fitness Function
The fitness for each image is calculated using the sum square difference between the image and the reference image. 
