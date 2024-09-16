// Function to fetch data and render cards
async function fetchDataAndRenderCards() {
    try {
        // Fetch the JSON data
        const response = await fetch('data.json');
        const data = await response.json();

        // Process data to get the latest scores and percent changes
        const processedData = processCountryData(data);

        // Get the top 10 overall countries
        const top10Overall = getTop10Overall(processedData);

        // Get the top 10 most improved countries
        const top10MostImproved = getTop10MostImproved(data);

        // Get the top 10 countries with the largest regression
        const top10LargestRegression = getTop10LargestDecline(data);

        // Get the bottom 10 scored countries (most challenged)
        const bottom10Scored = getBottom10Scored(processedData);

        // Get all countries in alphabetical order
        const allCountries = getAllCountriesAlphabetical(processedData);

        // Render the sections with updated titles
        renderSection('Top 10 Overall', top10Overall);
        renderSection('Most Improved', top10MostImproved);
        renderSection('Largest Regression', top10LargestRegression);
        renderSection('Most Challenged', bottom10Scored);
        renderSection('All Countries', allCountries);

        // Set up search functionality
        setupSearch(data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Function to process the data to get the latest scores and percent changes
function processCountryData(data) {
    const countryMap = {};

    // Group data by country and find the most recent entry
    data.forEach(entry => {
        const countryName = entry["Country name"];
        const year = entry.year;
        const score = entry["Life Ladder"];

        // If the country doesn't exist in the map, add it
        if (!countryMap[countryName]) {
            countryMap[countryName] = [];
        }

        // Push each year's data for the country
        countryMap[countryName].push({ year, score });
    });

    // Process each country to find the latest year and percent change
    const processedData = Object.keys(countryMap).map(countryName => {
        const entries = countryMap[countryName];

        // Sort entries by year to find the most recent and the previous year
        entries.sort((a, b) => b.year - a.year);

        // Get the most recent and prior year entries
        const latestEntry = entries[0];
        const priorEntry = entries[1]; // This may be undefined if there's only one entry

        // Calculate percent change if the prior entry exists
        let percentChange = null;
        if (priorEntry) {
            percentChange = ((latestEntry.score - priorEntry.score) / priorEntry.score) * 100;
        }

        return {
            name: countryName,
            latestScore: latestEntry.score,
            latestYear: latestEntry.year,
            percentChange: percentChange !== null ? percentChange : 'N/A'
        };
    });

    return processedData;
}

// Function to get the top 10 overall countries
function getTop10Overall(data) {
    return data
        .sort((a, b) => b.latestScore - a.latestScore) // Sort by latest score descending
        .slice(0, 10); // Get top 10
}

// Function to get the top 10 most improved countries
function getTop10MostImproved(data) {
    return processCountryData(data)
        .filter(country => country.percentChange !== 'N/A')
        .sort((a, b) => b.percentChange - a.percentChange) // Sort by percent change descending
        .slice(0, 10); // Get top 10
}

// Function to get the top 10 countries with the largest decline
function getTop10LargestDecline(data) {
    return processCountryData(data)
        .filter(country => country.percentChange !== 'N/A')
        .sort((a, b) => a.percentChange - b.percentChange) // Sort by percent change ascending
        .slice(0, 10); // Get top 10
}

// Function to get the bottom 10 scored countries
function getBottom10Scored(data) {
    return data
        .sort((a, b) => a.latestScore - b.latestScore) // Sort by latest score ascending
        .slice(0, 10); // Get bottom 10
}

// Function to get all countries in alphabetical order
function getAllCountriesAlphabetical(data) {
    return data.sort((a, b) => a.name.localeCompare(b.name));
}

// Function to render a section with a header and cards
function renderSection(title, data) {
    const pageContent = document.querySelector('.page-content');

    // Create section header
    const sectionHeader = document.createElement('h2');
    sectionHeader.classList.add('section-header');
    sectionHeader.textContent = title;
    pageContent.appendChild(sectionHeader);

    // Create grid container
    const cardGrid = document.createElement('div');
    cardGrid.classList.add('card-grid');

    // Create and append each card
    data.forEach(country => {
        const card = createCard(country);
        cardGrid.appendChild(card);
    });

    // Append the grid to the page content
    pageContent.appendChild(cardGrid);
}

// Function to create a card
function createCard(country) {
    // Create card container
    const card = document.createElement('div');
    card.classList.add('mdl-card', 'mdl-shadow--2dp', 'demo-card');

    // Create card title
    const cardTitle = document.createElement('div');
    cardTitle.classList.add('mdl-card__title');
    const titleText = document.createElement('h2');
    titleText.classList.add('mdl-card__title-text');
    titleText.textContent = country.name;
    cardTitle.appendChild(titleText);

    // Create card supporting text
    const cardText = document.createElement('div');
    cardText.classList.add('mdl-card__supporting-text');
    cardText.innerHTML = `
        Latest Score (${country.latestYear}): ${country.latestScore}<br>
        Percent Change: ${country.percentChange !== 'N/A' ? country.percentChange.toFixed(2) : 'N/A'}%
    `;

    // Create card actions
    const cardActions = document.createElement('div');
    cardActions.classList.add('mdl-card__actions', 'mdl-card--border');
    const learnMoreButton = document.createElement('button');
    learnMoreButton.classList.add('mdl-button', 'mdl-js-button', 'mdl-button--raised', 'mdl-js-ripple-effect', 'mdl-button--accent');
    learnMoreButton.textContent = 'Learn More';
    
    // Navigate to the country details page on click
    learnMoreButton.onclick = () => {
        window.location.href = `country.html?country=${encodeURIComponent(country.name)}`;
    };

    cardActions.appendChild(learnMoreButton);

    // Append elements to card
    card.appendChild(cardTitle);
    card.appendChild(cardText);
    card.appendChild(cardActions);

    return card;
}

// Function to set up search functionality
function setupSearch(data) {
    const searchInput = document.getElementById('country-search');
    const searchResults = document.getElementById('search-results');

    searchInput.addEventListener('input', function () {
        const query = searchInput.value.toLowerCase();
        searchResults.innerHTML = ''; // Clear previous results

        if (query) {
            // Use a Set to keep track of unique country names
            const uniqueCountries = new Set();

            // Filter and add unique country names
            data.forEach(entry => {
                const countryName = entry["Country name"];
                if (countryName.toLowerCase().includes(query)) {
                    uniqueCountries.add(countryName);
                }
            });

            // Display the unique countries
            uniqueCountries.forEach(countryName => {
                const resultItem = document.createElement('div');
                resultItem.textContent = countryName;
                resultItem.onclick = () => {
                    window.location.href = `country.html?country=${encodeURIComponent(countryName)}`;
                };
                searchResults.appendChild(resultItem);
            });
        }
    });
}

// Fetch data and render cards on page load
fetchDataAndRenderCards();