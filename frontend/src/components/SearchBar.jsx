import React from 'react';
import { useState } from 'react';
import { RiSearchLine } from '@remixicon/react';
import { TextInput } from '@tremor/react';

const SearchBar = ({onChange}) =>
{
  const [value, setValue] = useState('')

  const handleValueChange = (event) =>
  {
    if(event.key === 'Enter')
    {
      onChange(value);
    }
  }

  return (
    <div className="mb-4 mx-auto max-w-auto min-w-96">
      <div>
        <TextInput icon={RiSearchLine} placeholder="Enter a city or zipcode..." 
        onValueChange = {(newValue) => {setValue(newValue)}} 
        onKeyDown={handleValueChange}/>
      </div>
    </div>
  );
}

export default SearchBar;
