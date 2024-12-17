const API_URL = 'https://api.exchangerate-api.com/v4/latest/';
 
const form = document.getElementById('converter-form');
const fromCurrency = document.getElementById('from-currency');
const toCurrency = document.getElementById('to-currency');

const amountInput = document.getElementById('amount');
const convertedAmount = document.getElementById('converted-amount');
const resultContainer = document.querySelector('.result');

// function used to display currency options in dropdown
async function populateCurrencies() {
    try {
        const response = await fetch(`${API_URL}USD`);
        //converting reponse into a javascript object
        const data = await response.json();

        const currencies = Object.keys(data.rates);

        currencies.forEach(currency => {
            const option1 = document.createElement('option');
            option1.value = currency;
            option1.textContent = currency;
            fromCurrency.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = currency;
            option2.textContent = currency;
            toCurrency.appendChild(option2);
        });

        // I have set the default values to usd and inr 
        fromCurrency.value = 'USD';
        toCurrency.value = 'INR';
    } catch (error) {
        console.error('Error fetching currencies:', error);
    }
}

// Fetch exchange rates for a given base currency
async function fetchExchangeRates(baseCurrency) {
    console.log('hiya')


    try {
        const response = await fetch(`${API_URL}${baseCurrency}`);
        if (!response.ok) throw Error('Failed to fetch exchange rates');
        const data = await response.json();
        return data.rates;
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        return null;
    }
}

//This function is used to find the three best conversion paths
async function findBestPaths(startCurrency, endCurrency, rates) {
    const paths = [];

    for (const intermediateCurrency in rates) {
        if (intermediateCurrency === startCurrency || intermediateCurrency === endCurrency) continue;

        const toIntermediateRate = rates[intermediateCurrency];
        const intermediateRates = await fetchExchangeRates(intermediateCurrency);

        if (!intermediateRates || !intermediateRates[endCurrency]) continue;

        const toEndRate = intermediateRates[endCurrency];
        const finalAmount = toIntermediateRate * toEndRate;

        paths.push({
            path: `${startCurrency} → ${intermediateCurrency} → ${endCurrency}`,
            amount: finalAmount.toFixed(6),
        });
    }

    //sorting the the paths 
    paths.sort((a, b) => b.amount - a.amount);
    return paths.slice(0, 3);//only return the best 3 
}

// Handle the form submission
async function convertCurrency(event) {
    event.preventDefault();

    const amount = parseFloat(amountInput.value);
    const startCurrency = fromCurrency.value;
    const endCurrency = toCurrency.value;

    //making sure the user inputs a number which is greater than 0  
    if (isNaN(amount) || amount <= 0) {

        console.log('hello')
        convertedAmount.textContent = 'Please enter a valid amount';
        return;
    }

    const rates = await fetchExchangeRates(startCurrency);
    if (!rates) {
        convertedAmount.textContent = 'Failed to fetch conversion rates';
        return;
    }

    // Direct conversion from base currency to end currency
    const directRate = rates[endCurrency];
    if (directRate) {
        const directAmount = (amount * directRate).toFixed(6);
        convertedAmount.textContent = `${amount} ${startCurrency} = ${directAmount} ${endCurrency}`;
    } else {
        convertedAmount.textContent = 'Direct conversion not available';
    }

    
    const bestPaths = await findBestPaths(startCurrency, endCurrency, rates);
    displayBestPaths(bestPaths, amount, endCurrency);
}

// Display the top three conversion paths
function displayBestPaths(paths, amount, endCurrency) {
    
    const pathsContainer = document.createElement('div');
    pathsContainer.innerHTML = '<h3>Best 3 conversion paths</h3>';
    paths.forEach((path, index) => {
        const pathElement = document.createElement('p');
        pathElement.textContent = `${index + 1}. ${path.path}: ${amount} → ${path.amount} ${endCurrency}`;
        pathsContainer.appendChild(pathElement);
    });
    resultContainer.innerHTML='';

    resultContainer.appendChild(pathsContainer);
}

// Initialize app
populateCurrencies();
form.addEventListener('submit', convertCurrency);
