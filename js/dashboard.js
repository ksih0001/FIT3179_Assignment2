// Font configuration for consistent typography
const FONT_CONFIG = {
    labelFont: "Segoe UI, Arial, sans-serif",
    titleFont: "Segoe UI, Arial, sans-serif"
};

const COLORS = {
    blue: '#006BA4',
    picton: '#5F9ED1',
    sail: '#A2C8EC',
    orange: '#FF800E',
    mac: '#FFBC79',
    tenne: '#C85200', // Malaysia
    mortar: '#595959',
    suva: '#898989',
    darkGray: '#ABABAB',
    lightGray: '#CFCFCF'
};

// STATE COLOR MAPPING (consistent across all charts)
const STATE_COLORS = {
    'Johor': COLORS.blue,
    'Selangor': COLORS.picton,
    'Perak': COLORS.sail,
    'Pahang': COLORS.orange,
    'Kedah': COLORS.mac,
    'Sabah': COLORS.tenne,
    'Sarawak': COLORS.mortar,
    'Pulau Pinang': COLORS.suva,
    'Kelantan': COLORS.darkGray,
    'Terengganu': COLORS.lightGray,
    'Negeri Sembilan': '#8B4513',
    'W.P. Kuala Lumpur': '#2F4F4F',
    'Melaka': '#8B008B',
    'Perlis': '#006400'
};

let globalYear = 2019;
let seaYear = 2019;
let stateData = null;
let selectedState = null;

// Store chart views for cross-chart interactivity
let chartViews = {
    choropleth: null,
    groupedBar: null,
    scatter: null,
    trellis: null
};

// ============================================================================
// CROSS-CHART INTERACTIVITY
// ============================================================================
function toggleStateSelection(stateName) {
    console.log('Toggle state selection called:', stateName);

    // Toggle selection
    if (selectedState === stateName) {
        selectedState = null;
        console.log('Deselected state');
    } else {
        selectedState = stateName;
        console.log('Selected state:', selectedState);
    }

    // Re-render charts with updated selection
    console.log('Re-rendering charts with selection:', selectedState);
    renderChoropleth(globalYear);
    renderGroupedBar(globalYear, true);  // Fixed: removed non-existent element reference
    renderScatter();
    renderTrellis();
    renderDeviationBar(globalYear);
}

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    fetch('data/combined_state_data.json')
        .then(response => response.json())
        .then(data => {
            stateData = data;
            initializeDashboard();
        })
        .catch(err => console.error('Error loading state data:', err));
});

function initializeDashboard() {
    // Setup SEA year control (slider)
    const seaYearSlider = document.getElementById('sea-year');
    const seaYearDisplay = document.getElementById('sea-year-display');
    const seaYearText = document.getElementById('sea-year-text');

    if (seaYearSlider) {
        seaYearSlider.addEventListener('input', function(e) {
            seaYear = parseInt(e.target.value);
            seaYearDisplay.textContent = seaYear;
            if (seaYearText) seaYearText.textContent = seaYear;
            renderSEABar(seaYear);
        });
    }

    // Setup map year control
    const mapYearSlider = document.getElementById('map-year');
    const mapYearDisplay = document.getElementById('map-year-display');
    const mapYearText = document.getElementById('map-year-text');

    if (mapYearSlider) {
        mapYearSlider.addEventListener('input', function(e) {
            globalYear = parseInt(e.target.value);
            mapYearDisplay.textContent = globalYear;
            if (mapYearText) mapYearText.textContent = globalYear;
            updateYearLinkedDisplays();
            updateGlobalYearCharts();
        });
    }

    // Setup scatter year controls
    populateScatterYearDropdowns();
    const scatterYearA = document.getElementById('scatter-year-a');
    const scatterYearB = document.getElementById('scatter-year-b');
    if (scatterYearA) scatterYearA.addEventListener('change', renderScatter);
    if (scatterYearB) scatterYearB.addEventListener('change', renderScatter);

    // Setup metric toggle
    const metricToggle = document.getElementById('metric-toggle');
    if (metricToggle) {
        metricToggle.addEventListener('change', function(e) {
            renderGroupedBar(globalYear, e.target.checked);
        });
    }

    // Render all charts
    renderSEABar(seaYear);
    renderStackedArea();
    renderMultiLine();
    renderChoropleth(globalYear);
    renderGroupedBar(globalYear, false);
    renderScatter();
    renderTrellis();
    renderDeviationBar(globalYear);

    console.log('Dashboard initialized');
}

function updateYearLinkedDisplays() {
    const barYearText = document.getElementById('bar-year-text');
    const deviationYearText = document.getElementById('deviation-year-text');

    if (barYearText) barYearText.textContent = globalYear;
    if (deviationYearText) deviationYearText.textContent = globalYear;
}

function updateGlobalYearCharts() {
    renderChoropleth(globalYear);
    const metricToggle = document.getElementById('metric-toggle');
    renderGroupedBar(globalYear, metricToggle ? metricToggle.checked : false);
    renderDeviationBar(globalYear);
}

function populateScatterYearDropdowns() {
    const years = [...new Set(stateData.map(d => d.year))].sort();
    const selectA = document.getElementById('scatter-year-a');
    const selectB = document.getElementById('scatter-year-b');

    if (!selectA || !selectB) return;

    years.forEach(year => {
        const optionA = document.createElement('option');
        optionA.value = year;
        optionA.textContent = year;
        if (year === 2003) optionA.selected = true;
        selectA.appendChild(optionA);

        const optionB = document.createElement('option');
        optionB.value = year;
        optionB.textContent = year;
        if (year === 2019) optionB.selected = true;
        selectB.appendChild(optionB);
    });
}


// ============================================================================
// CHART 1: SEA HORIZONTAL BAR 
// ============================================================================
function renderSEABar(year) {
    const spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "width": 900,
        "height": 400,
        "data": {"url": "data/sea_death_rates.json"},
        "transform": [
            {"filter": `datum.year == ${year}`}
        ],
        "layer": [
            {
                "mark": "bar",
                "encoding": {
                    "y": {
                        "field": "country",
                        "type": "nominal",
                        "title": null,
                        "sort": "-x",
                        "axis": {"labelLimit": 150}
                    },
                    "x": {
                        "field": "rate",
                        "type": "quantitative",
                        "title": "Deaths per 100,000 Population",
                        "scale": {"domain": [0, 40]}
                    },
                    "color": {
                        "condition": {
                            "test": "datum.country == 'Malaysia'",
                            "value": COLORS.tenne
                        },
                        "value": COLORS.blue
                    },
                    "tooltip": [
                        {"field": "country", "title": "Country"},
                        {"field": "rate", "title": "Rate per 100k", "format": ".1f"},
                        {"field": "year", "title": "Year"}
                    ]
                }
            },
            {
                "mark": {
                    "type": "text",
                    "align": "left",
                    "dx": 5,
                    "fontSize": 12,
                    "fontWeight": "bold"
                },
                "encoding": {
                    "y": {
                        "field": "country",
                        "type": "nominal",
                        "sort": "-x"
                    },
                    "x": {
                        "field": "rate",
                        "type": "quantitative"
                    },
                    "text": {
                        "field": "rate",
                        "type": "quantitative",
                        "format": ".1f"
                    },
                    "color": {
                        "value": "#1a1a1a"
                    }
                }
            }
        ]
    };

    vegaEmbed('#chart1-sea-bar', spec, {actions: false, tooltip: {theme: 'custom'}})
        .catch(err => console.error('Error rendering SEA bar:', err));
}

// ============================================================================
// CHART 2: STACKED AREA
// ============================================================================
function renderStackedArea() {
    const spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "width": 450,
        "height": 300,
        "layer": [
            {
                "data": {"url": "data/national_outcomes.json"},
                "mark": "area",
                "encoding": {
                    "x": {
                        "field": "year",
                        "type": "quantitative",
                        "title": "Year",
                        "axis": {"format": "d", "tickCount": 10},
                        "scale": {"domain": [2003, 2016]}
                    },
                    "y": {
                        "field": "count",
                        "type": "quantitative",
                        "title": "Number of Cases",
                        "stack": "zero"
                    },
                    "color": {
                        "field": "severity",
                        "type": "nominal",
                        "scale": {
                            "domain": ["Deaths", "Serious", "Slight"],
                            "range": [COLORS.orange, COLORS.mortar, COLORS.picton]
                        },
                        "legend": {"title": "Severity", "orient": "top"}
                    },
                    "tooltip": [
                        {"field": "year", "title": "Year"},
                        {"field": "severity", "title": "Severity"},
                        {"field": "count", "title": "Count", "format": ","}
                    ]
                }
            },
            // Annotation box background
            {
                "data": {"values": [{}]},
                "mark": {
                    "type": "rect",
                    "x": 260,
                    "x2": 440,
                    "y": 20,
                    "y2": 95,
                    "fill": "white",
                    "stroke": COLORS.mortar,
                    "strokeWidth": 1.5,
                    "opacity": 0.9
                }
            },
            // Annotation text - line 1
            {
                "data": {"values": [{"text": "The Severity Paradox:"}]},
                "mark": {"type": "text", "fontSize": 12, "fontWeight": "bold", "align": "left", "color": COLORS.mortar},
                "encoding": {
                    "x": {"value": 270},
                    "y": {"value": 35},
                    "text": {"field": "text"}
                }
            },
            // Annotation text - line 2
            {
                "data": {"values": [{"text": "Total casualties ↓64%"}]},
                "mark": {"type": "text", "fontSize": 12, "align": "left", "color": COLORS.mortar, "fontWeight": "bold"},
                "encoding": {
                    "x": {"value": 270},
                    "y": {"value": 53},
                    "text": {"field": "text"}
                }
            },
            // Annotation text - line 3
            {
                "data": {"values": [{"text": "BUT Deaths ↑14%"}]},
                "mark": {"type": "text", "fontSize": 12, "align": "left", "color": COLORS.mortar, "fontWeight": "bold"},
                "encoding": {
                    "x": {"value": 270},
                    "y": {"value": 70},
                    "text": {"field": "text"}
                }
            },
            // Annotation text - line 4
            {
                "data": {"values": [{"text": "(2003–2016)"}]},
                "mark": {"type": "text", "fontSize": 12, "align": "left", "color": COLORS.mortar, "fontStyle": "italic"},
                "encoding": {
                    "x": {"value": 270},
                    "y": {"value": 85},
                    "text": {"field": "text"}
                }
            }
        ]
    };

    vegaEmbed('#chart2-stacked-area', spec, {actions: false})
        .catch(err => console.error('Error rendering stacked area:', err));
}

// ============================================================================
// CHART 3: STACKED SMALL MULTIPLES 
// ============================================================================
function renderMultiLine() {
    // Fetch and pre-process data
    fetch('data/national_exposure.json')
        .then(response => response.json())
        .then(rawData => {
            const spec = {
                "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
                "vconcat": [
                    {
                        "width": 450,
                        "height": 120,
                        "title": "Registered Vehicles (Millions)",
                        "data": {"values": rawData},
                        "layer": [
                            {
                        "mark": {"type": "line", "point": true, "strokeWidth": 2, "color": COLORS.blue},
                        "encoding": {
                            "x": {
                                "field": "year",
                                "type": "quantitative",
                                "title": null,
                                "axis": {"format": "d", "labels": false},
                                "scale": {"domain": [2003, 2016]}
                            },
                            "y": {
                                "field": "vehicles",
                                "type": "quantitative",
                                "title": "Vehicles (M)",
                                "axis": {"format": ".2s"},
                                "scale": {"domain": [8000000, 28000000]}
                            },
                            "tooltip": [
                                {"field": "year", "title": "Year"},
                                {"field": "vehicles", "title": "Vehicles", "format": ","}
                            ]
                        }
                            },
                            {
                                "mark": {"type": "text", "align": "center", "dy": -10, "fontWeight": "bold", "fontSize": 12, "color": COLORS.blue},
                                "encoding": {
                                    "x": {"datum": 2009.5},
                                    "y": {"datum": 20000000},
                                    "text": {"datum": "+116%"}
                                }
                            }
                        ]
                    },
                    {
                        "width": 450,
                        "height": 120,
                        "title": "Road Crashes (Thousands)",
                        "data": {"values": rawData},
                        "layer": [
                            {
                        "mark": {"type": "line", "point": true, "strokeWidth": 2, "color": COLORS.orange},
                        "encoding": {
                            "x": {
                                "field": "year",
                                "type": "quantitative",
                                "title": null,
                                "axis": {"format": "d", "labels": false},
                                "scale": {"domain": [2003, 2016]}
                            },
                            "y": {
                                "field": "crashes",
                                "type": "quantitative",
                                "title": "Crashes (K)",
                                "axis": {"format": ".3s"},
                                "scale": {"domain": [200000, 550000]}
                            },
                            "tooltip": [
                                {"field": "year", "title": "Year"},
                                {"field": "crashes", "title": "Crashes", "format": ","}
                            ]
                        }
                            },
                            {
                                "mark": {"type": "text", "align": "center", "dy": -10, "fontWeight": "bold", "fontSize": 12, "color": COLORS.orange},
                                "encoding": {
                                    "x": {"datum": 2009.5},
                                    "y": {"datum": 400000},
                                    "text": {"datum": "+75%"}
                                }
                            }
                        ]
                    },
                    {
                        "width": 450,
                        "height": 120,
                        "title": "Road Deaths (Thousands)",
                        "data": {"values": rawData},
                        "layer": [
                            {
                        "mark": {"type": "line", "point": true, "strokeWidth": 2, "color": COLORS.mortar},
                        "encoding": {
                            "x": {
                                "field": "year",
                                "type": "quantitative",
                                "title": "Year",
                                "axis": {"format": "d"},
                                "scale": {"domain": [2003, 2016]}
                            },
                            "y": {
                                "field": "deaths",
                                "type": "quantitative",
                                "title": "Deaths",
                                "axis": {"format": ".4~s", "values": [6000, 6200, 6400, 6600, 6800, 7000, 7200]},
                                "scale": {"domain": [5800, 7300]}
                            },
                            "tooltip": [
                                {"field": "year", "title": "Year"},
                                {"field": "deaths", "title": "Deaths", "format": ","}
                            ]
                        }
                            },
                            {
                                "mark": {"type": "text", "align": "center", "dy": -10, "fontWeight": "bold", "fontSize": 12, "color": COLORS.mortar},
                                "encoding": {
                                    "x": {"datum": 2009.5},
                                    "y": {"datum": 6850},
                                    "text": {"datum": "+14%"}
                                }
                            }
                        ]
                    }
                ],
                "spacing": 10
            };

            vegaEmbed('#chart3-multi-line', spec, {actions: false, tooltip: {theme: 'custom'}})
                .catch(err => console.error('Error rendering multi-line:', err));
        })
        .catch(err => console.error('Error loading exposure data:', err));
}

// ============================================================================
// CHART 4: CHOROPLETH MAP 
// ============================================================================
function renderChoropleth(year) {
    const filteredData = stateData.filter(d => d.year === year);
    const mappedData = filteredData.map(d => ({
        ...d,
        geo_name: d.state_title === 'Pulau Pinang' ? 'Penang' :
                 d.state_title === 'W.P. Kuala Lumpur' ? 'Kuala Lumpur' :
                 d.state_title
    }));

    // Annotation metrics
    const totalDeaths = filteredData.reduce((sum, d) => sum + d.deaths, 0);
    const totalPop = filteredData.reduce((sum, d) => sum + d.population, 0);
    const nationalRate = (totalDeaths / totalPop) * 100;
    const highest = filteredData.reduce((a, b) => (a.death_rate > b.death_rate ? a : b));
    const lowest = filteredData.reduce((a, b) => (a.death_rate < b.death_rate ? a : b));

    const spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "width": 900,
        "height": 550,
        "layer": [
            {
                "data": {
                    "url": "js/geoBoundaries-MYS-ADM0.topojson",
                    "format": {"type": "topojson", "feature": "states"}
                },
                "transform": [
                    {
                        "lookup": "properties.Name",
                        "from": {
                            "data": {"values": mappedData},
                            "key": "geo_name",
                            "fields": ["deaths", "population", "death_rate", "state_title"]
                        }
                    }
                ],
                "mark": {"type": "geoshape", "stroke": "white", "strokeWidth": 1.5, "cursor": "pointer"},
                "encoding": {
                    "color": {
                        "field": "death_rate",
                        "type": "quantitative",
                        "scale": {"scheme": "orangered", "domain": [5, 35]},
                        "legend": {"title": "Deaths per 100,000", "orient": "bottom-left", "gradientLength": 300}
                    },
                    "opacity": {
                        "condition": selectedState ? {"test": `datum.state_title == '${selectedState}'`, "value": 1} : {"test": "true", "value": 1},
                        "value": 0.3
                    },
                    "tooltip": [
                        {"field": "properties.Name", "type": "nominal", "title": "State"},
                        {"datum": year, "title": "Year"},
                        {"field": "deaths", "type": "quantitative", "title": "Total Deaths", "format": ","},
                        {"field": "population", "type": "quantitative", "title": "Population (000s)", "format": ",.1f"},
                        {"field": "death_rate", "type": "quantitative", "title": "Rate per 100,000", "format": ".1f"}
                    ]
                },
                "projection": {"type": "mercator", "center": [108, 4], "scale": 2800}
            },
            {
                // National rate chip
                "data": {"values": [{"label": `National: ${nationalRate.toFixed(1)} per 100k`}]},
                "mark": {"type": "text", "fontSize": 12, "fontWeight": "bold", "fill": COLORS.mortar, "align": "left"},
                "encoding": {
                    "x": {"value": 20},
                    "y": {"value": 20},
                    "text": {"field": "label"}
                }
            },
            {
                // Highest rate badge
                "data": {"values": [{"label": `Highest rate: ${highest.state_title} (${highest.death_rate.toFixed(1)})`}]},
                "mark": {"type": "text", "fontSize": 12, "fill": COLORS.mortar, "align": "left"},
                "encoding": {
                    "x": {"value": 20},
                    "y": {"value": 40},
                    "text": {"field": "label"}
                }
            },
            {
                // Lowest rate badge
                "data": {"values": [{"label": `Lowest rate: ${lowest.state_title} (${lowest.death_rate.toFixed(1)})`}]},
                "mark": {"type": "text", "fontSize": 12, "fill": COLORS.mortar, "align": "left"},
                "encoding": {
                    "x": {"value": 20},
                    "y": {"value": 55},
                    "text": {"field": "label"}
                }
            }
        ]
    };

    vegaEmbed('#chart4-choropleth', spec, {actions: false})
        .then(result => {
            chartViews.choropleth = result.view;
            result.view.addEventListener('click', (event, item) => {
                if (item && item.datum && item.datum.state_title) {
                    toggleStateSelection(item.datum.state_title);
                }
            });
        })
        .catch(err => console.error('Error rendering choropleth:', err));
}

// ============================================================================
// CHART 5: GROUPED BAR (STATE COMPARISON)
// ============================================================================
function renderGroupedBar(year, showAbsolute) {
    const filteredData = stateData.filter(d => d.year === year);
    const field = showAbsolute ? "deaths" : "death_rate";
    const title = showAbsolute ? "Total Deaths" : "Deaths per 100,000";

    // National reference for rate mode
    let nationalRate = null;
    if (!showAbsolute) {
        const totalDeaths = filteredData.reduce((sum, d) => sum + d.deaths, 0);
        const totalPop = filteredData.reduce((sum, d) => sum + d.population, 0);
        nationalRate = (totalDeaths / totalPop) * 100;
    }

    const baseLayer = {
        "mark": {"type": "bar", "cursor": "pointer"},
        "encoding": {
            "y": {
                "field": "state_title",
                "type": "nominal",
                "sort": "-x",
                "title": null,
                "axis": {"labelLimit": 150}
            },
            "x": {
                "field": field,
                "type": "quantitative",
                "title": title,
                "axis": {"format": showAbsolute ? "~s" : ".1f"},
                "scale": {"domain": [0, showAbsolute ? 1200 : 35]}
            },
            "color": {
                "field": showAbsolute ? "deaths" : "death_rate",
                "type": "quantitative",
                "scale": {
                    "scheme": "orangered",
                    "domain": showAbsolute ? [0, 1200] : [5, 35]
                },
                "legend": null
            },
            "opacity": {
                "condition": selectedState ? {"test": `datum.state_title == '${selectedState}'`, "value": 1} : {"test": "true", "value": 1},
                "value": 0.3
            },
            "tooltip": [
                {"field": "state_title", "title": "State"},
                {"field": "deaths", "title": "Deaths", "format": ","},
                {"field": "death_rate", "title": "Rate per 100k", "format": ".1f"}
            ]
        }
    };

    const layers = [baseLayer];
    if (nationalRate !== null) {
        layers.push({
            "mark": {"type": "rule", "color": COLORS.mortar, "strokeDash": [4,3], "strokeWidth": 2},
            "encoding": {"x": {"datum": nationalRate}}
        });
        layers.push({
            "mark": {"type": "text", "align": "left", "dx": 5, "dy": 220, "fontSize": 12, "fontWeight": "bold", "color": COLORS.mortar},
            "encoding": {
                "x": {"datum": nationalRate},
                "text": {"datum": `National Avg: ${nationalRate.toFixed(1)}`}
            }
        });
    }

    const spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "width": 450,
        "height": 450,
        "data": {"values": filteredData},
        "layer": layers
    };

    vegaEmbed('#chart5-grouped-bar', spec, {actions: false})
        .then(result => {
            chartViews.groupedBar = result.view;
            result.view.addEventListener('click', (event, item) => {
                if (item && item.datum && item.datum.state_title) {
                    toggleStateSelection(item.datum.state_title);
                }
            });
        })
        .catch(err => console.error('Error rendering grouped bar:', err));
}

// ============================================================================
// CHART 6: SCATTER (CHANGE OVER TIME)
// ============================================================================
function renderScatter() {
    const yearASelect = document.getElementById('scatter-year-a');
    const yearBSelect = document.getElementById('scatter-year-b');

    if (!yearASelect || !yearBSelect) return;

    const yearA = parseInt(yearASelect.value);
    const yearB = parseInt(yearBSelect.value);

    const dataA = stateData.filter(d => d.year === yearA);
    const dataB = stateData.filter(d => d.year === yearB);

    const mergedData = dataA.map(a => {
        const b = dataB.find(d => d.state_title === a.state_title);
        return {
            state: a.state_title,
            deaths_a: a.deaths,
            deaths_b: b ? b.deaths : null,
            pct_change: b ? ((b.deaths - a.deaths) / a.deaths * 100) : null
        };
    }).filter(d => d.deaths_b !== null);

    const maxVal = Math.max(...mergedData.map(d => Math.max(d.deaths_a, d.deaths_b)));

    // Find top 3 improvers (most negative change) and top 3 decliners (most positive change)
    const sortedByChange = [...mergedData].sort((a, b) => a.pct_change - b.pct_change);
    const topImprovers = sortedByChange.slice(0, 3);
    const topDecliners = sortedByChange.slice(-3).reverse();
    const extremeStates = [...topImprovers, ...topDecliners];

    const spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "width": 600,
        "height": 500,
        "layer": [
            {
                "data": {"values": [{x: 0, y: 0}, {x: maxVal, y: maxVal}]},
                "mark": {"type": "line", "color": COLORS.lightGray, "strokeDash": [5, 5], "strokeWidth": 2},
                "encoding": {
                    "x": {"field": "x", "type": "quantitative", "scale": {"domain": [0, maxVal * 1.1]}},
                    "y": {"field": "y", "type": "quantitative", "scale": {"domain": [0, maxVal * 1.1]}}
                }
            },
            {
                "data": {"values": mergedData},
                "mark": {"type": "circle", "size": 150, "cursor": "pointer"},
                "encoding": {
                    "x": {
                        "field": "deaths_a",
                        "type": "quantitative",
                        "title": `Deaths (${yearA})`,
                        "scale": {"domain": [0, maxVal * 1.1]}
                    },
                    "y": {
                        "field": "deaths_b",
                        "type": "quantitative",
                        "title": `Deaths (${yearB})`,
                        "scale": {"domain": [0, maxVal * 1.1]}
                    },
                    "color": {
                        "field": "state",
                        "type": "nominal",
                        "scale": {
                            "domain": Object.keys(STATE_COLORS),
                            "range": Object.values(STATE_COLORS)
                        },
                        "legend": {"title": "State", "labelLimit": 150, "columns": 2}
                    },
                    "opacity": {
                        "condition": selectedState ? {"test": `datum.state == '${selectedState}'`, "value": 0.8} : {"test": "true", "value": 0.8},
                        "value": 0.2
                    },
                    "tooltip": [
                        {"field": "state", "title": "State"},
                        {"field": "deaths_a", "title": `${yearA}`, "format": ","},
                        {"field": "deaths_b", "title": `${yearB}`, "format": ","},
                        {"field": "pct_change", "title": "Change", "format": "+.1f"}
                    ]
                }
            },
            // Annotation box background
            {
                "data": {"values": [{}]},
                "mark": {
                    "type": "rect",
                    "x": 10,
                    "x2": 200,
                    "y": 10,
                    "y2": 155,
                    "fill": "white",
                    "stroke": COLORS.mortar,
                    "strokeWidth": 1.5,
                    "opacity": 0.95
                }
            },
            // Box title - Top Improvers
            {
                "data": {"values": [{"text": "Top 3 Improvers (↓)"}]},
                "mark": {"type": "text", "fontSize": 12, "fontWeight": "bold", "align": "left", "color": COLORS.mortar},
                "encoding": {
                    "x": {"value": 20},
                    "y": {"value": 25},
                    "text": {"field": "text"}
                }
            },
            ...topImprovers.map((d, i) => ({
                "data": {"values": [{"text": `${i+1}. ${d.state}: ${d.pct_change.toFixed(1)}%`}]},
                "mark": {"type": "text", "fontSize": 12, "align": "left", "color": COLORS.mortar, "fontWeight": "bold"},
                "encoding": {
                    "x": {"value": 25},
                    "y": {"value": 40 + i * 12},
                    "text": {"field": "text"}
                }
            })),
            // Box title - Top Decliners
            {
                "data": {"values": [{"text": "Top 3 Decliners (↑)"}]},
                "mark": {"type": "text", "fontSize": 12, "fontWeight": "bold", "align": "left", "color": COLORS.mortar},
                "encoding": {
                    "x": {"value": 20},
                    "y": {"value": 85},
                    "text": {"field": "text"}
                }
            },
            ...topDecliners.map((d, i) => ({
                "data": {"values": [{"text": `${i+1}. ${d.state}: +${d.pct_change.toFixed(1)}%`}]},
                "mark": {"type": "text", "fontSize": 12, "align": "left", "color": COLORS.mortar, "fontWeight": "bold"},
                "encoding": {
                    "x": {"value": 25},
                    "y": {"value": 100 + i * 12},
                    "text": {"field": "text"}
                }
            }))
        ]
    };

    vegaEmbed('#chart6-scatter', spec, {actions: false})
        .then(result => {
            chartViews.scatter = result.view;
            result.view.addEventListener('click', (event, item) => {
                if (item && item.datum && item.datum.state) {
                    toggleStateSelection(item.datum.state);
                }
            });
        })
        .catch(err => console.error('Error rendering scatter:', err));
}

// ============================================================================
// CHART 7: TRELLIS (Fixed: proper sizing to show all 14 states)
// ============================================================================
function renderTrellis() {
    const spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "data": {"url": "data/combined_state_data.json"},
        "columns": 5,
        "facet": {
            "field": "state_title",
            "type": "nominal",
            "title": null
        },
        "spec": {
            "width": 180,
            "height": 110,
            "mark": {"type": "line", "point": true, "strokeWidth": 1.5, "cursor": "pointer"},
            "encoding": {
                "x": {
                    "field": "year",
                    "type": "quantitative",
                    "axis": {"title": "Year", "format": "d", "tickCount": 5, "labelFontSize": 12},
                    "scale": {"domain": [2003, 2019]}
                },
                "y": {
                    "field": "deaths",
                    "type": "quantitative",
                    "axis": {"title": "Deaths", "tickCount": 5, "labelFontSize": 12},
                    "scale": {"zero": true, "domain": [0, 1200]}
                },
                "color": {
                    "field": "state_title",
                    "type": "nominal",
                    "scale": {
                        "domain": Object.keys(STATE_COLORS),
                        "range": Object.values(STATE_COLORS)
                    },
                    "legend": null
                },
                "opacity": {
                    "condition": selectedState ? {"test": `datum.state_title == '${selectedState}'`, "value": 1} : {"test": "true", "value": 1},
                    "value": 0.3
                },
                "tooltip": [
                    {"field": "state_title", "title": "State"},
                    {"field": "year", "title": "Year"},
                    {"field": "deaths", "title": "Deaths", "format": ","}
                ]
            }
        },
        "resolve": {"scale": {"y": "shared"}}
    };

    vegaEmbed('#chart7-trellis', spec, {actions: false})
        .then(result => {
            chartViews.trellis = result.view;
            result.view.addEventListener('click', (event, item) => {
                if (item && item.datum && item.datum.state_title) {
                    toggleStateSelection(item.datum.state_title);
                }
            });
        })
        .catch(err => console.error('Error rendering trellis:', err));
}

// ============================================================================
// CHART 8: DEVIATION BAR (STATES VS NATIONAL AVERAGE)
// ============================================================================
function renderDeviationBar(year) {
    const filteredData = stateData.filter(d => d.year === year);

    // Calculate national average
    const totalDeaths = filteredData.reduce((sum, d) => sum + d.deaths, 0);
    const totalPop = filteredData.reduce((sum, d) => sum + d.population, 0);
    const nationalRate = (totalDeaths / totalPop) * 100;

    // Calculate deviation for each state
    const deviationData = filteredData.map(d => ({
        state: d.state_title,
        death_rate: d.death_rate,
        national_rate: nationalRate,
        deviation: d.death_rate - nationalRate,
        above_national: d.death_rate > nationalRate
    })).sort((a, b) => b.deviation - a.deviation); // Sort by deviation descending

    const spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "width": 450,
        "height": 450,
        "data": {"values": deviationData},
        "layer": [
            // Zero reference line
            {
                "mark": {"type": "rule", "color": COLORS.mortar, "strokeWidth": 2},
                "encoding": {
                    "x": {"datum": 0}
                }
            },
            // Deviation bars
            {
                "mark": {"type": "bar", "size": 18, "cursor": "pointer"},
                "encoding": {
                    "y": {
                        "field": "state",
                        "type": "nominal",
                        "title": null,
                        "sort": "-x",
                        "axis": {"labelLimit": 150}
                    },
                    "x": {
                        "field": "deviation",
                        "type": "quantitative",
                        "title": "Deviation from National Average",
                        "scale": {"domain": [-15, 15]}
                    },
                    "color": {
                        "condition": {
                            "test": "datum.deviation > 0",
                            "value": COLORS.tenne
                        },
                        "value": COLORS.picton
                    },
                    "opacity": {
                        "condition": selectedState ? {"test": `datum.state == '${selectedState}'`, "value": 1} : {"test": "true", "value": 1},
                        "value": 0.3
                    },
                    "tooltip": [
                        {"field": "state", "title": "State"},
                        {"field": "death_rate", "title": "State Rate", "format": ".1f"},
                        {"field": "national_rate", "title": "National Rate", "format": ".1f"},
                        {"field": "deviation", "title": "Deviation", "format": "+.1f"}
                    ]
                }
            },
            // Annotation: Above average
            {
                "data": {"values": [{"label": "Above National Avg"}]},
                "mark": {"type": "text", "fontSize": 12, "fontWeight": "bold", "color": COLORS.tenne, "align": "right"},
                "encoding": {
                    "x": {"value": 410},
                    "y": {"value": 430},
                    "text": {"field": "label"}
                }
            },
            // Annotation: Below average
            {
                "data": {"values": [{"label": "Below National Avg"}]},
                "mark": {"type": "text", "fontSize": 12, "fontWeight": "bold", "color": COLORS.picton, "align": "left"},
                "encoding": {
                    "x": {"value": 40},
                    "y": {"value": 20},
                    "text": {"field": "label"}
                }
            }
        ]
    };

    vegaEmbed('#chart8-deviation-bar', spec, {actions: false})
        .then(result => {
            chartViews.deviationBar = result.view;
            result.view.addEventListener('click', (event, item) => {
                if (item && item.datum && item.datum.state) {
                    toggleStateSelection(item.datum.state);
                }
            });
        })
        .catch(err => console.error('Error rendering deviation bar:', err));
}

console.log('Dashboard script loaded');
