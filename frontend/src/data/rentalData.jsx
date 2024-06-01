import sampleRentalData from './sampleData.json'

class RentalDataManager
{
    #currentBedroomSelection = ""

    #currentHomeTypeSelection = ""

    #currentEnteredLocation = "McLean"

    #emptyDataset = [{
        "bathrooms": 0,
        "bedrooms": 0,
        "city": "",
        "homeType": "",
        "livingArea": 0,
        "price": 0,
        "zipcode": "",
    }]

    #marketSummaryData = {"avgRent": 0,
    "avgSize": 0,
    "medianRent": 0,
    "numListings": 0
    };

    #filteredDataset = {}

    constructor()
    {
        this.#filteredDataset = JSON.parse(JSON.stringify(sampleRentalData.results));
    }

    getHouseOneData()
    {
        return this.#filteredDataset[0];
    }

    getMarketSummaryData()
    {
        return this.#marketSummaryData;
    }

    getAllData()
    {
        return this.#filteredDataset;
    }

    getNumberOfBedrooms()
    {
        const bedroomValues = ['1', '2', '3', '4', '5', '6', '7'];

        return bedroomValues;
    }

    getHomeTypes()
    {
        const homeTypeValues = ['APARTMENT', 'SINGLE_FAMILY', 'TOWNHOUSE'];

        return homeTypeValues;
    }

    async setCurrentBedrooms(bedroomSelection)
    {
        this.#currentBedroomSelection = bedroomSelection

        await this.#updateMarketSummaryData();

        return this.#marketSummaryData;
    }

    async setCurrentHomeType(homeTypeSelection)
    {
        this.#currentHomeTypeSelection = homeTypeSelection

        await this.#updateMarketSummaryData();

        return this.#marketSummaryData;
    }

    async setEnteredLocation(enteredLocation)
    {
        this.#currentEnteredLocation = enteredLocation

        await this.#updateMarketSummaryData();

        return this.#marketSummaryData;
    }

    async getUpdatedBarChartData()
    {
        try
        {
            const url = `http://localhost:8000/api/getBarGraphData`;
        
            const res = await fetch(url, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
        
            let data = await res.json();

            console.log(data);

            return data;

        }
        catch (error)
        {
            console.log(error);
        }          
    }

    async #updateMarketSummaryData()
    {
        try {
            const locationFilter = this.#currentEnteredLocation;
            const bedroomFilter = this.#currentBedroomSelection;
            const homeTypeFilter = this.#currentHomeTypeSelection;
        
            const url = `http://localhost:8000/api/getMarketSummary?locationFilter=${encodeURIComponent(locationFilter)}&bedroomFilter=${encodeURIComponent(bedroomFilter)}&homeTypeFilter=${encodeURIComponent(homeTypeFilter)}`;
        
            const res = await fetch(url, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
        
            let data = await res.json();

            if(Object.keys(data).length === 0)
            {
                this.#marketSummaryData = {"avgRent": 0,
                "avgSize": 0,
                "medianRent": 0,
                "numListings": 0
                };
            }
            else
            {
                this.#marketSummaryData = data;   
            }
        } catch (error) {
            console.log(error);
        }
    }
}

export default RentalDataManager
