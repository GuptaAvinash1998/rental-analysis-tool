import React from 'react';
import { useState } from 'react';
import {Select, SelectItem} from '@tremor/react';

const ListingFeatureDropdown = ({features, featureName, onChange}) =>
{
    const [value, setValue] = useState('')

    const handleValueChange = (newValue) =>
    {
        setValue(newValue)
        onChange(newValue)
    }

    return (
    <div className="mx-auto max-w-xs">
      <Select defaultValue={value} onValueChange={handleValueChange} placeholder={featureName}>
        {
            features.map((feature, index) =>
            (
                 <SelectItem key={index} value={feature}>{feature}</SelectItem>
            ))
        }
      </Select>
    </div>
  );
}

export default ListingFeatureDropdown;