import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const DashboardLayout = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/', { replace: true });
            return;
        }
        try {
            const stored = localStorage.getItem('user');
            if (stored) setUser(JSON.parse(stored));
        } catch {
            // ignore
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
