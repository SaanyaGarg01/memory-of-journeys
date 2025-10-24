# Memory of Journeys

**Memory of Journeys** is an innovative platform that allows users to capture, preserve, and explore their travel experiences in a highly interactive, emotional, and visually immersive way. This project combines journey tracking, AI-powered insights, social sharing, and advanced database features to create a comprehensive travel memory platform.

---

## Table of Contents

1. [Project Overview](#project-overview)  
2. [Features](#features)  
3. [Tech Stack](#tech-stack)  
4. [MariaDB Integration](#mariadb-integration)  
5. [Getting Started](#getting-started)  
6. [Folder Structure](#folder-structure)  
7. [Backend Usage](#backend-usage)  
8. [Frontend Usage](#frontend-usage)  
9. [Future Enhancements](#future-enhancements)  
10. [Contributing](#contributing)  
11. [License](#license)

---

## Project Overview

Memory of Journeys allows users to document and relive their travel experiences in a meaningful way. Users can:

- Create and store journeys with multiple stops.  
- Add dates, keywords, moods, and tags for each journey.  
- Explore journeys on interactive maps with historical weather data.  
- Analyze emotions associated with trips via AI-powered mood insights.  
- Access advanced AI features like Travel DNA, Future Journey Planner, Emotional Maps, and Then & Now comparisons.  
- Maintain a profile with linked journeys, social connections, and personal preferences.  
- Utilize creative and bonus features like voice journaling, postcards, memory temperature tracking, virtual memory gardens, and interactive gallery walls.  
- Create photo albums linked to journeys and export them as PDFs.  
- Exchange journeys and memories with friends safely.

The platform is designed to make creating, exploring, and sharing travel memories effortless, enjoyable, and deeply meaningful.

---

## Features

- **Journey Builder**: Create journeys with multiple legs, destinations, dates, and keywords.  
- **Explore Journey**: Interactive maps, weather insights, and filters to visualize travel experiences.  
- **Profile Management**: Save personal details, profile picture, bio, and view all created journeys.  
- **AI Insights**: Mood analysis, Travel DNA, Future Journey Planner, and emotional mapping.  
- **3D Museum & Then & Now**: Visualize journeys in immersive ways.  
- **Bonus Features**: Voice journaling, virtual memory garden, interactive gallery wall, postcards, memory temperature, friend memory sync.  
- **Photo Album & Social Circles**: Create journey-linked albums, share with friends, and exchange memories.  
- **Dark Mode / Light Mode**: Smooth theme switching for better user experience.  
- **MariaDB Integration**: Reliable backend storage for journeys, users, AI data, and more.  
- **MariaDB Vector Search**: High-performance similarity search for AI insights, mood tracking, and future journey recommendations.

---

## Tech Stack

- **Frontend**: React + TypeScript, Tailwind CSS, Lucide Icons  
- **Backend**: Python (Flask)  
- **Database**: MariaDB (with vector support)  
- **APIs & Libraries**: Open-Meteo (weather), Hugging Face or custom sentiment analysis, custom Travel DNA logic  
- **Deployment**: Vercel (frontend), Railway (backend)  

---

## MariaDB Integration

MariaDB is used as the **primary database** for this project. Its roles include:

- **User Management**: Storing user accounts, profiles, and authentication data.  
- **Journey Storage**: Keeping all journey details including legs, dates, destinations, keywords, AI insights, and weather history.  
- **AI Data Storage**: Storing mood analysis, travel DNA, and other AI-derived insights.  
- **Vector Search**: MariaDB Vector is used to perform **similarity searches** for journeys. This helps with:  
  - Generating **Future Journey Recommendations** based on user patterns.  
  - Matching user moods with journey suggestions.  
  - Quickly retrieving relevant journeys for exploration and social sharing.  

MariaDB ensures **high performance, reliability, and scalability**, making it easier to manage large amounts of structured and vectorized data efficiently.

---

## Getting Started

### Prerequisites

- Node.js >= 18  
- Python >= 3.10  
- MariaDB Server with Vector plugin enabled  

### Backend Setup

1. Clone the repository:

```bash
git clone <repo-url>
cd backend-python
Install Python dependencies:

bash
Copy code
pip install -r requirements.txt
Configure database credentials in config.py or environment variables:

env
Copy code
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=memory_of_journeys
Run the backend:

bash
Copy code
python main.py
Backend will run on http://localhost:5000 (or configured port).

Frontend Setup
Navigate to frontend folder:

bash
Copy code
cd frontend
Install dependencies:

bash
Copy code
npm install
Run the frontend:

bash
Copy code
npm run dev
Frontend will run on http://localhost:5173 (or configured port).

Folder Structure
css
Copy code
backend-python/
├─ main.py
├─ routes/
├─ models/
├─ utils/
frontend/
├─ src/
│  ├─ components/
│  ├─ screens/
│  ├─ lib/
│  ├─ utils/
│  └─ App.tsx
backend-python: Flask API handling CRUD for journeys, AI analysis, and MariaDB integration.

frontend/src: React app for journey creation, exploration, profiles, and AI insights.

Backend Usage
Run backend with python main.py.

Routes include:

POST /journeys – create a journey

GET /journeys – fetch all journeys

POST /users – create or update user profiles

Additional routes for AI insights, mood analysis, and weather history

All journey data is stored in MariaDB, including structured journey information and AI vector embeddings for similarity searches.

Frontend Usage
Journey Builder: Fill out journey details, select destinations, dates, and keywords.

Explore Journey: View interactive maps, weather history, mood insights, and filters.

Profile Section: Upload profile picture, bio, and view all created journeys.

AI Features: Explore Travel DNA, emotional map, future journey planner, then & now, 3D museum.

Photo Album & Social Circles: Save journeys to albums, share with friends, and exchange memories.

Future Enhancements
Real-time collaboration for shared journeys

Voice command journey creation

Integration with more AI-powered travel insights

Mobile app version

Contributing
Contributions are welcome! Please fork the repo and submit a PR. Make sure to follow the existing code style and structure.

License
This project is licensed under the MIT License.

