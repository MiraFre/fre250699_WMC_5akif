const myArray = [1, 7, 4, 2, 8, 3, 13, 11];

function notDivisibleByThreeFull(x: number) {
	return (x % 3 !== 0);
}

const notDivisibleByThree = (x: number) => x % 3 !== 0;

const numbersNotDivisibleByThree = myArray.filter(notDivisibleByThree);

console.log(`Even numbers: ${numbersNotDivisibleByThree}`);



function isPrime(x: number) {
	for (let i = 2; i < x; i++) {
		if (x % i === 0) {
			return false;
		}
	}
	return true;
}

const isPrimeLambda = (x: number) => {
    for (let i = 2; i < x; i++) {
        if (x % i === 0) {
            return false;
        }
    }
    return true;
};

const primeNumbers = myArray.filter(isPrime);

console.log(`Prime numbers: ${primeNumbers}`);