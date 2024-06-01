import React from 'react';

const CardItem = ({children}) => {
  return (
    <div className='flex flex-col items-center'>
      {children}
    </div>
  );
}

export default CardItem;