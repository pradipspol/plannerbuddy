// Uncomment this line to use CSS modules
// import styles from './app.module.scss';
// import Login from '../components/login/login';
// import NxWelcome from './nx-welcome';
// import { Route, Routes } from 'react-router-dom';


// export function App() {
//   return (

//     <Routes>
//       <Route path="/" element={<Home />}></Route>
//       <Route path="/NxWelcome" element={<NxWelcome title="planner-buddy-ui" />}></Route>
//       <Route path="/login" element={<Login />}></Route>
//     </Routes>

//   );
// }

// export default App;

import React, { useState } from 'react';
import { Route, Routes, BrowserRouter } from 'react-router-dom';
import Login from './login';
import Home from './home';
import PrivateRoute from './PrivateRoute';
import NxWelcome from './nx-welcome';
import { AuthProvider } from './authContext';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute component={Home} />} />
        <Route path="/home" element={<PrivateRoute component={Home} />} />
        <Route path="/start" element={<PrivateRoute component={NxWelcome} />} />
      </Routes>
    </AuthProvider>

  );
};

export default App;



