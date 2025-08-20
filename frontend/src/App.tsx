import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { Header } from '@/components/organisms/Header/Header';
import { HomePage } from '@/pages/HomePage/HomePage';
import '@/styles/globals.css';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              {/* Add more routes as we build them */}
            </Routes>
          </main>
        </div>
      </Router>
    </Provider>
  );
}

export default App;