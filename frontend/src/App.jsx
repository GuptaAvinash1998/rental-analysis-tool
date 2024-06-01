import './App.css'
import { Card, Metric, Text } from '@tremor/react';
import RentalDataManager from './data/rentalData';
import SearchBar from './components/SearchBar';
import CardItem from './components/CardItem';
import ListingFeatureDropdown from './components/ListingFeatureDropdown';
import { useState, useEffect } from 'react';

const rentalData = new RentalDataManager();

function App()
{
  //state of the bedroom selection
  const [selectedBedroom, setSelectedBedroom] = useState('')

  //state of the location selection. The default is McLean
  const [enteredLocation, setEnteredLocation] = useState('McLean')
  const [selectedHomeType, setSelectedHomeType] = useState('')
  const [marketSummaryData, setMarketSummaryData] = useState({})

  useEffect(() => {
    rentalData.setEnteredLocation(enteredLocation)
        .then(updatedMarketSummaryData => {
            setMarketSummaryData(updatedMarketSummaryData);
        })
        .catch(error => {
            console.error(error);
        });

    rentalData.setCurrentBedrooms(selectedBedroom)
        .then(updatedMarketSummaryData => {
            setMarketSummaryData(updatedMarketSummaryData);
        })
        .catch(error => {
            console.error(error);
        });
    
    rentalData.setCurrentHomeType(selectedHomeType)
        .then(updatedMarketSummaryData => {
            setMarketSummaryData(updatedMarketSummaryData);
        })
        .catch(error => {
            console.error(error);
        });
  }, [enteredLocation, selectedBedroom, selectedHomeType]);

  const handleBedroomChange = (selectedValue) =>
  {
    setSelectedBedroom(selectedValue);
  }

  const handleEnteredLocationChange = (updatedLocation) =>
  {
    setEnteredLocation(updatedLocation);
  }

  const handleHomeTypeChange = (selectedValue) =>
  {
    setSelectedHomeType(selectedValue)
  }

  return (
    <div className='flex flex-col items-center px-10'>
        <header className="py-4 px-8 flex justify-between items-center">
          <h1 className="text-4xl font-bold mb-1">Rental Analysis Tool</h1>
        </header>
        
        <div className='grid grid-cols-2 gap-6'>
          <SearchBar onChange={handleEnteredLocationChange}/>
          <div className='grid grid-cols-3 gap-1'>
            <ListingFeatureDropdown features={rentalData.getNumberOfBedrooms()} onChange={handleBedroomChange} 
            featureName={'Bedrooms'}/>
            <ListingFeatureDropdown features={rentalData.getHomeTypes()} onChange={handleHomeTypeChange} 
            featureName={'Home Types'}/>
          </div>
        </div>

          <div>
            <Card className="max-w-full mx-auto mb-6" decoration="top" decorationColor="indigo">
              <h2 className="text-2xl font-bold mb-6">Rental Market Summary for {enteredLocation}</h2>
              <div className='flex flex-row gap-32 flex-wrap'>
                <CardItem>
                  <Text>Average Rent</Text>
                  <Metric>{`$ ${marketSummaryData.avgRent}`}</Metric>
                </CardItem>
                <CardItem>
                  <Text>Median Rent</Text>
                  <Metric>{`$ ${marketSummaryData.medianRent}`}</Metric>
                </CardItem>
                <CardItem>
                  <Text>Average Size</Text>
                  <Metric>{`${marketSummaryData.avgSize} Sq Ft`}</Metric>
                </CardItem>
                <CardItem>
                  <Text>Number of listings in this area</Text>
                  <Metric>{`${marketSummaryData.numListings}`}</Metric>
                </CardItem>
              </div>
            </Card>
          </div>
    </div>
  )
}

export default App
