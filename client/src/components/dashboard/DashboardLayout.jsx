import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const DashboardLayout = () => {
    const navigate = useNavigate();
    const { user } = useUser();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    return (
        <div className="flex h-screen overflow-hidden font-[Outfit] bg-[#f4f6f9] dark:bg-[#091428]">
            <Sidebar user={user} />
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <Topbar user={user} />
                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                    <main className="p-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
