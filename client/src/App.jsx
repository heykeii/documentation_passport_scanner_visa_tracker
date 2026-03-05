import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import SmartScan from './pages/dashboard/SmartScan';
import Management from './pages/dashboard/Management';
import PassengerRecords from './pages/dashboard/PassengerRecords';
import Settings from './pages/dashboard/Settings';

const App = () => {
    return (
        <UserProvider>
            <Routes>
                {/* Auth */}
                <Route path='/'                element={<Login />} />
                <Route path='/forgot-password' element={<ForgotPassword />} />
                <Route path='/reset-password'  element={<ResetPassword />} />
                <Route path='/verify-email'    element={<VerifyEmail />} />

                {/* Dashboard — nested routes */}
                <Route path='/dashboard' element={<DashboardLayout />}>
                    <Route index                element={<DashboardHome />} />
                    <Route path='scan'          element={<SmartScan />} />
                    <Route path='management'    element={<Management />} />
                    <Route path='records'       element={<PassengerRecords />} />
                    <Route path='settings'      element={<Settings />} />
                </Route>
            </Routes>
        </UserProvider>
    );
};

export default App;
