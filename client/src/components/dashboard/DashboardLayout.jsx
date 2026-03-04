import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { ScrollArea } from '@/components/ui/scroll-area';

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
                <ScrollArea className="flex-1">
                    <main className="p-6">
                        <Outlet />
                    </main>
                </ScrollArea>
            </div>
        </div>
    );
};

export default DashboardLayout;
