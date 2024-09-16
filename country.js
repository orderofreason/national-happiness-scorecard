// Fetch and render the country details on page load
async function fetchAndRenderCountryDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const countryName = urlParams.get('country');

    try {
        const response = await fetch('data.json'); // Update this with the correct path to your data source
        const data = await response.json();

        // Filter data for the selected country
        const countryData = data.filter(entry => entry['Country name'] === countryName);
        
        if (countryData.length === 0) {
            console.error('No data found for the specified country:', countryName);
            return;
        }

        // Render the map and basic country info
        renderCountryOverview(countryName, countryData);

        // Define the variables you want to display in the charts
        const variables = [
            "Log GDP per capita",
            "Social support",
            "Healthy life expectancy at birth",
            "Freedom to make life choices",
            "Generosity",
            "Perceptions of corruption",
            "Positive affect",
            "Negative affect"
        ];

        // Render the country details
        renderCurrentYearData(countryData);
        renderBasicCharts(countryData, variables);

    } catch (error) {
        console.error('Error fetching or processing data:', error);
    }
}

// Function to render the country overview (map and basic information)
function renderCountryOverview(countryName, countryData) {
    const overviewContainer = document.getElementById('country-overview');
    const latestYearData = countryData[countryData.length - 1];

    // Create a container for the map
    overviewContainer.innerHTML = `
        <div class="country-intro">
            <div id="map" class="country-map" style="width: 100%; height: 300px;"></div>
            <div class="country-info">
                <h2>${countryName} (${latestYearData.year})</h2>
                <p><strong>Current Happiness Score:</strong> ${latestYearData['Life Ladder']}</p>
                <p><strong>Change from Previous Year:</strong> ${calculatePercentChange(countryData, 'Life Ladder')}%</p>
            </div>
        </div>
    `;

    // Initialize the map using Leaflet with a default view
    const map = L.map('map').setView([20, 0], 2); // Default view (center of the world)

    // Add OpenStreetMap tiles to the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Use Nominatim API to get the latitude and longitude of the country
    fetch(`https://nominatim.openstreetmap.org/search?country=${encodeURIComponent(countryName)}&format=json`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                // Set the map view to the country's coordinates
                map.setView([lat, lon], 5); // Zoom level 5 is a good starting point for countries
            } else {
                console.error('No location data found for:', countryName);
            }
        })
        .catch(error => {
            console.error('Error fetching location data:', error);
        });
}

// Function to calculate the percent change for a given variable
function calculatePercentChange(data, variable) {
    if (data.length < 2) return 0;
    const latestValue = data[data.length - 1][variable];
    const previousValue = data[data.length - 2][variable];
    return (((latestValue - previousValue) / previousValue) * 100).toFixed(2);
}

// Function to render current year data with two responsive tables
function renderCurrentYearData(data) {
    // Group 1: Variables for Table 1
    const group1Variables = ["Log GDP per capita", "Social support", "Healthy life expectancy at birth", "Freedom to make life choices"];
    const group1Data = group1Variables.map(variable => ({
        name: variable,
        currentValue: data[data.length - 1][variable],
        percentChange: calculatePercentChange(data, variable),
        definition: getVariableDefinition(variable)
    }));

    // Group 2: Variables for Table 2
    const group2Variables = ["Generosity", "Perceptions of corruption", "Positive affect", "Negative affect"];
    const group2Data = group2Variables.map(variable => ({
        name: variable,
        currentValue: data[data.length - 1][variable],
        percentChange: calculatePercentChange(data, variable),
        definition: getVariableDefinition(variable)
    }));

    const currentYearDataContainer = document.getElementById('current-year-data');
    currentYearDataContainer.innerHTML = `
        <div class="section-card">
            <h4 class="section-header">Current Year Data</h4>
            <div class="tables-container">
                <!-- First Table: Group 1 -->
                <div class="table-wrapper">
                    <table class="current-year-table">
                        <thead>
                            <tr>
                                <th>Variable</th>
                                <th>Current Value</th>
                                <th>Percent Change</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${group1Data.map(item => `
                                <tr>
                                    <td title="${item.definition}">${item.name}</td>
                                    <td>${item.currentValue}</td>
                                    <td class="${item.percentChange > 0 ? 'positive-change' : 'negative-change'}">
                                        ${item.percentChange}%
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <!-- Second Table: Group 2 -->
                <div class="table-wrapper">
                    <table class="current-year-table">
                        <thead>
                            <tr>
                                <th>Variable</th>
                                <th>Current Value</th>
                                <th>Percent Change</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${group2Data.map(item => `
                                <tr>
                                    <td title="${item.definition}">${item.name}</td>
                                    <td>${item.currentValue}</td>
                                    <td class="${item.percentChange > 0 ? 'positive-change' : 'negative-change'}">
                                        ${item.percentChange}%
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// Function to get a definition for each variable
function getVariableDefinition(variable) {
    const definitions = {
        "Log GDP per capita": "The logarithm of Gross Domestic Product per capita.",
        "Social support": "Perceived social support in times of trouble.",
        "Healthy life expectancy at birth": "Average number of years a newborn is expected to live in good health.",
        "Freedom to make life choices": "Perceived freedom of choice in life decisions.",
        "Generosity": "Willingness to donate time and resources to others.",
        "Perceptions of corruption": "Perceived levels of corruption in society.",
        "Positive affect": "Frequency of positive emotions.",
        "Negative affect": "Frequency of negative emotions."
    };
    return definitions[variable] || '';
}

// Function to render basic charts using ApexCharts
function renderBasicCharts(countryData, variables) {
    const chartsContainer = document.getElementById('charts-container');
    
    // Clear any existing charts
    chartsContainer.innerHTML = '';

    // Sort countryData by year in ascending order (earliest to latest)
    countryData.sort((a, b) => a.year - b.year);

    variables.forEach(variable => {
        // Prepare data for the chart
        const labels = countryData.map(entry => entry.year);
        const dataValues = countryData.map(entry => entry[variable]);

        // Create a wrapper for each chart
        const chartWrapper = document.createElement('div');
        chartWrapper.classList.add('chart-wrapper');
        chartsContainer.appendChild(chartWrapper);

        // Create the chart container
        const chartContainer = document.createElement('div');
        chartWrapper.appendChild(chartContainer);

        // Create the chart
        const options = {
            chart: {
                type: 'line',
                height: 400,
                width: '100%',
            },
            series: [{
                name: variable,
                data: dataValues
            }],
            xaxis: {
                categories: labels,
                title: {
                    text: 'Year'
                }
            },
            yaxis: {
                title: {
                    text: variable
                }
            },
            title: {
                text: variable,
                align: 'left'
            }
        };

        // Render the chart into the container
        const chart = new ApexCharts(chartContainer, options);
        chart.render();
    });
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

// Call the function to fetch and render the country details
fetchAndRenderCountryDetails();