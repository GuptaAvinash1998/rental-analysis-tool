const express = require('express');
const cors = require("cors")
const {RedshiftDataClient, ExecuteStatementCommand, GetStatementResultCommand, DescribeStatementCommand} = require('@aws-sdk/client-redshift-data');

const app = express();
app.use(express.json());
app.use(cors());

const allData = [];
let filteredAllData = [];

const awsRedshiftClient = new RedshiftDataClient({
    region: "us-east-1"
});

async function pollStatementStatus(exeStatementResult)
{
    let status;

    do
    {
        const getStatusCommand = new DescribeStatementCommand(
            {
                Id: exeStatementResult.Id
            }
        );

        const statusResult = await awsRedshiftClient.send(getStatusCommand);

        status = statusResult.Status;

        if(status != 'FINISHED' && status != 'FAILED')
        {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }while(status != 'FINISHED' && status != 'FAILED');

    return status;
}

async function getRedshiftData(sqlStatement)
{
    const execStatementCommand = new ExecuteStatementCommand(
        {
            WorkgroupName: 'default-workgroup',
            Database: 'dev',
            
            Sql: sqlStatement
        }
    );

    const exeStatementResult = await awsRedshiftClient.send(execStatementCommand);

    await pollStatementStatus(exeStatementResult);

    const getStatementResultsCommand = new GetStatementResultCommand(
        {
            Id: exeStatementResult.Id
        }
    );

    const getStatementResults = await awsRedshiftClient.send(getStatementResultsCommand);

    return getStatementResults;
}

async function getAllData()
{
    try
    {
        let sqlStatement = 'SELECT DISTINCT * FROM zillowdata;'

        const queryResults = await getRedshiftData(sqlStatement);

        console.log(`Number of returned records: ${queryResults.TotalNumRows}`);

        if(queryResults.Records)
        {
            queryResults.Records.forEach((record) =>
            {
                const returnData = {};

                record.forEach((value, index) =>
                {
                    const columnName = queryResults.ColumnMetadata[index].name
                    returnData[columnName] = value.stringValue 
                    || value.doubleValue || value.longValue || value.booleanValue;
                });

                allData.push(returnData);
            });
        }
    }
    catch(error)
    {
        console.log(error);
    }
}

app.get("/api/getMarketSummary", async (req, res) =>
{
    try
    {
        const {locationFilter, bedroomFilter, homeTypeFilter} = req.query;
        
        filteredAllData = allData.filter(item =>
        {
            let cityPass = false
            let zipPass = false
            let bedroomPass = true
            let homeTypePass = true;

            if(locationFilter)
            {
                //if the location contains only text, this means the user entered a city
                if(/^\D*$/.test(locationFilter))
                {
                    cityPass = item.city === locationFilter;
                    
                }
                //if the location contains only numbers, this means the user entered a zip code
                else if(/^\d+$/.test(locationFilter))
                {
                    zipPass = item.zipcode === Number(locationFilter);
                }
                else
                {
                    return false;
                }
            }
            
            //check bedroom filter
            if(bedroomFilter !== '')
            {
                bedroomPass = Number(item.bedrooms) === Number(bedroomFilter);
            }

            if(homeTypeFilter !== '')
            {
                homeTypePass = item.hometype === homeTypeFilter.toUpperCase();
            }

            return (cityPass || zipPass) && bedroomPass && homeTypePass;
        })

        //get market summary from filtered data
        marketSummaryData = {}

        if(filteredAllData.length > 0)
        {
            marketSummaryData.medianRent = Number(filteredAllData[Math.floor(filteredAllData.length / 2)].price);
            marketSummaryData.numListings = filteredAllData.length;

            let rentTotal = 0;
            let sizeTotal = 0;

            let rentMissing = 0;
            let sizeMissing = 0;

            for(let i=0; i<filteredAllData.length; i++)
            {
                if(Number.isNaN(Number(filteredAllData[i].price)))
                {
                    rentMissing += 1;
                }
                else
                {
                    rentTotal += Number(filteredAllData[i].price);
                }

                if(Number.isNaN(Number(filteredAllData[i].livingarea)))
                {
                    sizeMissing += 1;
                }
                else
                {
                    sizeTotal += Number(filteredAllData[i].livingarea);
                }
            }

            rentTotal = rentTotal / (filteredAllData.length - rentMissing);

            marketSummaryData.avgRent = Number(rentTotal.toFixed(2));

            sizeTotal = sizeTotal / (filteredAllData.length - sizeMissing);

            marketSummaryData.avgSize = Number(sizeTotal.toFixed(2));
        }

        res.status(200).send(marketSummaryData);
    }
    catch(error)
    {
        console.log(error);
        res.status(500).send({error: "Internal server error"});
    }
});

app.get("/api/getBarGraphData", async (req, res) =>
{
    try
    {
        // Initialize an empty object to store the chart data
        const chartData = {};

        // Iterate over the filtered data
        allData.forEach(item => {
            // Extract homeType and bedrooms from each item
            const homeType = item.hometype;
            const bedrooms = Number(item.bedrooms);
            const price = Number(item.price);

            // Check if the homeType already exists in chartData
            if (!chartData[homeType]) {
                // If not, initialize it with an object containing all possible bedrooms with initial value 0
                chartData[homeType] = { '1 bedroom': 0, '2 bedroom': 0, '3 bedroom': 0, '4 bedroom': 0, '5 bedroom': 0, '6 bedroom': 0, '7 bedroom': 0};
            }

            // Add the price to the existing bedroom price
            chartData[homeType][`${bedrooms} bedroom`] += price;
        });

        // Calculate the average price for each homeType and bedroom combination
        Object.entries(chartData).forEach(([homeType, bedrooms]) => {
            // Calculate the total price and count of listings for the homeType
            const totalPrice = Object.values(bedrooms).reduce((acc, cur) => acc + cur, 0);
            const totalCount = Object.values(bedrooms).filter(price => price > 0).length;

            // Calculate the average price for each bedroom option
            Object.entries(bedrooms).forEach(([bedroom, price]) => {
                chartData[homeType][bedroom] = Math.round(price / totalCount); // Calculate the average price
            });
        });

        // Convert chartData object into an array of objects
        const result = Object.entries(chartData).map(([name, bedrooms]) => ({
            name,
            ...bedrooms
        }));

        res.status(200).send(result);
    }
    catch(error)
    {
        console.log(error);
        res.status(500).send({error: "Internal server error"});
    }

});

app.listen(8000, async () =>
{
    await getAllData();
    console.log('Express server listening on port 8000')
});