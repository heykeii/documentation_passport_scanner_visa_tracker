import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../src/components/ui/card'
import { Button } from '../src/components/ui/button'
import { Badge } from '../src/components/ui/badge'
import { Separator } from '../src/components/ui/separator'
import Navbar from '../component/Navbar'

const Destinations = () => {
  const destinations = [
    {
      id: 1,
      title: 'Santorini',
      country: 'Greece',
      description: 'Whitewashed buildings perched on volcanic cliffs overlooking the Aegean Sea',
      image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
      price: '$2,499',
      duration: '7 Days',
      rating: '4.9'
    },
    {
      id: 2,
      title: 'Bali',
      country: 'Indonesia',
      description: 'Tropical paradise with ancient temples, lush rice terraces, and pristine beaches',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
      price: '$1,899',
      duration: '10 Days',
      rating: '4.8'
    },
    {
      id: 3,
      title: 'Maldives',
      country: 'Indian Ocean',
      description: 'Crystal-clear turquoise waters and overwater bungalows in paradise',
      image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800',
      price: '$3,299',
      duration: '5 Days',
      rating: '5.0'
    },
    {
      id: 4,
      title: 'Swiss Alps',
      country: 'Switzerland',
      description: 'Majestic mountain peaks, pristine lakes, and charming alpine villages',
      image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800',
      price: '$2,799',
      duration: '8 Days',
      rating: '4.9'
    },
    {
      id: 5,
      title: 'Kyoto',
      country: 'Japan',
      description: 'Ancient temples, traditional gardens, and timeless Japanese culture',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
      price: '$2,199',
      duration: '6 Days',
      rating: '4.9'
    },
    {
      id: 6,
      title: 'Amalfi Coast',
      country: 'Italy',
      description: 'Dramatic coastline with colorful villages cascading down to the Mediterranean',
      image: 'https://images.unsplash.com/photo-1534113414509-0bd4d27f0db0?w=800',
      price: '$2,599',
      duration: '7 Days',
      rating: '4.8'
    }
  ]

  return (
    <div className='min-h-screen bg-gradient-to-b from-orange-50 to-white'>
      <Navbar />
      <div className='relative h-[70vh] overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-r from-orange-900/60 to-orange-800/30 z-10'></div>
        <img 
          src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600' 
          alt='Hero' 
          className='w-full h-full object-cover'
        />
        <div className='absolute inset-0 z-20 flex flex-col justify-center items-center text-white px-6'>
          <h1 className='text-6xl md:text-8xl font-light tracking-wider mb-6'>Destinations</h1>
          <p className='text-xl md:text-2xl font-light max-w-2xl text-center opacity-90'>Discover the world's most breathtaking places</p>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-6 py-20'>
        <div className='text-center mb-16'>
          <h2 className='text-4xl md:text-5xl font-light text-gray-900 mb-4'>Curated Experiences</h2>
          <p className='text-gray-600 text-lg max-w-2xl mx-auto'>Handpicked destinations that promise unforgettable memories</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {destinations.map((dest) => (
            <Card key={dest.id} className='group overflow-hidden border-orange-100 shadow-lg hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500'>
              <div className='relative overflow-hidden h-64'>
                <img 
                  src={dest.image} 
                  alt={dest.title}
                  className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-110'
                />
                <Badge className='absolute top-4 right-4 bg-orange-500 text-white hover:bg-orange-600'>
                  ⭐ {dest.rating}
                </Badge>
              </div>
              <CardHeader>
                <div className='flex justify-between items-start'>
                  <CardTitle className='text-2xl font-light'>{dest.title}</CardTitle>
                  <Badge variant='outline' className='font-light border-orange-200 text-orange-700'>{dest.country}</Badge>
                </div>
                <CardDescription className='text-base font-light leading-relaxed'>
                  {dest.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Separator className='mb-4 bg-orange-100' />
                <div className='flex justify-between items-center'>
                  <div>
                    <p className='text-sm text-gray-500 font-light'>Duration</p>
                    <p className='text-lg font-medium text-orange-600'>{dest.duration}</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm text-gray-500 font-light'>From</p>
                    <p className='text-2xl font-light text-orange-600'>{dest.price}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className='w-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg hover:shadow-orange-500/30' size='lg'>Book Now</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <div className='bg-gradient-to-r from-orange-600 to-orange-500 text-white py-20'>
        <div className='max-w-4xl mx-auto text-center px-6'>
          <h2 className='text-4xl md:text-5xl font-light mb-6'>Ready for Your Next Adventure?</h2>
          <p className='text-orange-50 text-lg mb-8 font-light'>Let us craft your perfect journey</p>
          <Button size='lg' variant='secondary' className='rounded-full px-10 text-lg bg-white text-orange-600 hover:bg-orange-50'>Start Planning</Button>
        </div>
      </div>
    </div>
  )
}

export default Destinations
