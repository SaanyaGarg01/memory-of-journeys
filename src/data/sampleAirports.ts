export const sampleAirports = [
  { id: 1, iata: 'DEL', city: 'New Delhi', country: 'India', name: 'Indira Gandhi International Airport', latitude: 28.5562, longitude: 77.1000 },
  { id: 2, iata: 'BKK', city: 'Bangkok', country: 'Thailand', name: 'Suvarnabhumi Airport', latitude: 13.6900, longitude: 100.7501 },
  { id: 3, iata: 'DPS', city: 'Bali', country: 'Indonesia', name: 'Ngurah Rai International Airport', latitude: -8.7467, longitude: 115.1667 },
  { id: 4, iata: 'JFK', city: 'New York', country: 'United States', name: 'John F. Kennedy International Airport', latitude: 40.6413, longitude: -73.7781 },
  { id: 5, iata: 'LHR', city: 'London', country: 'United Kingdom', name: 'Heathrow Airport', latitude: 51.4700, longitude: -0.4543 },
  { id: 6, iata: 'CDG', city: 'Paris', country: 'France', name: 'Charles de Gaulle Airport', latitude: 49.0097, longitude: 2.5479 },
  { id: 7, iata: 'NRT', city: 'Tokyo', country: 'Japan', name: 'Narita International Airport', latitude: 35.7720, longitude: 140.3929 },
  { id: 8, iata: 'SYD', city: 'Sydney', country: 'Australia', name: 'Sydney Kingsford Smith Airport', latitude: -33.9399, longitude: 151.1753 },
  { id: 9, iata: 'DXB', city: 'Dubai', country: 'United Arab Emirates', name: 'Dubai International Airport', latitude: 25.2532, longitude: 55.3657 },
  { id: 10, iata: 'SIN', city: 'Singapore', country: 'Singapore', name: 'Singapore Changi Airport', latitude: 1.3644, longitude: 103.9915 },
  { id: 11, iata: 'HKG', city: 'Hong Kong', country: 'Hong Kong', name: 'Hong Kong International Airport', latitude: 22.3080, longitude: 113.9185 },
  { id: 12, iata: 'ICN', city: 'Seoul', country: 'South Korea', name: 'Incheon International Airport', latitude: 37.4602, longitude: 126.4407 },
  { id: 13, iata: 'BCN', city: 'Barcelona', country: 'Spain', name: 'Barcelona-El Prat Airport', latitude: 41.2974, longitude: 2.0833 },
  { id: 14, iata: 'FCO', city: 'Rome', country: 'Italy', name: 'Leonardo da Vinci-Fiumicino Airport', latitude: 41.8003, longitude: 12.2389 },
  { id: 15, iata: 'AMS', city: 'Amsterdam', country: 'Netherlands', name: 'Amsterdam Airport Schiphol', latitude: 52.3105, longitude: 4.7683 },
  { id: 16, iata: 'FRA', city: 'Frankfurt', country: 'Germany', name: 'Frankfurt Airport', latitude: 50.0379, longitude: 8.5622 },
  { id: 17, iata: 'LAX', city: 'Los Angeles', country: 'United States', name: 'Los Angeles International Airport', latitude: 33.9416, longitude: -118.4085 },
  { id: 18, iata: 'SFO', city: 'San Francisco', country: 'United States', name: 'San Francisco International Airport', latitude: 37.6213, longitude: -122.3790 },
  { id: 19, iata: 'YYZ', city: 'Toronto', country: 'Canada', name: 'Toronto Pearson International Airport', latitude: 43.6777, longitude: -79.6248 },
  { id: 20, iata: 'MEX', city: 'Mexico City', country: 'Mexico', name: 'Mexico City International Airport', latitude: 19.4363, longitude: -99.0721 },
  { id: 21, iata: 'GRU', city: 'São Paulo', country: 'Brazil', name: 'São Paulo/Guarulhos International Airport', latitude: -23.4356, longitude: -46.4731 },
  { id: 22, iata: 'EZE', city: 'Buenos Aires', country: 'Argentina', name: 'Ministro Pistarini International Airport', latitude: -34.8222, longitude: -58.5358 },
  { id: 23, iata: 'CAI', city: 'Cairo', country: 'Egypt', name: 'Cairo International Airport', latitude: 30.1219, longitude: 31.4056 },
  { id: 24, iata: 'JNB', city: 'Johannesburg', country: 'South Africa', name: 'O. R. Tambo International Airport', latitude: -26.1392, longitude: 28.2460 },
  { id: 25, iata: 'IST', city: 'Istanbul', country: 'Turkey', name: 'Istanbul Airport', latitude: 41.2753, longitude: 28.7519 },
];

export const culturalInsights: Record<string, any> = {
  'New Delhi': {
    highlights: ['Red Fort', 'India Gate', 'Qutub Minar', 'Lotus Temple'],
    cuisine: ['Butter Chicken', 'Chole Bhature', 'Kebabs', 'Street Chaat'],
    culture: 'Ancient city with 5000 years of history, blending Mughal architecture with modern India',
    bestTime: 'October to March',
    tip: 'Try the street food in Old Delhi, but ensure vendors maintain hygiene'
  },
  'Bangkok': {
    highlights: ['Grand Palace', 'Wat Pho', 'Floating Markets', 'Khao San Road'],
    cuisine: ['Pad Thai', 'Tom Yum Goong', 'Som Tam', 'Mango Sticky Rice'],
    culture: 'Vibrant mix of ancient temples and modern skyscrapers, known for street food and nightlife',
    bestTime: 'November to February',
    tip: 'Always dress modestly when visiting temples'
  },
  'Bali': {
    highlights: ['Uluwatu Temple', 'Tegalalang Rice Terraces', 'Sacred Monkey Forest', 'Beach Clubs'],
    cuisine: ['Nasi Goreng', 'Satay', 'Babi Guling', 'Lawar'],
    culture: 'Island of Gods with Hindu temples, traditional dance, and stunning natural beauty',
    bestTime: 'April to October',
    tip: 'Rent a scooter to explore hidden beaches and waterfalls'
  },
  'Tokyo': {
    highlights: ['Senso-ji Temple', 'Shibuya Crossing', 'Tokyo Skytree', 'Tsukiji Market'],
    cuisine: ['Sushi', 'Ramen', 'Tempura', 'Okonomiyaki'],
    culture: 'Ultra-modern metropolis harmonizing with traditional Japanese culture and zen gardens',
    bestTime: 'March to May, September to November',
    tip: 'Get a JR Pass for unlimited train travel'
  },
  'Paris': {
    highlights: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame', 'Montmartre'],
    cuisine: ['Croissants', 'Coq au Vin', 'Macarons', 'Escargots'],
    culture: 'City of Light renowned for art, fashion, gastronomy, and romance',
    bestTime: 'April to June, September to October',
    tip: 'Visit museums early morning to avoid crowds'
  },
  'London': {
    highlights: ['Big Ben', 'British Museum', 'Tower of London', 'Buckingham Palace'],
    cuisine: ['Fish and Chips', 'Sunday Roast', 'Afternoon Tea', 'Curry'],
    culture: 'Historic capital blending royal heritage with multicultural dynamism',
    bestTime: 'May to September',
    tip: 'Use an Oyster card for cheaper public transport'
  },
  'Dubai': {
    highlights: ['Burj Khalifa', 'Dubai Mall', 'Palm Jumeirah', 'Gold Souk'],
    cuisine: ['Shawarma', 'Hummus', 'Al Harees', 'Arabic Coffee'],
    culture: 'Futuristic city rising from desert, known for luxury and innovation',
    bestTime: 'November to March',
    tip: 'Dress conservatively in public areas outside resorts'
  },
  'Singapore': {
    highlights: ['Marina Bay Sands', 'Gardens by the Bay', 'Sentosa Island', 'Hawker Centers'],
    cuisine: ['Chili Crab', 'Laksa', 'Hainanese Chicken Rice', 'Satay'],
    culture: 'Garden city-state with perfect blend of Chinese, Malay, Indian, and Western cultures',
    bestTime: 'February to April',
    tip: 'Try hawker centers for authentic local food at great prices'
  },
  'Rome': {
    highlights: ['Colosseum', 'Vatican City', 'Trevi Fountain', 'Pantheon'],
    cuisine: ['Carbonara', 'Cacio e Pepe', 'Supplì', 'Gelato'],
    culture: 'Eternal City with 3000 years of history, art, and architectural masterpieces',
    bestTime: 'April to June, September to October',
    tip: 'Book Colosseum and Vatican tickets online to skip lines'
  },
  'Barcelona': {
    highlights: ['Sagrada Familia', 'Park Güell', 'La Rambla', 'Gothic Quarter'],
    cuisine: ['Paella', 'Tapas', 'Crema Catalana', 'Pan con Tomate'],
    culture: 'Catalan capital famous for Gaudí architecture and Mediterranean lifestyle',
    bestTime: 'May to June, September to October',
    tip: 'Enjoy late dinners like locals (9-10 PM)'
  }
};
